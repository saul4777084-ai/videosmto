import React from 'react';
import {Bola, Caja, Capsula, Cil, Cono, Toro, V3} from './base';

/**
 * Personajes 3D hechos con primitivas (sin modelos externos). Todos comparten el mismo rig:
 * cadera → piernas, torso → brazos (hombro, mano), cuello → cabeza (ojos, párpados, boca).
 * La animación (andar, saludar, hablar, parpadear, saltar) es función pura del tiempo `t`.
 * Medidas en metros aproximados: el personaje mide ~1,8 y sus pies están en y = 0.
 */

export type Anim3D = {
  /** segundos */
  t: number;
  /** 0 = quieto · 1 = andando */
  anda?: number;
  /** 0..1 levanta el brazo derecho y saluda */
  saluda?: number;
  habla?: boolean;
  /** altura extra del salto (m) */
  salto?: number;
  /** giro de la cabeza (rad) */
  mira?: number;
};

type Piezas = {
  /** accesorios pegados a la cabeza (origen = centro de la cabeza, radio ≈ 0,3) */
  cabeza?: React.ReactNode;
  /** accesorios del torso (origen = cadera, el pecho está en y ≈ 0,5) */
  torso?: React.ReactNode;
  manoD?: React.ReactNode;
  manoI?: React.ReactNode;
};

export type Diseno3D = {
  nombre: string;
  rol: string;
  especie?: 'humano' | 'pinguino';
  piel: string;
  camisa: string;
  pantalon: string;
  zapatos: string;
  /** escala de la cabeza (1 = normal) */
  cabeza?: number;
  /** anchura del cuerpo (1 = normal) */
  ancho?: number;
  ojos?: {blanco?: string; pupila?: string; tam?: number; brillo?: boolean; tres?: boolean};
  boca?: string;
  piezas?: Piezas;
};

const sin = Math.sin;
const TAU = Math.PI * 2;

const calc = (a: Anim3D, semilla: number) => {
  const {t, anda = 0, saluda = 0, habla = false, salto = 0, mira = 0} = a;
  const fase = t * TAU * 1.5;
  const paso = sin(fase) * anda;
  const resp = sin(t * TAU * 0.45 + semilla) * (1 - anda);
  // parpadeo cada ~3 s, a desfase según la semilla
  const ciclo = (t + semilla * 0.7) % 3.1;
  const parp = ciclo < 0.12 ? 1 - Math.abs(ciclo - 0.06) / 0.06 : 0;
  const bocaAb = habla ? 0.35 + 0.65 * Math.abs(sin(t * 13 + semilla) * sin(t * 7.3)) : 0;
  return {
    piernaD: paso * 0.55,
    piernaI: -paso * 0.55,
    brazoD: -paso * 0.5 + resp * 0.04,
    brazoI: paso * 0.5 - resp * 0.04,
    bote: Math.abs(sin(fase)) * 0.05 * anda + resp * 0.012 + salto,
    inclina: anda * 0.06,
    cabezaY: mira + sin(t * 1.3 + semilla) * 0.12 * (1 - anda),
    cabezaZ: sin(t * 0.9 + semilla) * 0.04,
    saludo: saluda,
    saludoOsc: sin(t * TAU * 1.6) * 0.35 * saluda,
    parp,
    bocaAb,
  };
};

const Ojo: React.FC<{x: number; d: Diseno3D; parp: number; k: number}> = ({x, d, parp, k}) => {
  const o = d.ojos ?? {};
  const tam = (o.tam ?? 1) * 0.062;
  return (
    <group position={[x, 0.04, 0.255 * k]}>
      <group scale={[1, Math.max(0.08, 1 - parp), 1]}>
        <Bola rad={tam} c={o.blanco ?? '#ffffff'} rug={0.3} sombra={false} />
        <Bola rad={tam * 0.55} p={[0, 0, tam * 0.62]} c={o.pupila ?? '#1a1420'} rug={0.2} sombra={false} em={o.brillo ? o.pupila : undefined} emI={1.5} />
        <Bola rad={tam * 0.18} p={[tam * 0.2, tam * 0.22, tam * 1.05]} c="#ffffff" em="#ffffff" emI={0.6} sombra={false} />
      </group>
    </group>
  );
};

