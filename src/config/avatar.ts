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
    {desde: 4.0, gesto: 'senalar'},
    {desde: 5.3, gesto: 'explicar'},
    {desde: 9.0, gesto: 'negar'},
    {desde: 14.7, gesto: 'senalar'},
    {desde: 18.6, gesto: 'leer'},
    {desde: 20.8, gesto: 'explicar'},
    {desde: 29.3, gesto: 'contar'},
    {desde: 35.4, gesto: 'alarma'},
    {desde: 38.2, gesto: 'explicar'},
    {desde: 44.5, gesto: 'cruzar'},
    {desde: 51.9, gesto: 'presentar'},
    {desde: 56.0, gesto: 'saludar'},
  ] as {desde: number; gesto: Gesto}[],
};
