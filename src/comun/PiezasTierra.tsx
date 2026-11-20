import React, { useId } from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { geoInterpolate, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import tierra50 from "world-atlas/land-50m.json";
import { LonLat, rutaHasta } from "./Globo";
import { aPantallaT, CamaraT, paisGeo } from "./Tierra";
import { MONTSERRAT } from "./fuentes";

// Piezas con el estilo de los vídeos de mapas virales, para dibujar encima de <Tierra>:
//  · dentro de su children (SVG): Ciudad, Rotulo, Zona, Paises, FlechaG, LineaG
//  · fuera (HTML): Caja, Titular, Etiqueta, Sello, Creditos

const topoTierra = tierra50 as unknown as Topology<{ land: GeometryCollection }>;
export const TIERRA_50 = feature(topoTierra, topoTierra.objects.land) as FeatureCollection<Geometry>;
type Trazo = ReturnType<typeof geoPath>;

export const AMARILLO = "#ffe23a";
export const NARANJA = "201,112,58"; // relleno de país (r,g,b)
export const VERDE = "64,140,110";
export const ROJO = "196,30,48";
export const AZUL = "52,120,200";

const aparece = (f: number, inicio: number, damping = 11) => spring({ frame: f - inicio, fps: 30, config: { damping } });
const limpio = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");
const SOMBRA_TXT = "0 6px 0 rgba(0,0,0,0.25), 0 8px 26px rgba(0,0,0,0.75)";

// ---------- ciudad: punto blanco con anillo y nombre; puede hundirse (tachada en rojo) o salvarse (verde) ----------

export const Ciudad: React.FC<{
  cam: CamaraT;
  ll: LonLat;
  nombre: string;
  f: number;
  inicio: number;
  lado?: "izq" | "der";
  hundida?: number;
  salvada?: number;
  nota?: string;
  tam?: number;
}> = ({ cam, ll, nombre, f, inicio, lado = "der", hundida, salvada, nota, tam = 42 }) => {
  const p = aPantallaT(cam, ll);
  if (!p || f < inicio) return null;
  const s = aparece(f, inicio, 10);
  const hk = hundida !== undefined ? aparece(f, hundida, 12) : 0;
  const sk = salvada !== undefined ? aparece(f, salvada, 10) : 0;
  const c = hk > 0.5 ? "#ff3b3b" : sk > 0.5 ? "#4ade80" : "#ffffff";
  const onda = ((f - inicio) % 40) / 40;
  const dx = lado === "der" ? 30 : -30;
  const anchor = lado === "der" ? "start" : "end";
  const texto = nombre.toUpperCase();
  const ancho = texto.length * tam * 0.72;
  return (
    <g transform={`translate(${p[0]} ${p[1]})`} opacity={Math.min(1, s * 1.4)}>
      <circle r={14 + onda * 36} fill="none" stroke={c} strokeWidth={4} opacity={(1 - onda) * 0.9} />
      <circle r={15 * s} fill="none" stroke={c} strokeWidth={5} />
      <circle r={6 * s} fill={c} />
      <g transform={`scale(${interpolate(s, [0, 1], [0.7, 1])})`}>
        <text
          x={dx}
          y={tam * 0.36}
          textAnchor={anchor}
          fontFamily={MONTSERRAT}
          fontWeight={900}
          fontSize={tam}
          letterSpacing={1}
          fill="#fff"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth={7}
          paintOrder="stroke"
          style={{ filter: "drop-shadow(0 5px 8px rgba(0,0,0,0.6))" }}
        >
          {texto}
        </text>
        {hk > 0 && (
          <line
            x1={dx + (lado === "der" ? -6 : 6)}
            x2={dx + (lado === "der" ? 1 : -1) * (6 + ancho) * hk}
            y1={-2}
            y2={-2}
            stroke="#ff3b3b"
            strokeWidth={8}
            strokeLinecap="round"
          />
        )}
        {nota && (
          <text
            x={dx}
            y={tam * 0.36 + tam * 0.98}
            textAnchor={anchor}
            fontFamily={MONTSERRAT}
            fontWeight={900}
            fontSize={tam * 0.72}
            fill={c}
            stroke="rgba(0,0,0,0.6)"
            strokeWidth={6}
            paintOrder="stroke"
          >
            {nota}
          </text>
        )}
      </g>
    </g>
  );
};

// ---------- rótulo grande sobre el mapa (BOLIVIA, MÉXICO...), inclinado como el país ----------

export const Rotulo: React.FC<{
  cam: CamaraT;
  ll: LonLat;
  texto: string;
  f: number;
  inicio: number;
  tam?: number;
  giro?: number;
  color?: string;
  dy?: number;
  salida?: number; // frame en que se desvanece
}> = ({ cam, ll, texto, f, inicio, tam = 74, giro = -6, color = "#ffffff", dy = 0, salida }) => {
  const p = aPantallaT(cam, ll);
  if (!p || f < inicio) return null;
  const s = aparece(f, inicio, 13);
  const fuera = salida !== undefined ? interpolate(f, [salida, salida + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <g transform={`translate(${p[0]} ${p[1] + dy}) rotate(${giro + (1 - s) * 8}) scale(${interpolate(s, [0, 1], [1.35, 1])})`} opacity={Math.min(1, s * 1.6) * fuera}>
      <text
        textAnchor="middle"
        y={tam * 0.35}
        fontFamily={MONTSERRAT}
        fontWeight={900}
        fontSize={tam}
        letterSpacing={3}
        fill={color}
        style={{ filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.22)) drop-shadow(0 10px 18px rgba(0,0,0,0.7))" }}
      >
        {texto.toUpperCase()}
      </text>
    </g>
  );
};

// ---------- relleno de país o territorio: color + rayado blanco + borde blanco brillante ----------

const Rayado: React.FC<{ id: string }> = ({ id }) => (
  <pattern id={id} width={22} height={22} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
    <rect width={22} height={22} fill="transparent" />
    <line x1={0} y1={0} x2={0} y2={22} stroke="rgba(255,255,255,0.32)" strokeWidth={3} />
  </pattern>
);

const Relleno: React.FC<{ d: string; color: string; id: string; opacidad?: number; glow?: number }> = ({ d, color, id, opacidad = 1, glow = 1 }) => (
  <g opacity={opacidad}>
    <path d={d} fill={`rgba(${color},0.74)`} />
    <path d={d} fill={`url(#ry${id})`} />
    <path d={d} fill="none" stroke="#fff" strokeWidth={14} opacity={0.35 * glow} filter={`url(#gl${id})`} strokeLinejoin="round" />
    <path d={d} fill="none" stroke="#fff" strokeWidth={4.5} strokeLinejoin="round" />
  </g>
);

const Defs: React.FC<{ id: string }> = ({ id }) => (
  <>
    <Rayado id={`ry${id}`} />
    <filter id={`gl${id}`} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="7" />
    </filter>
  </>
);

export type Capa = {
  poligono: LonLat[]; // anillo exterior en sentido horario (lon, lat)
  color: string; // "r,g,b"
  revelar?: number; // 0..1 círculo que crece desde "desde"
  desde?: LonLat;
  opacidad?: number;
};

// territorio dibujado a mano (imperios...): se recorta con la costa real
export const Zona: React.FC<{ trazo: Trazo; cam: CamaraT; capas: Capa[] }> = ({ trazo, cam, capas }) => {
  const id = limpio(useId());
  const costa = trazo(TIERRA_50) ?? "";
  return (
    <>
      <defs>
        <Defs id={id} />
        <clipPath id={`tt${id}`}>
          <path d={costa} />
        </clipPath>
        {capas.map((c, i) => {
          if (c.revelar === undefined || c.revelar >= 1) return null;
          const p = c.desde ? aPantallaT(cam, c.desde) : null;
          const [x, y] = p ?? [540, 960];
          return (
            <clipPath key={i} id={`tr${id}${i}`}>
              <circle cx={x} cy={y} r={Math.max(0.1, c.revelar) * 2600} />
            </clipPath>
          );
        })}
      </defs>
      {capas.map((c, i) => {
        if ((c.revelar ?? 1) <= 0 || (c.opacidad ?? 1) <= 0) return null;
        const d = trazo({ type: "Polygon", coordinates: [c.poligono] }) ?? "";
        const clip = c.revelar !== undefined && c.revelar < 1 ? `url(#tr${id}${i})` : undefined;
        return (
          <g key={i} clipPath={clip}>
            <g clipPath={`url(#tt${id})`}>
              <Relleno d={d} color={c.color} id={id} opacidad={c.opacidad} />
            </g>
          </g>
        );
      })}
    </>
  );
};

// países reales resaltados (nombres en inglés de world-atlas: "Netherlands", "Bangladesh"...)
export const Paises: React.FC<{ trazo: Trazo; nombres: string[]; color: string; f: number; inicio: number }> = ({ trazo, nombres, color, f, inicio }) => {
  const id = limpio(useId());
  if (f < inicio) return null;
  const k = interpolate(f, [inicio, inicio + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <defs>
        <Defs id={id} />
      </defs>
      {nombres.map((n) => {
        const g = paisGeo(n);
        if (!g) return null;
        return <Relleno key={n} d={trazo(g) ?? ""} color={color} id={id} opacidad={k} />;
      })}
    </>
  );
};

// ---------- rutas ----------

const densificar = (ruta: LonLat[], n = 12): LonLat[] =>
  ruta.flatMap((p, i) => (i === 0 ? [p] : Array.from({ length: n }, (_, k) => geoInterpolate(ruta[i - 1], p)((k + 1) / n) as LonLat)));

export const FlechaG: React.FC<{ cam: CamaraT; ruta: LonLat[]; t: number; color?: string; grosor?: number }> = ({ cam, ruta, t, color = AMARILLO, grosor = 16 }) => {
  if (t <= 0) return null;
  const pts = densificar(rutaHasta(ruta, Math.min(1, t)))
    .map((ll) => aPantallaT(cam, ll))
    .filter((p): p is [number, number] => p !== null);
  if (pts.length < 2) return null;
  const a = pts[Math.max(0, pts.length - 4)];
  const b = pts[pts.length - 1];
  const g = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const linea = pts.map((p) => p.join(",")).join(" ");
  return (
    <g style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
      <polyline points={linea} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={grosor + 10} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={linea} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${b[0]} ${b[1]}) rotate(${g})`}>
        <path d={`M ${grosor * 1.9} 0 L ${-grosor * 0.5} ${-grosor * 1.6} L ${-grosor * 0.5} ${grosor * 1.6} Z`} fill={color} stroke="rgba(0,0,0,0.45)" strokeWidth={4} />
      </g>
    </g>
  );
};

export const LineaG: React.FC<{ trazo: Trazo; ruta: LonLat[]; t: number; color: string; grosor: number }> = ({ trazo, ruta, t, color, grosor }) => {
  if (t <= 0) return null;
  const d = trazo({ type: "LineString", coordinates: rutaHasta(ruta, Math.min(1, t)) }) ?? "";
  return (
    <>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={grosor + 8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
};

// ---------- textos en pantalla (HTML) ----------

// caja negra con texto blanco ("ESTE CANAL") o de color ("PASO 1 · TU IDEA")
export const Caja: React.FC<{ f: number; inicio: number; texto: string; y: number; fondo?: string; color?: string; tam?: number; giro?: number; x?: number }> = ({
  f,
  inicio,
  texto,
  y,
  fondo = "rgba(14,16,22,0.92)",
  color = "#fff",
  tam = 44,
  giro = 0,
  x = 540,
}) => {
  if (f < inicio) return null;
  const s = aparece(f, inicio, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${giro}deg) scale(${interpolate(s, [0, 1], [0.6, 1])})`,
        opacity: Math.min(1, s * 1.6),
        background: fondo,
        color,
        fontFamily: MONTSERRAT,
        fontWeight: 900,
        fontSize: tam,
        letterSpacing: 1,
        padding: `${tam * 0.22}px ${tam * 0.5}px`,
        borderRadius: tam * 0.18,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
      }}
    >
      {texto}
    </div>
  );
};

