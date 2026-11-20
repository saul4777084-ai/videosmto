import React, { useId } from "react";
import { interpolate, spring } from "remotion";
import { geoPath } from "d3-geo";
import { LonLat } from "./Globo";
import { aPantallaT, CamaraT, paisGeo } from "./Tierra";
import { TIERRA_50 } from "./PiezasTierra";
import { Sello as SelloNapoleon } from "../Napoleon/Ilustraciones";

// Piezas con el aspecto de los vídeos de Napoleón, Colón y Vuelta al mundo, con las MISMAS propiedades que
// src/comun/PiezasTierra.tsx (se cambia el import y listo). Para usar sobre <Tierra estilo="dibujo">.
//  · dentro del children de Tierra (SVG): Ciudad, Rotulo, Zona, Paises, FlechaG, LineaG
//  · fuera (HTML): Caja, Titular, Linea, Sello, Creditos

export { FlechaG, LineaG, Creditos } from "./PiezasTierra";
export type { Capa } from "./PiezasTierra";

type Trazo = ReturnType<typeof geoPath>;
export const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
export const SERIF = "Georgia, 'Times New Roman', serif";
export const AMARILLO = "#f2c230"; // dorado de Napoleón
export const NARANJA = "198,40,40"; // relleno del imperio (r,g,b): rojo
export const VERDE = "46,125,50";
export const ROJO = "198,40,40";
export const AZUL = "37,99,235";
const MARINO = "#0d1b2a";

const aparece = (f: number, inicio: number, damping = 11) => spring({ frame: f - inicio, fps: 30, config: { damping } });
const limpio = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");

// caja azul marino con borde blanco y texto en mayúsculas (la "Etiqueta" de Colón/Napoleón), en SVG
const CajaSVG: React.FC<{ x: number; y: number; texto: string; tam: number; fondo?: string; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  texto,
  tam,
  fondo = MARINO,
  anchor = "middle",
}) => {
  const ancho = texto.length * tam * 0.66 + tam * 1.1;
  const alto = tam * 1.55;
  const x0 = anchor === "middle" ? x - ancho / 2 : anchor === "start" ? x : x - ancho;
  return (
    <g style={{ filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.45))" }}>
      <rect x={x0} y={y - alto / 2} width={ancho} height={alto} rx={tam * 0.36} fill={fondo} stroke="rgba(255,255,255,0.88)" strokeWidth={3} />
      <text x={x0 + ancho / 2} y={y + tam * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={tam} letterSpacing={1} fill="#fff">
        {texto}
      </text>
    </g>
  );
};

// ---------- ciudad: punto que late (dorado; rojo si se hunde, verde si se salva) y etiqueta azul marino ----------

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
}> = ({ cam, ll, nombre, f, inicio, lado = "der", hundida, salvada, nota, tam = 34 }) => {
  const p = aPantallaT(cam, ll);
  if (!p || f < inicio) return null;
  const s = aparece(f, inicio, 10);
  const hund = hundida !== undefined && f >= hundida;
  const salv = salvada !== undefined && f >= salvada;
  const c = hund ? "#e53935" : salv ? "#43a047" : AMARILLO;
  const fondo = hund ? "#b71c1c" : salv ? "#1b5e20" : MARINO;
  const onda = ((f - inicio) % 30) / 30;
  const texto = nombre.toUpperCase() + (hund ? " ✕" : salv ? " ✓" : "");
  const dx = lado === "der" ? 30 : -30;
  return (
    <g transform={`translate(${p[0]} ${p[1]})`}>
      <circle r={16 + onda * 46} fill="none" stroke={c} strokeWidth={5} opacity={1 - onda} />
      <circle r={16 * s} fill={c} stroke="#fff" strokeWidth={5} />
      <g transform={`scale(${s})`}>
        <CajaSVG x={dx} y={0} texto={texto} tam={tam} fondo={fondo} anchor={lado === "der" ? "start" : "end"} />
        {nota && (
          <text x={dx + (lado === "der" ? 8 : -8)} y={tam * 2.0} textAnchor={lado === "der" ? "start" : "end"} fontFamily={SANS} fontWeight={900} fontSize={tam * 0.85} fill={c} stroke="rgba(0,0,0,0.7)" strokeWidth={6} paintOrder="stroke">
            {nota}
          </text>
        )}
      </g>
    </g>
  );
};

