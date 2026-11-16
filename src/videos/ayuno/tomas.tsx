import React, {useMemo} from 'react';
import * as THREE from 'three';
import {
  fusionar,
  geoAcidoGraso,
  geoAgua,
  geoAminoacido,
  geoCetona,
  geoCrestas,
  geoFibra,
  geoGlobuloRojo,
  geoGlucogeno,
  geoGlucosa,
  geoMitocondria,
  geoNeurona,
  ruido3,
  tuboVariable,
} from './anatomia';
import {
  Cam,
  Cerebro,
  Corazon,
  CuerpoAnatomico,
  Enjambre,
  entre,
  Estomago,
  Haz,
  Higado,
  Lienzo,
  mano,
  orbita,
  Particulas,
  rnd,
  Rinones,
  ruta,
  suma,
  V3,
} from './escena';
import {animarMat, matOrgano} from './shaders';

/**
 * Las tomas del vídeo. Cada una recibe `t` (segundos desde que empieza) y `d` (lo que dura,
 * incluido el solape de la transición) y monta su propio lienzo 3D con su iluminación.
 */
export type PropsToma = {t: number; d: number};

const memo = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};
const brillo = (c: string, i = 2) => new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: i, roughness: 0.3, toneMapped: false});

/* =================================================================== cuerpo */

const LucesCuerpo: React.FC<{alerta?: number; frio?: number; piel?: number}> = ({alerta = 0, frio = 1, piel = 0}) => (
  <>
    <ambientLight intensity={0.08} color="#4a6aaa" />
    <directionalLight position={[-2, 3, -3]} intensity={1.6 * frio} color="#5ab0ff" />
    <directionalLight position={[2.5, 2, -2]} intensity={1.1 * frio} color="#8a6aff" />
    <directionalLight position={[1, 2, 3]} intensity={0.55 + piel * 0.5} color="#ffe2cc" />
    <pointLight position={[0.05, 1.32, 0.2]} intensity={(0.12 + alerta * 0.4) * (1 - piel)} distance={0.5} color="#ff4a3a" />
    <pointLight position={[0, 1.72, 0.2]} intensity={0.08 * (1 - piel)} distance={0.4} color="#b88aff" />
    <pointLight position={[-0.05, 1.12, 0.2]} intensity={0.08 * (1 - piel)} distance={0.4} color="#ffb060" />
  </>
);

/** Introducción: cuerpo suspendido, la piel se vuelve transparente y la cámara recorre los órganos. */
export const CuerpoIntro: React.FC<PropsToma> = ({t}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.0, 1.05, 3.6], mira: [0, 0.98, 0], fov: 34},
    {t: 4.4, pos: [0.25, 1.1, 2.4], mira: [0, 1.05, 0], fov: 34},
    {t: 6.0, pos: [0.12, 1.32, 0.55], mira: [0.02, 1.3, 0], fov: 32},
    {t: 7.6, pos: [-0.12, 1.34, 0.42], mira: [0.0, 1.32, 0.02], fov: 32},
    {t: 9.0, pos: [0.06, 1.66, 0.42], mira: [0, 1.68, 0], fov: 32},
    {t: 10.4, pos: [0.14, 1.16, 0.36], mira: [0.06, 1.13, 0.03], fov: 32},
    {t: 12, pos: [0.08, 1.14, 0.2], mira: [0.06, 1.13, 0.03], fov: 30},
  ]);
  const piel = 1 - entre(t, 1.4, 4.6);
  const holo = entre(t, 1.6, 4.6) * 0.85;
  const foco = Math.hypot(c.pos[0] - c.mira[0], c.pos[1] - c.mira[1], c.pos[2] - c.mira[2]);
  return (
    <Lienzo foco={foco} rango={t < 5 ? 2 : 0.18} niebla={0.12} post={{bokeh: t < 5 ? 1.5 : 3.5}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo piel={piel} />
      <CuerpoAnatomico t={t} piel={piel} holo={holo} esqueleto={entre(t, 2, 5)} vasos={entre(t, 2.5, 5)} giro={-0.35 + t * 0.045 - entre(t, 4.4, 6) * 0.2} />
      <Particulas t={t} n={900} centro={[0, 1.1, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.55} />
      <Haz p={[0, 2.6, -0.6]} r={[0.35, 0, 0]} largo={3.2} ancho={1.1} color="#3a8aff" int={0.05} />
    </Lienzo>
  );
};

/** Cuerpo con músculos y grasa visibles (días 4-5). */
export const CuerpoMusculos: React.FC<PropsToma> = ({t, d}) => {
  const ang = -0.6 + (t / d) * 1.1;
  const r = 2.3 - (t / d) * 0.5;
  const pos = orbita([0, 1.0, 0], r, ang, 0.25 + (t / d) * 0.1);
  return (
    <Lienzo foco={r} rango={1.2} niebla={0.12} post={{bokeh: 2}}>
      <Cam pos={suma(pos, mano(t))} mira={[0, 1.08, 0]} fov={36} />
      <LucesCuerpo />
      <CuerpoAnatomico t={t} piel={0} holo={0.35} musculos={1} perdida={entre(t, 1, d)} grasa={0.55 * (1 - entre(t, 0.5, d) * 0.6)} esqueleto={0.4} />
      <Particulas t={t} n={700} centro={[0, 1.1, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.5} color="#ffb8a0" />
    </Lienzo>
  );
};

/** Recorrido final de alerta por la anatomía completa (días 6-7). */
export const CuerpoRecorrido: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.5, 1.5, 0.9], mira: [0, 1.25, 0], fov: 34},
    {t: d, pos: [-0.6, 1.1, 1.6], mira: [0, 1.0, 0], fov: 36},
  ]);
  const alerta = 0.35 + 0.35 * Math.max(0, Math.sin(t * 4));
  return (
    <Lienzo foco={1.3} rango={0.8} niebla={0.14} post={{bloom: 1.1}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo alerta={alerta} frio={0.8} />
      <CuerpoAnatomico t={t} piel={0} holo={0.4} musculos={0.7} perdida={0.8} grasa={0.15} esqueleto={0.5} alerta={alerta} />
      <Particulas t={t} n={700} centro={[0, 1.1, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.5} color="#ff9a8a" />
    </Lienzo>
  );
};

/** Cierre: la cámara se aleja hasta la silueta completa; los órganos siguen visibles. */
export const CuerpoCierre: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.05, 1.32, 0.6], mira: [0.02, 1.3, 0], fov: 32},
    {t: d * 0.75, pos: [0, 1.0, 3.9], mira: [0, 0.95, 0], fov: 34},
    {t: d, pos: [0, 1.0, 4.4], mira: [0, 0.95, 0], fov: 34},
  ]);
  const organos = 1 - entre(t, d * 0.55, d * 0.85) * 0.6;
  const foco = Math.hypot(c.pos[0] - c.mira[0], c.pos[1] - c.mira[1], c.pos[2] - c.mira[2]);
  return (
    <Lienzo foco={foco} rango={1.5} niebla={0.1} post={{bokeh: 1.5}}>
      <Cam pos={suma(c.pos, mano(t, 0.6))} mira={c.mira} fov={c.fov} />
      <LucesCuerpo />
      <group>
        <CuerpoAnatomico t={t} piel={entre(t, d * 0.6, d * 0.95) * 0.35} holo={0.85} esqueleto={0.35 * organos} vasos={organos} organos={organos} giro={0.25 - t * 0.03} />
      </group>
      <Particulas t={t} n={900} centro={[0, 1.1, 0]} tam={[3.5, 2.8, 3.5]} size={0.012} op={0.55} />
      <Haz p={[0, 2.8, -0.4]} r={[0.25, 0, 0]} largo={3.4} ancho={1.3} color="#3a8aff" int={0.06} />
    </Lienzo>
  );
};

