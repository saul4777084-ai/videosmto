import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useVideoConfig } from "remotion";
import { Dibujo } from "../comun/tipos";
import { Barco } from "../Colon/Barco";
import { Colon } from "../Colon/Colon";
import {
  Burbuja,
  camaraEntre,
  CANARIAS,
  Etiqueta,
  Flota,
  GUANAHANI,
  Ilustraciones as Base,
  RUTA,
  RutaPunteada,
  Titulo,
} from "../Colon/Ilustraciones";
import { aPantalla, Camara, Mapa, puntoEnRuta } from "../Colon/Mapa";

const W = 1080;
const H = 1920;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Ilustracion =
  | "intro"
  | "plan"
  | "portugal"
  | "reyes"
  | "zarpa"
  | "flota"
  | "canarias"
  | "oceano"
  | "semanas"
  | "miedo"
  | "tierra"
  | "guanahani"
  | "tainos"
  | "indias"
  | "america"
  | "final";

// ---------- piezas de escena ----------

const Mar: React.FC<{ f: number; cielo: string; mar: string; y?: number; olas?: number }> = ({ f, cielo, mar, y = 900, olas = 1 }) => (
  <>
    <AbsoluteFill style={{ background: cielo }} />
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <rect x={0} y={y} width={W} height={H - y} fill={mar} />
      {Array.from({ length: 14 }, (_, i) => {
        const yy = y + 30 + i * 75;
        const d = `M -50 ${yy} ` + Array.from({ length: 14 }, (_, k) => `q 45 ${(Math.sin(f / 6 + i + k) * 14 - 16) * olas} 90 0`).join(" ");
        return <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={5} />;
      })}
    </svg>
  </>
);

