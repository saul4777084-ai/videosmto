import React, {useMemo} from 'react';
import * as THREE from 'three';
import {geoGlobuloRojo, tuboVariable} from '../ayuno/anatomia';
import {Cam, Cerebro, Corazon, Enjambre, entre, Haz, latido, mano, orbita, Particulas, rnd, ruta, suma, V3} from '../ayuno/escena';
import {animarMat, matOrgano} from '../ayuno/shaders';
import {geoCafeina, MANO} from '../cola/hombre';
import {brillo, CuerpoHombre, enMano, LienzoCola, Mesa, MESA, Suelo} from '../cola/objetos';
import {geoAdenosina, geoReceptorA, Taza} from './objetos';

/**
 * Tomas del vídeo "¿Qué le pasa a tu cuerpo si tomas 5 cafés al día durante 30 días?".
 * Cada toma recibe `t` (segundos desde que empieza) y `d` (lo que dura, con el solape de la
 * transición) y monta su propio lienzo 3D. Los instantes clave salen de la locución (`marcas`).
 */
export type PropsToma = {t: number; d: number};

/** Colores de la historia: cafeína ámbar, adenosina violeta, adrenalina roja. */
export const C_CAFEINA = '#ffb347';
export const C_ADENOSINA = '#9a8aff';
export const C_ADRENALINA = '#ff5a4a';

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const rotY = (p: V3, a: number): V3 => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** Iluminación de quirófano virtual para el cuerpo completo (como en el vídeo de la Coca-Cola). */
const LucesCuerpo: React.FC<{piel?: number; calido?: number}> = ({piel = 0, calido = 0}) => (
  <>
    <ambientLight intensity={0.07 + piel * 0.05} color="#4a6aaa" />
    <directionalLight position={[-2, 3, -3]} intensity={1.7} color="#5ab0ff" />
    <directionalLight position={[2.5, 2, -2]} intensity={1.1} color="#8a6aff" />
    <directionalLight position={[1.2, 2.2, 3]} intensity={0.5 + piel * 0.9 + calido * 0.5} color="#ffe2cc" />
    <spotLight position={[0.2, 3.2, 1.2]} angle={0.5} penumbra={0.8} intensity={piel * 4} distance={6} color="#fff0e0" />
    <pointLight position={[0.05, 1.32, 0.2]} intensity={0.12 * (1 - piel)} distance={0.5} color="#ff4a3a" />
    <pointLight position={[0, 1.72, 0.2]} intensity={0.08 * (1 - piel)} distance={0.4} color="#b88aff" />
    <pointLight position={[-0.05, 1.12, 0.2]} intensity={0.08 * (1 - piel)} distance={0.4} color="#ffb060" />
  </>
);

/** Anillo indicador que mira a la cámara y late. */
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

/** Taza sujeta por la mano derecha del hombre (por el asa). */
const TAZA_ALTO = 0.085;
const enManoTaza = (): V3 => {
  const p = enMano(TAZA_ALTO);
  return [p[0] - 0.035, p[1] + 0.01, p[2] + 0.01];
};

/* =================================================================== INTRODUCCIÓN */

