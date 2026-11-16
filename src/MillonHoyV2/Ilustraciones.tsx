import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring } from "remotion";
import { Accion2D, Personaje2D } from "../comun/Personaje2D";
import { Dibujo } from "../comun/tipos";
import { ESCENARIOS, Escenario, Ilustracion } from "./escenas";

// Estilo de la referencia: fondo azul noche con cuadrícula y bokeh, objetos brillantes con degradados,
// marcador LED con dígitos que ruedan, una mano que toca las cosas y la cámara siempre en movimiento.
// Zonas: subtítulos arriba (y < 400) y avatar abajo a la derecha (x > 720, y > 1480).
const W = 1080;
const H = 1920;
const FUENTE = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const MONO = "'DejaVu Sans Mono', 'Courier New', monospace";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.45, 0, 0.55, 1);
const salida = Easing.bezier(0.22, 1, 0.36, 1);
const muelle = (f: number, desde: number, damping = 12) => spring({ frame: f - desde, fps: 30, config: { damping } });
const tramo = (f: number, a: number, b: number, e = suave) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });

// ---------- fondo y cámara ----------

const Fondo: React.FC<{ f: number; tono?: string }> = ({ f, tono = "#16307a" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${tono}, #071233 68%, #040a1f)` }}>
    <svg width={W} height={H} style={{ position: "absolute" }}>
      {Array.from({ length: 19 }, (_, i) => (
        <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={H} stroke="rgba(130,170,255,0.07)" strokeWidth={2} />
      ))}
      {Array.from({ length: 33 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 60} x2={W} y2={i * 60} stroke="rgba(130,170,255,0.07)" strokeWidth={2} />
      ))}
    </svg>
    {Array.from({ length: 16 }, (_, i) => {
      const colores = ["#4a7dff", "#a24dff", "#ff4d9d", "#4dd2ff"];
      const r = 40 + random(`br${i}`) * 90;
      const x = random(`bx${i}`) * W + Math.sin(f / 60 + i) * 30;
      const y = random(`by${i}`) * H + Math.cos(f / 70 + i) * 30;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - r,
            top: y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            background: colores[i % 4],
            opacity: 0.12 + 0.08 * Math.sin(f / 25 + i),
            filter: "blur(18px)",
          }}
        />
      );
    })}
  </AbsoluteFill>
);

type Toma = { s: number; x: number; y: number };
// Movimiento de cámara continuo: de una toma a otra durante la escena
const Camara: React.FC<{ f: number; dur: number; de: Toma; a: Toma; children: React.ReactNode }> = ({ f, dur, de, a, children }) => {
  const t = tramo(f, 0, dur);
  const s = de.s + (a.s - de.s) * t;
  const x = de.x + (a.x - de.x) * t;
  const y = de.y + (a.y - de.y) * t;
  return <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: "50% 45%" }}>{children}</AbsoluteFill>;
};

// ---------- piezas ----------

// Marcador LED con dígitos que ruedan como un cuentakilómetros
const LED: React.FC<{
  valor: number;
  digitos?: number;
  prefijo?: string;
  color?: string;
  icono?: string;
  etiqueta?: string;
  x: number;
  y: number;
  tam?: number;
  escala?: number;
  fuego?: number; // 0..1 llamas detrás
  f: number;
}> = ({ valor, digitos = 7, prefijo = "$", color = "#ff3b3b", icono, etiqueta, x, y, tam = 96, escala = 1, fuego = 0, f }) => {
  const alto = tam * 1.15;
  const ancho = tam * 0.62;
  const celdas: React.ReactNode[] = [];
  for (let k = digitos - 1; k >= 0; k--) {
    const cont = (valor / Math.pow(10, k)) % 10;
    const encendido = valor >= Math.pow(10, k) || k === 0;
    celdas.push(
      <div key={k} style={{ width: ancho, height: alto, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: -cont * alto, opacity: encendido ? 1 : 0.13 }}>
          {Array.from({ length: 11 }, (_, d) => (
            <div key={d} style={{ height: alto, lineHeight: `${alto}px`, textAlign: "center", width: ancho }}>
              {d % 10}
            </div>
          ))}
        </div>
      </div>,
    );
    if (k % 3 === 0 && k > 0) celdas.push(<div key={`c${k}`} style={{ width: tam * 0.22, height: alto, lineHeight: `${alto * 1.1}px`, opacity: valor >= Math.pow(10, k) ? 1 : 0.13 }}>,</div>);
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${escala})` }}>
      {fuego > 0 && <Llamas f={f} ancho={tam * digitos * 0.75} alto={tam * 2.2 * fuego} />}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 30px",
          borderRadius: 30,
          background: "linear-gradient(#26262e, #0b0b10)",
          border: "6px solid #34343e",
          boxShadow: "0 24px 50px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.9)",
        }}
      >
        <div style={{ display: "flex", fontFamily: MONO, fontWeight: 900, fontSize: tam, color, textShadow: `0 0 18px ${color}, 0 0 4px ${color}` }}>
          {prefijo && <div style={{ height: alto, lineHeight: `${alto}px`, marginRight: 6 }}>{prefijo}</div>}
          {celdas}
        </div>
        {icono && (
          <div style={{ textAlign: "center", fontFamily: FUENTE, fontWeight: 900, color, fontSize: tam * 0.26, lineHeight: 1 }}>
            <div style={{ fontSize: tam * 0.62, lineHeight: 1.1 }}>{icono}</div>
            {etiqueta}
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "linear-gradient(160deg, rgba(255,255,255,0.13), rgba(255,255,255,0) 45%)" }} />
      </div>
    </div>
  );
};

const Llamas: React.FC<{ f: number; ancho: number; alto: number }> = ({ f, ancho, alto }) => (
  <svg width={ancho} height={alto} style={{ position: "absolute", left: `calc(50% - ${ancho / 2}px)`, bottom: "40%", overflow: "visible" }}>
    <defs>
      <linearGradient id="llama" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ff3d00" />
        <stop offset="0.5" stopColor="#ff9100" />
        <stop offset="1" stopColor="#ffee58" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    {Array.from({ length: 9 }, (_, i) => {
      const cx = (i + 0.5) * (ancho / 9);
      const h = alto * (0.6 + 0.4 * Math.abs(Math.sin(f / 4 + i * 1.7)));
      const w = ancho / 6;
      return <path key={i} d={`M ${cx - w / 2} ${alto} Q ${cx - w / 2} ${alto - h * 0.5} ${cx + Math.sin(f / 3 + i) * 12} ${alto - h} Q ${cx + w / 2} ${alto - h * 0.5} ${cx + w / 2} ${alto} Z`} fill="url(#llama)" opacity={0.9} />;
    })}
  </svg>
);

// Mano con el índice estirado (punta en el origen, apuntando hacia arriba a la izquierda)
const Mano: React.FC<{ x: number; y: number; giro?: number; escala?: number; pulsa?: number }> = ({ x, y, giro = -35, escala = 1, pulsa = 0 }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
    <defs>
      <linearGradient id="piel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f6cfb2" />
        <stop offset="0.6" stopColor="#e8ad88" />
        <stop offset="1" stopColor="#c98563" />
      </linearGradient>
    </defs>
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala * (1 - pulsa * 0.06)})`} style={{ filter: "drop-shadow(0 18px 20px rgba(0,0,0,0.45))" }}>
      <rect x={-34} y={0} width={68} height={230} rx={34} fill="url(#piel)" />
      <path d="M -30 8 Q -26 -4 0 -6 Q 26 -4 30 8 L 30 40 L -30 40 Z" fill="#f7d9c4" opacity={0.6} />
      <rect x={-22} y={6} width={44} height={46} rx={20} fill="#fbe3d4" opacity={0.8} />
      <rect x={-80} y={170} width={180} height={230} rx={70} fill="url(#piel)" />
      <rect x={-74} y={190} width={50} height={120} rx={25} fill="#d99a76" opacity={0.5} />
      <rect x={-90} y={360} width={200} height={400} rx={40} fill="#3157c9" />
    </g>
  </svg>
);

