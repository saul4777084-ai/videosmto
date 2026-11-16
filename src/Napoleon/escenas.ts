// "¿Cómo logró Napoleón conquistar casi toda Europa?" — voz alineada palabra por palabra.
// Los tiempos salen de scripts/alinear_voz.py → tiempos.json
import { Enfasis, Escena, framesDe } from "../comun/tipos";
import type { Ilustracion } from "./Ilustraciones";
import alineado from "./tiempos.json";

// enfasis: palabra en la que se enfoca y punto de enfoque (%). Solo en los 4 momentos clave de la historia.
type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", clave: [], sinSubtitulos: true },
  { ilustracion: "corcega", clave: ["Córcega", "artillería."] },
  { ilustracion: "revolucion", clave: ["Revolución", "mérito,", "apellido."] },
  { ilustracion: "emperador", clave: ["golpe", "emperador."], enfasis: { palabra: "coronó", x: 50, y: 48, zoom: 1.12 } },
  { ilustracion: "velocidad", clave: ["velocidad:", "rápido"] },
  { ilustracion: "ligeros", clave: ["ligeros", "convoyes."] },
  { ilustracion: "cuerpos", clave: ["cuerpos", "separados", "atacar."] },
  { ilustracion: "canones", clave: ["cañones:", "rompía"] },
  { ilustracion: "austerlitz", clave: ["Austerlitz,", "Austria", "Rusia."], enfasis: { palabra: "Austerlitz,", x: 50, y: 52, zoom: 1.14 } },
  { ilustracion: "jena", clave: ["Prusia", "Jena,", "Friedland."] },
  { ilustracion: "codigo", clave: ["Código", "Civil", "leyes"] },
  { ilustracion: "hermanos", clave: ["hermanos", "reyes"] },
  { ilustracion: "imperio", clave: ["continente,", "Madrid", "Varsovia."] },
  { ilustracion: "rusia", clave: ["Rusia", "seiscientos", "mil"], enfasis: { palabra: "seiscientos", x: 50, y: 74, zoom: 1.2 } },
  { ilustracion: "invierno", clave: ["frío", "hambre", "pocos."] },
  { ilustracion: "waterloo", clave: ["1815", "Waterloo."], enfasis: { palabra: "cayó", x: 50, y: 62, zoom: 1.15 } },
  { ilustracion: "final", clave: [], sinSubtitulos: true },
];

// convierte la palabra clave en el segundo en que se dice
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
  clave: ESCENA[i].clave,
  sinSubtitulos: ESCENA[i].sinSubtitulos,
  enfasis: enfasisDe(fr.texto, fr.tiempos, ESCENA[i].enfasis),
}));

export const DURACION_TOTAL = Math.ceil(alineado.duracion * 30);

const normal = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export type Escenario = {
  dur: number; // frames de la escena
  en: (palabra: string, n?: number) => number; // frame (local) en que se dice esa palabra (n-ésima aparición)
};

// para cada escena, su duración y cuándo se dice cada palabra: así cada cosa entra al nombrarla
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