// titular grande en amarillo con brillo ("MENOS DE $1", "+7 MILLONES")
export const Titular: React.FC<{ f: number; inicio: number; texto: string; y: number; tam?: number; color?: string; brillo?: string }> = ({
  f,
  inicio,
  texto,
  y,
  tam = 110,
  color = AMARILLO,
  brillo = "rgba(255,226,58,0.75)",
}) => {
  if (f < inicio) return null;
  const s = aparece(f, inicio, 10);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 30,
        right: 30,
        textAlign: "center",
        fontFamily: MONTSERRAT,
        fontWeight: 900,
        fontSize: tam,
        lineHeight: 1.02,
        color,
        textTransform: "uppercase",
        opacity: Math.min(1, s * 1.6),
        transform: `scale(${interpolate(s, [0, 1], [0.55, 1])})`,
        textShadow: `0 0 26px ${brillo}, 0 0 8px ${brillo}, 0 8px 24px rgba(0,0,0,0.7)`,
        whiteSpace: "pre-line",
      }}
    >
      {texto}
    </div>
  );
};

// texto blanco simple en mayúsculas ("DE VISTAS")
export const Linea: React.FC<{ f: number; inicio: number; texto: string; y: number; tam?: number; color?: string }> = ({ f, inicio, texto, y, tam = 52, color = "#fff" }) => {
  if (f < inicio) return null;
  const s = aparece(f, inicio, 12);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 30,
        right: 30,
        textAlign: "center",
        fontFamily: MONTSERRAT,
        fontWeight: 900,
        fontSize: tam,
        color,
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: Math.min(1, s * 1.6),
        transform: `translateY(${(1 - s) * 20}px)`,
        textShadow: SOMBRA_TXT,
        whiteSpace: "pre-line",
      }}
    >
      {texto}
    </div>
  );
};