/** Hombre con la taza humeante: la cámara se acerca y el cuerpo se vuelve transparente. */
export const TomaIntro: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.62, 1.0, 1.25], mira: [0.34, 0.86, 0.05], fov: 32},
    {t: 3.0, pos: [0.6, 1.1, 2.3], mira: [0.16, 1.02, 0], fov: 34},
    {t: d, pos: [0.18, 1.3, 1.0], mira: [0.04, 1.22, 0], fov: 33},
  ]);
  const piel = 1 - entre(t, 2.8, 5.8);
  const holo = entre(t, 3, 6) * 0.85;
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={t < 3 ? 0.4 : 0.6} niebla={0.1} post={{bokeh: 2}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo piel={piel} calido={0.6} />
      <CuerpoHombre t={t} piel={piel} holo={holo} esqueleto={entre(t, 3.2, 6)} vasos={entre(t, 3.5, 6.2)} organos={entre(t, 3, 5.5)} luzCerebro={entre(t, 5.5, 7) * 0.6} giro={-0.12 + t * 0.012} />
      <Taza t={t} p={enManoTaza()} r={[0, -0.3, 0]} s={TAZA_ALTO} vapor={1} />
      <pointLight position={[MANO[0] + 0.05, MANO[1] + 0.1, MANO[2] + 0.25]} intensity={0.5} distance={0.6} color="#ffb060" />
      <Suelo color="#ff9a3a" />
      <Particulas t={t} n={900} centro={[0, 1.1, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.5} color="#ffd8b0" />
      <Haz p={[0, 2.6, -0.6]} r={[0.35, 0, 0]} largo={3.2} ancho={1.1} color="#ff9a4a" int={0.05} />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 1 */

/** El café baja por el esófago y llega al estómago (perfil del cuerpo). */
export const TomaTrago: React.FC<PropsToma> = ({t, d}) => {
  const trago = entre(t, 0.1, d * 0.85) * 1.08;
  const c = ruta(t, [
    {t: 0, pos: [0.44, 1.6, 0.38], mira: [0.0, 1.52, 0.03], fov: 34},
    {t: d, pos: [0.4, 1.3, 0.44], mira: [0.04, 1.22, 0.02], fov: 34},
  ]);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={0.25} niebla={0.2} post={{bokeh: 2.5, bloom: 0.9}}>
      <Cam pos={suma(c.pos, mano(t, 1.5))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo />
      <CuerpoHombre t={t} piel={0} holo={0.7} esqueleto={0.45} vasos={0.4} esofago={1} trago={trago} torax={0} luzEstomago={entre(t, d * 0.7, d)} />
      <pointLight position={[0.2, 1.45, 0.2]} intensity={0.5} distance={0.8} color="#ffc8a0" />
      <Particulas t={t} n={700} centro={[0.1, 1.4, 0.1]} tam={[1.2, 1, 1.2]} size={0.006} op={0.5} color="#ffd0a0" />
    </LienzoCola>
  );
};

/** Interior de un vaso sanguíneo con glóbulos rojos y moléculas de cafeína. */
const TunelVaso: React.FC<PropsToma & {densidad: (t: number) => number; noche?: number}> = ({t, densidad, noche = 0}) => {
  const {geo, curva} = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 16; i++) pts.push([Math.sin(i * 0.7) * 2.2, Math.cos(i * 0.5) * 1.4, -i * 5]);
    return tuboVariable(pts, (u) => 1.25 + Math.sin(u * 40) * 0.05, 400, 48);
  }, []);
  const mats = useMemo(() => {
    const pared = noche
      ? matOrgano({color: '#2a1040', color2: '#5a3a8a', vasos: '#9a7aff', vasosEsc: 1.2, motas: 0.8, borde: '#6a7aff', bordeInt: 0.5, rug: 0.3, barniz: 1, opacidad: 0.85})
      : matOrgano({color: '#6a0a12', color2: '#c0303a', vasos: '#ff6a5a', vasosEsc: 1.2, motas: 0.8, borde: '#ff4a3a', bordeInt: 0.5, rug: 0.3, barniz: 1, opacidad: 0.85});
    pared.side = THREE.BackSide;
    return {
      pared,
      rojo: new THREE.MeshPhysicalMaterial({color: '#b0101a', roughness: 0.35, clearcoat: 0.8, sheen: 0.6, sheenColor: new THREE.Color('#ff6a5a'), emissive: '#3a0004'}),
      cafeina: brillo(C_CAFEINA, 2.6),
    };
  }, [noche]);
  animarMat(mats.pared, t);
  const L = curva.getLength();
  const vel = 1.6 * (1 - noche * 0.45);
  const u0 = 0.06 + (t * vel) / L;
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
  const fondo = noche > 0.5 ? '#04030e' : '#1a0204';
  return (
    <LienzoCola foco={1.2} rango={1.0} niebla={0.09} fondo={fondo} post={{bloom: 1.1, aberracion: 0.0025}}>
      <Cam pos={[cp.x, cp.y, cp.z]} mira={[ca.x, ca.y, ca.z]} fov={58} rollo={Math.sin(t * 0.4) * 0.08} />
      <ambientLight intensity={0.25 - noche * 0.12} color={noche ? '#6a6aff' : '#ff6a5a'} />
      <pointLight position={[cp.x, cp.y + 0.3, cp.z]} intensity={3.7 - noche * 1.6} distance={9} color={noche ? '#9aa8ff' : '#ffd8b8'} />
      <pointLight position={[ca.x, ca.y, ca.z - 4]} intensity={4.5 - noche * 2} distance={10} color={C_CAFEINA} />
      <mesh geometry={geo} material={mats.pared} />
      <Enjambre
        geo={geoGlobuloRojo()}
        mat={mats.rojo}
        n={240}
        f={(i, o) => {
          const u = (((rnd(i) + (t * vel * 1.5) / L) % 1) + 1) % 1;
          situar(u, rnd(i + 1) * Math.PI * 2, 0.15 + rnd(i + 2) * 0.85, o);
          o.rotation.set(t * (0.5 + rnd(i + 3)) + i, t * 0.3 + i * 2, rnd(i) * 3);
          o.scale.setScalar(0.42 + rnd(i + 4) * 0.08);
        }}
      />
      <Enjambre
        geo={geoCafeina()}
        mat={mats.cafeina}
        n={150}
        f={(i, o) => {
          const u = (((rnd(i + 50) + (t * vel * 1.25) / L) % 1) + 1) % 1;
          situar(u, rnd(i + 51) * Math.PI * 2, 0.1 + rnd(i + 52) * 0.8, o);
          o.rotation.set(t * (0.8 + rnd(i)) + i, t * 0.6 + i, t * 0.3);
          o.scale.setScalar(rnd(i + 99) < dens ? 0.12 : 0);
        }}
      />
      <Particulas t={t} n={600} centro={[cp.x, cp.y, cp.z - 4]} tam={[3, 3, 10]} size={0.03} op={0.5} color={noche ? '#a8b8ff' : '#ffb8a0'} vel={0.03} />
    </LienzoCola>
  );
};
/** Día 1: la cafeína pasa a la sangre. */
export const TomaSangre: React.FC<PropsToma> = (p) => <TunelVaso {...p} densidad={(t) => 0.1 + entre(t, 0.2, 2.2) * 0.6} />;
/** Día 15: de noche aún queda cafeína en la sangre (se reduce a la mitad muy despacio). */
export const TomaSangreNoche: React.FC<PropsToma> = (p) => <TunelVaso {...p} noche={1} densidad={(t) => 0.75 * Math.pow(0.5, entre(t, 1, p.d - 1))} />;

