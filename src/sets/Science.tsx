import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Sparkles, Stars} from '../components/Particles';
import {osc} from '../lib/anim';

/** Fondo azul oscuro con cuadrícula científica, nebulosa y polvo de estrellas. */
export const GridBackground: React.FC<{idPrefix?: string}> = ({idPrefix = 'gr'}) => {
  const f = useCurrentFrame();
  const id = (s: string) => `${idPrefix}-${s}`;
  const drift = (f * 0.4) % 60;
  return (
    <g>
      <defs>
        <linearGradient id={id('bg')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#070b26" />
          <stop offset="50%" stopColor="#101a4d" />
          <stop offset="100%" stopColor="#0a1033" />
        </linearGradient>
        <pattern id={id('grid')} width="60" height="60" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${drift})`}>
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6f8cff" strokeOpacity={0.13} strokeWidth={2} />
        </pattern>
        <pattern id={id('grid2')} width="240" height="240" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${drift})`}>
          <path d="M 240 0 L 0 0 0 240" fill="none" stroke="#8fa6ff" strokeOpacity={0.22} strokeWidth={3} />
        </pattern>
        <filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="70" />
        </filter>
        <radialGradient id={id('vig')} cx="50%" cy="50%" r="72%">
          <stop offset="55%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.7} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id('bg')})`} />
      <g filter={`url(#${id('blur')})`} opacity={0.55}>
        <circle cx={260 + osc(f, 200, 60)} cy={700} r={260} fill="#5b3fd1" />
        <circle cx={820 + osc(f, 240, 50, 1)} cy={1250} r={300} fill="#2a64d8" />
        <circle cx={540} cy={1650 + osc(f, 180, 40)} r={240} fill="#a03fb8" />
      </g>
      <rect width={1080} height={1920} fill={`url(#${id('grid')})`} />
      <rect width={1080} height={1920} fill={`url(#${id('grid2')})`} />
      <Stars count={60} area={[0, 0, 1080, 1920]} seed={`${idPrefix}st`} />
      <Sparkles count={18} color="#9fb6ff" seed={`${idPrefix}sp`} speed={0.5} size={4} />
      <rect width={1080} height={1920} fill={`url(#${id('vig')})`} />
    </g>
  );
};

// Hoja de arce (mitad derecha, coordenadas unitarias), se refleja para la izquierda.
const LEAF_HALF: [number, number][] = [
  [0, -1.0], [0.13, -0.74], [0.26, -0.82], [0.21, -0.36], [0.42, -0.6], [0.49, -0.46],
  [0.72, -0.52], [0.63, -0.3], [0.78, -0.22], [0.46, 0.04], [0.52, 0.18], [0.07, 0.1], [0.07, 0.5],
];
const leafPath = (s: number) => {
  const right = LEAF_HALF.map(([x, y]) => `${x * s},${y * s}`);
  const left = LEAF_HALF.slice()
    .reverse()
    .map(([x, y]) => `${-x * s},${y * s}`);
  return `M ${right.join(' L ')} L ${left.join(' L ')} Z`;
};

/** Bandera de Canadá ondeando (por franjas verticales desplazadas). */
export const CanadaFlag: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const f = useCurrentFrame();
  const h = w / 2;
  const N = 36;
  const sw = w / N;
  const wave = (i: number) => Math.sin(i * 0.32 - f * 0.18) * (i / N) * 26;
  const shade = (i: number) => Math.cos(i * 0.32 - f * 0.18) * (i / N);
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* mástil */}
      <rect x={-22} y={-30} width={18} height={h + 520} rx={8} fill="#d6dcf0" />
      <circle cx={-13} cy={-34} r={16} fill="#ffd84a" />
      <defs>
        <g id="cflag">
          <rect x={0} y={0} width={w} height={h} fill="#ffffff" />
          <rect x={0} y={0} width={w / 4} height={h} fill="#e3242b" />
          <rect x={(w * 3) / 4} y={0} width={w / 4} height={h} fill="#e3242b" />
          <g transform={`translate(${w / 2} ${h / 2 + h * 0.04})`}>
            <path d={leafPath(h * 0.42)} fill="#e3242b" />
          </g>
        </g>
      </defs>
      {new Array(N).fill(0).map((_, i) => (
        <g key={i} transform={`translate(0 ${wave(i)})`}>
          <clipPath id={`cfc${i}`}>
            <rect x={i * sw - 1.5} y={-5} width={sw + 3} height={h + 10} />
          </clipPath>
          <g clipPath={`url(#cfc${i})`}>
            <use href="#cflag" />
            <rect x={i * sw} y={0} width={sw + 1} height={h} fill={shade(i) > 0 ? '#fff' : '#000'} opacity={Math.abs(shade(i)) * 0.18} />
          </g>
        </g>
      ))}
    </g>
  );
};

/** Brazo ilustrado con dedo índice señalando. (x,y) = punta del dedo. */
export const PointingArm: React.FC<{x: number; y: number; angle: number; color?: string; skin?: string}> = ({
  x,
  y,
  angle,
  color = '#ffd84a',
  skin = '#f0bf98',
}) => {
  const f = useCurrentFrame();
  const tap = Math.max(0, osc(f, 22, 1)) * 14;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) translate(${-tap} 0)`}>
      {/* manga */}
      <rect x={-900} y={-70} width={720} height={140} rx={60} fill={color} />
      <rect x={-900} y={-70} width={720} height={50} rx={25} fill="#fff" opacity={0.18} />
      <rect x={-230} y={-78} width={60} height={156} rx={24} fill="#e0b73a" />
      {/* muñeca y mano */}
      <rect x={-190} y={-50} width={90} height={100} rx={36} fill={skin} />
      <rect x={-120} y={-58} width={120} height={116} rx={44} fill={skin} />
      {/* dedos doblados */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-60 + i * 4} y={-8 + i * 26} width={78} height={30} rx={15} fill="#e8ac83" />
      ))}
      {/* índice extendido */}
      <rect x={-30} y={-58} width={130} height={36} rx={18} fill={skin} />
      <ellipse cx={86} cy={-40} rx={10} ry={9} fill="#ffd9c9" />
      {/* pulgar */}
      <rect x={-100} y={-88} width={74} height={34} rx={17} fill={skin} transform="rotate(18 -60 -70)" />
    </g>
  );
};
