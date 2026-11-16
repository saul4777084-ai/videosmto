import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useVideoConfig } from "remotion";
import { Dibujo } from "../comun/tipos";
import { Calendario, camaraEntre, Etiqueta } from "../Colon/Ilustraciones";
import { aPantalla, Camara, LonLat, Mapa } from "../Colon/Mapa";
import type { Escenario } from "./escenas";
import { Canon, Napoleon, Soldado } from "./Personajes";

const W = 1080;
const H = 1920;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.inOut(Easing.cubic);
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

export type Ilustracion =
  | "gancho"
  | "corcega"
  | "revolucion"
  | "emperador"
  | "velocidad"
  | "ligeros"
  | "cuerpos"
  | "canones"
  | "austerlitz"
  | "jena"
  | "codigo"
  | "hermanos"
  | "imperio"
  | "rusia"
  | "invierno"
  | "waterloo"
  | "final";

// ---------- colores y lugares ----------
const AZUL = "30,64,175"; // Imperio francés
const AZUL_CLARO = "96,150,235"; // estados satélite y aliados forzados
const ROJO = "220,45,45"; // enemigos
const ORO = "#f2c230";

const IMPERIO = ["France", "Belgium", "Netherlands", "Luxembourg"];
const SATELITES = ["Spain", "Italy", "Germany", "Switzerland", "Poland", "Slovenia", "Croatia", "Austria", "Denmark", "Czechia"];

const L = {
  corcega: [9.1, 42.1] as LonLat,
  paris: [2.35, 48.86] as LonLat,
  austerlitz: [16.76, 49.13] as LonLat,
  jena: [11.59, 50.93] as LonLat,
  friedland: [21.0, 54.45] as LonLat,
  napoles: [14.25, 40.85] as LonLat,
  holanda: [5.1, 52.2] as LonLat,
  westfalia: [9.5, 51.3] as LonLat,
  madrid: [-3.7, 40.4] as LonLat,
  varsovia: [21.0, 52.23] as LonLat,
  niemen: [23.9, 54.9] as LonLat,
  moscu: [37.6, 55.75] as LonLat,
  waterloo: [4.4, 50.68] as LonLat,
};

const EUROPA: Camara = { lon: 12, lat: 49, zoom: 2.2 };

// ---------- piezas comunes ----------

const useAparicion = (f: number, inicio: number, damping = 11) => {
  const { fps } = useVideoConfig();
  return spring({ frame: f - inicio, fps, config: { damping } });
};

// fondo con degradado, viñeta y polvo dorado flotando
const Fondo: React.FC<{ f: number; de: string; a: string; polvo?: boolean }> = ({ f, de, a, polvo = true }) => (
  <>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${de} 0%, ${a} 85%)` }} />
    {polvo && (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 40 }, (_, i) => {
          const x = (random(`x${i}`) * W + f * (0.4 + random(`v${i}`))) % W;
          const y = (random(`y${i}`) * H - f * (0.8 + random(`w${i}`) * 1.2) + H * 4) % H;
          return <circle key={i} cx={x} cy={y} r={2 + random(`r${i}`) * 4} fill="#ffe08a" opacity={0.15 + random(`o${i}`) * 0.3} />;
        })}
      </svg>
    )}
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)" }} />
  </>
);

const Rotulo: React.FC<{ f: number; inicio: number; texto: string; y: number; tam: number; color?: string; fuente?: string }> = ({
  f,
  inicio,
  texto,
  y,
  tam,
  color = ORO,
  fuente = SERIF,
}) => {
  const s = useAparicion(f, inicio, 9);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 40,
        right: 40,
        textAlign: "center",
        fontFamily: fuente,
        fontWeight: 900,
        fontSize: tam,
        lineHeight: 1.05,
        color,
        opacity: Math.min(1, s * 1.5),
        transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`,
        textShadow: "0 10px 30px rgba(0,0,0,0.75), 0 0 4px #000",
        letterSpacing: 3,
        whiteSpace: "pre-line",
      }}
    >
      {texto}
    </div>
  );
};

const Sello: React.FC<{ f: number; inicio: number; x: number; y: number; texto: string; color?: string; tam?: number; giro?: number }> = ({
  f,
  inicio,
  x,
  y,
  texto,
  color = "#e53935",
  tam = 96,
  giro = -12,
}) => {
  const s = useAparicion(f, inicio, 8);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${giro}deg) scale(${interpolate(s, [0, 1], [2.6, 1])})`,
        opacity: Math.min(1, s * 2),
        border: `10px solid ${color}`,
        color,
        borderRadius: 22,
        padding: "4px 34px",
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: tam,
        background: "rgba(255,250,240,0.92)",
        whiteSpace: "nowrap",
        boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
      }}
    >
      {texto}
    </div>
  );
};

const Chip: React.FC<{ f: number; inicio: number; x: number; y: number; texto: string; fondo?: string; color?: string; tam?: number }> = ({
  f,
  inicio,
  x,
  y,
  texto,
  fondo = "#fff",
  color = "#13204a",
  tam = 52,
}) => {
  const s = useAparicion(f, inicio, 10);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s})`,
        background: fondo,
        color,
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: tam,
        padding: "14px 34px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
      }}
    >
      {texto}
    </div>
  );
};

// punto que late sobre el mapa
const Marcador: React.FC<{ f: number; inicio: number; cam: Camara; ll: LonLat; color?: string }> = ({ f, inicio, cam, ll, color = ORO }) => {
  const [x, y] = aPantalla(cam, ll);
  const s = useAparicion(f, inicio, 9);
  const onda = ((f - inicio) % 30) / 30;
  if (f < inicio) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <circle cx={x} cy={y} r={20 + onda * 60} fill="none" stroke={color} strokeWidth={6} opacity={1 - onda} />
      <circle cx={x} cy={y} r={22 * s} fill={color} stroke="#fff" strokeWidth={6} />
    </svg>
  );
};

