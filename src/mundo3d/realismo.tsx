import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Sky} from 'three/examples/jsm/objects/Sky.js';
import {Water} from 'three/examples/jsm/objects/Water.js';
import {Bloom, BrightnessContrast, DepthOfField, EffectComposer, HueSaturation, N8AO, Noise, ToneMapping, Vignette} from '@react-three/postprocessing';
import {ToneMappingMode} from 'postprocessing';
import {rnd, V3} from './base';

/**
 * Herramientas de realismo para el mundo 3D, todo procedural (sin imágenes externas):
 * ruido de Perlin, texturas generadas (color + relieve), terreno con relieve, cielo atmosférico
 * físico con iluminación de entorno, agua con reflejos, hierba con viento, rocas, nubes y postprocesado.
 */

/* ------------------------------------------------------------------ ruido */

const P = new Uint8Array(512);
{
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd(i * 3.7 + 11) * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
}
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h: number, x: number, y: number) => {
  switch (h & 7) {
    case 0: return x + y;
    case 1: return -x + y;
    case 2: return x - y;
    case 3: return -x - y;
    case 4: return x;
    case 5: return -x;
    case 6: return y;
    default: return -y;
  }
};
/** Ruido de Perlin 2D en [-1, 1]. Con `per` se repite cada `per` unidades (texturas sin costuras). */
export const perlin = (x: number, y: number, per = 256) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const m = (v: number) => (((v % per) + per) % per) & 255;
  const X0 = m(xi);
  const X1 = m(xi + 1);
  const Y0 = m(yi);
  const Y1 = m(yi + 1);
  const u = fade(xf);
  const v = fade(yf);
  const a = grad(P[P[X0] + Y0], xf, yf);
  const b = grad(P[P[X1] + Y0], xf - 1, yf);
  const c = grad(P[P[X0] + Y1], xf, yf - 1);
  const d = grad(P[P[X1] + Y1], xf - 1, yf - 1);
  return (a + u * (b - a) + v * (c + u * (d - c) - (a + u * (b - a)))) * 0.75;
};
/** Ruido fractal (varias octavas). */
export const fbm = (x: number, y: number, oct = 5, per = 256) => {
  let s = 0;
  let a = 0.5;
  let f = 1;
  let n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * perlin(x * f, y * f, per * f);
    n += a;
    a *= 0.5;
    f *= 2;
  }
  return s / n;
};
/** Ruido de crestas (montañas, grietas). */
export const crestas = (x: number, y: number, oct = 5) => {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * (1 - Math.abs(perlin(x * f, y * f)));
    a *= 0.5;
    f *= 2;
  }
  return s;
};
export const suaveEntre = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Zona llana alrededor del personaje: 0 en el centro, 1 lejos. */
export const llano = (x: number, z: number, r0 = 2.5, r1 = 9) => suaveEntre(r0, r1, Math.hypot(x, z));

/* ------------------------------------------------------------------ texturas */

type RGB = [number, number, number];
const cache = new Map<string, {map: THREE.Texture; normal: THREE.Texture}>();

/**
 * Genera una textura de color y su mapa de normales a partir de una función de altura y color.
 * `alt(u, v)` y `col(u, v, h)` reciben coordenadas 0..1 y deben repetirse sin costuras.
 */
export const textura = (clave: string, tam: number, alt: (u: number, v: number) => number, col: (u: number, v: number, h: number) => RGB, fuerza = 2) => {
  const c = cache.get(clave);
  if (c) return c;
  const H = new Float32Array(tam * tam);
  for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) H[y * tam + x] = alt(x / tam, y / tam);
  const cv = document.createElement('canvas');
  cv.width = cv.height = tam;
  const nv = document.createElement('canvas');
  nv.width = nv.height = tam;
  const g = cv.getContext('2d')!;
  const gn = nv.getContext('2d')!;
  const im = g.createImageData(tam, tam);
  const imn = gn.createImageData(tam, tam);
  const at = (x: number, y: number) => H[((y + tam) % tam) * tam + ((x + tam) % tam)];
  for (let y = 0; y < tam; y++)
    for (let x = 0; x < tam; x++) {
      const i = (y * tam + x) * 4;
      const h = at(x, y);
      const [r, gg, b] = col(x / tam, y / tam, h);
      im.data[i] = r;
      im.data[i + 1] = gg;
      im.data[i + 2] = b;
      im.data[i + 3] = 255;
      const dx = (at(x + 1, y) - at(x - 1, y)) * fuerza * tam * 0.02;
      const dy = (at(x, y + 1) - at(x, y - 1)) * fuerza * tam * 0.02;
      const l = Math.hypot(dx, dy, 1);
      imn.data[i] = (-dx / l) * 127 + 128;
      imn.data[i + 1] = (dy / l) * 127 + 128;
      imn.data[i + 2] = (1 / l) * 127 + 128;
      imn.data[i + 3] = 255;
    }
  g.putImageData(im, 0, 0);
  gn.putImageData(imn, 0, 0);
  const map = new THREE.CanvasTexture(cv);
  map.colorSpace = THREE.SRGBColorSpace;
  const normal = new THREE.CanvasTexture(nv);
  for (const t of [map, normal]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  const r = {map, normal};
  cache.set(clave, r);
  return r;
};