/** La cafeína llega al cerebro. */
export const TomaCerebro: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0, 0], 2.9 - (t / d) * 0.7, -0.7 + (t / d) * 0.6, 0.45);
  const mC = useMemo(() => brillo(C_CAFEINA, 2.4), []);
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.6} post={{bloom: 1}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0, 0]} fov={34} />
      <ambientLight intensity={0.15} color="#8a6aff" />
      <directionalLight position={[2, 2, 2]} intensity={1.7} color="#f0d8ff" />
      <directionalLight position={[-2, 1, -2]} intensity={1.8} color="#9a5aff" />
      <pointLight position={[0, -0.3, 0.9]} intensity={0.4 + entre(t, 0.5, d) * 1.2} distance={2} color={C_CAFEINA} />
      <Cerebro t={t} s={1.2} brillo={1 + entre(t, 0.6, d) * 0.6} chispas={20 + entre(t, 0.5, d) * 30} />
      <Enjambre
        geo={geoCafeina()}
        mat={mC}
        n={60}
        f={(i, o) => {
          const f = (t * 0.34 + rnd(i)) % 1;
          const a = rnd(i + 1) * Math.PI * 2;
          const r0 = 1.5 * (1 - f) + 0.45;
          o.position.set(Math.cos(a) * r0, -0.9 + f * 0.95 + (rnd(i + 2) - 0.5) * 0.4, Math.sin(a) * r0 * 0.8);
          o.rotation.set(t * 1.5 + i, t, 0);
          o.scale.setScalar(0.06 * Math.min(1, (1 - f) * 4));
        }}
      />
      <Particulas t={t} n={700} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.5} color="#ffc890" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#b08aff" int={0.045} />
    </LienzoCola>
  );
};

/**
 * Superficie de una neurona con receptores de adenosina.
 * - modo 'bloqueo' (día 1): la cafeína desplaza a la adenosina de sus receptores → te despejas.
 * - modo 'tolerancia' (día 7): aparecen receptores nuevos, libres, y la adenosina vuelve a encajar.
 */
