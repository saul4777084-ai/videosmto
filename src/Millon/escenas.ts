// "¿Qué pasaría si recibieras un millón de dólares hoy?" — reel 3D (three.js) con avatar en la esquina.
// Si existe voz alineada (tiempos.json de scripts/alinear_voz.py) se usan sus tiempos; si no, duraciones fijas.
import { duracionDe, Escena, framesDe, Gesto } from "../comun/tipos";
import guion from "./guion.json";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "impuestos"
  | "gastos"
  | "ruina"
  | "rapido"
  | "deudas"
  | "fondo"
  | "invertir"
  | "trabaja"
  | "secreto"
  | "final";

const BASE: { ilustracion: Ilustracion; segundos: number; gesto: Gesto; clave: string[] }[] = [
  { ilustracion: "gancho", segundos: 3.6, gesto: "senalar", clave: ["millón", "dólares?"] },
  { ilustracion: "impuestos", segundos: 3.4, gesto: "explicar", clave: ["impuestos", "tercio."] },
  { ilustracion: "gastos", segundos: 4.4, gesto: "contar", clave: ["casa", "auto", "viajes."] },
  { ilustracion: "ruina", segundos: 4.6, gesto: "alarma", clave: ["cuidado:", "ruina"] },
  { ilustracion: "rapido", segundos: 4.2, gesto: "negar", clave: ["fácil,", "rápido"] },
  { ilustracion: "deudas", segundos: 3.2, gesto: "presentar", clave: ["inteligente:", "deudas."] },
  { ilustracion: "fondo", segundos: 2.8, gesto: "explicar", clave: ["fondo", "emergencia."] },
  { ilustracion: "invertir", segundos: 5.4, gesto: "contar", clave: ["invierte", "siete", "duplica"] },
  { ilustracion: "trabaja", segundos: 3.4, gesto: "presentar", clave: ["trabaja", "descansas."] },
  { ilustracion: "secreto", segundos: 3.6, gesto: "negar", clave: ["importante:", "cuentes"] },
  { ilustracion: "final", segundos: 4.4, gesto: "saludar", clave: ["primero?", "comentarios."] },
];

type Alineado = { duracion: number; frases: { texto: string; segundos: number; tiempos: number[] }[] };
const voz = alineado as Alineado;
export const CON_VOZ = voz.frases.length === BASE.length;

export const ESCENAS: Escena<Ilustracion>[] = BASE.map((b, i) => ({
  texto: (guion as string[])[i],
  segundos: CON_VOZ ? voz.frases[i].segundos : b.segundos,
  tiempos: CON_VOZ ? voz.frases[i].tiempos : undefined,
  ilustracion: b.ilustracion,
  gesto: b.gesto,
  clave: b.clave,
}));

export const DURACION_TOTAL = CON_VOZ ? Math.ceil(voz.duracion * 30) : duracionDe(ESCENAS);

const normal = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Escenario de cada ilustración: su duración y en qué frame (local) se dice cada palabra
export type Escenario = { dur: number; en: (palabra: string) => number };

export const ESCENARIOS = Object.fromEntries(
  ESCENAS.map((e) => {
    const dur = framesDe(e.segundos);
    const palabras = e.texto.split(" ");
    const porPalabra = (dur * 0.78) / palabras.length;
    const en = (p: string) => {
      const k = palabras.findIndex((w) => normal(w) === normal(p));
      if (k < 0) throw new Error(`"${p}" no está en: ${e.texto}`);
      return Math.round(e.tiempos ? e.tiempos[k] * 30 : k * porPalabra);
    };
    return [e.ilustracion, { dur, en }];
  }),
) as Record<Ilustracion, Escenario>;
