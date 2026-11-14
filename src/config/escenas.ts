/**
 * Tiempos de cada escena en SEGUNDOS.
 * Cambia "inicio" y "fin" para alargar o acortar escenas.
 * Los tiempos internos de cada escena (en el campo "tomas") son relativos
 * al inicio de esa escena.
 */
export const ESCENAS = {
  // Cortes alineados con las pausas de public/narracion.mp3
  intro: {inicio: 0, fin: 5.2},
  gimnasio: {inicio: 5.2, fin: 14.5, tomas: {vueltaHabitacion: 6.0}},
  ciencia: {inicio: 14.5, fin: 28.9, tomas: {habitacion: 6.1}},
  comida: {inicio: 28.9, fin: 38.0, tomas: {cinta: 6.4}},
  cronometro: {inicio: 38.0, fin: 44.5},
  tele: {inicio: 44.5, fin: 51.6, tomas: {comparacion: 3.5}},
  final: {inicio: 51.6, fin: 59.5, tomas: {cierre: 4.3}},
} as const;

export type NombreEscena = keyof typeof ESCENAS;
