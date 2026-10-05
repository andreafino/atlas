import { describe, expect, it } from "vitest";
import type { Diagram } from "../types/diagram";
import { addEntity, addEntityModule, deleteElement, deleteEntityModule, moveBand, moveEntity, reanchorEdge, resizeBandManually, updateEntity, updateEntityModule, updateTechnology } from "./commands";

function fixture(): Diagram {
  return {
    bands: [{ l: "Banda", x: 0, y: 0, w: 100, h: 100 }],
    entities: [{ id: "a", n: "Entità A", band: "Banda", x: 0, y: 0, mono: "A" }],
    edges: [{ id: "e1", a: "a", b: "a", d: [[0, 0]] }],
    flows: [],
    technologies: [{ id: "t1", g: "Gruppo", n: "Tech", e: ["a"], d: "desc" }],
    authKinds: { mi: "", tok: "", sec: "", per: "" },
    auth: [],
  };
}

function twoBandFixture(): Diagram {
  return {
    bands: [
      { l: "Banda A", x: 0, y: 0, w: 450, h: 150 },
      { l: "Banda B", x: 500, y: 0, w: 300, h: 150 },
    ],
    entities: [
      { id: "a", n: "A", band: "Banda A", x: 20, y: 40, mono: "A" },
      { id: "b", n: "B", band: "Banda A", x: 320, y: 40, mono: "B" },
    ],
    edges: [{ id: "e1", a: "a", b: "b", d: [[260, 76], [320, 76], [330, 90]] }],
    flows: [],
    technologies: [],
    authKinds: { mi: "", tok: "", sec: "", per: "" },
    auth: [],
  };
}