const R = 6;
const Neurona: React.FC<PropsToma & {modo: 'bloqueo' | 'tolerancia'; marcas: {a: number; b: number; c: number}}> = ({t, d, modo, marcas}) => {
  const mats = useMemo(
    () => ({
      membrana: matOrgano({color: '#5a4a8a', color2: '#9a88d0', motas: 1.6, vasos: '#c8b0ff', vasosEsc: 0.5, borde: '#d0c0ff', bordeInt: 0.9, rug: 0.3, barniz: 0.9, ondula: 0.03, opacidad: 0.9}),
      receptor: matOrgano({color: '#3a6ab8', color2: '#7aa8ff', motas: 4, borde: '#bfe0ff', bordeInt: 1.1, rug: 0.35}),
      nuevo: matOrgano({color: '#3a8a9a', color2: '#7ae0f0', motas: 4, borde: '#bff8ff', bordeInt: 1.3, rug: 0.35}),
      adenosina: brillo(C_ADENOSINA, 2.4),
      cafeina: brillo(C_CAFEINA, 2.6),
    }),
    [],
  );
  // n receptores: los 14 primeros existen siempre; en "tolerancia" brotan 12 más
  const N0 = 14;
  const N1 = modo === 'tolerancia' ? 12 : 0;
  const sitios = useMemo(() => {
    const r: THREE.Vector3[] = [];
    for (let i = 0; i < N0 + N1; i++) {
      const a = i * 2.39996 + 0.4;
      const b = 0.04 + Math.sqrt((i + 0.5) / (N0 + N1)) * 0.36;
      r.push(new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)));
    }
    return r;
  }, [N0, N1]);
  const nuevos = sitios.map((_, i) => (i % 2 === 1 && Math.floor(i / 2) < N1 ? 1 : 0));
  // índice de los receptores "viejos" y "nuevos"
  const viejos = sitios.map((_, i) => i).filter((i) => !nuevos[i]);
  const brote = (i: number) => (nuevos[i] ? entre(t, marcas.a + rnd(i) * 1.2, marcas.a + 0.8 + rnd(i) * 1.2) : 1);

  // ocupación de cada receptor por cafeína (0..1) a lo largo de la toma
  const llegaCaf = (i: number) => (modo === 'bloqueo' ? entre(t, marcas.a + rnd(i + 7) * 1.6, marcas.a + 0.9 + rnd(i + 7) * 1.6) : 1);
  const despeja = modo === 'bloqueo' ? entre(t, marcas.c - 0.3, marcas.c + 0.5) : 0;
  const cansado = modo === 'tolerancia' ? entre(t, marcas.b, marcas.c) : 0;
  animarMat(mats.membrana, t, despeja * (0.6 + 0.4 * Math.sin(t * 8)) + cansado * 0.2);
  animarMat(mats.receptor, t, 0.3 + 0.3 * Math.sin(t * 3));
  animarMat(mats.nuevo, t, 0.5 + 0.5 * Math.sin(t * 5));

  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const c = ruta(t, [
    {t: 0, pos: [2.2, R + 2.4, 3.2], mira: [0, R, 0], fov: 38},
    {t: d, pos: [0.8, R + 1.25, 2.1], mira: [0, R - 0.1, 0], fov: 38},
  ]);
  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={1.4} niebla={0.07} fondo="#05030c" post={{bloom: 1.0 + despeja * 0.4, aberracion: 0.002}}>
      <Cam pos={suma(c.pos, mano(t, 10))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.22 - cansado * 0.08} color="#b8a0ff" />
      <directionalLight position={[3, 10, 4]} intensity={1.1 + despeja * 0.6} color="#fff4e8" />
      <directionalLight position={[-4, 5, -3]} intensity={1.4} color="#6a8aff" />
      <pointLight position={[0, R + 1.2, 0.5]} intensity={1.0 + despeja * 2} distance={4} color={C_CAFEINA} />
      <pointLight position={[0.5, R + 1.0, -0.5]} intensity={0.8 + cansado * 1.5} distance={4} color={C_ADENOSINA} />
      <mesh material={mats.membrana}>
        <sphereGeometry args={[R, 160, 120]} />
      </mesh>
      {sitios.map((s, i) => (
        <mesh
          key={`r${i}`}
          geometry={geoReceptorA()}
          material={nuevos[i] ? mats.nuevo : mats.receptor}
          position={s.clone().multiplyScalar(R - 0.12 + 0.12 * brote(i))}
          quaternion={q.clone().setFromUnitVectors(up, s)}
          scale={0.9 * brote(i)}
        />
      ))}
      {/* cafeína: en los receptores de siempre */}
      <Enjambre
        geo={geoCafeina()}
        mat={mats.cafeina}
        n={viejos.length}
        f={(k, o) => {
          const i = viejos[k];
          const s = sitios[i];
          const ll = llegaCaf(i);
          v.copy(s).multiplyScalar(R + 0.62);
          w.copy(s).multiplyScalar(R + 3).add(new THREE.Vector3(rnd(i + 1) - 0.5, 0.6, rnd(i + 2) - 0.5));
          o.position.copy(w.lerp(v, ll));
          o.rotation.set(t * 0.4 + i, t * 0.3 + (1 - ll) * 4, 0);
          o.scale.setScalar(0.22);
        }}
      />
      {/* adenosina: encaja en los receptores libres o rebota cuando la cafeína ocupa el sitio */}
      <Enjambre
        geo={geoAdenosina()}
        mat={mats.adenosina}
        n={sitios.length + 10}
        f={(i, o) => {
          if (i >= sitios.length) {
            // adenosina que flota sin sitio
            const a = rnd(i) * Math.PI * 2 + t * 0.2;
            const b = 0.1 + rnd(i + 1) * 0.35;
            const h = R + 1.3 + Math.sin(t + i) * 0.3;
            o.position.set(Math.sin(b) * Math.cos(a) * h, Math.cos(b) * h, Math.sin(b) * Math.sin(a) * h);
            o.rotation.set(t * 0.5 + i, t * 0.4, i);
            o.scale.setScalar(0.2 * (modo === 'bloqueo' ? entre(t, marcas.a, marcas.a + 1) : 1));
            return;
          }
          const s = sitios[i];
          v.copy(s).multiplyScalar(R + 0.6);
          if (nuevos[i]) {
            // receptor nuevo: la adenosina llega y encaja
            const ll = entre(t, marcas.b + rnd(i) * 1.5, marcas.b + 1 + rnd(i) * 1.5);
            w.copy(s).multiplyScalar(R + 2.8).add(new THREE.Vector3(rnd(i + 3) - 0.5, 0.4, rnd(i + 4) - 0.5));
            o.position.copy(w.lerp(v, ll));
            o.scale.setScalar(0.2 * brote(i));
          } else if (modo === 'bloqueo') {
            // estaba encajada; sale despedida cuando llega la cafeína
            const fuera = entre(t, marcas.a - 0.3 + rnd(i + 7) * 1.6, marcas.a + 0.6 + rnd(i + 7) * 1.6);
            w.copy(s).multiplyScalar(R + 2.2).add(new THREE.Vector3((rnd(i + 5) - 0.5) * 2.5, 0.8, (rnd(i + 6) - 0.5) * 2.5));
            o.position.copy(v.clone().lerp(w, fuera));
            o.scale.setScalar(0.2);
          } else {
            o.scale.setScalar(0);
          }
          o.rotation.set(t * 0.5 + i, t * 0.3, i);
        }}
      />
      <Particulas t={t} n={600} centro={[0, R + 1, 0]} tam={[7, 3, 7]} size={0.025} op={0.45} color="#d8c8ff" />
    </LienzoCola>
  );
};
export const TomaReceptores: React.FC<PropsToma & {marcas: {a: number; b: number; c: number}}> = (p) => <Neurona {...p} modo="bloqueo" />;
export const TomaTolerancia: React.FC<PropsToma & {marcas: {a: number; b: number; c: number}}> = (p) => <Neurona {...p} modo="tolerancia" />;

