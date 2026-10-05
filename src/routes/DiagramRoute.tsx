import { Navigate, useParams } from "react-router-dom";
import { findDiagram, findProject } from "../data/mockProjects";
import { DiagramViewer } from "../diagram/DiagramViewer";
import { useDiagramStore } from "../store/useDiagramStore";

// Unico diagramma con dati reali per ora (REAL_DIAGRAM_ID in mockProjects.ts), caricato dallo store
// condiviso. Un id diverso (link diretto non valido) riporta alla dashboard del progetto.
export function DiagramRoute() {
  const { projectId, diagramId } = useParams<{ projectId: string; diagramId: string }>();
  const diagram = useDiagramStore((s) => s.diagram);

  const project = projectId ? findProject(projectId) : undefined;
  const summary = project && diagramId ? findDiagram(project, diagramId) : undefined;

  if (!project || !summary || !summary.hasData) return <Navigate to={`/progetti/${projectId ?? ""}`} replace />;

  return <DiagramViewer diagram={diagram} title={summary.name} subtitle={`${project.fullName} · ${summary.sub} · versione ${summary.ver}`} inTeams={true} />;
}