const Billete: React.FC<{ x: number; y: number; giro: number; s?: number }> = ({ x, y, giro, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`}>
    <rect x={-70} y={-34} width={140} height={68} rx={6} fill="#8fd18f" stroke="#2e7d32" strokeWidth={3} />
    <rect x={-60} y={-24} width={120} height={48} rx={4} fill="none" stroke="#4c9a4c" strokeWidth={2} />
    <circle r={18} fill="#c8e6c9" stroke="#2e7d32" strokeWidth={2} />
    <text y={8} textAnchor="middle" fontSize={24} fontWeight={900} fill="#1b5e20" fontFamily={FUENTE}>
      $
    </text>
  </g>
);

const LluviaBilletes: React.FC<{ f: number; desde: number; n?: number }> = ({ f, desde, n = 16 }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    {Array.from({ length: n }, (_, i) => {
      const t = f - desde - i * 2;
      if (t < 0) return null;
      const y = -80 + t * (10 + random(`lv${i}`) * 6);
      if (y > H + 100) return null;
      const x = random(`lx${i}`) * W + Math.sin(t / 8 + i) * 40;
      return <Billete key={i} x={x} y={y} giro={t * (random(`lg${i}`) * 6 - 3)} s={0.8 + random(`ls${i}`) * 0.5} />;
    })}
  </svg>
);

const Moneda: React.FC<{ x: number; y: number; r?: number; giro?: number }> = ({ x, y, r = 34, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.15, Math.abs(Math.cos(giro)))} 1)`}>
    <circle r={r} fill="#e8a800" />
    <circle r={r * 0.86} fill="#ffcf33" />
    <circle r={r * 0.62} fill="none" stroke="#e8a800" strokeWidth={r * 0.1} />
    <text y={r * 0.3} textAnchor="middle" fontSize={r * 0.85} fontWeight={900} fill="#b07800" fontFamily={FUENTE}>
      $
    </text>
    <ellipse cx={-r * 0.3} cy={-r * 0.4} rx={r * 0.3} ry={r * 0.14} fill="#fff6c2" opacity={0.7} />
  </g>
);