/** Tiempo deformado: el latido se acelera (ritmo × `extra`) a partir del instante `a`. */
const acelera = (t: number, a: number, b: number, extra: number) => {
  let tt = 0;
  const n = Math.max(1, Math.ceil(t * 30));
  for (let i = 0; i < n; i++) tt += (1 + extra * entre(((i + 0.5) / n) * t, a, b)) * (t / n);
  return tt;
};

/** El corazón se acelera con la adrenalina. */
export const TomaCorazon: React.FC<PropsToma & {marcas: {adrenalina: number; corazon: number}}> = ({t, d, marcas}) => {
  const tt = acelera(t, marcas.adrenalina, marcas.corazon + 0.6, 0.45);
  const lat = latido(tt);
  const pos = orbita([0, 0.05, 0], 5.4 - (t / d) * 0.9, 0.6 - (t / d) * 0.7, 0.25);
  const mA = useMemo(() => brillo(C_ADRENALINA, 2.4), []);
  const esf = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const adr = entre(t, marcas.adrenalina - 0.4, marcas.adrenalina + 0.8);
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.5} niebla={0.2} post={{bloom: 1.0 + lat * 0.3, bokeh: 3}}>
      <Cam pos={suma(pos, suma(mano(t, 3), [0, lat * 0.004, 0]))} mira={[0, 0, 0]} fov={34} />
      <ambientLight intensity={0.15} color="#ff8a7a" />
      <directionalLight position={[2, 2, 2]} intensity={1.3} color="#ffe0d0" />
      <directionalLight position={[-2, 1, -2]} intensity={1.8} color="#ff3a4a" />
      <pointLight position={[0, 0.2, 0.7]} intensity={0.6 + lat * 1.4} distance={2} color="#ff4a3a" />
      <Corazon t={tt} s={1.15} alerta={adr * 0.35} brillo={1.2} desfase={0} />
      {/* adrenalina que llega por la sangre */}
      <Enjambre
        geo={esf}
        mat={mA}
        n={90}
        f={(i, o) => {
          const f = (t * (0.3 + rnd(i) * 0.2) + rnd(i + 1)) % 1;
          const a = rnd(i + 2) * Math.PI * 2 + f * 2;
          const r = 1.6 * (1 - f) + 0.6;
          o.position.set(Math.cos(a) * r, (rnd(i + 3) - 0.5) * 1.2 * (1 - f), Math.sin(a) * r * 0.8);
          o.scale.setScalar(0.012 * adr * Math.min(1, (1 - f) * 4) * (0.6 + rnd(i + 4) * 0.8));
        }}
      />
      <Particulas t={t} n={600} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.5} color="#ffb0a0" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#ff6a5a" int={0.04} />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 7 */

