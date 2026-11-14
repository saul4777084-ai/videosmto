import React from "react";
import { spring, useVideoConfig } from "remotion";

export type PoseColon = "reposo" | "mapa" | "senalar" | "reverencia" | "bandera" | "pensar" | "presentar";

// ángulos en grados: hombro (0 = brazo colgando) y codo (relativo al brazo)
type Brazo = { hombro: number; codo: number };
type Pose = { izq: Brazo; der: Brazo; cabeza: number; agacha: number };

const POSES: Record<PoseColon, Pose> = {
  reposo: { izq: { hombro: 8, codo: -6 }, der: { hombro: -8, codo: 6 }, cabeza: 0, agacha: 0 },
  mapa: { izq: { hombro: -22, codo: -108 }, der: { hombro: 22, codo: 108 }, cabeza: 6, agacha: 0 },
  senalar: { izq: { hombro: 8, codo: -6 }, der: { hombro: -128, codo: 4 }, cabeza: -8, agacha: 0 },
  reverencia: { izq: { hombro: -30, codo: -100 }, der: { hombro: -10, codo: 4 }, cabeza: 16, agacha: 22 },
  bandera: { izq: { hombro: 8, codo: -6 }, der: { hombro: -26, codo: -140 }, cabeza: -5, agacha: 0 },
  pensar: { izq: { hombro: -16, codo: -150 }, der: { hombro: 18, codo: 70 }, cabeza: 10, agacha: 0 },
  presentar: { izq: { hombro: 8, codo: -6 }, der: { hombro: -40, codo: -60 }, cabeza: -6, agacha: 0 },
};

const mezclar = (a: Pose, b: Pose, k: number): Pose => {
  const m = (x: number, y: number) => x + (y - x) * k;
  return {
    izq: { hombro: m(a.izq.hombro, b.izq.hombro), codo: m(a.izq.codo, b.izq.codo) },
    der: { hombro: m(a.der.hombro, b.der.hombro), codo: m(a.der.codo, b.der.codo) },
    cabeza: m(a.cabeza, b.cabeza),
    agacha: m(a.agacha, b.agacha),
  };
};

const PIEL = "#f0c08a";
const TUNICA = "#7b1f2e";
const CAPA = "#1b2a49";
const MANGA = "#6a1a27";

const BrazoSVG: React.FC<{ x: number; y: number; b: Brazo; children?: React.ReactNode }> = ({ x, y, b, children }) => (
  <g transform={`translate(${x} ${y}) rotate(${b.hombro})`}>
    <rect x={-17} y={-10} width={34} height={118} rx={17} fill={MANGA} stroke="#3a0d15" strokeWidth={4} />
    <g transform={`translate(0 104) rotate(${b.codo})`}>
      <rect x={-15} y={-8} width={30} height={102} rx={15} fill={MANGA} stroke="#3a0d15" strokeWidth={4} />
      <rect x={-17} y={78} width={34} height={14} rx={6} fill="#f3e5c0" />
      <circle cx={0} cy={106} r={19} fill={PIEL} stroke="#8a5a2b" strokeWidth={3} />
      <g transform="translate(0 106)">{children}</g>
    </g>
  </g>
);

type Props = { pose: PoseColon; f: number; x: number; y: number; escala: number; hablando?: boolean; voltear?: boolean };