// ---------- rótulo de región: caja azul marino ("OCÉANO ATLÁNTICO") ----------

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
  salida?: number;
}> = ({ cam, ll, texto, f, inicio, tam = 74, dy = 0, salida }) => {
  const p = aPantallaT(cam, ll);
  if (!p || f < inicio) return null;
  const s = aparece(f, inicio, 11);
  const fuera = salida !== undefined ? interpolate(f, [salida, salida + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const t = Math.max(32, Math.min(50, tam * 0.56));
  return (
    <g transform={`translate(${p[0]} ${p[1] + dy}) scale(${s})`} opacity={fuera}>
      <CajaSVG x={0} y={0} texto={texto.toUpperCase()} tam={t} />
    </g>
  );
};

// ---------- territorios y países: color liso con borde oscuro (como el imperio de Napoleón) ----------

const Liso: React.FC<{ d: string; color: string; opacidad?: number }> = ({ d, color, opacidad = 1 }) => (
  <g opacity={opacidad}>
    <path d={d} fill={`rgba(${color},0.62)`} />
    <path d={d} fill="none" stroke={`rgba(${color},1)`} strokeWidth={5} strokeLinejoin="round" opacity={0.9} />
    <path d={d} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={1.6} strokeLinejoin="round" />
  </g>
);

export const Zona: React.FC<{ trazo: Trazo; cam: CamaraT; capas: { poligono: LonLat[]; color: string; revelar?: number; desde?: LonLat; opacidad?: number }[] }> = ({
  trazo,
  cam,
  capas,
}) => {
  const id = limpio(useId());
  const costa = trazo(TIERRA_50) ?? "";
  return (
    <>
      <defs>
        <clipPath id={`nt${id}`}>
          <path d={costa} />
        </clipPath>
        {capas.map((c, i) => {
          if (c.revelar === undefined || c.revelar >= 1) return null;
          const p = c.desde ? aPantallaT(cam, c.desde) : null;
          const [x, y] = p ?? [540, 960];
          return (
            <clipPath key={i} id={`nr${id}${i}`}>
              <circle cx={x} cy={y} r={Math.max(0.1, c.revelar) * 2600} />
            </clipPath>
          );
        })}
      </defs>
      {capas.map((c, i) => {
        if ((c.revelar ?? 1) <= 0 || (c.opacidad ?? 1) <= 0) return null;
        const d = trazo({ type: "Polygon", coordinates: [c.poligono] }) ?? "";
        const clip = c.revelar !== undefined && c.revelar < 1 ? `url(#nr${id}${i})` : undefined;
        return (
          <g key={i} clipPath={clip}>
            <g clipPath={`url(#nt${id})`}>
              <Liso d={d} color={c.color} opacidad={c.opacidad} />
            </g>
          </g>
        );
      })}
    </>
  );
};

export const Paises: React.FC<{ trazo: Trazo; nombres: string[]; color: string; f: number; inicio: number }> = ({ trazo, nombres, color, f, inicio }) => {
  if (f < inicio) return null;
  const k = interpolate(f, [inicio, inicio + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      {nombres.map((n) => {
        const g = paisGeo(n);
        return g ? <Liso key={n} d={trazo(g) ?? ""} color={color} opacidad={k} /> : null;
      })}
    </>
  );
};

// ---------- textos en pantalla (HTML) ----------

// chip redondeado ("EQUIPO LIGERO", "PRUSIA DERROTADA"); azul marino con borde blanco por defecto
export const Caja: React.FC<{ f: number; inicio: number; texto: string; y: number; fondo?: string; color?: string; tam?: number; giro?: number; x?: number }> = ({
  f,
  inicio,
  texto,
  y,
  fondo,
  color = "#fff",
  tam = 44,
  giro = 0,
  x = 540,
}) => {
  if (f < inicio) return null;
  const s = aparece(f, inicio, 10);
  const bg = !fondo || fondo.startsWith("rgba(14") ? MARINO : fondo;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${giro}deg) scale(${s})`,
        background: bg,
        color,
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: tam,
        letterSpacing: 1,
        padding: `${tam * 0.24}px ${tam * 0.62}px`,
        borderRadius: 999,
        border: bg === MARINO ? "3px solid rgba(255,255,255,0.85)" : undefined,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
      }}
    >
      {texto}
    </div>
  );
};

// titular dorado con letra serif ("1812", "REVOLUCIÓN FRANCESA")
export const Titular: React.FC<{ f: number; inicio: number; texto: string; y: number; tam?: number; color?: string; brillo?: string }> = ({
  f,
  inicio,
  texto,
  y,
  tam = 110,
  color = AMARILLO,
}) => {
  if (f < inicio) return null;
  const s = aparece(f, inicio, 9);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 30,
        right: 30,
        textAlign: "center",
        fontFamily: SERIF,
        fontWeight: 900,
        fontSize: tam,
        lineHeight: 1.05,
        color: color === "#8cc8ff" ? "#9fd0ff" : color,
        letterSpacing: 3,
        opacity: Math.min(1, s * 1.5),
        transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`,
        textShadow: "0 10px 30px rgba(0,0,0,0.75), 0 0 4px #000",
        whiteSpace: "pre-line",
      }}
    >
      {texto}
    </div>
  );
};

// texto blanco serif en mayúsculas
export const Linea: React.FC<{ f: number; inicio: number; texto: string; y: number; tam?: number; color?: string }> = ({ f, inicio, texto, y, tam = 52, color = "#fff" }) => {
  if (f < inicio) return null;
  const s = aparece(f, inicio, 11);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 30,
        right: 30,
        textAlign: "center",
        fontFamily: SERIF,
        fontWeight: 900,
        fontSize: tam,
        color,
        letterSpacing: 2,
        textTransform: "uppercase",
        opacity: Math.min(1, s * 1.5),
        transform: `translateY(${(1 - s) * 18}px)`,
        textShadow: "0 8px 24px rgba(0,0,0,0.8), 0 0 4px #000",
        whiteSpace: "pre-line",
      }}
    >
      {texto}
    </div>
  );
};

// sello de Napoleón (fondo claro, borde de color)
export const Sello: React.FC<{ f: number; inicio: number; texto: string; x: number; y: number; tam?: number; giro?: number; color?: string }> = ({
  f,
  inicio,
  texto,
  x,
  y,
  tam = 70,
  giro = -12,
  color = "#e53935",
}) => <SelloNapoleon f={f} inicio={inicio} x={x} y={y} texto={texto.toUpperCase()} tam={tam} giro={giro} color={color === "#22c55e" ? "#2e7d32" : color} />;
