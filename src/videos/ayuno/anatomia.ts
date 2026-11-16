import * as THREE from 'three';
import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';

/**
 * Modelos anatómicos originales generados por código (sin modelos externos).
 * Unidades en metros: el cuerpo mide ~1,8 m, pies en y = 0, mira hacia +z.
 * El lado izquierdo del paciente queda en +x (a la derecha de la cámara).
 */

type V = [number, number, number];
const memo = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};

/* -------------------------------------------------------------- ruido 3D (para deformar) */
const hash = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};
const suav = (t: number) => t * t * (3 - 2 * t);
/** Ruido de valor 3D suave en [-1, 1]. */
export const ruido3 = (x: number, y: number, z: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = suav(x - xi), yf = suav(y - yi), zf = suav(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return (
    l(
      l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
      l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
      zf,
    ) *
      2 -
    1
  );
};
export const fbm3 = (x: number, y: number, z: number, oct = 4) => {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * ruido3(x * f, y * f, z * f);
    n += a;
    a *= 0.5;
    f *= 2.03;
  }
  return s / n;
};
const sstep = (a: number, b: number, x: number) => suav(Math.min(1, Math.max(0, (x - a) / (b - a))));

/** Deforma los vértices de una geometría y recalcula normales. */
const deformar = (g: THREE.BufferGeometry, f: (p: THREE.Vector3) => void) => {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    f(p);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  return g;
};

/* -------------------------------------------------------------- cuerpo humano (SDF) */

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
const espejo = (f: (s: number) => Prim): Prim[] => [f(1), f(-1)];

/** Distancia con signo al cuerpo humano (negativa dentro). `grosor` engorda o adelgaza. */
const PRIMS: {f: Prim; k: number}[] = [
  // cabeza, mandíbula, nariz, orejas
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.665, 0.005], [0.078, 0.104, 0.095]), k: 0.02},
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.6, 0.03], [0.058, 0.05, 0.065]), k: 0.04},
  {f: (x, y, z) => sdCapsula(x, y, z, [0, 1.665, 0.098], [0, 1.625, 0.112], 0.008, 0.013), k: 0.015},
  ...espejo((s) => (x, y, z) => sdElipsoide(x, y, z, [0.079 * s, 1.655, -0.005], [0.012, 0.03, 0.02])).map((f) => ({f, k: 0.01})),
  // cuello y trapecios
  {f: (x, y, z) => sdCapsula(x, y, z, [0, 1.47, -0.01], [0, 1.6, 0.0], 0.052, 0.046), k: 0.03},
  {f: (x, y, z) => sdCapsula(x, y, z, [-0.15, 1.44, -0.03], [0.15, 1.44, -0.03], 0.05, 0.05), k: 0.06},
  // tórax, pecho, abdomen, pelvis
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.31, 0.0], [0.165, 0.18, 0.105]), k: 0.06},
  ...espejo((s) => (x, y, z) => sdElipsoide(x, y, z, [0.075 * s, 1.33, 0.06], [0.085, 0.07, 0.05])).map((f) => ({f, k: 0.04})),
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 1.1, 0.01], [0.14, 0.16, 0.098]), k: 0.08},
  {f: (x, y, z) => sdElipsoide(x, y, z, [0, 0.93, 0.0], [0.165, 0.11, 0.105]), k: 0.07},
  ...espejo((s) => (x, y, z) => sdElipsoide(x, y, z, [0.07 * s, 0.88, -0.05], [0.075, 0.075, 0.065])).map((f) => ({f, k: 0.05})),
  // hombros (deltoides)
  ...espejo((s) => (x, y, z) => sdElipsoide(x, y, z, [0.19 * s, 1.42, -0.01], [0.06, 0.055, 0.058])).map((f) => ({f, k: 0.05})),
  // brazos en pose A
  ...espejo((s) => (x, y, z) => sdCapsula(x, y, z, [0.2 * s, 1.41, -0.01], [0.285 * s, 1.135, -0.02], 0.046, 0.036)).map((f) => ({f, k: 0.03})),
  ...espejo((s) => (x, y, z) => sdCapsula(x, y, z, [0.285 * s, 1.135, -0.02], [0.345 * s, 0.875, 0.01], 0.036, 0.026)).map((f) => ({f, k: 0.025})),
  ...espejo((s) => (x, y, z) => sdElipsoide(x, y, z, [0.37 * s, 0.8, 0.015], [0.022, 0.06, 0.038])).map((f) => ({f, k: 0.02})),
  ...espejo((s) => (x, y, z) => sdCapsula(x, y, z, [0.365 * s, 0.815, 0.045], [0.375 * s, 0.77, 0.06], 0.01, 0.009)).map((f) => ({f, k: 0.01})),
  // piernas
  ...espejo((s) => (x, y, z) => sdCapsula(x, y, z, [0.09 * s, 0.9, 0.0], [0.1 * s, 0.5, 0.005], 0.082, 0.052)).map((f) => ({f, k: 0.05})),
  ...espejo((s) => (x, y, z) => sdCapsula(x, y, z, [0.1 * s, 0.5, 0.005], [0.11 * s, 0.09, -0.01], 0.05, 0.032)).map((f) => ({f, k: 0.03})),
  ...espejo((s) => (x, y, z) => sdElipsoide(x, y, z, [0.1 * s, 0.38, -0.03], [0.045, 0.085, 0.048])).map((f) => ({f, k: 0.04})),
  ...espejo((s) => (x, y, z) => sdElipsoide(x, y, z, [0.115 * s, 0.035, 0.04], [0.04, 0.032, 0.11])).map((f) => ({f, k: 0.035})),
];
export const sdCuerpo = (x: number, y: number, z: number, grosor = 0) => {
  let d = 1e9;
  for (const p of PRIMS) d = smin(d, p.f(x, y, z), p.k);
  return d - grosor;
};

