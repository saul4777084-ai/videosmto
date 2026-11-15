import React, {useId} from 'react';
import {useCurrentFrame} from 'remotion';
import {osc, rnd} from '../../lib/anim';

/* Todos los objetos se dibujan centrados en (0,0) a un tamaño de ~200 px. */

export const Vaso: React.FC<{nivel?: number}> = ({nivel = 0.6}) => {
  const f = useCurrentFrame();
  const top = 70 - nivel * 140;
  return (
    <g>
      <path d="M -80 -90 L 80 -90 L 62 90 Q 60 105 45 105 L -45 105 Q -60 105 -62 90 Z" fill="rgba(220,240,255,0.18)" stroke="#e8f6ff" strokeWidth={6} />
      <path d={`M ${-76 + (1 - nivel) * 4} ${top} L ${76 - (1 - nivel) * 4} ${top} L 62 90 Q 60 102 45 102 L -45 102 Q -60 102 -62 90 Z`} fill="#e39a2f" opacity={0.85} />
      <ellipse cx={0} cy={top} rx={74} ry={8 + osc(f, 30, 2)} fill="#f6c45e" opacity={0.9} />
      {[[-30, 20], [20, 40], [-5, 60]].map(([x, y], i) => (
        <rect key={i} x={x - 18} y={y + top - 40 + osc(f, 40 + i * 9, 3)} width={36} height={32} rx={6} fill="rgba(255,255,255,0.55)" transform={`rotate(${15 * i - 10} ${x} ${y + top - 24})`} />
      ))}
      <path d="M -60 -70 L -48 80" stroke="#fff" strokeWidth={8} opacity={0.35} strokeLinecap="round" />
    </g>
  );
};

export const Taza: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const t = ((f + i * 20) % 60) / 60;
        return (
          <path
            key={i}
            d={`M ${-30 + i * 30} -80 q 18 -30 0 -60 q -18 -30 0 -60`}
            transform={`translate(0 ${-t * 40})`}
            stroke="#fff"
            strokeWidth={8}
            fill="none"
            opacity={(1 - t) * 0.5}
            strokeLinecap="round"
          />
        );
      })}
      <path d="M 80 -40 C 150 -40 150 50 75 50" stroke="#e9e2f5" strokeWidth={20} fill="none" />
      <path d="M -90 -70 L 90 -70 L 75 80 Q 70 100 50 100 L -50 100 Q -70 100 -75 80 Z" fill="#f2ecfa" />
      <ellipse cx={0} cy={-70} rx={90} ry={16} fill="#5a3420" />
      <text x={0} y={30} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={44} fill="#3f5aa6">
        x5
      </text>
    </g>
  );
};

export const Escudo: React.FC<{grieta?: number}> = ({grieta = 0}) => (
  <g>
    <path d="M 0 -120 L 100 -85 Q 100 40 0 120 Q -100 40 -100 -85 Z" fill="#3fc3ff" stroke="#d8f4ff" strokeWidth={8} />
    <path d="M 0 -95 L 78 -68 Q 76 30 0 92 Z" fill="#7ad8ff" opacity={0.6} />
    <path d="M -14 -50 h 28 v 36 h 36 v 28 h -36 v 36 h -28 v -36 h -36 v -28 h 36 Z" fill="#fff" opacity={1 - grieta * 0.6} />
    {grieta > 0.05 && (
      <path
        d="M 5 -118 L -12 -60 L 18 -20 L -20 30 L 10 70 L -4 118"
        stroke="#0b1a2a"
        strokeWidth={9}
        fill="none"
        strokeDasharray={400}
        strokeDashoffset={400 * (1 - Math.min(1, grieta))}
        strokeLinejoin="round"
      />
    )}
    {grieta > 0.5 && <path d="M 18 -20 L 60 -40 M -20 30 L -70 20" stroke="#0b1a2a" strokeWidth={7} strokeDasharray={120} strokeDashoffset={120 * (1 - (grieta - 0.5) * 2)} />}
  </g>
);

