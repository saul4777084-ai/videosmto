import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import tierra50 from "world-atlas/land-50m.json";
import { aPantalla, CamaraGlobo, Globo, LonLat } from "../comun/Globo";
import { Tierra } from "../comun/Tierra";

// Muestras del motor de mapas nuevo (src/comun/Tierra.tsx) frente al actual, para que el usuario elija.
const W = 1080;
const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const topoTierra = tierra50 as unknown as Topology<{ land: GeometryCollection }>;
const TIERRA = feature(topoTierra, topoTierra.objects.land) as FeatureCollection<Geometry>;

const EUROPA: CamaraGlobo = { lon: 6, lat: 47, zoom: 3.3, y: 1000 };
const ASIA: CamaraGlobo = { lon: 82, lat: 40, zoom: 1.45, y: 1020 };

// Imperio mongol en 1279 (aproximado; se recorta con la costa real)
const IMPERIO: LonLat[] = [
  [29, 45], [27.5, 48.5], [25.5, 51.5], [30, 55], [33, 57.5], [38, 59.5], [46, 61.5], [56, 61], [64, 58.5], [74, 56.5], [84, 55.5],
  [94, 55], [104, 56.5], [114, 56], [124, 55], [134, 53], [142, 50], [138, 47], [133, 43.5], [131.5, 42], [130.8, 40], [130.5, 36.5],
  [129.2, 34.9], [126, 33], [124, 30], [123, 27], [120.5, 24], [118, 22], [113.5, 20.5], [111, 17.8], [108.5, 18], [107.8, 21.5],
  [106, 22.9], [104, 22.6], [102, 21.8], [100.5, 21.4], [98.7, 24], [98.2, 26], [97.5, 28.2], [95, 29], [92, 27.9], [89, 27.3],
  [86, 27.9], [82, 29.6], [79.5, 30.8], [77.3, 32.8], [74.5, 33.5], [72, 32.5], [70.5, 30.5], [69.5, 28.5], [67.6, 25.5], [66.5, 25.3],
  [62, 24.8], [57.5, 25.2], [56.2, 26.8], [54, 26.2], [51, 27.2], [49, 29.6], [48, 29.9], [46, 31], [44, 31.5], [42, 33.5], [40.5, 34.6],
  [39, 36], [38, 36.9], [36, 36.6], [34, 36.2], [32, 36.1], [30.5, 36.5], [29, 37.2], [28, 38], [29.5, 40.5], [31.5, 41.2], [29, 45],
];

const Insignia: React.FC<{ letra: string; texto: string; detalle: string }> = ({ letra, texto, detalle }) => (
  <div style={{ position: "absolute", top: 70, left: 40, right: 40, display: "flex", alignItems: "center", gap: 22, fontFamily: SANS }}>
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: 24,
        background: "#f2c230",
        color: "#111",
        fontSize: 64,
        fontWeight: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      {letra}
    </div>
    <div style={{ color: "#fff", textShadow: "0 4px 18px rgba(0,0,0,0.9)" }}>
      <div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.05 }}>{texto}</div>
      <div style={{ fontSize: 30, fontWeight: 600, opacity: 0.85, marginTop: 6 }}>{detalle}</div>
    </div>
  </div>
);

const Ciudad: React.FC<{ cam: CamaraGlobo; ll: LonLat; nombre: string; lado?: "izq" | "der"; color?: string; f: number }> = ({ cam, ll, nombre, lado = "der", color = "#fff", f }) => {
  const p = aPantalla(cam, ll);
  if (!p) return null;
  const onda = (f % 36) / 36;
  return (
    <g>
      <circle cx={p[0]} cy={p[1]} r={10 + onda * 34} fill="none" stroke={color} strokeWidth={4} opacity={1 - onda} />
      <circle cx={p[0]} cy={p[1]} r={10} fill={color} stroke="#111" strokeWidth={3} />
      <text
        x={p[0] + (lado === "der" ? 22 : -22)}
        y={p[1] + 12}
        textAnchor={lado === "der" ? "start" : "end"}
        fontFamily={SANS}
        fontWeight={900}
        fontSize={38}
        fill="#fff"
        stroke="rgba(0,0,0,0.85)"
        strokeWidth={8}
        paintOrder="stroke"
      >
        {nombre}
      </text>
    </g>
  );
};

