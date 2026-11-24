import React, {useMemo} from 'react';
import * as THREE from 'three';
import {geoArterias, geoCerebelo, geoColumna, geoCostillas, geoHemisferio, geoHuesosLargos, geoPelvis, geoVenas, tuboVariable} from '../ayuno/anatomia';
import {Corazon, Enjambre, Estomago, Higado, Intestinos, Pulmones, rnd, Rinones, V3} from '../ayuno/escena';
import {animarMat, matHolograma, matOrgano, matPiel, matVaso} from '../ayuno/shaders';
import {brillo} from '../cola/objetos';
import {COLOR_ICONO, dibujarPantalla, H_PANT, Icono, icono, OpcionesPantalla, W_PANT} from './pantalla';
import {
  enCabeza,
  geoBrazoArteria,
  geoBrazoHuesos,
  geoBrazoVena,
  geoCornea,
  geoCuerpoMovil,
  geoGlobo,
  geoIris,
  geoNucleo,
  geoPantalla,
  geoParpado,
  geoPersonaMovil,
  geoPersonaReposo,
  geoPineal,
  MOVIL,
  quatMovil,
  TEL,
} from './persona';

/**
 * Piezas 3D del vídeo "Móvil 8 horas": móvil con la pantalla animada, hombre que lo mira
 * (anatomía semitransparente), cerebro con sus estructuras internas (sistema de recompensa,
 * corteza prefrontal, glándula pineal), ojo con párpados e iconos de notificación.
 */

export {brillo};

