import {Easing} from 'remotion';
import type {CamaraGlobal, Curva, Efecto} from './esquema';

/**
 * MOTOR DE CÁMARA
 *
 * Todo es una función pura del frame (admite frames fraccionarios), así que
 * el resultado es idéntico en el Studio y en el render del MP4, y se puede
 * evaluar en sub-frames para el desenfoque de movimiento real.
 */

export const W = 1080;
export const H = 1920;
const SX = W / 2;
const SY = H / 2;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const CURVA: Record<Curva, (t: number) => number> = {
  suave: Easing.inOut(Easing.cubic),
  entrada: Easing.in(Easing.cubic),
  salida: Easing.out(Easing.cubic),
  lineal: (t) => t,
  rebote: Easing.out(Easing.back(1.6)),
  latigo: Easing.out(Easing.exp),
};

/** Estado de la cámara en un instante. */
export type EstadoCamara = {
  z: number; // zoom
  cx: number; // centro de cámara (coordenadas del mundo 1080x1920)
  cy: number;
  rot: number; // grados
  plano: number; // profundidad enfocada
  apertura: number; // px de desenfoque por unidad de profundidad
  global: number; // desenfoque global (focus pull)
  dolly: number;
  dfx: number;
  dfy: number;
  px: number; // parallax
  py: number;
  sx: number; // temblor
  sy: number;
  mb: number; // multiplicador del obturador
  orb: number; // ángulo de órbita (grados)
};

type Progreso = {t: number; p: number; dentro: boolean};

const progreso = (e: Efecto, f: number, fps: number): Progreso => {
  const start = e.inicio * fps;
  const len = Math.max(1, e.duracion * fps);
  const t = (f - start) / len;
  const mov = clamp(t * e.velocidad, 0, 1);
  let p = CURVA[e.curva](mov);
  if (!e.mantener) {
    const r = clamp((t - 0.7) / 0.3, 0, 1);
    p *= 1 - Easing.inOut(Easing.cubic)(r);
  }
  return {t, p, dentro: t >= 0 && t <= 1};
};

/** Ruido suave y determinista para el temblor (suma de senos con fases fijas). */
const ruido = (tau: number, semilla: number) =>
  Math.sin(tau * 57.1 + semilla * 1.7) * 0.5 + Math.sin(tau * 91.3 + semilla * 3.1) * 0.3 + Math.sin(tau * 23.9 + semilla * 5.3) * 0.2;

const factorZoom = (e: Efecto, p: number, ig: number) => {
  const I = e.intensidad * ig;
  return e.tipo === 'zoomIn' ? Math.pow(1 + I, p) : Math.pow(1 + I, -p);
};

/**
 * Zoom base del plano: si en algún momento los zoomOut dejarían el encuadre
 * por debajo de 1, el plano arranca más cerca. Así un zoomOut al inicio de un
 * plano empieza cerca y termina mostrando toda la escena.
 */
export const calcularZoomBase = (efectos: Efecto[], fps: number, ig: number) => {
  const zs = efectos.filter((e) => e.activo && (e.tipo === 'zoomIn' || e.tipo === 'zoomOut'));
  if (!zs.length) return 1;
  const puntos = new Set<number>([0]);
  zs.forEach((e) => {
    const a = e.inicio * fps;
    const len = Math.max(1, e.duracion * fps);
    [a, a + len / e.velocidad, a + len * 0.7, a + len, a + len + 1].forEach((x) => puntos.add(x));
  });
  let min = 1;
  puntos.forEach((f) => {
    let prod = 1;
    zs.forEach((e) => (prod *= factorZoom(e, progreso(e, f, fps).p, ig)));
    min = Math.min(min, prod);
  });
  return Math.max(1, 1 / min);
};

