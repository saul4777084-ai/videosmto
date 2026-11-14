import React from 'react';
import {useCurrentFrame} from 'remotion';
import {osc} from '../lib/anim';

const flamePath = (h: number, w: number, tip: number, bulge: number) =>
  `M 0 0 C ${-w * 0.58} 0 ${-w * (0.62 + bulge)} ${-h * 0.36} ${-w * 0.34} ${-h * 0.6} ` +
  `C ${-w * 0.2} ${-h * 0.74} ${tip - w * 0.08} ${-h * 0.84} ${tip} ${-h} ` +
  `C ${tip + w * 0.18} ${-h * 0.78} ${w * (0.44 + bulge)} ${-h * 0.62} ${w * 0.48} ${-h * 0.38} ` +
  `C ${w * 0.62} ${-h * 0.1} ${w * 0.42} 0 0 0 Z`;

/** Llama animada (base en x,y). Movimiento orgánico con varias frecuencias. */
export const Flame: React.FC<{x: number; y: number; size: number; seed?: number; opacity?: number}> = ({
  x,
  y,
  size,
  seed = 0,
  opacity = 1,
}) => {
  const f = useCurrentFrame() + seed * 13;
  const h = size * (1 + osc(f, 9, 0.07) + osc(f, 23, 0.05));
  const w = size * 0.62 * (1 + osc(f, 13, 0.05, 1));
  const tip = osc(f, 17, size * 0.1) + osc(f, 7, size * 0.04);
  const b = osc(f, 11, 0.06);
  const id = `fl${seed}`;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <radialGradient id={`${id}g`} cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#ffb347" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ff5e1a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}o`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff3d1f" />
          <stop offset="100%" stopColor="#ff8a1f" />
        </linearGradient>
        <linearGradient id={`${id}i`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffd23f" />
          <stop offset="100%" stopColor="#ffb02e" />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={-h * 0.4} rx={w * 1.3} ry={h * 0.85} fill={`url(#${id}g)`} />
      <path d={flamePath(h, w, tip, b)} fill={`url(#${id}o)`} stroke="#b8290f" strokeWidth={size * 0.035} />
      <path d={flamePath(h * 0.66, w * 0.6, tip * 0.6, -b)} fill={`url(#${id}i)`} />
      <path d={flamePath(h * 0.34, w * 0.32, tip * 0.3, b)} fill="#fff4c2" />
    </g>
  );
};