/* ------------------------------------------------------------------ móvil */
export type PropsTelefono = Omit<OpcionesPantalla, 't'> & {
  t: number;
  p?: V3;
  q?: THREE.Quaternion;
  r?: V3;
  s?: number;
  /** multiplicador del brillo de la pantalla */
  luz?: number;
};
/** Móvil genérico: cuerpo de aluminio oscuro y pantalla (cara +z) dibujada cada fotograma. */
export const Telefono: React.FC<PropsTelefono> = ({t, p = [0, 0, 0], q, r = [0, 0, 0], s = 1, luz = 1, ...o}) => {
  const res = useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = W_PANT;
    cv.height = H_PANT;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return {
      cv,
      tex,
      pantalla: new THREE.MeshBasicMaterial({map: tex, toneMapped: false}),
      cuerpo: new THREE.MeshPhysicalMaterial({color: '#20242c', roughness: 0.28, metalness: 0.85, clearcoat: 0.6, clearcoatRoughness: 0.2}),
      cristal: new THREE.MeshPhysicalMaterial({color: '#05060a', roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, metalness: 0.1}),
      camara: new THREE.MeshPhysicalMaterial({color: '#0a0c10', roughness: 0.1, clearcoat: 1}),
    };
  }, []);
  dibujarPantalla(res.cv.getContext('2d')!, {...o, t});
  res.tex.needsUpdate = true;
  res.pantalla.color.setScalar(luz);
  const quat = q ?? new THREE.Quaternion().setFromEuler(new THREE.Euler(...r));
  return (
    <group position={p} quaternion={quat} scale={s}>
      <mesh geometry={geoCuerpoMovil()} material={res.cuerpo} />
      <mesh material={res.cristal} position={[0, 0, TEL.fondo / 2 + 0.0002]}>
        <planeGeometry args={[TEL.ancho - 0.0015, TEL.alto - 0.0015]} />
      </mesh>
      <mesh geometry={geoPantalla()} material={res.pantalla} position={[0, 0, TEL.fondo / 2 + 0.0005]} />
      {/* cámaras traseras */}
      <mesh material={res.camara} position={[-0.018, 0.058, -TEL.fondo / 2 - 0.0012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0075, 0.0075, 0.0025, 32]} />
      </mesh>
      <mesh material={res.camara} position={[-0.018, 0.038, -TEL.fondo / 2 - 0.0012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0075, 0.0075, 0.0025, 32]} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ iconos flotantes */
const texIconos: Partial<Record<Icono, THREE.CanvasTexture>> = {};
export const texIcono = (tipo: Icono) => {
  const ya = texIconos[tipo];
  if (ya) return ya;
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const c = COLOR_ICONO[tipo];
  const gr = g.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S / 2);
  gr.addColorStop(0, c);
  gr.addColorStop(0.62, c);
  gr.addColorStop(0.64, 'rgba(255,255,255,0.0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2);
  g.fill();
  const halo = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
  halo.addColorStop(0, c + 'aa');
  halo.addColorStop(1, c + '00');
  g.fillStyle = halo;
  g.fillRect(0, 0, S, S);
  icono(g, tipo, S / 2, S / 2 + 4, S * 0.42, '#ffffff');
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  texIconos[tipo] = tx;
  return tx;
};
/** Icono (siempre de cara a la cámara). */
export const IconoFlotante: React.FC<{tipo: Icono; p: V3; s: number; op?: number; luz?: number}> = ({tipo, p, s, op = 1, luz = 1.6}) => {
  const mat = useMemo(() => new THREE.SpriteMaterial({map: texIcono(tipo), transparent: true, depthWrite: false, toneMapped: false}), [tipo]);
  mat.opacity = op;
  mat.color.setScalar(luz);
  if (s <= 0 || op <= 0.001) return null;
  return <sprite material={mat} position={p} scale={[s, s, s]} />;
};

/* ------------------------------------------------------------------ cerebro con estructuras internas */
/** Zona luminosa sobre la corteza: brillo aditivo donde la coordenada z del objeto supera un umbral. */
const matZona = (color: string) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {uC: {value: new THREE.Color(color)}, uI: {value: 0}, uT: {value: 0}, uZ: {value: 0.16}},
    vertexShader: /* glsl */ `
      varying vec3 vObj; varying vec3 vN; varying vec3 vV;
      void main(){ vObj = position; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uC; uniform float uI; uniform float uT; uniform float uZ;
      varying vec3 vObj; varying vec3 vN; varying vec3 vV;
      void main(){
        float z = smoothstep(uZ, uZ + 0.22, vObj.z);
        float fr = 0.35 + 0.65 * pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.4);
        float onda = 0.75 + 0.25 * sin(vObj.y * 40.0 - uT * 4.0);
        gl_FragColor = vec4(uC * z * fr * onda * uI, 1.0);
      }`,
  });

/** Vía VTA → núcleo accumbens → corteza prefrontal (coordenadas del cerebro, unidad ≈ 1). */
export const VTA: V3 = [0, -0.2, -0.05];
export const ACCUMBENS: V3 = [0.055, -0.08, 0.15];
export const PREFRONTAL: V3 = [0.08, 0.1, 0.36];
export const PINEAL: V3 = [0, -0.03, -0.13];
const viaRecompensa = (lado: number) =>
  tuboVariable(
    [VTA, [0.025 * lado, -0.19, 0.05], [ACCUMBENS[0] * lado, ACCUMBENS[1], ACCUMBENS[2]], [0.07 * lado, 0.0, 0.28], [PREFRONTAL[0] * lado, PREFRONTAL[1], PREFRONTAL[2]]],
    (u) => 0.011 * (1 - u * 0.4),
    120,
    10,
  );
export const curvasRecompensa = (() => {
  let c: {izq: ReturnType<typeof viaRecompensa>; der: ReturnType<typeof viaRecompensa>} | null = null;
  return () => (c ??= {izq: viaRecompensa(1), der: viaRecompensa(-1)});
})();

export type PropsCerebro = {
  t: number;
  p?: V3;
  s?: number;
  r?: V3;
  /** opacidad de la corteza (baja = se ven las estructuras internas) */
  op?: number;
  brillo?: number;
  /** vía de la recompensa (0..1: cuánto del recorrido está encendido) */
  recompensa?: number;
  /** resalte de la corteza prefrontal */
  prefrontal?: number;
  /** glándula pineal visible y su actividad (melatonina) */
  pineal?: number;
  chispas?: number;
  /** tono apagado y frío (cansancio) */
  cansancio?: number;
  colorBorde?: string;
};