// espadas cruzadas (batalla)
const Espadas: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-1, 1].map((d) => (
      <g key={d} transform={`rotate(${d * 40})`}>
        <path d="M -8 -110 L 8 -110 L 6 40 L -6 40 Z" fill="#e8eef5" stroke="#5c6b7a" strokeWidth={4} />
        <rect x={-34} y={40} width={68} height={14} rx={6} fill={ORO} />
        <rect x={-8} y={54} width={16} height={46} rx={6} fill="#6b4a2b" />
      </g>
    ))}
  </g>
);

// flecha gruesa que avanza por una ruta (lon/lat)
const Flecha: React.FC<{ cam: Camara; ruta: LonLat[]; t: number; color?: string; grosor?: number }> = ({ cam, ruta, t, color = "#1e40af", grosor = 26 }) => {
  if (t <= 0) return null;
  const pts = ruta.map((ll) => aPantalla(cam, ll));
  const largos = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = largos.reduce((a, b) => a + b, 0);
  let d = Math.min(1, t) * total;
  const hechos: [number, number][] = [pts[0]];
  let ang = 0;
  for (let i = 0; i < largos.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (d <= largos[i]) {
      const k = d / largos[i];
      hechos.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      break;
    }
    hechos.push(b);
    d -= largos[i];
  }
  const [px, py] = hechos[hechos.length - 1];
  const g = (ang * 180) / Math.PI;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <polyline points={hechos.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={grosor + 12} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={hechos.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${px} ${py}) rotate(${g})`}>
        <path d={`M ${grosor * 1.6} 0 L ${-grosor * 0.6} ${-grosor * 1.5} L ${-grosor * 0.6} ${grosor * 1.5} Z`} fill={color} stroke="rgba(0,0,0,0.45)" strokeWidth={5} />
      </g>
    </svg>
  );
};

const Contador: React.FC<{ f: number; inicio: number; fin: number; hasta: number; y: number; tam: number; color?: string; sufijo?: string }> = ({
  f,
  inicio,
  fin,
  hasta,
  y,
  tam,
  color = "#fff",
  sufijo = "",
}) => {
  const v = Math.round(interpolate(f, [inicio, fin], [0, hasta], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const s = useAparicion(f, inicio, 10);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: tam,
        color,
        transform: `scale(${s})`,
        textShadow: "0 10px 30px rgba(0,0,0,0.8)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {v.toLocaleString("es-ES")}
      {sufijo}
    </div>
  );
};

// pinta el imperio poco a poco (k de 0 a 1)
const coloresImperio = (k: number, extra: Record<string, { color: string; opacidad: number }> = {}) => {
  const c: Record<string, { color: string; opacidad: number }> = {};
  IMPERIO.forEach((n, i) => (c[n] = { color: AZUL, opacidad: interpolate(k, [i * 0.05, i * 0.05 + 0.25], [0, 1], clamp) }));
  SATELITES.forEach((n, i) => (c[n] = { color: AZUL_CLARO, opacidad: interpolate(k, [0.2 + i * 0.06, 0.4 + i * 0.06], [0, 1], clamp) }));
  return { ...c, ...extra };
};

const Viñeta = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)" }} />;

// ---------- escenas ----------

const gancho = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, dur, { lon: 10, lat: 47, zoom: 1.7 }, { lon: 12, lat: 49, zoom: 2.3 });
  const k = interpolate(f, [en("conquistar"), dur], [0, 1], clamp);
  const s = useAparicion(f, 2, 12);
  return (
    <AbsoluteFill>
      <Mapa camara={cam} colores={coloresImperio(k)} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(5,10,30,0.85), rgba(5,10,30,0.15) 45%, rgba(5,10,30,0.7))" }} />
      <Rotulo f={f} inicio={0} texto="¿CÓMO LOGRÓ" y={250} tam={96} color="#fff" />
      <Rotulo f={f} inicio={en("Napoleón")} texto="NAPOLEÓN" y={360} tam={150} />
      <Rotulo f={f} inicio={en("conquistar")} texto={"CONQUISTAR\nEUROPA?"} y={520} tam={118} color="#fff" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Napoleon x={540} y={1960 + (1 - s) * 400} escala={1.5} f={f} brazo={interpolate(f, [en("Europa?"), en("Europa?") + 10], [0, -110], clamp)} />
      </svg>
    </AbsoluteFill>
  );
};

const corcega = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, dur * 0.6, { lon: 6, lat: 44, zoom: 3 }, { lon: 9.1, lat: 42.6, zoom: 7 });
  const [x, y] = aPantalla(cam, L.corcega);
  const tiro = interpolate(f, [en("artillería."), en("artillería.") + 14], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Mapa camara={cam} />
      <Viñeta />
      <Marcador f={f} inicio={en("Córcega")} cam={cam} ll={L.corcega} />
      <Etiqueta f={f} x={x} y={y - 120} texto="CÓRCEGA" inicio={en("Córcega")} color="#13204a" tam={52} />
      <Calendario f={f} mes="AGOSTO" dia="15" anio="1769" inicio={en("1769")} izquierda />
      <Chip f={f} inicio={en("oficial")} x={540} y={900} texto="OFICIAL DE ARTILLERÍA" fondo="#13204a" color={ORO} tam={50} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {f >= en("artillería.") - 4 && <Canon x={300} y={1740} escala={1.6} disparo={tiro} />}
        {f >= en("empezó") && <Napoleon x={790} y={1900} escala={1.05} f={f} brazo={f > en("artillería.") ? -60 : 0} />}
      </svg>
    </AbsoluteFill>
  );
};

const revolucion = ({ en }: Escenario): Dibujo => ({ f }) => {
  const sube = interpolate(f, [en("abrió"), en("mérito,") + 12], [0, 3], { ...clamp, easing: suave });
  const ola = (i: number) => Math.sin(f / 7 + i * 0.8) * 18;
  return (
    <AbsoluteFill>
      {/* bandera tricolor ondeando */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {["#1d3fa0", "#f4f1e8", "#d22b2b"].map((c, i) => (
          <path
            key={c}
            d={`M ${i * 360} ${ola(i)} L ${(i + 1) * 360} ${ola(i + 1)} L ${(i + 1) * 360} ${H + ola(i + 1)} L ${i * 360} ${H + ola(i)} Z`}
            fill={c}
          />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)" }} />
      <Rotulo f={f} inicio={en("Revolución")} texto={"REVOLUCIÓN\nFRANCESA"} y={520} tam={100} color="#fff" />
      {/* escalera de ascensos */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3].map((k) => (
          <g key={k} opacity={interpolate(f, [en("puerta:") + k * 4, en("puerta:") + k * 4 + 8], [0, 1], clamp)}>
            <rect x={140 + k * 200} y={1640 - k * 150} width={200} height={150 + k * 150} fill="#2b1d10" opacity={0.85} />
            <rect x={140 + k * 200} y={1640 - k * 150} width={200} height={16} fill={ORO} />
          </g>
        ))}
        <Napoleon x={240 + sube * 200} y={1640 - sube * 150} escala={0.55} f={f} />
      </svg>
      <Chip f={f} inicio={en("mérito,")} x={300} y={830} texto="MÉRITO ✓" fondo="#1b8a3a" color="#fff" tam={64} />
      <Chip f={f} inicio={en("apellido.")} x={300} y={960} texto="APELLIDO" fondo="#444" color="#bbb" tam={60} />
      {f >= en("apellido.") + 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={`M 150 960 L ${150 + interpolate(f, [en("apellido.") + 4, en("apellido.") + 12], [0, 300], clamp)} 960`} stroke="#ff3b3b" strokeWidth={14} strokeLinecap="round" />
        </svg>
      )}
    </AbsoluteFill>
  );
};

const emperador = ({ en }: Escenario): Dibujo => ({ f }) => {
  const segunda = f >= en("1804", 1) - 3;
  const corona = interpolate(f, [en("coronó"), en("emperador.") + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const brillo = interpolate(f, [en("emperador."), en("emperador.") + 20], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} de={segunda ? "#6b1420" : "#1b2440"} a="#08060c" />
      {/* rayos dorados */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: brillo }}>
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d="M 540 1150 L 520 -200 L 560 -200 Z" fill={ORO} opacity={0.18} transform={`rotate(${i * 22.5 + f * 0.3} 540 1150)`} />
        ))}
      </svg>
      {!segunda ? (
        <>
          <Calendario f={f} mes="NOVIEMBRE" dia="9" anio="1799" inicio={en("1799")} izquierda />
          <Sello f={f} inicio={en("golpe")} x={560} y={900} texto="GOLPE DE ESTADO" tam={70} />
        </>
      ) : (
        <>
          <Calendario f={f} mes="DICIEMBRE" dia="2" anio="1804" inicio={en("1804")} izquierda />
          <Rotulo f={f} inicio={en("emperador.")} texto="EMPERADOR" y={760} tam={130} />
        </>
      )}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Napoleon x={540} y={1900} escala={1.15} f={f} corona={corona} brazo={segunda ? -20 : -70} />
      </svg>
    </AbsoluteFill>
  );
};

const velocidad = ({ en }: Escenario): Dibujo => ({ f }) => {
  const aguja = interpolate(f, [en("velocidad:"), en("rápido") + 10], [-120, 95], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tiembla = f > en("rápido") ? Math.sin(f * 2.3) * 3 : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#24407a" a="#0a1226" />
      <Chip f={f} inicio={en("primer")} x={540} y={560} texto="SECRETO Nº 1" fondo={ORO} color="#13204a" tam={60} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* velocímetro */}
        <g transform="translate(540 1000)">
          <path d="M -300 0 A 300 300 0 0 1 300 0" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={60} />
          <path d="M -300 0 A 300 300 0 0 1 300 0" fill="none" stroke="url(#vel)" strokeWidth={60} strokeDasharray={`${interpolate(aguja, [-120, 95], [0, 942], clamp)} 2000`} />
          <defs>
            <linearGradient id="vel">
              <stop offset="0" stopColor="#5fd38a" />
              <stop offset="0.6" stopColor="#ffd93b" />
              <stop offset="1" stopColor="#ff4d3d" />
            </linearGradient>
          </defs>
          <g transform={`rotate(${aguja + tiembla})`}>
            <path d="M -10 0 L 0 -270 L 10 0 Z" fill="#fff" />
          </g>
          <circle r={30} fill="#fff" />
        </g>
        {/* soldados marchando a toda prisa */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = ((f * 9 + i * 200) % 1400) - 200;
          return <Soldado key={i} x={x} y={1800} escala={1} f={f + i * 3} paso={0.9} />;
        })}
      </svg>
      <Rotulo f={f} inicio={en("velocidad:")} texto="VELOCIDAD" y={1080} tam={120} />
      <Chip f={f} inicio={en("rápido")} x={540} y={1330} texto="¡MÁS RÁPIDO QUE NADIE!" fondo="#ff4d3d" color="#fff" tam={54} />
    </AbsoluteFill>
  );
};

const ligeros = ({ en }: Escenario): Dibujo => ({ f }) => {
  const tachar = interpolate(f, [en("convoyes.") + 2, en("convoyes.") + 12], [0, 1], clamp);
  const carros = interpolate(f, [en("esperar") - 4, en("convoyes.")], [1200, 560], { ...clamp, easing: Easing.out(Easing.cubic) });
  const comida = [
    { t: en("comían"), x: 210, y: 820, emo: "pan" },
    { t: en("comían") + 6, x: 400, y: 760, emo: "manzana" },
    { t: en("encontraban,"), x: 590, y: 820, emo: "queso" },
  ];
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#5b7f3a" a="#1b2a10" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={1600} width={W} height={320} fill="#4a3a20" />
        {comida.map((c) => {
          const s = interpolate(f, [c.t, c.t + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
          return (
            <g key={c.emo} transform={`translate(${c.x} ${c.y + Math.sin(f / 8 + c.x) * 8}) scale(${s})`}>
              {c.emo === "pan" && <ellipse rx={80} ry={45} fill="#d79a4b" stroke="#7a4a1a" strokeWidth={6} />}
              {c.emo === "pan" && <path d="M -40 -20 L -20 20 M 0 -25 L 20 18 M 40 -20 L 55 10" stroke="#7a4a1a" strokeWidth={6} />}
              {c.emo === "manzana" && <circle r={55} fill="#d63030" stroke="#7a1010" strokeWidth={6} />}
              {c.emo === "manzana" && <path d="M 0 -55 Q 10 -80 25 -85" stroke="#4a2a10" strokeWidth={8} fill="none" />}
              {c.emo === "queso" && <path d="M -70 30 L 70 30 L 70 -10 L -70 -40 Z" fill="#f3c742" stroke="#a07a10" strokeWidth={6} />}
            </g>
          );
        })}
        {/* soldado ligero */}
        <Soldado x={250} y={1640} escala={1.4} f={f} paso={0.5} />
        {/* convoy pesado que se tacha */}
        <g transform={`translate(${carros} 1540)`}>
          {[0, 1].map((k) => (
            <g key={k} transform={`translate(${k * 260} 0)`}>
              <rect x={0} y={-140} width={230} height={120} rx={10} fill="#8b6a3e" stroke="#4a3416" strokeWidth={6} />
              <path d="M 0 -140 Q 115 -230 230 -140" fill="#e8e0c8" stroke="#a89a70" strokeWidth={6} />
              <circle cx={50} cy={0} r={38} fill="none" stroke="#3a2a10" strokeWidth={12} />
              <circle cx={180} cy={0} r={38} fill="none" stroke="#3a2a10" strokeWidth={12} />
            </g>
          ))}
        </g>
        {tachar > 0 && (
          <g stroke="#ff2b2b" strokeWidth={26} strokeLinecap="round">
            <path d={`M ${carros - 20} 1330 L ${carros - 20 + 540 * tachar} ${1330 + 300 * tachar}`} />
            <path d={`M ${carros + 520} 1330 L ${carros + 520 - 540 * tachar} ${1330 + 300 * tachar}`} />
          </g>
        )}
      </svg>
      <Chip f={f} inicio={en("ligeros")} x={540} y={580} texto="EQUIPO LIGERO" fondo={ORO} color="#13204a" tam={58} />
      <Chip f={f} inicio={en("convoyes.")} x={760} y={1150} texto="SIN CONVOYES" fondo="#ff2b2b" color="#fff" tam={50} />
    </AbsoluteFill>
  );
};

const cuerpos = ({ en }: Escenario): Dibujo => ({ f }) => {
  const sep = interpolate(f, [en("avanzaban"), en("separados") + 10], [0, 1], { ...clamp, easing: suave });
  const une = interpolate(f, [en("unían"), en("atacar.")], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const golpe = interpolate(f, [en("atacar."), en("atacar.") + 14], [0, 1], clamp);
  const enemigo = { x: 760, y: 1150 };
  const inicios = [
    { x: 160, y: 700 },
    { x: 120, y: 1000 },
    { x: 160, y: 1350 },
    { x: 400, y: 1650 },
    { x: 700, y: 1700 },
  ];
  const nombres = ["I", "II", "III", "IV", "V"];
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#e7dcc0" a="#a8956a" polvo={false} />
      {/* cuadrícula de mapa de campaña */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M ${i * 100} 0 L ${i * 100} ${H} M 0 ${i * 170} L ${W} ${i * 170}`} stroke="rgba(90,60,20,0.18)" strokeWidth={3} />
        ))}
        {inicios.map((p, i) => {
          const s = interpolate(f, [en("cuerpos") + i * 3, en("cuerpos") + i * 3 + 8], [0, 1], clamp);
          const mx = p.x + (enemigo.x - p.x) * (0.45 * sep + 0.5 * une);
          const my = p.y + (enemigo.y - p.y) * (0.45 * sep + 0.5 * une);
          return (
            <g key={i} opacity={s}>
              <path d={`M ${p.x} ${p.y} L ${mx} ${my}`} stroke="#1e40af" strokeWidth={10} strokeDasharray="20 14" />
              <g transform={`translate(${mx} ${my})`}>
                <rect x={-60} y={-38} width={120} height={76} rx={10} fill="#1e40af" stroke="#fff" strokeWidth={6} />
                <path d="M -60 -38 L 60 38 M 60 -38 L -60 38" stroke="#fff" strokeWidth={5} opacity={0.6} />
                <text y={18} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={48} fill="#fff">
                  {nombres[i]}
                </text>
              </g>
            </g>
          );
        })}
        {/* enemigo */}
        <g transform={`translate(${enemigo.x} ${enemigo.y}) rotate(${golpe * 25}) scale(${1 - golpe * 0.3})`} opacity={1 - golpe * 0.6}>
          <rect x={-90} y={-55} width={180} height={110} rx={12} fill="#c62828" stroke="#fff" strokeWidth={6} />
          <path d="M -90 -55 L 90 55 M 90 -55 L -90 55" stroke="#fff" strokeWidth={6} opacity={0.6} />
        </g>
        {golpe > 0 && golpe < 1 && <circle cx={enemigo.x} cy={enemigo.y} r={80 + golpe * 260} fill="none" stroke="#ffb300" strokeWidth={20 * (1 - golpe)} />}
      </svg>
      <Chip f={f} inicio={en("segundo,")} x={540} y={560} texto="SECRETO Nº 2" fondo="#13204a" color={ORO} tam={60} />
      <Chip f={f} inicio={en("cuerpos")} x={540} y={1840} texto="CUERPOS DE EJÉRCITO" fondo="#1e40af" color="#fff" tam={52} />
    </AbsoluteFill>
  );
};

