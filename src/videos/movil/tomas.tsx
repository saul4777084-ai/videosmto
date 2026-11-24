import React, {useMemo} from 'react';
import * as THREE from 'three';
import {geoNeurona, tuboVariable} from '../ayuno/anatomia';
import {Cam, entre, Enjambre, Haz, mano, orbita, Particulas, rnd, ruta, suma, V3} from '../ayuno/escena';
import {animarMat, matOrgano, matVaso} from '../ayuno/shaders';
import {geoReceptor} from '../cola/hombre';
import {LienzoCola, Mesa, MESA, Suelo} from '../cola/objetos';
import {brillo, CerebroMovil, CuerpoMovil, IconoFlotante, MovilEnMano, Ojo, PINEAL, PREFRONTAL, ACCUMBENS, Telefono, VTA} from './objetos';
import type {Icono} from './pantalla';
import {geoBoton, geoDopamina, geoMelatonina, geoMembrana, geoVesicula, MOVIL, OJOS, TEL} from './persona';
import plan from './plan.json';

/**
 * Tomas del vídeo "¿Qué le pasa a tu cerebro si usas el móvil 8 horas al día durante 30 días?".
 * Cada toma recibe `t` (segundos desde que empieza) y `d` (lo que dura, con el solape de la
 * transición) y monta su propio lienzo 3D con su cámara y su iluminación.
 */
export type PropsToma = {t: number; d: number};
const EV = plan.eventos;

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** Pulso que sube rápido y cae despacio a partir de cada instante de la lista. */
export const golpes = (t: number, lista: number[], caida = 0.6, subida = 0.06) => lista.reduce((m, a) => Math.max(m, t < a ? 0 : Math.min(1, (t - a) / subida) * Math.exp(-(t - a - subida) / caida)), 0);
/** Atención que cae con cada interrupción y se recupera despacio (misma función que el medidor). */
export const foco = (t: number, lista: number[]) => lista.reduce((f, a) => (t < a ? f : f * (1 - 0.72 * Math.exp(-(t - a) / 1.7) * Math.min(1, (t - a) / 0.08))), 1);

/** Luz de la escena: penumbra azulada con la pantalla como fuente principal. */
const LucesNoche: React.FC<{piel?: number; calido?: number; frio?: number}> = ({piel = 0, calido = 0, frio = 0}) => (
  <>
    <ambientLight intensity={0.06 + piel * 0.04 + calido * 0.08} color={calido > 0.5 ? '#6a5a4a' : '#3a4a8a'} />
    <directionalLight position={[-2, 3, -3]} intensity={1.5 - calido * 0.5} color="#5ab0ff" />
    <directionalLight position={[2.5, 2, -2]} intensity={1.0 + frio * 0.4} color="#8a6aff" />
    <directionalLight position={[1.2, 2.2, 3]} intensity={0.35 + piel * 0.8 + calido * 0.8} color={calido > 0.5 ? '#ffd8a8' : '#ffe2cc'} />
    <spotLight position={[0.2, 3.2, 1.2]} angle={0.5} penumbra={0.8} intensity={piel * 3 + calido * 2} distance={6} color="#fff0e0" />
  </>
);

/** Luz que la pantalla echa sobre la cara. */
const LuzPantalla: React.FC<{i?: number; color?: string}> = ({i = 1, color = '#a8d0ff'}) => (
  <>
    <pointLight position={[MOVIL[0] - 0.02, MOVIL[1] + 0.06, MOVIL[2] - 0.05]} intensity={0.55 * i} distance={0.7} color={color} />
    <pointLight position={[MOVIL[0], MOVIL[1] + 0.02, MOVIL[2] + 0.02]} intensity={0.25 * i} distance={0.3} color={color} />
  </>
);

/** Ventana del dormitorio al fondo (luz de luna), desenfocada por la profundidad de campo. */
const Ventana: React.FC<{op?: number}> = ({op = 1}) => {
  const mats = useMemo(
    () => ({
      cristal: new THREE.MeshBasicMaterial({color: '#2a4a8a', transparent: true, opacity: 0.55, toneMapped: false}),
      marco: new THREE.MeshStandardMaterial({color: '#0a0e18', roughness: 0.8}),
      luna: brillo('#dfe8ff', 2.2),
    }),
    [],
  );
  mats.cristal.opacity = 0.55 * op;
  return (
    <group position={[-0.6, 1.6, -1.6]}>
      <mesh material={mats.cristal}>
        <planeGeometry args={[1.1, 1.3]} />
      </mesh>
      <mesh material={mats.luna} position={[0.25, 0.32, -0.05]}>
        <circleGeometry args={[0.07, 40]} />
      </mesh>
      {[-0.55, 0, 0.55].map((x) => (
        <mesh key={x} material={mats.marco} position={[x, 0, 0.01]}>
          <boxGeometry args={[0.035, 1.34, 0.03]} />
        </mesh>
      ))}
      {[-0.65, 0, 0.65].map((y) => (
        <mesh key={y} material={mats.marco} position={[0, y, 0.01]}>
          <boxGeometry args={[1.14, 0.035, 0.03]} />
        </mesh>
      ))}
    </group>
  );
};