const Cabeza: React.FC<{d: Diseno3D; c: ReturnType<typeof calc>}> = ({d, c}) => {
  const k = 1;
  const sep = d.ojos?.tres ? 0.12 : 0.1;
  return (
    <group>
      <Bola rad={0.3} s={[1, 1.02, 0.96]} c={d.piel} rug={0.6} />
      {/* orejas */}
      {d.especie !== 'pinguino' && (
        <>
          <Bola rad={0.06} p={[0.29, 0, 0]} s={[0.6, 1, 1]} c={d.piel} />
          <Bola rad={0.06} p={[-0.29, 0, 0]} s={[0.6, 1, 1]} c={d.piel} />
        </>
      )}
      <Ojo x={sep} d={d} parp={c.parp} k={k} />
      <Ojo x={-sep} d={d} parp={c.parp} k={k} />
      {d.ojos?.tres && (
        <group position={[0, 0.15, 0.02]}>
          <Ojo x={0} d={d} parp={c.parp} k={k} />
        </group>
      )}
      {/* boca: se abre al hablar */}
      {d.especie === 'pinguino' ? (
        <group position={[0, -0.06, 0.27]}>
          <Cono rad={0.07} h={0.18} r={[Math.PI / 2, 0, 0]} p={[0, 0.02 + c.bocaAb * 0.015, 0.06]} s={[1, 1, 0.55]} c="#ff9a1f" rug={0.4} />
          <Cono rad={0.06} h={0.14} r={[Math.PI / 2, 0, 0]} p={[0, -0.02 - c.bocaAb * 0.03, 0.05]} s={[1, 1, 0.4]} c="#e07a10" rug={0.4} />
        </group>
      ) : (
        <group position={[0, -0.13, 0.262]} rotation={[-0.25, 0, 0]}>
          <group scale={[1, 0.25 + c.bocaAb * 1.2, 1]}>
            <Bola rad={0.055} s={[1.25, 0.5, 0.35]} c={d.boca ?? '#5a1e22'} rug={0.5} sombra={false} />
          </group>
        </group>
      )}
      {d.piezas?.cabeza}
    </group>
  );
};

const Brazo: React.FC<{x: number; giroX: number; giroZ: number; d: Diseno3D; mano?: React.ReactNode}> = ({x, giroX, giroZ, d, mano}) => {
  const pin = d.especie === 'pinguino';
  return (
    <group position={[x, 0.62, 0]} rotation={[giroX, 0, giroZ]}>
      {pin ? (
        <Bola rad={0.22} p={[0, -0.25, 0]} s={[0.3, 1.25, 0.6]} c={d.camisa} rug={0.55} />
      ) : (
        <>
          <Capsula rad={0.075} largo={0.42} p={[0, -0.25, 0]} c={d.camisa} />
          <Bola rad={0.075} p={[0, -0.58, 0]} c={d.piel} rug={0.6} />
        </>
      )}
      <group position={[0, pin ? -0.5 : -0.6, 0]}>{mano}</group>
    </group>
  );
};

const Pierna: React.FC<{x: number; giro: number; d: Diseno3D}> = ({x, giro, d}) => {
  if (d.especie === 'pinguino')
    return (
      <group position={[x, 0.02, 0]} rotation={[giro * 0.4, 0, 0]}>
        <Bola rad={0.11} p={[0, 0.02, 0.07]} s={[1, 0.35, 1.6]} c={d.zapatos} rug={0.5} />
      </group>
    );
  return (
    <group position={[x, 0.86, 0]} rotation={[giro, 0, 0]}>
      <Capsula rad={0.09} largo={0.62} p={[0, -0.4, 0]} c={d.pantalon} />
      <Caja t={[0.17, 0.11, 0.3]} p={[0, -0.8, 0.06]} c={d.zapatos} rug={0.5} />
    </group>
  );
};

