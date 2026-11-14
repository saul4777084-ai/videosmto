import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Flame} from './Flame';
import {heartPath} from './Heart';
import {osc} from '../lib/anim';

export const COLORES_LCD = {
  rojo: '#ff5a3c',
  azul: '#3fc3ff',
  rosa: '#ff5fb0',
  verde: '#5dff9c',
  ambar: '#ffc23c',
};
export type ColorLCD = keyof typeof COLORES_LCD;

const SEG: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd',
  '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', ' ': '', '-': 'g',
};

const W = 64;
const H = 118;
const T = 15;

const hSeg = (x0: number, x1: number, y: number) =>
  `${x0},${y} ${x0 + T / 2},${y - T / 2} ${x1 - T / 2},${y - T / 2} ${x1},${y} ${x1 - T / 2},${y + T / 2} ${x0 + T / 2},${y + T / 2}`;
const vSeg = (x: number, y0: number, y1: number) =>
  `${x},${y0} ${x + T / 2},${y0 + T / 2} ${x + T / 2},${y1 - T / 2} ${x},${y1} ${x - T / 2},${y1 - T / 2} ${x - T / 2},${y0 + T / 2}`;

const SEG_POLY: Record<string, string> = {
  a: hSeg(T / 2 + 3, W - T / 2 - 3, T / 2),
  g: hSeg(T / 2 + 3, W - T / 2 - 3, H / 2),
  d: hSeg(T / 2 + 3, W - T / 2 - 3, H - T / 2),
  f: vSeg(T / 2, T / 2 + 3, H / 2 - 3),
  b: vSeg(W - T / 2, T / 2 + 3, H / 2 - 3),
  e: vSeg(T / 2, H / 2 + 3, H - T / 2 - 3),
  c: vSeg(W - T / 2, H / 2 + 3, H - T / 2 - 3),
};

/** Dígito de 7 segmentos con segmentos "fantasma" apagados. */
export const Digit: React.FC<{ch: string; x: number; color: string}> = ({ch, x, color}) => {
  const on = SEG[ch] ?? '';
  return (
    <g transform={`translate(${x} 0) skewX(-7)`}>
      {Object.entries(SEG_POLY).map(([k, p]) => (
        <polygon key={k} points={p} fill={on.includes(k) ? color : color} opacity={on.includes(k) ? 1 : 0.045} />
      ))}
    </g>
  );
};

/** Texto de 7 segmentos (solo dígitos, espacios, ':' y '-'). */
export const SegText: React.FC<{text: string; color: string; glowId: string}> = ({text, color, glowId}) => {
  let x = 0;
  const parts: React.ReactNode[] = [];
  text.split('').forEach((ch, i) => {
    if (ch === ':' || ch === ',') {
      parts.push(
        <g key={i}>
          {ch === ':' ? (
            <>
              <circle cx={x + 10} cy={H * 0.32} r={7} fill={color} />
              <circle cx={x + 4} cy={H * 0.7} r={7} fill={color} />
            </>
          ) : (
            <circle cx={x + 6} cy={H - 8} r={8} fill={color} />
          )}
        </g>,
      );
      x += 24;
    } else {
      parts.push(<Digit key={i} ch={ch} x={x} color={color} />);
      x += W + 14;
    }
  });
  return <g filter={`url(#${glowId})`}>{parts}</g>;
};

export const segWidth = (text: string) =>
  text.split('').reduce((acc, ch) => acc + (ch === ':' || ch === ',' ? 24 : W + 14), 0) - 14;

/**
 * Contador digital negro con números luminosos.
 * Posición: (x, y) es el centro. "value" puede ser decimal: se redondea.
 */
