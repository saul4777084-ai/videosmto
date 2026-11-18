import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useVideoConfig } from "remotion";
import { geoOrthographic, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import mundo from "world-atlas/countries-110m.json";
import { Dibujo } from "../comun/tipos";
import type { Escenario } from "./escenas";
import { aPantalla, Camara, centroDe, kmEntre, LonLat, MapaSahara, mezclarCamara, rutaDe, SAHARA, saharaMovido } from "./MapaSahara";

const W = 1080;
const H = 1920;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.inOut(Easing.cubic);
const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const ARENA = "#f2b45c";
const ORO = "#ffd54a";
const NOCHE = "#1d1408";

export type Ilustracion =
  | "gancho"
  | "tamano"
  | "distancia"
  | "paises"
  | "cielo"
  | "seco"
  | "nubes"
  | "ancha"
  | "atlas"
  | "corriente"
  | "lluvia"
  | "arena"
  | "verde"
  | "bamboleo"
  | "crece"
  | "final";

// ---------- utilidades ----------

const useAparicion = (f: number, inicio: number, damping = 11) => {
  const { fps } = useVideoConfig();
  return spring({ frame: f - inicio, fps, config: { damping } });
};
const prog = (f: number, a: number, b: number) => interpolate(f, [a, Math.max(a + 1, b)], [0, 1], { ...clamp, easing: suave });
const camaraEntre = (f: number, a0: number, a1: number, a: Camara, b: Camara) => mezclarCamara(a, b, prog(f, a0, a1));
const miles = (n: number) => Math.round(n).toLocaleString("de-DE"); // 9.200.000

// ---------- piezas comunes ----------

// granos de arena que vuelan con el viento
const Viento: React.FC<{ f: number; n?: number; color?: string; opacidad?: number }> = ({ f, n = 60, color = "#ffe2a8", opacidad = 1 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: opacidad }}>
    {Array.from({ length: n }, (_, i) => {
      const v = 6 + random(`v${i}`) * 10;
      const x = (random(`x${i}`) * (W + 200) + f * v) % (W + 200) - 100;
      const y = random(`y${i}`) * H + Math.sin((f + i * 13) / 14) * 12;
      const l = 10 + random(`l${i}`) * 26;
      return <line key={i} x1={x} y1={y} x2={x + l} y2={y - l * 0.08} stroke={color} strokeWidth={2 + random(`r${i}`) * 3} strokeLinecap="round" opacity={0.15 + random(`o${i}`) * 0.4} />;
    })}
  </svg>
);

const Vineta = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)" }} />;

// etiqueta sobre el mapa (centrada en x, y)
const Etiqueta: React.FC<{ f: number; inicio: number; x: number; y: number; texto: string; fondo?: string; color?: string; tam?: number }> = ({
  f,
  inicio,
  x,
  y,
  texto,
  fondo = NOCHE,
  color = "#fff",
  tam = 40,
}) => {
  const s = useAparicion(f, inicio, 11);
  if (f < inicio) return null;
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
        letterSpacing: 1,
        padding: "8px 20px",
        borderRadius: 14,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
        border: "3px solid rgba(255,255,255,0.85)",
      }}
    >
      {texto}
    </div>
  );
};

