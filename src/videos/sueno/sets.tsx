import React from 'react';
import {useCurrentFrame} from 'remotion';
import {WallClock} from '../../components/Clocks';
import {Sparkles, Stars} from '../../components/Particles';
import {osc, rnd} from '../../lib/anim';
import {Luna} from './objetos';

/**
 * DORMITORIO individual. capa: 'fondo' (pared, ventana, reloj, cabecero) o
 * 'frente' (manta y mesilla, por delante del personaje).
 * hora: 'noche' (azul, luz del móvil) o 'amanecer' (cálido).
 */
export const Dormitorio: React.FC<{capa: 'fondo' | 'frente'; hora?: 'noche' | 'amanecer'; minutos?: number; luzMovil?: number; id: string}> = ({
  capa,
  hora = 'noche',
  minutos = 0,
  luzMovil = 0,
  id,
}) => {
  const f = useCurrentFrame();
  const am = hora === 'amanecer';
  const k = (s: string) => `${id}-${s}`;
  if (capa === 'frente') {
    return (
      <g>
        <path
          d={`M -40 1500 C 200 ${1420 + osc(f, 80, 8)} 500 ${1450 + osc(f, 70, 6, 1)} 1120 1420 L 1120 1960 L -40 1960 Z`}
          fill={am ? '#f39ab8' : '#5a4f9e'}
        />
        <path d={`M -40 1500 C 200 ${1420 + osc(f, 80, 8)} 500 ${1450 + osc(f, 70, 6, 1)} 1120 1420`} stroke={am ? '#ffd1e0' : '#8d82d6'} strokeWidth={34} fill="none" />
        {new Array(7).fill(0).map((_, i) => (
          <path key={i} d={`M ${60 + i * 160} 1560 q 40 60 0 120`} stroke={am ? '#e57a9e' : '#463c85'} strokeWidth={10} fill="none" opacity={0.7} />
        ))}
        {/* mesilla con móvil */}
        <rect x={860} y={1330} width={240} height={220} rx={18} fill={am ? '#b07a5a' : '#2c2350'} />
        <rect x={900} y={1300} width={110} height={34} rx={8} fill="#111" transform="rotate(-8 955 1317)" />
        {luzMovil > 0 && <ellipse cx={955} cy={1290} rx={240} ry={140} fill="#7fd0ff" opacity={0.18 * luzMovil} />}
      </g>
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={k('pared')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={am ? '#ffcf9e' : '#0b0d2a'} />
          <stop offset="100%" stopColor={am ? '#e98b8b' : '#2a2459'} />
        </linearGradient>
        <linearGradient id={k('cielo')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={am ? '#7ec8ff' : '#050822'} />
          <stop offset="70%" stopColor={am ? '#ffd7a1' : '#1d2366'} />
          <stop offset="100%" stopColor={am ? '#ff9f6b' : '#3a2f7a'} />
        </linearGradient>
        <radialGradient id={k('luz')} cx="20%" cy="35%" r="70%">
          <stop offset="0%" stopColor={am ? '#fff2c2' : '#8fb4ff'} stopOpacity={am ? 0.55 : 0.22} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('pared')})`} />
      {/* ventana */}
      <rect x={90} y={380} width={400} height={480} rx={20} fill={am ? '#c98a5a' : '#1a1440'} />
      <rect x={110} y={400} width={360} height={440} rx={12} fill={`url(#${k('cielo')})`} />
      {am ? (
        <g>
          <circle cx={290} cy={820} r={110} fill="#ffe7a3" />
          <circle cx={290} cy={820} r={200} fill="#ffe7a3" opacity={0.25} />
        </g>
      ) : (
        <g>
          <Stars count={30} area={[115, 405, 465, 830]} seed={`${id}st`} />
          <g transform="translate(380 500)">
            <Luna r={48} />
          </g>
        </g>
      )}
      <rect x={284} y={400} width={12} height={440} fill={am ? '#c98a5a' : '#1a1440'} />
      <rect x={110} y={614} width={360} height={12} fill={am ? '#c98a5a' : '#1a1440'} />
      <polygon points="110,840 470,840 760,1700 300,1700" fill={am ? '#fff2c2' : '#b9c6ff'} opacity={am ? 0.12 : 0.05} />
      {/* reloj */}
      <WallClock x={800} y={560} r={120} minutes={minutos} rim={am ? '#ffb38a' : '#8d82d6'} />
      {/* cabecero */}
      <rect x={60} y={1050} width={960} height={420} rx={60} fill={am ? '#d77a8f' : '#2f2763'} />
      <rect x={60} y={1050} width={960} height={420} rx={60} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={6} />
      {/* almohada */}
      <ellipse cx={540} cy={1250} rx={300} ry={90} fill={am ? '#fff3f6' : '#c6c0f0'} />
      <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('luz')})`} />
      <Sparkles count={14} color={am ? '#fff2c2' : '#b9c6ff'} seed={`${id}sp`} speed={0.3} size={3} />
    </g>
  );
};

/** ESCRITORIO de noche: pared con ciudad, escritorio delante con monitor y tazas. */
export const Escritorio: React.FC<{capa: 'fondo' | 'frente'; brilloMonitor?: number; id: string}> = ({capa, brilloMonitor = 1, id}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  if (capa === 'frente') {
    return (
      <g>
        <rect x={-60} y={1380} width={1200} height={600} fill="#3a2a4a" />
        <rect x={-60} y={1380} width={1200} height={26} fill="#5a4470" />
        {/* monitor de espaldas (borde) que ilumina la cara */}
        <ellipse cx={540} cy={1180} rx={420} ry={300} fill="#7fd0ff" opacity={0.1 * brilloMonitor + osc(f, 7, 0.01)} />
      </g>
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={k('p')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0f2e" />
          <stop offset="100%" stopColor="#2c2055" />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('p')})`} />
      <rect x={140} y={300} width={800} height={640} rx={20} fill="#070a20" />
      {new Array(12).fill(0).map((_, j) => {
        const h = 160 + ((j * 53) % 300);
        return (
          <g key={j}>
            <rect x={150 + j * 66} y={930 - h} width={56} height={h} fill="#141a45" />
            {new Array(Math.floor(h / 40)).fill(0).map((__, q) => (
              <rect key={q} x={162 + j * 66} y={930 - h + 14 + q * 40} width={12} height={16} fill="#ffd27a" opacity={(j + q) % 3 === 0 ? 0.75 + osc(f, 50 + q * 7, 0.15, j) : 0.12} />
            ))}
          </g>
        );
      })}
      <rect x={530} y={300} width={20} height={640} fill="#1a1440" />
      {/* estantería */}
      <rect x={760} y={1020} width={300} height={16} fill="#4a3a6a" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={780 + i * 52} y={940} width={40} height={80} rx={4} fill={['#ff5fb0', '#5dd8ff', '#ffd84a', '#8d82d6'][i]} opacity={0.8} />
      ))}
      <Sparkles count={12} color="#9fc6ff" seed={`${id}sp`} speed={0.3} size={3} />
    </g>
  );
};

