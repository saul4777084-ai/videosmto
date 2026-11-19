import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";
import { Dibujo } from "../comun/tipos";
import { Barco } from "../Colon/Barco";
import { Calendario, Corona, Etiqueta } from "../Colon/Ilustraciones";
import { Chip, Espadas, Fondo, Rotulo, Sello, useAparicion, Viñeta } from "../Napoleon/Ilustraciones";
import type { Escenario } from "./escenas";
import { aPantalla, CamaraGlobo, Globo, haciaDerecha, LonLat, mezclar, puntoEnRuta, Ruta } from "../comun/Globo";

const W = 1080;
const H = 1920;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.inOut(Easing.cubic);
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const ORO = "#f2c230";
const ROJO = "#e53935";

export type Ilustracion =
  | "gancho"
  | "zarpan"
  | "especias"
  | "atlantico"
  | "motin"
  | "naufragio"
  | "estrecho"
  | "pacifico"
  | "inmenso"
  | "hambre"
  | "mactan"
  | "quema"
  | "molucas"
  | "elcano"
  | "regreso"
  | "llegada"
  | "calendario"
  | "escudo"
  | "final";

// ---------- lugares y rutas (lon, lat) ----------

const L = {
  sanlucar: [-6.36, 36.78] as LonLat,
  sanJulian: [-67.7, -49.3] as LonLat,
  estrecho: [-71.2, -53.3] as LonLat,
  entrada: [-68.4, -52.4] as LonLat,
  salida: [-74.7, -52.7] as LonLat,
  guam: [144.8, 13.4] as LonLat,
  mactan: [124.0, 10.3] as LonLat,
  tidore: [127.4, 0.68] as LonLat,
  cabo: [18.5, -34.6] as LonLat,
  caboVerde: [-23.5, 15] as LonLat,
};

// de Sanlúcar a la Patagonia
const IDA_ATLANTICO: LonLat[] = [
  L.sanlucar, [-10, 33], [-16.3, 28.4], [-18, 18], [-16, 9], [-25, 2], [-33, -6], [-37, -14], [-43.2, -23.6],
  [-50, -30.5], [-55.5, -35.8], [-59, -40], [-63.5, -44.5], L.sanJulian,
];
// por dentro del estrecho
const ESTRECHO: LonLat[] = [[-67.4, -52.3], L.entrada, [-69.6, -52.5], [-70.3, -52.75], [-70.8, -53.05], [-70.95, -53.5], [-71.3, -53.95], [-72.0, -53.7], [-72.8, -53.4], [-73.5, -53.0], [-74.3, -52.75], L.salida, [-76, -52.3]];
// el Pacífico, de la salida del estrecho a Guam y Filipinas
const PACIFICO: LonLat[] = [L.salida, [-77, -48], [-80, -38], [-90, -28], [-110, -20], [-138.8, -14.8], [-155, -6], [-170, 3], [175, 10], L.guam, [125.8, 10.7], L.mactan];
// de Filipinas a las Molucas
const A_MOLUCAS: LonLat[] = [L.mactan, [123.5, 9.6], [120, 7], [114.9, 4.9], [118, 5.5], [123, 2], L.tidore];
// regreso de Elcano por el Índico y África
const REGRESO: LonLat[] = [
  L.tidore, [126, -4], [124.5, -9.5], [110, -20], [90, -32], [60, -40], [32, -40], L.cabo, [10, -25], [3, -10], [-10, 0], [-18, 10],
  L.caboVerde, [-28, 30], [-25, 37], [-12, 37.5], L.sanlucar,
];
const SIN_PRIMERO = (r: LonLat[]) => r.slice(1);
const VUELTA_ENTERA: LonLat[] = [
  ...IDA_ATLANTICO, ...[L.entrada, [-70.9, -53.6] as LonLat], ...SIN_PRIMERO(PACIFICO), ...SIN_PRIMERO(A_MOLUCAS), ...SIN_PRIMERO(REGRESO),
];

// ---------- piezas ----------

// punto que late sobre el globo
const MarcadorG: React.FC<{ f: number; inicio: number; cam: CamaraGlobo; ll: LonLat; color?: string }> = ({ f, inicio, cam, ll, color = ORO }) => {
  const p = aPantalla(cam, ll);
  const s = useAparicion(f, inicio, 9);
  if (f < inicio || !p) return null;
  const onda = ((f - inicio) % 30) / 30;
  return (
    <g>
      <circle cx={p[0]} cy={p[1]} r={18 + onda * 55} fill="none" stroke={color} strokeWidth={6} opacity={1 - onda} />
      <circle cx={p[0]} cy={p[1]} r={18 * s} fill={color} stroke="#fff" strokeWidth={5} />
    </g>
  );
};

// etiqueta pegada a un lugar del globo
const EtiquetaG: React.FC<{ f: number; inicio: number; cam: CamaraGlobo; ll: LonLat; texto: string; dy?: number; dx?: number; color?: string; tam?: number }> = ({
  f,
  inicio,
  cam,
  ll,
  texto,
  dy = -90,
  dx = 0,
  color = "#0d1b2a",
  tam = 46,
}) => {
  const p = aPantalla(cam, ll);
  if (!p || f < inicio || p[0] < 90 || p[0] > W - 90) return null;
  return <Etiqueta f={f} x={Math.max(240, Math.min(W - 240, p[0] + dx))} y={Math.max(460, Math.min(1500, p[1] + dy))} texto={texto} inicio={inicio} color={color} tam={tam} />;
};

// barco que navega por una ruta del globo
const BarcoG: React.FC<{ cam: CamaraGlobo; ruta: LonLat[]; t: number; f: number; escala: number; nombre?: string }> = ({ cam, ruta, t, f, escala, nombre }) => {
  const p = aPantalla(cam, puntoEnRuta(ruta, t));
  if (!p) return null;
  return <Barco x={p[0]} y={p[1] - 30 * escala} escala={escala} f={f} haciaEste={haciaDerecha(cam, ruta, t)} nombre={nombre} />;
};

