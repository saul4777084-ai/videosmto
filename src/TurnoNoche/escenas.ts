// "Turno de noche" (gasolinera, parte 1). Con la voz del usuario (public/voz/turno-noche.mp3):
// duración de cada escena y tiempo de cada palabra salen de tiempos.json (scripts/alinear_voz.py).
// Si se borra tiempos.json, se pone CON_VOZ = false y vuelve la versión sin voz.
import { Escena, framesDe } from "../comun/tipos";
import alineado from "./tiempos.json";

export const CON_VOZ = true;
const COLA_FINAL = 1.6; // segundos extra al final para el cierre en iris

export type Ilustracion =
  | "exterior"
  | "cartel"
  | "llaves"
  | "encargado"
  | "reloj"
  | "nudillos"
  | "puerta"
  | "cam2"
  | "cam2cara"
  | "rebobinar"
  | "campanita"
  | "cam3"
  | "saltos"
  | "vacias"
  | "pasillo"
  | "cam4"
  | "cam4pies"
  | "cristal"
  | "grito"
  | "final";

const SIN_VOZ: Escena<Ilustracion>[] = [
  { ilustracion: "exterior", segundos: 5, texto: "Primera noche trabajando en una gasolinera en mitad de la nada.", clave: ["nada."] },
  { ilustracion: "cartel", segundos: 4, texto: "La siguiente está a 80 kilómetros.", clave: ["80"] },
  { ilustracion: "llaves", segundos: 4.5, texto: "El encargado, al irse, solo te dijo una cosa:", clave: ["cosa:"] },
  { ilustracion: "encargado", segundos: 5.5, texto: "«Si a las 3:33 llaman al cristal, no abras.»", clave: ["3:33", "abras.»"] },
  { ilustracion: "reloj", segundos: 3, texto: "3:33.", clave: ["3:33."] },
  { ilustracion: "nudillos", segundos: 3.2, texto: "Toc. Toc. Toc.", clave: ["Toc."], tiempos: [0.2, 0.95, 1.7] },
  { ilustracion: "puerta", segundos: 3.8, texto: "Fuera no hay nadie.", clave: ["nadie."] },
  { ilustracion: "cam2", segundos: 6, texto: "En la cámara 2, un hombre empapado, sin coche, junto al surtidor.", clave: ["sin", "coche,"] },
  { ilustracion: "cam2cara", segundos: 4, texto: "Mirando a la cámara.", clave: ["cámara."] },
  { ilustracion: "rebobinar", segundos: 6, texto: "Rebobinas. A las 3:20 la puerta se abrió sola.", clave: ["sola."] },
  { ilustracion: "campanita", segundos: 5, texto: "Y oíste la campanita. Pensaste que era el viento.", clave: ["campanita."] },
  { ilustracion: "cam3", segundos: 5, texto: "Vuelves al directo. Ahora está dentro.", clave: ["dentro."] },
  { ilustracion: "saltos", segundos: 9, texto: "Cada vez que la imagen salta, está un pasillo más cerca.", clave: ["salta,", "cerca."] },
  { ilustracion: "vacias", segundos: 4.5, texto: "Hasta que desaparece de todas las cámaras.", clave: ["desaparece"] },
  { ilustracion: "pasillo", segundos: 5, texto: "Levantas la vista. El pasillo está vacío.", clave: ["vacío."] },
  { ilustracion: "cam4", segundos: 4.5, texto: "En la cámara de la caja te ves a ti…", clave: ["ti…"] },
  { ilustracion: "cam4pies", segundos: 6, texto: "…y a tus pies, agachado tras el mostrador, está él.", clave: ["pies,", "él."] },
  { ilustracion: "cristal", segundos: 5, texto: "Toc. Toc. Toc. Es el encargado, fuera, gritando:", clave: ["encargado,"], tiempos: [0, 0.45, 0.9, 1.6, 1.9, 2.15, 2.75, 3.15] },
  { ilustracion: "grito", segundos: 3.2, texto: "¡NO LE MIRES!", sinSubtitulos: true },
  { ilustracion: "final", segundos: 4.3, texto: "Sígueme para la parte 2.", clave: ["parte", "2."] },
];

export const ESCENAS: Escena<Ilustracion>[] = CON_VOZ
  ? SIN_VOZ.map((e, i) => {
      const fr = alineado.frases[i];
      if (fr.texto !== e.texto) throw new Error(`guion.json no coincide con la escena ${i + 1}: ${fr.texto}`);
      const ultima = i === SIN_VOZ.length - 1;
      return { ...e, segundos: fr.segundos + (ultima ? COLA_FINAL : 0), tiempos: fr.tiempos };
    })
  : SIN_VOZ;

export const DURACION_TOTAL = ESCENAS.reduce((t, e) => t + framesDe(e.segundos), 0);

// Frame (dentro de su escena) en que aparece una palabra, igual que lo calculan los subtítulos
export const en = (id: Ilustracion, palabra: string, n = 0) => {
  const e = ESCENAS.find((x) => x.ilustracion === id)!;
  const palabras = e.texto.split(" ");
  let k = -1;
  for (let i = 0, vistos = 0; i < palabras.length; i++) {
    if (palabras[i] === palabra && vistos++ === n) {
      k = i;
      break;
    }
  }
  if (k < 0) throw new Error(`"${palabra}" no está en: ${e.texto}`);
  if (e.tiempos) return Math.round(e.tiempos[k] * 30);
  return Math.round((k * framesDe(e.segundos) * 0.78) / palabras.length);
};
export const dur = (id: Ilustracion) => framesDe(ESCENAS.find((x) => x.ilustracion === id)!.segundos);
