import type { Diagram } from "../types/diagram";

export interface Command {
  label: string;
  apply(diagram: Diagram): Diagram;
}
