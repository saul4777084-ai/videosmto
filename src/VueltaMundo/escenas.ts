// "La primera vuelta al mundo" (Magallanes y Elcano) — voz alineada palabra por palabra.
// Los tiempos salen de scripts/alinear_voz.py → tiempos.json (y scripts de números → ver README del reel en Reel.tsx)
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import type { Ilustracion } from "./Ilustraciones";
import alineado from "./tiempos.json";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "zarpan", gesto: "senalar", clave: ["1519,", "cinco", "Magallanes."] },
  { ilustracion: "especias", gesto: "explicar", clave: ["especias", "oeste,", "fortuna."] },
  { ilustracion: "atlantico", gesto: "senalar", clave: ["Atlántico", "Sudamérica", "paso."] },
  { ilustracion: "motin", gesto: "alarma", clave: ["Patagonia", "motín,", "piedad."] },
  { ilustracion: "naufragio", gesto: "negar", clave: ["naufragó", "tormenta,", "cuatro."] },
  { ilustracion: "estrecho", gesto: "senalar", clave: ["estrecho", "nombre,", "desertó"] },
  { ilustracion: "pacifico", gesto: "presentar", clave: ["tranquilo", "Pacífico."] },
  { ilustracion: "inmenso", gesto: "explicar", clave: ["inmenso:", "tres", "meses"] },
  { ilustracion: "hambre", gesto: "alarma", clave: ["cuero,", "serrín", "ratas,", "escorbuto"] },
  { ilustracion: "mactan", gesto: "negar", clave: ["Filipinas,", "murió", "Lapulapu."], enfasis: { palabra: "murió", x: 50, y: 45, zoom: 1.14 } },
  { ilustracion: "quema", gesto: "cruzar", clave: ["quemar"] },
  { ilustracion: "molucas", gesto: "contar", clave: ["Molucas", "clavo,", "Trinidad"] },
  { ilustracion: "elcano", gesto: "presentar", clave: ["Elcano", "Victoria,", "última"] },
  { ilustracion: "regreso", gesto: "senalar", clave: ["Índico", "África", "portugueses."] },
  { ilustracion: "llegada", gesto: "contar", clave: ["1522", "Sanlúcar.", "18."], enfasis: { palabra: "Solo", x: 50, y: 50, zoom: 1.15 } },
  { ilustracion: "calendario", gesto: "leer", clave: ["extraño:", "día"] },
  { ilustracion: "escudo", gesto: "presentar", clave: ["escudo:", "globo", "primero"] },
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

const normal = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export type Escenario = {
  dur: number; // frames de la escena
  en: (palabra: string, n?: number) => number; // frame (local) en que se dice esa palabra
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
