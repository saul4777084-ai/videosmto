import React from "react";
import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { Dibujo } from "../comun/tipos";
import { LonLat } from "../comun/Globo";
import { CamaraT, mezclarT, Tierra } from "../comun/Tierra";
import { AMARILLO, Caja, Ciudad, Creditos, Linea, Paises, ROJO, Rotulo, Sello, Titular } from "../comun/PiezasTierra";
import { MONTSERRAT } from "../comun/fuentes";
import type { Escenario, Ilustracion } from "./escenas";

// Estilo de los vídeos de mapas virales: mapa plano con satélite oscuro, rótulos grandes inclinados,
// titulares amarillos con brillo y cajas. Sin globo, sin nubes.

const W = 1080;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.inOut(Easing.cubic);
const AGUA = "#6fd3ff";
const NARANJA_CAJA = "#d9773a";

const camino = (f: number, desde: number, hasta: number, a: CamaraT, b: CamaraT) => mezclarT(a, b, interpolate(f, [desde, hasta], [0, 1], { ...clamp, easing: suave }));
const sube = (f: number, desde: number, fin: number, hasta = 70) => interpolate(f, [desde, fin], [0, hasta], { ...clamp, easing: suave });
const aparece = (f: number, inicio: number, damping = 11) => spring({ frame: f - inicio, fps: 30, config: { damping } });
const P = (lon: number, lat: number, zoom: number, y = 1010): CamaraT => ({ lon, lat, zoom, y, plana: true });

const Vineta = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 52%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />;

