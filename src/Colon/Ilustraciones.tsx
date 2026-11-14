import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useVideoConfig } from "remotion";
import { Dibujo } from "../comun/tipos";
import { Barco } from "./Barco";
import { Colon } from "./Colon";
import { Ilustracion } from "./escenas";
import { aPantalla, Camara, LonLat, Mapa, mezclarCamara, puntoEnRuta, rutaHasta } from "./Mapa";

const W = 1080;
const H = 1920;
const suave = Easing.inOut(Easing.cubic);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- lugares ----------
const PALOS: LonLat = [-6.9, 37.2];
const CANARIAS: LonLat = [-17.2, 28.1];
const GUANAHANI: LonLat = [-74.5, 24.05];
const RUTA: LonLat[] = [PALOS, [-9.5, 35.2], [-13.5, 31.2], CANARIAS, [-28, 28], [-42, 27.6], [-56, 26.6], [-66, 25.5], GUANAHANI];

// cámara que va de A a B durante la escena
const camaraEntre = (f: number, dur: number, a: Camara, b: Camara) =>
  mezclarCamara(a, b, interpolate(f, [0, dur], [0, 1], { ...clamp, easing: suave }));

// ---------- elementos gráficos ----------

const Etiqueta: React.FC<{ f: number; x: number; y: number; texto: string; inicio?: number; color?: string; tam?: number }> = ({
  f,
  x,
  y,
  texto,
  inicio = 0,
  color = "#0d1b2a",
  tam = 40,
}) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - inicio, fps, config: { damping: 11 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s})`,
        background: color,
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 900,
        fontSize: tam,
        letterSpacing: 1,
        padding: "8px 20px",
        borderRadius: 14,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
        border: "3px solid rgba(255,255,255,0.85)",
      }}
    >
      {texto}
    </div>
  );
};

const Calendario: React.FC<{ f: number; mes: string; dia: string; anio: string; inicio?: number; izquierda?: boolean }> = ({ f, mes, dia, anio, inicio = 6, izquierda = false }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - inicio, fps, config: { damping: 10 } });
  return (
    <div
      style={{
        position: "absolute",
        ...(izquierda ? { left: 70 } : { right: 70 }),
        top: 470,
        width: 230,
        borderRadius: 26,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
        transform: `scale(${s}) rotate(${6 - s * 4}deg)`,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ background: "#d32f2f", color: "#fff", fontWeight: 900, fontSize: 40, padding: "10px 0" }}>{mes}</div>
      <div style={{ fontWeight: 900, fontSize: 120, color: "#212121", lineHeight: 1.1 }}>{dia}</div>
      <div style={{ fontWeight: 800, fontSize: 36, color: "#616161", paddingBottom: 12 }}>{anio}</div>
    </div>
  );
};

const Corona: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 30 L -80 -40 L -40 -5 L 0 -60 L 40 -5 L 80 -40 L 70 30 Z" fill="#ffc400" stroke="#8d6e00" strokeWidth={6} />
    <rect x={-72} y={26} width={144} height={26} rx={6} fill="#ffb300" stroke="#8d6e00" strokeWidth={6} />
    <circle cx={0} cy={39} r={8} fill="#d32f2f" />
    <circle cx={-40} cy={39} r={7} fill="#1565c0" />
    <circle cx={40} cy={39} r={7} fill="#2e7d32" />
    {[-80, 0, 80].map((cx) => (
      <circle key={cx} cx={cx} cy={cx === 0 ? -64 : -44} r={9} fill="#fff8e1" stroke="#8d6e00" strokeWidth={4} />
    ))}
  </g>
);

const RutaPunteada: React.FC<{ camara: Camara; t: number; color?: string }> = ({ camara, t, color = "#fff" }) => {
  const pts = rutaHasta(RUTA, t).map((ll) => aPantalla(camara, ll));
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray="4 18"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.6))" }}
      />
    </svg>
  );
};

// tres barcos en formación siguiendo la ruta
const Flota: React.FC<{ camara: Camara; t: number; f: number; escala: number; nombres?: boolean; aparicion?: number }> = ({
  camara,
  t,
  f,
  escala,
  nombres = false,
  aparicion = 1,
}) => {
  const barcos = [
    { dt: 0, dx: 0, dy: 0, nombre: "Santa María", cruz: true },
    { dt: 0, dx: -100, dy: 30, nombre: "Pinta", cruz: false },
    { dt: 0, dx: -150, dy: 125, nombre: "Niña", cruz: false },
  ];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {barcos.map((b, i) => {
        const { ll, hacia } = puntoEnRuta(RUTA, t - b.dt);
        const [x, y] = aPantalla(camara, ll);
        const ap = Math.max(0, Math.min(1, aparicion * 3 - i));
        return (
          <g key={b.nombre} opacity={ap}>
            <Barco
              x={x + b.dx * escala * 3}
              y={y + b.dy * escala * 3}
              escala={escala * (0.6 + 0.4 * ap)}
              f={f}
              fase={i * 13}
              haciaEste={hacia === "este"}
              velaCruz={b.cruz}
              nombre={nombres ? b.nombre : undefined}
            />
          </g>
        );
      })}
    </svg>
  );
};

const Titulo: React.FC<{ f: number; texto: string; y: number; tam: number; color?: string; inicio?: number }> = ({
  f,
  texto,
  y,
  tam,
  color = "#ffd93b",
  inicio = 4,
}) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - inicio, fps, config: { damping: 9 } });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 900,
        fontSize: tam,
        color,
        transform: `scale(${s})`,
        textShadow: "0 10px 30px rgba(0,0,0,0.7), 0 0 4px #000",
        letterSpacing: 6,
      }}
    >
      {texto}
    </div>
  );
};

const Burbuja: React.FC<{ f: number; x: number; y: number; texto: string; inicio?: number; pensamiento?: boolean }> = ({
  f,
  x,
  y,
  texto,
  inicio = 0,
  pensamiento = false,
}) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - inicio, fps, config: { damping: 8 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${s})`,
        transformOrigin: "50% 100%",
        background: "#fff",
        color: "#b71c1c",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 900,
        fontSize: 70,
        padding: "22px 40px",
        borderRadius: pensamiento ? 80 : 40,
        border: "6px solid #212121",
        whiteSpace: "nowrap",
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
      }}
    >
      {texto}
    </div>
  );
};