// tarjeta con un dato grande (abajo a la derecha, lejos del avatar y de los subtítulos)
const Dato: React.FC<{ f: number; inicio: number; arriba: string; valor: string; y?: number; color?: string; x?: number }> = ({
  f,
  inicio,
  arriba,
  valor,
  y = 1420,
  color = ORO,
  x = 640,
}) => {
  const s = useAparicion(f, inicio, 10);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${(1 - s) * -6}deg)`,
        background: "rgba(20,14,6,0.88)",
        border: `5px solid ${color}`,
        borderRadius: 30,
        padding: "16px 38px 20px",
        textAlign: "center",
        fontFamily: SANS,
        boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ color: "#fff", fontSize: 38, fontWeight: 800, letterSpacing: 2 }}>{arriba}</div>
      <div style={{ color, fontSize: 82, fontWeight: 900, lineHeight: 1.05 }}>{valor}</div>
    </div>
  );
};

// "RAZÓN 1", "RAZÓN 2"...
const Razon: React.FC<{ f: number; inicio: number; n: number }> = ({ f, inicio, n }) => {
  const s = useAparicion(f, inicio, 9);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 470,
        transform: `translate(-50%, -50%) scale(${s}) rotate(-3deg)`,
        background: ORO,
        color: NOCHE,
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: 64,
        padding: "8px 40px",
        borderRadius: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        letterSpacing: 3,
      }}
    >
      RAZÓN {n}
    </div>
  );
};

const Nube: React.FC<{ x: number; y: number; s: number; color?: string; opacidad?: number }> = ({ x, y, s, color = "#fff", opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <ellipse cx={0} cy={14} rx={110} ry={42} fill={color} />
    <circle cx={-50} cy={0} r={46} fill={color} />
    <circle cx={10} cy={-24} r={60} fill={color} />
    <circle cx={62} cy={4} r={40} fill={color} />
  </g>
);

const Lluvia: React.FC<{ f: number; x: number; y: number; ancho: number; alto: number; intensidad: number; semilla?: string }> = ({ f, x, y, ancho, alto, intensidad, semilla = "ll" }) => (
  <g opacity={intensidad}>
    {Array.from({ length: 26 }, (_, i) => {
      const dx = random(`${semilla}x${i}`) * ancho;
      const fase = (f * 22 + random(`${semilla}y${i}`) * alto) % alto;
      return <line key={i} x1={x + dx} y1={y + fase} x2={x + dx - 6} y2={y + fase + 30} stroke="#8fd3ff" strokeWidth={6} strokeLinecap="round" />;
    })}
  </g>
);

const Sol: React.FC<{ f: number; x: number; y: number; r: number; s?: number }> = ({ f, x, y, r, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={r * 1.9} fill="rgba(255,200,60,0.18)" />
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2 + f / 40;
      return <line key={i} x1={Math.cos(a) * r * 1.2} y1={Math.sin(a) * r * 1.2} x2={Math.cos(a) * r * 1.6} y2={Math.sin(a) * r * 1.6} stroke="#ffcc33" strokeWidth={12} strokeLinecap="round" />;
    })}
    <circle r={r} fill="#ffd23f" stroke="#ff9f1c" strokeWidth={8} />
  </g>
);

// flecha gruesa dibujándose a lo largo de una polilínea (en pantalla)
const Flecha: React.FC<{ pts: [number, number][]; t: number; color: string; grosor?: number }> = ({ pts, t, color, grosor = 26 }) => {
  if (t <= 0) return null;
  const largos = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = largos.reduce((a, b) => a + b, 0);
  let d = t * total;
  const visibles: [number, number][] = [pts[0]];
  for (let i = 0; i < largos.length; i++) {
    if (d >= largos[i]) {
      visibles.push(pts[i + 1]);
      d -= largos[i];
    } else {
      const k = d / largos[i];
      visibles.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
      break;
    }
  }
  const fin = visibles[visibles.length - 1];
  const prev = visibles[visibles.length - 2] ?? pts[0];
  const ang = Math.atan2(fin[1] - prev[1], fin[0] - prev[0]);
  const c = grosor * 1.4;
  return (
    <g style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.4))" }}>
      <polyline points={visibles.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" />
      <polygon
        points={[
          [fin[0] + Math.cos(ang) * c, fin[1] + Math.sin(ang) * c],
          [fin[0] + Math.cos(ang + 2.3) * c, fin[1] + Math.sin(ang + 2.3) * c],
          [fin[0] + Math.cos(ang - 2.3) * c, fin[1] + Math.sin(ang - 2.3) * c],
        ]
          .map((p) => p.join(","))
          .join(" ")}
        fill={color}
      />
    </g>
  );
};

// aspa roja que tacha algo
const Aspa: React.FC<{ f: number; inicio: number; x: number; y: number; tam?: number }> = ({ f, inicio, x, y, tam = 120 }) => {
  const t = prog(f, inicio, inicio + 8);
  if (t <= 0) return null;
  return (
    <g transform={`translate(${x} ${y})`} style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }}>
      <line x1={-tam} y1={-tam} x2={-tam + 2 * tam * Math.min(1, t * 2)} y2={-tam + 2 * tam * Math.min(1, t * 2)} stroke="#e53935" strokeWidth={26} strokeLinecap="round" />
      {t > 0.5 && <line x1={tam} y1={-tam} x2={tam - 2 * tam * (t * 2 - 1)} y2={-tam + 2 * tam * (t * 2 - 1)} stroke="#e53935" strokeWidth={26} strokeLinecap="round" />}
    </g>
  );
};

// dunas para los diagramas
const Dunas: React.FC<{ x: number; y: number; ancho: number; t: number }> = ({ x, y, ancho, t }) => (
  <g opacity={t} transform={`translate(${x} ${y + (1 - t) * 40})`}>
    <path d={`M 0 0 Q ${ancho * 0.2} -90 ${ancho * 0.42} -10 Q ${ancho * 0.6} -120 ${ancho * 0.82} -15 Q ${ancho * 0.92} -60 ${ancho} 0 Z`} fill="#e8a54f" />
    <path d={`M ${ancho * 0.1} 0 Q ${ancho * 0.35} -60 ${ancho * 0.55} 0 Z`} fill="#d48a3a" />
  </g>
);

// ---------- cámaras del mapa ----------
const SAHARA_CAM: Camara = { lon: 11, lat: 21, zoom: 1.75 };
const MUNDO_CAM: Camara = { lon: 8, lat: 18, zoom: 0.42 };
const AMERICA_CAM: Camara = { lon: -43, lat: 30, zoom: 0.56 };
const AFRICA_CAM: Camara = { lon: 11, lat: 19, zoom: 1.5 };
const ATLAS_CAM: Camara = { lon: -4, lat: 31, zoom: 3.2 };
const COSTA_CAM: Camara = { lon: -13, lat: 24, zoom: 2.6 };

// ---------- 1. gancho ----------
const Gancho = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, 0, e.dur, MUNDO_CAM, { lon: 11, lat: 19, zoom: 1.55 });
  const arena = prog(f, e.en("desierto") - 4, e.en("Sahara"));
  const brillo = 0.5 + 0.5 * Math.sin(f / 5);
  const s1 = useAparicion(f, 0, 12);
  const s2 = useAparicion(f, e.en("enorme?") - 3, 7);
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam} arena={arena} brilloSahara={f >= e.en("Sahara") ? brillo : 0} />
      <Viento f={f} opacidad={arena} />
      <Vineta />
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900 }}>
        <div style={{ fontSize: 92, color: "#fff", transform: `scale(${s1})`, textShadow: "0 8px 24px rgba(0,0,0,0.8)", lineHeight: 1.05 }}>
          ¿POR QUÉ EL
          <br />
          SAHARA ES
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 18,
            fontSize: 112,
            color: NOCHE,
            background: ORO,
            padding: "4px 32px",
            borderRadius: 24,
            transform: `scale(${s2}) rotate(-3deg)`,
            boxShadow: "0 14px 40px rgba(0,0,0,0.5)",
          }}
        >
          TAN ENORME?
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 2. tamaño: el Sahara llevado (a tamaño real) sobre Estados Unidos ----------
const EEUU: LonLat = [-98, 39.5];
const Tamano = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, e.en("kilómetros") - 6, e.en("casi") + 6, SAHARA_CAM, AMERICA_CAM);
  const viaje = prog(f, e.en("casi"), e.en("Estados") + 4);
  const conteo = prog(f, e.en("nueve") - 2, e.en("cuadrados:"));
  const eeuu = prog(f, e.en("Estados") - 2, e.en("Estados") + 8);
  const copia = f >= e.en("casi") - 2;
  const [sx, sy] = aPantalla(cam, viaje < 1 ? [-98 * viaje + 13 * (1 - viaje), 39.5 * viaje + 22 * (1 - viaje)] : EEUU);
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam}>
        {copia && (
          <path
            d={saharaMovido(EEUU, viaje)}
            fill="rgba(242,180,92,0.7)"
            stroke="#fff3c4"
            strokeWidth={5}
            strokeDasharray="16 10"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.5))" }}
          />
        )}
        {/* contorno de EE. UU. por encima, para comparar */}
        <path d={rutaDe("United States of America")} fill="none" stroke="#3d7cf0" strokeWidth={6} opacity={eeuu} vectorEffect="non-scaling-stroke" />
      </MapaSahara>
      <Viento f={f} n={30} />
      {copia && <Etiqueta f={f} inicio={e.en("casi")} x={sx} y={sy - 30 - 60 * viaje} texto="SAHARA" fondo="#b8641c" tam={44} />}
      <Etiqueta f={f} inicio={e.en("Unidos")} x={aPantalla(cam, [-96, 22])[0] + 40} y={aPantalla(cam, [-96, 22])[1]} texto="EE. UU.: 9,8 M km²" fondo="#2d5fc4" tam={38} />
      <Dato f={f} inicio={e.en("nueve") - 2} arriba="SUPERFICIE" valor={`${miles(9200000 * conteo)} km²`} y={1300} />
    </AbsoluteFill>
  );
};

// ---------- 3. distancia: del Atlántico al mar Rojo ----------
const OESTE: LonLat = [-16.6, 20.6];
const ESTE: LonLat = [37.1, 20.6];
const Distancia = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, 0, e.dur, { ...SAHARA_CAM, zoom: 1.65 }, { ...SAHARA_CAM, zoom: 1.8 });
  const t = prog(f, e.en("Atlántico"), e.en("Rojo") + 6);
  const [x0, y0] = aPantalla(cam, OESTE);
  const [x1, y1] = aPantalla(cam, ESTE);
  const xm = x0 + (x1 - x0) * t;
  const km = prog(f, e.en("cinco") - 3, e.en("kilómetros") + 6);
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam} brilloSahara={0.6} />
      <Viento f={f} n={40} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={y0} x2={xm} y2={y1} stroke="#fff" strokeWidth={10} strokeDasharray="22 14" strokeLinecap="round" style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.7))" }} />
        <circle cx={x0} cy={y0} r={18} fill={ORO} stroke="#fff" strokeWidth={5} />
        {t > 0.98 && <circle cx={x1} cy={y1} r={18} fill={ORO} stroke="#fff" strokeWidth={5} />}
        {t > 0 && t < 1 && <circle cx={xm} cy={y1} r={14} fill="#fff" />}
      </svg>
      <Etiqueta f={f} inicio={e.en("Atlántico") - 2} x={x0 + 60} y={y0 - 80} texto="ATLÁNTICO" fondo="#1d5f99" tam={36} />
      <Etiqueta f={f} inicio={e.en("Rojo")} x={x1 - 70} y={y1 - 80} texto="MAR ROJO" fondo="#b3261e" tam={36} />
      <Etiqueta f={f} inicio={e.en("arena")} x={420} y={y0 + 120} texto="ARENA" fondo="#c47a26" tam={34} />
      <Etiqueta f={f} inicio={e.en("roca.")} x={700} y={y0 + 120} texto="ROCA" fondo="#6d4c41" tam={34} />
      <Dato f={f} inicio={e.en("cinco") - 3} arriba="DE ESTE A OESTE" valor={`${miles(4800 * km)} km`} y={1330} />
    </AbsoluteFill>
  );
};

// ---------- 4. once países ----------
const PAISES: [string, string][] = [
  ["Mauritania", "Mauritania"],
  ["W. Sahara", "Sáhara Occ."],
  ["Morocco", "Marruecos"],
  ["Algeria", "Argelia"],
  ["Tunisia", "Túnez"],
  ["Mali", "Malí"],
  ["Niger", "Níger"],
  ["Libya", "Libia"],
  ["Chad", "Chad"],
  ["Egypt", "Egipto"],
  ["Sudan", "Sudán"],
];
const TONOS = ["230,120,40", "250,190,60", "200,80,60", "240,150,70", "180,100,50"];
const Paises = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, 0, e.dur, { ...SAHARA_CAM, zoom: 1.8 }, { lon: 12, lat: 22, zoom: 1.7 });
  const a = e.en("reparte") - 4;
  const b = e.en("países.") + 4;
  const paso = (b - a) / PAISES.length;
  const colores = Object.fromEntries(PAISES.map(([n], i) => [n, { color: TONOS[i % TONOS.length], opacidad: prog(f, a + i * paso, a + i * paso + 5) }]));
  const encendidos = PAISES.filter((_, i) => f >= a + i * paso).length;
  const ajuste: Record<string, LonLat> = { Morocco: [-6.5, 32.2], "W. Sahara": [-13, 24.5], Tunisia: [9.5, 34.5], Sudan: [30, 18], Mauritania: [-10.5, 20] };
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam} colores={colores} />
      {PAISES.map(([n, es], i) => {
        const [x, y] = aPantalla(cam, ajuste[n] ?? centroDe(n));
        return <Etiqueta key={n} f={f} inicio={a + i * paso} x={x} y={y} texto={es} tam={26} />;
      })}
      <Dato f={f} inicio={a} arriba="PAÍSES" valor={`${Math.max(1, encendidos)}`} y={1330} />
    </AbsoluteFill>
  );
};

// ---------- 5-7. diagrama de la célula de Hadley (vista de lado) ----------
const SUELO_Y = 1180;
const X_ECUADOR = 230;
const X_SAHARA = 830;
const ALTO_Y = 560;

type EstadoCelda = { sol: number; calor: number; sube: number; nube: number; lluvia: number; seco: number; viaja: number; baja: number; dunas: number; sinNubes: number };

const Celda: React.FC<{ f: number; s: EstadoCelda; zoom?: number }> = ({ f, s, zoom = 1 }) => {
  const subida: [number, number][] = [
    [X_ECUADOR, SUELO_Y - 40],
    [X_ECUADOR, ALTO_Y + 40],
  ];
  const arriba: [number, number][] = [
    [X_ECUADOR + 40, ALTO_Y - 20],
    [X_SAHARA - 40, ALTO_Y - 20],
  ];
  const bajada: [number, number][] = [
    [X_SAHARA, ALTO_Y + 40],
    [X_SAHARA, SUELO_Y - 80],
  ];
  const colorAire = interpolate(s.seco, [0, 1], [0, 1]);
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${X_SAHARA}px ${(ALTO_Y + SUELO_Y) / 2}px` }}>
      <AbsoluteFill style={{ background: "linear-gradient(#2f7ec4 0%, #7dc0ee 55%, #f6d79b 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* suelo curvo: del ecuador (verde) al Sahara (arena) */}
        <defs>
          <linearGradient id="suelo" x1="0" x2="1">
            <stop offset="0" stopColor="#3f8f3a" />
            <stop offset="0.45" stopColor="#7aa43c" />
            <stop offset="0.75" stopColor="#e3a24e" />
            <stop offset="1" stopColor="#e9ad5a" />
          </linearGradient>
        </defs>
        <path d={`M -50 ${SUELO_Y + 30} Q 540 ${SUELO_Y - 70} 1130 ${SUELO_Y + 30} L 1130 ${H} L -50 ${H} Z`} fill="url(#suelo)" />
        <Dunas x={X_SAHARA - 230} y={SUELO_Y - 8} ancho={480} t={s.dunas} />
        {/* árboles en el ecuador */}
        {[-120, -50, 30, 110].map((dx, i) => (
          <g key={i} transform={`translate(${X_ECUADOR + dx} ${SUELO_Y - 10 + Math.abs(dx) * 0.1})`}>
            <rect x={-8} y={-50} width={16} height={50} fill="#5d3b1a" />
            <circle cx={0} cy={-70} r={42} fill="#2e7d32" />
          </g>
        ))}
        <Sol f={f} x={X_ECUADOR + 20} y={340} r={70} s={s.sol} />
        {/* calor que sube del suelo */}
        {s.calor > 0 &&
          [-60, 0, 60].map((dx, i) => {
            const fase = ((f + i * 9) % 30) / 30;
            return (
              <path
                key={i}
                d={`M ${X_ECUADOR + dx} ${SUELO_Y - 110 - fase * 80} q 14 -20 0 -40 q -14 -20 0 -40`}
                fill="none"
                stroke="#ff7043"
                strokeWidth={8}
                strokeLinecap="round"
                opacity={s.calor * (1 - fase)}
              />
            );
          })}
        <Flecha pts={subida} t={s.sube} color="#e53935" />
        <Nube x={X_ECUADOR} y={ALTO_Y - 10} s={0.4 + 0.75 * s.nube} color="#e6edf5" opacidad={Math.min(1, s.nube * 2)} />
        <Lluvia f={f} x={X_ECUADOR - 100} y={ALTO_Y + 40} ancho={200} alto={SUELO_Y - ALTO_Y - 160} intensidad={s.lluvia} />
        <Flecha pts={arriba} t={s.viaja} color={`rgb(${interpolate(colorAire, [0, 1], [229, 255])},${interpolate(colorAire, [0, 1], [57, 160])},${interpolate(colorAire, [0, 1], [53, 40])})`} />
        <Flecha pts={bajada} t={s.baja} color="#ff9f1c" />
        {/* nubes que intentan formarse sobre el Sahara y se deshacen */}
        {s.sinNubes > 0 &&
          [-150, 150].map((dx, i) => {
            const t = Math.min(1, s.sinNubes * 1.6 - i * 0.3);
            const deshace = Math.max(0, s.sinNubes * 2 - 1);
            return <Nube key={i} x={X_SAHARA + dx} y={760 + i * 40} s={0.45 * Math.max(0, t) * (1 - deshace * 0.6)} opacidad={Math.max(0, t) * (1 - deshace)} />;
          })}
      </svg>
    </AbsoluteFill>
  );
};

