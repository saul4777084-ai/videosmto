import React from 'react';
import {useCurrentFrame} from 'remotion';
import {blink, osc} from '../../lib/anim';

export type Boca = 'neutra' | 'preocupada' | 'abierta' | 'sonrisa' | 'dormido' | 'bostezo' | 'nerviosa' | 'mordida';

export type InsomneProps = {
  /** 0 descansado · 1 destrozado (ojeras, rojez, párpados caídos, palidez, pelo revuelto). */
  cansancio?: number;
  /** Apertura máxima de los ojos 0..1 (0 = cerrados). */
  ojos?: number;
  /** Dirección de la mirada -1..1. */
  miradaX?: number;
  miradaY?: number;
  boca?: Boca;
  /** Cejas: -1 enfadado · 0 normal · 1 preocupado/asustado. */
  cejas?: number;
  sudor?: boolean;
  /** Giro de la cabeza (grados) y cabeceo de sueño (0..1). */
  giro?: number;
  cabeceo?: number;
  /** Pupilas dilatadas (alucinaciones / miedo). */
  pupilas?: number;
  parpadeo?: boolean;
  semilla?: number;
  /** Mostrar el cuerpo (sudadera). */
  cuerpo?: boolean;
  /** Paleta del personaje (para crear personajes distintos con el mismo dibujo). */
  colores?: Partial<ColoresPersonaje>;
  peinado?: 'corto' | 'largo' | 'rizado' | 'rapado';
  gafas?: boolean;
};

export type ColoresPersonaje = {piel: string; pielSombra: string; pelo: string; sudadera: string; sudaderaSombra: string; iris: string};

/** Personajes listos para usar: mismo dibujo, distinta identidad. */
export const PERSONAJES_INSOMNE: Record<string, {colores: Partial<ColoresPersonaje>; peinado: InsomneProps['peinado']; gafas?: boolean}> = {
  leo: {colores: {}, peinado: 'corto'},
  sara: {colores: {pelo: '#7a2f22', sudadera: '#d9487f', sudaderaSombra: '#a8305d', iris: '#3a6a3a'}, peinado: 'largo'},
  malik: {colores: {piel: '#8d5a3c', pielSombra: '#6e4128', pelo: '#140d0b', sudadera: '#2f9e6e', sudaderaSombra: '#1f7350'}, peinado: 'rizado'},
  yuki: {colores: {piel: '#f6d6b8', pielSombra: '#e0b48f', pelo: '#101018', sudadera: '#f0a030', sudaderaSombra: '#c47a14'}, peinado: 'largo', gafas: true},
  hugo: {colores: {piel: '#c98f66', pielSombra: '#a86e48', pelo: '#3a2a20', sudadera: '#6b4fc4', sudaderaSombra: '#4c3596'}, peinado: 'rapado', gafas: true},
  nora: {colores: {piel: '#5e3a28', pielSombra: '#45291b', pelo: '#e8c35a', sudadera: '#2a9fd6', sudaderaSombra: '#1d77a3', iris: '#2a1810'}, peinado: 'rizado'},
};

const mezcla = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

const BASE: ColoresPersonaje = {piel: '#f1c09a', pielSombra: '#d89a74', pelo: '#2b1d1a', sudadera: '#3f5aa6', sudaderaSombra: '#2d4180', iris: '#5a3a24'};
const PIEL_PALIDA = '#d6d2b8';

/**
 * PROTAGONISTA: joven en sudadera, dibujado de frente (busto).
 * Origen (0,0) = centro del pecho a la altura de las axilas. Cabeza en (0,-300), radio ~150.
 * Siempre es el mismo diseño: solo cambian expresión y signos de cansancio.
 */
