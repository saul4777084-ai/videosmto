import type {Subtitulo} from '../../config/textos';
import type {Sonido} from '../../config/sonidos';
import type {Gesto} from '../../config/avatar';

/**
 * "¿QUÉ PASARÍA SI DEJARAS DE DORMIR DURANTE 7 DÍAS?"
 * Todos los tiempos están en segundos del guion, medidos sobre
 * public/sueno/narracion.mp3 (si cambias el audio, la sincronización
 * automática reajusta todo).
 */
export const VIDEO_SUENO = {
  fps: 30,
  ancho: 1080,
  alto: 1920,
  duracionSegundos: 60.1,
  narracion: 'sueno/narracion.mp3',
  solapeTransicion: 12,
};

export const ESCENAS_SUENO = {
  gancho: {inicio: 0, fin: 7.23},
  dia1: {inicio: 7.23, fin: 17.05, tomas: {microsuenos: 5.63}},
  dia2: {inicio: 17.05, fin: 24.27, tomas: {comida: 3.8}},
  dia3: {inicio: 24.27, fin: 31.9, tomas: {alucinaciones: 3.44}},
  dia45: {inicio: 31.9, fin: 38.04},
  dia67: {inicio: 38.04, fin: 43.95},
  gardner: {inicio: 43.95, fin: 53.17},
  cierre: {inicio: 53.17, fin: 60.1},
} as const;
export type EscenaSueno = keyof typeof ESCENAS_SUENO;

/** Planos con cámara propia (tiempos de efectos relativos a su inicio). */
export const PLANOS_SUENO = {
  gancho: {escena: 'gancho', desde: 0},
  dia1: {escena: 'dia1', desde: 0},
  dia1Micro: {escena: 'dia1', desde: ESCENAS_SUENO.dia1.tomas.microsuenos},
  dia2: {escena: 'dia2', desde: 0},
  dia2Comida: {escena: 'dia2', desde: ESCENAS_SUENO.dia2.tomas.comida},
  dia3: {escena: 'dia3', desde: 0},
  dia3Aluc: {escena: 'dia3', desde: ESCENAS_SUENO.dia3.tomas.alucinaciones},
  dia45: {escena: 'dia45', desde: 0},
  dia67: {escena: 'dia67', desde: 0},
  gardner: {escena: 'gardner', desde: 0},
  cierre: {escena: 'cierre', desde: 0},
  presentador: {escena: 'gancho', desde: 0},
} as const;
export const NOMBRES_PLANO_SUENO = Object.keys(PLANOS_SUENO) as (keyof typeof PLANOS_SUENO)[];
export type PlanoSueno = keyof typeof PLANOS_SUENO;