// sello rojo inclinado ("SIN EDITAR")
export const Sello: React.FC<{ f: number; inicio: number; texto: string; x: number; y: number; tam?: number; giro?: number; color?: string }> = ({
  f,
  inicio,
  texto,
  x,
  y,
  tam = 70,
  giro = -12,
  color = "#e01e37",
}) => {
  if (f < inicio) return null;
  const s = aparece(f, inicio, 8);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${giro}deg) scale(${interpolate(s, [0, 1], [2.4, 1])})`,
        opacity: Math.min(1, s * 2),
        border: `${tam * 0.09}px solid ${color}`,
        outline: `${tam * 0.04}px solid ${color}`,
        outlineOffset: tam * 0.06,
        color,
        fontFamily: MONTSERRAT,
        fontWeight: 900,
        fontSize: tam,
        padding: `0 ${tam * 0.3}px`,
        borderRadius: tam * 0.12,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        background: "rgba(255,255,255,0.06)",
        textShadow: "0 0 2px rgba(0,0,0,0.3)",
      }}
    >
      {texto}
    </div>
  );
};

// créditos de las imágenes, abajo y pequeños
export const Creditos: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 18, pointerEvents: "none" }}>
    <div style={{ fontFamily: MONTSERRAT, fontWeight: 700, fontSize: 17, color: "rgba(255,255,255,0.55)", textShadow: "0 1px 3px #000" }}>
      Imágenes: NASA Blue Marble · Alturas: AWS Terrain Tiles · Natural Earth
    </div>
  </AbsoluteFill>
);
