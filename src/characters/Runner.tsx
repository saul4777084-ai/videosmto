import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PERSONAJES, Quien} from './palette';
import {blink} from '../lib/anim';

const rad = (d: number) => (d * Math.PI) / 180;
const pt = (x: number, y: number, ang: number, len: number) => [x + Math.sin(rad(ang)) * len, y + Math.cos(rad(ang)) * len] as const;

/**
 * Corredor de perfil (mirando a la derecha) con brazos y piernas articulados.
 * (x, y) = cadera. period = frames por zancada completa.
 */
export const Runner: React.FC<{x: number; y: number; scale?: number; who: Quien; period?: number; phase?: number}> = ({
  x,
  y,
  scale = 1,
  who,
  period = 20,
  phase = 0,
}) => {
  const f = useCurrentFrame();
  const P = PERSONAJES[who];
  const phi = (f / period) * Math.PI * 2 + phase;
  const bob = -6 * Math.cos(2 * phi);
  const T = 108; // muslo
  const S = 102; // espinilla
  const UA = 78;
  const FA = 72;

  const leg = (ph: number) => {
    const a = 32 * Math.sin(ph);
    const k = 12 + 78 * Math.pow(Math.max(0, Math.cos(ph)), 1.4);
    const knee = pt(0, 0, a, T);
    const foot = pt(knee[0], knee[1], a - k, S);
    return {knee, foot, footAng: (a - k) * 0.4};
  };
  const shoulder = [22, -150] as const;
  const arm = (ph: number) => {
    const ua = -38 * Math.sin(ph);
    const elbow = pt(shoulder[0], shoulder[1], ua, UA);
    const hand = pt(elbow[0], elbow[1], ua + 95, FA);
    return {elbow, hand};
  };
  const L1 = leg(phi);
  const L2 = leg(phi + Math.PI);
  const A1 = arm(phi + Math.PI); // brazo opuesto a la pierna
  const A2 = arm(phi);

  const drawLeg = (L: ReturnType<typeof leg>, back: boolean) => {
    const skin = back ? P.pielSombra : P.piel;
    return (
      <g>
        <line x1={0} y1={0} x2={L.knee[0]} y2={L.knee[1]} stroke={skin} strokeWidth={34} strokeLinecap="round" />
        <line x1={0} y1={0} x2={(L.knee[0] * 0.6)} y2={(L.knee[1] * 0.6)} stroke={back ? '#1a2038' : P.pantalon} strokeWidth={42} strokeLinecap="round" />
        <line x1={L.knee[0]} y1={L.knee[1]} x2={L.foot[0]} y2={L.foot[1]} stroke={skin} strokeWidth={30} strokeLinecap="round" />
        <g transform={`translate(${L.foot[0]} ${L.foot[1]}) rotate(${-L.footAng})`}>
          <rect x={-18} y={-14} width={58} height={28} rx={14} fill={back ? '#d8dbe6' : P.zapatilla} />
          <rect x={-18} y={6} width={58} height={10} rx={5} fill={P.suela} />
        </g>
      </g>
    );
  };
  const drawArm = (A: ReturnType<typeof arm>, back: boolean) => {
    const skin = back ? P.pielSombra : P.piel;
    return (
      <g>
        <line x1={shoulder[0]} y1={shoulder[1]} x2={A.elbow[0]} y2={A.elbow[1]} stroke={skin} strokeWidth={26} strokeLinecap="round" />
        <line
          x1={shoulder[0]}
          y1={shoulder[1]}
          x2={shoulder[0] + (A.elbow[0] - shoulder[0]) * 0.45}
          y2={shoulder[1] + (A.elbow[1] - shoulder[1]) * 0.45}
          stroke={back ? P.camisetaSombra : P.camiseta}
          strokeWidth={34}
          strokeLinecap="round"
        />
        <line x1={A.elbow[0]} y1={A.elbow[1]} x2={A.hand[0]} y2={A.hand[1]} stroke={skin} strokeWidth={24} strokeLinecap="round" />
        <circle cx={A.hand[0]} cy={A.hand[1]} r={15} fill={skin} />
      </g>
    );
  };

  const hr = 54;
  const head = [44, -218] as const;
  const eyes = blink(f, who === 'el' ? 5 : 6);
  const pony = Math.sin(phi * 2) * 14;

  return (
    <g transform={`translate(${x} ${y + bob * scale}) scale(${scale})`}>
      {drawArm(A1, true)}
      {drawLeg(L2, true)}
      {/* torso */}
      <path d="M -26 -6 C -34 -60 -22 -140 6 -166 C 30 -178 58 -160 56 -130 C 54 -80 44 -40 32 -4 Z" fill={P.camiseta} />
      <path d="M -26 -6 C -34 -60 -22 -140 6 -166 C -6 -120 -10 -60 2 -4 Z" fill={P.camisetaSombra} opacity={0.6} />
      <rect x={-32} y={-18} width={70} height={36} rx={16} fill={P.pantalon} />
      {/* cuello y cabeza de perfil */}
      <rect x={28} y={-182} width={26} height={30} rx={10} fill={P.pielSombra} />
      <g transform={`translate(${head[0]} ${head[1]})`}>
        {who === 'ella' && (
          <path d={`M ${-hr * 0.7} ${-hr * 0.5} C ${-hr * 1.4} ${-hr * 0.6 + pony} ${-hr * 1.8} ${hr * 0.2 + pony} ${-hr * 1.55} ${hr * 0.6 + pony} C ${-hr * 1.3} ${hr * 0.1 + pony} ${-hr * 1.0} ${-hr * 0.1} ${-hr * 0.6} ${-hr * 0.1} Z`} fill={P.pelo} />
        )}
        <circle r={hr} fill={P.piel} />
        <path d={`M ${hr * 0.92} ${-hr * 0.05} Q ${hr * 1.18} ${hr * 0.1} ${hr * 0.9} ${hr * 0.22}`} fill={P.piel} />
        <path
          d={
            who === 'el'
              ? `M ${-hr * 1.02} ${hr * 0.1} C ${-hr * 1.1} ${-hr * 1.2} ${hr * 0.9} ${-hr * 1.3} ${hr * 1.0} ${-hr * 0.3} C ${hr * 0.6} ${-hr * 0.55} ${hr * 0.1} ${-hr * 0.5} ${-hr * 0.2} ${-hr * 0.35} C ${-hr * 0.5} ${-hr * 0.2} ${-hr * 0.8} ${0} ${-hr * 1.02} ${hr * 0.1} Z`
              : `M ${-hr * 1.05} ${hr * 0.35} C ${-hr * 1.2} ${-hr * 1.25} ${hr * 0.95} ${-hr * 1.35} ${hr * 1.02} ${-hr * 0.2} C ${hr * 0.55} ${-hr * 0.6} ${hr * 0.05} ${-hr * 0.45} ${-hr * 0.25} ${-hr * 0.3} C ${-hr * 0.55} ${-hr * 0.1} ${-hr * 0.85} ${hr * 0.1} ${-hr * 1.05} ${hr * 0.35} Z`
          }
          fill={P.pelo}
        />
        <circle cx={-hr * 0.12} cy={hr * 0.12} r={hr * 0.17} fill={P.pielSombra} />
        <ellipse cx={hr * 0.52} cy={-hr * 0.02} rx={hr * 0.09} ry={hr * 0.13 * Math.max(0.15, eyes)} fill="#2b1a20" />
        <path d={`M ${hr * 0.38} ${-hr * 0.26} Q ${hr * 0.55} ${-hr * 0.34} ${hr * 0.7} ${-hr * 0.26}`} stroke={P.pelo} strokeWidth={6} fill="none" strokeLinecap="round" />
        <ellipse cx={hr * 0.42} cy={hr * 0.32} rx={hr * 0.15} ry={hr * 0.09} fill="#ff6f8e" opacity={0.55} />
        <path d={`M ${hr * 0.5} ${hr * 0.5} Q ${hr * 0.66} ${hr * 0.66} ${hr * 0.8} ${hr * 0.52}`} stroke="#4a1a26" strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* gotas de sudor */}
        <path d={`M ${-hr * 0.2} ${-hr * 1.1} q 8 14 0 22 q -8 -8 0 -22 Z`} fill="#9fe3ff" opacity={0.5 + 0.5 * Math.sin(phi)} />
      </g>
      {drawLeg(L1, false)}
      {drawArm(A2, false)}
    </g>
  );
};

