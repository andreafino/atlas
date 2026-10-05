import { describe, expect, it } from "vitest";
import type { Band, Diagram, Entity } from "../types/diagram";
import { computeBounds, growBandToInclude, midpointOfPath, orthogonalEdgePath, orthogonalPathBetween, recomputeBandBounds, resizeBand, sideOfPoint, sidePoint, snapBandResize } from "./geometry";

describe("recomputeBandBounds", () => {
  it("include tutte le entità di una banda anche se il riferimento ha maiuscole o spazi diversi dall'etichetta", () => {
    // Replica il bug reale: le entità del sample si riferiscono alla banda con un testo
    // diverso da quello mostrato nel contenitore (es. "Sottoscrizione Azure" vs "SOTTOSCRIZIONE AZURE E-COMMERCE").
    // Senza un confronto tollerante, solo l'entità appena spostata (il cui campo band viene
    // riscritto per combaciare esattamente) risultava "dentro" al contenitore, e tutte le altre
    // ne restavano fuori quando si ricalcolava la dimensione.
    const diagram: Diagram = {
      bands: [{ l: "  Sottoscrizione Azure  ", x: 0, y: 0, w: 10, h: 10 }],
      entities: [
        { id: "a", n: "A", band: "sottoscrizione azure", x: 0, y: 0, mono: "A" },
        { id: "b", n: "B", band: "SOTTOSCRIZIONE AZURE", x: 500, y: 500, mono: "B" },
      ],
      edges: [],
      flows: [],
      technologies: [],
      authKinds: { mi: "", tok: "", sec: "", per: "" },
      auth: [],
    };

    const bands = recomputeBandBounds(diagram);
    const band = bands[0];
    // deve racchiudere ENTRAMBE le entità, non solo una
    expect(band.x).toBeLessThanOrEqual(0);
    expect(band.y).toBeLessThanOrEqual(0);
    expect(band.x + band.w).toBeGreaterThanOrEqual(500 + 240);
    expect(band.y + band.h).toBeGreaterThanOrEqual(500 + 72);
  });
});

describe("growBandToInclude", () => {
  const band: Band = { l: "Banda", x: 0, y: 0, w: 300, h: 150 };

  it("non cambia nulla se l'entità è già dentro i confini correnti (margine incluso)", () => {
    const roomy: Band = { l: "Banda", x: 0, y: 0, w: 400, h: 250 };
    const entity: Entity = { id: "a", n: "A", band: "Banda", x: 60, y: 60, mono: "A" };
    expect(growBandToInclude(roomy, entity)).toEqual(roomy);
  });

  it("allarga solo quanto basta per includere un'entità fuori dai confini, senza restringere il resto", () => {
    const entity: Entity = { id: "a", n: "A", band: "Banda", x: 500, y: 500, mono: "A" };
    const grown = growBandToInclude(band, entity);
    expect(grown.x).toBe(band.x);
    expect(grown.y).toBe(band.y);
    expect(grown.w).toBeGreaterThan(band.w);
    expect(grown.h).toBeGreaterThan(band.h);
    expect(grown.x + grown.w).toBeGreaterThanOrEqual(500 + 240);
    expect(grown.y + grown.h).toBeGreaterThanOrEqual(500 + 72);
  });

  it("allarga anche verso sinistra/alto se l'entità è posizionata prima dell'origine della banda", () => {
    const entity: Entity = { id: "a", n: "A", band: "Banda", x: -200, y: -100, mono: "A" };
    const grown = growBandToInclude(band, entity);
    expect(grown.x).toBeLessThan(band.x);
    expect(grown.y).toBeLessThan(band.y);
    // il lato destro/basso originale resta comunque incluso
    expect(grown.x + grown.w).toBeGreaterThanOrEqual(band.x + band.w);
    expect(grown.y + grown.h).toBeGreaterThanOrEqual(band.y + band.h);
  });
});

describe("resizeBand", () => {
  const band: Band = { l: "Banda", x: 100, y: 100, w: 300, h: 200 };

  it("trascinare il bordo destro cambia solo la larghezza", () => {
    const next = resizeBand(band, { right: true }, 40, 0);
    expect(next).toMatchObject({ x: 100, y: 100, w: 340, h: 200 });
  });

  it("trascinare il bordo sinistro sposta x e riduce la larghezza in modo coerente", () => {
    const next = resizeBand(band, { left: true }, 40, 0);
    expect(next).toMatchObject({ x: 140, y: 100, w: 260, h: 200 });
  });

  it("trascinare un angolo cambia due dimensioni insieme", () => {
    const next = resizeBand(band, { bottom: true, right: true }, 20, 30);
    expect(next).toMatchObject({ x: 100, y: 100, w: 320, h: 230 });
  });

  it("non permette di scendere sotto la dimensione minima", () => {
    const next = resizeBand(band, { right: true }, -10000, 0);
    expect(next.w).toBeGreaterThanOrEqual(100);
    expect(next.x).toBe(100);
  });
});

