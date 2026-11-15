import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {Bola, Caja, Capsula, Cil, Cono, Toro, rnd, V3} from './base';
import {
  Agua,
  CieloDegradado,
  CieloFisico,
  crestas,
  dirSol,
  fbm,
  geoRoca,
  Hierba,
  llano,
  mezclaC,
  Nubes,
  rgb,
  RocaReal,
  Sol,
  suaveEntre,
  Terreno,
  TEX,
  textura,
} from './realismo';

/**
 * 8 escenarios 3D realistas, todo procedural: terreno con relieve y texturas generadas, cielo con
 * dispersión atmosférica física o degradado nocturno con estrellas, luz de entorno (reflejos),
 * agua con reflejos reales, hierba que se mueve con el viento, rocas irregulares, nubes, niebla
 * exponencial y postprocesado (oclusión ambiental, resplandor, profundidad de campo, viñeta, grano).
 * El personaje está en el origen sobre una zona llana; `t` = segundos.
 */

type PropsE = {t: number};

/* =================================================================== piezas comunes */

/** Muchos objetos iguales en una sola llamada de dibujo. */
const Instancias: React.FC<{
  n: number;
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  pos: (i: number) => V3;
  esc?: (i: number) => number | V3;
  rot?: (i: number) => V3;
  color?: (i: number) => string;
  sombra?: boolean;
}> = ({n, geo, mat, pos, esc, rot, color, sombra}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const m = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      m.position.set(...pos(i));
      const s = esc ? esc(i) : 1;
      if (typeof s === 'number') m.scale.setScalar(s);
      else m.scale.set(...s);
      if (rot) m.rotation.set(...rot(i));
      m.updateMatrix();
      im.setMatrixAt(i, m.matrix);
      if (color) im.setColorAt(i, col.set(color(i)));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} castShadow={sombra} receiveShadow frustumCulled={false} />;
};

const memo = <T,>(f: () => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};

/** Material reutilizable (para instancias). */
const matStd = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

const TEX_CORTEZA = () =>
  textura('corteza', 256, (u, v) => {
    const anillo = Math.abs(Math.sin(v * Math.PI * 14 + fbm(u * 4, v * 4, 3, 4) * 1.5));
    return anillo ** 0.4 * 0.6 + fbm(u * 16, v * 16, 3, 16) * 0.25;
  }, (u, v, h) => {
    const k = 0.55 + h * 0.5;
    return [150 * k, 112 * k, 78 * k];
  }, 3);

/** Hoja de palmera: raquis curvado con decenas de foliolos. */
const geoFronda = memo(() => {
  const pos: number[] = [];
  const col: number[] = [];
  const N = 28;
  const L = 2.8;
  for (let i = 1; i < N; i++) {
    const s = i / N;
    const x = s * L;
    const y = -s * s * 1.3;
    const l = 0.15 + 0.85 * Math.sin(Math.PI * Math.min(1, s * 1.15)) ** 0.7;
    for (const lado of [-1, 1]) {
      const dx = 0.3;
      const dy = -0.55 - s * 0.3;
      const dz = lado;
      const n = Math.hypot(dx, dy, dz);
      const tip: V3 = [x + (dx / n) * l, y + (dy / n) * l, (dz / n) * l];
      pos.push(x - 0.045, y, 0, x + 0.045, y, 0, ...tip);
      const v = 0.75 + rnd(i * 7 + lado) * 0.3;
      const base: V3 = [0.05 * v, 0.16 * v, 0.03 * v];
      const punta: V3 = [0.12 * v, 0.24 * v, 0.04 * v];
      col.push(...base, ...base, ...(s > 0.88 ? [0.3, 0.24, 0.08] : punta));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Array(pos.length / 3).fill([0, 1, 0.2]).flat(), 3));
  return g;
});
const matFronda = memo(() => matStd({vertexColors: true, side: THREE.DoubleSide, roughness: 0.7}));

/** Palmera realista: tronco curvo con anillos y copa de frondas que se mece. */
const Palmera: React.FC<{p: V3; h?: number; giro?: number; t: number; s?: number; incl?: number}> = ({p, h = 6, giro = 0, t, s = 1, incl = 0.25}) => {
  const curva = useMemo(() => {
    const pts = [...Array(6)].map((_, i) => {
      const k = i / 5;
      return new THREE.Vector3(Math.sin(k * 1.4) * incl * h * 0.5, k * h, 0);
    });
    return new THREE.CatmullRomCurve3(pts);
  }, [h, incl]);
  const tronco = useMemo(() => {
    const g = new THREE.TubeGeometry(curva, 24, 0.17, 12, false);
    const p2 = g.attributes.position as THREE.BufferAttribute;
    // se estrecha hacia arriba
    for (let i = 0; i < p2.count; i++) {
      const y = p2.getY(i) / h;
      const c = curva.getPoint(Math.min(1, Math.max(0, y)));
      const k = 1.25 - y * 0.45;
      p2.setX(i, c.x + (p2.getX(i) - c.x) * k);
      p2.setZ(i, c.z + (p2.getZ(i) - c.z) * k);
    }
    g.computeVertexNormals();
    return g;
  }, [curva, h]);
  const top = curva.getPoint(1);
  const tc = TEX_CORTEZA();
  const viento = Math.sin(t * 1.3 + p[0] * 0.7) * 0.06 + Math.sin(t * 2.9 + p[2]) * 0.025;
  return (
    <group position={p} rotation={[0, giro, 0]} scale={s}>
      <mesh geometry={tronco} castShadow receiveShadow>
        <meshStandardMaterial map={tc.map} normalMap={tc.normal} roughness={0.95} />
      </mesh>
      <group position={[top.x, top.y, top.z]} rotation={[0, 0, viento]}>
        {[...Array(14)].map((_, i) => (
          <group key={i} rotation={[0, (i / 14) * Math.PI * 2 + rnd(i) * 0.3, 0.35 - rnd(i * 3) * 0.6 + (i % 3 === 0 ? 0.5 : 0) + viento * (i % 2 ? 2 : -1)]}>
            <mesh geometry={geoFronda()} material={matFronda()} castShadow scale={0.85 + rnd(i * 5) * 0.3} />
          </group>
        ))}
        {[0, 1, 2, 3].map((i) => (
          <Bola key={i} rad={0.13} p={[Math.cos(i * 1.7) * 0.18, -0.18 - (i % 2) * 0.08, Math.sin(i * 1.7) * 0.18]} c="#4a3218" rug={0.6} />
        ))}
      </group>
    </group>
  );
};

/** Abeto con ramas en capas (opcionalmente nevado). */
const Abeto: React.FC<{p: V3; s?: number; nieve?: boolean; g?: number}> = ({p, s = 1, nieve, g = 0}) => (
  <group position={p} scale={s} rotation={[0, g, 0]}>
    <Cil ra={0.12} rb={0.2} h={1.2} p={[0, 0.6, 0]} c="#3a2618" />
    {[...Array(6)].map((_, k) => (
      <group key={k}>
        <Cono rad={1.25 - k * 0.18} h={1.2} seg={9} p={[0, 1.0 + k * 0.62, 0]} r={[0, k * 0.7, 0]} c={k % 2 ? '#173a26' : '#1c4430'} rug={0.9} plano />
        {nieve && <Cono rad={(1.25 - k * 0.18) * 0.82} h={0.45} seg={9} p={[0, 1.42 + k * 0.62, 0]} r={[0, k * 0.7, 0]} c="#eef4ff" rug={0.7} plano />}
      </group>
    ))}
  </group>
);

/* =================================================================== 1 · ISLA PIRATA */

const altIsla = (x: number, z: number) => {
  const r = Math.hypot(x * 0.85, (z + 4) * 1.0) + fbm(x * 0.08, z * 0.08, 3) * 6;
  const forma = 1 - suaveEntre(9, 24, r);
  const colina = Math.max(0, 1 - Math.hypot((x + 4) * 0.12, (z + 16) * 0.12)) ** 1.5 * 7 * (1 + crestas(x * 0.15, z * 0.15, 3) * 0.6);
  const lejos = forma * (fbm(x * 0.15, z * 0.15, 4) * 0.8 + colina);
  return -2.6 + forma * 2.6 + lejos * llano(x, z, 3, 10);
};
const colIsla = (_x: number, _z: number, y: number, pend: number) => {
  const mojada = rgb('#a8834e');
  const arena = rgb('#f2d79c');
  const verde = rgb('#4f7a2e');
  const roca = rgb('#6e6a60');
  let c = mezclaC(mojada, arena, (y + 0.45) * 4);
  c = mezclaC(c, verde, (y - 0.9) * 0.8);
  return mezclaC(c, roca, (pend - 0.25) * 5);
};

