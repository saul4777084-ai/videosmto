import React, {useMemo} from 'react';
import * as THREE from 'three';
import {geoEstomago, geoGlobuloRojo, geoGlucosa, ruido3, tuboVariable} from '../ayuno/anatomia';
import {Cam, Cerebro, Enjambre, entre, Haz, Higado, mano, orbita, Particulas, rnd, ruta, suma, V3} from '../ayuno/escena';
import {animarMat, matOrgano} from '../ayuno/shaders';
import {geoCafeina, geoCanal, geoFructosa, geoGota, geoInsulina, geoReceptor, MANO} from './hombre';
import {Botella, brillo, CuerpoHombre, enMano, LienzoCola, Mesa, MESA, Pancreas, Suelo, VasoAgua} from './objetos';

/**
 * Tomas del vídeo "¿Qué le pasa a tu cuerpo si tomas Coca-Cola durante 30 días?".
 * Cada toma recibe `t` (segundos desde que empieza) y `d` (lo que dura, con el solape de la
 * transición) y monta su propio lienzo 3D con su cámara y su iluminación.
 */
export type PropsToma = {t: number; d: number};

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const rotY = (p: V3, a: number): V3 => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** Iluminación dramática de quirófano virtual para el cuerpo completo. */
const LucesCuerpo: React.FC<{piel?: number; calido?: number}> = ({piel = 0, calido = 0}) => (
  <>
    <ambientLight intensity={0.07 + piel * 0.05} color="#4a6aaa" />
    <directionalLight position={[-2, 3, -3]} intensity={1.7} color="#5ab0ff" />
    <directionalLight position={[2.5, 2, -2]} intensity={1.1} color="#8a6aff" />
    <directionalLight position={[1.2, 2.2, 3]} intensity={0.5 + piel * 0.9 + calido * 0.4} color="#ffe2cc" />
    <spotLight position={[0.2, 3.2, 1.2]} angle={0.5} penumbra={0.8} intensity={piel * 4} distance={6} color="#fff0e0" />
    <pointLight position={[0.05, 1.32, 0.2]} intensity={0.12 * (1 - piel)} distance={0.5} color="#ff4a3a" />
    <pointLight position={[0, 1.72, 0.2]} intensity={0.08 * (1 - piel)} distance={0.4} color="#b88aff" />
    <pointLight position={[-0.05, 1.12, 0.2]} intensity={0.08 * (1 - piel)} distance={0.4} color="#ffb060" />
  </>
);

/** Anillo indicador que siempre mira a la cámara y late. */
const Anillo: React.FC<{p: V3; cam: V3; color: string; on: number; r?: number; t: number}> = ({p, cam, color, on, r = 0.06, t}) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({color, transparent: true, toneMapped: false, depthTest: false, depthWrite: false}), [color]);
  const ref = useMemo(() => new THREE.Object3D(), []);
  ref.position.set(...p);
  ref.lookAt(...cam);
  mat.opacity = on * (0.75 + 0.25 * Math.sin(t * 5));
  const k = on > 0 ? 1 + 0.08 * Math.sin(t * 5) + (1 - Math.min(1, on * 1.5)) * 0.6 : 0;
  return (
    <group position={p} quaternion={ref.quaternion} scale={k} renderOrder={20}>
      <mesh material={mat} renderOrder={20}>
        <ringGeometry args={[r, r * 1.08, 64]} />
      </mesh>
      <mesh material={mat} renderOrder={20} scale={1.22} rotation={[0, 0, t * 0.8]}>
        <ringGeometry args={[r, r * 1.02, 64, 1, 0, Math.PI * 1.4]} />
      </mesh>
    </group>
  );
};

/* =================================================================== INTRODUCCIÓN */

