import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const ids = process.argv.length > 2 ? process.argv.slice(2) : ['Catalogo-Escenarios-3', 'Catalogo-Escenarios-4', 'Catalogo-Escenarios-1', 'Catalogo-Escenarios-2', 'Catalogo-Personajes', 'Catalogo-Expresiones', 'Catalogo-Temas', 'Catalogo-Presentador'];
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (const id of ids) {
  const composition = await selectComposition({serveUrl, id, browserExecutable: '/opt/pw-browsers/chromium'});
  await renderStill({serveUrl, composition, frame: 0, output: `out/catalogo/${id}.png`, browserExecutable: '/opt/pw-browsers/chromium'});
  console.log('ok', id);
}
