import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Runner, Treadmill} from '../characters/Runner';
import {Sparkles} from '../components/Particles';
import {osc} from '../lib/anim';

/** Fondo de gimnasio con ventanales y luz suave. */
export const GymBackground: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      <defs>
        <linearGradient id="gymWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2350" />
          <stop offset="60%" stopColor="#35407a" />
          <stop offset="100%" stopColor="#4e4a8a" />
        </linearGradient>
        <linearGradient id="gymFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3566" />
          <stop offset="100%" stopColor="#1d1a3a" />
        </linearGradient>
        <radialGradient id="gymLight" cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#bfe3ff" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#bfe3ff" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="gymWin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1238" />
          <stop offset="100%" stopColor="#3b3f86" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#gymWall)" />
      {/* ventanales con la ciudad */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${70 + i * 330} 560)`}>
          <rect width={280} height={560} rx={10} fill="#141938" />
          <rect x={12} y={12} width={256} height={536} rx={6} fill="url(#gymWin)" />
          {new Array(7).fill(0).map((_, j) => {
            const h = 120 + ((i * 7 + j) * 53) % 240;
            return (
              <g key={j}>
                <rect x={14 + j * 37} y={548 - h} width={32} height={h} fill="#1a1f4a" />
                {new Array(Math.floor(h / 34)).fill(0).map((__, k) => (
                  <rect
                    key={k}
                    x={22 + j * 37}
                    y={548 - h + 12 + k * 34}
                    width={8}
                    height={12}
                    fill="#ffd27a"
                    opacity={((i + j + k) % 3 === 0 ? 0.8 : 0.15) + 0.1 * osc(f, 40 + k * 7, 1, j)}
                  />
                ))}
              </g>
            );
          })}
          <rect x={136} y={12} width={8} height={536} fill="#141938" />
        </g>
      ))}
      <rect x={0} y={1120} width={1080} height={14} fill="#5a63a8" />
      {/* suelo en perspectiva */}
      <rect x={0} y={1134} width={1080} height={786} fill="url(#gymFloor)" />
      {new Array(9).fill(0).map((_, i) => (
        <line key={i} x1={540 + (i - 4) * 80} y1={1134} x2={540 + (i - 4) * 320} y2={1920} stroke="#ffffff" strokeOpacity={0.05} strokeWidth={3} />
      ))}
      {new Array(6).fill(0).map((_, i) => (
        <line key={i} x1={0} y1={1134 + i * i * 22} x2={1080} y2={1134 + i * i * 22} stroke="#ffffff" strokeOpacity={0.04} strokeWidth={3} />
      ))}
      {/* pesas al fondo */}
      <g transform="translate(860 1080)">
        <rect x={-110} y={-6} width={220} height={12} fill="#8a92c4" />
        <rect x={-120} y={-36} width={22} height={72} rx={6} fill="#2a2f4d" />
        <rect x={98} y={-36} width={22} height={72} rx={6} fill="#2a2f4d" />
      </g>
      <rect width={1080} height={1920} fill="url(#gymLight)" />
      <Sparkles count={16} color="#cfe6ff" seed="gym" speed={0.4} size={4} />
    </g>
  );
};

/** Pareja corriendo en dos cintas. */
export const GymRunners: React.FC<{scale?: number; solo?: 'el' | 'ella'}> = ({scale = 1, solo}) => (
  <g>
    {solo !== 'el' && (
    <g transform="translate(300 1300)">
      <Treadmill x={0} y={0} scale={0.82 * scale} />
      <Runner x={-10} y={-215 * 0.82 * scale} scale={0.82 * scale} who="ella" period={19} />
    </g>
    )}
    {solo !== 'ella' && (
    <g transform="translate(720 1640)">
      <Treadmill x={0} y={0} scale={0.95 * scale} color="#565f96" />
      <Runner x={-10} y={-215 * 0.95 * scale} scale={0.95 * scale} who="el" period={20} phase={1.2} />
    </g>
    )}
  </g>
);
