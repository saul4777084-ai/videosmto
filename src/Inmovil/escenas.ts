// "¿Qué le pasa a tu cuerpo si no te mueves en todo un mes?" (versión de 1 minuto) — voz del usuario, tiempos de
// scripts/alinear_voz.py → tiempos.json. Datos: estudios de reposo en cama (Dallas 1966 y su seguimiento de 1996,
// Kortebein 2007, Hamburg 2007) y NASA (ejercicio en la estación espacial).
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "piel"
  | "sangre"
  | "mareo"
  | "piernas"
  | "huesos"
  | "astronautas"
  | "coagulos"
  | "dallas"
  | "edad"
  | "vuelve"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "piel", gesto: "senalar", clave: ["dos", "piel:"] },
  { ilustracion: "sangre", gesto: "alarma", clave: ["sangre", "10"], enfasis: { palabra: "10", x: 50, y: 48, zoom: 1.12 } },
  { ilustracion: "mareo", gesto: "explicar", clave: ["mareas."] },
  { ilustracion: "piernas", gesto: "alarma", clave: ["derriten:", "kilo"], enfasis: { palabra: "kilo", x: 50, y: 55, zoom: 1.12 } },
  { ilustracion: "huesos", gesto: "senalar", clave: ["calcio,", "astronauta."] },
  { ilustracion: "astronautas", gesto: "presentar", clave: ["dos", "ejercicio"] },
  { ilustracion: "coagulos", gesto: "alarma", clave: ["peligroso:", "coágulos."], enfasis: { palabra: "coágulos.", x: 50, y: 50, zoom: 1.12 } },
  { ilustracion: "dallas", gesto: "leer", clave: ["1966,", "tres"] },
  { ilustracion: "edad", gesto: "alarma", clave: ["treinta", "edad"], enfasis: { palabra: "edad", x: 50, y: 45, zoom: 1.12 } },
  { ilustracion: "vuelve", gesto: "explicar", clave: ["vuelve.", "ocho"] },
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