export const CerebroMovil: React.FC<PropsCerebro> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], op = 1, brillo: b = 1, recompensa = 0, prefrontal = 0, pineal = 0, chispas = 0, cansancio = 0, colorBorde = '#b090ff'}) => {
  const mats = useMemo(() => {
    const corteza = matOrgano({color: '#c8909a', color2: '#e8bab4', vasos: '#9a2a4a', vasosEsc: 4, motas: 5, borde: colorBorde, bordeInt: 0.6, ondula: 0.002, rug: 0.5, barniz: 0.7, opacidad: op});
    if (op < 1) corteza.side = THREE.DoubleSide;
    return {
      corteza,
      cerebelo: matOrgano({color: '#b87a82', color2: '#d8a0a0', motas: 6, borde: '#c08aff', bordeInt: 0.8, rug: 0.5, opacidad: Math.min(1, op * 1.2)}),
      tronco: matOrgano({color: '#d8b0a8', color2: '#e8c8c0', motas: 3, borde: '#c8a0ff', bordeInt: 0.6, opacidad: Math.min(1, op * 1.4)}),
      zona: matZona('#5ad8ff'),
      via: matVaso('#ffb020', '#fff0a0', 1.6, 0.95),
      nucleo: brillo('#ffb030', 2),
      vta: brillo('#ff7a2a', 2),
      pineal: matOrgano({color: '#c8803a', color2: '#ffc070', motas: 8, borde: '#ffd080', bordeInt: 1.6, rug: 0.4}),
    };
  }, [op, colorBorde]);
  const k = 1 - cansancio * 0.55;
  mats.corteza.color.set('#c8909a').lerp(new THREE.Color('#9aa6bc'), cansancio * 0.6);
  animarMat(mats.corteza, t, (0.2 + 0.2 * Math.sin(t * 3)) * b * k);
  animarMat(mats.cerebelo, t, 0.1 * b * k);
  animarMat(mats.tronco, t);
  animarMat(mats.pineal, t, pineal * (0.6 + 0.4 * Math.sin(t * 2.4)));
  const zu = mats.zona.uniforms as Record<string, {value: number}>;
  zu.uI.value = prefrontal * 2;
  zu.uT.value = t;
  const vu = mats.via.uniforms as Record<string, {value: number}>;
  vu.uT.value = t;
  vu.uOp.value = Math.min(1, recompensa * 1.5);
  const izq = useMemo(() => geoHemisferio(1), []);
  const der = useMemo(() => geoHemisferio(-1), []);
  const cr = curvasRecompensa();
  // el tramo encendido de la vía crece con `recompensa`: se recorta con un plano de profundidad (z)
  const corteZ = -0.06 + Math.min(1, recompensa) * 0.45;
  const plano = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  const vg = useMemo(() => new THREE.Group(), []);
  vg.position.set(...p);
  vg.rotation.set(...r);
  vg.scale.setScalar(s);
  vg.updateMatrixWorld(true);
  plano.normal.set(0, 0, -1);
  plano.constant = corteZ;
  plano.applyMatrix4(vg.matrixWorld);
  mats.via.clippingPlanes = [plano];
  const nCh = Math.round(chispas);
  return (
    <group position={p} rotation={r} scale={s}>
      {recompensa > 0.01 && (
        <group>
          <mesh geometry={cr.izq.geo} material={mats.via} renderOrder={5} />
          <mesh geometry={cr.der.geo} material={mats.via} renderOrder={5} />
          <mesh geometry={geoNucleo()} material={mats.vta} position={VTA} scale={0.06 * Math.min(1, recompensa * 4)} />
          {[1, -1].map((l) => (
            <mesh key={l} geometry={geoNucleo()} material={mats.nucleo} position={[ACCUMBENS[0] * l, ACCUMBENS[1], ACCUMBENS[2]]} scale={[0.07, 0.06, 0.085].map((v) => v * Math.min(1, Math.max(0, recompensa * 2.2 - 0.6))) as V3} />
          ))}
          <pointLight position={VTA} intensity={0.25 * recompensa} distance={0.6} color="#ff9a3a" />
          <pointLight position={[0, ACCUMBENS[1], ACCUMBENS[2]]} intensity={0.35 * Math.max(0, recompensa * 2 - 0.6)} distance={0.7} color="#ffc040" />
        </group>
      )}
      {pineal > 0.01 && (
        <group position={PINEAL}>
          <mesh geometry={geoPineal()} material={mats.pineal} scale={0.06} rotation={[0.5, 0, 0]} />
          <pointLight intensity={0.4 * pineal} distance={0.5} color="#ffb050" />
        </group>
      )}
      <mesh geometry={izq} material={mats.corteza} position={[0.072, 0, 0]} renderOrder={op < 1 ? 8 : 0} />
      <mesh geometry={der} material={mats.corteza} position={[-0.072, 0, 0]} renderOrder={op < 1 ? 8 : 0} />
      {prefrontal > 0.01 && (
        <>
          <mesh geometry={izq} material={mats.zona} position={[0.072, 0, 0]} scale={1.012} renderOrder={9} />
          <mesh geometry={der} material={mats.zona} position={[-0.072, 0, 0]} scale={1.012} renderOrder={9} />
        </>
      )}
      <mesh geometry={geoCerebelo()} material={mats.cerebelo} position={[0, -0.2, -0.26]} scale={0.62} />
      <mesh material={mats.tronco} position={[0, -0.42, -0.12]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.04, 0.36, 16]} />
      </mesh>
      {nCh > 0 &&
        [...Array(nCh)].map((_, i) => {
          const a = rnd(i) * Math.PI * 2;
          const bb = rnd(i + 9) * Math.PI - Math.PI / 2;
          const f = (t * (1.5 + rnd(i * 2) * 2) * (1 - cansancio * 0.5) + rnd(i * 3)) % 1;
          const on = f < 0.3 ? Math.sin((f / 0.3) * Math.PI) * (cansancio > 0 ? (rnd(i + Math.floor(t * 3)) > cansancio * 0.6 ? 1 : 0.15) : 1) : 0;
          if (on < 0.02) return null;
          return (
            <mesh key={i} position={[Math.cos(a) * Math.cos(bb) * 0.4, Math.sin(bb) * 0.28 + 0.03, Math.sin(a) * Math.cos(bb) * 0.46]} renderOrder={10}>
              <sphereGeometry args={[0.012 + on * 0.01, 8, 6]} />
              <meshBasicMaterial color={cansancio > 0.3 ? '#9ab8e8' : '#e8c8ff'} transparent opacity={on} toneMapped={false} depthWrite={false} />
            </mesh>
          );
        })}
    </group>
  );
};

