import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {Bola, Caja, Capsula, Cielo, Cil, Cono, Luces, Mat, Plano, rnd, Roca, Suelo, Toro, V3} from './base';

/**
 * 8 escenarios 3D construidos con primitivas de three.js: luz con sombras, niebla atmosférica,
 * cielo en degradado y objetos animados (función pura del tiempo `t`, en segundos).
 * El personaje se coloca en el origen; la cámara mira hacia (0, ~1, 0).
 */

type PropsE = {t: number};

/** Muchos objetos iguales en una sola llamada de dibujo (público, nieve, estrellas…). */
const Instancias: React.FC<{
  n: number;
  geo: React.ReactNode;
  mat: React.ReactNode;
  pos: (i: number) => V3;
  esc?: (i: number) => number | V3;
  color?: (i: number) => string;
  sombra?: boolean;
}> = ({n, geo, mat, pos, esc, color, sombra}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    for (let i = 0; i < n; i++) {
      m.position.set(...pos(i));
      const s = esc ? esc(i) : 1;
      if (typeof s === 'number') m.scale.setScalar(s);
      else m.scale.set(...s);
      m.updateMatrix();
      im.setMatrixAt(i, m.matrix);
      if (color) im.setColorAt(i, col.set(color(i)));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} castShadow={sombra} receiveShadow>
      {geo}
      {mat}
    </instancedMesh>
  );
};

const Palmera: React.FC<{p: V3; h?: number; giro?: number; t: number; s?: number}> = ({p, h = 4, giro = 0, t, s = 1}) => {
  const tramos = 7;
  const curva = 0.09;
  const viento = Math.sin(t * 1.4 + p[0]) * 0.05;
  return (
    <group position={p} rotation={[0, giro, 0]} scale={s}>
      {[...Array(tramos)].map((_, i) => {
        const y = (i / tramos) * h;
        return <Cil key={i} ra={0.13 - i * 0.008} rb={0.15 - i * 0.008} h={h / tramos + 0.03} p={[curva * i * i * 0.18, y + h / tramos / 2, 0]} r={[0, 0, -curva * i * 0.4]} c={i % 2 ? '#9a7048' : '#8a6038'} />;
      })}
      <group position={[curva * tramos * tramos * 0.18, h, 0]} rotation={[0, 0, viento]}>
        {[...Array(7)].map((_, i) => (
          <group key={i} rotation={[0, (i / 7) * Math.PI * 2, 0]}>
            <Bola rad={1} p={[0.85, -0.25, 0]} s={[1, 0.08, 0.28]} r={[0, 0, -0.45]} c={i % 2 ? '#3a9a3a' : '#2f8a34'} />
          </group>
        ))}
        <Bola rad={0.13} p={[0.05, -0.12, 0.08]} c="#5a3a1a" />
        <Bola rad={0.13} p={[-0.08, -0.14, -0.04]} c="#5a3a1a" />
      </group>
    </group>
  );
};

/* ================================================================ 1 · ISLA PIRATA */
const IslaPirata: React.FC<PropsE> = ({t}) => {
  const ola = (x: number) => Math.sin(t * 1.6 + x) * 0.06;
  return (
    <>
      <Cielo arriba="#3a8ae0" horizonte="#ffd8a8" />
      <fog attach="fog" args={['#cfe0f0', 18, 90]} />
      <Luces sol={[8, 12, 6]} color="#fff0d0" int={2.6} cielo="#9ad0ff" suelo="#d8b880" amb={1.1} />
      {/* mar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12 + ola(0) * 0.5, 0]} receiveShadow>
        <circleGeometry args={[160, 64]} />
        <meshStandardMaterial color="#1f8ab8" roughness={0.15} metalness={0.3} />
      </mesh>
      {/* isla de arena */}
      <Bola rad={9} p={[0, -8.6, 0]} s={[1, 1, 0.8]} c="#ecd29a" rug={1} />
      <Bola rad={9.6} p={[0, -9.25, 0]} s={[1, 1, 0.8]} c="#4ac0c8" rug={0.2} op={0.55} sombra={false} />
      <Palmera p={[-3.2, 0.2, -2.5]} h={5} giro={0.4} t={t} />
      <Palmera p={[3.6, 0.15, -3.5]} h={4.2} giro={2.5} t={t + 1} />
      <Palmera p={[5.5, 0, 0.5]} h={3.2} giro={3.3} t={t + 2} s={0.9} />
      {/* cofre del tesoro */}
      <group position={[1.8, 0.35, 1.2]} rotation={[0, -0.5, 0]}>
        <Caja t={[1, 0.55, 0.65]} p={[0, 0, 0]} c="#7a4a24" />
        <Cil ra={0.33} h={1} r={[0, 0, Math.PI / 2]} p={[0, 0.28, -0.1]} c="#8a5428" />
        <Caja t={[1.04, 0.08, 0.68]} p={[0, -0.05, 0]} c="#c8a040" met={0.8} rug={0.3} />
        {[...Array(9)].map((_, i) => (
          <Cil key={i} ra={0.08} h={0.03} p={[-0.35 + (i % 3) * 0.3 + rnd(i) * 0.1, 0.3 + rnd(i + 9) * 0.05, 0.1 + Math.floor(i / 3) * 0.06]} r={[rnd(i) - 0.5, 0, rnd(i + 3) - 0.5]} c="#ffd23a" met={1} rug={0.2} em="#a07000" emI={0.4} />
        ))}
      </group>
      <Roca rad={0.6} p={[-1.8, 0.15, 1.6]} c="#8a8478" />
      <Roca rad={0.35} p={[-1.2, 0.08, 2.2]} c="#9a9488" />
      {/* barco pirata a lo lejos */}
      <group position={[-12, ola(2), -22]} rotation={[ola(4) * 0.5, 0.6, ola(1)]}>
        <Caja t={[7, 1.6, 2.2]} p={[0, 0.6, 0]} c="#5a3418" />
        <Caja t={[2, 1.2, 2.2]} p={[-2.6, 1.8, 0]} c="#6a4020" />
        {[-1, 1.5].map((x, i) => (
          <group key={x} position={[x, 1.4, 0]}>
            <Cil ra={0.1} h={7 - i} p={[0, (7 - i) / 2, 0]} c="#4a2a14" />
            <Caja t={[0.06, 2.2, 2.8 - i * 0.4]} p={[0.12, 4 - i * 0.6, 0]} c="#f2ead8" />
            <Caja t={[0.06, 1.6, 2.4 - i * 0.4]} p={[0.12, 2.1, 0]} c="#e8dcc4" />
          </group>
        ))}
        <Caja t={[0.02, 0.6, 1]} p={[-1, 7.4, 0.5]} c="#111" />
      </group>
      {/* gaviotas */}
      {[0, 1, 2].map((i) => {
        const a = t * 0.4 + i * 2.1;
        return (
          <group key={i} position={[Math.cos(a) * 9, 7 + i * 0.8, -6 + Math.sin(a) * 4]} rotation={[0, -a, Math.sin(t * 8 + i) * 0.3]}>
            <Bola rad={0.6} s={[1, 0.06, 0.15]} c="#ffffff" />
          </group>
        );
      })}
    </>
  );
};