/* =================================================================== órganos aislados */

/** Fondo de quirófano virtual: partículas, haz de luz y niebla. */
const Ambiente: React.FC<{t: number; color: string; n?: number}> = ({t, color, n = 700}) => (
  <>
    <Particulas t={t} n={n} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.5} color={color} />
    <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color={color} int={0.045} />
  </>
);

/** Día 1: la cámara entra en el estómago vacío. */
export const TomaEstomago: React.FC<PropsToma> = ({t}) => {
  // de fuera hacia dentro del fondo gástrico, atravesando la pared
  const c = ruta(t, [
    {t: 0, pos: [0.9, 0.35, 3.6], mira: [-0.05, 0.05, 0], fov: 34},
    {t: 2.6, pos: [-0.4, 0.2, 2.4], mira: [-0.05, 0.05, 0], fov: 34},
    {t: 5, pos: [-0.75, 0.05, 1.35], mira: [-0.12, 0.0, 0.0], fov: 34},
  ]);
  const dentro = false;
  return (
    <Lienzo foco={dentro ? 0.2 : Math.max(0.3, Math.hypot(c.pos[0], c.pos[1] - 0.2, c.pos[2]))} rango={dentro ? 2 : 0.6} niebla={dentro ? 0.35 : 0.25} fondo={dentro ? '#0c0202' : '#02050c'} post={{bloom: dentro ? 0.5 : 0.75, umbral: 0.85, bokeh: dentro ? 1.2 : 3}}>
      <Cam pos={suma(c.pos, mano(t, 2))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={dentro ? 0.02 : 0.1} color="#ffb080" />
      <directionalLight position={[2, 2, 2]} intensity={dentro ? 0 : 1.3} color="#ffd2a8" />
      <directionalLight position={[-2, 1, -2]} intensity={dentro ? 0 : 1.8} color="#ff8a40" />
      <pointLight position={c.pos} intensity={dentro ? 0.4 : 0} distance={1} decay={1.2} color="#ffc8a0" />
      <pointLight position={[0.05, -0.15, 0.04]} intensity={dentro ? 0.25 : 0} distance={0.6} decay={1.2} color="#ff7a4a" />
      <Estomago t={t} s={1.0} />
      {dentro ? <Particulas t={t} n={300} centro={[0.05, 0.1, 0.03]} tam={[0.3, 0.4, 0.2]} size={0.004} op={0.5} color="#ffd8b0" vel={0.02} /> : <Ambiente t={t} color="#ffb070" />}
    </Lienzo>
  );
};

/** Día 1: hígado usando sus reservas de glucógeno (gránulos dorados que se convierten en glucosa). */
export const TomaHigado: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0, 0], 2.3 - (t / d) * 0.5, -0.5 + (t / d) * 0.7, 0.4);
  const mat = useMemo(() => brillo('#ffcc4a', 2.5), []);
  const matG = useMemo(() => brillo('#bff4ff', 2.2), []);
  return (
    <Lienzo foco={Math.hypot(...pos)} rango={0.6}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0.02, 0]} fov={34} />
      <ambientLight intensity={0.18} color="#ff9a6a" />
      <directionalLight position={[2, 2, 1.5]} intensity={1.24} color="#ffd8b0" />
      <directionalLight position={[-2, 1, -2]} intensity={1.61} color="#ffaa3a" />
      <Higado t={t} s={0.9} borde="#ffb84a" op={0.72} />
      {/* gránulos de glucógeno bajo la superficie, cada vez más tenues */}
      <Enjambre
        geo={geoGlucogeno()}
        mat={mat}
        n={40}
        f={(i, o) => {
          const a = rnd(i) * Math.PI * 2;
          o.position.set(Math.cos(a) * (0.3 + rnd(i + 1) * 0.5) - 0.1, 0.05 + (rnd(i + 2) - 0.5) * 0.25, Math.sin(a) * 0.35 + 0.1);
          o.scale.setScalar(0.06 * (1 - entre(t, 0.5, d) * 0.6));
        }}
      />
      {/* glucosa que sale hacia la sangre */}
      <Enjambre
        geo={geoGlucosa()}
        mat={matG}
        n={36}
        f={(i, o) => {
          const f = ((t * 0.25 + rnd(i)) % 1);
          o.position.set(-0.2 + rnd(i + 3) * 0.6 + f * 0.3, 0.1 + f * 1.2, 0.2 + (rnd(i + 4) - 0.5) * 0.4);
          o.rotation.set(t * (1 + rnd(i)), t * 0.7 + i, 0);
          o.scale.setScalar(0.035 * Math.sin(f * Math.PI));
        }}
      />
      <Ambiente t={t} color="#ffc070" />
    </Lienzo>
  );
};