/** Hombre con la botella: la cámara se acerca y el cuerpo se vuelve transparente. */
export const TomaIntro: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.55, 1.05, 3.4], mira: [0.12, 1.0, 0], fov: 34},
    {t: 3.6, pos: [0.42, 1.12, 2.3], mira: [0.1, 1.08, 0], fov: 34},
    {t: d, pos: [0.16, 1.28, 0.95], mira: [0.04, 1.22, 0], fov: 33},
  ]);
  const piel = 1 - entre(t, 2.6, 5.8);
  const holo = entre(t, 2.8, 6) * 0.85;
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={t < 4 ? 1.6 : 0.5} niebla={0.1} post={{bokeh: 2}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo piel={piel} />
      <CuerpoHombre t={t} piel={piel} holo={holo} esqueleto={entre(t, 3.2, 6)} vasos={entre(t, 3.5, 6.2)} organos={entre(t, 3, 5.5)} luzEstomago={entre(t, 5, 7) * 0.5} giro={-0.12 + t * 0.012} />
      <Botella t={t} p={enMano(0.22)} r={[0, 0.4, 0.04]} s={0.22} />
      <pointLight position={[MANO[0] + 0.1, MANO[1] + 0.05, MANO[2] + 0.25]} intensity={0.35} distance={0.6} color="#ff4a2a" />
      <Suelo />
      <Particulas t={t} n={900} centro={[0, 1.1, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.5} />
      <Haz p={[0, 2.6, -0.6]} r={[0.35, 0, 0]} largo={3.2} ancho={1.1} color="#3a8aff" int={0.05} />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 1 */

/** El refresco entra por la boca, baja por el esófago y llega al estómago (perfil del cuerpo). */
export const TomaTrago: React.FC<PropsToma> = ({t, d}) => {
  const trago = entre(t, 0.4, 5.2) * 1.08;
  const c = ruta(t, [
    {t: 0, pos: [0.42, 1.64, 0.36], mira: [0.0, 1.58, 0.03], fov: 34},
    {t: 2.2, pos: [0.46, 1.52, 0.34], mira: [0.0, 1.46, 0.0], fov: 34},
    {t: 4.6, pos: [0.42, 1.32, 0.42], mira: [0.03, 1.26, 0.02], fov: 34},
    {t: d, pos: [0.3, 1.25, 0.42], mira: [0.05, 1.2, 0.03], fov: 34},
  ]);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={0.25} niebla={0.2} post={{bokeh: 2.5, bloom: 0.9}}>
      <Cam pos={suma(c.pos, mano(t, 1.5))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo />
      <CuerpoHombre t={t} piel={0} holo={0.7} esqueleto={0.45} vasos={0.4} esofago={1} trago={trago} torax={0} luzEstomago={entre(t, 4.4, 5.6)} />
      <pointLight position={[0.2, 1.45, 0.2]} intensity={0.5} distance={0.8} color="#ffb8a0" />
      <Particulas t={t} n={700} centro={[0.1, 1.4, 0.1]} tam={[1.2, 1, 1.2]} size={0.006} op={0.5} />
    </LienzoCola>
  );
};

/** Estómago con el refresco: burbujas y cristales de azúcar que se disuelven. */
export const TomaEstomagoCola: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0.05, 0], 2.2 - (t / d) * 0.55, -0.55 + (t / d) * 0.75, 0.25);
  const nivel = -0.22 + entre(t, 0, d * 0.7) * 0.32;
  const mats = useMemo(() => {
    const pared = matOrgano({color: '#d8907a', color2: '#f0bca0', vasos: '#a8384a', vasosEsc: 4.5, motas: 5, borde: '#ffb070', bordeInt: 1.2, ondula: 0.006, rug: 0.4, barniz: 1, opacidad: 0.38});
    pared.side = THREE.DoubleSide;
    pared.depthWrite = false;
    const plano = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const liquido = new THREE.MeshPhysicalMaterial({color: '#2a0c04', emissive: '#6a2008', emissiveIntensity: 0.8, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.92, clippingPlanes: [plano], side: THREE.DoubleSide});
    return {pared, liquido, plano, burbuja: brillo('#ffd0a0', 1.8), azucar: brillo('#ffffff', 2.2), glucosa: brillo('#9af0ff', 2.2), fructosa: brillo('#ffa23a', 2.2)};
  }, []);
  animarMat(mats.pared, t);
  mats.plano.constant = nivel;
  const {geo} = geoEstomago();
  const ola = 1 + Math.sin(t * 1.4) * 0.015;
  const cubo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.6} niebla={0.22} post={{bloom: 0.9, bokeh: 3}}>
      <Cam pos={suma(pos, mano(t, 2))} mira={[-0.04, 0.02, 0]} fov={34} />
      <ambientLight intensity={0.12} color="#ffb080" />
      <directionalLight position={[2, 2, 2]} intensity={1.3} color="#ffd2a8" />
      <directionalLight position={[-2, 1, -2]} intensity={1.9} color="#ff8a40" />
      <pointLight position={[0, -0.05, 0.6]} intensity={1.0} distance={1.6} color="#ff8a3a" />
      <group scale={[ola, 1, ola]}>
        <mesh geometry={geo} material={mats.liquido} scale={0.92} renderOrder={1} />
        <mesh geometry={geo} material={mats.pared} renderOrder={2} />
      </group>
      {/* burbujas de gas que suben dentro del refresco */}
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(1, 10, 8), [])}
        mat={mats.burbuja}
        n={80}
        f={(i, o) => {
          const f = (t * (0.3 + rnd(i) * 0.3) + rnd(i + 1)) % 1;
          const x = -0.28 + rnd(i + 2) * 0.46;
          const y0 = -0.2;
          const y = y0 + f * (nivel - y0);
          o.position.set(x + Math.sin(t * 4 + i) * 0.01, y, 0.03 + (rnd(i + 3) - 0.5) * 0.12);
          o.scale.setScalar(y < nivel ? 0.006 + rnd(i + 4) * 0.008 : 0);
        }}
      />
      {/* cristales de azúcar que caen y se disuelven */}
      <Enjambre
        geo={cubo}
        mat={mats.azucar}
        n={28}
        f={(i, o) => {
          const f = (t * 0.22 + rnd(i + 7)) % 1;
          o.position.set(-0.3 + rnd(i + 8) * 0.5, 0.45 - f * 0.6, 0.04 + (rnd(i + 9) - 0.5) * 0.1);
          o.rotation.set(t + i, t * 0.7 + i, 0);
          o.scale.setScalar(0.03 * Math.max(0, 1 - f * 1.3));
        }}
      />
      {/* glucosa y fructosa que salen del líquido */}
      {(['glucosa', 'fructosa'] as const).map((tipo, j) => (
        <Enjambre
          key={tipo}
          geo={j ? geoFructosa() : geoGlucosa()}
          mat={mats[tipo]}
          n={26}
          f={(i, o) => {
            const f = (t * 0.28 + rnd(i + j * 40)) % 1;
            const a = rnd(i + 1 + j * 40) * Math.PI * 2;
            o.position.set(-0.05 + Math.cos(a) * (0.15 + f * 0.6), -0.1 + f * 0.25, Math.sin(a) * (0.12 + f * 0.5));
            o.rotation.set(t + i, t * 0.6 + i, 0);
            o.scale.setScalar(0.03 * Math.sin(f * Math.PI) * entre(t, 1, 2.5));
          }}
        />
      ))}
      <Particulas t={t} n={600} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.5} color="#ffb070" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#ffb070" int={0.045} />
    </LienzoCola>
  );
};