/** Subtítulos (*palabras* = resaltadas). Tiempos medidos sobre el audio. */
export const SUBTITULOS_SUENO: Subtitulo[] = [
  {inicio: 0.08, fin: 2.68, texto: '¿Qué pasaría si dejaras de dormir durante *siete días*?'},
  {inicio: 3.11, fin: 5.95, texto: 'Esto es lo que le ocurre a tu cuerpo, *día a día*.'},
  {inicio: 7.23, fin: 8.13, texto: '*Día uno*.'},
  {inicio: 8.52, fin: 10.14, texto: 'Tras *veinticuatro horas* despierto,'},
  {inicio: 10.3, fin: 12.65, texto: 'tus reflejos fallan como si hubieras bebido *alcohol*.'},
  {inicio: 12.86, fin: 15.73, texto: 'Tu cerebro empieza a apagarse unos segundos sin avisarte:'},
  {inicio: 15.93, fin: 16.89, texto: 'son los *microsueños*.'},
  {inicio: 17.05, fin: 17.85, texto: '*Día dos*.'},
  {inicio: 17.99, fin: 20.68, texto: 'Tus *defensas* se debilitan y el *hambre* se dispara.'},
  {inicio: 20.85, fin: 24.08, texto: 'Tu cuerpo pide *azúcar y grasa* para conseguir energía rápida.'},
  {inicio: 24.27, fin: 24.85, texto: '*Día tres*.'},
  {inicio: 25.01, fin: 27.57, texto: 'Te cuesta hablar, recordar y concentrarte.'},
  {inicio: 27.71, fin: 29.93, texto: 'Y aparecen las primeras *alucinaciones*:'},
  {inicio: 30.07, fin: 31.7, texto: 'ves cosas que *no están ahí*.'},
  {inicio: 31.9, fin: 33.05, texto: '*Días cuatro y cinco*.'},
  {inicio: 33.2, fin: 35.49, texto: 'La *paranoia* y la *confusión* toman el control.'},
  {inicio: 35.63, fin: 37.98, texto: 'Ya no distingues bien lo que es *real*.'},
  {inicio: 38.04, fin: 39.08, texto: '*Días seis y siete*.'},
  {inicio: 39.31, fin: 43.7, texto: 'Tu cerebro sufre microsueños casi constantes y tu cuerpo entra en *alerta máxima*.'},
  {inicio: 43.95, fin: 45.47, texto: 'En *1964*, *Randy Gardner*,'},
  {inicio: 45.62, fin: 46.38, texto: 'con diecisiete años,'},
  {inicio: 46.5, fin: 49.66, texto: 'aguantó *once días* sin dormir.'},
  {inicio: 49.85, fin: 53.03, texto: 'Sufrió *alucinaciones*, *fallos de memoria* y le costaba *hablar*.'},
  {inicio: 53.17, fin: 54.06, texto: 'La *buena noticia*:'},
  {inicio: 54.22, fin: 56.27, texto: 'al volver a dormir, tu cerebro *se recupera*.'},
  {inicio: 56.46, fin: 57.46, texto: 'Así que *no lo intentes*.'},
  {inicio: 57.5, fin: 59.58, texto: 'Duerme entre *siete y nueve horas* cada noche.'},
];

/** Gestos del presentador alineados con la voz. */
export const GESTOS_SUENO: {desde: number; gesto: Gesto}[] = [
  {desde: 0, gesto: 'presentar'},
  {desde: 3.11, gesto: 'explicar'},
  {desde: 7.23, gesto: 'contar'},
  {desde: 10.3, gesto: 'senalar'},
  {desde: 12.86, gesto: 'explicar'},
  {desde: 17.05, gesto: 'contar'},
  {desde: 20.85, gesto: 'explicar'},
  {desde: 24.27, gesto: 'contar'},
  {desde: 27.71, gesto: 'alarma'},
  {desde: 31.9, gesto: 'cruzar'},
  {desde: 35.63, gesto: 'negar'},
  {desde: 38.04, gesto: 'alarma'},
  {desde: 43.95, gesto: 'leer'},
  {desde: 49.85, gesto: 'contar'},
  {desde: 53.17, gesto: 'presentar'},
  {desde: 56.46, gesto: 'negar'},
  {desde: 57.5, gesto: 'senalar'},
  {desde: 59.0, gesto: 'saludar'},
];

const S = 'sueno/';
/** Efectos de sonido (nombre de public/sfx, o ruta completa como "sueno/sfx/impacto"). */
const sfx = (n: string) => `${S}sfx/${n}`;
const tics = (desde: number, hasta: number, cada: number, vol: number, s = 'tic'): Sonido[] => {
  const out: Sonido[] = [];
  for (let t = desde; t < hasta; t += cada) out.push({t: Math.round(t * 100) / 100, sfx: s, vol});
  return out;
};

