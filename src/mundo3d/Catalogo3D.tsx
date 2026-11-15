import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CamaraFija, Luces, Cil} from './base';
import {Escena3D, REPARTO_3D} from './Demo3D';
import {ESCENARIOS_3D} from './escenarios3d';
import {NombrePersonaje3D, Personaje3D, PERSONAJES_3D} from './Personaje3D';

const W = 320;
const H = 420;

const Lamina: React.FC<{titulo: string; sub: string; children: React.ReactNode}> = ({titulo, sub, children}) => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['500', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  return (
    <AbsoluteFill style={{background: '#0b0d22', fontFamily: 'Poppins', padding: '50px 36px', boxSizing: 'border-box'}}>
      <div style={{color: '#ffd84a', fontWeight: 800, fontSize: 64, lineHeight: 1}}>{titulo}</div>
      <div style={{color: '#c8c4e8', fontWeight: 500, fontSize: 30, margin: '12px 0 28px'}}>{sub}</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center'}}>{children}</div>
    </AbsoluteFill>
  );
};

const Ficha: React.FC<{nombre: string; detalle: string; children: React.ReactNode}> = ({nombre, detalle, children}) => (
  <div style={{width: W}}>
    <div style={{width: W, height: H, borderRadius: 22, overflow: 'hidden', position: 'relative', border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 14px 30px rgba(0,0,0,0.5)'}}>{children}</div>
    <div style={{color: '#fff', fontWeight: 800, fontSize: 30, marginTop: 10, textAlign: 'center'}}>{nombre}</div>
    <div style={{color: '#9f9ac8', fontWeight: 500, fontSize: 22, textAlign: 'center', lineHeight: 1.2}}>{detalle}</div>
  </div>
);

export const Catalogo3DEscenarios: React.FC = () => (
  <Lamina titulo="Mundo 3D · escenarios" sub="Versión realista: relieve, cielo atmosférico, agua con reflejos y acabado fotográfico">
    {REPARTO_3D.map((r, i) => (
      <Ficha key={r.e} nombre={ESCENARIOS_3D[r.e].nombre} detalle={ESCENARIOS_3D[r.e].detalle}>
        <Escena3D escenario={r.e} personaje={r.p} t={2} dur={4} mov={{orbita: [i % 2 ? 0.45 : -0.45, 0], dist: [1.15, 1.15], alto: [0.6, 0.6], fov: 50}} pos={[0, 0, 0]} giro={0} ancho={W} alto={H} anim={{saluda: 0, anda: 0, habla: false}} />
      </Ficha>
    ))}
  </Lamina>
);

/** Plató neutro para ver un personaje 3D (fondo curvo, luz de estudio). */
export const Plato3D: React.FC<{p: NombrePersonaje3D; color: string; giro?: number; t?: number; saluda?: number; ancho?: number; alto?: number}> = ({p, color, giro = 0.35, t = 1, saluda = 0, ancho = W, alto = H}) => (
  <ThreeCanvas width={ancho} height={alto} shadows gl={{preserveDrawingBuffer: true, antialias: true}} camera={{fov: 30, position: [0, 1.2, 6]}}>
    <CamaraFija pos={[0, 1.3, 5.6]} mira={[0, 0.95, 0]} fov={30} />
    <color attach="background" args={[color]} />
    <Luces sol={[3, 6, 5]} int={2.4} cielo="#ffffff" suelo={color} amb={1.2} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[30, 48]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
    <Cil ra={0.9} h={0.08} p={[0, 0.04, 0]} c="#ffffff" op={0.25} sombra={false} />
    <Personaje3D d={PERSONAJES_3D[p]} p={[0, 0.08, 0]} giro={giro} t={t} saluda={saluda} />
  </ThreeCanvas>
);

const COLORES = ['#3a6ab8', '#4a8ab8', '#6a3a8a', '#b88a4a', '#8a3a6a', '#c86aa8', '#a8603a', '#2a8a4a'];

export const Catalogo3DPersonajes: React.FC = () => (
  <Lamina titulo="Mundo 3D · personajes" sub="Rig con cadera, piernas, brazos y cabeza: andan, saludan, hablan y parpadean">
    {REPARTO_3D.map((r, i) => (
      <Ficha key={r.p} nombre={PERSONAJES_3D[r.p].nombre} detalle={`${PERSONAJES_3D[r.p].rol} · ${r.p}`}>
        <Plato3D p={r.p} color={COLORES[i]} giro={i % 2 ? -0.4 : 0.4} saluda={i % 3 === 0 ? 1 : 0} t={1 + i * 0.37} />
      </Ficha>
    ))}
  </Lamina>
);
