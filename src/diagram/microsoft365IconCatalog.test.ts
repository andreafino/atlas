import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MICROSOFT365_ICON_CATALOG } from "./microsoft365IconCatalog";

// Guardia contro il disallineamento tra il catalogo generato (microsoft365IconCatalog.ts) e i file
// SVG effettivamente presenti in public/icons/ms365/ — i due vengono scritti insieme da
// scripts/import-microsoft365-icons.mjs, ma nulla impedisce a un'edit manuale futura di scollegarli.
const PUBLIC_MS365_DIR = resolve(__dirname, "../../public/icons/ms365");

function walkSvgFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkSvgFiles(full));
    else if (entry.endsWith(".svg")) out.push(full);
  }
  return out;
}

describe("MICROSOFT365_ICON_CATALOG", () => {
  it("ogni id ha un file SVG corrispondente in public/icons/", () => {
    MICROSOFT365_ICON_CATALOG.forEach((icon) => {
      const file = resolve(__dirname, "../../public/icons", `${icon.id}.svg`);
      expect(existsSync(file), `manca il file per "${icon.id}"`).toBe(true);
    });
  });

  it("ogni file in public/icons/ms365/ ha una voce corrispondente nel catalogo", () => {
    const files = walkSvgFiles(PUBLIC_MS365_DIR);
    const catalogIds = new Set(MICROSOFT365_ICON_CATALOG.map((icon) => icon.id));
    files.forEach((file) => {
      const relPath = relative(PUBLIC_MS365_DIR, file).replace(/\\/g, "/").replace(/\.svg$/, "");
      expect(catalogIds.has(`ms365/${relPath}`), `file orfano non in catalogo: ${file}`).toBe(true);
    });
  });

  it("non ci sono id duplicati", () => {
    const ids = MICROSOFT365_ICON_CATALOG.map((icon) => icon.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("non è vuoto", () => {
    expect(MICROSOFT365_ICON_CATALOG.length).toBeGreaterThan(50);
  });
});