/** Días 3 y 6-7: el corazón late. */
export const TomaCorazon: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0.05, 0], 3.4 - (t / d) * 0.6, 0.6 - (t / d) * 0.9, 0.2);
  const alerta = 0.3 + 0.3 * Math.max(0, Math.sin(t * 3.4));
  return (
    <Lienzo foco={Math.hypot(...pos)} rango={0.6} post={{bloom: 1.1}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0.1, 0]} fov={34} />
      <ambientLight intensity={0.15} color="#ff6a5a" />
      <directionalLight position={[2, 2, 2]} intensity={1.36} color="#ffd0c0" />
      <directionalLight position={[-2, 1, -2]} intensity={1.86} color="#ff3a2a" />
      <pointLight position={[0, 0, 0.9]} intensity={1.2} distance={2.2} color="#ff6a5a" />
      <Corazon t={t} s={1.15} alerta={alerta} desfase={0.4} />
      <Ambiente t={t} color="#ff7a6a" />
    </Lienzo>
  );
};

/** Días 6-7: riñones regulando líquidos y electrolitos. */
export const TomaRinones: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0, 0], 2.6 - (t / d) * 0.4, -0.4 + (t / d) * 0.6, 0.25);
  const alerta = 0.25 + 0.25 * Math.max(0, Math.sin(t * 3));
  const mAgua = useMemo(() => brillo('#6ad8ff', 1.8), []);
  return (
    <Lienzo foco={Math.hypot(...pos)} rango={0.7}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0, 0]} fov={36} />
      <ambientLight intensity={0.2} color="#ffb060" />
      <directionalLight position={[2, 2, 2]} intensity={1.24} color="#ffe0c0" />
      <directionalLight position={[-2, 1, -2]} intensity={1.74} color="#ff9a2a" />
      <Rinones t={t} s={0.62} alerta={alerta} />
      <Enjambre
        geo={geoAgua()}
        mat={mAgua}
        n={70}
        f={(i, o) => {
          const f = (t * 0.2 + rnd(i)) % 1;
          o.position.set((rnd(i + 1) - 0.5) * 1.0, 0.6 - f * 1.2, (rnd(i + 2) - 0.5) * 0.6);
          o.rotation.set(t + i, t * 0.5, 0);
          o.scale.setScalar(0.05 * Math.sin(f * Math.PI) * (1 - entre(t, 0, d) * 0.4));
        }}
      />
      <Ambiente t={t} color="#ffb060" />
    </Lienzo>
  );
};

/** Día 3: cerebro usando cuerpos cetónicos (llegan como partículas verdes y se encienden). */
export const TomaCerebro: React.FC<PropsToma & {alerta?: boolean}> = ({t, d, alerta}) => {
  const pos = orbita([0, 0, 0], 3.3 - (t / d) * 0.5, (alerta ? 0.9 : -0.8) + (t / d) * (alerta ? -0.5 : 0.7), 0.5);
  const mK = useMemo(() => brillo('#5affb8', 2.4), []);
  const parpadeo = alerta ? 0.55 + 0.45 * Math.abs(Math.sin(t * 7) * Math.sin(t * 2.3)) : 1;
  const al = alerta ? 0.35 + 0.3 * Math.max(0, Math.sin(t * 3)) : 0;
  return (
    <Lienzo foco={Math.hypot(...pos)} rango={0.6} post={{bloom: 1}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0, 0]} fov={34} />
      <ambientLight intensity={0.15} color="#8a6aff" />
      <directionalLight position={[2, 2, 2]} intensity={1.8 * parpadeo} color="#f0d8ff" />
      <directionalLight position={[-2, 1, -2]} intensity={1.86} color="#9a5aff" />
      <pointLight position={[0, 0.5, 0.8]} intensity={0.8} distance={2} color="#c89aff" />
      <Cerebro t={t} s={1.2} brillo={parpadeo} chispas={alerta ? 10 : 40} alerta={al} />
      {!alerta && (
        <Enjambre
          geo={geoCetona()}
          mat={mK}
          n={60}
          f={(i, o) => {
            const f = (t * 0.3 + rnd(i)) % 1;
            const a = rnd(i + 1) * Math.PI * 2;
            const r0 = 1.4 * (1 - f) + 0.45;
            o.position.set(Math.cos(a) * r0, -0.9 + f * 0.9 + (rnd(i + 2) - 0.5) * 0.3, Math.sin(a) * r0 * 0.8);
            o.rotation.set(t * 2 + i, t, 0);
            o.scale.setScalar(0.045 * Math.min(1, (1 - f) * 4));
          }}
        />
      )}
      <Ambiente t={t} color={alerta ? '#ff8aaa' : '#b08aff'} />
    </Lienzo>
  );
};