const IslaPirata: React.FC<PropsE> = ({t}) => {
  const sol = dirSol(24, 115);
  return (
    <>
      <CieloFisico elev={28} azim={115} turbidez={2.5} rayleigh={2.2} mie={0.004} entorno={0.65} />
      <fogExp2 attach="fog" args={['#a8c8e8', 0.004]} />
      <Sol elev={24} azim={115} int={3.2} cielo="#a8c8ff" suelo="#c8b080" amb={0.3} />
      <Nubes t={t} n={28} />
      <Agua t={t} y={-0.32} sol={sol} color="#04506e" distorsion={2.6} />
      {/* fondo marino claro visto a través del agua junto a la orilla */}
      <Terreno tam={90} seg={220} alt={altIsla} col={colIsla} tex={TEX.arena()} rep={70} centro={[0, 0, -8]} />
      {/* islas lejanas en la bruma */}
      {[[-140, -260, 60, 22], [90, -300, 90, 30], [220, -200, 50, 14]].map(([x, z, s, h], i) => (
        <RocaReal key={i} p={[x, -4, z]} s={[s, h, s * 0.6]} semilla={i + 3} c="#5a7048" />
      ))}
      <Palmera p={[-3.6, altIsla(-3.6, -3), -3]} h={6.5} giro={0.6} t={t} incl={0.35} />
      <Palmera p={[4, altIsla(4, -4.5), -4.5]} h={5.6} giro={2.4} t={t + 1} />
      <Palmera p={[6.4, altIsla(6.4, 0.5), 0.5]} h={4.6} giro={3.4} t={t + 2} incl={0.45} />
      <Palmera p={[-7.5, altIsla(-7.5, -8), -8]} h={7} giro={1.2} t={t + 3} />
      <Palmera p={[1.5, altIsla(1.5, -11), -11]} h={6} giro={4} t={t + 4} />
      <Hierba
        t={t}
        n={9000}
        donde={(i) => {
          const x = (rnd(i * 1.1) - 0.5) * 30;
          const z = -2 - rnd(i * 2.3) * 22;
          const y = altIsla(x, z);
          return y > 0.25 && Math.hypot(x, z) > 2.8 ? [x, z] : null;
        }}
        alt={altIsla}
        colores={['#5a8a2a', '#6a9a34', '#7aa040', '#8a9a3a']}
        altura={[0.25, 0.7]}
      />
      {/* rocas de la orilla */}
      {[[-2.4, 1.8, 0.7], [-1.6, 2.6, 0.4], [-3.4, 2.4, 0.5], [5.2, 3.6, 0.9], [6.2, 4.4, 0.5]].map(([x, z, s], i) => (
        <RocaReal key={i} p={[x, altIsla(x, z) + s * 0.2, z]} s={[s * 1.2, s, s]} r={[0, i * 1.3, 0]} semilla={i} c="#7a766c" />
      ))}
      {/* cofre del tesoro con madera y oro */}
      <group position={[2, 0.32, 1.3]} rotation={[0, -0.5, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 0.55, 0.65]} />
          <meshStandardMaterial map={TEX.madera([120, 74, 40]).map} normalMap={TEX.madera([120, 74, 40]).normal} roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 0.27, -0.12]} rotation={[-0.9, 0, 0]}>
          <cylinderGeometry args={[0.33, 0.33, 1, 20, 1, false, 0, Math.PI]} />
          <meshStandardMaterial map={TEX.madera([120, 74, 40]).map} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {[-0.48, 0.48].map((x) => (
          <Caja key={x} t={[0.05, 0.58, 0.68]} p={[x, 0, 0]} c="#b08a3a" met={1} rug={0.35} />
        ))}
        {[...Array(26)].map((_, i) => (
          <Cil key={i} ra={0.065} h={0.02} p={[-0.38 + rnd(i) * 0.76, 0.28 + rnd(i + 9) * 0.1, -0.22 + rnd(i * 3) * 0.44]} r={[rnd(i) - 0.5, 0, rnd(i + 3) - 0.5]} c="#f5c542" met={1} rug={0.18} />
        ))}
        {[0, 1, 2].map((i) => (
          <Cil key={`s${i}`} ra={0.065} h={0.02} p={[0.7 + i * 0.12, -0.26, 0.3 + rnd(i) * 0.2]} r={[0.2, i, 0.1]} c="#f5c542" met={1} rug={0.18} />
        ))}
      </group>
      {/* galeón fondeado */}
      <group position={[-18, -0.3 + Math.sin(t * 0.9) * 0.08, -34]} rotation={[Math.sin(t * 0.7) * 0.02, 0.7, Math.sin(t * 0.9) * 0.03]}>
        <mesh castShadow>
          <cylinderGeometry args={[1.5, 0.9, 9, 16, 1, false, Math.PI / 2, Math.PI]} />
          <meshStandardMaterial map={TEX.madera([92, 56, 30]).map} normalMap={TEX.madera([92, 56, 30]).normal} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <Caja t={[1.6, 0.15, 8.8]} p={[0, 0.02, 0]} r={[0, 0, 0]} c="#6a4426" />
        <Caja t={[1.8, 1.4, 2.4]} p={[0, 0.7, -3.4]} c="#5c3a1e" />
        {[-1.4, 1.6].map((z, i) => (
          <group key={z} position={[0, 0, z]}>
            <Cil ra={0.1} h={8 - i * 1.2} p={[0, (8 - i * 1.2) / 2, 0]} c="#3a2614" />
            {[0, 1, 2].map((k) => (
              <mesh key={k} position={[0, 2 + k * 1.9 - i * 0.4, 0.05]} rotation={[0, Math.PI / 2, 0]} castShadow>
                <planeGeometry args={[3.2 - k * 0.6, 1.6, 8, 4]} />
                <meshStandardMaterial color="#ede3cc" roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        ))}
        <Caja t={[0.02, 0.6, 1]} p={[0, 8.2, -1.0]} c="#151515" />
      </group>
      {/* gaviotas */}
      {[0, 1, 2, 3].map((i) => {
        const a = t * 0.35 + i * 1.7;
        const ala = Math.sin(t * 7 + i * 2) * 0.5;
        return (
          <group key={i} position={[Math.cos(a) * 12, 9 + i * 1.3, -10 + Math.sin(a) * 6]} rotation={[0, -a, 0]}>
            <Bola rad={0.12} s={[1, 0.8, 2.4]} c="#f2f2f2" />
            <Caja t={[0.9, 0.02, 0.2]} p={[0.45, 0, 0]} r={[0, 0, ala]} c="#e8e8e8" />
            <Caja t={[0.9, 0.02, 0.2]} p={[-0.45, 0, 0]} r={[0, 0, -ala]} c="#e8e8e8" />
          </group>
        );
      })}
    </>
  );
};

/* =================================================================== 2 · POLO NORTE */

const LAGO = {x: 9, z: -12, r: 7};
const altPolo = (x: number, z: number) => {
  const deriva = fbm(x * 0.07, z * 0.07, 5) * 1.6 + fbm(x * 0.3, z * 0.3, 3) * 0.25;
  const montes = Math.max(0, -z - 45) / 30;
  const m = crestas(x * 0.025, z * 0.025, 6) ** 2 * 45 * Math.min(1, montes);
  const lago = 1 - suaveEntre(LAGO.r - 1.5, LAGO.r + 2, Math.hypot(x - LAGO.x, (z - LAGO.z) * 1.3));
  return (deriva * llano(x, z, 2.5, 9) + m) * (1 - lago) - lago * 0.6;
};
const colPolo = (_x: number, _z: number, y: number, pend: number) => {
  const nieve = rgb('#f0f5ff');
  const sombra = rgb('#c8d6ee');
  const roca = rgb('#3a3e48');
  const c = mezclaC(nieve, sombra, fbm(_x * 0.2, _z * 0.2, 3) + 0.3);
  return mezclaC(c, roca, (pend - 0.45) * 4 + (y > 20 ? 0 : -1));
};

/** Cortina de aurora boreal: shader con bandas que ondulan y brillo aditivo. */
const Aurora: React.FC<{t: number; p: V3; ancho: number; alto: number; tono?: number}> = ({t, p, ancho, alto, tono = 0}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: false,
        uniforms: {uT: {value: 0}, uTono: {value: tono}},
        vertexShader: `
          uniform float uT; varying vec2 vUv;
          void main(){ vUv = uv; vec3 p = position;
            p.z += sin(p.x*0.025 + uT*0.35)*18.0 + sin(p.x*0.07 - uT*0.6)*5.0;
            p.y += sin(p.x*0.04 + uT*0.5)*3.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
        fragmentShader: `
          uniform float uT; uniform float uTono; varying vec2 vUv;
          void main(){
            float rayos = 0.55 + 0.45*sin(vUv.x*180.0 + sin(vUv.x*23.0+uT)*3.0 + uT*1.5);
            rayos *= 0.6 + 0.4*sin(vUv.x*47.0 - uT*0.8);
            float v = vUv.y;
            float forma = smoothstep(0.0, 0.08, v) * pow(1.0 - v, 1.6);
            vec3 verde = vec3(0.15, 1.0, 0.55);
            vec3 morado = vec3(0.7, 0.25, 1.0);
            vec3 c = mix(verde, morado, smoothstep(0.35, 0.95, v) + uTono*0.4);
            float bordes = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
            gl_FragColor = vec4(c * forma * rayos * bordes * 1.6, 1.0);
          }`,
      }),
    [tono],
  );
  mat.uniforms.uT.value = t;
  return (
    <mesh position={p} material={mat}>
      <planeGeometry args={[ancho, alto, 220, 1]} />
    </mesh>
  );
};

const PoloNorte: React.FC<PropsE> = ({t}) => {
  const luna = dirSol(32, 210);
  const nieveTex = TEX.nieve();
  const bloques = TEX.sillares([236, 242, 252]);
  return (
    <>
      <CieloDegradado stops={[[0, '#01030c'], [0.3, '#061230'], [0.47, '#1c3462'], [0.5, '#2c4a7a'], [1, '#0a1428']]} estrellas={3000} entorno={0.9} />
      <fogExp2 attach="fog" args={['#162746', 0.011]} />
      <Sol elev={32} azim={210} color="#b8ccff" int={1.6} cielo="#4a6aaa" suelo="#c8d8f0" amb={0.55} />
      <Aurora t={t} p={[0, 48, -150]} ancho={460} alto={80} />
      <Aurora t={t + 7} p={[-60, 62, -200]} ancho={420} alto={70} tono={1} />
      {/* luna */}
      <mesh position={[luna[0] * 700, luna[1] * 700, luna[2] * 700]}>
        <sphereGeometry args={[16, 32, 16]} />
        <meshBasicMaterial color="#f4f0e4" fog={false} />
      </mesh>
      <Terreno tam={260} seg={280} alt={altPolo} col={colPolo} tex={nieveTex} rep={90} rug={0.75} />
      {/* lago helado que refleja la aurora */}
      <Agua t={t} x={LAGO.x} z={LAGO.z} y={-0.25} tam={20} charco sol={luna} solColor="#b8ccff" color="#1a2a40" distorsion={0.25} velocidad={0.05} />
      {/* icebergs y bloques de hielo */}
      {[...Array(8)].map((_, i) => {
        const x = (i - 3.5) * 16 + rnd(i) * 8;
        const z = -30 - rnd(i + 5) * 25;
        const s = 3 + rnd(i * 2) * 5;
        return <RocaReal key={i} p={[x, altPolo(x, z) - 1, z]} s={[s, s * (1.2 + rnd(i) * 0.8), s * 0.8]} r={[0, rnd(i) * 3, 0]} semilla={i + 2} c="#a8c8ea" rug={0.3} />;
      })}
      {/* iglú de bloques de nieve */}
      <group position={[-3.6, 0, -3.4]} rotation={[0, 0.7, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[2.1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial map={bloques.map} normalMap={bloques.normal} roughness={0.7} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0, 1.9]}>
          <cylinderGeometry args={[0.8, 0.8, 1.5, 24, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial map={bloques.map} normalMap={bloques.normal} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.02, 2.62]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.62, 24, 0, Math.PI]} />
          <meshStandardMaterial color="#ffb060" emissive="#ff8a30" emissiveIntensity={2.2} />
        </mesh>
        <pointLight position={[0, 0.5, 3.2]} color="#ff9a40" intensity={6} distance={6} />
      </group>
      {/* bosque nevado */}
      {[...Array(46)].map((_, i) => {
        const x = (rnd(i * 1.3) - 0.5) * 70;
        const z = -8 - rnd(i * 2.9) * 40;
        if (Math.hypot(x - LAGO.x, z - LAGO.z) < LAGO.r + 2 || Math.abs(x) < 4) return null;
        return <Abeto key={i} p={[x, altPolo(x, z) - 0.1, z]} s={0.9 + rnd(i * 4) * 0.9} nieve g={rnd(i) * 6} />;
      })}
      {/* muñeco de nieve */}
      <group position={[2.8, 0, -1]} rotation={[0, -0.6, 0]}>
        {[[0.55, 0.5], [0.4, 1.25], [0.28, 1.82]].map(([r, y]) => (
          <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
            <sphereGeometry args={[r, 32, 20]} />
            <meshStandardMaterial map={nieveTex.map} normalMap={nieveTex.normal} roughness={0.8} />
          </mesh>
        ))}
        <Cono rad={0.05} h={0.3} p={[0, 1.82, 0.38]} r={[Math.PI / 2, 0, 0]} c="#ff7a1a" />
        <Cil ra={0.2} h={0.3} p={[0, 2.18, 0]} c="#1a1a1a" />
        <Cil ra={0.3} h={0.03} p={[0, 2.04, 0]} c="#1a1a1a" />
        <Toro rad={0.3} tubo={0.06} p={[0, 1.55, 0]} r={[Math.PI / 2, 0, 0]} c="#c02a3a" />
      </group>
      {/* nieve que cae */}
      <Instancias
        n={900}
        geo={memo(() => new THREE.SphereGeometry(0.025, 5, 4))()}
        mat={memo(() => new THREE.MeshBasicMaterial({color: '#ffffff'}))()}
        pos={(i) => {
          const y = 12 - ((t * (0.5 + rnd(i) * 0.6) + rnd(i + 1) * 12) % 12);
          return [(rnd(i + 2) - 0.5) * 24 + Math.sin(t * 0.8 + i) * 0.4, y, (rnd(i + 3) - 0.75) * 22];
        }}
      />
    </>
  );
};

/* =================================================================== 3 · MARTE */

const CRATERES: [number, number, number][] = [[-6, -9, 3.5], [8, -16, 5], [-16, -30, 9], [4, 4, 1.4], [22, -38, 12], [-3, -48, 7]];
const altMarte = (x: number, z: number) => {
  let h = fbm(x * 0.05, z * 0.05, 5) * 2.2 + fbm(x * 0.4, z * 0.4, 3) * 0.15;
  for (const [cx, cz, r] of CRATERES) {
    const d = Math.hypot(x - cx, z - cz) / r;
    if (d < 1.6) h += d < 1 ? (d * d - 1) * r * 0.25 + suaveEntre(0.7, 1, d) * r * 0.12 : (1 - suaveEntre(1, 1.6, d)) * r * 0.12;
  }
  const lejos = Math.max(0, -z - 55) / 40;
  h += crestas(x * 0.02, z * 0.02, 6) ** 2.2 * 55 * Math.min(1, lejos);
  return h * llano(x, z, 2.5, 8);
};
const colMarte = (x: number, z: number, y: number, pend: number) => {
  const polvo = rgb('#c4703c');
  const oxido = rgb('#9a4a24');
  const basalto = rgb('#4a2a1e');
  let c = mezclaC(polvo, oxido, fbm(x * 0.1, z * 0.1, 4) * 1.5 + 0.4);
  c = mezclaC(c, rgb('#d89a64'), -y * 0.4);
  return mezclaC(c, basalto, (pend - 0.3) * 3);
};

const Marte: React.FC<PropsE> = ({t}) => {
  const metal = {color: '#d8dce4', metalness: 0.85, roughness: 0.32};
  return (
    <>
      <CieloDegradado stops={[[0, '#1e1210'], [0.28, '#5a3424'], [0.46, '#c88a5a'], [0.5, '#e0aa78'], [1, '#8a5030']]} entorno={0.9} />
      <fogExp2 attach="fog" args={['#c28a5c', 0.0085]} />
      <Sol elev={34} azim={70} color="#ffe2c0" int={3.4} cielo="#e8a070" suelo="#6a3018" amb={0.35} />
      {/* Fobos y Deimos */}
      <mesh position={[-180, 220, -620]}>
        <sphereGeometry args={[14, 24, 16]} />
        <meshStandardMaterial color="#b8a898" roughness={1} />
      </mesh>
      <mesh position={[260, 160, -700]}>
        <sphereGeometry args={[6, 16, 12]} />
        <meshStandardMaterial color="#a89888" roughness={1} />
      </mesh>
      <Terreno tam={260} seg={300} alt={altMarte} col={colMarte} tex={TEX.tierra()} rep={80} />
      {/* rocas y piedras */}
      {[...Array(18)].map((_, i) => {
        const a = rnd(i) * Math.PI - Math.PI;
        const d = 4 + rnd(i + 7) * 22;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d * 0.9;
        const s = 0.25 + rnd(i + 3) * (d > 10 ? 1.4 : 0.55);
        return <RocaReal key={i} p={[x, altMarte(x, z) + s * 0.15, z]} s={[s * 1.3, s, s]} r={[0, rnd(i) * 6, 0]} semilla={i} c="#7a3a20" />;
      })}
      <Instancias
        n={500}
        geo={geoRoca(5)}
        mat={memo(() => matStd({color: '#6a3420', roughness: 0.95, map: TEX.roca().map}))()}
        pos={(i) => {
          const x = (rnd(i * 1.7) - 0.5) * 30;
          const z = 4 - rnd(i * 2.1) * 26;
          return [x, altMarte(x, z), z];
        }}
        esc={(i) => 0.04 + rnd(i * 3.3) ** 3 * 0.25}
        rot={(i) => [rnd(i), rnd(i * 2) * 6, 0]}
        sombra
      />
      {/* base con cúpula de cristal */}
      <group position={[-5.5, altMarte(-5.5, -7), -7]} rotation={[0, 0.5, 0]}>
        <mesh receiveShadow castShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[3.2, 3.4, 0.5, 40]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[3, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#cfe8ff" transparent opacity={0.22} roughness={0.04} metalness={0} clearcoat={1} envMapIntensity={2} depthWrite={false} />
        </mesh>
        {[...Array(8)].map((_, i) => (
          <mesh key={i} position={[0, 0.5, 0]} rotation={[0, (i / 8) * Math.PI, 0]}>
            <torusGeometry args={[3, 0.03, 6, 48, Math.PI]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        ))}
        <Bola rad={1} p={[0, 1.2, 0]} c="#3c8a3a" rug={0.8} />
        <Bola rad={0.7} p={[1.2, 0.9, 0.6]} c="#4a9a44" rug={0.8} />
        <pointLight position={[0, 1.6, 0]} color="#cfe8ff" intensity={4} distance={6} />
        {/* módulo y túnel */}
        <mesh castShadow receiveShadow position={[4.4, 1, 0.6]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1, 1, 3, 32]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {[-1.2, 0, 1.2].map((y) => (
          <Toro key={y} rad={1.02} tubo={0.05} p={[4.4 + y, 1, 0.6]} r={[0, Math.PI / 2, 0]} c="#9aa0aa" met={0.9} rug={0.3} />
        ))}
        <Cil ra={0.04} h={3} p={[4.4, 3, 0.6]} c="#c8ccd6" met={0.8} />
        <group position={[4.4, 4.4, 0.6]} rotation={[0.7, t * 0.4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.9, 32, 10, 0, Math.PI * 2, 0, Math.PI / 3.2]} />
            <meshStandardMaterial color="#f4f6fa" metalness={0.6} roughness={0.25} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <mesh position={[4.4, 4.7, 0.6]}>
          <sphereGeometry args={[0.07, 12, 8]} />
          <meshStandardMaterial color="#ff3a2a" emissive="#ff2a1a" emissiveIntensity={Math.sin(t * 5) > 0 ? 6 : 0.3} />
        </mesh>
      </group>
      {/* paneles solares */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[5 + i * 2.4, altMarte(5 + i * 2.4, -9) + 0.9, -9 - i * 0.6]} rotation={[-0.6, -0.3, 0]}>
          <Cil ra={0.04} h={1.2} p={[0, -0.5, 0.2]} r={[0.6, 0, 0]} c="#9aa0aa" met={0.8} />
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2, 0.05, 1.2]} />
            <meshStandardMaterial color="#14224a" metalness={0.7} roughness={0.15} />
          </mesh>
        </group>
      ))}
      {/* rover */}
      <group position={[3.8 - Math.sin(t * 0.3) * 0.5, altMarte(3.8, -2.8), -2.8]} rotation={[0, -0.9, 0]}>
        <mesh castShadow position={[0, 0.65, 0]}>
          <boxGeometry args={[1.7, 0.45, 1.05]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh castShadow position={[0, 0.9, 0]}>
          <boxGeometry args={[1.5, 0.04, 1.15]} />
          <meshStandardMaterial color="#14224a" metalness={0.7} roughness={0.15} />
        </mesh>
        {[-0.62, 0, 0.62].flatMap((x) =>
          [-0.62, 0.62].map((z) => (
            <group key={`${x}${z}`} position={[x, 0.25, z]} rotation={[Math.PI / 2, 0, -t * 1.2]}>
              <Cil ra={0.25} h={0.18} c="#2a2a2e" rug={0.9} seg={18} plano />
            </group>
          )),
        )}
        <Cil ra={0.03} h={0.8} p={[0.62, 1.25, 0]} c="#c8ccd6" met={0.8} />
        <Caja t={[0.32, 0.2, 0.24]} p={[0.62, 1.7, 0]} c="#222" />
        <Cil ra={0.05} h={0.04} p={[0.79, 1.7, 0]} r={[0, 0, Math.PI / 2]} c="#5ad8ff" em="#5ad8ff" emI={3} />
      </group>
      {/* polvo en suspensión */}
      <Instancias
        n={260}
        geo={memo(() => new THREE.SphereGeometry(0.02, 5, 4))()}
        mat={memo(() => new THREE.MeshBasicMaterial({color: '#ffd0a8', transparent: true, opacity: 0.55}))()}
        pos={(i) => [((rnd(i) * 24 + t * 0.7 * (0.5 + rnd(i + 1))) % 24) - 12, rnd(i + 2) * 4, (rnd(i + 3) - 0.6) * 14]}
      />
    </>
  );
};

/* =================================================================== 4 · ANTIGUO EGIPTO */

const OASIS = {x: 7, z: -6, r: 3};
const altEgipto = (x: number, z: number) => {
  const dunas = crestas(x * 0.035 + fbm(x * 0.02, z * 0.02, 2) * 0.6, z * 0.07, 4) ** 2.4 * 9 + fbm(x * 0.1, z * 0.1, 3) * 0.6;
  const oasis = 1 - suaveEntre(OASIS.r - 0.6, OASIS.r + 2.5, Math.hypot(x - OASIS.x, z - OASIS.z));
  return dunas * llano(x, z, 3, 16) * (1 - oasis) - oasis * 0.5;
};
const colEgipto = (x: number, z: number, y: number, pend: number) => {
  const claro = rgb('#f0d4a0');
  const dorado = rgb('#dca868');
  const sombra = rgb('#b88048');
  let c = mezclaC(claro, dorado, fbm(x * 0.06, z * 0.06, 3) + 0.5);
  c = mezclaC(c, sombra, pend * 2.5);
  const oasis = 1 - suaveEntre(OASIS.r, OASIS.r + 2.2, Math.hypot(x - OASIS.x, z - OASIS.z));
  return mezclaC(c, rgb('#8a7a48'), oasis + y * -0.3);
};

const Egipto: React.FC<PropsE> = ({t}) => {
  const sol = dirSol(38, 120);
  const piedra = TEX.sillares([216, 182, 126]);
  const granito = TEX.sillares([196, 150, 112]);
  const P = (props: {map: THREE.Texture; normal: THREE.Texture}, rug = 0.92) => <meshStandardMaterial map={props.map} normalMap={props.normal} roughness={rug} />;
  return (
    <>
      <CieloFisico elev={38} azim={120} turbidez={4} rayleigh={1.8} mie={0.006} entorno={0.7} />
      <fogExp2 attach="fog" args={['#e2cca6', 0.0065]} />
      <Sol elev={38} azim={120} color="#fff0d6" int={3.6} cielo="#b0c8f0" suelo="#e0b070" amb={0.35} area={16} />
      <Nubes t={t} n={10} op={0.55} />
      <Terreno tam={280} seg={300} alt={altEgipto} col={colEgipto} tex={TEX.arena()} rep={110} normal={0.45} />
      {/* pirámides con sillares */}
      {[
        [-22, -52, 30],
        [14, -78, 44],
        [42, -60, 22],
      ].map(([x, z, s], i) => (
        <group key={i} position={[x, (s * 0.64) / 2 - 1, z]} rotation={[0, Math.PI / 4 + i * 0.15, 0]}>
          <mesh castShadow receiveShadow>
            <coneGeometry args={[s * 0.71, s * 0.64, 4, 12]} />
            <meshStandardMaterial map={piedra.map} normalMap={piedra.normal} roughness={0.95} flatShading />
          </mesh>
          {i === 1 && (
            <mesh position={[0, s * 0.28, 0]}>
              <coneGeometry args={[s * 0.08, s * 0.08, 4]} />
              <meshStandardMaterial color="#e8c060" metalness={0.9} roughness={0.25} flatShading />
            </mesh>
          )}
        </group>
      ))}
      {/* templo de columnas */}
      <group position={[-5, 0, -6]} rotation={[0, 0.5, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
          <boxGeometry args={[8, 0.5, 4.2]} />
          {P(piedra)}
        </mesh>
        {[-3.2, -1.6, 0, 1.6, 3.2].map((x) => (
          <group key={x} position={[x, 0.5, 1.4]}>
            <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
              <cylinderGeometry args={[0.4, 0.46, 4.4, 24]} />
              {P(piedra)}
            </mesh>
            {[1.4, 3.1].map((y) => (
              <Cil key={y} ra={0.465} h={0.16} p={[0, y, 0]} c={y > 2 ? '#2a5e8a' : '#9a3a22'} rug={0.9} />
            ))}
            <mesh castShadow position={[0, 4.6, 0]}>
              <cylinderGeometry args={[0.68, 0.42, 0.55, 24]} />
              <meshStandardMaterial color="#5a8a5a" roughness={0.9} />
            </mesh>
          </group>
        ))}
        <mesh castShadow receiveShadow position={[0, 5.2, 1.4]}>
          <boxGeometry args={[8.2, 0.7, 1.6]} />
          {P(piedra)}
        </mesh>
        <mesh castShadow receiveShadow position={[0, 2.9, -1.2]}>
          <boxGeometry args={[7.6, 4.8, 0.5]} />
          {P(piedra)}
        </mesh>
        {/* derrumbe: sillares caídos */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} castShadow receiveShadow position={[2.6 + i * 0.7, 0.75, 3 + rnd(i) * 0.8]} rotation={[0, rnd(i) * 2, 0.1]}>
            <boxGeometry args={[0.8, 0.5, 0.5]} />
            {P(piedra)}
          </mesh>
        ))}
      </group>
      {/* obelisco */}
      <group position={[4.6, 0, -11]}>
        <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[1.6, 0.6, 1.6]} />
          {P(piedra)}
        </mesh>
        <mesh castShadow receiveShadow position={[0, 4, 0]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.42, 0.6, 7, 4]} />
          <meshStandardMaterial map={granito.map} normalMap={granito.normal} roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0, 7.9, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.42, 0.8, 4]} />
          <meshStandardMaterial color="#e8c060" metalness={0.9} roughness={0.25} flatShading />
        </mesh>
      </group>
      {/* oasis con palmeras y juncos */}
      <Agua t={t} x={OASIS.x} z={OASIS.z} y={-0.2} tam={8} charco sol={sol} color="#1a5a5a" distorsion={0.6} velocidad={0.2} />
      <Palmera p={[OASIS.x + 3, altEgipto(OASIS.x + 3, OASIS.z - 2), OASIS.z - 2]} h={6.5} giro={2} t={t} />
      <Palmera p={[OASIS.x - 2.5, altEgipto(OASIS.x - 2.5, OASIS.z - 3.5), OASIS.z - 3.5]} h={7.5} giro={0.5} t={t + 2} incl={0.4} />
      <Palmera p={[OASIS.x + 1, altEgipto(OASIS.x + 1, OASIS.z + 3), OASIS.z + 3]} h={5} giro={4} t={t + 3} />
      <Hierba
        t={t}
        n={5000}
        donde={(i) => {
          const a = rnd(i * 1.3) * Math.PI * 2;
          const r = OASIS.r - 0.3 + rnd(i * 2.7) * 2.6;
          return [OASIS.x + Math.cos(a) * r, OASIS.z + Math.sin(a) * r];
        }}
        alt={altEgipto}
        colores={['#5a7a2a', '#6a8a30', '#8a9a40', '#4a6a24']}
        altura={[0.3, 1.1]}
        ancho={0.05}
      />
      {/* vasijas de barro */}
      {[0, 1, 2].map((i) => {
        const c = ['#a85a2a', '#8a4a24', '#b07040'][i];
        return (
          <group key={i} position={[2.2 + i * 0.7, 0, 1.2 - i * 0.5]} rotation={[0, i, i === 2 ? 1.3 : 0]}>
            <mesh castShadow position={[0, 0.32, 0]} scale={[1, 1.25, 1]}>
              <sphereGeometry args={[0.3, 24, 16]} />
              <meshStandardMaterial color={c} roughness={0.85} normalMap={TEX.tierra().normal} />
            </mesh>
            <Cil ra={0.12} rb={0.16} h={0.22} p={[0, 0.72, 0]} c={c} />
          </group>
        );
      })}
      {/* calima */}
      <Instancias
        n={220}
        geo={memo(() => new THREE.SphereGeometry(0.018, 5, 4))()}
        mat={memo(() => new THREE.MeshBasicMaterial({color: '#fff0c8', transparent: true, opacity: 0.6}))()}
        pos={(i) => [((rnd(i) * 26 + t * (1 + rnd(i + 1))) % 26) - 13, 0.05 + rnd(i + 2) ** 2 * 2.5, (rnd(i + 3) - 0.6) * 14]}
      />
    </>
  );
};

/* =================================================================== 5 · FERIA NOCTURNA */

const Feria: React.FC<PropsE> = ({t}) => {
  const giro = t * 0.3;
  const metal = {color: '#dcd6e6', metalness: 0.8, roughness: 0.35};
  const asfalto = useMemo(
    () =>
      textura('asfalto', 512, (u, v) => fbm(u * 40, v * 40, 3, 40) * 0.4 + rnd(u * 997 + v * 571) * 0.4, (u, v, h) => {
        const k = 105 + h * 60;
        return [k, k * 0.98, k * 1.02];
      }, 2),
    [],
  );
  const COL = ['#ffd23a', '#ff4a8a', '#5ad8ff', '#ff8a3a'];
  return (
    <>
      <CieloDegradado stops={[[0, '#020208'], [0.35, '#0c0820'], [0.48, '#2a1a3e'], [0.5, '#3a2448'], [1, '#0a0610']]} estrellas={1800} entorno={0.5} />
      <fogExp2 attach="fog" args={['#1c1230', 0.018]} />
      <Sol elev={40} azim={230} color="#9a9aff" int={0.6} cielo="#5a4a9a" suelo="#2a1a30" amb={0.45} />
      <pointLight position={[-5, 7.5, -9]} color="#ff6ad8" intensity={80} distance={22} decay={1.6} />
      <pointLight position={[5, 5, -4]} color="#ffb060" intensity={60} distance={16} decay={1.6} />
      <pointLight position={[0, 4.2, -1.5]} color="#ffd8a0" intensity={25} distance={9} decay={1.6} />
      <spotLight position={[3, 7, 6]} angle={0.5} penumbra={0.8} intensity={120} color="#fff0e0" castShadow target-position={[0, 1, 0]} />
      {/* suelo de asfalto mojado y charcos que reflejan las luces */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial map={asfalto.map} normalMap={asfalto.normal} roughness={0.45} metalness={0.15} map-repeat={new THREE.Vector2(80, 80)} normalMap-repeat={new THREE.Vector2(80, 80)} />
      </mesh>
      <Agua t={t} x={-1.8} z={1.5} y={0.01} tam={3.4} charco sol={[0, 1, 0]} solColor="#000000" color="#050308" distorsion={0.15} velocidad={0.05} />
      <Agua t={t} x={2.5} z={2.8} y={0.01} tam={2.4} charco sol={[0, 1, 0]} solColor="#000000" color="#050308" distorsion={0.15} velocidad={0.05} />
      <Agua t={t} x={-3.5} z={-2} y={0.01} tam={2.8} charco sol={[0, 1, 0]} solColor="#000000" color="#050308" distorsion={0.15} velocidad={0.05} />
      {/* noria con estructura metálica y bombillas */}
      <group position={[-5, 8, -10]}>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh castShadow position={[s * 1.8, -4, 0.6]} rotation={[0.08, 0, s * 0.22]}>
              <cylinderGeometry args={[0.12, 0.18, 8.4, 12]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh castShadow position={[s * 1.8, -4, -0.6]} rotation={[-0.08, 0, s * 0.22]}>
              <cylinderGeometry args={[0.12, 0.18, 8.4, 12]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          </group>
        ))}
        <group rotation={[0, 0, giro]}>
          {[-0.35, 0.35].map((z) => (
            <group key={z} position={[0, 0, z]}>
              <Toro rad={6.2} tubo={0.08} c="#e8e0f0" met={0.8} rug={0.3} seg={96} />
              <Toro rad={5.5} tubo={0.05} c="#e8e0f0" met={0.8} rug={0.3} seg={96} />
              {[...Array(16)].map((_, i) => (
                <Caja key={i} t={[0.05, 12.4, 0.05]} r={[0, 0, (i / 16) * Math.PI]} c="#cfc8dc" met={0.8} rug={0.35} />
              ))}
            </group>
          ))}
          <Cil ra={0.4} h={1.2} r={[Math.PI / 2, 0, 0]} c="#bfb8cc" met={0.9} rug={0.3} />
          {[...Array(48)].map((_, i) => {
            const a = (i / 48) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 6.2, Math.sin(a) * 6.2, 0.45]}>
                <sphereGeometry args={[0.09, 10, 8]} />
                <meshStandardMaterial color="#fff" emissive={COL[i % 4]} emissiveIntensity={Math.sin(t * 4 + i * 0.5) > -0.3 ? 9 : 1.5} />
              </mesh>
            );
          })}
          {[...Array(16)].map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return (
              <mesh key={`r${i}`} position={[Math.cos(a) * 3, Math.sin(a) * 3, 0.42]}>
                <sphereGeometry args={[0.07, 8, 6]} />
                <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={6} />
              </mesh>
            );
          })}
        </group>
        {[...Array(10)].map((_, i) => {
          const a = (i / 10) * Math.PI * 2 + giro;
          return (
            <group key={i} position={[Math.cos(a) * 6.2, Math.sin(a) * 6.2 - 0.85, 0]}>
              <mesh castShadow>
                <boxGeometry args={[1.1, 0.85, 0.85]} />
                <meshPhysicalMaterial color={['#e8243a', '#ffc81a', '#1aa8e8', '#5ac83a', '#9a3ae8'][i % 5]} roughness={0.25} clearcoat={1} />
              </mesh>
              <Cono rad={0.75} h={0.4} seg={4} p={[0, 0.62, 0]} r={[0, Math.PI / 4, 0]} c="#efe8f8" met={0.5} rug={0.3} />
            </group>
          );
        })}
      </group>
      {/* carpa de circo de lona a rayas */}
      <group position={[5.5, 0, -7.5]}>
        {[...Array(16)].map((_, i) => (
          <React.Fragment key={i}>
            <mesh castShadow receiveShadow position={[0, 4.6, 0]}>
              <coneGeometry args={[4.2, 3.2, 6, 4, true, (i / 16) * Math.PI * 2, (Math.PI * 2) / 16]} />
              <meshStandardMaterial color={i % 2 ? '#efe6dc' : '#c41c30'} roughness={0.8} side={THREE.DoubleSide} normalMap={TEX.tierra().normal} normalScale={new THREE.Vector2(0.3, 0.3)} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
              <cylinderGeometry args={[4.2, 4.2, 3, 3, 1, true, (i / 16) * Math.PI * 2, (Math.PI * 2) / 16]} />
              <meshStandardMaterial color={i % 2 ? '#c41c30' : '#efe6dc'} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          </React.Fragment>
        ))}
        <Cil ra={0.06} h={1.4} p={[0, 6.8, 0]} c="#ffd23a" met={0.7} />
        <mesh position={[0, 1.1, 4.15]}>
          <planeGeometry args={[1.6, 2.2]} />
          <meshStandardMaterial color="#ffb060" emissive="#ff9a40" emissiveIntensity={1.6} />
        </mesh>
        {[...Array(16)].map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 4.25, 3.05, Math.sin(a) * 4.25]}>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshStandardMaterial color="#fff" emissive="#ffd23a" emissiveIntensity={8} />
            </mesh>
          );
        })}
      </group>
      {/* guirnalda de bombillas entre farolas */}
      {[...Array(24)].map((_, i) => {
        const x = -7 + i * (14.6 / 23);
        const y = 4.6 - Math.sin((i / 23) * Math.PI) * 1.3;
        return (
          <mesh key={i} position={[x, y, -2.5]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color="#fff" emissive={COL[i % 3]} emissiveIntensity={9} />
          </mesh>
        );
      })}
      {[-7.2, 7.6].map((x) => (
        <group key={x} position={[x, 0, -2.5]}>
          <Cil ra={0.07} rb={0.1} h={4.8} p={[0, 2.4, 0]} c="#2a2a32" met={0.8} rug={0.4} />
          <mesh position={[0, 4.9, 0]}>
            <sphereGeometry args={[0.22, 16, 12]} />
            <meshStandardMaterial color="#fff" emissive="#ffd8a0" emissiveIntensity={6} />
          </mesh>
        </group>
      ))}
      {/* globos brillantes */}
      {[...Array(7)].map((_, i) => (
        <group key={i} position={[-2.4 + i * 0.7, 2.6 + Math.sin(t * 1.4 + i) * 0.18 + (i % 3) * 0.25, -1.4 - (i % 2) * 0.6]}>
          <mesh castShadow scale={[1, 1.18, 1]}>
            <sphereGeometry args={[0.3, 24, 16]} />
            <meshPhysicalMaterial color={['#e8243a', '#ffc81a', '#1aa8e8', '#8a3ae8', '#3ac85a', '#ff7a1a', '#ff4ab8'][i]} roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} />
          </mesh>
          <Cil ra={0.005} h={1.7} p={[0, -1.15, 0]} c="#dddddd" sombra={false} />
        </group>
      ))}
      {/* puesto de palomitas */}
      <group position={[3.2, 0, 0.6]} rotation={[0, -0.6, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[1.6, 1.2, 1]} />
          <meshPhysicalMaterial color="#c41c30" roughness={0.3} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, 1.65, 0]}>
          <boxGeometry args={[1.5, 0.9, 0.9]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.18} roughness={0.02} clearcoat={1} depthWrite={false} />
        </mesh>
        <pointLight position={[0, 1.7, 0]} color="#ffe0a0" intensity={3} distance={3} />
        <Instancias
          n={90}
          geo={memo(() => new THREE.IcosahedronGeometry(0.055, 1))()}
          mat={memo(() => matStd({color: '#fff2c8', roughness: 0.9}))()}
          pos={(i) => [(rnd(i) - 0.5) * 1.3, 1.25 + rnd(i + 1) ** 2 * 0.4, (rnd(i + 2) - 0.5) * 0.7]}
        />
        {[-0.7, 0.7].map((x) => (
          <Cil key={x} ra={0.035} h={1} p={[x, 1.7, 0.42]} c="#e8c040" met={0.8} rug={0.3} />
        ))}
        <Cono rad={1.2} h={0.5} seg={4} p={[0, 2.45, 0]} r={[0, Math.PI / 4, 0]} c="#ffc81a" />
      </group>
    </>
  );
};

/* =================================================================== 6 · PAÍS DE LAS GOLOSINAS */

const rio = (x: number) => -9 + Math.sin(x * 0.12) * 3;
const altGolosinas = (x: number, z: number) => {
  const colinas = fbm(x * 0.04, z * 0.04, 4) * 5 + 1.5;
  const cauce = 1 - suaveEntre(1.6, 3.6, Math.abs(z - rio(x)));
  return colinas * llano(x, z, 3, 12) * (1 - cauce) - cauce * 0.7;
};
const colGolosinas = (x: number, z: number, y: number) => {
  const menta = rgb('#a8ecc8');
  const rosa = rgb('#ffb8dc');
  const c = mezclaC(rosa, menta, fbm(x * 0.05, z * 0.05, 3) * 2 + 0.5);
  return mezclaC(rgb('#8a4a2a'), c, (y + 0.4) * 3);
};
const MatCaramelo: React.FC<{c: string; op?: number}> = ({c, op}) => (
  <meshPhysicalMaterial color={c} roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} transparent={op !== undefined} opacity={op ?? 1} sheen={0.2} />
);

const Piruleta: React.FC<{p: V3; s?: number; colores: [string, string]; giro?: number}> = ({p, s = 1, colores, giro = 0}) => {
  const espiral = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 220; i++) {
      const a = i * 0.16;
      const r = 0.06 + i * 0.0036;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.075, 10, false);
  }, []);
  return (
    <group position={p} scale={s} rotation={[0, giro, 0]}>
      <Cil ra={0.05} h={3} p={[0, 1.5, 0]} c="#f8f6f0" rug={0.6} />
      <group position={[0, 3.75, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.86, 0.86, 0.12, 48]} />
          <MatCaramelo c={colores[1]} />
        </mesh>
        <mesh castShadow geometry={espiral} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]} position={[0, 0, 0.0]}>
          <MatCaramelo c={colores[0]} />
        </mesh>
        <mesh geometry={espiral} rotation={[0, 0, 0]} position={[0, 0, 0.065]}>
          <MatCaramelo c={colores[0]} />
        </mesh>
        <mesh geometry={espiral} rotation={[0, Math.PI, 0]} position={[0, 0, -0.065]}>
          <MatCaramelo c={colores[0]} />
        </mesh>
      </group>
    </group>
  );
};

const Golosinas: React.FC<PropsE> = ({t}) => {
  const sol = dirSol(34, 100);
  const azucar = TEX.nieve();
  return (
    <>
      <CieloDegradado stops={[[0, '#7ab8ff'], [0.32, '#b8d4ff'], [0.47, '#ffd6ec'], [0.5, '#ffe8d8'], [1, '#ffd0e4']]} entorno={1} />
      <fogExp2 attach="fog" args={['#ffd8ea', 0.009]} />
      <Sol elev={34} azim={100} color="#fff4ec" int={3.2} cielo="#ffd0f0" suelo="#ff9ac8" amb={0.45} />
      <Nubes t={t} n={30} color="#fff4fa" altura={[30, 90]} />
      <Terreno tam={220} seg={260} alt={altGolosinas} col={colGolosinas} tex={azucar} rep={70} rug={0.65} />
      {/* río de chocolate fundido */}
      <Agua t={t} y={-0.25} z={-9} tam={200} sol={sol} color="#2a1206" distorsion={0.9} velocidad={0.35} />
      {/* césped de regaliz y menta */}
      <Hierba
        t={t}
        n={14000}
        donde={(i) => {
          const x = (rnd(i * 1.1) - 0.5) * 34;
          const z = 4 - rnd(i * 2.3) * 22;
          return Math.abs(z - rio(x)) > 3.6 && Math.hypot(x, z) > 2.6 ? [x, z] : null;
        }}
        alt={altGolosinas}
        colores={['#7ad8a8', '#ff9ac8', '#a8f0c8', '#ffc0e0']}
        altura={[0.15, 0.4]}
        ancho={0.07}
      />
      <Piruleta p={[-3.6, altGolosinas(-3.6, -3), -3]} colores={['#ff2a5a', '#fff4f4']} giro={0.3} />
      <Piruleta p={[4.2, altGolosinas(4.2, -4.5), -4.5]} colores={['#2a9aff', '#f4faff']} s={1.25} giro={-0.4} />
      <Piruleta p={[-9, altGolosinas(-9, -14), -14]} colores={['#5ad83a', '#ffe23a']} s={2} />
      <Piruleta p={[10, altGolosinas(10, -16), -16]} colores={['#b83aff', '#fff4ff']} s={2.4} giro={0.2} />
      <Piruleta p={[-20, altGolosinas(-20, -30), -30]} colores={['#ff8a1a', '#fff']} s={3.4} />
      {/* bastón de caramelo */}
      <group position={[2.6, 0, -1.6]} rotation={[0, -0.6, 0]}>
        {[...Array(14)].map((_, i) => (
          <mesh key={i} castShadow position={[0, 0.12 + i * 0.24, 0]} rotation={[0, i * 0.5, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.24, 24]} />
            <MatCaramelo c={i % 2 ? '#fbfbf6' : '#d4102a'} />
          </mesh>
        ))}
        <group position={[-0.5, 3.36, 0]}>
          {[...Array(10)].map((_, i) => (
            <mesh key={i} castShadow rotation={[0, 0, (i * Math.PI) / 10]}>
              <torusGeometry args={[0.5, 0.16, 16, 12, Math.PI / 10 + 0.02]} />
              <MatCaramelo c={i % 2 ? '#fbfbf6' : '#d4102a'} />
            </mesh>
          ))}
        </group>
      </group>
      {/* magdalena gigante con cápsula plisada y nata */}
      <group position={[-6, altGolosinas(-6, -8), -8]} scale={1.7}>
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[1.4, 1.1, 1.2, 36]} />
          <meshStandardMaterial color="#f2c8e0" roughness={0.7} flatShading />
        </mesh>
        {[1.35, 1.0, 0.62].map((r, i) => (
          <mesh key={r} castShadow position={[0, 1.3 + i * 0.42, 0]} scale={[1, 0.7, 1]}>
            <torusGeometry args={[r, 0.42 - i * 0.06, 20, 48]} />
            <meshPhysicalMaterial color="#fff2f6" roughness={0.45} sheen={1} sheenColor="#ffd0e0" />
          </mesh>
        ))}
        <mesh castShadow position={[0, 2.55, 0]}>
          <sphereGeometry args={[0.36, 24, 16]} />
          <MatCaramelo c="#c4001e" />
        </mesh>
        <Instancias
          n={70}
          geo={memo(() => new THREE.CapsuleGeometry(0.025, 0.11, 4, 6))()}
          mat={memo(() => new THREE.MeshPhysicalMaterial({roughness: 0.3, clearcoat: 1}))()}
          pos={(i) => {
            const a = rnd(i) * Math.PI * 2;
            const k = Math.floor(rnd(i * 3) * 3);
            const r = [1.35, 1.0, 0.62][k] + (rnd(i + 1) - 0.3) * 0.3;
            return [Math.cos(a) * r, 1.62 + k * 0.42, Math.sin(a) * r];
          }}
          rot={(i) => [rnd(i) * 3, rnd(i * 2) * 3, rnd(i * 5) * 3]}
          color={(i) => ['#ffd23a', '#3ab8ff', '#8aff5a', '#ffffff', '#c85aff', '#ff5a5a'][i % 6]}
        />
      </group>
      {/* gominolas azucaradas */}
      {[...Array(16)].map((_, i) => {
        const a = rnd(i) * Math.PI - Math.PI;
        const d = 2.6 + rnd(i + 3) * 6;
        const x = Math.cos(a) * d;
        const z = Math.sin(a) * d * 0.7;
        if (Math.abs(z - rio(x)) < 3.4) return null;
        return (
          <mesh key={i} castShadow position={[x, altGolosinas(x, z) + 0.2, z]} scale={[1, 1.1, 1]}>
            <sphereGeometry args={[0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshPhysicalMaterial color={['#ff2a4a', '#ffc81a', '#2ad85a', '#ff7a1a', '#8a4aff'][i % 5]} roughness={0.55} normalMap={azucar.normal} transmission={0} sheen={0.6} />
          </mesh>
        );
      })}
      {/* caramelos envueltos flotando */}
      {[...Array(6)].map((_, i) => {
        const c = ['#ff2a5a', '#2a9aff', '#ffc81a', '#5ad83a', '#b83aff', '#ff8a1a'][i];
        return (
          <group key={i} position={[-3.4 + i * 1.4, 3.4 + Math.sin(t * 1.3 + i * 1.7) * 0.35, -2.5 - (i % 2) * 2]} rotation={[0.3, t * 0.8 + i, 0.4]}>
            <mesh castShadow scale={[1.3, 1, 1]}>
              <sphereGeometry args={[0.22, 24, 16]} />
              <MatCaramelo c={c} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.36, 0, 0]} rotation={[0, 0, (s * Math.PI) / 2]}>
                <coneGeometry args={[0.16, 0.22, 12, 1, true]} />
                <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} transparent opacity={0.8} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
};

/* =================================================================== 7 · LEJANO OESTE */

const MESAS: [number, number, number, number][] = [
  [-40, -90, 22, 22],
  [30, -120, 30, 30],
  [90, -95, 16, 18],
  [-100, -130, 28, 26],
  [0, -170, 40, 34],
];
const altOeste = (x: number, z: number) => {
  let h = fbm(x * 0.03, z * 0.03, 4) * 1.6 * llano(x, z, 3, 14);
  for (const [cx, cz, r, H] of MESAS) {
    const d = Math.hypot(x - cx, (z - cz) * 1.2) + fbm(x * 0.08, z * 0.08, 4) * r * 0.35;
    const meseta = 1 - suaveEntre(r, r + 5, d);
    const talud = 1 - suaveEntre(r + 3, r + 16, d);
    h = Math.max(h, meseta * H + talud * H * 0.18);
  }
  return h;
};
const colOeste = (x: number, z: number, y: number, pend: number) => {
  const arena = rgb('#d49a62');
  const rojo = rgb('#a8482a');
  const crema = rgb('#e8c49a');
  let c = mezclaC(arena, rgb('#c08050'), fbm(x * 0.07, z * 0.07, 3) + 0.4);
  if (y > 2) {
    // estratos horizontales en las paredes de las mesetas
    const banda = Math.sin(y * 1.3 + fbm(x * 0.05, z * 0.05, 2) * 2) * 0.5 + 0.5;
    c = mezclaC(rojo, crema, banda * 0.7);
  }
  return mezclaC(c, rgb('#8a3a20'), (pend - 0.6) * 2);
};

const geoCactus = memo(() => {
  const g = new THREE.CapsuleGeometry(1, 1, 8, 32);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + Math.cos(a * 14) * 0.07;
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
});
const Rama: React.FC<{p: V3; r: number; l: number; rot?: V3}> = ({p, r, l, rot = [0, 0, 0]}) => (
  <mesh geometry={geoCactus()} position={p} rotation={rot} scale={[r, l / 2 + r, r]} castShadow receiveShadow>
    <meshStandardMaterial color="#4a7a3a" roughness={0.7} />
  </mesh>
);
const Saguaro: React.FC<{p: V3; s?: number; g?: number}> = ({p, s = 1, g = 0}) => (
  <group position={p} scale={s} rotation={[0, g, 0]}>
    <Rama p={[0, 1.7, 0]} r={0.3} l={3} />
    <Rama p={[0.62, 2.3, 0]} r={0.2} l={0.9} />
    <Rama p={[0.36, 1.75, 0]} r={0.19} l={0.5} rot={[0, 0, Math.PI / 2]} />
    <Rama p={[-0.55, 2.0, 0]} r={0.18} l={0.7} />
    <Rama p={[-0.32, 1.55, 0]} r={0.17} l={0.4} rot={[0, 0, Math.PI / 2]} />
  </group>
);

const Oeste: React.FC<PropsE> = ({t}) => {
  const tablas = TEX.madera([150, 96, 58]);
  const tablasOsc = TEX.madera([104, 64, 38]);
  const M = (tx: {map: THREE.Texture; normal: THREE.Texture}) => <meshStandardMaterial map={tx.map} normalMap={tx.normal} roughness={0.9} />;
  return (
    <>
      <CieloFisico elev={6} azim={235} turbidez={5} rayleigh={3} mie={0.01} mieG={0.9} entorno={0.65} />
      <fogExp2 attach="fog" args={['#d89a6a', 0.007]} />
      <Sol elev={6} azim={235} color="#ffaa66" int={4.2} cielo="#ffb88a" suelo="#8a4a24" amb={0.4} area={18} />
      <Nubes t={t} n={16} color="#ffc8a0" op={0.75} />
      <Terreno tam={340} seg={340} alt={altOeste} col={colOeste} tex={TEX.tierra()} rep={110} centro={[0, 0, -100]} />
      {/* saloon de madera */}
      <group position={[-4.2, 0, -6.5]} rotation={[0, 0.45, 0]}>
        <mesh castShadow receiveShadow position={[0, 2.3, 0]}>
          <boxGeometry args={[6, 4.6, 4]} />
          {M(tablas)}
        </mesh>
        <mesh castShadow receiveShadow position={[0, 5.3, 2]}>
          <boxGeometry args={[6.4, 1.8, 0.2]} />
          {M(tablasOsc)}
        </mesh>
        <mesh position={[0, 5.3, 2.12]}>
          <boxGeometry args={[3.8, 0.8, 0.06]} />
          <meshStandardMaterial color="#efe0b8" roughness={0.9} />
        </mesh>
        {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => (
          <Caja key={x} t={[0.4, 0.46, 0.04]} p={[x, 5.3, 2.16]} c="#3a1a0c" />
        ))}
        <mesh castShadow receiveShadow position={[0, 3, 2.9]}>
          <boxGeometry args={[6.6, 0.14, 1.9]} />
          {M(tablasOsc)}
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.12, 2.9]}>
          <boxGeometry args={[6.6, 0.24, 1.9]} />
          {M(tablasOsc)}
        </mesh>
        {[-3.1, -1.05, 1.05, 3.1].map((x) => (
          <mesh key={x} castShadow position={[x, 1.5, 3.75]}>
            <boxGeometry args={[0.16, 3, 0.16]} />
            {M(tablasOsc)}
          </mesh>
        ))}
        <Caja t={[0.6, 1, 0.05]} p={[-0.32, 1.3, 2.03]} r={[0, Math.sin(t * 2) * 0.35, 0]} c="#b07a40" />
        <Caja t={[0.6, 1, 0.05]} p={[0.32, 1.3, 2.03]} r={[0, -Math.sin(t * 2) * 0.35, 0]} c="#b07a40" />
        {[-2, 2].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.7, 2.02]}>
              <planeGeometry args={[1, 1.1]} />
              <meshStandardMaterial color="#ffd08a" emissive="#ff9a3a" emissiveIntensity={1.6} />
            </mesh>
            <pointLight position={[x, 1.7, 2.8]} color="#ffa040" intensity={3} distance={4} />
          </group>
        ))}
        <mesh castShadow position={[3.6, 0.48, 2.7]}>
          <cylinderGeometry args={[0.38, 0.42, 0.95, 20]} />
          {M(tablasOsc)}
        </mesh>
        {[0.2, 0.75].map((y) => (
          <Toro key={y} rad={0.41} tubo={0.025} p={[3.6, y, 2.7]} r={[Math.PI / 2, 0, 0]} c="#3a3634" met={0.8} rug={0.5} />
        ))}
      </group>
      {/* depósito de agua */}
      <group position={[6, 0, -10]}>
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} castShadow position={[x, 2, z]}>
            <boxGeometry args={[0.18, 4, 0.18]} />
            {M(tablasOsc)}
          </mesh>
        )))}
        <mesh castShadow receiveShadow position={[0, 5.1, 0]}>
          <cylinderGeometry args={[1.6, 1.6, 2.2, 32]} />
          {M(tablas)}
        </mesh>
        {[4.3, 5.9].map((y) => (
          <Toro key={y} rad={1.62} tubo={0.03} p={[0, y, 0]} r={[Math.PI / 2, 0, 0]} c="#3a3634" met={0.8} rug={0.5} />
        ))}
        <Cono rad={1.8} h={0.9} p={[0, 6.65, 0]} c="#5a3a22" />
      </group>
      <Saguaro p={[3.2, altOeste(3.2, -2.6), -2.6]} s={0.95} g={-0.4} />
      <Saguaro p={[-7.4, altOeste(-7.4, -1.6), -1.6]} s={1.15} g={0.8} />
      <Saguaro p={[10, altOeste(10, -6), -6]} s={1.5} g={2} />
      <Saguaro p={[-14, altOeste(-14, -20), -20]} s={1.8} g={1} />
      {/* matorrales */}
      <Instancias
        n={160}
        geo={geoRoca(9)}
        mat={memo(() => matStd({color: '#7a7a42', roughness: 1, flatShading: true}))()}
        pos={(i) => {
          const x = (rnd(i * 1.7) - 0.5) * 60;
          const z = 2 - rnd(i * 2.9) * 40;
          return [x, altOeste(x, z), z];
        }}
        esc={(i) => {
          const s = 0.18 + rnd(i * 3.1) * 0.35;
          return [s * 1.3, s * 0.8, s * 1.3];
        }}
        rot={(i) => [0, rnd(i) * 6, 0]}
        color={(i) => ['#7a7a42', '#8a8048', '#6a6a3a', '#9a8a54'][i % 4]}
        sombra
      />
      {[...Array(10)].map((_, i) => {
        const x = (rnd(i * 5) - 0.5) * 30;
        const z = -2 - rnd(i * 7) * 20;
        return <RocaReal key={i} p={[x, altOeste(x, z), z]} s={0.3 + rnd(i) * 0.6} semilla={i + 4} c="#a8603a" />;
      })}
      {/* bola de rastrojos que rueda */}
      <group position={[-6 + ((t * 2.2) % 14), 0.45 + Math.abs(Math.sin(t * 4)) * 0.3, 1.5]} rotation={[0, 0, -t * 4]}>
        {[0, 1, 2].map((k) => (
          <mesh key={k} castShadow rotation={[k, k * 2, 0]}>
            <icosahedronGeometry args={[0.45 - k * 0.08, 2]} />
            <meshStandardMaterial color={['#a87a3a', '#8a6028', '#b8904a'][k]} wireframe />
          </mesh>
        ))}
      </group>
      {/* valla de troncos */}
      {[...Array(7)].map((_, i) => (
        <mesh key={i} castShadow position={[3 + i * 1.2, 0.5, 0.2 - i * 0.3]}>
          <cylinderGeometry args={[0.07, 0.08, 1, 8]} />
          {M(tablasOsc)}
        </mesh>
      ))}
      {[0.75, 0.4].map((y) => (
        <mesh key={y} castShadow position={[6.6, y, -0.7]} rotation={[0, 0.25, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 7.6, 8]} />
          {M(tablasOsc)}
        </mesh>
      ))}
    </>
  );
};

/* =================================================================== 8 · ESTADIO */

const Estadio: React.FC<PropsE> = ({t}) => {
  const filas = 14;
  const porFila = 90;
  const cesped = TEX.cesped();
  const hormigon = useMemo(
    () =>
      textura('hormigon', 256, (u, v) => fbm(u * 20, v * 20, 4, 20) * 0.4 + rnd(u * 331 + v * 977) * 0.2, (u, v, h) => {
        const k = 120 + h * 50;
        return [k, k, k * 1.03];
      }, 1.5),
    [],
  );
  const conoLuz = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {},
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'varying vec2 vUv; void main(){ float a = pow(vUv.y, 2.2) * 0.07; gl_FragColor = vec4(vec3(0.85,0.9,1.0)*a, 1.0); }',
      }),
    [],
  );
  return (
    <>
      <CieloDegradado stops={[[0, '#01020a'], [0.4, '#060c1e'], [0.5, '#1a2440'], [1, '#05080f']]} estrellas={600} entorno={0.6} />
      <fogExp2 attach="fog" args={['#121a2c', 0.006]} />
      <Sol elev={52} azim={20} color="#eef4ff" int={2.8} cielo="#8aa8e0" suelo="#1a3a1a" amb={0.35} area={16} />
      {/* césped con franjas de corte */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, -10]}>
        <planeGeometry args={[110, 75]} />
        <meshStandardMaterial map={cesped.map} normalMap={cesped.normal} roughness={0.9} map-repeat={new THREE.Vector2(8, 7)} normalMap-repeat={new THREE.Vector2(8, 7)} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[400, 32]} />
        <meshStandardMaterial color="#2a2c30" roughness={1} />
      </mesh>
      {/* briznas reales cerca de la cámara */}
      <Hierba
        t={t * 0.4}
        n={24000}
        donde={(i) => {
          const x = (rnd(i * 1.1) - 0.5) * 18;
          const z = 7 - rnd(i * 2.3) * 16;
          return [x, z];
        }}
        alt={() => 0}
        colores={['#2e8a34', '#38a040', '#2a7a2e', '#44aa48']}
        altura={[0.05, 0.11]}
        ancho={0.035}
        viento={0.3}
      />
      {/* líneas de cal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -9]}>
        <ringGeometry args={[4.4, 4.55, 96]} />
        <meshStandardMaterial color="#f4f4f0" roughness={0.8} />
      </mesh>
      <Caja t={[100, 0.01, 0.14]} p={[0, 0.012, -9]} c="#f4f4f0" sombra={false} />
      <Caja t={[0.14, 0.01, 16]} p={[-6.5, 0.012, 1]} c="#f4f4f0" sombra={false} />
      <Caja t={[0.14, 0.01, 16]} p={[6.5, 0.012, 1]} c="#f4f4f0" sombra={false} />
      {/* portería con red */}
      <group position={[8.5, 0, 1]} rotation={[0, -Math.PI / 2, 0]}>
        <Cil ra={0.06} h={2.44} p={[-3.66, 1.22, 0]} c="#ffffff" rug={0.25} met={0.3} />
        <Cil ra={0.06} h={2.44} p={[3.66, 1.22, 0]} c="#ffffff" rug={0.25} met={0.3} />
        <Cil ra={0.06} h={7.38} p={[0, 2.44, 0]} r={[0, 0, Math.PI / 2]} c="#ffffff" rug={0.25} met={0.3} />
        <mesh position={[0, 1.2, -1]} rotation={[-0.42, 0, 0]}>
          <planeGeometry args={[7.3, 2.65, 56, 20]} />
          <meshBasicMaterial color="#f0f0f0" wireframe transparent opacity={0.45} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 3.66, 1.2, -0.55]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.1, 2.4, 8, 18]} />
            <meshBasicMaterial color="#f0f0f0" wireframe transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
      {/* gradas de hormigón con público haciendo la ola */}
      <group position={[0, 0, -48]}>
        <mesh receiveShadow position={[0, 0.6, 4]}>
          <boxGeometry args={[100, 1.2, 0.3]} />
          <meshStandardMaterial color="#1a3a8a" emissive="#2a5aff" emissiveIntensity={0.4} />
        </mesh>
        {[...Array(filas)].map((_, f) => (
          <mesh key={f} receiveShadow position={[0, 1 + f * 0.8, f * -1.3]}>
            <boxGeometry args={[100, 0.8, 1.3]} />
            <meshStandardMaterial map={hormigon.map} normalMap={hormigon.normal} roughness={0.95} />
          </mesh>
        ))}
        <Instancias
          n={filas * porFila}
          geo={memo(() => new THREE.CapsuleGeometry(0.2, 0.35, 3, 6))()}
          mat={memo(() => matStd({roughness: 0.85}))()}
          pos={(i) => {
            const f = Math.floor(i / porFila);
            const k = i % porFila;
            const ola = Math.max(0, Math.sin(k * 0.14 - t * 3.5)) ** 4 * 0.5;
            return [(k - porFila / 2) * 1.05 + rnd(i) * 0.3, 1.75 + f * 0.8 + ola + Math.abs(Math.sin(t * 6 + i)) * 0.04, f * -1.3 + 0.1];
          }}
          color={(i) => ['#d81e34', '#f4f4f4', '#ffc81a', '#1e4ad8', '#d81e34', '#e8c0a0', '#6a4a30', '#1a1a1a'][Math.floor(rnd(i) * 8)]}
        />
        {/* cubierta */}
        <mesh castShadow position={[0, 14, -10]} rotation={[0.18, 0, 0]}>
          <boxGeometry args={[104, 0.4, 14]} />
          <meshStandardMaterial color="#3a3e48" metalness={0.6} roughness={0.5} />
        </mesh>
        {[...Array(9)].map((_, i) => (
          <mesh key={i} position={[(i - 4) * 12, 14.6, -4]}>
            <boxGeometry args={[3, 0.2, 0.6]} />
            <meshStandardMaterial color="#fff" emissive="#eef4ff" emissiveIntensity={6} />
          </mesh>
        ))}
      </group>
      {/* torres de focos con haces de luz */}
      {[-22, 22].map((x) => (
        <group key={x} position={[x, 0, -26]}>
          <Cil ra={0.3} rb={0.45} h={22} p={[0, 11, 0]} c="#8a909a" met={0.7} rug={0.4} />
          <group position={[0, 22.5, 0]} rotation={[0.45, x > 0 ? -0.55 : 0.55, 0]}>
            <Caja t={[5, 3, 0.5]} c="#2a2e36" met={0.6} rug={0.4} />
            {[...Array(12)].map((_, i) => (
              <mesh key={i} position={[(i % 4) * 1.15 - 1.72, Math.floor(i / 4) * 0.9 - 0.9, 0.28]}>
                <circleGeometry args={[0.38, 20]} />
                <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={12} />
              </mesh>
            ))}
            <mesh material={conoLuz} position={[0, 0, 13]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[9, 26, 32, 1, true]} />
            </mesh>
          </group>
          <pointLight position={[0, 20, 6]} intensity={160} distance={60} decay={1.4} color="#eef4ff" />
        </group>
      ))}
      {/* videomarcador */}
      <group position={[0, 18, -70]}>
        <Caja t={[16, 6, 0.6]} c="#0a0c14" />
        <mesh position={[-4, 0, 0.32]}>
          <planeGeometry args={[6.5, 4.6]} />
          <meshStandardMaterial color="#000" emissive="#ff3a3a" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[4, 0, 0.32]}>
          <planeGeometry args={[6.5, 4.6]} />
          <meshStandardMaterial color="#000" emissive="#3a8aff" emissiveIntensity={2.5} />
        </mesh>
      </group>
      {/* confeti */}
      <Instancias
        n={340}
        geo={memo(() => new THREE.PlaneGeometry(0.07, 0.11))()}
        mat={memo(() => new THREE.MeshStandardMaterial({side: THREE.DoubleSide, roughness: 0.4, metalness: 0.3}))()}
        pos={(i) => [(rnd(i) - 0.5) * 20, 9 - ((t * (0.7 + rnd(i + 1)) + rnd(i + 2) * 9) % 9), (rnd(i + 3) - 0.7) * 16]}
        rot={(i) => [t * (2 + rnd(i) * 3) + i, t * 2 + i * 0.7, 0]}
        color={(i) => ['#ff3a5a', '#ffd23a', '#3ad8ff', '#ffffff'][i % 4]}
      />
    </>
  );
};

/* =================================================================== registro */

export type Post3D = {bloom?: number; umbral?: number; ao?: number; vineta?: number; bokeh?: number};

export type Escenario3D = {
  nombre: string;
  detalle: string;
  C: React.FC<PropsE>;
  /** dónde mira la cámara y a qué distancia/altura suele colocarse */
  foco: V3;
  dist: number;
  altura: number;
  post?: Post3D;
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
        <meshPhysicalMaterial color="#ffffff" roughness={0.35} clearcoat={0.6} flatShading />
      </mesh>
      <mesh scale={1.004}>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#1a1a1a" wireframe />
      </mesh>
    </group>
  );
};

const F: Pick<Escenario3D, 'foco' | 'dist' | 'altura'> = {foco: [0, 1.9, 0], dist: 8.2, altura: 2.7};

export const ESCENARIOS_3D = {
  isla: {nombre: 'Isla pirata', detalle: 'mar con reflejos · palmeras · cofre · galeón', C: IslaPirata, ...F, post: {bloom: 0.35}},
  polo: {nombre: 'Polo Norte', detalle: 'aurora boreal · lago helado · iglú · nieve', C: PoloNorte, ...F, post: {bloom: 0.9, umbral: 0.6, vineta: 0.6}},
  marte: {nombre: 'Marte', detalle: 'cráteres · cúpula · rover · paneles', C: Marte, ...F, post: {bloom: 0.4}},
  egipto: {nombre: 'Antiguo Egipto', detalle: 'dunas · pirámides · templo · oasis', C: Egipto, ...F, post: {bloom: 0.3}},
  feria: {nombre: 'Feria nocturna', detalle: 'noria · carpa · charcos · bombillas', C: Feria, ...F, post: {bloom: 1.2, umbral: 0.55, vineta: 0.6}},
  golosinas: {nombre: 'País de las golosinas', detalle: 'caramelo brillante · río de chocolate', C: Golosinas, ...F, post: {bloom: 0.35}},
  oeste: {nombre: 'Lejano Oeste', detalle: 'atardecer · mesetas · saloon · cactus', C: Oeste, ...F, post: {bloom: 0.5}},
  estadio: {nombre: 'Estadio', detalle: 'césped · focos · público · confeti', C: Estadio, ...F, extra: Balon, post: {bloom: 1, umbral: 0.6}},
} satisfies Record<string, Escenario3D>;

export type NombreEscenario3D = keyof typeof ESCENARIOS_3D;
