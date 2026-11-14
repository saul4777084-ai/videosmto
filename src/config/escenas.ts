/**
 * Tiempos de cada escena en SEGUNDOS.
 * Cambia "inicio" y "fin" para alargar o acortar escenas.
 * Los tiempos internos de cada escena (en el campo "tomas") son relativos
 * al inicio de esa escena.
 */
export const ESCENAS = {
  // Cortes alineados con las frases de public/narracion.mp3
  intro: {inicio: 0, fin: 4.28},
  gimnasio: {inicio: 4.28, fin: 13.02, tomas: {vueltaHabitacion: 7.16}},
  ciencia: {inicio: 13.02, fin: 22.52, tomas: {habitacion: 4.25}},
  comida: {inicio: 22.52, fin: 31.92, tomas: {cinta: 6.99}},
  cronometro: {inicio: 31.92, fin: 36.61},
  tele: {inicio: 36.61, fin: 42.22, tomas: {comparacion: 2.57}},
  final: {inicio: 42.22, fin: 48.27, tomas: {cierre: 3.14}},
} as const;

export type NombreEscena = keyof typeof ESCENAS;
