/**
 * AVATAR (poses dibujadas en public/poses/).
 * Gestos disponibles: reposo, senalar, explicar, presentar, alarma, cruzar,
 * negar, contar, saludar, leer.
 * Cada entrada indica desde qué segundo del vídeo se usa ese gesto
 * (alineado con las frases de public/narracion.mp3).
 */
export type Gesto =
  | 'reposo' | 'senalar' | 'explicar' | 'presentar' | 'alarma'
  | 'cruzar' | 'negar' | 'contar' | 'saludar' | 'leer';

export const AVATAR = {
  mostrar: true,
  /** Ancho en pantalla del lienzo de la pose (px). */
  ancho: 640,
  /** Posición: esquina inferior izquierda. */
  izquierda: -150,
  abajo: -110,
  gestos: [
    {desde: 0, gesto: 'presentar'},
    {desde: 4.28, gesto: 'explicar'},
    {desde: 11.44, gesto: 'negar'},
    {desde: 13.02, gesto: 'senalar'},
    {desde: 17.27, gesto: 'leer'},
    {desde: 19.74, gesto: 'contar'},
    {desde: 22.52, gesto: 'explicar'},
    {desde: 26.23, gesto: 'contar'},
    {desde: 29.51, gesto: 'alarma'},
    {desde: 31.92, gesto: 'explicar'},
    {desde: 36.61, gesto: 'cruzar'},
    {desde: 42.22, gesto: 'presentar'},
    {desde: 45.36, gesto: 'negar'},
    {desde: 46.9, gesto: 'saludar'},
  ] as {desde: number; gesto: Gesto}[],
};