/** Haz de luz de la pantalla hacia los ojos: partículas que viajan del móvil a la cara. */
const RayoPantalla: React.FC<{t: number; on: number; n?: number; color?: string; a?: V3; b?: V3}> = ({t, on, n = 60, color = '#bfe0ff', a = MOVIL, b = OJOS}) => {
  const mat = useMemo(() => brillo(color, 2.6), [color]);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  return (
    <Enjambre
      geo={geo}
      mat={mat}
      n={n}
      f={(i, o) => {
        const f = (t * (0.9 + rnd(i) * 0.6) + rnd(i + 1)) % 1;
        const p = lerp3(a, b, f);
        o.position.set(p[0] + (rnd(i + 2) - 0.5) * 0.03 * (1 - f), p[1] + (rnd(i + 3) - 0.5) * 0.05 * (1 - f), p[2] + (rnd(i + 4) - 0.5) * 0.02);
        o.scale.setScalar(0.0022 * on * Math.sin(f * Math.PI));
      }}
    />
  );
};

/* =================================================================== INTRODUCCIÓN */

/** Hombre en penumbra mirando el móvil: la cámara se acerca y la piel se vuelve transparente. */
export const TomaIntro: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.85, 1.42, 1.9], mira: [0.06, 1.46, 0.12], fov: 34},
    {t: 4.2, pos: [0.62, 1.52, 1.2], mira: [0.04, 1.54, 0.12], fov: 34},
    {t: d, pos: [0.44, 1.6, 0.86], mira: [0.04, 1.54, 0.12], fov: 33},
  ]);
  const piel = 1 - entre(t, 3.0, 6.0);
  const holo = entre(t, 3.2, 6.2) * 0.8;
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={t < 4 ? 1.4 : 0.45} niebla={0.12} fondo="#020308" post={{bokeh: 2, bloom: 0.95}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <LucesNoche piel={piel} />
      <LuzPantalla i={1.2} />
      <CuerpoMovil t={t} piel={piel} holo={holo} esqueleto={entre(t, 3.4, 6)} vasos={entre(t, 3.6, 6.2)} organos={entre(t, 3, 5.5)} luzCerebro={entre(t, 5.4, 7.5)} />
      <MovilEnMano t={t} modo="feed" luz={1.5} />
      <RayoPantalla t={t} on={entre(t, 5.0, 6.5)} />
      <Suelo color="#3a6aff" />
      <Ventana op={0.8} />
      <Particulas t={t} n={900} centro={[0, 1.2, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.45} />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 1 */

/** Primer plano del móvil: llega una notificación, la pantalla se enciende y vibra. */
export const TomaNotificacion: React.FC<PropsToma> = ({t, d}) => {
  const avisos = EV.avisos;
  const c = ruta(t, [
    {t: 0, pos: [0.07, 0.05, 0.42], mira: [0, 0, 0], fov: 34},
    {t: avisos[0] + 0.4, pos: [0.03, 0.02, 0.3], mira: [0, 0.005, 0], fov: 34},
    {t: d, pos: [-0.12, 0.03, 0.28], mira: [0, 0.01, 0.02], fov: 34},
  ]);
  const vib = avisos.reduce((v, a) => v + (t > a && t < a + 0.45 ? Math.sin((t - a) * 160) * (1 - (t - a) / 0.45) : 0), 0);
  const despierta = entre(t, avisos[0] - 0.05, avisos[0] + 0.25);
  const destello = golpes(t, avisos, 0.5);
  const mL = useMemo(() => brillo('#cfe6ff', 2.8), []);
  const mesa = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#0e121a', roughness: 0.25, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.1}), []);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={0.12} niebla={0.4} fondo="#020308" post={{bokeh: 3, bloom: 1.0}}>
      <Cam pos={suma(c.pos, mano(t, 0.6))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.08} color="#4a5a9a" />
      <directionalLight position={[-1, 2, -1]} intensity={1.2} color="#5a8aff" />
      <directionalLight position={[1.5, 1, 1]} intensity={0.25} color="#ffe0c8" />
      <pointLight position={[0, 0, 0.12]} intensity={(0.15 + despierta * 0.5 + destello * 0.6)} distance={0.6} color="#9ac0ff" />
      <Telefono t={t} p={[vib * 0.0016, 0, 0]} r={[0, 0, vib * 0.01]} modo="bloqueo" avisos={avisos} hora="10:24" luz={0.25 + despierta * 1.1 + destello * 0.5} />
      {/* superficie en la que se apoya, muy desenfocada */}
      <mesh material={mesa} position={[0, -TEL.alto / 2 - 0.002, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 3]} />
      </mesh>
      {/* luz que sale de la pantalla hacia ti */}
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(1, 8, 6), [])}
        mat={mL}
        n={90}
        f={(i, o) => {
          const f = (t * (0.5 + rnd(i) * 0.4) + rnd(i + 1)) % 1;
          o.position.set((rnd(i + 2) - 0.5) * 0.065 * (1 + f), (rnd(i + 3) - 0.5) * 0.14 * (1 + f * 0.6), 0.006 + f * 0.18);
          o.scale.setScalar(0.0007 * despierta * Math.sin(f * Math.PI) * (0.6 + destello) * (1 - f * 0.6));
        }}
      />
      <Particulas t={t} n={500} centro={[0, 0, 0]} tam={[0.8, 0.8, 0.8]} size={0.004} op={0.45} color="#9ac0ff" />
    </LienzoCola>
  );
};