// ---------- escenas ----------

const EscenaIntro: Dibujo = ({ f }) => {
  const cam = camaraEntre(f, 120, { lon: -38, lat: 30, zoom: 0.85 }, { lon: -28, lat: 33, zoom: 1.05 });
  return (
    <AbsoluteFill>
      <Mapa camara={cam} niebla={1} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)" }} />
      <Titulo f={f} texto="1492" y={520} tam={230} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Colon pose="mapa" f={f} x={600} y={1880} escala={1.25} />
      </svg>
    </AbsoluteFill>
  );
};

const EscenaPlan: Dibujo = ({ f }) => {
  const cam = camaraEntre(f, 135, { lon: -30, lat: 33, zoom: 1.05 }, { lon: -45, lat: 32, zoom: 0.95 });
  const a = aPantalla(cam, [-4, 40]);
  const b = aPantalla(cam, [-82, 33]);
  const avance = interpolate(f, [10, 70], [0, 1], { ...clamp, easing: suave });
  const ctrl: [number, number] = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 260];
  // punto sobre la curva cuadrática para la punta de flecha
  const q = (t: number) => [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * ctrl[0] + t * t * b[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * ctrl[1] + t * t * b[1],
  ];
  const punta = q(avance);
  return (
    <AbsoluteFill>
      <Mapa camara={cam} niebla={1} espana={1} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path
          d={`M ${a[0]} ${a[1]} Q ${ctrl[0]} ${ctrl[1]} ${b[0]} ${b[1]}`}
          fill="none"
          stroke="#ffd93b"
          strokeWidth={12}
          strokeDasharray="30 18"
          pathLength={1}
          strokeDashoffset={0}
          style={{ clipPath: `inset(0 0 0 ${(1 - avance) * 100}%)` }}
        />
        <circle cx={punta[0]} cy={punta[1]} r={20} fill="#ffd93b" stroke="#000" strokeWidth={4} />
      </svg>
      <Etiqueta f={f} x={b[0] + 120} y={b[1] - 90} texto="¿ASIA? 🌏" inicio={60} color="#b71c1c" tam={52} />
      <Etiqueta f={f} x={a[0]} y={a[1] + 70} texto="ESPAÑA" inicio={6} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Colon pose="senalar" f={f} x={820} y={1880} escala={1.1} voltear />
      </svg>
    </AbsoluteFill>
  );
};

