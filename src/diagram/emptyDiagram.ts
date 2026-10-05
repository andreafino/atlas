import type { Diagram } from "../types/diagram";

export const EMPTY_DIAGRAM: Diagram = {
  bands: [],
  entities: [],
  edges: [],
  flows: [],
  technologies: [],
  authKinds: { mi: "", tok: "", sec: "", per: "" },
  auth: [],
};
