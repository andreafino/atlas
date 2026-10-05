export type SelectionKind = "flow" | "entity" | "tech";

export interface Selection {
  kind: SelectionKind;
  id: string;
}

export interface CurrentHop {
  from: string;
  to: string;
  edge: string | null;
  dir: 1 | -1;
  mods: Set<string>;
}

export interface Highlight {
  nodes: Set<string>;
  mods: Set<string>;
  edges: Map<string, 1 | -1 | 2>;
  cur: CurrentHop | null;
  focus: string | null;
}

export type Tab = "flows" | "entities" | "techs";

export type Theme = "light" | "dark";

export type EditMode = "select" | "add-entity" | "add-container" | "connect" | "delete";
