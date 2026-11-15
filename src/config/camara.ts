import type {ConfigCamara, Efecto, NombrePlano} from '../camera/esquema';
import {en, inicioPlano, palabra} from '../camera/sincro';
import {ESCENAS} from './escenas';
import {VIDEO} from './video';
import {cierre, dramatico, ef, generalAPrimerPlano, lateral, objeto, orbita, plano, pregunta, revelacion, revelarVertical, seguir, sorpresa} from '../camera/director';

export {ef};

/**
 * CÁMARA CINEMATOGRÁFICA — plan de cada plano.
 *
 * Cada plano (toma) tiene su lista de efectos. Tiempos en segundos relativos
 * al inicio del plano. Usa:
 *   en('plano', palabra('texto'))  -> momento en que se dice esa palabra
 *   en('plano', 10.4)              -> segundo absoluto del vídeo (p. ej. un SFX)
 *
 * Todo esto también se puede editar en Remotion Studio (npm run studio):
 * selecciona la composición y abre el panel "Props" de la derecha.
 *
 * Profundidad de las capas: 0 fondo lejano · 1 personaje · >1 primer término.
 *
 * Parámetros de cada efecto (ver camera/esquema.ts):
 *   inicio, duracion   -> cuándo y cuánto dura
 *   intensidad         -> cuánto (zoom, px de paneo, px de desenfoque…)
 *   velocidad          -> rapidez del movimiento dentro de su duración
 *   curva              -> suave | entrada | salida | lineal | rebote | latigo
 *   focoX, focoY       -> posición del enfoque/zoom en pantalla (0..1)
 *   planoDesde/Hasta   -> profundidad enfocada (rack focus, focus pull, DOF)
 *   dirX, dirY         -> dirección (paneo, parallax, barrido)
 *   sonido, volumen    -> SFX que se dispara con el efecto
 */

const w = (p: NombrePlano, texto: string, desde = 0) => en(p, palabra(texto, desde));

// Duración de cada plano (s)
const D = {
  intro: ESCENAS.intro.fin - ESCENAS.intro.inicio,
  gimnasio: ESCENAS.gimnasio.tomas.vueltaHabitacion,
  gimnasioVuelta: ESCENAS.gimnasio.fin - inicioPlano('gimnasioVuelta'),
  ciencia: ESCENAS.ciencia.tomas.habitacion,
  cienciaHabitacion: ESCENAS.ciencia.fin - inicioPlano('cienciaHabitacion'),
  comida: ESCENAS.comida.tomas.cinta,
  comidaCinta: ESCENAS.comida.fin - inicioPlano('comidaCinta'),
  cronometro: ESCENAS.cronometro.fin - ESCENAS.cronometro.inicio,
  tele: ESCENAS.tele.fin - ESCENAS.tele.inicio,
  final: ESCENAS.final.fin - ESCENAS.final.inicio,
};

// Posiciones (0..1 de la pantalla) de lo que se menciona en la narración
const P = {
  pareja: [0.5, 0.62] as [number, number],
  ella: [0.28, 0.6] as [number, number],
  el: [0.66, 0.72] as [number, number],
  bandera: [0.5, 0.42] as [number, number],
  tarjeta1: [0.52, 0.68] as [number, number],
  tarjeta2: [0.56, 0.75] as [number, number],
  tostada: [0.27, 0.67] as [number, number],
  huevo: [0.74, 0.71] as [number, number],
  piernas: [0.52, 0.8] as [number, number],
  corazon: [0.18, 0.86] as [number, number],
  cronometro: [0.5, 0.57] as [number, number],
  tele: [0.5, 0.44] as [number, number],
  sillon: [0.5, 0.8] as [number, number],
  presentador: [0.84, 0.86] as [number, number],
};
const TXT: [number, number] = [0.5, 0.4];
const foco = (f: [number, number]) => ({focoX: f[0], focoY: f[1]});

