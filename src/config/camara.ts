import type {ConfigCamara, Efecto, TipoEfecto} from '../camera/esquema';
import {en, palabra} from '../camera/sincro';

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

const BASE: Omit<Efecto, 'tipo' | 'inicio' | 'duracion'> = {
  activo: true,
  intensidad: 1,
  velocidad: 1,
  curva: 'suave',
  mantener: true,
  focoX: 0.5,
  focoY: 0.5,
  centrar: 0,
  planoDesde: 1,
  planoHasta: 1,
  dirX: 0,
  dirY: 0,
  sonido: 'ninguno',
  volumen: 0.4,
};

/** Crea un efecto con valores por defecto razonables. */
export const ef = (tipo: TipoEfecto, inicio: number, duracion: number, o: Partial<Efecto> = {}): Efecto => ({
  ...BASE,
  tipo,
  inicio: Math.round(inicio * 100) / 100,
  duracion,
  ...o,
});

// Momentos clave de la narración (segundos absolutos del vídeo)
const N = {
  enLaCama: palabra('en la cama'),
  quema: palabra('quema calorías'),
  k276: palabra('276 calorías'),
  canada: palabra('Canadá'),
  parejas: palabra('21 parejas'),
  min25: palabra('25 minutos', 19),
  ellas: palabra('Ellas'),
  cinta276: palabra('276', 29),
  acelera: palabra('acelera'),
  porMinuto: palabra('4 calorías por minuto'),
  intensidad: palabra('Intensidad'),
  cal30: palabra('30 calorías'),
  total: palabra('170 calorías'),
  suma: palabra('suma'),
};