export const evaluarCamara = (efectos: Efecto[], f: number, fps: number, g: CamaraGlobal, zoomBase: number): EstadoCamara => {
  const st: EstadoCamara = {z: zoomBase, cx: SX, cy: SY, rot: 0, plano: 1, apertura: 0, global: 0, dolly: 0, dfx: SX, dfy: SY, px: 0, py: 0, sx: 0, sy: 0, mb: 1, orb: 0};
  const ig = g.intensidadGeneral;
  const ordenados = efectos.filter((e) => e.activo).sort((a, b) => a.inicio - b.inicio);
  ordenados.forEach((e, idx) => {
    const {t, p, dentro} = progreso(e, f, fps);
    const I = e.intensidad * ig;
    const Fx = e.focoX * W;
    const Fy = e.focoY * H;
    switch (e.tipo) {
      case 'zoomIn':
      case 'zoomOut': {
        // zoom alrededor del foco: el punto foco queda fijo en pantalla
        const k = factorZoom(e, p, ig);
        let cx = Fx - (Fx - st.cx) / k;
        let cy = Fy - (Fy - st.cy) / k;
        if (e.tipo === 'zoomIn') {
          cx = lerp(cx, Fx, e.centrar * p);
          cy = lerp(cy, Fy, e.centrar * p);
        }
        st.cx = cx;
        st.cy = cy;
        st.z *= k;
        break;
      }
      case 'paneo':
        st.cx += e.dirX * I * 300 * p;
        st.cy += e.dirY * I * 300 * p;
        break;
      case 'parallax':
        st.px += e.dirX * I * 100 * p;
        st.py += e.dirY * I * 100 * p;
        break;
      case 'dollyZoom':
        st.dolly += I * p;
        if (t >= 0) {
          st.dfx = Fx;
          st.dfy = Fy;
          st.cx = lerp(st.cx, Fx, e.centrar * p * 0.5);
          st.cy = lerp(st.cy, Fy, e.centrar * p * 0.5);
        }
        break;
      case 'rackFocus':
        if (t < 0) break;
        st.apertura = Math.max(st.apertura, I * 10);
        st.plano = lerp(e.planoDesde, e.planoHasta, p);
        break;
      case 'profundidad':
        st.apertura = Math.max(st.apertura, I * 10 * p);
        if (t >= 0) st.plano = e.planoHasta;
        break;
      case 'focusPull': {
        // fase 1 (25 %): se desenfoca · fase 2: enfoca progresivamente
        const empiezaDesenfocado = e.inicio <= 0.01;
        const tt = clamp(t, 0, 1);
        const sube = empiezaDesenfocado ? 1 : clamp(tt / 0.25, 0, 1);
        const baja = 1 - CURVA[e.curva](clamp((tt * e.velocidad - 0.25) / 0.75, 0, 1));
        const env = t < 0 ? (empiezaDesenfocado ? 1 : 0) : t > 1 ? 0 : Math.min(Easing.out(Easing.quad)(sube), baja);
        st.global += I * 18 * env;
        if (t >= 0) st.plano = lerp(e.planoDesde, e.planoHasta, 1 - baja);
        break;
      }
      case 'temblor': {
        if (!dentro) break;
        const lenF = Math.max(1, e.duracion * fps);
        const ataque = clamp((t * lenF) / 2, 0, 1);
        const env = ataque * Math.pow(1 - t, 2);
        const tau = ((f - e.inicio * fps) / fps) * e.velocidad;
        const A = I * 28 * env;
        st.sx += A * ruido(tau, idx + 1);
        st.sy += A * ruido(tau, idx + 7);
        st.rot += I * 0.9 * env * ruido(tau, idx + 13);
        st.mb = Math.max(st.mb, 1 + I * 0.5);
        break;
      }
      case 'orbita': {
        // arco lateral alrededor del plano del personaje (profundidad 1)
        const dir = e.dirX === 0 ? 1 : Math.sign(e.dirX);
        st.orb += dir * I * 25 * p;
        st.cx = lerp(st.cx, Fx, e.centrar * p * 0.3);
        st.cy = lerp(st.cy, Fy, e.centrar * p * 0.3);
        break;
      }
      case 'resaltar':
      case 'rotulo':
        break;
      case 'motionBlur':
        if (dentro) st.mb = Math.max(st.mb, 1 + I * 2);
        st.cx += e.dirX * I * 260 * p;
        st.cy += e.dirY * I * 260 * p;
        break;
    }
  });
  st.z = clamp(st.z, 1, g.zoomMaximo);
  // cámara "en mano" muy sutil
  const R = g.respiracion * ig;
  if (R > 0) {
    const tau = f / fps;
    st.cx += R * 5 * Math.sin(tau * 2 * Math.PI * 0.13);
    st.cy += R * 4 * Math.sin(tau * 2 * Math.PI * 0.09 + 1);
    st.rot += R * 0.1 * Math.sin(tau * 2 * Math.PI * 0.07 + 2);
  }
  return st;
};

