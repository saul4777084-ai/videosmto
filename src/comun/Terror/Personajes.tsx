import React from "react";

// Personajes de las historias de terror (SVG, origen en los pies; altura a escala 1 ≈ 640 px).
// Estilo del vídeo de referencia: formas limpias con volumen suave (degradados de luz y sombra),
// ropa con costuras y pliegues, caras sencillas con ojos pequeños.

type Base = { x: number; y: number; escala?: number; giro?: number };

// Degradados compartidos: se superponen a cualquier forma para darle volumen sin cambiar su color.
//  vol  → cilindro (bordes oscuros, brillo a la izquierda)   volV → luz arriba, sombra abajo
export const DefsVolumen: React.FC = () => (
  <defs>
    <linearGradient id="vol" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#000" stopOpacity="0.45" />
      <stop offset="0.22" stopColor="#fff" stopOpacity="0.12" />
      <stop offset="0.5" stopColor="#000" stopOpacity="0" />
      <stop offset="0.82" stopColor="#000" stopOpacity="0.3" />
      <stop offset="1" stopColor="#000" stopOpacity="0.6" />
    </linearGradient>
    <linearGradient id="volV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
      <stop offset="0.45" stopColor="#000" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity="0.45" />
    </linearGradient>
    <radialGradient id="volCara" cx="0.38" cy="0.35" r="0.75">
      <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
      <stop offset="0.55" stopColor="#000" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity="0.5" />
    </radialGradient>
    <radialGradient id="haloOjo">
      <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
      <stop offset="0.35" stopColor="#f4fff6" stopOpacity="0.55" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
  </defs>
);

// Una forma con su color y el volumen encima
const F: React.FC<{ d: string; c: string; v?: "vol" | "volV" | "volCara" | "ambos" }> = ({ d, c, v = "vol" }) => (
  <g>
    <path d={d} fill={c} />
    {(v === "vol" || v === "ambos") && <path d={d} fill="url(#vol)" />}
    {(v === "volV" || v === "ambos") && <path d={d} fill="url(#volV)" />}
    {v === "volCara" && <path d={d} fill="url(#volCara)" />}
  </g>
);

const elipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;

