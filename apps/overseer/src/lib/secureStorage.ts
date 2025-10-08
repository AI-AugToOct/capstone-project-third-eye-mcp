const STORAGE_PREFIX = 'third-eye-secure-';
const SESSION_KEY = `${STORAGE_PREFIX}session-key`;

function getEncryptionKey(): string {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;

  const newKey = crypto.randomUUID() + crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, newKey);
  return newKey;
}

async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('third-eye-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(text: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await deriveKey(getEncryptionKey());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decrypt(ciphertext: string): Promise<string> {
  try {
    const key = await deriveKey(getEncryptionKey());
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  const encrypted = await encrypt(value);
  sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, encrypted);
}

export async function getSecureItem(key: string): Promise<string | null> {
  const encrypted = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
  if (!encrypted) return null;
  return decrypt(encrypted);
}

export function removeSecureItem(key: string): void {
  sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}

export function clearSecureStorage(): void {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
}