export const Counter: React.FC<{
  x: number;
  y: number;
  value: number;
  digits?: number;
  color?: ColorLCD;
  scale?: number;
  icon?: 'llama' | 'corazon' | 'reloj' | 'ninguno';
  unit?: string;
  label?: string;
  text?: string; // muestra texto literal (p. ej. "25:00") en lugar de value
  opacity?: number;
}> = ({x, y, value, digits = 3, color = 'rojo', scale = 1, icon = 'llama', unit = 'kcal', label, text, opacity = 1}) => {
  const f = useCurrentFrame();
  const c = COLORES_LCD[color];
  const v = Math.max(0, Math.round(value));
  const str = text ?? String(v).padStart(digits, ' ').slice(-Math.max(digits, String(v).length));
  const segW = segWidth(str);
  const iconW = icon === 'ninguno' ? 0 : 110;
  const unitW = unit ? 92 : 0;
  const pad = 34;
  const bodyW = pad + iconW + segW + 22 + unitW + pad;
  const bodyH = H + 2 * 38;
  const glowId = `glow-${color}`;
  // pequeño pulso cada vez que cambia el número
  const frac = value - Math.floor(value);
  const pulse = text ? 1 : 1 + 0.015 * Math.max(0, 1 - frac * 3);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale * pulse})`,
        opacity,
        filter: 'drop-shadow(0 18px 24px rgba(0,0,0,0.45))',
      }}
    >
      {label && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -46,
            transform: 'translateX(-50%)',
            padding: '6px 22px',
            borderRadius: 16,
            background: '#15121c',
            border: `3px solid ${c}`,
            color: c,
            fontFamily: 'Poppins',
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 2,
            whiteSpace: 'nowrap',
            boxShadow: `0 0 18px ${c}66`,
          }}
        >
          {label}
        </div>
      )}
      <svg width={bodyW} height={bodyH} viewBox={`0 0 ${bodyW} ${bodyH}`} style={{display: 'block'}}>
        <defs>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="lcdBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a3640" />
            <stop offset="100%" stopColor="#0d0b10" />
          </linearGradient>
          <linearGradient id="lcdScreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050506" />
            <stop offset="100%" stopColor="#131116" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={bodyW} height={bodyH} rx={30} fill="url(#lcdBody)" />
        <rect x={4} y={4} width={bodyW - 8} height={bodyH - 8} rx={27} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={3} />
        <rect x={16} y={16} width={bodyW - 32} height={bodyH - 32} rx={18} fill="url(#lcdScreen)" />
        <rect x={16} y={16} width={bodyW - 32} height={(bodyH - 32) * 0.45} rx={18} fill="rgba(255,255,255,0.04)" />
        {icon === 'llama' && <Flame x={pad + 50} y={bodyH - 40} size={92} seed={3} />}
        {icon === 'corazon' && (
          <g transform={`translate(${pad + 50} ${bodyH / 2}) scale(${1 + Math.max(0, osc(f, 18, 0.12))})`}>
            <path d={heartPath(86)} fill="#ff3d6e" />
          </g>
        )}
        {icon === 'reloj' && (
          <g transform={`translate(${pad + 50} ${bodyH / 2})`}>
            <circle r={36} fill="none" stroke={c} strokeWidth={7} filter={`url(#${glowId})`} />
            <line x1={0} y1={0} x2={0} y2={-24} stroke={c} strokeWidth={6} strokeLinecap="round" transform={`rotate(${f * 12})`} />
            <line x1={0} y1={0} x2={16} y2={0} stroke={c} strokeWidth={6} strokeLinecap="round" transform={`rotate(${f})`} />
          </g>
        )}
        <g transform={`translate(${pad + iconW} ${38})`}>
          <SegText text={str} color={c} glowId={glowId} />
        </g>
        {unit && (
          <text
            x={pad + iconW + segW + 22}
            y={bodyH - 44}
            fill={c}
            fontFamily="Poppins"
            fontWeight={700}
            fontSize={34}
            filter={`url(#${glowId})`}
          >
            {unit}
          </text>
        )}
      </svg>
    </div>
  );
};
