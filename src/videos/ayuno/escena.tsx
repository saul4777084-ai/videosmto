import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Bloom, ChromaticAberration, DepthOfField, EffectComposer, HueSaturation, Noise, ToneMapping, Vignette} from '@react-three/postprocessing';
import {BlendFunction, ToneMappingMode} from 'postprocessing';
import {
  coronarias,
  geoArterias,
  geoBronquios,
  geoCerebelo,
  geoColon,
  geoColumna,
  geoCorazon,
  geoCostillas,
  geoCuerpo,
  geoEstomago,
  geoHemisferio,
  geoHigado,
  geoHuesosLargos,
  geoIntestino,
  geoMusculos,
  geoPelvis,
  geoPulmon,
  geoRinon,
  geoVenas,
  vasosCorazon,
} from './anatomia';
import {animarMat, matHolograma, matOrgano, matPiel, matVaso, texPunto} from './shaders';

export type V3 = [number, number, number];
const memo = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};
export const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const suave = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
export const entre = (t: number, a: number, b: number) => suave((t - a) / (b - a));

/* ------------------------------------------------------------------ lienzo y cámara */

export const PostMedico: React.FC<{foco: number; rango?: number; bokeh?: number; bloom?: number; umbral?: number; aberracion?: number}> = ({
  foco,
  rango = 0.4,
  bokeh = 3,
  bloom = 0.75,
  umbral = 0.72,
  aberracion = 0.0012,
}) => (
  <EffectComposer multisampling={4}>
    {[
      <Bloom key="b" mipmapBlur intensity={bloom} luminanceThreshold={umbral} luminanceSmoothing={0.25} radius={0.75} />,
      <DepthOfField key="d" worldFocusDistance={foco} worldFocusRange={rango} bokehScale={bokeh} />,
      <ChromaticAberration key="c" offset={new THREE.Vector2(aberracion, aberracion * 0.6)} radialModulation modulationOffset={0.35} blendFunction={BlendFunction.NORMAL} />,
      <Vignette key="v" offset={0.25} darkness={0.75} />,
      <Noise key="n" opacity={0.04} premultiply />,
      <ToneMapping key="t" mode={ToneMappingMode.ACES_FILMIC} />,
      <HueSaturation key="h" saturation={0.12} />,
    ]}
  </EffectComposer>
);

/** Lienzo WebGL 1080×1920 con fondo negro-azulado, niebla de profundidad y acabado de cine. */
export const Lienzo: React.FC<{children: React.ReactNode; foco: number; rango?: number; niebla?: number; fondo?: string; post?: Partial<React.ComponentProps<typeof PostMedico>>}> = ({
  children,
  foco,
  rango,
  niebla = 0.25,
  fondo = '#02050c',
  post,
}) => (
  <ThreeCanvas width={1080} height={1920} gl={{preserveDrawingBuffer: true, antialias: true}} camera={{fov: 35, near: 0.005, far: 200}}>
    <color attach="background" args={[fondo]} />
    <fogExp2 attach="fog" args={[fondo, niebla]} />
    {children}
    <PostMedico foco={foco} rango={rango} {...post} />
  </ThreeCanvas>
);

export const Cam: React.FC<{pos: V3; mira: V3; fov?: number; rollo?: number}> = ({pos, mira, fov = 35, rollo = 0}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.up.set(Math.sin(rollo), Math.cos(rollo), 0);
    camera.lookAt(...mira);
    camera.fov = fov;
    camera.near = 0.005;
    camera.far = 200;
    camera.updateProjectionMatrix();
  });
  return null;
};

export type Clave = {t: number; pos: V3; mira: V3; fov?: number};
/** Interpola una ruta de cámara por claves con aceleración y frenado suaves. */
export const ruta = (t: number, claves: Clave[]) => {
  if (t <= claves[0].t) return {...claves[0], fov: claves[0].fov ?? 35};
  for (let i = 0; i < claves.length - 1; i++) {
    const a = claves[i];
    const b = claves[i + 1];
    if (t <= b.t) {
      const k = suave((t - a.t) / (b.t - a.t));
      const l = (x: V3, y: V3): V3 => [x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k];
      return {t, pos: l(a.pos, b.pos), mira: l(a.mira, b.mira), fov: (a.fov ?? 35) + ((b.fov ?? 35) - (a.fov ?? 35)) * k};
    }
  }
  const u = claves[claves.length - 1];
  return {...u, fov: u.fov ?? 35};
};
/** Pequeño movimiento de cámara en mano. */
export const mano = (t: number, k = 1): V3 => [Math.sin(t * 0.9) * 0.004 * k, Math.sin(t * 1.3 + 1) * 0.003 * k, Math.sin(t * 0.7 + 2) * 0.003 * k];
export const suma = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const orbita = (centro: V3, radio: number, ang: number, alto: number): V3 => [centro[0] + Math.sin(ang) * radio, centro[1] + alto, centro[2] + Math.cos(ang) * radio];