const canones = ({ en }: Escenario): Dibujo => ({ f }) => {
  const t0 = en("concentraba");
  const rompe = interpolate(f, [en("rompía"), en("rompía") + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#5a5f6a" a="#1a1c22" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={1500} width={W} height={420} fill="#3c4a2a" />
        {/* línea enemiga */}
        {Array.from({ length: 9 }, (_, i) => {
          const centro = Math.abs(i - 4) <= 1;
          const dir = i < 4 ? -1 : i > 4 ? 1 : 0;
          const vuela = centro ? rompe : rompe * 0.35;
          return (
            <g key={i} transform={`translate(${880 + dir * vuela * 140 + (centro ? vuela * 120 : 0)} ${780 + i * 95 - (centro ? vuela * 160 : 0)}) rotate(${vuela * (centro ? 120 : 30) * (dir || 1)})`} opacity={centro ? 1 - rompe * 0.8 : 1}>
              <rect x={-36} y={-36} width={72} height={72} rx={8} fill="#c62828" stroke="#fff" strokeWidth={5} />
            </g>
          );
        })}
        {/* cañones concentrados apuntando al centro */}
        {[0, 1, 2, 3].map((k) => {
          const local = f - t0 - k * 5;
          const disparo = local < 0 ? 0 : (local % 24) / 14;
          const bala = local < 0 ? 0 : (local % 24) / 12;
          const y0 = 1060 + k * 150;
          return (
            <g key={k} opacity={interpolate(f, [en("cañones:") + k * 3, en("cañones:") + k * 3 + 6], [0, 1], clamp)}>
              <Canon x={200} y={y0} escala={1.1} disparo={disparo < 1 ? disparo : 0} />
              {bala > 0 && bala < 1 && <circle cx={360 + bala * 480} cy={y0 - 110 + (1160 - y0 + 110) * bala} r={16} fill="#111" />}
            </g>
          );
        })}
        {rompe > 0 && rompe < 1 && <circle cx={880} cy={1160} r={60 + rompe * 300} fill="#ffcf40" opacity={0.6 * (1 - rompe)} />}
      </svg>
      <Chip f={f} inicio={en("tercero,")} x={540} y={560} texto="SECRETO Nº 3" fondo={ORO} color="#13204a" tam={60} />
      <Rotulo f={f} inicio={en("cañones:")} texto="ARTILLERÍA" y={650} tam={110} color="#fff" />
      <Sello f={f} inicio={en("rompía")} x={600} y={1700} texto="¡LÍNEA ROTA!" tam={80} />
    </AbsoluteFill>
  );
};

const austerlitz = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, dur, { lon: 14, lat: 49, zoom: 3 }, { lon: 18, lat: 50, zoom: 3.6 });
  const [x, y] = aPantalla(cam, L.austerlitz);
  const austria = interpolate(f, [en("Austria"), en("Austria") + 8], [0, 1], clamp);
  const rusia = interpolate(f, [en("Rusia."), en("Rusia.") + 8], [0, 1], clamp);
  const parp = 0.75 + Math.sin(f / 3) * 0.25;
  const espadas = useAparicion(f, en("Austerlitz,"), 8);
  return (
    <AbsoluteFill>
      <Mapa
        camara={cam}
        colores={{
          France: { color: AZUL, opacidad: 1 },
          Austria: { color: ROJO, opacidad: austria * parp },
          Czechia: { color: ROJO, opacidad: austria * parp },
          Russia: { color: ROJO, opacidad: rusia * parp },
          Belarus: { color: ROJO, opacidad: rusia * parp * 0.8 },
        }}
      />
      <Viñeta />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Espadas x={x} y={y} s={espadas * 1.1} />
      </svg>
      <Etiqueta f={f} x={x} y={y + 160} texto="AUSTERLITZ · 1805" inicio={en("Austerlitz,")} color="#13204a" tam={50} />
      <Chip f={f} inicio={en("Austria")} x={300} y={1450} texto="AUSTRIA" fondo="#c62828" color="#fff" tam={56} />
      <Chip f={f} inicio={en("Rusia.")} x={780} y={1450} texto="RUSIA" fondo="#c62828" color="#fff" tam={56} />
      <Sello f={f} inicio={en("Rusia.") + 10} x={540} y={1650} texto="VICTORIA" color="#1e40af" tam={96} />
    </AbsoluteFill>
  );
};

