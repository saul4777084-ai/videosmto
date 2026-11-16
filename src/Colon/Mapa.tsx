import React from "react";
import { geoBounds, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, MultiPolygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import mundo from "world-atlas/countries-50m.json";

// ---------- datos y proyección (se calculan una sola vez) ----------

export type LonLat = [number, number];
export type Camara = { lon: number; lat: number; zoom: number };

const W = 1080;
const H = 1920;
const proyeccion = geoMercator().center([-40, 30]).scale(560).translate([W / 2, H / 2]);
const trazo = geoPath(proyeccion);

const topo = mundo as unknown as Topology<{ countries: GeometryCollection }>;
const paises = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features.filter((p) => {
  const [[x0, y0], [x1, y1]] = geoBounds(p);
  return x1 > -130 && x0 < 40 && y1 > -25 && y0 < 72;
});

// España peninsular (sin Canarias) para pintarla con su bandera
const espanaGeo = paises.find((p) => p.properties.name === "Spain")!;
const espanaPeninsula: Feature<MultiPolygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiPolygon",
    coordinates: (espanaGeo.geometry as MultiPolygon).coordinates.filter((poli) => poli[0][0][0] > -10),
  },
};

const RUTAS_PAISES = paises.map((p) => ({ nombre: p.properties.name, d: trazo(p) ?? "" }));
const RUTA_ESPANA = trazo(espanaPeninsula) ?? "";
const P = (ll: LonLat) => proyeccion(ll) as [number, number];

// zona "desconocida" (América antes de 1492)
const NIEBLA_A = P([-170, 84]);
const NIEBLA_B = P([-33, -60]);

// ---------- cámara ----------

export const transformCamara = (c: Camara) => {
  const [cx, cy] = P([c.lon, c.lat]);
  return `translate(${W / 2} ${H / 2}) scale(${c.zoom}) translate(${-cx} ${-cy})`;
};

// lon/lat -> coordenadas de pantalla para poner etiquetas, barcos, etc.
export const aPantalla = (c: Camara, ll: LonLat): [number, number] => {
  const [cx, cy] = P([c.lon, c.lat]);
  const [x, y] = P(ll);
  return [(x - cx) * c.zoom + W / 2, (y - cy) * c.zoom + H / 2];
};

export const mezclarCamara = (a: Camara, b: Camara, k: number): Camara => ({
  lon: a.lon + (b.lon - a.lon) * k,
  lat: a.lat + (b.lat - a.lat) * k,
  // el zoom se mezcla en escala logarítmica para que se sienta uniforme
  zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * k),
});

// ---------- dibujo ----------

type Props = {
  camara: Camara;
  niebla?: number; // 0..1, oculta América
  espana?: number; // 0..1, pinta España con su bandera
  brillo?: { nombre: string; intensidad: number; color?: string }; // país que parpadea (color en "r,g,b")
  colores?: Record<string, { color: string; opacidad: number }>; // varios países pintados a la vez (color en "r,g,b")
};

export const Mapa: React.FC<Props> = ({ camara, niebla = 0, espana = 0, brillo, colores }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="oceano" cx="50%" cy="45%" r="75%">
        <stop offset="0" stopColor="#1f6fa8" />
        <stop offset="1" stopColor="#0a2c4f" />
      </radialGradient>
      <filter id="relieve" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={4} seed={3} result="ruido" />
        <feDiffuseLighting in="ruido" surfaceScale={3.5} lightingColor="#ffffff" result="luz">
          <feDistantLight azimuth={225} elevation={48} />
        </feDiffuseLighting>
        <feComposite in="luz" in2="SourceGraphic" operator="arithmetic" k1={1.25} k2={0} k3={0} k4={0} result="mezcla" />
        <feComposite in="mezcla" in2="SourceGraphic" operator="in" />
      </filter>
      <linearGradient id="bandera-es" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c60b1e" />
        <stop offset="0.25" stopColor="#c60b1e" />
        <stop offset="0.25" stopColor="#ffc400" />
        <stop offset="0.75" stopColor="#ffc400" />
        <stop offset="0.75" stopColor="#c60b1e" />
        <stop offset="1" stopColor="#c60b1e" />
      </linearGradient>
      <linearGradient id="niebla" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0d1b2a" stopOpacity={0.95} />
        <stop offset="0.75" stopColor="#0d1b2a" stopOpacity={0.85} />
        <stop offset="1" stopColor="#0d1b2a" stopOpacity={0} />
      </linearGradient>
    </defs>

    <rect width={W} height={H} fill="url(#oceano)" />

    <g transform={transformCamara(camara)}>
      {/* tierra con relieve */}
      <g filter="url(#relieve)">
        {RUTAS_PAISES.map((p) => (
          <path key={p.nombre} d={p.d} fill="#6f9a45" />
        ))}
      </g>
      {/* países pintados (imperios, alianzas...) */}
      {colores &&
        RUTAS_PAISES.filter((p) => colores[p.nombre] && colores[p.nombre].opacidad > 0).map((p) => (
          <path key={`k-${p.nombre}`} d={p.d} fill={`rgba(${colores[p.nombre].color},${0.85 * colores[p.nombre].opacidad})`} />
        ))}
      {/* fronteras */}
      {RUTAS_PAISES.map((p) => (
        <path
          key={`b-${p.nombre}`}
          d={p.d}
          fill={brillo && p.nombre === brillo.nombre ? `rgba(${brillo.color ?? "255,235,59"},${0.6 * brillo.intensidad})` : "none"}
          stroke="rgba(25,35,20,0.55)"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {/* costa más marcada */}
      {RUTAS_PAISES.map((p) => (
        <path key={`c-${p.nombre}`} d={p.d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} vectorEffect="non-scaling-stroke" />
      ))}
      {espana > 0 && (
        <path d={RUTA_ESPANA} fill="url(#bandera-es)" opacity={0.92 * espana} stroke="#5d0010" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      )}
      {niebla > 0 && (
        <rect
          x={NIEBLA_A[0]}
          y={NIEBLA_A[1]}
          width={NIEBLA_B[0] - NIEBLA_A[0]}
          height={NIEBLA_B[1] - NIEBLA_A[1]}
          fill="url(#niebla)"
          opacity={niebla}
        />
      )}
    </g>
  </svg>
);

// ---------- rutas sobre el mapa ----------

// recorre una polilínea (en lon/lat) y devuelve el punto y el ángulo en la fracción t
export const puntoEnRuta = (ruta: LonLat[], t: number) => {
  const pts = ruta.map(P);
  const largos = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = largos.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < largos.length; i++) {
    if (d <= largos[i] || i === largos.length - 1) {
      const k = largos[i] === 0 ? 0 : Math.min(1, d / largos[i]);
      const a = pts[i];
      const b = pts[i + 1];
      const x = a[0] + (b[0] - a[0]) * k;
      const y = a[1] + (b[1] - a[1]) * k;
      return { ll: proyeccion.invert!([x, y]) as LonLat, hacia: b[0] < a[0] ? "oeste" : "este", tramos: i };
    }
    d -= largos[i];
  }
  return { ll: ruta[ruta.length - 1], hacia: "oeste", tramos: largos.length - 1 };
};

// la parte ya recorrida de la ruta, como lista de puntos lon/lat
export const rutaHasta = (ruta: LonLat[], t: number): LonLat[] => {
  const { ll, tramos } = puntoEnRuta(ruta, t);
  return [...ruta.slice(0, tramos + 1), ll];
};