// marcador de naves que quedan (5 al principio): las perdidas se tachan en su momento
const NAVES = ["Trinidad", "San Antonio", "Concepción", "Victoria", "Santiago"];
const Flota: React.FC<{ f: number; quedan: number; bajas?: number[]; y?: number; inicio?: number }> = ({ f, quedan, bajas = [], y = 1570, inicio = 0 }) => {
  const s = useAparicion(f, inicio, 12);
  const perdidasAhora = bajas.filter((b) => f >= b).length;
  const n = quedan - perdidasAhora;
  return (
    <div style={{ position: "absolute", left: 528, top: y, width: 520, boxSizing: "border-box", transform: `scale(${s})`, transformOrigin: "50% 50%" }}>
      <div
        style={{
          background: "rgba(8,14,32,0.82)",
          border: "3px solid rgba(255,255,255,0.25)",
          borderRadius: 28,
          padding: "14px 18px 6px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: SANS, color: "#fff", fontWeight: 900 }}>
          <span style={{ fontSize: 34, letterSpacing: 3, opacity: 0.8 }}>NAVES</span>
          <span style={{ fontSize: 64, color: n <= 1 ? ROJO : ORO, fontVariantNumeric: "tabular-nums" }}>{n}</span>
        </div>
        <svg width={464} height={110}>
          {NAVES.map((nom, i) => {
            // la nave i sigue a flote si i < quedan (y aún no ha caído la baja que la tacha)
            const indiceBaja = quedan - 1 - i; // las bajas tachan de derecha a izquierda
            const fBaja = indiceBaja >= 0 && indiceBaja < bajas.length ? bajas[bajas.length - 1 - indiceBaja] : undefined;
            const viva = i < quedan && (fBaja === undefined || f < fBaja);
            const tacha = fBaja !== undefined ? interpolate(f, [fBaja, fBaja + 8], [0, 1], clamp) : i < quedan ? 0 : 1;
            return (
              <g key={nom} opacity={viva ? 1 : 0.35} transform={`translate(${46 + i * 93} 66)`}>
                <Barco x={0} y={0} escala={0.3} f={f} fase={i * 11} />
                {tacha > 0 && (
                  <g stroke={ROJO} strokeWidth={9} strokeLinecap="round" opacity={viva ? 1 : 1}>
                    <path d={`M -32 -52 L ${-32 + 64 * tacha} ${-52 + 70 * tacha}`} />
                    <path d={`M 32 -52 L ${32 - 64 * tacha} ${-52 + 70 * tacha}`} />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// busto de capitán en un marco ovalado
const Retrato: React.FC<{ x: number; y: number; s: number; quien: "magallanes" | "elcano"; gris?: number; nombre?: string }> = ({ x, y, s, quien, gris = 0, nombre }) => {
  const mag = quien === "magallanes";
  const barba = mag ? "#2b2118" : "#7a4a24";
  const pelo = mag ? "#2b2118" : "#6b3e1c";
  const ropa = mag ? "#1b1b22" : "#6d1520";
  const gorro = mag ? "#111" : "#8e1b25";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: gris > 0 ? `grayscale(${gris})` : undefined }}>
      <ellipse cx={0} cy={0} rx={150} ry={185} fill="#8a6420" />
      <ellipse cx={0} cy={0} rx={136} ry={171} fill={mag ? "#e9dcc0" : "#dfe8f0"} />
      <clipPath id={`marco-${quien}`}>
        <ellipse cx={0} cy={0} rx={136} ry={171} />
      </clipPath>
      <g clipPath={`url(#marco-${quien})`}>
        {/* hombros */}
        <path d="M -150 190 Q -140 80 -60 60 L 60 60 Q 140 80 150 190 Z" fill={ropa} />
        {/* gorguera / cuello blanco */}
        <path d="M -62 62 Q 0 95 62 62 Q 50 40 0 44 Q -50 40 -62 62 Z" fill="#f4f1e8" stroke="#bdb6a2" strokeWidth={3} />
        {/* cara */}
        <ellipse cx={0} cy={-20} rx={58} ry={72} fill="#e8b88f" />
        {/* barba */}
        <path d={`M -58 -10 Q -60 ${mag ? 90 : 70} 0 ${mag ? 100 : 80} Q 60 ${mag ? 90 : 70} 58 -10 Q 40 30 0 30 Q -40 30 -58 -10 Z`} fill={barba} />
        <path d="M -24 18 Q 0 10 24 18" stroke="#9c5b45" strokeWidth={6} fill="none" />
        {/* ojos y cejas */}
        <ellipse cx={-22} cy={-30} rx={7} ry={8} fill="#2a1a10" />
        <ellipse cx={22} cy={-30} rx={7} ry={8} fill="#2a1a10" />
        <path d="M -36 -48 L -10 -44 M 10 -44 L 36 -48" stroke={pelo} strokeWidth={7} strokeLinecap="round" />
        <path d="M 0 -26 Q 6 -4 0 4" stroke="#c88e68" strokeWidth={5} fill="none" />
        {/* gorro */}
        {mag ? (
          <path d="M -70 -70 Q -60 -125 0 -128 Q 60 -125 70 -70 Q 0 -86 -70 -70 Z" fill={gorro} />
        ) : (
          <path d="M -80 -66 Q -90 -130 10 -135 Q 95 -128 78 -70 Q 0 -90 -80 -66 Z" fill={gorro} />
        )}
      </g>
      {nombre && (
        <g transform="translate(0 205)">
          <rect x={-170} y={-34} width={340} height={64} rx={14} fill="#0d1b2a" stroke={ORO} strokeWidth={4} />
          <text x={0} y={12} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={40} fill="#fff" letterSpacing={2}>
            {nombre}
          </text>
        </g>
      )}
    </g>
  );
};

// saco de clavo
const Saco: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 60 Q -90 -20 -40 -60 L 40 -60 Q 90 -20 70 60 Q 0 80 -70 60 Z" fill="#c9a26b" stroke="#6b4a22" strokeWidth={6} />
    <path d="M -44 -62 Q 0 -90 44 -62" stroke="#6b4a22" strokeWidth={8} fill="none" />
    {Array.from({ length: 9 }, (_, i) => (
      <g key={i} transform={`translate(${-36 + (i % 3) * 36 + (i > 5 ? 8 : 0)} ${-74 - Math.floor(i / 3) * 12}) rotate(${i * 40})`}>
        <rect x={-3} y={-10} width={6} height={18} rx={3} fill="#4a2512" />
        <circle cx={0} cy={-12} r={6} fill="#5b2e15" />
      </g>
    ))}
    <text x={0} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={26} fill="#6b4a22">
      CLAVO
    </text>
  </g>
);

const Rata: React.FC<{ x: number; y: number; s: number; f: number }> = ({ x, y, s, f }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M 70 10 Q 130 ${-20 + Math.sin(f / 4) * 20} 170 20`} stroke="#c98b8b" strokeWidth={8} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={0} rx={80} ry={45} fill="#7d7d86" />
    <ellipse cx={-70} cy={-10} rx={42} ry={32} fill="#8a8a93" />
    <circle cx={-80} cy={-42} r={20} fill="#8a8a93" />
    <circle cx={-80} cy={-42} r={11} fill="#d9a3a3" />
    <circle cx={-92} cy={-14} r={6} fill="#111" />
    <circle cx={-112} cy={-4} r={7} fill="#d97a7a" />
    <path d="M -110 0 L -150 -10 M -110 4 L -150 8" stroke="#333" strokeWidth={2} />
  </g>
);

const Cuero: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(-8)`}>
    <path d="M -90 -50 Q -60 -70 -20 -55 Q 30 -75 85 -50 Q 100 0 80 50 Q 30 70 -10 55 Q -60 72 -92 48 Q -105 0 -90 -50 Z" fill="#8b5a2b" stroke="#4a2a10" strokeWidth={6} />
    <path d="M -70 -35 Q -50 -50 -20 -40 Q 30 -55 66 -35 Q 78 0 64 36 Q 30 50 -10 40 Q -50 54 -72 34 Q -82 0 -70 -35 Z" fill="none" stroke="#d9b48a" strokeWidth={4} strokeDasharray="8 10" />
  </g>
);

const Serrin: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -100 40 Q -60 -40 0 -50 Q 60 -40 100 40 Z" fill="#d8b36a" />
    {Array.from({ length: 40 }, (_, i) => (
      <rect key={i} x={-85 + random(`sx${i}`) * 170} y={-30 + random(`sy${i}`) * 65} width={6} height={3} fill="#9c7a35" transform={`rotate(${random(`sr${i}`) * 180})`} />
    ))}
  </g>
);

const Calavera: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 -10 Q -70 -90 0 -90 Q 70 -90 70 -10 Q 70 30 40 40 L 40 70 L -40 70 L -40 40 Q -70 30 -70 -10 Z" fill="#f2efe6" stroke="#222" strokeWidth={6} />
    <ellipse cx={-28} cy={-12} rx={20} ry={24} fill="#222" />
    <ellipse cx={28} cy={-12} rx={20} ry={24} fill="#222" />
    <path d="M 0 16 L -10 34 L 10 34 Z" fill="#222" />
    {[-24, -8, 8, 24].map((x2) => (
      <rect key={x2} x={x2 - 5} y={50} width={10} height={20} fill="#222" />
    ))}
  </g>
);

// mar con olas (para escenas sin mapa)
const Mar: React.FC<{ f: number; y: number; color: string; alto?: number; agitado?: number }> = ({ f, y, color, alto = 40, agitado = 1 }) => {
  const pts: string[] = [];
  for (let x = -20; x <= W + 20; x += 20) {
    pts.push(`${x},${y + Math.sin(x / 70 + f / 6) * alto * agitado + Math.sin(x / 31 - f / 4) * alto * 0.35 * agitado}`);
  }
  return <path d={`M -20 ${H} L ${pts.join(" L ")} L ${W + 20} ${H} Z`} fill={color} />;
};

const Llamas: React.FC<{ x: number; y: number; k: number; f: number }> = ({ x, y, k, f }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 9 }, (_, i) => {
      const h = (90 + random(`ll${i}`) * 120) * k * (0.8 + 0.25 * Math.sin(f / 2 + i));
      const dx = -110 + i * 28;
      return (
        <g key={i}>
          <path d={`M ${dx - 24} 0 Q ${dx - 10} ${-h * 0.6} ${dx + Math.sin(f / 3 + i) * 12} ${-h} Q ${dx + 10} ${-h * 0.6} ${dx + 24} 0 Z`} fill="#ff7a1a" opacity={0.9} />
          <path d={`M ${dx - 12} 0 Q ${dx - 4} ${-h * 0.4} ${dx} ${-h * 0.65} Q ${dx + 4} ${-h * 0.4} ${dx + 12} 0 Z`} fill="#ffd54a" />
        </g>
      );
    })}
  </g>
);

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    {children}
  </svg>
);

