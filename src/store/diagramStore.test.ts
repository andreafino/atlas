import { describe, expect, it } from "vitest";
import type { Diagram } from "../types/diagram";
import { addEntity, updateEntity } from "../commands/commands";
import { createDiagramStore } from "./diagramStore";

function fixture(): Diagram {
  return {
    bands: [],
    entities: [],
    edges: [],
    flows: [],
    technologies: [],
    authKinds: { mi: "", tok: "", sec: "", per: "" },
    auth: [],
  };
}

describe("diagramStore", () => {
  it("apply crea una nuova versione nello storico", () => {
    const store = createDiagramStore(fixture());
    store.getState().apply(addEntity({ id: "a", n: "A", band: "B", x: 0, y: 0, mono: "A" }));
    const state = store.getState();
    expect(state.diagram.entities).toHaveLength(1);
    expect(state.versions).toHaveLength(2);
    expect(state.index).toBe(1);
    expect(state.versions[1].descrizione).toContain("Aggiunta entità");
  });

  it("undo torna alla versione precedente, redo la riapplica", () => {
    const store = createDiagramStore(fixture());
    store.getState().apply(addEntity({ id: "a", n: "A", band: "B", x: 0, y: 0, mono: "A" }));
    store.getState().undo();
    expect(store.getState().diagram.entities).toHaveLength(0);
    expect(store.getState().index).toBe(0);
    store.getState().redo();
    expect(store.getState().diagram.entities).toHaveLength(1);
  });

  it("applicare un comando dopo un undo tronca il ramo di redo", () => {
    const store = createDiagramStore(fixture());
    store.getState().apply(addEntity({ id: "a", n: "A", band: "B", x: 0, y: 0, mono: "A" }));
    store.getState().undo();
    store.getState().apply(updateEntity("a", { n: "Non applicato, a comunque assente" }));
    const state = store.getState();
    expect(state.versions).toHaveLength(2);
    expect(state.index).toBe(1);
    store.getState().redo();
    expect(store.getState().index).toBe(1);
  });

  it("goto salta direttamente a una versione dello storico", () => {
    const store = createDiagramStore(fixture());
    store.getState().apply(addEntity({ id: "a", n: "A", band: "B", x: 0, y: 0, mono: "A" }));
    store.getState().apply(addEntity({ id: "b", n: "B", band: "B", x: 0, y: 0, mono: "B" }));
    store.getState().goto(0);
    expect(store.getState().diagram.entities).toHaveLength(0);
    store.getState().goto(2);
    expect(store.getState().diagram.entities).toHaveLength(2);
  });

  it("undo oltre l'inizio e redo oltre la fine non fanno nulla", () => {
    const store = createDiagramStore(fixture());
    store.getState().undo();
    expect(store.getState().index).toBe(0);
    store.getState().redo();
    expect(store.getState().index).toBe(0);
  });

  it("hydrate sostituisce diagram/versions/index, dopodiché undo/goto operano sui nuovi dati", () => {
    const store = createDiagramStore(fixture());
    store.getState().apply(addEntity({ id: "a", n: "A", band: "B", x: 0, y: 0, mono: "A" }));

    const loadedVersions = store.getState().versions;
    const otherStore = createDiagramStore(fixture());
    otherStore.getState().hydrate(loadedVersions, 1);

    expect(otherStore.getState().diagram.entities).toHaveLength(1);
    expect(otherStore.getState().versions).toHaveLength(2);
    expect(otherStore.getState().index).toBe(1);

    otherStore.getState().undo();
    expect(otherStore.getState().diagram.entities).toHaveLength(0);
    otherStore.getState().goto(1);
    expect(otherStore.getState().diagram.entities).toHaveLength(1);
  });
});