const EscenaReyes: Dibujo = ({ f }) => {
  const { fps } = useVideoConfig();
  const cam = camaraEntre(f, 120, { lon: -10, lat: 38, zoom: 2.5 }, { lon: -4, lat: 39.5, zoom: 4.2 });
  const [ex, ey] = aPantalla(cam, [-4, 40.2]);
  const c1 = spring({ frame: f - 6, fps, config: { damping: 10 } });
  const c2 = spring({ frame: f - 14, fps, config: { damping: 10 } });
  const bolsa = spring({ frame: f - 22, fps, config: { damping: 7 } });
  return (
    <AbsoluteFill>
      <Mapa camara={cam} espana={1} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Corona x={ex - 110} y={ey - 220} s={c1 * 1.1} />
        <Corona x={ex + 110} y={ey - 220} s={c2 * 1.1} />
      </svg>
      <Etiqueta f={f} x={ex - 110} y={ey - 120} texto="ISABEL" inicio={10} color="#6a1b9a" tam={36} />
      <Etiqueta f={f} x={ex + 110} y={ey - 120} texto="FERNANDO" inicio={18} color="#6a1b9a" tam={36} />
      <div
        style={{
          position: "absolute",
          left: ex - 60,
          top: ey - 20 + (1 - bolsa) * -300,
          fontSize: 130,
          transform: `scale(${bolsa})`,
        }}
      >
        💰
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Colon pose="reverencia" f={f} x={800} y={1880} escala={1.1} hablando={false} />
      </svg>
    </AbsoluteFill>
  );
};

const EscenaZarpa: Dibujo = ({ f }) => {
  const cam = camaraEntre(f, 150, { lon: -8, lat: 36.5, zoom: 5.5 }, { lon: -9.5, lat: 35.5, zoom: 4.2 });
  const [px, py] = aPantalla(cam, PALOS);
  const t = interpolate(f, [30, 150], [0.0, 0.035], clamp);
  return (
    <AbsoluteFill>
      <Mapa camara={cam} espana={0.6} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={px} cy={py} r={18 + Math.sin(f / 4) * 4} fill="#ffd93b" stroke="#000" strokeWidth={5} />
      </svg>
      <Etiqueta f={f} x={px + 30} y={py - 80} texto="PALOS" inicio={4} />
      <RutaPunteada camara={cam} t={t} />
      <Flota camara={cam} t={0.03 + t} f={f} escala={0.75} nombres aparicion={interpolate(f, [8, 40], [0, 1], clamp)} />
      <Calendario f={f} mes="AGOSTO" dia="3" anio="1492" inicio={20} />
    </AbsoluteFill>
  );
};

const EscenaTravesia: Dibujo = ({ f }) => {
  const t = interpolate(f, [0, 150], [0.2, 0.86], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const { ll } = puntoEnRuta(RUTA, t);
  const cam: Camara = { lon: ll[0] - 4, lat: ll[1] + 1.5, zoom: interpolate(f, [0, 150], [2.0, 1.6], clamp) };
  const dia = Math.round(interpolate(f, [0, 150], [10, 70], clamp));
  const [cx, cy] = aPantalla(cam, CANARIAS);
  return (
    <AbsoluteFill>
      <Mapa camara={cam} niebla={interpolate(f, [0, 150], [0.9, 0.5], clamp)} />
      <RutaPunteada camara={cam} t={t} />
      <Etiqueta f={f} x={cx} y={cy + 60} texto="CANARIAS" inicio={2} tam={34} />
      <Flota camara={cam} t={t} f={f} escala={0.45} />
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 470,
          background: "rgba(13,27,42,0.85)",
          border: "4px solid #fff",
          borderRadius: 24,
          padding: "14px 30px",
          fontFamily: "system-ui, sans-serif",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, color: "#9fd3ff" }}>DÍA</div>
        <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1 }}>{dia}</div>
      </div>
    </AbsoluteFill>
  );
};