export const Virus: React.FC<{r?: number; color?: string}> = ({r = 50, color = '#7be36a'}) => {
  const f = useCurrentFrame();
  return (
    <g transform={`rotate(${f * 2})`}>
      {new Array(10).fill(0).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <g key={i}>
            <line x1={0} y1={0} x2={Math.cos(a) * r * 1.45} y2={Math.sin(a) * r * 1.45} stroke={color} strokeWidth={r * 0.14} />
            <circle cx={Math.cos(a) * r * 1.5} cy={Math.sin(a) * r * 1.5} r={r * 0.18} fill={color} />
          </g>
        );
      })}
      <circle r={r} fill={color} />
      <circle cx={-r * 0.3} cy={-r * 0.2} r={r * 0.22} fill="#3d9a34" />
      <circle cx={r * 0.35} cy={r * 0.25} r={r * 0.16} fill="#3d9a34" />
    </g>
  );
};

export const Donut: React.FC = () => (
  <g>
    <ellipse cx={0} cy={14} rx={100} ry={70} fill="#c98a4b" />
    <ellipse cx={0} cy={0} rx={100} ry={70} fill="#e0a663" />
    <path d="M -92 -6 C -90 -60 90 -60 92 -6 C 80 30 60 10 40 34 C 20 50 -10 30 -30 40 C -60 50 -80 20 -92 -6 Z" fill="#ff6fb0" />
    <ellipse cx={0} cy={-4} rx={34} ry={22} fill="#7a4a2a" />
    {[[-55, -20, 20], [40, -30, -30], [60, 0, 60], [-20, -40, 10], [-60, 10, -40], [20, 20, 80]].map(([x, y, a], i) => (
      <rect key={i} x={x - 9} y={y - 3} width={18} height={6} rx={3} fill={['#fff', '#ffd84a', '#5dd8ff'][i % 3]} transform={`rotate(${a} ${x} ${y})`} />
    ))}
  </g>
);

export const Hamburguesa: React.FC = () => (
  <g>
    <path d="M -110 -10 C -110 -100 110 -100 110 -10 Z" fill="#e8a24f" />
    {[[-50, -55], [-10, -70], [30, -58], [60, -40], [-75, -35]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={7} ry={4} fill="#fff3d6" />
    ))}
    <path d="M -118 0 L 118 0 L 100 20 L 80 6 L 60 22 L 40 6 L 20 22 L 0 6 L -20 22 L -40 6 L -60 22 L -80 6 L -100 20 Z" fill="#7fd46a" />
    <rect x={-112} y={14} width={224} height={34} rx={14} fill="#7a3d22" />
    <path d="M -112 46 L 112 46 L 95 62 L 80 48 L 50 66 L 20 48 L -10 64 L -40 48 L -70 64 L -100 48 Z" fill="#ffd84a" />
    <path d="M -108 60 L 108 60 Q 108 100 70 100 L -70 100 Q -108 100 -108 60 Z" fill="#e8a24f" />
  </g>
);

export const Patatas: React.FC = () => (
  <g>
    {[-60, -35, -10, 15, 40, 62].map((x, i) => (
      <rect key={i} x={x - 11} y={-110 - (i % 3) * 18} width={22} height={120} rx={5} fill="#ffd24a" transform={`rotate(${(i - 2.5) * 6} ${x} 0)`} />
    ))}
    <path d="M -85 -30 L 85 -30 L 68 110 L -68 110 Z" fill="#e8343c" />
    <path d="M -85 -30 Q 0 10 85 -30" fill="#c42530" />
    <path d="M -20 30 l 20 -26 l 20 26 l -10 0 l 0 30 l -20 0 l 0 -30 Z" fill="#ffd84a" />
  </g>
);