const Cielo = (e: Escenario): Dibujo => ({ f }) => {
  const s: EstadoCelda = {
    sol: useAparicion(f, e.en("cielo:") - 3, 10),
    calor: prog(f, e.en("caliente") - 3, e.en("caliente") + 6),
    sube: prog(f, e.en("sube") - 3, e.en("descarga") + 4),
    nube: prog(f, e.en("descarga") - 2, e.en("lluvia.")),
    lluvia: prog(f, e.en("lluvia.") - 6, e.en("lluvia.") + 4),
    seco: 0,
    viaja: 0,
    baja: 0,
    dunas: 0,
    sinNubes: 0,
  };
  return (
    <AbsoluteFill>
      <Celda f={f} s={s} />
      <Razon f={f} inicio={e.en("primera")} n={1} />
      <Etiqueta f={f} inicio={e.en("ecuador,")} x={X_ECUADOR + 20} y={SUELO_Y + 80} texto="ECUADOR" fondo="#2e7d32" />
      <Etiqueta f={f} inicio={e.en("caliente") + 2} x={X_ECUADOR + 230} y={860} texto="AIRE CALIENTE" fondo="#c62828" tam={32} />
    </AbsoluteFill>
  );
};

const Seco = (e: Escenario): Dibujo => ({ f }) => {
  const s: EstadoCelda = {
    sol: 1,
    calor: 1,
    sube: 1,
    nube: 1,
    lluvia: interpolate(f, [0, 40], [1, 0.4], clamp),
    seco: prog(f, e.en("seco,") - 3, e.en("seco,") + 8),
    viaja: prog(f, e.en("viaja") - 2, e.en("norte") + 6),
    baja: prog(f, e.en("baja") - 2, e.en("encima") + 4),
    dunas: prog(f, e.en("Sahara.") - 6, e.en("Sahara.") + 4),
    sinNubes: 0,
  };
  return (
    <AbsoluteFill>
      <Celda f={f} s={s} />
      <Etiqueta f={f} inicio={0} x={X_ECUADOR + 20} y={SUELO_Y + 80} texto="ECUADOR" fondo="#2e7d32" />
      <Etiqueta f={f} inicio={e.en("seco,") - 2} x={540} y={ALTO_Y - 110} texto="AIRE SECO" fondo="#e07b00" />
      <Etiqueta f={f} inicio={e.en("norte")} x={X_SAHARA - 20} y={ALTO_Y - 110} texto="NORTE →" fondo={NOCHE} tam={32} />
      <Etiqueta f={f} inicio={e.en("Sahara.") - 3} x={X_SAHARA} y={SUELO_Y + 80} texto="SAHARA" fondo="#b8641c" />
    </AbsoluteFill>
  );
};