// contador que baja (o sube) entre dos cifras
const Cifra: React.FC<{ f: number; inicio: number; fin: number; de: number; a: number; y: number; tam: number; color?: string }> = ({ f, inicio, fin, de, a, y, tam, color = "#fff" }) => {
  const s = useAparicion(f, inicio, 10);
  if (f < inicio) return null;
  const v = Math.round(interpolate(f, [inicio, fin], [de, a], { ...clamp, easing: Easing.out(Easing.cubic) }));
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
        lineHeight: 1,
        color,
        transform: `scale(${s})`,
        textShadow: "0 10px 30px rgba(0,0,0,0.8), 0 0 4px #000",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {v}
    </div>
  );
};

const oscuroArriba = <AbsoluteFill style={{ background: "linear-gradient(rgba(3,5,14,0.75), rgba(3,5,14,0) 38%)" }} />;

// ---------- escenas ----------

const gancho = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: -40 + f * 1.1, lat: 8, zoom: interpolate(f, [0, dur], [0.95, 1.08]), y: 1370 };
  const t = interpolate(f, [0, dur], [0, 1], clamp);
  const golpe = interpolate(f, [en("18"), en("18") + 10], [1.3, 1], clamp);
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f}>{(_, trazo) => <Ruta trazo={trazo} ruta={VUELTA_ENTERA} t={t} />}</Globo>
      <Rotulo f={f} inicio={0} texto="SALIERON" y={250} tam={92} color="#fff" />
      <Cifra f={f} inicio={en("239")} fin={en("239") + 18} de={0} a={239} y={350} tam={230} color={ORO} />
      <Rotulo f={f} inicio={en("Volvieron")} texto="VOLVIERON" y={620} tam={92} color="#fff" />
      {f >= en("18") && (
        <div style={{ position: "absolute", top: 720, left: 0, right: 0, transform: `scale(${golpe})` }}>
          <Cifra f={f} inicio={en("18")} fin={en("18") + 1} de={18} a={18} y={0} tam={260} color={ROJO} />
        </div>
      )}
    </AbsoluteFill>
  );
};

