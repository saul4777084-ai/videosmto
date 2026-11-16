import React from "react";

// Napoleón dibujado con SVG. El origen (x, y) está entre los pies.
// brazo: ángulo del brazo derecho (0 = abajo, -90 = señalando al frente/derecha).
export const Napoleon: React.FC<{
  x: number;
  y: number;
  escala: number;
  f: number;
  brazo?: number;
  sombrero?: number; // 0..1: 1 = puesto, 0 = caído
  corona?: number; // 0..1: corona de laurel dorada
  voltear?: boolean;
}> = ({ x, y, escala, f, brazo = 0, sombrero = 1, corona = 0, voltear = false }) => {
  const respira = Math.sin(f / 14) * 3;
  const caida = 1 - sombrero;
  return (
    <g transform={`translate(${x} ${y}) scale(${voltear ? -escala : escala} ${escala})`}>
      {/* sombra */}
      <ellipse cx={0} cy={0} rx={150} ry={22} fill="rgba(0,0,0,0.35)" />
      {/* botas */}
      <path d="M -70 0 L -70 -170 L -15 -170 L -15 0 Z" fill="#111" />
      <path d="M 15 0 L 15 -170 L 70 -170 L 70 0 Z" fill="#111" />
      <path d="M -78 -150 h 70 v 22 h -70 z M 8 -150 h 70 v 22 h -70 z" fill="#2a2a2a" />
      {/* calzones blancos */}
      <path d="M -72 -165 L -78 -330 L 78 -330 L 72 -165 L 15 -165 L 0 -260 L -15 -165 Z" fill="#f2efe6" stroke="#cfc8b4" strokeWidth={4} />
      <g transform={`translate(0 ${respira * 0.3})`}>
        {/* casaca azul (faldones) */}
        <path d="M -120 -280 Q -130 -420 -110 -560 L 110 -560 Q 130 -420 120 -280 L 60 -300 L 0 -420 L -60 -300 Z" fill="#1c2c66" stroke="#0e1a44" strokeWidth={5} />
        {/* chaleco blanco */}
        <path d="M -55 -560 L 55 -560 L 48 -360 L 0 -330 L -48 -360 Z" fill="#f4f1e8" stroke="#d2cbb6" strokeWidth={4} />
        {[0, 1, 2, 3].map((k) => (
          <circle key={k} cx={0} cy={-530 + k * 45} r={7} fill="#c9a227" />
        ))}
        {/* solapas rojas */}
        <path d="M -55 -560 L -95 -560 L -60 -380 L -48 -360 Z" fill="#b3202a" />
        <path d="M 55 -560 L 95 -560 L 60 -380 L 48 -360 Z" fill="#b3202a" />
        {/* banda */}
        <path d="M -110 -380 L 110 -400 L 110 -370 L -110 -350 Z" fill="#e0e0e0" opacity={0.9} />
        {/* brazo izquierdo: mano en el chaleco */}
        <path d="M -105 -545 Q -160 -470 -110 -420 Q -60 -400 -15 -450" fill="none" stroke="#1c2c66" strokeWidth={52} strokeLinecap="round" />
        <circle cx={-15} cy={-452} r={18} fill="#f1c9a0" />
        {/* hombreras doradas */}
        <ellipse cx={-110} cy={-555} rx={42} ry={18} fill="#d4a92a" stroke="#8a6a10" strokeWidth={4} />
        {/* brazo derecho */}
        <g transform={`translate(108 -545) rotate(${brazo})`}>
          <path d="M 0 0 L 0 170" stroke="#1c2c66" strokeWidth={52} strokeLinecap="round" />
          <rect x={-27} y={150} width={54} height={18} fill="#b3202a" />
          <circle cx={0} cy={192} r={22} fill="#f1c9a0" />
        </g>
        <ellipse cx={110} cy={-555} rx={42} ry={18} fill="#d4a92a" stroke="#8a6a10" strokeWidth={4} />
        {/* cuello y cabeza */}
        <rect x={-30} y={-600} width={60} height={50} fill="#f1c9a0" />
        <path d="M -60 -570 L 60 -570 L 50 -545 L -50 -545 Z" fill="#b3202a" />
        <ellipse cx={0} cy={-665} rx={62} ry={74} fill="#f1c9a0" />
        <path d="M -60 -690 Q -40 -735 0 -735 Q 40 -735 60 -690 L 55 -660 Q 30 -700 -20 -690 Q -40 -672 -58 -660 Z" fill="#4a3220" />
        <path d="M -12 -710 Q -4 -680 -20 -668" stroke="#4a3220" strokeWidth={9} fill="none" strokeLinecap="round" />
        <ellipse cx={-22} cy={-662} rx={7} ry={9} fill="#222" />
        <ellipse cx={22} cy={-662} rx={7} ry={9} fill="#222" />
        <path d="M -34 -684 L -10 -680 M 34 -684 L 10 -680" stroke="#4a3220" strokeWidth={7} strokeLinecap="round" />
        <path d="M 0 -660 L -6 -630 L 6 -630" stroke="#c89a74" strokeWidth={5} fill="none" />
        <path d="M -18 -612 Q 0 -605 18 -612" stroke="#8d4b3a" strokeWidth={6} fill="none" strokeLinecap="round" />
        {/* corona de laurel */}
        {corona > 0 && (
          <g opacity={corona} transform={`translate(0 ${-720 - (1 - corona) * 160})`}>
            {Array.from({ length: 7 }, (_, k) => (
              <React.Fragment key={k}>
                <ellipse cx={-62 + k * 10} cy={10 - Math.abs(k - 3) * 3} rx={18} ry={9} fill="#e0b52c" stroke="#8a6a10" strokeWidth={3} transform={`rotate(${-40 + k * 10} ${-62 + k * 10} 0)`} />
                <ellipse cx={62 - k * 10} cy={10 - Math.abs(k - 3) * 3} rx={18} ry={9} fill="#e0b52c" stroke="#8a6a10" strokeWidth={3} transform={`rotate(${40 - k * 10} ${62 - k * 10} 0)`} />
              </React.Fragment>
            ))}
          </g>
        )}
        {/* bicornio */}
        {sombrero > 0.02 && corona < 0.5 && (
          <g transform={`translate(${caida * 220} ${-720 + caida * 700}) rotate(${caida * 160})`} opacity={sombrero > 0 ? 1 : 0}>
            <path d="M -150 10 Q -100 -40 -40 -80 Q 0 -100 40 -80 Q 100 -40 150 10 Q 0 -15 -150 10 Z" fill="#111" stroke="#000" strokeWidth={4} />
            <path d="M -150 10 Q 0 -15 150 10" stroke="#c9a227" strokeWidth={6} fill="none" />
            <circle cx={30} cy={-40} r={20} fill="#1d3fa0" />
            <circle cx={30} cy={-40} r={13} fill="#fff" />
            <circle cx={30} cy={-40} r={7} fill="#d22" />
          </g>
        )}
      </g>
    </g>
  );
};

