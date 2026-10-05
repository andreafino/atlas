import logosData from "@iconify-json/logos/icons.json";

export interface IconOption {
  id: string;
  label: string;
}

interface IconifyIcon {
  body: string;
  width?: number;
  height?: number;
  hidden?: boolean;
}

const icons = logosData.icons as Record<string, IconifyIcon>;
const defaultWidth = logosData.width ?? 24;
const defaultHeight = logosData.height ?? 24;

function humanize(name: string): string {
  return name
    .split("-")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

// Icone marcate "hidden" nel set sono alias/varianti deprecate: escluse dall'elenco di ricerca,
// ma restano risolvibili se già salvate in un diagramma esistente.
export const LOGOS_CATALOG: IconOption[] = Object.keys(icons)
  .filter((name) => !icons[name].hidden)
  .map((name) => ({ id: `logos:${name}`, label: humanize(name) }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function iconifyDataUri(name: string): string | null {
  const icon = icons[name];
  if (!icon) return null;
  const w = icon.width ?? defaultWidth;
  const h = icon.height ?? defaultHeight;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${icon.body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
