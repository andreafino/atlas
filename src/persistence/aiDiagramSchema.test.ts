import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fromFileContents } from "./diagramFile";
import { orthogonalEdgePath, midpointOfPath, ENTITY_WIDTH, DEFAULT_ENTITY_HEIGHT } from "../diagram/geometry";
import type { Diagram, Entity } from "../types/diagram";

// Verifica che l'esempio in AI_DIAGRAM_SCHEMA.md (il documento pensato per un'AI esterna, non per il
// codice) resti un diagramma valido e coerente con le sue stesse regole di layout: se qualcuno modifica
// l'esempio senza aggiornare le regole (o viceversa), questo test fallisce invece di scoprirlo solo
// quando un utente prova a importare un JSON generato seguendo il documento.
function readExampleFromDoc(): unknown {
  const doc = readFileSync(resolve(__dirname, "../../AI_DIAGRAM_SCHEMA.md"), "utf-8");
  // Il documento ha più blocchi ```json: alcuni sono frammenti illustrativi (es. solo authKinds/auth),
  // l'esempio completo è l'unico che contiene "bands" — lo cerchiamo esplicitamente invece di prendere
  // "il primo blocco" o "l'ultimo blocco", che si romperebbe silenziosamente se l'ordine cambiasse.
  const blocks = [...doc.matchAll(/```json\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  const full = blocks.find((b) => b.includes('"bands"'));
  if (!full) throw new Error('Nessun blocco ```json con "bands" trovato in AI_DIAGRAM_SCHEMA.md');
  return JSON.parse(full);
}

function entityBottom(e: Entity): number {
  return e.y + (e.h ?? DEFAULT_ENTITY_HEIGHT);
}

describe("esempio in AI_DIAGRAM_SCHEMA.md", () => {
  it("è un diagramma grezzo valido, importabile con fromFileContents", () => {
    const raw = readExampleFromDoc();
    const { diagram } = fromFileContents(raw);
    expect(diagram.bands.length).toBeGreaterThan(0);
    expect(diagram.entities.length).toBeGreaterThan(0);
    expect(diagram.authKinds).toEqual({ mi: "", tok: "", sec: "", per: "" });
    expect(diagram.auth).toEqual([]);
  });

  it("ogni entità sta dentro i confini della propria banda", () => {
    const raw = readExampleFromDoc();
    const { diagram } = fromFileContents(raw);
    diagram.entities.forEach((e) => {
      const band = diagram.bands.find((b) => b.l.trim().toLowerCase() === e.band.trim().toLowerCase());
      expect(band, `nessuna banda "${e.band}" per l'entità "${e.id}"`).toBeDefined();
      expect(e.x).toBeGreaterThanOrEqual(band!.x);
      expect(e.y).toBeGreaterThanOrEqual(band!.y);
      expect(e.x + ENTITY_WIDTH).toBeLessThanOrEqual(band!.x + band!.w);
      expect(entityBottom(e)).toBeLessThanOrEqual(band!.y + band!.h);
    });
  });

  it("il percorso di ogni collegamento combacia con orthogonalEdgePath e l'etichetta è al suo punto medio", () => {
    const raw = readExampleFromDoc();
    const { diagram } = fromFileContents(raw);
    diagram.edges.forEach((edge) => {
      const a = diagram.entities.find((e) => e.id === edge.a)!;
      const b = diagram.entities.find((e) => e.id === edge.b)!;
      expect(edge.d).toEqual(orthogonalEdgePath(a, b));
      if (edge.l) {
        const [mx, my] = midpointOfPath(edge.d);
        expect(edge.lx).toBe(mx);
        expect(edge.ly).toBe(my);
      }
    });
  });

  it("i passi dei flussi referenziano entità e collegamenti che esistono davvero", () => {
    const raw = readExampleFromDoc();
    const { diagram } = fromFileContents(raw);
    diagram.flows.forEach((f) => {
      f.h.forEach(([from, to, edgeId]) => {
        expect(diagram.entities.some((e) => e.id === from)).toBe(true);
        expect(diagram.entities.some((e) => e.id === to)).toBe(true);
        if (edgeId) expect(diagram.edges.some((e) => e.id === edgeId)).toBe(true);
      });
    });
  });

  it("le tecnologie referenziano solo entità esistenti", () => {
    const raw = readExampleFromDoc();
    const { diagram } = fromFileContents(raw) as { diagram: Diagram };
    diagram.technologies.forEach((t) => {
      t.e.forEach((id) => expect(diagram.entities.some((e) => e.id === id)).toBe(true));
    });
  });
});
