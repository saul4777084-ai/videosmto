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
  {inicio: 0.3, fin: 3.6, texto: '¿Sabías que pasar un rato *en la cama*'},
  {inicio: 3.6, fin: 7.8, texto: 'con tu pareja también *quema calorías*?'},
  {inicio: 8.0, fin: 11.8, texto: 'Mucha gente cree que es como *correr en el gimnasio*...'},
  {inicio: 11.8, fin: 15.8, texto: 'pero la ciencia dice *otra cosa*.'},
  {inicio: 16.0, fin: 19.8, texto: 'Un estudio en *Canadá* midió a *21 parejas*'},
  {inicio: 19.8, fin: 23.0, texto: 'con pulseras que calculan el *gasto de energía*.'},
  {inicio: 23.0, fin: 27.8, texto: 'Durante un mes registraron cada encuentro: unos *25 minutos* de media.'},
  {inicio: 28.0, fin: 31.8, texto: 'Ellos quemaron unas *101 calorías* y ellas unas *69*.'},
  {inicio: 31.8, fin: 34.6, texto: 'Más o menos *una tostada* o *un huevo*.'},
  {inicio: 34.6, fin: 39.8, texto: 'En 30 minutos de cinta se queman hasta *276*.'},
  {inicio: 40.0, fin: 43.8, texto: 'El corazón se acelera: unas *4 calorías por minuto*.'},
  {inicio: 43.8, fin: 47.8, texto: 'Es un ejercicio de *intensidad moderada*.'},
  {inicio: 48.0, fin: 51.8, texto: 'Aun así, gana por goleada al *sofá y la tele*,'},
  {inicio: 51.8, fin: 55.8, texto: 'donde apenas gastas *1 caloría por minuto*.'},
  {inicio: 56.0, fin: 60.0, texto: 'Así que no sustituye al gimnasio...'},
  {inicio: 60.0, fin: 63.6, texto: 'pero *suma*. Y se disfruta *mucho más*.'},
  {inicio: 63.6, fin: 66.6, texto: '¿Se lo mandas a *tu pareja*?'},
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