/* ------------------------------------------------------------------ hombre con el móvil */
export type EstadoPersona = {
  t: number;
  /** con el móvil delante de la cara (cabeza inclinada) o en reposo */
  movil?: boolean;
  piel?: number;
  holo?: number;
  esqueleto?: number;
  vasos?: number;
  organos?: number;
  luzCerebro?: number;
  chispas?: number;
  /** tono del holograma */
  color?: string;
  giro?: number;
  /** cerebro (opacidad, recompensa, cansancio…) */
  cerebro?: Partial<PropsCerebro>;
};

export const CuerpoMovil: React.FC<EstadoPersona & {p?: V3; s?: number}> = ({
  t,
  movil = true,
  piel = 0,
  holo = 0.8,
  esqueleto = 0.35,
  vasos = 1,
  organos = 1,
  luzCerebro = 0,
  chispas = 0,
  color = '#2a8aff',
  giro = 0,
  cerebro,
  p = [0, 0, 0],
  s = 1,
}) => {
  const m = useMemo(
    () => ({
      piel: matPiel(),
      holo: matHolograma(color, '#8ad8ff'),
      hueso: new THREE.MeshPhysicalMaterial({color: '#e8dcc4', roughness: 0.5, clearcoat: 0.3, transparent: true, opacity: 0.35, depthWrite: false, emissive: '#3a3a4a'}),
      arteria: matVaso('#d01a24', '#ffb8a8', 0.7, 0.95),
      vena: matVaso('#2a3ab8', '#8ab8ff', 0.5, 0.9),
    }),
    [color],
  );
  m.piel.color.set('#b98468');
  m.piel.opacity = piel;
  m.piel.depthWrite = piel > 0.98;
  m.piel.visible = piel > 0.01;
  (m.holo.uniforms.uT as {value: number}).value = t;
  (m.holo.uniforms.uOp as {value: number}).value = holo;
  m.holo.visible = holo > 0.01;
  m.hueso.opacity = 0.2 * esqueleto;
  m.hueso.visible = esqueleto > 0.01;
  for (const v of [m.arteria, m.vena]) {
    (v.uniforms.uT as {value: number}).value = t;
    (v.uniforms.uOp as {value: number}).value = 0.95 * vasos;
    v.visible = vasos > 0.01;
  }
  const geo = movil ? geoPersonaMovil() : geoPersonaReposo();
  // huesos y vasos: sin los del brazo izquierdo si está doblado (van aparte)
  const huesos = [...geoColumna(), ...geoCostillas(), ...geoPelvis(), ...geoHuesosLargos().filter((_, i) => !movil || (i !== 1 && i !== 3)), ...(movil ? geoBrazoHuesos() : [])];
  const arterias = [...geoArterias().filter((_, i) => !movil || i !== 3), ...(movil ? [geoBrazoArteria()] : [])];
  const venas = [...geoVenas().filter((_, i) => !movil || i !== 3), ...(movil ? [geoBrazoVena()] : [])];
  const cab = movil ? enCabeza([0, 1.685, -0.005]) : ([0, 1.685, -0.005] as V3);
  return (
    <group position={p} scale={s} rotation={[0, giro, 0]}>
      {huesos.map((g, i) => (
        <mesh key={`h${i}`} geometry={g} material={m.hueso} />
      ))}
      {arterias.map((g, i) => (
        <mesh key={`a${i}`} geometry={g} material={m.arteria} />
      ))}
      {venas.map((g, i) => (
        <mesh key={`v${i}`} geometry={g} material={m.vena} />
      ))}
      {organos > 0.01 && (
        <group>
          <CerebroMovil t={t} p={cab} s={0.15} r={[movil ? 0.3 : 0, 0, 0]} brillo={1 + luzCerebro * 1.5} chispas={chispas || (luzCerebro > 0.05 ? 18 : 0)} {...cerebro} />
          <Pulmones t={t} p={[0, 1.33, -0.005]} s={[0.28, 0.26, 0.28]} op={0.4} />
          <Corazon t={t} p={[0.022, 1.3, 0.035]} s={0.1} />
          <Higado t={t} p={[-0.04, 1.165, 0.02]} s={0.12} />
          <Estomago t={t} p={[0.06, 1.13, 0.03]} s={0.19} />
          <Rinones t={t} p={[0, 1.065, -0.055]} s={0.1} />
          <Intestinos t={t} p={[0, 0.99, 0.015]} s={0.82} />
          <pointLight position={[cab[0], cab[1] + 0.03, cab[2] + 0.18]} intensity={luzCerebro * 0.45} distance={0.4} color="#b88aff" />
        </group>
      )}
      <mesh geometry={geo} material={m.piel} />
      <mesh geometry={geo} material={m.holo} scale={[1.004, 1.001, 1.006]} />
    </group>
  );
};

