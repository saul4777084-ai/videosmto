// "Hernán Cortés y la caída de Tenochtitlan" — mapa dibujado (estilo Napoleón) con el motor «Tierra», sin avatar.
// Sin voz mientras tiempos.json sea "provisional" (scripts/tiempos_sin_voz.py); con voz: scripts/alinear_voz.py.
// Datos: Cortés zarpa de Cuba en febrero de 1519 con 11 naves, ~500 soldados y 16 caballos; funda la Villa Rica de la
// Vera Cruz; hunde (barrena) sus naves; alianza con los totonacas de Cempoala y con Tlaxcala, enemiga de los mexicas;
// llega a Tenochtitlan el 8 de noviembre de 1519 (unos 200.000 habitantes, más que cualquier ciudad española de la época);
// Moctezuma lo recibe y Cortés lo apresa; Noche Triste (30 de junio de 1520): mueren cientos de españoles y miles de
// aliados; 13 bergantines botados en el lago de Texcoco; epidemia de viruela de 1520; Tenochtitlan cae el 13 de agosto
// de 1521 y sobre ella se levanta la Ciudad de México. El territorio mexica es aproximado.
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "zarpa"
  | "veracruz"
  | "barcos"
  | "aliados"
  | "tenochtitlan"
  | "moctezuma"
  | "noche"
  | "asedio"
  | "viruela"
  | "caida"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "zarpa", gesto: "senalar", clave: ["1519,", "Cuba", "11"] },
  { ilustracion: "veracruz", gesto: "senalar", clave: ["México", "Veracruz."] },
  { ilustracion: "barcos", gesto: "alarma", clave: ["volver,", "hundió"] },
  { ilustracion: "aliados", gesto: "explicar", clave: ["tlaxcaltecas,", "enemigos"] },
  { ilustracion: "tenochtitlan", gesto: "presentar", clave: ["Tenochtitlan,", "lago"] },
  { ilustracion: "moctezuma", gesto: "negar", clave: ["Moctezuma", "prisionero."] },
  { ilustracion: "noche", gesto: "alarma", clave: ["Noche", "Triste,", "cientos."] },
  { ilustracion: "asedio", gesto: "contar", clave: ["aliados", "13"] },
  { ilustracion: "viruela", gesto: "negar", clave: ["viruela"] },
  { ilustracion: "caida", gesto: "presentar", clave: ["1521", "Ciudad", "México."] },
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
