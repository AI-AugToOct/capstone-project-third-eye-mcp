import { useState, useEffect, useCallback } from 'react';
import { setSecureItem, getSecureItem, removeSecureItem } from '../lib/secureStorage';

export function useSecureStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => Promise<void>, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadValue() {
      try {
        const item = await getSecureItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error loading secure item ${key}:`, error);
      } finally {
        setIsLoading(false);
      }
    }
    loadValue();
  }, [key]);

  const setValue = useCallback(
    async (value: T) => {
      try {
        setStoredValue(value);
        await setSecureItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting secure item ${key}:`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    removeSecureItem(key);
  }, [key, initialValue]);

  return [isLoading ? initialValue : storedValue, setValue, removeValue];
}
