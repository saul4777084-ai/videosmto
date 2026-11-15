import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Clip} from '../components/Clip';
import type {Transicion} from '../camera/esquema';
import {CamaraFija, V3} from './base';
import {Postpro} from './realismo';
import {ESCENARIOS_3D, NombreEscenario3D} from './escenarios3d';
import {Anim3D, NombrePersonaje3D, Personaje3D, PERSONAJES_3D} from './Personaje3D';

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);

/** Movimiento de cámara 3D de un plano (ángulos en radianes alrededor del personaje). */
export type Mov3D = {
  /** ángulo de órbita al empezar y al acabar (0 = de frente) */
  orbita: [number, number];
  /** distancia al foco al empezar y al acabar (multiplica la del escenario) */
  dist: [number, number];
  /** altura de la cámara al empezar y al acabar (suma a la del escenario) */
  alto?: [number, number];
  fov?: number;
  /** inclinación lateral (rad) */
  rollo?: number;
};

/**
 * Un escenario 3D con su personaje y su cámara, en un lienzo WebGL de 1080×1920.
 * `t` = segundos dentro del plano y `dur` = duración del plano (para repartir el movimiento).
 */
export const Escena3D: React.FC<{
  escenario: NombreEscenario3D;
  personaje: NombrePersonaje3D;
  t: number;
  dur: number;
  mov?: Mov3D;
  anim?: Partial<Anim3D>;
  /** posición del personaje (por defecto entra andando hasta el centro) */
  pos?: V3;
  giro?: number;
  ancho?: number;
  alto?: number;
}> = ({escenario, personaje, t, dur, mov = {orbita: [-0.5, 0.4], dist: [1.15, 0.85]}, anim, pos, giro, ancho = 1080, alto = 1920}) => {
  const E = ESCENARIOS_3D[escenario];
  const p = interpolate(t, [0, dur], [0, 1], {...cl, easing: suave});
  const ang = mov.orbita[0] + (mov.orbita[1] - mov.orbita[0]) * p;
  const d = E.dist * (mov.dist[0] + (mov.dist[1] - mov.dist[0]) * p);
  const h = E.altura + (mov.alto ? mov.alto[0] + (mov.alto[1] - mov.alto[0]) * p : 0);
  // pequeña cámara en mano para que el plano respire
  const mano: V3 = [Math.sin(t * 1.1) * 0.04, Math.sin(t * 1.7 + 1) * 0.03, 0];
  const camPos: V3 = [E.foco[0] + Math.sin(ang) * d + mano[0], h + mano[1], E.foco[2] + Math.cos(ang) * d];
  // el personaje entra andando y se para; luego saluda y habla
  const andar = interpolate(t, [0, 1.3], [1, 0], cl);
  const z = pos ? pos[2] : interpolate(t, [0, 1.3], [-1.6, 0], {...cl, easing: Easing.out(Easing.quad)});
  const saluda = interpolate(t, [1.3, 1.6, 2.5, 2.8], [0, 1, 1, 0], cl);
  const Extra = (E as {extra?: React.FC<{t: number}>}).extra;
  return (
    <ThreeCanvas
      width={ancho}
      height={alto}
      shadows
      gl={{preserveDrawingBuffer: true, antialias: true}}
      camera={{fov: mov.fov ?? 50, position: camPos}}
    >
      <CamaraFija pos={camPos} mira={E.foco} fov={mov.fov ?? 50} rollo={mov.rollo ?? 0} />
      <E.C t={t} />
      <group position={pos ? [pos[0], pos[1], 0] : [0, 0, 0]}>
        <Personaje3D d={PERSONAJES_3D[personaje]} p={[0, 0, z]} giro={giro ?? 0} t={t} anda={andar} saluda={saluda} habla={t > 2.6} {...anim} />
        {Extra && <Extra t={t} />}
      </group>
      <Postpro foco={Math.hypot(camPos[0] - E.foco[0], camPos[1] - 1.1, camPos[2] - z)} rango={4} {...(E as {post?: object}).post} />
    </ThreeCanvas>
  );
};

const SEG = 4;
const FPS = 30;
const OV = 12;