const CAJA = {c: [0, 0.95, 0] as V, m: [0.46, 0.97, 0.2] as V};

/** Malla lisa del cuerpo humano (marching cubes sobre la distancia con signo). */
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
        f[x + y * res + z * res * res] = -sdCuerpo(wx, wy, wz, grosor);
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
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    // normal = gradiente de la distancia (suave, aunque la rejilla sea anisótropa)
    let gx = sdCuerpo(x + e, y, z, grosor) - sdCuerpo(x - e, y, z, grosor);
    let gy = sdCuerpo(x, y + e, z, grosor) - sdCuerpo(x, y - e, z, grosor);
    let gz = sdCuerpo(x, y, z + e, grosor) - sdCuerpo(x, y, z - e, grosor);
    const l = Math.hypot(gx, gy, gz) || 1;
    gx /= l;
    gy /= l;
    gz /= l;
    nor[i * 3] = gx;
    nor[i * 3 + 1] = gy;
    nor[i * 3 + 2] = gz;
  }
  mc.geometry.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  return g;
};
export const geoCuerpo = memo(() => crearCuerpo(0, 150));
/** Capa muscular (algo más fina que la piel). */
export const geoMusculos = memo(() => crearCuerpo(-0.007, 130));

/* -------------------------------------------------------------- tubos con radio variable */

/** Tubo a lo largo de una curva con radio función de u (0..1). uv.x = recorrido. */
export const tuboVariable = (puntos: V[], radio: (u: number) => number, seg = 120, radial = 20, cerrado = false) => {
  const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(...p)), cerrado, 'centripetal');
  const g = new THREE.TubeGeometry(curva, seg, 1, radial, cerrado);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const c = curva.getPointAt(Math.min(u, 1));
    const r = radio(u);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, p.x, p.y, p.z);
    }
  }
  g.computeVertexNormals();
  return {geo: g, curva};
};

/* -------------------------------------------------------------- órganos */

