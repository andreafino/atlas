import type { Diagram } from "../types/diagram";

export interface Command {
  label: string;
  apply(diagram: Diagram): Diagram;
  // Dati da restituire a chi ha eseguito il comando (es. l'id di un elemento appena creato).
  output?: Record<string, unknown>;
}