/* ------------------------------------------------------------------ partículas */

/** Polvo microscópico flotando: puntos suaves que derivan despacio (posición pura del tiempo). */
export const Particulas: React.FC<{t: number; n?: number; centro?: V3; tam?: V3; color?: string; size?: number; op?: number; vel?: number; semilla?: number}> = ({
  t,
  n = 600,
  centro = [0, 0, 0],
  tam = [2, 2, 2],
  color = '#9ad8ff',
  size = 0.012,
  op = 0.6,
  vel = 0.05,
  semilla = 1,
}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, [n]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < n; i++) {
    const s = i * 3.17 + semilla * 91;
    const x = (rnd(s) - 0.5) * tam[0] + Math.sin(t * vel * 6 + s) * tam[0] * 0.02;
    const y = (((rnd(s + 1) + t * vel * (0.3 + rnd(s + 2))) % 1) - 0.5) * tam[1];
    const z = (rnd(s + 3) - 0.5) * tam[2] + Math.cos(t * vel * 5 + s) * tam[2] * 0.02;
    pos.setXYZ(i, centro[0] + x, centro[1] + y, centro[2] + z);
  }
  pos.needsUpdate = true;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={texPunto()} color={color} size={size} sizeAttenuation transparent opacity={op} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

/** Haz de luz volumétrico (cono aditivo con degradado). */
export const Haz: React.FC<{p: V3; r?: V3; largo?: number; ancho?: number; color?: string; int?: number}> = ({p, r = [0, 0, 0], largo = 3, ancho = 0.8, color = '#6ab8ff', int = 0.06}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {uC: {value: new THREE.Color(color)}, uI: {value: int}},
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 uC; uniform float uI; varying vec2 vUv; void main(){ float a = pow(vUv.y, 1.8) * uI; gl_FragColor = vec4(uC * a, 1.0); }',
      }),
    [color, int],
  );
  return (
    <mesh position={p} rotation={r} material={mat}>
      <coneGeometry args={[ancho, largo, 32, 1, true]} />
    </mesh>
  );
};

