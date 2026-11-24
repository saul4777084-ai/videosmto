// "¿Qué le pasa a tu cuerpo si pasas 18 días atrapado en una cueva, a oscuras?" — tiempos de scripts/alinear_voz.py → tiempos.json.
// Mientras tiempos.json lleve "provisional" (scripts/tiempos_sin_voz.py), el reel va sin voz; al alinear la del usuario, suena.
// Datos: Michel Siffre, cueva de Scarasson (1962): contar hasta 120 le llevaba ~5 min; salió el 14 de septiembre creyendo
// que era 20 de agosto. Tham Luang (Tailandia, 2018): 12 niños y su entrenador, encontrados el día 10 a ~4 km por dos buzos
// británicos, bebían el agua que goteaba de las rocas y el entrenador (exmonje) les enseñó a meditar; salieron los 13.
// Beatriz Flamini: 500 días en una cueva de Granada (2021-2023); al salir creía que llevaba 160-170.
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "oscuridad"
  | "humedad"
  | "reloj"
  | "siffre"
  | "calendario"
  | "alucina"
  | "agua"
  | "grasa"
  | "mito1"
  | "mito2"
  | "thamluang"
  | "meditar"
  | "buzos"
  | "flamini"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "oscuridad", gesto: "negar", clave: ["negro", "total,", "nunca"] },
  { ilustracion: "humedad", gesto: "explicar", clave: ["100", "robando", "calor."] },
  { ilustracion: "reloj", gesto: "explicar", clave: ["reloj", "interno", "alargan"] },
  { ilustracion: "siffre", gesto: "leer", clave: ["Michel", "Siffre", "cinco."], enfasis: { palabra: "cinco.", x: 50, y: 50, zoom: 1.12 } },
  { ilustracion: "calendario", gesto: "presentar", clave: ["agosto…", "septiembre."] },
  { ilustracion: "alucina", gesto: "alarma", clave: ["inventa", "luces"] },
  { ilustracion: "agua", gesto: "contar", clave: ["agua:", "3", "semanas."] },
  { ilustracion: "grasa", gesto: "explicar", clave: ["grasa", "cetonas."] },
  { ilustracion: "mito1", gesto: "negar", clave: ["salida", "ciegas.", "quieto"] },
  { ilustracion: "mito2", gesto: "negar", clave: ["charco.", "gotea"] },
  { ilustracion: "thamluang", gesto: "presentar", clave: ["12", "niños", "Tham", "Luang,"] },
  { ilustracion: "meditar", gesto: "explicar", clave: ["paredes,", "meditar"] },
  { ilustracion: "buzos", gesto: "senalar", clave: ["10,", "4", "vida."], enfasis: { palabra: "vida.", x: 50, y: 50, zoom: 1.1 } },
  { ilustracion: "flamini", gesto: "alarma", clave: ["500", "170."], enfasis: { palabra: "170.", x: 50, y: 50, zoom: 1.12 } },
  { ilustracion: "final", gesto: "presentar", clave: ["A:", "B:", "Comenta"] },
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
