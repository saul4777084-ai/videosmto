import React from "react";
import { geoArea, geoCentroid, geoDistance, geoInterpolate, geoMercator, geoPath, geoRotation } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import mundo from "world-atlas/countries-50m.json";

// Mapa del mundo centrado en África con el Sahara pintado de arena (cámara como la de src/Colon/Mapa.tsx)

export type LonLat = [number, number];
export type Camara = { lon: number; lat: number; zoom: number };

const W = 1080;
const H = 1920;
const proyeccion = geoMercator().center([10, 20]).scale(560).translate([W / 2, H / 2]);
const trazo = geoPath(proyeccion);
export const P = (ll: LonLat) => proyeccion(ll) as [number, number];

const topo = mundo as unknown as Topology<{ countries: GeometryCollection }>;
const paises = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features.filter(
  (p) => p.properties.name !== "Antarctica",
);
const RUTAS_PAISES = paises.map((p) => ({ nombre: p.properties.name, d: trazo(p) ?? "", centro: geoCentroid(p) as LonLat }));
export const centroDe = (nombre: string) => RUTAS_PAISES.find((p) => p.nombre === nombre)!.centro;
export const rutaDe = (nombre: string) => RUTAS_PAISES.find((p) => p.nombre === nombre)!.d;

// ---------- el Sahara (contorno aproximado; se recorta con la costa) ----------

// borde sur (Sahel, de oeste a este) y borde norte (Atlas y Mediterráneo, de este a oeste)
const SUR: LonLat[] = [[-18.5, 16.2], [-16.3, 16.3], [-13, 16.4], [-10, 16.0], [-7, 15.8], [-4, 15.9], [-1, 16.1], [2, 16.4], [5, 16.8], [9, 17], [13, 16.4], [16, 16], [19, 15.8], [23, 15.5], [26, 15.3], [30, 15.5], [33, 16], [36, 17], [39, 18.5]];
const NORTE: LonLat[] = [[38, 22], [36.5, 24], [35, 27], [34, 29], [32.4, 30.2], [31, 30.1], [30.2, 30.3], [29, 31.6], [25, 32.2], [22, 31.5], [20, 30.6], [19, 30.4], [17, 31.4], [15.5, 32], [13, 32.6], [11.5, 33.3], [10.3, 33.7], [8.5, 34.4], [6, 34.3], [3, 33.7], [0, 32.9], [-4, 31.9], [-8, 30.6], [-10.2, 29.6], [-12, 29.2], [-14.5, 27.8], [-16.5, 25], [-18.5, 21]];

// borde sur desplazado hacia el sur (el desierto que avanza sobre el Sahel)
export const contornoSahara = (avanceSur = 0): LonLat[] => {
  const sur = SUR.map(([lon, lat]) => [lon, lat - avanceSur * (0.6 + 0.4 * Math.sin(lon * 0.35))] as LonLat);
  const anillo = [...sur, ...NORTE, sur[0]];
  return anillo.slice().reverse(); // sentido horario para d3-geo
};
export const SAHARA: Feature<Polygon> = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [contornoSahara()] } };
export const CENTRO_SAHARA = geoCentroid(SAHARA) as LonLat;
export const AREA_SAHARA_KM2 = geoArea(SAHARA) * 6371 ** 2;
export const rutaSahara = (avanceSur = 0) =>
  trazo({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [contornoSahara(avanceSur)] } } as Feature<Polygon>) ?? "";
const RUTA_SAHARA = rutaSahara();

// el contorno del Sahara llevado a otro punto del globo SIN deformarlo (tamaño real): se rota sobre la esfera
export const saharaMovido = (destino: LonLat, k: number) => {
  const centro = geoInterpolate(CENTRO_SAHARA, destino)(k) as LonLat;
  const a = geoRotation([-CENTRO_SAHARA[0], -CENTRO_SAHARA[1]]);
  const b = geoRotation([-centro[0], -centro[1]]);
  const anillo = contornoSahara().map((p) => b.invert!(a(p)) as LonLat);
  return trazo({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [anillo] } } as Feature<Polygon>) ?? "";
};

export const kmEntre = (a: LonLat, b: LonLat) => geoDistance(a, b) * 6371;

// ---------- cámara ----------