/** Muchas copias de una geometría con transformaciones calculadas cada fotograma. */
export const Enjambre: React.FC<{
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  n: number;
  f: (i: number, o: THREE.Object3D) => void;
  color?: (i: number) => string;
  sombra?: boolean;
}> = ({geo, mat, n, f, color}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  const c = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    const im = ref.current!;
    for (let i = 0; i < n; i++) {
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
      f(i, o);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      if (color) im.setColorAt(i, c.set(color(i)));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
};

/* ------------------------------------------------------------------ latido y respiración */

export const LATIDO = 0.92;
/** Contracción del corazón (0..1): sístole marcada y segundo golpe más suave. */
export const latido = (t: number, desfase = 0.4) => {
  const f = (((t - desfase) % LATIDO) + LATIDO) % LATIDO;
  return Math.exp(-(((f - 0.06) / 0.05) ** 2)) + 0.55 * Math.exp(-(((f - 0.28) / 0.06) ** 2));
};
export const respira = (t: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 4.2);

/* ------------------------------------------------------------------ órganos */

type PropsO = {t: number; p?: V3; s?: number | V3; r?: V3; alerta?: number; brillo?: number};

export const Corazon: React.FC<PropsO & {desfase?: number}> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], alerta = 0, brillo = 1, desfase = 0.4}) => {
  const mats = useMemo(
    () => ({
      musculo: matOrgano({color: '#8a1a1e', color2: '#b8383a', vasos: '#3a0610', vasosEsc: 5, motas: 4, borde: '#ff4a3a', bordeInt: 0.9 * brillo, ondula: 0.004, rug: 0.38, barniz: 1}),
      aorta: matOrgano({color: '#c8504a', color2: '#e8807a', motas: 3, borde: '#ff8a7a', bordeInt: 0.6, rug: 0.45}),
      pulmonar: matOrgano({color: '#5a5aa8', color2: '#7a7ac8', motas: 3, borde: '#8ab8ff', bordeInt: 0.6, rug: 0.45}),
      coron: matVaso('#d8202a', '#ffb0a0', 0.8, 1),
      grasa: matOrgano({color: '#e8c070', color2: '#f8dca0', motas: 6, borde: '#ffd890', bordeInt: 0.4, opacidad: 0.85}),
    }),
    [brillo],
  );
  const lat = latido(t, desfase);
  animarMat(mats.musculo, t, lat * 0.8, alerta);
  animarMat(mats.aorta, t, lat * 0.3, alerta * 0.5);
  animarMat(mats.pulmonar, t, 0, alerta * 0.3);
  (mats.coron.uniforms.uT as {value: number}).value = t;
  const k = 1 - lat * 0.07;
  const v = vasosCorazon();
  return (
    <group position={p} rotation={r} scale={s as never}>
      <group rotation={[0.15, 0.4, -0.35]}>
        <mesh geometry={geoCorazon()} material={mats.musculo} scale={[k * 1.02, 1 - lat * 0.03, k]} />
        <group scale={[k, 1 - lat * 0.02, k]}>
          {coronarias().map((g, i) => (
            <mesh key={i} geometry={g} material={mats.coron} />
          ))}
        </group>
        <mesh geometry={v.aorta.geo} material={mats.aorta} scale={1 + lat * 0.03} />
        <mesh geometry={v.pulmonar.geo} material={mats.pulmonar} />
        <mesh geometry={v.pulmonarI.geo} material={mats.pulmonar} />
        <mesh geometry={v.cava.geo} material={mats.pulmonar} />
      </group>
    </group>
  );
};

export const Pulmones: React.FC<PropsO & {op?: number}> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], alerta = 0, op = 0.92}) => {
  const mats = useMemo(
    () => ({
      tejido: matOrgano({color: '#c87a80', color2: '#e8a8a8', vasos: '#7a2a40', vasosEsc: 7, motas: 9, borde: '#9ad8ff', bordeInt: 1.1, ondula: 0.003, rug: 0.6, barniz: 0.4, opacidad: op}),
      bronquio: matOrgano({color: '#e8d8d0', color2: '#f8ece4', motas: 4, borde: '#bfe8ff', bordeInt: 0.6, rug: 0.5}),
    }),
    [op],
  );
  animarMat(mats.tejido, t, respira(t) * 0.2, alerta);
  animarMat(mats.bronquio, t);
  const k = 1 + respira(t) * 0.055;
  const izq = useMemo(() => geoPulmon(1), []);
  const der = useMemo(() => geoPulmon(-1), []);
  return (
    <group position={p} rotation={r} scale={s as never}>
      <group scale={[k, 1 + respira(t) * 0.03, k]}>
        <mesh geometry={izq} material={mats.tejido} position={[0.3, 0, 0]} />
        <mesh geometry={der} material={mats.tejido} position={[-0.3, 0, 0]} scale={[1.05, 1, 1]} />
        <group position={[0, 0.0, -0.02]}>
          {geoBronquios().map((g, i) => (
            <mesh key={i} geometry={g} material={mats.bronquio} />
          ))}
        </group>
      </group>
    </group>
  );
};

export const Estomago: React.FC<PropsO & {interior?: boolean}> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], alerta = 0, interior}) => {
  const mats = useMemo(
    () => ({
      fuera: matOrgano({color: '#d89a7a', color2: '#f0bca0', vasos: '#a8384a', vasosEsc: 4.5, motas: 5, borde: '#ffb070', bordeInt: 0.9, ondula: 0.006, pliegues: 0, rug: 0.4, barniz: 1}),
      dentro: (() => {
        const m = matOrgano({color: '#b8503e', color2: '#ffa080', vasos: '#6a1020', vasosEsc: 6, motas: 9, pliegues: 70, borde: '#ff9a60', bordeInt: 0.35, ondula: 0.025, rug: 0.25, barniz: 1});
        m.side = THREE.BackSide;
        return m;
      })(),
    }),
    [],
  );
  animarMat(mats.fuera, t, 0, alerta);
  animarMat(mats.dentro, t);
  const {geo} = geoEstomago();
  const ola = 1 + Math.sin(t * 1.4) * 0.015;
  return (
    <group position={p} rotation={r} scale={s as never}>
      <mesh geometry={geo} material={mats.fuera} scale={[ola, 1, ola]} />
      {interior && <mesh geometry={geo} material={mats.dentro} scale={[ola * 0.985, 0.995, ola * 0.985]} />}
    </group>
  );
};