describe("orthogonalEdgePath", () => {
  it("usa una riga dritta orizzontale se le entità condividono un intervallo di righe", () => {
    const a: Entity = { id: "a", n: "A", band: "B", x: 0, y: 100, mono: "A" };
    const b: Entity = { id: "b", n: "B", band: "B", x: 400, y: 110, mono: "B" };
    const path = orthogonalEdgePath(a, b);
    expect(path).toHaveLength(2);
    expect(path[0][1]).toBe(path[1][1]); // stessa y: riga dritta
  });

  it("usa una riga dritta verticale se le entità condividono un intervallo di colonne", () => {
    const a: Entity = { id: "a", n: "A", band: "B", x: 100, y: 0, mono: "A" };
    const b: Entity = { id: "b", n: "B", band: "B", x: 110, y: 400, mono: "B" };
    const path = orthogonalEdgePath(a, b);
    expect(path).toHaveLength(2);
    expect(path[0][0]).toBe(path[1][0]); // stessa x: colonna dritta
  });

  it("usa un gomito ad angolo retto se le entità non sono allineate", () => {
    const a: Entity = { id: "a", n: "A", band: "B", x: 0, y: 0, mono: "A" };
    const b: Entity = { id: "b", n: "B", band: "B", x: 500, y: 500, mono: "B" };
    const path = orthogonalEdgePath(a, b);
    expect(path).toHaveLength(4);
    // ogni segmento consecutivo è orizzontale o verticale, mai diagonale
    for (let i = 1; i < path.length; i++) {
      const [x1, y1] = path[i - 1];
      const [x2, y2] = path[i];
      expect(x1 === x2 || y1 === y2).toBe(true);
    }
  });
});

describe("midpointOfPath", () => {
  it("per due punti restituisce il punto medio del segmento", () => {
    expect(midpointOfPath([[0, 0], [10, 20]])).toEqual([5, 10]);
  });

  it("per un gomito a 4 punti restituisce il centro del segmento centrale", () => {
    expect(
      midpointOfPath([
        [0, 0],
        [10, 0],
        [10, 20],
        [30, 20],
      ])
    ).toEqual([10, 10]);
  });
});

describe("computeBounds", () => {
  it("segue le coordinate negative: un contenitore spostato sopra/a sinistra dell'origine non viene tagliato via", () => {
    const diagram: Diagram = {
      bands: [{ l: "Banda", x: -200, y: -150, w: 300, h: 200 }],
      entities: [],
      edges: [],
      flows: [],
      technologies: [],
      authKinds: { mi: "", tok: "", sec: "", per: "" },
      auth: [],
    };
    const bounds = computeBounds(diagram);
    expect(bounds.minX).toBeLessThanOrEqual(-200);
    expect(bounds.minY).toBeLessThanOrEqual(-150);
    // il viewBox deve comunque coprire fino al bordo destro/basso del contenitore
    expect(bounds.minX + bounds.width).toBeGreaterThanOrEqual(-200 + 300);
    expect(bounds.minY + bounds.height).toBeGreaterThanOrEqual(-150 + 200);
  });
});

describe("snapBandResize", () => {
  it("aggancia solo il bordo trascinato alla coordinata allineabile più vicina, lasciando fermo il lato opposto", () => {
    const band: Band = { l: "Banda", x: 0, y: 0, w: 200, h: 100 };
    // un altro contenitore il cui bordo sinistro è a x=206: trascinando il bordo destro di "Banda"
    // (che senza snap finirebbe a x=210) ci si aspetta che si agganci esattamente a 206
    const others = [{ x: 206, y: 0, w: 100, h: 100 }];
    const result = snapBandResize(band, { right: true }, 10, 0, others);
    expect(result.dx).toBe(6);
    expect(result.vLines).toEqual([206]);
    expect(result.dy).toBe(0);
    expect(result.hLines).toEqual([]);
  });

  it("non aggancia un bordo che non si sta trascinando", () => {
    const band: Band = { l: "Banda", x: 0, y: 0, w: 200, h: 100 };
    // il bordo sinistro (x=0) è già allineato a un altro elemento, ma solo il destro viene trascinato:
    // l'allineamento del sinistro non deve influenzare lo scarto applicato al destro
    const others = [{ x: 0, y: 0, w: 50, h: 50 }];
    const result = snapBandResize(band, { right: true }, 55, 0, others);
    expect(result.dx).toBe(55);
    expect(result.vLines).toEqual([]);
  });
});

describe("sideOfPoint / sidePoint", () => {
  const entity: Entity = { id: "e", n: "E", band: "B", x: 100, y: 100, mono: "E" }; // 240x72 di default

  it("sceglie il lato più vicino in proporzione alle semidimensioni", () => {
    expect(sideOfPoint(entity, 340, 136)).toBe("r"); // bordo destro, x=100+240
    expect(sideOfPoint(entity, 100, 136)).toBe("l"); // bordo sinistro
    expect(sideOfPoint(entity, 220, 100)).toBe("t"); // bordo superiore
    expect(sideOfPoint(entity, 220, 172)).toBe("b"); // bordo inferiore
  });

  it("il punto sul lato resta dentro i margini dell'entità", () => {
    expect(sidePoint(entity, "l", 500)).toEqual([100, 100 + 72 - 14]);
    expect(sidePoint(entity, "t", -500)).toEqual([100 + 14, 100]);
  });
});

describe("orthogonalPathBetween", () => {
  it("collega due punti sulla stessa riga con un segmento dritto quando entrambi i lati sono orizzontali", () => {
    expect(orthogonalPathBetween([0, 50], "r", [200, 50], "l")).toEqual([
      [0, 50],
      [200, 50],
    ]);
  });

  it("collega un lato orizzontale e uno verticale con un gomito a due segmenti che rispetta entrambe le uscite", () => {
    expect(orthogonalPathBetween([0, 50], "r", [200, 300], "t")).toEqual([
      [0, 50],
      [200, 50],
      [200, 300],
    ]);
  });
});
