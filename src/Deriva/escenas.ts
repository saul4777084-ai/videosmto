// "¿Qué le pasa a tu cuerpo si te quedas a la deriva en el mar?" — tiempos de scripts/alinear_voz.py → tiempos.json.
// Mientras tiempos.json lleve "provisional" (scripts/tiempos_sin_voz.py), el reel va sin voz; al alinear la del usuario, suena.
// Datos: el agua de mar tiene ~3,5 % de sal y el riñón no concentra más de ~2 %, así que beberla deshidrata.
// Steven Callahan (1982): 76 días en balsa en el Atlántico, destiladores solares, pescaba dorados con arpón, perdió ~1/3
// de su peso y llegó a Marie-Galante (Guadalupe). José Salvador Alvarenga: 438 días (nov 2012 – ene 2014) de Chiapas
// a Ebon (Islas Marshall), ~10.000 km; comía peces, tortugas y aves cazadas a mano y bebía lluvia.
// Manuales de supervivencia en balsa: no beber las primeras 24 h y quedarse con la embarcación.
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "sed"
  | "rinon"
  | "sol"
  | "noche"
  | "mente"
  | "callahan"
  | "peces"
  | "mito1"
  | "mito2"
  | "truco"
  | "alvarenga"
  | "comida"
  | "llegada"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "sed", gesto: "explicar", clave: ["sed:", "sal", "seca"] },
  { ilustracion: "rinon", gesto: "explicar", clave: ["riñones", "más", "3", "días."], enfasis: { palabra: "3", x: 50, y: 50, zoom: 1.12 } },
  { ilustracion: "sol", gesto: "alarma", clave: ["sombra:", "rebota", "heridas"] },
  { ilustracion: "noche", gesto: "cruzar", clave: ["noche,", "tiritas", "trópico."] },
  { ilustracion: "mente", gesto: "alarma", clave: ["cerebro", "barcos", "existen."] },
  { ilustracion: "callahan", gesto: "leer", clave: ["Steven", "Callahan", "76", "destiladores"] },
  { ilustracion: "peces", gesto: "contar", clave: ["arpón", "tercio", "vivo"], enfasis: { palabra: "vivo", x: 50, y: 50, zoom: 1.1 } },
  { ilustracion: "mito1", gesto: "negar", clave: ["mar", "Falso:", "deshidrata."] },
  { ilustracion: "mito2", gesto: "negar", clave: ["nadar", "quedarte", "balsa:"] },
  { ilustracion: "truco", gesto: "contar", clave: ["primer", "nada.", "lluvia."] },
  { ilustracion: "alvarenga", gesto: "presentar", clave: ["récord:", "Alvarenga,", "438"], enfasis: { palabra: "438", x: 50, y: 50, zoom: 1.12 } },
  { ilustracion: "comida", gesto: "contar", clave: ["peces,", "tortugas", "pájaros", "manos,"] },
  { ilustracion: "llegada", gesto: "senalar", clave: ["México", "Marshall,", "10.000", "Vivo."], enfasis: { palabra: "Vivo.", x: 50, y: 50, zoom: 1.12 } },
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
