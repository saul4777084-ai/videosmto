// Fotogramas de prueba del vídeo "Móvil 8 horas" con un solo empaquetado.
// Uso: node tools/fotos_movil.mjs <carpeta> <seg1> [seg2 ...]   (segundos del vídeo completo)
//      node tools/fotos_movil.mjs <carpeta> toma:<id>@<seg>       (segundos dentro de una toma)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [, , carpeta, ...peticiones] = process.argv;
fs.mkdirSync(carpeta, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const opciones = {gl: 'swangle'};
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
for (const p of peticiones) {
  let id = 'Movil8Horas';
  let seg = Number(p);
  if (p.startsWith('toma:')) {
    const [t, s] = p.slice(5).split('@');
    id = `Movil-${t}`;
    seg = Number(s);
  }
  const composition = await selectComposition({serveUrl, id, chromiumOptions: opciones, browserExecutable, timeoutInMilliseconds: 300000});
  const frame = Math.min(composition.durationInFrames - 1, Math.round(seg * 30));
  const salida = path.join(carpeta, `${id}-${seg.toFixed(2)}.jpg`);
  const t0 = Date.now();
  await renderStill({composition, serveUrl, frame, output: salida, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, chromiumOptions: opciones, browserExecutable, timeoutInMilliseconds: 300000});
  console.log(salida, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
}
