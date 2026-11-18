// "¿Cuánto tiempo sobrevivirías atrapado en temperaturas bajo cero?" — tiempos de scripts/alinear_voz.py → tiempos.json
// Mientras tiempos.json lleve "provisional" (voz local de prueba), el reel va sin voz; al alinear la del usuario, suena.
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "cuerpo"
  | "hipotermia"
  | "temblor"
  | "confusion"
  | "corazon"
  | "regla"
  | "minuto"
  | "diez"
  | "hora"
  | "agua"
  | "viento"
  | "ropa"
  | "desvestir"
  | "refugio"
  | "seco"
  | "alcohol"
  | "anna"
  | "medicos"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "cuerpo", gesto: "explicar", clave: ["37", "peligro."] },
  { ilustracion: "hipotermia", gesto: "senalar", clave: ["hipotermia:", "tiemblas"] },
  { ilustracion: "temblor", gesto: "negar", clave: ["detiene.", "peor:"], enfasis: { palabra: "peor:", x: 50, y: 45, zoom: 1.12 } },
  { ilustracion: "confusion", gesto: "explicar", clave: ["confusión:", "peligro."] },
  { ilustracion: "corazon", gesto: "alarma", clave: ["28", "corazón"] },
  { ilustracion: "regla", gesto: "contar", clave: ["reloj.", "uno,", "diez,", "uno."] },
  { ilustracion: "minuto", gesto: "alarma", clave: ["minuto", "shock:"] },
  { ilustracion: "diez", gesto: "contar", clave: ["Diez", "minutos", "salir,"] },
  { ilustracion: "hora", gesto: "explicar", clave: ["hora", "desmayarte"] },
  { ilustracion: "agua", gesto: "senalar", clave: ["25", "veces"], enfasis: { palabra: "25", x: 50, y: 40, zoom: 1.12 } },
  { ilustracion: "viento", gesto: "alarma", clave: ["viento:", "congela", "diez"] },
  { ilustracion: "ropa", gesto: "explicar", clave: ["ropa", "normal,", "horas."] },
  { ilustracion: "desvestir", gesto: "cruzar", clave: ["quitan", "ropa,", "falso."], enfasis: { palabra: "quitan", x: 40, y: 60, zoom: 1.12 } },
  { ilustracion: "refugio", gesto: "presentar", clave: ["viento", "suelo:"] },
  { ilustracion: "seco", gesto: "negar", clave: ["seco,", "nieve"] },
  { ilustracion: "alcohol", gesto: "negar", clave: ["alcohol:", "enfría"] },
  { ilustracion: "anna", gesto: "leer", clave: ["1999,", "13,7", "sobrevivió."], enfasis: { palabra: "sobrevivió.", x: 50, y: 50, zoom: 1.12 } },
  { ilustracion: "medicos", gesto: "presentar", clave: [], sinSubtitulos: true },
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
