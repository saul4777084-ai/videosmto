import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import type {Transicion} from '../camera/esquema';
import {DesenfoqueDireccional} from '../camera/DesenfoqueDireccional';

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);

/** Desplazamiento horizontal del barrido (px) en función del progreso. */
const barridoX = (p: number) => 1080 * suave(Math.max(0, Math.min(1, p)));

type Aspecto = {opacity: number; scale: number; x: number; blur: number; mbx: number};

/** Aspecto de un plano mientras entra (p: 0 -> 1) o sale (p: 0 -> 1). */
const aspecto = (tipo: Transicion, p: number, dp: number, entrando: boolean, entryScale: number): Aspecto => {
  const a: Aspecto = {opacity: 1, scale: 1, x: 0, blur: 0, mbx: 0};
  if (p <= 0 && entrando === false) return a;
  if (p >= 1 && entrando) return a;
  switch (tipo) {
    case 'fundido':
      if (entrando) {
        a.opacity = p;
        a.scale = interpolate(p, [0, 1], [entryScale, 1], {...cl, easing: Easing.out(Easing.cubic)});
      } else a.opacity = 1 - p;
      break;
    case 'zoom': {
      // zoom de paso: el plano saliente se acerca y se desenfoca, el entrante llega desde cerca
      if (entrando) {
        const e = Easing.out(Easing.cubic)(p);
        a.scale = 1.3 - 0.3 * e;
        a.blur = 14 * (1 - e);
        a.opacity = Math.min(1, p * 1.8);
      } else {
        const e = Easing.in(Easing.cubic)(p);
        a.scale = 1 + 0.45 * e;
        a.blur = 14 * e;
      }
      break;
    }
    case 'barrido': {
      // empuje lateral con desenfoque de movimiento proporcional a la velocidad
      const x = barridoX(p);
      const v = Math.abs(barridoX(p + dp / 2) - barridoX(p - dp / 2));
      a.x = entrando ? 1080 - x : -x;
      a.mbx = v * 0.35;
      break;
    }
    case 'desenfoque':
      if (entrando) {
        a.opacity = p;
        a.blur = 18 * (1 - suave(p));
      } else a.blur = 18 * suave(p);
      break;
    case 'corte':
      break;
  }
  return a;
};

const Inner: React.FC<{
  dur: number;
  fadeIn: number;
  fadeOut: number;
  entrada: Transicion;
  salida: Transicion;
  zoom: [number, number];
  pan: [number, number, number, number];
  origin: string;
  entryScale: number;
  children: React.ReactNode;
}> = ({dur, fadeIn, fadeOut, entrada, salida, zoom, pan, origin, entryScale, children}) => {
  const f = useCurrentFrame();
  const pIn = fadeIn > 0 ? interpolate(f, [0, fadeIn], [0, 1], cl) : 1;
  const pOut = fadeOut > 0 ? interpolate(f, [dur - fadeOut, dur], [0, 1], cl) : 0;
  const ai = aspecto(entrada, pIn, fadeIn > 0 ? 1 / fadeIn : 0, true, entryScale);
  const ao = aspecto(salida, pOut, fadeOut > 0 ? 1 / fadeOut : 0, false, entryScale);
  const t = interpolate(f, [0, dur], [0, 1], {...cl, easing: Easing.inOut(Easing.sin)});
  const z = (zoom[0] + (zoom[1] - zoom[0]) * t) * ai.scale * ao.scale;
  const x = pan[0] + (pan[2] - pan[0]) * t + ai.x + ao.x;
  const y = pan[1] + (pan[3] - pan[1]) * t;
  const blur = ai.blur + ao.blur;
  const contenido = (
    <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${z})`, transformOrigin: origin}}>{children}</AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{opacity: Math.min(ai.opacity, ao.opacity), overflow: 'hidden', filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
      <DesenfoqueDireccional sx={ai.mbx + ao.mbx} sy={0}>
        {contenido}
      </DesenfoqueDireccional>
    </AbsoluteFill>
  );
};

/**
 * Bloque temporal con transición de entrada/salida (fundido, zoom, barrido,
 * desenfoque o corte). Todos los tiempos en frames. `zoom`/`pan` son un
 * movimiento lineal heredado; los movimientos de cámara se hacen con
 * camera/Camara.tsx.
 */
export const Clip: React.FC<{
  from: number;
  dur: number;
  fadeIn?: number;
  fadeOut?: number;
  entrada?: Transicion;
  salida?: Transicion;
  zoom?: [number, number];
  pan?: [number, number, number, number];
  origin?: string;
  entryScale?: number;
  children: React.ReactNode;
}> = ({
  from,
  dur,
  fadeIn = 12,
  fadeOut = 12,
  entrada = 'fundido',
  salida = 'fundido',
  zoom = [1, 1],
  pan = [0, 0, 0, 0],
  origin = '50% 50%',
  entryScale = 1.06,
  children,
}) => (
  <Sequence from={from} durationInFrames={dur} layout="none">
    <Inner dur={dur} fadeIn={fadeIn} fadeOut={fadeOut} entrada={entrada} salida={salida} zoom={zoom} pan={pan} origin={origin} entryScale={entryScale}>
      {children}
    </Inner>
  </Sequence>
);

/** Lienzo SVG de pantalla completa 1080x1920. */
export const Stage: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, ...style}}>
    {children}
  </svg>
);
