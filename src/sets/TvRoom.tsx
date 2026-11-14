import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Bedroom} from './Bedroom';
import {PERSONAJES} from '../characters/palette';
import {Sparkles} from '../components/Particles';
import {osc} from '../lib/anim';

/** Salón oscuro visto desde atrás: persona en sillón mirando la tele. */
export const TvRoom: React.FC<{tvZoom?: number}> = ({tvZoom = 1}) => {
  const f = useCurrentFrame();
  const flick = 0.75 + osc(f, 23, 0.1) + osc(f, 7, 0.05) + osc(f, 61, 0.08);
  const hue = osc(f, 120, 1);
  const tvColor = hue > 0 ? '#ff8fc8' : '#7fb8ff';
  const P = PERSONAJES.el;
  const headTilt = osc(f, 90, 3);
  const press = osc(f, 45, 1) > 0.85 ? 6 : 0;
  // pantalla
  const sx = 140;
  const sy = 600;
  const sw = 800;
  const sh = 490;
  return (
    <g>
      <defs>
        <linearGradient id="tvWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b0a1c" />
          <stop offset="100%" stopColor="#1d1835" />
        </linearGradient>
        <radialGradient id="tvGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={tvColor} stopOpacity={0.45} />
          <stop offset="100%" stopColor={tvColor} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="chair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5c3b74" />
          <stop offset="100%" stopColor="#2a1a3a" />
        </linearGradient>
        <linearGradient id="screenGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.12} />
          <stop offset="40%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#tvWall)" />
      <rect x={0} y={1280} width={1080} height={640} fill="#120f22" />
      <rect width={1080} height={1920} fill="url(#tvGlow)" opacity={flick} />
      {/* estantería lateral */}
      <rect x={-10} y={700} width={90} height={560} rx={8} fill="#1a1530" />
      <rect x={1000} y={700} width={90} height={560} rx={8} fill="#1a1530" />
      {/* mueble y tele */}
      <rect x={180} y={1150} width={720} height={130} rx={16} fill="#241d3d" />
      <rect x={180} y={1150} width={720} height={14} rx={7} fill="#3a2f5e" />
      <rect x={510} y={1095} width={60} height={60} fill="#1a1630" />
      <rect x={sx - 24} y={sy - 24} width={sw + 48} height={sh + 48} rx={22} fill="#09080f" />
      <rect x={sx - 24} y={sy - 24} width={sw + 48} height={sh + 48} rx={22} fill="none" stroke="#2c2840" strokeWidth={4} />
      <svg x={sx} y={sy} width={sw} height={sh} viewBox={`${540 - 460 / tvZoom} ${1240 - 280 / tvZoom} ${920 / tvZoom} ${560 / tvZoom}`} preserveAspectRatio="xMidYMid slice">
        <Bedroom modo="despiertos" movimiento={1.2} idPrefix="tv" reloj={(fr) => 23 * 60 + fr * 0.4} />
      </svg>
      <rect x={sx} y={sy} width={sw} height={sh} fill="url(#screenGlass)" />
      <rect x={sx} y={sy} width={sw} height={sh} fill="#000" opacity={0.08 + osc(f, 5, 0.03)} />
      <circle cx={sx + sw - 10} cy={sy + sh + 12} r={5} fill="#ff4f6e" />
      {/* persona en el sillón, de espaldas */}
      <g transform={`translate(540 1430) rotate(${headTilt})`}>
        <path d="M -150 120 C -150 40 -80 10 0 10 C 80 10 150 40 150 120 L 150 260 L -150 260 Z" fill="#3b4a7a" />
        <rect x={-30} y={-20} width={60} height={50} fill={P.pielSombra} />
        <circle cx={0} cy={-80} r={96} fill={P.pelo} />
        <circle cx={-96} cy={-70} r={20} fill={P.pielSombra} />
        <circle cx={96} cy={-70} r={20} fill={P.pielSombra} />
        <path d="M -60 -150 Q 0 -190 60 -150" stroke="#fff" strokeOpacity={0.12 * flick} strokeWidth={8} fill="none" strokeLinecap="round" />
        <circle cx={0} cy={-80} r={96} fill="none" stroke={tvColor} strokeOpacity={0.35 * flick} strokeWidth={5} />
      </g>
      {/* sillón */}
      <path d="M 220 1920 L 220 1560 C 220 1460 320 1430 540 1430 C 760 1430 860 1460 860 1560 L 860 1920 Z" fill="url(#chair)" />
      <path d="M 220 1560 C 220 1460 320 1430 540 1430 C 760 1430 860 1460 860 1560" stroke={tvColor} strokeOpacity={0.4 * flick} strokeWidth={6} fill="none" />
      <rect x={110} y={1600} width={180} height={340} rx={70} fill="#4a2f60" />
      <rect x={790} y={1600} width={180} height={340} rx={70} fill="#4a2f60" />
      <path d="M 110 1670 C 110 1620 140 1600 200 1600 C 260 1600 290 1620 290 1670" stroke={tvColor} strokeOpacity={0.3 * flick} strokeWidth={5} fill="none" />
      {/* brazo con mando */}
      <g transform={`translate(880 1640)`}>
        <rect x={-120} y={-30} width={160} height={58} rx={28} fill="#3b4a7a" />
        <circle cx={50} cy={0} r={32} fill={P.piel} />
        <rect x={40} y={-70 + press * 0.3} width={34} height={90} rx={12} fill="#15131f" transform="rotate(20 57 -25)" />
        <circle cx={62} cy={-52 + press * 0.3} r={5} fill="#ff4f6e" />
      </g>
      <Sparkles count={10} color={tvColor} seed="tvsp" speed={0.3} size={3} />
    </g>
  );
};
