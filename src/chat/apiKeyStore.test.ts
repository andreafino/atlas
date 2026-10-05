import { afterEach, describe, expect, it, vi } from "vitest";
import { clearStoredApiKey, readStoredApiKey, writeStoredApiKey } from "./apiKeyStore";

const KEY = "atlas-anthropic-key";
const LEGACY_KEY = "eos-architetture-anthropic-key";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("apiKeyStore", () => {
  it("scrive e rilegge la chiave (round-trip)", () => {
    writeStoredApiKey("sk-ant-test");
    expect(readStoredApiKey()).toBe("sk-ant-test");
  });

  it("nessun valore in storage produce null", () => {
    expect(readStoredApiKey()).toBeNull();
  });

  it("una chiave salvata sotto la vecchia chiave viene letta come fallback", () => {
    localStorage.setItem(LEGACY_KEY, "sk-ant-legacy");
    expect(readStoredApiKey()).toBe("sk-ant-legacy");
  });

  it("la nuova chiave ha priorità sulla vecchia", () => {
    localStorage.setItem(LEGACY_KEY, "sk-ant-legacy");
    localStorage.setItem(KEY, "sk-ant-new");
    expect(readStoredApiKey()).toBe("sk-ant-new");
  });

  it("clearStoredApiKey rimuove la chiave corrente", () => {
    writeStoredApiKey("sk-ant-test");
    clearStoredApiKey();
    expect(readStoredApiKey()).toBeNull();
  });

  it("se localStorage.getItem lancia, readStoredApiKey non propaga l'eccezione", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("non disponibile");
    });
    expect(() => readStoredApiKey()).not.toThrow();
    expect(readStoredApiKey()).toBeNull();
  });
});
