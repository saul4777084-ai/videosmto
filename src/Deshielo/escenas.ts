// "¿Y si se derritiera todo el hielo del planeta?" — mapas con el motor «Tierra» (satélite + alturas reales).
// Sin voz: tiempos.json es "provisional" (scripts/tiempos_sin_voz.py). Si llega una voz, se alinea con alinear_voz.py.
// Datos: si se fundiera todo el hielo terrestre el mar subiría ~70 m (USGS; ~66 m según National Geographic),
// casi todo en la Antártida (~58 m) y Groenlandia (~7 m); fundirlo todo llevaría más de 5.000 años (National Geographic);
// el nivel del mar ha subido ~21–24 cm desde 1880 y ahora sube ~4 mm/año, cada vez más rápido (NOAA, NASA).
// Alturas: Madrid ~650 m, Sevilla ~7 m, Valencia ~15 m, Ámsterdam ~0 m, Florida máx. ~105 m.
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "hielo"
  | "derrite"
  | "europa"
  | "espana"
  | "florida"
  | "sudamerica"
  | "asia"
  | "tiempo"
  | "ritmo"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "hielo", gesto: "senalar", clave: ["Antártida", "Groenlandia."] },
  { ilustracion: "derrite", gesto: "alarma", clave: ["70", "metros:", "23"] },
  { ilustracion: "europa", gesto: "negar", clave: ["Ámsterdam,", "Venecia", "Londres."] },
  { ilustracion: "espana", gesto: "explicar", clave: ["Sevilla", "Valencia.", "salvaría."] },
  { ilustracion: "florida", gesto: "alarma", clave: ["Florida", "Miami", "Cancún."] },
  { ilustracion: "sudamerica", gesto: "senalar", clave: ["Buenos", "Aires", "Amazonas", "mar"] },
  { ilustracion: "asia", gesto: "negar", clave: ["Bangladés,", "Shanghái", "Bangkok."] },
  { ilustracion: "tiempo", gesto: "presentar", clave: ["5.000", "años."] },
  { ilustracion: "ritmo", gesto: "alarma", clave: ["20", "centímetros", "rápido."] },
  { ilustracion: "final", gesto: "saludar", clave: [], sinSubtitulos: true },
];
function enfasisDe(texto: string, tiempos: number[], c?: Clave): Enfasis | undefined {
  if (!c) return undefined;
  const { palabra, ...resto } = c;
  const k = texto.split(" ").indexOf(palabra);
  if (k < 0) throw new Error(`"${palabra}" no está en: ${texto}`);
  return { en: tiempos[k], ...resto };
}

export const ESCENAS: Escena<Ilustracion>[] = alineado.frases.map((fr, i) => ({
  texto: fr.texto,
  segundos: fr.segundos,
  tiempos: fr.tiempos,
  ilustracion: ESCENA[i].ilustracion,
  gesto: ESCENA[i].gesto,
  clave: ESCENA[i].clave,
  sinSubtitulos: true, // los textos van como titulares apilados en cada escena (estilo del usuario)
  enfasis: enfasisDe(fr.texto, fr.tiempos, ESCENA[i].enfasis),
}));

export const DURACION_TOTAL = Math.ceil(alineado.duracion * 30);
export const CON_VOZ = !("provisional" in alineado);

const normal = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export type Escenario = {
  dur: number; // frames de la escena
  en: (palabra: string, n?: number) => number; // frame local en que se dice esa palabra
};

export const ESCENARIOS = Object.fromEntries(
  ESCENAS.map((e) => {
    const palabras = e.texto.split(" ").map(normal);
    const en = (palabra: string, n = 1) => {
      const buscada = normal(palabra);
      let vistos = 0;
      for (let k = 0; k < palabras.length; k++) {
        if (palabras[k] === buscada && ++vistos === n) return Math.round((e.tiempos?.[k] ?? 0) * 30);
      }
      throw new Error(`"${palabra}" no está en: ${e.texto}`);
    };
    return [e.ilustracion, { dur: framesDe(e.segundos), en }];
  }),
) as Record<Ilustracion, Escenario>;
