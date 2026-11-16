import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useVideoConfig } from "remotion";
import { Dibujo } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1480) y los subtítulos arriba (y < 440).
const W = 1080;
const H = 1920;
const CX = 520;
const FUENTE = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const salida = Easing.bezier(0.22, 1, 0.36, 1);

const en = (i: Ilustracion, p: string) => ESCENARIOS[i].en(p);
const useResorte = () => {
  const { fps } = useVideoConfig();
  return (f: number, desde: number, damping = 11) => spring({ frame: f - desde, fps, config: { damping } });
};
const dinero = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

// ---------- piezas ----------

const Fondo: React.FC<{ a: string; b: string; f: number; puntos?: string }> = ({ a, b, f, puntos = "rgba(255,255,255,0.18)" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 45% 42%, ${a}, ${b} 75%)` }}>
    <svg width={W} height={H}>
      {Array.from({ length: 22 }, (_, i) => {
        const x = random(`fx${i}`) * W;
        const y = (random(`fy${i}`) * H - f * (0.6 + random(`fv${i}`) * 1.4) + H * 2) % H;
        return <circle key={i} cx={x} cy={y} r={4 + random(`fr${i}`) * 8} fill={puntos} />;
      })}
    </svg>
  </AbsoluteFill>
);

const Etiqueta: React.FC<{ texto: string; f: number; desde?: number; color?: string; fondo?: string; y?: number }> = ({
  texto,
  f,
  desde = 0,
  color = "#1a1a1a",
  fondo = "#ffd400",
  y = 470,
}) => {
  const r = useResorte()(f, desde, 12);
  return (
    <div style={{ position: "absolute", top: y, left: 0, width: W, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: fondo,
          color,
          fontFamily: FUENTE,
          fontWeight: 900,
          fontSize: 58,
          padding: "14px 40px",
          borderRadius: 999,
          letterSpacing: 2,
          transform: `scale(${r}) rotate(${-3 + Math.sin(f / 12) * 1.5}deg)`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

const Texto: React.FC<{
  children: React.ReactNode;
  f: number;
  desde: number;
  y: number;
  tam?: number;
  color?: string;
  x?: number;
  ancho?: number;
}> = ({ children, f, desde, y, tam = 100, color = "#fff", x = 40, ancho = W - 80 }) => {
  const r = useResorte()(f, desde, 10);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        width: ancho,
        textAlign: "center",
        fontFamily: FUENTE,
        fontWeight: 900,
        fontSize: tam,
        lineHeight: 1.02,
        color,
        opacity: Math.min(1, r * 2),
        transform: `scale(${0.4 + r * 0.6})`,
        textShadow: "0 8px 28px rgba(0,0,0,0.45)",
      }}
    >
      {children}
    </div>
  );
};

const Emoji: React.FC<{ e: string; x: number; y: number; tam: number; f: number; desde: number; giro?: number; flota?: number }> = ({
  e,
  x,
  y,
  tam,
  f,
  desde,
  giro = 0,
  flota = 10,
}) => {
  const r = useResorte()(f, desde, 9);
  return (
    <div
      style={{
        position: "absolute",
        left: x - tam / 2,
        top: y - tam / 2 + Math.sin((f + x) / 14) * flota,
        width: tam,
        height: tam,
        fontSize: tam * 0.86,
        lineHeight: `${tam}px`,
        textAlign: "center",
        transform: `scale(${r}) rotate(${giro + Math.sin(f / 10 + y) * 4}deg)`,
        filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.35))",
      }}
    >
      {e}
    </div>
  );
};

const Billete: React.FC<{ x: number; y: number; giro: number; s?: number }> = ({ x, y, giro, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`}>
    <rect x={-70} y={-34} width={140} height={68} rx={8} fill="#7bc67b" stroke="#2e7d32" strokeWidth={4} />
    <circle r={20} fill="#a5d6a7" stroke="#2e7d32" strokeWidth={3} />
    <text y={9} textAnchor="middle" fontSize={26} fontWeight={900} fill="#1b5e20" fontFamily={FUENTE}>
      $
    </text>
  </g>
);