const Sello: React.FC<{ f: number; inicio: number; x: number; y: number; texto: string }> = ({ f, inicio, x, y, texto }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - inicio, fps, config: { damping: 8, mass: 0.6 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(-14deg) scale(${interpolate(s, [0, 1], [2.4, 1])})`,
        opacity: s,
        border: "12px solid #e53935",
        color: "#e53935",
        borderRadius: 24,
        padding: "6px 40px",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 900,
        fontSize: 120,
        background: "rgba(255,255,255,0.85)",
      }}
    >
      {texto}
    </div>
  );
};

const Palmera: React.FC<{ x: number; y: number; s: number; f: number; fase: number }> = ({ x, y, s, f, fase }) => {
  const viento = Math.sin(f / 12 + fase) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 0 Q 20 -150 -10 -300" stroke="#6d4c2f" strokeWidth={26} fill="none" strokeLinecap="round" />
      <g transform={`translate(-10 -300) rotate(${viento})`}>
        {[-150, -110, -60, -20, 30, 80, 130].map((a, i) => (
          <path key={i} d="M 0 0 Q 70 -40 150 20" stroke="#2e7d32" strokeWidth={22} fill="none" strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
        <circle r={14} fill="#5d4037" cx={-8} cy={12} />
        <circle r={14} fill="#5d4037" cx={12} cy={14} />
      </g>
    </g>
  );
};

// ---------- escenas nuevas (reciben la duración de su frase en frames) ----------

const portugal =
  (dur: number): Dibujo =>
  ({ f }) => {
    const cam = camaraEntre(f, dur, { lon: -7, lat: 40, zoom: 3.4 }, { lon: -5.5, lat: 40, zoom: 3.8 });
    const [px, py] = aPantalla(cam, [-8.3, 39.6]);
    const [ex, ey] = aPantalla(cam, [-3.6, 40.3]);
    const giro = interpolate(f, [dur * 0.45, dur * 0.6], [0, 1], clamp);
    return (
      <AbsoluteFill>
        <Mapa
          camara={cam}
          espana={giro}
          brillo={{ nombre: "Portugal", intensidad: interpolate(f, [4, 14], [0, 1], clamp), color: "229,57,53" }}
        />
        <Etiqueta f={f} x={px} y={py - 120} texto="PORTUGAL" inicio={4} color="#b71c1c" />
        <Sello f={f} inicio={14} x={px} y={py + 40} texto="NO" />
        <Etiqueta f={f} x={ex} y={ey - 150} texto="ESPAÑA 🤝" inicio={Math.round(dur * 0.55)} color="#1b5e20" tam={46} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Colon pose={f < dur * 0.5 ? "reposo" : "presentar"} f={f} x={800} y={1880} escala={1.05} hablando={false} />
        </svg>
      </AbsoluteFill>
    );
  };

const flota =
  (dur: number): Dibujo =>
  ({ f }) => {
    const { fps } = useVideoConfig();
    const marineros = Math.round(interpolate(f, [dur * 0.55, dur * 0.9], [0, 90], clamp));
    const avance = interpolate(f, [0, dur], [0, -120], clamp);
    const barcos = [
      { nombre: "Santa María", x: 300, y: 1150, s: 1.35, cruz: true, ini: 4 },
      { nombre: "Pinta", x: 640, y: 1300, s: 1.1, cruz: false, ini: Math.round(dur * 0.3) },
      { nombre: "Niña", x: 860, y: 1450, s: 1.0, cruz: false, ini: Math.round(dur * 0.45) },
    ];
    const n = spring({ frame: f - dur * 0.55, fps, config: { damping: 11 } });
    return (
      <AbsoluteFill>
        <Mar f={f} cielo="linear-gradient(#5aa7de, #bfe3f7 45%)" mar="#1565c0" y={960} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {barcos.map((b, i) => {
            const e = spring({ frame: f - b.ini, fps, config: { damping: 12 } });
            return (
              <g key={b.nombre} opacity={e}>
                <Barco x={b.x + avance + (1 - e) * 400} y={b.y} escala={b.s} f={f} fase={i * 11} velaCruz={b.cruz} nombre={b.nombre} />
              </g>
            );
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 480,
            transform: `scale(${n})`,
            background: "rgba(13,27,42,0.85)",
            border: "4px solid #fff",
            borderRadius: 24,
            padding: "12px 28px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 100, fontWeight: 900, lineHeight: 1 }}>≈{marineros}</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#9fd3ff" }}>MARINEROS</div>
        </div>
      </AbsoluteFill>
    );
  };

const canarias =
  (dur: number): Dibujo =>
  ({ f }) => {
    const cam = camaraEntre(f, dur, { lon: -11, lat: 32, zoom: 3.2 }, { lon: -16, lat: 28.6, zoom: 5.5 });
    const t = interpolate(f, [0, dur], [0.03, 0.14], { ...clamp, easing: Easing.out(Easing.quad) });
    const [cx, cy] = aPantalla(cam, CANARIAS);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} />
        <RutaPunteada camara={cam} t={t} />
        <Flota camara={cam} t={t} f={f} escala={0.45} />
        <Etiqueta f={f} x={cx + 40} y={cy + 150} texto="ISLAS CANARIAS" inicio={Math.round(dur * 0.35)} color="#e65100" tam={46} />
        <div style={{ position: "absolute", left: cx - 40, top: cy - 300, fontSize: 90, transform: `scale(${interpolate(f, [dur * 0.6, dur * 0.75], [0, 1], clamp)}) rotate(${Math.sin(f / 4) * 15}deg)` }}>
          🔧
        </div>
        <div style={{ position: "absolute", left: cx + 90, top: cy - 280, fontSize: 90, transform: `scale(${interpolate(f, [dur * 0.75, dur * 0.88], [0, 1], clamp)})` }}>
          🛢️
        </div>
      </AbsoluteFill>
    );
  };

const oceano =
  (dur: number): Dibujo =>
  ({ f }) => {
    const cam = camaraEntre(f, dur, { lon: -22, lat: 29, zoom: 2.6 }, { lon: -34, lat: 28.5, zoom: 1.7 });
    const t = interpolate(f, [0, dur], [0.14, 0.3], clamp);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} niebla={1} />
        <RutaPunteada camara={cam} t={t} />
        <Flota camara={cam} t={t} f={f} escala={0.4} />
        <Titulo f={f} texto={"OCÉANO\nDESCONOCIDO"} y={620} tam={96} color="#e3f2fd" inicio={Math.round(dur * 0.4)} />
      </AbsoluteFill>
    );
  };

const semanas =
  (dur: number): Dibujo =>
  ({ f }) => {
    const t = interpolate(f, [0, dur], [0.3, 0.62], clamp);
    const { ll } = puntoEnRuta(RUTA, t);
    const cam: Camara = { lon: ll[0] - 3, lat: ll[1] + 1.5, zoom: 1.8 };
    const semana = Math.min(5, 1 + Math.floor(interpolate(f, [0, dur * 0.9], [0, 5], clamp)));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} niebla={0.8} />
        <RutaPunteada camara={cam} t={t} />
        <Flota camara={cam} t={t} f={f} escala={0.4} />
        <div
          style={{
            position: "absolute",
            right: 60,
            top: 480,
            background: "rgba(13,27,42,0.85)",
            border: "4px solid #fff",
            borderRadius: 24,
            padding: "12px 30px",
            fontFamily: "system-ui, sans-serif",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 800, color: "#9fd3ff" }}>SEMANA</div>
          <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1 }}>{semana}</div>
        </div>
      </AbsoluteFill>
    );
  };

const miedo =
  (dur: number): Dibujo =>
  ({ f }) => {
    const rayo = f % 40 < 3 && f > 6 ? 1 : 0;
    return (
      <AbsoluteFill>
        <Mar f={f * 1.8} cielo="linear-gradient(#1c2331, #3b4a5e 50%)" mar="#0d2b45" y={980} olas={2.2} />
        <AbsoluteFill style={{ background: "#e8f1ff", opacity: rayo * 0.55 }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* lluvia */}
          {Array.from({ length: 70 }, (_, i) => {
            const x = (random(`lx${i}`) * W + f * 6) % W;
            const y = (random(`ly${i}`) * H + f * 40) % H;
            return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 46} stroke="rgba(200,220,255,0.45)" strokeWidth={4} />;
          })}
          {rayo > 0 && <path d="M 760 420 L 700 620 L 760 620 L 680 860" stroke="#fffde7" strokeWidth={14} fill="none" strokeLinejoin="round" />}
          <g transform={`rotate(${Math.sin(f / 5) * 6} 540 1250)`}>
            <Barco x={540} y={1250} escala={2.4} f={f * 1.6} velaCruz />
          </g>
        </svg>
        <Burbuja f={f} x={300} y={760} texto="😨 ¡Volvamos!" inicio={Math.round(dur * 0.45)} />
      </AbsoluteFill>
    );
  };

const tainos =
  (dur: number): Dibujo =>
  ({ f }) => {
    const { fps } = useVideoConfig();
    const canoa = interpolate(f, [0, dur], [-120, 260], clamp);
    const bohio = spring({ frame: f - 6, fps, config: { damping: 12 } });
    return (
      <AbsoluteFill>
        <Mar f={f} cielo="linear-gradient(#4fb3ea, #c8ecff 45%)" mar="#1e9fd6" y={880} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* barcos anclados a lo lejos */}
          <Barco x={850} y={940} escala={0.55} f={f} fase={3} velaCruz />
          <Barco x={980} y={960} escala={0.45} f={f} fase={9} />
          {/* playa */}
          <path d="M 0 1250 Q 300 1180 600 1230 T 1080 1210 L 1080 1920 L 0 1920 Z" fill="#f3d9a4" />
          <path d="M 0 1250 Q 300 1180 600 1230 T 1080 1210" stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.7} />
          <Palmera x={160} y={1420} s={1.4} f={f} fase={0} />
          <Palmera x={960} y={1460} s={1.2} f={f} fase={2} />
          {/* bohío (casa taína) */}
          <g transform={`translate(560 1520) scale(${bohio})`}>
            <rect x={-150} y={-160} width={300} height={160} fill="#c49a5a" stroke="#6d4c2f" strokeWidth={6} />
            <path d="M -200 -150 L 0 -330 L 200 -150 Z" fill="#a1782f" stroke="#6d4c2f" strokeWidth={6} />
            {Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1={-180 + i * 50} y1={-160} x2={0} y2={-320} stroke="#7f5a22" strokeWidth={4} />
            ))}
            <rect x={-40} y={-110} width={80} height={110} fill="#5d4037" />
          </g>
          {/* hamaca */}
          <path d="M 250 1610 Q 350 1680 450 1610" stroke="#e53935" strokeWidth={14} fill="none" />
          {/* canoa */}
          <g transform={`translate(${canoa} ${1040 + Math.sin(f / 7) * 6})`}>
            <path d="M -120 0 Q 0 40 120 0 L 100 -10 L -100 -10 Z" fill="#6d4c2f" stroke="#3e2112" strokeWidth={5} />
            <line x1={20} y1={-60} x2={60} y2={30} stroke="#3e2112" strokeWidth={8} />
          </g>
        </svg>
        <Etiqueta f={f} x={560} y={1730} texto="PUEBLO TAÍNO" inicio={Math.round(dur * 0.2)} color="#bf360c" tam={50} />
      </AbsoluteFill>
    );
  };

const indias =
  (dur: number): Dibujo =>
  ({ f }) => {
    const cam = camaraEntre(f, dur, { lon: -74, lat: 22, zoom: 3 }, { lon: -72, lat: 21, zoom: 2.4 });
    return (
      <AbsoluteFill>
        <Mapa camara={cam} niebla={0.5} />
        <Burbuja f={f} x={620} y={1180} texto="¿Las Indias? 🌏" inicio={6} pensamiento />
        <Etiqueta f={f} x={540} y={620} texto="LOS LLAMÓ «INDIOS»" inicio={Math.round(dur * 0.6)} color="#4e342e" tam={44} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Colon pose="pensar" f={f} x={780} y={1880} escala={1.05} hablando={false} />
        </svg>
      </AbsoluteFill>
    );
  };

const america =
  (dur: number): Dibujo =>
  ({ f }) => {
    const cam = camaraEntre(f, dur * 0.8, { lon: -72, lat: 21, zoom: 2.4 }, { lon: -62, lat: 10, zoom: 0.7 });
    return (
      <AbsoluteFill>
        <Mapa camara={cam} niebla={interpolate(f, [0, dur * 0.5], [0.5, 0], clamp)} />
        <Titulo f={f} texto="AMÉRICA" y={600} tam={150} color="#ffd93b" inicio={Math.round(dur * 0.75)} />
        <Etiqueta f={f} x={540} y={820} texto="UN CONTINENTE NUEVO PARA EUROPA" inicio={Math.round(dur * 0.35)} tam={36} />
      </AbsoluteFill>
    );
  };

const final =
  (dur: number): Dibujo =>
  ({ f }) => {
    const cam = camaraEntre(f, dur, { lon: -40, lat: 28, zoom: 1.05 }, { lon: -40, lat: 28, zoom: 0.9 });
    const [gx, gy] = aPantalla(cam, GUANAHANI);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} espana={1} />
        <RutaPunteada camara={cam} t={1} color="#ffd93b" />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={gx} cy={gy} r={18 + Math.sin(f / 4) * 6} fill="#ffd93b" stroke="#000" strokeWidth={4} />
        </svg>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 100%)" }} />
        <Titulo f={f} texto="12 · X · 1492" y={1300} tam={110} color="#fff" inicio={8} />
      </AbsoluteFill>
    );
  };

// ---------- todas las escenas, con la duración real de cada frase ----------

export const crearIlustraciones = (dur: Record<Ilustracion, number>): Record<Ilustracion, Dibujo> => ({
  intro: Base.intro,
  plan: Base.plan,
  portugal: portugal(dur.portugal),
  reyes: Base.reyes,
  zarpa: Base.zarpa,
  flota: flota(dur.flota),
  canarias: canarias(dur.canarias),
  oceano: oceano(dur.oceano),
  semanas: semanas(dur.semanas),
  miedo: miedo(dur.miedo),
  tierra: Base.tierra,
  guanahani: Base.guanahani,
  tainos: tainos(dur.tainos),
  indias: indias(dur.indias),
  america: america(dur.america),
  final: final(dur.final),
});