/** Cinco tazas aparecen una tras otra sobre la mesa; la cafeína sube de todas. */
export const TomaTazas: React.FC<PropsToma & {marcas: {cinco: number; limite: number}}> = ({t, d, marcas}) => {
  const c = ruta(t, [
    {t: 0, pos: [0, 0.6, 0.95], mira: [0, 0.03, 0], fov: 36},
    {t: d, pos: [0.16, 0.42, 0.68], mira: [0, 0.05, 0], fov: 36},
  ]);
  const mats = useMemo(
    () => ({
      mesa: new THREE.MeshPhysicalMaterial({color: '#20160f', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, metalness: 0.1}),
      cafeina: brillo(C_CAFEINA, 2.4),
    }),
    [],
  );
  // cinco tazas en corro (la primera delante, en el centro)
  const tazas: V3[] = [0, 1, 2, 3, 4].map((i) => [Math.sin((i / 5) * Math.PI * 2) * 0.12, 0, Math.cos((i / 5) * Math.PI * 2) * 0.12]);
  const aparece = (i: number) => entre(t, marcas.cinco - 0.3 + i * 0.22, marcas.cinco + 0.1 + i * 0.22);
  const alerta = entre(t, marcas.limite - 0.2, marcas.limite + 0.6);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={0.35} niebla={0.25} fondo="#060302" post={{bokeh: 3, bloom: 0.9}}>
      <Cam pos={suma(c.pos, mano(t, 0.6))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.12} color="#ffb070" />
      <spotLight position={[0.3, 1.2, 0.6]} angle={0.5} penumbra={0.9} intensity={6} distance={3} color="#ffd8b0" />
      <directionalLight position={[-1, 0.8, -1]} intensity={1.6} color="#ff8a3a" />
      <pointLight position={[0, 0.25, 0.2]} intensity={0.3 + alerta * 1.2} distance={1} color={alerta > 0.1 ? '#ff5a3a' : '#ffb060'} />
      <mesh material={mats.mesa} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
      </mesh>
      {tazas.map((p, i) => {
        const k = aparece(i);
        return k > 0.001 ? <Taza key={i} t={t + i} p={[p[0], p[1] + (1 - k) * 0.05, p[2]]} r={[0, 0.5 + i * 0.2, 0]} s={0.07 * (0.6 + 0.4 * k)} plato vapor={k} brillo={alerta * 0.4} /> : null;
      })}
      {/* moléculas de cafeína que suben de las tazas y se acumulan */}
      <Enjambre
        geo={geoCafeina()}
        mat={mats.cafeina}
        n={100}
        f={(i, o) => {
          const j = i % 5;
          const k = aparece(j);
          const f = (t * (0.12 + rnd(i) * 0.08) + rnd(i + 1)) % 1;
          const a = rnd(i + 2) * Math.PI * 2 + t * 0.3;
          o.position.set(tazas[j][0] + Math.cos(a) * f * 0.12, 0.09 + f * 0.32, tazas[j][2] + Math.sin(a) * f * 0.08);
          o.rotation.set(t + i, t * 0.6 + i, 0);
          o.scale.setScalar(0.009 * k * Math.sin(Math.PI * Math.min(1, f * 1.2)));
        }}
      />
      <Particulas t={t} n={500} centro={[0, 0.25, 0]} tam={[1.4, 0.6, 1]} size={0.004} op={0.5} color="#ffc890" />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 15 */

/** Cerebro de noche: ondas lentas de sueño que la cafeína interrumpe. */
export const TomaCerebroNoche: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0, 0], 3.0 - (t / d) * 0.5, 0.8 - (t / d) * 0.5, 0.35);
  const mC = useMemo(() => brillo(C_CAFEINA, 2.2), []);
  const onda = 0.5 + 0.5 * Math.sin(t * 1.6);
  const chispa = Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 3.1)) ** 3;
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.6} niebla={0.18} fondo="#020310" post={{bloom: 1}}>
      <Cam pos={suma(pos, mano(t, 2))} mira={[0, 0, 0]} fov={34} />
      <ambientLight intensity={0.1} color="#3a4aaa" />
      <directionalLight position={[2, 2, 2]} intensity={0.7 + onda * 0.4} color="#8a9aff" />
      <directionalLight position={[-2, 1, -2]} intensity={1.3} color="#3a5aff" />
      <pointLight position={[0, 0.4, 0.8]} intensity={0.3 + chispa * 1.6} distance={2} color={C_CAFEINA} />
      <Cerebro t={t * 0.6} s={1.2} brillo={0.6 + onda * 0.4} chispas={8 + chispa * 20} />
      <Enjambre
        geo={geoCafeina()}
        mat={mC}
        n={30}
        f={(i, o) => {
          const a = rnd(i) * Math.PI * 2 + t * 0.15;
          const b = (rnd(i + 1) - 0.5) * 1.6;
          const r = 0.75 + rnd(i + 2) * 0.35;
          o.position.set(Math.cos(a) * r, b * 0.4, Math.sin(a) * r * 0.85);
          o.rotation.set(t + i, t * 0.5, 0);
          o.scale.setScalar(0.045);
        }}
      />
      <Particulas t={t} n={700} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.45} color="#8a9aff" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#4a6aff" int={0.04} />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 30 */

