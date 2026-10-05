import type { Diagram, FlowStepRaw } from "../types/diagram";
import type { Command } from "../commands/types";
import type { DeletableKind } from "../commands/commands";
import { addBand, addEdge, addEntity, addEntityModule, addFlow, addTechnology, deleteElement, deleteEntityModule, moveEntity, updateEdge, updateEntity, updateEntityModule } from "../commands/commands";
import { DEFAULT_ENTITY_HEIGHT, clampEntityPosition, midpointOfPath, orthogonalEdgePath } from "../diagram/geometry";
import { monogram, slugify, uniqueId } from "../diagram/ids";
import type { AnthropicTool } from "./anthropicClient";

export interface ChatTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  execute: (input: Record<string, unknown>, diagram: Diagram) => Command;
}

function requireEntity(diagram: Diagram, id: string) {
  const entity = diagram.entities.find((e) => e.id === id);
  if (!entity) throw new Error(`Nessuna entità con id "${id}".`);
  return entity;
}

function requireBand(diagram: Diagram, label: string) {
  const band = diagram.bands.find((b) => b.l === label);
  if (!band) throw new Error(`Nessun contenitore con etichetta "${label}".`);
  return band;
}

function requireModule(diagram: Diagram, entityId: string, moduleId: string) {
  const entity = requireEntity(diagram, entityId);
  const module = entity.mods?.find((m) => m.id === moduleId);
  if (!module) throw new Error(`Nessun dettaglio con id "${moduleId}" nell'entità "${entityId}".`);
  return module;
}

function requireEdge(diagram: Diagram, id: string) {
  const edge = diagram.edges.find((e) => e.id === id);
  if (!edge) throw new Error(`Nessun collegamento con id "${id}".`);
  return edge;
}

function findEdgeBetween(diagram: Diagram, aId: string, bId: string): string | null {
  const edge = diagram.edges.find((e) => (e.a === aId && e.b === bId) || (e.a === bId && e.b === aId));
  return edge?.id ?? null;
}

const toolAddEntity: ChatTool = {
  name: "addEntity",
  description: "Aggiunge una nuova entità (servizio, sistema, componente) a un contenitore esistente del diagramma.",
  input_schema: {
    type: "object",
    properties: {
      nome: { type: "string", description: "Nome dell'entità" },
      banda: { type: "string", description: "Etichetta esatta del contenitore in cui inserirla" },
      sottotitolo: { type: "string", description: "Sottotitolo opzionale" },
      descrizione: { type: "string", description: "Descrizione opzionale" },
      x: { type: "number", description: "Posizione X opzionale; se omessa viene calcolata in coda al contenitore" },
      y: { type: "number", description: "Posizione Y opzionale; se omessa viene calcolata in coda al contenitore" },
    },
    required: ["nome", "banda"],
  },
  execute(input, diagram) {
    const nome = String(input.nome ?? "").trim();
    const bandaLabel = String(input.banda ?? "");
    if (!nome) throw new Error("Il nome dell'entità non può essere vuoto.");
    const band = requireBand(diagram, bandaLabel);
    const id = uniqueId(slugify(nome), (candidate) => diagram.entities.some((e) => e.id === candidate));

    let x: number;
    let y: number;
    if (typeof input.x === "number" && typeof input.y === "number") {
      const placed = clampEntityPosition(band, input.x, input.y);
      x = placed.x;
      y = placed.y;
    } else {
      const inBand = diagram.entities.filter((e) => e.band === band.l).length;
      const placed = clampEntityPosition(band, band.x + 24, band.y + 48 + inBand * (DEFAULT_ENTITY_HEIGHT + 16));
      x = placed.x;
      y = placed.y;
    }

    const sottotitolo = typeof input.sottotitolo === "string" ? input.sottotitolo.trim() : "";
    const descrizione = typeof input.descrizione === "string" ? input.descrizione.trim() : "";

    return addEntity({
      id,
      n: nome,
      band: band.l,
      x,
      y,
      mono: monogram(nome),
      s: sottotitolo ? [sottotitolo] : undefined,
      desc: descrizione || undefined,
    });
  },
};