export const Insomne: React.FC<InsomneProps> = ({
  cansancio = 0,
  ojos = 1,
  miradaX = 0,
  miradaY = 0,
  boca = 'neutra',
  cejas = 0,
  sudor = false,
  giro = 0,
  cabeceo = 0,
  pupilas = 0,
  parpadeo = true,
  semilla = 1,
  cuerpo = true,
  colores,
  peinado = 'corto',
  gafas = false,
}) => {
  const f = useCurrentFrame();
  const K = {...BASE, ...colores};
  const PELO = K.pelo;
  const SUDADERA = K.sudadera;
  const SUDADERA_SOMBRA = K.sudaderaSombra;
  const c = Math.max(0, Math.min(1, cansancio));
  const piel = mezcla(K.piel, PIEL_PALIDA, c * 0.75);
  const pielSombra = mezcla(K.pielSombra, '#b4ae94', c * 0.75);
  const bl = parpadeo ? blink(f, semilla) : 1;
  // párpado: con cansancio cae y tiembla
  const caida = c * 0.45 + osc(f, 9, 0.03 * c);
  const apertura = Math.max(0, Math.min(1, ojos * bl * (1 - caida)));
  const respira = osc(f, 70, 4);
  const cab = cabeceo * 18;
  const rojez = c;
  const ojX = 58;
  const ojY = -296;
  const pelos = new Array(11).fill(0).map((_, i) => {
    const a = -150 + i * 30;
    const caos = c * (((i * 37 + semilla * 13) % 23) - 11) * 1.6 + osc(f, 50 + i * 3, c * 3);
    return {a, caos};
  });
  return (
    <g>
      {cuerpo && (
        <g transform={`translate(0 ${respira * 0.5})`}>
          {/* capucha detrás del cuello */}
          <path d="M -170 -150 C -170 -230 170 -230 170 -150 L 150 -90 L -150 -90 Z" fill={SUDADERA_SOMBRA} />
          {/* torso */}
          <path d="M -300 260 C -300 40 -250 -110 -120 -140 L 120 -140 C 250 -110 300 40 300 260 Z" fill={SUDADERA} />
          <path d="M -120 -140 C -60 -90 60 -90 120 -140 C 90 -120 -90 -120 -120 -140 Z" fill={SUDADERA_SOMBRA} />
          {/* cordones */}
          <path d={`M -45 -112 Q -50 -40 ${-48 + osc(f, 60, 4)} 20`} stroke="#e8ecff" strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d={`M 45 -112 Q 50 -40 ${48 + osc(f, 64, 4, 1)} 15`} stroke="#e8ecff" strokeWidth={9} fill="none" strokeLinecap="round" />
          {/* bolsillo canguro */}
          <path d="M -150 170 L 150 170 L 120 90 L -120 90 Z" fill={SUDADERA_SOMBRA} opacity={0.6} />
          {/* logo luna */}
          <circle cx={150} cy={-20} r={26} fill="#ffd84a" opacity={0.9} />
          <circle cx={162} cy={-30} r={22} fill={SUDADERA} />
        </g>
      )}
      {/* cuello */}
      <rect x={-42} y={-175} width={84} height={70} rx={20} fill={pielSombra} />
      <g transform={`translate(0 ${-175 + cab * 0.6}) rotate(${giro + cabeceo * 6}) translate(0 175)`}>
        {/* pelo trasero */}
        {peinado === 'largo' && <path d="M -165 -330 C -200 -150 -190 -80 -150 -40 L 150 -40 C 190 -80 200 -150 165 -330 Z" fill={PELO} />}
        {peinado !== 'rapado' && <ellipse cx={0} cy={-330} rx={162} ry={150} fill={PELO} />}
        {/* orejas */}
        <ellipse cx={-146} cy={-290} rx={24} ry={36} fill={pielSombra} />
        <ellipse cx={146} cy={-290} rx={24} ry={36} fill={pielSombra} />
        {/* cara */}
        <ellipse cx={0} cy={-290} rx={140} ry={158} fill={piel} />
        {/* tono verdoso de agotamiento */}
        <ellipse cx={0} cy={-260} rx={130} ry={120} fill="#9fb58a" opacity={0.12 * c} />
        {/* peinado */}
        {peinado === 'corto' && (
          <>
            {pelos.map(({a, caos}, i) => (
              <path
                key={i}
                d={`M ${a - 22} -400 Q ${a + caos * 0.5} ${-470 - Math.abs(caos)} ${a + 26 + caos} ${-410 - Math.abs(caos) * 0.6} Z`}
                fill={PELO}
              />
            ))}
            <path d="M -150 -330 C -120 -440 120 -450 150 -330 C 110 -390 -40 -400 -150 -330 Z" fill={PELO} />
          </>
        )}
        {peinado === 'largo' && (
          <path d={`M -150 -300 C -150 -470 150 -470 150 -300 C 120 -380 ${-20 + c * 20} -400 ${-40 + osc(f, 60, 4 * c)} -330 C -70 -380 -130 -380 -150 -300 Z`} fill={PELO} />
        )}
        {peinado === 'rizado' &&
          new Array(13).fill(0).map((_, i) => {
            const a = Math.PI * (0.95 + (i / 12) * 1.1);
            return <circle key={i} cx={Math.cos(a) * 150} cy={-320 + Math.sin(a) * 135} r={44 + c * 6 + osc(f, 40 + i * 3, 2 * c)} fill={PELO} />;
          })}
        {peinado === 'rapado' && <path d="M -140 -330 C -120 -450 120 -450 140 -330 C 100 -400 -100 -400 -140 -330 Z" fill={PELO} opacity={0.85} />}
        {/* ojeras */}
        {[-1, 1].map((s) => (
          <g key={`oj${s}`} opacity={0.15 + 0.7 * c}>
            <path d={`M ${s * ojX - 44} ${ojY + 26} Q ${s * ojX} ${ojY + 70} ${s * ojX + 44} ${ojY + 26}`} stroke="#6b4a8a" strokeWidth={10 + 8 * c} fill="none" strokeLinecap="round" opacity={0.7} />
            <path d={`M ${s * ojX - 36} ${ojY + 44} Q ${s * ojX} ${ojY + 74} ${s * ojX + 36} ${ojY + 44}`} stroke="#4f3570" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.5 * c} />
          </g>
        ))}
        {/* ojos */}
        {[-1, 1].map((s) => {
          const cx = s * ojX;
          if (apertura < 0.08) {
            return <path key={s} d={`M ${cx - 32} ${ojY + 4} Q ${cx} ${ojY + 18} ${cx + 32} ${ojY + 4}`} stroke="#2b1a20" strokeWidth={7} fill="none" strokeLinecap="round" />;
          }
          const ry = 34 * apertura;
          const id = `ojo${semilla}${s}`;
          return (
            <g key={s}>
              <clipPath id={id}>
                <ellipse cx={cx} cy={ojY} rx={34} ry={ry} />
              </clipPath>
              <ellipse cx={cx} cy={ojY} rx={34} ry={ry} fill={mezcla('#ffffff', '#ffc9c2', rojez * 0.8)} />
              <g clipPath={`url(#${id})`}>
                {/* venitas rojas */}
                {rojez > 0.2 &&
                  [0, 1, 2].map((k) => (
                    <path
                      key={k}
                      d={`M ${cx + s * 34} ${ojY - 6 + k * 8} q ${-s * 10} ${-4 + k * 3} ${-s * 20} ${2 - k}`}
                      stroke="#d6283a"
                      strokeWidth={2}
                      fill="none"
                      opacity={rojez}
                    />
                  ))}
                <circle cx={cx + miradaX * 14} cy={ojY + miradaY * 10 + 2} r={17} fill={K.iris} />
                <circle cx={cx + miradaX * 14} cy={ojY + miradaY * 10 + 2} r={8 + 6 * pupilas} fill="#120b0a" />
                <circle cx={cx + miradaX * 14 + 6} cy={ojY + miradaY * 10 - 5} r={4.5} fill="#fff" />
              </g>
              {/* línea del párpado superior */}
              <path d={`M ${cx - 36} ${ojY - ry * 0.4} Q ${cx} ${ojY - ry - 6} ${cx + 36} ${ojY - ry * 0.4}`} stroke="#2b1a20" strokeWidth={6} fill="none" strokeLinecap="round" />
            </g>
          );
        })}
        {gafas && (
          <g fill="none" stroke="#1a1426" strokeWidth={8}>
            <rect x={-ojX - 50} y={ojY - 42} width={100} height={84} rx={26} fill="rgba(200,230,255,0.12)" />
            <rect x={ojX - 50} y={ojY - 42} width={100} height={84} rx={26} fill="rgba(200,230,255,0.12)" />
            <path d={`M -8 ${ojY - 6} Q 0 ${ojY - 16} 8 ${ojY - 6}`} />
          </g>
        )}
        {/* cejas */}
        {[-1, 1].map((s) => {
          const inner = s * 22;
          const outer = s * 92;
          const yIn = ojY - 58 - cejas * 12 + c * 4;
          const yOut = ojY - 62 + cejas * 8 + c * 8;
          return <path key={`c${s}`} d={`M ${inner} ${yIn} Q ${(inner + outer) / 2} ${Math.min(yIn, yOut) - 10} ${outer} ${yOut}`} stroke={PELO} strokeWidth={13} fill="none" strokeLinecap="round" />;
        })}
        {/* nariz */}
        <path d="M -8 -268 Q -18 -230 0 -222 Q 14 -222 18 -232" stroke={pielSombra} strokeWidth={7} fill="none" strokeLinecap="round" />
        {/* mejillas (desaparecen con el cansancio) */}
        <ellipse cx={-88} cy={-228} rx={26} ry={14} fill="#ff8a8a" opacity={0.35 * (1 - c)} />
        <ellipse cx={88} cy={-228} rx={26} ry={14} fill="#ff8a8a" opacity={0.35 * (1 - c)} />
        {/* boca */}
        <BocaSvg tipo={boca} f={f} />
        {/* sudor */}
        {sudor && (
          <g>
            {[0, 1].map((k) => {
              const ciclo = ((f + k * 25) % 50) / 50;
              return (
                <path
                  key={k}
                  d="M 0 0 C -10 14 -12 24 0 30 C 12 24 10 14 0 0 Z"
                  transform={`translate(${118 - k * 236 + k * 4} ${-370 + ciclo * 60}) scale(${1.1 - k * 0.2})`}
                  fill="#9fd8ff"
                  opacity={1 - ciclo}
                />
              );
            })}
          </g>
        )}
      </g>
    </g>
  );
};

