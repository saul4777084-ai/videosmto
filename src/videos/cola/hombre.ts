import * as THREE from 'three';
import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';
import {deformar, fbm3, fusionar, molecula, tuboVariable} from '../ayuno/anatomia';

/**
 * Geometría propia del vídeo de la Coca-Cola (todo generado por código, sin modelos externos):
 * hombre adulto (espalda ancha, cadera estrecha), esófago, páncreas, botella genérica de refresco
 * (sin marca ni logotipo), vaso de agua y moléculas (fructosa, insulina, cafeína).
 * Unidades en metros: pies en y = 0, mira hacia +z, el lado izquierdo del personaje en +x.
 */

type V = [number, number, number];
const memo = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};

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

const PRIMS: {f: Prim; k: number}[] = [
  // cabeza, mandíbula marcada, mentón, nariz, orejas
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.668, 0.004], [0.08, 0.106, 0.097]), k: 0.02},
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.597, 0.028], [0.064, 0.052, 0.068]), k: 0.035},
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.565, 0.068], [0.03, 0.022, 0.026]), k: 0.03},
  {f: (x, y, z) => sdCapsula(x, y, z, [0, 1.668, 0.1], [0, 1.626, 0.116], 0.009, 0.015), k: 0.015},
  ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.081 * s, 1.655, -0.005], [0.012, 0.03, 0.02]), 0.01),
  // cuello ancho y trapecios
  {f: (x, y, z) => sdCapsula(x, y, z, [0, 1.46, -0.01], [0, 1.6, 0.0], 0.06, 0.052), k: 0.035},
  {f: (x, y, z) => sdCapsula(x, y, z, [-0.17, 1.445, -0.03], [0.17, 1.445, -0.03], 0.055, 0.055), k: 0.07},
  // tórax ancho, pectorales planos, abdomen, pelvis estrecha
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.31, 0.0], [0.185, 0.19, 0.112]), k: 0.06},
  ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.085 * s, 1.355, 0.055], [0.095, 0.058, 0.048]), 0.04),
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.1, 0.012], [0.138, 0.165, 0.098]), k: 0.08},
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 0.935, 0.0], [0.152, 0.105, 0.1]), k: 0.07},
  ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.066 * s, 0.885, -0.048], [0.066, 0.07, 0.06]), 0.05),
  // hombros (deltoides grandes)
  ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.205 * s, 1.418, -0.01], [0.068, 0.062, 0.064]), 0.05),
  // brazos en pose A
  ...par((s) => (x, y, z) => sdCapsula(x, y, z, [0.21 * s, 1.41, -0.01], [0.29 * s, 1.135, -0.02], 0.052, 0.04), 0.03),
  ...par((s) => (x, y, z) => sdCapsula(x, y, z, [0.29 * s, 1.135, -0.02], [0.348 * s, 0.875, 0.01], 0.042, 0.029), 0.025),
  ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.372 * s, 0.8, 0.015], [0.025, 0.064, 0.042]), 0.02),
  ...par((s) => (x, y, z) => sdCapsula(x, y, z, [0.367 * s, 0.815, 0.048], [0.377 * s, 0.77, 0.062], 0.011, 0.01), 0.01),
  // piernas
  ...par((s) => (x, y, z) => sdCapsula(x, y, z, [0.088 * s, 0.9, 0.0], [0.1 * s, 0.5, 0.005], 0.08, 0.054), 0.05),
  ...par((s) => (x, y, z) => sdCapsula(x, y, z, [0.1 * s, 0.5, 0.005], [0.11 * s, 0.09, -0.01], 0.052, 0.033), 0.03),
  ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.1 * s, 0.38, -0.03], [0.048, 0.088, 0.05]), 0.04),
  ...par((s) => (x, y, z) => sdElipsoide(x, y, z, [0.115 * s, 0.035, 0.04], [0.042, 0.033, 0.115]), 0.035),
];
const sdHombre = (x: number, y: number, z: number, grosor = 0) => {
  let d = 1e9;
  for (const p of PRIMS) d = smin(d, p.f(x, y, z), p.k);
  return d - grosor;
};