const zarpan = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = mezclar({ lon: -25, lat: 20, zoom: 1, y: 1050 }, { lon: -6.4, lat: 37.2, zoom: 7, y: 1050 }, interpolate(f, [0, en("Sanlúcar") + 6], [0, 1], { ...clamp, easing: suave }));
  const salir = interpolate(f, [en("zarparon"), dur], [0, 1], clamp);
  const s = useAparicion(f, en("Magallanes"), 11);
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f}>
        {() => (
          <>
            <MarcadorG f={f} inicio={en("Sanlúcar")} cam={cam} ll={L.sanlucar} />
            {[0, 1, 2, 3, 4].map((i) => {
              const ap = interpolate(f, [en("cinco") + i * 3, en("cinco") + i * 3 + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
              if (ap <= 0) return null;
              return <Barco key={i} x={600 + (i % 3) * 170 - salir * 140 + (i > 2 ? 85 : 0)} y={1330 + Math.floor(i / 3) * 150 + salir * 40} escala={0.55 * ap} f={f} fase={i * 9} />;
            })}
            {f >= en("Magallanes") && <Retrato x={250} y={1290} s={0.8 * s} quien="magallanes" nombre="MAGALLANES" />}
          </>
        )}
      </Globo>
      {oscuroArriba}
      <EtiquetaG f={f} inicio={en("Sanlúcar")} cam={cam} ll={L.sanlucar} texto="SANLÚCAR" dy={-80} dx={60} />
      <Calendario f={f} mes="SEPT." dia="20" anio="1519" inicio={en("1519")} />
      <Chip f={f} inicio={en("naves")} x={790} y={1250} texto="5 NAVES" fondo={ORO} color="#13204a" tam={54} />
    </AbsoluteFill>
  );
};

const especias = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const k = interpolate(f, [0, en("clavo") + 4], [0, 1], { ...clamp, easing: suave });
  const ruta = [...IDA_ATLANTICO, L.entrada, L.salida, ...SIN_PRIMERO(PACIFICO), ...SIN_PRIMERO(A_MOLUCAS)];
  const punta = puntoEnRuta(ruta, k);
  const cam: CamaraGlobo = { lon: punta[0], lat: punta[1] * 0.4, zoom: 1.05, y: 1080 };
  const balanza = useAparicion(f, en("clavo"), 12);
  const inclina = interpolate(f, [en("valía"), en("fortuna") + 6], [-14, 0], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f}>
        {(_, trazo) => (
          <>
            <Ruta trazo={trazo} ruta={ruta} t={k} punteada grosor={12} color="#fff" />
            <MarcadorG f={f} inicio={en("especias")} cam={cam} ll={L.tidore} color={ROJO} />
            <MarcadorG f={f} inicio={0} cam={cam} ll={L.sanlucar} />
          </>
        )}
      </Globo>
      {oscuroArriba}
      {f < en("clavo") && <EtiquetaG f={f} inicio={en("especias")} cam={cam} ll={L.tidore} texto="ISLAS DE LAS ESPECIAS" dy={-90} color="#7a1010" tam={42} />}
      {f < en("clavo") && <Chip f={f} inicio={en("oeste")} x={540} y={560} texto="← HACIA EL OESTE" fondo="#fff" color="#13204a" tam={56} />}
      {f >= en("clavo") && (
        <AbsoluteFill style={{ background: `rgba(5,8,20,${0.72 * balanza})` }}>
          <Svg>
            <g transform={`translate(540 1060) scale(${balanza})`}>
              <rect x={-10} y={-160} width={20} height={330} fill="#c9a227" />
              <rect x={-120} y={160} width={240} height={30} rx={10} fill="#8a6c14" />
              <g transform={`rotate(${inclina})`}>
                <rect x={-330} y={-175} width={660} height={18} rx={9} fill={ORO} />
                <path d="M -300 -165 L -380 0 M -300 -165 L -220 0" stroke="#b8941f" strokeWidth={5} />
                <path d="M 300 -165 L 220 0 M 300 -165 L 380 0" stroke="#b8941f" strokeWidth={5} />
                <path d="M -400 0 Q -300 60 -200 0 Z" fill="#b8941f" />
                <path d="M 200 0 Q 300 60 400 0 Z" fill="#b8941f" />
                <g transform={`rotate(${-inclina})`}>
                  <Saco x={-300} y={-58} s={0.9} />
                </g>
                <g transform={`translate(300 -14) rotate(${-inclina})`}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <ellipse key={i} cx={-60 + (i % 4) * 40} cy={-Math.floor(i / 4) * 26} rx={30} ry={12} fill="#ffd54a" stroke="#a07800" strokeWidth={4} />
                  ))}
                </g>
              </g>
            </g>
          </Svg>
          <Rotulo f={f} inicio={en("fortuna")} texto={"VALÍA\nUNA FORTUNA"} y={1330} tam={92} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const atlantico = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const t = interpolate(f, [0, dur], [0.02, 0.98], clamp);
  const ll = puntoEnRuta(IDA_ATLANTICO, t);
  const cam: CamaraGlobo = { lon: ll[0] - 4, lat: ll[1], zoom: 2.6, y: 1000 };
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} estrellas={false}>
        {(_, trazo) => (
          <>
            <Ruta trazo={trazo} ruta={IDA_ATLANTICO} t={t} />
            <BarcoG cam={cam} ruta={IDA_ATLANTICO} t={t} f={f} escala={0.75} />
          </>
        )}
      </Globo>
      {oscuroArriba}
      <EtiquetaG f={f} inicio={en("Atlántico")} cam={cam} ll={[-30, 12]} texto="OCÉANO ATLÁNTICO" dy={0} tam={44} />
      <EtiquetaG f={f} inicio={en("Sudamérica")} cam={cam} ll={[-58, -20]} texto="SUDAMÉRICA" dy={0} color="#2e5d1a" tam={50} />
      <Chip f={f} inicio={en("paso")} x={540} y={600} texto="¿HAY UN PASO?" fondo={ORO} color="#13204a" tam={64} />
    </AbsoluteFill>
  );
};

