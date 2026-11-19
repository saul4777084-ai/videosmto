import React from "react";
import { geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { random } from "remotion";
import mundo from "world-atlas/countries-50m.json";

// Globo terráqueo (proyección ortográfica de d3-geo con fronteras reales de world-atlas).
// A diferencia de src/Colon/Mapa.tsx (Mercator, solo el Atlántico), enseña el planeta entero
// y gira: sirve para viajes que dan la vuelta al mundo.

export type LonLat = [number, number];
// lon/lat: punto del globo que queda en el centro; zoom 1 = globo entero; y: altura del centro en pantalla
export type CamaraGlobo = { lon: number; lat: number; zoom: number; y?: number };

const W = 1080;
const H = 1920;
export const RADIO = 450;

const topo = mundo as unknown as Topology<{ countries: GeometryCollection }>;
const PAISES = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features;
const RETICULA = geoGraticule10();
const ESFERA = { type: "Sphere" } as const;

export const proyeccionDe = (c: CamaraGlobo) =>
  geoOrthographic()
    .rotate([-c.lon, -c.lat])
    .scale(RADIO * c.zoom)
    .translate([W / 2, c.y ?? 1000])
    .clipAngle(90)
    .precision(0.6);

// lon/lat -> pantalla; null si el punto está en la cara oculta del globo
export const aPantalla = (c: CamaraGlobo, ll: LonLat): [number, number] | null => {
  if (geoDistance(ll, [c.lon, c.lat]) > Math.PI / 2 - 0.02) return null;
  return proyeccionDe(c)(ll) as [number, number];
};

// mezcla dos cámaras (lon por el camino corto, zoom en escala logarítmica)
export const mezclar = (a: CamaraGlobo, b: CamaraGlobo, k: number): CamaraGlobo => {
  let dl = b.lon - a.lon;
  if (dl > 180) dl -= 360;
  if (dl < -180) dl += 360;
  return {
    lon: a.lon + dl * k,
    lat: a.lat + (b.lat - a.lat) * k,
    zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * k),
    y: (a.y ?? 1000) + ((b.y ?? 1000) - (a.y ?? 1000)) * k,
  };
};

// ---------- rutas ----------

const largos = (ruta: LonLat[]) => ruta.slice(1).map((p, i) => geoDistance(ruta[i], p));

// parte recorrida de la ruta (t de 0 a 1, por distancia real sobre la esfera)
export const rutaHasta = (ruta: LonLat[], t: number): LonLat[] => {
  const ls = largos(ruta);
  const total = ls.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  const out: LonLat[] = [ruta[0]];
  for (let i = 0; i < ls.length; i++) {
    if (d <= ls[i]) {
      out.push(geoInterpolate(ruta[i], ruta[i + 1])(ls[i] === 0 ? 0 : d / ls[i]) as LonLat);
      return out;
    }
    out.push(ruta[i + 1]);
    d -= ls[i];
  }
  return out;
};

export const puntoEnRuta = (ruta: LonLat[], t: number): LonLat => {
  const r = rutaHasta(ruta, t);
  return r[r.length - 1];
};

// ---------- dibujo ----------

type Props = {
  camara: CamaraGlobo;
  colores?: Record<string, { color: string; opacidad: number }>; // países pintados (color "r,g,b")
  estrellas?: boolean;
  // países que se separan como piezas de un puzle (k de 0 a 1: cuánto se alejan del centro del grupo)
  separar?: { nombres: string[]; k: number; px?: number };
  children?: (proy: ReturnType<typeof proyeccionDe>, trazo: ReturnType<typeof geoPath>) => React.ReactNode;
};

const ESTRELLAS = Array.from({ length: 140 }, (_, i) => ({
  x: random(`ex${i}`) * W,
  y: random(`ey${i}`) * H,
  r: 0.8 + random(`er${i}`) * 2.6,
  o: 0.25 + random(`eo${i}`) * 0.6,
  fase: random(`ef${i}`) * 6,
}));

