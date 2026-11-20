import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {geoArterias, geoColumna, geoCostillas, geoHuesosLargos, geoPelvis, geoVenas} from '../ayuno/anatomia';
import {Cerebro, Corazon, Enjambre, Estomago, Higado, Intestinos, PostMedico, Pulmones, rnd, Rinones, V3} from '../ayuno/escena';
import {animarMat, matHolograma, matOrgano, matPiel, matVaso} from '../ayuno/shaders';
import {esofago, geoBotella, geoGota, geoHombre, geoLiquidoBotella, geoMusculosHombre, geoPancreas, geoTapon, geoVaso, geoAguaVaso, MANO} from './hombre';

/**
 * Piezas 3D del vídeo "Coca-Cola 30 días": lienzo, hombre anatómico semitransparente, botella
 * genérica de refresco (sin marca), vaso de agua, mesa, esófago con el trago y páncreas.
 */

export const brillo = (c: string, i = 2) => new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: i, roughness: 0.3, toneMapped: false});

/** Lienzo 1080×1920 con acabado de cine (como el del vídeo del ayuno) y planos de corte activados. */
export const LienzoCola: React.FC<{children: React.ReactNode; foco: number; rango?: number; niebla?: number; fondo?: string; post?: Partial<React.ComponentProps<typeof PostMedico>>}> = ({
  children,
  foco,
  rango,
  niebla = 0.2,
  fondo = '#02050c',
  post,
}) => (
  <ThreeCanvas
    width={1080}
    height={1920}
    gl={{preserveDrawingBuffer: true, antialias: true}}
    camera={{fov: 35, near: 0.005, far: 200}}
    onCreated={(s) => {
      s.gl.localClippingEnabled = true;
    }}
  >
    <color attach="background" args={[fondo]} />
    <fogExp2 attach="fog" args={[fondo, niebla]} />
    {children}
    <PostMedico foco={foco} rango={rango} {...post} />
  </ThreeCanvas>
);

/* ------------------------------------------------------------------ páncreas */
export const Pancreas: React.FC<{t: number; p?: V3; s?: number; r?: V3; brillo?: number; op?: number}> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], brillo: b = 0, op = 1}) => {
  const mat = useMemo(
    () => matOrgano({color: '#c88a6a', color2: '#f0c09a', vasos: '#a8404a', vasosEsc: 6, motas: 14, borde: '#7dffb0', bordeInt: 0.7, ondula: 0.003, rug: 0.45, barniz: 0.9, opacidad: op}),
    [op],
  );
  animarMat(mat, t, b * (0.5 + 0.5 * Math.sin(t * 4)));
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh geometry={geoPancreas()} material={mat} />
    </group>
  );
};

/* ------------------------------------------------------------------ esófago con el refresco */
/** Esófago semitransparente; `trago` (0..1) = posición del refresco que baja de la boca al estómago. */
export const Esofago: React.FC<{t: number; trago: number; op?: number}> = ({t, trago, op = 0.4}) => {
  const {geo, curva} = esofago();
  const mats = useMemo(() => {
    const pared = matOrgano({color: '#c8706a', color2: '#f0a8a0', vasos: '#8a2a3a', vasosEsc: 8, motas: 10, borde: '#ffb0a0', bordeInt: 1.2, rug: 0.35, barniz: 1, opacidad: op});
    pared.side = THREE.DoubleSide;
    pared.depthWrite = false;
    return {pared, cola: brillo('#b8501a', 1.6), burbuja: brillo('#ffd8a8', 2.2)};
  }, [op]);
  animarMat(mats.pared, t);
  const v = new THREE.Vector3();
  return (
    <group>
      <mesh geometry={geo} material={mats.pared} />
      {/* bolo de refresco: esferas oscuras-ámbar a lo largo del tubo */}
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(1, 14, 10), [])}
        mat={mats.cola}
        n={70}
        f={(i, o) => {
          const u = trago - (i / 70) * 0.22;
          const vis = u > 0 && u < 1;
          curva.getPointAt(Math.min(1, Math.max(0, u)), v);
          o.position.set(v.x + (rnd(i) - 0.5) * 0.004, v.y, v.z + (rnd(i + 1) - 0.5) * 0.004);
          o.scale.setScalar(vis ? 0.0095 * (0.7 + 0.3 * Math.sin((i / 70) * Math.PI)) : 0);
        }}
      />
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(1, 8, 6), [])}
        mat={mats.burbuja}
        n={40}
        f={(i, o) => {
          const u = trago - rnd(i + 3) * 0.2;
          const vis = u > 0 && u < 1;
          curva.getPointAt(Math.min(1, Math.max(0, u)), v);
          const a = rnd(i) * 6.28 + t * 3;
          o.position.set(v.x + Math.cos(a) * 0.005, v.y + Math.sin(t * 9 + i) * 0.002, v.z + Math.sin(a) * 0.005);
          o.scale.setScalar(vis ? 0.0018 + rnd(i + 5) * 0.0015 : 0);
        }}
      />
    </group>
  );
};

