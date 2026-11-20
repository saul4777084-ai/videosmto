import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { LonLat } from "../comun/Globo";
import { aPantallaT, CamaraT, EstiloTierra, Tierra } from "../comun/Tierra";
import { TIERRA_50 } from "../comun/PiezasTierra";
import { Subtitulos } from "../comun/Subtitulos";
import { Etiqueta } from "../Colon/Ilustraciones";
import { Chip, Rotulo, Sello } from "../Napoleon/Ilustraciones";

// Muestras: los dos vídeos de mapas con las piezas de Napoleón (etiquetas azul marino, chips, año dorado, sellos)
// y subtítulos clásicos, sobre tres mapas: globo satélite, mapa dibujado y atlas físico.

const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

const E1279: LonLat[] = [
  [29, 45], [27.5, 48.5], [25.5, 51.5], [30, 55], [33, 57.5], [38, 59.5], [46, 61.5], [56, 61], [64, 58.5], [74, 56.5], [84, 55.5],
  [94, 55], [104, 56.5], [114, 56], [124, 55], [134, 53], [142, 50], [138, 47], [133, 43.5], [131.5, 42], [130.8, 40], [130.5, 36.5],
  [129.2, 34.9], [126, 33], [124, 30], [123, 27], [120.5, 24], [118, 22], [113.5, 20.5], [111, 17.8], [108.5, 18], [107.8, 21.5],
  [106, 22.9], [104, 22.6], [102, 21.8], [100.5, 21.4], [98.7, 24], [98.2, 26], [97.5, 28.2], [95, 29], [92, 27.9], [89, 27.3],
  [86, 27.9], [82, 29.6], [79.5, 30.8], [77.3, 32.8], [74.5, 33.5], [72, 32.5], [70.5, 30.5], [69.5, 28.5], [67.6, 25.5], [66.5, 25.3],
  [62, 24.8], [57.5, 25.2], [56.2, 26.8], [54, 26.2], [51, 27.2], [49, 29.6], [48, 29.9], [46, 31], [44, 31.5], [42, 33.5], [40.5, 34.6],
  [39, 36], [38, 36.9], [36, 36.6], [34, 36.2], [32, 36.1], [30.5, 36.5], [29, 37.2], [28, 38], [29.5, 40.5], [31.5, 41.2], [29, 45],
];

const Insignia: React.FC<{ letra: string; texto: string }> = ({ letra, texto }) => (
  <div style={{ position: "absolute", bottom: 40, left: 30, right: 30, display: "flex", alignItems: "center", gap: 18, fontFamily: SANS }}>
    <div style={{ width: 80, height: 80, borderRadius: 20, background: "#f2c230", color: "#111", fontSize: 54, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {letra}
    </div>
    <div style={{ color: "#fff", fontSize: 42, fontWeight: 900, textShadow: "0 4px 16px #000" }}>{texto}</div>
  </div>
);

// ciudad al estilo Napoleón: punto que late y etiqueta azul marino (roja si queda bajo el agua)
const CiudadN: React.FC<{ cam: CamaraT; ll: LonLat; nombre: string; f: number; hundida?: boolean; dy?: number }> = ({ cam, ll, nombre, f, hundida, dy = -60 }) => {
  const p = aPantallaT(cam, ll);
  if (!p) return null;
  const onda = (f % 30) / 30;
  const c = hundida ? "#e53935" : "#f2c230";
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={p[0]} cy={p[1]} r={16 + onda * 46} fill="none" stroke={c} strokeWidth={5} opacity={1 - onda} />
        <circle cx={p[0]} cy={p[1]} r={16} fill={c} stroke="#fff" strokeWidth={5} />
      </svg>
      <Etiqueta f={f + 30} x={Math.max(170, Math.min(910, p[0]))} y={p[1] + dy} texto={hundida ? `${nombre} ✕` : nombre} color={hundida ? "#b71c1c" : "#0d1b2a"} tam={36} />
    </>
  );
};

const Subs: React.FC<{ texto: string; clave: string[] }> = ({ texto, clave }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0) 30%)" }} />
    <Subtitulos texto={texto} clave={clave} frameLocal={999} duracion={120} tam={60} />
  </>
);