const Termometro: React.FC<{ f: number; x: number; y: number; nivel: number; frio?: boolean; s?: number }> = ({ x, y, nivel, frio = false, s = 1 }) => {
  const color = frio ? "#29b6f6" : "#e53935";
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.4))" }}>
        <rect x={-34} y={-260} width={68} height={280} rx={34} fill="#fff" stroke={NOCHE} strokeWidth={6} />
        <rect x={-16} y={-240 + 220 * (1 - nivel)} width={32} height={20 + 220 * nivel} rx={16} fill={color} />
        <circle cx={0} cy={40} r={56} fill={color} stroke={NOCHE} strokeWidth={6} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={14} x2={30} y1={-210 + i * 55} y2={-210 + i * 55} stroke={NOCHE} strokeWidth={5} />
        ))}
      </g>
    </svg>
  );
};

const Nubes = (e: Escenario): Dibujo => ({ f }) => {
  const zoom = interpolate(f, [0, 20], [1, 1.25], { ...clamp, easing: suave });
  const s: EstadoCelda = {
    sol: 1,
    calor: 1,
    sube: 1,
    nube: 1,
    lluvia: 0.4,
    seco: 1,
    viaja: 1,
    baja: 1,
    dunas: 1,
    sinNubes: prog(f, e.en("deja") - 4, e.en("nubes.") + 10),
  };
  const nivel = interpolate(f, [e.en("calienta") - 6, e.en("calienta") + 18], [0.25, 0.92], { ...clamp, easing: suave });
  // ondas de calor bajando
  return (
    <AbsoluteFill>
      <Celda f={f} s={s} zoom={zoom} />
      <Termometro f={f} x={300} y={980} nivel={nivel} s={useAparicion(f, e.en("bajar") - 2)} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Aspa f={f} inicio={e.en("nubes.")} x={760} y={780} tam={110} />
      </svg>
      <Etiqueta f={f} inicio={e.en("calienta") + 2} x={300} y={1150} texto="+ CALOR" fondo="#c62828" tam={36} />
      <Etiqueta f={f} inicio={e.en("nubes.") + 4} x={760} y={980} texto="SIN NUBES" fondo={NOCHE} tam={40} />
    </AbsoluteFill>
  );
};