const toolMoveEntity: ChatTool = {
  name: "moveEntity",
  description: "Sposta un'entità esistente a una nuova posizione, eventualmente in un altro contenitore.",
  input_schema: {
    type: "object",
    properties: {
      entityId: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      banda: { type: "string", description: "Nuovo contenitore, opzionale" },
    },
    required: ["entityId", "x", "y"],
  },
  execute(input, diagram) {
    const entityId = String(input.entityId ?? "");
    requireEntity(diagram, entityId);
    const banda = typeof input.banda === "string" && input.banda ? input.banda : undefined;
    if (banda) requireBand(diagram, banda);
    return moveEntity(entityId, Math.round(Number(input.x)), Math.round(Number(input.y)), banda);
  },
};

const toolAddBand: ChatTool = {
  name: "addBand",
  description: "Aggiunge un nuovo contenitore (banda) al diagramma.",
  input_schema: {
    type: "object",
    properties: {
      etichetta: { type: "string" },
      x: { type: "number", description: "Posizione X opzionale" },
      y: { type: "number", description: "Posizione Y opzionale" },
    },
    required: ["etichetta"],
  },
  execute(input, diagram) {
    const etichetta = String(input.etichetta ?? "").trim();
    if (!etichetta) throw new Error("L'etichetta del contenitore non può essere vuota.");
    let x = typeof input.x === "number" ? input.x : 0;
    let y = typeof input.y === "number" ? input.y : 0;
    if (typeof input.x !== "number" || typeof input.y !== "number") {
      const rightmost = diagram.bands.reduce((max, b) => Math.max(max, b.x + b.w), 0);
      x = rightmost + 60;
      y = 0;
    }
    return addBand({ l: etichetta, x: Math.round(x), y: Math.round(y), w: 280, h: 160 });
  },
};

const toolAddEdge: ChatTool = {
  name: "addEdge",
  description: "Collega due entità esistenti con una freccia.",
  input_schema: {
    type: "object",
    properties: {
      entityIdA: { type: "string" },
      entityIdB: { type: "string" },
      etichetta: { type: "string" },
      bidirezionale: { type: "boolean" },
    },
    required: ["entityIdA", "entityIdB"],
  },
  execute(input, diagram) {
    const aId = String(input.entityIdA ?? "");
    const bId = String(input.entityIdB ?? "");
    const a = requireEntity(diagram, aId);
    const b = requireEntity(diagram, bId);
    const etichetta = typeof input.etichetta === "string" ? input.etichetta.trim() : "";
    const bidirezionale = input.bidirezionale === true;
    const d = orthogonalEdgePath(a, b);
    const [midX, midY] = midpointOfPath(d);
    const id = uniqueId(`e-${a.id}-${b.id}`, (candidate) => diagram.edges.some((e) => e.id === candidate));
    return addEdge({
      id,
      a: a.id,
      b: b.id,
      d,
      l: etichetta || undefined,
      lx: etichetta ? midX : undefined,
      ly: etichetta ? midY : undefined,
      bi: bidirezionale || undefined,
    });
  },
};

const toolUpdateEdge: ChatTool = {
  name: "updateEdge",
  description: "Modifica l'etichetta o la bidirezionalità di un collegamento esistente.",
  input_schema: {
    type: "object",
    properties: {
      edgeId: { type: "string" },
      etichetta: { type: "string" },
      bidirezionale: { type: "boolean" },
    },
    required: ["edgeId"],
  },
  execute(input, diagram) {
    const edgeId = String(input.edgeId ?? "");
    requireEdge(diagram, edgeId);
    const patch: { l?: string; bi?: boolean } = {};
    if (typeof input.etichetta === "string") patch.l = input.etichetta.trim() || undefined;
    if (typeof input.bidirezionale === "boolean") patch.bi = input.bidirezionale || undefined;
    return updateEdge(edgeId, patch);
  },
};

interface FlowStepInput {
  da: string;
  a: string;
  etichetta: string;
  direzione?: 1 | -1;
}

