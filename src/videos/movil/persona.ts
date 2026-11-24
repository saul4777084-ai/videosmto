import * as THREE from 'three';
import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {deformar, fbm3, fusionar, molecula, ruido3, tuboVariable} from '../ayuno/anatomia';

/**
 * Geometría propia del vídeo "Móvil 8 horas" (todo generado por código, sin modelos externos):
 * hombre que sostiene el móvil delante de la cara (cabeza inclinada, brazo izquierdo doblado) o en
 * reposo (brazos en pose A), huesos y vasos de ese brazo, móvil genérico (sin marca), ojo,
 * terminal sináptico y moléculas (dopamina, melatonina).
 * Unidades en metros: pies en y = 0, mira hacia +z, el lado izquierdo del personaje en +x.
 */

export type V = [number, number, number];
const memo = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};

/* -------------------------------------------------------------- postura */
/** Inclinación de la cabeza hacia la pantalla (rad) y su pivote (base del cuello). */
export const INCL = 0.3;
export const PIVOTE: V = [0, 1.47, -0.01];
/** Gira un punto de la cabeza con la inclinación (para colocar ojos, cerebro…). */
export const enCabeza = (p: V, k = 1): V => {
  const a = INCL * k;
  const y = p[1] - PIVOTE[1];
  const z = p[2] - PIVOTE[2];
  return [p[0], PIVOTE[1] + y * Math.cos(a) - z * Math.sin(a), PIVOTE[2] + y * Math.sin(a) + z * Math.cos(a)];
};
const desdeCabeza = (x: number, y: number, z: number, k = 1): V => {
  const a = -INCL * k;
  const yy = y - PIVOTE[1];
  const zz = z - PIVOTE[2];
  return [x, PIVOTE[1] + yy * Math.cos(a) - zz * Math.sin(a), PIVOTE[2] + yy * Math.sin(a) + zz * Math.cos(a)];
};

/** Brazo izquierdo doblado: hombro, codo, muñeca y mano. */
const HOMBRO: V = [0.21, 1.41, -0.01];
const CODO: V = [0.245, 1.14, 0.06];
const MUNECA: V = [0.125, 1.3, 0.262];
/** Centro del móvil sostenido y punto entre los ojos (con la cabeza inclinada). */
export const OJOS: V = enCabeza([0, 1.682, 0.082]);
export const MOVIL: V = [0.085, 1.365, 0.318];
/** Orientación del móvil: la pantalla mira a los ojos. */
export const quatMovil = (() => {
  const q = new THREE.Quaternion();
  const n = new THREE.Vector3(OJOS[0] - MOVIL[0], OJOS[1] - MOVIL[1], OJOS[2] - MOVIL[2]).normalize();
  const m = new THREE.Matrix4();
  const arriba = new THREE.Vector3(0, 1, 0);
  const x = new THREE.Vector3().crossVectors(arriba, n).normalize();
  const y = new THREE.Vector3().crossVectors(n, x).normalize();
  m.makeBasis(x, y, n);
  q.setFromRotationMatrix(m);
  return q;
})();
const MANO_C: V = (() => {
  const n = new THREE.Vector3(OJOS[0] - MOVIL[0], OJOS[1] - MOVIL[1], OJOS[2] - MOVIL[2]).normalize();
  return [MOVIL[0] - n.x * 0.026 + 0.012, MOVIL[1] - n.y * 0.026 - 0.03, MOVIL[2] - n.z * 0.026];
})();

/* -------------------------------------------------------------- cuerpo masculino (SDF) */
const sdCapsula = (px: number, py: number, pz: number, a: V, b: V, ra: number, rb: number) => {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const pax = px - a[0], pay = py - a[1], paz = pz - a[2];
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
};
const sdElipsoide = (px: number, py: number, pz: number, c: V, r: V) => {
  const x = (px - c[0]) / r[0], y = (py - c[1]) / r[1], z = (pz - c[2]) / r[2];
  const k0 = Math.sqrt(x * x + y * y + z * z);
  const x1 = x / r[0], y1 = y / r[1], z1 = z / r[2];
  const k1 = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
  return k1 > 0 ? (k0 * (k0 - 1)) / k1 : -Math.min(r[0], r[1], r[2]);
};
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
type Prim = (x: number, y: number, z: number) => number;
const par = (f: (s: number) => Prim, k: number) => [f(1), f(-1)].map((g) => ({f: g, k}));
const lado = (s: number, f: (s: number) => Prim, k: number) => [{f: f(s), k}];