/** Interior de un vaso sanguíneo con glóbulos rojos y azúcar (glucosa y fructosa) que viaja. */
const TunelVaso: React.FC<PropsToma & {densidad: (t: number) => number; fructosa?: boolean; tinte?: string}> = ({t, densidad, fructosa = true, tinte = '#ffd0b8'}) => {
  const {geo, curva} = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 16; i++) pts.push([Math.sin(i * 0.7) * 2.2, Math.cos(i * 0.5) * 1.4, -i * 5]);
    return tuboVariable(pts, (u) => 1.25 + Math.sin(u * 40) * 0.05, 400, 48);
  }, []);
  const mats = useMemo(() => {
    const pared = matOrgano({color: '#6a0a12', color2: '#c0303a', vasos: '#ff6a5a', vasosEsc: 1.2, motas: 0.8, borde: '#ff4a3a', bordeInt: 0.5, rug: 0.3, barniz: 1, opacidad: 0.85});
    pared.side = THREE.BackSide;
    return {
      pared,
      rojo: new THREE.MeshPhysicalMaterial({color: '#b0101a', roughness: 0.35, clearcoat: 0.8, sheen: 0.6, sheenColor: new THREE.Color('#ff6a5a'), emissive: '#3a0004'}),
      glucosa: brillo('#9af0ff', 2.4),
      fructosa: brillo('#ffa23a', 2.4),
    };
  }, []);
  animarMat(mats.pared, t);
  const L = curva.getLength();
  const u0 = 0.06 + (t * 1.6) / L;
  const cp = curva.getPointAt(Math.min(0.95, u0));
  const ca = curva.getPointAt(Math.min(0.97, u0 + 0.025));
  const ref = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const lado = new THREE.Vector3();
  const arriba = new THREE.Vector3();
  const situar = (u: number, ang: number, rad: number, o: THREE.Object3D) => {
    const uu = Math.min(0.999, Math.max(0, u));
    curva.getPointAt(uu, ref);
    curva.getTangentAt(uu, tan);
    lado.set(0, 1, 0).cross(tan).normalize();
    arriba.copy(tan).cross(lado).normalize();
    o.position.copy(ref).addScaledVector(lado, Math.cos(ang) * rad).addScaledVector(arriba, Math.sin(ang) * rad);
  };
  const dens = densidad(t);
  return (
    <LienzoCola foco={1.2} rango={1.0} niebla={0.09} fondo="#1a0204" post={{bloom: 1.1, aberracion: 0.0025}}>
      <Cam pos={[cp.x, cp.y, cp.z]} mira={[ca.x, ca.y, ca.z]} fov={58} rollo={Math.sin(t * 0.4) * 0.08} />
      <ambientLight intensity={0.25} color="#ff6a5a" />
      <pointLight position={[cp.x, cp.y + 0.3, cp.z]} intensity={3.72} distance={9} color={tinte} />
      <pointLight position={[ca.x, ca.y, ca.z - 4]} intensity={4.5} distance={10} color="#9af0ff" />
      <mesh geometry={geo} material={mats.pared} />
      <Enjambre
        geo={geoGlobuloRojo()}
        mat={mats.rojo}
        n={240}
        f={(i, o) => {
          const u = (((rnd(i) + (t * 2.4) / L) % 1) + 1) % 1;
          situar(u, rnd(i + 1) * Math.PI * 2, 0.15 + rnd(i + 2) * 0.85, o);
          o.rotation.set(t * (0.5 + rnd(i + 3)) + i, t * 0.3 + i * 2, rnd(i) * 3);
          o.scale.setScalar(0.42 + rnd(i + 4) * 0.08);
        }}
      />
      {(['glucosa', 'fructosa'] as const).map((tipo, j) =>
        j && !fructosa ? null : (
          <Enjambre
            key={tipo}
            geo={j ? geoFructosa() : geoGlucosa()}
            mat={mats[tipo]}
            n={j ? 60 : 130}
            f={(i, o) => {
              const u = (((rnd(i + 50 + j * 300) + (t * 2.0) / L) % 1) + 1) % 1;
              situar(u, rnd(i + 51 + j * 300) * Math.PI * 2, 0.1 + rnd(i + 52 + j * 300) * 0.8, o);
              o.rotation.set(t * (0.8 + rnd(i)) + i, t * 0.6 + i, t * 0.3);
              const vis = rnd(i + 99 + j * 300) < dens;
              o.scale.setScalar(vis ? 0.13 : 0);
            }}
          />
        ),
      )}
      <Particulas t={t} n={600} centro={[cp.x, cp.y, cp.z - 4]} tam={[3, 3, 10]} size={0.03} op={0.5} color="#ffb8a0" vel={0.03} />
    </LienzoCola>
  );
};
/** Día 1: el azúcar pasa a la sangre. */
export const TomaVasoAzucar: React.FC<PropsToma> = (p) => <TunelVaso {...p} densidad={(t) => 0.12 + entre(t, 0.3, 4.5) * 0.45} />;
/** Día 7: glóbulos rojos y glucosa en sangre que sube después de la bebida. */
export const TomaGlobulos: React.FC<PropsToma> = (p) => <TunelVaso {...p} fructosa={false} densidad={(t) => 0.2 + entre(t, 0.8, 4.2) * 0.75} tinte="#ffe0c8" />;