/** Día 3: el hígado (con luz verde-azulada) antes de entrar en sus mitocondrias. */
export const TomaHigadoCetonas: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [-1.2, 0.6, 2.4], mira: [0, 0, 0], fov: 34},
    {t: d, pos: [-0.35, 0.25, 1.0], mira: [-0.1, 0.05, 0], fov: 32},
  ]);
  return (
    <Lienzo foco={Math.hypot(c.pos[0] - c.mira[0], c.pos[1] - c.mira[1], c.pos[2] - c.mira[2])} rango={0.4}>
      <Cam pos={suma(c.pos, mano(t, 3))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.18} color="#5affc8" />
      <directionalLight position={[2, 2, 2]} intensity={1.12} color="#e0fff4" />
      <directionalLight position={[-2, 1, -2]} intensity={1.74} color="#2affb0" />
      <Higado t={t} s={0.9} borde="#5affc0" />
      <pointLight position={[-0.5, 0.6, 1.2]} intensity={1.2} distance={3} decay={1.2} color="#c8fff0" />
      <Ambiente t={t} color="#6affd0" />
    </Lienzo>
  );
};

/* =================================================================== microscópico */

/** Interior de un vaso sanguíneo con glóbulos rojos y moléculas que viajan. */
const TunelVaso: React.FC<PropsToma & {molecula: 'glucosa' | 'grasa'; color: string}> = ({t, molecula, color}) => {
  const {geo, curva} = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 16; i++) pts.push([Math.sin(i * 0.7) * 2.2, Math.cos(i * 0.5) * 1.4, -i * 5]);
    return tuboVariable(pts, (u) => 1.25 + Math.sin(u * 40) * 0.05, 400, 48);
  }, []);
  const pared = useMemo(() => {
    const m = matOrgano({color: '#6a0a12', color2: '#c0303a', vasos: '#ff6a5a', vasosEsc: 1.2, motas: 0.8, borde: '#ff4a3a', bordeInt: 0.5, rug: 0.3, barniz: 1, opacidad: 0.85});
    m.side = THREE.BackSide;
    return m;
  }, []);
  animarMat(pared, t);
  const mRojo = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#b0101a', roughness: 0.35, clearcoat: 0.8, sheen: 0.6, sheenColor: new THREE.Color('#ff6a5a'), emissive: '#3a0004'}), []);
  const mMol = useMemo(() => brillo(color, 2.4), [color]);
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
  return (
    <Lienzo foco={1.2} rango={1.0} niebla={0.09} fondo="#1a0204" post={{bloom: 1.1, aberracion: 0.0025}}>
      <Cam pos={[cp.x, cp.y, cp.z]} mira={[ca.x, ca.y, ca.z]} fov={58} rollo={Math.sin(t * 0.4) * 0.08} />
      <ambientLight intensity={0.25} color="#ff6a5a" />
      <pointLight position={[cp.x, cp.y + 0.3, cp.z]} intensity={3.72} distance={9} color="#ffd0b8" />
      <pointLight position={[ca.x, ca.y, ca.z - 4]} intensity={4.96} distance={10} color={color} />
      <mesh geometry={geo} material={pared} />
      <Enjambre
        geo={geoGlobuloRojo()}
        mat={mRojo}
        n={260}
        f={(i, o) => {
          const u = (((rnd(i) + (t * 2.4) / L) % 1) + 1) % 1;
          situar(u, rnd(i + 1) * Math.PI * 2, 0.15 + rnd(i + 2) * 0.85, o);
          o.rotation.set(t * (0.5 + rnd(i + 3)) + i, t * 0.3 + i * 2, rnd(i) * 3);
          o.scale.setScalar(0.42 + rnd(i + 4) * 0.08);
        }}
      />
      <Enjambre
        geo={molecula === 'glucosa' ? geoGlucosa() : geoAcidoGraso()}
        mat={mMol}
        n={molecula === 'glucosa' ? 70 : 55}
        f={(i, o) => {
          const u = (((rnd(i + 50) + (t * 2.0) / L) % 1) + 1) % 1;
          situar(u, rnd(i + 51) * Math.PI * 2, 0.1 + rnd(i + 52) * 0.75, o);
          o.rotation.set(t * (0.8 + rnd(i)) + i, t * 0.6 + i, t * 0.3);
          o.scale.setScalar(molecula === 'glucosa' ? 0.13 : 0.1);
        }}
      />
      <Particulas t={t} n={600} centro={[cp.x, cp.y, cp.z - 4]} tam={[3, 3, 10]} size={0.03} op={0.5} color="#ffb8a0" vel={0.03} />
    </Lienzo>
  );
};
export const VasoGlucosa: React.FC<PropsToma> = (p) => <TunelVaso {...p} molecula="glucosa" color="#9af0ff" />;
export const VasoGrasa: React.FC<PropsToma> = (p) => <TunelVaso {...p} molecula="grasa" color="#ffd04a" />;

const geoCelula = memo(() => {
  const g = new THREE.SphereGeometry(0.5, 64, 48);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // forma poliédrica blanda, como células apretadas
    const k = 1 + ruido3(v.x * 3, v.y * 3, v.z * 3) * 0.12 - Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)) * 0.0;
    const caja = Math.max(Math.abs(v.x), Math.abs(v.y) * 1.1, Math.abs(v.z)) * 2;
    v.multiplyScalar(k * (0.75 + 0.25 / Math.max(0.7, caja)));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
});