const LluviaBilletes: React.FC<{ f: number; desde: number; n?: number }> = ({ f, desde, n = 18 }) => (
  <svg width={W} height={H} style={{ position: "absolute" }}>
    {Array.from({ length: n }, (_, i) => {
      const t = f - desde - i * 2;
      if (t < 0) return null;
      const y = -100 + ((t * (9 + random(`bv${i}`) * 6)) % (H + 200));
      const x = random(`bx${i}`) * W + Math.sin(t / 8 + i) * 40;
      return <Billete key={i} x={x} y={y} giro={t * (random(`bg${i}`) * 6 - 3)} s={0.9 + random(`bs${i}`) * 0.5} />;
    })}
  </svg>
);

// ---------- escenas ----------

const Gancho: Dibujo = ({ f }) => {
  const r = useResorte();
  const m = en("gancho", "millón");
  const n = interpolate(f, [4, m + 6], [0, 1_000_000], { ...clamp, easing: Easing.out(Easing.cubic) });
  const golpe = r(f, m + 6, 7);
  return (
    <AbsoluteFill>
      <Fondo a="#ffcf3f" b="#c76a00" f={f} puntos="rgba(255,255,255,0.35)" />
      <LluviaBilletes f={f} desde={m} n={22} />
      <Texto f={f} desde={0} y={300} tam={96}>
        ¿Y si HOY
        <br />
        ganaras…
      </Texto>
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 20,
          width: W - 40,
          textAlign: "center",
          fontFamily: FUENTE,
          fontWeight: 900,
          fontSize: 150,
          color: "#fff",
          WebkitTextStroke: "6px #1b5e20",
          textShadow: "0 14px 0 #1b5e20, 0 24px 40px rgba(0,0,0,0.45)",
          transform: `scale(${0.85 + golpe * 0.15}) rotate(${-4 + Math.sin(f / 6) * 1.2}deg)`,
        }}
      >
        {dinero(n)}
      </div>
      <Texto f={f} desde={m + 4} y={880} tam={110} color="#1b1b1b">
        <span style={{ background: "#fff", padding: "6px 30px", borderRadius: 24 }}>DÓLARES?</span>
      </Texto>
      <Emoji e="💰" x={300} y={1240} tam={300} f={f} desde={m + 2} giro={-10} />
      <Emoji e="🤑" x={640} y={1180} tam={220} f={f} desde={m + 8} giro={8} />
    </AbsoluteFill>
  );
};

const Grito: Dibujo = ({ f }) => {
  const c = en("grito", "corazón");
  const g = en("grito", "gritar.");
  const latido = f > c ? 1 + Math.max(0, Math.sin(((f - c) / 9) * Math.PI * 2)) ** 6 * 0.22 : 0;
  const temblor = f > g ? Math.sin(f * 3.1) * 10 : 0;
  // electrocardiograma
  const ecg = Array.from({ length: 60 }, (_, k) => {
    const x = k * 18;
    const fase = (k + Math.floor(f * 1.5)) % 15;
    const y = fase === 6 ? -140 : fase === 7 ? 90 : fase === 8 ? -40 : 0;
    return `${k === 0 ? "M" : "L"} ${x} ${1440 + (f > c ? y : 0)}`;
  }).join(" ");
  return (
    <AbsoluteFill>
      <Fondo a="#ff4d6d" b="#5c0018" f={f} />
      <Etiqueta texto="MINUTO 1" f={f} desde={0} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <path d={ecg} fill="none" stroke="#fff" strokeWidth={10} strokeLinejoin="round" opacity={0.85} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: CX - 230,
          top: 640,
          width: 460,
          height: 460,
          fontSize: 400,
          lineHeight: "460px",
          textAlign: "center",
          transform: `scale(${latido})`,
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
        }}
      >
        ❤️
      </div>
      <Texto f={f} desde={en("grito", "mil")} y={1110} tam={90}>
        <span style={{ color: "#ffd400" }}>×1000</span> BPM
      </Texto>
      <div style={{ position: "absolute", left: 0, top: 0, transform: `translateX(${temblor}px)` }}>
        <Texto f={f} desde={g} y={1530} tam={130} x={20} ancho={720}>
          ¡AAAAAH!
        </Texto>
      </div>
    </AbsoluteFill>
  );
};