export const Refresco: React.FC = () => (
  <g>
    <rect x={-8} y={-160} width={16} height={80} rx={4} fill="#ff5fb0" transform="rotate(10 0 -80)" />
    <path d="M -70 -90 L 70 -90 L 56 110 L -56 110 Z" fill="#e8343c" />
    <rect x={-74} y={-104} width={148} height={20} rx={8} fill="#f6f6f6" />
    <path d="M -64 -10 Q 0 20 64 -10 L 60 40 Q 0 70 -60 40 Z" fill="#fff" opacity={0.9} />
    <text x={0} y={36} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={34} fill="#e8343c">
      COLA
    </text>
  </g>
);

export const Rayo: React.FC<{color?: string}> = ({color = '#ffd84a'}) => (
  <path d="M 20 -120 L -60 20 L -5 20 L -25 120 L 60 -20 L 5 -20 Z" fill={color} stroke="#fff6c2" strokeWidth={6} strokeLinejoin="round" />
);

export const Cerebro: React.FC<{brillo?: number; color?: string}> = ({brillo = 0, color = '#ff9ac2'}) => (
  <g>
    <circle r={150} fill="#ffd84a" opacity={0.25 * brillo} />
    <path
      d="M -10 -110 C -60 -130 -110 -100 -110 -60 C -150 -40 -140 20 -110 30 C -120 70 -80 100 -40 90 C -20 110 0 100 -10 80 Z"
      fill={color}
      stroke="#d85a8f"
      strokeWidth={7}
    />
    <path
      d="M 10 -110 C 60 -130 110 -100 110 -60 C 150 -40 140 20 110 30 C 120 70 80 100 40 90 C 20 110 0 100 10 80 Z"
      fill={color}
      stroke="#d85a8f"
      strokeWidth={7}
    />
    <path d="M -80 -60 Q -50 -40 -70 -10 M -60 40 Q -30 20 -40 60 M 80 -60 Q 50 -40 70 -10 M 60 40 Q 30 20 40 60" stroke="#d85a8f" strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);

/** Ojo flotante que parpadea (alucinaciones / paranoia). */
export const OjoFlotante: React.FC<{r?: number; semilla?: number; color?: string}> = ({r = 40, semilla = 1, color = '#ffe14a'}) => {
  const f = useCurrentFrame();
  const t = (f + semilla * 17) % 90;
  const ab = t < 4 ? 1 - t / 4 : t < 8 ? (t - 4) / 4 : 1;
  const mx = osc(f, 40 + semilla * 5, 0.5, semilla);
  return (
    <g>
      <ellipse rx={r} ry={r * 0.55 * Math.max(0.05, ab)} fill={color} />
      <circle cx={mx * r * 0.4} r={r * 0.3 * Math.max(0.05, ab)} fill="#120b0a" />
      <ellipse rx={r * 1.8} ry={r * 1.1} fill={color} opacity={0.08} />
    </g>
  );
};

/** Figura de sombra con ojos brillantes. */
export const Sombra: React.FC<{alto?: number; opacidad?: number}> = ({alto = 600, opacidad = 1}) => {
  const f = useCurrentFrame();
  const s = alto / 600;
  return (
    <g opacity={opacidad} transform={`scale(${s})`}>
      <path
        d={`M -120 300 C -140 100 -130 -40 -80 -110 C -110 -170 -90 -260 0 -270 C 90 -260 110 -170 80 -110 C 130 -40 140 100 120 300 Z`}
        fill="#05030c"
      />
      <path d={`M -120 300 C -150 260 ${-170 + osc(f, 30, 10)} 300 -180 300 Z M 120 300 C 150 260 ${170 + osc(f, 34, 10)} 300 180 300 Z`} fill="#05030c" />
      <ellipse cx={-32} cy={-185} rx={16} ry={9} fill="#ff3b4f" />
      <ellipse cx={32} cy={-185} rx={16} ry={9} fill="#ff3b4f" />
      <ellipse cx={0} cy={-185} rx={90} ry={40} fill="#ff3b4f" opacity={0.08} />
    </g>
  );
};

