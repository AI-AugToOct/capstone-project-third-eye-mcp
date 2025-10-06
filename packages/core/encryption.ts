import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';
import { getConfig } from '@third-eye/config';

/**
 * Encryption Utility for Provider Keys
 *
 * Provides secure encryption/decryption of API keys using AES-256-GCM
 * with PBKDF2 key derivation for enhanced security
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_ITERATIONS = 100000; // PBKDF2 iterations

export interface EncryptedData {
  encrypted: Buffer;
  iv: Buffer;
  salt: Buffer;
  tag: Buffer;
}

/**
 * Generate or get encryption key from config
 */
function getEncryptionKey(): string {
  const config = getConfig();

  if (config.security.encryptionKey) {
    return config.security.encryptionKey;
  }

  // Generate a secure random key if none exists
  // In production, this should be provided via environment variable
  const key = randomBytes(32).toString('hex');

  console.warn('⚠️  No encryption key configured. Generated temporary key.');
  console.warn('🔐 Set THIRD_EYE_SECURITY_ENCRYPTION_KEY environment variable for production.');

  return key;
}

/**
 * Derive encryption key from master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return pbkdf2Sync(masterKey, salt, KEY_ITERATIONS, 32, 'sha256');
}

/**
 * Encrypt sensitive data (API keys, tokens, etc.)
 */
export function encrypt(plaintext: string): EncryptedData {
  try {
    const masterKey = getEncryptionKey();
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Derive key from master key + salt
    const key = deriveKey(masterKey, salt);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get authentication tag
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv,
      salt,
      tag
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(data: EncryptedData): string {
  try {
    const masterKey = getEncryptionKey();

    // Derive key from master key + salt
    const key = deriveKey(masterKey, data.salt);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, data.iv);
    decipher.setAuthTag(data.tag);

    // Decrypt
    let decrypted = decipher.update(data.encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Serialize encrypted data to single buffer for database storage
 */
export function serializeEncrypted(data: EncryptedData): Buffer {
  // Format: [salt:32][iv:12][tag:16][encrypted:remaining]
  return Buffer.concat([
    data.salt,
    data.iv,
    data.tag,
    data.encrypted
  ]);
}

/**
 * Deserialize encrypted data from database buffer
 */
export function deserializeEncrypted(buffer: Buffer): EncryptedData {
  if (buffer.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid encrypted data: buffer too short');
  }

  let offset = 0;

  const salt = buffer.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;

  const iv = buffer.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;

  const tag = buffer.subarray(offset, offset + TAG_LENGTH);
  offset += TAG_LENGTH;

  const encrypted = buffer.subarray(offset);

  return { salt, iv, tag, encrypted };
}

/**
 * Encrypt string and return serialized buffer for database storage
 */
export function encryptForStorage(plaintext: string): Buffer {
  const encrypted = encrypt(plaintext);
  return serializeEncrypted(encrypted);
}

/**
 * Decrypt from database buffer to string
 */
export function decryptFromStorage(buffer: Buffer): string {
  const encryptedData = deserializeEncrypted(buffer);
  return decrypt(encryptedData);
}

/**
 * Test encryption/decryption roundtrip
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-api-key-12345';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    if (testData !== decrypted) {
      throw new Error('Roundtrip test failed: data mismatch');
    }

    // Test serialization roundtrip
    const serialized = serializeEncrypted(encrypted);
    const deserialized = deserializeEncrypted(serialized);
    const decrypted2 = decrypt(deserialized);

    if (testData !== decrypted2) {
      throw new Error('Serialization roundtrip test failed: data mismatch');
    }

    console.log('✅ Encryption system test passed');
    return true;
  } catch (error) {
    console.error('❌ Encryption system test failed:', error);
    return false;
  }
}

/**
 * Utility to safely validate encryption key strength
 */
export function validateEncryptionKey(key: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (key.length < 32) {
    issues.push('Key too short (minimum 32 characters)');
  }

  if (key.length < 64) {
    issues.push('Key should be at least 64 characters for optimal security');
  }

  if (!/[A-Za-z]/.test(key)) {
    issues.push('Key should contain letters');
  }

  if (!/[0-9]/.test(key)) {
    issues.push('Key should contain numbers');
  }

  // Check for common weak patterns
  if (/^(.)\1+$/.test(key)) {
    issues.push('Key should not be repetitive');
  }

  if (key === key.toLowerCase() || key === key.toUpperCase()) {
    issues.push('Key should contain mixed case');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}