const EscenaTierra: Dibujo = ({ f }) => {
  const isla = interpolate(f, [30, 80], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#ff9e64 0%, #ffd6a5 30%, #7ec8e3 46%)" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={300} cy={760} r={90} fill="#fff3c4" opacity={0.9} />
        {/* isla en el horizonte */}
        <path d={`M 40 900 Q 160 ${900 - 70 * isla} 300 ${900 - 40 * isla} Q 380 ${900 - 90 * isla} 480 900 Z`} fill="#2e7d32" opacity={isla} />
        {/* mar */}
        <rect x={0} y={895} width={W} height={H} fill="#1565c0" />
        {Array.from({ length: 14 }, (_, i) => {
          const y = 930 + i * 75;
          const d = `M -50 ${y} ` + Array.from({ length: 14 }, (_, k) => `q 45 ${Math.sin(f / 6 + i + k) * 14 - 16} 90 0`).join(" ");
          return <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={5} />;
        })}
        <Barco x={640} y={1250} escala={2.6} f={f} velaCruz />
        {/* vigía en la cofa */}
        <g transform={`translate(${640 + 10 * 2.6} ${1250 - 190 * 2.6 + Math.sin(f / 7) * 13})`}>
          <rect x={-40} y={-20} width={80} height={40} rx={8} fill="#6d4c41" stroke="#3e2112" strokeWidth={5} />
          <circle cx={0} cy={-50} r={26} fill="#f0c08a" stroke="#8a5a2b" strokeWidth={4} />
          <rect x={-22} y={-38} width={44} height={22} fill="#1e88e5" />
          <path d={`M 18 -40 L ${80} ${-90}`} stroke="#1e88e5" strokeWidth={14} strokeLinecap="round" />
        </g>
      </svg>
      <Burbuja f={f} x={790} y={640} texto="¡TIERRA!" inicio={32} />
      <Calendario f={f} mes="OCTUBRE" dia="12" anio="1492" inicio={8} izquierda />
    </AbsoluteFill>
  );
};

const EscenaGuanahani: Dibujo = ({ f }) => {
  const cam = camaraEntre(f, 120, { lon: -68, lat: 25, zoom: 2.4 }, { lon: -74.8, lat: 24.4, zoom: 9 });
  const [gx, gy] = aPantalla(cam, GUANAHANI);
  const pulso = (Math.sin(f / 5) + 1) / 2;
  return (
    <AbsoluteFill>
      <Mapa camara={cam} brillo={{ nombre: "Bahamas", intensidad: interpolate(f, [30, 60], [0, 1], clamp) * (0.6 + 0.4 * pulso) }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={gx} cy={gy} r={30 + pulso * 30} fill="none" stroke="#ffd93b" strokeWidth={6} opacity={interpolate(f, [40, 60], [0, 1], clamp)} />
      </svg>
      <Etiqueta f={f} x={gx} y={gy - 110} texto="GUANAHANÍ" inicio={45} color="#b71c1c" tam={52} />
      <Etiqueta f={f} x={gx} y={gy + 100} texto="San Salvador · Bahamas" inicio={55} tam={32} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Colon pose="bandera" f={f - 30} x={790} y={1880} escala={1.0} />
      </svg>
    </AbsoluteFill>
  );
};

const EscenaIndias: Dibujo = ({ f }) => {
  const cam = camaraEntre(f, 100, { lon: -74, lat: 24, zoom: 3.5 }, { lon: -62, lat: 12, zoom: 0.72 });
  return (
    <AbsoluteFill>
      <Mapa camara={cam} niebla={interpolate(f, [0, 50], [0.6, 0], clamp)} />
      <Titulo f={f} texto="AMÉRICA" y={570} tam={130} color="#fff" inicio={45} />
      <Burbuja f={f} x={720} y={1150} texto="¿Asia? 🤔" inicio={12} pensamiento />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Colon pose="pensar" f={f} x={780} y={1880} escala={1.05} hablando={false} />
      </svg>
    </AbsoluteFill>
  );
};

export const Ilustraciones: Record<Ilustracion, Dibujo> = {
  intro: EscenaIntro,
  plan: EscenaPlan,
  reyes: EscenaReyes,
  zarpa: EscenaZarpa,
  travesia: EscenaTravesia,
  tierra: EscenaTierra,
  guanahani: EscenaGuanahani,
  indias: EscenaIndias,
};