export const Higado: React.FC<PropsO & {borde?: string; op?: number}> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], alerta = 0, borde = '#ffb050', op = 1}) => {
  const mats = useMemo(
    () => ({
      tejido: matOrgano({color: '#5a1612', color2: '#8a2a1e', vasos: '#2a0408', vasosEsc: 3.5, motas: 6, borde, bordeInt: 0.9, ondula: 0.004, rug: 0.32, barniz: 1, opacidad: op}),
      vesicula: matOrgano({color: '#3a6a2a', color2: '#6a9a3a', motas: 4, borde: '#bfff8a', bordeInt: 0.6, opacidad: 0.9}),
    }),
    [borde, op],
  );
  animarMat(mats.tejido, t, 0, alerta);
  animarMat(mats.vesicula, t);
  return (
    <group position={p} rotation={r} scale={s as never}>
      <mesh geometry={geoHigado()} material={mats.tejido} />
      <mesh material={mats.vesicula} position={[0.12, -0.2, 0.18]} scale={[0.08, 0.13, 0.08]} rotation={[0.3, 0, 0.4]}>
        <sphereGeometry args={[1, 24, 18]} />
      </mesh>
    </group>
  );
};

export const Rinones: React.FC<PropsO> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], alerta = 0}) => {
  const mats = useMemo(
    () => ({
      tejido: matOrgano({color: '#6e2018', color2: '#a03a2a', vasos: '#3a0810', vasosEsc: 5, motas: 5, borde: '#ffa040', bordeInt: 1, ondula: 0.003, rug: 0.35, barniz: 1}),
      suprarrenal: matOrgano({color: '#c8902a', color2: '#e8b84a', motas: 6, borde: '#ffd060', bordeInt: 0.6}),
      arteria: matVaso('#c8202a', '#ffb0a0', 0.7, 1),
      vena: matVaso('#2a3aa8', '#8ab0ff', 0.5, 1),
      ureter: matOrgano({color: '#e8c0a8', color2: '#f8dcc8', motas: 3, borde: '#ffe0c0', bordeInt: 0.4}),
    }),
    [],
  );
  animarMat(mats.tejido, t, 0, alerta);
  animarMat(mats.suprarrenal, t);
  animarMat(mats.ureter, t);
  for (const m of [mats.arteria, mats.vena]) (m.uniforms.uT as {value: number}).value = t;
  const izq = useMemo(() => geoRinon(1), []);
  const der = useMemo(() => geoRinon(-1), []);
  return (
    <group position={p} rotation={r} scale={s as never}>
      {([1, -1] as const).map((l) => (
        <group key={l} position={[l * 0.58, l > 0 ? 0.04 : -0.02, 0]}>
          <mesh geometry={l > 0 ? izq : der} material={mats.tejido} />
          <mesh material={mats.suprarrenal} position={[l * 0.02, 0.5, -0.02]} scale={[0.16, 0.08, 0.1]}>
            <coneGeometry args={[1, 1.4, 16]} />
          </mesh>
          <mesh material={mats.ureter} position={[-l * 0.12, -0.55, 0]} scale={[0.025, 0.6, 0.025]}>
            <cylinderGeometry args={[1, 1, 1, 10]} />
          </mesh>
        </group>
      ))}
      <mesh material={mats.arteria} position={[0.02, 0, -0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.8, 14]} />
      </mesh>
      <mesh material={mats.vena} position={[-0.02, -0.06, 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 14]} />
      </mesh>
      <mesh material={mats.arteria} position={[0.02, 0, -0.08]}>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 16]} />
      </mesh>
      <mesh material={mats.vena} position={[-0.09, 0, -0.06]}>
        <cylinderGeometry args={[0.055, 0.055, 1.8, 16]} />
      </mesh>
    </group>
  );
};

