// Dati finti per la lista progetti e la dashboard di progetto (punto 5 del piano in CLAUDE.md).
// Un solo diagramma ("architettura-ecommerce-bc") ha dati reali, caricati dallo store; tutti gli
// altri progetti/diagrammi servono solo a popolare le schermate prima di collegare un vero backend.

export interface MockDiagramSummary {
  id: string;
  name: string;
  sub: string;
  level: "Context" | "Container" | "Component" | "Deployment";
  ver: string;
  adr: number;
  updated: string;
  hasData: boolean;
}

export interface MockDoc {
  ext: string;
  name: string;
  where: string;
}

export interface MockProject {
  id: string;
  mono: string;
  name: string;
  fullName: string;
  client: string;
  bu: string;
  architect: string;
  role: "Modifica" | "Lettura";
  updated: string;
  mine: boolean;
  diagrams: MockDiagramSummary[];
  docs: MockDoc[];
}

export const REAL_DIAGRAM_ID = "architettura-ecommerce-bc";

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "ecommerce-b2c",
    mono: "EC",
    name: "E-commerce B2C",
    fullName: "E-commerce B2C integrato con Business Central",
    client: "[Cliente] · Business Central",
    bu: "[Business unit]",
    architect: "[Nome]",
    role: "Modifica",
    updated: "ieri",
    mine: true,
    diagrams: [
      { id: REAL_DIAGRAM_ID, name: "Architettura E-commerce BC", sub: "Vista completa · 11 flussi, 19 entità", level: "Container", ver: "v1", adr: 4, updated: "30 set 2026", hasData: true },
      { id: "ec-contesto", name: "Contesto di sistema", sub: "Landscape del cliente", level: "Context", ver: "v2", adr: 1, updated: "22 set 2026", hasData: false },
      { id: "ec-deployment", name: "Deployment Azure", sub: "Ambienti staging e produzione", level: "Deployment", ver: "v1", adr: 2, updated: "18 set 2026", hasData: false },
    ],
    docs: [
      { ext: "DOCX", name: "Analisi funzionale e-commerce", where: "SharePoint · Documenti" },
      { ext: "XLSX", name: "Matrice integrazioni BC", where: "SharePoint · Documenti" },
      { ext: "PDF", name: "Specifiche API BRT", where: "SharePoint · Fornitori" },
      { ext: "ONE", name: "Sviluppi › Interfacce", where: "OneNote del team" },
      { ext: "ONE", name: "Sviluppi › Webhook giacenze", where: "OneNote del team" },
      { ext: "DOCX", name: "Verbale kick-off", where: "SharePoint · Riunioni" },
    ],
  },
  {
    id: "portale-agenti-b2b",
    mono: "PA",
    name: "Portale agenti B2B",
    fullName: "Portale agenti B2B integrato con Business Central",
    client: "[Cliente] · Business Central",
    bu: "[Business unit]",
    architect: "[Nome]",
    role: "Modifica",
    updated: "3 giorni fa",
    mine: true,
    diagrams: [
      { id: "pa-architettura", name: "Architettura portale agenti", sub: "Vista completa", level: "Container", ver: "v1", adr: 2, updated: "27 set 2026", hasData: false },
      { id: "pa-contesto", name: "Contesto di sistema", sub: "Landscape del cliente", level: "Context", ver: "v1", adr: 0, updated: "20 set 2026", hasData: false },
    ],
    docs: [
      { ext: "DOCX", name: "Analisi funzionale portale agenti", where: "SharePoint · Documenti" },
      { ext: "ONE", name: "Sviluppi › Autenticazione agenti", where: "OneNote del team" },
    ],
  },
  {
    id: "integrazione-wms",
    mono: "WM",
    name: "Integrazione WMS",
    fullName: "Integrazione WMS",
    client: "[Cliente] · Business Central",
    bu: "[Business unit]",
    architect: "[Nome]",
    role: "Lettura",
    updated: "1 settimana fa",
    mine: false,
    diagrams: [{ id: "wm-architettura", name: "Architettura integrazione WMS", sub: "Vista completa", level: "Container", ver: "v1", adr: 2, updated: "24 set 2026", hasData: false }],
    docs: [{ ext: "XLSX", name: "Matrice flussi di magazzino", where: "SharePoint · Documenti" }],
  },
  {
    id: "migrazione-nav-bc",
    mono: "MG",
    name: "Migrazione NAV → BC",
    fullName: "Migrazione NAV → Business Central",
    client: "[Cliente] · Dynamics NAV",
    bu: "[Business unit]",
    architect: "[Nome]",
    role: "Lettura",
    updated: "2 settimane fa",
    mine: false,
    diagrams: [
      { id: "mg-contesto", name: "Contesto di sistema", sub: "Landscape ante/post migrazione", level: "Context", ver: "v3", adr: 3, updated: "16 set 2026", hasData: false },
      { id: "mg-deployment", name: "Deployment ambienti", sub: "Staging e produzione", level: "Deployment", ver: "v2", adr: 2, updated: "10 set 2026", hasData: false },
      { id: "mg-componenti", name: "Componenti di migrazione", sub: "Dettaglio ETL", level: "Component", ver: "v1", adr: 1, updated: "2 set 2026", hasData: false },
    ],
    docs: [
      { ext: "PDF", name: "Piano di migrazione", where: "SharePoint · Documenti" },
      { ext: "XLSX", name: "Mappatura tabelle NAV → BC", where: "SharePoint · Documenti" },
    ],
  },
  {
    id: "data-platform-vendite",
    mono: "DW",
    name: "Data platform vendite",
    fullName: "Data platform vendite",
    client: "[Cliente] · Azure",
    bu: "[Business unit]",
    architect: "[Nome]",
    role: "Modifica",
    updated: "1 mese fa",
    mine: true,
    diagrams: [{ id: "dw-architettura", name: "Architettura data platform", sub: "Vista completa", level: "Container", ver: "v1", adr: 3, updated: "1 set 2026", hasData: false }],
    docs: [{ ext: "DOCX", name: "Analisi requisiti reportistica", where: "SharePoint · Documenti" }],
  },
  {
    id: "app-presenze",
    mono: "HR",
    name: "App presenze",
    fullName: "App presenze",
    client: "[Cliente] · Power Platform",
    bu: "[Business unit]",
    architect: "[Nome]",
    role: "Lettura",
    updated: "2 mesi fa",
    mine: false,
    diagrams: [{ id: "hr-architettura", name: "Architettura app presenze", sub: "Vista completa", level: "Container", ver: "v1", adr: 0, updated: "15 ago 2026", hasData: false }],
    docs: [],
  },
];

export function findProject(id: string): MockProject | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id);
}

export function findDiagram(project: MockProject, diagramId: string): MockDiagramSummary | undefined {
  return project.diagrams.find((d) => d.id === diagramId);
}
