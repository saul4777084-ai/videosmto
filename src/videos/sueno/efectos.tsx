import React, {useId} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {rnd} from '../../lib/anim';

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * PÁRPADOS: la pantalla se cierra como un ojo (0 abierto · 1 cerrado).
 * Se usa para los microsueños: el espectador "se duerme" con el personaje.
 */
export const Parpados: React.FC<{cierre: number}> = ({cierre}) => {
  if (cierre <= 0.001) return null;
  const h = 960 * Math.min(1, cierre) + 40 * cierre;
  const curva = 220 * (1 - cierre);
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <path d={`M -10 -10 L 1090 -10 L 1090 ${h} Q 540 ${h + curva} -10 ${h} Z`} fill="#000" />
      <path d={`M -10 1930 L 1090 1930 L 1090 ${1920 - h} Q 540 ${1920 - h - curva} -10 ${1920 - h} Z`} fill="#000" />
    </svg>
  );
};

/** Curva de parpadeo lento: se cierra en `cierra` s, se mantiene `dura` s y se abre. */
export const microsueno = (t: number, inicio: number, cierra = 0.25, dura = 0.25, abre = 0.3) =>
  interpolate(t, [inicio, inicio + cierra, inicio + cierra + dura, inicio + cierra + dura + abre], [0, 1, 1, 0], {...cl, easing: Easing.inOut(Easing.cubic)});

/**
 * ALUCINACIÓN: deforma de verdad el contenido con un filtro SVG de
 * turbulencia + desplazamiento animado. `fuerza` en px de desplazamiento.
 */
export const Alucinacion: React.FC<{fuerza: number; children: React.ReactNode}> = ({fuerza, children}) => {
  const f = useCurrentFrame();
  const id = 'al' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (fuerza < 0.5) return <>{children}</>;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.006 + 0.002 * Math.sin(f / 20)} ${0.011}`} numOctaves={2} seed={Math.floor(f / 2) % 50} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={fuerza} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id}) hue-rotate(${Math.sin(f / 15) * fuerza * 0.6}deg) saturate(${1 + fuerza / 120})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * GLITCH: separa los canales de color y desplaza franjas horizontales.
 * `intensidad` 0..1. El contenido se dibuja tres veces (R, G, B) solo cuando hay glitch.
 */
export const Glitch: React.FC<{intensidad: number; children: React.ReactNode}> = ({intensidad, children}) => {
  const f = useCurrentFrame();
  const id = 'gl' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (intensidad < 0.02) return <>{children}</>;
  const off = (k: string) => (rnd(`${k}${f}`) - 0.5) * 60 * intensidad;
  const franjas = new Array(6).fill(0).map((_, i) => ({
    y: rnd(`gy${i}${Math.floor(f / 2)}`) * 1920,
    h: 20 + rnd(`gh${i}${Math.floor(f / 2)}`) * 90,
    dx: (rnd(`gx${i}${f}`) - 0.5) * 140 * intensidad,
  }));
  const canal = (m: string, dx: number, blend: boolean) => (
    <AbsoluteFill style={{transform: `translateX(${dx}px)`, filter: `url(#${id}${m})`, mixBlendMode: blend ? 'screen' : 'normal'}}>{children}</AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background: '#000', isolation: 'isolate'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={`${id}r`}><feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id={`${id}g`}><feColorMatrix values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" /></filter>
        <filter id={`${id}b`}><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" /></filter>
      </svg>
      {canal('r', off('r'), false)}
      {canal('g', off('g') * 0.3, true)}
      {canal('b', off('b'), true)}
      {franjas.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: s.y, height: s.h, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: s.dx, top: -s.y, width: 1080, height: 1920}}>{children}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Viñeta roja que late (alerta máxima). */
export const VinetaAlerta: React.FC<{intensidad: number; ritmo?: number}> = ({intensidad, ritmo = 0.6}) => {
  const f = useCurrentFrame();
  if (intensidad <= 0.01) return null;
  const fase = ((f / 30) % ritmo) / ritmo;
  const latido = Math.max(Math.exp(-fase * 9), 0.7 * Math.exp(-Math.max(0, fase - 0.22) * 9) * (fase > 0.22 ? 1 : 0));
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(200,0,20,${(0.35 + 0.4 * latido) * intensidad}) 100%)`,
      }}
    />
  );
};

/** Grano de película y viñeta general para el acabado cinematográfico. */
export const Grano: React.FC<{intensidad?: number}> = ({intensidad = 0.06}) => {
  const f = useCurrentFrame();
  const id = 'gr' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'overlay', opacity: intensidad * 4}}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={f % 30} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={1080} height={1920} filter={`url(#${id})`} opacity={0.5} />
    </svg>
  );
};

/** Título de día: "DÍA 1" con golpe, subrayado y brillo. */
export const TituloDia: React.FC<{texto: string; sub?: string; inicio: number; dur?: number; color?: string; y?: number}> = ({
  texto,
  sub,
  inicio,
  dur = 1.6,
  color = '#ffd84a',
  y = 760,
}) => {
  const f = useCurrentFrame();
  const t = f / 30 - inicio;
  if (t < 0 || t > dur) return null;
  const entra = interpolate(t, [0, 0.18], [0, 1], {...cl, easing: Easing.out(Easing.back(2.2))});
  const sale = interpolate(t, [dur - 0.3, dur], [1, 0], cl);
  const raya = interpolate(t, [0.12, 0.45], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: sale, transform: `scale(${0.6 + 0.4 * entra}) translateY(${(1 - sale) * -30}px)`}}>
      <div
        style={{
          fontFamily: 'Poppins',
          fontWeight: 800,
          fontSize: 150,
          letterSpacing: 10,
          color,
          textShadow: `0 0 40px ${color}aa, 0 10px 30px rgba(0,0,0,0.7)`,
          WebkitTextStroke: '4px #1a1030',
        }}
      >
        {texto}
      </div>
      <div style={{margin: '6px auto 0', height: 10, width: 420 * raya, borderRadius: 5, background: color, boxShadow: `0 0 20px ${color}`}} />
      {sub && <div style={{marginTop: 18, fontFamily: 'Poppins', fontWeight: 700, fontSize: 46, color: '#fff', textShadow: '0 4px 14px rgba(0,0,0,0.8)'}}>{sub}</div>}
    </div>
  );
};

/** Barra de medidor (reflejos, hambre, recuperación…). */
export const Medidor: React.FC<{x: number; y: number; ancho?: number; valor: number; etiqueta: string; color: string; aparicion?: number}> = ({
  x,
  y,
  ancho = 520,
  valor,
  etiqueta,
  color,
  aparicion = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - ancho / 2,
      top: y,
      width: ancho,
      opacity: Math.min(1, aparicion * 1.5),
      transform: `scale(${0.7 + 0.3 * aparicion})`,
      padding: '18px 26px 24px',
      borderRadius: 28,
      background: 'rgba(14,10,30,0.82)',
      border: '3px solid rgba(255,255,255,0.15)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
    }}
  >
    <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: 'Poppins', fontWeight: 800, fontSize: 34, color: '#fff', marginBottom: 12}}>
      <span>{etiqueta}</span>
      <span style={{color}}>{Math.round(valor * 100)}%</span>
    </div>
    <div style={{height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
      <div style={{width: `${Math.max(0, Math.min(1, valor)) * 100}%`, height: '100%', borderRadius: 17, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 20px ${color}`}} />
    </div>
  </div>
);