// Soldado de la Grande Armée (de perfil, mirando a la derecha). Origen entre los pies.
export const Soldado: React.FC<{ x: number; y: number; escala: number; f: number; paso?: number; color?: string; nieve?: boolean }> = ({
  x,
  y,
  escala,
  f,
  paso = 0.6,
  color = "#1c2c66",
  nieve = false,
}) => {
  const a = Math.sin(f * paso) * 24;
  const bote = Math.abs(Math.cos(f * paso)) * 6;
  return (
    <g transform={`translate(${x} ${y - bote * escala}) scale(${escala})`}>
      <g transform="translate(0 -110)">
        <path d={`M 0 0 L ${Math.sin((a * Math.PI) / 180) * 110} 110`} stroke="#ece7da" strokeWidth={22} strokeLinecap="round" />
        <path d={`M 0 0 L ${-Math.sin((a * Math.PI) / 180) * 110} 110`} stroke="#ddd6c4" strokeWidth={22} strokeLinecap="round" />
      </g>
      <rect x={-28} y={-230} width={56} height={125} rx={14} fill={color} />
      <path d="M -28 -190 L 28 -170 M -28 -170 L 28 -190" stroke="#f2efe6" strokeWidth={7} />
      {/* mochila */}
      <rect x={-52} y={-220} width={30} height={70} rx={6} fill="#6b4a2b" />
      {/* fusil al hombro */}
      <path d="M 18 -140 L 40 -330" stroke="#5a3a1e" strokeWidth={9} strokeLinecap="round" />
      <path d="M 40 -330 L 44 -370" stroke="#999" strokeWidth={4} />
      <circle cx={20} cy={-150} r={11} fill="#f1c9a0" />
      {/* cabeza y chacó */}
      <circle cx={2} cy={-255} r={26} fill="#f1c9a0" />
      <rect x={-24} y={-320} width={50} height={48} rx={4} fill="#111" />
      <rect x={-26} y={-280} width={58} height={8} fill="#111" />
      <circle cx={2} cy={-308} r={7} fill="#d22" />
      {nieve && <path d="M -26 -322 Q 2 -334 26 -322 L 26 -316 L -26 -316 Z" fill="#fff" />}
    </g>
  );
};

// Cañón de campaña mirando a la derecha. disparo: 0..1 (fogonazo y retroceso)
export const Canon: React.FC<{ x: number; y: number; escala: number; disparo: number; color?: string }> = ({ x, y, escala, disparo, color = "#3b3b3b" }) => {
  const retro = disparo > 0 && disparo < 1 ? Math.sin(disparo * Math.PI) * 18 : 0;
  return (
    <g transform={`translate(${x - retro * escala} ${y}) scale(${escala})`}>
      <path d="M -90 -30 L -10 -40 L -10 10 Z" fill="#6b4a2b" />
      <g transform="rotate(-10)">
        <rect x={-60} y={-62} width={180} height={40} rx={18} fill={color} />
        <rect x={110} y={-66} width={18} height={48} rx={6} fill="#222" />
      </g>
      <circle cx={0} cy={-10} r={46} fill="none" stroke="#6b4a2b" strokeWidth={14} />
      {[0, 45, 90, 135].map((g) => (
        <path key={g} d="M -44 0 L 44 0" stroke="#6b4a2b" strokeWidth={8} transform={`translate(0 -10) rotate(${g})`} />
      ))}
      {disparo > 0 && disparo < 1 && (
        <g transform="translate(140 -90)" opacity={1 - disparo}>
          <circle r={30 + disparo * 70} fill="#ffcf40" opacity={0.9 - disparo * 0.6} />
          <circle r={18 + disparo * 40} fill="#fff6c0" />
          <circle cx={-40} cy={-30} r={40 + disparo * 60} fill="rgba(220,220,220,0.7)" />
        </g>
      )}
    </g>
  );
};