/** Abstinencia: el cerebro sin su dosis; dolor de cabeza (pulsos rojos), cansancio e irritabilidad. */
export const TomaAbstinencia: React.FC<PropsToma & {marcas: {dolor: number; cansancio: number; irrita: number}}> = ({t, d, marcas}) => {
  const pos = orbita([0, 0, 0], 2.8 - (t / d) * 0.6, -0.4 + (t / d) * 0.7, 0.4);
  const dolor = entre(t, marcas.dolor - 0.3, marcas.dolor + 0.5);
  const pulso = dolor * Math.pow(0.5 + 0.5 * Math.sin(t * 7), 3);
  const cansa = entre(t, marcas.cansancio - 0.2, marcas.cansancio + 0.6);
  const irr = entre(t, marcas.irrita - 0.2, marcas.irrita + 0.4);
  const temblor: V3 = [Math.sin(t * 31) * 0.006 * irr, Math.sin(t * 27 + 1) * 0.006 * irr, 0];
  const mA = useMemo(() => brillo(C_ADENOSINA, 2.2), []);
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.6} niebla={0.16} fondo="#08020a" post={{bloom: 1 + pulso * 0.4, aberracion: 0.002 + irr * 0.003}}>
      <Cam pos={suma(suma(pos, mano(t, 3)), temblor)} mira={[0, 0, 0]} fov={34} />
      <ambientLight intensity={0.14 - cansa * 0.05} color="#8a5aaa" />
      <directionalLight position={[2, 2, 2]} intensity={1.4 - cansa * 0.5} color="#f0d0e0" />
      <directionalLight position={[-2, 1, -2]} intensity={1.5} color="#9a4aff" />
      <pointLight position={[0, 0.55, 0.6]} intensity={0.2 + pulso * 3.5} distance={2} color="#ff2a2a" />
      <pointLight position={[0, 0.6, -0.6]} intensity={pulso * 2.5} distance={2} color="#ff3a2a" />
      <Cerebro t={t} s={1.2} alerta={pulso * 0.9} brillo={1 - cansa * 0.4} chispas={irr * 40} />
      {/* adenosina en exceso: sin cafeína que la frene, todos sus receptores quedan libres */}
      <Enjambre
        geo={geoAdenosina()}
        mat={mA}
        n={50}
        f={(i, o) => {
          const f = (t * 0.25 + rnd(i)) % 1;
          const a = rnd(i + 1) * Math.PI * 2;
          const r0 = 1.4 * (1 - f) + 0.5;
          o.position.set(Math.cos(a) * r0, (rnd(i + 2) - 0.5) * 0.9, Math.sin(a) * r0 * 0.8);
          o.rotation.set(t + i, t * 0.4, 0);
          o.scale.setScalar(0.05 * cansa * Math.min(1, (1 - f) * 4));
        }}
      />
      <Particulas t={t} n={700} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.45} color="#ff9ab0" />
    </LienzoCola>
  );
};

