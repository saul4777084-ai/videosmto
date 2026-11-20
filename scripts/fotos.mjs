// Saca fotogramas sueltos de una composición con un solo empaquetado (más rápido que varios `remotion still`).
// Uso: node scripts/fotos.mjs COMPOSICION CARPETA_SALIDA FRAME [FRAME ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [id, salida, ...frames] = process.argv.slice(2);
fs.mkdirSync(salida, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = "/opt/pw-browsers/chromium";
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable });
for (const f of frames.map(Number)) {
  const out = path.join(salida, `${id}_${String(f).padStart(5, "0")}.png`);
  await renderStill({ composition, serveUrl, output: out, frame: f, puppeteerInstance: browser, scale: 0.5, browserExecutable });
  console.log(out);
}
await browser.close({ silent: true });