const mezcla = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cl01 = (x: number) => Math.min(1, Math.max(0, x));

/** Detalle en gris claro (se multiplica por el color de vértice del terreno). */
export const TEX = {
  arena: () =>
    textura('arena', 512, (u, v) => fbm(u * 8, v * 8, 4, 8) * 0.4 + Math.sin((u * 6 + fbm(u * 4, v * 4, 3, 4) * 0.6) * Math.PI * 2 * 3) * 0.12 + rnd(u * 997 + v * 131) * 0.08, (u, v, h) => {
      const k = 225 + h * 60;
      return [k, k * 0.97, k * 0.92];
    }, 1.2),
  nieve: () =>
    textura('nieve', 512, (u, v) => fbm(u * 6, v * 6, 5, 6) * 0.5 + rnd(u * 731 + v * 373) * 0.05, (u, v, h) => {
      const k = 236 + h * 28 + (rnd(u * 913 + v * 177) > 0.995 ? 19 : 0);
      return [k, k, Math.min(255, k + 6)];
    }, 1),
  roca: () =>
    textura('roca', 512, (u, v) => crestas(u * 6, v * 6, 5) * 0.6 + fbm(u * 24, v * 24, 3, 24) * 0.2, (u, v, h) => {
      const k = 120 + h * 150 + fbm(u * 3, v * 3, 3, 3) * 40;
      return [k, k * 0.97, k * 0.93];
    }, 3),
  tierra: () =>
    textura('tierra', 512, (u, v) => fbm(u * 10, v * 10, 5, 10) * 0.6 + (rnd(u * 517 + v * 919) > 0.97 ? 0.4 : 0), (u, v, h) => {
      const k = 190 + h * 80;
      return [k, k * 0.95, k * 0.9];
    }, 2),
  hierba: () =>
    textura('hierba', 512, (u, v) => fbm(u * 16, v * 16, 4, 16) * 0.5 + rnd(u * 613 + v * 271) * 0.25, (u, v, h) => {
      const k = 170 + h * 90;
      return [k * 0.85, k, k * 0.75];
    }, 1.6),
  /** tablones de madera (color completo) */
  madera: (base: RGB = [140, 92, 54]) =>
    textura(`madera${base}`, 512, (u, v) => {
      const tablon = Math.floor(v * 8);
      const vt = v * 8 - tablon;
      const junta = vt < 0.05 || vt > 0.95 ? -0.6 : 0;
      return fbm(u * 2 + tablon * 7.1, vt * 30 + tablon, 4, 256) * 0.35 + Math.sin((u * 40 + fbm(u * 3, v * 8 + tablon, 3) * 4) * 2) * 0.05 + junta;
    }, (u, v, h) => mezcla(base.map((c) => c * 0.55) as RGB, base.map((c) => Math.min(255, c * 1.25)) as RGB, cl01(h + 0.6)), 2.5),
  /** sillares de piedra (color completo) */
  sillares: (base: RGB = [214, 182, 128]) =>
    textura(`sillares${base}`, 512, (u, v) => {
      const fila = Math.floor(v * 6);
      const uu = u * 3 + (fila % 2) * 0.5;
      const fx = uu - Math.floor(uu);
      const fy = v * 6 - fila;
      const junta = Math.min(fx, 1 - fx, fy * 0.5, (1 - fy) * 0.5) < 0.025 ? -0.8 : 0;
      return fbm(u * 12, v * 12, 4, 12) * 0.35 + junta + rnd(Math.floor(uu) * 13 + fila) * 0.15;
    }, (u, v, h) => mezcla(base.map((c) => c * 0.5) as RGB, base, cl01(h + 0.75)), 3),
  /** césped de estadio con franjas de corte */
  cesped: () =>
    textura('cesped', 512, (u, v) => fbm(u * 32, v * 32, 3, 32) * 0.4 + rnd(u * 811 + v * 433) * 0.3, (u, v, h) => {
      const franja = Math.floor(v * 2) % 2 ? 1.08 : 0.92;
      const k = (150 + h * 70) * franja;
      return [k * 0.42, k, k * 0.38];
    }, 1),
  /** normales de olas para el agua (sin costuras) */
  olas: () =>
    textura('olas', 512, (u, v) => {
      let s = 0;
      for (let k = 1; k <= 6; k++) s += (Math.sin((u * (k * 2 + 1) + v * k + rnd(k) * 9) * Math.PI * 2) + Math.cos((v * (k * 3) - u * (k - 1) + rnd(k + 9) * 9) * Math.PI * 2)) / (k + 1);
      return s * 0.1 + fbm(u * 8, v * 8, 4, 8) * 0.25;
    }, () => [128, 128, 255], 4),
};

