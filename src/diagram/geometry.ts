import type { Band, Diagram, Entity, Point } from "../types/diagram";

export const ENTITY_WIDTH = 240;
export const DEFAULT_ENTITY_HEIGHT = 72;
const MODULE_ROW_HEIGHT = 48;
const MODULE_LIST_BASE_HEIGHT = 66; // intestazione + divisore fino alla prima riga di dettaglio

// Altezza che serve al rettangolo dell'entità per contenere tutte le righe "dettaglio" (EntityModule)
// senza che straripino fuori dal bordo (vedi il rendering in DiagramCanvas.tsx, stesse costanti 48/66).
export function entityHeightForModuleCount(count: number): number {
  return count > 0 ? MODULE_LIST_BASE_HEIGHT + count * MODULE_ROW_HEIGHT : DEFAULT_ENTITY_HEIGHT;
}

const BAND_PAD_X = 30;
const BAND_PAD_TOP = 40;
const BAND_PAD_BOTTOM = 30;

export function pathFromPoints(points: Point[]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

// Dimensione minima dell'area di disegno (e dell'svg: width/height sono anche i pixel renderizzati,
// non solo il viewBox): senza un minimo, un diagramma vuoto o quasi vuoto avrebbe una tela di pochi
// pixel, troppo piccola per cliccarci sopra (es. "Nuovo contenitore" su un diagramma appena creato).
const MIN_CANVAS_WIDTH = 1400;
const MIN_CANVAS_HEIGHT = 900;

// Bounding box del contenuto, incluse le coordinate negative (un contenitore ridimensionato verso
// l'alto o verso sinistra può avere x/y < 0). Il viewBox dell'svg parte da (minX,minY), non da (0,0),
// altrimenti tutto ciò che sta prima dell'origine finirebbe fuori dall'area visibile.
export function computeBounds(diagram: Diagram) {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  diagram.bands.forEach((b) => {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  });
  diagram.entities.forEach((e) => {
    minX = Math.min(minX, e.x);
    minY = Math.min(minY, e.y);
    maxX = Math.max(maxX, e.x + ENTITY_WIDTH);
    maxY = Math.max(maxY, e.y + (e.h ?? DEFAULT_ENTITY_HEIGHT));
  });
  const pad = 40;
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.max(maxX - minX + pad * 2, MIN_CANVAS_WIDTH),
    height: Math.max(maxY - minY + pad * 2, MIN_CANVAS_HEIGHT),
  };
}

export function entityCenter(e: Entity): Point {
  return [e.x + ENTITY_WIDTH / 2, e.y + (e.h ?? DEFAULT_ENTITY_HEIGHT) / 2];
}

// Punto in cui il segmento dal centro di `e` verso (tx,ty) incrocia il bordo del rettangolo dell'entità.
export function borderPoint(e: Entity, tx: number, ty: number): Point {
  const [cx, cy] = entityCenter(e);
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const hw = ENTITY_WIDTH / 2;
  const hh = (e.h ?? DEFAULT_ENTITY_HEIGHT) / 2;
  const scale = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity);
  return [cx + dx * scale, cy + dy * scale];
}

// Percorso del collegamento con angoli retti quando le due entità non sono allineate: una riga dritta
// se condividono un intervallo di righe/colonne, altrimenti un gomito a 90°. Pensato per i collegamenti
// generati dall'editor (nuovi o ricalcolati dopo uno spostamento), non per sostituire un instradamento
// disegnato a mano.
export function orthogonalEdgePath(a: Entity, b: Entity): Point[] {
  const aH = a.h ?? DEFAULT_ENTITY_HEIGHT;
  const bH = b.h ?? DEFAULT_ENTITY_HEIGHT;
  const aTop = a.y;
  const aBottom = a.y + aH;
  const aLeft = a.x;
  const aRight = a.x + ENTITY_WIDTH;
  const bTop = b.y;
  const bBottom = b.y + bH;
  const bLeft = b.x;
  const bRight = b.x + ENTITY_WIDTH;
  const [acx, acy] = entityCenter(a);
  const [bcx, bcy] = entityCenter(b);
  const dx = bcx - acx;
  const dy = bcy - acy;

  const rowOverlap = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);
  const colOverlap = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);

  if (rowOverlap > 4) {
    const y = (Math.max(aTop, bTop) + Math.min(aBottom, bBottom)) / 2;
    return dx >= 0
      ? [
          [aRight, y],
          [bLeft, y],
        ]
      : [
          [aLeft, y],
          [bRight, y],
        ];
  }
  if (colOverlap > 4) {
    const x = (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2;
    return dy >= 0
      ? [
          [x, aBottom],
          [x, bTop],
        ]
      : [
          [x, aTop],
          [x, bBottom],
        ];
  }

  if (Math.abs(dx) >= Math.abs(dy)) {
    const x1 = dx >= 0 ? aRight : aLeft;
    const x2 = dx >= 0 ? bLeft : bRight;
    const midX = (x1 + x2) / 2;
    return [
      [x1, acy],
      [midX, acy],
      [midX, bcy],
      [x2, bcy],
    ];
  }
  const y1 = dy >= 0 ? aBottom : aTop;
  const y2 = dy >= 0 ? bTop : bBottom;
  const midY = (y1 + y2) / 2;
  return [
    [acx, y1],
    [acx, midY],
    [bcx, midY],
    [bcx, y2],
  ];
}