describe("commands", () => {
  it("addEntity aggiunge una nuova entità senza mutare l'originale", () => {
    const d = fixture();
    const next = addEntity({ id: "b", n: "Entità B", band: "Banda", x: 10, y: 10, mono: "B" }).apply(d);
    expect(d.entities).toHaveLength(1);
    expect(next.entities).toHaveLength(2);
    expect(next.entities[1].id).toBe("b");
  });

  it("updateEntity modifica solo l'entità indicata", () => {
    const d = fixture();
    const next = updateEntity("a", { n: "Rinominata" }).apply(d);
    expect(next.entities[0].n).toBe("Rinominata");
    expect(d.entities[0].n).toBe("Entità A");
  });

  it("deleteElement('entity') rimuove entità, i suoi collegamenti e i riferimenti nelle tecnologie", () => {
    const d = fixture();
    const next = deleteElement("entity", "a").apply(d);
    expect(next.entities).toHaveLength(0);
    expect(next.edges).toHaveLength(0);
    expect(next.technologies[0].e).toHaveLength(0);
  });

  it("deleteElement('technology') rimuove solo la tecnologia indicata", () => {
    const d = fixture();
    const next = deleteElement("technology", "t1").apply(d);
    expect(next.technologies).toHaveLength(0);
    expect(next.entities).toHaveLength(1);
  });

  it("addEntity ridimensiona il contenitore per includere la nuova entità", () => {
    const d = twoBandFixture();
    const next = addEntity({ id: "c", n: "C", band: "Banda A", x: 20, y: 400, mono: "C" }).apply(d);
    const bandaA = next.bands.find((b) => b.l === "Banda A")!;
    expect(bandaA.y).toBeLessThanOrEqual(20);
    expect(bandaA.y + bandaA.h).toBeGreaterThanOrEqual(400 + 72);
    // la banda non assegnata resta invariata
    expect(next.bands.find((b) => b.l === "Banda B")).toEqual(d.bands[1]);
  });

  it("moveEntity aggiorna la posizione e ricalcola i collegamenti attaccati, senza mai ridimensionare i contenitori", () => {
    const d = twoBandFixture();
    const next = moveEntity("b", 520, 40, "Banda B").apply(d);
    const moved = next.entities.find((e) => e.id === "b")!;
    expect(moved.band).toBe("Banda B");
    expect(moved.x).toBe(520);
    // il collegamento a-b, attaccato all'entità spostata, deve seguire la nuova posizione
    const edge = next.edges.find((e) => e.id === "e1")!;
    expect(edge.d).not.toEqual(d.edges[0].d);
    expect(edge.d.length).toBe(2);
    // nessun contenitore cambia dimensione per via dello spostamento: né quello di partenza né quello di arrivo
    expect(next.bands).toEqual(d.bands);
  });

  it("moveEntity all'interno dello stesso contenitore sposta solo l'entità, il contenitore resta invariato", () => {
    const d = twoBandFixture();
    const next = moveEntity("a", 999, 999).apply(d);
    expect(next.entities.find((e) => e.id === "a")!.x).toBe(999);
    expect(next.bands).toEqual(d.bands);
  });

  it("deleteElement('entity') non ridimensiona i contenitori", () => {
    const d = twoBandFixture();
    const next = deleteElement("entity", "b").apply(d);
    expect(next.bands).toEqual(d.bands);
  });

  it("resizeBandManually ridimensiona solo il contenitore indicato, rispettando i lati coinvolti", () => {
    const d = twoBandFixture();
    const next = resizeBandManually("Banda A", { right: true, bottom: true }, 50, -20).apply(d);
    const bandaA = next.bands.find((b) => b.l === "Banda A")!;
    expect(bandaA.x).toBe(d.bands[0].x);
    expect(bandaA.y).toBe(d.bands[0].y);
    expect(bandaA.w).toBe(d.bands[0].w + 50);
    expect(bandaA.h).toBe(d.bands[0].h - 20);
    // la banda non coinvolta resta invariata
    expect(next.bands.find((b) => b.l === "Banda B")).toEqual(d.bands[1]);
  });

  it("resizeBandManually non permette di restringere sotto la dimensione minima", () => {
    const d = twoBandFixture();
    const next = resizeBandManually("Banda A", { right: true }, -10000, 0).apply(d);
    const bandaA = next.bands.find((b) => b.l === "Banda A")!;
    expect(bandaA.w).toBeGreaterThanOrEqual(100);
  });

  it("moveBand sposta il contenitore e tutte le entità che gli appartengono, ricalcolando i collegamenti attaccati", () => {
    const d = twoBandFixture();
    const next = moveBand("Banda A", 10, -5).apply(d);
    const bandaA = next.bands.find((b) => b.l === "Banda A")!;
    expect(bandaA.x).toBe(d.bands[0].x + 10);
    expect(bandaA.y).toBe(d.bands[0].y - 5);
    // la banda non coinvolta e le entità non sue restano invariate
    expect(next.bands.find((b) => b.l === "Banda B")).toEqual(d.bands[1]);
    const a = next.entities.find((e) => e.id === "a")!;
    const b = next.entities.find((e) => e.id === "b")!;
    expect(a.x).toBe(d.entities[0].x + 10);
    expect(a.y).toBe(d.entities[0].y - 5);
    expect(b.x).toBe(d.entities[1].x + 10);
    expect(b.y).toBe(d.entities[1].y - 5);
    // il collegamento tra le due entità spostate segue, ma resta un segmento dritto ricalcolato
    expect(next.edges[0].d).not.toEqual(d.edges[0].d);
  });

  it("reanchorEdge cambia l'entità di arrivo del collegamento e ricalcola il percorso", () => {
    const d: Diagram = {
      ...twoBandFixture(),
      entities: [...twoBandFixture().entities, { id: "c", n: "C", band: "Banda B", x: 520, y: 40, mono: "C" }],
    };
    const next = reanchorEdge("e1", "b", "c", 520, 76).apply(d);
    const edge = next.edges.find((e) => e.id === "e1")!;
    expect(edge.a).toBe("a");
    expect(edge.b).toBe("c");
    expect(edge.d).not.toEqual(d.edges[0].d);
    // il punto di rilascio (520,76) è sul lato sinistro dell'entità c (x:520-760,y:40-112)
    expect(edge.d[edge.d.length - 1]).toEqual([520, 76]);
  });

  it("reanchorEdge sceglie il lato in base al punto di rilascio, non solo l'entità", () => {
    const d: Diagram = {
      ...twoBandFixture(),
      entities: [...twoBandFixture().entities, { id: "c", n: "C", band: "Banda B", x: 520, y: 40, mono: "C" }],
    };
    // rilascio sul lato superiore dell'entità c invece che su quello sinistro
    const next = reanchorEdge("e1", "b", "c", 600, 40).apply(d);
    const edge = next.edges.find((e) => e.id === "e1")!;
    expect(edge.d[edge.d.length - 1]).toEqual([600, 40]);
  });

  it("addEntityModule aggiunge un dettaglio e ridimensiona l'entità in base al numero di righe", () => {
    const d = fixture();
    const next = addEntityModule("a", { id: "a.op", t: "Operazione", s: "stato" }).apply(d);
    const entity = next.entities.find((e) => e.id === "a")!;
    expect(entity.mods).toEqual([{ id: "a.op", t: "Operazione", s: "stato" }]);
    expect(entity.h).toBe(66 + 1 * 48);
    const next2 = addEntityModule("a", { id: "a.log", t: "Log", s: "eventi" }).apply(next);
    expect(next2.entities.find((e) => e.id === "a")!.h).toBe(66 + 2 * 48);
  });

  it("updateEntityModule modifica solo il dettaglio indicato", () => {
    const d = addEntityModule("a", { id: "a.op", t: "Operazione", s: "stato" }).apply(fixture());
    const next = updateEntityModule("a", "a.op", { t: "Operazione rinominata" }).apply(d);
    const mod = next.entities.find((e) => e.id === "a")!.mods![0];
    expect(mod.t).toBe("Operazione rinominata");
    expect(mod.s).toBe("stato");
  });

  it("deleteEntityModule rimuove il dettaglio e torna all'altezza di default quando non ne restano", () => {
    const d = addEntityModule("a", { id: "a.op", t: "Operazione", s: "stato" }).apply(fixture());
    const next = deleteEntityModule("a", "a.op").apply(d);
    const entity = next.entities.find((e) => e.id === "a")!;
    expect(entity.mods).toBeUndefined();
    expect(entity.h).toBe(72);
  });

  it("updateTechnology aggiorna solo la tecnologia indicata", () => {
    const d = fixture();
    const next = updateTechnology("t1", { icon: "sql", mono: undefined }).apply(d);
    const tech = next.technologies.find((t) => t.id === "t1")!;
    expect(tech.icon).toBe("sql");
    expect(tech.n).toBe("Tech");
    expect(d.technologies[0].icon).toBeUndefined();
  });
});