const MENSAJES = [
  { de: "Primo Raúl", t: "¡Hola, querido primo! 😍", c: "#25d366" },
  { de: "Tu ex", t: "Te extraño… ¿café? ❤️", c: "#e91e63" },
  { de: "Compañero del cole", t: "¡Cuánto tiempo, amigo!", c: "#2196f3" },
  { de: "Número desconocido", t: "Tengo un negocio para ti 💼", c: "#ff9800" },
  { de: "Vecino", t: "¿Me prestas algo? 🙏", c: "#9c27b0" },
];

const Telefono: Dibujo = ({ f }) => {
  const r = useResorte();
  const desde = en("telefono", "teléfono");
  const entra = r(f, 2, 13);
  const cada = Math.max(7, (en("telefono", "amigos.") - desde) / MENSAJES.length);
  const llegados = MENSAJES.filter((_, i) => f >= desde + i * cada).length;
  const vibra = f > desde ? Math.sin(f * 2.4) * 3 : 0;
  return (
    <AbsoluteFill>
      <Fondo a="#4361ee" b="#10144a" f={f} />
      <Etiqueta texto="1 HORA DESPUÉS" f={f} desde={0} />
      <div
        style={{
          position: "absolute",
          left: CX - 270,
          top: 590,
          width: 540,
          height: 980,
          borderRadius: 70,
          background: "#111",
          border: "14px solid #2b2b2b",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
          transform: `translateY(${(1 - entra) * 900}px) rotate(${vibra}deg)`,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 120, background: "linear-gradient(#3a0ca3, #4361ee)", color: "#fff", fontFamily: FUENTE, fontWeight: 800, fontSize: 64, textAlign: "center", lineHeight: "120px" }}>
          12:07
        </div>
        {MENSAJES.map((m, i) => {
          const s = r(f, desde + i * cada, 12);
          return (
            <div
              key={i}
              style={{
                margin: "18px 18px 0",
                background: "#fff",
                borderRadius: 26,
                padding: "16px 20px",
                fontFamily: FUENTE,
                transform: `translateX(${(1 - s) * 600}px)`,
                opacity: s,
                borderLeft: `12px solid ${m.c}`,
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: m.c }}>{m.de}</div>
              <div style={{ fontSize: 34, fontWeight: 600, color: "#222" }}>{m.t}</div>
            </div>
          );
        })}
      </div>
      {/* contador de notificaciones */}
      <div
        style={{
          position: "absolute",
          left: CX + 200,
          top: 560,
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: "#ff1744",
          color: "#fff",
          fontFamily: FUENTE,
          fontWeight: 900,
          fontSize: 64,
          textAlign: "center",
          lineHeight: "130px",
          border: "8px solid #fff",
          transform: `scale(${llegados ? 1 + Math.max(0, 1 - ((f - desde) % cada) / 6) * 0.25 : 0})`,
        }}
      >
        {llegados * 37}
      </div>
    </AbsoluteFill>
  );
};

