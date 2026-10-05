// Modello dati del diagramma, dal formato di samples/e-commerce-bc.json (SPEC.md §8).

export interface Band {
  l: string; // etichetta
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EntityModule {
  id: string;
  t: string; // titolo del modulo
  s: string; // sottotitolo
}

export interface Entity {
  id: string;
  n: string; // nome
  s?: string[]; // sottotitoli
  icon?: string;
  mono?: string; // etichetta monogramma al posto dell'icona
  band: string; // etichetta della banda di appartenenza
  x: number;
  y: number;
  h?: number;
  desc?: string;
  mods?: EntityModule[]; // moduli interni (livello Component)
}

export type Point = [number, number];

export interface Edge {
  id: string;
  a: string; // id entità di partenza
  b: string; // id entità di arrivo
  d: Point[]; // percorso del collegamento
  l?: string; // etichetta
  lx?: number;
  ly?: number;
  bi?: boolean; // bidirezionale
}

export interface FlowStep {
  from: string;
  to: string;
  edgeId: string | null;
  direction: 1 | -1;
  label: string;
  modules?: string[];
}

export interface Flow {
  id: string;
  g: string; // gruppo
  t: string; // titolo
  w: string; // "dove" si svolge il flusso
  note?: string;
  h: FlowStepRaw[]; // passi, formato tupla come nel JSON sorgente
}

// Formato tupla grezzo come appare in samples/*.json: [da, a, collegamentoId, direzione, etichetta, moduli?]
export type FlowStepRaw = [string, string, string | null, 1 | -1, string, string[]?];

export interface Technology {
  id: string;
  g: string; // gruppo
  n: string; // nome
  icon?: string;
  mono?: string;
  e: string[]; // id delle entità coinvolte
  d: string; // descrizione
}

export type AuthKindCode = "mi" | "tok" | "sec" | "per";

// Tupla grezza: [n, tipo, da, verso[], meccanismo, credenziale]
export type AuthEntryRaw = [number, AuthKindCode, string, string[], string, string];

export interface Diagram {
  bands: Band[];
  entities: Entity[];
  edges: Edge[];
  flows: Flow[];
  technologies: Technology[];
  authKinds: Record<AuthKindCode, string>;
  auth: AuthEntryRaw[];
}