export const CAMARA: ConfigCamara = {
  audio: {archivo: VIDEO.narracion ?? '', volumen: VIDEO.volumenNarracion, sincronizar: true, sensibilidad: 0.5, anclas: []},
  global: {
    intensidadGeneral: 1,
    respiracion: 1,
    zoomMaximo: 1.8,
    desenfoqueMaxPrincipal: 6,
    desenfoqueMaximo: 22,
    hudSigueCamara: 0.12,
    desenfoqueHud: 0.6,
    motionBlur: {activo: true, modo: 'muestras', obturador: 0.5, muestras: 8, umbral: 2.5},
  },

  // Transición con la que ENTRA cada plano
  transiciones: {
    intro: 'fundido',
    gimnasio: 'barrido',
    gimnasioVuelta: 'corte',
    ciencia: 'zoom',
    cienciaHabitacion: 'desenfoque',
    comida: 'barrido',
    comidaCinta: 'corte',
    cronometro: 'zoom',
    tele: 'desenfoque',
    final: 'fundido',
    presentador: 'fundido',
  },

  planos: {
    // 1 · PREGUNTA: plano general que se revela, acercamiento lento a la pareja durante
    //     la pregunta, pausa, revelación en "quema calorías" y alejamiento a la transición.
    intro: plano(
      D.intro,
      [ef('focusPull', 0, 1.0, {intensidad: 0.8, curva: 'salida', planoDesde: 0.4, planoHasta: 1})],
      lateral(0, 4.7, 1, 0.4),
      [ef('resaltar', w('intro', 'en la cama'), 1.3, {radio: 0.36, intensidad: 0.6, ...foco(P.pareja)})],
      pregunta(0.3, w('intro', 'quema calorías'), {foco: P.pareja}),
      revelacion(w('intro', 'quema calorías'), {texto: '¡QUEMA CALORÍAS!', textoEn: TXT, desde: 0.5, hasta: 1, sonido: 'pop'}),
      cierre(w('intro', 'quema calorías') + 0.4, D.intro),
    ),

    // 2 · Gimnasio: movimiento lateral con parallax, paneo siguiendo a los corredores
    //     (de ella a él) y acercamiento dramático en "276 calorías".
    gimnasio: plano(
      D.gimnasio,
      lateral(0, 3.2, -1, 0.8),
      [ef('profundidad', 0, 0.8, {intensidad: 0.9, planoHasta: 0.85})],
      seguir(w('gimnasio', 'correr') - 0.3, 1.8, 1, 0.5),
      [ef('rackFocus', w('gimnasio', 'correr'), 0.9, {intensidad: 0.9, planoDesde: 0.85, planoHasta: 1.15})],
      dramatico(w('gimnasio', '276 calorías'), {foco: P.el, plano: 1.15, texto: '276 kcal', textoEn: [0.5, 0.47]}),
    ),

    // "Pero la ciencia dice otra cosa": zoom de sorpresa, revelación y alejamiento a la transición
    gimnasioVuelta: plano(
      D.gimnasioVuelta,
      sorpresa(0, {foco: P.pareja}),
      revelacion(w('gimnasioVuelta', 'otra cosa'), {texto: 'OTRA COSA', textoEn: TXT, desde: 0.45, hasta: 1}),
      cierre(1.1, D.gimnasioVuelta),
    ),

    // 3 · Canadá: se enfoca la bandera al nombrarla, paneo vertical que revela los datos
    //     y resaltado de cada tarjeta cuando la voz la menciona.
    ciencia: plano(
      D.ciencia,
      [ef('focusPull', 0, 1.2, {intensidad: 1, curva: 'salida', planoDesde: 0.3, planoHasta: 0.95})],
      objeto(w('ciencia', 'Canadá'), {foco: P.bandera, plano: 0.95, desde: 0.3, radio: 0.3, zoom: 0.06, centrar: 0}),
      revelarVertical(w('ciencia', '21 parejas') - 0.1, 1.6, 1, 0.35),
      objeto(w('ciencia', '21 parejas'), {foco: P.tarjeta1, plano: 1.1, desde: 0.95, radio: 0.17, zoom: 0, centrar: 0}),
      objeto(w('ciencia', 'pulseras'), {foco: P.tarjeta2, plano: 1.1, desde: 1.1, radio: 0.22, zoom: 0, centrar: 0, duracion: 1.3}),
      cierre(3.4, D.ciencia),
    ),

    // Paso del tiempo: de plano general a primer plano, revelación de "25 minutos" y alejamiento
    cienciaHabitacion: plano(
      D.cienciaHabitacion,
      generalAPrimerPlano(0, 2.2, {foco: P.pareja}),
      [ef('dollyZoom', 0.2, 2.4, {intensidad: 0.15, ...foco(P.pareja)})],
      revelacion(w('cienciaHabitacion', '25 minutos', 19), {texto: '25 MIN', textoEn: TXT, desde: 0.45, hasta: 1}),
      cierre(4.4, D.cienciaHabitacion),
    ),

    // 4 · Platos: revelación de "101", zoom y resaltado de la tostada; paneo hacia ella,
    //     revelación de "69" y resaltado del huevo; alejamiento.
    comida: plano(
      D.comida,
      [ef('profundidad', 0, 0.6, {intensidad: 0.8, planoHasta: 1})],
      revelacion(w('comida', '101 calorías'), {texto: '101 kcal', textoEn: [0.5, 0.36], desde: 0.4, hasta: 1}),
      objeto(w('comida', 'tostada'), {foco: P.tostada, plano: 1, desde: 1, radio: 0.2}),
      seguir(w('comida', 'Ellas') - 0.1, 1.2, 1, 0.45),
      revelacion(w('comida', '69'), {texto: '69 kcal', textoEn: [0.5, 0.36], desde: 1, hasta: 1.25}),
      objeto(w('comida', 'huevo'), {foco: P.huevo, plano: 1.25, desde: 1.25, radio: 0.2, zoom: 0, duracion: 1.0}),
      cierre(w('comida', 'huevo') + 0.05, D.comida),
    ),

    // "En la cinta serían 276": entrada con motion blur, zoom a la cinta y revelación
    comidaCinta: plano(
      D.comidaCinta,
      [ef('motionBlur', 0, 0.4, {intensidad: 1.2})],
      lateral(0, 2.8, 1, 0.7),
      objeto(w('comidaCinta', 'cinta'), {foco: P.piernas, plano: 1, radio: 0.3, zoom: 0.1}),
      revelacion(w('comidaCinta', '276', 29), {texto: '276 kcal', textoEn: [0.5, 0.42], desde: 0.35, hasta: 1, sonido: 'pop'}),
      cierre(1.9, D.comidaCinta),
    ),

    // 5 · Cronómetro: alejamiento en látigo, el corazón al nombrarlo, dolly zoom en
    //     "se acelera", revelación del ritmo y alejamiento en "Intensidad moderada".
    cronometro: plano(
      D.cronometro,
      [ef('zoomOut', 0, 0.8, {intensidad: 0.3, curva: 'latigo', ...foco(P.cronometro)})],
      [ef('profundidad', 0, 0.6, {intensidad: 0.8, planoHasta: 1})],
      [ef('temblor', en('cronometro', 32.45), 0.3, {intensidad: 0.3})],
      objeto(w('cronometro', 'corazón'), {foco: P.corazon, plano: 1.3, desde: 1, radio: 0.12, zoom: 0.05, centrar: 0}),
      [ef('dollyZoom', w('cronometro', 'acelera') - 0.1, 1.4, {intensidad: 0.28, mantener: false, ...foco(P.cronometro)})],
      revelacion(w('cronometro', '4 calorías por minuto'), {texto: '4 kcal / min', textoEn: [0.5, 0.43], desde: 1.3, hasta: 1}),
      cierre(w('cronometro', 'Intensidad'), D.cronometro),
    ),

    // 6 · Tele: "sofá" -> enfoque y resaltado del sillón; "tele" -> enfoque de la pantalla;
    //     revelación de "30 calorías" y alejamiento.
    tele: plano(
      D.tele,
      lateral(0, 1.6, 1, 0.5),
      [ef('profundidad', 0, 0.6, {intensidad: 0.8, planoHasta: 0.8})],
      objeto(w('tele', 'sofá'), {foco: P.sillon, plano: 1.35, desde: 0.8, radio: 0.25, zoom: 0.07}),
      objeto(w('tele', 'tele', 39), {foco: P.tele, plano: 0.8, desde: 1.35, radio: 0.32, zoom: 0.1}),
      revelacion(w('tele', '30 calorías'), {texto: '30 kcal', textoEn: [0.5, 0.33], desde: 0.5, hasta: 0.8}),
      cierre(4.9, D.tele),
    ),

    // 7 · Final: acercamiento dramático a la pareja en "170 calorías", impacto en
    //     "¡pero suma!" y alejamiento cinematográfico que cierra el vídeo.
    final: plano(
      D.final,
      [ef('profundidad', 0, 1, {intensidad: 0.6, planoHasta: 1})],
      dramatico(w('final', '170 calorías'), {foco: P.pareja, intensidad: 0.9}),
      lateral(3.0, 3.0, -1, 0.5),
      revelacion(w('final', 'pero', 45), {impacto: 1.3, desde: 0.6, hasta: 1}),
      cierre(4.6, D.final - 0.45),
    ),

    // CÁMARA GLOBAL: órbitas 2.5D alrededor del presentador en sus gestos clave.
    // El presentador no se deforma nunca: solo se mueven las capas a su alrededor.
    presentador: [
      ...orbita(0.4, 3.4, {foco: P.presentador, dir: 1, intensidad: 0.4, acercar: 0.03}),
      ...orbita(13.1, 3.4, {foco: P.presentador, dir: -1, intensidad: 0.4, acercar: 0.03}),
      ...orbita(31.95, 3.6, {foco: P.presentador, dir: 1, intensidad: 0.4, acercar: 0.03}),
      ...orbita(42.3, 2.9, {foco: P.presentador, dir: -1, intensidad: 0.4, acercar: 0.03}),
      ...orbita(46.9, 1.4, {foco: P.presentador, dir: 1, intensidad: 0.4, acercar: 0.03, mantener: true}),
    ],
  },
};

/** Avisos en consola si dos planos seguidos repiten el mismo zoom. */
export const revisarPlan = (c: ConfigCamara) => {
  const firma = (es: Efecto[]) =>
    es
      .filter((e) => e.activo && (e.tipo === 'zoomIn' || e.tipo === 'zoomOut'))
      .map((e) => `${e.tipo}:${e.intensidad}:${e.curva}`)
      .join('|');
  const nombres = (Object.keys(c.planos) as (keyof ConfigCamara['planos'])[]).filter((n) => n !== 'presentador');
  const avisos: string[] = [];
  nombres.forEach((n, i) => {
    if (i === 0) return;
    const a = firma(c.planos[nombres[i - 1]]);
    if (a && a === firma(c.planos[n])) avisos.push(`Los planos "${nombres[i - 1]}" y "${n}" repiten el mismo zoom.`);
  });
  return avisos;
};
