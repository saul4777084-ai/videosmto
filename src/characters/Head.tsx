import React from 'react';
import {PERSONAJES, Quien} from './palette';

export type Expresion = 'feliz' | 'risa' | 'dormido' | 'neutral' | 'cansado';

/**
 * Cabeza de frente con expresiones. Centro en (0,0), radio r.
 * eyes: apertura 0..1 (parpadeo). look: dirección de la mirada -1..1.
 */
export const Head: React.FC<{
  who: Quien;
  r: number;
  expr?: Expresion;
  eyes?: number;
  look?: number;
  mouth?: number; // 0..1 apertura extra
  backHair?: boolean;
}> = ({who, r, expr = 'feliz', eyes = 1, look = 0, mouth = 0, backHair = true}) => {
  const P = PERSONAJES[who];
  const closed = expr === 'dormido' || expr === 'risa' || eyes < 0.18;
  const eyeY = r * 0.08;
  const ex = r * 0.36;
  const eyeOpen = Math.max(0.18, eyes) * (expr === 'cansado' ? 0.6 : 1);
  const mouthOpen = expr === 'risa' ? 0.8 : mouth;
  const eyeEls = [-1, 1].map((side) => {
    const cx = side * ex;
    if (closed) {
      const d =
        expr === 'dormido'
          ? `M ${cx - r * 0.15} ${eyeY} Q ${cx} ${eyeY + r * 0.12} ${cx + r * 0.15} ${eyeY}`
          : `M ${cx - r * 0.15} ${eyeY + r * 0.04} Q ${cx} ${eyeY - r * 0.12} ${cx + r * 0.15} ${eyeY + r * 0.04}`;
      return <path key={side} d={d} stroke="#2b1a20" strokeWidth={r * 0.06} fill="none" strokeLinecap="round" />;
    }
    return (
      <g key={side}>
        <ellipse cx={cx} cy={eyeY} rx={r * 0.16} ry={r * 0.2 * eyeOpen} fill="#fff" />
        <ellipse cx={cx + look * r * 0.06} cy={eyeY + r * 0.02} rx={r * 0.11} ry={r * 0.13 * eyeOpen} fill="#2b1a20" />
        <circle cx={cx + look * r * 0.06 + r * 0.04} cy={eyeY - r * 0.04 * eyeOpen} r={r * 0.04} fill="#fff" />
      </g>
    );
  });
  return (
    <g>
      {who === 'ella' && backHair && (
        <path
          d={`M ${-r * 1.15} ${r * 0.2} C ${-r * 1.4} ${-r * 1.2} ${r * 1.4} ${-r * 1.2} ${r * 1.15} ${r * 0.2} C ${r * 1.35} ${r * 0.9} ${r * 1.1} ${r * 1.25} ${r * 0.7} ${r * 1.15} L ${-r * 0.7} ${r * 1.15} C ${-r * 1.1} ${r * 1.25} ${-r * 1.35} ${r * 0.9} ${-r * 1.15} ${r * 0.2} Z`}
          fill={P.pelo}
        />
      )}
      {/* orejas */}
      <circle cx={-r * 0.97} cy={r * 0.1} r={r * 0.18} fill={P.pielSombra} />
      <circle cx={r * 0.97} cy={r * 0.1} r={r * 0.18} fill={P.pielSombra} />
      <circle r={r} fill={P.piel} />
      <ellipse cx={0} cy={r * 0.55} rx={r * 0.75} ry={r * 0.38} fill={P.pielSombra} opacity={0.25} />
      {/* pelo */}
      {who === 'el' ? (
        <path
          d={`M ${-r * 1.02} ${r * 0.0} C ${-r * 1.08} ${-r * 1.2} ${r * 1.08} ${-r * 1.25} ${r * 1.02} ${r * 0.0} C ${r * 0.9} ${-r * 0.45} ${r * 0.55} ${-r * 0.5} ${r * 0.25} ${-r * 0.55} C ${r * 0.1} ${-r * 0.42} ${-r * 0.2} ${-r * 0.4} ${-r * 0.35} ${-r * 0.5} C ${-r * 0.65} ${-r * 0.45} ${-r * 0.92} ${-r * 0.35} ${-r * 1.02} ${r * 0.0} Z`}
          fill={P.pelo}
        />
      ) : (
        <>
          <path
            d={`M ${-r * 1.06} ${r * 0.25} C ${-r * 1.2} ${-r * 1.25} ${r * 1.2} ${-r * 1.25} ${r * 1.06} ${r * 0.25} C ${r * 0.9} ${-r * 0.3} ${r * 0.6} ${-r * 0.55} ${r * 0.05} ${-r * 0.5} C ${-r * 0.3} ${-r * 0.3} ${-r * 0.75} ${-r * 0.25} ${-r * 1.06} ${r * 0.25} Z`}
            fill={P.pelo}
          />
          <path d={`M ${-r * 0.5} ${-r * 0.78} Q ${-r * 0.1} ${-r * 0.95} ${r * 0.35} ${-r * 0.8}`} stroke={(P as any).peloBrillo} strokeWidth={r * 0.08} fill="none" strokeLinecap="round" opacity={0.8} />
        </>
      )}
      {who === 'el' && <path d={`M ${-r * 0.4} ${-r * 0.82} Q ${0} ${-r * 0.98} ${r * 0.4} ${-r * 0.82}`} stroke="#5a3e35" strokeWidth={r * 0.07} fill="none" strokeLinecap="round" />}
      {/* cejas */}
      {[-1, 1].map((side) => (
        <path
          key={side}
          d={`M ${side * ex - r * 0.14} ${eyeY - r * 0.3} Q ${side * ex} ${eyeY - r * (expr === 'cansado' ? 0.3 : 0.38)} ${side * ex + r * 0.14} ${eyeY - r * 0.3}`}
          stroke={P.pelo}
          strokeWidth={r * 0.07}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {eyeEls}
      {/* mejillas */}
      <ellipse cx={-r * 0.58} cy={r * 0.38} rx={r * 0.16} ry={r * 0.1} fill="#ff6f8e" opacity={0.5} />
      <ellipse cx={r * 0.58} cy={r * 0.38} rx={r * 0.16} ry={r * 0.1} fill="#ff6f8e" opacity={0.5} />
      {/* nariz */}
      <path d={`M ${-r * 0.06} ${r * 0.3} Q ${0} ${r * 0.36} ${r * 0.06} ${r * 0.3}`} stroke={P.pielSombra} strokeWidth={r * 0.05} fill="none" strokeLinecap="round" />
      {/* boca */}
      {mouthOpen > 0.05 ? (
        <g>
          <path
            d={`M ${-r * 0.24} ${r * 0.5} Q 0 ${r * (0.52 + 0.4 * mouthOpen)} ${r * 0.24} ${r * 0.5} Z`}
            fill="#7a2235"
            stroke="#4a1220"
            strokeWidth={r * 0.03}
          />
          <ellipse cx={0} cy={r * (0.5 + 0.22 * mouthOpen)} rx={r * 0.1} ry={r * 0.06 * mouthOpen} fill="#ff7d8f" />
        </g>
      ) : (
        <path
          d={expr === 'cansado' ? `M ${-r * 0.14} ${r * 0.58} Q 0 ${r * 0.52} ${r * 0.14} ${r * 0.58}` : `M ${-r * 0.22} ${r * 0.5} Q 0 ${r * 0.7} ${r * 0.22} ${r * 0.5}`}
          stroke="#4a1a26"
          strokeWidth={r * 0.06}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </g>
  );
};
