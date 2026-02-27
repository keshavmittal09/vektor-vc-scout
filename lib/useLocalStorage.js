import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch { }
    setHydrated(true);
  }, [key]);

  // Write to localStorage on changes (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch { }
  }, [key, storedValue, hydrated]);

  return [storedValue, setStoredValue];
}
