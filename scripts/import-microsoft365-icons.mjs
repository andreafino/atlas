// Importa le icone Microsoft 365 / Teams / Power Platform / Dynamics 365 (scaricate ed estratte
// dall'utente in tmp/azure-icons-src/, non versionate — stesso download ufficiale che contiene anche
// le Azure Architecture Icons, importate separatamente da import-azure-icons.mjs). Deliberatamente
// NON include tmp/azure-icons-src/v6.1.0/: è un pacchetto npm "Fluent UI System Icons" a sé (icone UI
// generiche tipo frecce/aeroplani), non un set di icone prodotto Microsoft 365.
//
// Uso: node scripts/import-microsoft365-icons.mjs

import { readdirSync, statSync, mkdirSync, copyFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_ROOT = join(ROOT, "tmp/azure-icons-src");
const PUBLIC_OUT = join(ROOT, "public/icons/ms365");
const DESIGN_OUT = join(ROOT, "design/icons/ms365");
const CATALOG_OUT = join(ROOT, "src/diagram/microsoft365IconCatalog.ts");

// Ogni cartella prodotto (icone-prodotto singole, un file = un prodotto) o cartella UI-tema (icone
// generiche ripetute in più sottocartelle stile Dark/Light/Grey, con lo stesso nome file: deduplicate
// per slug, si tiene solo la prima trovata in ordine di attraversamento).
const SOURCES = [
  { dir: null, files: ["Agent365_scalable.svg", "CopilotStudio_scalable.svg"], prefix: "" },
  { dir: "Power Platform", prefix: "power-platform" },
  { dir: "Dynamics 365 App Icons", prefix: "dynamics-365" },
  { dir: "Dynamics 365 Product Family Icons", prefix: "dynamics-365" },
  { dir: "Microsoft Blue", prefix: "ui-blue" },
  { dir: "Microsoft Purple", prefix: "ui-purple" },
  { dir: "Teams Purple", prefix: "ui-teams-purple" },
  { dir: "Planner Green", prefix: "ui-planner-green" },
  { dir: "Project Green", prefix: "ui-project-green" },
  { dir: "SharePoint Teal", prefix: "ui-sharepoint-teal" },
];

if (!existsSync(SRC_ROOT)) {
  console.error(`Cartella sorgente non trovata: ${SRC_ROOT}`);
  process.exit(1);
}

function walkSvgFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkSvgFiles(full));
    else if (st.isFile() && entry.toLowerCase().endsWith(".svg")) out.push(full);
  }
  return out;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// "PowerApps" -> "Power Apps", "Building_Gray" -> "Building"; spazi prima delle maiuscole che seguono
// una minuscola per leggibilità, poi via i suffissi di variante stile (non c'è un colore "giusto" da
// tenere nel nome quando ne teniamo solo uno).
function labelFromName(name) {
  const withoutScalable = name.replace(/_scalable$/i, "");
  const spaced = withoutScalable.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.replace(/\s+(Dark|Light|Gray|Grey)$/i, "").replace(/\s+/g, " ").trim();
}

function slugFromName(name) {
  return slugify(name.replace(/_scalable$/i, "").replace(/[_ ](Dark|Light|Gray|Grey)$/i, ""));
}

const entries = [];

for (const source of SOURCES) {
  const files = source.dir ? walkSvgFiles(join(SRC_ROOT, source.dir)) : source.files.map((f) => join(SRC_ROOT, f));
  const seenSlugs = new Set();
  for (const filePath of files) {
    const stem = basename(filePath, ".svg");
    const slug = slugFromName(stem);
    if (!slug || seenSlugs.has(slug)) continue; // stessa icona in un'altra sottocartella stile: tiene la prima
    seenSlugs.add(slug);
    const id = source.prefix ? `${source.prefix}/${slug}` : slug;
    entries.push({ id, label: labelFromName(stem), srcPath: filePath });
  }
}

mkdirSync(PUBLIC_OUT, { recursive: true });
mkdirSync(DESIGN_OUT, { recursive: true });

for (const { id, srcPath } of entries) {
  const publicDest = join(PUBLIC_OUT, `${id}.svg`);
  const designDest = join(DESIGN_OUT, `${id}.svg`);
  mkdirSync(join(publicDest, ".."), { recursive: true });
  mkdirSync(join(designDest, ".."), { recursive: true });
  copyFileSync(srcPath, publicDest);
  copyFileSync(srcPath, designDest);
}

entries.sort((a, b) => a.label.localeCompare(b.label));

const catalogSource = `// Generato da scripts/import-microsoft365-icons.mjs a partire dalle icone Microsoft 365/Teams/Power
// Platform/Dynamics 365 (tmp/azure-icons-src/, non versionata). Non modificare a mano: rilanciare lo
// script se Microsoft aggiorna il set. ${entries.length} icone.
import type { IconOption } from "./iconifyIcons";

export const MICROSOFT365_ICON_CATALOG: IconOption[] = [
${entries.map((e) => `  { id: ${JSON.stringify(`ms365/${e.id}`)}, label: ${JSON.stringify(e.label)} },`).join("\n")}
];
`;

writeFileSync(CATALOG_OUT, catalogSource);

console.log(`Importate ${entries.length} icone Microsoft 365.`);
console.log(`File SVG: ${relative(ROOT, PUBLIC_OUT)}/ e ${relative(ROOT, DESIGN_OUT)}/`);
console.log(`Catalogo: ${relative(ROOT, CATALOG_OUT)}`);