const jena = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, dur, { lon: 13, lat: 52, zoom: 3.2 }, { lon: 17, lat: 52.5, zoom: 3.2 });
  const [jx, jy] = aPantalla(cam, L.jena);
  const [fx, fy] = aPantalla(cam, L.friedland);
  const prusia = interpolate(f, [en("Prusia"), en("Prusia") + 8], [0, 1], clamp);
  const derrota = interpolate(f, [en("Jena,"), en("Jena,") + 10], [0, 1], clamp);
  const t = interpolate(f, [en("rusos"), en("Friedland.")], [0, 1], { ...clamp, easing: suave });
  return (
    <AbsoluteFill>
      <Mapa
        camara={cam}
        colores={{
          France: { color: AZUL, opacidad: 1 },
          Germany: { color: derrota > 0 ? AZUL_CLARO : ROJO, opacidad: derrota > 0 ? derrota : prusia },
          Poland: { color: ROJO, opacidad: prusia * 0.6 * (1 - derrota) },
        }}
      />
      <Viñeta />
      <Flecha cam={cam} ruta={[[6, 50.5], L.jena]} t={interpolate(f, [en("aplastó") - 6, en("Jena,")], [0, 1], clamp)} />
      <Flecha cam={cam} ruta={[L.jena, [16, 53], L.friedland]} t={t} />
      <Marcador f={f} inicio={en("Jena,")} cam={cam} ll={L.jena} color="#ff4d3d" />
      <Marcador f={f} inicio={en("Friedland.")} cam={cam} ll={L.friedland} color="#ff4d3d" />
      <Etiqueta f={f} x={jx} y={jy + 110} texto="JENA 1806" inicio={en("Jena,")} color="#13204a" tam={46} />
      <Etiqueta f={f} x={Math.min(880, fx)} y={fy - 110} texto="FRIEDLAND 1807" inicio={en("Friedland.")} color="#13204a" tam={46} />
      <Chip f={f} inicio={en("Prusia")} x={540} y={1600} texto="PRUSIA DERROTADA" fondo="#c62828" color="#fff" tam={54} />
    </AbsoluteFill>
  );
};

