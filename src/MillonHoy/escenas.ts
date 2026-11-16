// "¿Qué pasaría si hoy ganaras un millón de dólares?" — reel 2D con avatar en la esquina inferior DERECHA.
// Voz: scripts/voz_local.py guion.json → public/voz/millon-hoy.mp3
// Tiempos: scripts/alinear_voz.py → tiempos.json (si no existen, duraciones fijas)
import { duracionDe, Escena, framesDe, Gesto } from "../comun/tipos";
import guion from "./guion.json";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "grito"
  | "telefono"
  | "impuestos"
  | "gastos"
  | "loteria"
  | "deudas"
  | "emergencias"
  | "invertir"
  | "interes"
  | "secreto"
  | "final";

const BASE: { ilustracion: Ilustracion; segundos: number; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean }[] = [
  { ilustracion: "gancho", segundos: 3, gesto: "senalar", clave: ["millón", "dólares?"], sinSubtitulos: true },
  { ilustracion: "grito", segundos: 4.6, gesto: "alarma", clave: ["corazón", "gritar."] },
  { ilustracion: "telefono", segundos: 4.8, gesto: "explicar", clave: ["teléfono", "amigos."] },
  { ilustracion: "impuestos", segundos: 5.1, gesto: "negar", clave: ["impuestos", "tercio."] },
  { ilustracion: "gastos", segundos: 4.2, gesto: "contar", clave: ["mansión", "auto", "meses."] },
  { ilustracion: "loteria", segundos: 4.2, gesto: "alarma", clave: ["lotería", "problemas"] },
  { ilustracion: "deudas", segundos: 3.9, gesto: "presentar", clave: ["inteligente:", "deudas."] },
  { ilustracion: "emergencias", segundos: 3.9, gesto: "explicar", clave: ["seis", "meses", "emergencias."] },
  { ilustracion: "invertir", segundos: 4.7, gesto: "contar", clave: ["invierte", "asesor"] },
  { ilustracion: "interes", segundos: 5.3, gesto: "presentar", clave: ["cinco", "treinta", "mil"] },
  { ilustracion: "secreto", segundos: 3.9, gesto: "negar", clave: ["importante:", "cuentes"] },
  { ilustracion: "final", segundos: 4.6, gesto: "saludar", clave: ["primero?", "comentarios."], sinSubtitulos: true },
];

type Alineado = { duracion: number; frases: { texto: string; segundos: number; tiempos: number[] }[] };
const voz = alineado as Alineado;
export const CON_VOZ = voz.frases.length === BASE.length;

export const ESCENAS: Escena<Ilustracion>[] = BASE.map((b, i) => ({
  texto: (guion as string[])[i],
  segundos: CON_VOZ ? voz.frases[i].segundos + (i === BASE.length - 1 ? 0.8 : 0) : b.segundos,
  tiempos: CON_VOZ ? voz.frases[i].tiempos : undefined,
  ilustracion: b.ilustracion,
  gesto: b.gesto,
  clave: b.clave,
  sinSubtitulos: b.sinSubtitulos,
}));

export const DURACION_TOTAL = duracionDe(ESCENAS);

const normal = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// En qué frame (local de su escena) se dice cada palabra
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