/** Corazón (unidad ≈ 1 = 12 cm): ventrículos con ápex hacia la izquierda, aurículas y grandes vasos. */
export const geoCorazon = memo(() => {
  const g = new THREE.SphereGeometry(0.5, 128, 96);
  return deformar(g, (p) => {
    const y = p.y / 0.5;
    // se estrecha hacia el ápex (abajo) y se inclina hacia la izquierda del paciente
    const k = y < 0 ? 1 + y * 0.62 : 1 - y * y * 0.08;
    p.x *= k * 1.05;
    p.z *= k * 0.9;
    if (y < 0) p.x += -y * y * 0.12;
    p.y *= 1.18;
    // surco interventricular
    const surco = Math.exp(-(((p.x + 0.05 - p.y * 0.25) / 0.05) ** 2)) * (p.z > 0 ? 0.035 : 0.02);
    const n = p.clone().normalize();
    p.addScaledVector(n, -surco + fbm3(p.x * 6, p.y * 6, p.z * 6, 3) * 0.012);
    // aurículas: abultamientos arriba
    const au = Math.exp(-(((p.x + 0.2) ** 2 + (p.y - 0.42) ** 2 + (p.z + 0.05) ** 2) / 0.03)) * 0.09 + Math.exp(-(((p.x - 0.18) ** 2 + (p.y - 0.4) ** 2 + (p.z + 0.1) ** 2) / 0.025)) * 0.08;
    p.addScaledVector(n, au);
  });
});
/** Grandes vasos del corazón: aorta (arco), tronco pulmonar y vena cava (en unidades del corazón). */
export const vasosCorazon = memo(() => ({
  aorta: tuboVariable([[-0.02, 0.35, 0.05], [-0.05, 0.75, 0.08], [0.05, 0.98, 0.0], [0.22, 0.95, -0.15], [0.26, 0.6, -0.25], [0.24, 0.1, -0.3]], (u) => 0.13 - u * 0.03, 90, 18),
  pulmonar: tuboVariable([[0.12, 0.3, 0.2], [0.14, 0.62, 0.18], [0.02, 0.78, 0.05], [-0.18, 0.76, -0.05]], () => 0.105, 60, 18),
  pulmonarI: tuboVariable([[0.14, 0.62, 0.18], [0.32, 0.72, 0.02], [0.5, 0.7, -0.08]], () => 0.08, 40, 16),
  cava: tuboVariable([[-0.3, 0.3, 0.0], [-0.33, 0.7, -0.02], [-0.32, 1.05, -0.04]], () => 0.09, 40, 16),
}));
/** Arterias coronarias sobre la superficie. */
export const coronarias = memo(() => {
  const g = geoCorazon();
  const ray = new THREE.Raycaster();
  const m = new THREE.Mesh(g);
  const sobre = (dir: THREE.Vector3) => {
    ray.set(dir.clone().multiplyScalar(2), dir.clone().negate().normalize());
    const hit = ray.intersectObject(m)[0];
    return hit ? hit.point.addScaledVector(dir.clone().normalize(), 0.012) : dir.clone().multiplyScalar(0.5);
  };
  const ramas: V[][] = [];
  const base: [number, number][] = [[-0.2, 0.25], [0.25, 0.2], [0.05, 0.15], [-0.45, 0.0]];
  base.forEach(([ax, ay], k) => {
    const pts: V[] = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const ang = ax + u * (k % 2 ? 0.5 : -0.4) + Math.sin(u * 5 + k) * 0.08;
      const yy = ay - u * 1.0;
      const d = new THREE.Vector3(Math.sin(ang * Math.PI), yy, Math.cos(ang * Math.PI));
      const q = sobre(d);
      pts.push([q.x, q.y, q.z]);
    }
    ramas.push(pts);
  });
  return ramas.map((r, i) => tuboVariable(r, (u) => (0.022 - u * 0.012) * (i === 3 ? 0.8 : 1), 50, 8).geo);
});

/** Pulmón (lado +1 izquierdo, -1 derecho), unidad = altura del pulmón (~25 cm). */
export const geoPulmon = (lado: number) =>
  deformar(new THREE.SphereGeometry(0.5, 96, 72), (p) => {
    const y = p.y / 0.5;
    p.x *= 0.62;
    p.z *= 0.78;
    // ápice estrecho arriba, base ancha y cóncava sobre el diafragma
    const k = 0.55 + 0.45 * sstep(1, -0.4, y);
    p.x *= k;
    p.z *= k;
    if (y < -0.6) p.y += (y + 0.6) * -0.12 * (1 - (p.x * p.x + p.z * p.z) * 4);
    // cara medial plana (y hueco cardiaco en el izquierdo)
    const medial = -lado * p.x;
    if (medial > 0.08) p.x = -lado * (0.08 + (medial - 0.08) * 0.35);
    if (lado > 0 && medial > 0 && y < 0.1 && y > -0.7 && p.z > -0.05) p.x += lado * 0.08 * sstep(0.1, -0.3, y);
    // cisuras entre lóbulos
    const cis = Math.exp(-(((p.y + p.z * 0.6 - (lado > 0 ? 0.0 : 0.08)) / 0.02) ** 2)) * 0.03;
    const n = p.clone().normalize();
    p.addScaledVector(n, -cis + fbm3(p.x * 7, p.y * 7, p.z * 7, 3) * 0.01);
  });