/* ================================================================ 2 · POLO NORTE */
const PoloNorte: React.FC<PropsE> = ({t}) => (
  <>
    <Cielo arriba="#0a1640" horizonte="#4a6aa8" />
    <fog attach="fog" args={['#3a5488', 14, 70]} />
    <Luces sol={[-6, 10, 8]} color="#cfe0ff" int={1.6} cielo="#7aa0ff" suelo="#e8f0ff" amb={1.3} />
    <Suelo c="#eef4ff" rug={0.7} />
    {/* aurora boreal: cintas emisivas onduladas */}
    {[0, 1, 2].map((i) => (
      <group key={i} position={[0, 20 + i * 3, -60 - i * 6]}>
        {[...Array(24)].map((_, k) => {
          const x = (k - 12) * 4.2;
          const y = Math.sin(k * 0.5 + t * 0.6 + i) * 3;
          return <Plano key={k} t={[4.6, 12 - i * 2]} p={[x, y, Math.cos(k * 0.4 + i) * 4]} r={[0, Math.sin(k * 0.3) * 0.4, 0]} c="#000" em={i === 1 ? '#c05aff' : '#3affa8'} emI={1.4} op={0.25 + 0.12 * Math.sin(t * 2 + k)} doble />;
        })}
      </group>
    ))}
    {/* iglú */}
    <group position={[-3.2, 0, -3]} rotation={[0, 0.6, 0]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat c="#f4f8ff" rug={0.6} />
      </mesh>
      {[0.4, 0.8, 1.2, 1.6].map((y) => (
        <Toro key={y} rad={Math.sqrt(4 - y * y)} tubo={0.025} p={[0, y, 0]} r={[Math.PI / 2, 0, 0]} c="#c8d8f0" />
      ))}
      <Cil ra={0.75} h={1.4} p={[0, 0.5, 1.9]} r={[Math.PI / 2, 0, 0]} c="#f4f8ff" />
      <Cil ra={0.5} h={0.05} p={[0, 0.45, 2.62]} r={[Math.PI / 2, 0, 0]} c="#2a3450" />
    </group>
    {/* icebergs y abetos nevados */}
    {[...Array(9)].map((_, i) => (
      <Roca key={i} rad={1.5 + rnd(i) * 2.5} p={[(i - 4) * 7 + rnd(i + 2) * 3, 0.5, -14 - rnd(i + 5) * 10]} s={[1, 1.4 + rnd(i) * 0.8, 1]} r={[0, rnd(i) * 3, 0]} c={i % 2 ? '#bfe0ff' : '#dcefff'} rug={0.3} met={0.1} />
    ))}
    {[...Array(7)].map((_, i) => {
      const x = (i % 2 ? 1 : -1) * (4 + rnd(i) * 7);
      const z = -2 - rnd(i + 11) * 9;
      const s = 0.8 + rnd(i + 4) * 0.7;
      return (
        <group key={i} position={[x, 0, z]} scale={s}>
          <Cil ra={0.15} h={0.6} p={[0, 0.3, 0]} c="#5a3a24" />
          {[0, 1, 2].map((k) => (
            <group key={k}>
              <Cono rad={1.1 - k * 0.28} h={1.3} p={[0, 1 + k * 0.75, 0]} c="#1e5a3a" />
              <Cono rad={0.8 - k * 0.22} h={0.5} p={[0, 1.45 + k * 0.75, 0]} c="#f4f8ff" />
            </group>
          ))}
        </group>
      );
    })}
    {/* muñeco de nieve */}
    <group position={[2.6, 0, -0.8]} rotation={[0, -0.6, 0]}>
      <Bola rad={0.55} p={[0, 0.5, 0]} c="#ffffff" />
      <Bola rad={0.4} p={[0, 1.25, 0]} c="#ffffff" />
      <Bola rad={0.28} p={[0, 1.82, 0]} c="#ffffff" />
      <Cono rad={0.05} h={0.3} p={[0, 1.82, 0.38]} r={[Math.PI / 2, 0, 0]} c="#ff8a1a" />
      <Cil ra={0.2} h={0.3} p={[0, 2.18, 0]} c="#222" />
      <Cil ra={0.3} h={0.03} p={[0, 2.04, 0]} c="#222" />
    </group>
    {/* nieve que cae */}
    <Instancias
      n={420}
      geo={<sphereGeometry args={[0.035, 6, 4]} />}
      mat={<meshBasicMaterial color="#ffffff" />}
      pos={(i) => {
        const y = 12 - ((t * (0.6 + rnd(i) * 0.6) + rnd(i + 1) * 12) % 12);
        return [(rnd(i + 2) - 0.5) * 22 + Math.sin(t + i) * 0.3, y, (rnd(i + 3) - 0.7) * 20];
      }}
    />
  </>
);

/* ================================================================ 3 · MARTE */
const Marte: React.FC<PropsE> = ({t}) => (
  <>
    <Cielo arriba="#2a1020" horizonte="#d87a4a" />
    <fog attach="fog" args={['#b8603a', 16, 75]} />
    <Luces sol={[10, 8, 4]} color="#ffd0a0" int={2.4} cielo="#ff9a6a" suelo="#6a2a14" amb={0.9} />
    <Suelo c="#b8522a" />
    {/* lunas Fobos y Deimos */}
    <Bola rad={4} p={[-30, 40, -110]} c="#d8c8b8" em="#9a8a7a" emI={0.6} />
    <Bola rad={2} p={[35, 30, -120]} c="#c8b8a8" em="#8a7a6a" emI={0.6} />
    {/* cráteres */}
    {[[-4, -5, 2.2], [5, -9, 3], [-9, -16, 4], [2.8, 2, 1]].map(([x, z, r], i) => (
      <Toro key={i} rad={r} tubo={r * 0.18} p={[x, 0, z]} r={[Math.PI / 2, 0, 0]} s={[1, 1, 0.45]} c="#a8481f" />
    ))}
    {/* rocas */}
    {[...Array(26)].map((_, i) => {
      const a = rnd(i) * Math.PI * 2;
      const d = 3 + rnd(i + 7) * 20;
      return <Roca key={i} rad={0.2 + rnd(i + 3) * (d > 10 ? 1.6 : 0.6)} p={[Math.cos(a) * d, 0.1, -Math.abs(Math.sin(a)) * d]} r={[rnd(i), rnd(i + 1) * 3, 0]} c={i % 3 ? '#8a3a1c' : '#6a2e18'} />;
    })}
    {/* montes lejanos */}
    {[...Array(6)].map((_, i) => (
      <Cono key={i} rad={10 + rnd(i) * 8} h={6 + rnd(i + 2) * 8} seg={7} p={[(i - 2.5) * 22, 2, -60 - rnd(i) * 15]} c="#9a4224" plano />
    ))}
    {/* base con cúpula */}
    <group position={[-4.5, 0, -6]}>
      <Cil ra={3} h={0.4} p={[0, 0.2, 0]} c="#c8ccd6" met={0.6} rug={0.35} />
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[2.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#9ad8ff" transparent opacity={0.35} roughness={0.05} metalness={0.2} />
      </mesh>
      <Bola rad={0.9} p={[0, 0.8, 0]} c="#3a9a4a" />
      <Cil ra={0.12} h={0.6} p={[0, 0.7, 0]} c="#6a4a2a" />
      <Caja t={[1.6, 1.2, 1.2]} p={[3.4, 0.6, 0.8]} c="#e8ecf2" met={0.5} rug={0.4} />
      <Cil ra={0.04} h={2.4} p={[3.4, 2.4, 0.8]} c="#c8ccd6" />
      <group position={[3.4, 3.6, 0.8]} rotation={[0.6, t * 0.5, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.8, 24, 8, 0, Math.PI * 2, 0, Math.PI / 3.2]} />
          <Mat c="#f2f4f8" met={0.5} rug={0.3} doble />
        </mesh>
      </group>
      <Bola rad={0.08} p={[3.4, 3.9, 0.8]} c="#ff3a2a" em="#ff3a2a" emI={Math.sin(t * 6) > 0 ? 3 : 0.2} />
    </group>
    {/* rover */}
    <group position={[3.6 - Math.sin(t * 0.3) * 0.6, 0, -2.6]} rotation={[0, -0.9, 0]}>
      <Caja t={[1.6, 0.4, 1]} p={[0, 0.6, 0]} c="#e8ecf2" met={0.6} rug={0.3} />
      <Caja t={[1.4, 0.04, 1.1]} p={[0, 0.84, 0]} c="#1a3a8a" met={0.4} rug={0.2} />
      {[-0.6, 0, 0.6].flatMap((x) =>
        [-0.6, 0.6].map((z) => (
          <group key={`${x}${z}`} position={[x, 0.24, z]} rotation={[Math.PI / 2, 0, -t * 1.2]}>
            <Cil ra={0.22} h={0.16} c="#2a2a30" rug={0.9} />
          </group>
        )),
      )}
      <Cil ra={0.03} h={0.7} p={[0.6, 1.2, 0]} c="#c8ccd6" />
      <Caja t={[0.3, 0.18, 0.2]} p={[0.6, 1.6, 0]} c="#2a2a30" />
      <Cil ra={0.05} h={0.04} p={[0.76, 1.6, 0]} r={[0, 0, Math.PI / 2]} c="#5ad8ff" em="#5ad8ff" emI={2} />
    </group>
    {/* polvo en suspensión */}
    <Instancias
      n={160}
      geo={<sphereGeometry args={[0.03, 5, 4]} />}
      mat={<meshBasicMaterial color="#ffc8a0" transparent opacity={0.6} />}
      pos={(i) => [((rnd(i) - 0.5) * 20 + t * 0.6 * (0.5 + rnd(i + 1))) % 10, rnd(i + 2) * 4, (rnd(i + 3) - 0.6) * 14]}
    />
  </>
);

/* ================================================================ 4 · EGIPTO */
const Egipto: React.FC<PropsE> = ({t}) => (
  <>
    <Cielo arriba="#2a6ad8" horizonte="#ffe0a0" />
    <fog attach="fog" args={['#f2d8a8', 20, 110]} />
    <Luces sol={[12, 14, 2]} color="#fff2d0" int={2.8} cielo="#a8c8ff" suelo="#e8b860" amb={1} />
    <Suelo c="#e8c27a" />
    {/* dunas */}
    {[...Array(8)].map((_, i) => (
      <Bola key={i} rad={8 + rnd(i) * 6} p={[(i - 3.5) * 14, -6, -30 - rnd(i + 1) * 20]} s={[1.6, 0.6, 1]} c="#e2b468" rug={1} sombra={false} />
    ))}
    {/* pirámides (conos de 4 caras) */}
    {[
      [-14, -38, 14],
      [4, -48, 18],
      [20, -40, 10],
    ].map(([x, z, s], i) => (
      <group key={i} position={[x, (s * 0.9) / 2, z]} rotation={[0, Math.PI / 4 + i * 0.2, 0]}>
        <Cono rad={s * 0.8} h={s * 0.9} seg={4} c="#d8a860" plano rug={1} />
        <Cono rad={s * 0.12} h={s * 0.135} seg={4} p={[0, s * 0.385, 0]} c="#ffd860" met={0.9} rug={0.25} plano />
      </group>
    ))}
    {/* templo: columnas con bandas de colores */}
    <group position={[-4.5, 0, -5]} rotation={[0, 0.5, 0]}>
      <Caja t={[7, 0.4, 3.6]} p={[0, 0.2, 0]} c="#d8b47a" />
      {[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
        <group key={x} position={[x, 0.4, 1.2]}>
          <Cil ra={0.38} rb={0.42} h={4} p={[0, 2, 0]} c="#e8cc94" />
          {[1.2, 2.8].map((y) => (
            <Cil key={y} ra={0.43} h={0.18} p={[0, y, 0]} c={y > 2 ? '#2a7ab8' : '#c84a2a'} />
          ))}
          <Cil ra={0.6} rb={0.4} h={0.5} p={[0, 4.2, 0]} c="#3aa868" />
        </group>
      ))}
      <Caja t={[7.2, 0.6, 1.4]} p={[0, 4.75, 1.2]} c="#d8b47a" />
      <Caja t={[7.2, 0.15, 1.42]} p={[0, 4.6, 1.2]} c="#2a7ab8" />
      <Caja t={[6.6, 4.4, 0.4]} p={[0, 2.6, -1]} c="#caa46a" />
    </group>
    {/* obelisco */}
    <group position={[4.2, 0, -4]}>
      <Caja t={[1.4, 0.4, 1.4]} p={[0, 0.2, 0]} c="#caa46a" />
      <Cil ra={0.38} rb={0.55} h={6} seg={4} p={[0, 3.4, 0]} r={[0, Math.PI / 4, 0]} c="#d8b47a" plano />
      <Cono rad={0.54} h={0.8} seg={4} p={[0, 6.8, 0]} r={[0, Math.PI / 4, 0]} c="#ffd860" met={0.9} rug={0.25} plano />
    </group>
    <Palmera p={[7.5, 0, -8]} h={5} giro={2} t={t} />
    <Palmera p={[-9, 0, -11]} h={5.5} giro={0.5} t={t + 2} />
    {/* vasijas y escarabajo dorado */}
    {[0, 1, 2].map((i) => (
      <group key={i} position={[2 + i * 0.7, 0, 1 - i * 0.5]}>
        <Bola rad={0.3} p={[0, 0.3, 0]} s={[1, 1.2, 1]} c={['#c8642a', '#2a7ab8', '#b8862a'][i]} />
        <Cil ra={0.12} rb={0.16} h={0.2} p={[0, 0.7, 0]} c={['#c8642a', '#2a7ab8', '#b8862a'][i]} />
      </group>
    ))}
    {/* calima: partículas de arena */}
    <Instancias
      n={140}
      geo={<sphereGeometry args={[0.025, 5, 4]} />}
      mat={<meshBasicMaterial color="#fff0c8" transparent opacity={0.7} />}
      pos={(i) => [(((rnd(i) * 24 + t * (1 + rnd(i + 1))) % 24) - 12), 0.1 + rnd(i + 2) * 2.5, (rnd(i + 3) - 0.6) * 14]}
    />
  </>
);

/* ================================================================ 5 · FERIA */
const Feria: React.FC<PropsE> = ({t}) => {
  const giro = t * 0.35;
  return (
    <>
      <Cielo arriba="#0a0628" horizonte="#5a2a7a" />
      <fog attach="fog" args={['#2a1648', 14, 70]} />
      <Luces sol={[-4, 10, 8]} color="#c8b0ff" int={0.9} cielo="#6a4aff" suelo="#2a1a3a" amb={0.8} />
      <pointLight position={[0, 4, 3]} color="#ffb85a" intensity={30} distance={14} />
      <pointLight position={[-6, 6, -6]} color="#ff4ab8" intensity={60} distance={20} />
      <Suelo c="#3a2a40" rug={0.6} />
      {/* estrellas */}
      <Instancias n={240} geo={<sphereGeometry args={[0.12, 4, 3]} />} mat={<meshBasicMaterial color="#ffffff" fog={false} />} pos={(i) => [(rnd(i) - 0.5) * 220, 20 + rnd(i + 1) * 70, -100 - rnd(i + 2) * 40]} />
      {/* noria */}
      <group position={[-5, 7.5, -10]}>
        <Caja t={[0.3, 8, 0.3]} p={[-1.5, -3.8, 0]} r={[0, 0, -0.2]} c="#e8e0f0" met={0.4} />
        <Caja t={[0.3, 8, 0.3]} p={[1.5, -3.8, 0]} r={[0, 0, 0.2]} c="#e8e0f0" met={0.4} />
        <group rotation={[0, 0, giro]}>
          <Toro rad={6} tubo={0.1} c="#ffffff" em="#ff6ad8" emI={1.5} seg={64} />
          <Toro rad={5.6} tubo={0.06} c="#ffffff" em="#5ad8ff" emI={1.5} seg={64} />
          {[...Array(12)].map((_, i) => (
            <Caja key={i} t={[0.06, 12, 0.06]} r={[0, 0, (i / 12) * Math.PI]} c="#d8d0e8" />
          ))}
          {[...Array(24)].map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return <Bola key={i} rad={0.12} p={[Math.cos(a) * 6, Math.sin(a) * 6, 0.12]} c="#ffe08a" em="#ffd23a" emI={Math.sin(t * 5 + i) > 0 ? 3 : 1} sombra={false} />;
          })}
        </group>
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + giro;
          return (
            <group key={i} position={[Math.cos(a) * 6, Math.sin(a) * 6 - 0.7, 0]}>
              <Caja t={[1, 0.8, 0.8]} c={['#ff4a6a', '#ffd23a', '#4ad8ff', '#8aff5a'][i % 4]} rug={0.4} />
              <Cono rad={0.7} h={0.4} seg={4} p={[0, 0.6, 0]} r={[0, Math.PI / 4, 0]} c="#f4f0ff" />
            </group>
          );
        })}
      </group>
      {/* carpa de circo con gajos de colores */}
      <group position={[5, 0, -7]}>
        {[...Array(12)].map((_, i) => (
          <React.Fragment key={i}>
            <Cono rad={4} h={3} seg={4} ti={(i / 12) * Math.PI * 2} tl={(Math.PI * 2) / 12} p={[0, 4.5, 0]} c={i % 2 ? '#f4f0ea' : '#e8243a'} doble />
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[4, 4, 3, 2, 1, true, (i / 12) * Math.PI * 2, (Math.PI * 2) / 12]} />
              <Mat c={i % 2 ? '#e8243a' : '#f4f0ea'} doble />
            </mesh>
          </React.Fragment>
        ))}
        <Cil ra={0.06} h={1.4} p={[0, 6.6, 0]} c="#ffd23a" />
        <Caja t={[0.02, 0.5, 0.8]} p={[0, 7, 0.4]} r={[0, Math.PI / 2, Math.sin(t * 3) * 0.2]} c="#ffd23a" />
        <Caja t={[1.6, 2.2, 0.1]} p={[0, 1.1, 4]} c="#1a0a20" />
      </group>
      {/* guirnalda de bombillas */}
      {[...Array(18)].map((_, i) => {
        const x = -7 + i * 0.85;
        const y = 4.6 - Math.sin((i / 17) * Math.PI) * 1.2;
        return <Bola key={i} rad={0.1} p={[x, y, -2.5]} c="#ffe8a0" em={['#ffd23a', '#ff4a8a', '#5ad8ff'][i % 3]} emI={2.5} sombra={false} />;
      })}
      <Cil ra={0.08} h={4.8} p={[-7.2, 2.4, -2.5]} c="#c8c0d8" />
      <Cil ra={0.08} h={4.8} p={[7.6, 2.4, -2.5]} c="#c8c0d8" />
      {/* globos que flotan */}
      {[...Array(6)].map((_, i) => (
        <group key={i} position={[-2 + i * 0.8, 2.5 + Math.sin(t * 1.5 + i) * 0.2 + i * 0.2, -1.5 - (i % 2)]}>
          <Bola rad={0.3} s={[1, 1.15, 1]} c={['#ff3a5a', '#ffd23a', '#3ad8ff', '#8a5aff', '#5aff8a', '#ff8a3a'][i]} rug={0.25} />
          <Cil ra={0.006} h={1.6} p={[0, -1.1, 0]} c="#ffffff" sombra={false} />
        </group>
      ))}
      {/* puesto de palomitas */}
      <group position={[3, 0, 0.5]} rotation={[0, -0.6, 0]}>
        <Caja t={[1.6, 1.2, 1]} p={[0, 0.6, 0]} c="#e8243a" />
        <Caja t={[1.5, 0.9, 0.9]} p={[0, 1.65, 0]} c="#ffffff" op={0.3} />
        <Instancias n={60} geo={<sphereGeometry args={[0.06, 6, 4]} />} mat={<meshStandardMaterial color="#fff6d8" />} pos={(i) => [(rnd(i) - 0.5) * 1.3, 1.3 + rnd(i + 1) * 0.4, (rnd(i + 2) - 0.5) * 0.7]} />
        {[-0.7, 0.7].map((x) => (
          <Cil key={x} ra={0.04} h={1} p={[x, 1.7, 0.42]} c="#ffd23a" />
        ))}
        <Cono rad={1.2} h={0.5} seg={4} p={[0, 2.45, 0]} r={[0, Math.PI / 4, 0]} c="#ffd23a" />
      </group>
    </>
  );
};

