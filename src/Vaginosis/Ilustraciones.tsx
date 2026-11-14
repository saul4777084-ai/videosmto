import React from "react";
import { AbsoluteFill, interpolate, random, spring, useVideoConfig } from "remotion";
import { Ilustracion } from "./escenas";

type P = { f: number };
const W = 1080;
const H = 1920;

// ---------- piezas reutilizables ----------

const Tejido: React.FC<{ f: number; tono?: string }> = ({ f, tono = "#7a1f4a" }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 55%, #c2416f 0%, ${tono} 55%, #2a0718 100%)`,
    }}
  >
    <svg width={W} height={H} style={{ position: "absolute", opacity: 0.35 }}>
      {new Array(14).fill(0).map((_, i) => {
        const y = 300 + i * 120;
        const d = `M0 ${y} ` +
          new Array(12).fill(0).map((__, k) => `Q ${k * 90 + 45} ${y + Math.sin(f / 20 + i + k) * 18} ${(k + 1) * 90} ${y}`).join(" ");
        return <path key={i} d={d} stroke="#ffb3c9" strokeWidth={3} fill="none" />;
      })}
    </svg>
  </AbsoluteFill>
);

const Bacilos: React.FC<{ f: number; cantidad: number; visibles?: number; encoger?: number }> = ({
  f,
  cantidad,
  visibles = 1,
  encoger = 1,
}) => (
  <svg width={W} height={H} style={{ position: "absolute" }}>
    {new Array(cantidad).fill(0).map((_, i) => {
      const x = random(`bx${i}`) * W;
      const y = 520 + random(`by${i}`) * 1250;
      const largo = (70 + random(`bl${i}`) * 70) * encoger;
      const ang = -20 + random(`ba${i}`) * 40 + Math.sin(f / 15 + i) * 6;
      const vis = random(`bv${i}`) < visibles ? 1 : 0;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${ang})`} opacity={vis}>
          <rect x={-11} y={-largo / 2} width={22} height={largo} rx={11} fill="#9b6bff" stroke="#e2d4ff" strokeWidth={3} />
          <rect x={-4} y={-largo / 2 + 10} width={6} height={largo - 20} rx={3} fill="#c7aaff" opacity={0.7} />
        </g>
      );
    })}
  </svg>
);

const Cocos: React.FC<{ f: number; cantidad: number; aparicion: number }> = ({ f, cantidad, aparicion }) => (
  <svg width={W} height={H} style={{ position: "absolute" }}>
    {new Array(cantidad).fill(0).map((_, i) => {
      const inicio = (i / cantidad) * aparicion;
      const s = Math.min(1, Math.max(0, (f - inicio) / 8));
      const x = random(`cx${i}`) * W;
      const y = 520 + random(`cy${i}`) * 1250;
      const r = 26 + random(`cr${i}`) * 14;
      return (
        <g key={i} transform={`translate(${x + Math.sin(f / 10 + i) * 6} ${y}) scale(${s})`}>
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={(k - 1) * r * 1.1} cy={k === 1 ? -r * 0.6 : 0} r={r} fill="#7fae3e" stroke="#2f4d12" strokeWidth={4} />
          ))}
          <circle cx={-r * 0.4} cy={-4} r={5} fill="#2f4d12" />
          <circle cx={r * 0.7} cy={6} r={4} fill="#2f4d12" />
        </g>
      );
    })}
  </svg>
);

const Prohibido: React.FC<{ f: number; inicio: number; x: number; y: number; r: number }> = ({ f, inicio, x, y, r }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - inicio, fps, config: { damping: 9 } });
  return (
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <circle r={r} fill="none" stroke="#ff2f4e" strokeWidth={r * 0.14} />
        <line x1={-r * 0.7} y1={-r * 0.7} x2={r * 0.7} y2={r * 0.7} stroke="#ff2f4e" strokeWidth={r * 0.14} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const Pez: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 150 0 L 260 -80 L 240 0 L 260 80 Z" fill="#7d93a6" stroke="#2b3a46" strokeWidth={6} />
    <ellipse cx={0} cy={0} rx={190} ry={95} fill="#a8bccb" stroke="#2b3a46" strokeWidth={6} />
    <path d="M -40 -95 Q 20 -150 90 -88" fill="#7d93a6" stroke="#2b3a46" strokeWidth={6} />
    <path d="M -110 -70 Q -80 0 -110 70" fill="none" stroke="#c0564f" strokeWidth={6} />
    <circle cx={-140} cy={-20} r={20} fill="#fff" stroke="#2b3a46" strokeWidth={5} />
    <circle cx={-136} cy={-20} r={9} fill="#2b3a46" />
    <path d="M -185 30 Q -165 40 -150 30" fill="none" stroke="#2b3a46" strokeWidth={5} />
  </g>
);

const Titulo: React.FC<{ texto: string; f: number; y: number; color?: string; tam?: number; izquierda?: number }> = ({ texto, f, y, color = "#fff", tam = 96, izquierda = 0 }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 12 } });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: izquierda,
        right: 0,
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 900,
        fontSize: tam,
        color,
        transform: `scale(${s})`,
        textShadow: "0 8px 30px rgba(0,0,0,0.6)",
        lineHeight: 1.05,
        whiteSpace: "pre-line",
      }}
    >
      {texto}
    </div>
  );
};

// ---------- escenas ----------

const EscenaPez: React.FC<P> = ({ f }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#173a44, #0b1d24)" }}>
    <svg width={W} height={H}>
      {/* azulejos */}
      {new Array(10).fill(0).map((_, i) => (
        <line key={`v${i}`} x1={i * 120} y1={0} x2={i * 120} y2={H} stroke="#2b5966" strokeWidth={3} />
      ))}
      {new Array(17).fill(0).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 120} x2={W} y2={i * 120} stroke="#2b5966" strokeWidth={3} />
      ))}
      {/* hielo */}
      {new Array(40).fill(0).map((_, i) => (
        <rect key={i} x={random(`hx${i}`) * W} y={1300 + random(`hy${i}`) * 250} width={70} height={60} rx={14}
          fill="#dff3fb" stroke="#9cc7d6" strokeWidth={4} transform={`rotate(${random(`hr${i}`) * 40 - 20})`} opacity={0.9} />
      ))}
      <Pez x={640} y={1230 + Math.sin(f / 8) * 6} s={1.25} />
      {/* olor */}
      {new Array(6).fill(0).map((_, i) => {
        const fase = ((f + i * 12) % 70) / 70;
        const x = 470 + i * 70;
        const y = 1100 - fase * 450;
        return (
          <path key={i} d={`M ${x} ${y} q 30 -40 0 -80 q -30 -40 0 -80`} fill="none" stroke="#9cff3a"
            strokeWidth={14} strokeLinecap="round" opacity={Math.sin(fase * Math.PI) * 0.85} />
        );
      })}
    </svg>
  </AbsoluteFill>
);

const EscenaJabon: React.FC<P> = ({ f }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#1f5f73, #0e2f3a)" }}>
    <svg width={W} height={H}>
      {new Array(18).fill(0).map((_, i) => {
        const fase = ((f * 1.5 + i * 37) % 300) / 300;
        return <circle key={i} cx={350 + random(`bu${i}`) * 650} cy={1350 - fase * 800} r={14 + random(`br${i}`) * 30}
          fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth={3} />;
      })}
      <g transform={`translate(700 1150) rotate(${Math.sin(f / 10) * 4})`}>
        <rect x={-190} y={-110} width={380} height={220} rx={80} fill="#ff9ec2" stroke="#7a2a4a" strokeWidth={8} />
        <rect x={-120} y={-70} width={150} height={40} rx={20} fill="#ffd0e2" />
      </g>
    </svg>
    <Prohibido f={f} inicio={30} x={700} y={1150} r={300} />
  </AbsoluteFill>
);

const EscenaLacto: React.FC<P> = ({ f }) => (
  <AbsoluteFill>
    <Tejido f={f} />
    <Bacilos f={f} cantidad={70} />
    <Titulo texto="Lactobacilos ✓" f={f} y={1500} color="#d9c6ff" tam={84} izquierda={380} />
  </AbsoluteFill>
);

const Medidor: React.FC<{ f: number; ph: number }> = ({ f, ph }) => {
  // barra de pH de 3 (abajo) a 7 (arriba)
  const y = interpolate(ph, [3, 7], [1500, 700]);
  return (
    <svg width={W} height={H} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="ph" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffde3b" />
          <stop offset="0.45" stopColor="#ff9a2e" />
          <stop offset="1" stopColor="#4fa83a" />
        </linearGradient>
      </defs>
      <rect x={930} y={700} width={70} height={800} rx={35} fill="url(#ph)" stroke="#fff" strokeWidth={6} />
      <g transform={`translate(965 ${y})`}>
        <polygon points="-70,0 -100,-22 -100,22" fill="#fff" />
        <text x={-115} y={18} textAnchor="end" fontSize={58} fontWeight={900} fill="#fff" fontFamily="system-ui">
          pH {ph.toFixed(1)}
        </text>
      </g>
    </svg>
  );
};

const EscenaAcido: React.FC<P> = ({ f }) => (
  <AbsoluteFill>
    <Tejido f={f} />
    <Bacilos f={f} cantidad={55} />
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {new Array(60).fill(0).map((_, i) => {
        const fase = ((f * 2 + i * 23) % 200) / 200;
        return <circle key={i} cx={random(`ax${i}`) * 880} cy={1700 - fase * 1100 - random(`ay${i}`) * 150}
          r={7 + random(`ar${i}`) * 6} fill="#ffe46b" opacity={Math.sin(fase * Math.PI)}
          style={{ filter: "drop-shadow(0 0 10px #ffd400)" }} />;
      })}
    </svg>
    <Medidor f={f} ph={interpolate(f, [0, 60], [5.5, 4.0], { extrapolateRight: "clamp" })} />
  </AbsoluteFill>
);

const EscenaInvasion: React.FC<P> = ({ f }) => {
  const vis = interpolate(f, [0, 90], [1, 0.25], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Tejido f={f} tono="#5a1a3c" />
      <Bacilos f={f} cantidad={55} visibles={vis} encoger={0.85} />
      <Cocos f={f} cantidad={45} aparicion={100} />
      <Medidor f={f} ph={interpolate(f, [0, 110], [4.0, 5.6], { extrapolateRight: "clamp" })} />
    </AbsoluteFill>
  );
};

const EscenaNombre: React.FC<P> = ({ f }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 13 } });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 60% 50%, #3a1030, #0d0410)" }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="lupa">
            <circle cx={680} cy={950} r={230} />
          </clipPath>
        </defs>
        <g transform={`translate(680 950) scale(${s}) translate(-680 -950)`}>
          <circle cx={680} cy={950} r={230} fill="#b23a63" />
          <g clipPath="url(#lupa)">
            {new Array(16).fill(0).map((_, i) => (
              <circle key={i} cx={480 + random(`lx${i}`) * 400} cy={750 + random(`ly${i}`) * 400} r={30}
                fill="#7fae3e" stroke="#2f4d12" strokeWidth={4} />
            ))}
          </g>
          <circle cx={680} cy={950} r={230} fill="none" stroke="#e8e8e8" strokeWidth={22} />
          <line x1={845} y1={1115} x2={990} y2={1260} stroke="#5b3a29" strokeWidth={46} strokeLinecap="round" />
        </g>
      </svg>
      <Titulo texto={"Vaginosis\nbacteriana"} f={f} y={1300} color="#ffd93b" tam={100} izquierda={400} />
    </AbsoluteFill>
  );
};

const Tarjeta: React.FC<{ f: number; inicio: number; x: number; y: number; icono: string; texto: string }> = ({ f, inicio, x, y, icono, texto }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - inicio, fps, config: { damping: 11 } });
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: 560, padding: "34px 30px",
      background: "rgba(255,255,255,0.12)", border: "4px solid rgba(255,255,255,0.5)", borderRadius: 40,
      transform: `scale(${s})`, display: "flex", alignItems: "center", gap: 26,
      fontFamily: "system-ui, sans-serif", color: "#fff", fontSize: 54, fontWeight: 800,
    }}>
      <span style={{ fontSize: 100 }}>{icono}</span>
      <span>{texto}</span>
    </div>
  );
};

const EscenaRiesgo: React.FC<P> = ({ f }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#4a1631, #170612)" }}>
    <Titulo texto="⚠️ Aumentan el riesgo" f={f} y={560} color="#ffb03b" tam={70} />
    <Tarjeta f={f} inicio={20} x={460} y={780} icono="🚿" texto="Duchas vaginales" />
    <Tarjeta f={f} inicio={55} x={460} y={1060} icono="❤️" texto="Sexo sin condón" />
  </AbsoluteFill>
);

const EscenaLimon: React.FC<P> = ({ f }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#5a3a12, #1d1206)" }}>
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {/* limón */}
      <g transform={`translate(560 1000) rotate(${Math.sin(f / 9) * 6})`}>
        <circle r={170} fill="#ffe14d" stroke="#c99a00" strokeWidth={10} />
        <circle r={140} fill="#fff5a8" />
        {new Array(8).fill(0).map((_, i) => (
          <path key={i} d="M0 0 L 125 -50 A 135 135 0 0 1 125 50 Z" fill="#ffe14d" stroke="#fff5a8" strokeWidth={8}
            transform={`rotate(${i * 45})`} />
        ))}
      </g>
      {/* vinagre */}
      <g transform={`translate(880 1050) rotate(${Math.sin(f / 11 + 1) * 5})`}>
        <rect x={-30} y={-260} width={60} height={70} rx={10} fill="#3d2b1a" />
        <rect x={-75} y={-190} width={150} height={330} rx={40} fill="rgba(220,170,90,0.75)" stroke="#fff" strokeWidth={6} />
        <rect x={-60} y={-80} width={120} height={80} rx={10} fill="#fff" />
      </g>
    </svg>
    <Prohibido f={f} inicio={15} x={560} y={1000} r={230} />
    <Prohibido f={f} inicio={35} x={880} y={1000} r={170} />
  </AbsoluteFill>
);

const EscenaMedico: React.FC<P> = ({ f }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 10 } });
  const latido = 1 + Math.max(0, Math.sin(f / 6)) * 0.05;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#0f5a5a, #062626)" }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <g transform={`translate(700 950) scale(${s * latido})`}>
          <circle r={260} fill="rgba(255,255,255,0.1)" />
          <rect x={-70} y={-200} width={140} height={400} rx={24} fill="#fff" />
          <rect x={-200} y={-70} width={400} height={140} rx={24} fill="#fff" />
          <rect x={-55} y={-185} width={110} height={370} rx={18} fill="#ff4d6d" />
          <rect x={-185} y={-55} width={370} height={110} rx={18} fill="#ff4d6d" />
        </g>
        <g transform={`translate(860 1330) rotate(-30) scale(${spring({ frame: f - 25, fps, config: { damping: 10 } })})`}>
          <rect x={-120} y={-45} width={240} height={90} rx={45} fill="#fff" stroke="#0f5a5a" strokeWidth={6} />
          <path d="M 0 -45 L 75 -45 A 45 45 0 0 1 75 45 L 0 45 Z" fill="#3bc4ff" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const EscenaFinal: React.FC<P> = ({ f }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 10, fps, config: { damping: 9 } });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #ff4d8d, #7b2ff7)" }}>
      <div style={{
        position: "absolute", top: 900, left: 430, padding: "40px 70px", borderRadius: 80,
        background: "#fff", color: "#7b2ff7", fontFamily: "system-ui", fontWeight: 900, fontSize: 80,
        transform: `scale(${s * (1 + Math.sin(f / 5) * 0.03)})`, boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      }}>
        Seguir ➕
      </div>
    </AbsoluteFill>
  );
};

export const Ilustraciones: Record<Ilustracion, React.FC<P>> = {
  pez: EscenaPez,
  jabon: EscenaJabon,
  lacto: EscenaLacto,
  acido: EscenaAcido,
  invasion: EscenaInvasion,
  nombre: EscenaNombre,
  riesgo: EscenaRiesgo,
  limon: EscenaLimon,
  medico: EscenaMedico,
  final: EscenaFinal,
};
