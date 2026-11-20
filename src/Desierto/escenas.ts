// "¿Cuánto tiempo sobrevivirías perdido en el desierto a 50 grados?" — tiempos de scripts/alinear_voz.py → tiempos.json.
// Mientras tiempos.json lleve "provisional" (voz local de prueba), el reel va sin voz; al alinear la del usuario, suena.
// Datos: sudor hasta ~1,5 L/h; deshidratación 2 % / 10 %; móviles hasta ~35 °C de ambiente; Valle de la Muerte 56,7 °C
// (aire, 1913) y 93,9 °C (suelo, 1972); el parque pidió no freír huevos (2021); coche al sol ≈ +10 °C en 10 min;
// tabla de supervivencia del manual FM 21-76 del ejército de EE. UU. («ration sweat, not water»); túnicas beduinas
// (Shkolnik et al., Nature 1980); Mauro Prosperi, Marathon des Sables 1994.
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "cuerpo"
  | "sudor"
  | "cerebro"
  | "movil"
  | "valle"
  | "huevos"
  | "coche"
  | "aire"
  | "dias"
  | "mito1"
  | "mito2"
  | "noche"
  | "tunicas"
  | "prosperi"
  | "argelia"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "cuerpo", gesto: "explicar", clave: ["37", "40,"] },
  { ilustracion: "sudor", gesto: "senalar", clave: ["sudas:", "litro"] },
  { ilustracion: "cerebro", gesto: "alarma", clave: ["2", "deliras."], enfasis: { palabra: "10", x: 50, y: 45, zoom: 1.12 } },
  { ilustracion: "movil", gesto: "negar", clave: ["móvil.", "35"] },
  { ilustracion: "valle", gesto: "presentar", clave: ["56,7", "94."], enfasis: { palabra: "suelo,", x: 50, y: 80, zoom: 1.12 } },
  { ilustracion: "huevos", gesto: "explicar", clave: ["freír", "huevos"] },
  { ilustracion: "coche", gesto: "alarma", clave: ["encierres", "10"] },
  { ilustracion: "aire", gesto: "senalar", clave: ["sombra:", "coche"] },
  { ilustracion: "dias", gesto: "contar", clave: ["dos", "uno."], enfasis: { palabra: "Caminando", x: 70, y: 50, zoom: 1.1 } },
  { ilustracion: "mito1", gesto: "negar", clave: ["racionar", "sudor,"] },
  { ilustracion: "mito2", gesto: "negar", clave: ["cactus.", "vomitar,"] },
  { ilustracion: "noche", gesto: "presentar", clave: ["noche", "beduinos."] },
  { ilustracion: "tunicas", gesto: "explicar", clave: ["negras", "blancas,"] },
  { ilustracion: "prosperi", gesto: "leer", clave: ["1994,", "nueve"] },
  { ilustracion: "argelia", gesto: "alarma", clave: ["orina,", "300"], enfasis: { palabra: "300", x: 50, y: 50, zoom: 1.12 } },
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
