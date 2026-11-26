import React, {useMemo} from 'react';
import * as THREE from 'three';
import {deformar, fbm3, fusionar, molecula} from '../ayuno/anatomia';
import {Enjambre, rnd, V3} from '../ayuno/escena';

/**
 * Piezas 3D propias del vídeo "5 cafés al día durante 30 días": taza de café genérica con plato,
 * crema y vapor, y la molécula de adenosina. El resto (cuerpo, órganos, cafeína, receptores)
 * se reutiliza de los vídeos de la Coca-Cola y del ayuno.
 */

type V = [number, number, number];
const memo = <T,>(f: () => T) => {
  let v: T | null = null;
  return () => (v ??= f());
};

/* ------------------------------------------------------------------ taza */
const ALTO = 1;
const rExt = (y: number) => 0.36 + 0.15 * Math.pow(Math.min(1, Math.max(0, y)) / ALTO, 0.85);
const GROSOR = 0.04;
/** Nivel del café dentro de la taza (proporción de la altura). */
export const NIVEL_CAFE = 0.82;

/** Taza (altura 1, base en y = 0): pared exterior, borde y pared interior en un solo perfil. */
export const geoTaza = memo(() => {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.0001, 0), new THREE.Vector2(0.3, 0), new THREE.Vector2(0.34, 0.025)];
  const N = 40;
  for (let i = 1; i <= N; i++) {
    const y = 0.04 + (i / N) * (ALTO - 0.04);
    pts.push(new THREE.Vector2(rExt(y), y));
  }
  pts.push(new THREE.Vector2(rExt(ALTO) - GROSOR * 0.5, ALTO + 0.012));
  for (let i = N; i >= 0; i--) {
    const y = 0.1 + (i / N) * (ALTO - 0.1);
    pts.push(new THREE.Vector2(rExt(y) - GROSOR, y));
  }
  pts.push(new THREE.Vector2(0.0001, 0.1));
  return new THREE.LatheGeometry(pts, 72);
});

/** Asa: arco de toro a un lado de la taza (+x). */
export const geoAsa = memo(() => {
  const g = new THREE.TorusGeometry(0.2, 0.045, 18, 48, Math.PI * 1.15);
  g.rotateZ(-Math.PI * 0.575);
  g.translate(rExt(0.55) + 0.06, 0.55, 0);
  return g;
});

/** Plato. */
export const geoPlato = memo(() => {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.0001, 0)];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const r = 0.25 + u * 0.55;
    pts.push(new THREE.Vector2(r, 0.012 + Math.pow(u, 2.2) * 0.1));
  }
  pts.push(new THREE.Vector2(0.81, 0.135));
  for (let i = 24; i >= 0; i--) {
    const u = i / 24;
    pts.push(new THREE.Vector2(0.25 + u * 0.54, 0.045 + Math.pow(u, 2.2) * 0.1));
  }
  pts.push(new THREE.Vector2(0.0001, 0.045));
  return new THREE.LatheGeometry(pts, 72);
});

/** Textura de la superficie del café: crema dorada en el centro y borde oscuro. */
const texCrema = (() => {
  let tx: THREE.CanvasTexture | null = null;
  return () => {
    if (tx) return tx;
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const g = cv.getContext('2d')!;
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, '#c88a50');
    gr.addColorStop(0.45, '#a8683a');
    gr.addColorStop(0.8, '#5a2e14');
    gr.addColorStop(1, '#2a1206');
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
    // motas de la crema
    for (let i = 0; i < 900; i++) {
      const a = rnd(i) * Math.PI * 2;
      const r = Math.sqrt(rnd(i + 1)) * S * 0.42;
      g.fillStyle = `rgba(${rnd(i + 2) > 0.5 ? '255,220,170' : '70,30,10'},${0.08 + rnd(i + 3) * 0.12})`;
      g.beginPath();
      g.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, 1 + rnd(i + 4) * 4, 0, Math.PI * 2);
      g.fill();
    }
    tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  };
})();