// ---------- 8. África es anchísima ----------
const TIBESTI: LonLat = [18, 21.5];
const COSTAS: { ll: LonLat; nombre: string }[] = [
  { ll: [18, 30.6], nombre: "MEDITERRÁNEO" },
  { ll: [37.2, 21.5], nombre: "MAR ROJO" },
  { ll: [-17.1, 21.5], nombre: "ATLÁNTICO" },
];
const Ancha = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, 0, e.dur, { ...AFRICA_CAM, zoom: 1.3 }, AFRICA_CAM);
  const banda = prog(f, e.en("altura,") - 8, e.en("altura,") + 4);
  const ancho = prog(f, e.en("anchísima") - 4, e.en("altura,"));
  const [, yTop] = aPantalla(cam, [0, 33]);
  const [, yBot] = aPantalla(cam, [0, 15]);
  const [ax, ay] = aPantalla(cam, [-17.2, 22]);
  const [bx] = aPantalla(cam, [38, 22]);
  const [tx, ty] = aPantalla(cam, TIBESTI);
  const lineas = prog(f, e.en("mar") - 3, e.en("lejísimos.") + 2);
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={yTop} width={W} height={yBot - yTop} fill={`rgba(255,213,74,${0.22 * banda})`} />
        <line x1={0} x2={W} y1={yTop} y2={yTop} stroke={ORO} strokeWidth={4} strokeDasharray="14 10" opacity={banda} />
        <line x1={0} x2={W} y1={yBot} y2={yBot} stroke={ORO} strokeWidth={4} strokeDasharray="14 10" opacity={banda} />
        {ancho > 0 && (
          <g opacity={1 - lineas * 0.7}>
            <Flecha pts={[[(ax + bx) / 2, ay], [ax, ay]]} t={ancho} color="#fff" grosor={12} />
            <Flecha pts={[[(ax + bx) / 2, ay], [bx, ay]]} t={ancho} color="#fff" grosor={12} />
          </g>
        )}
        {lineas > 0 &&
          COSTAS.map((c, i) => {
            const t = Math.max(0, Math.min(1, lineas * 3 - i));
            const [cx, cy] = aPantalla(cam, c.ll);
            return (
              <g key={c.nombre}>
                <line x1={tx} y1={ty} x2={tx + (cx - tx) * t} y2={ty + (cy - ty) * t} stroke="#fff" strokeWidth={7} strokeDasharray="12 10" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.7))" }} />
                {t >= 1 && <circle cx={cx} cy={cy} r={14} fill="#29b6f6" stroke="#fff" strokeWidth={4} />}
              </g>
            );
          })}
        {lineas > 0 && <circle cx={tx} cy={ty} r={20} fill="#e53935" stroke="#fff" strokeWidth={5} />}
      </svg>
      <Razon f={f} inicio={e.en("Segunda")} n={2} />
      {COSTAS.map((c, i) => {
        const [cx, cy] = aPantalla(cam, c.ll);
        const ini = e.en("mar") - 3 + ((e.en("lejísimos.") + 2 - e.en("mar") + 3) * (i + 1)) / 3;
        const mx = (tx + cx) / 2;
        const my = (ty + cy) / 2;
        return <Etiqueta key={c.nombre} f={f} inicio={ini} x={mx + (i === 0 ? -120 : 0)} y={my + [0, 55, -50][i]} texto={`${miles(Math.round(kmEntre(TIBESTI, c.ll) / 100) * 100)} km`} fondo="#1d5f99" tam={34} />;
      })}
      <Etiqueta f={f} inicio={e.en("altura,")} x={880} y={yTop - 40} texto="15°–33° N" fondo="#8a6a00" tam={32} />
    </AbsoluteFill>
  );
};

// ---------- 9. las montañas del Atlas ----------
const CRESTA: LonLat[] = [[-9.4, 30.6], [-8.2, 31.0], [-7, 31.4], [-5.8, 31.9], [-4.6, 32.4], [-3.4, 32.8], [-2, 33.1], [-0.6, 33.4], [1, 33.8], [2.6, 34.2], [4.2, 34.6], [5.8, 34.9], [7.4, 35.2]];
const Atlas = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, 0, e.dur, { ...ATLAS_CAM, zoom: 2.9 }, ATLAS_CAM);
  const montes = prog(f, e.en("montañas") - 6, e.en("Atlas") + 6);
  const llegan = prog(f, e.en("nubes") - 10, e.en("frenan") + 2);
  const lluvia = prog(f, e.en("frenan"), e.en("frenan") + 10);
  const [ox, oy] = aPantalla(cam, [-15, 33]);
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {CRESTA.map((ll, i) => {
          const t = Math.max(0, Math.min(1, montes * CRESTA.length - i));
          const [x, y] = aPantalla(cam, ll);
          const alto = (70 + 40 * random(`m${i}`)) * t;
          return (
            <g key={i} style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.45))" }}>
              <polygon points={`${x - 52},${y + 20} ${x},${y + 20 - alto} ${x + 52},${y + 20}`} fill="#8d6e63" stroke="#4e342e" strokeWidth={4} />
              <polygon points={`${x - 16},${y + 20 - alto * 0.7} ${x},${y + 20 - alto} ${x + 16},${y + 20 - alto * 0.7}`} fill="#fff" opacity={t} />
            </g>
          );
        })}
        {/* nubes que llegan del Atlántico y chocan con la cordillera */}
        {[0, 1, 2].map((i) => {
          const destino = aPantalla(cam, CRESTA[2 + i * 4]);
          const x = ox - 150 + (destino[0] - 70 - (ox - 150)) * llegan + Math.sin((f + i * 20) / 12) * 6;
          const y = oy + i * 70 - 100 + (destino[1] - 150 - (oy + i * 70 - 100)) * llegan;
          return (
            <g key={i}>
              <Nube x={x} y={y} s={0.55} color="#dfe7ef" opacidad={Math.min(1, llegan * 4)} />
              <Lluvia f={f} x={x - 60} y={y + 30} ancho={120} alto={110} intensidad={lluvia} semilla={`a${i}`} />
            </g>
          );
        })}
      </svg>
      <Etiqueta f={f} inicio={e.en("Atlas") - 2} x={aPantalla(cam, [0.5, 32.4])[0]} y={aPantalla(cam, [0.5, 32.4])[1]} texto="ATLAS" fondo="#5d4037" tam={48} />
      <Etiqueta f={f} inicio={e.en("Atlántico.") - 2} x={ox - 40} y={oy + 260} texto="ATLÁNTICO" fondo="#1d5f99" tam={38} />
      <Etiqueta f={f} inicio={e.en("frenan") + 6} x={aPantalla(cam, [-1, 28.2])[0]} y={aPantalla(cam, [-1, 28.2])[1]} texto="AQUÍ NO LLUEVE" fondo="#b8641c" tam={38} />
      <Razon f={f} inicio={e.en("Tercera:")} n={3} />
    </AbsoluteFill>
  );
};