export const transformCamara = (c: Camara) => {
  const [cx, cy] = P([c.lon, c.lat]);
  return `translate(${W / 2} ${H / 2}) scale(${c.zoom}) translate(${-cx} ${-cy})`;
};

export const aPantalla = (c: Camara, ll: LonLat): [number, number] => {
  const [cx, cy] = P([c.lon, c.lat]);
  const [x, y] = P(ll);
  return [(x - cx) * c.zoom + W / 2, (y - cy) * c.zoom + H / 2];
};

export const mezclarCamara = (a: Camara, b: Camara, k: number): Camara => ({
  lon: a.lon + (b.lon - a.lon) * k,
  lat: a.lat + (b.lat - a.lat) * k,
  zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * k),
});

// ---------- dibujo ----------

type Props = {
  camara: Camara;
  arena?: number; // 0..1 cuánto se ve el Sahara de color arena
  verde?: number; // 0..1 el Sahara verde de hace 10.000 años
  brilloSahara?: number; // 0..1 borde del Sahara iluminado
  colores?: Record<string, { color: string; opacidad: number }>; // países pintados ("r,g,b")
  avanceSur?: number; // grados que el desierto avanza hacia el sur
  children?: React.ReactNode; // más dibujo en coordenadas del mapa (dentro de la cámara)
};

export const MapaSahara: React.FC<Props> = ({ camara, arena = 1, verde = 0, brilloSahara = 0, colores, avanceSur = 0, children }) => {
  const rutaS = avanceSur > 0 ? rutaSahara(avanceSur) : RUTA_SAHARA;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="sh-oceano" cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor="#1f6fa8" />
          <stop offset="1" stopColor="#0a2c4f" />
        </radialGradient>
        <filter id="sh-relieve" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={4} seed={3} result="ruido" />
          <feDiffuseLighting in="ruido" surfaceScale={3.5} lightingColor="#ffffff" result="luz">
            <feDistantLight azimuth={225} elevation={48} />
          </feDiffuseLighting>
          <feComposite in="luz" in2="SourceGraphic" operator="arithmetic" k1={1.25} k2={0} k3={0} k4={0} result="mezcla" />
          <feComposite in="mezcla" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="sh-borroso" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <clipPath id="sh-tierra">
          {RUTAS_PAISES.map((p) => (
            <path key={p.nombre} d={p.d} />
          ))}
        </clipPath>
        <linearGradient id="sh-arena" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3c77a" />
          <stop offset="0.5" stopColor="#e8a95a" />
          <stop offset="1" stopColor="#d98f45" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill="url(#sh-oceano)" />

      <g transform={transformCamara(camara)}>
        <g filter="url(#sh-relieve)">
          {RUTAS_PAISES.map((p) => (
            <path key={p.nombre} d={p.d} fill="#6f9a45" />
          ))}
        </g>
        {/* el desierto: arena con bordes difuminados, recortada por la costa */}
        <g clipPath="url(#sh-tierra)">
          {arena > 0 && <path d={rutaS} fill="url(#sh-arena)" opacity={0.92 * arena * (1 - verde)} filter="url(#sh-borroso)" />}
          {verde > 0 && <path d={rutaS} fill="#4f9a3a" opacity={0.85 * verde} filter="url(#sh-borroso)" />}
        </g>
        {colores &&
          RUTAS_PAISES.filter((p) => colores[p.nombre] && colores[p.nombre].opacidad > 0).map((p) => (
            <path key={`k-${p.nombre}`} d={p.d} fill={`rgba(${colores[p.nombre].color},${0.8 * colores[p.nombre].opacidad})`} />
          ))}
        {RUTAS_PAISES.map((p) => (
          <path key={`b-${p.nombre}`} d={p.d} fill="none" stroke="rgba(40,30,15,0.5)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        ))}
        {RUTAS_PAISES.map((p) => (
          <path key={`c-${p.nombre}`} d={p.d} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} vectorEffect="non-scaling-stroke" />
        ))}
        {brilloSahara > 0 && (
          <g clipPath="url(#sh-tierra)">
            <path
              d={rutaS}
              fill={`rgba(255,220,120,${0.25 * brilloSahara})`}
              stroke={`rgba(255,240,180,${brilloSahara})`}
              strokeWidth={6}
              strokeDasharray="18 12"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
        {children}
      </g>
    </svg>
  );
};