/* ------------------------------------------------------------------ hombre anatómico */
export type EstadoHombre = {
  t: number;
  /** opacidad de la piel (1 = cuerpo opaco) */
  piel?: number;
  /** intensidad del holograma (cuerpo transparente) */
  holo?: number;
  musculos?: number;
  /** capa de grasa (aumento de peso, ilustrativo) */
  grasa?: number;
  esqueleto?: number;
  vasos?: number;
  organos?: number;
  /** resaltes de órganos (0..1) */
  luzHigado?: number;
  luzCorazon?: number;
  luzCerebro?: number;
  luzPancreas?: number;
  luzEstomago?: number;
  /** grasa en el hígado (0..1, representación) */
  higadoGraso?: number;
  /** esófago visible y refresco bajando (0..1) */
  esofago?: number;
  trago?: number;
  /** pulmones y corazón visibles (0 = se ocultan para ver el esófago) */
  torax?: number;
  giro?: number;
};

export const CuerpoHombre: React.FC<EstadoHombre & {p?: V3; s?: number}> = ({
  t,
  piel = 0,
  holo = 0.8,
  musculos = 0,
  grasa = 0,
  esqueleto = 0.35,
  vasos = 1,
  organos = 1,
  luzHigado = 0,
  luzCorazon = 0,
  luzCerebro = 0,
  luzPancreas = 0,
  luzEstomago = 0,
  higadoGraso = 0,
  esofago: esof = 0,
  trago = 0,
  torax = 1,
  giro = 0,
  p = [0, 0, 0],
  s = 1,
}) => {
  const m = useMemo(
    () => ({
      piel: matPiel(),
      holo: matHolograma('#2a8aff', '#8ad8ff'),
      grasa: matHolograma('#ffb030', '#ffd890'),
      musculo: (() => {
        const x = matOrgano({color: '#7a1a1e', color2: '#b8403a', motas: 6, estrias: 180, borde: '#ff6a4a', bordeInt: 0.55, rug: 0.5, barniz: 0.6, opacidad: 0.8});
        x.side = THREE.FrontSide;
        return x;
      })(),
      hueso: new THREE.MeshPhysicalMaterial({color: '#e8dcc4', roughness: 0.5, clearcoat: 0.3, transparent: true, opacity: 0.35, depthWrite: false, emissive: '#3a3a4a'}),
      arteria: matVaso('#d01a24', '#ffb8a8', 0.7, 0.95),
      vena: matVaso('#2a3ab8', '#8ab8ff', 0.5, 0.9),
      gota: new THREE.MeshPhysicalMaterial({color: '#ffd060', emissive: '#c88a10', emissiveIntensity: 0.9, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.9}),
    }),
    [],
  );
  m.piel.color.set('#b98468');
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
  animarMat(m.musculo, t);
  m.hueso.opacity = 0.2 * esqueleto;
  m.hueso.visible = esqueleto > 0.01;
  for (const v of [m.arteria, m.vena]) {
    (v.uniforms.uT as {value: number}).value = t;
    (v.uniforms.uOp as {value: number}).value = 0.95 * vasos;
    v.visible = vasos > 0.01;
  }
  const pulso = (k: number, f = 3) => k * (0.6 + 0.4 * Math.sin(t * f));
  const hig: V3 = [-0.04, 1.165, 0.02];
  return (
    <group position={p} scale={s} rotation={[0, giro, 0]}>
      {[...geoColumna(), ...geoCostillas(), ...geoPelvis(), ...geoHuesosLargos()].map((g, i) => (
        <mesh key={`h${i}`} geometry={g} material={m.hueso} />
      ))}
      {geoArterias().map((g, i) => (
        <mesh key={`a${i}`} geometry={g} material={m.arteria} />
      ))}
      {geoVenas().map((g, i) => (
        <mesh key={`v${i}`} geometry={g} material={m.vena} />
      ))}
      {organos > 0.01 && (
        <group>
          <Cerebro t={t} p={[0, 1.685, -0.005]} s={0.15} brillo={1 + luzCerebro * 1.5} chispas={luzCerebro > 0.05 ? 18 : 0} />
          {torax > 0.5 && <Pulmones t={t} p={[0, 1.33, -0.005]} s={[0.28, 0.26, 0.28]} op={0.45} />}
          {torax > 0.5 && <Corazon t={t} p={[0.022, 1.3, 0.035]} s={0.1} alerta={pulso(luzCorazon * 0.8, 6.8)} brillo={1 + luzCorazon} />}
          <Higado t={t} p={hig} s={0.12} borde={higadoGraso > 0.05 || luzHigado > 0.05 ? '#ffd040' : '#ffb050'} alerta={0} />
          <Pancreas t={t} p={[0.012, 1.105, -0.03]} s={0.1} brillo={luzPancreas} />
          <Estomago t={t} p={[0.06, 1.13, 0.03]} s={0.19} />
          <Rinones t={t} p={[0, 1.065, -0.055]} s={0.1} />
          <Intestinos t={t} p={[0, 0.99, 0.015]} s={0.82} />
          {higadoGraso > 0.01 && (
            <Enjambre
              geo={geoGota()}
              mat={m.gota}
              n={60}
              f={(i, o) => {
                const a = rnd(i) * Math.PI * 2;
                const rr = 0.012 + rnd(i + 1) * 0.04;
                o.position.set(hig[0] - 0.01 + Math.cos(a) * rr, hig[1] + (rnd(i + 2) - 0.5) * 0.035, hig[2] + 0.02 + Math.sin(a) * rr * 0.5);
                o.scale.setScalar(0.009 * Math.min(1, Math.max(0, higadoGraso * 1.6 - rnd(i + 3) * 0.6)) * (0.6 + rnd(i + 4) * 0.6));
              }}
            />
          )}
          {/* luces de resalte de los órganos */}
          <pointLight position={[hig[0] - 0.02, hig[1], 0.16]} intensity={luzHigado * 0.5} distance={0.35} color="#ffc030" />
          <pointLight position={[0.03, 1.3, 0.18]} intensity={pulso(luzCorazon * 0.5, 6.8)} distance={0.35} color="#ff3a3a" />
          <pointLight position={[0, 1.72, 0.2]} intensity={luzCerebro * 0.4} distance={0.35} color="#b88aff" />
          <pointLight position={[0.02, 1.11, 0.16]} intensity={luzPancreas * 0.45} distance={0.3} color="#7dffb0" />
          <pointLight position={[0.08, 1.15, 0.18]} intensity={luzEstomago * 0.18} distance={0.3} color="#ffa040" />
        </group>
      )}
      {esof > 0.01 && <Esofago t={t} trago={trago} op={0.62 * esof} />}
      <mesh geometry={geoMusculosHombre()} material={m.musculo} />
      <mesh geometry={geoHombre()} material={m.grasa} scale={[1.02 + grasa * 0.03, 1.003, 1.03 + grasa * 0.05]} />
      <mesh geometry={geoHombre()} material={m.piel} />
      <mesh geometry={geoHombre()} material={m.holo} scale={[1.004, 1.001, 1.006]} />
    </group>
  );
};