// ---------- 10. la corriente fría de Canarias ----------
const CORRIENTE: LonLat[] = [[-13.5, 33], [-15.5, 29.5], [-17.6, 26], [-19, 22.5], [-19.6, 19], [-19.3, 15.5]];
const Corriente = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, 0, e.dur, { ...COSTA_CAM, zoom: 2.4 }, COSTA_CAM);
  const aparece = prog(f, e.en("corriente") - 4, e.en("fría") + 4);
  const pts = CORRIENTE.map((ll) => aPantalla(cam, ll));
  const ruta = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0] - 20} ${p[1]}`).join(" ");
  const [nx, ny] = aPantalla(cam, [-10, 22]);
  const tormenta = useAparicion(f, e.en("formen") - 4, 10);
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d={ruta} fill="none" stroke="rgba(120,210,255,0.35)" strokeWidth={70} strokeLinecap="round" strokeLinejoin="round" opacity={aparece} />
        <path d={ruta} fill="none" stroke="#bfe9ff" strokeWidth={14} strokeDasharray="34 26" strokeDashoffset={-f * 4} strokeLinecap="round" opacity={aparece} />
        {aparece > 0.9 && <Flecha pts={[pts[pts.length - 2].map((v, i) => (i === 0 ? v - 20 : v)) as [number, number], [pts[pts.length - 1][0] - 20, pts[pts.length - 1][1] + 20]]} t={1} color="#bfe9ff" grosor={16} />}
        {f >= e.en("formen") - 4 && (
          <g transform={`translate(${nx} ${ny}) scale(${tormenta})`}>
            <Nube x={0} y={0} s={0.9} color="#5d6b7a" />
            <polygon points="-10,30 -40,110 -8,100 -30,170 30,80 0,88 20,30" fill={ORO} />
            <Aspa f={f} inicio={e.en("tormentas.")} x={0} y={30} tam={120} />
          </g>
        )}
      </svg>
      <Etiqueta f={f} inicio={e.en("costa,") - 2} x={aPantalla(cam, [-6, 28])[0]} y={aPantalla(cam, [-6, 28])[1]} texto="COSTA DEL SAHARA" fondo="#b8641c" tam={32} />
      <Etiqueta f={f} inicio={e.en("corriente")} x={pts[2][0] - 40} y={pts[2][1] - 130} texto="CORRIENTE DE CANARIAS" fondo="#0d47a1" tam={32} />
      <Termometro f={f} x={pts[3][0] - 20} y={pts[3][1] + 120} nivel={0.25} frio s={useAparicion(f, e.en("fría") - 3) * 0.6} />
      <Etiqueta f={f} inicio={e.en("fría")} x={pts[3][0] + 140} y={pts[3][1] + 80} texto="AGUA FRÍA" fondo="#0277bd" tam={34} />
    </AbsoluteFill>
  );
};

// ---------- 11. menos de 25 litros al año ----------
const Probeta: React.FC<{ x: number; nivel: number; etiqueta: string; valor: string; color: string; s: number }> = ({ x, nivel, etiqueta, valor, color, s }) => {
  const alto = 640;
  const base = 1260;
  return (
    <g transform={`translate(${x} ${base}) scale(${s}) translate(${-x} ${-base})`}>
      <rect x={x - 90} y={base - alto} width={180} height={alto} rx={26} fill="rgba(255,255,255,0.22)" stroke="#fff" strokeWidth={8} />
      <rect x={x - 78} y={base - 12 - (alto - 24) * nivel} width={156} height={(alto - 24) * nivel + 0.01} rx={18} fill={color} />
      {[0.25, 0.5, 0.75].map((k) => (
        <line key={k} x1={x + 40} x2={x + 90} y1={base - alto * k} y2={base - alto * k} stroke="#fff" strokeWidth={5} opacity={0.7} />
      ))}
      <text x={x} y={base + 80} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={52} fill="#fff" style={{ paintOrder: "stroke" }} stroke={NOCHE} strokeWidth={8}>
        {etiqueta}
      </text>
      <text x={x} y={base - alto - 30} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={58} fill={ORO} style={{ paintOrder: "stroke" }} stroke={NOCHE} strokeWidth={10}>
        {valor}
      </text>
    </g>
  );
};
const LluviaEsc = (e: Escenario): Dibujo => ({ f }) => {
  const sahara = prog(f, e.en("veinticinco") - 4, e.en("litros") + 4);
  const madrid = prog(f, e.en("caen") + 4, e.en("año."));
  const sMadrid = useAparicion(f, e.en("caen") - 2, 12);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(#f7b267 0%, #e07a3a 60%, #9c4a1f 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Sol f={f} x={860} y={520} r={80} s={useAparicion(f, 0, 12)} />
        {/* unas pocas gotas que caen y se evaporan */}
        {[0, 1, 2].map((i) => {
          const t = ((f - e.en("caen") - i * 12 + 300) % 36) / 36;
          if (f < e.en("caen")) return null;
          return <ellipse key={i} cx={430 + i * 30} cy={520 + t * 360} rx={12} ry={18} fill="#8fd3ff" opacity={1 - t} />;
        })}
        <Probeta x={430} nivel={sahara * (25 / 420) * 0.9} etiqueta="SAHARA" valor={`< ${Math.round(25 * sahara)} L`} color="#4fc3f7" s={useAparicion(f, e.en("Sahara") - 4, 12)} />
        <Probeta x={770} nivel={madrid * 0.9} etiqueta="MADRID" valor={`${Math.round(420 * madrid)} L`} color="#29b6f6" s={sMadrid} />
      </svg>
      <div style={{ position: "absolute", top: 1420, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 40, color: "#fff", opacity: sMadrid, textShadow: "0 4px 12px rgba(0,0,0,0.6)", paddingLeft: 320 }}>
        litros por m² al año
      </div>
      <Viento f={f} n={40} />
    </AbsoluteFill>
  );
};

// ---------- 12. solo una cuarta parte es arena ----------
const arco = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1} Z`;
};
const Arena = (e: Escenario): Dibujo => ({ f }) => {
  const cx = 540;
  const cy = 860;
  const r = 300;
  const arenaT = prog(f, e.en("cuarta") - 4, e.en("arena.") + 2);
  const rocaT = prog(f, e.en("resto") - 3, e.en("roca.") + 4);
  const ojo = useAparicion(f, e.en("ojo:") - 3, 8);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #6d4a2b 0%, #2a1a0c 90%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={r + 14} fill="rgba(0,0,0,0.35)" />
        <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" strokeWidth={4} strokeDasharray="12 10" />
        {rocaT > 0 && <path d={arco(cx, cy, r, Math.PI / 2, Math.PI / 2 + Math.PI * 1.5 * rocaT)} fill="#8d7b68" stroke="#3e2f22" strokeWidth={6} />}
        {arenaT > 0 && (
          <path
            d={arco(cx + 22 * arenaT, cy - 22 * arenaT, r, 0, (Math.PI / 2) * arenaT)}
            fill={ARENA}
            stroke="#7a4a12"
            strokeWidth={6}
            style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.5))" }}
          />
        )}
        {/* iconos: duna y meseta */}
        <g opacity={arenaT} transform={`translate(${cx + 150} ${cy - 120})`}>
          <path d="M -70 30 Q -20 -50 30 20 Q 50 -10 80 30 Z" fill="#fff3d6" />
        </g>
        <g opacity={rocaT} transform={`translate(${cx - 120} ${cy + 90})`}>
          <path d="M -90 50 L -60 -20 L 50 -20 L 80 50 Z" fill="#e7dccd" />
          <circle cx={-110} cy={46} r={12} fill="#e7dccd" />
          <circle cx={100} cy={44} r={16} fill="#e7dccd" />
        </g>
        {/* "ojo" */}
        <g transform={`translate(180 560) scale(${ojo})`}>
          <ellipse rx={70} ry={42} fill="#fff" stroke={NOCHE} strokeWidth={6} />
          <circle r={26} fill="#3e2723" />
          <circle cx={8} cy={-8} r={8} fill="#fff" />
        </g>
      </svg>
      <Etiqueta f={f} inicio={e.en("arena.") - 3} x={cx + 200} y={cy - 330} texto="25 % ARENA" fondo="#c47a26" tam={50} />
      <Etiqueta f={f} inicio={e.en("roca.") - 3} x={cx + 40} y={cy + r + 90} texto="75 % PIEDRA Y ROCA" fondo="#5d4a3a" tam={50} />
    </AbsoluteFill>
  );
};