const Pastilla: React.FC<{ f: number; desde: number; texto: string; x: number; y: number; color?: string; fondo?: string; tam?: number }> = ({
  f,
  desde,
  texto,
  x,
  y,
  color = "#fff",
  fondo = "rgba(20,30,70,0.85)",
  tam = 46,
}) => {
  if (f < desde) return null;
  const s = muelle(f, desde, 11);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s})`,
        background: fondo,
        color,
        fontFamily: FUENTE,
        fontWeight: 800,
        fontSize: tam,
        padding: "12px 28px",
        borderRadius: 999,
        border: "3px solid rgba(120,170,255,0.6)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};

const Paso: React.FC<{ n: number; f: number; x?: number; y?: number }> = ({ n, f, x = 150, y = 470 }) => {
  const s = muelle(f, 2, 10);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 60,
        top: y - 60,
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%, #6fb4ff, #1f5fd6)",
        border: "5px solid #bfe0ff",
        color: "#fff",
        fontFamily: FUENTE,
        fontWeight: 900,
        fontSize: 70,
        textAlign: "center",
        lineHeight: "110px",
        transform: `scale(${s})`,
        boxShadow: "0 0 40px rgba(77,163,255,0.6)",
      }}
    >
      {n}
    </div>
  );
};

// ---------- decorado recurrente: el salón de noche ----------

const Salon: React.FC<{ f: number; personaje?: React.ReactNode; vecinos?: number; cortina?: number }> = ({ f, personaje, vecinos = 0, cortina = 0 }) => {
  const minutos = f * 0.9;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(#2b1955, #1d1040 70%)" }} />
      {/* ventana con ciudad de noche */}
      <div style={{ position: "absolute", left: 80, top: 470, width: 540, height: 560, borderRadius: 18, background: "#c9b8ff", padding: 18, boxSizing: "border-box", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 8, background: "linear-gradient(#0a1a4a, #2a145e)" }}>
          <div style={{ position: "absolute", left: 340, top: 60, width: 90, height: 90, borderRadius: "50%", background: "#fff8d6", boxShadow: "0 0 60px 20px rgba(255,248,214,0.45)" }} />
          <div style={{ position: "absolute", left: 368, top: 52, width: 90, height: 90, borderRadius: "50%", background: "#0f1c4f" }} />
          <svg width={504} height={524} style={{ position: "absolute", left: 0, top: 0 }}>
            {Array.from({ length: 8 }, (_, i) => {
              const h = 160 + random(`ed${i}`) * 220;
              const x = i * 64 - 10;
              return (
                <g key={i}>
                  <rect x={x} y={524 - h} width={58} height={h} fill={i % 2 ? "#141a3d" : "#1b2150"} />
                  {Array.from({ length: Math.floor(h / 36) }, (_, k) =>
                    [0, 1].map((c) => (random(`v${i}${k}${c}`) > 0.45 ? <rect key={`${k}${c}`} x={x + 10 + c * 24} y={524 - h + 14 + k * 36} width={14} height={18} fill="#ffd56b" opacity={0.85} /> : null)),
                  )}
                </g>
              );
            })}
            {/* vecinos curiosos que se asoman */}
            {vecinos > 0 &&
              [90, 250, 410].map((x, i) => (
                <g key={i} transform={`translate(${x} ${524 - 150 * vecinos + Math.sin(f / 6 + i) * 6})`}>
                  <circle r={60} fill="#0b0f26" />
                  <rect x={-75} y={40} width={150} height={160} rx={60} fill="#0b0f26" />
                  <circle cx={-20} cy={-6} r={12} fill="#fff" />
                  <circle cx={20} cy={-6} r={12} fill="#fff" />
                  <circle cx={-16 + Math.sin(f / 9) * 4} cy={-6} r={6} fill="#111" />
                  <circle cx={24 + Math.sin(f / 9) * 4} cy={-6} r={6} fill="#111" />
                </g>
              ))}
          </svg>
          {/* cortinas que se cierran */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${50 * cortina + 8}%`, background: "repeating-linear-gradient(90deg,#b0306a 0 30px,#8c2254 30px 60px)" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${50 * cortina + 8}%`, background: "repeating-linear-gradient(90deg,#b0306a 0 30px,#8c2254 30px 60px)" }} />
        </div>
      </div>
      {/* reloj de pared */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform="translate(830 640)">
          <circle r={128} fill="#e53935" />
          <circle r={108} fill="#fafafa" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={-4} y={-98} width={8} height={18} fill="#333" transform={`rotate(${i * 30})`} />
          ))}
          <rect x={-5} y={-62} width={10} height={68} rx={5} fill="#222" transform={`rotate(${minutos / 12})`} />
          <rect x={-3} y={-88} width={6} height={94} rx={3} fill="#222" transform={`rotate(${minutos})`} />
          <circle r={9} fill="#e53935" />
          <circle cx={-90} cy={-110} r={34} fill="#e53935" />
          <circle cx={90} cy={-110} r={34} fill="#e53935" />
        </g>
        {/* suelo y alfombra */}
        <rect x={0} y={1380} width={W} height={H - 1380} fill="#2a1438" />
        <ellipse cx={460} cy={1600} rx={430} ry={110} fill="#d63c8c" />
        <ellipse cx={460} cy={1592} rx={360} ry={80} fill="#e85aa2" />
      </svg>
      {/* sofá con la persona */}
      <div style={{ position: "absolute", left: 110, top: 1060, width: 700, height: 300, borderRadius: "70px 70px 30px 30px", background: "linear-gradient(#f0628f, #c8336a)", boxShadow: "0 30px 50px rgba(0,0,0,0.45)" }} />
      <div style={{ position: "absolute", left: 110, top: 1250, width: 700, height: 160, borderRadius: 40, background: "linear-gradient(#e44a7f, #b02a5c)" }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 40 + i * 92, top: 40 + (i % 2) * 40, fontSize: 40, color: "#ff9ec4" }}>
            ♥
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 70, top: 1130, width: 120, height: 280, borderRadius: 50, background: "linear-gradient(#f0628f, #b02a5c)" }} />
      <div style={{ position: "absolute", left: 730, top: 1130, width: 120, height: 280, borderRadius: 50, background: "linear-gradient(#f0628f, #b02a5c)" }} />
      {personaje}
    </AbsoluteFill>
  );
};

// el protagonista ("tú") con su línea de tiempo de acciones
const Tu: React.FC<{ f: number; x: number; y: number; escala?: number; acciones: [number, Accion2D][]; mirar?: "derecha" | "izquierda" }> = (p) => <Personaje2D {...p} />;

// ---------- escenas ----------

const en = (i: Ilustracion, p: string) => ESCENARIOS[i].en(p);

// 1 · Salón de noche: el marcador sube hasta un millón
const gancho = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const m = en("gancho", "millón");
  const v = interpolate(f, [3, m + 4], [0, 1_000_000], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Camara f={f} dur={dur} de={{ s: 1.18, x: 0, y: 60 }} a={{ s: 1.04, x: 0, y: 0 }}>
        <Salon f={f} personaje={<Tu f={f} x={460} y={1650} escala={1.02} acciones={[[0, "telefono"], [m, "celebrar"]]} />} />
      </Camara>
      <LED f={f} valor={v} x={W / 2} y={560} color="#3dff7a" icono="💵" etiqueta="USD" tam={92} escala={0.4 + muelle(f, 0, 12) * 0.6} />
      <LluviaBilletes f={f} desde={m} n={18} />
    </AbsoluteFill>
  );
};

// 2 · Reloj inteligente en la muñeca: pulsaciones a mil
const grito = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const c = en("grito", "corazón");
  const g = en("grito", "gritar.");
  const bpm = interpolate(f, [c, c + 30], [72, 182], { ...clamp, easing: Easing.out(Easing.quad) });
  const late = 1 + Math.max(0, Math.sin((f / 30) * Math.PI * 2 * (bpm / 60))) ** 8 * 0.05;
  const ecg = Array.from({ length: 40 }, (_, k) => {
    const fase = (k + Math.floor(f * (bpm / 60))) % 10;
    const yy = fase === 4 ? -70 : fase === 5 ? 50 : fase === 6 ? -20 : 0;
    return `${k ? "L" : "M"} ${k * 11} ${100 + yy}`;
  }).join(" ");
  const tiembla = f > g ? Math.sin(f * 3) * 8 : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} tono="#3a1a6a" />
      <Camara f={f} dur={dur} de={{ s: 0.92, x: 0, y: 40 }} a={{ s: 1.08, x: tiembla, y: 0 }}>
        {/* antebrazo */}
        <div style={{ position: "absolute", left: -200, top: 760, width: 1100, height: 300, borderRadius: 150, background: "linear-gradient(#f2c3a2, #c98563)", transform: "rotate(-28deg)", boxShadow: "0 30px 50px rgba(0,0,0,0.45)" }} />
        {/* correa y caja del reloj */}
        <div style={{ position: "absolute", left: 340, top: 480, width: 300, height: 860, borderRadius: 60, background: "linear-gradient(90deg,#1a1a1a,#3a3a3a,#1a1a1a)", transform: "rotate(-28deg)" }} />
        <div
          style={{
            position: "absolute",
            left: 290,
            top: 680,
            width: 460,
            height: 430,
            borderRadius: 90,
            background: "linear-gradient(135deg,#e8e8ee,#8a8a96)",
            padding: 26,
            boxSizing: "border-box",
            transform: `rotate(-12deg) scale(${late})`,
            boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: 70, background: "#05070d", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 30, width: "100%", textAlign: "center", fontFamily: MONO, fontWeight: 900, fontSize: 110, color: "#ff3b5c", textShadow: "0 0 18px #ff3b5c" }}>
              {Math.round(bpm)}
            </div>
            <div style={{ position: "absolute", top: 160, width: "100%", textAlign: "center", fontFamily: FUENTE, fontWeight: 800, fontSize: 36, color: "#ff8fa3" }}>❤️ BPM</div>
            <svg width={408} height={200} style={{ position: "absolute", top: 190, left: 0 }}>
              <path d={ecg} fill="none" stroke="#3dffb0" strokeWidth={7} strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px #3dffb0)" }} />
            </svg>
          </div>
        </div>
      </Camara>
      <Pastilla f={f} desde={0} texto="⏱️ MINUTO 1" x={W / 2} y={490} />
      <Tu f={f} x={210} y={1870} escala={0.82} acciones={[[0, "sorpresa"], [g, "celebrar"]]} />
      {f > g && (
        <div style={{ position: "absolute", left: 620, top: 520, fontSize: 230, transform: `scale(${muelle(f, g, 8)}) rotate(${Math.sin(f) * 6}deg)`, filter: "drop-shadow(0 16px 20px rgba(0,0,0,0.4))" }}>😱</div>
      )}
      {f > g &&
        [0, 1, 2].map((k) => {
          const t = ((f - g + k * 8) % 24) / 24;
          return <div key={k} style={{ position: "absolute", left: 735 - t * 120, top: 635 - t * 120, width: 240 * t + 120, height: 240 * t + 120, borderRadius: "50%", border: "8px solid #ffd54a", opacity: 1 - t }} />;
        })}
    </AbsoluteFill>
  );
};

const MENSAJES = [
  { de: "Primo Raúl", t: "¡Hola, querido primo! 😍", c: "#25d366" },
  { de: "Tu ex", t: "Te extraño… ¿café? ❤️", c: "#e91e63" },
  { de: "Compañero del cole", t: "¡Cuánto tiempo, amigo!", c: "#2196f3" },
  { de: "Número desconocido", t: "Tengo un negocio 💼", c: "#ff9800" },
  { de: "Vecino", t: "¿Me prestas algo? 🙏", c: "#9c27b0" },
];

// 3 · Teléfono en la mano: no para de sonar
const telefono = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const desde = en("telefono", "teléfono");
  const cada = Math.max(7, (en("telefono", "amigos.") - desde) / MENSAJES.length);
  const llegados = MENSAJES.filter((_, i) => f >= desde + i * cada).length;
  const vibra = f > desde ? Math.sin(f * 2.6) * 2 : 0;
  const avisos = interpolate(f, [desde, en("telefono", "amigos.") + 8], [0, 148], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Camara f={f} dur={dur} de={{ s: 0.95, x: 0, y: 40 }} a={{ s: 1.05, x: 0, y: -20 }}>
        <div
          style={{
            position: "absolute",
            left: 400,
            top: 650,
            width: 500,
            height: 900,
            borderRadius: 80,
            background: "linear-gradient(135deg,#3a3a44,#121216)",
            padding: 20,
            boxSizing: "border-box",
            transform: `rotate(${vibra - 4}deg)`,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: 62, background: "linear-gradient(#1c2f7a, #3b1d6e)", overflow: "hidden", position: "relative" }}>
            <div style={{ textAlign: "center", color: "#fff", fontFamily: FUENTE, fontWeight: 300, fontSize: 110, marginTop: 50 }}>12:07</div>
            {MENSAJES.map((m, i) => {
              const s = muelle(f, desde + i * cada, 13);
              return (
                <div
                  key={i}
                  style={{
                    margin: "16px 22px 0",
                    background: "rgba(255,255,255,0.92)",
                    borderRadius: 26,
                    padding: "14px 20px",
                    fontFamily: FUENTE,
                    transform: `translateY(${(1 - s) * -60}px)`,
                    opacity: s,
                    borderLeft: `12px solid ${m.c}`,
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 800, color: m.c }}>{m.de}</div>
                  <div style={{ fontSize: 33, fontWeight: 600, color: "#222" }}>{m.t}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Camara>
      <Tu f={f} x={210} y={1870} escala={0.8} acciones={[[0, "telefono"], [en("telefono", "repente"), "sorpresa"], [en("telefono", "amigos."), "contento"]]} />
      <LED f={f} valor={avisos} digitos={3} prefijo="" x={W / 2 + 110} y={540} color="#ff4d6d" icono="🔔" etiqueta="AVISOS" tam={88} escala={muelle(f, 0, 12) * (1 + (llegados ? Math.max(0, 1 - ((f - desde) % cada) / 6) * 0.06 : 0))} />
    </AbsoluteFill>
  );
};

// 4 · Montaña de billetes en la mesa: los impuestos se llevan un tercio
const impuestos = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const ti = en("impuestos", "impuestos");
  const tt = en("impuestos", "tercio.");
  const v = interpolate(f, [ti, tt + 6], [1_000_000, 630_000], { ...clamp, easing: suave });
  const llega = tramo(f, ti - 10, ti + 4, salida);
  const lleva = tramo(f, ti + 8, tt + 4);
  const manoX = interpolate(llega, [0, 1], [1250, 780]) + lleva * 520;
  const fajos = Array.from({ length: 12 }, (_, i) => ({ col: i % 4, fila: Math.floor(i / 4) }));
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Camara f={f} dur={dur} de={{ s: 1.02, x: 0, y: 0 }} a={{ s: 1.1, x: -20, y: -30 }}>
        {/* mesa */}
        <div style={{ position: "absolute", left: -40, top: 1200, width: W + 80, height: 120, background: "linear-gradient(#a0643a,#6e3f1f)", borderRadius: 20, boxShadow: "0 30px 50px rgba(0,0,0,0.5)" }} />
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {fajos.map(({ col, fila }, i) => {
            const seVa = fila === 2 && col < 4 ? 1 : 0; // la fila de arriba se la llevan
            const dx = seVa ? lleva * 520 : 0;
            const x = 170 + col * 170 + fila * 30 + dx;
            const y = 1150 - fila * 80;
            return (
              <g key={i} transform={`translate(${x} ${y})`} opacity={seVa && lleva > 0.95 ? 0 : 1}>
                <rect x={-80} y={-40} width={160} height={80} rx={10} fill="#5f9e5f" />
                <rect x={-80} y={-50} width={160} height={60} rx={10} fill="#8fd18f" stroke="#2e7d32" strokeWidth={3} />
                <rect x={-22} y={-50} width={44} height={60} fill="#f3e3a2" />
                <rect x={-70} y={-46} width={50} height={10} rx={5} fill="#c8f0c8" opacity={0.7} />
              </g>
            );
          })}
        </svg>
        <Mano x={manoX} y={960} giro={-80} escala={1} />
      </Camara>
      <Pastilla f={f} desde={ti + 4} texto="🏛️ IMPUESTOS" x={manoX - 40} y={860} fondo="#c62828" />
      <LED f={f} valor={v} x={W / 2} y={560} color={f > ti ? "#ff3b3b" : "#3dff7a"} icono="💵" etiqueta="USD" tam={88} escala={muelle(f, 0, 12)} />
      <Pastilla f={f} desde={tt} texto="hasta 37 % federal + estatal" x={W / 2 + 60} y={1420} tam={40} />
      <Tu f={f} x={200} y={1870} escala={0.8} acciones={[[0, "contento"], [ti, "alarma"], [tt, "triste"]]} />
    </AbsoluteFill>
  );
};

// 5 · Mansión y deportivo con su precio: el saldo arde hasta cero
const gastos = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const tm = en("gastos", "mansión");
  const ta = en("gastos", "auto");
  const te = en("gastos", "esfuma");
  const tme = en("gastos", "meses.");
  const v = 630_000 - 400_000 * tramo(f, tm, tm + 12) - 150_000 * tramo(f, ta, ta + 12) - 80_000 * tramo(f, te, tme + 4);
  const Articulo = ({ e, precio, x, desde }: { e: string; precio: string; x: number; desde: number }) => {
    const s = muelle(f, desde, 10);
    return (
      <div style={{ position: "absolute", left: x - 190, top: 880, width: 380, textAlign: "center", transform: `scale(${s}) translateY(${Math.sin(f / 12 + x) * 8}px)` }}>
        <div style={{ fontSize: 250, lineHeight: "300px", filter: "drop-shadow(0 20px 24px rgba(0,0,0,0.5))" }}>{e}</div>
        <div style={{ display: "inline-block", fontFamily: MONO, fontWeight: 900, fontSize: 56, color: "#ffcf33", background: "linear-gradient(#26262e,#0b0b10)", border: "4px solid #34343e", borderRadius: 18, padding: "6px 20px", textShadow: "0 0 12px #ffcf33" }}>
          {precio}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Fondo f={f} tono="#3a1a6a" />
      <Camara f={f} dur={dur} de={{ s: 1, x: 0, y: 0 }} a={{ s: 1.08, x: 0, y: -20 }}>
        <div style={{ position: "absolute", left: -40, top: 1290, width: W + 80, height: 100, background: "linear-gradient(#5b3a8a,#2e1a52)", borderRadius: 20 }} />
        <Articulo e="🏰" precio="$400K" x={420} desde={tm - 2} />
        <Articulo e="🏎️" precio="$150K" x={790} desde={ta - 2} />
      </Camara>
      <Tu f={f} x={190} y={1870} escala={0.8} acciones={[[0, "reposo"], [tm - 4, "senalar"], [te - 2, "alarma"], [tme, "sorpresa"]]} />
      <LED f={f} valor={Math.max(0, v)} x={W / 2} y={570} color={f > te ? "#ff3b3b" : "#3dff7a"} icono={f > te ? "🔥" : "💵"} etiqueta="USD" tam={88} fuego={tramo(f, te - 4, te + 10)} escala={muelle(f, 0, 12)} />
      {f > te &&
        Array.from({ length: 10 }, (_, i) => {
          const t = (f - te - i * 3) / 30;
          if (t < 0 || t > 1) return null;
          return (
            <div key={i} style={{ position: "absolute", left: 300 + random(`h${i}`) * 480, top: 520 - t * 300, width: 80 + t * 80, height: 80 + t * 80, borderRadius: "50%", background: "rgba(160,160,180,0.35)", filter: "blur(8px)", opacity: 1 - t }} />
          );
        })}
    </AbsoluteFill>
  );
};

// 6 · Cuadrícula de boletos: muchos ganadores acaban mal
const loteria = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const tl = en("loteria", "lotería");
  const ta = en("loteria", "acaban");
  const tp = en("loteria", "problemas");
  const malos = [0, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 18, 19, 20];
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Camara f={f} dur={dur} de={{ s: 1.0, x: 40, y: -30 }} a={{ s: 0.92, x: 50, y: -40 }}>
        {Array.from({ length: 21 }, (_, i) => {
          const col = i % 3;
          const fila = Math.floor(i / 3);
          const s = muelle(f, tl - 10 + i * 1.2, 12);
          const k = malos.indexOf(i);
          const apaga = k >= 0 ? tramo(f, ta + k * 1.6, ta + k * 1.6 + 8) : 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 170 + col * 250,
                top: 470 + fila * 140,
                width: 210,
                height: 110,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${apaga > 0.5 ? "#555a6e" : "#ffd84d"}, ${apaga > 0.5 ? "#2c2f3d" : "#ff9f1c"})`,
                border: "4px dashed rgba(255,255,255,0.6)",
                transform: `scale(${s}) rotate(${Math.sin(i * 2.3) * 4}deg)`,
                boxShadow: apaga > 0.5 ? "none" : "0 0 30px rgba(255,200,60,0.55)",
                fontSize: 64,
                textAlign: "center",
                lineHeight: "102px",
                filter: `saturate(${1 - apaga * 0.8})`,
              }}
            >
              {apaga > 0.5 ? "😟" : "🎟️"}
            </div>
          );
        })}
      </Camara>
      <Pastilla f={f} desde={tp} texto="💸 problemas de dinero" x={W / 2 + 80} y={1520} fondo="#c62828" tam={48} />
      <Tu f={f} x={170} y={1880} escala={0.72} acciones={[[0, "pensar"], [ta, "triste"]]} />
    </AbsoluteFill>
  );
};