const codigo = ({ en }: Escenario): Dibujo => ({ f }) => {
  const abre = interpolate(f, [en("Código"), en("Civil") + 8], [0, 1], { ...clamp, easing: suave });
  const vuelan = interpolate(f, [en("leyes") - 4, en("Europa.") + 10], [0, 1], clamp);
  const chips = ["IGUALDAD ANTE LA LEY", "FIN DE PRIVILEGIOS", "MATRIMONIO CIVIL"];
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#3a2a1a" a="#0e0905" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* páginas que salen volando */}
        {Array.from({ length: 10 }, (_, i) => {
          const k = Math.max(0, vuelan * 1.6 - i * 0.06);
          if (k <= 0) return null;
          const ang = -160 + random(`a${i}`) * 140;
          const r = k * 700;
          return (
            <rect
              key={i}
              x={540 + Math.cos((ang * Math.PI) / 180) * r - 40}
              y={1250 + Math.sin((ang * Math.PI) / 180) * r - 55}
              width={80}
              height={110}
              fill="#f6efd9"
              stroke="#b9a777"
              strokeWidth={4}
              transform={`rotate(${k * 300 + i * 20} ${540 + Math.cos((ang * Math.PI) / 180) * r} ${1250 + Math.sin((ang * Math.PI) / 180) * r})`}
              opacity={Math.max(0, 1 - k * 0.7)}
            />
          );
        })}
        {/* libro */}
        <g transform="translate(540 1250)">
          <rect x={-330} y={-230} width={660} height={460} rx={16} fill="#5a1620" />
          <g transform={`scale(${1 - abre * 0} 1)`}>
            <rect x={-310} y={-210} width={310} height={420} fill="#f6efd9" opacity={abre} />
            <rect x={0} y={-210} width={310} height={420} fill="#efe6cc" opacity={abre} />
          </g>
          {/* tapa que se abre */}
          <g transform={`scale(${1 - 2 * abre} 1)`}>
            <rect x={0} y={-230} width={330} height={460} rx={16} fill="#7a1f2b" stroke={ORO} strokeWidth={8} />
            {abre < 0.5 && (
              <>
                <text x={165} y={-40} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={54} fill={ORO}>
                  CÓDIGO
                </text>
                <text x={165} y={30} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={54} fill={ORO}>
                  CIVIL
                </text>
                <text x={165} y={100} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={40} fill={ORO}>
                  1804
                </text>
              </>
            )}
          </g>
          {abre > 0.5 &&
            Array.from({ length: 7 }, (_, i) => (
              <g key={i}>
                <rect x={-280} y={-170 + i * 50} width={240 - (i % 3) * 30} height={14} rx={7} fill="#b9a777" opacity={0.7} />
                <rect x={30} y={-170 + i * 50} width={240 - ((i + 1) % 3) * 30} height={14} rx={7} fill="#b9a777" opacity={0.7} />
              </g>
            ))}
        </g>
      </svg>
      <Rotulo f={f} inicio={en("Código")} texto="CÓDIGO CIVIL" y={620} tam={110} />
      {chips.map((c, i) => (
        <Chip key={c} f={f} inicio={en("leyes") + i * 7} x={540} y={1580 + i * 105} texto={c} fondo={i === 1 ? ORO : "#fff"} color="#13204a" tam={46} />
      ))}
    </AbsoluteFill>
  );
};