/** Fondo "dentro del cuerpo": degradado, hexágonos y partículas. */
export const FondoCuerpo: React.FC<{color?: string; id: string}> = ({color = '#0d2a4a', id}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  return (
    <g>
      <defs>
        <radialGradient id={k('g')} cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#050818" />
        </radialGradient>
        <pattern id={k('hex')} width="120" height="104" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${(f * 0.5) % 104})`}>
          <path d="M 30 2 L 90 2 L 118 52 L 90 102 L 30 102 L 2 52 Z" fill="none" stroke="#5dd8ff" strokeOpacity={0.12} strokeWidth={3} />
        </pattern>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('g')})`} />
      <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('hex')})`} />
      {new Array(18).fill(0).map((_, i) => (
        <circle
          key={i}
          cx={rnd(`${id}x${i}`) * 1080 + osc(f, 90 + i * 5, 30, i)}
          cy={((rnd(`${id}y${i}`) * 2100 - f * (1 + rnd(`${id}v${i}`) * 2)) % 2100 + 2100) % 2100 - 90}
          r={6 + rnd(`${id}r${i}`) * 16}
          fill="#ff6f8a"
          opacity={0.25}
        />
      ))}
    </g>
  );
};

/** Cuarto a oscuras: sombras, puerta entreabierta con luz, ojos en la oscuridad. */
export const CuartoOscuro: React.FC<{luzPuerta?: number; id: string}> = ({luzPuerta = 1, id}) => {
  const k = (s: string) => `${id}-${s}`;
  return (
    <g>
      <defs>
        <radialGradient id={k('g')} cx="50%" cy="55%" r="70%">
          <stop offset="0%" stopColor="#1b1530" />
          <stop offset="100%" stopColor="#020106" />
        </radialGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('g')})`} />
      <rect x={720} y={500} width={260} height={900} fill="#0a0814" />
      <rect x={720} y={500} width={46} height={900} fill="#ffcf8a" opacity={0.55 * luzPuerta} />
      <polygon points="720,1400 766,1400 1000,1920 600,1920" fill="#ffcf8a" opacity={0.1 * luzPuerta} />
      <rect x={-200} y={1500} width={1480} height={620} fill="#06040c" />
    </g>
  );
};

/** Mesa de papel envejecido para la noticia de 1964. */
export const FondoSepia: React.FC<{id: string}> = ({id}) => {
  const k = (s: string) => `${id}-${s}`;
  return (
    <g>
      <defs>
        <radialGradient id={k('g')} cx="50%" cy="45%" r="80%">
          <stop offset="0%" stopColor="#8a6a46" />
          <stop offset="100%" stopColor="#2a1c10" />
        </radialGradient>
        <filter id={k('papel')}>
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={4} />
          <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0.35 0" />
        </filter>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('g')})`} />
      <rect x={-200} y={-200} width={1480} height={2320} filter={`url(#${k('papel')})`} />
    </g>
  );
};