/* ================================================================ 6 · PAÍS DE LAS GOLOSINAS */
const Piruleta: React.FC<{p: V3; s?: number; colores: [string, string]; giro?: number}> = ({p, s = 1, colores, giro = 0}) => (
  <group position={p} scale={s} rotation={[0, giro, 0]}>
    <Cil ra={0.06} h={3} p={[0, 1.5, 0]} c="#ffffff" />
    <group position={[0, 3.6, 0]}>
      {[...Array(6)].map((_, i) => (
        <Toro key={i} rad={0.12 + i * 0.13} tubo={0.075} c={colores[i % 2]} rug={0.2} />
      ))}
    </group>
  </group>
);
const Golosinas: React.FC<PropsE> = ({t}) => (
  <>
    <Cielo arriba="#ff9ad8" horizonte="#fff0c8" />
    <fog attach="fog" args={['#ffd8ee', 16, 80]} />
    <Luces sol={[6, 12, 8]} color="#fff4f8" int={2.2} cielo="#ffc8f0" suelo="#ff9ac8" amb={1.4} />
    <Suelo c="#ffb8de" rug={0.5} />
    {/* nubes de algodón de azúcar */}
    {[...Array(7)].map((_, i) => (
      <group key={i} position={[(i - 3) * 14 + Math.sin(t * 0.2 + i) * 2, 16 + rnd(i) * 8, -40 - rnd(i + 2) * 20]}>
        {[0, 1, 2, 3].map((k) => (
          <Bola key={k} rad={2 + rnd(i * 4 + k) * 1.5} p={[(k - 1.5) * 2.2, rnd(k + i) * 1.2, 0]} c={i % 2 ? '#ffffff' : '#c8f0ff'} rug={1} sombra={false} />
        ))}
      </group>
    ))}
    {/* río de chocolate */}
    <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[0, 0.02, -7]} receiveShadow>
      <planeGeometry args={[80, 3.2]} />
      <meshStandardMaterial color="#5a2a14" roughness={0.15} metalness={0.2} />
    </mesh>
    <Piruleta p={[-3.5, 0, -3]} colores={['#ff3a6a', '#ffffff']} giro={0.3} />
    <Piruleta p={[4, 0, -4]} colores={['#3ab8ff', '#ffffff']} s={1.3} giro={-0.4} />
    <Piruleta p={[-8, 0, -12]} colores={['#8aff5a', '#ffd23a']} s={1.8} />
    <Piruleta p={[9, 0, -14]} colores={['#c85aff', '#ffffff']} s={2} />
    {/* bastón de caramelo */}
    <group position={[2.5, 0, -1.6]} rotation={[0, -0.6, 0]}>
      {[...Array(10)].map((_, i) => (
        <Cil key={i} ra={0.16} h={0.32} p={[0, 0.16 + i * 0.32, 0]} r={[0, i * 0.4, 0]} c={i % 2 ? '#ffffff' : '#e8243a'} rug={0.25} />
      ))}
      <group position={[-0.5, 3.2, 0]}>
        {[...Array(8)].map((_, i) => (
          <Toro key={i} rad={0.5} tubo={0.16} arco={Math.PI / 8 + 0.02} r={[0, 0, (i * Math.PI) / 8]} c={i % 2 ? '#ffffff' : '#e8243a'} rug={0.25} seg={12} />
        ))}
      </group>
    </group>
    {/* magdalena gigante */}
    <group position={[-5.5, 0, -7.5]} scale={1.6}>
      <Cil ra={1.4} rb={1.1} h={1.2} seg={20} p={[0, 0.6, 0]} c="#ffd28a" plano />
      <Bola rad={1.45} p={[0, 1.3, 0]} s={[1, 0.6, 1]} c="#ff8ac8" rug={0.4} />
      <Bola rad={1} p={[0, 1.8, 0]} s={[1, 0.6, 1]} c="#ffb0dc" rug={0.4} />
      <Bola rad={0.35} p={[0, 2.35, 0]} c="#e8243a" rug={0.2} />
      <Instancias
        n={40}
        geo={<capsuleGeometry args={[0.03, 0.12, 4, 6]} />}
        mat={<meshStandardMaterial roughness={0.4} />}
        pos={(i) => {
          const a = rnd(i) * Math.PI * 2;
          const r = 0.5 + rnd(i + 1) * 0.8;
          return [Math.cos(a) * r, 1.6 + (1.3 - r) * 0.35, Math.sin(a) * r];
        }}
        color={(i) => ['#ffd23a', '#3ab8ff', '#8aff5a', '#ffffff', '#c85aff'][i % 5]}
      />
    </group>
    {/* gominolas */}
    {[...Array(14)].map((_, i) => {
      const a = rnd(i) * Math.PI - Math.PI;
      const d = 2.5 + rnd(i + 3) * 6;
      return (
        <group key={i} position={[Math.cos(a) * d, 0, Math.sin(a) * d * 0.8]}>
          <Bola rad={0.35} p={[0, 0.2, 0]} s={[1, 1.1, 1]} c={['#ff3a5a', '#ffd23a', '#3ad85a', '#ff8a2a', '#8a5aff'][i % 5]} op={0.85} rug={0.15} />
        </group>
      );
    })}
    {/* caramelos envueltos que flotan */}
    {[...Array(5)].map((_, i) => (
      <group key={i} position={[-3 + i * 1.6, 3.4 + Math.sin(t * 1.3 + i * 1.7) * 0.35, -2.5 - (i % 2) * 2]} rotation={[0.3, t * 0.8 + i, 0.4]}>
        <Bola rad={0.22} s={[1.3, 1, 1]} c={['#ff3a6a', '#3ab8ff', '#ffd23a', '#8aff5a', '#c85aff'][i]} rug={0.15} />
        <Cono rad={0.16} h={0.22} p={[0.36, 0, 0]} r={[0, 0, Math.PI / 2]} c={['#ff3a6a', '#3ab8ff', '#ffd23a', '#8aff5a', '#c85aff'][i]} rug={0.2} />
        <Cono rad={0.16} h={0.22} p={[-0.36, 0, 0]} r={[0, 0, -Math.PI / 2]} c={['#ff3a6a', '#3ab8ff', '#ffd23a', '#8aff5a', '#c85aff'][i]} rug={0.2} />
      </group>
    ))}
  </>
);