const BocaSvg: React.FC<{tipo: Boca; f: number}> = ({tipo, f}) => {
  const y = -186;
  const st = {stroke: '#5a2a2a', strokeWidth: 8, fill: 'none', strokeLinecap: 'round' as const};
  switch (tipo) {
    case 'sonrisa':
      return <path d={`M -44 ${y - 6} Q 0 ${y + 30} 44 ${y - 6}`} {...st} />;
    case 'preocupada':
      return <path d={`M -38 ${y + 10} Q 0 ${y - 16} 38 ${y + 10}`} {...st} />;
    case 'abierta':
      return <ellipse cx={0} cy={y + 4} rx={26} ry={30} fill="#5a2a2a" />;
    case 'bostezo': {
      const a = 0.7 + 0.3 * Math.sin(f / 9);
      return (
        <g>
          <ellipse cx={0} cy={y + 6} rx={34} ry={46 * a} fill="#4a1f22" />
          <ellipse cx={0} cy={y + 30 * a} rx={20} ry={12 * a} fill="#e0707a" />
        </g>
      );
    }
    case 'dormido':
      return <path d={`M -24 ${y} Q 0 ${y + 12} 24 ${y}`} {...st} strokeWidth={6} />;
    case 'nerviosa': {
      const p = [-40, -26, -13, 0, 13, 26, 40].map((x, i) => `${i ? 'L' : 'M'} ${x} ${y + (i % 2 ? -7 : 7) + Math.sin(f / 2 + i) * 2}`).join(' ');
      return <path d={p} {...st} strokeWidth={7} />;
    }
    case 'mordida':
      return (
        <g>
          <rect x={-40} y={y - 14} width={80} height={30} rx={12} fill="#fff" stroke="#5a2a2a" strokeWidth={6} />
          <line x1={-40} y1={y + 1} x2={40} y2={y + 1} stroke="#5a2a2a" strokeWidth={4} />
        </g>
      );
    default:
      return <path d={`M -32 ${y} L 32 ${y}`} {...st} />;
  }
};