/** Matriz afín 2D [a b c d e f] (como CSS matrix()). */
export type Matriz = [number, number, number, number, number, number];

export const aplicar = (m: Matriz, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
export const invertir = (m: Matriz): Matriz => {
  const [a, b, c, d, e, f] = m;
  const det = a * d - b * c || 1e-9;
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
};
export const css = (m: Matriz) => `matrix(${m.map((v) => +v.toFixed(5)).join(',')})`;

export type DefCapa = {
  /** Profundidad: 0 fondo lejano · 1 plano del personaje · >1 primer término. */
  profundidad?: number;
  /** La capa debe cubrir siempre la pantalla (fondos opacos). */
  cubrir?: boolean;
  /** Personaje principal: limita su desenfoque para que siga reconocible. */
  principal?: boolean;
  /** Rótulos y contadores: fijos en pantalla salvo temblor y el seguimiento indicado. */
  hud?: boolean;
  /** Escenario: puede girar en perspectiva durante las órbitas (nunca se aplica a personajes). */
  escenario?: boolean;
  /** Tipo de motion blur de esta capa (por defecto el global). 'no' lo desactiva. */
  motionBlur?: 'global' | 'direccional' | 'no';
};

/** m: matriz 2D (solo traslación, giro y escala uniforme: nunca estira la ilustración). rotY: giro en perspectiva del escenario. */
export type TransformCapa = {m: Matriz; blur: number; rotY: number};

/** Peso del dolly zoom por profundidad: el fondo cambia mucho de escala, el personaje poco. */
const pesoDolly = (d: number) => (d < 1 ? 0.3 + 1.5 * (1 - d) : 0.3 * d);

export const transformarCapa = (st: EstadoCamara, capa: DefCapa, g: CamaraGlobal): TransformCapa => {
  const d = capa.profundidad ?? 1;
  let blur: number;
  let k: number;
  let tx: number;
  let ty: number;
  let rot = st.rot;
  if (capa.hud) {
    const h = g.hudSigueCamara;
    const Z = 1 + (st.z - 1) * h;
    const cx = SX + (st.cx - SX) * h;
    const cy = SY + (st.cy - SY) * h;
    k = Z;
    tx = SX - cx * Z + st.sx * 0.45;
    ty = SY - cy * Z + st.sy * 0.45;
    rot *= 0.4;
    blur = st.global * g.desenfoqueHud;
  } else {
    const Z = Math.max(0.2, 1 + (st.z - 1) * d);
    const cx = SX + (st.cx - SX) * d;
    const cy = SY + (st.cy - SY) * d;
    k = Z;
    tx = SX - cx * Z;
    ty = SY - cy * Z;
    // dolly zoom alrededor de su foco (en pantalla)
    const m = 1 + st.dolly * pesoDolly(d);
    tx = (tx - st.dfx) * m + st.dfx;
    ty = (ty - st.dfy) * m + st.dfy;
    k *= m;
    // parallax: el fondo y el primer término se mueven en sentidos opuestos
    tx += st.px * (1 - d);
    ty += st.py * (1 - d);
    // órbita: las capas se desplazan según su distancia al personaje (pivote d = 1)
    if (st.orb !== 0) {
      const a = (st.orb * Math.PI) / 180;
      tx += 900 * (1 - d) * Math.sin(a);
      k *= 1 + 0.35 * Math.max(0, 1 - d) * (1 - Math.cos(a));
      if (capa.escenario) rot += st.orb * 0.05;
    }
    // temblor: más fuerte cuanto más cerca
    const sh = 0.55 + 0.45 * d;
    tx += st.sx * sh;
    ty += st.sy * sh;
    blur = st.apertura * Math.abs(d - st.plano) + st.global;
  }
  blur = Math.min(blur, capa.principal ? g.desenfoqueMaxPrincipal : g.desenfoqueMaximo);
  if (capa.cubrir) {
    // que la capa cubra toda la pantalla (más un margen si está desenfocada)
    const mg = blur * 2;
    const req: number[] = [1];
    if (tx > -mg) req.push((SX + mg) / Math.max(1e-3, SX - tx));
    if (tx + k * W < W + mg) req.push((W - SX + mg) / Math.max(1e-3, tx + k * W - SX));
    if (ty > -mg) req.push((SY + mg) / Math.max(1e-3, SY - ty));
    if (ty + k * H < H + mg) req.push((H - SY + mg) / Math.max(1e-3, ty + k * H - SY));
    const r = Math.abs((rot * Math.PI) / 180);
    const a = Math.max(...req) * (Math.cos(r) + (H / W) * Math.sin(r));
    if (a > 1) {
      tx = SX + (tx - SX) * a;
      ty = SY + (ty - SY) * a;
      k *= a;
    }
  }
  // rotación alrededor del centro de pantalla
  const rr = (rot * Math.PI) / 180;
  const cos = Math.cos(rr);
  const sin = Math.sin(rr);
  const m: Matriz = [
    k * cos,
    k * sin,
    -k * sin,
    k * cos,
    cos * (tx - SX) - sin * (ty - SY) + SX,
    sin * (tx - SX) + cos * (ty - SY) + SY,
  ];
  const rotY = capa.escenario && !capa.principal ? -st.orb * 0.3 : 0;
  return {m, blur, rotY};
};

/** Resaltados y rótulos activos en un frame. */
export type Resalte = {x: number; y: number; r: number; a: number; d: number; pulso: number};
export type Rotulo = {texto: string; x: number; y: number; a: number; escala: number; salida: number};

export const elementosPantalla = (efectos: Efecto[], f: number, fps: number) => {
  const resaltes: Resalte[] = [];
  const rotulos: Rotulo[] = [];
  efectos.forEach((e) => {
    if (!e.activo || (e.tipo !== 'resaltar' && e.tipo !== 'rotulo')) return;
    const start = e.inicio * fps;
    const len = Math.max(1, e.duracion * fps);
    const t = (f - start) / len;
    if (t < 0 || t > 1) return;
    const entra = Math.min(1, (f - start) / Math.max(1, 0.25 * fps / e.velocidad));
    const sale = Math.min(1, (start + len - f) / Math.max(1, 0.3 * fps));
    if (e.tipo === 'resaltar') {
      resaltes.push({
        x: e.focoX * W,
        y: e.focoY * H,
        r: e.radio * W,
        a: Math.min(Easing.out(Easing.cubic)(entra), Easing.inOut(Easing.cubic)(sale)) * Math.min(1, e.intensidad),
        d: e.planoHasta,
        pulso: (f - start) / fps,
      });
    } else {
      rotulos.push({
        texto: e.texto,
        x: e.focoX * W,
        y: e.focoY * H,
        a: Easing.out(Easing.back(1.8))(clamp(entra, 0, 1)),
        escala: e.intensidad,
        salida: Easing.in(Easing.cubic)(1 - clamp(sale, 0, 1)),
      });
    }
  });
  return {resaltes, rotulos};
};

/** Desplazamiento máximo en pantalla (px) entre dos transformaciones de una capa. */
const PUNTOS: [number, number][] = [
  [0, 0], [W, 0], [0, H], [W, H], [SX, SY], [SX, H * 0.25], [SX, H * 0.75],
];
export const desplazamiento = (a: Matriz, b: Matriz) => {
  const ib = invertir(a);
  let max = 0;
  let vx = 0;
  let vy = 0;
  PUNTOS.forEach(([x, y]) => {
    const [wx, wy] = aplicar(ib, x, y);
    const [x2, y2] = aplicar(b, wx, wy);
    const dd = Math.hypot(x2 - x, y2 - y);
    if (dd > max) max = dd;
    if (x === SX && y === SY) {
      vx = x2 - x;
      vy = y2 - y;
    }
  });
  return {max, vx, vy};
};