/** Taza de café genérica (sin marca). `s` = altura en metros; base del plato en el origen. */
export const Taza: React.FC<{t: number; p?: V3; r?: V3; s?: number; vapor?: number; plato?: boolean; nivel?: number; brillo?: number}> = ({
  t,
  p = [0, 0, 0],
  r = [0, 0, 0],
  s = 0.09,
  vapor = 1,
  plato = false,
  nivel = 1,
  brillo = 0,
}) => {
  const mats = useMemo(
    () => ({
      ceramica: new THREE.MeshPhysicalMaterial({color: '#f4eee6', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.3, emissive: '#1a1410'}),
      cafe: new THREE.MeshPhysicalMaterial({map: texCrema(), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, emissive: '#2a1004', emissiveIntensity: 0.6}),
      vapor: new THREE.MeshBasicMaterial({color: '#fff4e8', transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}),
    }),
    [],
  );
  mats.cafe.emissiveIntensity = 0.6 + brillo;
  const esfera = useMemo(() => new THREE.SphereGeometry(1, 12, 10), []);
  const y = (NIVEL_CAFE - 0.1) * nivel + 0.1;
  const base = plato ? 0.045 : 0;
  return (
    <group position={p} rotation={r} scale={s}>
      {plato && <mesh geometry={geoPlato()} material={mats.ceramica} />}
      <group position={[0, base, 0]}>
        <mesh geometry={geoTaza()} material={mats.ceramica} />
        <mesh geometry={geoAsa()} material={mats.ceramica} />
        {nivel > 0.02 && (
          <mesh material={mats.cafe} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, t * 0.05]}>
            <circleGeometry args={[rExt(y) - GROSOR - 0.002, 64]} />
          </mesh>
        )}
        {vapor > 0 && (
          <Enjambre
            geo={esfera}
            mat={mats.vapor}
            n={70}
            f={(i, o) => {
              const f = (t * (0.18 + rnd(i) * 0.1) + rnd(i + 1)) % 1;
              const a = rnd(i + 2) * Math.PI * 2 + f * 2.5;
              const rr = 0.08 + f * 0.25 * rnd(i + 3);
              o.position.set(Math.cos(a) * rr + Math.sin(t * 0.8 + f * 5 + i) * 0.06 * f, y + 0.05 + f * 1.6, Math.sin(a) * rr);
              o.scale.setScalar((0.06 + f * 0.22) * Math.sin(Math.PI * Math.min(1, f * 1.15)) * vapor);
            }}
          />
        )}
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ adenosina */
/** Adenosina: base de purina (anillos de 6 y 5) unida a una ribosa (anillo de 5 con grupos OH). */
export const geoAdenosina = memo(() => {
  const at: [V, number][] = [
    [[0, 0, 0], 0.15], [[0.42, 0.24, 0], 0.15], [[0.84, 0, 0], 0.15], [[0.84, -0.48, 0], 0.15], [[0.42, -0.72, 0], 0.15], [[0, -0.48, 0], 0.15],
    [[1.28, 0.14, 0], 0.15], [[1.5, -0.25, 0], 0.15], [[1.24, -0.62, 0], 0.15],
    [[0.42, 0.7, 0], 0.12],
  ];
  const en: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6], [6, 7], [7, 8], [8, 3], [1, 9]];
  // ribosa colgando del N9 (índice 8)
  const c: V = [1.55, -1.25, 0.15];
  const ini = at.length;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.6;
    at.push([[c[0] + Math.cos(a) * 0.4, c[1] + Math.sin(a) * 0.4, c[2] + (i % 2 ? 0.08 : -0.08)], i === 0 ? 0.15 : 0.14]);
    en.push([ini + i, ini + ((i + 1) % 5)]);
  }
  en.push([8, ini + 1]);
  for (const k of [2, 3, 4]) {
    const a = (k / 5) * Math.PI * 2 + 0.6;
    at.push([[c[0] + Math.cos(a) * 0.78, c[1] + Math.sin(a) * 0.78, c[2]], 0.11]);
    en.push([ini + k, at.length - 1]);
  }
  const g = molecula(at, en);
  g.center();
  return g;
});

/* ------------------------------------------------------------------ receptor de adenosina */
/** Receptor acoplado a proteína G: siete hélices que atraviesan la membrana, con un bolsillo arriba. */
export const geoReceptorA = memo(() => {
  const gs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const c = new THREE.CapsuleGeometry(0.075, 0.62, 4, 12);
    deformar(c, (p) => {
      p.x += Math.sin(p.y * 6 + i) * 0.015;
      p.addScaledVector(p.clone().setY(0).normalize(), fbm3(p.x * 9 + i, p.y * 9, p.z * 9, 2) * 0.012);
    });
    c.rotateZ(Math.sin(i * 2.1) * 0.12);
    c.translate(Math.cos(a) * 0.2, 0.05, Math.sin(a) * 0.2);
    gs.push(c);
  }
  return fusionar(gs);
});