/* ------------------------------------------------------------------ terreno */

/**
 * Terreno con relieve. `alt(x, z)` da la altura en metros y `col(x, z, y, pendiente)` el color
 * (0..1). `tex` añade detalle fino (color multiplicado + normales) repetido `rep` veces.
 */
export const Terreno: React.FC<{
  tam?: number;
  seg?: number;
  alt: (x: number, z: number) => number;
  col: (x: number, z: number, y: number, pend: number) => RGB;
  tex?: {map: THREE.Texture; normal: THREE.Texture};
  rep?: number;
  rug?: number;
  met?: number;
  normal?: number;
  centro?: V3;
}> = ({tam = 220, seg = 260, alt, col, tex, rep = 60, rug = 0.95, met = 0, normal = 1, centro = [0, 0, -tam * 0.3]}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(tam, tam, seg, seg);
    g.rotateX(-Math.PI / 2);
    g.translate(centro[0], 0, centro[2]);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, alt(pos.getX(i), pos.getZ(i)));
    g.computeVertexNormals();
    const nor = g.attributes.normal as THREE.BufferAttribute;
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const c = col(pos.getX(i), pos.getZ(i), pos.getY(i), 1 - nor.getY(i));
      cols.set(c, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rep, uv.getY(i) * rep);
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={rug} metalness={met} map={tex?.map} normalMap={tex?.normal} normalScale={new THREE.Vector2(normal, normal)} />
    </mesh>
  );
};

/** Color sRGB 0..255 → lineal 0..1 para colores de vértice. */
export const rgb = (hex: string): RGB => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};
export const mezclaC = (a: RGB, b: RGB, t: number): RGB => mezcla(a, b, cl01(t));

/* ------------------------------------------------------------------ cielo y entorno */

export const dirSol = (elev: number, azim: number): V3 => {
  const phi = THREE.MathUtils.degToRad(90 - elev);
  const th = THREE.MathUtils.degToRad(azim);
  const v = new THREE.Vector3().setFromSphericalCoords(1, phi, th);
  return [v.x, v.y, v.z];
};

/** Usa una escena auxiliar como luz de entorno (reflejos e iluminación indirecta realistas). */
const useEntorno = (crear: () => THREE.Object3D, clave: string, intensidad = 1) => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const s = new THREE.Scene();
    s.add(crear());
    const rt = pm.fromScene(s, 0.02);
    scene.environment = rt.texture;
    scene.environmentIntensity = intensidad;
    pm.dispose();
    return () => {
      rt.dispose();
      scene.environment = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, clave]);
};

/** Cielo con dispersión atmosférica física (Rayleigh + Mie) y su luz de entorno. */
export const CieloFisico: React.FC<{elev: number; azim: number; turbidez?: number; rayleigh?: number; mie?: number; mieG?: number; entorno?: number; exposicion?: number}> = ({
  elev,
  azim,
  turbidez = 6,
  rayleigh = 1.6,
  mie = 0.005,
  mieG = 0.8,
  entorno = 0.7,
}) => {
  const crear = (escala: number) => {
    const s = new Sky();
    s.scale.setScalar(escala);
    const u = s.material.uniforms;
    u.turbidity.value = turbidez;
    u.rayleigh.value = rayleigh;
    u.mieCoefficient.value = mie;
    u.mieDirectionalG.value = mieG;
    u.sunPosition.value.set(...dirSol(elev, azim));
    return s;
  };
  const sky = useMemo(() => crear(900), [elev, azim, turbidez, rayleigh, mie, mieG]); // eslint-disable-line react-hooks/exhaustive-deps
  useEntorno(() => crear(100), `sky${elev}${azim}${turbidez}${rayleigh}`, entorno);
  return <primitive object={sky} />;
};

