/**
 * Pantalla del móvil dibujada en un canvas cada fotograma: pantalla de bloqueo con notificaciones,
 * red social genérica que se desplaza (sin marcas ni logotipos) o apagada.
 * Todo es función del tiempo `t` (segundos), así cada fotograma se puede renderizar por separado.
 */

export type ModoPantalla = 'bloqueo' | 'feed' | 'apagada';
export type OpcionesPantalla = {
  modo: ModoPantalla;
  t: number;
  /** segundos (relativos) en que llega cada notificación */
  avisos?: number[];
  hora?: string;
  /** velocidad del desplazamiento del feed */
  scroll?: number;
  /** 0..1: modo noche (tonos más cálidos y oscuros en la interfaz, brillo igual) */
  noche?: number;
};

export const W_PANT = 360;
export const H_PANT = 760;

const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};
const sat = (x: number) => Math.min(1, Math.max(0, x));
const suave = (x: number) => {
  const t = sat(x);
  return t * t * (3 - 2 * t);
};
const hash = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ------------------------------------------------------------------ iconos */
export type Icono = 'corazon' | 'burbuja' | 'play' | 'campana' | 'estrella' | 'arroba';
export const COLOR_ICONO: Record<Icono, string> = {
  corazon: '#ff3d6a',
  burbuja: '#36d07a',
  play: '#ff8a2a',
  campana: '#4a9aff',
  estrella: '#ffc83a',
  arroba: '#a07aff',
};
export const icono = (g: CanvasRenderingContext2D, tipo: Icono, x: number, y: number, s: number, color = '#ffffff') => {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineWidth = 0.12;
  g.lineJoin = 'round';
  g.beginPath();
  if (tipo === 'corazon') {
    g.moveTo(0, 0.38);
    g.bezierCurveTo(-0.55, 0.0, -0.5, -0.45, -0.24, -0.45);
    g.bezierCurveTo(-0.1, -0.45, 0, -0.33, 0, -0.22);
    g.bezierCurveTo(0, -0.33, 0.1, -0.45, 0.24, -0.45);
    g.bezierCurveTo(0.5, -0.45, 0.55, 0.0, 0, 0.38);
    g.fill();
  } else if (tipo === 'burbuja') {
    g.ellipse(0, -0.05, 0.44, 0.34, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-0.22, 0.2);
    g.lineTo(-0.32, 0.44);
    g.lineTo(0.02, 0.26);
    g.fill();
  } else if (tipo === 'play') {
    g.moveTo(-0.2, -0.36);
    g.lineTo(0.38, 0);
    g.lineTo(-0.2, 0.36);
    g.closePath();
    g.fill();
  } else if (tipo === 'campana') {
    g.moveTo(-0.34, 0.22);
    g.quadraticCurveTo(-0.3, -0.42, 0, -0.42);
    g.quadraticCurveTo(0.3, -0.42, 0.34, 0.22);
    g.lineTo(0.42, 0.3);
    g.lineTo(-0.42, 0.3);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(0, 0.38, 0.09, 0, Math.PI * 2);
    g.fill();
  } else if (tipo === 'estrella') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 0.2 : 0.46;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
  } else {
    g.font = '800 0.8px Poppins, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('@', 0, 0.02);
  }
  g.restore();
};

/* ------------------------------------------------------------------ pantalla de bloqueo */
const AVISOS: {app: string; txt: string; icono: Icono}[] = [
  {app: 'MENSAJES', txt: 'Nuevo mensaje: «¿Has visto esto?»', icono: 'burbuja'},
  {app: 'FOTOS', txt: 'A 24 personas les gusta tu foto', icono: 'corazon'},
  {app: 'VÍDEOS', txt: 'Nuevo vídeo de un canal que sigues', icono: 'play'},
  {app: 'SOCIAL', txt: 'Te han mencionado en un comentario', icono: 'arroba'},
  {app: 'JUEGO', txt: 'Tu recompensa diaria te espera', icono: 'estrella'},
];