export const Personaje3D: React.FC<Anim3D & {d: Diseno3D; p?: V3; giro?: number; esc?: number; semilla?: number}> = ({
  d,
  p = [0, 0, 0],
  giro = 0,
  esc = 1,
  semilla = 1,
  ...anim
}) => {
  const c = calc(anim, semilla);
  const w = d.ancho ?? 1;
  const ck = d.cabeza ?? 1;
  const pin = d.especie === 'pinguino';
  // brazo derecho: oscila al andar o se levanta para saludar
  const brazoDz = 0.1 + c.saludo * 2.7 - c.saludoOsc;
  const brazoDx = c.brazoD * (1 - c.saludo);
  return (
    <group position={[p[0], p[1] + c.bote, p[2]]} rotation={[0, giro, 0]} scale={esc}>
      {/* sombra de contacto suave */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005 - c.bote, 0]}>
        <circleGeometry args={[0.42 * w, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22 / (1 + c.bote * 4)} depthWrite={false} />
      </mesh>
      <Pierna x={0.13 * w} giro={c.piernaD} d={d} />
      <Pierna x={-0.13 * w} giro={c.piernaI} d={d} />
      <group position={[0, pin ? 0.08 : 0.86, 0]} rotation={[c.inclina, 0, 0]}>
        {pin ? (
          <>
            <Bola rad={0.5} p={[0, 0.55, 0]} s={[0.95 * w, 1.25, 0.85]} c={d.camisa} rug={0.55} />
            <Bola rad={0.42} p={[0, 0.48, 0.1]} s={[0.85 * w, 1.15, 0.8]} c={d.pantalon} rug={0.6} />
          </>
        ) : (
          <>
            {/* cadera y torso */}
            <Capsula rad={0.2 * w} largo={0.12} p={[0, 0.06, 0]} s={[1, 1, 0.75]} c={d.pantalon} />
            <Capsula rad={0.24 * w} largo={0.32} p={[0, 0.38, 0]} s={[1, 1, 0.7]} c={d.camisa} />
            <Cil ra={0.08} h={0.14} p={[0, 0.72, 0]} c={d.piel} />
          </>
        )}
        {d.piezas?.torso}
        <Brazo x={(pin ? 0.44 : 0.3) * w} giroX={brazoDx} giroZ={pin ? 0.15 + c.saludo * 1.1 - c.saludoOsc : brazoDz} d={d} mano={d.piezas?.manoD} />
        <Brazo x={-(pin ? 0.44 : 0.3) * w} giroX={c.brazoI} giroZ={pin ? -0.15 : -0.1} d={d} mano={d.piezas?.manoI} />
        <group position={[0, pin ? 1.2 : 1.06, 0]} rotation={[0, c.cabezaY, c.cabezaZ]} scale={ck}>
          <Cabeza d={d} c={c} />
        </group>
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ reparto */

const ORO = '#f2c14e';

export const PERSONAJES_3D = {
  capitana: {
    nombre: 'Capitana Brisa',
    rol: 'pirata',
    piel: '#c98d63',
    camisa: '#b3262e',
    pantalon: '#2c2a3a',
    zapatos: '#2a1a12',
    piezas: {
      cabeza: (
        <>
          {/* tricornio */}
          <Cil ra={0.27} rb={0.3} h={0.16} p={[0, 0.27, 0]} c="#1f1a24" />
          <Cil ra={0.44} h={0.03} p={[0, 0.2, 0]} s={[1, 1, 0.82]} c="#1f1a24" />
          <Toro rad={0.27} tubo={0.012} p={[0, 0.22, 0]} r={[Math.PI / 2, 0, 0]} c={ORO} met={0.8} rug={0.3} />
          <Bola rad={0.05} p={[0, 0.3, 0.26]} c="#f4f0e6" />
          {/* parche */}
          <Cil ra={0.07} h={0.02} p={[-0.1, 0.05, 0.27]} r={[Math.PI / 2, 0, 0]} c="#111" />
          <Toro rad={0.3} tubo={0.008} p={[0, 0.08, 0]} r={[0.25, 0, 0]} c="#111" />
          {/* melena */}
          <Bola rad={0.3} p={[0, -0.02, -0.08]} s={[1.08, 1.05, 1]} c="#5a2e1a" />
          <Capsula rad={0.07} largo={0.3} p={[0.24, -0.25, -0.06]} c="#5a2e1a" />
          <Capsula rad={0.07} largo={0.3} p={[-0.24, -0.25, -0.06]} c="#5a2e1a" />
        </>
      ),
      torso: (
        <>
          <Toro rad={0.21} tubo={0.04} p={[0, 0.22, 0]} r={[Math.PI / 2, 0, 0]} s={[1, 0.72, 1]} c="#1f1a24" />
          <Caja t={[0.08, 0.06, 0.02]} p={[0, 0.22, 0.17]} c={ORO} met={0.8} rug={0.3} />
          <Caja t={[0.06, 0.6, 0.02]} p={[0.04, 0.42, 0.155]} r={[0, 0, 0.6]} c="#e8dcc0" />
        </>
      ),
      manoD: (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <Cil ra={0.02} h={0.12} p={[0, 0, 0]} c="#3a2a1a" />
          <Caja t={[0.03, 0.6, 0.01]} p={[0, 0.36, 0]} c="#d8dde6" met={0.9} rug={0.25} />
        </group>
      ),
    },
  },
  sheriff: {
    nombre: 'Sheriff Rosa',
    rol: 'vaquera',
    piel: '#f0c8a0',
    camisa: '#d8a24a',
    pantalon: '#35507a',
    zapatos: '#6a3a1e',
    piezas: {
      cabeza: (
        <>
          <Bola rad={0.31} p={[0, 0.02, -0.05]} s={[1.06, 1, 1]} c="#e8c25a" />
          <Capsula rad={0.06} largo={0.36} p={[0.22, -0.26, -0.12]} c="#e8c25a" />
          <Capsula rad={0.06} largo={0.36} p={[-0.22, -0.26, -0.12]} c="#e8c25a" />
          {/* sombrero vaquero */}
          <Cil ra={0.5} h={0.03} p={[0, 0.22, 0]} c="#8a4e24" />
          <Toro rad={0.48} tubo={0.04} p={[0, 0.235, 0]} r={[Math.PI / 2, 0, 0]} c="#8a4e24" />
          <Cil ra={0.22} rb={0.26} h={0.26} p={[0, 0.36, 0]} c="#8a4e24" />
          <Cil ra={0.262} h={0.05} p={[0, 0.27, 0]} c="#3a1e10" />
        </>
      ),
      torso: (
        <>
          {/* chaleco y estrella */}
          <Capsula rad={0.25} largo={0.3} p={[0, 0.38, -0.01]} s={[1, 1, 0.68]} c="#7a4a2a" />
          <Caja t={[0.14, 0.42, 0.06]} p={[0, 0.42, 0.155]} c="#d8a24a" />
          <Cono rad={0.06} h={0.02} seg={5} p={[0.14, 0.5, 0.17]} r={[Math.PI / 2, 0, 0]} c={ORO} met={0.85} rug={0.25} />
          <Toro rad={0.21} tubo={0.035} p={[0, 0.08, 0]} r={[Math.PI / 2, 0, 0]} s={[1, 0.72, 1]} c="#3a1e10" />
          <Caja t={[0.1, 0.08, 0.03]} p={[0, 0.08, 0.16]} c={ORO} met={0.8} rug={0.3} />
          {/* pañuelo */}
          <Cono rad={0.12} h={0.16} p={[0, 0.62, 0.12]} r={[Math.PI, 0, 0]} s={[1, 1, 0.4]} c="#c0283a" />
        </>
      ),
      manoI: (
        <group>
          <Toro rad={0.12} tubo={0.015} r={[0, Math.PI / 2, 0]} p={[0, -0.08, 0]} c="#c8a070" />
        </group>
      ),
    },
  },
  zorp: {
    nombre: 'Zorp',
    rol: 'alienígena',
    piel: '#7fd85a',
    camisa: '#b8c2d6',
    pantalon: '#8a94aa',
    zapatos: '#4a5266',
    cabeza: 1.25,
    ancho: 0.85,
    ojos: {blanco: '#111018', pupila: '#7affc8', tam: 1.35, brillo: true, tres: true},
    boca: '#244a1a',
    piezas: {
      cabeza: (
        <>
          <Cil ra={0.012} h={0.3} p={[0.12, 0.38, 0]} r={[0, 0, -0.35]} c="#5aa83a" />
          <Cil ra={0.012} h={0.3} p={[-0.12, 0.38, 0]} r={[0, 0, 0.35]} c="#5aa83a" />
          <Bola rad={0.045} p={[0.17, 0.52, 0]} c="#ff5ad8" em="#ff5ad8" emI={2} />
          <Bola rad={0.045} p={[-0.17, 0.52, 0]} c="#ff5ad8" em="#ff5ad8" emI={2} />
        </>
      ),
      torso: (
        <>
          <Toro rad={0.2} tubo={0.03} p={[0, 0.7, 0]} r={[Math.PI / 2, 0, 0]} c="#5aeaff" em="#5aeaff" emI={1.2} />
          <Cil ra={0.07} h={0.02} p={[0, 0.42, 0.17]} r={[Math.PI / 2, 0, 0]} c="#5aeaff" em="#5aeaff" emI={2} />
          <Caja t={[0.42, 0.04, 0.32]} p={[0, 0.1, 0]} c="#5a6278" met={0.7} rug={0.3} />
        </>
      ),
      manoD: (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <Cil ra={0.03} h={0.2} p={[0, 0.08, 0]} c="#c8d0e0" met={0.8} rug={0.2} />
          <Bola rad={0.05} p={[0, 0.2, 0]} c="#ff5ad8" em="#ff5ad8" emI={2.2} />
        </group>
      ),
    },
  },
  tobias: {
    nombre: 'Tobías',
    rol: 'pingüino',
    especie: 'pinguino',
    piel: '#1c2230',
    camisa: '#1c2230',
    pantalon: '#f4f6fa',
    zapatos: '#ff9a1f',
    cabeza: 1.15,
    piezas: {
      cabeza: (
        <>
          <Bola rad={0.2} p={[0, -0.02, 0.14]} s={[1.15, 1, 0.8]} c="#f4f6fa" rug={0.6} sombra={false} />
          {/* gorro de lana */}
          <Bola rad={0.3} p={[0, 0.07, 0]} s={[1.04, 0.85, 1.04]} c="#2f7ad8" />
          <Toro rad={0.29} tubo={0.05} p={[0, 0.1, 0]} r={[Math.PI / 2, 0, 0]} c="#f4f6fa" />
          <Bola rad={0.08} p={[0, 0.37, 0]} c="#f4f6fa" />
        </>
      ),
      torso: (
        <>
          <Toro rad={0.3} tubo={0.08} p={[0, 1.0, 0]} r={[Math.PI / 2, 0, 0]} s={[1, 0.9, 1]} c="#e8364a" />
          <Caja t={[0.14, 0.42, 0.06]} p={[0.18, 0.78, 0.3]} r={[0.25, 0, 0.15]} c="#e8364a" />
        </>
      ),
    },
  },
  ramses: {
    nombre: 'Ramsés',
    rol: 'momia',
    piel: '#e9dfc4',
    camisa: '#ddd2b4',
    pantalon: '#d2c6a4',
    zapatos: '#c2b490',
    ojos: {blanco: '#1a1208', pupila: '#ffd23a', tam: 0.9, brillo: true},
    boca: '#3a2a18',
    piezas: {
      cabeza: (
        <>
          {[-0.2, -0.06, 0.08, 0.2].map((y, i) => (
            <Toro key={y} rad={Math.sqrt(0.09 - y * y) + 0.005} tubo={0.022} p={[0, y, 0]} r={[Math.PI / 2 + (i % 2 ? 0.18 : -0.15), 0, 0]} c={i % 2 ? '#cfc2a0' : '#f2ead2'} />
          ))}
          {/* venda suelta */}
          <Caja t={[0.05, 0.32, 0.01]} p={[0.27, -0.2, 0.08]} r={[0, 0, 0.3]} c="#f2ead2" />
          {/* tocado de faraón */}
          <Cil ra={0.035} h={0.22} p={[0, 0.34, 0.18]} r={[0.5, 0, 0]} c={ORO} met={0.85} rug={0.25} />
        </>
      ),
      torso: (
        <>
          {[0.1, 0.24, 0.38, 0.52].map((y, i) => (
            <Toro key={y} rad={0.235} tubo={0.024} p={[0, y, 0]} r={[Math.PI / 2 + (i % 2 ? 0.2 : -0.2), 0, 0]} s={[1, 0.72, 1]} c={i % 2 ? '#cfc2a0' : '#f2ead2'} />
          ))}
          {/* collar ancho egipcio */}
          <Cil ra={0.3} rb={0.22} h={0.08} p={[0, 0.66, 0]} c="#2a7ab8" met={0.4} rug={0.4} />
          <Cil ra={0.31} rb={0.3} h={0.025} p={[0, 0.63, 0]} c={ORO} met={0.85} rug={0.25} />
        </>
      ),
    },
  },
  lulu: {
    nombre: 'Lulú',
    rol: 'malabarista',
    piel: '#f6d2b8',
    camisa: '#7a3ad8',
    pantalon: '#f2c84a',
    zapatos: '#e8364a',
    boca: '#c81e3a',
    piezas: {
      cabeza: (
        <>
          {/* nariz roja y pelo de rizos */}
          <Bola rad={0.06} p={[0, -0.03, 0.3]} c="#ff2a3a" rug={0.25} />
          {[...Array(9)].map((_, i) => {
            const a = (i / 9) * Math.PI * 1.1 - Math.PI * 0.05;
            return <Bola key={i} rad={0.12} p={[Math.cos(a) * 0.3, 0.12 + Math.sin(a) * 0.16, -0.06]} c="#ff6a2a" />;
          })}
          <Cono rad={0.12} h={0.3} p={[0.06, 0.42, 0]} r={[0, 0, -0.25]} c="#2ad8b8" />
          <Bola rad={0.05} p={[0.12, 0.58, 0]} c="#f2c84a" />
        </>
      ),
      torso: (
        <>
          {/* gorguera */}
          <Toro rad={0.16} tubo={0.07} p={[0, 0.68, 0]} r={[Math.PI / 2, 0, 0]} c="#ffffff" seg={18} />
          {[0.25, 0.42].map((y) => (
            <Bola key={y} rad={0.045} p={[0, y, 0.17]} c="#f2c84a" />
          ))}
        </>
      ),
      manoD: <Bola rad={0.08} p={[0, -0.05, 0.05]} c="#2ad8b8" rug={0.3} />,
      manoI: <Bola rad={0.08} p={[0, -0.05, 0.05]} c="#ff3a8a" rug={0.3} />,
    },
  },
  merengue: {
    nombre: 'Hada Merengue',
    rol: 'hada de las golosinas',
    piel: '#ffe0cc',
    camisa: '#ff8ac8',
    pantalon: '#ffc2e2',
    zapatos: '#c84a9a',
    ojos: {pupila: '#6a2a8a', tam: 1.1},
    piezas: {
      cabeza: (
        <>
          <Bola rad={0.31} p={[0, 0.03, -0.05]} s={[1.05, 1, 1]} c="#9ae8ff" />
          <Bola rad={0.13} p={[0, 0.3, -0.1]} c="#9ae8ff" />
          <Bola rad={0.1} p={[0, 0.42, -0.12]} c="#c6f4ff" />
          {/* corona de caramelo */}
          {[...Array(5)].map((_, i) => {
            const a = (i / 5) * Math.PI * 2;
            return <Bola key={i} rad={0.035} p={[Math.cos(a) * 0.2, 0.27, Math.sin(a) * 0.2]} c={['#ff4a6a', '#ffd23a', '#5ad85a', '#4a8aff', '#c84aff'][i]} rug={0.2} />;
          })}
          <Bola rad={0.035} p={[0.15, -0.08, 0.24]} c="#ff9ab8" op={0.7} sombra={false} />
          <Bola rad={0.035} p={[-0.15, -0.08, 0.24]} c="#ff9ab8" op={0.7} sombra={false} />
        </>
      ),
      torso: (
        <>
          {/* falda de tutú y alas */}
          <Cono rad={0.42} h={0.36} p={[0, 0.12, 0]} c="#ffc2e2" rug={0.6} />
          <Bola rad={0.3} p={[0.24, 0.62, -0.26]} s={[1, 0.6, 0.08]} r={[0, 0.5, 0.5]} c="#c6f4ff" op={0.55} rug={0.2} sombra={false} />
          <Bola rad={0.3} p={[-0.24, 0.62, -0.26]} s={[1, 0.6, 0.08]} r={[0, -0.5, -0.5]} c="#c6f4ff" op={0.55} rug={0.2} sombra={false} />
          <Bola rad={0.2} p={[0.2, 0.3, -0.24]} s={[1, 0.6, 0.08]} r={[0, 0.5, -0.4]} c="#ffd6f2" op={0.55} rug={0.2} sombra={false} />
          <Bola rad={0.2} p={[-0.2, 0.3, -0.24]} s={[1, 0.6, 0.08]} r={[0, -0.5, 0.4]} c="#ffd6f2" op={0.55} rug={0.2} sombra={false} />
        </>
      ),
      manoD: (
        <group rotation={[Math.PI / 2.4, 0, 0]}>
          <Cil ra={0.012} h={0.36} p={[0, 0.14, 0]} c="#ffffff" />
          <Cono rad={0.07} h={0.02} seg={5} p={[0, 0.34, 0]} r={[Math.PI / 2, 0, 0]} c="#ffd23a" em="#ffd23a" emI={1.2} />
        </group>
      ),
    },
  },
  dani: {
    nombre: 'Dani',
    rol: 'futbolista',
    piel: '#8a5a3a',
    camisa: '#f4f6fa',
    pantalon: '#1c2a6a',
    zapatos: '#ff4a1a',
    piezas: {
      cabeza: (
        <>
          <Bola rad={0.305} p={[0, 0.06, -0.03]} s={[1.02, 0.9, 1]} c="#1a1210" />
          <Toro rad={0.29} tubo={0.03} p={[0, 0.12, 0.02]} r={[Math.PI / 2 - 0.2, 0, 0]} c="#ff4a1a" />
        </>
      ),
      torso: (
        <>
          {/* rayas de la camiseta */}
          {[-0.12, 0, 0.12].map((x) => (
            <Caja key={x} t={[0.05, 0.5, 0.02]} p={[x, 0.42, 0.165]} c="#1c2a6a" />
          ))}
          <Toro rad={0.08} tubo={0.02} p={[0, 0.7, 0.02]} r={[Math.PI / 2, 0, 0]} c="#1c2a6a" />
        </>
      ),
    },
  },
} satisfies Record<string, Diseno3D>;

export type NombrePersonaje3D = keyof typeof PERSONAJES_3D;