/* =================================================================== DÍA 7 */

/** El páncreas libera insulina. */
export const TomaPancreas: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0.04, 0], 1.75 - (t / d) * 0.35, 0.5 - (t / d) * 0.7, 0.28);
  const mI = useMemo(() => brillo('#7dffa8', 2.2), []);
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.5} niebla={0.2} post={{bloom: 1.0, bokeh: 3}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0.04, 0]} fov={34} />
      <ambientLight intensity={0.15} color="#ffc8a0" />
      <directionalLight position={[2, 2, 2]} intensity={1.3} color="#ffe0c8" />
      <directionalLight position={[-2, 1, -2]} intensity={1.7} color="#3affa0" />
      <pointLight position={[0, 0.3, 0.7]} intensity={0.9} distance={2} color="#7dffb0" />
      <Pancreas t={t} s={1.1} brillo={entre(t, 0.5, 2)} />
      <Enjambre
        geo={geoInsulina()}
        mat={mI}
        n={70}
        f={(i, o) => {
          const f = (t * 0.32 + rnd(i)) % 1;
          const u = rnd(i + 1);
          const x = -0.55 + u * 1.15;
          const y0 = -0.08 + u * 0.3;
          const a = rnd(i + 2) * Math.PI * 2;
          o.position.set(x + Math.cos(a) * f * 0.5, y0 + 0.05 + f * 0.55 + Math.sin(a) * f * 0.2, Math.sin(a) * f * 0.6 + 0.1);
          o.rotation.set(t + i, t * 0.5 + i, 0);
          o.scale.setScalar(0.07 * Math.sin(Math.min(1, f * 1.2) * Math.PI) * entre(t, 0.4 + rnd(i + 3), 1.5 + rnd(i + 3)));
        }}
      />
      <Particulas t={t} n={600} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.5} color="#a8ffd0" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#7dffb0" int={0.04} />
    </LienzoCola>
  );
};

