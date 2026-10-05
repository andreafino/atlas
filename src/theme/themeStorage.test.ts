import { afterEach, describe, expect, it, vi } from "vitest";
import { readStoredTheme, writeStoredTheme } from "./themeStorage";

const KEY = "atlas-theme";
const LEGACY_KEY = "eos-architetture-theme";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("themeStorage", () => {
  it("scrive e rilegge il tema (round-trip)", () => {
    writeStoredTheme("dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("un valore non valido in storage produce null", () => {
    localStorage.setItem(KEY, "blu");
    expect(readStoredTheme()).toBeNull();
  });

  it("nessun valore in storage produce null", () => {
    expect(readStoredTheme()).toBeNull();
  });

  it("un valore salvato sotto la vecchia chiave viene letto come fallback", () => {
    localStorage.setItem(LEGACY_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("la nuova chiave ha priorità sulla vecchia", () => {
    localStorage.setItem(LEGACY_KEY, "dark");
    localStorage.setItem(KEY, "light");
    expect(readStoredTheme()).toBe("light");
  });

  it("se localStorage.getItem lancia, readStoredTheme non propaga l'eccezione", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("non disponibile");
    });
    expect(() => readStoredTheme()).not.toThrow();
    expect(readStoredTheme()).toBeNull();
  });

  it("se localStorage.setItem lancia, writeStoredTheme non propaga l'eccezione", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("non disponibile");
    });
    expect(() => writeStoredTheme("light")).not.toThrow();
  });
});