export const Globo: React.FC<Props & { f: number }> = ({ camara, colores, estrellas = true, separar, children, f }) => {
  const proy = proyeccionDe(camara);
  const trazo = geoPath(proy);
  const [cx, cy] = [W / 2, camara.y ?? 1000];
  const r = RADIO * camara.zoom;
  const esfera = trazo(ESFERA) ?? "";
  const sep = separar && separar.k > 0 ? new Set(separar.nombres) : null;
  const fijos = sep ? PAISES.filter((p) => !sep.has(p.properties.name)) : PAISES;
  // desplazamiento de cada pieza: hacia fuera desde el centro del grupo
  const piezas = sep
    ? (() => {
        const ps = PAISES.filter((p) => sep.has(p.properties.name));
        const cs = ps.map((p) => trazo.centroid(p));
        const ok = cs.filter((c) => Number.isFinite(c[0]));
        const g = ok.reduce((a, c) => [a[0] + c[0] / ok.length, a[1] + c[1] / ok.length], [0, 0]);
        return ps.map((p, i) => {
          const c = cs[i];
          if (!Number.isFinite(c[0])) return { p, dx: 0, dy: 0 };
          const vx = c[0] - g[0];
          const vy = c[1] - g[1];
          const n = Math.hypot(vx, vy) || 1;
          const d = separar!.k * (separar!.px ?? 60);
          return { p, dx: (vx / n) * d + vx * separar!.k * 0.25, dy: (vy / n) * d + vy * separar!.k * 0.25 };
        });
      })()
    : [];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="g-espacio" cx="50%" cy="50%" r="75%">
          <stop offset="0" stopColor="#14214a" />
          <stop offset="1" stopColor="#03050e" />
        </radialGradient>
        <radialGradient id="g-mar" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#2f8fd0" />
          <stop offset="0.7" stopColor="#14588f" />
          <stop offset="1" stopColor="#0a2c4f" />
        </radialGradient>
        <radialGradient id="g-sombra" cx="38%" cy="32%" r="70%">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000814" stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id="g-halo">
          <stop offset="0.86" stopColor="#7fd3ff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7fd3ff" stopOpacity={0} />
        </radialGradient>
        <filter id="g-relieve" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={3} seed={5} result="ruido" />
          <feDiffuseLighting in="ruido" surfaceScale={3} lightingColor="#ffffff" result="luz">
            <feDistantLight azimuth={225} elevation={50} />
          </feDiffuseLighting>
          <feComposite in="luz" in2="SourceGraphic" operator="arithmetic" k1={1.2} k2={0} k3={0} k4={0} result="mezcla" />
          <feComposite in="mezcla" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#g-espacio)" />
      {estrellas &&
        ESTRELLAS.map((e, i) => (
          <circle key={i} cx={e.x} cy={e.y} r={e.r} fill="#fff" opacity={e.o * (0.7 + 0.3 * Math.sin(f / 9 + e.fase))} />
        ))}
      {r < 3000 && <circle cx={cx} cy={cy} r={r * 1.08} fill="url(#g-halo)" />}

      <path d={esfera} fill="url(#g-mar)" />
      <path d={trazo(RETICULA) ?? ""} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} />
      <g filter="url(#g-relieve)">
        {fijos.map((p) => (
          <path key={p.properties.name + p.id} d={trazo(p) ?? ""} fill="#6f9a45" />
        ))}
      </g>
      {colores &&
        fijos.filter((p) => colores[p.properties.name]?.opacidad > 0).map((p) => (
          <path key={`k-${p.id}`} d={trazo(p) ?? ""} fill={`rgba(${colores[p.properties.name].color},${0.85 * colores[p.properties.name].opacidad})`} />
        ))}
      {fijos.map((p) => (
        <path key={`b-${p.properties.name}${p.id}`} d={trazo(p) ?? ""} fill="none" stroke="rgba(25,35,20,0.5)" strokeWidth={1.2} />
      ))}
      {piezas.map(({ p, dx, dy }) => {
        const c = colores?.[p.properties.name];
        const d = trazo(p) ?? "";
        return (
          <g key={`s-${p.id}`} transform={`translate(${dx} ${dy})`}>
            <path d={d} fill="rgba(0,0,0,0.35)" transform="translate(6 10)" />
            <path d={d} fill="#6f9a45" />
            {c && <path d={d} fill={`rgba(${c.color},${0.9 * c.opacidad})`} />}
            <path d={d} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={2.5} />
          </g>
        );
      })}
      <path d={esfera} fill="url(#g-sombra)" />
      {children?.(proy, trazo)}
    </svg>
  );
};

// ruta dibujada sobre el globo (se recorta sola en la cara oculta)
export const Ruta: React.FC<{
  trazo: ReturnType<typeof geoPath>;
  ruta: LonLat[];
  t: number;
  color?: string;
  grosor?: number;
  punteada?: boolean;
}> = ({ trazo, ruta, t, color = "#ffd54a", grosor = 10, punteada = false }) => {
  if (t <= 0) return null;
  const d = trazo({ type: "LineString", coordinates: rutaHasta(ruta, t) }) ?? "";
  return (
    <>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={grosor + 8} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={grosor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={punteada ? `${grosor * 0.4} ${grosor * 2}` : undefined}
      />
    </>
  );
};

// dirección del barco en pantalla: true si avanza hacia la derecha
export const haciaDerecha = (c: CamaraGlobo, ruta: LonLat[], t: number) => {
  const a = aPantalla(c, puntoEnRuta(ruta, Math.max(0, t - 0.01)));
  const b = aPantalla(c, puntoEnRuta(ruta, Math.min(1, t + 0.01)));
  if (!a || !b) return false;
  return b[0] > a[0];
};