/** Cabeza: se evalúa en coordenadas de la cabeza (inclinada si `inclina`). */
const CABEZA: {f: Prim; k: number}[] = [
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.668, 0.004], [0.08, 0.106, 0.097]), k: 0.02},
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.597, 0.028], [0.064, 0.052, 0.068]), k: 0.035},
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.565, 0.068], [0.03, 0.022, 0.026]), k: 0.03},
  {f: (x, y, z) => sdCapsula(x, y, z, [0, 1.668, 0.1], [0, 1.626, 0.116], 0.009, 0.015), k: 0.015},
  ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.081 * s, 1.655, -0.005], [0.012, 0.03, 0.02]), 0.01),
];

const primsCuerpo = (movil: boolean): {f: Prim; k: number}[] => {
  const cuelloSup = movil ? enCabeza([0, 1.6, 0.0], 0.75) : ([0, 1.6, 0.0] as V);
  const brazoPoseA = (s: number) => [
    ...lado(s, (s) => (x, y, z) => sdCapsula(x, y, z, [0.21 * s, 1.41, -0.01], [0.29 * s, 1.135, -0.02], 0.052, 0.04), 0.03),
    ...lado(s, (s) => (x, y, z) => sdCapsula(x, y, z, [0.29 * s, 1.135, -0.02], [0.348 * s, 0.875, 0.01], 0.042, 0.029), 0.025),
    ...lado(s, (s) => (x, y, z) => sdElipsoide(x, y, z, [0.372 * s, 0.8, 0.015], [0.025, 0.064, 0.042]), 0.02),
    ...lado(s, (s) => (x, y, z) => sdCapsula(x, y, z, [0.367 * s, 0.815, 0.048], [0.377 * s, 0.77, 0.062], 0.011, 0.01), 0.01),
  ];
  const brazoMovil = [
    {f: ((x, y, z) => sdCapsula(x, y, z, HOMBRO, CODO, 0.052, 0.04)) as Prim, k: 0.03},
    {f: ((x, y, z) => sdCapsula(x, y, z, CODO, MUNECA, 0.042, 0.029)) as Prim, k: 0.025},
    {f: ((x, y, z) => sdElipsoide(x, y, z, MANO_C, [0.032, 0.05, 0.03])) as Prim, k: 0.025},
  ];
  return [
    // cuello ancho y trapecios
    {f: (x, y, z) => sdCapsula(x, y, z, [0, 1.46, -0.01], cuelloSup, 0.06, 0.052), k: 0.035},
    {f: (x, y, z) => sdCapsula(x, y, z, [-0.17, 1.445, -0.03], [0.17, 1.445, -0.03], 0.055, 0.055), k: 0.07},
    // tórax, pectorales, abdomen, pelvis
    {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.31, 0.0], [0.185, 0.19, 0.112]), k: 0.06},
    ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.085 * s, 1.355, 0.055], [0.095, 0.058, 0.048]), 0.04),
    {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.1, 0.012], [0.138, 0.165, 0.098]), k: 0.08},
    {f: (x, y, z) => sdElipsoide(x, y, z, [0, 0.935, 0.0], [0.152, 0.105, 0.1]), k: 0.07},
    ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.066 * s, 0.885, -0.048], [0.066, 0.07, 0.06]), 0.05),
    // hombros
    ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.205 * s, 1.418, -0.01], [0.068, 0.062, 0.064]), 0.05),
    // brazos
    ...brazoPoseA(-1),
    ...(movil ? brazoMovil : brazoPoseA(1)),
    // piernas
    ...par((s) => (x, y, z) => sdCapsula(x, y, z, [0.088 * s, 0.9, 0.0], [0.1 * s, 0.5, 0.005], 0.08, 0.054), 0.05),
    ...par((s) => (x, y, z) => sdCapsula(x, y, z, [0.1 * s, 0.5, 0.005], [0.11 * s, 0.09, -0.01], 0.052, 0.033), 0.03),
    ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.1 * s, 0.38, -0.03], [0.048, 0.088, 0.05]), 0.04),
    ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.115 * s, 0.035, 0.04], [0.042, 0.033, 0.115]), 0.035),
  ];
};