export const CAMARA: ConfigCamara = {
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
  },

  planos: {
    // 1 · Pregunta inicial: se revela la pareja desenfocada y la cámara se acerca a la cama
    intro: [
      ef('focusPull', 0, 1.3, {intensidad: 0.9, curva: 'salida', planoDesde: 0.4, planoHasta: 1}),
      ef('profundidad', 0.3, 1.2, {intensidad: 0.7, planoHasta: 1}),
      ef('parallax', 0, 4.7, {intensidad: 0.45, dirX: 1, curva: 'lineal'}),
      ef('zoomIn', en('intro', N.enLaCama) - 0.2, 1.6, {intensidad: 0.14, focoX: 0.5, focoY: 0.63, centrar: 0.3}),
      ef('temblor', en('intro', N.quema), 0.45, {intensidad: 0.45, sonido: 'pop', volumen: 0.3}),
    ],

    // 2 · Gimnasio: travelling lateral (parallax) y rack focus de ella a él; golpe en "276"
    gimnasio: [
      ef('parallax', 0, 7.6, {intensidad: 0.9, dirX: -1}),
      ef('profundidad', 0, 0.8, {intensidad: 0.9, planoHasta: 0.85}),
      ef('rackFocus', 2.6, 1.0, {intensidad: 0.9, planoDesde: 0.85, planoHasta: 1.15}),
      ef('zoomIn', en('gimnasio', N.k276) - 0.15, 0.9, {intensidad: 0.22, velocidad: 1.5, curva: 'salida', focoX: 0.66, focoY: 0.77, centrar: 0.25}),
      ef('temblor', en('gimnasio', 10.4), 0.5, {intensidad: 0.4}),
    ],

    // "Pero la ciencia dice otra cosa": corte seco con alejamiento en látigo y motion blur
    gimnasioVuelta: [
      ef('zoomOut', 0, 0.7, {intensidad: 0.35, curva: 'latigo', focoX: 0.5, focoY: 0.62}),
      ef('motionBlur', 0, 0.45, {intensidad: 1}),
      ef('temblor', en('gimnasioVuelta', 11.6), 0.5, {intensidad: 0.4}),
      ef('profundidad', 0.3, 0.8, {intensidad: 0.6, planoHasta: 1}),
    ],

    // 3 · Canadá: focus pull antes de revelar la bandera y paneo vertical hasta los datos
    ciencia: [
      ef('focusPull', 0, 1.4, {intensidad: 1, curva: 'salida', planoDesde: 0.3, planoHasta: 0.95}),
      ef('zoomIn', 0.2, 1.4, {intensidad: 0.16, curva: 'salida', focoX: 0.5, focoY: 0.45, centrar: 0.2}),
      ef('temblor', en('ciencia', N.canada) + 0.1, 0.35, {intensidad: 0.3}),
      ef('profundidad', 1.2, 0.8, {intensidad: 0.7, planoHasta: 0.95}),
      ef('paneo', en('ciencia', N.parejas) - 0.1, 1.8, {intensidad: 0.55, dirY: 1}),
      ef('rackFocus', en('ciencia', N.parejas), 1.0, {intensidad: 0.6, planoDesde: 0.95, planoHasta: 1.1}),
    ],

    // Paso del tiempo: dolly zoom lento mientras corren los días; alejamiento al dato
    cienciaHabitacion: [
      ef('profundidad', 0, 1, {intensidad: 0.7, planoHasta: 1}),
      ef('dollyZoom', 0, en('cienciaHabitacion', N.min25), {intensidad: 0.3, focoX: 0.5, focoY: 0.63}),
      ef('zoomOut', en('cienciaHabitacion', N.min25), 1.4, {intensidad: 0.12, focoX: 0.5, focoY: 0.6}),
      ef('temblor', en('cienciaHabitacion', 22.0), 0.4, {intensidad: 0.3}),
    ],

    // 4 · Platos: enfoque en la tostada, paneo + rack focus al huevo
    comida: [
      ef('profundidad', 0, 0.6, {intensidad: 0.8, planoHasta: 1}),
      ef('zoomIn', 0.3, 1.8, {intensidad: 0.12, focoX: 0.3, focoY: 0.66, centrar: 0.15}),
      ef('temblor', en('comida', 24.55), 0.35, {intensidad: 0.25}),
      ef('rackFocus', en('comida', N.ellas) - 0.3, 0.9, {intensidad: 0.8, planoDesde: 1, planoHasta: 1.25}),
      ef('paneo', en('comida', N.ellas) - 0.3, 1.4, {intensidad: 0.4, dirX: 1}),
      ef('temblor', en('comida', 27.55), 0.35, {intensidad: 0.25}),
    ],

    // "En la cinta serían 276": entrada con motion blur, avance continuo y golpe en el dato
    comidaCinta: [
      ef('motionBlur', 0, 0.4, {intensidad: 1.2}),
      ef('zoomIn', 0, 2.6, {intensidad: 0.18, curva: 'lineal', focoX: 0.52, focoY: 0.78, centrar: 0.2}),
      ef('parallax', 0, 2.8, {intensidad: 0.8, dirX: 1}),
      ef('temblor', en('comidaCinta', N.cinta276), 0.5, {intensidad: 0.55, sonido: 'pop', volumen: 0.35}),
    ],

    // 5 · Cronómetro: alejamiento en látigo, clic con impacto y dolly zoom en "se acelera"
    cronometro: [
      ef('zoomOut', 0, 0.8, {intensidad: 0.3, curva: 'latigo', focoX: 0.5, focoY: 0.57}),
      ef('profundidad', 0, 0.6, {intensidad: 0.8, planoHasta: 1}),
      ef('temblor', en('cronometro', 32.45), 0.35, {intensidad: 0.35}),
      ef('dollyZoom', en('cronometro', N.acelera) - 0.1, 1.6, {intensidad: 0.3, mantener: false, focoX: 0.5, focoY: 0.57}),
      ef('temblor', en('cronometro', N.porMinuto), 0.6, {intensidad: 0.25, velocidad: 1.6}),
      ef('zoomIn', en('cronometro', N.intensidad), 1.2, {intensidad: 0.1, focoX: 0.5, focoY: 0.57}),
    ],

    // 6 · Tele: rack focus de la persona a la pantalla, desenfoque antes de la comparación
    tele: [
      ef('rackFocus', 0, 1.4, {intensidad: 0.8, planoDesde: 1.35, planoHasta: 0.8}),
      ef('zoomIn', 0.2, 2.2, {intensidad: 0.15, focoX: 0.5, focoY: 0.44}),
      ef('focusPull', en('tele', N.cal30) - 0.35, 0.9, {intensidad: 0.6, planoDesde: 0.8, planoHasta: 0.8}),
      ef('zoomOut', 3.1, 1.6, {intensidad: 0.1, focoX: 0.5, focoY: 0.44}),
      ef('temblor', en('tele', 41.3), 0.4, {intensidad: 0.25}),
    ],

    // 7 · Final: acercamiento a la pareja, desenfoque antes del total, alejamiento de cierre
    final: [
      ef('profundidad', 0, 1, {intensidad: 0.6, planoHasta: 1}),
      ef('zoomIn', 0, 2.6, {intensidad: 0.16, focoX: 0.5, focoY: 0.62, centrar: 0.2}),
      ef('focusPull', en('final', N.total) + 0.1, 0.75, {intensidad: 0.7, planoHasta: 1}),
      ef('temblor', 2.82, 0.45, {intensidad: 0.45}),
      ef('zoomOut', 3.0, 2.6, {intensidad: 0.16, focoX: 0.5, focoY: 0.62}),
      ef('parallax', 3.0, 3.0, {intensidad: 0.5, dirX: -1}),
      ef('temblor', 3.85, 0.5, {intensidad: 0.4}),
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
  const nombres = Object.keys(c.planos) as (keyof ConfigCamara['planos'])[];
  const avisos: string[] = [];
  nombres.forEach((n, i) => {
    if (i === 0) return;
    const a = firma(c.planos[nombres[i - 1]]);
    if (a && a === firma(c.planos[n])) avisos.push(`Los planos "${nombres[i - 1]}" y "${n}" repiten el mismo zoom.`);
  });
  return avisos;
};