const bloqueo = (g: CanvasRenderingContext2D, o: OpcionesPantalla) => {
  const W = W_PANT;
  const H = H_PANT;
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#1a2a6a');
  gr.addColorStop(0.55, '#3a1a6a');
  gr.addColorStop(1, '#0a0a24');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  // ondas suaves del fondo
  for (let k = 0; k < 3; k++) {
    g.fillStyle = `rgba(${120 + k * 40},${90 + k * 30},255,0.12)`;
    g.beginPath();
    g.moveTo(0, H * (0.62 + k * 0.08));
    for (let x = 0; x <= W; x += 12) g.lineTo(x, H * (0.62 + k * 0.08) + Math.sin(x / 60 + k * 2 + o.t * 0.3) * 18);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();
  }
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.font = '600 20px Poppins, sans-serif';
  g.fillText('martes, 24 de noviembre', W / 2, 92);
  g.font = '300 96px Poppins, sans-serif';
  g.fillText(o.hora ?? '10:24', W / 2, 190);
  const avisos = o.avisos ?? [];
  let y = 248;
  // las más recientes arriba
  const llegados = avisos.map((a, i) => ({a, i})).filter((x) => o.t >= x.a).reverse();
  for (const {a, i} of llegados) {
    const k = suave((o.t - a) / 0.35);
    const av = AVISOS[i % AVISOS.length];
    const h = 78;
    g.save();
    g.globalAlpha = k;
    g.translate(0, (1 - k) * -60);
    const pulso = Math.exp(-(o.t - a) * 3);
    rr(g, 14, y, W - 28, h, 20);
    g.fillStyle = `rgba(255,255,255,${0.78 + pulso * 0.2})`;
    g.fill();
    g.fillStyle = COLOR_ICONO[av.icono];
    rr(g, 26, y + 14, 50, 50, 13);
    g.fill();
    icono(g, av.icono, 51, y + 39, 34);
    g.textAlign = 'left';
    g.fillStyle = 'rgba(30,30,50,0.65)';
    g.font = '700 14px Poppins, sans-serif';
    g.fillText(av.app, 88, y + 30);
    g.fillStyle = 'rgba(30,30,50,0.55)';
    g.textAlign = 'right';
    g.font = '500 13px Poppins, sans-serif';
    g.fillText('ahora', W - 30, y + 30);
    g.textAlign = 'left';
    g.fillStyle = '#141428';
    g.font = '600 15px Poppins, sans-serif';
    g.fillText(av.txt.length > 30 ? av.txt.slice(0, 30) + '…' : av.txt, 88, y + 54);
    g.restore();
    y += (h + 10) * k;
  }
  // indicador inferior
  g.fillStyle = 'rgba(255,255,255,0.8)';
  rr(g, W / 2 - 60, H - 22, 120, 6, 3);
  g.fill();
};

/* ------------------------------------------------------------------ red social genérica */
const POST_H = 470;
const post = (g: CanvasRenderingContext2D, i: number, y: number, t: number, noche: number) => {
  const W = W_PANT;
  const h1 = hash(i * 3.1) * 360;
  const h2 = (h1 + 40 + hash(i * 5.7) * 80) % 360;
  // cabecera: avatar y nombre (barras, sin texto real)
  g.fillStyle = `hsl(${h1},70%,60%)`;
  g.beginPath();
  g.arc(32, y + 30, 18, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = noche ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.85)';
  rr(g, 60, y + 18, 110 + hash(i) * 60, 10, 5);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  rr(g, 60, y + 34, 70, 8, 4);
  g.fill();
  // imagen: degradado con un paisaje sencillo
  const iy = y + 62;
  const ih = 320;
  const gr = g.createLinearGradient(0, iy, 0, iy + ih);
  gr.addColorStop(0, `hsl(${h1},75%,${58 - noche * 12}%)`);
  gr.addColorStop(1, `hsl(${h2},70%,${38 - noche * 10}%)`);
  g.fillStyle = gr;
  g.fillRect(0, iy, W, ih);
  const video = i % 3 === 1;
  g.fillStyle = 'rgba(255,240,200,0.85)';
  g.beginPath();
  g.arc(W * (0.25 + hash(i * 2) * 0.5), iy + 90, 34, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = `hsla(${h2},50%,18%,0.85)`;
  g.beginPath();
  g.moveTo(0, iy + ih);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, iy + ih - 90 - Math.sin(x / 50 + i) * 40 - hash(i + x) * 16);
  g.lineTo(W, iy + ih);
  g.fill();
  if (video) {
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath();
    g.arc(W / 2, iy + ih / 2, 38, 0, Math.PI * 2);
    g.fill();
    icono(g, 'play', W / 2 + 4, iy + ih / 2, 44);
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.fillRect(0, iy + ih - 5, W, 5);
    g.fillStyle = '#ff3d6a';
    g.fillRect(0, iy + ih - 5, W * ((t * 0.12 + hash(i)) % 1), 5);
  }
  // acciones: el corazón se rellena (me gusta) con un pequeño salto
  const ay = iy + ih + 38;
  const megusta = hash(i * 9.3) > 0.35;
  icono(g, 'corazon', 30, ay, 36, megusta ? '#ff3d6a' : 'rgba(255,255,255,0.85)');
  icono(g, 'burbuja', 78, ay, 34, 'rgba(255,255,255,0.85)');
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.font = '700 16px Poppins, sans-serif';
  g.textAlign = 'left';
  const n = Math.floor(120 + hash(i * 4.4) * 9000 + t * (3 + hash(i) * 20));
  g.fillText(`${n.toLocaleString('es-ES')} «me gusta»`, 112, ay + 6);
  g.fillStyle = 'rgba(255,255,255,0.3)';
  rr(g, 16, ay + 26, W - 90, 9, 4);
  g.fill();
  rr(g, 16, ay + 42, W - 160, 9, 4);
  g.fill();
};

