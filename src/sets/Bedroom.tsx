import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Head, Expresion} from '../characters/Head';
import {PERSONAJES} from '../characters/palette';
import {WallClock} from '../components/Clocks';
import {Stars, Sparkles} from '../components/Particles';
import {FloatingHearts} from '../components/Heart';
import {Flame} from '../components/Flame';
import {blink, osc} from '../lib/anim';

export type BedroomProps = {
  /** "despiertos": risas y miradas. "dormidos": ojos cerrados y Zzz. */
  modo?: 'despiertos' | 'dormidos';
  /** Intensidad del movimiento bajo la manta (0..1.5). */
  movimiento?: number;
  /** Minutos del reloj de pared en función del frame local. */
  reloj?: (f: number) => number;
  corazones?: boolean;
  llamas?: boolean;
  idPrefix?: string;
};

const gauss = (x: number, s: number) => Math.exp(-(x * x) / (2 * s * s));

/** Habitación nocturna con la pareja bajo la manta rosa de corazones. */
export const Bedroom: React.FC<BedroomProps> = ({
  modo = 'despiertos',
  movimiento = 1,
  reloj = (f) => 23 * 60 + 10 + f * 0.12,
  corazones = true,
  llamas = true,
  idPrefix = 'bd',
}) => {
  const f = useCurrentFrame();
  const id = (s: string) => `${idPrefix}-${s}`;
  const awake = modo === 'despiertos';
  const m = movimiento;

  // Movimiento de los cuerpos bajo la manta
  const breath = osc(f, 54, 10);
  const wiggleA = osc(f, 26, 14 * m) + osc(f, 61, 10 * m, 1);
  const wiggleB = osc(f, 31, 14 * m, 2) + osc(f, 47, 9 * m, 0.5);
  const shiftA = osc(f, 80, 18 * m);
  const shiftB = osc(f, 70, 18 * m, 2);

  const hA = {x: 412 + shiftA * 0.6, y: 1180 + osc(f, 40, 6 * m)};
  const hB = {x: 668 + shiftB * 0.6, y: 1182 + osc(f, 44, 6 * m, 1.3)};

  // Borde superior de la manta
  const topY = (x: number) =>
    1335 -
    (46 + breath + wiggleA) * gauss(x - hA.x - 20, 135) -
    (46 + breath * 0.8 + wiggleB) * gauss(x - hB.x + 20, 135) -
    18 * gauss(x - 540, 60) +
    osc(f + x / 9, 90, 6 * m);
  // Bultos del cuerpo (más abajo)
  const bodyY = (x: number) =>
    1460 -
    (60 + wiggleA * 1.6) * gauss(x - hA.x - shiftA, 150) -
    (60 + wiggleB * 1.6) * gauss(x - hB.x - shiftB, 150);

  const xs: number[] = [];
  for (let x = 96; x <= 984; x += 16) xs.push(x);
  const top = xs.map((x) => [x, topY(x)] as const);
  const blanketD =
    `M 70 1760 L 84 ${topY(96) + 30} ` +
    top.map(([x, y]) => `L ${x} ${y.toFixed(1)}`).join(' ') +
    ` L 996 ${topY(984) + 30} L 1010 1760 ` +
    xs
      .slice()
      .reverse()
      .map((x) => `L ${x} ${(1760 + osc(f + x / 6, 70, 8 * m)).toFixed(1)}`)
      .join(' ') +
    ' Z';
  const foldD =
    top.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`).join(' ') +
    ' ' +
    top
      .slice()
      .reverse()
      .map(([x, y]) => `L ${x} ${(y + 52 + osc(f + x / 20, 60, 3)).toFixed(1)}`)
      .join(' ') +
    ' Z';
  const bodyLine = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${bodyY(x).toFixed(1)}`).join(' ');

  const exprA: Expresion = awake ? (osc(f, 120, 1) > 0.55 ? 'risa' : 'feliz') : 'dormido';
  const exprB: Expresion = awake ? (osc(f, 120, 1, 1.4) > 0.6 ? 'risa' : 'feliz') : 'dormido';
  const tiltA = 10 + osc(f, 75, 6 * m) + (awake ? 4 : 0);
  const tiltB = -10 + osc(f, 82, 6 * m, 1) - (awake ? 4 : 0);

  const minutes = reloj(f);
  const lampFlicker = 0.9 + osc(f, 37, 0.05) + osc(f, 13, 0.03);
  const curtain = osc(f, 90, 8);

  return (
    <g>
      <defs>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#140f2c" />
          <stop offset="55%" stopColor="#2c1f4d" />
          <stop offset="100%" stopColor="#47305f" />
        </linearGradient>
        <radialGradient id={id('lamp')} cx="8%" cy="58%" r="60%">
          <stop offset="0%" stopColor="#ffb98a" stopOpacity={0.55} />
          <stop offset="45%" stopColor="#ff8fa6" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#ff8fa6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1440" />
          <stop offset="100%" stopColor="#3a2f7a" />
        </linearGradient>
        <linearGradient id={id('head')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5aa0" />
          <stop offset="100%" stopColor="#5b3a72" />
        </linearGradient>
        <linearGradient id={id('blShade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#5a0a35" stopOpacity={0.45} />
        </linearGradient>
        <pattern id={id('hearts')} width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
          <path d="M45 58 C 40 53 28 46 28 37 C 28 30 36 27 41 31 C 43 33 45 35 45 36 C 45 35 47 33 49 31 C 54 27 62 30 62 37 C 62 46 50 53 45 58 Z" fill="#ffd0e2" opacity={0.9} />
          <path d="M10 18 C 8 16 3 13 3 9 C 3 6 6 5 8 7 L 10 9 L 12 7 C 14 5 17 6 17 9 C 17 13 12 16 10 18 Z" fill="#ff9cc2" />
        </pattern>
        <filter id={id('soft')}>
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <radialGradient id={id('vig')} cx="50%" cy="55%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.6} />
        </radialGradient>
      </defs>

      {/* pared */}
      <rect width={1080} height={1920} fill={`url(#${id('wall')})`} />
      {new Array(12).fill(0).map((_, i) => (
        <rect key={i} x={i * 96} y={0} width={48} height={1720} fill="#ffffff" opacity={0.018} />
      ))}

      {/* ventana con luna y estrellas */}
      <g transform="translate(0 50)">
        <rect x={86} y={560} width={360} height={380} rx={18} fill="#2a1d3d" />
        <rect x={104} y={578} width={324} height={344} rx={10} fill={`url(#${id('sky')})`} />
        <Stars count={26} area={[110, 585, 420, 910]} seed="win" />
        <circle cx={340} cy={660} r={44} fill="#fff4d6" />
        <circle cx={340} cy={660} r={80} fill="#fff4d6" opacity={0.12} />
        <circle cx={326} cy={650} r={9} fill="#e9dcb8" />
        <circle cx={352} cy={676} r={6} fill="#e9dcb8" />
        <rect x={262} y={578} width={10} height={344} fill="#2a1d3d" />
        <rect x={104} y={746} width={324} height={10} fill="#2a1d3d" />
        <path d={`M 70 540 L 200 540 C ${170 + curtain} 700 ${150 - curtain} 850 ${190 + curtain} 970 L 70 970 Z`} fill="#c2507f" />
        <path d={`M 462 540 L 340 540 C ${370 - curtain} 700 ${392 + curtain} 850 ${350 - curtain} 970 L 462 970 Z`} fill="#c2507f" />
        <path d={`M 110 540 C ${120 + curtain} 700 ${100} 850 ${130 + curtain} 970`} stroke="#a33c68" strokeWidth={10} fill="none" />
        <rect x={50} y={528} width={430} height={22} rx={11} fill="#d9a3b8" />
        <polygon points="104,922 428,922 620,1700 260,1700" fill="#b9c6ff" opacity={0.05} />
      </g>

      {/* reloj de pared */}
      <WallClock x={856} y={770} r={100} minutes={minutes} />

      {/* luz de lámpara */}
      <rect width={1080} height={1920} fill={`url(#${id('lamp')})`} opacity={lampFlicker} />

      {/* cabecero */}
      <rect x={140} y={950} width={800} height={380} rx={70} fill={`url(#${id('head')})`} />
      <rect x={140} y={950} width={800} height={380} rx={70} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={6} />
      {[0, 1, 2, 3, 4].map((i) =>
        [0, 1].map((j) => <circle key={`${i}-${j}`} cx={250 + i * 145} cy={1030 + j * 90} r={9} fill="#3e2552" opacity={0.7} />),
      )}

      {/* mesilla y lámpara */}
      <g>
        <rect x={-20} y={1210} width={130} height={230} rx={14} fill="#4b3058" />
        <rect x={-20} y={1290} width={130} height={8} fill="#3a2446" />
        <rect x={34} y={1110} width={14} height={100} fill="#e9c9a8" />
        <path d="M -6 1110 L 88 1110 L 70 1030 L 12 1030 Z" fill="#ffd9b0" />
        <ellipse cx={41} cy={1080} rx={130} ry={110} fill="#ffcf9a" opacity={0.22 * lampFlicker} />
      </g>

      {/* almohadas */}
      <ellipse cx={412} cy={1222} rx={182} ry={82} fill="#cdbbe8" />
      <ellipse cx={412} cy={1212} rx={176} ry={74} fill="#f4ecff" />
      <ellipse cx={668} cy={1222} rx={182} ry={82} fill="#cdbbe8" />
      <ellipse cx={668} cy={1212} rx={176} ry={74} fill="#f4ecff" />

      {/* cabezas */}
      <g transform={`translate(${hA.x} ${hA.y}) rotate(${tiltA})`}>
        <Head who="el" r={94} expr={exprA} eyes={awake ? blink(f, 1) : 0} look={awake ? 0.9 : 0} />
      </g>
      <g transform={`translate(${hB.x} ${hB.y}) rotate(${tiltB})`}>
        <Head who="ella" r={92} expr={exprB} eyes={awake ? blink(f, 2) : 0} look={awake ? -0.9 : 0} />
      </g>

      {/* manta */}
      <path d={blanketD} fill="#f2729f" />
      <path d={blanketD} fill={`url(#${id('hearts')})`} opacity={0.75} />
      <path d={blanketD} fill={`url(#${id('blShade')})`} />
      <path d={bodyLine} stroke="#ffb3cf" strokeWidth={8} fill="none" opacity={0.5} strokeLinecap="round" />
      <path d={bodyLine} stroke="#b8406e" strokeWidth={6} fill="none" opacity={0.35} transform="translate(0 16)" strokeLinecap="round" />
      <path d={foldD} fill="#ffd3e3" />
      <path d={foldD} fill="none" stroke="#e06a96" strokeWidth={4} opacity={0.6} />
      {/* manos agarrando la manta */}
      <ellipse cx={hA.x + 92} cy={topY(hA.x + 92) + 16} rx={30} ry={22} fill={PERSONAJES.el.piel} />
      <ellipse cx={hB.x - 92} cy={topY(hB.x - 92) + 16} rx={28} ry={21} fill={PERSONAJES.ella.piel} />

      {/* frente de la cama y suelo */}
      <rect x={0} y={1760} width={1080} height={160} fill="#1f1529" />
      <rect x={60} y={1748} width={960} height={40} rx={14} fill="#3a2550" />

      {/* efectos */}
      {corazones && awake && <FloatingHearts count={7} area={[300, 1050, 780, 1200]} rise={420} seed="bedh" />}
      {llamas && (
        <>
          <Flame x={170 + osc(f, 40, 6)} y={1520 + osc(f, 30, 8)} size={70} seed={11} opacity={0.95} />
          <Flame x={920 + osc(f, 45, 6, 1)} y={1500 + osc(f, 34, 8, 2)} size={80} seed={12} opacity={0.95} />
          <Flame x={540 + osc(f, 50, 10)} y={1640} size={56} seed={13} opacity={0.85} />
        </>
      )}
      {!awake && (
        <g>
          {[0, 1, 2].map((i) => {
            const t = ((f + i * 22) % 66) / 66;
            return (
              <text
                key={i}
                x={760 + t * 90 + osc(f, 30, 10, i)}
                y={1060 - t * 200}
                fill="#e7dcff"
                opacity={t < 0.2 ? t * 5 : 1 - t}
                fontFamily="Poppins"
                fontWeight={800}
                fontSize={44 + t * 30}
              >
                Z
              </text>
            );
          })}
        </g>
      )}
      <Sparkles count={22} color="#ffd6ea" seed="bedsp" speed={0.5} size={4} />
      <rect width={1080} height={1920} fill={`url(#${id('vig')})`} />
    </g>
  );
};
