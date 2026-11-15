import type {Efecto, TipoEfecto} from './esquema';

/**
 * DIRECTOR DE CÁMARA
 *
 * Traduce lo que ocurre en la narración (una pregunta, un objeto mencionado,
 * una revelación, el final de una idea…) en combinaciones de efectos
 * primitivos. Cada función devuelve efectos normales, así que después se
 * pueden retocar uno a uno en el panel Props del Studio.
 *
 * Todos los tiempos son segundos relativos al plano.
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
  radio: 0.18,
  texto: '',
  sonido: 'ninguno',
  volumen: 0.4,
};

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Crea un efecto primitivo con valores por defecto razonables. */
export const ef = (tipo: TipoEfecto, inicio: number, duracion: number, o: Partial<Efecto> = {}): Efecto => ({
  ...BASE,
  tipo,
  inicio: r2(Math.max(0, inicio)),
  duracion: r2(Math.max(0.05, duracion)),
  ...o,
});

type Foco = [number, number];
const foco = (f?: Foco) => (f ? {focoX: f[0], focoY: f[1]} : {});

/**
 * Ritmos que se van alternando para que dos acercamientos seguidos nunca
 * tengan la misma velocidad (1 = normal, <1 más lento, >1 más rápido).
 */
const RITMOS = [1, 0.8, 1.25, 0.9, 1.15, 0.75, 1.35, 1.05];
let turno = 0;
const siguienteRitmo = () => RITMOS[turno++ % RITMOS.length];

const CIERRE = '__cierre__';

/**
 * ACERCAMIENTO DRAMÁTICO (momento importante):
 * plano general → acercamiento lento al personaje → el fondo se desenfoca
 * progresivamente y el personaje sigue nítido → pausa visual → zoom extra
 * rápido en el impacto → regreso lento al plano general.
 */
export const dramatico = (
  impacto: number,
  o: {foco: Foco; plano?: number; intensidad?: number; ritmo?: number; texto?: string; textoEn?: Foco; sonido?: Efecto['sonido']},
): Efecto[] => {
  const r = o.ritmo ?? siguienteRitmo();
  const I = o.intensidad ?? 1;
  let pausa = 0.5 / r;
  let lento = 1.9 / r;
  const vuelta = 1.7 / r;
  const inicio = Math.max(0, impacto - pausa - lento);
  lento = impacto - pausa - inicio;
  if (lento < 0.6) {
    pausa = Math.max(0.15, pausa - (0.6 - lento));
    lento = Math.max(0.4, impacto - pausa - inicio);
  }
  const I1 = 0.17 * I;
  const I2 = 0.1 * I;
  const total = impacto + 0.5 + vuelta - inicio;
  const plano = o.plano ?? 1;
  const out = [
    ef('zoomIn', inicio, lento, {intensidad: I1, curva: 'suave', centrar: 0.35, ...foco(o.foco)}),
    ef('profundidad', inicio, total, {intensidad: 0.9, planoHasta: plano, velocidad: Math.min(4, total / lento), mantener: false}),
    ef('zoomIn', impacto - 0.04, 0.24, {intensidad: I2, curva: 'latigo', centrar: 0.1, ...foco(o.foco)}),
    ef('temblor', impacto, 0.4, {intensidad: 0.35 * I, sonido: o.sonido ?? 'ninguno'}),
    ef('zoomOut', impacto + 0.5, vuelta, {intensidad: r2((1 + I1) * (1 + I2) - 1), curva: 'suave', ...foco(o.foco)}),
  ];
  if (o.texto) out.push(rotulo(impacto, 1.4, o.texto, o.textoEn));
  return out;
};