const Impuestos: Dibujo = ({ f }) => {
  const r = useResorte();
  const ti = en("impuestos", "impuestos");
  const tt = en("impuestos", "tercio.");
  const corte = interpolate(f, [ti, tt], [0, 0.37], { ...clamp, easing: salida });
  const queda = 1_000_000 * (1 - corte);
  const R = 300;
  const cy = 1000;
  const a = corte * Math.PI * 2;
  const sale = interpolate(f, [tt, tt + 20], [0, 60], clamp);
  const porcion = `M ${CX} ${cy} L ${CX} ${cy - R} A ${R} ${R} 0 ${a > Math.PI ? 1 : 0} 1 ${CX + Math.sin(a) * R} ${cy - Math.cos(a) * R} Z`;
  const resto = `M ${CX} ${cy} L ${CX + Math.sin(a) * R} ${cy - Math.cos(a) * R} A ${R} ${R} 0 ${a < Math.PI ? 1 : 0} 1 ${CX} ${cy - R} Z`;
  return (
    <AbsoluteFill>
      <Fondo a="#2a9d8f" b="#05302b" f={f} />
      <Etiqueta texto="⚠️ OJO" f={f} desde={en("impuestos", "ojo:")} fondo="#ff3d00" color="#fff" />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <circle cx={CX} cy={cy + 18} r={R} fill="rgba(0,0,0,0.3)" />
        {corte < 0.999 && <path d={corte > 0.001 ? resto : `M ${CX} ${cy} m -${R} 0 a ${R} ${R} 0 1 0 ${R * 2} 0 a ${R} ${R} 0 1 0 -${R * 2} 0`} fill="#7bc67b" stroke="#1b5e20" strokeWidth={8} />}
        {corte > 0.001 && (
          <g transform={`translate(${Math.sin(a / 2) * sale} ${-Math.cos(a / 2) * sale})`}>
            <path d={porcion} fill="#ff5252" stroke="#7f0000" strokeWidth={8} />
          </g>
        )}
      </svg>
      <Texto f={f} desde={ti} y={cy - 60} tam={84} x={CX - 200} ancho={400}>
        {dinero(queda)}
      </Texto>
      <div
        style={{
          position: "absolute",
          left: CX + 120,
          top: 610,
          transform: `scale(${r(f, ti + 6, 9)}) rotate(8deg)`,
          background: "#ff1744",
          color: "#fff",
          fontFamily: FUENTE,
          fontWeight: 900,
          fontSize: 60,
          padding: "10px 26px",
          borderRadius: 20,
          boxShadow: "0 12px 26px rgba(0,0,0,0.4)",
        }}
      >
        🏛️ IMPUESTOS
      </div>
      <Texto f={f} desde={tt} y={1360} tam={78} x={20} ancho={720}>
        hasta <span style={{ color: "#ffd400" }}>37 %</span> federal
        <br />
        <span style={{ fontSize: 54 }}>+ impuesto estatal</span>
      </Texto>
    </AbsoluteFill>
  );
};

const Gastos: Dibujo = ({ f }) => {
  const tm = en("gastos", "mansión");
  const ta = en("gastos", "auto");
  const te = en("gastos", "esfuma");
  const tme = en("gastos", "meses.");
  const nivel = interpolate(f, [ta + 4, tme + 6], [1, 0.03], { ...clamp, easing: Easing.in(Easing.quad) });
  const humo = interpolate(f, [te, te + 25], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Fondo a="#9b5de5" b="#24063f" f={f} />
      <Emoji e="🏰" x={300} y={720} tam={330} f={f} desde={tm} flota={6} />
      <Emoji e="🏎️" x={740} y={800} tam={290} f={f} desde={ta} flota={6} />
      {/* barra de dinero que se vacía */}
      <div style={{ position: "absolute", left: 90, top: 1100, width: 620, height: 120, borderRadius: 60, background: "rgba(255,255,255,0.15)", border: "8px solid #fff", overflow: "hidden" }}>
        <div style={{ width: `${nivel * 100}%`, height: "100%", background: nivel > 0.3 ? "#7bc67b" : "#ff5252", borderRadius: 60 }} />
      </div>
      <div style={{ position: "absolute", left: 90, top: 1240, width: 620, textAlign: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: 80, color: "#fff" }}>
        {dinero(630_000 * nivel)}
      </div>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {Array.from({ length: 8 }, (_, i) => {
          const t = humo * (1 + (i % 3) * 0.2);
          return <circle key={i} cx={150 + i * 75 + Math.sin(f / 9 + i) * 15} cy={1160 - t * 260} r={30 + t * 40} fill="rgba(255,255,255,0.35)" opacity={humo * (1 - t * 0.6)} />;
        })}
      </svg>
      <Texto f={f} desde={tme} y={1360} tam={100} x={20} ancho={720} color="#ffd400">
        ¡EN MESES!
      </Texto>
    </AbsoluteFill>
  );
};