const motin = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = mezclar({ lon: -64, lat: -42, zoom: 3, y: 1050 }, { lon: -67.7, lat: -49.3, zoom: 9, y: 1050 }, interpolate(f, [0, en("motín") + 6], [0, 1], { ...clamp, easing: suave }));
  const rojo = f >= en("motín") ? 0.25 + 0.15 * Math.sin(f / 3) : 0;
  const espadas = useAparicion(f, en("motín"), 8);
  const tiembla = f >= en("motín") && f < en("motín") + 12 ? Math.sin(f * 3) * 8 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${tiembla}px)` }}>
      <Globo camara={cam} f={f} estrellas={false}>
        {() => <MarcadorG f={f} inicio={en("Patagonia")} cam={cam} ll={L.sanJulian} color={ROJO} />}
      </Globo>
      <AbsoluteFill style={{ background: `rgba(160,0,0,${rojo})` }} />
      {oscuroArriba}
      <EtiquetaG f={f} inicio={en("Patagonia")} cam={cam} ll={L.sanJulian} texto="PATAGONIA" dy={110} />
      <Svg>{f >= en("motín") && <Espadas x={540} y={600} s={1.1 * espadas} />}</Svg>
      <Sello f={f} inicio={en("motín")} x={540} y={840} texto="¡MOTÍN!" tam={110} />
      <Chip f={f} inicio={en("aplastó")} x={700} y={1350} texto="SIN PIEDAD" fondo="#111" color={ROJO} tam={64} />
    </AbsoluteFill>
  );
};

const naufragio = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const rayo = (f >= en("tormenta") && f < en("tormenta") + 3) || (f >= en("tormenta") + 6 && f < en("tormenta") + 8);
  const hunde = interpolate(f, [en("naufragó"), en("naufragó") + 70], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(#0b0f1c, #23324a 60%, #0d1626)" }} />
      <Svg>
        {/* lluvia */}
        {Array.from({ length: 70 }, (_, i) => {
          const x = (random(`lx${i}`) * 1300 + f * 6) % 1300 - 100;
          const y = (random(`ly${i}`) * H + f * 38) % H;
          return <path key={i} d={`M ${x} ${y} l -14 44`} stroke="rgba(190,210,255,0.5)" strokeWidth={3} />;
        })}
        {rayo && <path d="M 760 0 L 700 260 L 760 260 L 660 560" stroke="#fff" strokeWidth={14} fill="none" />}
        <Mar f={f} y={1180} color="#1a2c46" alto={50} agitado={1.6} />
        <g transform={`translate(560 ${1170 + hunde * 260}) rotate(${hunde * 38})`} opacity={1 - hunde * 0.6}>
          <Barco x={0} y={0} escala={1.4} f={f * 2.5} nombre="SANTIAGO" />
        </g>
        <Mar f={f + 20} y={1270} color="#13233a" alto={45} agitado={1.4} />
      </Svg>
      {rayo && <AbsoluteFill style={{ background: "rgba(255,255,255,0.55)" }} />}
      <Sello f={f} inicio={en("naufragó")} x={540} y={620} texto="NAUFRAGIO" tam={90} giro={-8} />
      <Flota f={f} quedan={5} bajas={[en("cuatro")]} y={1560} inicio={en("tormenta")} />
    </AbsoluteFill>
  );
};

const estrecho = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = mezclar({ lon: -66, lat: -48, zoom: 3, y: 1000 }, { lon: -71, lat: -53.2, zoom: 13, y: 1000 }, interpolate(f, [0, en("estrecho") + 8], [0, 1], { ...clamp, easing: suave }));
  const t = interpolate(f, [en("estrecho"), en("nombre") + 10], [0, 1], clamp);
  const huye = interpolate(f, [en("desertó"), dur], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} estrellas={false}>
        {(_, trazo) => (
          <>
            <Ruta trazo={trazo} ruta={ESTRECHO} t={t} />
            <BarcoG cam={cam} ruta={ESTRECHO} t={Math.max(0.02, t)} f={f} escala={0.6} />
            {f >= en("desertó") && (
              <g opacity={1 - huye * 0.3}>
                <Barco x={(aPantalla(cam, L.entrada)?.[0] ?? 900) + huye * 500} y={(aPantalla(cam, L.entrada)?.[1] ?? 900) - 40 - huye * 120} escala={0.6} f={f} nombre="SAN ANTONIO" haciaEste />
              </g>
            )}
          </>
        )}
      </Globo>
      {oscuroArriba}
      <Rotulo f={f} inicio={en("estrecho")} texto={"ESTRECHO DE\nMAGALLANES"} y={430} tam={96} />
      {f >= en("desertó") && <Chip f={f} inicio={en("desertó")} x={540} y={1290} texto="↩ VUELVE A ESPAÑA" fondo={ROJO} color="#fff" tam={56} />}
      <Flota f={f} quedan={4} bajas={[en("desertó") + 4]} y={1520} inicio={en("pero")} />
    </AbsoluteFill>
  );
};

const pacifico = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const x = interpolate(f, [0, dur], [900, 380]);
  const sol = interpolate(f, [0, dur], [880, 920]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(#1d2a6b 0%, #c2508a 42%, #ffb36b 58%, #ffd59a 62%)" }} />
      <Svg>
        <circle cx={540} cy={sol} r={150} fill="#ffe7a8" opacity={0.95} />
        <rect x={0} y={1020} width={W} height={H - 1020} fill="#2a4c8f" />
        {/* reflejo del sol sobre el agua quieta */}
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={540 - (140 - i * 8) + Math.sin(f / 10 + i) * 10} y={1040 + i * 34} width={(140 - i * 8) * 2} height={8} rx={4} fill="#ffd59a" opacity={0.65 - i * 0.04} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <path key={`o${i}`} d={`M ${(i * 137 + f * 0.6) % 1200 - 60} ${1120 + i * 70} q 30 -6 60 0`} stroke="rgba(255,255,255,0.35)" strokeWidth={4} fill="none" />
        ))}
        <Barco x={x} y={1010} escala={0.9} f={f * 0.5} />
      </Svg>
      <Chip f={f} inicio={en("tranquilo")} x={540} y={560} texto="MAR EN CALMA" fondo="#fff" color="#1d2a6b" tam={56} />
      <Rotulo f={f} inicio={en("Pacífico")} texto="PACÍFICO" y={1300} tam={170} color="#fff" />
    </AbsoluteFill>
  );
};

const inmenso = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const t = interpolate(f, [0, dur], [0.03, 0.85], clamp);
  const ll = puntoEnRuta(PACIFICO, t);
  const cam: CamaraGlobo = { lon: ll[0], lat: -2, zoom: interpolate(f, [0, en("inmenso") + 10], [1.6, 1.15], { ...clamp, easing: suave }), y: 1050 };
  const dia = Math.round(interpolate(f, [0, dur], [1, 98], clamp));
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f}>
        {(_, trazo) => (
          <>
            <Ruta trazo={trazo} ruta={PACIFICO} t={t} />
            <BarcoG cam={cam} ruta={PACIFICO} t={t} f={f} escala={0.55} />
          </>
        )}
      </Globo>
      {oscuroArriba}
      <Rotulo f={f} inicio={en("inmenso")} texto="INMENSO" y={420} tam={130} color="#fff" />
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 1520,
          background: "rgba(8,14,32,0.85)",
          border: `4px solid ${ORO}`,
          borderRadius: 24,
          padding: "10px 30px",
          fontFamily: SANS,
          fontWeight: 900,
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 34, letterSpacing: 4, opacity: 0.8 }}>DÍA</div>
        <div style={{ fontSize: 100, color: ORO, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{dia}</div>
      </div>
      <Chip f={f} inicio={en("meses")} x={540} y={620} texto="+3 MESES SIN COMIDA FRESCA" fondo={ROJO} color="#fff" tam={48} />
    </AbsoluteFill>
  );
};

const hambre = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const enfermo = interpolate(f, [en("escorbuto"), en("escorbuto") + 12], [0, 1], clamp);
  const pop = (w: string) => interpolate(f, [en(w), en(w) + 9], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
  return (
    <AbsoluteFill>
      {/* cubierta de madera */}
      <Svg>
        <rect width={W} height={H} fill="#5a3a1e" />
        {Array.from({ length: 14 }, (_, i) => (
          <g key={i}>
            <rect x={0} y={i * 140} width={W} height={136} fill={i % 2 ? "#6b4524" : "#61401f"} />
            <circle cx={(i * 211) % W} cy={i * 140 + 68} r={6} fill="#3a2410" />
          </g>
        ))}
      </Svg>
      <Viñeta />
      <Svg>
        <Cuero x={300} y={700} s={1.3 * pop("cuero")} />
        <Serrin x={790} y={760} s={1.3 * pop("serrín")} />
        <Rata x={560 + Math.sin(f / 5) * 20} y={1080} s={1.4 * pop("ratas")} f={f} />
      </Svg>
      <Chip f={f} inicio={en("cuero")} x={300} y={860} texto="CUERO" fondo="#fff" color="#4a2a10" tam={50} />
      <Chip f={f} inicio={en("serrín")} x={790} y={880} texto="SERRÍN" fondo="#fff" color="#4a2a10" tam={50} />
      <Chip f={f} inicio={en("ratas")} x={600} y={1230} texto="¡RATAS!" fondo={ROJO} color="#fff" tam={56} />
      {f >= en("escorbuto") && (
        <AbsoluteFill style={{ background: `rgba(40,70,20,${0.55 * enfermo})` }}>
          <Svg>
            <Calavera x={540} y={900} s={1.8 * enfermo} />
          </Svg>
          <Sello f={f} inicio={en("escorbuto")} x={540} y={1200} texto="ESCORBUTO" tam={96} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const mactan = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = mezclar({ lon: 135, lat: 12, zoom: 2.2, y: 1100 }, { lon: 123.8, lat: 10.4, zoom: 9, y: 1100 }, interpolate(f, [0, en("Filipinas") + 10], [0, 1], { ...clamp, easing: suave }));
  const s = useAparicion(f, en("Magallanes"), 11);
  const gris = interpolate(f, [en("murió"), en("murió") + 12], [0, 1], clamp);
  const cruz = interpolate(f, [en("murió") + 2, en("murió") + 12], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} estrellas={false}>
        {() => (
          <>
            <MarcadorG f={f} inicio={en("Filipinas")} cam={cam} ll={L.mactan} color={ROJO} />
            {f >= en("Magallanes") && <Retrato x={540} y={760} s={0.95 * s} quien="magallanes" gris={gris} nombre="MAGALLANES" />}
            {cruz > 0 && (
              <g stroke={ROJO} strokeWidth={22} strokeLinecap="round">
                <path d={`M 420 600 L ${420 + 240 * cruz} ${600 + 320 * cruz}`} />
                <path d={`M 660 600 L ${660 - 240 * cruz} ${600 + 320 * cruz}`} />
              </g>
            )}
            {f >= en("combate") && <Espadas x={830} y={1250} s={0.9 * Math.min(1, (f - en("combate")) / 8)} />}
          </>
        )}
      </Globo>
      {oscuroArriba}
      <EtiquetaG f={f} inicio={en("Filipinas")} cam={cam} ll={L.mactan} texto="MACTÁN (FILIPINAS)" dy={110} tam={42} />
      <Calendario f={f} mes="ABRIL" dia="27" anio="1521" inicio={en("Filipinas") + 4} />
      <Chip f={f} inicio={en("Lapulapu")} x={720} y={1480} texto="JEFE LAPULAPU" fondo="#0d1b2a" color={ORO} tam={52} />
    </AbsoluteFill>
  );
};

const quema = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const fuego = interpolate(f, [en("quemar"), en("quemar") + 20], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(#050814, #18122a 55%, #0a0f1e)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 58%, rgba(255,120,30,${0.45 * fuego}) 0%, rgba(0,0,0,0) 55%)` }} />
      <Svg>
        <Mar f={f} y={1180} color="#0d1830" alto={14} />
        <g transform={`translate(540 1150) scale(${1 + fuego * 0.02})`}>
          <Barco x={0} y={0} escala={1.5} f={f} nombre="CONCEPCIÓN" />
          {fuego > 0 && <Llamas x={0} y={-30} k={fuego * 1.6} f={f} />}
        </g>
        {Array.from({ length: 24 }, (_, i) => {
          const vida = ((f - en("quemar")) * 6 + i * 37) % 500;
          if (fuego <= 0) return null;
          return <circle key={i} cx={460 + random(`ch${i}`) * 160 + Math.sin(vida / 30 + i) * 30} cy={1000 - vida} r={4} fill="#ffb040" opacity={1 - vida / 500} />;
        })}
      </Svg>
      <Chip f={f} inicio={en("hombres")} x={540} y={560} texto="FALTAN HOMBRES" fondo="#fff" color="#13204a" tam={56} />
      <Flota f={f} quedan={3} bajas={[en("nave")]} y={1560} inicio={0} />
    </AbsoluteFill>
  );
};