// 7 · Tarjetas de crédito: un dedo pulsa PAGAR y se parten
const deudas = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const tp = en("deudas", "paga");
  const td = en("deudas", "deudas.");
  const v = interpolate(f, [tp + 4, td + 6], [45_000, 0], { ...clamp, easing: suave });
  const llega = tramo(f, tp - 14, tp, salida);
  const pulsa = interpolate(f, [tp, tp + 3, tp + 8], [0, 1, 0], clamp);
  const colores = [
    ["#7e57c2", "#3b1f7a"],
    ["#1e88e5", "#0b3d91"],
    ["#ef6c00", "#8a3200"],
  ];
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Camara f={f} dur={dur} de={{ s: 1, x: 0, y: 0 }} a={{ s: 1.06, x: 0, y: -10 }}>
        {colores.map(([a, b], i) => {
          const corte = tramo(f, tp + 8 + i * 6, tp + 18 + i * 6);
          const base = { left: 250 + i * 40, top: 700 + i * 140, rot: -10 + i * 8 };
          const mitad = (lado: -1 | 1) => (
            <div
              style={{
                position: "absolute",
                left: base.left + (lado === 1 ? 300 : 0) + lado * corte * 60,
                top: base.top + corte * 90,
                width: 300,
                height: 380 * 0.95,
                overflow: "hidden",
                transform: `rotate(${base.rot + lado * corte * 25}deg)`,
                transformOrigin: lado === 1 ? "0% 50%" : "100% 50%",
                opacity: 1 - corte * 0.45,
                filter: `grayscale(${corte})`,
              }}
            >
              <div style={{ position: "absolute", left: lado === 1 ? -300 : 0, top: 0, width: 600, height: 360, borderRadius: 34, background: `linear-gradient(135deg, ${a}, ${b})`, boxShadow: "0 24px 40px rgba(0,0,0,0.5)" }}>
                <div style={{ position: "absolute", left: 50, top: 110, width: 100, height: 76, borderRadius: 12, background: "linear-gradient(135deg,#ffe08a,#c9a03a)" }} />
                <div style={{ position: "absolute", left: 50, top: 230, fontFamily: MONO, fontSize: 40, color: "rgba(255,255,255,0.9)", letterSpacing: 4 }}>•••• •••• •••• 4{i}21</div>
                <div style={{ position: "absolute", right: 40, top: 36, fontFamily: FUENTE, fontWeight: 900, fontSize: 40, color: "#fff" }}>DEUDA</div>
                <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "linear-gradient(160deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 40%)" }} />
              </div>
            </div>
          );
          return (
            <React.Fragment key={i}>
              {mitad(-1)}
              {mitad(1)}
            </React.Fragment>
          );
        })}
        {/* botón PAGAR */}
        <div
          style={{
            position: "absolute",
            left: 420,
            top: 1330,
            width: 320,
            height: 120,
            borderRadius: 60,
            background: f > tp ? "linear-gradient(#3ddc84,#1b9e55)" : "linear-gradient(#ff5252,#c62828)",
            color: "#fff",
            fontFamily: FUENTE,
            fontWeight: 900,
            fontSize: 60,
            textAlign: "center",
            lineHeight: "120px",
            transform: `scale(${1 - pulsa * 0.08})`,
            boxShadow: `0 ${14 - pulsa * 10}px 0 rgba(0,0,0,0.35), 0 0 40px ${f > tp ? "rgba(61,220,132,0.6)" : "rgba(255,82,82,0.5)"}`,
          }}
        >
          {f > td ? "✓ PAGADO" : "PAGAR"}
        </div>
        <Mano x={interpolate(llega, [0, 1], [1000, 680])} y={interpolate(llega, [0, 1], [1900, 1400]) + pulsa * 14} giro={-30} pulsa={pulsa} />
      </Camara>
      <Paso n={1} f={f} />
      <Tu f={f} x={180} y={1870} escala={0.78} acciones={[[0, "senalar"], [tp, "contento"], [td, "celebrar"]]} />
      <LED f={f} valor={v} digitos={5} x={W / 2 + 60} y={520} color={f > td ? "#3dff7a" : "#ff3b3b"} icono="💳" etiqueta="DEUDA" tam={84} escala={muelle(f, 0, 12)} />
    </AbsoluteFill>
  );
};