/* ================================================================ 7 · LEJANO OESTE */
const Cactus: React.FC<{p: V3; s?: number; g?: number}> = ({p, s = 1, g = 0}) => (
  <group position={p} scale={s} rotation={[0, g, 0]}>
    <Capsula rad={0.3} largo={2.4} p={[0, 1.5, 0]} c="#3a8a3a" />
    <Capsula rad={0.2} largo={0.7} p={[0.55, 1.9, 0]} c="#3a8a3a" />
    <Capsula rad={0.2} largo={0.6} p={[0.35, 1.45, 0]} r={[0, 0, Math.PI / 2]} c="#3a8a3a" />
    <Capsula rad={0.18} largo={0.6} p={[-0.5, 1.6, 0]} c="#3a8a3a" />
    <Capsula rad={0.18} largo={0.4} p={[-0.32, 1.2, 0]} r={[0, 0, Math.PI / 2]} c="#3a8a3a" />
    <Bola rad={0.12} p={[0, 2.95, 0]} c="#ff5a8a" />
  </group>
);
const Oeste: React.FC<PropsE> = ({t}) => (
  <>
    <Cielo arriba="#3a2a6a" horizonte="#ff9a4a" />
    <fog attach="fog" args={['#e8945a', 18, 90]} />
    <Luces sol={[-6, 7, 10]} color="#ffb070" int={2.8} cielo="#ffc8a0" suelo="#a85a2a" amb={1.3} />
    <Suelo c="#d8945a" />
    <Bola rad={9} p={[-40, 8, -120]} c="#ffd08a" em="#ff9a3a" emI={1.4} />
    {/* mesetas */}
    {[...Array(5)].map((_, i) => (
      <group key={i} position={[(i - 2) * 26 + rnd(i) * 8, 0, -55 - rnd(i + 1) * 20]}>
        <Cil ra={6 + rnd(i) * 5} rb={8 + rnd(i) * 5} h={10 + rnd(i + 2) * 8} seg={9} p={[0, 6, 0]} c="#b8582a" plano />
        <Cil ra={6.2 + rnd(i) * 5} h={1} seg={9} p={[0, 11 + rnd(i + 2) * 4, 0]} c="#a84a24" plano />
      </group>
    ))}
    {/* saloon */}
    <group position={[-3.8, 0, -6]} rotation={[0, 0.45, 0]}>
      <Caja t={[6, 4.6, 4]} p={[0, 2.3, 0]} c="#9a5a2a" />
      <Caja t={[6.4, 1.6, 0.2]} p={[0, 5.2, 2]} c="#8a4a20" />
      <Caja t={[3.6, 0.8, 0.1]} p={[0, 5.2, 2.12]} c="#f2e0b0" />
      {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => (
        <Caja key={x} t={[0.36, 0.5, 0.05]} p={[x, 5.2, 2.18]} c="#5a2a14" s={[1, i === 2 ? 1.1 : 1, 1]} />
      ))}
      {/* porche */}
      <Caja t={[6.6, 0.15, 1.8]} p={[0, 3, 2.9]} c="#7a4018" />
      {[-3, -1, 1, 3].map((x) => (
        <Cil key={x} ra={0.1} h={3} p={[x, 1.5, 3.7]} c="#6a3818" />
      ))}
      <Caja t={[6.6, 0.25, 1.8]} p={[0, 0.12, 2.9]} c="#7a4018" />
      {/* puertas batientes y ventanas iluminadas */}
      <Caja t={[0.6, 1, 0.05]} p={[-0.32, 1.3, 2.03]} r={[0, Math.sin(t * 2) * 0.3, 0]} c="#c88a4a" />
      <Caja t={[0.6, 1, 0.05]} p={[0.32, 1.3, 2.03]} r={[0, -Math.sin(t * 2) * 0.3, 0]} c="#c88a4a" />
      {[-2, 2].map((x) => (
        <Caja key={x} t={[1, 1, 0.05]} p={[x, 1.6, 2.03]} c="#ffd08a" em="#ffa83a" emI={1.2} />
      ))}
      {/* barril y abrevadero */}
      <Cil ra={0.4} h={0.9} p={[3.6, 0.45, 2.6]} c="#7a4a24" />
      <Toro rad={0.4} tubo={0.03} p={[3.6, 0.7, 2.6]} r={[Math.PI / 2, 0, 0]} c="#3a3a3a" />
    </group>
    {/* depósito de agua */}
    <group position={[5.5, 0, -9]}>
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Cil key={`${x}${z}`} ra={0.12} h={4} p={[x, 2, z]} c="#6a3818" />))}
      <Cil ra={1.6} h={2.2} p={[0, 5.1, 0]} c="#8a5428" />
      <Cono rad={1.8} h={0.9} p={[0, 6.65, 0]} c="#6a3818" />
    </group>
    <Cactus p={[3.2, 0, -2.5]} s={0.9} g={-0.4} />
    <Cactus p={[-7, 0, -1.5]} s={1.1} g={0.8} />
    <Cactus p={[9, 0, -5]} s={1.4} g={2} />
    {/* bola de rastrojos que rueda */}
    <group position={[-6 + ((t * 2.2) % 14), 0.45 + Math.abs(Math.sin(t * 4)) * 0.3, 1.5]} rotation={[0, 0, -t * 4]}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial color="#a87a3a" wireframe />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color="#8a6028" wireframe />
      </mesh>
    </group>
    {/* valla */}
    {[...Array(7)].map((_, i) => (
      <Caja key={i} t={[0.12, 1, 0.12]} p={[3 + i * 1.2, 0.5, 0.2 - i * 0.3]} c="#7a4a24" />
    ))}
    <Caja t={[7.5, 0.1, 0.06]} p={[6.6, 0.75, -0.7]} r={[0, 0.25, 0]} c="#7a4a24" />
    <Caja t={[7.5, 0.1, 0.06]} p={[6.6, 0.4, -0.7]} r={[0, 0.25, 0]} c="#7a4a24" />
  </>
);

