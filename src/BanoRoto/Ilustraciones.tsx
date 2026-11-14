import React from "react";
import { AbsoluteFill, interpolate, random, spring, useVideoConfig } from "remotion";
import { Dibujo } from "../comun/tipos";
import { Ilustracion } from "./escenas";

const W = 1080;
const H = 1920;
const CX = 700; // centro de la ilustración (el avatar ocupa la esquina inferior izquierda)
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- piezas ----------

const Azulejos: React.FC<{ color: string; linea: string }> = ({ color, linea }) => (
  <AbsoluteFill style={{ background: color }}>
    <svg width={W} height={H}>
      {Array.from({ length: 10 }, (_, i) => (
        <line key={`v${i}`} x1={i * 120} y1={0} x2={i * 120} y2={1450} stroke={linea} strokeWidth={4} />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 120} x2={W} y2={i * 120} stroke={linea} strokeWidth={4} />
      ))}
      <rect x={0} y={1450} width={W} height={H - 1450} fill="#cfd8dc" />
      <line x1={0} y1={1450} x2={W} y2={1450} stroke="#90a4ae" strokeWidth={8} />
    </svg>
  </AbsoluteFill>
);

const Inodoro: React.FC<{ x: number; y: number; s: number; grieta: number; temblor: number }> = ({ x, y, s, grieta, temblor }) => (
  <g transform={`translate(${x + temblor} ${y}) scale(${s})`}>
    {/* tanque */}
    <rect x={-120} y={-330} width={240} height={190} rx={22} fill="#fafafa" stroke="#37474f" strokeWidth={8} />
    <rect x={-135} y={-345} width={270} height={34} rx={12} fill="#fff" stroke="#37474f" strokeWidth={8} />
    <rect x={60} y={-300} width={40} height={14} rx={7} fill="#90a4ae" />
    {/* taza */}
    <path d="M -170 -130 L 170 -130 Q 170 40 60 80 L 70 190 L -70 190 L -60 80 Q -170 40 -170 -130 Z" fill="#fafafa" stroke="#37474f" strokeWidth={8} />
    <ellipse cx={0} cy={-130} rx={170} ry={36} fill="#fff" stroke="#37474f" strokeWidth={8} />
    <ellipse cx={0} cy={-128} rx={115} ry={20} fill="#81d4fa" />
    {/* grieta */}
    <path
      d="M 40 -100 L 10 -40 L 50 0 L 5 60 L 30 120"
      fill="none"
      stroke="#263238"
      strokeWidth={7}
      strokeLinecap="round"
      strokeDasharray={400}
      strokeDashoffset={400 * (1 - grieta)}
    />
  </g>
);

const Gota: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => (
  <path
    d={`M ${x} ${y - r * 1.6} Q ${x + r} ${y - r * 0.2} ${x + r} ${y + r * 0.3} A ${r} ${r} 0 0 1 ${x - r} ${y + r * 0.3} Q ${x - r} ${y - r * 0.2} ${x} ${y - r * 1.6} Z`}
    fill="#4fc3f7"
    stroke="#0277bd"
    strokeWidth={4}
    opacity={o}
  />
);

const Charco: React.FC<{ x: number; y: number; ancho: number }> = ({ x, y, ancho }) => (
  <ellipse cx={x} cy={y} rx={ancho} ry={ancho * 0.18} fill="rgba(79,195,247,0.7)" stroke="#0288d1" strokeWidth={4} />
);

const TituloGrande: React.FC<{ texto: string; f: number; y: number; color: string; tam?: number; inicio?: number }> = ({
  texto,
  f,
  y,
  color,
  tam = 120,
  inicio = 4,
}) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - inicio, fps, config: { damping: 10 } });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 380,
        right: 20,
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 900,
        fontSize: tam,
        color,
        transform: `scale(${s})`,
        textShadow: "0 8px 30px rgba(0,0,0,0.5)",
        whiteSpace: "pre-line",
        lineHeight: 1,
      }}
    >
      {texto}
    </div>
  );
};

// ---------- escenas ----------