const molucas = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = mezclar({ lon: 121, lat: 8, zoom: 3, y: 1050 }, { lon: 127.4, lat: 0.8, zoom: 9, y: 1050 }, interpolate(f, [0, en("Molucas") + 10], [0, 1], { ...clamp, easing: suave }));
  const sacos = [0, 1, 2, 3, 4].map((i) => interpolate(f, [en("bodegas") + i * 4, en("bodegas") + i * 4 + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) }));
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} estrellas={false}>
        {() => (
          <>
            <MarcadorG f={f} inicio={en("Molucas")} cam={cam} ll={L.tidore} />
            {sacos.map((s, i) => (s > 0 ? <Saco key={i} x={250 + i * 145} y={1250 - (i % 2) * 40} s={0.95 * s} /> : null))}
          </>
        )}
      </Globo>
      {oscuroArriba}
      <EtiquetaG f={f} inicio={en("Molucas")} cam={cam} ll={L.tidore} texto="MOLUCAS" dy={-90} />
      {f >= en("Trinidad") && (
        <AbsoluteFill>
          <Svg>
            <g transform={`translate(840 1050) rotate(${interpolate(f, [en("agua"), en("agua") + 20], [0, 9], clamp)})`}>
              <Barco x={0} y={0} escala={0.8} f={f} nombre="TRINIDAD" />
              {Array.from({ length: 5 }, (_, i) => {
                const caida = ((f - en("Trinidad")) * 4 + i * 22) % 80;
                return <path key={i} d={`M ${-70 + i * 32} ${10 + caida} q -8 14 0 20 q 8 -6 0 -20`} fill="#7fd3ff" opacity={1 - caida / 80} />;
              })}
            </g>
          </Svg>
          <Chip f={f} inicio={en("agua")} x={800} y={790} texto="HACE AGUA" fondo="#1565c0" color="#fff" tam={46} />
        </AbsoluteFill>
      )}
      <Flota f={f} quedan={2} bajas={[en("quedó")]} y={1560} inicio={en("Trinidad")} />
    </AbsoluteFill>
  );
};