const toolAddFlow: ChatTool = {
  name: "addFlow",
  description: "Aggiunge un nuovo flusso (sequenza di passi tra entità) al diagramma.",
  input_schema: {
    type: "object",
    properties: {
      titolo: { type: "string" },
      gruppo: { type: "string" },
      dove: { type: "string", description: "Dove si svolge il flusso (sistemi coinvolti)" },
      passi: {
        type: "array",
        items: {
          type: "object",
          properties: {
            da: { type: "string", description: "Id entità di partenza del passo" },
            a: { type: "string", description: "Id entità di arrivo del passo" },
            etichetta: { type: "string", description: "Descrizione del passo" },
            direzione: { type: "integer", enum: [1, -1], description: "1 se il collegamento va letto da 'da' verso 'a', -1 se al contrario" },
          },
          required: ["da", "a", "etichetta"],
        },
      },
    },
    required: ["titolo", "gruppo", "dove", "passi"],
  },
  execute(input, diagram) {
    const titolo = String(input.titolo ?? "").trim();
    if (!titolo) throw new Error("Il titolo del flusso non può essere vuoto.");
    const gruppo = String(input.gruppo ?? "").trim() || "Flussi";
    const dove = String(input.dove ?? "").trim();
    const passi = Array.isArray(input.passi) ? (input.passi as FlowStepInput[]) : [];
    if (passi.length === 0) throw new Error("Un flusso deve avere almeno un passo.");

    const h: FlowStepRaw[] = passi.map((step) => {
      requireEntity(diagram, step.da);
      requireEntity(diagram, step.a);
      const edgeId = findEdgeBetween(diagram, step.da, step.a);
      const direzione = step.direzione === -1 ? -1 : 1;
      return [step.da, step.a, edgeId, direzione, String(step.etichetta ?? "").trim()];
    });

    const id = uniqueId(`f-${slugify(titolo)}`, (candidate) => diagram.flows.some((f) => f.id === candidate));
    return addFlow({ id, g: gruppo, t: titolo, w: dove, h });
  },
};

const toolAddTechnology: ChatTool = {
  name: "addTechnology",
  description: "Aggiunge una nuova tecnologia e la collega a una o più entità esistenti.",
  input_schema: {
    type: "object",
    properties: {
      nome: { type: "string" },
      gruppo: { type: "string" },
      descrizione: { type: "string" },
      entityIds: { type: "array", items: { type: "string" } },
    },
    required: ["nome", "gruppo", "descrizione", "entityIds"],
  },
  execute(input, diagram) {
    const nome = String(input.nome ?? "").trim();
    if (!nome) throw new Error("Il nome della tecnologia non può essere vuoto.");
    const entityIds = Array.isArray(input.entityIds) ? input.entityIds.map(String) : [];
    entityIds.forEach((id) => requireEntity(diagram, id));
    const id = uniqueId(slugify(nome), (candidate) => diagram.technologies.some((t) => t.id === candidate));
    return addTechnology({
      id,
      g: String(input.gruppo ?? "").trim() || "Tecnologie",
      n: nome,
      mono: monogram(nome),
      e: entityIds,
      d: String(input.descrizione ?? "").trim(),
    });
  },
};

const toolUpdateEntity: ChatTool = {
  name: "updateEntity",
  description: "Modifica nome, sottotitolo o descrizione di un'entità esistente.",
  input_schema: {
    type: "object",
    properties: {
      entityId: { type: "string" },
      nome: { type: "string" },
      sottotitolo: { type: "string" },
      descrizione: { type: "string" },
    },
    required: ["entityId"],
  },
  execute(input, diagram) {
    const entityId = String(input.entityId ?? "");
    requireEntity(diagram, entityId);
    const patch: { n?: string; s?: string[]; desc?: string } = {};
    if (typeof input.nome === "string" && input.nome.trim()) patch.n = input.nome.trim();
    if (typeof input.sottotitolo === "string") patch.s = input.sottotitolo.trim() ? [input.sottotitolo.trim()] : undefined;
    if (typeof input.descrizione === "string") patch.desc = input.descrizione.trim() || undefined;
    return updateEntity(entityId, patch);
  },
};

