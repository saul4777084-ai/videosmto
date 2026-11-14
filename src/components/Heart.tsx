import React from 'react';
import {useCurrentFrame} from 'remotion';
import {osc, rnd} from '../lib/anim';

export const heartPath = (s: number) =>
  `M 0 ${s * 0.32} C ${-s * 0.1} ${s * 0.22} ${-s * 0.5} ${0} ${-s * 0.5} ${-s * 0.24} ` +
  `C ${-s * 0.5} ${-s * 0.46} ${-s * 0.28} ${-s * 0.56} ${-s * 0.13} ${-s * 0.52} ` +
  `C ${-s * 0.05} ${-s * 0.5} 0 ${-s * 0.42} 0 ${-s * 0.36} ` +
  `C 0 ${-s * 0.42} ${s * 0.05} ${-s * 0.5} ${s * 0.13} ${-s * 0.52} ` +
  `C ${s * 0.28} ${-s * 0.56} ${s * 0.5} ${-s * 0.46} ${s * 0.5} ${-s * 0.24} ` +
  `C ${s * 0.5} 0 ${s * 0.1} ${s * 0.22} 0 ${s * 0.32} Z`;

export const Heart: React.FC<{x: number; y: number; size: number; color?: string; opacity?: number; beat?: boolean; glow?: boolean}> = ({
  x,
  y,
  size,
  color = '#ff4f8b',
  opacity = 1,
  beat = false,
  glow = true,
}) => {
  const f = useCurrentFrame();
  const sc = beat ? 1 + Math.max(0, osc(f, 18, 0.14)) + Math.max(0, osc(f + 4, 18, 0.06)) : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={opacity}>
      {glow && <circle r={size * 0.7} fill={color} opacity={0.18} />}
      <path d={heartPath(size)} fill={color} stroke="rgba(120,0,40,0.55)" strokeWidth={size * 0.04} />
      <ellipse cx={-size * 0.22} cy={-size * 0.28} rx={size * 0.1} ry={size * 0.06} fill="#fff" opacity={0.7} transform={`rotate(-35 ${-size * 0.22} ${-size * 0.28})`} />
    </g>
  );
};

/** Corazones que suben flotando con balanceo y se desvanecen. */
export const FloatingHearts: React.FC<{
  count: number;
  area: [number, number, number, number]; // x0,y0,x1,y1 (zona de nacimiento)
  rise?: number;
  seed?: string;
  minSize?: number;
  maxSize?: number;
  colors?: string[];
  start?: number;
}> = ({count, area, rise = 520, seed = 'h', minSize = 30, maxSize = 70, colors = ['#ff4f8b', '#ff7aa8', '#ff2e63'], start = 0}) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return null;
  const items = [];
  for (let i = 0; i < count; i++) {
    const life = 70 + rnd(`${seed}l${i}`) * 60;
    const offset = rnd(`${seed}o${i}`) * life;
    const t = ((f + offset) % life) / life;
    const cycle = Math.floor((f + offset) / life);
    const x0 = area[0] + rnd(`${seed}x${i}${cycle}`) * (area[2] - area[0]);
    const y0 = area[1] + rnd(`${seed}y${i}${cycle}`) * (area[3] - area[1]);
    const size = minSize + rnd(`${seed}s${i}`) * (maxSize - minSize);
    const op = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1;
    const sc = Math.min(1, t * 5);
    items.push(
      <g key={i} transform={`translate(${x0 + osc(f, 40, 22, i)} ${y0 - t * rise}) rotate(${osc(f, 50, 14, i)}) scale(${sc})`}>
        <Heart x={0} y={0} size={size} color={colors[i % colors.length]} opacity={op} />
      </g>,
    );
  }
  return <g>{items}</g>;
};