const hermanos = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, dur, { lon: 6, lat: 47, zoom: 2.6 }, { lon: 7, lat: 46, zoom: 2.75 });
  const reinos: { pal: string; ll: LonLat; pais: string; nombre: string; rey: string }[] = [
    { pal: "Nápoles,", ll: L.napoles, pais: "Italy", nombre: "NÁPOLES", rey: "José / Murat" },
    { pal: "Holanda,", ll: L.holanda, pais: "Netherlands", nombre: "HOLANDA", rey: "Luis" },
    { pal: "Westfalia", ll: L.westfalia, pais: "Germany", nombre: "WESTFALIA", rey: "Jerónimo" },
    { pal: "España.", ll: L.madrid, pais: "Spain", nombre: "ESPAÑA", rey: "José" },
  ];
  const colores: Record<string, { color: string; opacidad: number }> = { France: { color: AZUL, opacidad: 1 } };
  reinos.forEach((r) => (colores[r.pais] = { color: AZUL_CLARO, opacidad: interpolate(f, [en(r.pal), en(r.pal) + 8], [0, 1], clamp) }));
  return (
    <AbsoluteFill>
      <Mapa camara={cam} colores={colores} />
      <Viñeta />
      {reinos.map((r) => {
        const [x, y] = aPantalla(cam, r.ll);
        const s = useAparicion(f, en(r.pal), 8);
        return (
          <React.Fragment key={r.nombre}>
            <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
              {f >= en(r.pal) && (
                <g transform={`translate(${x} ${y - 30 - (1 - s) * 200}) scale(${0.7 * s})`}>
                  <path d="M -70 30 L -80 -40 L -40 -5 L 0 -60 L 40 -5 L 80 -40 L 70 30 Z" fill="#ffc400" stroke="#8d6e00" strokeWidth={6} />
                  <rect x={-72} y={26} width={144} height={26} rx={6} fill="#ffb300" stroke="#8d6e00" strokeWidth={6} />
                  <circle cx={0} cy={39} r={8} fill="#d32f2f" />
                </g>
              )}
            </svg>
            <Etiqueta f={f} x={x + (r.nombre === "HOLANDA" ? -90 : r.nombre === "WESTFALIA" ? 70 : 0)} y={y + (r.nombre === "WESTFALIA" ? 95 : 50)} texto={r.nombre} inicio={en(r.pal)} color="#13204a" tam={40} />
          </React.Fragment>
        );
      })}
      <Chip f={f} inicio={en("hermanos")} x={540} y={1700} texto="LA FAMILIA BONAPARTE" fondo={ORO} color="#13204a" tam={52} />
    </AbsoluteFill>
  );
};