/** Móvil en la mano del hombre (misma posición y orientación que la geometría del brazo). */
export const MovilEnMano: React.FC<Omit<PropsTelefono, 'p' | 'q'> & {giro?: number}> = ({giro = 0, ...o}) => (
  <group rotation={[0, giro, 0]}>
    <Telefono {...o} p={MOVIL} q={quatMovil} />
  </group>
);

/* ------------------------------------------------------------------ ojo */
const texIris = (() => {
  let tx: THREE.CanvasTexture | null = null;
  return () => {
    if (tx) return tx;
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d')!;
    const c = S / 2;
    const gr = g.createRadialGradient(c, c, S * 0.08, c, c, S / 2);
    gr.addColorStop(0, '#2a1a08');
    gr.addColorStop(0.35, '#7a4a1a');
    gr.addColorStop(0.62, '#3a6a5a');
    gr.addColorStop(0.92, '#1a3a3a');
    gr.addColorStop(1, '#0a1414');
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 520; i++) {
      const a = (i / 520) * Math.PI * 2 + Math.sin(i * 7.3) * 0.02;
      const r0 = S * (0.17 + Math.abs(Math.sin(i * 3.7)) * 0.06);
      const r1 = S * (0.38 + Math.abs(Math.sin(i * 1.9)) * 0.1);
      g.strokeStyle = `rgba(${200 + (i % 50)},${170 + (i % 40)},${120 + (i % 60)},${0.12 + (i % 7) * 0.025})`;
      g.lineWidth = 1 + (i % 3);
      g.beginPath();
      g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      g.quadraticCurveTo(c + Math.cos(a + 0.05) * (r0 + r1) * 0.5, c + Math.sin(a + 0.05) * (r0 + r1) * 0.5, c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      g.stroke();
    }
    g.fillStyle = '#000';
    g.beginPath();
    g.arc(c, c, S * 0.165, 0, Math.PI * 2);
    g.fill();
    tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  };
})();