/** La red social: cada mensaje, «me gusta» o vídeo salta de la pantalla como una pequeña recompensa. */
export const TomaFeed: React.FC<PropsToma> = ({t, d}) => {
  const premios = EV.premios as {t: number; tipo: Icono}[];
  const pos = orbita([0, 0, 0], 0.36 - (t / d) * 0.05, 0.42 - (t / d) * 0.6, 0.03);
  const luz = golpes(t, premios.map((p) => p.t), 0.35);
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.12} niebla={0.4} fondo="#03030a" post={{bokeh: 2.6, bloom: 1.1}}>
      <Cam pos={suma(pos, mano(t, 0.6))} mira={[0, 0.005, 0.02]} fov={36} />
      <ambientLight intensity={0.08} color="#5a4a9a" />
      <directionalLight position={[-1, 2, -1]} intensity={1.2} color="#7a6aff" />
      <pointLight position={[0, 0, 0.12]} intensity={0.6 + luz * 0.8} distance={0.6} color="#ffb0d0" />
      <Telefono t={t + 3} modo="feed" scroll={1.1} luz={1.35 + luz * 0.3} r={[0, 0, 0]} />
      {premios.map((p, i) => {
        const f = (t - p.t) / 1.6;
        if (f < 0 || f > 1) return null;
        const x0 = (rnd(i * 3 + 1) - 0.5) * 0.05;
        const y0 = (rnd(i * 3 + 2) - 0.5) * 0.1;
        const k = 1 - Math.pow(1 - f, 3);
        const sale = Math.min(1, f * 6);
        return <IconoFlotante key={i} tipo={p.tipo} p={[x0 + (rnd(i) - 0.5) * 0.1 * k, y0 + 0.06 * k, 0.01 + k * 0.1]} s={0.008 + sale * 0.018 * (1 - f * 0.3)} op={Math.min(1, (1 - f) * 2.5)} />;
      })}
      <Particulas t={t} n={600} centro={[0, 0, 0.1]} tam={[0.8, 0.8, 0.6]} size={0.004} op={0.5} color="#ffb8e0" />
    </LienzoCola>
  );
};

/** Cerebro semitransparente: se enciende la vía de la recompensa y se libera dopamina. */
export const TomaRecompensa: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0, 0], 2.45 - (t / d) * 0.45, 0.95 - (t / d) * 0.55, 0.22);
  const rec = entre(t, 0.4, 2.6);
  const libera = entre(t, 2.0, 2.8);
  const mD = useMemo(() => brillo('#ffd23a', 2.4), []);
  const v = new THREE.Vector3();
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.7} niebla={0.2} fondo="#05030a" post={{bloom: 1.15, bokeh: 2.5}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, -0.02, 0.06]} fov={34} />
      <ambientLight intensity={0.16} color="#8a6aff" />
      <directionalLight position={[2, 2, 2]} intensity={1.2} color="#f0d8ff" />
      <directionalLight position={[-2, 1, -2]} intensity={1.6} color="#9a5aff" />
      <CerebroMovil t={t} op={0.26} recompensa={rec} brillo={1 + libera} chispas={20 + libera * 30} />
      {/* dopamina que sale del núcleo accumbens y viaja hacia delante */}
      <Enjambre
        geo={geoDopamina()}
        mat={mD}
        n={80}
        f={(i, o) => {
          const f = (t * (0.35 + rnd(i) * 0.25) + rnd(i + 1)) % 1;
          const l = i % 2 ? 1 : -1;
          const base = i % 3 === 0 ? VTA : ([ACCUMBENS[0] * l, ACCUMBENS[1], ACCUMBENS[2]] as V3);
          v.set(rnd(i + 2) - 0.5, rnd(i + 3) - 0.3, rnd(i + 4) - 0.2).normalize();
          const r = f * 0.38;
          o.position.set(base[0] + v.x * r, base[1] + v.y * r, base[2] + v.z * r);
          o.rotation.set(t * 2 + i, t + i, 0);
          o.scale.setScalar(0.022 * libera * Math.sin(f * Math.PI));
        }}
      />
      <pointLight position={[PREFRONTAL[0], PREFRONTAL[1], PREFRONTAL[2] + 0.1]} intensity={entre(t, 1.6, 2.8) * 0.5} distance={0.8} color="#ffd060" />
      <Particulas t={t} n={700} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.5} color="#ffd8a0" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#ffc070" int={0.04} />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 7 */