const sdPersona = (movil: boolean) => {
  const cuerpo = primsCuerpo(movil);
  return (x: number, y: number, z: number, grosor = 0) => {
    let d = 1e9;
    for (const p of cuerpo) d = smin(d, p.f(x, y, z), p.k);
    const [hx, hy, hz] = movil ? desdeCabeza(x, y, z) : [x, y, z];
    for (const p of CABEZA) d = smin(d, p.f(hx, hy, hz), p.k);
    return d - grosor;
  };
};

const crearCuerpo = (movil: boolean, res: number) => {
  const sd = sdPersona(movil);
  const caja = {c: [0, 0.95, 0.05] as V, m: [0.47, 0.97, 0.3] as V};
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 500000);
  const f = mc.field;
  const h = res / 2;
  for (let z = 0; z < res; z++) {
    const wz = caja.c[2] + ((z - h) / h) * caja.m[2];
    for (let y = 0; y < res; y++) {
      const wy = caja.c[1] + ((y - h) / h) * caja.m[1];
      for (let x = 0; x < res; x++) {
        const wx = caja.c[0] + ((x - h) / h) * caja.m[0];
        f[x + y * res + z * res * res] = -sd(wx, wy, wz);
      }
    }
  }
  mc.isolation = 0;
  mc.update();
  const n = mc.count;
  const src = (mc.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const e = 0.0015;
  for (let i = 0; i < n; i++) {
    const x = caja.c[0] + src[i * 3] * caja.m[0];
    const y = caja.c[1] + src[i * 3 + 1] * caja.m[1];
    const z = caja.c[2] + src[i * 3 + 2] * caja.m[2];
    pos.set([x, y, z], i * 3);
    const gx = sd(x + e, y, z) - sd(x - e, y, z);
    const gy = sd(x, y + e, z) - sd(x, y - e, z);
    const gz = sd(x, y, z + e) - sd(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1;
    nor.set([gx / l, gy / l, gz / l], i * 3);
  }
  mc.geometry.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  return g;
};
/** Hombre mirando el móvil (cabeza inclinada, brazo izquierdo doblado). */
export const geoPersonaMovil = memo(() => crearCuerpo(true, 168));
/** Hombre en reposo (pose A). */
export const geoPersonaReposo = memo(() => crearCuerpo(false, 168));

/* -------------------------------------------------------------- huesos y vasos del brazo doblado */
const tubo = (pts: V[], r: number) => tuboVariable(pts, (u) => r * (1 - u * 0.35), 40, 8).geo;
export const geoBrazoHuesos = memo(() => [
  tuboVariable([HOMBRO, [(HOMBRO[0] + CODO[0]) / 2, (HOMBRO[1] + CODO[1]) / 2, (HOMBRO[2] + CODO[2]) / 2], CODO], (u) => 0.011 * (1 + Math.max(0, 1 - u * 8) * 0.6 + Math.max(0, u * 8 - 7) * 0.6), 16, 8).geo,
  tuboVariable([CODO, [(CODO[0] + MUNECA[0]) / 2, (CODO[1] + MUNECA[1]) / 2, (CODO[2] + MUNECA[2]) / 2], MUNECA], (u) => 0.008 * (1 + Math.max(0, 1 - u * 8) * 0.6 + Math.max(0, u * 8 - 7) * 0.6), 16, 8).geo,
]);
export const geoBrazoArteria = memo(() => tubo([[0.02, 1.42, -0.01], [0.12, 1.43, -0.01], [0.21, 1.4, 0.0], [CODO[0], CODO[1], CODO[2] + 0.01], [MUNECA[0], MUNECA[1], MUNECA[2] + 0.005], MANO_C], 0.0045));
export const geoBrazoVena = memo(() => {
  const g = geoBrazoArteria().clone();
  g.translate(-0.01, 0, 0.008);
  return g;
});

/* -------------------------------------------------------------- móvil genérico */
/** Medidas del móvil (m). */
export const TEL = {ancho: 0.072, alto: 0.152, fondo: 0.0082};
export const geoCuerpoMovil = memo(() => new RoundedBoxGeometry(TEL.ancho, TEL.alto, TEL.fondo, 6, 0.0085));
export const geoPantalla = memo(() => {
  // rectángulo con esquinas redondeadas (uv de 0 a 1)
  const w = TEL.ancho - 0.004;
  const h = TEL.alto - 0.004;
  const r = 0.007;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const g = new THREE.ShapeGeometry(s, 8);
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
});

/* -------------------------------------------------------------- ojo */
/** Globo ocular (diámetro 1) con relieve suave y abertura delante (+z) para el iris y la córnea. */
export const geoGlobo = memo(() => deformar(new THREE.SphereGeometry(0.5, 128, 96, 0, Math.PI * 2, 0, Math.PI - 0.5).rotateX(-Math.PI / 2), (p) => p.addScaledVector(p.clone().normalize(), fbm3(p.x * 4, p.y * 4, p.z * 4, 2) * 0.004)));
/** Córnea: casquete transparente sobre el iris (eje +z). */
export const geoCornea = memo(() => {
  const g = new THREE.SphereGeometry(0.29, 96, 48, 0, Math.PI * 2, 0, 0.95);
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, 0.5 * Math.cos(0.5) - 0.29 * Math.cos(0.95));
  return g;
});
/** Iris: disco algo cóncavo con fibras radiales (eje +z, uv polar). */
export const geoIris = memo(() => {
  const g = new THREE.RingGeometry(0.075, 0.23, 128, 8);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getY(i));
    p.setZ(i, 0.455 - (r - 0.075) * 0.12 + Math.sin(Math.atan2(p.getY(i), p.getX(i)) * 60) * 0.0015);
  }
  g.computeVertexNormals();
  return g;
});
/** Párpado: casquete de esfera algo mayor que el globo, centrado en +y (arriba) o −y (abajo).
 * Al girarlo sobre el eje x su borde baja (o sube) por delante del ojo. */