const Vineta = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />;

// ---------- muestras ----------

const Actual: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Globo camara={EUROPA} f={f} />
      <Insignia letra="A" texto="Como es ahora" detalle="dibujo plano, verde para toda la tierra" />
    </AbsoluteFill>
  );
};

const Satelite: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Tierra camara={EUROPA} f={f} estilo="satelite" fuentes={["mundo", "europa"]} nubes={0.35} fronteras={0.45} />
      <Vineta />
      <Insignia letra="B" texto="Satélite con relieve" detalle="foto real de la NASA + montañas + fondo marino" />
    </AbsoluteFill>
  );
};

const Atlas: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Tierra camara={EUROPA} f={f} estilo="relieve" fuentes={["mundo", "europa"]} fronteras={0.5} />
      <Vineta />
      <Insignia letra="C" texto="Atlas físico" detalle="colores por altura, estilo libro de geografía" />
    </AbsoluteFill>
  );
};

const CIUDADES_HUNDIDAS: { ll: LonLat; nombre: string; lado?: "izq" | "der" }[] = [
  { ll: [4.9, 52.37], nombre: "Ámsterdam" },
  { ll: [-0.12, 51.5], nombre: "Londres", lado: "izq" },
  { ll: [12.33, 45.44], nombre: "Venecia" },
  { ll: [-5.98, 37.39], nombre: "Sevilla" },
  { ll: [12.57, 55.68], nombre: "Copenhague" },
];

const Deshielo: React.FC<{ nivel: number; letra: string; titulo: string; detalle: string; ciudades: boolean }> = ({ nivel, letra, titulo, detalle, ciudades }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Tierra camara={EUROPA} f={f} estilo="satelite" fuentes={["mundo", "europa"]} nubes={0.25} fronteras={0.35} nivelMar={nivel}>
        {() => (ciudades ? CIUDADES_HUNDIDAS.map((c) => <Ciudad key={c.nombre} cam={EUROPA} ll={c.ll} nombre={c.nombre} lado={c.lado} color="#ff5a4f" f={f} />) : null)}
      </Tierra>
      <Vineta />
      <Insignia letra={letra} texto={titulo} detalle={detalle} />
      <Marcador nivel={nivel} />
    </AbsoluteFill>
  );
};

