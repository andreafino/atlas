import type { Theme } from "../diagram/types";

const KEY = "atlas-theme";
const LEGACY_KEY = "eos-architetture-theme";

export function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // storage non disponibile: nessun salvataggio, non bloccante
  }
}