// Mano abierta con dedos (muñeca en 0,0, dedos hacia abajo). largo: dedos más largos (desconocido)
const Mano: React.FC<{ x: number; y: number; c: string; escala?: number; largo?: number; giro?: number; espejo?: boolean }> = ({ x, y, c, escala = 1, largo = 1, giro = 0, espejo = false }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${espejo ? -escala : escala} ${escala})`}>
    <F d="M-16 0 C-20 14 -20 34 -14 44 L14 44 C20 34 20 14 16 0 Z" c={c} v="volCara" />
    {[-11, -3.5, 4, 11].map((dx, i) => (
      <path key={i} d={`M${dx - 3.6} 40 L${dx - 3} ${40 + (18 + (i === 1 || i === 2 ? 5 : 0)) * largo} Q${dx} ${44 + (20 + (i === 1 || i === 2 ? 5 : 0)) * largo} ${dx + 3} ${40 + (18 + (i === 1 || i === 2 ? 5 : 0)) * largo} L${dx + 3.6} 40 Z`} fill={c} />
    ))}
    <path d="M14 12 Q28 22 24 40 L18 38 Q20 26 12 22 Z" fill={c} />
    <path d="M-16 0 C-20 14 -20 34 -14 44 L14 44 C20 34 20 14 16 0 Z" fill="#000" opacity="0.08" />
  </g>
);

// Ojos brillantes (blanco con halo)
export const OjosBrillantes: React.FC<{ x1: number; x2: number; y: number; r?: number; intensidad?: number }> = ({ x1, x2, y, r = 9, intensidad = 1 }) => (
  <g>
    <DefsVolumen />
    {[x1, x2].map((cx, i) => (
      <g key={i} opacity={intensidad}>
        <circle cx={cx} cy={y} r={r * 2.1} fill="url(#haloOjo)" opacity="0.55" />
        <circle cx={cx} cy={y} r={r} fill="#fff" />
      </g>
    ))}
  </g>
);

// ------------------------------------------------------------------ el desconocido
// Alto, delgado, abrigo largo empapado, pelo mojado tapando la cara.
// pose "pie" | "andar" | "agachado"; paso: fase de la zancada (0..1) para "andar".
const ABRIGO = "#1e2228";
const PIEL_D = "#a3aaa1";
const PELO = "#0b0c0e";

const CabezaDesconocido: React.FC<{ rx: number; ry: number; ojos: number; ojoR: number }> = ({ rx, ry, ojos, ojoR }) => (
  <g>
    {/* pelo de detrás, largo y mojado */}
    <path d={`M${-rx - 10} ${-ry * 0.1} C${-rx - 20} ${-ry * 1.35} ${rx + 20} ${-ry * 1.35} ${rx + 10} ${-ry * 0.1} L${rx + 16} ${ry * 1.55} L${rx * 0.7} ${ry * 0.9} L${rx * 0.45} ${ry * 1.7} L${rx * 0.2} ${ry * 0.8} L${-rx * 0.25} ${ry * 0.8} L${-rx * 0.5} ${ry * 1.75} L${-rx * 0.75} ${ry * 0.9} L${-rx - 18} ${ry * 1.45} Z`} fill={PELO} />
    {/* cara alargada con mejillas hundidas */}
    <F d={elipse(0, 0, rx, ry)} c={PIEL_D} v="volCara" />
    <path d={`M${-rx * 0.62} ${ry * 0.15} Q${-rx * 0.45} ${ry * 0.55} ${-rx * 0.2} ${ry * 0.62}`} stroke="#000" strokeOpacity="0.18" strokeWidth={rx * 0.12} fill="none" strokeLinecap="round" />
    <path d={`M${rx * 0.62} ${ry * 0.15} Q${rx * 0.45} ${ry * 0.55} ${rx * 0.2} ${ry * 0.62}`} stroke="#000" strokeOpacity="0.18" strokeWidth={rx * 0.12} fill="none" strokeLinecap="round" />
    {/* cuencas oscuras */}
    <ellipse cx={-rx * 0.38} cy={ry * 0.03} rx={rx * 0.32} ry={ry * 0.19} fill="#161a17" />
    <ellipse cx={rx * 0.38} cy={ry * 0.03} rx={rx * 0.32} ry={ry * 0.19} fill="#161a17" />
    <OjosBrillantes x1={-rx * 0.38} x2={rx * 0.38} y={ry * 0.03} r={ojoR} intensidad={ojos} />
    {/* nariz y boca fina */}
    <path d={`M${-rx * 0.06} ${ry * 0.18} L${-rx * 0.14} ${ry * 0.46} L${rx * 0.08} ${ry * 0.48}`} stroke="#000" strokeOpacity="0.28" strokeWidth={rx * 0.05} fill="none" strokeLinecap="round" />
    <path d={`M${-rx * 0.28} ${ry * 0.7} Q0 ${ry * 0.66} ${rx * 0.28} ${ry * 0.7}`} stroke="#2a2f2a" strokeWidth={rx * 0.06} fill="none" strokeLinecap="round" />
    {/* flequillo y mechones delante de la cara, con brillo de mojado */}
    <path d={`M${-rx - 6} ${-ry * 0.35} C${-rx * 0.6} ${-ry * 1.2} ${rx * 0.6} ${-ry * 1.2} ${rx + 6} ${-ry * 0.35} C${rx * 0.7} ${-ry * 0.8} ${rx * 0.25} ${-ry * 0.85} ${rx * 0.1} ${-ry * 0.7} C${rx * 0.2} ${-ry * 0.3} ${rx * 0.12} ${ry * 0.1} ${rx * 0.02} ${ry * 0.35} C${-rx * 0.05} ${-ry * 0.1} ${-rx * 0.12} ${-ry * 0.5} ${-rx * 0.2} ${-ry * 0.78} C${-rx * 0.5} ${-ry * 0.85} ${-rx * 0.8} ${-ry * 0.7} ${-rx - 6} ${-ry * 0.35} Z`} fill={PELO} />
    <path d={`M${-rx - 4} ${-ry * 0.3} C${-rx * 1.05} ${ry * 0.4} ${-rx * 0.95} ${ry * 0.9} ${-rx * 0.85} ${ry * 1.2} L${-rx * 0.66} ${ry * 1.2} C${-rx * 0.75} ${ry * 0.7} ${-rx * 0.78} ${ry * 0.1} ${-rx * 0.66} ${-ry * 0.5} Z`} fill={PELO} />
    <path d={`M${rx + 4} ${-ry * 0.3} C${rx * 1.05} ${ry * 0.4} ${rx * 0.95} ${ry * 0.9} ${rx * 0.85} ${ry * 1.2} L${rx * 0.66} ${ry * 1.2} C${rx * 0.75} ${ry * 0.7} ${rx * 0.78} ${ry * 0.1} ${rx * 0.66} ${-ry * 0.5} Z`} fill={PELO} />
    {[-0.55, -0.15, 0.3, 0.6].map((p, i) => (
      <path key={i} d={`M${rx * p} ${-ry * 0.95} C${rx * (p - 0.05)} ${-ry * 0.5} ${rx * (p + 0.04)} ${-ry * 0.1} ${rx * (p - 0.02)} ${ry * 0.1}`} stroke="#5b6470" strokeOpacity="0.5" strokeWidth={rx * 0.03} fill="none" />
    ))}
  </g>
);

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
  if (pose === "agachado") {
    return (
      <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
        <DefsVolumen />
        <ellipse cx="0" cy="0" rx="200" ry="28" fill="#000" opacity="0.4" />
        {/* cuerpo encogido: espalda curvada, rodillas arriba */}
        <F d="M-160 0 C-180 -150 -125 -270 -20 -300 C90 -310 160 -225 158 -110 L148 0 Z" c={ABRIGO} v="ambos" />
        <F d="M-70 -30 C-85 -160 40 -210 120 -135 L128 -10 Z" c="#272c33" v="vol" />
        <path d="M-120 -40 C-110 -150 -60 -230 0 -260" stroke="#4a525d" strokeOpacity="0.45" strokeWidth="6" fill="none" />
        {/* gotas que caen del abrigo */}
        {[-120, 30, 130].map((dx, i) => (
          <ellipse key={i} cx={dx} cy={-6 - i * 4} rx="4" ry="7" fill="#9fb4c8" opacity="0.5" />
        ))}
        {/* manos huesudas sobre las rodillas */}
        <Mano x={-30} y={-205} c={PIEL_D} escala={1.15} largo={1.6} giro={-75} />
        <Mano x={-50} y={-160} c={PIEL_D} escala={1.1} largo={1.6} giro={-65} />
        <g transform={`translate(10 -335) rotate(${cabeza})`}>
          <CabezaDesconocido rx={62} ry={78} ojos={ojos} ojoR={7} />
        </g>
      </g>
    );
  }
  const a = pose === "andar" ? Math.sin(paso * Math.PI * 2) : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
      <DefsVolumen />
      <ellipse cx="0" cy="0" rx="115" ry="18" fill="#000" opacity="0.4" />
      {/* piernas y zapatos */}
      <F d={`M-40 -300 L${-42 + a * 30} -10 L${-10 + a * 30} -10 L-6 -300 Z`} c="#14171b" />
      <F d={`M6 -300 L${10 - a * 30} -10 L${42 - a * 30} -10 L40 -300 Z`} c="#14171b" />
      <path d={`M${-56 + a * 30} 0 Q${-56 + a * 30} -16 ${-40 + a * 30} -18 L${-8 + a * 30} -18 L${-8 + a * 30} 0 Z`} fill="#060607" />
      <path d={`M${6 - a * 30} 0 L${6 - a * 30} -18 L${40 - a * 30} -18 Q${56 - a * 30} -16 ${56 - a * 30} 0 Z`} fill="#060607" />
      {/* abrigo largo con solapas y botones */}
      <F d="M-72 -562 C-98 -500 -104 -300 -100 -170 L100 -170 C104 -300 98 -500 72 -562 C40 -578 -40 -578 -72 -562 Z" c={ABRIGO} v="ambos" />
      <path d="M-34 -566 L0 -470 L34 -566 L22 -570 L0 -505 L-22 -570 Z" fill="#14171b" />
      <path d="M0 -470 L0 -172" stroke="#0e1013" strokeWidth="4" />
      {[-430, -360, -290].map((by) => (
        <circle key={by} cx="10" cy={by} r="6" fill="#0c0d10" />
      ))}
      <path d="M-62 -540 C-84 -440 -86 -320 -82 -190" stroke="#56606c" strokeOpacity="0.55" strokeWidth="5" fill="none" />
      <path d="M48 -520 C60 -430 62 -330 58 -200" stroke="#56606c" strokeOpacity="0.25" strokeWidth="4" fill="none" />
      <path d="M-100 -172 L-60 -190 L-30 -172 L10 -192 L40 -172 L80 -188 L100 -172" stroke="#0e1013" strokeWidth="5" fill="none" />
      {/* brazos larguísimos colgando, con manos huesudas */}
      <F d={`M-70 -555 C-98 -540 -112 -470 ${-118 - a * 10} -330 L${-122 - a * 18} -178 L${-90 - a * 18} -176 L${-84 - a * 10} -330 C-80 -440 -64 -500 -48 -540 Z`} c={ABRIGO} />
      <F d={`M70 -555 C98 -540 112 -470 ${118 + a * 10} -330 L${122 + a * 18} -178 L${90 + a * 18} -176 L${84 + a * 10} -330 C80 -440 64 -500 48 -540 Z`} c={ABRIGO} />
      <Mano x={-106 - a * 18} y={-180} c={PIEL_D} escala={1.05} largo={1.7} />
      <Mano x={106 + a * 18} y={-180} c={PIEL_D} escala={1.05} largo={1.7} espejo />
      {/* cuello y cabeza algo caída hacia delante */}
      <F d="M-17 -605 L17 -605 L19 -555 L-19 -555 Z" c={PIEL_D} />
      <g transform={`translate(0 -652) rotate(${cabeza})`}>
        <CabezaDesconocido rx={46} ry={60} ojos={ojos} ojoR={5.5} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ el encargado
// Mayor, robusto, impermeable amarillo con bandas reflectantes, bigote gris.
// sonrisa: 0..1 (sonrisa antinatural de oreja a oreja); ojos: 0..1 ojos brillantes; boca: 0..1 habla
const AMARILLO = "#d7a623";
const PIEL_E = "#b98a6a";

export const Encargado: React.FC<Base & { boca?: number; sonrisa?: number; ojos?: number }> = ({ x, y, escala = 1, giro = 0, boca = 0, sonrisa = 0, ojos = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
    <DefsVolumen />
    <ellipse cx="0" cy="0" rx="125" ry="18" fill="#000" opacity="0.4" />
    {/* pantalón y botas de agua */}
    <F d="M-58 -255 L-12 -255 L-14 -60 L-56 -60 Z" c="#2a3140" />
    <F d="M12 -255 L58 -255 L56 -60 L14 -60 Z" c="#2a3140" />
    <F d="M-62 -70 L-10 -70 L-8 -2 L-72 -2 Q-74 -20 -62 -30 Z" c="#1a1d22" />
    <F d="M10 -70 L62 -70 L62 -30 Q74 -20 72 -2 L8 -2 Z" c="#1a1d22" />
    {/* impermeable */}
    <F d="M-112 -505 C-134 -400 -130 -260 -120 -195 L120 -195 C130 -260 134 -400 112 -505 C72 -536 -72 -536 -112 -505 Z" c={AMARILLO} v="ambos" />
    {/* capucha caída sobre la espalda */}
    <F d="M-78 -520 C-80 -580 80 -580 78 -520 C50 -540 -50 -540 -78 -520 Z" c="#b98a1c" />
    {/* bandas reflectantes, cremallera y bolsillos */}
    <path d="M-124 -330 L124 -330 L124 -306 L-124 -306 Z" fill="#c9cdd2" opacity="0.85" />
    <path d="M-121 -240 L121 -240 L120 -218 L-120 -218 Z" fill="#c9cdd2" opacity="0.85" />
    <path d="M0 -528 L0 -197" stroke="#8c6812" strokeWidth="6" />
    <path d="M-4 -528 L-4 -197" stroke="#e8c45a" strokeWidth="2" opacity="0.6" />
    <F d="M-96 -300 L-36 -300 L-36 -250 L-96 -250 Z" c="#c29420" v="volV" />
    <F d="M36 -300 L96 -300 L96 -250 L36 -250 Z" c="#c29420" v="volV" />
    <path d="M-96 -300 L-36 -300 L-40 -284 L-92 -284 Z" fill="#a67d16" />
    <path d="M36 -300 L96 -300 L92 -284 L40 -284 Z" fill="#a67d16" />
    <path d="M-60 -500 C-70 -420 -70 -330 -64 -210" stroke="#a67d16" strokeOpacity="0.5" strokeWidth="4" fill="none" />
    {/* mangas con puño y manos */}
    <F d="M-110 -500 C-150 -470 -160 -380 -152 -260 L-114 -256 C-116 -360 -112 -430 -94 -470 Z" c={AMARILLO} />
    <F d="M110 -500 C150 -470 160 -380 152 -260 L114 -256 C116 -360 112 -430 94 -470 Z" c={AMARILLO} />
    <path d="M-154 -270 L-112 -266 L-112 -248 L-154 -252 Z" fill="#a67d16" />
    <path d="M154 -270 L112 -266 L112 -248 L154 -252 Z" fill="#a67d16" />
    <Mano x={-133} y={-252} c={PIEL_E} escala={1.25} />
    <Mano x={133} y={-252} c={PIEL_E} escala={1.25} espejo />
    {/* cuello */}
    <F d="M-26 -540 L26 -540 L28 -510 L-28 -510 Z" c="#a3785a" />
    {/* cabeza */}
    <g transform="translate(0 -590)">
      <F d={elipse(-58, 2, 11, 17)} c={PIEL_E} v="volCara" />
      <F d={elipse(58, 2, 11, 17)} c={PIEL_E} v="volCara" />
      <F d={elipse(0, 0, 58, 66)} c={PIEL_E} v="volCara" />
      {/* pelo gris a los lados, calva brillante */}
      <path d="M-58 -6 C-62 -48 -44 -66 -20 -68 C-34 -52 -42 -30 -44 -2 Z" fill="#8e8e8e" />
      <path d="M58 -6 C62 -48 44 -66 20 -68 C34 -52 42 -30 44 -2 Z" fill="#8e8e8e" />
      <ellipse cx="-12" cy="-46" rx="20" ry="9" fill="#fff" opacity="0.12" />
      {/* cejas pobladas, ojos pequeños con bolsas */}
      <path d="M-36 -22 Q-22 -32 -8 -24" stroke="#6b6b6b" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M36 -22 Q22 -32 8 -24" stroke="#6b6b6b" strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="-21" cy="-5" rx="8" ry="6" fill="#efe7da" />
      <ellipse cx="21" cy="-5" rx="8" ry="6" fill="#efe7da" />
      <circle cx="-20" cy="-4" r="4.5" fill="#1b1b1b" />
      <circle cx="22" cy="-4" r="4.5" fill="#1b1b1b" />
      <path d="M-30 6 Q-21 10 -12 6 M30 6 Q21 10 12 6" stroke="#000" strokeOpacity="0.2" strokeWidth="3" fill="none" />
      {ojos > 0 && <OjosBrillantes x1={-20} x2={21} y={-4} r={6} intensidad={ojos} />}
      {/* nariz ancha */}
      <path d="M-2 -4 C-6 8 -14 16 -12 22 C-6 26 6 26 12 22 C14 16 6 8 2 -4 Z" fill="#000" opacity="0.14" />
      <ellipse cx="-4" cy="14" rx="6" ry="4" fill="#fff" opacity="0.1" />
      {/* bigote */}
      <path d="M-32 30 C-26 16 -6 18 0 24 C6 18 26 16 32 30 C22 26 10 30 0 30 C-10 30 -22 26 -32 30 Z" fill="#9a9a9a" />
      <path d="M-30 29 C-20 24 -8 27 0 29" stroke="#bdbdbd" strokeWidth="2" fill="none" opacity="0.6" />
      {sonrisa > 0 ? (
        <g>
          <path d={`M${-22 - sonrisa * 34} ${30 - sonrisa * 8} Q0 ${44 + sonrisa * 34} ${22 + sonrisa * 34} ${30 - sonrisa * 8} Q0 ${40 + sonrisa * 12} ${-22 - sonrisa * 34} ${30 - sonrisa * 8} Z`} fill="#2a0f0b" />
          <path d={`M${-18 - sonrisa * 30} ${32 - sonrisa * 6} Q0 ${42 + sonrisa * 16} ${18 + sonrisa * 30} ${32 - sonrisa * 6}`} stroke="#efe9d8" strokeWidth={3 + sonrisa * 5} fill="none" strokeDasharray="5 3" />
          <path d={`M${-26 - sonrisa * 34} ${20 - sonrisa * 8} Q${-30 - sonrisa * 36} ${30} ${-24 - sonrisa * 34} ${40}`} stroke="#000" strokeOpacity="0.25" strokeWidth="3" fill="none" />
          <path d={`M${26 + sonrisa * 34} ${20 - sonrisa * 8} Q${30 + sonrisa * 36} ${30} ${24 + sonrisa * 34} ${40}`} stroke="#000" strokeOpacity="0.25" strokeWidth="3" fill="none" />
        </g>
      ) : (
        <ellipse cx="0" cy={37} rx={10 + boca * 8} ry={2 + boca * 14} fill="#3b1d16" />
      )}
      {/* papada y sombra bajo la barbilla */}
      <path d="M-34 52 Q0 74 34 52" stroke="#000" strokeOpacity="0.15" strokeWidth="5" fill="none" />
    </g>
  </g>
);

// ------------------------------------------------------------------ el protagonista
// Tú: polo gris, chaleco y gorra rojos de la gasolinera, placa con el nombre.
const PIEL_P = "#d9a988";

export const Dependiente: React.FC<Base> = ({ x, y, escala = 1, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
    <DefsVolumen />
    <ellipse cx="0" cy="0" rx="100" ry="16" fill="#000" opacity="0.35" />
    <F d="M-46 -250 L-6 -250 L-8 -14 L-44 -14 Z" c="#2c3443" />
    <F d="M6 -250 L46 -250 L44 -14 L8 -14 Z" c="#2c3443" />
    <path d="M-54 0 Q-54 -16 -40 -18 L-6 -18 L-6 0 Z M6 0 L6 -18 L40 -18 Q54 -16 54 0 Z" fill="#e6e6e6" />
    <F d="M-86 -492 C-102 -400 -97 -300 -92 -240 L92 -240 C97 -300 102 -400 86 -492 C50 -516 -50 -516 -86 -492 Z" c="#8d939c" v="ambos" />
    <F d="M-82 -482 C-94 -400 -90 -300 -88 -240 L-20 -240 L-22 -500 C-46 -500 -66 -496 -82 -482 Z" c="#b8282e" />
    <F d="M82 -482 C94 -400 90 -300 88 -240 L20 -240 L22 -500 C46 -500 66 -496 82 -482 Z" c="#b8282e" />
    <path d="M-26 -506 L0 -470 L26 -506" stroke="#6f757e" strokeWidth="8" fill="none" />
    <rect x="34" y="-440" width="38" height="18" rx="3" fill="#f1f1f1" />
    <F d="M-86 -485 C-118 -460 -122 -380 -114 -262 L-88 -258 C-92 -360 -90 -420 -76 -462 Z" c="#8d939c" />
    <F d="M86 -485 C118 -460 122 -380 114 -262 L88 -258 C92 -360 90 -420 76 -462 Z" c="#8d939c" />
    <Mano x={-101} y={-262} c={PIEL_P} escala={1} />
    <Mano x={101} y={-262} c={PIEL_P} escala={1} espejo />
    <F d="M-18 -520 L18 -520 L20 -496 L-20 -496 Z" c="#c99878" />
    <g transform="translate(0 -560)">
      <F d={elipse(0, 0, 48, 56)} c={PIEL_P} v="volCara" />
      <circle cx="-17" cy="4" r="4.5" fill="#1b1b1b" />
      <circle cx="17" cy="4" r="4.5" fill="#1b1b1b" />
      <path d="M-26 -10 Q-17 -15 -8 -11 M26 -10 Q17 -15 8 -11" stroke="#5a3a2a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M-2 6 L-6 20 L4 21" stroke="#000" strokeOpacity="0.22" strokeWidth="3" fill="none" />
      <path d="M-12 32 q12 5 24 0" stroke="#8a5a45" strokeWidth="4" fill="none" />
      <F d="M-52 -14 C-52 -72 52 -72 52 -14 Z" c="#b8282e" v="volV" />
      <path d="M-10 -18 L80 -12 L78 -2 L-10 -6 Z" fill="#8f1c22" />
      <circle cx="0" cy="-58" r="5" fill="#8f1c22" />
    </g>
  </g>
);

// ------------------------------------------------------------------ primer plano del desconocido
export const CaraDesconocido: React.FC<{ x: number; y: number; escala?: number; ojos?: number; giro?: number }> = ({ x, y, escala = 1, ojos = 1, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro})`}>
    <DefsVolumen />
    {/* abrigo con solapas y cuello */}
    <F d="M-430 900 C-410 520 -270 420 -110 400 L110 400 C270 420 410 520 430 900 Z" c={ABRIGO} v="ambos" />
    <path d="M-110 400 L0 640 L110 400 L80 396 L0 560 L-80 396 Z" fill="#14171b" />
    <F d="M-92 250 L92 250 L110 420 L-110 420 Z" c="#7f887f" />
    <path d="M-92 250 L92 250 L96 300 L-96 300 Z" fill="#000" opacity="0.3" />
    <CabezaDesconocido rx={185} ry={250} ojos={ojos} ojoR={15} />
  </g>
);