/** Día 2: células del hígado vaciando sus reservas de glucógeno. */
export const TomaHepatocitos: React.FC<PropsToma> = ({t, d}) => {
  const mats = useMemo(
    () => ({
      membrana: matOrgano({color: '#c86a6a', color2: '#e89a8a', motas: 3, borde: '#ffb0a0', bordeInt: 1.1, rug: 0.35, barniz: 0.8, opacidad: 0.42, ondula: 0.02}),
      nucleo: matOrgano({color: '#5a2a8a', color2: '#8a4ab8', motas: 6, borde: '#c08aff', bordeInt: 0.8, rug: 0.4}),
      glucogeno: brillo('#ffc84a', 2.4),
      glucosa: brillo('#9af0ff', 2.2),
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
  const queda = 1 - entre(t, 0.3, d) * 0.8;
  const c = ruta(t, [
    {t: 0, pos: [0.8, 0.4, 2.8], mira: [0, 0, 0], fov: 36},
    {t: d, pos: [-0.3, 0.1, 1.6], mira: [-0.2, 0, 0], fov: 36},
  ]);
  return (
    <Lienzo foco={1.8} rango={0.9} niebla={0.15} fondo="#08030a" post={{aberracion: 0.002}}>
      <Cam pos={suma(c.pos, mano(t, 10))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.2} color="#ff9a8a" />
      <directionalLight position={[2, 2, 3]} intensity={0.99} color="#ffe0d0" />
      <directionalLight position={[-2, 1, -2]} intensity={1.55} color="#ff6a8a" />
      {celdas.map((p, i) => (
        <group key={i} position={p} scale={[1, 0.9, 0.8]}>
          <mesh geometry={geoCelula()} material={mats.membrana} />
          <mesh material={mats.nucleo} position={[0.08, 0.05, 0]} scale={0.14}>
            <sphereGeometry args={[1, 32, 24]} />
          </mesh>
        </group>
      ))}
      <Enjambre
        geo={geoGlucogeno()}
        mat={mats.glucogeno}
        n={celdas.length * 4}
        f={(i, o) => {
          const p = celdas[Math.floor(i / 4)];
          const k = i % 4;
          o.position.set(p[0] - 0.18 + (k % 2) * 0.32, p[1] - 0.15 + Math.floor(k / 2) * 0.25, p[2] + 0.12);
          o.rotation.set(t * 0.3 + i, t * 0.2, 0);
          o.scale.setScalar(0.12 * queda * (0.7 + rnd(i) * 0.5));
        }}
      />
      <Enjambre
        geo={geoGlucosa()}
        mat={mats.glucosa}
        n={50}
        f={(i, o) => {
          const p = celdas[i % celdas.length];
          const f = (t * 0.35 + rnd(i)) % 1;
          o.position.set(p[0] + (rnd(i + 1) - 0.5) * 0.4, p[1] + f * 0.9, p[2] + 0.3 + f * 0.6);
          o.rotation.set(t + i, t * 0.6, 0);
          o.scale.setScalar(0.06 * Math.sin(f * Math.PI) * (0.4 + queda * 0.6));
        }}
      />
      <Particulas t={t} n={500} tam={[5, 4, 4]} size={0.02} op={0.45} color="#ffb8c8" />
    </Lienzo>
  );
};

/** Día 2: células de grasa liberando ácidos grasos a un capilar. */
export const TomaAdipocitos: React.FC<PropsToma> = ({t, d}) => {
  const mats = useMemo(
    () => ({
      grasa: matOrgano({color: '#e8b840', color2: '#ffe08a', motas: 2, borde: '#ffd060', bordeInt: 1.3, rug: 0.15, barniz: 1, opacidad: 0.6, ondula: 0.015}),
      nucleo: matOrgano({color: '#6a3a8a', color2: '#9a5ab8', motas: 5, borde: '#c89aff', bordeInt: 0.6}),
      capilar: (() => {
        const m = matOrgano({color: '#a01a24', color2: '#e04a4a', motas: 2, borde: '#ff6a5a', bordeInt: 0.9, opacidad: 0.55, rug: 0.3});
        m.side = THREE.DoubleSide;
        return m;
      })(),
      acido: brillo('#ffe070', 2),
    }),
    [],
  );
  animarMat(mats.grasa, t);
  animarMat(mats.nucleo, t);
  animarMat(mats.capilar, t);
  const celdas = useMemo(() => {
    const r: V3[] = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) r.push([(j - 1.5) * 1.5 + (i % 2) * 0.75, (i - 1) * 1.3 + 0.3, -0.6 + (rnd(i * 4 + j) - 0.5) * 0.4]);
    return r;
  }, []);
  const enc = 1 - entre(t, 0.2, d) * 0.07;
  const capilar = useMemo(() => tuboVariable([[-4, -1.3, 0.6], [-1, -1.1, 0.8], [1, -1.4, 0.7], [4, -1.2, 0.5]], () => 0.32, 80, 24), []);
  const c = ruta(t, [
    {t: 0, pos: [-1.2, 0.2, 3.6], mira: [0, -0.2, 0], fov: 38},
    {t: d, pos: [0.9, -0.5, 2.6], mira: [0.3, -0.7, 0.3], fov: 38},
  ]);
  return (
    <Lienzo foco={2.6} rango={1.2} niebla={0.12} fondo="#0a0702" post={{aberracion: 0.002}}>
      <Cam pos={suma(c.pos, mano(t, 10))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.25} color="#ffcc6a" />
      <directionalLight position={[2, 3, 3]} intensity={1.12} color="#fff0d0" />
      <directionalLight position={[-3, 1, -2]} intensity={1.61} color="#ffaa2a" />
      {celdas.map((p, i) => (
        <group key={i} position={p} scale={[1.45 * enc, 1.3 * enc, 1.2 * enc]}>
          <mesh geometry={geoCelula()} material={mats.grasa} />
          <mesh material={mats.nucleo} position={[0.38, 0.12, 0.1]} scale={[0.05, 0.1, 0.1]}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
        </group>
      ))}
      <mesh geometry={capilar.geo} material={mats.capilar} />
      <Enjambre
        geo={geoAcidoGraso()}
        mat={mats.acido}
        n={60}
        f={(i, o) => {
          const p = celdas[i % celdas.length];
          const f = (t * 0.3 + rnd(i)) % 1;
          const dest = capilar.curva.getPointAt((rnd(i + 3) + t * 0.05) % 1);
          o.position.set(p[0] + (dest.x - p[0]) * f, p[1] + (dest.y - p[1]) * f, p[2] + 0.6 + (dest.z - p[2] - 0.6) * f);
          o.rotation.set(t + i, t * 0.5 + i, t * 0.2);
          o.scale.setScalar(0.07 * Math.sin(f * Math.PI));
        }}
      />
      <Particulas t={t} n={500} tam={[7, 5, 5]} size={0.025} op={0.45} color="#ffe0a0" />
    </Lienzo>
  );
};

/** Día 3: mitocondrias del hígado fabricando cuerpos cetónicos. */
export const TomaMitocondria: React.FC<PropsToma> = ({t, d}) => {
  const mats = useMemo(
    () => ({
      membrana: matOrgano({color: '#d86a3a', color2: '#ffa060', motas: 3, borde: '#ffb070', bordeInt: 1.2, rug: 0.3, barniz: 1, opacidad: 0.5, ondula: 0.01}),
      crestas: matOrgano({color: '#ff8a4a', color2: '#ffc080', motas: 4, borde: '#ffd0a0', bordeInt: 0.8}),
      cetona: brillo('#5affb8', 2.6),
    }),
    [],
  );
  animarMat(mats.membrana, t);
  animarMat(mats.crestas, t);
  const mitos: {p: V3; r: V3}[] = [
    {p: [0, 0, 0], r: [0.2, 0, 1.2]},
    {p: [-1.4, 0.8, -1], r: [0.5, 0.3, 0.4]},
    {p: [1.5, -0.6, -0.8], r: [-0.3, 0.5, -0.8]},
    {p: [1.1, 1.3, -2], r: [0.8, 0, 0.3]},
    {p: [-1.2, -1.3, -1.6], r: [0.1, 0.4, 1.6]},
  ];
  const pos = orbita([0, 0, 0], 3 - (t / d) * 0.8, 0.5 - (t / d) * 0.8, 0.4);
  return (
    <Lienzo foco={Math.hypot(...pos)} rango={1.2} niebla={0.1} fondo="#0a0402" post={{aberracion: 0.002}}>
      <Cam pos={suma(pos, mano(t, 10))} mira={[0, 0, 0]} fov={38} />
      <ambientLight intensity={0.25} color="#ff9a5a" />
      <directionalLight position={[2, 2, 3]} intensity={0.99} color="#fff0e0" />
      <directionalLight position={[-3, 1, -2]} intensity={1.49} color="#ff7a2a" />
      <pointLight position={[0, 0, 1.5]} intensity={1.2} distance={4} color="#5affb8" />
      {mitos.map((m, i) => (
        <group key={i} position={m.p} rotation={[m.r[0] + Math.sin(t * 0.5 + i) * 0.05, m.r[1] + t * 0.08, m.r[2]]} scale={0.8 + (i === 0 ? 0.3 : 0)}>
          <mesh geometry={geoMitocondria()} material={mats.membrana} />
          <mesh geometry={geoCrestas()} material={mats.crestas} />
        </group>
      ))}
      <Enjambre
        geo={geoCetona()}
        mat={mats.cetona}
        n={90}
        f={(i, o) => {
          const m = mitos[i % mitos.length];
          const f = (t * 0.35 + rnd(i)) % 1;
          const dir = new THREE.Vector3(rnd(i + 1) - 0.5, rnd(i + 2) - 0.5, rnd(i + 3) - 0.3).normalize();
          o.position.set(m.p[0] + dir.x * f * 2.2, m.p[1] + dir.y * f * 2.2, m.p[2] + dir.z * f * 2.2);
          o.rotation.set(t * 2 + i, t + i, 0);
          o.scale.setScalar(0.11 * Math.sin(Math.min(1, f * 1.3) * Math.PI));
        }}
      />
      <Particulas t={t} n={500} tam={[6, 5, 5]} size={0.025} op={0.45} color="#ffc8a0" />
    </Lienzo>
  );
};

/** Día 3: neuronas que reciben cuerpos cetónicos como combustible. */
export const TomaNeuronas: React.FC<PropsToma> = ({t, d}) => {
  const neuronas = useMemo(
    () =>
      [
        [0, 0, 0],
        [-1.6, 0.9, -1.2],
        [1.7, 0.6, -1.0],
        [-0.9, -1.3, -0.8],
        [1.2, -1.2, -1.6],
        [0.3, 1.6, -2.2],
      ].map((p, i) => ({p: p as V3, geo: geoNeurona(i + 1)})),
    [],
  );
  const mats = useMemo(
    () => ({
      neurona: matOrgano({color: '#5a3aa8', color2: '#8a6ae8', motas: 3, borde: '#c8aaff', bordeInt: 1.3, rug: 0.35, barniz: 0.8, emisivo: '#1a0a3a'}),
      impulso: brillo('#e8d8ff', 4),
      cetona: brillo('#5affb8', 2.6),
    }),
    [],
  );
  animarMat(mats.neurona, t, 0.3 + 0.5 * Math.max(0, Math.sin(t * 5)));
  const pos = orbita([0, 0, -0.5], 3.2 - (t / d) * 0.9, -0.4 + (t / d) * 0.6, 0.3);
  return (
    <Lienzo foco={Math.hypot(pos[0], pos[1], pos[2] + 0.5)} rango={1.2} niebla={0.12} fondo="#04030c" post={{bloom: 1.2, aberracion: 0.002}}>
      <Cam pos={suma(pos, mano(t, 10))} mira={[0, 0, -0.5]} fov={38} />
      <ambientLight intensity={0.2} color="#8a7aff" />
      <directionalLight position={[2, 2, 3]} intensity={0.87} color="#e8e0ff" />
      <directionalLight position={[-3, 1, -2]} intensity={1.49} color="#7a4aff" />
      {neuronas.map((n, i) => (
        <mesh key={i} geometry={n.geo} material={mats.neurona} position={n.p} rotation={[i, i * 2, 0]} />
      ))}
      {/* impulsos eléctricos entre neuronas */}
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(0.035, 10, 8), [])}
        mat={mats.impulso}
        n={40}
        f={(i, o) => {
          const a = neuronas[i % neuronas.length].p;
          const b = neuronas[(i * 3 + 1) % neuronas.length].p;
          const f = (t * (0.6 + rnd(i)) + rnd(i + 5)) % 1;
          o.position.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + Math.sin(f * Math.PI) * 0.2, a[2] + (b[2] - a[2]) * f);
          o.scale.setScalar(Math.sin(f * Math.PI));
        }}
      />
      {/* cuerpos cetónicos que llegan y se absorben */}
      <Enjambre
        geo={geoCetona()}
        mat={mats.cetona}
        n={70}
        f={(i, o) => {
          const n = neuronas[i % neuronas.length].p;
          const f = (t * 0.4 + rnd(i)) % 1;
          const dir = new THREE.Vector3(rnd(i + 1) - 0.5, rnd(i + 2) - 0.5, rnd(i + 3) - 0.5).normalize();
          const r = 1.6 * (1 - f) + 0.15;
          o.position.set(n[0] + dir.x * r, n[1] + dir.y * r, n[2] + dir.z * r);
          o.rotation.set(t * 2 + i, t, 0);
          o.scale.setScalar(0.09 * Math.min(1, (1 - f) * 3));
        }}
      />
      <Particulas t={t} n={600} centro={[0, 0, -0.5]} tam={[6, 5, 5]} size={0.025} op={0.45} color="#c8b8ff" />
    </Lienzo>
  );
};