/** Desplazamiento a golpes (como al deslizar con el dedo): rachas rápidas y pausas. */
export const desplazamiento = (t: number, vel = 1) => {
  const periodo = 1.15;
  const k = Math.floor(t / periodo);
  const f = (t % periodo) / periodo;
  const golpe = 1 - Math.pow(1 - Math.min(1, f / 0.55), 3);
  return (k + golpe) * POST_H * 0.62 * vel;
};

const feed = (g: CanvasRenderingContext2D, o: OpcionesPantalla) => {
  const W = W_PANT;
  const H = H_PANT;
  const noche = o.noche ?? 0;
  g.fillStyle = noche ? '#0c0a12' : '#0e1018';
  g.fillRect(0, 0, W, H);
  const off = desplazamiento(o.t, o.scroll ?? 1);
  const top = 70;
  const i0 = Math.floor(off / POST_H);
  for (let i = i0; i < i0 + 3; i++) post(g, i, top + i * POST_H - off, o.t, noche);
  // barra superior
  g.fillStyle = noche ? 'rgba(12,10,18,0.96)' : 'rgba(14,16,24,0.96)';
  g.fillRect(0, 0, W, top);
  g.fillStyle = '#ffffff';
  g.font = '800 26px Poppins, sans-serif';
  g.textAlign = 'left';
  g.fillText('Inicio', 18, 50);
  icono(g, 'campana', W - 70, 42, 30, '#ffffff');
  icono(g, 'burbuja', W - 28, 42, 30, '#ffffff');
  // globito rojo de avisos pendientes que no deja de crecer
  const pend = 3 + Math.floor(o.t * 1.7);
  g.fillStyle = '#ff3d4a';
  g.beginPath();
  g.arc(W - 58, 28, 11, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.font = '700 12px Poppins, sans-serif';
  g.textAlign = 'center';
  g.fillText(String(pend), W - 58, 32);
  // barra inferior
  g.fillStyle = noche ? 'rgba(12,10,18,0.96)' : 'rgba(14,16,24,0.96)';
  g.fillRect(0, H - 64, W, 64);
  (['estrella', 'play', 'corazon', 'arroba'] as Icono[]).forEach((ic, k) => icono(g, ic, W * (0.14 + k * 0.24), H - 32, 26, k === 0 ? '#ffffff' : 'rgba(255,255,255,0.55)'));
  if (noche) {
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.font = '600 14px Poppins, sans-serif';
    g.textAlign = 'right';
    g.fillText(o.hora ?? '01:12', W - 16, 18);
  }
};

/** Dibuja la pantalla en el contexto (W_PANT × H_PANT). */
export const dibujarPantalla = (g: CanvasRenderingContext2D, o: OpcionesPantalla) => {
  g.save();
  if (o.modo === 'apagada') {
    g.fillStyle = '#020204';
    g.fillRect(0, 0, W_PANT, H_PANT);
  } else if (o.modo === 'bloqueo') bloqueo(g, o);
  else feed(g, o);
  g.restore();
};
