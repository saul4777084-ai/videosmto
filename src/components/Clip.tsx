import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';

/**
 * Bloque temporal con fundido de entrada/salida y "cámara" opcional
 * (zoom y desplazamiento continuo). Todos los tiempos en frames.
 */
const Inner: React.FC<{
  dur: number;
  fadeIn: number;
  fadeOut: number;
  zoom: [number, number];
  pan: [number, number, number, number];
  origin: string;
  entryScale: number;
  children: React.ReactNode;
}> = ({dur, fadeIn, fadeOut, zoom, pan, origin, entryScale, children}) => {
  const f = useCurrentFrame();
  const opIn = fadeIn > 0 ? interpolate(f, [0, fadeIn], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'}) : 1;
  const opOut = fadeOut > 0 ? interpolate(f, [dur - fadeOut, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const t = interpolate(f, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const z = zoom[0] + (zoom[1] - zoom[0]) * t;
  const x = pan[0] + (pan[2] - pan[0]) * t;
  const y = pan[1] + (pan[3] - pan[1]) * t;
  // pequeño "empujón" de cámara en la entrada
  const enter = fadeIn > 0 ? interpolate(f, [0, fadeIn * 1.6], [entryScale, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1;
  return (
    <AbsoluteFill style={{opacity: Math.min(opIn, opOut), overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${z * enter})`, transformOrigin: origin}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Clip: React.FC<{
  from: number;
  dur: number;
  fadeIn?: number;
  fadeOut?: number;
  zoom?: [number, number];
  pan?: [number, number, number, number];
  origin?: string;
  entryScale?: number;
  children: React.ReactNode;
}> = ({from, dur, fadeIn = 12, fadeOut = 12, zoom = [1, 1], pan = [0, 0, 0, 0], origin = '50% 50%', entryScale = 1.06, children}) => (
  <Sequence from={from} durationInFrames={dur} layout="none">
    <Inner dur={dur} fadeIn={fadeIn} fadeOut={fadeOut} zoom={zoom} pan={pan} origin={origin} entryScale={entryScale}>
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
