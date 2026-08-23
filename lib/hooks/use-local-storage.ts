"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};

export function useLocalStorage<T>(key: string, initialValue: T) {
  const prefixedKey = `dokit-${key}`;

  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === prefixedKey) onStoreChange();
    };
    const handleLocalChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === prefixedKey) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("dokit-storage-change", handleLocalChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("dokit-storage-change", handleLocalChange);
    };
  }, [prefixedKey]);

  const storedValue = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(prefixedKey),
    () => null
  );
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const value = useMemo(() => {
    if (storedValue === null) return initialValue;
    try {
      return JSON.parse(storedValue) as T;
    } catch {
      return initialValue;
    }
  }, [initialValue, storedValue]);

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      let currentValue = value;
      try {
        const latest = localStorage.getItem(prefixedKey);
        if (latest !== null) currentValue = JSON.parse(latest) as T;
      } catch {
        // Fall back to the current rendered value when stored JSON is invalid.
      }
      const resolved =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(currentValue)
          : newValue;
      try {
        localStorage.setItem(prefixedKey, JSON.stringify(resolved));
        window.dispatchEvent(new CustomEvent("dokit-storage-change", { detail: prefixedKey }));
      } catch {
        // Quota exceeded — keep the previous value.
      }
    },
    [prefixedKey, value]
  );

  const remove = useCallback(() => {
    localStorage.removeItem(prefixedKey);
    window.dispatchEvent(new CustomEvent("dokit-storage-change", { detail: prefixedKey }));
  }, [prefixedKey]);

  return [value, set, { hydrated, remove }] as const;
}