const CAJA = {c: [0, 0.95, 0] as V, m: [0.47, 0.97, 0.21] as V};
const crearCuerpo = (grosor: number, res: number) => {
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 400000);
  const f = mc.field;
  const h = res / 2;
  for (let z = 0; z < res; z++) {
    const wz = CAJA.c[2] + ((z - h) / h) * CAJA.m[2];
    for (let y = 0; y < res; y++) {
      const wy = CAJA.c[1] + ((y - h) / h) * CAJA.m[1];
      for (let x = 0; x < res; x++) {
        const wx = CAJA.c[0] + ((x - h) / h) * CAJA.m[0];
        f[x + y * res + z * res * res] = -sdHombre(wx, wy, wz, grosor);
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
    const x = CAJA.c[0] + src[i * 3] * CAJA.m[0];
    const y = CAJA.c[1] + src[i * 3 + 1] * CAJA.m[1];
    const z = CAJA.c[2] + src[i * 3 + 2] * CAJA.m[2];
    pos.set([x, y, z], i * 3);
    const gx = sdHombre(x + e, y, z, grosor) - sdHombre(x - e, y, z, grosor);
    const gy = sdHombre(x, y + e, z, grosor) - sdHombre(x, y - e, z, grosor);
    const gz = sdHombre(x, y, z + e, grosor) - sdHombre(x, y, z - e, grosor);
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
export const geoHombre = memo(() => crearCuerpo(0, 150));
export const geoMusculosHombre = memo(() => crearCuerpo(-0.007, 130));

/** Mano izquierda del personaje (donde sostiene la botella y luego el vaso). */
export const MANO: V = [0.374, 0.8, 0.05];

/* -------------------------------------------------------------- aparato digestivo */
/** Boca → faringe → esófago → entrada del estómago (coordenadas del cuerpo). */
export const RUTA_ESOFAGO: V[] = [
  [0, 1.612, 0.088],
  [0, 1.608, 0.04],
  [0, 1.575, 0.005],
  [0, 1.5, -0.016],
  [0.0, 1.4, -0.03],
  [0.012, 1.31, -0.018],
  [0.04, 1.255, 0.012],
  [0.05, 1.234, 0.03],
];
export const esofago = memo(() => tuboVariable(RUTA_ESOFAGO, (u) => (u < 0.12 ? 0.013 : 0.0085), 160, 16));

/** Páncreas (unidad ≈ 15 cm): cabeza ancha a la derecha del personaje (−x), cola fina hacia +x. */
export const geoPancreas = memo(() => {
  const {geo} = tuboVariable(
    [[-0.55, -0.12, 0.05], [-0.4, 0.0, 0.1], [-0.15, 0.04, 0.08], [0.15, 0.08, 0.02], [0.4, 0.14, -0.04], [0.6, 0.22, -0.08]],
    (u) => 0.17 * (1 - u * 0.62) * (u < 0.06 ? 0.6 + u * 6 : 1) * (u > 0.96 ? 0.7 : 1),
    140,
    40,
  );
  // lobulillos
  return deformar(geo, (p) => {
    const n = fbm3(p.x * 14, p.y * 14, p.z * 14, 3);
    p.multiplyScalar(1).add(new THREE.Vector3(0, n * 0.012, n * 0.012));
    p.y += fbm3(p.x * 30 + 3, p.y * 30, p.z * 30, 2) * 0.008;
  });
});

/* -------------------------------------------------------------- botella y vaso */
/** Perfil de una botella genérica de refresco de 0,5 L (altura 1, base en y = 0). */
const perfilBotella = (k = 1, hasta = 1) => {
  const pts: THREE.Vector2[] = [];
  const r = (y: number) => {
    if (y < 0.03) return 0.13 + (y / 0.03) * 0.04;
    if (y < 0.56) return 0.17 - Math.exp(-(((y - 0.36) / 0.07) ** 2)) * 0.014 - Math.exp(-(((y - 0.13) / 0.03) ** 2)) * 0.006;
    if (y < 0.8) {
      const u = (y - 0.56) / 0.24;
      return 0.062 + (0.17 - 0.062) * (0.5 + 0.5 * Math.cos(u * Math.PI));
    }
    if (y < 0.905) return 0.062 - (y > 0.88 ? 0.004 : 0);
    return 0.066;
  };
  const N = 90;
  pts.push(new THREE.Vector2(0.0001, 0));
  for (let i = 0; i <= N; i++) {
    const y = (i / N) * hasta;
    pts.push(new THREE.Vector2(r(y) * k, y));
  }
  pts.push(new THREE.Vector2(0.0001, hasta));
  return pts;
};
export const geoBotella = memo(() => new THREE.LatheGeometry(perfilBotella(1, 0.905), 64));
export const geoLiquidoBotella = (nivel: number) => new THREE.LatheGeometry(perfilBotella(0.93, nivel), 48);
export const geoTapon = memo(() => {
  const g = new THREE.CylinderGeometry(0.07, 0.07, 0.09, 40, 1, false);
  return deformar(g, (p) => {
    const a = Math.atan2(p.z, p.x);
    const k = 1 + (Math.abs(p.y) < 0.044 ? Math.sin(a * 40) * 0.025 : 0);
    p.x *= k;
    p.z *= k;
  });
});

/** Vaso de agua (altura 1, base en y = 0). */
const perfilVaso = (k: number, hasta: number, dentro: boolean) => {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.0001, dentro ? 0.08 : 0)];
  const N = 30;
  for (let i = 0; i <= N; i++) {
    const y = (dentro ? 0.08 : 0) + (i / N) * (hasta - (dentro ? 0.08 : 0));
    pts.push(new THREE.Vector2((0.3 + y * 0.07) * k, y));
  }
  pts.push(new THREE.Vector2(0.0001, hasta));
  return pts;
};
export const geoVaso = memo(() => new THREE.LatheGeometry(perfilVaso(1, 1, false), 56));
export const geoAguaVaso = memo(() => new THREE.LatheGeometry(perfilVaso(0.93, 0.78, true), 48));

/* -------------------------------------------------------------- moléculas */
/** Fructosa: anillo de cinco átomos con grupos OH. */
export const geoFructosa = memo(() => {
  const at: [V, number][] = [];
  const en: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    at.push([[Math.cos(a) * 0.45, i % 2 ? 0.06 : -0.06, Math.sin(a) * 0.45], i === 0 ? 0.17 : 0.15]);
    en.push([i, (i + 1) % 5]);
  }
  for (let i = 1; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    at.push([[Math.cos(a) * 0.82, i % 2 ? 0.32 : -0.32, Math.sin(a) * 0.82], 0.11]);
    en.push([i, at.length - 1]);
  }
  return molecula(at, en);
});
/** Insulina (representación simplificada): hexámero de subunidades. */
export const geoInsulina = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const s = new THREE.IcosahedronGeometry(0.2, 2);
    deformar(s, (p) => p.addScaledVector(p.clone().normalize(), fbm3(p.x * 9 + i, p.y * 9, p.z * 9, 2) * 0.04));
    s.translate(Math.cos(a) * 0.3, (i % 2 ? 0.07 : -0.07), Math.sin(a) * 0.3);
    gs.push(s);
  }
  const c = new THREE.IcosahedronGeometry(0.12, 1);
  gs.push(c);
  return fusionar(gs);
});
/** Cafeína (dos anillos fusionados con metilos). */
export const geoCafeina = memo(() =>
  molecula(
    [
      [[0, 0, 0], 0.15], [[0.42, 0.24, 0], 0.15], [[0.84, 0, 0], 0.15], [[0.84, -0.48, 0], 0.15], [[0.42, -0.72, 0], 0.15], [[0, -0.48, 0], 0.15],
      [[1.28, 0.14, 0], 0.15], [[1.5, -0.25, 0], 0.15], [[1.24, -0.62, 0], 0.15],
      [[0.42, 0.7, 0], 0.12], [[-0.42, 0.24, 0], 0.12], [[0.42, -1.18, 0], 0.12], [[1.48, -1.0, 0], 0.12],
    ],
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6], [6, 7], [7, 8], [8, 3], [1, 9], [0, 10], [4, 11], [8, 12]],
  ),
);
/** Gota de grasa (esfera algo irregular). */
export const geoGota = memo(() => deformar(new THREE.IcosahedronGeometry(0.5, 4), (p) => p.addScaledVector(p.clone().normalize(), fbm3(p.x * 3, p.y * 3, p.z * 3, 2) * 0.05)));
/** Receptor de insulina en forma de Y (sobre la membrana, eje +y hacia fuera). */
export const geoReceptor = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  const tallo = new THREE.CapsuleGeometry(0.06, 0.5, 4, 10);
  tallo.translate(0, 0.1, 0);
  gs.push(tallo);
  for (const s of [-1, 1]) {
    const b = new THREE.CapsuleGeometry(0.055, 0.32, 4, 10);
    b.translate(0, 0.16, 0);
    b.rotateZ(s * 0.6);
    b.translate(0, 0.38, 0);
    gs.push(b);
  }
  return fusionar(gs);
});
/** Canal de glucosa (GLUT4): anillo de hélices. */
export const geoCanal = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.CapsuleGeometry(0.075, 0.55, 4, 10);
    c.translate(Math.cos((i / 7) * Math.PI * 2) * 0.17, 0, Math.sin((i / 7) * Math.PI * 2) * 0.17);
    gs.push(c);
  }
  return fusionar(gs);
});
