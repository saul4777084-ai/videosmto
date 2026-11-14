/**
 * SUBTÍTULOS sincronizados (tiempos absolutos en segundos).
 *
 * - Las palabras aparecen una a una dentro de cada frase.
 * - Escribe entre *asteriscos* las palabras o grupos de palabras que
 *   quieras resaltar en amarillo con recuadro.
 * - Ajusta "inicio" / "fin" para que coincidan con tu narración.
 */
export type Subtitulo = {inicio: number; fin: number; texto: string};

export const SUBTITULOS: Subtitulo[] = [
  // 1. Intro (0 – 5,2 s)
  {inicio: 0.2, fin: 5.1, texto: '¿Sabías que pasar un rato *en la cama* con tu pareja también *quema calorías*?'},
  // 2. Gimnasio (5,2 – 14,5 s)
  {inicio: 5.3, fin: 11.1, texto: 'Mucha gente dice que es como correr media hora en el gimnasio, donde se queman hasta *276 calorías*.'},
  {inicio: 11.2, fin: 14.4, texto: 'Pero la ciencia dice *otra cosa*.'},
  // 3. Ciencia (14,5 – 28,9 s)
  {inicio: 14.6, fin: 20.5, texto: 'Un estudio en *Canadá* midió a *21 parejas* con pulseras de actividad.'},
  {inicio: 20.6, fin: 24.6, texto: 'Durante un mes registraron cada encuentro.'},
  {inicio: 24.7, fin: 28.8, texto: 'De media duraron unos *25 minutos*.'},
  // 4. Comida y cinta (28,9 – 38,0 s)
  {inicio: 29.0, fin: 32.3, texto: 'Ellos gastaron unas *101 calorías*: como una tostada.'},
  {inicio: 32.4, fin: 35.2, texto: 'Ellas, unas *69*: más o menos un huevo.'},
  {inicio: 35.3, fin: 37.9, texto: 'En la cinta serían *276*.'},
  // 5. Cronómetro (38,0 – 44,5 s)
  {inicio: 38.1, fin: 44.4, texto: 'El corazón se acelera: unas *4 calorías por minuto*. Intensidad moderada.'},
  // 6. Tele (44,5 – 51,6 s)
  {inicio: 44.6, fin: 47.9, texto: 'Aun así, es mucho más que el *sofá*:'},
  {inicio: 48.0, fin: 51.5, texto: '25 minutos de tele son solo *30 calorías*.'},
  // 7. Final (51,6 – 59,5 s)
  {inicio: 51.7, fin: 55.6, texto: 'En total, la pareja quema unas *170 calorías*.'},
  {inicio: 55.7, fin: 59.4, texto: 'No sustituye al gimnasio... ¡pero *suma*!'},
];

/** Textos fijos que aparecen dentro de las escenas. */
export const ROTULOS = {
  gimnasio: '30 min de cinta',
  ciencia: {
    pais: 'CANADÁ',
    tarjetas: ['21 parejas', 'Pulsera de actividad', '≈ 25 min por sesión'],
    dias: 'DÍA',
  },
  comida: {azul: 'ÉL', rosa: 'ELLA', platoAzul: '≈ 1 tostada', platoRosa: '≈ 1 huevo', cinta: '30 min de cinta'},
  cronometro: {ritmo: '4,2 kcal / min', etiqueta: 'MIN'},
  tele: {sofa: 'Sofá + tele', cama: 'En la cama', titulo: '25 minutos'},
  final: {el: 'ÉL', ella: 'ELLA', cierre: 'No sustituye al gimnasio...', cierre2: '¡pero suma!'},
};
