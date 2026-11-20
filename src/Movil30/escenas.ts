// "¿Qué le pasa a tu cuerpo si dejas el móvil 30 días?" (tono sarcástico) — tiempos de scripts/alinear_voz.py → tiempos.json.
// Mientras tiempos.json lleve "provisional" (voz local de prueba), el reel va sin voz; al alinear la del usuario, suena.
// Datos: Asurion 2019 (96 veces/día), Drouin 2012 (vibraciones fantasma, 89 %), Chang 2015 (pantallas y melatonina),
// Hansraj 2014 (27 kg a 60°), Ward 2017 («brain drain»), Castelo et al. 2025, PNAS Nexus (467 personas, 2 semanas, 91 %).
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "respira"
  | "veces"
  | "dia1"
  | "dia2"
  | "dia3"
  | "casino"
  | "sueno"
  | "cuello"
  | "mesa"
  | "estudio"
  | "noventa"
  | "joven"
  | "dia30"
  | "recaida"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "respira", gesto: "cruzar", clave: ["respira.", "todavía."] },
  { ilustracion: "veces", gesto: "contar", clave: ["96", "sano."], enfasis: { palabra: "96", x: 50, y: 45, zoom: 1.12 } },
  { ilustracion: "dia1", gesto: "senalar", clave: ["uno:", "bolsillo…"] },
  { ilustracion: "dia2", gesto: "alarma", clave: ["fantasma.", "nueve"] },
  { ilustracion: "dia3", gesto: "negar", clave: ["Felicidades,", "abstinencia"], enfasis: { palabra: "abstinencia", x: 50, y: 55, zoom: 1.12 } },
  { ilustracion: "casino", gesto: "explicar", clave: ["casino:", "premio,"] },
  { ilustracion: "sueno", gesto: "presentar", clave: ["duermes", "melatonina,"] },
  { ilustracion: "cuello", gesto: "senalar", clave: ["agachada", "27"], enfasis: { palabra: "27", x: 50, y: 45, zoom: 1.12 } },
  { ilustracion: "mesa", gesto: "contar", clave: ["concentras", "apagado,"] },
  { ilustracion: "estudio", gesto: "leer", clave: ["2025,", "467"] },
  { ilustracion: "noventa", gesto: "presentar", clave: ["91", "algo:"], enfasis: { palabra: "91", x: 50, y: 45, zoom: 1.12 } },
  { ilustracion: "joven", gesto: "explicar", clave: ["diez", "cremas"] },
  { ilustracion: "dia30", gesto: "presentar", clave: ["gente…", "simpáticos."] },
  { ilustracion: "recaida", gesto: "negar", clave: ["300", "antes."] },
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
