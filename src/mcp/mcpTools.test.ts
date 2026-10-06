import { beforeEach, describe, expect, it } from "vitest";
import type { Diagram } from "../types/diagram";
import { useDiagramStore } from "../store/useDiagramStore";
import { describeMcpTools, runMcpTool } from "./mcpTools";

function fixture(): Diagram {
  return {
    bands: [{ l: "Banda", x: 0, y: 0, w: 300, h: 200 }],
    entities: [{ id: "a", n: "A", band: "Banda", x: 20, y: 40, mono: "A" }],
    edges: [],
    flows: [],
    technologies: [],
    authKinds: { mi: "", tok: "", sec: "", per: "" },
    auth: [],
  };
}

describe("mcpTools", () => {
  beforeEach(() => {
    const d = fixture();
    useDiagramStore.getState().hydrate([{ numero: 0, diagramma: d, descrizione: "Iniziale", origine: "manuale", autore: "Utente", data: new Date().toISOString() }], 0);
  });

  it("marca le letture come readOnly e le scritture come non readOnly", () => {
    const tools = describeMcpTools();
    expect(tools.find((t) => t.name === "getDiagram")?.readOnly).toBe(true);
    expect(tools.find((t) => t.name === "addEntity")?.readOnly).toBe(false);
  });

  it("una lettura restituisce i dati senza creare versioni", () => {
    const result = runMcpTool("listEntities", {}, "Claude");
    expect(result).toEqual([{ id: "a", n: "A", band: "Banda", sottotitolo: null }]);
    expect(useDiagramStore.getState().versions).toHaveLength(1);
  });

  it("una scrittura applica il comando con origine mcp e il nome del client", () => {
    runMcpTool("addEntity", { nome: "Cache", banda: "Banda" }, "Claude");
    const { versions, diagram } = useDiagramStore.getState();
    expect(diagram.entities.map((e) => e.n)).toContain("Cache");
    expect(versions).toHaveLength(2);
    expect(versions[1]).toMatchObject({ origine: "mcp", autore: "Claude" });
  });

  it("rifiuta strumenti sconosciuti", () => {
    expect(() => runMcpTool("nonEsiste", {}, "Claude")).toThrow("Strumento sconosciuto");
  });

  it("entità aggiunte senza coordinate non si sovrappongono, anche se la precedente ha dettagli", () => {
    runMcpTool("addEntityModule", { entityId: "a", titolo: "Op1" }, "Claude");
    runMcpTool("addEntityModule", { entityId: "a", titolo: "Op2" }, "Claude");
    runMcpTool("addEntity", { nome: "Seconda", banda: "Banda" }, "Claude");
    const entities = useDiagramStore.getState().diagram.entities;
    const first = entities.find((e) => e.id === "a")!;
    const second = entities.find((e) => e.n === "Seconda")!;
    expect(second.y).toBeGreaterThanOrEqual(first.y + (first.h ?? 72));
  });

  it("rinominare un contenitore riassegna le entità al suo interno", () => {
    runMcpTool("updateBand", { etichetta: "Banda", nuovaEtichetta: "Nuova" }, "Claude");
    const { diagram } = useDiagramStore.getState();
    expect(diagram.bands.map((b) => b.l)).toEqual(["Nuova"]);
    expect(diagram.entities[0].band).toBe("Nuova");
  });

  it("eliminare un contenitore elimina anche le entità che contiene", () => {
    runMcpTool("deleteBand", { etichetta: "Banda" }, "Claude");
    const { diagram } = useDiagramStore.getState();
    expect(diagram.bands).toHaveLength(0);
    expect(diagram.entities).toHaveLength(0);
  });

  it("un'icona valida viene impostata sull'entità al posto del monogramma", () => {
    runMcpTool("addEntity", { nome: "Database", banda: "Banda", icona: "sql" }, "Claude");
    const entity = useDiagramStore.getState().diagram.entities.find((e) => e.n === "Database");
    expect(entity).toMatchObject({ icon: "sql" });
    expect(entity?.mono).toBeUndefined();
  });

  it("un'icona inesistente viene rifiutata con un messaggio utile", () => {
    expect(() => runMcpTool("addEntity", { nome: "X", banda: "Banda", icona: "non-esiste" }, "Claude")).toThrow("listIcons");
  });

  it("listIcons senza query restituisce le icone curate, con query cerca nel catalogo esteso", () => {
    const curated = runMcpTool("listIcons", {}, "Claude") as { icone: { id: string }[] };
    expect(curated.icone.map((i) => i.id)).toContain("sql");
    const found = runMcpTool("listIcons", { query: "service bus" }, "Claude") as { icone: { id: string }[] };
    expect(found.icone.length).toBeGreaterThan(0);
  });
});