/** Cinta de correr con banda en movimiento y consola iluminada. (x,y) = superficie de la banda, centro. */
export const Treadmill: React.FC<{x: number; y: number; scale?: number; speed?: number; screen?: string; color?: string}> = ({
  x,
  y,
  scale = 1,
  speed = 9,
  screen = '#5dff9c',
  color = '#4a5280',
}) => {
  const f = useCurrentFrame();
  const off = (f * speed) % 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={20} cy={70} rx={300} ry={26} fill="rgba(0,0,0,0.35)" />
      {/* base */}
      <path d="M -270 10 L 250 10 L 280 50 L -250 50 Z" fill={color} />
      <path d="M -250 50 L 280 50 L 280 62 L -250 62 Z" fill="#2c3152" />
      {/* banda */}
      <rect x={-270} y={-8} width={520} height={22} rx={11} fill="#1a1d2c" />
      <clipPath id={`belt-${x}`}>
        <rect x={-262} y={-6} width={504} height={18} rx={9} />
      </clipPath>
      <g clipPath={`url(#belt-${x})`}>
        {new Array(11).fill(0).map((_, i) => (
          <rect key={i} x={-280 + i * 60 - off} y={-4} width={26} height={4} rx={2} fill="#4c5272" />
        ))}
      </g>
      <circle cx={-262} cy={3} r={14} fill="#2c3152" />
      <circle cx={242} cy={3} r={14} fill="#2c3152" />
      {/* poste y consola */}
      <path d="M 210 0 L 236 0 L 262 -250 L 240 -250 Z" fill="#7a83b5" />
      <path d="M 120 -180 L 250 -205" stroke="#9aa3d4" strokeWidth={14} strokeLinecap="round" />
      <g transform="translate(250 -270) rotate(-12)">
        <rect x={-70} y={-40} width={130} height={80} rx={14} fill="#2a2f4d" stroke="#9aa3d4" strokeWidth={5} />
        <rect x={-56} y={-26} width={102} height={42} rx={6} fill="#071a12" />
        <rect x={-50} y={-18} width={(f * 2) % 90} height={10} rx={3} fill={screen} opacity={0.85} />
        <rect x={-50} y={-2} width={60} height={8} rx={3} fill={screen} opacity={0.5} />
        <circle cx={-40} cy={28} r={5} fill="#ff5a3c" />
        <circle cx={-22} cy={28} r={5} fill={screen} />
      </g>
    </g>
  );
};