/** Cuerpo completo: nervios (cerebro), palpitaciones (corazón) y acidez (estómago). */
export const TomaCuerpo30: React.FC<PropsToma & {marcas: {nervios: number; palpita: number; acidez: number}}> = ({t, d, marcas}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.85, 1.32, 2.6], mira: [0, 1.42, 0], fov: 34},
    {t: d, pos: [0.3, 1.36, 1.45], mira: [0.02, 1.42, 0], fov: 34},
  ]);
  const on = (k: number) => entre(t, k - 0.3, k + 0.4);
  const nz = on(marcas.nervios);
  const cz = on(marcas.palpita);
  const ez = on(marcas.acidez);
  const giro = 0.18 - t * 0.02;
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={1.0} niebla={0.12} post={{bokeh: 2, bloom: 1.0}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo />
      <CuerpoHombre t={t * (1 + cz * 0.4)} piel={0} holo={0.55} esqueleto={0.4} luzCerebro={nz} luzCorazon={cz} luzEstomago={ez * 2.5} giro={giro} />
      <Anillo p={rotY([0, 1.69, 0.04], giro)} cam={c.pos} color="#c8a0ff" on={nz} r={0.11} t={t} />
      <Anillo p={rotY([0.022, 1.3, 0.08], giro)} cam={c.pos} color="#ff4a4a" on={cz} r={0.07} t={t} />
      <Anillo p={rotY([0.06, 1.13, 0.08], giro)} cam={c.pos} color="#ffb040" on={ez} r={0.075} t={t} />
      <Suelo />
      <Particulas t={t} n={900} centro={[0, 1.1, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.5} color="#ffc8b0" />
    </LienzoCola>
  );
};

/* =================================================================== FINAL */

/** Deja la taza en la mesa; luz cálida de mañana y la cámara se aleja despacio. */
export const TomaFinal: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.95, 0.98, 1.25], mira: [0.4, 0.84, 0.2], fov: 34},
    {t: 6.5, pos: [0.85, 1.02, 1.75], mira: [0.32, 0.9, 0.15], fov: 34},
    {t: d, pos: [0.3, 1.02, 4.1], mira: [0.14, 0.96, 0.05], fov: 34},
  ]);
  const kb = entre(t, 0.6, 2.8);
  const bA = enManoTaza();
  const bB: V3 = [MESA.p[0] + 0.02, MESA.alto, MESA.p[2] + 0.02];
  const bP = lerp3(bA, bB, kb);
  bP[1] += Math.sin(kb * Math.PI) * 0.05;
  const piel = 0.15 + entre(t, 6, d * 0.85) * 0.45;
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={t < 6 ? 0.35 : 1.5} niebla={0.1} post={{bokeh: 2}}>
      <Cam pos={suma(c.pos, mano(t, 0.8))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo piel={piel} calido={1} />
      <pointLight position={[MESA.p[0], MESA.alto + 0.4, MESA.p[2] + 0.3]} intensity={0.8} distance={1.4} color="#ffd8a0" />
      <CuerpoHombre t={t} piel={piel} holo={0.75 - piel * 0.4} esqueleto={0.3} vasos={0.8} organos={1 - piel * 0.5} giro={0.05} />
      <Taza t={t} p={bP} r={[0, -0.3 + kb * 0.6, 0]} s={TAZA_ALTO} vapor={1 - kb * 0.5} />
      <Mesa />
      <Suelo color="#ffb050" />
      <Particulas t={t} n={900} centro={[0.1, 1.1, 0]} tam={[3.5, 2.8, 3.5]} size={0.012} op={0.5} color="#ffe0b0" />
      <Haz p={[0, 2.8, -0.4]} r={[0.25, 0, 0]} largo={3.4} ancho={1.3} color="#ffb060" int={0.06} />
    </LienzoCola>
  );
};