// Punto medio di un percorso: per un segmento singolo è il centro, per un gomito il centro del
// segmento centrale (dove di solito si posiziona l'etichetta senza sovrapporsi ai nodi).
export function midpointOfPath(points: Point[]): Point {
  const mid = Math.floor(points.length / 2);
  const [ax, ay] = points[mid - 1];
  const [bx, by] = points[mid];
  return [(ax + bx) / 2, (ay + by) / 2];
}

export function sameBandLabel(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Allarga (mai restringe) una banda quanto basta per includere l'entità indicata, con un margine.
// Usata solo quando si aggiunge un'entità: spostare o eliminare non deve mai ridimensionare la banda.
export function growBandToInclude(band: Band, entity: Entity): Band {
  const h = entity.h ?? DEFAULT_ENTITY_HEIGHT;
  const left = entity.x - BAND_PAD_X;
  const top = entity.y - BAND_PAD_TOP;
  const right = entity.x + ENTITY_WIDTH + BAND_PAD_X;
  const bottom = entity.y + h + BAND_PAD_BOTTOM;
  const x = Math.min(band.x, left);
  const y = Math.min(band.y, top);
  const maxRight = Math.max(band.x + band.w, right);
  const maxBottom = Math.max(band.y + band.h, bottom);
  return { ...band, x, y, w: maxRight - x, h: maxBottom - y };
}

// Adatta ogni banda al rettangolo che racchiude le entità assegnate (per etichetta), con un margine.
// Il confronto ignora maiuscole/spazi: entità e bande sono testo libero (anche da chat), non un id rigido.
// Le bande senza entità mantengono le dimensioni correnti: non c'è un contenuto da cui dedurle.
export function recomputeBandBounds(diagram: Diagram): Band[] {
  return diagram.bands.map((b) => {
    const members = diagram.entities.filter((e) => sameBandLabel(e.band, b.l));
    if (members.length === 0) return b;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    members.forEach((e) => {
      const h = e.h ?? DEFAULT_ENTITY_HEIGHT;
      minX = Math.min(minX, e.x);
      minY = Math.min(minY, e.y);
      maxX = Math.max(maxX, e.x + ENTITY_WIDTH);
      maxY = Math.max(maxY, e.y + h);
    });
    return {
      ...b,
      x: minX - BAND_PAD_X,
      y: minY - BAND_PAD_TOP,
      w: maxX - minX + BAND_PAD_X * 2,
      h: maxY - minY + BAND_PAD_TOP + BAND_PAD_BOTTOM,
    };
  });
}

export function bandAt(diagram: Diagram, x: number, y: number): Band | undefined {
  return diagram.bands.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
}

// Posizione (angolo in alto a sinistra) che tiene l'intera card dentro la banda indicata.
export function clampEntityPosition(band: Band, x: number, y: number, height = DEFAULT_ENTITY_HEIGHT): { x: number; y: number } {
  const minX = band.x + 12;
  const maxX = band.x + band.w - ENTITY_WIDTH - 12;
  const minY = band.y + 36;
  const maxY = band.y + band.h - height - 12;
  return {
    x: Math.round(maxX >= minX ? Math.min(Math.max(x, minX), maxX) : band.x + 12),
    y: Math.round(maxY >= minY ? Math.min(Math.max(y, minY), maxY) : band.y + 36),
  };
}

export const MIN_BAND_WIDTH = 140;
export const MIN_BAND_HEIGHT = 110;

export interface BandResizeEdges {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
}

// Applica un ridimensionamento manuale del bordo (dx,dy = spostamento del puntatore in unità svg)
// rispettando i lati coinvolti e una dimensione minima.
export function resizeBand(start: Band, edges: BandResizeEdges, dx: number, dy: number): Band {
  let x = start.x;
  let y = start.y;
  let w = start.w;
  let h = start.h;
  if (edges.left) {
    x = start.x + dx;
    w = start.w - dx;
  }
  if (edges.right) {
    w = start.w + dx;
  }
  if (edges.top) {
    y = start.y + dy;
    h = start.h - dy;
  }
  if (edges.bottom) {
    h = start.h + dy;
  }
  if (w < MIN_BAND_WIDTH) {
    if (edges.left) x = start.x + start.w - MIN_BAND_WIDTH;
    w = MIN_BAND_WIDTH;
  }
  if (h < MIN_BAND_HEIGHT) {
    if (edges.top) y = start.y + start.h - MIN_BAND_HEIGHT;
    h = MIN_BAND_HEIGHT;
  }
  return { ...start, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

// Indici di tutti i segmenti di un percorso ortogonale (0..n-2): ognuno si può trascinare
// perpendicolarmente alla sua direzione (dragEdgeSegment). Quelli che toccano un'entità (il primo e
// l'ultimo) restano "agganciati" perché il trascinamento è vincolato dentro il bordo dell'entità.
export function allEdgeSegments(points: Point[]): number[] {
  const result: number[] = [];
  for (let i = 0; i <= points.length - 2; i++) result.push(i);
  return result;
}

export function segmentOrientation(points: Point[], i: number): "h" | "v" {
  const [x1, y1] = points[i];
  const [x2, y2] = points[i + 1];
  return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? "h" : "v";
}

export function segmentMidpoint(points: Point[], i: number): Point {
  const [x1, y1] = points[i];
  const [x2, y2] = points[i + 1];
  return [(x1 + x2) / 2, (y1 + y2) / 2];
}

const EDGE_ANCHOR_MARGIN = 14;

// Trascina un segmento perpendicolarmente alla sua direzione: sposta entrambi i suoi estremi lungo
// quell'asse, il che allunga/accorcia i segmenti adiacenti senza mai romperne l'ortogonalità (sono per
// costruzione perpendicolari al segmento trascinato). Se un estremo tocca un'entità (primo/ultimo
// segmento del percorso), lo spostamento viene vincolato a restare dentro il bordo di quell'entità,
// cosicché il collegamento resti visibilmente agganciato invece di staccarsene.
export function dragEdgeSegment(points: Point[], segIndex: number, dx: number, dy: number, anchorA?: Entity, anchorB?: Entity): Point[] {
  const orientation = segmentOrientation(points, segIndex);
  const n = points.length;
  let lo = -Infinity;
  let hi = Infinity;
  const clampTo = (entity: Entity) => {
    if (orientation === "h") {
      lo = Math.max(lo, entity.y + EDGE_ANCHOR_MARGIN);
      hi = Math.min(hi, entity.y + (entity.h ?? DEFAULT_ENTITY_HEIGHT) - EDGE_ANCHOR_MARGIN);
    } else {
      lo = Math.max(lo, entity.x + EDGE_ANCHOR_MARGIN);
      hi = Math.min(hi, entity.x + ENTITY_WIDTH - EDGE_ANCHOR_MARGIN);
    }
  };
  if (segIndex === 0 && anchorA) clampTo(anchorA);
  if (segIndex === n - 2 && anchorB) clampTo(anchorB);

  const next = points.map(([x, y]) => [x, y] as Point);
  if (orientation === "h") {
    let y = points[segIndex][1] + dy;
    if (lo <= hi) y = Math.min(Math.max(y, lo), hi);
    const ry = Math.round(y);
    next[segIndex] = [next[segIndex][0], ry];
    next[segIndex + 1] = [next[segIndex + 1][0], ry];
  } else {
    let x = points[segIndex][0] + dx;
    if (lo <= hi) x = Math.min(Math.max(x, lo), hi);
    const rx = Math.round(x);
    next[segIndex] = [rx, next[segIndex][1]];
    next[segIndex + 1] = [rx, next[segIndex + 1][1]];
  }
  return next;
}

// Trova l'entità sotto un punto (stesso criterio di bandAt, per l'esperienza "trascina la punta della
// freccia su un'altra entità per riagganciarla").
export function entityAt(diagram: Diagram, x: number, y: number): Entity | undefined {
  return diagram.entities.find((e) => x >= e.x && x <= e.x + ENTITY_WIDTH && y >= e.y && y <= e.y + (e.h ?? DEFAULT_ENTITY_HEIGHT));
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ALIGN_THRESHOLD = 6;

function rectEdgesX(r: Rect): number[] {
  return [r.x, r.x + r.w / 2, r.x + r.w];
}

function rectEdgesY(r: Rect): number[] {
  return [r.y, r.y + r.h / 2, r.y + r.h];
}

export interface AlignResult {
  dx: number;
  dy: number;
  vLines: number[];
  hLines: number[];
}

// Calcola lo scarto da applicare alla posizione trascinata per "agganciarsi" (snap) al bordo o al
// centro, in orizzontale e verticale, dell'elemento allineabile più vicino entro la soglia; restituisce
// anche le linee guida da disegnare (quelle effettivamente coincidenti dopo lo snap).
export function computeAlignment(moving: Rect, others: Rect[], threshold = ALIGN_THRESHOLD): AlignResult {
  const mx = rectEdgesX(moving);
  const my = rectEdgesY(moving);
  let bestDx = 0;
  let bestDxDist = threshold;
  let bestDy = 0;
  let bestDyDist = threshold;
  for (const o of others) {
    for (const ox of rectEdgesX(o)) {
      for (const m of mx) {
        const d = ox - m;
        if (Math.abs(d) <= bestDxDist) {
          bestDxDist = Math.abs(d);
          bestDx = d;
        }
      }
    }
    for (const oy of rectEdgesY(o)) {
      for (const m of my) {
        const d = oy - m;
        if (Math.abs(d) <= bestDyDist) {
          bestDyDist = Math.abs(d);
          bestDy = d;
        }
      }
    }
  }
  const dx = bestDxDist < threshold ? bestDx : 0;
  const dy = bestDyDist < threshold ? bestDy : 0;
  const snappedMx = mx.map((v) => v + dx);
  const snappedMy = my.map((v) => v + dy);
  const vLines = new Set<number>();
  const hLines = new Set<number>();
  for (const o of others) {
    for (const ox of rectEdgesX(o)) if (snappedMx.some((v) => Math.abs(v - ox) < 0.5)) vLines.add(ox);
    for (const oy of rectEdgesY(o)) if (snappedMy.some((v) => Math.abs(v - oy) < 0.5)) hLines.add(oy);
  }
  return { dx, dy, vLines: [...vLines], hLines: [...hLines] };
}

// Scarto da applicare al trascinamento di UN bordo del contenitore (vedi resizeBand) per agganciarlo
// alla coordinata allineabile più vicina: a differenza di computeAlignment, qui si confronta solo il
// singolo bordo che si sta muovendo (non l'intero rettangolo), altrimenti un lato fermo verrebbe
// "tirato" dall'allineamento di un lato che nessuno sta trascinando.
export function snapBandResize(band: Band, edges: BandResizeEdges, dx: number, dy: number, others: Rect[], threshold = ALIGN_THRESHOLD): AlignResult {
  const xs = others.flatMap(rectEdgesX);
  const ys = others.flatMap(rectEdgesY);
  const snapAxis = (target: number, candidates: number[]): { delta: number; line?: number } => {
    let best = threshold;
    let line: number | undefined;
    for (const c of candidates) {
      const d = Math.abs(c - target);
      if (d <= best) {
        best = d;
        line = c;
      }
    }
    return { delta: line !== undefined ? line - target : 0, line };
  };

  let sdx = dx;
  let sdy = dy;
  const vLines: number[] = [];
  const hLines: number[] = [];
  if (edges.left) {
    const s = snapAxis(band.x + dx, xs);
    sdx = dx + s.delta;
    if (s.line !== undefined) vLines.push(s.line);
  } else if (edges.right) {
    const s = snapAxis(band.x + band.w + dx, xs);
    sdx = dx + s.delta;
    if (s.line !== undefined) vLines.push(s.line);
  }
  if (edges.top) {
    const s = snapAxis(band.y + dy, ys);
    sdy = dy + s.delta;
    if (s.line !== undefined) hLines.push(s.line);
  } else if (edges.bottom) {
    const s = snapAxis(band.y + band.h + dy, ys);
    sdy = dy + s.delta;
    if (s.line !== undefined) hLines.push(s.line);
  }
  return { dx: sdx, dy: sdy, vLines, hLines };
}

export type EdgeSide = "t" | "r" | "b" | "l";

function clamp(v: number, lo: number, hi: number): number {
  return lo <= hi ? Math.min(Math.max(v, lo), hi) : lo;
}

// Lato dell'entità più vicino a un punto (in proporzione alle semidimensioni, cosicché card larghe e
// basse non "preferiscano" sempre alto/basso): usato per scegliere a quale lato riagganciare la punta
// di un collegamento trascinata sopra l'entità.
export function sideOfPoint(e: Entity, x: number, y: number): EdgeSide {
  const h = e.h ?? DEFAULT_ENTITY_HEIGHT;
  const cx = e.x + ENTITY_WIDTH / 2;
  const cy = e.y + h / 2;
  const rx = (x - cx) / (ENTITY_WIDTH / 2);
  const ry = (y - cy) / (h / 2);
  if (Math.abs(rx) >= Math.abs(ry)) return rx >= 0 ? "r" : "l";
  return ry >= 0 ? "b" : "t";
}

// Punto sul lato indicato dell'entità, il più vicino possibile a `along` (coordinata lungo quel lato)
// ma tenuto dentro il bordo con lo stesso margine di dragEdgeSegment.
export function sidePoint(e: Entity, side: EdgeSide, along: number): Point {
  const h = e.h ?? DEFAULT_ENTITY_HEIGHT;
  const m = EDGE_ANCHOR_MARGIN;
  switch (side) {
    case "l":
      return [e.x, clamp(along, e.y + m, e.y + h - m)];
    case "r":
      return [e.x + ENTITY_WIDTH, clamp(along, e.y + m, e.y + h - m)];
    case "t":
      return [clamp(along, e.x + m, e.x + ENTITY_WIDTH - m), e.y];
    case "b":
      return [clamp(along, e.x + m, e.x + ENTITY_WIDTH - m), e.y + h];
  }
}

// Lato dell'entità su cui giace (si assume) un punto già calcolato come bordo, per dedurre da quale
// lato "esce" l'estremo non toccato dal riaggancio.
export function sideOfBorderPoint(e: Entity, [x, y]: Point): EdgeSide {
  const h = e.h ?? DEFAULT_ENTITY_HEIGHT;
  if (Math.abs(x - e.x) < 0.5) return "l";
  if (Math.abs(x - (e.x + ENTITY_WIDTH)) < 0.5) return "r";
  if (Math.abs(y - e.y) < 0.5) return "t";
  if (Math.abs(y - (e.y + h)) < 0.5) return "b";
  // punto non esattamente sul bordo (percorso modificato a mano): stima dal lato più vicino.
  return sideOfPoint(e, x, y);
}

// Percorso ortogonale tra due punti già ancorati a un lato esplicito di un'entità, rispettando la
// direzione di uscita di ciascun lato (es. un lato "r" deve lasciare il punto andando verso destra).
// Usata per il riaggancio manuale, dove il lato è scelto dall'utente invece che dedotto dalla posizione
// reciproca delle due entità (quello che fa orthogonalEdgePath).
export function orthogonalPathBetween(pa: Point, sideA: EdgeSide, pb: Point, sideB: EdgeSide): Point[] {
  const [ax, ay] = pa;
  const [bx, by] = pb;
  const aHoriz = sideA === "l" || sideA === "r";
  const bHoriz = sideB === "l" || sideB === "r";

  if (aHoriz && bHoriz && Math.abs(ay - by) < 0.5) return [pa, pb];
  if (!aHoriz && !bHoriz && Math.abs(ax - bx) < 0.5) return [pa, pb];

  if (aHoriz && bHoriz) {
    const midX = (ax + bx) / 2;
    return [pa, [midX, ay], [midX, by], pb];
  }
  if (!aHoriz && !bHoriz) {
    const midY = (ay + by) / 2;
    return [pa, [ax, midY], [bx, midY], pb];
  }
  return aHoriz ? [pa, [bx, ay], pb] : [pa, [ax, by], pb];
}

export function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const ctm = svg.getScreenCTM?.();
  if (!ctm) return { x: clientX, y: clientY };
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}
