import { describe, expect, it } from "vitest";
import type { Diagram } from "../types/diagram";
import type { Version } from "../store/diagramStore";
import { fromFileContents, toFileContents } from "./diagramFile";

function fixtureDiagram(): Diagram {
  return { bands: [], entities: [], edges: [], flows: [], technologies: [], authKinds: { mi: "", tok: "", sec: "", per: "" }, auth: [] };
}

function fixtureVersions(): Version[] {
  return [
    { numero: 0, diagramma: fixtureDiagram(), descrizione: "Versione iniziale", origine: "manuale", autore: "Sistema", data: "2026-10-01T00:00:00.000Z" },
    { numero: 1, diagramma: { ...fixtureDiagram(), entities: [{ id: "a", n: "A", band: "B", x: 0, y: 0, mono: "A" }] }, descrizione: "Aggiunta entità A", origine: "manuale", autore: "Utente", data: "2026-10-01T00:01:00.000Z" },
  ];
}

describe("diagramFile", () => {
  it("round-trip: toFileContents -> fromFileContents restituisce lo stesso stato", () => {
    const versions = fixtureVersions();
    const file = toFileContents({ versions, index: 1 });
    const restored = fromFileContents(file);
    expect(restored.versions).toEqual(versions);
    expect(restored.index).toBe(1);
    expect(restored.diagram).toEqual(versions[1].diagramma);
  });

  it("round-trip: il titolo sopravvive al salvataggio/caricamento", () => {
    const versions = fixtureVersions();
    const file = toFileContents({ versions, index: 0, title: "Il mio diagramma" });
    const restored = fromFileContents(file);
    expect(restored.title).toBe("Il mio diagramma");
  });

  it("accetta un diagramma grezzo (formato samples/e-commerce-bc.json, senza wrapper kind/versions)", () => {
    const raw = fixtureDiagram();
    const restored = fromFileContents(raw);
    expect(restored.diagram).toEqual(raw);
    expect(restored.versions).toHaveLength(1);
    expect(restored.index).toBe(0);
    expect(restored.title).toBeUndefined();
  });

  it("rifiuta un oggetto che non è né il formato con storico né un diagramma grezzo", () => {
    expect(() => fromFileContents({ formatVersion: 1, versions: fixtureVersions(), index: 0 })).toThrow();
    expect(() => fromFileContents({ qualcosa: "altro" })).toThrow();
  });

  it("rifiuta una versione di formato non supportata", () => {
    expect(() => fromFileContents({ kind: "eos-architetture-diagramma", formatVersion: 2, versions: fixtureVersions(), index: 0 })).toThrow(/formato/);
  });

  it("rifiuta un indice fuori range", () => {
    expect(() => fromFileContents({ kind: "eos-architetture-diagramma", formatVersion: 1, versions: fixtureVersions(), index: 5 })).toThrow(/indice/);
  });

  it("rifiuta un JSON che non è un oggetto", () => {
    expect(() => fromFileContents("non un oggetto")).toThrow();
    expect(() => fromFileContents(null)).toThrow();
  });
});