/* ================================================================ 8 · ESTADIO */
const Estadio: React.FC<PropsE> = ({t}) => {
  const filas = 9;
  const porFila = 70;
  return (
    <>
      <Cielo arriba="#050818" horizonte="#1a2a4a" />
      <fog attach="fog" args={['#14203a', 22, 90]} />
      <Luces sol={[0, 16, 10]} color="#f0f6ff" int={2.6} cielo="#9ab8ff" suelo="#2a5a2a" amb={0.9} />
      <Suelo c="#2a2e38" />
      {/* césped con franjas */}
      {[...Array(12)].map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 6 - i * 3]} receiveShadow>
          <planeGeometry args={[40, 3]} />
          <meshStandardMaterial color={i % 2 ? '#2f9a3a' : '#38ac44'} roughness={0.95} />
        </mesh>
      ))}
      {/* líneas: área y círculo central */}
      <Toro rad={4} tubo={0.05} p={[0, 0.03, -6]} r={[Math.PI / 2, 0, 0]} c="#ffffff" sombra={false} seg={64} />
      <Caja t={[40, 0.02, 0.1]} p={[0, 0.03, -6]} c="#ffffff" sombra={false} />
      <Caja t={[0.1, 0.02, 12]} p={[-7, 0.03, 1]} c="#ffffff" sombra={false} />
      {/* portería */}
      <group position={[7.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Cil ra={0.07} h={2.4} p={[-3.6, 1.2, 0]} c="#ffffff" rug={0.3} />
        <Cil ra={0.07} h={2.4} p={[3.6, 1.2, 0]} c="#ffffff" rug={0.3} />
        <Cil ra={0.07} h={7.3} p={[0, 2.4, 0]} r={[0, 0, Math.PI / 2]} c="#ffffff" rug={0.3} />
        <mesh position={[0, 1.2, -1]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[7.2, 2.6, 36, 13]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 3.6, 1.2, -0.5]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.2, 2.4, 6, 12]} />
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
      {/* gradas con público que se mueve */}
      <group position={[0, 0, -22]}>
        {[...Array(filas)].map((_, f) => (
          <Caja key={f} t={[64, 0.8, 1.4]} p={[0, 0.4 + f * 0.8, f * -1.4]} c={f % 2 ? '#2a3a6a' : '#22305a'} />
        ))}
        <Instancias
          n={filas * porFila}
          geo={<boxGeometry args={[0.45, 0.7, 0.35]} />}
          mat={<meshStandardMaterial roughness={0.8} />}
          pos={(i) => {
            const f = Math.floor(i / porFila);
            const k = i % porFila;
            const ola = Math.max(0, Math.sin(k * 0.18 - t * 4)) ** 4 * 0.45;
            return [(k - porFila / 2) * 0.88 + rnd(i) * 0.2, 1.15 + f * 0.8 + ola + Math.abs(Math.sin(t * 6 + i)) * 0.05, f * -1.4];
          }}
          color={(i) => ['#e8243a', '#ffffff', '#ffd23a', '#2a5ad8', '#e8243a', '#f4c8a0', '#8a5a3a'][Math.floor(rnd(i) * 7)]}
        />
      </group>
      {/* torres de focos */}
      {[-16, 16].map((x) => (
        <group key={x} position={[x, 0, -18]}>
          <Cil ra={0.25} h={16} p={[0, 8, 0]} c="#9aa0b0" met={0.6} rug={0.4} />
          <Caja t={[3.6, 2.2, 0.4]} p={[0, 16.5, 0]} r={[0.35, x > 0 ? -0.5 : 0.5, 0]} c="#ffffff" em="#ffffff" emI={3} />
          <pointLight position={[0, 15, 3]} intensity={120} distance={45} color="#eef4ff" />
        </group>
      ))}
      {/* marcador */}
      <group position={[0, 12, -36]}>
        <Caja t={[10, 3.6, 0.5]} c="#101420" />
        <Caja t={[3.2, 2.4, 0.1]} p={[-2.6, 0, 0.3]} c="#000" em="#ff3a3a" emI={1.5} />
        <Caja t={[3.2, 2.4, 0.1]} p={[2.6, 0, 0.3]} c="#000" em="#3a8aff" emI={1.5} />
      </group>
      {/* confeti */}
      <Instancias
        n={260}
        geo={<planeGeometry args={[0.08, 0.12]} />}
        mat={<meshBasicMaterial side={THREE.DoubleSide} />}
        pos={(i) => [(rnd(i) - 0.5) * 18, 9 - ((t * (0.8 + rnd(i + 1)) + rnd(i + 2) * 9) % 9), (rnd(i + 3) - 0.7) * 14]}
        color={(i) => ['#ff3a5a', '#ffd23a', '#3ad8ff', '#ffffff'][i % 4]}
      />
    </>
  );
};

