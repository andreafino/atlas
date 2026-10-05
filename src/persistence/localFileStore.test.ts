import { afterEach, describe, expect, it, vi } from "vitest";
import type { DiagramFileV1 } from "./diagramFile";
import { saveDiagramFile } from "./localFileStore";

function fixtureFile(): DiagramFileV1 {
  return {
    kind: "atlas-diagramma",
    formatVersion: 1,
    index: 0,
    versions: [{ numero: 0, diagramma: { bands: [], entities: [], edges: [], flows: [], technologies: [], authKinds: { mi: "", tok: "", sec: "", per: "" }, auth: [] }, descrizione: "Versione iniziale", origine: "manuale", autore: "Sistema", data: "2026-10-01T00:00:00.000Z" }],
  };
}

describe("saveDiagramFile — fallback senza File System Access API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("genera un link di download invece di lanciare un'eccezione", async () => {
    // jsdom non implementa showSaveFilePicker: il ramo fallback deve attivarsi da solo.
    expect(window.showSaveFilePicker).toBeUndefined();

    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const result = await saveDiagramFile(fixtureFile());

    expect(result).toBeUndefined();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("riusa l'handle esistente senza passare dal fallback di download", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const handle = { createWritable: vi.fn().mockResolvedValue({ write, close }), getFile: vi.fn() };
    const createObjectURL = vi.spyOn(URL, "createObjectURL");

    const result = await saveDiagramFile(fixtureFile(), handle);

    expect(result).toBe(handle);
    expect(write).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
