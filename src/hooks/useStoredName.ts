import { useCallback, useState } from 'react';

const STORAGE_KEY = 'canvas-app:user-name';

function read(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // Storage can be unavailable, e.g. in some private modes.
  }
}

/** The user's display name, remembered for the lifetime of the browser tab. */
export function useStoredName(): [string | null, (name: string | null) => void] {
  const [name, setNameState] = useState(read);

  const setName = useCallback((next: string | null) => {
    setNameState(next);
    try {
      if (next === null) sessionStorage.removeItem(STORAGE_KEY);
      else sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisting is fine; the name still works for this page load.
    }
  }, []);

  return [name, setName];
}
