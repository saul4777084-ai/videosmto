// "Alejandro Magno" — mapa plano dibujado (aspecto de Napoleón) con el motor «Tierra». Sin avatar (vídeo de mapas).
// Voz: «Gerardo» (ElevenLabs, eleven_v4), alineada con alinear_voz.py sobre guion.json (la frase del 323 corregida a mano).
// Datos: nace en Pela (Macedonia) en el 356 a. C.; Aristóteles fue su maestro desde el 343; rey en el 336, con 20 años,
// al morir asesinado su padre Filipo II; cruza el Helesponto en el 334 con unos 37.000 hombres (Gránico); vence a Darío III
// en Isos (333), que huye; Egipto lo acoge como faraón (332) y funda Alejandría (331); Gaugamela (331): Darío huye otra vez
// y el Imperio aqueménida se derrumba; toma Babilonia y quema Persépolis (330); vence a Poro y sus elefantes en el
// Hidaspes (326); el ejército se amotina en el Hífasis y regresa; muere en Babilonia en junio del 323 a. C., con 32 años;
// imperio de ~5,2 millones de km²; invicto en batalla. Los límites por etapas son aproximados (recortados con la costa).
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "nace"
  | "rey"
  | "asia"
  | "isos"
  | "egipto"
  | "gaugamela"
  | "persepolis"
  | "india"
  | "motin"
  | "muerte"
  | "maximo"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "nace", gesto: "senalar", clave: ["356", "Alejandro"] },
  { ilustracion: "rey", gesto: "presentar", clave: ["Aristóteles,", "rey."] },
  { ilustracion: "asia", gesto: "senalar", clave: ["Asia", "40.000"] },
  { ilustracion: "isos", gesto: "alarma", clave: ["Isos", "Darío,", "huyó"] },
  { ilustracion: "egipto", gesto: "presentar", clave: ["faraón,", "Alejandría."] },
  { ilustracion: "gaugamela", gesto: "explicar", clave: ["Gaugamela", "derrumbó."] },
  { ilustracion: "persepolis", gesto: "negar", clave: ["Babilonia", "Persépolis,"] },
  { ilustracion: "india", gesto: "senalar", clave: ["India", "elefantes."] },
  { ilustracion: "motin", gesto: "negar", clave: ["negó", "volver."] },
  { ilustracion: "muerte", gesto: "explicar", clave: ["323", "32", "años."] },
  { ilustracion: "maximo", gesto: "presentar", clave: ["5", "millones", "ni", "una", "batalla."] },
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
        // con voz, lo que entra con la última palabra de la frase se adelanta: que se vea antes del corte
        if (palabras[k] === buscada && ++vistos === n) return Math.min(Math.round((e.tiempos?.[k] ?? 0) * 30), framesDe(e.segundos) - 14);
      }
      throw new Error(`"${palabra}" no está en: ${e.texto}`);
    };
    return [e.ilustracion, { dur: framesDe(e.segundos), en }];
  }),
) as Record<Ilustracion, Escenario>;