const Loteria: Dibujo = ({ f }) => {
  const r = useResorte();
  const tl = en("loteria", "lotería");
  const ta = en("loteria", "acaban");
  const tp = en("loteria", "problemas");
  const linea = interpolate(f, [ta - 4, tp + 10], [0, 1], clamp);
  const pts = [
    [120, 820],
    [230, 760],
    [330, 800],
    [430, 900],
    [520, 1010],
    [610, 1150],
    [700, 1250],
  ];
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  return (
    <AbsoluteFill>
      <Fondo a="#3a86ff" b="#071a40" f={f} />
      <div
        style={{
          position: "absolute",
          left: CX - 300,
          top: 490,
          width: 600,
          height: 200,
          borderRadius: 24,
          background: "repeating-linear-gradient(90deg,#fff 0 30px,#fff3c4 30px 60px)",
          border: "8px dashed #e63946",
          fontFamily: FUENTE,
          fontWeight: 900,
          color: "#e63946",
          textAlign: "center",
          fontSize: 70,
          lineHeight: "184px",
          transform: `scale(${r(f, tl - 6, 10)}) rotate(${-5 + Math.sin(f / 10) * 2}deg)`,
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        🎟️ LOTERÍA
      </div>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <line x1={100} y1={1300} x2={760} y2={1300} stroke="rgba(255,255,255,0.5)" strokeWidth={6} />
        <line x1={100} y1={760} x2={100} y2={1300} stroke="rgba(255,255,255,0.5)" strokeWidth={6} />
        <path d={d} fill="none" stroke="#ff5252" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - linea} />
        <polygon points="690,1290 760,1250 700,1220" fill="#ff5252" opacity={linea > 0.97 ? 1 : 0} />
      </svg>
      <Emoji e="😰" x={820} y={900} tam={220} f={f} desde={tp} />
      <Texto f={f} desde={tp} y={1340} tam={70} x={20} ancho={720}>
        <span style={{ background: "#ff5252", padding: "4px 20px", borderRadius: 16 }}>problemas de dinero</span>
      </Texto>
    </AbsoluteFill>
  );
};

const Paso: React.FC<{ n: number; texto: string; f: number; desde: number; color: string }> = ({ n, texto, f, desde, color }) => {
  const r = useResorte()(f, desde, 12);
  return (
    <div
      style={{
        position: "absolute",
        top: 470,
        left: 0,
        width: W,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${(1 - r) * -200}px)`,
        opacity: r,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22, background: "#fff", borderRadius: 999, padding: "12px 38px 12px 12px", boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
        <div style={{ width: 92, height: 92, borderRadius: "50%", background: color, color: "#fff", fontFamily: FUENTE, fontWeight: 900, fontSize: 60, textAlign: "center", lineHeight: "92px" }}>{n}</div>
        <div style={{ fontFamily: FUENTE, fontWeight: 900, fontSize: 56, color: "#1a1a1a" }}>{texto}</div>
      </div>
    </div>
  );
};

const Deudas: Dibujo = ({ f }) => {
  const r = useResorte();
  const tp = en("deudas", "paga");
  const td = en("deudas", "deudas.");
  const tarjetas = [
    { t: "Tarjeta", x: 260, y: 820, g: -8 },
    { t: "Préstamo", x: 620, y: 900, g: 7 },
    { t: "Hipoteca", x: 340, y: 1170, g: 4 },
  ];
  return (
    <AbsoluteFill>
      <Fondo a="#06d6a0" b="#013a2c" f={f} />
      <Paso n={1} texto="PAGA TUS DEUDAS" f={f} desde={en("deudas", "inteligente:")} color="#06a77d" />
      {tarjetas.map((c, i) => {
        const entra = r(f, 4 + i * 5, 12);
        const sello = r(f, tp + 6 + i * ((td - tp) / 3), 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x - 200,
              top: c.y - 120,
              width: 400,
              height: 240,
              borderRadius: 26,
              background: "linear-gradient(135deg,#ef476f,#8d0b2f)",
              color: "#fff",
              fontFamily: FUENTE,
              fontWeight: 900,
              fontSize: 54,
              padding: 30,
              boxSizing: "border-box",
              transform: `scale(${entra}) rotate(${c.g}deg)`,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            DEUDA
            <div style={{ fontSize: 38, opacity: 0.85 }}>{c.t}</div>
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 70,
                border: "10px solid #00e676",
                color: "#00e676",
                background: "rgba(0,40,20,0.85)",
                borderRadius: 18,
                padding: "4px 20px",
                fontSize: 62,
                transform: `rotate(-14deg) scale(${sello ? 2.2 - sello * 1.2 : 0})`,
                opacity: sello,
              }}
            >
              PAGADA ✓
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Emergencias: Dibujo = ({ f }) => {
  const r = useResorte();
  const ts = en("emergencias", "seis");
  const te = en("emergencias", "emergencias.");
  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN"];
  return (
    <AbsoluteFill>
      <Fondo a="#f77f00" b="#4a1d00" f={f} />
      <Paso n={2} texto="FONDO DE EMERGENCIA" f={f} desde={0} color="#f77f00" />
      {meses.map((m, i) => {
        const s = r(f, ts + i * 4, 10);
        const x = 130 + (i % 3) * 230;
        const y = 680 + Math.floor(i / 3) * 260;
        return (
          <div
            key={m}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 200,
              height: 220,
              borderRadius: 24,
              background: "#fff",
              overflow: "hidden",
              transform: `scale(${s}) rotate(${(i % 2 ? 4 : -4) + Math.sin(f / 12 + i) * 2}deg)`,
              boxShadow: "0 14px 28px rgba(0,0,0,0.35)",
              fontFamily: FUENTE,
              textAlign: "center",
            }}
          >
            <div style={{ background: "#e63946", color: "#fff", fontWeight: 900, fontSize: 44, padding: 10 }}>{m}</div>
            <div style={{ fontSize: 100, lineHeight: "140px" }}>💵</div>
          </div>
        );
      })}
      <Emoji e="🛟" x={250} y={1380} tam={220} f={f} desde={te - 4} />
      <Texto f={f} desde={ts + 10} y={1290} tam={110} x={330} ancho={420} color="#ffd400">
        6 MESES
      </Texto>
    </AbsoluteFill>
  );
};

const Invertir: Dibujo = ({ f }) => {
  const r = useResorte();
  const ti = en("invertir", "invierte");
  const ta = en("invertir", "asesor");
  const barras = [0.25, 0.35, 0.42, 0.55, 0.66, 0.82];
  return (
    <AbsoluteFill>
      <Fondo a="#118ab2" b="#021c29" f={f} />
      <Paso n={3} texto="INVIERTE CON CALMA" f={f} desde={0} color="#118ab2" />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {barras.map((b, i) => {
          const s = interpolate(f, [ti + i * 5, ti + i * 5 + 14], [0, 1], { ...clamp, easing: salida });
          const alto = 560 * b * s;
          return <rect key={i} x={110 + i * 105} y={1260 - alto} width={78} height={alto} rx={14} fill={i === barras.length - 1 ? "#ffd166" : "#7bdff2"} />;
        })}
        <line x1={90} y1={1262} x2={760} y2={1262} stroke="#fff" strokeWidth={6} />
      </svg>
      <Emoji e="📈" x={250} y={720} tam={170} f={f} desde={ti} />
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 1320,
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "#fff",
          borderRadius: 30,
          padding: "16px 28px",
          transform: `scale(${r(f, ta - 3, 11)})`,
          transformOrigin: "left center",
          boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ fontSize: 90 }}>🤝</span>
        <span style={{ fontFamily: FUENTE, fontWeight: 900, fontSize: 52, color: "#0b3954" }}>
          Asesor de
          <br />
          confianza
        </span>
      </div>
    </AbsoluteFill>
  );
};

const Interes: Dibujo = ({ f }) => {
  const r = useResorte();
  const tc = en("interes", "cinco");
  const tt = en("interes", "treinta");
  const total = interpolate(f, [tt - 6, tt + 24], [0, 31_500], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Fondo a="#43aa8b" b="#082d22" f={f} />
      <LluviaBilletes f={f} desde={tt} n={9} />
      <div style={{ position: "absolute", top: 520, left: 0, width: W, textAlign: "center", fontFamily: FUENTE, fontWeight: 900, color: "#fff" }}>
        <div style={{ fontSize: 76, transform: `scale(${r(f, 0, 12)})` }}>{dinero(630_000)}</div>
        <div style={{ fontSize: 110, color: "#ffd400", transform: `scale(${r(f, tc, 9)})` }}>× 5 %</div>
        <div style={{ fontSize: 40, opacity: 0.8, transform: `scale(${r(f, tc + 6, 12)})` }}>(lo que te queda tras impuestos)</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 990,
          width: W - 120,
          borderRadius: 40,
          background: "#fff",
          textAlign: "center",
          fontFamily: FUENTE,
          fontWeight: 900,
          padding: "26px 0",
          transform: `scale(${r(f, tt - 6, 10)})`,
          boxShadow: "0 20px 44px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontSize: 150, color: "#1b5e20" }}>+{dinero(total)}</div>
        <div style={{ fontSize: 64, color: "#333" }}>al año 🎉</div>
      </div>
      <Texto f={f} desde={en("interes", "tocarlo.") - 4} y={1400} tam={64} x={20} ancho={720}>
        …sin tocar el dinero
      </Texto>
    </AbsoluteFill>
  );
};

const Secreto: Dibujo = ({ f }) => {
  const r = useResorte();
  const ti = en("secreto", "importante:");
  const tc = en("secreto", "cuentes");
  const tm = en("secreto", "mundo.");
  const gente = ["🧔", "👩", "👴", "🧑‍🦱", "👵", "🧑"];
  return (
    <AbsoluteFill>
      <Fondo a="#3c096c" b="#10002b" f={f} />
      <Etiqueta texto="LO MÁS IMPORTANTE" f={f} desde={ti} />
      <Emoji e="🤫" x={CX} y={820} tam={380} f={f} desde={2} flota={6} />
      {gente.map((g, i) => {
        const a = (i / gente.length) * Math.PI + Math.PI * 0.08;
        const s = r(f, tc + i * 2, 10);
        const fuera = interpolate(f, [tm, tm + 16], [1, 0], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: CX - 340 * Math.cos(a) - 60,
              top: 1220 - 120 * Math.sin(a),
              fontSize: 110,
              transform: `scale(${s * fuera})`,
              opacity: fuera,
            }}
          >
            {g}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: CX - 330,
          top: 1110,
          width: 660,
          height: 14,
          background: "#ff1744",
          borderRadius: 7,
          transform: `rotate(-12deg) scaleX(${interpolate(f, [tc + 8, tc + 18], [0, 1], clamp)})`,
        }}
      />
      <Texto f={f} desde={tc} y={1400} tam={66} x={10} ancho={740} color="#ffd400">
        ¡NO LO CUENTES!
      </Texto>
    </AbsoluteFill>
  );
};

const Final: Dibujo = ({ f }) => {
  const r = useResorte();
  const te = en("final", "Escríbelo");
  const opciones = [
    { e: "🏠", t: "Casa" },
    { e: "✈️", t: "Viajar" },
    { e: "📈", t: "Invertir" },
    { e: "🎁", t: "Familia" },
  ];
  return (
    <AbsoluteFill>
      <Fondo a="#ffbe0b" b="#b54a00" f={f} />
      <Texto f={f} desde={0} y={330} tam={100}>
        ¿Y TÚ qué
        <br />
        harías primero?
      </Texto>
      {opciones.map((o, i) => {
        const s = r(f, 6 + i * 5, 10);
        const x = 90 + (i % 2) * 340;
        const y = 640 + Math.floor(i / 2) * 300;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 300,
              height: 260,
              borderRadius: 36,
              background: "#fff",
              textAlign: "center",
              fontFamily: FUENTE,
              fontWeight: 900,
              fontSize: 50,
              color: "#333",
              transform: `scale(${s}) rotate(${Math.sin(f / 10 + i * 2) * 3}deg)`,
              boxShadow: "0 16px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 140, lineHeight: "180px" }}>{o.e}</div>
            {o.t}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 1290,
          width: 640,
          padding: "22px 30px",
          borderRadius: 40,
          background: "#1a1a1a",
          color: "#fff",
          fontFamily: FUENTE,
          fontWeight: 900,
          fontSize: 62,
          display: "flex",
          alignItems: "center",
          gap: 20,
          transform: `scale(${r(f, te - 3, 9)})`,
          transformOrigin: "left center",
          boxShadow: "0 18px 36px rgba(0,0,0,0.4)",
        }}
      >
        <span style={{ fontSize: 80 }}>💬</span> ¡Escríbelo abajo! 👇
      </div>
    </AbsoluteFill>
  );
};

export const Ilustraciones: Record<Ilustracion, Dibujo> = {
  gancho: Gancho,
  grito: Grito,
  telefono: Telefono,
  impuestos: Impuestos,
  gastos: Gastos,
  loteria: Loteria,
  deudas: Deudas,
  emergencias: Emergencias,
  invertir: Invertir,
  interes: Interes,
  secreto: Secreto,
  final: Final,
};