const elcano = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const s = useAparicion(f, 0, 11);
  const barco = useAparicion(f, en("Victoria"), 10);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#24407a" a="#070b18" />
      <Svg>
        <Retrato x={540} y={720} s={1.25 * s} quien="elcano" />
        {f >= en("Victoria") && (
          <g>
            <Mar f={f} y={1500} color="#16335c" alto={16} />
            <Barco x={700} y={1470} escala={1.25 * barco} f={f} nombre="VICTORIA" haciaEste />
          </g>
        )}
      </Svg>
      <Rotulo f={f} inicio={en("Elcano")} texto={"JUAN SEBASTIÁN\nELCANO"} y={1010} tam={82} color="#fff" />
      <Chip f={f} inicio={en("última")} x={720} y={1690} texto="LA ÚLTIMA NAVE" fondo={ROJO} color="#fff" tam={52} />
    </AbsoluteFill>
  );
};

const regreso = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const t = interpolate(f, [0, dur], [0.02, 0.8], clamp);
  const ll = puntoEnRuta(REGRESO, t);
  const cam: CamaraGlobo = { lon: ll[0], lat: Math.max(-25, ll[1] * 0.7), zoom: 1.9, y: 1050 };
  const portugueses: LonLat[] = [[40, -18], [12, 2], [-16, 12], [55, -2]];
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f}>
        {(_, trazo) => (
          <>
            <Ruta trazo={trazo} ruta={REGRESO} t={t} />
            {f >= en("portugueses") &&
              portugueses.map((p, i) => {
                const q = aPantalla(cam, p);
                const s = interpolate(f, [en("portugueses") + i * 3, en("portugueses") + i * 3 + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
                if (!q) return null;
                return (
                  <g key={i} transform={`translate(${q[0]} ${q[1]}) scale(${s})`}>
                    <circle r={60} fill="rgba(229,57,53,0.35)" stroke={ROJO} strokeWidth={5} />
                    <Barco x={0} y={10} escala={0.35} f={f} fase={i * 7} />
                  </g>
                );
              })}
            <BarcoG cam={cam} ruta={REGRESO} t={t} f={f} escala={0.6} nombre="VICTORIA" />
          </>
        )}
      </Globo>
      {oscuroArriba}
      <EtiquetaG f={f} inicio={en("Índico")} cam={cam} ll={[80, -15]} texto="OCÉANO ÍNDICO" dy={0} tam={44} />
      <EtiquetaG f={f} inicio={en("África")} cam={cam} ll={[22, 2]} texto="ÁFRICA" dy={0} color="#2e5d1a" tam={52} />
      <Chip f={f} inicio={en("portugueses")} x={540} y={580} texto="¡QUE NO NOS PILLEN!" fondo={ROJO} color="#fff" tam={52} />
    </AbsoluteFill>
  );
};

const llegada = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = mezclar({ lon: -14, lat: 34, zoom: 3.5, y: 1150 }, { lon: -6.4, lat: 37, zoom: 7, y: 1150 }, interpolate(f, [0, en("Sanlúcar") + 6], [0, 1], { ...clamp, easing: suave }));
  const t = interpolate(f, [0, en("Sanlúcar")], [0.86, 1], clamp);
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} estrellas={false}>
        {(_, trazo) => (
          <>
            <Ruta trazo={trazo} ruta={REGRESO} t={t} />
            <BarcoG cam={cam} ruta={REGRESO} t={Math.min(0.995, t)} f={f} escala={0.7} nombre="VICTORIA" />
            <MarcadorG f={f} inicio={en("Sanlúcar")} cam={cam} ll={L.sanlucar} />
          </>
        )}
      </Globo>
      {oscuroArriba}
      <Calendario f={f} mes="SEPT." dia="6" anio="1522" inicio={en("6")} izquierda />
      {f >= en("quedaban") && <AbsoluteFill style={{ background: "rgba(3,5,14,0.55)" }} />}
      <Cifra f={f} inicio={en("quedaban")} fin={en("18") + 6} de={239} a={18} y={760} tam={300} color={ROJO} />
      {f >= en("18") && (
        <Svg>
          {Array.from({ length: 18 }, (_, i) => {
            const s = interpolate(f, [en("18") + i, en("18") + i + 6], [0, 1], clamp);
            const x = 200 + (i % 9) * 85;
            const y = 1180 + Math.floor(i / 9) * 150;
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                <circle cy={-40} r={22} fill="#fff" />
                <path d="M -26 60 L -26 0 Q 0 -18 26 0 L 26 60 Z" fill="#fff" />
              </g>
            );
          })}
        </Svg>
      )}
    </AbsoluteFill>
  );
};