export const Cerebro: React.FC<PropsO & {chispas?: number}> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], alerta = 0, brillo = 1, chispas = 0}) => {
  const mats = useMemo(
    () => ({
      corteza: matOrgano({color: '#c8909a', color2: '#e8bab4', vasos: '#9a2a4a', vasosEsc: 4, motas: 5, borde: '#b090ff', bordeInt: 0.6, ondula: 0.002, rug: 0.5, barniz: 0.7}),
      cerebelo: matOrgano({color: '#b87a82', color2: '#d8a0a0', motas: 6, borde: '#c08aff', bordeInt: 0.8, rug: 0.5}),
      tronco: matOrgano({color: '#d8b0a8', color2: '#e8c8c0', motas: 3, borde: '#c8a0ff', bordeInt: 0.6}),
    }),
    [],
  );
  animarMat(mats.corteza, t, (0.2 + 0.2 * Math.sin(t * 3)) * brillo, alerta);
  animarMat(mats.cerebelo, t, 0.1 * brillo, alerta);
  animarMat(mats.tronco, t);
  const izq = useMemo(() => geoHemisferio(1), []);
  const der = useMemo(() => geoHemisferio(-1), []);
  const nCh = Math.round(chispas);
  return (
    <group position={p} rotation={r} scale={s as never}>
      <mesh geometry={izq} material={mats.corteza} position={[0.072, 0, 0]} />
      <mesh geometry={der} material={mats.corteza} position={[-0.072, 0, 0]} />
      <mesh geometry={geoCerebelo()} material={mats.cerebelo} position={[0, -0.2, -0.26]} scale={0.62} />
      <mesh material={mats.tronco} position={[0, -0.42, -0.12]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.04, 0.36, 16]} />
      </mesh>
      {nCh > 0 &&
        [...Array(nCh)].map((_, i) => {
          const a = rnd(i) * Math.PI * 2;
          const b = rnd(i + 9) * Math.PI - Math.PI / 2;
          const f = (t * (1.5 + rnd(i * 2) * 2) + rnd(i * 3)) % 1;
          const on = f < 0.3 ? Math.sin((f / 0.3) * Math.PI) : 0;
          return (
            <mesh key={i} position={[Math.cos(a) * Math.cos(b) * 0.4, Math.sin(b) * 0.28 + 0.03, Math.sin(a) * Math.cos(b) * 0.46]}>
              <sphereGeometry args={[0.012 + on * 0.01, 8, 6]} />
              <meshBasicMaterial color="#e8c8ff" transparent opacity={on} toneMapped={false} />
            </mesh>
          );
        })}
    </group>
  );
};

export const Intestinos: React.FC<PropsO> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0]}) => {
  const mats = useMemo(
    () => ({
      delgado: matOrgano({color: '#d8907a', color2: '#f0b8a0', vasos: '#a83a4a', vasosEsc: 40, motas: 30, borde: '#ffb080', bordeInt: 0.7, rug: 0.4, barniz: 1}),
      grueso: matOrgano({color: '#c88a6a', color2: '#e0a888', motas: 25, borde: '#ffb080', bordeInt: 0.6, rug: 0.45, barniz: 0.9}),
    }),
    [],
  );
  animarMat(mats.delgado, t);
  animarMat(mats.grueso, t);
  return (
    <group position={p} rotation={r} scale={s as never}>
      <mesh geometry={geoIntestino()} material={mats.delgado} />
      <mesh geometry={geoColon()} material={mats.grueso} />
    </group>
  );
};

/* ------------------------------------------------------------------ cuerpo completo */

export type EstadoCuerpo = {
  t: number;
  /** opacidad de la piel realista (1 = cuerpo opaco) */
  piel?: number;
  /** intensidad del holograma de la piel */
  holo?: number;
  /** capa muscular visible (0..1) y adelgazamiento (0..1) */
  musculos?: number;
  perdida?: number;
  /** capa de grasa (0..1) */
  grasa?: number;
  esqueleto?: number;
  vasos?: number;
  organos?: number;
  alerta?: number;
  giro?: number;
};