const Deshielo: React.FC<{ estilo: EstiloTierra; plana: boolean; letra: string; nombre: string }> = ({ estilo, plana, letra, nombre }) => {
  const f = useCurrentFrame();
  const cam: CamaraT = plana ? { lon: 7, lat: 49.5, zoom: 4.4, y: 1000, plana } : { lon: 7, lat: 49, zoom: 3.6, y: 1000 };
  return (
    <AbsoluteFill>
      <Tierra camara={cam} f={f} estilo={estilo} fuentes={["mundo", "europa"]} nivelMar={70} nubes={estilo === "satelite" ? 0.25 : 0} fronteras={estilo === "dibujo" ? 0.6 : 0} />
      <CiudadN cam={cam} ll={[4.9, 52.37]} nombre="ÁMSTERDAM" f={f} hundida />
      <CiudadN cam={cam} ll={[12.57, 55.68]} nombre="COPENHAGUE" f={f} hundida />
      <CiudadN cam={cam} ll={[12.33, 45.44]} nombre="VENECIA" f={f} hundida dy={70} />
      <CiudadN cam={cam} ll={[-0.12, 51.5]} nombre="LONDRES" f={f} hundida dy={70} />
      <Chip f={f + 30} inicio={0} x={540} y={1490} texto="NIVEL DEL MAR" fondo="#ffffff" color="#13204a" tam={44} />
      <Rotulo f={f + 30} inicio={0} texto="+70 m" y={1540} tam={150} />
      <Subs texto="En Europa desaparecerían Ámsterdam, Copenhague, Venecia y Londres." clave={["Ámsterdam,", "Venecia", "Londres."]} />
      <Insignia letra={letra} texto={nombre} />
    </AbsoluteFill>
  );
};

const Mongoles: React.FC<{ estilo: EstiloTierra; plana: boolean; letra: string; nombre: string }> = ({ estilo, plana, letra, nombre }) => {
  const f = useCurrentFrame();
  const cam: CamaraT = plana ? { lon: 84, lat: 42, zoom: 1.3, y: 1060, plana } : { lon: 84, lat: 40, zoom: 1.45, y: 1060 };
  return (
    <AbsoluteFill>
      <Tierra camara={cam} f={f} estilo={estilo} fuentes={["mundo", "asia"]} nubes={estilo === "satelite" ? 0.3 : 0} fronteras={estilo === "dibujo" ? 0.6 : 0.2}>
        {(_p, trazo) => {
          const d = trazo({ type: "Polygon", coordinates: [E1279] }) ?? "";
          return (
            <>
              <defs>
                <clipPath id={`m${letra}`}>
                  <path d={trazo(TIERRA_50) ?? ""} />
                </clipPath>
              </defs>
              <g clipPath={`url(#m${letra})`}>
                <path d={d} fill="rgba(198,40,40,0.62)" />
                <path d={d} fill="none" stroke="#7f1010" strokeWidth={4} strokeLinejoin="round" />
              </g>
            </>
          );
        }}
      </Tierra>
      <CiudadN cam={cam} ll={[102.8, 47.2]} nombre="KARAKÓRUM" f={f} />
      <CiudadN cam={cam} ll={[116.4, 39.9]} nombre="PEKÍN" f={f} dy={70} />
      <CiudadN cam={cam} ll={[44.36, 33.31]} nombre="BAGDAD" f={f} dy={70} />
      <Rotulo f={f + 30} inicio={0} texto="1279" y={560} tam={130} />
      <Chip f={f + 30} inicio={0} x={540} y={1560} texto="24 MILLONES DE KM²" fondo="#f2c230" color="#13204a" tam={52} />
      <Sello f={f + 30} inicio={0} x={540} y={1700} texto="IMPERIO MONGOL" tam={60} giro={-6} />
      <Subs texto="En 1279, Kublai Kan conquistó toda China: 24 millones de km²." clave={["China:", "24", "millones"]} />
      <Insignia letra={letra} texto={nombre} />
    </AbsoluteFill>
  );
};

const OPCIONES: { estilo: EstiloTierra; plana: boolean; letra: string; nombre: string }[] = [
  { estilo: "satelite", plana: false, letra: "1", nombre: "Globo satélite (el del principio)" },
  { estilo: "dibujo", plana: true, letra: "2", nombre: "Mapa dibujado (como Napoleón)" },
  { estilo: "relieve", plana: false, letra: "3", nombre: "Atlas físico" },
];

export const MUESTRAS_ESTILOS = OPCIONES.length * 2;
export const MuestrasEstilos: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {OPCIONES.flatMap((o, i) => [
      <Sequence key={`d${i}`} from={i * 60} durationInFrames={30} layout="none">
        <Deshielo {...o} />
      </Sequence>,
      <Sequence key={`m${i}`} from={i * 60 + 30} durationInFrames={30} layout="none">
        <Mongoles {...o} />
      </Sequence>,
    ])}
  </AbsoluteFill>
);