export const Interrogacion: React.FC<{color?: string}> = ({color = '#ffd84a'}) => (
  <text x={0} y={40} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={140} fill={color} stroke="#2a1840" strokeWidth={6} paintOrder="stroke">
    ?
  </text>
);

export const PiezaPuzzle: React.FC<{color?: string}> = ({color = '#5dd8ff'}) => (
  <path
    d="M -40 -40 L -10 -40 C -14 -60 14 -60 10 -40 L 40 -40 L 40 -10 C 60 -14 60 14 40 10 L 40 40 L -40 40 Z"
    fill={color}
    stroke="#fff"
    strokeWidth={5}
  />
);

/** Bocadillo con letras revueltas. */
export const Bocadillo: React.FC<{texto: string; revuelto: number}> = ({texto, revuelto}) => {
  const f = useCurrentFrame();
  const letras = texto.split('');
  return (
    <g>
      <path d="M -230 -90 Q -230 -130 -190 -130 L 190 -130 Q 230 -130 230 -90 L 230 40 Q 230 80 190 80 L -40 80 L -90 140 L -80 80 L -190 80 Q -230 80 -230 40 Z" fill="#fff" stroke="#2a1840" strokeWidth={8} />
      {letras.map((ch, i) => {
        const dx = (rnd(`bx${i}${Math.floor(f / 4)}`) - 0.5) * 60 * revuelto;
        const dy = (rnd(`by${i}${Math.floor(f / 4)}`) - 0.5) * 50 * revuelto;
        const rot = (rnd(`br${i}${Math.floor(f / 4)}`) - 0.5) * 80 * revuelto;
        const x = -((letras.length - 1) * 30) / 2 + i * 30;
        return (
          <text key={i} x={x + dx} y={-5 + dy} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={52} fill="#2a1840" transform={`rotate(${rot} ${x + dx} ${-25 + dy})`}>
            {ch}
          </text>
        );
      })}
    </g>
  );
};

/** Hoja de calendario. */
export const Calendario: React.FC<{dia: number | string; mes?: string; color?: string}> = ({dia, mes = 'DÍA', color = '#e8343c'}) => (
  <g>
    <rect x={-110} y={-120} width={220} height={240} rx={22} fill="#fff" stroke="#2a1840" strokeWidth={6} />
    <path d="M -110 -98 Q -110 -120 -88 -120 L 88 -120 Q 110 -120 110 -98 L 110 -50 L -110 -50 Z" fill={color} />
    <text x={0} y={-68} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={34} fill="#fff" letterSpacing={4}>
      {mes}
    </text>
    <text x={0} y={70} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={120} fill="#2a1840">
      {dia}
    </text>
    {[-60, 60].map((x) => (
      <rect key={x} x={x - 8} y={-140} width={16} height={40} rx={8} fill="#8a8aa8" />
    ))}
  </g>
);

export const Luna: React.FC<{r?: number; color?: string}> = ({r = 80, color = '#fff4d6'}) => {
  const id = 'lu' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <g>
      <circle r={r * 1.6} fill={color} opacity={0.1} />
      <mask id={id}>
        <rect x={-r * 2} y={-r * 2} width={r * 4} height={r * 4} fill="#fff" />
        <circle cx={r * 0.45} cy={-r * 0.25} r={r * 0.85} fill="#000" />
      </mask>
      <circle r={r} fill={color} mask={`url(#${id})`} />
    </g>
  );
};

/** Silueta genérica para la "foto" del periódico (no representa a ninguna persona real). */
export const SiluetaFoto: React.FC = () => (
  <g>
    <circle cx={0} cy={-70} r={70} fill="#4a3a28" />
    <path d="M -150 160 C -150 30 -90 0 0 0 C 90 0 150 30 150 160 Z" fill="#4a3a28" />
  </g>
);
