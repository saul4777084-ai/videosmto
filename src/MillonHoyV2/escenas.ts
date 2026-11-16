// Versión 2 de "¿Qué pasaría si hoy ganaras un millón de dólares?", con el estilo del video de referencia
// del usuario (fondo azul noche con cuadrícula, objetos brillantes, marcador LED, mano que toca, cámara en
// movimiento y subtítulos finos). Mismo texto y tiempos que src/MillonHoy: la misma voz sirve para las dos.
import { Escena } from "../comun/tipos";
import { ESCENAS as BASE, Ilustracion } from "../MillonHoy/escenas";

export { DURACION_TOTAL, ESCENARIOS } from "../MillonHoy/escenas";
export type { Escenario, Ilustracion } from "../MillonHoy/escenas";

// En esta versión todas las escenas llevan subtítulos (como la referencia)
export const ESCENAS: Escena<Ilustracion>[] = BASE.map((e) => ({ ...e, sinSubtitulos: false }));
