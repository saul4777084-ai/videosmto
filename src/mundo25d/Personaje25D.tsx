import React, {useId} from 'react';
import {useCurrentFrame} from 'remotion';
import {blink, osc} from '../lib/anim';

/**
 * PERSONAJE 2.5D
 *
 * Rig con volumen y giro simulado: el parámetro `giro` (-1 izquierda … 1 derecha)
 * desplaza cada parte según su profundidad (la nariz se mueve más que los ojos,
 * las orejas y el pelo trasero en sentido contrario, el ojo lejano se estrecha),
 * así la cabeza "gira" sin deformar el dibujo. Luz principal arriba a la
 * izquierda, luz de contorno y sombra de contacto.
 *
 * Origen (0,0) = centro del pecho. Cabeza en (0,-300), radio ~150.
 */
export type Boca25 = 'neutra' | 'sonrisa' | 'abierta' | 'sorpresa' | 'seria';
export type Peinado25 = 'corto' | 'coleta' | 'coletas' | 'calvo' | 'mono' | 'casco' | 'gorroChef' | 'sombrero' | 'robot';
export type Ropa25 = 'camiseta' | 'bata' | 'espacial' | 'delantal' | 'explorador' | 'chaleco' | 'metal' | 'sudadera';

export type Diseno25 = {
  nombre: string;
  piel: string;
  pelo: string;
  peinado: Peinado25;
  ropa: Ropa25;
  colorRopa: string;
  colorRopa2: string;
  iris?: string;
  gafas?: boolean;
  bigote?: boolean;
  estetoscopio?: boolean;
  pajarita?: boolean;
  mochila?: boolean;
  pecas?: boolean;
};

export const PERSONAJES_25D: Record<string, Diseno25> = {
  cientifica: {nombre: 'Dra. Vega', piel: '#f0c4a0', pelo: '#3a2418', peinado: 'coleta', ropa: 'bata', colorRopa: '#f4f6fb', colorRopa2: '#5a6ad6', gafas: true},
  astronauta: {nombre: 'Kai', piel: '#c48a62', pelo: '#1a1210', peinado: 'casco', ropa: 'espacial', colorRopa: '#eef1f6', colorRopa2: '#ff7a2f'},
  chef: {nombre: 'Chef Rossi', piel: '#f2c8a6', pelo: '#5a3a22', peinado: 'gorroChef', ropa: 'delantal', colorRopa: '#ffffff', colorRopa2: '#d63a4a', bigote: true},
  exploradora: {nombre: 'Amara', piel: '#7a4a30', pelo: '#120c0a', peinado: 'sombrero', ropa: 'explorador', colorRopa: '#c8a868', colorRopa2: '#6a4a2a', mochila: true},
  abuelo: {nombre: 'Don Tomás', piel: '#e8b896', pelo: '#e8e8ee', peinado: 'calvo', ropa: 'chaleco', colorRopa: '#7a5a8a', colorRopa2: '#e8e0d0', gafas: true, bigote: true, pajarita: true},
  nina: {nombre: 'Lía', piel: '#ffd8b8', pelo: '#e88a3a', peinado: 'coletas', ropa: 'camiseta', colorRopa: '#ffd23a', colorRopa2: '#3a8ad6', pecas: true, iris: '#3a7a3a'},
  robot: {nombre: 'B-07', piel: '#9aa8c0', pelo: '#5a6a88', peinado: 'robot', ropa: 'metal', colorRopa: '#7a8aa8', colorRopa2: '#3fd8ff'},
  doctor: {nombre: 'Dr. Okafor', piel: '#5a3624', pelo: '#0e0a08', peinado: 'corto', ropa: 'bata', colorRopa: '#f4f6fb', colorRopa2: '#2fb39a', estetoscopio: true},
};

