import { useEffect, useState } from 'react';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const usePersistentState = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    if (!canUseStorage()) return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (!canUseStorage()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage write errors (private mode/quota).
    }
  }, [key, value]);

  return [value, setValue] as const;
};