/** La insulina se une a sus receptores y la glucosa entra en la célula por sus canales. */
export const TomaInsulina: React.FC<PropsToma> = ({t, d}) => {
  const R = 6;
  const mats = useMemo(
    () => ({
      membrana: matOrgano({color: '#a85a7a', color2: '#e8a0c0', motas: 1.6, vasos: '#ffb0d8', vasosEsc: 0.5, borde: '#ffc8e8', bordeInt: 0.9, rug: 0.3, barniz: 0.9, ondula: 0.03, opacidad: 0.88}),
      receptor: matOrgano({color: '#3a6ab8', color2: '#7aa8ff', motas: 4, borde: '#bfe0ff', bordeInt: 1.2, rug: 0.35}),
      canal: matOrgano({color: '#8a4ab8', color2: '#c08aff', motas: 4, borde: '#e0c8ff', bordeInt: 1.1, rug: 0.35}),
      insulina: brillo('#7dffa8', 2.4),
      glucosa: brillo('#9af0ff', 2.4),
      interior: new THREE.MeshBasicMaterial({color: '#2a0a20', side: THREE.BackSide}),
    }),
    [],
  );
  animarMat(mats.membrana, t);
  animarMat(mats.receptor, t, entre(t, 1, 2.5) * (0.5 + 0.5 * Math.sin(t * 6)));
  animarMat(mats.canal, t, entre(t, 2.2, 3.5) * 0.6);
  // puntos de la superficie (polo norte de una gran célula esférica)
  const sitios = useMemo(() => {
    const r: {n: THREE.Vector3; canal: boolean}[] = [];
    for (let i = 0; i < 22; i++) {
      const a = rnd(i + 3) * Math.PI * 2;
      const b = 0.05 + Math.sqrt(rnd(i + 4)) * 0.42;
      r.push({n: new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)), canal: i % 2 === 1});
    }
    return r;
  }, []);
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const c = ruta(t, [
    {t: 0, pos: [2.4, R + 2.6, 3.4], mira: [0, R, 0], fov: 38},
    {t: d, pos: [0.9, R + 1.3, 2.2], mira: [0, R - 0.1, 0], fov: 38},
  ]);
  const abiertos = entre(t, 2.2, 3.6);
  const receptores = sitios.filter((s) => !s.canal);
  const canales = sitios.filter((s) => s.canal);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={1.4} niebla={0.07} fondo="#07030a" post={{bloom: 1.0, aberracion: 0.002}}>
      <Cam pos={suma(c.pos, mano(t, 10))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.22} color="#ff9ad0" />
      <directionalLight position={[3, 10, 4]} intensity={1.2} color="#fff0f8" />
      <directionalLight position={[-4, 5, -3]} intensity={1.4} color="#6a8aff" />
      <pointLight position={[0, R + 1.2, 0.5]} intensity={1.2} distance={4} color="#9af0ff" />
      <mesh material={mats.membrana}>
        <sphereGeometry args={[R, 160, 120]} />
      </mesh>
      {receptores.map((s, i) => (
        <mesh key={`r${i}`} geometry={geoReceptor()} material={mats.receptor} position={s.n.clone().multiplyScalar(R - 0.05)} quaternion={q.clone().setFromUnitVectors(up, s.n)} />
      ))}
      {canales.map((s, i) => (
        <mesh key={`c${i}`} geometry={geoCanal()} material={mats.canal} position={s.n.clone().multiplyScalar(R)} quaternion={q.clone().setFromUnitVectors(up, s.n)} scale={[1 + abiertos * 0.25, 1, 1 + abiertos * 0.25]} />
      ))}
      {/* insulina que llega y se acopla a cada receptor */}
      <Enjambre
        geo={geoInsulina()}
        mat={mats.insulina}
        n={receptores.length}
        f={(i, o) => {
          const s = receptores[i];
          const llega = entre(t, 0.2 + rnd(i) * 1.2, 1.4 + rnd(i) * 1.2);
          const destino = s.n.clone().multiplyScalar(R + 0.62);
          const origen = s.n.clone().multiplyScalar(R + 2.6).add(new THREE.Vector3(rnd(i + 1) - 0.5, 0.5, rnd(i + 2) - 0.5));
          o.position.copy(origen.lerp(destino, llega));
          o.rotation.set(t * 0.5 + i, t * 0.3, 0);
          o.scale.setScalar(0.38);
        }}
      />
      {/* glucosa entrando por los canales abiertos */}
      <Enjambre
        geo={geoGlucosa()}
        mat={mats.glucosa}
        n={110}
        f={(i, o) => {
          const s = canales[i % canales.length];
          const f = (t * (0.3 + rnd(i) * 0.15) + rnd(i + 5)) % 1;
          const fuera = s.n.clone().multiplyScalar(R + 1.8).add(new THREE.Vector3((rnd(i + 6) - 0.5) * 1.6, (rnd(i + 7) - 0.5) * 0.6, (rnd(i + 8) - 0.5) * 1.6));
          const boca = s.n.clone().multiplyScalar(R + 0.1);
          const dentro = s.n.clone().multiplyScalar(R - 0.9);
          const entra = f > 0.6 && abiertos > 0.5;
          const p = f < 0.6 ? fuera.lerp(boca, Math.pow(f / 0.6, 1.5) * (0.35 + 0.65 * abiertos)) : entra ? boca.lerp(dentro, (f - 0.6) / 0.4) : fuera.lerp(boca, 0.35);
          o.position.copy(p);
          o.rotation.set(t + i, t * 0.6 + i, 0);
          o.scale.setScalar(0.17 * (entra ? 1 - (f - 0.6) / 0.4 : 1));
        }}
      />
      <Particulas t={t} n={600} centro={[0, R + 1, 0]} tam={[7, 3, 7]} size={0.025} op={0.45} color="#ffc8e8" />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 15 */

