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
  {inicio: 0.02, fin: 4.26, texto: '¿Sabías que pasar un rato *en la cama* con tu pareja también *quema calorías*?'},
  {inicio: 4.30, fin: 11.42, texto: 'Mucha gente dice que es como correr media hora en el gimnasio, donde se queman hasta *276 calorías*.'},
  {inicio: 11.46, fin: 13.00, texto: 'Pero la ciencia dice *otra cosa*.'},
  {inicio: 13.04, fin: 17.25, texto: 'Un estudio en *Canadá* midió a *21 parejas* con pulseras de actividad.'},
  {inicio: 17.29, fin: 19.72, texto: 'Durante un mes registraron cada encuentro.'},
  {inicio: 19.76, fin: 22.50, texto: 'De media duraron unos *25 minutos*.'},
  {inicio: 22.54, fin: 26.21, texto: 'Ellos gastaron unas *101 calorías*: como una tostada.'},
  {inicio: 26.25, fin: 29.49, texto: 'Ellas, unas *69*: más o menos un huevo.'},
  {inicio: 29.53, fin: 31.90, texto: 'En la cinta serían *276*.'},
  {inicio: 31.94, fin: 36.59, texto: 'El corazón se acelera: unas *4 calorías por minuto*. Intensidad moderada.'},
  {inicio: 36.63, fin: 39.16, texto: 'Aun así, es mucho más que el *sofá*:'},
  {inicio: 39.20, fin: 42.20, texto: '25 minutos de tele son solo *30 calorías*.'},
  {inicio: 42.24, fin: 45.34, texto: 'En total, la pareja quema unas *170 calorías*.'},
  {inicio: 45.38, fin: 47.58, texto: 'No sustituye al gimnasio... ¡pero *suma*!'},
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