/** Sinapsis: la dopamina cruza la hendidura y se une a sus receptores; con la repetición, la conexión se refuerza. */
export const TomaSinapsis: React.FC<PropsToma> = ({t, d}) => {
  const Y_POST = -1.55;
  const mats = useMemo(
    () => ({
      boton: (() => {
        const m = matOrgano({color: '#5a3aa8', color2: '#8a6ae8', motas: 1.2, borde: '#c8aaff', bordeInt: 1.2, rug: 0.35, barniz: 0.8, opacidad: 0.5, emisivo: '#120828'});
        m.side = THREE.DoubleSide;
        return m;
      })(),
      membrana: matOrgano({color: '#3a2a7a', color2: '#6a4ab8', motas: 0.8, vasos: '#9a7aff', vasosEsc: 0.6, borde: '#a88aff', bordeInt: 0.8, rug: 0.35, barniz: 0.8, ondula: 0.03}),
      receptor: matOrgano({color: '#3a6ab8', color2: '#7aa8ff', motas: 4, borde: '#bfe0ff', bordeInt: 1.2, rug: 0.35}),
      vesicula: new THREE.MeshPhysicalMaterial({color: '#b8a0ff', roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.5, emissive: '#3a1a8a', emissiveIntensity: 0.6, depthWrite: false}),
      contenido: brillo('#ffd23a', 2.2),
      dopa: brillo('#ffd23a', 2.6),
    }),
    [],
  );
  const refuerzo = entre(t, 0.5, d * 0.9);
  animarMat(mats.boton, t, 0.2 + refuerzo * 0.4);
  animarMat(mats.membrana, t);
  animarMat(mats.receptor, t, refuerzo * (0.5 + 0.5 * Math.sin(t * 7)));
  // receptores: aparecen más a medida que la conexión se refuerza
  const sitios = useMemo(() => {
    const r: V3[] = [];
    for (let i = 0; i < 26; i++) {
      const a = rnd(i + 30) * Math.PI * 2;
      const rr = Math.sqrt(rnd(i + 31)) * 1.15;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      r.push([x, Y_POST - Math.hypot(x, z) ** 2 * 0.035, z]);
    }
    return r;
  }, []);
  const nRec = Math.round(9 + refuerzo * 17);
  const c = ruta(t, [
    {t: 0, pos: [2.5, -0.95, 3.0], mira: [0, -1.15, 0], fov: 36},
    {t: d, pos: [1.35, -1.25, 2.05], mira: [0, -1.25, 0], fov: 36},
  ]);
  const ritmo = 0.45 + refuerzo * 0.6;
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={1.3} niebla={0.09} fondo="#05030c" post={{bloom: 1.1, aberracion: 0.002}}>
      <Cam pos={suma(c.pos, mano(t, 10))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.25} color="#8a7aff" />
      <directionalLight position={[3, 4, 3]} intensity={1.0} color="#f0e8ff" />
      <directionalLight position={[-3, 1, -2]} intensity={1.4} color="#7a4aff" />
      <pointLight position={[0, -1.25, 0.4]} intensity={0.8 + refuerzo * 1.4} distance={3} color="#ffd060" />
      <mesh geometry={geoBoton()} material={mats.boton} renderOrder={3} />
      <mesh geometry={geoMembrana()} material={mats.membrana} position={[0, Y_POST - 0.05, 0]} />
      {sitios.slice(0, nRec).map((s, i) => (
        <mesh key={i} geometry={geoReceptor()} material={mats.receptor} position={s} scale={0.42 * Math.min(1, (refuerzo * 17 + 9 - i) * 1.2)} rotation={[0, rnd(i) * 6, 0]} />
      ))}
      {/* vesículas cargadas que bajan hasta la membrana y se abren */}
      <Enjambre
        geo={geoVesicula()}
        mat={mats.vesicula}
        n={30}
        f={(i, o) => {
          const f = (t * ritmo * (0.6 + rnd(i) * 0.4) + rnd(i + 1)) % 1;
          const a = rnd(i + 2) * Math.PI * 2;
          const rr = 0.2 + rnd(i + 3) * 0.6;
          const y = 0.3 - f * 1.18;
          o.position.set(Math.cos(a) * rr * (1 - f * 0.4), y, Math.sin(a) * rr * (1 - f * 0.4));
          o.scale.setScalar(0.2 * (f < 0.88 ? 1 : Math.max(0, 1 - (f - 0.88) / 0.12)));
        }}
      />
      <Enjambre
        geo={geoDopamina()}
        mat={mats.contenido}
        n={30}
        f={(i, o) => {
          const f = (t * ritmo * (0.6 + rnd(i) * 0.4) + rnd(i + 1)) % 1;
          const a = rnd(i + 2) * Math.PI * 2;
          const rr = 0.2 + rnd(i + 3) * 0.6;
          o.position.set(Math.cos(a) * rr * (1 - f * 0.4), 0.3 - f * 1.18, Math.sin(a) * rr * (1 - f * 0.4));
          o.rotation.set(t * 2 + i, t, 0);
          o.scale.setScalar(0.06 * (f < 0.88 ? 1 : 0));
        }}
      />
      {/* dopamina que cruza la hendidura hasta un receptor */}
      <Enjambre
        geo={geoDopamina()}
        mat={mats.dopa}
        n={150}
        f={(i, o) => {
          const f = (t * ritmo * 1.3 * (0.7 + rnd(i + 5) * 0.5) + rnd(i + 6)) % 1;
          const dest = sitios[i % nRec];
          const a = rnd(i + 7) * Math.PI * 2;
          const rr = rnd(i + 8) * 0.7;
          const ini: V3 = [Math.cos(a) * rr, -0.92, Math.sin(a) * rr];
          const fin: V3 = [dest[0], dest[1] + 0.42, dest[2]];
          const k = Math.min(1, f / 0.55);
          const p = lerp3(ini, fin, k * k * (3 - 2 * k));
          o.position.set(p[0] + Math.sin(t * 3 + i) * 0.04 * (1 - k), p[1], p[2] + Math.cos(t * 2.6 + i) * 0.04 * (1 - k));
          o.rotation.set(t * 2.5 + i, t * 1.3 + i, 0);
          const vis = rnd(i + 9) < 0.35 + refuerzo * 0.65 ? 1 : 0;
          o.scale.setScalar(0.065 * vis * (f < 0.85 ? Math.min(1, f * 8) : Math.max(0, 1 - (f - 0.85) / 0.15)));
        }}
      />
      <Particulas t={t} n={700} centro={[0, -1.0, 0]} tam={[6, 4, 6]} size={0.025} op={0.45} color="#c8b8ff" />
    </LienzoCola>
  );
};

