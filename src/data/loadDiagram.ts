import type { Diagram, Flow, FlowStep } from "../types/diagram";

// Il JSON sorgente rappresenta i passi dei flussi come tuple; qui li normalizziamo in oggetti.
export function parseFlowSteps(flow: Flow): FlowStep[] {
  return flow.h.map(([from, to, edgeId, direction, label, modules]) => ({
    from,
    to,
    edgeId,
    direction,
    label,
    modules,
  }));
}

export function loadDiagram(raw: unknown): Diagram {
  return raw as Diagram;
}

export function entityById(diagram: Diagram, id: string) {
  return diagram.entities.find((e) => e.id === id);
}

export function edgeById(diagram: Diagram, id: string) {
  return diagram.edges.find((e) => e.id === id);
}

export function bandByLabel(diagram: Diagram, label: string) {
  return diagram.bands.find((b) => b.l === label);
}

export function flowGroups(diagram: Diagram): string[] {
  return [...new Set(diagram.flows.map((f) => f.g))];
}
