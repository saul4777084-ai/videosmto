import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Sparkles} from '../components/Particles';
import {osc} from '../lib/anim';

/** Fondo marrón cálido con mesa de madera en perspectiva. */
export const TableBackground: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      <defs>
        <radialGradient id="tbBg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#8a5a3c" />
          <stop offset="60%" stopColor="#5b3826" />
          <stop offset="100%" stopColor="#2e1b12" />
        </radialGradient>
        <linearGradient id="tbTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8693f" />
          <stop offset="100%" stopColor="#7a4628" />
        </linearGradient>
        <radialGradient id="tbLight" cx="50%" cy="58%" r="45%">
          <stop offset="0%" stopColor="#ffd9a8" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#ffd9a8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#tbBg)" />
      {/* lámpara colgante */}
      <line x1={540} y1={0} x2={540} y2={760} stroke="#2a1810" strokeWidth={6} />
      <path d="M 430 840 L 650 840 L 600 760 L 480 760 Z" fill="#3a2418" />
      <ellipse cx={540} cy={842} rx={110} ry={14} fill="#ffe6b5" opacity={0.9 + osc(f, 30, 0.05)} />
      <polygon points="440,842 640,842 1000,1500 80,1500" fill="#ffe6b5" opacity={0.07} />
      {/* mesa */}
      <path d="M 120 1100 L 960 1100 L 1080 1600 L 0 1600 Z" fill="url(#tbTop)" />
      {new Array(7).fill(0).map((_, i) => (
        <path key={i} d={`M ${180 + i * 120} 1100 L ${40 + i * 167} 1600`} stroke="#6a3a20" strokeWidth={3} opacity={0.35} />
      ))}
      <rect x={0} y={1600} width={1080} height={70} fill="#5a321c" />
      <rect x={0} y={1670} width={1080} height={250} fill="#24140c" />
      <rect width={1080} height={1920} fill="url(#tbLight)" />
      <Sparkles count={14} color="#ffe2b8" seed="tb" speed={0.4} size={4} />
    </g>
  );
};

/** Plato con sombra. children = comida centrada en (0,0). */
export const Plate: React.FC<{x: number; y: number; scale?: number; children?: React.ReactNode}> = ({x, y, scale = 1, children}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx={8} cy={26} rx={210} ry={70} fill="rgba(0,0,0,0.35)" />
    <ellipse cx={0} cy={0} rx={210} ry={72} fill="#f3f0f7" />
    <ellipse cx={0} cy={4} rx={150} ry={48} fill="#dcd6e6" />
    <ellipse cx={0} cy={0} rx={150} ry={48} fill="#fbfaff" />
    <ellipse cx={-90} cy={-30} rx={60} ry={10} fill="#fff" opacity={0.8} />
    {children}
  </g>
);

const Steam: React.FC<{x: number; y: number}> = ({x, y}) => {
  const f = useCurrentFrame();
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const t = ((f + i * 20) % 60) / 60;
        const ox = x + (i - 1) * 40;
        return (
          <path
            key={i}
            d={`M ${ox} ${y - t * 120} q ${osc(f, 30, 16, i)} -25 0 -50 q ${-osc(f, 30, 16, i)} -25 0 -50`}
            stroke="#fff"
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
            opacity={(t < 0.3 ? t / 0.3 : 1 - t) * 0.5}
          />
        );
      })}
    </g>
  );
};

/** Huevo frito. */
export const FriedEgg: React.FC = () => {
  const f = useCurrentFrame();
  const w = osc(f, 40, 3);
  return (
    <g transform="translate(0 -10)">
      <path d={`M -110 0 C -120 -50 -40 ${-70 + w} 10 -55 C 70 -75 130 -40 115 0 C 125 40 40 ${55 - w} -10 45 C -70 60 -125 35 -110 0 Z`} fill="#ffffff" stroke="#e7e1ea" strokeWidth={4} />
      <ellipse cx={8} cy={-4} rx={44} ry={34} fill="#ffb21f" />
      <ellipse cx={8} cy={0} rx={44} ry={30} fill="#ffc53d" />
      <ellipse cx={-6} cy={-14} rx={14} ry={8} fill="#fff3c4" />
      <Steam x={0} y={-60} />
    </g>
  );
};

/** Tostada con mermelada. */
export const Toast: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g transform={`translate(0 -40) rotate(${osc(f, 70, 2)})`}>
      <path d="M -95 50 L -95 -40 C -130 -70 -100 -120 -40 -112 C -10 -140 50 -140 70 -112 C 125 -118 135 -60 95 -40 L 95 50 Z" fill="#c8823f" />
      <path d="M -80 40 L -80 -36 C -105 -60 -88 -98 -40 -94 C -10 -120 45 -120 62 -96 C 108 -100 115 -58 80 -36 L 80 40 Z" fill="#f2c27b" />
      <path d="M -60 -40 C -50 -70 40 -80 55 -45 C 70 -10 30 20 -10 15 C -50 10 -70 -10 -60 -40 Z" fill="#d6224f" />
      <ellipse cx={-20} cy={-45} rx={18} ry={8} fill="#ff8aa8" opacity={0.8} />
      <Steam x={0} y={-130} />
    </g>
  );
};