/** Días 4-5: fibras musculares que liberan aminoácidos (sin exageraciones). */
export const TomaFibras: React.FC<PropsToma> = ({t, d}) => {
  const mats = useMemo(
    () => ({
      fibra: matOrgano({color: '#8a1a22', color2: '#c8403a', motas: 2, estrias: 30, borde: '#ff7a5a', bordeInt: 0.9, rug: 0.4, barniz: 0.8}),
      vaina: matOrgano({color: '#f0d8d0', color2: '#ffffff', motas: 2, borde: '#ffe8e0', bordeInt: 0.8, opacidad: 0.18, rug: 0.3}),
      amino: brillo('#ffffff', 1.8),
    }),
    [],
  );
  animarMat(mats.fibra, t);
  animarMat(mats.vaina, t);
  const fibras = useMemo(() => {
    const r: [number, number][] = [[0, 0]];
    for (let i = 0; i < 6; i++) r.push([Math.cos((i / 6) * Math.PI * 2) * 1.02, Math.sin((i / 6) * Math.PI * 2) * 1.02]);
    for (let i = 0; i < 6; i++) r.push([Math.cos((i / 6) * Math.PI * 2 + 0.5) * 1.95, Math.sin((i / 6) * Math.PI * 2 + 0.5) * 1.95]);
    return r;
  }, []);
  const fino = 1 - entre(t, 0.4, d) * 0.06;
  const c = ruta(t, [
    {t: 0, pos: [7.5, 3.2, 8.5], mira: [0, 0, 0], fov: 38},
    {t: d, pos: [5.2, 2.0, 6.2], mira: [0, 0, -0.5], fov: 38},
  ]);
  return (
    <Lienzo foco={9} rango={4} niebla={0.035} fondo="#0a0204" post={{aberracion: 0.002}}>
      <Cam pos={suma(c.pos, mano(t, 10))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.22} color="#ff8a7a" />
      <directionalLight position={[3, 3, 3]} intensity={1.12} color="#ffe8e0" />
      <directionalLight position={[-3, 1, -3]} intensity={1.61} color="#ff4a3a" />
      <group rotation={[Math.PI / 2, 0, 0.3]}>
        {fibras.map(([x, z], i) => (
          <mesh key={i} geometry={geoFibra()} material={mats.fibra} position={[x, 0, z]} scale={[0.9 * fino, 1.2, 0.9 * fino]} />
        ))}
        <mesh material={mats.vaina}>
          <cylinderGeometry args={[2.6, 2.6, 7.2, 48, 1, true]} />
        </mesh>
      </group>
      <Enjambre
        geo={geoAminoacido()}
        mat={mats.amino}
        n={70}
        f={(i, o) => {
          const f = (t * 0.25 + rnd(i)) % 1;
          const a = rnd(i + 1) * Math.PI * 2;
          const r = 1.2 + f * 2.5;
          o.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.9, (rnd(i + 2) - 0.5) * 6);
          o.rotation.set(t + i, t * 0.8, 0);
          o.scale.setScalar(0.16 * Math.sin(f * Math.PI));
        }}
        color={(i) => ['#ffd04a', '#7affd8', '#ff8ad8', '#8ab8ff'][i % 4]}
      />
      <Particulas t={t} n={600} tam={[8, 6, 8]} size={0.03} op={0.45} color="#ffb0a0" />
    </Lienzo>
  );
};