const matsCuerpo = memo(() => ({
  piel: matPiel(),
  holo: matHolograma('#2a8aff', '#8ad8ff'),
  grasa: matHolograma('#ffb030', '#ffd890'),
  musculo: (() => {
    const m = matOrgano({color: '#7a1a1e', color2: '#b8403a', motas: 6, estrias: 180, borde: '#ff6a4a', bordeInt: 0.55, rug: 0.5, barniz: 0.6, opacidad: 0.8});
    m.side = THREE.FrontSide;
    return m;
  })(),
  hueso: new THREE.MeshPhysicalMaterial({color: '#e8dcc4', roughness: 0.5, clearcoat: 0.3, transparent: true, opacity: 0.35, depthWrite: false, emissive: '#3a3a4a'}),
  arteria: matVaso('#d01a24', '#ffb8a8', 0.7, 0.95),
  vena: matVaso('#2a3ab8', '#8ab8ff', 0.5, 0.9),
}));

/** Cuerpo humano anatómico completo: piel, holograma, músculos, grasa, esqueleto, vasos y órganos. */
export const CuerpoAnatomico: React.FC<EstadoCuerpo & {p?: V3; s?: number}> = ({
  t,
  piel = 0,
  holo = 0.8,
  musculos = 0,
  perdida = 0,
  grasa = 0,
  esqueleto = 0.35,
  vasos = 1,
  organos = 1,
  alerta = 0,
  giro = 0,
  p = [0, 0, 0],
  s = 1,
}) => {
  const m = matsCuerpo();
  m.piel.opacity = piel;
  m.piel.depthWrite = piel > 0.98;
  m.piel.visible = piel > 0.01;
  (m.holo.uniforms.uT as {value: number}).value = t;
  (m.holo.uniforms.uOp as {value: number}).value = holo;
  m.holo.visible = holo > 0.01;
  (m.grasa.uniforms.uT as {value: number}).value = t * 0.6;
  (m.grasa.uniforms.uOp as {value: number}).value = grasa;
  m.grasa.visible = grasa > 0.01;
  m.musculo.opacity = 0.8 * musculos;
  m.musculo.visible = musculos > 0.01;
  animarMat(m.musculo, t, 0, alerta * 0.6);
  m.hueso.opacity = 0.2 * esqueleto;
  m.hueso.visible = esqueleto > 0.01;
  for (const v of [m.arteria, m.vena]) {
    (v.uniforms.uT as {value: number}).value = t;
    (v.uniforms.uOp as {value: number}).value = 0.95 * vasos;
    v.visible = vasos > 0.01;
  }
  const flaco = 1 - perdida * 0.05;
  return (
    <group position={p} scale={s} rotation={[0, giro, 0]}>
      {/* huesos */}
      {[...geoColumna(), ...geoCostillas(), ...geoPelvis(), ...geoHuesosLargos()].map((g, i) => (
        <mesh key={`h${i}`} geometry={g} material={m.hueso} />
      ))}
      {/* vasos */}
      {geoArterias().map((g, i) => (
        <mesh key={`a${i}`} geometry={g} material={m.arteria} />
      ))}
      {geoVenas().map((g, i) => (
        <mesh key={`v${i}`} geometry={g} material={m.vena} />
      ))}
      {/* órganos en su sitio */}
      {organos > 0.01 && (
        <group>
          <Cerebro t={t} p={[0, 1.685, -0.005]} s={0.15} alerta={alerta} />
          <Pulmones t={t} p={[0, 1.33, -0.005]} s={[0.28, 0.26, 0.28]} alerta={alerta * 0.6} op={0.55} />
          <Corazon t={t} p={[0.022, 1.3, 0.035]} s={0.1} alerta={alerta} />
          <Higado t={t} p={[-0.04, 1.165, 0.02]} s={0.12} alerta={alerta * 0.6} />
          <Estomago t={t} p={[0.06, 1.13, 0.03]} s={0.19} alerta={alerta * 0.4} />
          <Rinones t={t} p={[0, 1.065, -0.055]} s={0.1} alerta={alerta} />
          <Intestinos t={t} p={[0, 0.99, 0.015]} s={0.82} />
        </group>
      )}
      {/* músculos, grasa, piel y holograma */}
      <mesh geometry={geoMusculos()} material={m.musculo} scale={[flaco, 1, flaco]} />
      <mesh geometry={geoCuerpo()} material={m.grasa} scale={[1.008, 1.002, 1.01]} />
      <mesh geometry={geoCuerpo()} material={m.piel} />
      <mesh geometry={geoCuerpo()} material={m.holo} scale={[1.004, 1.001, 1.006]} />
    </group>
  );
};