const Marcador: React.FC<{ nivel: number }> = ({ nivel }) => (
  <div
    style={{
      position: "absolute",
      bottom: 150,
      left: 0,
      right: 0,
      textAlign: "center",
      fontFamily: SANS,
      color: "#fff",
      textShadow: "0 6px 24px rgba(0,0,0,0.9)",
    }}
  >
    <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 4, opacity: 0.9 }}>NIVEL DEL MAR</div>
    <div style={{ fontSize: 150, fontWeight: 900, color: nivel > 0 ? "#6fd3ff" : "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
      +{Math.round(nivel)} m
    </div>
  </div>
);

const Mongoles: React.FC = () => {
  const f = useCurrentFrame();
  const cam = ASIA;
  return (
    <AbsoluteFill>
      <Tierra camara={cam} f={f} estilo="relieve" fuentes={["mundo", "asia"]} fronteras={0.25}>
        {(_proy, trazo) => {
          const d = trazo({ type: "Polygon", coordinates: [IMPERIO] }) ?? "";
          return (
            <>
              <defs>
                <clipPath id="m-tierra">
                  <path d={trazo(TIERRA) ?? ""} />
                </clipPath>
                <filter id="m-brillo" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" />
                </filter>
              </defs>
              <g clipPath="url(#m-tierra)">
                <path d={d} fill="rgba(196,30,36,0.5)" />
                <path d={d} fill="none" stroke="#ff3b30" strokeWidth={22} opacity={0.6} filter="url(#m-brillo)" />
                <path d={d} fill="none" stroke="#ffd54a" strokeWidth={5} strokeLinejoin="round" />
              </g>
              <Ciudad cam={cam} ll={[102.8, 47.2]} nombre="Karakórum" f={f} lado="izq" color="#ffd54a" />
              <Ciudad cam={cam} ll={[116.4, 39.9]} nombre="Pekín" f={f} />
              <Ciudad cam={cam} ll={[44.4, 33.3]} nombre="Bagdad" f={f} lado="izq" />
              <Ciudad cam={cam} ll={[30.5, 50.45]} nombre="Kiev" f={f} />
            </>
          );
        }}
      </Tierra>
      <Vineta />
      <Insignia letra="E" texto="Imperio mongol (1279)" detalle="relieve real, imperio recortado por la costa" />
      <div
        style={{
          position: "absolute",
          bottom: 170,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          color: "#fff",
          textShadow: "0 6px 24px rgba(0,0,0,0.9)",
        }}
      >
        <div style={{ fontSize: 120, color: "#ffd54a", lineHeight: 1 }}>24 millones</div>
        <div style={{ fontSize: 56 }}>de km² bajo un solo kan</div>
      </div>
    </AbsoluteFill>
  );
};

const GloboEntero: React.FC = () => {
  const f = useCurrentFrame();
  const cam: CamaraGlobo = { lon: 20 + f * 0.25, lat: 22, zoom: 1, y: 1000 };
  return (
    <AbsoluteFill>
      <Tierra camara={cam} f={f} estilo="satelite" nubes={0.75} fronteras={0} />
      <Insignia letra="F" texto="Globo para el gancho" detalle="satélite, nubes que se mueven, atmósfera" />
    </AbsoluteFill>
  );
};

// clip: el mar sube de 0 a 70 m en Europa
export const MuestraDeshielo: React.FC = () => {
  const f = useCurrentFrame();
  const nivel = interpolate(f, [20, 160], [0, 70], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cam: CamaraGlobo = { ...EUROPA, zoom: interpolate(f, [0, 180], [3.1, 3.5]), lon: interpolate(f, [0, 180], [5, 7]) };
  return (
    <AbsoluteFill>
      <Tierra camara={cam} f={f} estilo="satelite" fuentes={["mundo", "europa"]} nubes={0.25} fronteras={0.35} nivelMar={nivel}>
        {() => CIUDADES_HUNDIDAS.map((c) => <Ciudad key={c.nombre} cam={cam} ll={c.ll} nombre={c.nombre} lado={c.lado} color="#ff5a4f" f={f} />)}
      </Tierra>
      <Vineta />
      <Marcador nivel={nivel} />
    </AbsoluteFill>
  );
};

export const MUESTRAS = 7;
export const MuestrasMapas: React.FC = () => (
  <AbsoluteFill style={{ background: "#000", width: W }}>
    <Sequence durationInFrames={30} layout="none">
      <Actual />
    </Sequence>
    <Sequence from={30} durationInFrames={30} layout="none">
      <Satelite />
    </Sequence>
    <Sequence from={60} durationInFrames={30} layout="none">
      <Atlas />
    </Sequence>
    <Sequence from={90} durationInFrames={30} layout="none">
      <Deshielo nivel={0} letra="D1" titulo="Deshielo: hoy" detalle="Europa con el nivel del mar actual" ciudades={false} />
    </Sequence>
    <Sequence from={120} durationInFrames={30} layout="none">
      <Deshielo nivel={70} letra="D2" titulo="Deshielo: +70 m" detalle="alturas reales: el mar entra por donde entraría" ciudades />
    </Sequence>
    <Sequence from={150} durationInFrames={30} layout="none">
      <Mongoles />
    </Sequence>
    <Sequence from={180} durationInFrames={30} layout="none">
      <GloboEntero />
    </Sequence>
  </AbsoluteFill>
);