const calendario = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: f * 6, lat: 15, zoom: 0.6, y: 1450 };
  const a = useAparicion(f, en("calendario"), 10);
  const b = useAparicion(f, en("día"), 10);
  const Hoja = ({ x, titulo, dia, s, color }: { x: number; titulo: string; dia: string; s: number; color: string }) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 560,
        width: 400,
        transform: `translateX(-50%) scale(${s}) rotate(${(1 - s) * 10}deg)`,
        background: "#fff",
        borderRadius: 26,
        overflow: "hidden",
        boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
        textAlign: "center",
        fontFamily: SANS,
      }}
    >
      <div style={{ background: color, color: "#fff", fontWeight: 900, fontSize: 36, padding: "14px 0", letterSpacing: 1 }}>{titulo}</div>
      <div style={{ fontWeight: 900, fontSize: 64, color: "#212121", padding: "34px 0" }}>{dia}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} />
      <Hoja x={290} titulo="EN EL BARCO" dia="MIÉRCOLES" s={a} color="#1565c0" />
      <Hoja x={790} titulo="EN TIERRA" dia="JUEVES" s={b} color={ROJO} />
      <Sello f={f} inicio={en("detrás")} x={540} y={1000} texto="−1 DÍA" tam={120} />
      <Chip f={f} inicio={en("extraño")} x={540} y={430} texto="¿QUÉ DÍA ES HOY?" fondo={ORO} color="#13204a" tam={52} />
    </AbsoluteFill>
  );
};

const escudo = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const s = useAparicion(f, en("escudo"), 11);
  const globo = useAparicion(f, en("globo"), 10);
  const cinta = interpolate(f, [en("lema"), en("lema") + 14], [0, 1], { ...clamp, easing: suave });
  const cam: CamaraGlobo = { lon: f * 3, lat: 10, zoom: 0.26 * globo + 0.0001, y: 560 };
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#4a1220" a="#0b0306" />
      {f >= en("globo") && <Globo camara={cam} f={f} estrellas={false} />}
      <Svg>
        <g transform={`translate(540 1000) scale(${s})`}>
          <path d="M -230 -250 L 230 -250 L 230 20 Q 230 210 0 300 Q -230 210 -230 20 Z" fill="#b8860b" stroke="#6b4e00" strokeWidth={10} />
          <path d="M -200 -220 L 200 -220 L 200 20 Q 200 180 0 262 Q -200 180 -200 20 Z" fill="#8e1b25" />
          <path d="M 0 -220 L 0 262 M -200 0 L 200 0" stroke={ORO} strokeWidth={12} />
          {[[-100, -110], [100, 120], [100, -110], [-100, 120]].map(([x, y], i) =>
            i % 2 === 0 ? <circle key={i} cx={x} cy={y} r={40} fill={ORO} /> : <path key={i} d={`M ${x - 40} ${y + 30} L ${x} ${y - 40} L ${x + 40} ${y + 30} Z`} fill={ORO} />,
          )}
        </g>
        {f >= en("escudo") && <Corona x={540} y={720} s={1.3 * s} />}
        {cinta > 0 && (
          <g transform="translate(540 1380)">
            <path
              d={`M ${-440 * cinta} -50 L ${440 * cinta} -50 L ${470 * cinta} 0 L ${440 * cinta} 50 L ${-440 * cinta} 50 L ${-470 * cinta} 0 Z`}
              fill="#f4ecd6"
              stroke="#8a6420"
              strokeWidth={6}
            />
            <text x={0} y={16} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={50} fill="#5b1015" opacity={cinta} letterSpacing={2}>
              PRIMUS CIRCUMDEDISTI ME
            </text>
          </g>
        )}
      </Svg>
      <Rotulo f={f} inicio={en("primero")} texto={"«EL PRIMERO QUE\nME RODEASTE»"} y={1480} tam={70} color="#fff" />
    </AbsoluteFill>
  );
};

const final = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: -60 + f * 1.4, lat: 0, zoom: 0.95, y: 1380 };
  const t = interpolate(f, [0, 30], [0, 1], clamp);
  const a = useAparicion(f, en("Magallanes"), 10);
  const b = useAparicion(f, en("Elcano"), 10);
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f}>
        {(_, trazo) => (
          <>
            <Ruta trazo={trazo} ruta={VUELTA_ENTERA} t={t} />
            {f >= en("Magallanes") && <Retrato x={290} y={720} s={0.85 * a} quien="magallanes" nombre="MAGALLANES" />}
            {f >= en("Elcano") && <Retrato x={790} y={720} s={0.85 * b} quien="elcano" nombre="ELCANO" />}
          </>
        )}
      </Globo>
      <Rotulo f={f} inicio={0} texto={"¿QUIÉN MERECE\nLA GLORIA?"} y={230} tam={92} color="#fff" />
      <Rotulo f={f} inicio={en("Elcano")} texto="VS" y={660} tam={110} />
      <Chip f={f} inicio={en("Escríbelo")} x={540} y={1100} texto="ESCRÍBELO EN COMENTARIOS 👇" fondo={ORO} color="#13204a" tam={48} />
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, (e: Escenario) => Dibujo> = {
  gancho,
  zarpan,
  especias,
  atlantico,
  motin,
  naufragio,
  estrecho,
  pacifico,
  inmenso,
  hambre,
  mactan,
  quema,
  molucas,
  elcano,
  regreso,
  llegada,
  calendario,
  escudo,
  final,
};

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>) =>
  Object.fromEntries(Object.entries(FABRICAS).map(([k, fab]) => [k, fab(esc[k as Ilustracion])])) as Record<Ilustracion, Dibujo>;