// 8 · Frasco de cristal que se llena de monedas y calendario de 6 meses
const emergencias = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const ts = en("emergencias", "seis");
  const te = en("emergencias", "emergencias.");
  const nivel = tramo(f, ts - 6, te + 6);
  const mes = Math.min(6, Math.max(0, Math.floor(interpolate(f, [ts, ts + 24], [0, 6.99], clamp))));
  const MESES = ["", "ENE", "FEB", "MAR", "ABR", "MAY", "JUN"];
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Camara f={f} dur={dur} de={{ s: 0.96, x: 90, y: -60 }} a={{ s: 1.0, x: 70, y: -80 }}>
        {/* frasco */}
        <div style={{ position: "absolute", left: 120, top: 760, width: 460, height: 640, borderRadius: "60px 60px 80px 80px", background: "rgba(180,220,255,0.12)", border: "8px solid rgba(200,230,255,0.55)", overflow: "hidden", boxShadow: "inset 0 0 40px rgba(180,220,255,0.25)" }}>
          <svg width={460} height={640} style={{ position: "absolute", left: -8, top: -8 }}>
            {Array.from({ length: 40 }, (_, i) => {
              const filaN = Math.floor(i / 5);
              const visible = i / 40 < nivel;
              if (!visible) return null;
              const x = 60 + (i % 5) * 85 + (filaN % 2) * 40;
              const y = 600 - filaN * 62;
              return <Moneda key={i} x={x} y={y} r={40} giro={0.4} />;
            })}
          </svg>
          <div style={{ position: "absolute", left: 30, top: 30, width: 50, height: 520, borderRadius: 25, background: "rgba(255,255,255,0.22)" }} />
        </div>
        <div style={{ position: "absolute", left: 150, top: 720, width: 400, height: 70, borderRadius: 20, background: "linear-gradient(#c9a03a,#8a6a1a)" }} />
        <div style={{ position: "absolute", left: 180, top: 1160, width: 340, padding: "12px 0", borderRadius: 14, background: "#fff6d6", textAlign: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: 40, color: "#8a3200" }}>EMERGENCIAS</div>
        {/* monedas cayendo dentro */}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 8 }, (_, i) => {
            const t = (f - (ts - 6) - i * 4) / 12;
            if (t < 0 || t > 1) return null;
            return <Moneda key={i} x={350 + Math.sin(i) * 60} y={560 + t * 500} r={40} giro={f / 3 + i} />;
          })}
        </svg>
        {/* calendario */}
        <div style={{ position: "absolute", left: 640, top: 780, width: 300, height: 320, borderRadius: 26, background: "#fff", overflow: "hidden", boxShadow: "0 24px 40px rgba(0,0,0,0.5)", transform: `rotate(6deg) scale(${muelle(f, 4, 12)})` }}>
          <div style={{ height: 90, background: "linear-gradient(#ff5252,#c62828)", color: "#fff", fontFamily: FUENTE, fontWeight: 900, fontSize: 54, textAlign: "center", lineHeight: "90px" }}>{MESES[mes] || "HOY"}</div>
          <div style={{ fontFamily: FUENTE, fontWeight: 900, fontSize: 150, textAlign: "center", color: "#222", lineHeight: "220px" }}>{mes}</div>
        </div>
      </Camara>
      <Paso n={2} f={f} />
      <Tu f={f} x={170} y={1870} escala={0.78} acciones={[[0, "hablar"], [ts, "senalar"], [en("emergencias", "emergencias."), "contento"]]} />
      <Pastilla f={f} desde={ts + 10} texto="📅 6 meses de gastos" x={W / 2} y={560} tam={50} />
    </AbsoluteFill>
  );
};