/* ------------------------------------------------------------------ botella genérica */
const texEtiqueta = (() => {
  let tx: THREE.CanvasTexture | null = null;
  return () => {
    if (tx) return tx;
    const W = 1024;
    const H = 256;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const g = cv.getContext('2d')!;
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#9a0a10');
    gr.addColorStop(0.5, '#e01a20');
    gr.addColorStop(1, '#8a060c');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(0, 26, W, 6);
    g.fillRect(0, H - 32, W, 6);
    g.font = '800 120px Poppins, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const x of [W * 0.25, W * 0.75]) {
      g.fillStyle = '#ffffff';
      g.fillText('COLA', x, H / 2 - 4);
    }
    g.font = '600 26px Poppins, sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillText('REFRESCO · 500 ml', W * 0.5, H / 2 + 2);
    tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    return tx;
  };
})();

/** Botella de refresco de cola genérica. `s` = altura en metros; base en el origen. */
export const Botella: React.FC<{t: number; p?: V3; r?: V3; s?: number; nivel?: number; burbujas?: number; op?: number}> = ({t, p = [0, 0, 0], r = [0, 0, 0], s = 0.22, nivel = 0.8, burbujas = 1, op = 1}) => {
  const mats = useMemo(
    () => ({
      pet: new THREE.MeshPhysicalMaterial({color: '#b8a8a0', roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, specularIntensity: 1}),
      liquido: new THREE.MeshPhysicalMaterial({color: '#0a0301', emissive: '#3a0e03', emissiveIntensity: 0.45, roughness: 0.1, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.97}),
      etiqueta: new THREE.MeshPhysicalMaterial({map: texEtiqueta(), roughness: 0.35, clearcoat: 0.6, emissive: '#300004', transparent: true}),
      tapon: new THREE.MeshPhysicalMaterial({color: '#d0141a', roughness: 0.35, clearcoat: 0.8, transparent: true}),
      burbuja: brillo('#ffcf9a', 1.4),
    }),
    [],
  );
  mats.pet.opacity = 0.12 * op;
  mats.liquido.opacity = 0.97 * op;
  mats.etiqueta.opacity = op;
  mats.tapon.opacity = op;
  const liq = useMemo(() => geoLiquidoBotella(Math.max(0.02, nivel)), [nivel]);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh geometry={liq} material={mats.liquido} renderOrder={1} />
      <mesh material={mats.etiqueta} position={[0, 0.3, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.1745, 0.1745, 0.25, 64, 1, true]} />
      </mesh>
      <mesh geometry={geoBotella()} material={mats.pet} renderOrder={3} />
      <mesh geometry={geoTapon()} material={mats.tapon} position={[0, 0.95, 0]} />
      {burbujas > 0 && (
        <Enjambre
          geo={useMemo(() => new THREE.SphereGeometry(1, 8, 6), [])}
          mat={mats.burbuja}
          n={50}
          f={(i, o) => {
            const f = (t * (0.25 + rnd(i) * 0.3) + rnd(i + 1)) % 1;
            const y = 0.04 + f * (nivel - 0.08);
            const a = rnd(i + 2) * Math.PI * 2;
            const rr = rnd(i + 3) * 0.13 * (y > 0.56 ? Math.max(0.3, 1 - (y - 0.56) * 3.2) : 1);
            o.position.set(Math.cos(a) * rr + Math.sin(t * 5 + i) * 0.004, y, Math.sin(a) * rr);
            o.scale.setScalar((0.006 + rnd(i + 4) * 0.006) * burbujas * op);
          }}
        />
      )}
    </group>
  );
};