/** Circuito del hábito: aviso → mirar → recompensa. Los impulsos corren cada vez más rápido y la vía brilla más. */
export const TomaCircuito: React.FC<PropsToma> = ({t, d}) => {
  const nodos = useMemo(() => [[0, 0.95, 0], [-1.05, -0.6, 0.2], [1.05, -0.6, -0.2]] as V3[], []);
  const geos = useMemo(() => [geoNeurona(3), geoNeurona(7), geoNeurona(11)], []);
  const tramos = useMemo(
    () =>
      nodos.map((a, i) => {
        const b = nodos[(i + 1) % 3];
        const m: V3 = [(a[0] + b[0]) * 0.62, (a[1] + b[1]) * 0.62, (a[2] + b[2]) * 0.5 + 0.35];
        return tuboVariable([a, m, b], () => 0.035, 80, 12);
      }),
    [nodos],
  );
  const mats = useMemo(
    () => ({
      neurona: [
        matOrgano({color: '#3a5ab8', color2: '#6a9ae8', motas: 3, borde: '#9ac8ff', bordeInt: 1.3, rug: 0.35, barniz: 0.8, emisivo: '#0a1a3a'}),
        matOrgano({color: '#5a3aa8', color2: '#8a6ae8', motas: 3, borde: '#c8aaff', bordeInt: 1.3, rug: 0.35, barniz: 0.8, emisivo: '#1a0a3a'}),
        matOrgano({color: '#a86a2a', color2: '#e8a84a', motas: 3, borde: '#ffd890', bordeInt: 1.3, rug: 0.35, barniz: 0.8, emisivo: '#3a1a04'}),
      ],
      via: matVaso('#7a5aff', '#ffe8a0', 1.0, 0.9),
      impulso: brillo('#fff0c0', 4),
    }),
    [],
  );
  const fuerza = entre(t, 0, d * 0.85);
  const vel = 0.5 + fuerza * 1.2;
  mats.neurona.forEach((m, i) => animarMat(m, t, 0.3 + 0.5 * Math.max(0, Math.sin(t * vel * Math.PI * 2 - i * 2.1))));
  const vu = mats.via.uniforms as Record<string, {value: number}>;
  vu.uT.value = t * (1 + fuerza * 2);
  vu.uOp.value = 0.35 + fuerza * 0.65;
  const pos = orbita([0, 0.05, 0], 5.6 - (t / d) * 0.7, -0.35 + (t / d) * 0.45, 0.25);
  return (
    <LienzoCola foco={Math.hypot(pos[0], pos[1] - 0.05, pos[2])} rango={1.6} niebla={0.1} fondo="#04030c" post={{bloom: 1.2, aberracion: 0.002}}>
      <Cam pos={suma(pos, mano(t, 10))} mira={[0, 0.05, 0]} fov={38} />
      <ambientLight intensity={0.2} color="#8a7aff" />
      <directionalLight position={[2, 2, 3]} intensity={0.9} color="#e8e0ff" />
      <directionalLight position={[-3, 1, -2]} intensity={1.4} color="#7a4aff" />
      {nodos.map((p, i) => (
        <mesh key={i} geometry={geos[i]} material={mats.neurona[i]} position={p} rotation={[i, i * 2, 0]} scale={1.1} />
      ))}
      {tramos.map((tr, i) => (
        <mesh key={i} geometry={tr.geo} material={mats.via} scale={[1, 1, 1]} />
      ))}
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(0.032, 12, 10), [])}
        mat={mats.impulso}
        n={24}
        f={(i, o) => {
          const u = (((t * vel * 0.33 + i / 24) % 1) + 1) % 1;
          const k = Math.floor(u * 3);
          const p = tramos[k].curva.getPointAt((u * 3) % 1);
          o.position.copy(p);
          o.scale.setScalar(i < 6 + fuerza * 18 ? 1 + fuerza * 0.5 : 0);
        }}
      />
      {nodos.map((p, i) => (
        <pointLight key={i} position={p} intensity={0.4 + 0.6 * Math.max(0, Math.sin(t * vel * Math.PI * 2 - i * 2.1)) * (0.4 + fuerza)} distance={1.6} color={['#7ab8ff', '#c08aff', '#ffc860'][i]} />
      ))}
      <Particulas t={t} n={700} centro={[0, 0, 0]} tam={[6, 5, 5]} size={0.025} op={0.45} color="#c8b8ff" />
    </LienzoCola>
  );
};