const EscenaInodoro: Dibujo = ({ f }) => {
  const grieta = interpolate(f, [5, 25], [0, 1], clamp);
  const temblor = f > 5 && f < 25 ? Math.sin(f * 2.5) * 8 : 0;
  return (
    <AbsoluteFill>
      <Azulejos color="#b2dfdb" linea="#80cbc4" />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <Charco x={CX} y={1500} ancho={interpolate(f, [20, 90], [40, 230], clamp)} />
        <Inodoro x={CX} y={1250} s={1.25} grieta={grieta} temblor={temblor} />
        {Array.from({ length: 4 }, (_, i) => {
          const fase = ((f + i * 22) % 40) / 40;
          return <Gota key={i} x={CX + 45} y={1330 + fase * 160} r={14} o={f > 20 ? 1 - fase * 0.6 : 0} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const EscenaFuga: Dibujo = ({ f }) => {
  const litros = Math.round(interpolate(f, [5, 85], [0, 750], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const nivel = interpolate(f, [5, 95], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#0d3b66, #061a2e)" }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {/* tanque de agua que se llena */}
        <rect x={CX - 200} y={700} width={400} height={650} rx={40} fill="rgba(255,255,255,0.08)" stroke="#e3f2fd" strokeWidth={10} />
        <clipPath id="tanque">
          <rect x={CX - 195} y={705} width={390} height={640} rx={36} />
        </clipPath>
        <g clipPath="url(#tanque)">
          <rect x={CX - 200} y={1345 - 640 * nivel} width={400} height={700} fill="#29b6f6" />
          <path
            d={`M ${CX - 220} ${1345 - 640 * nivel} ${Array.from({ length: 9 }, (_, k) => `Q ${CX - 195 + k * 50} ${1345 - 640 * nivel + Math.sin(f / 4 + k) * 14} ${CX - 170 + k * 50} ${1345 - 640 * nivel}`).join(" ")} L ${CX + 220} 1400 L ${CX - 220} 1400 Z`}
            fill="#4fc3f7"
          />
        </g>
        {/* gotas que caen */}
        {Array.from({ length: 10 }, (_, i) => {
          const fase = ((f * 1.6 + i * 17) % 60) / 60;
          return <Gota key={i} x={CX - 160 + random(`g${i}`) * 320} y={420 + fase * 380} r={16} o={1 - fase} />;
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          top: 930,
          left: CX - 200,
          width: 400,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#fff",
          fontWeight: 900,
          fontSize: 130,
          textShadow: "0 6px 20px rgba(0,0,0,0.5)",
        }}
      >
        {litros}
        <div style={{ fontSize: 56, marginTop: -10 }}>litros/día</div>
      </div>
    </AbsoluteFill>
  );
};

const EscenaFactura: Dibujo = ({ f }) => {
  const { fps } = useVideoConfig();
  const entra = spring({ frame: f - 4, fps, config: { damping: 12 } });
  const monto = Math.round(interpolate(f, [15, 70], [25, 380], clamp));
  const flecha = spring({ frame: f - 28, fps, config: { damping: 8 } });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#4a148c, #1a0033)" }}>
      <div
        style={{
          position: "absolute",
          left: CX - 230,
          top: 720,
          width: 460,
          height: 620,
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
          transform: `translateY(${(1 - entra) * 600}px) rotate(${-4 + Math.sin(f / 10) * 1.5}deg)`,
          padding: 40,
          fontFamily: "system-ui, sans-serif",
          color: "#263238",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 46, fontWeight: 900 }}>💧 Factura de agua</div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 22, background: "#eceff1", borderRadius: 11, margin: "30px 0", width: `${90 - i * 18}%` }} />
        ))}
        <div style={{ fontSize: 40, fontWeight: 700, marginTop: 50 }}>Total a pagar</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: monto > 150 ? "#e53935" : "#263238" }}>${monto}</div>
      </div>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <g transform={`translate(${CX + 250} 900) scale(${flecha})`}>
          <rect x={-28} y={-40} width={56} height={240} rx={14} fill="#ff1744" />
          <polygon points="-90,-20 0,-160 90,-20" fill="#ff1744" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const EscenaMoho: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Azulejos color="#d7ccc8" linea="#bcaaa4" />
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {/* manchas de moho que crecen */}
      {Array.from({ length: 26 }, (_, i) => {
        const inicio = i * 3;
        const s = interpolate(f, [inicio, inicio + 25], [0, 1], clamp);
        const x = 380 + random(`mx${i}`) * 680;
        const y = 520 + random(`my${i}`) * 900;
        const r = 30 + random(`mr${i}`) * 55;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <circle r={r} fill="#33691e" opacity={0.75} />
            <circle r={r * 0.6} cx={r * 0.3} cy={-r * 0.2} fill="#1b5e20" opacity={0.8} />
            <circle r={r * 0.25} cx={-r * 0.4} cy={r * 0.3} fill="#212121" opacity={0.7} />
          </g>
        );
      })}
      {/* olor */}
      {Array.from({ length: 5 }, (_, i) => {
        const fase = ((f + i * 14) % 60) / 60;
        const x = 520 + i * 110;
        const y = 1400 - fase * 500;
        return (
          <path key={i} d={`M ${x} ${y} q 30 -40 0 -80 q -30 -40 0 -80`} fill="none" stroke="#9ccc65" strokeWidth={14}
            strokeLinecap="round" opacity={Math.sin(fase * Math.PI) * 0.9} />
        );
      })}
    </svg>
  </AbsoluteFill>
);