export const SONIDOS_SUENO: Sonido[] = [
  // Gancho: reloj nocturno que se acelera
  {t: 0.0, sfx: sfx('impacto'), vol: 0.5},
  ...tics(0.4, 3.0, 0.5, 0.25),
  ...tics(3.0, 5.9, 0.25, 0.22),
  ...tics(5.9, 7.1, 0.11, 0.2),
  {t: 6.0, sfx: sfx('subida'), vol: 0.45},
  // Día 1
  {t: 7.23, sfx: sfx('impacto'), vol: 0.6},
  {t: 7.25, sfx: 'whoosh', vol: 0.4},
  {t: 10.3, sfx: 'swoosh', vol: 0.35},
  {t: 11.6, sfx: 'ding', vol: 0.3},
  {t: 12.86, sfx: 'whoosh', vol: 0.35},
  {t: 13.75, sfx: sfx('parpadeo'), vol: 0.5},
  {t: 14.95, sfx: sfx('parpadeo'), vol: 0.5},
  {t: 15.95, sfx: sfx('zumbido'), vol: 0.25},
  {t: 15.62, sfx: sfx('parpadeo'), vol: 0.55},
  // Día 2
  {t: 17.05, sfx: sfx('impacto'), vol: 0.6},
  {t: 17.1, sfx: 'whoosh', vol: 0.4},
  {t: 18.75, sfx: sfx('grieta'), vol: 0.5},
  {t: 19.35, sfx: sfx('grieta'), vol: 0.45},
  {t: 20.0, sfx: sfx('tripa'), vol: 0.55},
  {t: 20.85, sfx: 'swoosh', vol: 0.4},
  {t: 21.4, sfx: 'pop', vol: 0.4},
  {t: 21.75, sfx: 'pop', vol: 0.4},
  {t: 22.1, sfx: 'pop', vol: 0.4},
  {t: 22.45, sfx: 'pop', vol: 0.4},
  {t: 23.2, sfx: 'brillo', vol: 0.3},
  // Día 3
  {t: 24.27, sfx: sfx('impacto'), vol: 0.6},
  {t: 24.3, sfx: 'whoosh', vol: 0.4},
  {t: 25.2, sfx: sfx('glitch'), vol: 0.25},
  {t: 26.2, sfx: 'papel', vol: 0.35},
  {t: 27.71, sfx: sfx('distorsion'), vol: 0.45},
  {t: 30.1, sfx: sfx('susurro'), vol: 0.5},
  // Días 4 y 5
  {t: 31.9, sfx: sfx('impacto'), vol: 0.6},
  {t: 31.92, sfx: sfx('glitch'), vol: 0.35},
  {t: 33.2, sfx: sfx('susurro'), vol: 0.4},
  {t: 34.4, sfx: sfx('distorsion'), vol: 0.3},
  {t: 35.63, sfx: sfx('glitch'), vol: 0.4},
  {t: 36.9, sfx: sfx('glitch'), vol: 0.45},
  // Días 6 y 7
  {t: 38.04, sfx: sfx('impacto'), vol: 0.65},
  {t: 38.6, sfx: 'latido', vol: 0.6, hasta: 43.9},
  {t: 39.45, sfx: sfx('parpadeo'), vol: 0.45},
  {t: 40.55, sfx: sfx('parpadeo'), vol: 0.45},
  {t: 41.45, sfx: sfx('parpadeo'), vol: 0.45},
  {t: 42.3, sfx: sfx('subida'), vol: 0.4},
  {t: 42.85, sfx: 'alarma', vol: 0.3},
  // Randy Gardner
  {t: 43.95, sfx: sfx('impacto'), vol: 0.45},
  {t: 44.0, sfx: 'papel', vol: 0.5},
  {t: 46.5, sfx: 'swoosh', vol: 0.3},
  ...tics(46.9, 48.9, 0.18, 0.18, 'papel'),
  {t: 49.0, sfx: 'campana', vol: 0.3},
  {t: 49.9, sfx: 'pop', vol: 0.4},
  {t: 50.85, sfx: 'pop', vol: 0.4},
  {t: 52.2, sfx: 'pop', vol: 0.4},
  // Cierre
  {t: 53.17, sfx: 'magia', vol: 0.4},
  {t: 53.2, sfx: 'brillo', vol: 0.35},
  {t: 55.3, sfx: 'subida', vol: 0.35},
  {t: 56.46, sfx: 'negacion', vol: 0.35},
  {t: 57.55, sfx: 'exito', vol: 0.4},
  {t: 59.2, sfx: 'whoosh', vol: 0.25},
];

export const MUSICA_SUENO = {archivo: `${S}musica.wav`, volumen: 0.32};