/** Días 4-5: membrana celular con iones de sodio y potasio desequilibrados y menos agua. */
export const TomaElectrolitos: React.FC<PropsToma> = ({t, d}) => {
  const mats = useMemo(
    () => ({
      cabeza: new THREE.MeshPhysicalMaterial({color: '#e8a8c8', roughness: 0.35, clearcoat: 0.8, emissive: '#3a1028'}),
      cola: new THREE.MeshStandardMaterial({color: '#f0d890', roughness: 0.6, transparent: true, opacity: 0.7}),
      canal: matOrgano({color: '#4a3ab8', color2: '#8a6ae8', motas: 3, borde: '#a89aff', bordeInt: 1.1, rug: 0.35}),
      na: brillo('#ffb02a', 2.4),
      k: brillo('#c85aff', 2.4),
      agua: new THREE.MeshPhysicalMaterial({color: '#7ad8ff', roughness: 0.1, transmission: 0, clearcoat: 1, emissive: '#0a3a5a', transparent: true, opacity: 0.85}),
    }),
    [],
  );
  animarMat(mats.canal, t);
  const N = 34;
  const geoCab = useMemo(() => new THREE.SphereGeometry(0.11, 12, 10), []);
  const geoCola = useMemo(() => {
    const a = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6);
    const b = a.clone();
    a.translate(-0.04, -0.2, 0);
    b.translate(0.04, -0.2, 0);
    return fusionar([a, b]);
  }, []);
  const geoCanal = useMemo(() => {
    const gs: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      const c = new THREE.CapsuleGeometry(0.14, 0.9, 6, 12);
      c.translate(Math.cos((i / 6) * Math.PI * 2) * 0.26, 0, Math.sin((i / 6) * Math.PI * 2) * 0.26);
      gs.push(c);
    }
    return fusionar(gs);
  }, []);
  const canales: [number, number][] = [[-1.2, 0.4], [1.0, -0.6], [0.2, 1.4], [-0.4, -1.5]];
  const seca = entre(t, 0.5, d);
  const c = ruta(t, [
    {t: 0, pos: [1.2, 3.6, 6.2], mira: [0, 0, 0], fov: 40},
    {t: d, pos: [-1.0, 2.0, 4.6], mira: [0, 0, 0], fov: 40},
  ]);
  const rejilla = (i: number, capa: number): [number, number] => {
    const x = (i % N) - N / 2;
    const z = Math.floor(i / N) - N / 2;
    return [x * 0.24 + (capa ? 0.12 : 0), z * 0.24];
  };
  const libre = (x: number, z: number) => canales.every(([cx, cz]) => Math.hypot(x - cx, z - cz) > 0.45);
  return (
    <Lienzo foco={5.5} rango={3} niebla={0.06} fondo="#03060c" post={{aberracion: 0.002}}>
      <Cam pos={suma(c.pos, mano(t, 8))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.25} color="#8ab8ff" />
      <directionalLight position={[2, 4, 3]} intensity={1.12} color="#ffffff" />
      <directionalLight position={[-3, -2, -2]} intensity={1.24} color="#5a8aff" />
      {[0, 1].map((capa) => (
        <group key={capa}>
          <Enjambre
            geo={geoCab}
            mat={mats.cabeza}
            n={N * N}
            f={(i, o) => {
              const [x, z] = rejilla(i, capa);
              const y = (capa ? -0.48 : 0.48) + Math.sin(x * 1.3 + t * 1.2) * 0.04 + Math.cos(z * 1.1 + t) * 0.04;
              o.position.set(x, y, z);
              o.scale.setScalar(libre(x, z) ? 1 : 0);
            }}
          />
          <Enjambre
            geo={geoCola}
            mat={mats.cola}
            n={N * N}
            f={(i, o) => {
              const [x, z] = rejilla(i, capa);
              const y = (capa ? -0.48 : 0.48) + Math.sin(x * 1.3 + t * 1.2) * 0.04 + Math.cos(z * 1.1 + t) * 0.04;
              o.position.set(x, y, z);
              o.rotation.set(capa ? Math.PI : 0, i, 0);
              o.scale.setScalar(libre(x, z) ? 1 : 0);
            }}
          />
        </group>
      ))}
      {canales.map(([x, z], i) => (
        <mesh key={i} geometry={geoCanal} material={mats.canal} position={[x, 0, z]} rotation={[0, t * 0.2 + i, 0]} />
      ))}
      {/* sodio (naranja) y potasio (violeta) cruzando los canales */}
      {(['na', 'k'] as const).map((ion, j) => (
        <Enjambre
          key={ion}
          geo={useMemo(() => new THREE.SphereGeometry(0.09, 16, 12), [])}
          mat={mats[ion]}
          n={60}
          f={(i, o) => {
            const ch = canales[i % canales.length];
            const f = (t * (0.25 + rnd(i + j * 99) * 0.2) + rnd(i + j * 7)) % 1;
            const dir = j ? -1 : 1;
            const cerca = rnd(i + 3 + j) < 0.35;
            if (cerca) o.position.set(ch[0] + Math.sin(f * 9 + i) * 0.08, dir * (1.6 - f * 3.2), ch[1] + Math.cos(f * 9 + i) * 0.08);
            else o.position.set((rnd(i + 4 + j) - 0.5) * 7, dir * (0.9 + rnd(i + 5 + j) * 1.5) + Math.sin(t + i) * 0.1, (rnd(i + 6 + j) - 0.5) * 7);
            o.scale.setScalar(1);
          }}
        />
      ))}
      {/* agua: cada vez menos (deshidratación) */}
      <Enjambre
        geo={geoAgua()}
        mat={mats.agua}
        n={160}
        f={(i, o) => {
          o.position.set((rnd(i) - 0.5) * 8, (rnd(i + 1) > 0.5 ? 1 : -1) * (0.9 + rnd(i + 2) * 1.8) + Math.sin(t * 0.8 + i) * 0.1, (rnd(i + 3) - 0.5) * 8);
          o.rotation.set(t + i, t * 0.5 + i, 0);
          o.scale.setScalar(rnd(i + 9) > seca * 0.65 ? 0.32 : 0);
        }}
      />
      <Particulas t={t} n={500} tam={[8, 5, 8]} size={0.025} op={0.45} color="#a8d8ff" />
    </Lienzo>
  );
};

/* =================================================================== registro */

export const TOMAS: Record<string, React.FC<PropsToma>> = {
  cuerpoIntro: CuerpoIntro,
  estomago: TomaEstomago,
  higado: TomaHigado,
  vasoGlucosa: VasoGlucosa,
  hepatocitos: TomaHepatocitos,
  adipocitos: TomaAdipocitos,
  vasoGrasa: VasoGrasa,
  higadoCetonas: TomaHigadoCetonas,
  mitocondria: TomaMitocondria,
  cerebro: (p) => <TomaCerebro {...p} />,
  neuronas: TomaNeuronas,
  cuerpoMusculos: CuerpoMusculos,
  fibras: TomaFibras,
  electrolitos: TomaElectrolitos,
  corazon: TomaCorazon,
  rinones: TomaRinones,
  cerebroAlerta: (p) => <TomaCerebro {...p} alerta />,
  cuerpoRecorrido: CuerpoRecorrido,
  cuerpoCierre: CuerpoCierre,
};