/** Qué personaje va en cada escenario, cómo se mueve la cámara y con qué transición entra. */
export const REPARTO_3D: {e: NombreEscenario3D; p: NombrePersonaje3D; tr: Transicion; mov: Mov3D}[] = [
  {e: 'isla', p: 'capitana', tr: 'fundido', mov: {orbita: [-0.7, 0.35], dist: [1.25, 0.8], alto: [0.6, -0.2]}},
  {e: 'polo', p: 'tobias', tr: 'barrido', mov: {orbita: [0.6, -0.4], dist: [1.1, 0.75], alto: [0, 0]}},
  {e: 'marte', p: 'zorp', tr: 'zoom', mov: {orbita: [-0.3, 0.8], dist: [1.3, 0.85], alto: [1.2, 0], rollo: 0.02}},
  {e: 'egipto', p: 'ramses', tr: 'desenfoque', mov: {orbita: [0.5, -0.5], dist: [1.2, 0.85], alto: [-0.6, 0.2], fov: 54}},
  {e: 'feria', p: 'lulu', tr: 'zoom', mov: {orbita: [-0.6, 0.5], dist: [1.15, 0.8], alto: [0.4, 0]}},
  {e: 'golosinas', p: 'merengue', tr: 'barrido', mov: {orbita: [0.7, -0.2], dist: [1.2, 0.8], alto: [0.8, 0]}},
  {e: 'oeste', p: 'sheriff', tr: 'desenfoque', mov: {orbita: [-0.2, 0.6], dist: [1.05, 0.8], alto: [-0.5, 0], fov: 44}},
  {e: 'estadio', p: 'dani', tr: 'zoom', mov: {orbita: [0.9, -0.3], dist: [1.3, 0.85], alto: [1, 0]}},
];
export const DURACION_DEMO_3D = REPARTO_3D.length * SEG;

const Rotulo: React.FC<{t: number; titulo: string; sub: string}> = ({t, titulo, sub}) => {
  const o = interpolate(t, [0.25, 0.65, SEG - 0.4, SEG], [0, 1, 1, 0], cl);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * -30}px)`}}>
      <div style={{display: 'inline-block', padding: '14px 40px', borderRadius: 30, background: 'rgba(12,8,30,0.62)', border: '4px solid rgba(255,255,255,0.2)'}}>
        <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 64, color: '#ffd84a'}}>{titulo}</div>
        <div style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 36, color: '#fff'}}>{sub}</div>
      </div>
    </div>
  );
};

const Plano: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const r = REPARTO_3D[i];
  const P = PERSONAJES_3D[r.p];
  return (
    <AbsoluteFill>
      <Escena3D escenario={r.e} personaje={r.p} t={t} dur={SEG + OV / FPS} mov={r.mov} />
      <Rotulo t={t} titulo={ESCENARIOS_3D[r.e].nombre} sub={`${P.nombre} · ${P.rol}`} />
    </AbsoluteFill>
  );
};

/** Vídeo de muestra del mundo 3D: 8 escenarios × 8 personajes con cámara orbital real. */
export const Demo3D: React.FC = () => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['700', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  const seg = Math.round(SEG * FPS);
  const total = seg * REPARTO_3D.length;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {REPARTO_3D.map((r, i) => {
        const last = i === REPARTO_3D.length - 1;
        return (
          <Clip
            key={r.e}
            from={i * seg}
            dur={seg + (last ? 0 : OV)}
            fadeIn={i === 0 ? 0 : OV}
            fadeOut={last ? 18 : OV}
            entrada={r.tr}
            salida={last ? 'fundido' : REPARTO_3D[i + 1].tr}
          >
            <Plano i={i} />
          </Clip>
        );
      })}
      <Audio src={staticFile('sfx/musica.wav')} volume={(f) => 0.35 * interpolate(f, [0, 20, total - 30, total], [0, 1, 1, 0], cl)} />
      {REPARTO_3D.slice(1).map((r, i) => (
        <Sequence key={r.e} from={(i + 1) * seg - 4} durationInFrames={40} layout="none">
          <Audio src={staticFile(r.tr === 'zoom' ? 'sfx/whoosh.wav' : 'sfx/swoosh.wav')} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
