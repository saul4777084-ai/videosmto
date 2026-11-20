import React from "react";

// Personajes planos para las historias de terror (dibujados en SVG, origen en los pies).
// Todos aceptan x, y (pies) y escala; altura aproximada a escala 1: 640 px.

type Base = { x: number; y: number; escala?: number; giro?: number };

// Ojos brillantes (blanco con halo)
export const OjosBrillantes: React.FC<{ x1: number; x2: number; y: number; r?: number; intensidad?: number }> = ({ x1, x2, y, r = 9, intensidad = 1 }) => (
  <g>
    <defs>
      <radialGradient id="haloOjo">
        <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
        <stop offset="0.35" stopColor="#f4fff6" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
    {[x1, x2].map((cx, i) => (
      <g key={i} opacity={intensidad}>
        <circle cx={cx} cy={y} r={r * 3.2} fill="url(#haloOjo)" opacity="0.8" />
        <circle cx={cx} cy={y} r={r} fill="#fff" />
      </g>
    ))}
  </g>
);

// El desconocido: alto, delgado, abrigo largo empapado, pelo mojado tapando la cara.
// pose "pie" | "andar" | "agachado"; paso: fase de la zancada (0..1) para "andar".
export const Desconocido: React.FC<Base & { pose?: "pie" | "andar" | "agachado"; paso?: number; ojos?: number; cabeza?: number }> = ({
  x,
  y,
  escala = 1,
  giro = 0,
  pose = "pie",
  paso = 0,
  ojos = 1,
  cabeza = 0,
}) => {
  const abrigo = "#1b1e23";
  const piel = "#c8cec6";
  const pelo = "#0c0d0f";
  if (pose === "agachado") {
    return (
      <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
        <ellipse cx="0" cy="0" rx="190" ry="26" fill="#000" opacity="0.35" />
        {/* cuerpo encogido abrazando las rodillas */}
        <path d="M-150 0 C-170 -140 -120 -260 -20 -290 C80 -300 150 -220 150 -110 L140 0 Z" fill={abrigo} />
        <path d="M-60 -40 C-70 -150 40 -190 110 -120 L120 -10 Z" fill="#23272d" />
        {/* manos huesudas sobre las rodillas */}
        <path d="M-40 -170 q30 -20 70 -5 l50 10 q12 4 4 14 l-40 0 l30 12 q8 8 -4 12 l-40 -6 q-50 0 -70 -37 Z" fill={piel} />
        <path d="M-70 -120 q30 -16 70 -2 l40 8 q10 6 0 12 l-50 2 q-40 4 -60 -20 Z" fill={piel} opacity="0.9" />
        {/* cabeza levantada mirando arriba, pelo mojado colgando */}
        <g transform={`translate(10 -330) rotate(${cabeza})`}>
          <ellipse cx="0" cy="0" rx="62" ry="78" fill={piel} />
          <path d="M-72 -10 C-80 -90 80 -100 72 -10 L80 130 L58 60 L40 140 L22 50 L-20 50 L-38 150 L-52 60 L-78 120 Z" fill={pelo} />
          <rect x="-34" y="-24" width="68" height="70" fill={piel} rx="24" />
          <OjosBrillantes x1={-22} x2={22} y={2} r={12} intensidad={ojos} />
          <path d="M-14 36 q14 6 28 0" stroke="#7d847c" strokeWidth="4" fill="none" />
        </g>
      </g>
    );
  }
  const a = pose === "andar" ? Math.sin(paso * Math.PI * 2) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
      <ellipse cx="0" cy="0" rx="110" ry="18" fill="#000" opacity="0.35" />
      {/* piernas */}
      <path d={`M-38 -300 L${-40 + a * 30} -8 L${-12 + a * 30} -8 L-8 -300 Z`} fill="#121418" />
      <path d={`M8 -300 L${12 - a * 30} -8 L${40 - a * 30} -8 L38 -300 Z`} fill="#121418" />
      <path d={`M${-50 + a * 30} 0 l42 0 l0 -12 l-38 0 Z`} fill="#050506" />
      <path d={`M${8 - a * 30} 0 l42 0 l0 -12 l-38 0 Z`} fill="#050506" />
      {/* abrigo largo */}
      <path d="M-70 -560 C-95 -500 -100 -300 -95 -180 L95 -180 C100 -300 95 -500 70 -560 C40 -575 -40 -575 -70 -560 Z" fill={abrigo} />
      <path d="M0 -560 L0 -180" stroke="#0d0f12" strokeWidth="5" />
      <path d="M-60 -540 C-80 -440 -82 -320 -78 -200" stroke="#3a414b" strokeWidth="5" fill="none" opacity="0.7" />
      {/* brazos larguísimos colgando */}
      <path d={`M-72 -548 C-100 -460 ${-108 - a * 10} -300 ${-104 - a * 18} -170`} stroke={abrigo} strokeWidth="38" strokeLinecap="round" fill="none" />
      <path d={`M72 -548 C100 -460 ${108 + a * 10} -300 ${104 + a * 18} -170`} stroke={abrigo} strokeWidth="38" strokeLinecap="round" fill="none" />
      <path d={`M${-118 - a * 18} -175 l26 0 l6 70 l-8 4 l-6 -40 l-4 52 l-9 0 l-2 -50 l-7 44 l-8 -2 l2 -50 Z`} fill={piel} />
      <path d={`M${92 + a * 18} -175 l26 0 l4 70 l-8 4 l-6 -40 l-4 52 l-9 0 l-2 -50 l-7 44 l-8 -2 l2 -50 Z`} fill={piel} />
      {/* cuello y cabeza algo caída hacia delante */}
      <rect x="-16" y="-600" width="32" height="50" fill={piel} />
      <g transform={`translate(0 -650) rotate(${cabeza})`}>
        <ellipse cx="0" cy="0" rx="46" ry="60" fill={piel} />
        <path d="M-54 -6 C-62 -76 62 -78 54 -6 L60 90 L44 30 L30 96 L16 30 L-16 30 L-30 100 L-42 30 L-58 84 Z" fill={pelo} />
        <rect x="-26" y="-22" width="52" height="60" fill={piel} rx="18" />
        <path d="M-26 -22 L-10 -22 L-14 30 L-26 26 Z" fill={pelo} />
        <OjosBrillantes x1={-12} x2={14} y={2} r={7} intensidad={ojos} />
      </g>
    </g>
  );
};