/** Árbol bronquial: tráquea y ramas (en unidades del pulmón, origen entre ambos). */
export const geoBronquios = memo(() => {
  const tubos: THREE.BufferGeometry[] = [];
  const rama = (a: THREE.Vector3, dir: THREE.Vector3, largo: number, r: number, nivel: number) => {
    const b = a.clone().addScaledVector(dir, largo);
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3((hash(a.x, a.y, nivel) - 0.5) * largo * 0.2, 0, (hash(a.z, nivel, a.y) - 0.5) * largo * 0.2));
    tubos.push(tuboVariable([[a.x, a.y, a.z], [mid.x, mid.y, mid.z], [b.x, b.y, b.z]], (u) => r * (1 - u * 0.25), 10, 8).geo);
    if (nivel >= 5) return;
    for (const s of [-1, 1]) {
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), s * (0.45 + hash(nivel, s, a.x) * 0.3)).applyAxisAngle(new THREE.Vector3(0, 1, 0), (hash(a.y, s, nivel) - 0.5) * 1.6);
      rama(b, d.normalize(), largo * 0.72, r * 0.7, nivel + 1);
    }
  };
  tubos.push(tuboVariable([[0, 0.75, 0.02], [0, 0.4, 0.02], [0, 0.18, 0.0]], () => 0.045, 20, 14).geo);
  rama(new THREE.Vector3(0, 0.18, 0), new THREE.Vector3(1, -0.9, 0).normalize(), 0.16, 0.035, 1);
  rama(new THREE.Vector3(0, 0.18, 0), new THREE.Vector3(-1, -0.8, 0).normalize(), 0.16, 0.038, 1);
  return tubos;
});

/** Estómago en J (unidad ≈ 25 cm): fondo ancho, cuerpo y píloro estrecho. */
export const geoEstomago = memo(() => {
  const {geo, curva} = tuboVariable(
    [[-0.05, 0.55, 0.0], [0.05, 0.42, 0.02], [0.16, 0.32, 0.03], [0.2, 0.12, 0.04], [0.16, -0.1, 0.05], [0.02, -0.24, 0.06], [-0.16, -0.24, 0.05], [-0.3, -0.12, 0.03], [-0.36, -0.02, 0.02]],
    (u) => {
      const fondo = Math.exp(-(((u - 0.22) / 0.16) ** 2)) * 0.13;
      return 0.04 + fondo + 0.07 * sstep(0.05, 0.35, u) * (1 - sstep(0.55, 0.95, u)) + (u > 0.93 ? -0.01 : 0);
    },
    160,
    40,
  );
  return {geo, curva};
});

/** Hígado (unidad ≈ 20 cm): lóbulo derecho grande, izquierdo afilado. */
export const geoHigado = memo(() =>
  deformar(new THREE.SphereGeometry(0.5, 128, 80), (p) => {
    const x = p.x / 0.5;
    p.x *= 1.65;
    p.y *= 0.82;
    p.z *= 0.95;
    // el lóbulo izquierdo (+x) se afila
    const afila = 1 - 0.7 * sstep(-0.3, 1, x);
    p.y *= afila;
    p.z *= 0.6 + 0.4 * afila;
    // cara inferior plana y superior abombada (bajo el diafragma)
    if (p.y < 0) p.y *= 0.55;
    p.y += Math.max(0, 0.15 - Math.abs(x) * 0.1) * (p.y > 0 ? 0.3 : 0);
    // ligamento: surco entre lóbulos
    const n = p.clone().normalize();
    const surco = Math.exp(-(((x - 0.15) / 0.05) ** 2)) * 0.03 * (p.y > 0 ? 1 : 0);
    p.addScaledVector(n, -surco + fbm3(p.x * 5, p.y * 5, p.z * 5, 3) * 0.012);
  }),
);