export type Escenario3D = {
  nombre: string;
  detalle: string;
  C: React.FC<PropsE>;
  /** dónde mira la cámara y a qué distancia/altura suele colocarse */
  foco: V3;
  dist: number;
  altura: number;
  /** atrezo propio que lleva el personaje en este escenario (balón, etc.) */
  extra?: React.FC<PropsE>;
};

/** Balón de fútbol que el futbolista toca con el pie. */
const Balon: React.FC<PropsE> = ({t}) => {
  const b = Math.abs(Math.sin(t * Math.PI * 1.1));
  return (
    <group position={[0.55, 0.22 + b * 0.9, 0.55]} rotation={[t * 5, t * 2, 0]}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} flatShading />
      </mesh>
      <mesh scale={1.005}>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#1a1a1a" wireframe />
      </mesh>
    </group>
  );
};

export const ESCENARIOS_3D = {
  isla: {nombre: 'Isla pirata', detalle: 'mar · palmeras · cofre · galeón', C: IslaPirata, foco: [0, 1.9, 0], dist: 8.2, altura: 2.7},
  polo: {nombre: 'Polo Norte', detalle: 'iglú · icebergs · aurora · nieve', C: PoloNorte, foco: [0, 1.9, 0], dist: 8.2, altura: 2.7},
  marte: {nombre: 'Marte', detalle: 'cúpula · rover · cráteres · lunas', C: Marte, foco: [0, 1.9, 0], dist: 8.2, altura: 2.7},
  egipto: {nombre: 'Antiguo Egipto', detalle: 'pirámides · templo · obelisco', C: Egipto, foco: [0, 1.9, 0], dist: 8.2, altura: 2.7},
  feria: {nombre: 'Feria nocturna', detalle: 'noria · carpa · guirnaldas · globos', C: Feria, foco: [0, 1.9, 0], dist: 8.2, altura: 2.7},
  golosinas: {nombre: 'País de las golosinas', detalle: 'piruletas · río de chocolate', C: Golosinas, foco: [0, 1.9, 0], dist: 8.2, altura: 2.7},
  oeste: {nombre: 'Lejano Oeste', detalle: 'saloon · cactus · mesetas', C: Oeste, foco: [0, 1.9, 0], dist: 8.2, altura: 2.7},
  estadio: {nombre: 'Estadio', detalle: 'césped · portería · público · focos', C: Estadio, foco: [0, 1.9, 0], dist: 8.2, altura: 2.7, extra: Balon},
} satisfies Record<string, Escenario3D>;

export type NombreEscenario3D = keyof typeof ESCENARIOS_3D;