/** OBJETO MENCIONADO: zoom hacia él, cambio de enfoque a su profundidad y resaltado. */
export const objeto = (
  t: number,
  o: {foco: Foco; plano?: number; desde?: number; radio?: number; zoom?: number; ritmo?: number; duracion?: number; centrar?: number},
): Efecto[] => {
  const r = o.ritmo ?? siguienteRitmo();
  const plano = o.plano ?? 1;
  return [
    ef('zoomIn', t - 0.1, 0.85 / r, {intensidad: o.zoom ?? 0.12, curva: 'salida', centrar: o.centrar ?? 0.25, ...foco(o.foco)}),
    ef('rackFocus', t - 0.1, 0.45 / r, {intensidad: 0.8, curva: 'salida', planoDesde: o.desde ?? 1, planoHasta: plano}),
    ef('resaltar', t, o.duracion ?? 1.7, {intensidad: 0.9, radio: o.radio ?? 0.18, planoHasta: plano, ...foco(o.foco)}),
  ];
};

/** PREGUNTA: acercamiento lento durante la frase y pequeña pausa visual al final. */
export const pregunta = (inicio: number, fin: number, o: {foco: Foco; plano?: number; intensidad?: number}): Efecto[] => [
  ef('zoomIn', inicio, Math.max(0.8, fin - inicio - 0.5), {intensidad: 0.1 * (o.intensidad ?? 1), curva: 'suave', centrar: 0.2, ...foco(o.foco)}),
  ef('profundidad', inicio, 1.2, {intensidad: 0.6, planoHasta: o.plano ?? 1}),
];

/** REVELACIÓN: cambio rápido de enfoque, pequeño impacto y texto en pantalla. */
export const revelacion = (
  t: number,
  o: {texto?: string; textoEn?: Foco; desde?: number; hasta?: number; foco?: Foco; impacto?: number; sonido?: Efecto['sonido']},
): Efecto[] => {
  const out = [
    ef('rackFocus', t - 0.05, 0.3, {intensidad: 0.9, curva: 'latigo', planoDesde: o.desde ?? 0.5, planoHasta: o.hasta ?? 1}),
    ef('temblor', t, 0.35, {intensidad: 0.35 * (o.impacto ?? 1), sonido: o.sonido ?? 'ninguno'}),
    ef('zoomIn', t - 0.03, 0.45, {intensidad: 0.05, curva: 'latigo', mantener: false, ...foco(o.foco)}),
  ];
  if (o.texto) out.push(rotulo(t, 1.5, o.texto, o.textoEn));
  return out;
};

/** SORPRESA: zoom rápido con motion blur. */
export const sorpresa = (t: number, o: {foco: Foco; intensidad?: number}): Efecto[] => [
  ef('zoomIn', t, 0.25, {intensidad: 0.2 * (o.intensidad ?? 1), curva: 'latigo', centrar: 0.2, ...foco(o.foco)}),
  ef('motionBlur', t, 0.3, {intensidad: 0.6}),
  ef('temblor', t + 0.05, 0.3, {intensidad: 0.25}),
];

/**
 * FIN DE UNA IDEA: alejamiento que deshace los acercamientos previos del
 * plano y termina dentro de la transición hacia la escena siguiente.
 */
export const cierre = (t: number, finPlano: number, o: {foco?: Foco} = {}): Efecto[] => {
  const inicio = Math.min(t, finPlano - 1.1);
  return [ef('zoomOut', inicio, finPlano + 0.45 - inicio, {curva: 'suave', texto: CIERRE, ...foco(o.foco)})];
};

/** Paneo horizontal siguiendo al personaje. */
export const seguir = (t: number, dur: number, dirX: number, intensidad = 0.6): Efecto[] => [
  ef('paneo', t, dur, {intensidad, dirX, curva: 'suave'}),
];

/** Paneo vertical para revelar objetos. */
export const revelarVertical = (t: number, dur: number, dirY: number, intensidad = 0.6): Efecto[] => [
  ef('paneo', t, dur, {intensidad, dirY, curva: 'suave'}),
];