/* ------------------------------------------------------------------ vaso de agua */
export const VasoAgua: React.FC<{t: number; p?: V3; s?: number; brillo?: number}> = ({t, p = [0, 0, 0], s = 0.12, brillo: b = 1}) => {
  const mats = useMemo(
    () => ({
      vidrio: new THREE.MeshPhysicalMaterial({color: '#e8f6ff', roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide, emissive: '#0a2a3a'}),
      agua: new THREE.MeshPhysicalMaterial({color: '#7ad0ff', emissive: '#1a6aa0', emissiveIntensity: 0.7, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.55}),
      destello: brillo('#d8f4ff', 2),
    }),
    [],
  );
  mats.agua.emissiveIntensity = 0.5 + 0.5 * b;
  return (
    <group position={p} scale={s}>
      <mesh geometry={geoAguaVaso()} material={mats.agua} renderOrder={1} />
      <mesh geometry={geoVaso()} material={mats.vidrio} renderOrder={2} />
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(1, 8, 6), [])}
        mat={mats.destello}
        n={14}
        f={(i, o) => {
          const f = (t * 0.15 + rnd(i)) % 1;
          const a = rnd(i + 2) * Math.PI * 2;
          o.position.set(Math.cos(a) * 0.2 * rnd(i + 3), 0.1 + f * 0.62, Math.sin(a) * 0.2 * rnd(i + 3));
          o.scale.setScalar(0.008 + rnd(i + 4) * 0.008);
        }}
      />
    </group>
  );
};

/* ------------------------------------------------------------------ mesa */
export const MESA = {p: [0.44, 0, 0.36] as V3, alto: 0.74};
export const Mesa: React.FC = () => {
  const mats = useMemo(
    () => ({
      tablero: new THREE.MeshPhysicalMaterial({color: '#1c2632', roughness: 0.18, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08}),
      borde: brillo('#3ab8ff', 1.2),
      pata: new THREE.MeshStandardMaterial({color: '#1a2230', roughness: 0.4, metalness: 0.8}),
    }),
    [],
  );
  const [x, , z] = MESA.p;
  const h = MESA.alto;
  return (
    <group position={[x, 0, z]}>
      <mesh material={mats.tablero} position={[0, h - 0.012, 0]}>
        <boxGeometry args={[0.42, 0.024, 0.34]} />
      </mesh>
      <mesh material={mats.borde} position={[0, h - 0.012, 0.171]}>
        <boxGeometry args={[0.42, 0.004, 0.002]} />
      </mesh>
      <mesh material={mats.pata} position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.018, 0.024, h - 0.02, 20]} />
      </mesh>
      <mesh material={mats.pata} position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.13, 0.14, 0.016, 40]} />
      </mesh>
    </group>
  );
};

/** Punto de la mano para colocar objetos sostenidos (base del objeto un poco por debajo). */
export const enMano = (alto: number): V3 => [MANO[0], MANO[1] - alto * 0.45, MANO[2]];

/** Suelo oscuro reflectante con un círculo de luz. */
export const Suelo: React.FC<{color?: string}> = ({color = '#3a8aff'}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {uC: {value: new THREE.Color(color)}},
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 uC; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d) * 0.35 + smoothstep(0.42, 0.40, d) * smoothstep(0.38, 0.40, d) * 0.6; gl_FragColor = vec4(uC * a, a); }',
      }),
    [color],
  );
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
      <planeGeometry args={[2.4, 2.4]} />
    </mesh>
  );
};
