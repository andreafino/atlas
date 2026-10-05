// Importa le Microsoft Azure Architecture Icons ufficiali (scaricate ed estratte dall'utente in
// tmp/azure-icons-src/, non versionate) nel picker icone dell'app. Uno-tantum / riutilizzabile se
// Microsoft pubblica una nuova versione del set: non fa parte della build dell'app.
//
// Uso: node scripts/import-azure-icons.mjs

import { readdirSync, statSync, mkdirSync, copyFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = join(ROOT, "tmp/azure-icons-src/Azure_Public_Service_Icons/Icons");
const PUBLIC_OUT = join(ROOT, "public/icons/azure");
const DESIGN_OUT = join(ROOT, "design/icons/azure");
const CATALOG_OUT = join(ROOT, "src/diagram/azureIconCatalog.ts");

if (!existsSync(SRC_DIR)) {
  console.error(`Cartella sorgente non trovata: ${SRC_DIR}`);
  console.error('Scarica "Download all icons" da https://learn.microsoft.com/en-us/azure/architecture/icons/ ed estrailo in tmp/azure-icons-src/.');
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

function labelFromName(name) {
  return name.replace(/[()]/g, "").replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

// Nome file atteso: "<codice numerico>[spazio]-icon-service-<Nome-Servizio>.svg" (un solo file fuori
// pattern nel set osservato, con uno spazio prima del trattino: gestito dallo stesso regex tollerante).
const FILENAME_PATTERN = /^\d+\s*-icon-service-(.+)$/i;

const files = walkSvgFiles(SRC_DIR);
const seenSlugs = new Set();
const entries = [];

for (const filePath of files) {
  const stem = basename(filePath, ".svg");
  const match = stem.match(FILENAME_PATTERN);
  const rawName = match ? match[1] : stem;
  const slug = slugify(rawName);
  if (!slug || seenSlugs.has(slug)) continue; // duplicato (stesso servizio in più categorie): tiene il primo
  seenSlugs.add(slug);
  entries.push({ slug, label: labelFromName(rawName), srcPath: filePath });
}

mkdirSync(PUBLIC_OUT, { recursive: true });
mkdirSync(DESIGN_OUT, { recursive: true });

for (const { slug, srcPath } of entries) {
  copyFileSync(srcPath, join(PUBLIC_OUT, `${slug}.svg`));
  copyFileSync(srcPath, join(DESIGN_OUT, `${slug}.svg`));
}

entries.sort((a, b) => a.label.localeCompare(b.label));

const catalogSource = `// Generato da scripts/import-azure-icons.mjs a partire dal set ufficiale Microsoft Azure
// Architecture Icons (tmp/azure-icons-src/, non versionata). Non modificare a mano: rilanciare lo
// script se Microsoft aggiorna il set. ${entries.length} icone.
import type { IconOption } from "./iconifyIcons";

export const AZURE_ICON_CATALOG: IconOption[] = [
${entries.map((e) => `  { id: ${JSON.stringify(`azure/${e.slug}`)}, label: ${JSON.stringify(e.label)} },`).join("\n")}
];
`;

writeFileSync(CATALOG_OUT, catalogSource);

console.log(`Importate ${entries.length} icone (${files.length - entries.length} duplicati scartati).`);
console.log(`File SVG: ${relative(ROOT, PUBLIC_OUT)}/ e ${relative(ROOT, DESIGN_OUT)}/`);
console.log(`Catalogo: ${relative(ROOT, CATALOG_OUT)}`);