/** De plano general a primer plano. */
export const generalAPrimerPlano = (t: number, dur: number, o: {foco: Foco; plano?: number; intensidad?: number}): Efecto[] => [
  ef('zoomIn', t, dur, {intensidad: 0.32 * (o.intensidad ?? 1), curva: 'suave', centrar: 0.5, ...foco(o.foco)}),
  ef('profundidad', t, dur, {intensidad: 0.8, planoHasta: o.plano ?? 1}),
];

/** Movimiento lateral con parallax. */
export const lateral = (t: number, dur: number, dirX: number, intensidad = 0.6): Efecto[] => [
  ef('parallax', t, dur, {intensidad, dirX, curva: 'suave'}),
];

/** Órbita lateral 2.5D alrededor del personaje, con acercamiento durante el giro. */
export const orbita = (
  t: number,
  dur: number,
  o: {foco: Foco; dir?: number; intensidad?: number; acercar?: number; mantener?: boolean; desenfoque?: number},
): Efecto[] => {
  const out = [
    ef('orbita', t, dur, {intensidad: o.intensidad ?? 0.6, dirX: o.dir ?? 1, curva: 'suave', mantener: o.mantener ?? false, centrar: 0.4, ...foco(o.foco)}),
    ef('zoomIn', t, dur, {intensidad: o.acercar ?? 0.06, curva: 'suave', mantener: o.mantener ?? false, ...foco(o.foco)}),
  ];
  if (o.desenfoque) out.push(ef('profundidad', t, dur, {intensidad: o.desenfoque, planoHasta: 1, mantener: false, velocidad: 2}));
  return out;
};

/** Texto importante en pantalla. */
export const rotulo = (t: number, dur: number, texto: string, en: Foco = [0.5, 0.44], tam = 1): Efecto =>
  ef('rotulo', t, dur, {texto, intensidad: tam, ...foco(en)});

const MOVIMIENTO: TipoEfecto[] = ['zoomIn', 'zoomOut', 'paneo', 'parallax', 'dollyZoom', 'orbita', 'motionBlur'];

/**
 * Monta el plan de un plano:
 * - calcula la intensidad de los alejamientos de cierre para volver al plano general,
 * - rellena con un desplazamiento lateral suave cualquier tramo de más de
 *   `maxQuieto` segundos en el que la cámara se quedaría estática.
 */
export const plano = (duracion: number, ...grupos: Efecto[][]): Efecto[] => {
  const efs = grupos.flat().sort((a, b) => a.inicio - b.inicio);
  efs.forEach((e) => {
    if (e.texto !== CIERRE) return;
    let prod = 1;
    efs.forEach((z) => {
      if (z === e || z.inicio >= e.inicio || !z.mantener) return;
      if (z.tipo === 'zoomIn') prod *= 1 + z.intensidad;
      if (z.tipo === 'zoomOut') prod /= 1 + z.intensidad;
    });
    e.intensidad = r2(Math.max(0.06, prod - 1));
    e.texto = '';
  });
  return [...efs, ...rellenarQuietos(efs, duracion)];
};

export const rellenarQuietos = (efs: Efecto[], duracion: number, maxQuieto = 1.1): Efecto[] => {
  const tramos = efs
    .filter((e) => e.activo && MOVIMIENTO.includes(e.tipo))
    .map((e) => [e.inicio, e.inicio + (e.mantener ? e.duracion / e.velocidad : e.duracion)] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const extra: Efecto[] = [];
  let cursor = 0;
  let sentido = 1;
  const hueco = (a: number, b: number) => {
    if (b - a > maxQuieto) {
      extra.push(ef('parallax', a, b - a, {intensidad: r2(0.3 * Math.min(1, (b - a) / 3)), dirX: sentido, curva: 'suave'}));
      sentido *= -1;
    }
  };
  tramos.forEach(([a, b]) => {
    hueco(cursor, a);
    cursor = Math.max(cursor, b);
  });
  hueco(cursor, duracion);
  return extra;
};
