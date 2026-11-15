import {ESCENAS, NombreEscena} from '../config/escenas';
import {SUBTITULOS} from '../config/textos';
import {tokenize} from '../components/Subtitles';
import type {NombrePlano} from './esquema';

/**
 * SINCRONIZACIÓN con narración y efectos de sonido.
 * Cada plano sabe en qué segundo absoluto del vídeo empieza, así los efectos
 * de cámara se pueden escribir a partir de palabras de la narración.
 */
export const PLANOS: Record<NombrePlano, {escena: NombreEscena; desde: number}> = {
  intro: {escena: 'intro', desde: 0},
  gimnasio: {escena: 'gimnasio', desde: 0},
  gimnasioVuelta: {escena: 'gimnasio', desde: ESCENAS.gimnasio.tomas.vueltaHabitacion},
  ciencia: {escena: 'ciencia', desde: 0},
  cienciaHabitacion: {escena: 'ciencia', desde: ESCENAS.ciencia.tomas.habitacion},
  comida: {escena: 'comida', desde: 0},
  comidaCinta: {escena: 'comida', desde: ESCENAS.comida.tomas.cinta},
  cronometro: {escena: 'cronometro', desde: 0},
  tele: {escena: 'tele', desde: 0},
  final: {escena: 'final', desde: 0},
  presentador: {escena: 'intro', desde: 0},
};

/** Segundo absoluto del vídeo en el que empieza un plano. */
export const inicioPlano = (p: NombrePlano) => ESCENAS[PLANOS[p].escena].inicio + PLANOS[p].desde;

/** Convierte un segundo absoluto del vídeo en segundo relativo al plano. */
export const en = (p: NombrePlano, tAbs: number) => Math.max(0, Math.round((tAbs - inicioPlano(p)) * 100) / 100);

const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

/**
 * Segundo absoluto en el que aparece una palabra (o grupo resaltado) en los
 * subtítulos, con el mismo reparto temporal que usa components/Subtitles.
 * `desde` permite buscar a partir de un segundo concreto.
 */
export const palabra = (texto: string, desde = 0): number => {
  const buscado = normal(texto);
  if (!buscado) throw new Error(`palabra(): "${texto}" no contiene letras ni números`);
  for (const cue of SUBTITULOS) {
    if (cue.fin < desde) continue;
    const tokens = tokenize(cue.texto);
    const step = ((cue.fin - cue.inicio) * 0.88) / tokens.length;
    const i = tokens.findIndex((t) => normal(t.text).includes(buscado));
    if (i >= 0) return cue.inicio + i * step;
  }
  throw new Error(`palabra(): "${texto}" no aparece en los subtítulos`);
};
