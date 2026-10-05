import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AZURE_ICON_CATALOG } from "./azureIconCatalog";

// Guardia contro il disallineamento tra il catalogo generato (azureIconCatalog.ts) e i file SVG
// effettivamente presenti in public/icons/azure/ — i due vengono scritti insieme da
// scripts/import-azure-icons.mjs, ma nulla impedisce a un'edit manuale futura di scollegarli.
const PUBLIC_AZURE_DIR = resolve(__dirname, "../../public/icons/azure");

describe("AZURE_ICON_CATALOG", () => {
  it("ogni id ha un file SVG corrispondente in public/icons/", () => {
    AZURE_ICON_CATALOG.forEach((icon) => {
      const file = resolve(__dirname, "../../public/icons", `${icon.id}.svg`);
      expect(existsSync(file), `manca il file per "${icon.id}"`).toBe(true);
    });
  });

  it("ogni file in public/icons/azure/ ha una voce corrispondente nel catalogo", () => {
    const files = readdirSync(PUBLIC_AZURE_DIR).filter((f) => f.endsWith(".svg"));
    const catalogIds = new Set(AZURE_ICON_CATALOG.map((icon) => icon.id));
    files.forEach((file) => {
      const slug = file.replace(/\.svg$/, "");
      expect(catalogIds.has(`azure/${slug}`), `file orfano non in catalogo: ${file}`).toBe(true);
    });
  });

  it("non ci sono id duplicati", () => {
    const ids = AZURE_ICON_CATALOG.map((icon) => icon.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("non è vuoto", () => {
    expect(AZURE_ICON_CATALOG.length).toBeGreaterThan(100);
  });
});