// Cristóbal Colón en estilo caricatura. Origen en los pies.
export const Colon: React.FC<Props> = ({ pose, f, x, y, escala, hablando = true, voltear = false }) => {
  const { fps } = useVideoConfig();
  const k = spring({ frame: f - 3, fps, config: { damping: 13, mass: 0.8 } });
  const p = mezclar(POSES.reposo, POSES[pose], k);
  const t = f / fps;
  const respira = Math.sin(t * 2.4) * 3;
  const parpadeo = (f % 95) < 4 ? 0.1 : 1;
  const boca = hablando ? 6 + Math.abs(Math.sin(t * 11)) * 12 * Math.abs(Math.sin(t * 2.3)) : 4;
  const ondea = Math.sin(t * 6);
  const entrada = spring({ frame: f, fps, config: { damping: 14 } });

  return (
    <g transform={`translate(${x + (1 - entrada) * 500} ${y}) scale(${voltear ? -escala : escala} ${escala})`}>
      {/* sombra */}
      <ellipse cx={0} cy={0} rx={120} ry={18} fill="rgba(0,0,0,0.35)" />
      {/* piernas y botas */}
      <rect x={-48} y={-185} width={38} height={170} rx={14} fill="#3e2723" />
      <rect x={10} y={-185} width={38} height={170} rx={14} fill="#3e2723" />
      <path d="M -62 -10 Q -60 -40 -12 -40 L -10 0 L -62 0 Z" fill="#1a1a1a" />
      <path d="M 62 -10 Q 60 -40 12 -40 L 10 0 L 62 0 Z" fill="#1a1a1a" />

      <g transform={`translate(0 ${p.agacha + respira * 0.3})`}>
        {/* capa */}
        <path d="M -95 -440 Q -150 -300 -125 -175 L 125 -175 Q 150 -300 95 -440 Z" fill={CAPA} stroke="#0b1324" strokeWidth={5} />
        {/* túnica */}
        <path d="M -82 -445 L 82 -445 Q 100 -320 112 -170 L -112 -170 Q -100 -320 -82 -445 Z" fill={TUNICA} stroke="#3a0d15" strokeWidth={5} />
        <path d="M 0 -440 L 0 -180" stroke="#5a1520" strokeWidth={4} />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={0} cy={-410 + i * 40} r={6} fill="#ffca28" />
        ))}
        {/* cinturón */}
        <rect x={-104} y={-300} width={208} height={26} fill="#4e342e" />
        <rect x={-20} y={-304} width={40} height={34} rx={6} fill="none" stroke="#ffca28" strokeWidth={6} />

        {/* brazo izquierdo de pantalla */}
        <BrazoSVG x={-82} y={-425} b={p.izq}>
          {pose === "mapa" && (
            <g transform={`rotate(${-p.izq.hombro - p.izq.codo})`}>
              <rect x={0} y={-60} width={150} height={110} fill="#f3dfb0" stroke="#8d6e3f" strokeWidth={4} />
              <path d="M 20 -30 Q 60 -50 90 -20 T 135 10" stroke="#8d6e3f" strokeWidth={4} fill="none" strokeDasharray="8 8" />
              <path d="M 40 10 Q 70 30 120 20" stroke="#4e8a3a" strokeWidth={6} fill="none" />
            </g>
          )}
        </BrazoSVG>

        {/* cabeza */}
        <g transform={`translate(0 -470) rotate(${p.cabeza})`}>
          <rect x={-22} y={-20} width={44} height={40} fill={PIEL} />
          <path d="M -40 10 L 40 10 L 30 26 L -30 26 Z" fill="#f3e5c0" />
          <g transform="translate(0 -70)">
            {/* pelo blanco largo */}
            <path d="M -76 -10 Q -80 -90 0 -95 Q 80 -90 76 -10 L 80 60 Q 60 70 50 40 L -50 40 Q -60 70 -80 60 Z" fill="#e8e3da" stroke="#9e9a92" strokeWidth={4} />
            <ellipse cx={0} cy={0} rx={58} ry={66} fill={PIEL} stroke="#8a5a2b" strokeWidth={4} />
            {/* ojos y cejas */}
            <ellipse cx={-22} cy={-6} rx={7} ry={10 * parpadeo} fill="#2b1608" />
            <ellipse cx={22} cy={-6} rx={7} ry={10 * parpadeo} fill="#2b1608" />
            <path d="M -36 -26 L -10 -22" stroke="#9e9a92" strokeWidth={6} strokeLinecap="round" />
            <path d="M 36 -26 L 10 -22" stroke="#9e9a92" strokeWidth={6} strokeLinecap="round" />
            <path d="M 0 0 Q 8 18 -4 22" stroke="#a86f3d" strokeWidth={4} fill="none" />
            {/* boca */}
            <ellipse cx={0} cy={38} rx={14} ry={boca / 2} fill="#5b1a14" />
            <circle cx={-34} cy={22} r={9} fill="#f2a07b" opacity={0.6} />
            <circle cx={34} cy={22} r={9} fill="#f2a07b" opacity={0.6} />
            {/* gorro rojo */}
            <path d="M -66 -40 Q -70 -110 0 -112 Q 70 -110 66 -40 Q 0 -60 -66 -40 Z" fill="#b71c1c" stroke="#5d0a0a" strokeWidth={4} />
            <rect x={-70} y={-48} width={140} height={18} rx={9} fill="#8e1414" />
          </g>
        </g>

        {/* brazo derecho de pantalla */}
        <BrazoSVG x={82} y={-425} b={p.der}>
          {pose === "bandera" && (
            <g transform={`rotate(${-p.der.hombro - p.der.codo})`}>
              <rect x={-6} y={-330} width={12} height={420} fill="#5d4037" />
              <path
                d={`M 6 -325 Q 70 ${-345 + ondea * 12} 140 -325 Q ${200 + ondea * 8} -305 200 -300 L 200 -190 Q 140 ${-210 + ondea * 12} 70 -190 Q 30 -180 6 -195 Z`}
                fill="#fafafa"
                stroke="#9e9e9e"
                strokeWidth={3}
              />
              <path d="M 100 -315 L 100 -195 M 10 -255 L 196 -255" stroke="#2e7d32" strokeWidth={12} />
              <text x={50} y={-270} fontSize={34} fontWeight={900} fill="#2e7d32" fontFamily="serif">F</text>
              <text x={140} y={-270} fontSize={34} fontWeight={900} fill="#2e7d32" fontFamily="serif">Y</text>
            </g>
          )}
        </BrazoSVG>
      </g>
    </g>
  );
};