/** "Coges el móvil casi sin pensarlo": la pantalla se enciende una y otra vez y el cerebro responde. */
export const TomaBucle: React.FC<PropsToma> = ({t, d}) => {
  const luces = EV.bucle;
  const g = golpes(t, luces, 0.45);
  const c = ruta(t, [
    {t: 0, pos: [-0.3, 1.42, 0.85], mira: [0.04, 1.55, 0.14], fov: 34},
    {t: d, pos: [-0.22, 1.46, 0.68], mira: [0.04, 1.57, 0.13], fov: 34},
  ]);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={0.4} niebla={0.12} fondo="#020308" post={{bokeh: 2, bloom: 1.0}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <LucesNoche />
      <LuzPantalla i={0.6 + g * 1.2} />
      <CuerpoMovil t={t} holo={0.75} esqueleto={0.4} vasos={0.7} luzCerebro={0.3 + g} chispas={10 + g * 30} />
      <MovilEnMano t={t} modo="bloqueo" avisos={luces} hora="23:41" luz={0.3 + g * 1.3} />
      <RayoPantalla t={t} on={0.2 + g} n={80} />
      <Particulas t={t} n={700} centro={[0, 1.4, 0.2]} tam={[2, 1.4, 2]} size={0.008} op={0.45} />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 15 */

/** Corteza prefrontal: un haz de atención se rompe con cada notificación y tarda en recomponerse. */
export const TomaPrefrontal: React.FC<PropsToma> = ({t, d}) => {
  const ints = EV.interrupciones;
  const f = foco(t, ints) * entre(t, 0, 0.8);
  const pos = orbita([0, 0.04, 0.05], 2.3 - (t / d) * 0.35, 0.95 - (t / d) * 0.35, 0.3);
  const destino: V3 = [0, PREFRONTAL[1], 0.43];
  const mats = useMemo(
    () => ({
      haz: new THREE.MeshBasicMaterial({color: '#5ad8ff', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false}),
      chispa: brillo('#9ae8ff', 3),
      roja: brillo('#ff5a6a', 3),
    }),
    [],
  );
  const parpadeo = 0.75 + 0.25 * Math.sin(t * 40) * (1 - f);
  mats.haz.opacity = 0.75 * f * parpadeo;
  const iconos: Icono[] = ['campana', 'burbuja', 'corazon', 'play', 'arroba'];
  return (
    <LienzoCola foco={Math.hypot(pos[0], pos[1] - 0.04, pos[2] - 0.05)} rango={0.7} niebla={0.18} fondo="#03050c" post={{bloom: 1.05, bokeh: 2.5}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0.04, 0.1]} fov={34} />
      <ambientLight intensity={0.15} color="#6a8aff" />
      <directionalLight position={[2, 2, 2]} intensity={1.4} color="#e8f0ff" />
      <directionalLight position={[-2, 1, -2]} intensity={1.6} color="#7a5aff" />
      <pointLight position={[0, 0.1, 0.8]} intensity={0.3 + f * 0.6} distance={1.6} color="#6ad8ff" />
      <CerebroMovil t={t} prefrontal={0.25 + f * 0.9} chispas={30} colorBorde="#7ac8ff" />
      {/* haz de concentración que entra por la frente */}
      <mesh material={mats.haz} position={[0, destino[1] + 0.02, destino[2] + 0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.016, 1.5, 24, 1, true]} />
      </mesh>
      <mesh material={mats.haz} position={[0, destino[1] + 0.02, destino[2] + 0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.004, 1.5, 16, 1, true]} />
      </mesh>
      {/* notificaciones que llegan de los lados y rompen el haz */}
      {ints.map((a, i) => {
        const k = (t - (a - 0.7)) / 0.7;
        if (k < 0 || k > 1.05) return null;
        const lado = i % 2 ? 1 : -1;
        const ini: V3 = [lado * 0.75, destino[1] + 0.25 + rnd(i) * 0.2, destino[2] + 0.35];
        const fin: V3 = [0, destino[1] + 0.02, destino[2] + 0.32];
        const p = lerp3(ini, fin, Math.min(1, k * k));
        return <IconoFlotante key={i} tipo={iconos[i % iconos.length]} p={p} s={0.1 * (k < 1 ? 1 : 0)} />;
      })}
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(1, 8, 6), [])}
        mat={mats.chispa}
        n={ints.length * 24}
        f={(i, o) => {
          const a = ints[Math.floor(i / 24)];
          const k = (t - a) / 0.9;
          const v = new THREE.Vector3(rnd(i) - 0.5, rnd(i + 1) - 0.5, rnd(i + 2) - 0.5).normalize();
          const r = 0.28 * (1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3));
          o.position.set(v.x * r, destino[1] + 0.02 + v.y * r, destino[2] + 0.32 + v.z * r);
          o.scale.setScalar(k > 0 && k < 1 ? 0.006 * (1 - k) : 0);
        }}
      />
      <Particulas t={t} n={700} centro={[0, 0, 0.3]} tam={[3, 3, 3]} size={0.012} op={0.5} color="#9ad8ff" />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#6ab8ff" int={0.04} />
    </LienzoCola>
  );
};

/** Ojo frente a la pantalla: apenas parpadea, se seca y se enrojece. */
export const TomaOjo: React.FC<PropsToma> = ({t, d}) => {
  const parp = EV.parpadeos;
  const cierre = parp.reduce((m, a) => Math.max(m, Math.max(0, 1 - Math.abs(t - a - 0.12) / 0.13)), 0);
  const seco = entre(t, 1.2, d - 0.3) * 0.9;
  const c = ruta(t, [
    {t: 0, pos: [0.16, 0.1, 2.75], mira: [0, 0.01, 0.2], fov: 30},
    {t: d, pos: [0.09, 0.06, 2.2], mira: [0, 0.01, 0.22], fov: 30},
  ]);
  return (
    <LienzoCola foco={dist(c.pos, [0, 0, 0.5])} rango={0.35} niebla={0.12} fondo="#03050c" post={{bloom: 0.9, bokeh: 2.5}}>
      <Cam pos={suma(c.pos, mano(t, 2))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.2} color="#8a9aff" />
      <directionalLight position={[1, 2, 3]} intensity={1.1} color="#eaf2ff" />
      <directionalLight position={[-2, 1, -2]} intensity={1.2} color="#7a6aff" />
      {/* la pantalla delante: luz fría */}
      <pointLight position={[0.15, 0.25, 1.4]} intensity={1.2} distance={3} color="#bfe0ff" />
      <Ojo t={t} cierre={cierre} sequedad={seco} reflejo={1 - cierre} />
      <Particulas t={t} n={600} centro={[0, 0, 0.3]} tam={[3, 3, 2]} size={0.01} op={0.45} color="#bfe0ff" />
    </LienzoCola>
  );
};