/** Acercamiento cinematográfico al hígado dentro del cuerpo; la fructosa llega por la sangre. */
export const TomaHigadoZoom: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [-0.5, 1.3, 1.25], mira: [-0.02, 1.18, 0], fov: 34},
    {t: d, pos: [-0.16, 1.2, 0.3], mira: [-0.045, 1.165, 0.02], fov: 32},
  ]);
  const mF = useMemo(() => brillo('#ffa23a', 2.4), []);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={0.25} niebla={0.15} post={{bokeh: 2.5, bloom: 0.9}}>
      <Cam pos={suma(c.pos, mano(t, 1.5))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo />
      <CuerpoHombre t={t} piel={0} holo={0.6} esqueleto={0.35} vasos={0.8} luzHigado={entre(t, 0.5, 2.5) * 0.9} />
      <Enjambre
        geo={geoFructosa()}
        mat={mF}
        n={50}
        f={(i, o) => {
          const f = (t * 0.35 + rnd(i)) % 1;
          const a = rnd(i + 1) * Math.PI * 2;
          const r = 0.14 * (1 - f) + 0.02;
          o.position.set(-0.04 + Math.cos(a) * r, 1.165 + (rnd(i + 2) - 0.5) * 0.06 - (1 - f) * 0.05, 0.03 + Math.sin(a) * r * 0.6);
          o.rotation.set(t * 2 + i, t, 0);
          o.scale.setScalar(0.006 * Math.min(1, (1 - f) * 4));
        }}
      />
      <Particulas t={t} n={700} centro={[0, 1.2, 0.1]} tam={[1.5, 1, 1.2]} size={0.006} op={0.5} color="#ffd8a0" />
    </LienzoCola>
  );
};

/** El hígado aislado: aparecen gotas de grasa (representación de la acumulación gradual). */
export const TomaHigadoGraso: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0, 0], 2.25 - (t / d) * 0.55, -0.6 + (t / d) * 0.8, 0.35);
  const mats = useMemo(
    () => ({
      gota: new THREE.MeshPhysicalMaterial({color: '#ffd060', emissive: '#d89a20', emissiveIntensity: 0.7, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.85}),
      fructosa: brillo('#ffa23a', 2.2),
    }),
    [],
  );
  const acumula = entre(t, 0.3, d * 0.9);
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.6} niebla={0.2} post={{bloom: 0.85, bokeh: 3}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0.02, 0]} fov={34} />
      <ambientLight intensity={0.18} color="#ff9a6a" />
      <directionalLight position={[2, 2, 1.5]} intensity={1.24} color="#ffd8b0" />
      <directionalLight position={[-2, 1, -2]} intensity={1.6} color="#ffc03a" />
      <pointLight position={[0.2, 0.3, 1.0]} intensity={0.5 + acumula * 0.8} distance={2.2} color="#ffd040" />
      <Higado t={t} s={0.9} borde="#ffd040" op={0.62} />
      <Enjambre
        geo={geoGota()}
        mat={mats.gota}
        n={90}
        f={(i, o) => {
          const a = rnd(i) * Math.PI * 2;
          const rr = 0.05 + Math.sqrt(rnd(i + 1)) * 0.42;
          o.position.set(Math.cos(a) * rr - 0.08, 0.02 + (rnd(i + 2) - 0.5) * 0.24, Math.sin(a) * rr * 0.55 + 0.05);
          const k = Math.min(1, Math.max(0, acumula * 1.7 - rnd(i + 3) * 0.7));
          o.scale.setScalar(0.07 * k * (0.5 + rnd(i + 4) * 0.7));
        }}
      />
      <Enjambre
        geo={geoFructosa()}
        mat={mats.fructosa}
        n={30}
        f={(i, o) => {
          const f = (t * 0.3 + rnd(i)) % 1;
          const a = rnd(i + 1) * Math.PI * 2;
          const r = 1.3 * (1 - f) + 0.35;
          o.position.set(Math.cos(a) * r, -0.5 + f * 0.5, Math.sin(a) * r * 0.7);
          o.rotation.set(t + i, t * 0.7, 0);
          o.scale.setScalar(0.04 * Math.min(1, (1 - f) * 4));
        }}
      />
      <Particulas t={t} n={600} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.5} color="#ffc070" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#ffc070" int={0.045} />
    </LienzoCola>
  );
};

const geoCelula = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (g) return g;
    g = new THREE.SphereGeometry(0.5, 64, 48);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const k = 1 + ruido3(v.x * 3, v.y * 3, v.z * 3) * 0.12;
      const caja = Math.max(Math.abs(v.x), Math.abs(v.y) * 1.1, Math.abs(v.z)) * 2;
      v.multiplyScalar(k * (0.75 + 0.25 / Math.max(0.7, caja)));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  };
})();