export const geoParpado = (arriba: boolean) => {
  const g = new THREE.SphereGeometry(0.54, 96, 48, 0, Math.PI * 2, 0, arriba ? 1.2 : 1.3);
  if (!arriba) g.rotateX(Math.PI);
  return deformar(g, (p) => p.addScaledVector(p.clone().normalize(), fbm3(p.x * 6, p.y * 6, p.z * 6, 2) * 0.006));
};

/* -------------------------------------------------------------- cerebro: estructuras internas */
/** Glándula pineal (piña diminuta). Unidad ≈ 1. */
export const geoPineal = memo(() =>
  deformar(new THREE.SphereGeometry(0.5, 48, 36), (p) => {
    p.y *= 1.35;
    p.x *= 0.8;
    p.z *= 0.8;
    const a = Math.atan2(p.z, p.x);
    const esc = Math.abs(Math.sin(a * 6 + p.y * 14)) * 0.04;
    p.addScaledVector(p.clone().normalize(), esc);
  }),
);
/** Núcleo profundo (accumbens, área tegmental ventral): elipsoide blando. */
export const geoNucleo = memo(() => deformar(new THREE.SphereGeometry(0.5, 40, 30), (p) => p.addScaledVector(p.clone().normalize(), ruido3(p.x * 5, p.y * 5, p.z * 5) * 0.05)));