/* =================================================================== DÍA 30 */

/** De noche, en el dormitorio: solo la luz de la pantalla. */
export const TomaNoche: React.FC<PropsToma> = ({t, d}) => {
  const c = ruta(t, [
    {t: 0, pos: [0.95, 1.3, 1.7], mira: [0.05, 1.35, 0.1], fov: 34},
    {t: d, pos: [0.55, 1.5, 1.05], mira: [0.04, 1.5, 0.12], fov: 34},
  ]);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={0.8} niebla={0.12} fondo="#01020a" post={{bokeh: 2.2, bloom: 1.0}}>
      <Cam pos={suma(c.pos, mano(t))} mira={c.mira} fov={c.fov} />
      <ambientLight intensity={0.04} color="#2a3a7a" />
      <directionalLight position={[-1.5, 2.5, -2.5]} intensity={0.9} color="#4a7aff" />
      <directionalLight position={[2, 2, -2]} intensity={0.7} color="#6a4aff" />
      <LuzPantalla i={1.6} />
      <CuerpoMovil t={t} piel={0.25} holo={0.6} esqueleto={0.25} vasos={0.5} luzCerebro={0.4} chispas={14} color="#3a6aff" />
      <MovilEnMano t={t} modo="feed" noche={1} hora="01:12" luz={1.6} scroll={0.8} />
      <RayoPantalla t={t} on={0.6} n={70} />
      <Ventana />
      <Haz p={[-0.6, 2.3, -1.2]} r={[0.5, 0, 0.35]} largo={3} ancho={0.9} color="#5a8aff" int={0.05} />
      <Suelo color="#2a4aaa" />
      <Particulas t={t} n={900} centro={[0, 1.2, 0]} tam={[3, 2.6, 3]} size={0.01} op={0.4} color="#9ab8ff" />
    </LienzoCola>
  );
};

/** La luz de la pantalla frena a la glándula pineal: llega menos melatonina. */
export const TomaMelatonina: React.FC<PropsToma> = ({t, d}) => {
  const azul = entre(t, 1.0, 3.6);
  const act = 1 - 0.8 * azul;
  const pos = orbita([0, 0, 0], 1.75 - (t / d) * 0.3, 1.25 - (t / d) * 0.25, 0.2);
  const mats = useMemo(() => ({mel: brillo('#ffb050', 2.4), azul: brillo('#8ac8ff', 3)}), []);
  const tel: V3 = [0.95, -0.38, 0.3];
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.6} niebla={0.18} fondo="#03030c" post={{bloom: 1.1, bokeh: 2.5}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, -0.02, 0]} fov={34} />
      <ambientLight intensity={0.14} color="#7a6aff" />
      <directionalLight position={[2, 2, 2]} intensity={1.0} color="#f0e0ff" />
      <directionalLight position={[-2, 1, -2]} intensity={1.4} color="#6a5aff" />
      <pointLight position={[0.4, 0, 0.5]} intensity={azul * 1.6} distance={2} color="#7ab8ff" />
      <CerebroMovil t={t} op={0.25} pineal={act} brillo={1} chispas={18} />
      {/* melatonina que sale de la pineal (cada vez menos) */}
      <Enjambre
        geo={geoMelatonina()}
        mat={mats.mel}
        n={60}
        f={(i, o) => {
          const f = (t * (0.25 + rnd(i) * 0.15) + rnd(i + 1)) % 1;
          const v = new THREE.Vector3(rnd(i + 2) - 0.5, rnd(i + 3) - 0.35, rnd(i + 4) - 0.5).normalize();
          const r = 0.04 + f * 0.55;
          o.position.set(PINEAL[0] + v.x * r, PINEAL[1] + v.y * r, PINEAL[2] + v.z * r);
          o.rotation.set(t + i, t * 0.7 + i, 0);
          const vis = rnd(i + 5) < act ? 1 : 0;
          o.scale.setScalar(0.022 * vis * Math.sin(f * Math.PI));
        }}
      />
      {/* móvil en primer plano y su luz azul hacia el cerebro */}
      <Telefono t={t + 10} p={tel} r={[-0.4, -1.1, 0.1]} s={2.2} modo="feed" noche={1} luz={1.7} />
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(1, 8, 6), [])}
        mat={mats.azul}
        n={90}
        f={(i, o) => {
          const f = (t * (0.6 + rnd(i) * 0.4) + rnd(i + 1)) % 1;
          const p = lerp3(tel, [PINEAL[0] + (rnd(i + 2) - 0.5) * 0.3, PINEAL[1] + (rnd(i + 3) - 0.5) * 0.25, PINEAL[2] + 0.1], f);
          o.position.set(...p);
          o.scale.setScalar(0.006 * azul * Math.sin(f * Math.PI));
        }}
      />
      <Particulas t={t} n={700} centro={[0, 0, 0]} tam={[3, 3, 3]} size={0.012} op={0.45} color="#b0a8ff" />
    </LienzoCola>
  );
};