// ---------- 13. el Sahara verde ----------
const LAGOS: { ll: LonLat; rx: number; ry: number; nombre?: string }[] = [
  { ll: [17, 15.5], rx: 4.5, ry: 3.2, nombre: "MEGA-CHAD" },
  { ll: [3, 24], rx: 1.6, ry: 1.0 },
  { ll: [25, 21], rx: 1.8, ry: 1.1 },
  { ll: [-6, 20], rx: 1.4, ry: 0.9 },
  { ll: [12, 26], rx: 1.0, ry: 0.7 },
];
const ANIMALES: { ll: LonLat; emoji: string; palabra: "jirafas" | "hipopótamos."; k: number }[] = [
  { ll: [-2, 23], emoji: "🦒", palabra: "jirafas", k: 0 },
  { ll: [22, 25], emoji: "🦒", palabra: "jirafas", k: 4 },
  { ll: [8, 18.5], emoji: "🦒", palabra: "jirafas", k: 8 },
  { ll: [20.5, 16], emoji: "🦛", palabra: "hipopótamos.", k: 0 },
  { ll: [4.5, 25.5], emoji: "🦛", palabra: "hipopótamos.", k: 5 },
  { ll: [26, 19], emoji: "🦛", palabra: "hipopótamos.", k: 10 },
];
const Verde = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, 0, e.dur, { ...SAHARA_CAM, zoom: 1.6 }, { lon: 11, lat: 20, zoom: 1.8 });
  const verde = prog(f, e.en("verde,") - 10, e.en("verde,") + 6);
  const lagos = prog(f, e.en("lagos,") - 4, e.en("lagos,") + 10);
  const escala = 560 * cam.zoom * (Math.PI / 180);
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam} verde={verde} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {LAGOS.map((l, i) => {
          const [x, y] = aPantalla(cam, l.ll);
          const t = Math.max(0, Math.min(1, lagos * 2 - i * 0.25));
          return <ellipse key={i} cx={x} cy={y} rx={l.rx * escala * t} ry={l.ry * escala * t} fill="#2f8fd8" stroke="#bfe6ff" strokeWidth={4} opacity={0.9} />;
        })}
      </svg>
      {ANIMALES.map((a, i) => {
        const [x, y] = aPantalla(cam, a.ll);
        const ini = e.en(a.palabra) - 3 + a.k;
        const s = useAparicion(f, ini, 8);
        if (f < ini) return null;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -80%) scale(${s}) translateY(${Math.sin((f + i * 7) / 6) * -6}px)`, fontSize: 110, filter: "drop-shadow(0 8px 8px rgba(0,0,0,0.5))" }}>
            {a.emoji}
          </div>
        );
      })}
      <Etiqueta f={f} inicio={e.en("lagos,") + 6} x={aPantalla(cam, [17, 11])[0]} y={aPantalla(cam, [17, 11])[1]} texto="MEGA-CHAD" fondo="#0d47a1" tam={32} />
      <Dato f={f} inicio={e.en("diez") - 3} arriba="HACE" valor="10.000 AÑOS" y={1330} color="#8bc34a" />
    </AbsoluteFill>
  );
};

// ---------- 14. el bamboleo del eje de la Tierra ----------
const topo110 = mundo as unknown as Topology<{ countries: GeometryCollection }>;
const PAISES_110 = (feature(topo110, topo110.objects.countries) as FeatureCollection<Geometry, { name: string }>).features;
const GLOBO_X = 540;
const GLOBO_Y = 900;
const GLOBO_R = 320;
const Bamboleo = (e: Escenario): Dibujo => ({ f }) => {
  const giro = -15 + f * 0.25;
  const proy = geoOrthographic().rotate([giro, -12]).scale(GLOBO_R).translate([GLOBO_X, GLOBO_Y]).clipAngle(90);
  const camino = geoPath(proy);
  const bamb = prog(f, e.en("bamboleo") - 6, e.en("bamboleo") + 6);
  const ang = (f - e.en("bamboleo")) / 12; // el eje describe un cono
  const inc = 23.4 * (Math.PI / 180);
  const dx = Math.sin(inc) * Math.cos(ang) * bamb + Math.sin(inc) * (1 - bamb);
  const dz = Math.sin(inc) * Math.sin(ang) * bamb;
  const largo = GLOBO_R + 150;
  const tx = GLOBO_X + dx * largo;
  const ty = GLOBO_Y - Math.cos(inc) * largo + dz * 40;
  const desierto = prog(f, e.en("volvió") - 4, e.en("desierto.") + 6);
  const lluvias = 1 - prog(f, e.en("debilitó") - 4, e.en("lluvias,") + 6);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #18264a 0%, #050814 85%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={random(`ex${i}`) * W} cy={random(`ey${i}`) * H} r={1 + random(`er${i}`) * 2.5} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(f / 15 + i))} />
        ))}
        {/* cono que recorre el eje */}
        <ellipse cx={GLOBO_X} cy={GLOBO_Y - Math.cos(inc) * largo} rx={Math.sin(inc) * largo} ry={40} fill="none" stroke={ORO} strokeWidth={5} strokeDasharray="14 12" opacity={bamb} />
        <line x1={GLOBO_X - dx * largo} y1={GLOBO_Y + Math.cos(inc) * largo - dz * 40} x2={tx} y2={ty} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.85} />
        <circle cx={GLOBO_X} cy={GLOBO_Y} r={GLOBO_R} fill="#1c64a8" />
        {PAISES_110.map((p) => (
          <path key={p.properties.name} d={camino(p) ?? ""} fill="#4f9a3a" stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
        ))}
        <path d={camino(SAHARA) ?? ""} fill={ARENA} opacity={desierto} />
        <circle cx={GLOBO_X} cy={GLOBO_Y} r={GLOBO_R} fill="url(#sombra-globo)" />
        <defs>
          <radialGradient id="sombra-globo" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="0.6" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>
        </defs>
        <circle cx={tx} cy={ty} r={14} fill={ORO} />
        {/* lluvias del monzón que se apagan */}
        <g opacity={lluvias}>
          <Nube x={GLOBO_X + 30} y={GLOBO_Y - 120} s={0.5} color="#e6edf5" />
          <Lluvia f={f} x={GLOBO_X - 30} y={GLOBO_Y - 90} ancho={120} alto={90} intensidad={1} semilla="mz" />
        </g>
      </svg>
      <Etiqueta f={f} inicio={e.en("eje")} x={tx + 90} y={ty - 10} texto="EJE" fondo="#8a6a00" tam={36} />
      <Etiqueta f={f} inicio={e.en("lluvias,") - 2} x={GLOBO_X + 230} y={GLOBO_Y - 200} texto="– LLUVIAS" fondo="#0277bd" tam={36} />
      <Dato f={f} inicio={e.en("cinco") - 3} arriba="HACE" valor="5.000 AÑOS" y={1380} color={ARENA} />
    </AbsoluteFill>
  );
};

// ---------- 15. sigue creciendo ----------
const Crece = (e: Escenario): Dibujo => ({ f }) => {
  const cam = camaraEntre(f, 0, e.dur, { lon: 11, lat: 19, zoom: 1.7 }, { lon: 11, lat: 17, zoom: 1.85 });
  const avance = 1.7 * prog(f, e.en("creciendo:") - 4, e.en("grande.") + 4);
  const pct = prog(f, e.en("diez") - 3, e.en("ciento") + 4);
  return (
    <AbsoluteFill>
      <MapaSahara camara={cam} avanceSur={avance} brilloSahara={0.5 + 0.5 * Math.sin(f / 4)} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {[-8, 2, 12, 22, 31].map((lon, i) => {
          const [x, y] = aPantalla(cam, [lon, 13.2 - avance * 0.4]);
          const o = Math.sin(f / 6 + i) * 8;
          return (
            <g key={lon} opacity={Math.min(1, avance)}>
              <Flecha pts={[[x, y - 70 + o], [x, y + o]]} t={1} color="#ff5252" grosor={14} />
            </g>
          );
        })}
      </svg>
      <Viento f={f} n={50} />
      <Etiqueta f={f} inicio={e.en("1920") - 2} x={aPantalla(cam, [11, 28])[0]} y={aPantalla(cam, [11, 28])[1]} texto="DESDE 1920" fondo={NOCHE} tam={44} />
      <Etiqueta f={f} inicio={e.en("creciendo:")} x={aPantalla(cam, [10, 9.5])[0]} y={aPantalla(cam, [10, 9.5])[1]} texto="SAHEL" fondo="#558b2f" tam={36} />
      <Dato f={f} inicio={e.en("diez") - 3} arriba="MÁS GRANDE" valor={`+${Math.round(10 * pct)} %`} y={1330} color="#ff6e6e" />
    </AbsoluteFill>
  );
};

// ---------- 16. final ----------
const Final = (e: Escenario): Dibujo => ({ f }) => {
  const s1 = useAparicion(f, 0, 12);
  const s2 = useAparicion(f, e.en("desierto") - 3, 8);
  const s3 = useAparicion(f, e.en("Escríbelo") - 3, 9);
  const chips: [string, string, number][] = [
    ["ATACAMA", "#e57373", e.en("quieres")],
    ["GOBI", "#64b5f6", e.en("quieres") + 6],
    ["ANTÁRTIDA", "#4dd0e1", e.en("explique?") - 2],
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(#f7b267 0%, #e07a3a 55%, #7a3713 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Sol f={f} x={820} y={330} r={70} />
        <Dunas x={-80} y={1350} ancho={700} t={1} />
        <Dunas x={420} y={1420} ancho={760} t={1} />
      </svg>
      <Viento f={f} n={50} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900 }}>
        <div style={{ fontSize: 96, color: "#fff", transform: `scale(${s1})`, textShadow: "0 8px 24px rgba(0,0,0,0.6)", lineHeight: 1.05 }}>
          ¿QUÉ OTRO
        </div>
        <div style={{ display: "inline-block", fontSize: 124, color: NOCHE, background: ORO, padding: "2px 34px", borderRadius: 22, margin: "14px 0", transform: `scale(${s2}) rotate(-2deg)` }}>
          DESIERTO
        </div>
        <div style={{ fontSize: 96, color: "#fff", transform: `scale(${s1})`, textShadow: "0 8px 24px rgba(0,0,0,0.6)", lineHeight: 1.05 }}>
          TE EXPLICO?
        </div>
      </div>
      {chips.map(([t, c, ini], i) => (
        <Etiqueta key={t} f={f} inicio={ini} x={[300, 560, 800][i]} y={[1010, 1080, 1010][i]} texto={t} fondo={c} color={NOCHE} tam={40} />
      ))}
      <div
        style={{
          position: "absolute",
          left: 600,
          top: 1290,
          transform: `translate(-50%, -50%) scale(${s3})`,
          background: "#fff",
          borderRadius: 40,
          padding: "26px 44px",
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 50,
          color: NOCHE,
          boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        💬 Escríbelo en
        <br />
        los comentarios
      </div>
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, (e: Escenario) => Dibujo> = {
  gancho: Gancho,
  tamano: Tamano,
  distancia: Distancia,
  paises: Paises,
  cielo: Cielo,
  seco: Seco,
  nubes: Nubes,
  ancha: Ancha,
  atlas: Atlas,
  corriente: Corriente,
  lluvia: LluviaEsc,
  arena: Arena,
  verde: Verde,
  bamboleo: Bamboleo,
  crece: Crece,
  final: Final,
};

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>) =>
  Object.fromEntries(Object.entries(FABRICAS).map(([k, fab]) => [k, fab(esc[k as Ilustracion])])) as Record<Ilustracion, Dibujo>;