/* -------------------------------------------------------------- sinapsis */
/** Botón presináptico: bulbo que se estrecha hacia arriba en un axón (eje −y = hendidura). */
export const geoBoton = memo(() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    const y = -1 + u * 3.2;
    let r: number;
    if (y < 0.6) r = Math.sqrt(Math.max(0, 1 - y * y)) * 1.25;
    else r = 0.32 + 0.68 * Math.exp(-(((y - 0.6) / 0.45) ** 2));
    pts.push(new THREE.Vector2(Math.max(0.0001, r), y));
  }
  const g = new THREE.LatheGeometry(pts, 96);
  return deformar(g, (p) => p.addScaledVector(p.clone().setY(0).normalize(), fbm3(p.x * 1.5, p.y * 1.5, p.z * 1.5, 3) * 0.08));
});
/** Membrana postsináptica: superficie ondulada (plano y = 0). */
export const geoMembrana = memo(() => {
  const g = new THREE.PlaneGeometry(9, 9, 160, 160);
  g.rotateX(-Math.PI / 2);
  return deformar(g, (p) => {
    p.y = -(Math.hypot(p.x, p.z) ** 2) * 0.035 + fbm3(p.x * 0.6, 0, p.z * 0.6, 3) * 0.12;
  });
});

/* -------------------------------------------------------------- moléculas */
/** Dopamina: anillo de benceno con dos OH y la cadena de etilamina. */
export const geoDopamina = memo(() => {
  const at: [V, number][] = [];
  const en: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    at.push([[Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0], 0.15]);
    en.push([i, (i + 1) % 6]);
  }
  const ext = (i: number, k: number) => [Math.cos((i / 6) * Math.PI * 2) * k, Math.sin((i / 6) * Math.PI * 2) * k, 0] as V;
  at.push([ext(2, 0.82), 0.13], [ext(3, 0.82), 0.13]); // OH
  en.push([2, 6], [3, 7]);
  at.push([ext(0, 0.86), 0.15], [[1.18, 0.3, 0.12], 0.15], [[1.58, 0.15, 0.05], 0.14]); // CH2-CH2-NH2
  en.push([0, 8], [8, 9], [9, 10]);
  return molecula(at, en);
});
/** Melatonina: indol (anillos de 6 y 5) con metoxilo y cadena de acetamida. */
export const geoMelatonina = memo(() => {
  const at: [V, number][] = [];
  const en: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    at.push([[Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0], 0.15]);
    en.push([i, (i + 1) % 6]);
  }
  // anillo de 5 fusionado sobre el enlace 0-5
  at.push([[0.75, 0.52, 0], 0.15], [[1.05, 0.15, 0], 0.15], [[0.75, -0.25, 0], 0.15]);
  en.push([0, 6], [6, 7], [7, 8], [8, 5]);
  at.push([[-0.78, 0.45, 0.05], 0.13], [[-1.1, 0.75, 0.0], 0.12]); // O-CH3
  en.push([2, 9], [9, 10]);
  at.push([[1.05, 0.95, 0.1], 0.14], [[1.45, 1.2, 0.05], 0.14], [[1.85, 1.0, 0.1], 0.13], [[2.2, 1.25, 0.0], 0.14], [[2.1, 0.6, 0.1], 0.12]);
  en.push([6, 11], [11, 12], [12, 13], [13, 14], [13, 15]);
  return molecula(at, en);
});
/** Vesícula sináptica (esfera con membrana algo irregular). */
export const geoVesicula = memo(() => deformar(new THREE.IcosahedronGeometry(0.5, 4), (p) => p.addScaledVector(p.clone().normalize(), fbm3(p.x * 4, p.y * 4, p.z * 4, 2) * 0.04)));
/** Icono de notificación en 3D: placa redondeada (para atraer la atención). */
export const geoPlaca = memo(() => new RoundedBoxGeometry(1, 1, 0.22, 5, 0.24));

export {fusionar};