/** Cerebro cansado tras dormir mal: apagado, frío y con actividad irregular. */
export const TomaCansado: React.FC<PropsToma> = ({t, d}) => {
  const pos = orbita([0, 0, 0], 2.1 - (t / d) * 0.4, -0.75 + (t / d) * 0.5, 0.35);
  const cans = 0.4 + entre(t, 0, d * 0.7) * 0.5;
  const parp = 0.6 + 0.4 * Math.abs(Math.sin(t * 5.1) * Math.sin(t * 1.7 + 1));
  return (
    <LienzoCola foco={Math.hypot(...pos)} rango={0.6} niebla={0.22} fondo="#04050a" post={{bloom: 0.8, bokeh: 3}}>
      <Cam pos={suma(pos, mano(t, 3))} mira={[0, 0, 0]} fov={34} />
      <ambientLight intensity={0.35} color="#8a9aba" />
      <directionalLight position={[2, 2, 2]} intensity={2.0 * parp} color="#d8e4f8" />
      <directionalLight position={[-2, 1, -2]} intensity={1.8} color="#6a7aaa" />
      <pointLight position={[0, 0.4, 1.0]} intensity={0.8} distance={3} color="#a8b8e0" />
      <CerebroMovil t={t} brillo={0.4} chispas={36} cansancio={cans} colorBorde="#7a8ab8" />
      <Particulas t={t} n={1200} centro={[0, 0, 0]} tam={[2.4, 2, 2.4]} size={0.02} op={0.35} color="#8a98b0" vel={0.02} />
      <Haz p={[0, 2.2, -0.8]} r={[0.4, 0, 0]} largo={3} ancho={1} color="#6a7aa8" int={0.035} />
    </LienzoCola>
  );
};

/* =================================================================== FINAL */

/** El móvil sobre la mesa se pone boca abajo; la cámara se aleja y descubre al hombre en calma. */
export const TomaFinal: React.FC<PropsToma> = ({t, d}) => {
  const giroT = EV.bocaAbajo;
  const kv = entre(t, giroT, giroT + 0.7);
  const telP: V3 = [MESA.p[0] + 0.02, MESA.alto + TEL.fondo / 2 + 0.002 + Math.sin(kv * Math.PI) * 0.06, MESA.p[2] + 0.02];
  const c = ruta(t, [
    {t: 0, pos: [MESA.p[0] + 0.2, MESA.alto + 0.24, MESA.p[2] + 0.3], mira: [MESA.p[0] + 0.02, MESA.alto, MESA.p[2] + 0.02], fov: 34},
    {t: giroT + 1.2, pos: [MESA.p[0] + 0.28, MESA.alto + 0.3, MESA.p[2] + 0.42], mira: [MESA.p[0] + 0.02, MESA.alto + 0.02, MESA.p[2] + 0.02], fov: 34},
    {t: giroT + 4.5, pos: [0.85, 1.05, 1.9], mira: [0.25, 0.95, 0.15], fov: 34},
    {t: d, pos: [0.35, 1.08, 3.9], mira: [0.12, 1.0, 0.05], fov: 34},
  ]);
  const calma = entre(t, giroT + 0.5, giroT + 4);
  const piel = 0.12 + entre(t, giroT + 3, d * 0.85) * 0.45;
  const avisos = useMemo(() => [0.4, 1.6, 2.9, 4.1, 5.2], []);
  const encendida = 1 - entre(t, giroT + 0.1, giroT + 0.35);
  return (
    <LienzoCola foco={dist(c.pos, c.mira)} rango={t < giroT + 2 ? 0.25 : 1.4} niebla={0.1} fondo="#03050a" post={{bokeh: 2.2, bloom: 0.95}}>
      <Cam pos={suma(c.pos, mano(t, 0.8))} mira={c.mira} fov={c.fov} />
      <LucesNoche piel={piel} calido={calma} />
      <pointLight position={[telP[0], telP[1] + 0.12, telP[2]]} intensity={0.6 * encendida * (0.6 + golpes(t, avisos, 0.5))} distance={0.6} color="#a8d0ff" />
      <pointLight position={[0.2, 1.6, 0.9]} intensity={calma * 0.6} distance={2.5} color="#ffd8a8" />
      <CuerpoMovil t={t} movil={false} piel={piel} holo={0.7 - piel * 0.35} esqueleto={0.3} vasos={0.8} organos={1 - piel * 0.5} color={calma > 0.5 ? '#3a9aff' : '#2a8aff'} cerebro={{colorBorde: '#7affd0'}} luzCerebro={calma * 0.5} chispas={8} />
      <Telefono t={t} p={telP} r={[-Math.PI / 2 + kv * Math.PI, 0, 0.35]} modo={encendida > 0.5 ? 'bloqueo' : 'apagada'} avisos={avisos} hora="22:30" luz={0.3 + encendida * (1.1 + golpes(t, avisos, 0.5) * 0.5)} />
      <Mesa />
      <Suelo color={calma > 0.5 ? '#ffb86a' : '#3a8aff'} />
      <Particulas t={t} n={900} centro={[0.1, 1.1, 0]} tam={[3.5, 2.8, 3.5]} size={0.012} op={0.45} color={calma > 0.5 ? '#ffe0c0' : '#9ad8ff'} />
      <Haz p={[0, 2.8, -0.4]} r={[0.25, 0, 0]} largo={3.4} ancho={1.3} color={calma > 0.5 ? '#ffc890' : '#3a8aff'} int={0.05} />
    </LienzoCola>
  );
};
