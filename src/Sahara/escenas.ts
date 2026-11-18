// "¿Por qué el desierto del Sahara es tan enorme?" — voz de Gerardo (ElevenLabs) alineada palabra por palabra.
// Los tiempos salen de scripts/alinear_voz.py → tiempos.json
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import type { Ilustracion } from "./Ilustraciones";
import alineado from "./tiempos.json";

// enfasis: palabra en la que se enfoca y punto de enfoque (%). Solo en los momentos clave.
type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "presentar", clave: [], sinSubtitulos: true },
  { ilustracion: "tamano", gesto: "senalar", clave: ["nueve", "millones", "Estados", "Unidos"], enfasis: { palabra: "Estados", x: 28, y: 46, zoom: 1.12 } },
  { ilustracion: "distancia", gesto: "explicar", clave: ["cinco", "mil", "kilómetros"] },
  { ilustracion: "paises", gesto: "contar", clave: ["once", "países."] },
  { ilustracion: "cielo", gesto: "explicar", clave: ["cielo:", "ecuador,", "lluvia."] },
  { ilustracion: "seco", gesto: "senalar", clave: ["seco,", "Sahara."] },
  { ilustracion: "nubes", gesto: "negar", clave: ["calienta", "nubes."] },
  { ilustracion: "ancha", gesto: "presentar", clave: ["anchísima", "lejísimos."] },
  { ilustracion: "atlas", gesto: "senalar", clave: ["Atlas", "frenan"] },
  { ilustracion: "corriente", gesto: "explicar", clave: ["agua", "fría", "tormentas."] },
  { ilustracion: "lluvia", gesto: "alarma", clave: ["veinticinco", "litros"], enfasis: { palabra: "veinticinco", x: 50, y: 45, zoom: 1.12 } },
  { ilustracion: "arena", gesto: "negar", clave: ["cuarta", "arena.", "roca."] },
  { ilustracion: "verde", gesto: "presentar", clave: ["verde,", "lagos,", "jirafas", "hipopótamos."], enfasis: { palabra: "verde,", x: 50, y: 46, zoom: 1.12 } },
  { ilustracion: "bamboleo", gesto: "explicar", clave: ["bamboleo", "eje", "desierto."] },
  { ilustracion: "crece", gesto: "alarma", clave: ["creciendo:", "diez", "ciento"] },
  { ilustracion: "final", gesto: "saludar", clave: [], sinSubtitulos: true },
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
  gesto: ESCENA[i].gesto,
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
