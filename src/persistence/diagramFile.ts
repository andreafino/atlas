import type { Diagram } from "../types/diagram";
import type { Version } from "../store/diagramStore";

const CURRENT_KIND = "atlas-diagramma";
const LEGACY_KINDS = ["eos-architetture-diagramma"];

export interface DiagramFileV1 {
  kind: "atlas-diagramma";
  formatVersion: 1;
  title?: string;
  versions: Version[];
  index: number;
}

export function toFileContents(state: { versions: Version[]; index: number; title?: string }): DiagramFileV1 {
  return { kind: CURRENT_KIND, formatVersion: 1, title: state.title, versions: state.versions, index: state.index };
}

// samples/e-commerce-bc.json (e la sua copia src/data/e-commerce-bc.json) sono diagrammi "grezzi":
// nessun wrapper kind/formatVersion/versions, solo i campi di Diagram. Li riconosciamo dalla presenza
// degli array obbligatori, per poterli aprire direttamente con "Apri file" invece di richiedere che
// l'utente li converta prima nel formato con storico versioni.
function isRawDiagramShape(json: Record<string, unknown>): boolean {
  return Array.isArray(json.bands) && Array.isArray(json.entities) && Array.isArray(json.edges) && Array.isArray(json.flows) && Array.isArray(json.technologies);
}

export function fromFileContents(json: unknown): { diagram: Diagram; versions: Version[]; index: number; title?: string } {
  if (typeof json !== "object" || json === null) {
    throw new Error("Il file non contiene un oggetto JSON valido.");
  }
  const data = json as Record<string, unknown>;

  if (data.kind !== CURRENT_KIND && !LEGACY_KINDS.includes(data.kind as string)) {
    if (isRawDiagramShape(data)) {
      const diagram = data as unknown as Diagram;
      const version: Version = { numero: 0, diagramma: diagram, descrizione: "Diagramma importato", origine: "manuale", autore: "Utente", data: new Date().toISOString() };
      return { diagram, versions: [version], index: 0 };
    }
    throw new Error("Il file non è un diagramma Atlas valido (né nel formato con storico versioni, né come diagramma grezzo con bands/entities/edges).");
  }
  if (data.formatVersion !== 1) {
    throw new Error(`Versione di formato non supportata: ${String(data.formatVersion)}. Questa versione dell'app gestisce solo il formato 1.`);
  }
  const versions = data.versions;
  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error("Il file non contiene uno storico versioni valido.");
  }
  const index = data.index;
  if (typeof index !== "number" || index < 0 || index >= versions.length) {
    throw new Error("Il file contiene un indice di versione corrente non valido.");
  }
  const diagram = (versions[index] as Version | undefined)?.diagramma;
  if (!diagram) {
    throw new Error("La versione corrente indicata nel file non contiene un diagramma.");
  }
  return { diagram, versions: versions as Version[], index, title: typeof data.title === "string" ? data.title : undefined };
}
