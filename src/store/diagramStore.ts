import { create, type StoreApi, type UseBoundStore } from "zustand";
import type { Diagram } from "../types/diagram";
import type { Command } from "../commands/types";

export type VersionOrigin = "manuale" | "chat";

export interface Version {
  numero: number;
  diagramma: Diagram;
  descrizione: string;
  origine: VersionOrigin;
  autore: string;
  data: string;
}

export interface DiagramStoreState {
  diagram: Diagram;
  versions: Version[];
  index: number;
  apply: (command: Command, opts?: { origine?: VersionOrigin; autore?: string }) => void;
  undo: () => void;
  redo: () => void;
  goto: (index: number) => void;
  hydrate: (versions: Version[], index: number) => void;
}

export function createDiagramStore(initial: Diagram): UseBoundStore<StoreApi<DiagramStoreState>> {
  return create<DiagramStoreState>((set, get) => ({
    diagram: initial,
    versions: [{ numero: 0, diagramma: initial, descrizione: "Versione iniziale", origine: "manuale", autore: "Sistema", data: new Date().toISOString() }],
    index: 0,
    apply(command, opts) {
      const { versions, index, diagram } = get();
      const next = command.apply(diagram);
      const base = versions.slice(0, index + 1);
      const version: Version = {
        numero: base.length,
        diagramma: next,
        descrizione: command.label,
        origine: opts?.origine ?? "manuale",
        autore: opts?.autore ?? "Utente",
        data: new Date().toISOString(),
      };
      set({ diagram: next, versions: [...base, version], index: base.length });
    },
    undo() {
      const { index, versions } = get();
      if (index <= 0) return;
      set({ index: index - 1, diagram: versions[index - 1].diagramma });
    },
    redo() {
      const { index, versions } = get();
      if (index >= versions.length - 1) return;
      set({ index: index + 1, diagram: versions[index + 1].diagramma });
    },
    goto(target) {
      const { versions } = get();
      if (target < 0 || target >= versions.length) return;
      set({ index: target, diagram: versions[target].diagramma });
    },
    hydrate(versions, index) {
      set({ versions, index, diagram: versions[index].diagramma });
    },
  }));
}
