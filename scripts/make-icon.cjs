const sharp = require("sharp");
const pngToIco = require("png-to-ico").default;
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const root = path.join(__dirname, "..");
const sourcePng = path.join(root, "public", "vector-logo.png");
const outIco = path.join(root, "build", "icon.ico");
const outWindowIcon = path.join(root, "build", "icon.png");

const sizes = [16, 32, 48, 256];
const WINDOW_ICON_SIZE = 512;
// icon.png ha molto spazio trasparente intorno al simbolo (stile icona iOS/macOS):
// lo ritagliamo e lasciamo solo un piccolo margine, altrimenti su Windows (che non
// applica un suo mascheramento) l'icona risulta piccola nella taskbar/desktop.
const MARGIN_RATIO = 0.04;

async function renderIcon(trimmed, size) {
  const inner = Math.round(size * (1 - MARGIN_RATIO * 2));
  const padStart = Math.floor((size - inner) / 2);
  const padEnd = size - inner - padStart;
  return sharp(trimmed)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: padStart, bottom: padEnd, left: padStart, right: padEnd, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  const source = fs.readFileSync(sourcePng);
  const trimmed = await sharp(source).trim().toBuffer();

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "icon-"));
  const pngPaths = await Promise.all(
    sizes.map(async (size) => {
      const outPath = path.join(tmpDir, `${size}.png`);
      fs.writeFileSync(outPath, await renderIcon(trimmed, size));
      return outPath;
    })
  );
  const ico = await pngToIco(pngPaths);
  fs.writeFileSync(outIco, ico);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("Written", outIco, ico.length, "bytes");

  const windowIcon = await renderIcon(trimmed, WINDOW_ICON_SIZE);
  fs.writeFileSync(outWindowIcon, windowIcon);
  console.log("Written", outWindowIcon, windowIcon.length, "bytes");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
