// "El Imperio mongol" — mapa plano con el motor «Tierra» (estilo de los vídeos de mapas virales).
// Sin voz: tiempos.json es "provisional" (scripts/tiempos_sin_voz.py). Si llega una voz, se alinea con alinear_voz.py.
// Datos: Temuyín nace hacia 1162; su padre Yesugei muere envenenado por los tártaros y el clan abandona a la familia;
// kurultái de 1206 (Gengis Kan); cruza la Gran Muralla y toma Zhongdu (Pekín) en 1215; arrasa Bujará y Samarcanda (1220,
// campaña de Corasmia iniciada en 1219); muere en 1227 y su tumba no se ha encontrado; Batu toma Kiev (1240) y vence en
// Mohi, Hungría (1241); Hulagu toma Bagdad (1258); Kublai completa la conquista de los Song en 1279; ~24 millones de km²
// (Sudamérica: 17,8 M); invasiones de Japón en 1274 y 1281, frenadas por tormentas («kamikaze», viento divino).
// Los límites del imperio por etapas son aproximados (recortados con la costa real).
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "nace"
  | "abandono"
  | "gengis"
  | "muralla"
  | "corasmia"
  | "muerte"
  | "europa"
  | "bagdad"
  | "maximo"
  | "japon"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "nace", gesto: "senalar", clave: ["1162", "Temuyín"] },
  { ilustracion: "abandono", gesto: "negar", clave: ["Envenenaron", "abandonó"] },
  { ilustracion: "gengis", gesto: "presentar", clave: ["1206", "Gengis", "Kan."] },
  { ilustracion: "muralla", gesto: "senalar", clave: ["Gran", "Muralla", "Pekín."] },
  { ilustracion: "corasmia", gesto: "alarma", clave: ["arrasó", "Samarcanda", "Bujará,"] },
  { ilustracion: "muerte", gesto: "explicar", clave: ["1227,", "tumba"] },
  { ilustracion: "europa", gesto: "senalar", clave: ["Kiev", "Hungría"] },
  { ilustracion: "bagdad", gesto: "negar", clave: ["Bagdad,", "joya"] },
  { ilustracion: "maximo", gesto: "presentar", clave: ["China:", "24", "millones"] },
  { ilustracion: "japon", gesto: "explicar", clave: ["Japón,", "tormentas."] },
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
  sinSubtitulos: ESCENA[i].sinSubtitulos,
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