const texDegradado = (stops: [number, string][]) => {
  const cv = document.createElement('canvas');
  cv.width = 4;
  cv.height = 512;
  const g = cv.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, 512);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Cielo en degradado (noche, otros planetas, mundos de fantasía) con estrellas opcionales y su luz de entorno. */
export const CieloDegradado: React.FC<{stops: [number, string][]; estrellas?: number; entorno?: number}> = ({stops, estrellas = 0, entorno = 0.6}) => {
  const tex = useMemo(() => texDegradado(stops), [JSON.stringify(stops)]); // eslint-disable-line react-hooks/exhaustive-deps
  const est = useMemo(() => {
    if (!estrellas) return null;
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(estrellas * 3);
    const c = new Float32Array(estrellas * 3);
    for (let i = 0; i < estrellas; i++) {
      const th = rnd(i * 1.3) * Math.PI * 2;
      const ph = Math.acos(1 - rnd(i * 2.7 + 5) * 0.95);
      const v = new THREE.Vector3().setFromSphericalCoords(800, ph, th);
      p.set([v.x, v.y, v.z], i * 3);
      const b = 0.4 + rnd(i + 0.5) ** 3 * 1.6;
      const tinte = rnd(i * 9.1);
      c.set([b * (tinte > 0.8 ? 1 : 0.85), b * 0.9, b * (tinte < 0.3 ? 1 : 0.8)], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  }, [estrellas]);
  useEntorno(
    () => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({map: tex, side: THREE.BackSide}));
      return m;
    },
    JSON.stringify(stops),
    entorno,
  );
  return (
    <>
      <mesh>
        <sphereGeometry args={[900, 48, 24]} />
        <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      {est && (
        <points geometry={est}>
          <pointsMaterial size={2.2} sizeAttenuation={false} vertexColors fog={false} transparent depthWrite={false} />
        </points>
      )}
    </>
  );
};

/** Sol: luz direccional con sombras suaves orientada como el cielo. */
export const Sol: React.FC<{elev: number; azim: number; color?: string; int?: number; cielo?: string; suelo?: string; amb?: number; area?: number}> = ({
  elev,
  azim,
  color = '#fff1dc',
  int = 3,
  cielo = '#bcd4ff',
  suelo = '#6a5a48',
  amb = 0.35,
  area = 14,
}) => {
  const d = dirSol(elev, azim);
  return (
    <>
      <hemisphereLight args={[cielo, suelo, amb]} />
      <directionalLight
        position={[d[0] * 40, d[1] * 40, d[2] * 40]}
        color={color}
        intensity={int}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-area}
        shadow-camera-right={area}
        shadow-camera-top={area}
        shadow-camera-bottom={-area}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
    </>
  );
};

/* ------------------------------------------------------------------ agua */

