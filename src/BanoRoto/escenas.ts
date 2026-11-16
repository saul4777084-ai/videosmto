// Guion: "Consecuencias de un baño roto" (20 s) con la voz alineada palabra por palabra.
// Voz: scripts/voz_local.py guion.json → public/voz/bano-roto.mp3
// Tiempos: scripts/alinear_voz.py → tiempos.json
import { duracionDe, Escena, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion = "inodoro" | "fuga" | "factura" | "moho" | "danos" | "reparar";

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[] }[] = [
  { ilustracion: "inodoro", gesto: "senalar", clave: ["roto?"] },
  { ilustracion: "fuga", gesto: "alarma", clave: ["750", "litros"] },
  { ilustracion: "factura", gesto: "negar", clave: ["factura", "dispara."] },
  { ilustracion: "moho", gesto: "explicar", clave: ["hongos", "olores."] },
  { ilustracion: "danos", gesto: "contar", clave: ["pisos,", "paredes", "vecino"] },
  { ilustracion: "reparar", gesto: "presentar", clave: ["¡Arréglalo", "tiempo!"] },
];

// La voz dura ~19,5 s: la última escena se alarga para cerrar en 20 s justos.
const DURACION_OBJETIVO = 20;

export const ESCENAS: Escena<Ilustracion>[] = alineado.frases.map((fr, i, todas) => ({
  texto: fr.texto,
  segundos: i === todas.length - 1 ? DURACION_OBJETIVO - fr.inicio : fr.segundos,
  tiempos: fr.tiempos,
  ...ESCENA[i],
}));

export const DURACION_TOTAL = duracionDe(ESCENAS);
