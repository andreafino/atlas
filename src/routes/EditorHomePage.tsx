import { useRef } from "react";
import { DiagramViewer } from "../diagram/DiagramViewer";
import { EMPTY_DIAGRAM } from "../diagram/emptyDiagram";
import { useDiagramStore } from "../store/useDiagramStore";

// Fuori da Teams l'app non apre la lista progetti (dati finti, SPEC.md §3): mostra direttamente
// un editor vuoto, usabile da solo con "Apri file"/"Salva" nella barra strumenti.
export function EditorHomePage() {
  const diagram = useDiagramStore((s) => s.diagram);
  const hydrate = useDiagramStore((s) => s.hydrate);
  const hydrated = useRef(false);

  if (!hydrated.current) {
    hydrated.current = true;
    hydrate(
      [{ numero: 0, diagramma: EMPTY_DIAGRAM, descrizione: "Nuovo diagramma", origine: "manuale", autore: "Utente", data: new Date().toISOString() }],
      0
    );
  }

  return (
    <DiagramViewer
      diagram={diagram}
      inTeams={false}
      title="Nuovo diagramma"
      subtitle="Editor locale · usa «Apri file» nella barra strumenti per caricare un diagramma"
    />
  );
}
