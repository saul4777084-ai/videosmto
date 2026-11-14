import React from 'react';

/** Reloj de pared analógico. minutes = minutos totales del día (decimal). */
export const WallClock: React.FC<{x: number; y: number; r: number; minutes: number; rim?: string}> = ({x, y, r, minutes, rim = '#e8a0b8'}) => {
  const ha = ((minutes / 60) % 12) * 30;
  const ma = (minutes % 60) * 6;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={8} cy={14} rx={r * 1.04} ry={r * 1.04} fill="rgba(0,0,0,0.3)" />
      <circle r={r} fill={rim} />
      <circle r={r} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={4} />
      <circle r={r * 0.86} fill="#fff6ee" />
      <circle r={r * 0.86} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={r * 0.06} />
      {new Array(60).fill(0).map((_, i) => {
        const big = i % 5 === 0;
        return (
          <line
            key={i}
            x1={0}
            y1={-r * 0.78}
            x2={0}
            y2={-r * (big ? 0.64 : 0.72)}
            stroke="#3b2a3a"
            strokeWidth={big ? r * 0.05 : r * 0.018}
            strokeLinecap="round"
            transform={`rotate(${i * 6})`}
          />
        );
      })}
      <line x1={0} y1={r * 0.08} x2={0} y2={-r * 0.42} stroke="#2b1f2b" strokeWidth={r * 0.08} strokeLinecap="round" transform={`rotate(${ha})`} />
      <line x1={0} y1={r * 0.1} x2={0} y2={-r * 0.62} stroke="#2b1f2b" strokeWidth={r * 0.05} strokeLinecap="round" transform={`rotate(${ma})`} />
      <line x1={0} y1={r * 0.14} x2={0} y2={-r * 0.68} stroke="#e8445a" strokeWidth={r * 0.022} strokeLinecap="round" transform={`rotate(${ma * 12})`} />
      <circle r={r * 0.07} fill="#e8445a" />
      <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.35} ry={r * 0.16} fill="#fff" opacity={0.35} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.45})`} />
    </g>
  );
};

/** Cronómetro grande. seconds = segundos transcurridos, progress = 0..1 para el arco. */
export const Stopwatch: React.FC<{x: number; y: number; r: number; seconds: number; progress: number; press?: number; color?: string}> = ({
  x,
  y,
  r,
  seconds,
  progress,
  press = 0,
  color = '#ff4f6e',
}) => {
  const sa = (seconds % 60) * 6;
  const ma = ((seconds / 60) % 30) * 12;
  const arcR = r * 0.93;
  const circ = 2 * Math.PI * arcR;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* corona y botones */}
      <g transform={`translate(0 ${press * 10})`}>
        <rect x={-r * 0.12} y={-r * 1.28} width={r * 0.24} height={r * 0.2} rx={8} fill="#c9cfe0" />
        <rect x={-r * 0.2} y={-r * 1.38} width={r * 0.4} height={r * 0.13} rx={10} fill="#e9edf7" stroke="#8b93ad" strokeWidth={4} />
      </g>
      <rect x={-r * 0.07} y={-r * 1.12} width={r * 0.14} height={r * 0.12} fill="#aab2c8" />
      <g transform={`rotate(42) translate(0 ${-r * 1.08})`}>
        <rect x={-r * 0.08} y={-r * 0.12} width={r * 0.16} height={r * 0.16} rx={6} fill="#c9cfe0" stroke="#8b93ad" strokeWidth={3} />
      </g>
      <circle r={r * 1.08} fill="rgba(0,0,0,0.35)" transform="translate(10 16)" />
      <circle r={r * 1.06} fill="#dfe4f0" />
      <circle r={r * 1.06} fill="none" stroke="#7e87a3" strokeWidth={6} />
      <circle r={r} fill="#1b1f33" />
      <circle r={arcR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={r * 0.06} />
      <circle
        r={arcR}
        fill="none"
        stroke={color}
        strokeWidth={r * 0.06}
        strokeLinecap="round"
        strokeDasharray={`${circ * progress} ${circ}`}
        transform="rotate(-90)"
        style={{filter: `drop-shadow(0 0 10px ${color})`}}
      />
      {new Array(60).fill(0).map((_, i) => {
        const big = i % 5 === 0;
        return (
          <line
            key={i}
            x1={0}
            y1={-r * 0.84}
            x2={0}
            y2={-r * (big ? 0.72 : 0.79)}
            stroke={big ? '#ffffff' : 'rgba(255,255,255,0.45)'}
            strokeWidth={big ? 6 : 3}
            strokeLinecap="round"
            transform={`rotate(${i * 6})`}
          />
        );
      })}
      {new Array(12).fill(0).map((_, i) => {
        const a = ((i + 1) * 30 * Math.PI) / 180;
        return (
          <text
            key={i}
            x={Math.sin(a) * r * 0.6}
            y={-Math.cos(a) * r * 0.6 + 14}
            textAnchor="middle"
            fill="#cfd6ff"
            fontFamily="Poppins"
            fontWeight={700}
            fontSize={r * 0.1}
          >
            {(i + 1) * 5}
          </text>
        );
      })}
      {/* subesfera de minutos */}
      <g transform={`translate(0 ${r * 0.34})`}>
        <circle r={r * 0.2} fill="#252a44" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
        {new Array(6).fill(0).map((_, i) => (
          <line key={i} x1={0} y1={-r * 0.17} x2={0} y2={-r * 0.13} stroke="#fff" strokeWidth={3} transform={`rotate(${i * 60})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-r * 0.16} stroke={color} strokeWidth={6} strokeLinecap="round" transform={`rotate(${ma})`} />
        <circle r={7} fill="#fff" />
      </g>
      <g transform={`rotate(${sa})`}>
        <line x1={0} y1={r * 0.18} x2={0} y2={-r * 0.82} stroke={color} strokeWidth={8} strokeLinecap="round" style={{filter: `drop-shadow(0 0 8px ${color})`}} />
      </g>
      <circle r={r * 0.06} fill={color} />
      <circle r={r * 0.025} fill="#fff" />
      <ellipse cx={-r * 0.38} cy={-r * 0.5} rx={r * 0.42} ry={r * 0.16} fill="#fff" opacity={0.08} transform={`rotate(-35 ${-r * 0.38} ${-r * 0.5})`} />
    </g>
  );
};