const imperio = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, dur, { lon: 10, lat: 49, zoom: 2.1 }, EUROPA);
  const k = interpolate(f, [en("dominaba"), en("continente,") + 15], [0, 1], clamp);
  const [mx, my] = aPantalla(cam, L.madrid);
  const [vx, vy] = aPantalla(cam, L.varsovia);
  const linea = interpolate(f, [en("Madrid"), en("Varsovia.")], [0, 1], { ...clamp, easing: suave });
  return (
    <AbsoluteFill>
      <Mapa camara={cam} colores={coloresImperio(k)} />
      <Viñeta />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {linea > 0 && (
          <path d={`M ${mx} ${my} L ${mx + (vx - mx) * linea} ${my + (vy - my) * linea}`} stroke={ORO} strokeWidth={10} strokeDasharray="6 18" strokeLinecap="round" />
        )}
      </svg>
      <Marcador f={f} inicio={en("Madrid")} cam={cam} ll={L.madrid} />
      <Marcador f={f} inicio={en("Varsovia.")} cam={cam} ll={L.varsovia} />
      <Etiqueta f={f} x={mx} y={my + 80} texto="MADRID" inicio={en("Madrid")} color="#13204a" tam={42} />
      <Etiqueta f={f} x={vx} y={vy - 80} texto="VARSOVIA" inicio={en("Varsovia.")} color="#13204a" tam={42} />
      <Rotulo f={f} inicio={en("1811")} texto="1811" y={540} tam={150} />
      <div style={{ position: "absolute", left: 60, bottom: 120, fontFamily: SANS, fontWeight: 800, fontSize: 36, color: "#fff", opacity: k }}>
        <div><span style={{ display: "inline-block", width: 36, height: 36, background: `rgb(${AZUL})`, borderRadius: 8, marginRight: 14, verticalAlign: "middle" }} />Imperio francés</div>
        <div style={{ marginTop: 12 }}><span style={{ display: "inline-block", width: 36, height: 36, background: `rgb(${AZUL_CLARO})`, borderRadius: 8, marginRight: 14, verticalAlign: "middle" }} />Estados dependientes y aliados</div>
      </div>
    </AbsoluteFill>
  );
};

const rusia = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, dur, { lon: 20, lat: 53, zoom: 2.4 }, { lon: 30, lat: 55, zoom: 3 });
  const t = interpolate(f, [en("invadió"), dur], [0, 1], { ...clamp, easing: suave });
  const [mx, my] = aPantalla(cam, L.moscu);
  return (
    <AbsoluteFill>
      <Mapa camara={cam} colores={{ ...coloresImperio(1), Russia: { color: ROJO, opacidad: interpolate(f, [en("Rusia"), en("Rusia") + 8], [0, 0.8], clamp) } }} />
      <Viñeta />
      <Flecha cam={cam} ruta={[[16, 52.5], L.niemen, [30.4, 54.8], L.moscu]} t={t} grosor={34} />
      <Marcador f={f} inicio={en("Rusia")} cam={cam} ll={L.moscu} color="#ff4d3d" />
      <Etiqueta f={f} x={mx - 40} y={my - 100} texto="MOSCÚ" inicio={en("Rusia")} color="#7a1010" tam={46} />
      <Rotulo f={f} inicio={en("1812")} texto="1812" y={540} tam={140} />
      <Contador f={f} inicio={en("seiscientos")} fin={en("hombres.") + 6} hasta={600000} y={1420} tam={150} color="#fff" sufijo="+" />
      <Chip f={f} inicio={en("hombres.")} x={540} y={1650} texto="SOLDADOS" fondo="#13204a" color={ORO} tam={56} />
    </AbsoluteFill>
  );
};