// 9 · Árbol del dinero que crece en su maceta, con calma
const invertir = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const ti = en("invertir", "invierte");
  const ta = en("invertir", "asesor");
  const crece = tramo(f, ti - 4, ta + 10, Easing.out(Easing.quad));
  const hojas = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2, r: 120 + (i % 3) * 70, d: i / 14 }));
  return (
    <AbsoluteFill>
      <Fondo f={f} tono="#124a5a" />
      <Camara f={f} dur={dur} de={{ s: 0.95, x: 110, y: -20 }} a={{ s: 1.0, x: 100, y: -50 }}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={`M 430 1300 C 430 ${1300 - 300 * crece} 470 ${1300 - 450 * crece} 450 ${1300 - 560 * crece}`} stroke="#6b4a2a" strokeWidth={34} fill="none" strokeLinecap="round" />
          {hojas.map((h, i) => {
            const s = tramo(f, ti + h.d * 40, ti + h.d * 40 + 12, salida);
            if (s <= 0) return null;
            const cx = 450 + Math.cos(h.a) * h.r * crece;
            const cy = 1300 - 560 * crece + Math.sin(h.a) * h.r * 0.7 * crece;
            return (
              <g key={i} transform={`translate(${cx} ${cy}) rotate(${(h.a * 180) / Math.PI + Math.sin(f / 15 + i) * 8}) scale(${s})`}>
                <ellipse rx={70} ry={38} fill={i % 2 ? "#4caf50" : "#66bb6a"} />
                <text y={12} textAnchor="middle" fontSize={34} fontWeight={900} fill="#1b5e20" fontFamily={FUENTE}>
                  $
                </text>
              </g>
            );
          })}
          {[0, 1, 2].map((k) => {
            const s = tramo(f, ta - 10 + k * 6, ta + k * 6, salida);
            return s > 0 ? <Moneda key={k} x={360 + k * 90} y={1300 - 560 * crece + 40 + (k % 2) * 60} r={36 * s} giro={f / 8 + k} /> : null;
          })}
        </svg>
        <div style={{ position: "absolute", left: 270, top: 1280, width: 360, height: 220, borderRadius: "20px 20px 90px 90px", background: "linear-gradient(#e0703a,#a6431a)", boxShadow: "0 24px 40px rgba(0,0,0,0.5)" }} />
        <div style={{ position: "absolute", left: 250, top: 1260, width: 400, height: 60, borderRadius: 20, background: "linear-gradient(#f0854a,#c0562a)" }} />
      </Camara>
      <Paso n={3} f={f} />
      <Tu f={f} x={170} y={1870} escala={0.78} acciones={[[0, "reposo"], [ti, "senalar"], [ta, "hablar"]]} />
      <Pastilla f={f} desde={ti} texto="📈 con calma, a largo plazo" x={W / 2 + 60} y={480} tam={44} />
      <Pastilla f={f} desde={ta} texto="🤝 asesor de confianza" x={W / 2} y={620} tam={48} fondo="#ffffff" color="#0b3954" />
    </AbsoluteFill>
  );
};