const EscenaDanos: Dibujo = ({ f }) => {
  const g1 = interpolate(f, [10, 30], [0, 1], clamp);
  const g2 = interpolate(f, [36, 56], [0, 1], clamp);
  const charco = interpolate(f, [60, 100], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Azulejos color="#cfd8dc" linea="#b0bec5" />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {/* grieta en la pared */}
        <path d="M 720 420 L 680 560 L 760 650 L 690 800 L 740 930" fill="none" stroke="#37474f" strokeWidth={12}
          strokeLinecap="round" strokeDasharray={700} strokeDashoffset={700 * (1 - g1)} />
        <path d="M 760 650 L 860 700" fill="none" stroke="#37474f" strokeWidth={8} strokeLinecap="round"
          strokeDasharray={150} strokeDashoffset={150 * (1 - g1)} />
        {/* piso que se raja */}
        <path d="M 480 1460 L 600 1560 L 560 1680 L 700 1800" fill="none" stroke="#455a64" strokeWidth={12}
          strokeLinecap="round" strokeDasharray={600} strokeDashoffset={600 * (1 - g2)} />
        <path d="M 600 1560 L 820 1600 L 900 1720" fill="none" stroke="#455a64" strokeWidth={10}
          strokeLinecap="round" strokeDasharray={500} strokeDashoffset={500 * (1 - g2)} />
        {/* agua filtrándose hacia abajo */}
        <Charco x={760} y={1600} ancho={charco * 260} />
        {Array.from({ length: 5 }, (_, i) => {
          const fase = ((f + i * 12) % 40) / 40;
          return <Gota key={i} x={680 + i * 40} y={1640 + fase * 260} r={13} o={charco * (1 - fase)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const EscenaReparar: Dibujo = ({ f }) => {
  const { fps } = useVideoConfig();
  const llave = spring({ frame: f - 2, fps, config: { damping: 10 } });
  const check = spring({ frame: f - 20, fps, config: { damping: 9 } });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 65% 50%, #00c853, #00491f)" }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {/* destellos */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + f / 30;
          const r = 330 + Math.sin(f / 6 + i) * 20;
          return (
            <circle key={i} cx={CX + Math.cos(a) * r} cy={950 + Math.sin(a) * r} r={10} fill="#fff59d"
              opacity={check} style={{ filter: "drop-shadow(0 0 10px #fff176)" }} />
          );
        })}
        {/* llave inglesa girando */}
        <g transform={`translate(${CX} 950) rotate(${interpolate(llave, [0, 1], [-180, -35]) + Math.sin(f / 5) * 8}) scale(${llave})`}>
          <rect x={-30} y={-40} width={60} height={330} rx={26} fill="#eceff1" stroke="#455a64" strokeWidth={8} />
          <path d="M -95 -150 A 100 100 0 1 0 95 -150 L 40 -150 L 40 -70 L -40 -70 L -40 -150 Z" fill="#eceff1" stroke="#455a64" strokeWidth={8} />
        </g>
        {/* check */}
        <g transform={`translate(${CX + 170} 1180) scale(${check})`}>
          <circle r={110} fill="#fff" />
          <path d="M -50 0 L -12 40 L 55 -40" fill="none" stroke="#00c853" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <TituloGrande texto="¡A tiempo!" f={f} y={1400} color="#ffffff" tam={110} inicio={30} />
    </AbsoluteFill>
  );
};

export const Ilustraciones: Record<Ilustracion, Dibujo> = {
  inodoro: EscenaInodoro,
  fuga: EscenaFuga,
  factura: EscenaFactura,
  moho: EscenaMoho,
  danos: EscenaDanos,
  reparar: EscenaReparar,
};