// El encargado: mayor, robusto, impermeable amarillo, bigote gris.
export const Encargado: React.FC<Base & { boca?: number }> = ({ x, y, escala = 1, giro = 0, boca = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
    <ellipse cx="0" cy="0" rx="120" ry="18" fill="#000" opacity="0.35" />
    <rect x="-55" y="-250" width="45" height="245" fill="#2d3340" />
    <rect x="10" y="-250" width="45" height="245" fill="#2d3340" />
    <path d="M-110 -500 C-130 -400 -125 -260 -115 -200 L115 -200 C125 -260 130 -400 110 -500 C70 -530 -70 -530 -110 -500 Z" fill="#d9a726" />
    <path d="M-110 -500 C-130 -400 -125 -260 -115 -200 L-60 -200 C-80 -300 -80 -420 -60 -515 Z" fill="#b3861a" />
    <path d="M0 -515 L0 -200" stroke="#9c7414" strokeWidth="5" />
    <path d="M-112 -490 C-150 -400 -150 -300 -130 -240" stroke="#d9a726" strokeWidth="44" strokeLinecap="round" fill="none" />
    <path d="M112 -490 C150 -400 150 -300 130 -240" stroke="#d9a726" strokeWidth="44" strokeLinecap="round" fill="none" />
    <circle cx="-130" cy="-228" r="22" fill="#b98a6a" />
    <circle cx="130" cy="-228" r="22" fill="#b98a6a" />
    <path d="M-70 -515 C-60 -560 60 -560 70 -515 Z" fill="#c4951f" />
    <g transform="translate(0 -590)">
      <ellipse cx="0" cy="0" rx="58" ry="66" fill="#b98a6a" />
      <path d="M-58 -10 C-60 -50 -40 -66 -20 -66 L-40 -20 Z" fill="#8f8f8f" />
      <path d="M58 -10 C60 -50 40 -66 20 -66 L40 -20 Z" fill="#8f8f8f" />
      <circle cx="-20" cy="-4" r="6" fill="#1b1b1b" />
      <circle cx="20" cy="-4" r="6" fill="#1b1b1b" />
      <path d="M-30 -20 l20 -4 M30 -20 l-20 -4" stroke="#6d6d6d" strokeWidth="5" />
      <path d="M-28 26 C-20 14 20 14 28 26 C14 22 -14 22 -28 26 Z" fill="#9a9a9a" />
      <ellipse cx="0" cy={36} rx={10 + boca * 8} ry={2 + boca * 14} fill="#3b1d16" />
    </g>
  </g>
);

// El protagonista (tú): gorra y chaleco rojos de la gasolinera.
export const Dependiente: React.FC<Base> = ({ x, y, escala = 1, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
    <ellipse cx="0" cy="0" rx="100" ry="16" fill="#000" opacity="0.35" />
    <rect x="-45" y="-250" width="40" height="245" fill="#2c3443" />
    <rect x="5" y="-250" width="40" height="245" fill="#2c3443" />
    <path d="M-85 -490 C-100 -400 -95 -300 -90 -240 L90 -240 C95 -300 100 -400 85 -490 C50 -515 -50 -515 -85 -490 Z" fill="#8d939c" />
    <path d="M-80 -480 C-92 -400 -88 -300 -86 -240 L-20 -240 L-20 -500 C-45 -500 -65 -495 -80 -480 Z M80 -480 C92 -400 88 -300 86 -240 L20 -240 L20 -500 C45 -500 65 -495 80 -480 Z" fill="#b8282e" />
    <path d="M-88 -480 C-115 -400 -112 -320 -104 -250" stroke="#8d939c" strokeWidth="34" strokeLinecap="round" fill="none" />
    <path d="M88 -480 C115 -400 112 -320 104 -250" stroke="#8d939c" strokeWidth="34" strokeLinecap="round" fill="none" />
    <circle cx="-104" cy="-238" r="18" fill="#d9a988" />
    <circle cx="104" cy="-238" r="18" fill="#d9a988" />
    <g transform="translate(0 -560)">
      <ellipse cx="0" cy="0" rx="48" ry="56" fill="#d9a988" />
      <circle cx="-17" cy="4" r="5" fill="#1b1b1b" />
      <circle cx="17" cy="4" r="5" fill="#1b1b1b" />
      <path d="M-12 30 q12 5 24 0" stroke="#8a5a45" strokeWidth="4" fill="none" />
      <path d="M-52 -14 C-52 -70 52 -70 52 -14 Z" fill="#b8282e" />
      <path d="M-10 -18 L80 -12 L78 -2 L-10 -6 Z" fill="#8f1c22" />
    </g>
  </g>
);

// Primer plano de la cara del desconocido (centro de la cara en x, y). Para planos cercanos.
export const CaraDesconocido: React.FC<{ x: number; y: number; escala?: number; ojos?: number; giro?: number }> = ({ x, y, escala = 1, ojos = 1, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
    {/* abrigo y cuello */}
    <path d="M-420 900 C-400 520 -260 420 -110 400 L110 400 C260 420 400 520 420 900 Z" fill="#1b1e23" />
    <path d="M-90 250 L90 250 L110 420 L-110 420 Z" fill="#7d867d" />
    {/* pelo de detrás */}
    <path d="M-250 -120 C-260 -330 260 -330 250 -120 L270 420 L180 300 L150 460 L90 330 L-90 330 L-150 470 L-185 300 L-275 430 Z" fill="#0b0c0e" />
    {/* cara alargada */}
    <ellipse cx="0" cy="0" rx="185" ry="250" fill="#8d968c" />
    <ellipse cx="-40" cy="-40" rx="120" ry="170" fill="#9aa398" />
    {/* cuencas hundidas y ojos que brillan */}
    <ellipse cx="-72" cy="-20" rx="58" ry="40" fill="#3b413b" />
    <ellipse cx="72" cy="-20" rx="58" ry="40" fill="#3b413b" />
    <OjosBrillantes x1={-72} x2={72} y={-20} r={15} intensidad={ojos} />
    <path d="M-20 40 L-30 110 L10 115" stroke="#5f675e" strokeWidth="8" fill="none" strokeLinecap="round" />
    <path d="M-60 170 Q0 160 60 170" stroke="#2c312c" strokeWidth="10" fill="none" strokeLinecap="round" />
    {/* mechones mojados por delante de la cara */}
    <path d="M-200 -170 C-120 -290 120 -290 200 -170 C150 -230 60 -240 20 -200 C40 -120 30 -40 10 40 C0 -60 -20 -150 -40 -205 C-100 -220 -160 -200 -200 -170 Z" fill="#0b0c0e" />
    <path d="M-190 -150 C-210 0 -200 150 -170 300 L-140 300 C-150 150 -150 0 -130 -140 Z" fill="#0b0c0e" />
    <path d="M190 -150 C210 0 200 150 170 300 L140 300 C150 150 150 0 130 -140 Z" fill="#0b0c0e" />
    <path d="M60 -210 C90 -100 110 30 95 140 L80 140 C90 30 70 -90 45 -200 Z" fill="#0b0c0e" />
  </g>
);