/** Riñón (unidad ≈ 11 cm), con el hilio hacia la línea media. */
export const geoRinon = (lado: number) =>
  deformar(new THREE.SphereGeometry(0.5, 72, 56), (p) => {
    p.x *= 0.55;
    p.z *= 0.4;
    const medial = -lado * p.x;
    const hilio = Math.exp(-((p.y / 0.16) ** 2)) * (medial > 0 ? medial * 0.42 : 0);
    p.x += lado * hilio;
    p.addScaledVector(p.clone().normalize(), fbm3(p.x * 8, p.y * 8, p.z * 8, 2) * 0.006);
  });

/** Hemisferio cerebral con circunvoluciones (unidad ≈ 16 cm de largo). */
export const geoHemisferio = (lado: number) =>
  deformar(new THREE.SphereGeometry(0.5, 192, 144), (p) => {
    p.x *= 0.42;
    p.y *= 0.62;
    p.z *= 0.92;
    // aplanado medial y lóbulo temporal
    if (-lado * p.x > 0.02) p.x = -lado * (0.02 + (-lado * p.x - 0.02) * 0.25);
    if (p.y < -0.05 && p.z > -0.1) p.x *= 1.06;
    const n = p.clone().normalize();
    // circunvoluciones: bandas sinuosas a partir de ruido deformado (aspecto de laberinto)
    const w = ruido3(p.x * 3 + lado * 5, p.y * 3, p.z * 3) * 1.0 + ruido3(p.x * 7, p.y * 7 + 2, p.z * 7) * 0.35;
    const banda = 0.5 + 0.5 * Math.sin(w * 30);
    const surco = Math.pow(banda, 0.6);
    p.addScaledVector(n, surco * 0.02 - 0.012);
  });
export const geoCerebelo = memo(() =>
  deformar(new THREE.SphereGeometry(0.5, 96, 72), (p) => {
    p.x *= 0.62;
    p.y *= 0.3;
    p.z *= 0.36;
    const n = p.clone().normalize();
    p.addScaledVector(n, Math.abs(Math.sin(p.y * 90 + ruido3(p.x * 8, p.y * 8, p.z * 8) * 2)) * 0.008);
  }),
);

/** Intestino delgado: tubo largo enrollado dentro de una caja (unidad = m). */
export const geoIntestino = memo(() => {
  const pts: V[] = [];
  let a = 0;
  for (let i = 0; i < 70; i++) {
    a += 0.9 + hash(i, 1, 2) * 0.6;
    const fila = Math.floor(i / 10);
    const r = 0.055 + hash(i, 3, 4) * 0.03;
    pts.push([Math.cos(a) * r + (fila % 2 ? 0.01 : -0.01), 0.07 - fila * 0.022 + Math.sin(a * 0.5) * 0.01, Math.sin(a) * r * 0.45 + 0.01]);
  }
  return tuboVariable(pts, (u) => 0.0115 + Math.sin(u * 300) * 0.0006, 900, 12).geo;
});
/** Intestino grueso en marco (unidad = m), con haustras. */
export const geoColon = memo(
  () =>
    tuboVariable(
      [[-0.1, -0.08, 0.02], [-0.11, 0.0, 0.02], [-0.1, 0.09, 0.02], [0.0, 0.1, 0.04], [0.1, 0.09, 0.02], [0.11, 0.0, 0.02], [0.1, -0.08, 0.02], [0.04, -0.1, 0.03]],
      (u) => 0.022 + Math.abs(Math.sin(u * 60)) * 0.004,
      300,
      16,
    ).geo,
);

/* -------------------------------------------------------------- esqueleto y vasos del cuerpo */