// 10 · Cronómetro de un año: un dedo lo pone en marcha y caen los intereses
const interes = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const tc = en("interes", "cinco");
  const tt = en("interes", "treinta");
  const arranca = Math.max(0, tc - 8);
  const pulsa = interpolate(f, [arranca, arranca + 3, arranca + 8], [0, 1, 0], clamp);
  const llega = tramo(f, 0, arranca, salida);
  const sale = tramo(f, arranca + 8, arranca + 20);
  const giro = tramo(f, arranca + 4, tt + 26, Easing.inOut(Easing.quad));
  const ganado = interpolate(f, [arranca + 4, tt + 26], [0, 31_500], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const R = 260;
  const cx = 470;
  const cy = 1000;
  const a = giro * Math.PI * 2;
  const arco = `M ${cx} ${cy - R + 30} A ${R - 30} ${R - 30} 0 ${a > Math.PI ? 1 : 0} 1 ${cx + Math.sin(a) * (R - 30)} ${cy - Math.cos(a) * (R - 30)}`;
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Camara f={f} dur={dur} de={{ s: 0.96, x: 0, y: 20 }} a={{ s: 1.08, x: 0, y: -10 }}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id="cromado" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f4f4f8" />
              <stop offset="0.5" stopColor="#9a9aa6" />
              <stop offset="1" stopColor="#e2e2ea" />
            </linearGradient>
          </defs>
          <rect x={cx - 34} y={cy - R - 90 + pulsa * 14} width={68} height={70} rx={12} fill="url(#cromado)" />
          <circle cx={cx} cy={cy - R - 100 + pulsa * 14} r={44} fill="none" stroke="url(#cromado)" strokeWidth={16} />
          <circle cx={cx} cy={cy} r={R + 24} fill="url(#cromado)" />
          <circle cx={cx} cy={cy} r={R} fill="#fbfbfb" />
          {a > 0.01 && <path d={arco} stroke="#3ddc84" strokeWidth={56} fill="none" opacity={0.85} />}
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${i * 30})`}>
              <rect x={-4} y={-R + 8} width={8} height={30} fill="#333" />
              <text y={-R + 80} textAnchor="middle" fontSize={34} fontWeight={700} fill="#444" fontFamily={FUENTE} transform={`rotate(${-i * 30} 0 ${-R + 70})`}>
                {["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
              </text>
            </g>
          ))}
          <g transform={`translate(${cx} ${cy}) rotate(${giro * 360})`}>
            <rect x={-6} y={-R + 40} width={12} height={R - 20} rx={6} fill="#e53935" />
          </g>
          <circle cx={cx} cy={cy} r={20} fill="#e53935" />
          <rect x={cx - 100} y={cy + 90} width={200} height={64} rx={10} fill="#0b0b10" />
          <text x={cx} y={cy + 136} textAnchor="middle" fontSize={40} fontWeight={900} fill="#3dff7a" fontFamily={MONO}>
            {`${Math.floor(giro * 12)
              .toString()
              .padStart(2, "0")} MES`}
          </text>
        </svg>
        <Mano x={cx + 30 + sale * 500} y={cy - R - 130 + pulsa * 14 - (1 - llega) * 400} giro={-150} pulsa={pulsa} />
      </Camara>
      <Pastilla f={f} desde={tc} texto="$630.000 × 5 % al año" x={W / 2} y={480} tam={46} />
      <Tu f={f} x={160} y={1880} escala={0.7} acciones={[[0, "pensar"], [tt, "celebrar"], [en("interes", "tocarlo.") - 2, "contento"]]} />
      <LED f={f} valor={ganado} digitos={5} prefijo="+$" x={W / 2 + 90} y={1430} color="#3dff7a" icono="💰" etiqueta="AL AÑO" tam={82} escala={muelle(f, tt - 6, 12)} />
    </AbsoluteFill>
  );
};

// 11 · Salón de noche: los vecinos se asoman… y cierras las cortinas
const secreto = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const ti = en("secreto", "importante:");
  const tc = en("secreto", "cuentes");
  return (
    <AbsoluteFill>
      <Camara f={f} dur={dur} de={{ s: 1.12, x: 40, y: 100 }} a={{ s: 1.25, x: 110, y: 200 }}>
        <Salon f={f} vecinos={tramo(f, 0, ti + 6, salida)} cortina={tramo(f, tc + 2, tc + 22)} personaje={<Tu f={f} x={460} y={1650} escala={1.02} acciones={[[0, "sorpresa"], [ti, "silencio"]]} />} />
      </Camara>
      <Pastilla f={f} desde={tc} texto="🔒 que nadie se entere" x={W / 2} y={500} tam={46} />
    </AbsoluteFill>
  );
};

// 12 · Salón de noche: ¿y tú qué harías primero?
const final = ({ dur }: Escenario): Dibujo => ({ f }) => {
  const te = en("final", "Escríbelo");
  const opciones = [
    { e: "🏠", x: 190, y: 560 },
    { e: "✈️", x: 400, y: 500 },
    { e: "📈", x: 620, y: 520 },
    { e: "🎁", x: 840, y: 580 },
  ];
  return (
    <AbsoluteFill>
      <Camara f={f} dur={dur} de={{ s: 1.15, x: 0, y: 60 }} a={{ s: 1.0, x: 0, y: 0 }}>
        <Salon f={f} personaje={<Tu f={f} x={460} y={1650} escala={1.02} acciones={[[0, "pensar"], [en("final", "Escríbelo") - 4, "saludar"]]} />} />
      </Camara>
      {opciones.map((o, i) => {
        const s = muelle(f, 4 + i * 5, 10);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: o.x - 85,
              top: o.y - 85 + Math.sin(f / 10 + i) * 10,
              width: 170,
              height: 170,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), rgba(60,90,200,0.55))",
              border: "4px solid rgba(160,200,255,0.8)",
              fontSize: 96,
              lineHeight: "162px",
              textAlign: "center",
              transform: `scale(${s})`,
              boxShadow: "0 0 30px rgba(77,163,255,0.5)",
            }}
          >
            {o.e}
          </div>
        );
      })}
      <Pastilla f={f} desde={te - 2} texto="💬 Escríbelo en los comentarios 👇" x={W / 2 - 40} y={1460} tam={46} fondo="#ffd400" color="#1b1b1b" />
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, (e: Escenario) => Dibujo> = {
  gancho,
  grito,
  telefono,
  impuestos,
  gastos,
  loteria,
  deudas,
  emergencias,
  invertir,
  interes,
  secreto,
  final,
};

export const Ilustraciones = Object.fromEntries(
  (Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](ESCENARIOS[k])]),
) as Record<Ilustracion, Dibujo>;
