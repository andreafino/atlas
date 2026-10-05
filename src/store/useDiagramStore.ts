import raw from "../data/e-commerce-bc.json";
import { loadDiagram } from "../data/loadDiagram";
import { createDiagramStore } from "./diagramStore";

export const useDiagramStore = createDiagramStore(loadDiagram(raw));