const toolAddEntityModule: ChatTool = {
  name: "addEntityModule",
  description: "Aggiunge un dettaglio (modulo interno, livello Component) a un'entità: una riga con titolo e sottotitolo disegnata dentro il suo rettangolo.",
  input_schema: {
    type: "object",
    properties: {
      entityId: { type: "string" },
      titolo: { type: "string" },
      sottotitolo: { type: "string" },
    },
    required: ["entityId", "titolo"],
  },
  execute(input, diagram) {
    const entityId = String(input.entityId ?? "");
    requireEntity(diagram, entityId);
    const titolo = String(input.titolo ?? "").trim();
    if (!titolo) throw new Error("Il titolo del dettaglio non può essere vuoto.");
    const sottotitolo = typeof input.sottotitolo === "string" ? input.sottotitolo.trim() : "";
    const entity = requireEntity(diagram, entityId);
    const moduleId = uniqueId(`${entityId}.${slugify(titolo)}`, (candidate) => entity.mods?.some((m) => m.id === candidate) ?? false);
    return addEntityModule(entityId, { id: moduleId, t: titolo, s: sottotitolo });
  },
};

const toolUpdateEntityModule: ChatTool = {
  name: "updateEntityModule",
  description: "Modifica titolo o sottotitolo di un dettaglio esistente di un'entità.",
  input_schema: {
    type: "object",
    properties: {
      entityId: { type: "string" },
      moduleId: { type: "string" },
      titolo: { type: "string" },
      sottotitolo: { type: "string" },
    },
    required: ["entityId", "moduleId"],
  },
  execute(input, diagram) {
    const entityId = String(input.entityId ?? "");
    const moduleId = String(input.moduleId ?? "");
    requireModule(diagram, entityId, moduleId);
    const patch: { t?: string; s?: string } = {};
    if (typeof input.titolo === "string" && input.titolo.trim()) patch.t = input.titolo.trim();
    if (typeof input.sottotitolo === "string") patch.s = input.sottotitolo.trim();
    return updateEntityModule(entityId, moduleId, patch);
  },
};

const toolDeleteEntityModule: ChatTool = {
  name: "deleteEntityModule",
  description: "Elimina un dettaglio esistente di un'entità.",
  input_schema: {
    type: "object",
    properties: {
      entityId: { type: "string" },
      moduleId: { type: "string" },
    },
    required: ["entityId", "moduleId"],
  },
  execute(input, diagram) {
    const entityId = String(input.entityId ?? "");
    const moduleId = String(input.moduleId ?? "");
    requireModule(diagram, entityId, moduleId);
    return deleteEntityModule(entityId, moduleId);
  },
};

const DELETABLE_KINDS: DeletableKind[] = ["entity", "edge", "flow", "technology"];

const toolDeleteElement: ChatTool = {
  name: "deleteElement",
  description: "Elimina un'entità, un collegamento, un flusso o una tecnologia dal diagramma.",
  input_schema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: DELETABLE_KINDS },
      id: { type: "string" },
    },
    required: ["kind", "id"],
  },
  execute(input, diagram) {
    const kind = String(input.kind ?? "") as DeletableKind;
    if (!DELETABLE_KINDS.includes(kind)) throw new Error(`Tipo di elemento sconosciuto: "${input.kind}".`);
    const id = String(input.id ?? "");
    const exists =
      kind === "entity"
        ? diagram.entities.some((e) => e.id === id)
        : kind === "edge"
          ? diagram.edges.some((e) => e.id === id)
          : kind === "flow"
            ? diagram.flows.some((f) => f.id === id)
            : diagram.technologies.some((t) => t.id === id);
    if (!exists) throw new Error(`Nessun elemento di tipo "${kind}" con id "${id}".`);
    return deleteElement(kind, id);
  },
};

export const CHAT_TOOLS: ChatTool[] = [
  toolAddEntity,
  toolMoveEntity,
  toolAddBand,
  toolAddEdge,
  toolUpdateEdge,
  toolAddFlow,
  toolAddTechnology,
  toolUpdateEntity,
  toolAddEntityModule,
  toolUpdateEntityModule,
  toolDeleteEntityModule,
  toolDeleteElement,
];

export function toAnthropicTools(tools: ChatTool[] = CHAT_TOOLS): AnthropicTool[] {
  return tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
}

export function findChatTool(name: string): ChatTool | undefined {
  return CHAT_TOOLS.find((t) => t.name === name);
}