/** Células del hígado con gotas de grasa que crecen. */
export const TomaHepatocitosGrasa: React.FC<PropsToma> = ({t, d}) => {
  const mats = useMemo(
    () => ({
      membrana: matOrgano({color: '#c86a6a', color2: '#e89a8a', motas: 3, borde: '#ffb0a0', bordeInt: 1.1, rug: 0.35, barniz: 0.8, opacidad: 0.4, ondula: 0.02}),
      nucleo: matOrgano({color: '#5a2a8a', color2: '#8a4ab8', motas: 6, borde: '#c08aff', bordeInt: 0.8, rug: 0.4}),
      gota: new THREE.MeshPhysicalMaterial({color: '#ffd868', emissive: '#c88a18', emissiveIntensity: 0.8, roughness: 0.12, clearcoat: 1, transparent: true, opacity: 0.88}),
    }),
    [],
  );
  animarMat(mats.membrana, t);
  animarMat(mats.nucleo, t);
  const celdas = useMemo(() => {
    const r: V3[] = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r.push([(j - 1.5) * 1.02 + (i % 2) * 0.5, (i - 1.5) * 0.9, (rnd(i * 4 + j) - 0.5) * 0.3]);
    return r;
  }, []);
  const crece = entre(t, 0.2, d * 0.95);
  const c = ruta(t, [
    {t: 0, pos: [0.9, 0.5, 2.9], mira: [0, 0, 0], fov: 36},
    {t: d, pos: [-0.2, 0.15, 1.7], mira: [-0.15, 0, 0], fov: 36},
  ]);
  return (
    <LienzoCola foco={1.9} rango={0.9} niebla={0.15} fondo="#08050a" post={{aberracion: 0.002, bloom: 0.9}}>
      <Cam pos={suma(c.pos, mano(t, 10))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.2} color="#ff9a8a" />
      <directionalLight position={[2, 2, 3]} intensity={1.0} color="#ffe0d0" />
      <directionalLight position={[-2, 1, -2]} intensity={1.5} color="#ffb04a" />
      {celdas.map((p, i) => (
        <group key={i} position={p} scale={[1, 0.9, 0.8]}>
          <mesh geometry={geoCelula()} material={mats.membrana} />
          <mesh material={mats.nucleo} position={[0.14 + crece * 0.06, 0.08, 0]} scale={0.12}>
            <sphereGeometry args={[1, 32, 24]} />
          </mesh>
        </group>
      ))}
      <Enjambre
        geo={geoGota()}
        mat={mats.gota}
        n={celdas.length * 5}
        f={(i, o) => {
          const p = celdas[Math.floor(i / 5)];
          const k = i % 5;
          const grande = k === 0;
          const a = rnd(i) * Math.PI * 2;
          const r = grande ? 0.04 : 0.18 + rnd(i + 1) * 0.08;
          o.position.set(p[0] - 0.06 + Math.cos(a) * r, p[1] + Math.sin(a) * r * 0.8, p[2] + 0.05);
          const kk = Math.min(1, Math.max(0, crece * 1.5 - rnd(i + 2) * 0.5));
          o.scale.setScalar((grande ? 0.42 : 0.12) * kk * (0.8 + rnd(i + 3) * 0.4));
        }}
      />
      <Particulas t={t} n={500} tam={[5, 4, 4]} size={0.02} op={0.45} color="#ffd8a0" />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 30 */

/** Cuerpo completo con indicadores: grasa, páncreas, hígado y corazón (sincronizados con la voz). */
export const TomaCuerpo30: React.FC<PropsToma & {marcas: {peso: number; diabetes: number; higado: number; corazon: number}}> = ({t, d, marcas}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.9, 1.15, 3.3], mira: [0, 0.98, 0], fov: 34},
    {t: marcas.diabetes - 0.6, pos: [0.55, 1.2, 2.2], mira: [0, 1.1, 0], fov: 34},
    {t: d, pos: [0.2, 1.3, 1.25], mira: [0, 1.24, 0], fov: 34},
  ]);
  const peso = entre(t, marcas.peso - 0.4, marcas.peso + 1.2);
  const on = (k: number) => entre(t, k - 0.3, k + 0.4);
  const pz = on(marcas.diabetes);
  const hz = on(marcas.higado);
  const cz = on(marcas.corazon);
  const giro = 0.18 - t * 0.02;
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={1.2} niebla={0.12} post={{bokeh: 2, bloom: 1.0}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo />
      <CuerpoHombre t={t} piel={0} holo={0.55} grasa={peso * 0.55} esqueleto={0.4} luzPancreas={pz} luzHigado={hz} higadoGraso={hz} luzCorazon={cz} luzCerebro={on(d - 0.6)} giro={giro} />
      <Anillo p={rotY([0.012, 1.105, 0.05], giro)} cam={c.pos} color="#7dffb0" on={pz} r={0.07} t={t} />
      <Anillo p={rotY([-0.05, 1.17, 0.07], giro)} cam={c.pos} color="#ffd040" on={hz} r={0.085} t={t} />
      <Anillo p={rotY([0.022, 1.3, 0.08], giro)} cam={c.pos} color="#ff4a4a" on={cz} r={0.07} t={t} />
      <Suelo />
      <Particulas t={t} n={900} centro={[0, 1.1, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.5} color="#ffc8b0" />
    </LienzoCola>
  );
};