const ajustar = (hex: string, d: number) => {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const r = n.map((v) => Math.max(0, Math.min(255, Math.round(d >= 0 ? v + (255 - v) * d : v * (1 + d)))));
  return `#${r.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

export const Personaje25D: React.FC<{
  diseno: Diseno25;
  /** -1 mira a su derecha (izquierda de pantalla) · 0 frente · 1 a la izquierda de pantalla… */
  giro?: number;
  boca?: Boca25;
  mirada?: number;
  cejas?: number;
  ojos?: number;
  semilla?: number;
  /** Habla: anima la boca. */
  habla?: boolean;
}> = ({diseno: D, giro = 0, boca = 'neutra', mirada = 0, cejas = 0, ojos = 1, semilla = 1, habla = false}) => {
  const f = useCurrentFrame();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const k = (s: string) => `${uid}${s}`;
  const g = Math.max(-1, Math.min(1, giro));
  const ag = Math.abs(g);
  const ap = Math.max(0.05, blink(f, semilla) * ojos);
  const respira = osc(f, 70, 3);
  const pielL = ajustar(D.piel, 0.18);
  const pielS = ajustar(D.piel, -0.22);
  const ropaL = ajustar(D.colorRopa, 0.15);
  const ropaS = ajustar(D.colorRopa, -0.25);
  const peloS = ajustar(D.pelo, -0.3);
  const esRobot = D.peinado === 'robot';
  const bocaReal: Boca25 = habla ? (Math.floor(f / 4) % 3 === 0 ? 'abierta' : Math.floor(f / 4) % 3 === 1 ? 'neutra' : 'sorpresa') : boca;
  // desplazamientos por profundidad (px a giro = 1)
  const dx = {cara: 18, ojos: 40, nariz: 62, boca: 42, orejaCerca: -130, pelo: -22, cuerpo: 16, cuello: 8};
  const rxCabeza = 140 * (1 - 0.05 * ag);

  const ojo = (lado: number) => {
    // el ojo del lado hacia el que gira queda más lejos y se estrecha
    const lejos = Math.sign(g) === lado ? ag : 0;
    const cx = lado * 56 * (1 - 0.25 * lejos) + g * dx.ojos;
    const cy = -296;
    const sx = 1 - 0.45 * lejos;
    if (esRobot) {
      return (
        <g key={lado} transform={`translate(${cx} ${cy}) scale(${sx} 1)`}>
          <rect x={-34} y={-22} width={68} height={44} rx={14} fill="#0b1424" />
          <rect x={-26} y={-14 * ap} width={52} height={28 * ap} rx={10} fill={D.colorRopa2} />
          <rect x={-26} y={-14 * ap} width={52} height={28 * ap} rx={10} fill={D.colorRopa2} opacity={0.4} filter={`url(#${k('glow')})`} />
        </g>
      );
    }
    return (
      <g key={lado} transform={`translate(${cx} ${cy}) scale(${sx} 1)`}>
        <ellipse rx={30} ry={32 * ap} fill="#fff" />
        {ap > 0.2 && (
          <>
            <circle cx={mirada * 10 + g * 6} cy={2} r={16} fill={D.iris ?? '#4a2e1c'} />
            <circle cx={mirada * 10 + g * 6} cy={2} r={8} fill="#120b0a" />
            <circle cx={mirada * 10 + g * 6 + 6} cy={-5} r={5} fill="#fff" />
          </>
        )}
        <path d={`M -32 ${-24 * ap + 6} Q 0 ${-36 * ap} 32 ${-24 * ap + 6}`} stroke={peloS} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    );
  };

  const bocaSvg = () => {
    const x = g * dx.boca;
    const y = -192;
    const st = {stroke: '#5a2626', strokeWidth: 8, fill: 'none', strokeLinecap: 'round' as const};
    if (esRobot) return <rect x={x - 40} y={y - 8} width={80} height={16} rx={8} fill="#0b1424" stroke={D.colorRopa2} strokeWidth={4} />;
    switch (bocaReal) {
      case 'sonrisa':
        return (
          <g>
            <path d={`M ${x - 44} ${y - 8} Q ${x} ${y + 34} ${x + 44} ${y - 8} Z`} fill="#6a2a2a" />
            <path d={`M ${x - 34} ${y} Q ${x} ${y + 8} ${x + 34} ${y}`} fill="#fff" />
          </g>
        );
      case 'abierta':
        return <ellipse cx={x} cy={y + 4} rx={24} ry={20} fill="#5a2020" />;
      case 'sorpresa':
        return <ellipse cx={x} cy={y + 6} rx={18} ry={26} fill="#5a2020" />;
      case 'seria':
        return <path d={`M ${x - 30} ${y + 6} Q ${x} ${y - 6} ${x + 30} ${y + 6}`} {...st} />;
      default:
        return <path d={`M ${x - 30} ${y} Q ${x} ${y + 10} ${x + 30} ${y}`} {...st} />;
    }
  };

  // ---------- cuerpo
  const cuerpo = () => {
    const bx = g * dx.cuerpo;
    const torso = `M ${-290 + bx} 270 C ${-290 + bx} 40 ${-240 + bx} -110 ${-115 + bx} -140 L ${115 + bx} -140 C ${240 + bx} -110 ${290 + bx} 40 ${290 + bx} 270 Z`;
    const ropa = D.ropa;
    return (
      <g transform={`translate(0 ${respira * 0.5})`}>
        {D.mochila && <rect x={-250 - g * 40} y={-120} width={500} height={330} rx={60} fill="#5a3a20" />}
        <path d={torso} fill={`url(#${k('ropa')})`} />
        {/* sombra lateral para volumen */}
        <path d={torso} fill={`url(#${k('volumen')})`} />
        {ropa === 'bata' && (
          <g>
            <path d={`M ${-60 + bx} -130 L ${bx} 40 L ${60 + bx} -130 Z`} fill={D.colorRopa2} />
            <path d={`M ${-115 + bx} -140 L ${-30 + bx} 270 M ${115 + bx} -140 L ${30 + bx} 270`} stroke={ropaS} strokeWidth={8} />
            <rect x={140 + bx} y={20} width={70} height={60} rx={8} fill={ropaS} opacity={0.5} />
            <rect x={160 + bx} y={0} width={10} height={40} fill="#3a6ad6" />
          </g>
        )}
        {ropa === 'espacial' && (
          <g>
            <rect x={-110 + bx} y={-10} width={220} height={140} rx={24} fill="#cfd6e2" stroke={ropaS} strokeWidth={6} />
            <circle cx={-50 + bx} cy={60} r={16} fill="#ff4f6e" />
            <circle cx={0 + bx} cy={60} r={16} fill="#5dff9c" />
            <circle cx={50 + bx} cy={60} r={16} fill="#3fc3ff" opacity={0.6 + osc(f, 20, 0.4)} />
            <rect x={-300 + bx} y={60} width={600} height={30} fill={D.colorRopa2} opacity={0.9} />
            <path d={`M ${-170 + bx} -150 C ${-170 + bx} -200 ${170 + bx} -200 ${170 + bx} -150 L ${150 + bx} -110 L ${-150 + bx} -110 Z`} fill="#cfd6e2" />
          </g>
        )}
        {ropa === 'delantal' && (
          <g>
            <path d={`M ${-150 + bx} -60 L ${150 + bx} -60 L ${190 + bx} 270 L ${-190 + bx} 270 Z`} fill="#fff" stroke="#e8e8ee" strokeWidth={6} />
            <path d={`M ${-115 + bx} -140 L ${-150 + bx} -60 M ${115 + bx} -140 L ${150 + bx} -60`} stroke="#fff" strokeWidth={22} />
            <rect x={-60 + bx} y={60} width={120} height={70} rx={12} fill="#f2f2f6" stroke="#ddd" strokeWidth={4} />
            <path d={`M ${-40 + bx} -130 L ${bx} -80 L ${40 + bx} -130`} fill={D.colorRopa2} />
          </g>
        )}
        {ropa === 'explorador' && (
          <g>
            <path d={`M ${-150 + bx} -130 L ${-90 + bx} 270 M ${150 + bx} -130 L ${90 + bx} 270`} stroke={D.colorRopa2} strokeWidth={30} />
            <rect x={-200 + bx} y={30} width={80} height={70} rx={10} fill={ropaS} />
            <rect x={120 + bx} y={30} width={80} height={70} rx={10} fill={ropaS} />
            <path d={`M ${-50 + bx} -140 L ${bx} -90 L ${50 + bx} -140`} fill="#e8d6a8" />
          </g>
        )}
        {ropa === 'chaleco' && (
          <g>
            <path d={`M ${-60 + bx} -140 L ${bx} 270 L ${60 + bx} -140 Z`} fill={D.colorRopa2} />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={-30 + bx + i * 0} cy={0 + i * 70} r={10} fill={ropaL} />
            ))}
          </g>
        )}
        {ropa === 'camiseta' && (
          <g>
            <circle cx={bx} cy={60} r={70} fill={D.colorRopa2} />
            <path d={`M ${bx - 30} 60 l 20 20 l 40 -40`} stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" />
          </g>
        )}
        {ropa === 'metal' && (
          <g>
            {[-1, 1].map((s) => (
              <circle key={s} cx={s * 200 + bx} cy={-60} r={40} fill={ropaS} stroke={ropaL} strokeWidth={6} />
            ))}
            <rect x={-90 + bx} y={-40} width={180} height={150} rx={20} fill="#1a2234" />
            <circle cx={bx} cy={35} r={40} fill={D.colorRopa2} opacity={0.5 + osc(f, 30, 0.35)} />
            <circle cx={bx} cy={35} r={20} fill="#fff" opacity={0.8} />
          </g>
        )}
        {ropa === 'sudadera' && <path d={`M ${-45 + bx} -112 L ${-48 + bx} 20 M ${45 + bx} -112 L ${48 + bx} 15`} stroke="#fff" strokeWidth={9} />}
        {D.estetoscopio && (
          <g fill="none" stroke="#2a2a3a" strokeWidth={9} strokeLinecap="round">
            <path d={`M ${-90 + bx} -135 Q ${-120 + bx} 40 ${-30 + bx} 90 M ${90 + bx} -135 Q ${120 + bx} 40 ${30 + bx} 90`} />
            <circle cx={bx} cy={110} r={22} fill="#9aaab8" />
          </g>
        )}
        {D.pajarita && (
          <g transform={`translate(${bx} -130)`}>
            <path d="M 0 0 L -40 -22 L -40 22 Z M 0 0 L 40 -22 L 40 22 Z" fill="#d63a4a" />
            <circle r={10} fill="#a8283a" />
          </g>
        )}
        {/* luz de contorno */}
        <path d={torso} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={6} />
      </g>
    );
  };

  // ---------- pelo / tocado
  const peloTrasero = () => {
    const px = g * dx.pelo;
    switch (D.peinado) {
      case 'coleta':
        return <path d={`M ${px + 120 - g * 60} -360 C ${px + 230 - g * 80} -330 ${px + 230 - g * 80} -180 ${px + 170 - g * 80} -120 C ${px + 200 - g * 80} -220 ${px + 170} -300 ${px + 110} -330 Z`} fill={D.pelo} />;
      case 'coletas':
        return (
          <g>
            {[-1, 1].map((s) => (
              <g key={s}>
                <ellipse cx={s * 175 + px} cy={-260 + osc(f, 40, 5, s)} rx={60} ry={90} fill={D.pelo} transform={`rotate(${s * 18} ${s * 175 + px} -300)`} />
                <circle cx={s * 150 + px} cy={-340} r={20} fill="#ff5f9e" />
              </g>
            ))}
          </g>
        );
      case 'casco':
        return null;
      case 'robot':
        return null;
      default:
        return D.peinado === 'calvo' ? null : <ellipse cx={px} cy={-330} rx={160} ry={150} fill={peloS} />;
    }
  };

  const peloDelantero = () => {
    const px = g * (dx.cara + 6);
    switch (D.peinado) {
      case 'corto':
        return <path d={`M ${-152 + px} -300 C ${-150 + px} -530 ${150 + px} -530 ${152 + px} -300 C ${120 + px} -390 ${-40 + px} -400 ${-152 + px} -300 Z`} fill={D.pelo} />;
      case 'coleta':
      case 'coletas':
      case 'mono':
        return (
          <g>
            <path d={`M ${-152 + px} -300 C ${-152 + px} -530 ${152 + px} -530 ${152 + px} -300 C ${100 + px} -400 ${20 + px} -380 ${-10 + px} -350 C ${-60 + px} -390 ${-120 + px} -380 ${-152 + px} -300 Z`} fill={D.pelo} />
            {D.peinado === 'mono' && <circle cx={px} cy={-460} r={60} fill={D.pelo} />}
          </g>
        );
      case 'calvo':
        return (
          <g>
            <ellipse cx={-145 + px * 0.5} cy={-300} rx={30} ry={60} fill={D.pelo} />
            <ellipse cx={145 + px * 0.5} cy={-300} rx={30} ry={60} fill={D.pelo} />
            <ellipse cx={-40 + px} cy={-410} rx={50} ry={16} fill="#fff" opacity={0.35} />
          </g>
        );
      case 'gorroChef':
        return (
          <g>
            <rect x={-130 + px} y={-450} width={260} height={70} rx={10} fill="#fff" />
            {[-80, 0, 80].map((x, i) => (
              <circle key={i} cx={x + px} cy={-500 - (i === 1 ? 30 : 0)} r={80} fill="#fff" />
            ))}
            <rect x={-130 + px} y={-450} width={260} height={70} rx={10} fill="#000" opacity={0.05} />
          </g>
        );
      case 'sombrero':
        return (
          <g>
            <ellipse cx={px} cy={-400} rx={250} ry={50} fill="#8a6a3a" />
            <path d={`M ${-130 + px} -400 C ${-130 + px} -520 ${130 + px} -520 ${130 + px} -400 Z`} fill="#a8824a" />
            <rect x={-130 + px} y={-430} width={260} height={30} fill="#5a3a20" />
          </g>
        );
      case 'casco':
        return (
          <g>
            <circle cx={px * 0.4} cy={-300} r={215} fill="#e8edf5" opacity={0.35} stroke="#eef1f6" strokeWidth={18} />
            <path d={`M ${-150 + px} -420 Q ${px} -500 ${150 + px} -420`} stroke="#fff" strokeWidth={16} fill="none" opacity={0.6} strokeLinecap="round" />
            <ellipse cx={-90 + px} cy={-400} rx={40} ry={18} fill="#fff" opacity={0.6} transform={`rotate(-30 ${-90 + px} -400)`} />
          </g>
        );
      case 'robot':
        return (
          <g>
            <line x1={px} y1={-450} x2={px} y2={-530} stroke={peloS} strokeWidth={10} />
            <circle cx={px} cy={-540} r={18} fill={D.colorRopa2} opacity={0.6 + osc(f, 15, 0.4)} />
          </g>
        );
      default:
        return null;
    }
  };

  const cx = g * dx.cara;
  const orejaVisible = (lado: number) => !(Math.sign(g) === lado && ag > 0.55);
  return (
    <g>
      <defs>
        <radialGradient id={k('cabeza')} cx={`${38 - g * 12}%`} cy="32%" r="75%">
          <stop offset="0%" stopColor={esRobot ? ajustar(D.piel, 0.35) : pielL} />
          <stop offset="70%" stopColor={D.piel} />
          <stop offset="100%" stopColor={esRobot ? ajustar(D.piel, -0.35) : pielS} />
        </radialGradient>
        <linearGradient id={k('ropa')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ropaL} />
          <stop offset="100%" stopColor={ropaS} />
        </linearGradient>
        <linearGradient id={k('volumen')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity={0.05 + Math.max(0, g) * 0.15} />
          <stop offset="45%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.28 - Math.max(0, g) * 0.15} />
        </linearGradient>
        <filter id={k('glow')}>
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {/* sombra de contacto */}
      <ellipse cx={0} cy={285} rx={300} ry={30} fill="#000" opacity={0.25} />
      {cuerpo()}
      {/* cuello con sombra bajo la barbilla */}
      <rect x={-42 + g * dx.cuello} y={-175} width={84} height={70} rx={20} fill={esRobot ? ajustar(D.piel, -0.3) : pielS} />
      <g transform={`translate(0 ${respira * 0.3})`}>
        {peloTrasero()}
        {/* orejas (la cercana se oculta al girar) */}
        {[-1, 1].map((lado) =>
          orejaVisible(lado) ? (
            <ellipse key={lado} cx={lado * 145 * (1 - 0.1 * ag) + g * (lado === -Math.sign(g) ? 26 : dx.orejaCerca * 0.1)} cy={-290} rx={22} ry={36} fill={esRobot ? ajustar(D.piel, -0.2) : pielS} />
          ) : null,
        )}
        {/* cabeza con volumen */}
        {esRobot ? (
          <rect x={-rxCabeza + cx * 0.4} y={-450} width={rxCabeza * 2} height={300} rx={60} fill={`url(#${k('cabeza')})`} stroke={ajustar(D.piel, -0.35)} strokeWidth={6} />
        ) : (
          <ellipse cx={cx * 0.4} cy={-290} rx={rxCabeza} ry={158} fill={`url(#${k('cabeza')})`} />
        )}
        {/* mejillas y pecas */}
        {!esRobot && (
          <g opacity={0.35}>
            <ellipse cx={-85 + g * 34} cy={-228} rx={24} ry={13} fill="#ff7a7a" />
            <ellipse cx={85 + g * 34} cy={-228} rx={24} ry={13} fill="#ff7a7a" />
          </g>
        )}
        {D.pecas &&
          [-1, 1].map((s) =>
            [0, 1, 2].map((i) => <circle key={`${s}${i}`} cx={s * (70 + i * 14) + g * 34} cy={-238 + (i % 2) * 10} r={4} fill="#b8643a" opacity={0.7} />),
          )}
        {ojo(-1)}
        {ojo(1)}
        {/* cejas */}
        {!esRobot &&
          [-1, 1].map((s) => {
            const lejos = Math.sign(g) === s ? ag : 0;
            const x0 = s * 22 + g * dx.ojos;
            const x1 = s * 90 * (1 - 0.25 * lejos) + g * dx.ojos;
            return <path key={`c${s}`} d={`M ${x0} ${-352 - cejas * 12} Q ${(x0 + x1) / 2} ${-366 - cejas * 4} ${x1} ${-350 + cejas * 6}`} stroke={D.peinado === 'calvo' ? '#c8c8d0' : peloS} strokeWidth={12} fill="none" strokeLinecap="round" />;
          })}
        {/* nariz (la parte más adelantada: la que más se desplaza) */}
        {!esRobot && <path d={`M ${g * dx.nariz - 4} -262 Q ${g * dx.nariz + (g >= 0 ? 16 : -16)} -236 ${g * dx.nariz} -226`} stroke={pielS} strokeWidth={8} fill="none" strokeLinecap="round" />}
        {D.bigote && <path d={`M ${g * dx.boca - 60} -205 Q ${g * dx.boca - 30} -230 ${g * dx.boca} -212 Q ${g * dx.boca + 30} -230 ${g * dx.boca + 60} -205 Q ${g * dx.boca} -200 ${g * dx.boca - 60} -205 Z`} fill={D.pelo} />}
        {bocaSvg()}
        {D.gafas && (
          <g fill="rgba(200,230,255,0.15)" stroke="#2a2030" strokeWidth={7}>
            {[-1, 1].map((s) => {
              const lejos = Math.sign(g) === s ? ag : 0;
              const x = s * 56 * (1 - 0.25 * lejos) + g * dx.ojos;
              return <circle key={s} cx={x} cy={-296} r={44} transform={`translate(${x} 0) scale(${1 - 0.4 * lejos} 1) translate(${-x} 0)`} />;
            })}
            <path d={`M ${-14 + g * dx.ojos} -300 L ${14 + g * dx.ojos} -300`} />
          </g>
        )}
        {peloDelantero()}
      </g>
    </g>
  );
};