const invierno = ({ en }: Escenario): Dibujo => ({ f }) => {
  const temp = Math.round(interpolate(f, [en("frío"), en("hambre") + 10], [0, -30], clamp));
  const barra = interpolate(f, [en("destrozaron"), en("pocos.")], [1, 0.12], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#6a86a8" a="#101a2a" polvo={false} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d={`M 0 1560 Q 270 1500 540 1560 T 1080 1550 L 1080 1920 L 0 1920 Z`} fill="#eef4fb" />
        {/* columna que se tambalea */}
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i} opacity={interpolate(barra, [i * 0.2, i * 0.2 + 0.2], [0, 1], clamp)}>
            <Soldado x={140 + i * 190} y={1620} escala={0.9} f={f + i * 7} paso={0.15} color="#3a4a6a" nieve />
          </g>
        ))}
        {/* nieve */}
        {Array.from({ length: 90 }, (_, i) => {
          const x = (random(`n${i}`) * W + Math.sin(f / 20 + i) * 40 - f * 3 + W * 10) % W;
          const y = (random(`m${i}`) * H + f * (6 + random(`s${i}`) * 6)) % H;
          return <circle key={i} cx={x} cy={y} r={3 + random(`t${i}`) * 6} fill="#fff" opacity={0.85} />;
        })}
        {/* termómetro */}
        <g transform="translate(880 900)">
          <rect x={-30} y={-280} width={60} height={360} rx={30} fill="#fff" stroke="#333" strokeWidth={6} />
          <circle cy={110} r={56} fill="#2f7de1" stroke="#333" strokeWidth={6} />
          <rect x={-16} y={interpolate(temp, [-30, 0], [40, -200])} width={32} height={interpolate(temp, [-30, 0], [80, 320])} fill="#2f7de1" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 720, top: 1080, width: 320, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 80, color: "#fff", textShadow: "0 6px 20px rgba(0,0,0,0.7)", opacity: f >= en("frío") ? 1 : 0 }}>
        {temp}°C
      </div>
      <Chip f={f} inicio={en("hambre")} x={300} y={700} texto="HAMBRE" fondo="#7a1010" color="#fff" tam={60} />
      {/* barra de tropas */}
      <div style={{ position: "absolute", left: 80, top: 900, width: 560, fontFamily: SANS, fontWeight: 900, color: "#fff", fontSize: 40, opacity: f >= en("destrozaron") - 6 ? 1 : 0 }}>
        GRANDE ARMÉE
        <div style={{ marginTop: 12, height: 60, background: "rgba(255,255,255,0.2)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ width: `${barra * 100}%`, height: "100%", background: barra < 0.3 ? "#ff4d3d" : "#2f7de1" }} />
        </div>
      </div>
      <Sello f={f} inicio={en("pocos.")} x={420} y={1180} texto="VOLVIERON POCOS" tam={64} />
    </AbsoluteFill>
  );
};

const waterloo = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, dur * 0.7, { lon: 4, lat: 49, zoom: 3.5 }, { lon: 4.4, lat: 50.6, zoom: 7 });
  const [x, y] = aPantalla(cam, L.waterloo);
  const cae = interpolate(f, [en("cayó"), en("cayó") + 18], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const gris = interpolate(f, [en("Waterloo."), en("Waterloo.") + 15], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, filter: `grayscale(${gris}) brightness(${1 - gris * 0.3})` }}>
        <Mapa camara={cam} colores={{ France: { color: AZUL, opacidad: 1 - gris * 0.7 }, Belgium: { color: ROJO, opacidad: 0.5 } }} />
      </div>
      <Viñeta />
      <Marcador f={f} inicio={en("Waterloo.")} cam={cam} ll={L.waterloo} color="#ff4d3d" />
      <Etiqueta f={f} x={x} y={y - 120} texto="WATERLOO" inicio={en("Waterloo.")} color="#7a1010" tam={56} />
      <Rotulo f={f} inicio={en("1815")} texto="1815" y={540} tam={150} color="#fff" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Napoleon x={620} y={1950} escala={1.05} f={f} sombrero={cae} brazo={cae < 1 ? 10 : -30} />
      </svg>
      <Sello f={f} inicio={en("Waterloo.") + 8} x={540} y={1100} texto="FIN DEL IMPERIO" tam={74} />
    </AbsoluteFill>
  );
};

const final = ({ en }: Escenario): Dibujo => ({ f }) => {
  const genio = useAparicion(f, en("Genio"), 9);
  const tirano = useAparicion(f, en("tirano?"), 9);
  const latido = 1 + Math.sin(f / 5) * 0.03;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: W / 2, height: H, background: "linear-gradient(#1e40af, #0b1b5a)", transform: `translateX(${(genio - 1) * 540}px)` }} />
      <div style={{ position: "absolute", left: W / 2, top: 0, width: W / 2, height: H, background: "linear-gradient(#b71c1c, #4a0808)", transform: `translateX(${(1 - tirano) * 540}px)` }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Napoleon x={540} y={1500} escala={1.1} f={f} brazo={-40} />
      </svg>
      <Rotulo f={f} inicio={en("Genio")} texto="GENIO" y={260} tam={130} color={ORO} />
      <Rotulo f={f} inicio={en("militar")} texto="MILITAR" y={400} tam={70} color="#fff" />
      <Rotulo f={f} inicio={en("tirano?")} texto="¿O TIRANO?" y={500} tam={120} color="#fff" />
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 1560,
          padding: "34px 30px",
          borderRadius: 40,
          background: "#fff",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 62,
          color: "#13204a",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          transform: `scale(${useAparicion(f, en("Escríbelo"), 9) * latido})`,
        }}
      >
        Escríbelo en los comentarios
      </div>
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, (e: Escenario) => Dibujo> = {
  gancho,
  corcega,
  revolucion,
  emperador,
  velocidad,
  ligeros,
  cuerpos,
  canones,
  austerlitz,
  jena,
  codigo,
  hermanos,
  imperio,
  rusia,
  invierno,
  waterloo,
  final,
};

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>) =>
  Object.fromEntries(Object.entries(FABRICAS).map(([k, fab]) => [k, fab(esc[k as Ilustracion])])) as Record<Ilustracion, Dibujo>;
