import React from 'react';
import {useCurrentFrame} from 'remotion';
import {osc, rnd} from '../lib/anim';

/** Partículas brillantes que flotan (polvo de luz). */
export const Sparkles: React.FC<{count: number; color?: string; area?: [number, number, number, number]; seed?: string; speed?: number; size?: number}> = ({
  count,
  color = '#ffe3f1',
  area = [0, 0, 1080, 1920],
  seed = 'sp',
  speed = 0.6,
  size = 6,
}) => {
  const f = useCurrentFrame();
  const h = area[3] - area[1];
  return (
    <g>
      {new Array(count).fill(0).map((_, i) => {
        const x = area[0] + rnd(`${seed}x${i}`) * (area[2] - area[0]) + osc(f, 90 + i * 3, 18, i);
        const y = area[1] + ((rnd(`${seed}y${i}`) * h - f * speed * (0.5 + rnd(`${seed}v${i}`)) + h * 10) % h);
        const r = size * (0.4 + rnd(`${seed}r${i}`));
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * osc(f, 30 + rnd(`${seed}t${i}`) * 40, 1, i));
        return (
          <g key={i} opacity={tw}>
            <circle cx={x} cy={y} r={r * 2.6} fill={color} opacity={0.15} />
            <circle cx={x} cy={y} r={r} fill={color} />
          </g>
        );
      })}
    </g>
  );
};

/** Estrellas que titilan. */
export const Stars: React.FC<{count: number; area: [number, number, number, number]; seed?: string}> = ({count, area, seed = 'st'}) => {
  const f = useCurrentFrame();
  return (
    <g>
      {new Array(count).fill(0).map((_, i) => {
        const x = area[0] + rnd(`${seed}x${i}`) * (area[2] - area[0]);
        const y = area[1] + rnd(`${seed}y${i}`) * (area[3] - area[1]);
        const r = 1.5 + rnd(`${seed}r${i}`) * 3;
        const op = 0.4 + 0.6 * (0.5 + 0.5 * osc(f, 25 + rnd(`${seed}p${i}`) * 50, 1, i * 2));
        return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={op} />;
      })}
    </g>
  );
};