export const geoColumna = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 24; i++) {
    const y = 0.98 + i * 0.026;
    const z = -0.065 - Math.sin(((i / 24) * Math.PI) * 2) * 0.012;
    const g = new THREE.CylinderGeometry(0.017 - i * 0.0003, 0.018 - i * 0.0003, 0.019, 16);
    g.translate(0, y, z);
    gs.push(g);
    const ap = new THREE.ConeGeometry(0.006, 0.03, 6);
    ap.rotateX(-Math.PI / 2 - 0.4);
    ap.translate(0, y - 0.004, z - 0.03);
    gs.push(ap);
  }
  return gs;
});
/** Costillas: 12 pares de arcos desde la columna hasta el esternón. */
export const geoCostillas = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 12; i++) {
    const y = 1.47 - i * 0.03;
    const ancho = 0.07 + Math.sin(Math.min(1, i / 6) * Math.PI * 0.5) * 0.08 - (i > 7 ? (i - 7) * 0.008 : 0);
    const fondo = 0.09 + Math.min(i, 6) * 0.004;
    const cae = 0.05 + i * 0.004;
    const largo = i < 7 ? 1 : 0.75 - (i - 7) * 0.08;
    for (const s of [-1, 1]) {
      const pts: V[] = [];
      for (let k = 0; k <= 12; k++) {
        const u = (k / 12) * largo;
        const a = u * Math.PI;
        pts.push([s * Math.sin(a) * ancho * 1.05, y - Math.sin(u * Math.PI * 0.5) * cae, -0.07 + (1 - Math.cos(a)) * 0.5 * fondo * 1.05 + 0.005]);
      }
      gs.push(tuboVariable(pts, () => 0.0055, 30, 6).geo);
    }
  }
  const est = new THREE.BoxGeometry(0.03, 0.17, 0.008);
  est.translate(0, 1.37, 0.115);
  gs.push(est);
  return gs;
});
export const geoPelvis = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    const g = new THREE.TorusGeometry(0.07, 0.016, 10, 24, Math.PI * 1.1);
    g.rotateY(s * 0.9);
    g.rotateX(-0.3);
    g.translate(s * 0.07, 0.95, -0.02);
    gs.push(g);
    gs.push(tuboVariable([[s * 0.06, 0.95, -0.01], [s * 0.09, 0.82, 0.0]], () => 0.016, 8, 8).geo);
  }
  return gs;
});
/** Huesos largos de brazos y piernas. */
export const geoHuesosLargos = memo(() => {
  const pares: [V, V, number][] = [
    [[0.2, 1.41, -0.01], [0.285, 1.135, -0.02], 0.011],
    [[0.285, 1.135, -0.02], [0.345, 0.875, 0.01], 0.008],
    [[0.09, 0.88, 0.0], [0.1, 0.5, 0.005], 0.014],
    [[0.1, 0.5, 0.005], [0.11, 0.09, -0.01], 0.011],
  ];
  const gs: THREE.BufferGeometry[] = [];
  for (const [a, b, r] of pares)
    for (const s of [-1, 1]) {
      const A: V = [a[0] * s, a[1], a[2]];
      const B: V = [b[0] * s, b[1], b[2]];
      gs.push(tuboVariable([A, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], B], (u) => r * (1 + Math.max(0, 1 - u * 8) * 0.6 + Math.max(0, u * 8 - 7) * 0.6), 16, 8).geo);
    }
  return gs;
});
/** Árbol arterial (rojo) y venoso (azul) del cuerpo completo. */
export const geoArterias = memo(() => {
  const rutas: [V[], number][] = [
    // aorta torácica y abdominal
    [[[0.02, 1.36, 0.0], [0.03, 1.42, -0.02], [0.01, 1.38, -0.05], [0.0, 1.2, -0.045], [0.0, 1.0, -0.035], [0.0, 0.95, -0.03]], 0.009],
    // carótidas
    [[[0.015, 1.42, -0.01], [0.025, 1.52, 0.0], [0.03, 1.62, 0.01]], 0.004],
    [[[-0.005, 1.42, -0.01], [-0.025, 1.52, 0.0], [-0.03, 1.62, 0.01]], 0.004],
    // subclavias → brazos
    ...([1, -1] as const).map((s): [V[], number] => [[[s * 0.02, 1.42, -0.01], [s * 0.12, 1.43, -0.01], [s * 0.21, 1.4, -0.0], [s * 0.285, 1.13, -0.005], [s * 0.345, 0.88, 0.02], [s * 0.37, 0.8, 0.025]], 0.0045]),
    // ilíacas → piernas
    ...([1, -1] as const).map((s): [V[], number] => [[[0, 0.95, -0.03], [s * 0.06, 0.9, 0.0], [s * 0.095, 0.75, 0.02], [s * 0.1, 0.5, 0.01], [s * 0.11, 0.2, -0.005], [s * 0.115, 0.06, 0.02]], 0.006]),
    // renales
    ...([1, -1] as const).map((s): [V[], number] => [[[0, 1.06, -0.04], [s * 0.04, 1.065, -0.045], [s * 0.055, 1.07, -0.05]], 0.003]),
  ];
  return rutas.map(([p, r]) => tuboVariable(p, (u) => r * (1 - u * 0.4), 80, 10).geo);
});
export const geoVenas = memo(() =>
  geoArterias().map((g) => {
    const c = g.clone();
    c.translate(-0.012, 0, 0.008);
    return c;
  }),
);

