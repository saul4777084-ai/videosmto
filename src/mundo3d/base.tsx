import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

/** Piezas básicas del mundo 3D: primitivas con material, cielo, cámara y aleatorio con semilla. */

export type V3 = [number, number, number];

/** Pseudoaleatorio estable (mismo resultado en cada frame y en cada render). */
export const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type PropsMat = {
  c: string;
  rug?: number;
  met?: number;
  em?: string;
  emI?: number;
  op?: number;
  plano?: boolean;
  doble?: boolean;
};

export const Mat: React.FC<PropsMat> = ({c, rug = 0.75, met = 0, em, emI = 1, op, plano, doble}) => (
  <meshStandardMaterial
    color={c}
    roughness={rug}
    metalness={met}
    emissive={em ?? '#000000'}
    emissiveIntensity={em ? emI : 0}
    transparent={op !== undefined}
    opacity={op ?? 1}
    flatShading={plano}
    side={doble ? THREE.DoubleSide : THREE.FrontSide}
    depthWrite={op === undefined || op > 0.6}
  />
);

type PropsT = {p?: V3; r?: V3; s?: number | V3; sombra?: boolean};
type PropsPieza = PropsT & PropsMat;

const Malla: React.FC<PropsPieza & {children: React.ReactNode}> = ({p, r, s, sombra = true, children, ...m}) => (
  <mesh position={p} rotation={r} scale={s as never} castShadow={sombra} receiveShadow>
    {children}
    <Mat {...m} />
  </mesh>
);

export const Caja: React.FC<PropsPieza & {t: V3}> = ({t, ...x}) => (
  <Malla {...x}>
    <boxGeometry args={t} />
  </Malla>
);
export const Bola: React.FC<PropsPieza & {rad: number; seg?: number}> = ({rad, seg = 32, ...x}) => (
  <Malla {...x}>
    <sphereGeometry args={[rad, seg, Math.round(seg * 0.75)]} />
  </Malla>
);
export const Cil: React.FC<PropsPieza & {ra: number; rb?: number; h: number; seg?: number; abierto?: boolean}> = ({ra, rb, h, seg = 28, abierto, ...x}) => (
  <Malla {...x}>
    <cylinderGeometry args={[ra, rb ?? ra, h, seg, 1, abierto]} />
  </Malla>
);
export const Cono: React.FC<PropsPieza & {rad: number; h: number; seg?: number; ti?: number; tl?: number}> = ({rad, h, seg = 28, ti = 0, tl = Math.PI * 2, ...x}) => (
  <Malla {...x}>
    <coneGeometry args={[rad, h, seg, 1, false, ti, tl]} />
  </Malla>
);
export const Toro: React.FC<PropsPieza & {rad: number; tubo: number; arco?: number; seg?: number}> = ({rad, tubo, arco = Math.PI * 2, seg = 48, ...x}) => (
  <Malla {...x}>
    <torusGeometry args={[rad, tubo, 14, seg, arco]} />
  </Malla>
);
export const Capsula: React.FC<PropsPieza & {rad: number; largo: number}> = ({rad, largo, ...x}) => (
  <Malla {...x}>
    <capsuleGeometry args={[rad, largo, 8, 20]} />
  </Malla>
);
/** Roca / hielo / cristal facetado. */
export const Roca: React.FC<PropsPieza & {rad: number; det?: number}> = ({rad, det = 0, ...x}) => (
  <Malla plano {...x}>
    <dodecahedronGeometry args={[rad, det]} />
  </Malla>
);
export const Plano: React.FC<PropsPieza & {t: [number, number]}> = ({t, ...x}) => (
  <Malla sombra={false} {...x}>
    <planeGeometry args={t} />
  </Malla>
);

/** Esfera de cielo con degradado vertical (arriba → horizonte). */
export const Cielo: React.FC<{arriba: string; horizonte: string; abajo?: string}> = ({arriba, horizonte, abajo}) => {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 4;
    cv.height = 512;
    const g = cv.getContext('2d')!;
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, arriba);
    gr.addColorStop(0.3, arriba);
    gr.addColorStop(0.5, horizonte);
    gr.addColorStop(1, abajo ?? horizonte);
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [arriba, horizonte, abajo]);
  return (
    <mesh>
      <sphereGeometry args={[180, 32, 24]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
};

/** Coloca la cámara en cada frame (función pura del tiempo, como el resto del proyecto). */
export const CamaraFija: React.FC<{pos: V3; mira: V3; fov?: number; rollo?: number}> = ({pos, mira, fov = 38, rollo = 0}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.up.set(Math.sin(rollo), Math.cos(rollo), 0);
    camera.lookAt(...mira);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 400;
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Luz principal con sombras + luz de cielo/suelo. */
export const Luces: React.FC<{sol: V3; color?: string; int?: number; cielo?: string; suelo?: string; amb?: number}> = ({
  sol,
  color = '#fff4e0',
  int = 2.4,
  cielo = '#bcd8ff',
  suelo = '#5a4a3a',
  amb = 1,
}) => (
  <>
    <hemisphereLight args={[cielo, suelo, amb]} />
    <directionalLight
      position={sol}
      color={color}
      intensity={int}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-12}
      shadow-camera-right={12}
      shadow-camera-top={12}
      shadow-camera-bottom={-12}
      shadow-camera-near={1}
      shadow-camera-far={80}
      shadow-bias={-0.0006}
      shadow-normalBias={0.02}
    />
  </>
);

/** Suelo grande que recibe sombras. */
export const Suelo: React.FC<{c: string; tam?: number; y?: number; rug?: number; met?: number}> = ({c, tam = 300, y = 0, rug = 0.95, met = 0}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <circleGeometry args={[tam / 2, 64]} />
    <meshStandardMaterial color={c} roughness={rug} metalness={met} />
  </mesh>
);