/** Cerebro: la cafeína puede afectar al sueño. */
export const TomaCerebroCafeina: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0, 0], 3.2 - (t / d) * 0.6, -0.7 + (t / d) * 0.6, 0.5);
  const mC = useMemo(() => brillo('#ffe2b8', 2.2), []);
  const parpadeo = 0.75 + 0.25 * Math.abs(Math.sin(t * 6.3) * Math.sin(t * 2.1));
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.6} post={{bloom: 1}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0, 0]} fov={34} />
      <ambientLight intensity={0.15} color="#8a6aff" />
      <directionalLight position={[2, 2, 2]} intensity={1.8 * parpadeo} color="#f0d8ff" />
      <directionalLight position={[-2, 1, -2]} intensity={1.86} color="#9a5aff" />
      <pointLight position={[0, 0.5, 0.8]} intensity={0.8} distance={2} color="#c89aff" />
      <Cerebro t={t} s={1.2} brillo={1.3} chispas={45} />
      <Enjambre
        geo={geoCafeina()}
        mat={mC}
        n={46}
        f={(i, o) => {
          const f = (t * 0.28 + rnd(i)) % 1;
          const a = rnd(i + 1) * Math.PI * 2;
          const r0 = 1.4 * (1 - f) + 0.5;
          o.position.set(Math.cos(a) * r0, -0.8 + f * 0.9 + (rnd(i + 2) - 0.5) * 0.4, Math.sin(a) * r0 * 0.8);
          o.rotation.set(t * 1.5 + i, t, 0);
          o.scale.setScalar(0.06 * Math.min(1, (1 - f) * 4));
        }}
      />
      <Particulas t={t} n={700} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.5} color="#b08aff" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#b08aff" int={0.045} />
    </LienzoCola>
  );
};

/* =================================================================== FINAL */

/** Deja la botella sobre la mesa, toma el vaso de agua y la cámara se aleja despacio. */
export const TomaFinal: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.95, 0.98, 1.25], mira: [0.4, 0.84, 0.2], fov: 34},
    {t: 6.5, pos: [0.85, 1.02, 1.75], mira: [0.32, 0.9, 0.15], fov: 34},
    {t: d, pos: [0.3, 1.02, 4.1], mira: [0.14, 0.96, 0.05], fov: 34},
  ]);
  // botella: de la mano a la mesa (en arco)
  const kb = entre(t, 0.6, 2.8);
  const bA = enMano(0.22);
  const bB: V3 = [MESA.p[0] + 0.09, MESA.alto, MESA.p[2] - 0.05];
  const bP = lerp3(bA, bB, kb);
  bP[1] += Math.sin(kb * Math.PI) * 0.06;
  // vaso: de la mesa a la mano
  const kv = entre(t, 3.6, 5.8);
  const vA: V3 = [MESA.p[0] - 0.06, MESA.alto, MESA.p[2] + 0.08];
  const vB = enMano(0.12);
  vB[1] += 0.01;
  const vP = lerp3(vA, vB, kv);
  vP[1] += Math.sin(kv * Math.PI) * 0.07;
  const piel = 0.15 + entre(t, 6, d * 0.85) * 0.45;
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={t < 6 ? 0.35 : 1.5} niebla={0.1} post={{bokeh: 2}}>
      <Cam pos={suma(c.pos, mano(t, 0.8))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo piel={piel} calido={1} />
      <pointLight position={[MESA.p[0], MESA.alto + 0.4, MESA.p[2] + 0.3]} intensity={0.8} distance={1.4} color="#bfe8ff" />
      <CuerpoHombre t={t} piel={piel} holo={0.75 - piel * 0.4} esqueleto={0.3} vasos={0.8} organos={1 - piel * 0.5} giro={0.05} />
      <Botella t={t} p={bP} r={[0, 0.4 + kb * 0.8, 0.04 * (1 - kb)]} s={0.22} burbujas={1 - kb * 0.6} />
      <VasoAgua t={t} p={vP} s={0.12} brillo={0.6 + kv * 0.6} />
      <Mesa />
      <Suelo color="#4a9aff" />
      <Particulas t={t} n={900} centro={[0.1, 1.1, 0]} tam={[3.5, 2.8, 3.5]} size={0.012} op={0.5} />
      <Haz p={[0, 2.8, -0.4]} r={[0.25, 0, 0]} largo={3.4} ancho={1.3} color="#3a8aff" int={0.06} />
    </LienzoCola>
  );
};