/* -------------------------------------------------------------- micro: células y moléculas */

/** Glóbulo rojo bicóncavo (diámetro 1). */
export const geoGlobuloRojo = memo(() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI;
    const r = Math.sin(a) * 0.5;
    const rr = r / 0.5;
    const h = (0.06 + 0.42 * rr * rr - 0.34 * rr ** 4) * 0.5;
    pts.push(new THREE.Vector2(Math.max(0.001, r), Math.cos(a) * h * 0.95 * (a < Math.PI / 2 ? 1 : 1)));
  }
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
});

const fusionar = (gs: THREE.BufferGeometry[]) => {
  // fusión simple de geometrías no indexadas/indexadas en una sola
  let n = 0;
  const preparadas = gs.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of preparadas) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  let o = 0;
  for (const g of preparadas) {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    o += g.attributes.position.count;
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return r;
};
export {fusionar};

/** Molécula de bolas y varillas a partir de átomos (posición, radio) y enlaces (índices). */
const molecula = (atomos: [V, number][], enlaces: [number, number][]) => {
  const gs: THREE.BufferGeometry[] = [];
  for (const [p, r] of atomos) {
    const s = new THREE.SphereGeometry(r, 18, 14);
    s.translate(...p);
    gs.push(s);
  }
  for (const [a, b] of enlaces) {
    const A = new THREE.Vector3(...atomos[a][0]);
    const B = new THREE.Vector3(...atomos[b][0]);
    const l = A.distanceTo(B);
    const c = new THREE.CylinderGeometry(0.045, 0.045, l, 8);
    c.translate(0, l / 2, 0);
    c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    c.translate(A.x, A.y, A.z);
    gs.push(c);
  }
  return fusionar(gs);
};
/** Glucosa: anillo de seis átomos (5 C + 1 O) con grupos OH. */
export const geoGlucosa = memo(() => {
  const at: [V, number][] = [];
  const en: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    at.push([[Math.cos(a) * 0.5, (i % 2 ? 0.08 : -0.08), Math.sin(a) * 0.5], i === 0 ? 0.17 : 0.15]);
    en.push([i, (i + 1) % 6]);
  }
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    at.push([[Math.cos(a) * 0.85, (i % 2 ? 0.35 : -0.35), Math.sin(a) * 0.85], 0.11]);
    en.push([i, at.length - 1]);
  }
  return molecula(at, en);
});
/** Ácido graso: cadena en zigzag con cabeza carboxilo. */
export const geoAcidoGraso = memo(() => {
  const at: [V, number][] = [];
  const en: [number, number][] = [];
  for (let i = 0; i < 12; i++) {
    at.push([[i * 0.32 - 1.8, i % 2 ? 0.14 : -0.14, 0], 0.11]);
    if (i > 0) en.push([i - 1, i]);
  }
  at.push([[2.0, 0.32, 0], 0.15], [[2.0, -0.32, 0], 0.15]);
  en.push([11, 12], [11, 13]);
  return molecula(at, en);
});
/** Cuerpo cetónico (β-hidroxibutirato simplificado). */
export const geoCetona = memo(() =>
  molecula(
    [[[-0.45, 0, 0], 0.15], [[0, 0.22, 0], 0.15], [[0.45, 0, 0], 0.15], [[0.85, 0.22, 0], 0.16], [[0, 0.62, 0], 0.13], [[1.2, 0.05, 0], 0.13], [[0.85, 0.62, 0], 0.13]],
    [[0, 1], [1, 2], [2, 3], [1, 4], [3, 5], [3, 6]],
  ),
);
/** Aminoácido (glicina simplificada). */
export const geoAminoacido = memo(() =>
  molecula(
    [[[-0.4, 0, 0], 0.15], [[0.05, 0.2, 0], 0.15], [[0.5, 0, 0], 0.16], [[-0.75, 0.25, 0], 0.12], [[0.85, 0.25, 0], 0.13], [[0.5, -0.42, 0], 0.13]],
    [[0, 1], [1, 2], [0, 3], [2, 4], [2, 5]],
  ),
);
/** Molécula de agua. */
export const geoAgua = memo(() => molecula([[[0, 0, 0], 0.2], [[0.24, 0.17, 0], 0.12], [[-0.24, 0.17, 0], 0.12]], [[0, 1], [0, 2]]));
/** Gránulo de glucógeno: roseta ramificada de pequeñas esferas. */
export const geoGlucogeno = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 90; i++) {
    const u = hash(i, 1, 1) * 2 - 1;
    const a = hash(i, 2, 2) * Math.PI * 2;
    const r = Math.cbrt(hash(i, 3, 3)) * 0.5;
    const s = Math.sqrt(1 - u * u);
    const g = new THREE.SphereGeometry(0.07, 8, 6);
    g.translate(Math.cos(a) * s * r, u * r, Math.sin(a) * s * r);
    gs.push(g);
  }
  return fusionar(gs);
});
/** Mitocondria: cápsula con crestas internas. */
export const geoMitocondria = memo(() => {
  const g = new THREE.CapsuleGeometry(0.35, 1.1, 12, 32);
  return deformar(g, (p) => {
    p.addScaledVector(p.clone().setY(0).normalize(), Math.sin(p.y * 9) * 0.015 + fbm3(p.x * 3, p.y * 3, p.z * 3, 2) * 0.03);
  });
});
export const geoCrestas = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.TorusGeometry(0.2, 0.05, 8, 24, Math.PI * (1.2 + hash(i, 4, 4) * 0.5));
    g.rotateX(Math.PI / 2);
    g.rotateY(hash(i, 5, 5) * 6);
    g.translate(0, -0.6 + i * 0.15, 0);
    gs.push(g);
  }
  return fusionar(gs);
});
/** Neurona: soma y dendritas ramificadas (unidad ≈ 1). */
export const geoNeurona = (semilla: number) => {
  const gs: THREE.BufferGeometry[] = [];
  const soma = deformar(new THREE.SphereGeometry(0.22, 32, 24), (p) => p.addScaledVector(p.clone().normalize(), fbm3(p.x * 6 + semilla, p.y * 6, p.z * 6, 2) * 0.04));
  gs.push(soma);
  const rama = (a: THREE.Vector3, d: THREE.Vector3, l: number, r: number, n: number) => {
    const b = a.clone().addScaledVector(d, l);
    const m = a.clone().lerp(b, 0.5).add(new THREE.Vector3(hash(n, semilla, a.x) - 0.5, hash(a.y, n, semilla) - 0.5, hash(semilla, a.z, n) - 0.5).multiplyScalar(l * 0.35));
    gs.push(tuboVariable([[a.x, a.y, a.z], [m.x, m.y, m.z], [b.x, b.y, b.z]], (u) => r * (1 - u * 0.4), 10, 6).geo);
    if (n > 3) return;
    for (let k = 0; k < 2; k++) {
      const nd = d.clone().add(new THREE.Vector3(hash(k, n, semilla + 1) - 0.5, hash(n, k, semilla + 2) - 0.5, hash(semilla + 3, k, n) - 0.5).multiplyScalar(1.4)).normalize();
      rama(b, nd, l * 0.7, r * 0.62, n + 1);
    }
  };
  for (let i = 0; i < 6; i++) {
    const d = new THREE.Vector3(hash(i, semilla, 7) - 0.5, hash(semilla, i, 8) - 0.5, hash(9, i, semilla) - 0.5).normalize();
    rama(d.clone().multiplyScalar(0.18), d, 0.6, 0.05, 1);
  }
  return fusionar(gs);
};
/** Fibra muscular estriada (cilindro con bandas). */
export const geoFibra = memo(() =>
  deformar(new THREE.CylinderGeometry(0.5, 0.5, 6, 32, 120, true), (p) => {
    const r = 1 + Math.sin(p.y * 14) * 0.025 + fbm3(p.x * 2, p.y * 0.5, p.z * 2, 2) * 0.05;
    p.x *= r;
    p.z *= r;
  }),
);
