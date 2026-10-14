// Small per-browser preferences. Storage can be missing or full; reads fall back, writes are best effort.

export function readPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`atril.${key}`);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: unknown): void {
  try {
    localStorage.setItem(`atril.${key}`, JSON.stringify(value));
  } catch {
    /* private mode or quota: the app keeps working for this session */
  }
}
