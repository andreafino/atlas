const KEY = "eos-architetture-anthropic-key";

export function readStoredApiKey(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeStoredApiKey(key: string): void {
  try {
    localStorage.setItem(KEY, key);
  } catch {
    // storage non disponibile: nessun salvataggio, non bloccante
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage non disponibile: nessun salvataggio, non bloccante
  }
}