/** Reflejo rectangular difuminado (la pantalla vista en la córnea). */
const texReflejo = (() => {
  let tx: THREE.CanvasTexture | null = null;
  return () => {
    if (tx) return tx;
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 128;
    const g = cv.getContext('2d')!;
    g.filter = 'blur(6px)';
    g.fillStyle = '#ffffff';
    g.fillRect(14, 14, 36, 100);
    tx = new THREE.CanvasTexture(cv);
    return tx;
  };
})();

/** Ojo (diámetro 1, mira a +z). `cierre` 0..1 = párpados cerrados; `sequedad` 0..1 = ojo seco y rojo. */
export const Ojo: React.FC<{t: number; p?: V3; s?: number; r?: V3; cierre?: number; sequedad?: number; reflejo?: number}> = ({t, p = [0, 0, 0], s = 1, r = [0, 0, 0], cierre = 0, sequedad = 0, reflejo = 1}) => {
  const mats = useMemo(
    () => ({
      esclera: matOrgano({color: '#efe6e0', color2: '#ffffff', vasos: '#c8303a', vasosEsc: 3.2, motas: 3, borde: '#ffe8e0', bordeInt: 0.25, rug: 0.25, barniz: 1}),
      iris: new THREE.MeshPhysicalMaterial({map: texIris(), roughness: 0.4, clearcoat: 0.4}),
      pupila: new THREE.MeshBasicMaterial({color: '#000000'}),
      cornea: new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0.02, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.0, transparent: true, opacity: 0.12, depthWrite: false, specularIntensity: 1}),
      piel: matOrgano({color: '#b87a62', color2: '#d09478', motas: 14, borde: '#ffb898', bordeInt: 0.5, rug: 0.55, barniz: 0.3}),
      pestana: new THREE.MeshStandardMaterial({color: '#1a120c', roughness: 0.6}),
      reflejo: new THREE.MeshBasicMaterial({map: texReflejo(), color: '#bfe0ff', transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending}),
      lagrima: brillo('#ffffff', 2.4),
    }),
    [],
  );
  animarMat(mats.esclera, t);
  animarMat(mats.piel, t);
  // la red de vasos se hace visible con la sequedad
  const u = (mats.esclera.userData as {u: Record<string, {value: THREE.Color}>}).u;
  u.uVasos.value.set('#f2d8d4').lerp(new THREE.Color('#c8202a'), Math.min(1, sequedad * 1.1));
  mats.esclera.color.set('#efe6e0').lerp(new THREE.Color('#f0c8c0'), sequedad * 0.5);
  mats.cornea.clearcoatRoughness = sequedad * 0.35;
  mats.cornea.roughness = 0.02 + sequedad * 0.25;
  mats.reflejo.opacity = 0.45 * reflejo;
  const arriba = useMemo(() => geoParpado(true), []);
  const abajo = useMemo(() => geoParpado(false), []);
  // párpado superior: borde abierto ≈ 21° sobre el ecuador; cerrado, baja hasta ≈ 8° bajo el ecuador
  const aSup = 0.06 + cierre * 0.52;
  const aInf = -0.04 - cierre * 0.2;
  const pestanas = useMemo(() => new THREE.CylinderGeometry(0.0022, 0.0006, 0.1, 4).translate(0, 0.05, 0), []);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh geometry={geoGlobo()} material={mats.esclera} />
      <mesh geometry={geoIris()} material={mats.iris} />
      <mesh material={mats.pupila} position={[0, 0, 0.452]}>
        <circleGeometry args={[0.08, 48]} />
      </mesh>
      <mesh geometry={geoCornea()} material={mats.cornea} renderOrder={4} />
      {/* reflejo de la pantalla en la córnea */}
      <mesh material={mats.reflejo} position={[0.06, 0.07, 0.552]} rotation={[-0.13, 0.11, 0.08]} renderOrder={5}>
        <planeGeometry args={[0.05, 0.095]} />
      </mesh>
      {/* película de lágrima: destellos que desaparecen con la sequedad */}
      <Enjambre
        geo={useMemo(() => new THREE.SphereGeometry(1, 8, 6), [])}
        mat={mats.lagrima}
        n={26}
        f={(i, o) => {
          const a = rnd(i) * Math.PI * 2;
          const rr = 0.08 + rnd(i + 1) * 0.2;
          const z = 0.277 + Math.sqrt(Math.max(0, 0.29 ** 2 - rr * rr));
          o.position.set(Math.cos(a) * rr, Math.sin(a) * rr * 0.8, z + 0.002);
          const vis = rnd(i + 2) > sequedad * 1.05 ? 1 : 0;
          o.scale.setScalar(0.0035 * vis * (0.6 + 0.4 * Math.sin(t * 3 + i)));
        }}
      />
      <group rotation={[aSup, 0, 0]}>
        <mesh geometry={arriba} material={mats.piel} />
        <Enjambre
          geo={pestanas}
          mat={mats.pestana}
          n={110}
          f={(i, o) => {
            const ph = 0.55 + (i / 109) * (Math.PI - 1.1) + (rnd(i + 7) - 0.5) * 0.02;
            const th = 1.2;
            const R = 0.54;
            o.position.set(-R * Math.cos(ph) * Math.sin(th), R * Math.cos(th), R * Math.sin(ph) * Math.sin(th));
            o.rotation.set(1.15 + rnd(i) * 0.3, 0, (Math.cos(ph) * 0.6) + (rnd(i + 3) - 0.5) * 0.2);
            o.scale.set(1, 0.8 + rnd(i + 1) * 0.5, 1);
          }}
        />
      </group>
      <group rotation={[aInf, 0, 0]}>
        <mesh geometry={abajo} material={mats.piel} />
      </group>
    </group>
  );
};