/** Mar / lago con reflejos reales del cielo y la escena, olas animadas y brillo del sol. */
export const Agua: React.FC<{t: number; y?: number; x?: number; z?: number; charco?: boolean; tam?: number; color?: string; sol: V3; solColor?: string; distorsion?: number; velocidad?: number}> = ({
  t,
  y = 0,
  x = 0,
  z = 0,
  charco = false,
  tam = 600,
  color = '#0a4a6a',
  sol,
  solColor = '#ffffff',
  distorsion = 2.2,
  velocidad = 0.6,
}) => {
  const agua = useMemo(() => {
    let geo: THREE.BufferGeometry = new THREE.PlaneGeometry(tam, tam);
    if (charco) {
      // contorno irregular de charco / estanque
      const forma = new THREE.Shape();
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const r = (tam / 2) * (0.75 + fbm(Math.cos(a) * 1.5 + x, Math.sin(a) * 1.5 + z, 3) * 0.6);
        if (i === 0) forma.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else forma.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      geo = new THREE.ShapeGeometry(forma, 4);
    }
    const w = new Water(geo, {
      textureWidth: 1024,
      textureHeight: 1024,
      waterNormals: TEX.olas().normal,
      sunDirection: new THREE.Vector3(...sol).normalize(),
      sunColor: new THREE.Color(solColor),
      waterColor: new THREE.Color(color),
      distortionScale: distorsion,
      fog: true,
    });
    w.rotation.x = -Math.PI / 2;
    w.position.set(x, y, z);
    w.material.uniforms.size.value = 1.6;
    return w;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  agua.material.uniforms.time.value = t * velocidad;
  return <primitive object={agua} />;
};

/* ------------------------------------------------------------------ vegetación y rocas */

const geoBrizna = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (g) return g;
    g = new THREE.BufferGeometry();
    const w = 0.5;
    // 3 tramos que se estrechan hasta la punta
    const v = [-w, 0, 0, w, 0, 0, -w * 0.75, 0.35, 0.02, w * 0.75, 0.35, 0.02, -w * 0.45, 0.7, 0.06, w * 0.45, 0.7, 0.06, 0, 1, 0.12];
    const idx = [0, 1, 2, 2, 1, 3, 2, 3, 4, 4, 3, 5, 4, 5, 6];
    const c: number[] = [];
    for (let i = 0; i < v.length; i += 3) {
      const k = 0.35 + v[i + 1] * 0.65;
      c.push(k, k, k);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(Array(v.length / 3).fill([0, 1, 0]).flat(), 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    g.setIndex(idx);
    return g;
  };
})();

/** Hierba densa (miles de briznas) que se mece con el viento. */
export const Hierba: React.FC<{
  t: number;
  n: number;
  donde: (i: number) => [number, number] | null;
  alt: (x: number, z: number) => number;
  colores: string[];
  altura?: [number, number];
  ancho?: number;
  viento?: number;
}> = ({t, n, donde, alt, colores, altura = [0.25, 0.6], ancho = 0.06, viento = 1}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const uni = useMemo(() => ({uTiempo: {value: 0}, uViento: {value: viento}}), [viento]);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({vertexColors: true, side: THREE.DoubleSide, roughness: 0.85});
    m.onBeforeCompile = (s) => {
      s.uniforms.uTiempo = uni.uTiempo;
      s.uniforms.uViento = uni.uViento;
      s.vertexShader = 'uniform float uTiempo;\nuniform float uViento;\n' + s.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        float ola = sin(uTiempo * 1.7 + ip.x * 0.31 + ip.z * 0.23) * 0.6 + sin(uTiempo * 3.3 + ip.x * 1.7 - ip.z) * 0.25;
        float hh = position.y * position.y;
        transformed.x += ola * hh * 0.35 * uViento;
        transformed.z += (ola * 0.5 + 0.3) * hh * 0.25 * uViento;`,
      );
    };
    return m;
  }, [uni]);
  const datos = useMemo(() => {
    const pts: {x: number; z: number; s: number; r: number; c: string}[] = [];
    for (let i = 0; i < n * 3 && pts.length < n; i++) {
      const p = donde(i);
      if (!p) continue;
      pts.push({x: p[0], z: p[1], s: altura[0] + rnd(i * 1.7) * (altura[1] - altura[0]), r: rnd(i * 2.3) * Math.PI * 2, c: colores[Math.floor(rnd(i * 5.1) * colores.length)]});
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
  useLayoutEffect(() => {
    const im = ref.current!;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    datos.forEach((d, i) => {
      o.position.set(d.x, alt(d.x, d.z) - 0.02, d.z);
      o.rotation.set(0, d.r, 0);
      o.scale.set(ancho * (0.8 + rnd(i) * 0.6), d.s, 1);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, c.set(d.c));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos]);
  uni.uTiempo.value = t;
  return <instancedMesh ref={ref} args={[geoBrizna(), mat, datos.length]} receiveShadow frustumCulled={false} />;
};

const geosRoca = new Map<number, THREE.BufferGeometry>();
/** Geometría de roca irregular (icosaedro deformado con ruido). */
export const geoRoca = (semilla: number) => {
  const k = Math.floor(semilla) % 12;
  const c = geosRoca.get(k);
  if (c) return c;
  const g = new THREE.IcosahedronGeometry(1, 4);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.3 + k * 7 + v.y * 0.7, v.z * 1.3 - v.y * 0.9 + k * 3, 5);
    const facetas = crestas(v.x * 0.9 + k, v.z * 0.9 + v.y * 0.8, 2) * 0.25;
    v.multiplyScalar(1 + n * 0.55 + facetas);
    if (v.y < -0.35) v.y = -0.35 + (v.y + 0.35) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  geosRoca.set(k, g);
  return g;
};
export const RocaReal: React.FC<{p: V3; s: number | V3; r?: V3; semilla?: number; c?: string; rug?: number}> = ({p, s, r = [0, 0, 0], semilla = 1, c = '#8a847a', rug = 0.9}) => {
  const t = TEX.roca();
  return (
    <mesh geometry={geoRoca(semilla)} position={p} scale={s as never} rotation={r} castShadow receiveShadow>
      <meshStandardMaterial color={c} map={t.map} normalMap={t.normal} roughness={rug} />
    </mesh>
  );
};

/* ------------------------------------------------------------------ nubes */

const texNube = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d')!;
    const im = g.createImageData(S, S);
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const u = x / S - 0.5;
        const v = y / S - 0.5;
        const d = Math.hypot(u * 1.1, v * 1.8);
        const n = fbm(x / 40, y / 40, 5) * 0.5 + 0.5;
        const a = cl01((0.5 - d) * 3.2) * cl01((n - 0.35) * 2.4);
        const i = (y * S + x) * 4;
        const sombra = 0.78 + 0.22 * cl01(0.5 - v * 1.6);
        im.data[i] = im.data[i + 1] = im.data[i + 2] = 255 * sombra;
        im.data[i + 3] = a * 255;
      }
    g.putImageData(im, 0, 0);
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

/** Nubes lejanas: capas de sprites suaves que derivan con el viento. */
export const Nubes: React.FC<{t: number; n?: number; color?: string; altura?: [number, number]; dist?: [number, number]; op?: number; escala?: number}> = ({
  t,
  n = 26,
  color = '#ffffff',
  altura = [40, 110],
  dist = [180, 420],
  op = 0.9,
  escala = 1,
}) => (
  <>
    {[...Array(n)].map((_, i) => {
      const a = -Math.PI / 2 + (rnd(i * 3.1) - 0.5) * Math.PI * 1.4 + t * 0.004;
      const d = dist[0] + rnd(i * 1.9) * (dist[1] - dist[0]);
      const s = (60 + rnd(i * 4.3) * 110) * escala;
      return (
        <sprite key={i} position={[Math.cos(a) * d, altura[0] + rnd(i * 7.7) * (altura[1] - altura[0]), Math.sin(a) * d]} scale={[s, s * 0.45, 1]}>
          <spriteMaterial map={texNube()} color={color} transparent opacity={op * (0.6 + rnd(i) * 0.4)} depthWrite={false} fog={false} rotation={(rnd(i * 2.2) - 0.5) * 0.3} />
        </sprite>
      );
    })}
  </>
);

/* ------------------------------------------------------------------ postprocesado */

/**
 * Acabado fotográfico: oclusión ambiental, resplandor en las luces, profundidad de campo
 * (enfoque en el personaje), viñeta, grano y curva de tono ACES.
 */
export const Postpro: React.FC<{foco?: number; rango?: number; bokeh?: number; bloom?: number; umbral?: number; ao?: number; vineta?: number; dof?: boolean}> = ({
  foco = 8,
  rango = 7,
  bokeh = 2.2,
  bloom = 0.55,
  umbral = 0.85,
  ao = 1.6,
  vineta = 0.5,
  dof = true,
}) => {
  const fx = [
    <N8AO key="ao" aoRadius={1.4} distanceFalloff={1.2} intensity={ao} quality="medium" halfRes />,
    <Bloom key="bl" mipmapBlur intensity={bloom} luminanceThreshold={umbral} luminanceSmoothing={0.2} radius={0.7} />,
    ...(dof ? [<DepthOfField key="dof" worldFocusDistance={foco} worldFocusRange={rango} bokehScale={bokeh} />] : []),
    <Vignette key="vi" offset={0.28} darkness={vineta} />,
    <Noise key="no" opacity={0.035} premultiply />,
    <ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />,
    <HueSaturation key="hs" saturation={0.14} />,
    <BrightnessContrast key="bc" contrast={0.1} />,
  ];
  return <EffectComposer multisampling={4}>{fx}</EffectComposer>;
};