// marcador del nivel del mar (abajo)
const NivelMar: React.FC<{ f: number; nivel: number; y?: number }> = ({ f, nivel, y = 1560 }) => (
  <>
    <Caja f={f} inicio={4} texto="Nivel del mar" y={y} tam={40} />
    {f >= 4 && (
      <div
        style={{
          position: "absolute",
          top: y + 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: MONTSERRAT,
          fontWeight: 900,
          fontSize: 130,
          color: nivel > 0.5 ? AMARILLO : "#fff",
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${aparece(f, 4, 12)})`,
          textShadow: nivel > 0.5 ? "0 0 26px rgba(255,226,58,0.7), 0 8px 24px rgba(0,0,0,0.7)" : "0 8px 24px rgba(0,0,0,0.7)",
        }}
      >
        +{Math.round(nivel)} M
      </div>
    )}
  </>
);

// edificio de 23 plantas que se inunda
const Edificio: React.FC<{ f: number; inicio: number; nivel: number }> = ({ f, inicio, nivel }) => {
  const s = aparece(f, inicio, 11);
  if (f < inicio) return null;
  const alto = 23 * 15;
  const agua = (nivel / 70) * alto;
  const ola = Math.sin(f / 5) * 4;
  return (
    <svg width={300} height={470} style={{ position: "absolute", left: 30, top: 1360, transform: `scale(${s})`, transformOrigin: "50% 100%", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.6))" }}>
      <rect x={70} y={450 - alto} width={150} height={alto} fill="#e9edf2" stroke="#fff" strokeWidth={5} />
      {Array.from({ length: 23 }, (_, i) =>
        [0, 1, 2, 3].map((j) => <rect key={`${i}-${j}`} x={84 + j * 34} y={450 - alto + 4 + i * 15} width={22} height={8} fill="#3d5873" />),
      )}
      <path d={`M 40 ${450 - agua + ola} Q 95 ${450 - agua - 10 - ola} 150 ${450 - agua + ola} T 260 ${450 - agua} L 260 452 L 40 452 Z`} fill={AGUA} opacity={0.85} />
      <text x={145} y={450 - alto - 18} textAnchor="middle" fontFamily={MONTSERRAT} fontWeight={900} fontSize={32} fill="#fff" stroke="rgba(0,0,0,0.6)" strokeWidth={6} paintOrder="stroke">
        23 PLANTAS
      </text>
    </svg>
  );
};

// reloj de arena
const Reloj: React.FC<{ f: number; inicio: number }> = ({ f, inicio }) => {
  const s = aparece(f, inicio, 11);
  const k = interpolate(f, [inicio, inicio + 130], [0, 1], clamp);
  const giro = interpolate(f, [inicio - 10, inicio + 8], [-180, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <svg width={220} height={300} viewBox="-110 -150 220 300" style={{ position: "absolute", left: W / 2 - 110, top: 760, transform: `scale(${s}) rotate(${giro}deg)`, filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.6))" }}>
      <rect x={-95} y={-148} width={190} height={22} rx={8} fill="#c98a45" />
      <rect x={-95} y={126} width={190} height={22} rx={8} fill="#c98a45" />
      <path d="M -75 -126 L 75 -126 Q 75 -40 8 0 Q 75 40 75 126 L -75 126 Q -75 40 -8 0 Q -75 -40 -75 -126 Z" fill="rgba(200,230,255,0.22)" stroke="#fff" strokeWidth={5} />
      <path d={`M ${-62 * (1 - k)} ${-118 + 100 * k} L ${62 * (1 - k)} ${-118 + 100 * k} L 0 -8 Z`} fill={AMARILLO} opacity={1 - k * 0.95} />
      <rect x={-3} y={-6} width={6} height={124} fill={AMARILLO} opacity={k < 0.98 ? 1 : 0} />
      <path d={`M -68 120 L 68 120 L ${68 - 60 * k} ${120 - 70 * k} L ${-68 + 60 * k} ${120 - 70 * k} Z`} fill={AMARILLO} />
    </svg>
  );
};

// gráfica del nivel del mar desde 1900 (cm, aproximada a partir de NOAA/CSIRO), en tarjeta oscura con borde dorado
const DATOS: [number, number][] = [
  [1900, 0], [1920, 2.5], [1940, 6], [1960, 9.5], [1980, 12], [1993, 14.5], [2000, 16], [2010, 18.7], [2020, 21.5], [2024, 22.8],
];
const Grafica: React.FC<{ f: number; inicio: number; fin: number; etiqueta: number; rapido: number }> = ({ f, inicio, fin, etiqueta, rapido }) => {
  const s = aparece(f, inicio - 6, 12);
  const k = interpolate(f, [inicio, fin], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const X = (a: number) => 110 + ((a - 1900) / 124) * 740;
  const Y = (c: number) => 560 - (c / 25) * 450;
  const hasta = 1900 + 124 * k;
  const pts = DATOS.filter(([a]) => a <= hasta);
  const sig = DATOS.find(([a]) => a > hasta);
  if (sig && pts.length) {
    const p = pts[pts.length - 1];
    pts.push([hasta, p[1] + ((sig[1] - p[1]) * (hasta - p[0])) / (sig[0] - p[0])]);
  }
  const linea = pts.map(([a, c]) => `${X(a)},${Y(c)}`).join(" ");
  const ult = pts[pts.length - 1];
  const se = aparece(f, etiqueta, 10);
  return (
    <div style={{ position: "absolute", left: 70, top: 600, width: 940, height: 690, transform: `scale(${s})`, opacity: Math.min(1, s * 1.5) }}>
      <svg width={940} height={690} style={{ overflow: "visible" }}>
        <rect x={0} y={0} width={940} height={690} rx={34} fill="rgba(16,20,34,0.94)" stroke="#e8b84a" strokeWidth={4} />
        <text x={50} y={74} fontFamily={MONTSERRAT} fontWeight={900} fontSize={38} fill="#fff">
          NIVEL DEL MAR (CM)
        </text>
        {[0, 10, 20].map((c) => (
          <g key={c}>
            <line x1={110} x2={860} y1={Y(c)} y2={Y(c)} stroke="rgba(255,255,255,0.13)" strokeWidth={2} />
            <text x={88} y={Y(c) + 10} textAnchor="end" fontFamily={MONTSERRAT} fontWeight={800} fontSize={28} fill="rgba(255,255,255,0.65)">
              {c}
            </text>
          </g>
        ))}
        {[1900, 1950, 2000].map((a) => (
          <text key={a} x={X(a)} y={622} textAnchor="middle" fontFamily={MONTSERRAT} fontWeight={800} fontSize={30} fill="rgba(255,255,255,0.75)">
            {a}
          </text>
        ))}
        <text x={X(2024)} y={622} textAnchor="middle" fontFamily={MONTSERRAT} fontWeight={900} fontSize={30} fill={AMARILLO}>
          HOY
        </text>
        {pts.length > 1 && (
          <>
            <polygon points={`${X(1900)},${Y(0)} ${linea} ${X(ult[0])},${Y(0)}`} fill="rgba(111,211,255,0.22)" />
            <polyline points={linea} fill="none" stroke={AGUA} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={X(ult[0])} cy={Y(ult[1])} r={14} fill="#fff" stroke={AGUA} strokeWidth={6} />
          </>
        )}
        {f >= etiqueta && (
          <text
            x={X(ult[0]) - 34}
            y={Y(ult[1]) - 40}
            textAnchor="end"
            fontFamily={MONTSERRAT}
            fontWeight={900}
            fontSize={74 * se}
            fill={AMARILLO}
            style={{ filter: "drop-shadow(0 0 14px rgba(255,226,58,0.7))" }}
          >
            +{Math.round(ult[1])} CM
          </text>
        )}
      </svg>
      <Caja f={f} inicio={rapido} texto="▲ +4 mm cada año" y={770} x={470} fondo="#d6283c" tam={50} giro={-3} />
    </div>
  );
};

// ---------- cámaras (mapa plano) y lugares ----------

const C = {
  mundoA: P(-25, 28, 0.78),
  europaA: P(5.5, 50.3, 4.3),
  europaB: P(7.5, 49.6, 4.8),
  espanaA: P(-3.6, 39.9, 8.6),
  espanaB: P(-3.4, 39.6, 9.3),
  floridaA: P(-83.6, 25.6, 6.3),
  floridaB: P(-83.0, 25.9, 6.9),
  sudA: P(-58, -17, 2.4),
  sudB: P(-56.5, -14.5, 2.7),
  asiaA: P(103, 24.5, 2.6),
  asiaB: P(104, 24, 2.95),
};

const L: Record<string, LonLat> = {
  amsterdam: [4.9, 52.37],
  copenhague: [12.57, 55.68],
  venecia: [12.33, 45.44],
  londres: [-0.12, 51.5],
  sevilla: [-5.98, 37.39],
  valencia: [-0.38, 39.47],
  madrid: [-3.7, 40.42],
  miami: [-80.19, 25.76],
  cancun: [-86.85, 21.16],
  buenosAires: [-58.38, -34.6],
  shanghai: [121.47, 31.23],
  bangkok: [100.5, 13.75],
};

const Mapa: React.FC<React.ComponentProps<typeof Tierra>> = (props) => <Tierra estilo="mapa" fronteras={0} {...props} />;

// ---------- escenas ----------

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> => ({
  gancho: ({ f }) => {
    const cam = P(-30 + f * 0.12, 30, interpolate(f, [0, 120], [0.8, 0.9]));
    const k = interpolate(f, [56, 114], [0, 1], { ...clamp, easing: suave });
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} hielo={1 - k} nivelMar={70 * k} />
        <Vineta />
        <Linea f={f} inicio={3} texto="¿Y si se derritiera" y={300} tam={66} />
        <Titular f={f} inicio={14} texto={"TODO EL HIELO"} y={392} tam={98} />
        <Caja f={f} inicio={28} texto="del planeta?" y={560} fondo="#d6283c" tam={54} giro={-3} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  hielo: ({ f }) => {
    const e = esc.hielo;
    const g = e.en("Groenlandia");
    const cam = camino(f, g - 26, g + 20, P(10, -63, 1.25, 1080), P(-40, 66, 1.45, 1060));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {() => (
            <>
              <Rotulo cam={cam} ll={[15, -73]} texto="Antártida" f={f} inicio={e.en("Antartida")} tam={86} giro={-3} />
              <Rotulo cam={cam} ll={[-41, 74]} texto="Groenlandia" f={f} inicio={g} tam={76} giro={-8} />
            </>
          )}
        </Mapa>
        <Vineta />
        <Caja f={f} inicio={e.en("hielo")} texto="99 % del hielo de agua dulce" y={1640} fondo={NARANJA_CAJA} tam={46} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  derrite: ({ f }) => {
    const e = esc.derrite;
    const hielo = 1 - interpolate(f, [e.en("derritiera"), e.en("derritiera") + 50], [0, 1], clamp);
    const nivel = sube(f, e.en("subiria"), e.en("metros") + 26);
    const cam = P(interpolate(f, [0, e.dur], [-40, -10]), 20, 0.95);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} hielo={hielo} nivelMar={nivel} />
        <Vineta />
        <Edificio f={f} inicio={e.en("edificio")} nivel={nivel} />
        {f >= e.en("subiria") && (
          <div style={{ position: "absolute", top: 1440, left: 330, right: 20, textAlign: "center", fontFamily: MONTSERRAT, fontWeight: 900, color: AMARILLO, fontSize: 190, fontVariantNumeric: "tabular-nums", textShadow: "0 0 30px rgba(255,226,58,0.7), 0 10px 26px rgba(0,0,0,0.7)" }}>
            +{Math.round(nivel)} M
          </div>
        )}
        <Linea f={f} inicio={e.en("metros")} texto="más alto que hoy" y={1660} tam={46} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  europa: ({ f }) => {
    const e = esc.europa;
    const cam = camino(f, 0, e.dur, C.europaA, C.europaB);
    const nivel = sube(f, 8, 70);
    const ciudad = (k: string, nombre: string, palabra: string, lado: "izq" | "der" = "der") => {
      const t = e.en(palabra);
      return <Ciudad key={k} cam={cam} ll={L[k]} nombre={nombre} f={f} inicio={t} hundida={t + 10} lado={lado} />;
    };
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} fuentes={["mundo", "europa"]} nivelMar={nivel}>
          {() => (
            <>
              <Rotulo cam={cam} ll={[14, 50.5]} texto="Europa" f={f} inicio={2} tam={92} giro={-5} salida={e.en("Amsterdam") - 4} />
              {ciudad("amsterdam", "Ámsterdam", "Amsterdam")}
              {ciudad("copenhague", "Copenhague", "Copenhague")}
              {ciudad("venecia", "Venecia", "Venecia")}
              {ciudad("londres", "Londres", "Londres", "izq")}
            </>
          )}
        </Mapa>
        <Vineta />
        <NivelMar f={f} nivel={nivel} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  espana: ({ f }) => {
    const e = esc.espana;
    const cam = camino(f, 0, e.dur, C.espanaA, C.espanaB);
    const nivel = sube(f, 8, 72);
    const sev = e.en("Sevilla");
    const val = e.en("Valencia");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} fuentes={["mundo", "europa"]} nivelMar={nivel}>
          {() => (
            <>
              <Rotulo cam={cam} ll={[-4.6, 39.0]} texto="España" f={f} inicio={2} tam={100} giro={-6} salida={sev - 4} />
              <Ciudad cam={cam} ll={L.sevilla} nombre="Sevilla" f={f} inicio={sev} hundida={sev + 10} />
              <Ciudad cam={cam} ll={L.valencia} nombre="Valencia" f={f} inicio={val} hundida={val + 10} />
              <Ciudad cam={cam} ll={L.madrid} nombre="Madrid" f={f} inicio={e.en("Madrid")} salvada={e.en("salvaria")} nota="650 M" />
            </>
          )}
        </Mapa>
        <Vineta />
        <NivelMar f={f} nivel={nivel} />
        <Sello f={f} inicio={e.en("salvaria") + 4} texto="se salva" x={640} y={760} tam={60} giro={-10} color="#22c55e" />
        <Creditos />
      </AbsoluteFill>
    );
  },

  florida: ({ f }) => {
    const e = esc.florida;
    const cam = camino(f, 0, e.dur, C.floridaA, C.floridaB);
    const nivel = sube(f, 8, 72);
    const mia = e.en("Miami");
    const can = e.en("Cancun");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} fuentes={["mundo", "america_norte"]} nivelMar={nivel}>
          {() => (
            <>
              <Rotulo cam={cam} ll={[-81.9, 28.4]} texto="Florida" f={f} inicio={e.en("Florida")} tam={84} giro={-62} />
              <Ciudad cam={cam} ll={L.miami} nombre="Miami" f={f} inicio={mia} hundida={mia + 10} />
              <Ciudad cam={cam} ll={L.cancun} nombre="Cancún" f={f} inicio={can} hundida={can + 10} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <NivelMar f={f} nivel={nivel} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  sudamerica: ({ f }) => {
    const e = esc.sudamerica;
    const cam = camino(f, 0, e.dur, C.sudA, C.sudB);
    const nivel = sube(f, 8, 72);
    const ba = e.en("Buenos");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} fuentes={["mundo", "sudamerica"]} nivelMar={nivel}>
          {() => (
            <>
              <Ciudad cam={cam} ll={L.buenosAires} nombre="Buenos Aires" f={f} inicio={ba} hundida={ba + 12} lado="izq" />
              <Rotulo cam={cam} ll={[-60, -3]} texto="Amazonas" f={f} inicio={e.en("Amazonas")} tam={80} giro={-5} />
            </>
          )}
        </Mapa>
        <Vineta />
        <Caja f={f} inicio={e.en("mar")} texto="mar interior" y={1300} fondo={NARANJA_CAJA} tam={50} giro={-3} />
        <NivelMar f={f} nivel={nivel} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  asia: ({ f }) => {
    const e = esc.asia;
    const cam = camino(f, 0, e.dur, C.asiaA, C.asiaB);
    const nivel = sube(f, 8, 72);
    const bd = e.en("Banglades");
    const sh = e.en("Shanghai");
    const bk = e.en("Bangkok");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} fuentes={["mundo", "asia"]} nivelMar={nivel}>
          {(_p, trazo) => (
            <>
              <Paises trazo={trazo} nombres={["Bangladesh"]} color={ROJO} f={f} inicio={bd} />
              <Rotulo cam={cam} ll={[90.3, 24.3]} texto="Bangladés" f={f} inicio={bd} tam={50} giro={-4} dy={-70} />
              <Ciudad cam={cam} ll={L.shanghai} nombre="Shanghái" f={f} inicio={sh} hundida={sh + 10} lado="izq" />
              <Ciudad cam={cam} ll={L.bangkok} nombre="Bangkok" f={f} inicio={bk} hundida={bk + 10} />
            </>
          )}
        </Mapa>
        <Vineta />
        <NivelMar f={f} nivel={nivel} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  tiempo: ({ f }) => {
    const e = esc.tiempo;
    const cam = P(40 + f * 0.12, 22, 0.85);
    const t = e.en("5.000");
    const v = Math.round(interpolate(f, [t, t + 36], [0, 5000], { ...clamp, easing: Easing.out(Easing.cubic) }));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} />
        <AbsoluteFill style={{ background: "rgba(0,0,0,0.25)" }} />
        <Vineta />
        <Reloj f={f} inicio={6} />
        {f >= t && (
          <div style={{ position: "absolute", top: 1180, left: 0, right: 0, textAlign: "center", fontFamily: MONTSERRAT, fontWeight: 900, fontSize: 170, color: AMARILLO, fontVariantNumeric: "tabular-nums", textShadow: "0 0 30px rgba(255,226,58,0.7), 0 10px 26px rgba(0,0,0,0.7)", transform: `scale(${aparece(f, t, 10)})` }}>
            +{v >= 1000 ? `${Math.floor(v / 1000)}.${String(v % 1000).padStart(3, "0")}` : v}
          </div>
        )}
        <Linea f={f} inicio={t + 8} texto="años" y={1390} tam={80} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  ritmo: ({ f }) => {
    const e = esc.ritmo;
    const cam = P(-20 + f * 0.08, 35, 1.3);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} />
        <AbsoluteFill style={{ background: "rgba(0,0,0,0.4)" }} />
        <Grafica f={f} inicio={e.en("subido")} fin={e.en("1900") + 20} etiqueta={e.en("centimetros")} rapido={e.en("rapido")} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  final: ({ f }) => {
    const cam = P(80 + f * 0.12, 25, 0.9);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f} hielo={0} nivelMar={70} />
        <Vineta />
        <Linea f={f} inicio={2} texto="¿Tu ciudad" y={560} tam={90} />
        <Titular f={f} inicio={12} texto="SOBREVIVIRÍA?" y={670} tam={124} />
        <Caja f={f} inicio={34} texto="Escríbela en los comentarios" y={1250} fondo={NARANJA_CAJA} tam={48} />
        <Creditos />
      </AbsoluteFill>
    );
  },
});
