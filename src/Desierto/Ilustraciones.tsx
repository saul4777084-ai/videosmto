// Versión «cine»: planos a pantalla completa, cámara siempre en movimiento (empuje, paneo, paralaje),
// calima real (distorsión), viñeta y grano, y la información dentro de la escena (reloj, móvil, salpicadero, HUD).
// Todo 2D. Cada elemento entra en la palabra que lo nombra (en("palabra")).
// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1420) y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, random } from "remotion";
import { aPantalla, CamaraGlobo, mezclar, Ruta } from "../comun/Globo";
import { Accion2D, Cara, Personaje2D } from "../comun/Personaje2D";
import { Tierra } from "../comun/Tierra";
import { Dibujo } from "../comun/tipos";
import { AMARILLO, clamp, Cuenta, H, muelle, ROJO, Rotulo, SANS, Sello, tramo, VERDE, W } from "../Frio/Piezas";
import type { Escenario, Ilustracion } from "./escenas";

type Fabrica = (e: Escenario) => Dibujo;
const NARANJA = "#ff8a2b";
const PIEL = "#e8a77e";

// ---------- cámara ----------
export type Cam = { z: number; x: number; y: number; r?: number };
export const suave = Easing.inOut(Easing.cubic);
export const mover = (f: number, a: number, b: number, de: Cam, hasta: Cam): Cam => {
  const k = interpolate(f, [a, Math.max(b, a + 1)], [0, 1], { ...clamp, easing: suave });
  return { z: de.z + (hasta.z - de.z) * k, x: de.x + (hasta.x - de.x) * k, y: de.y + (hasta.y - de.y) * k, r: (de.r ?? 0) + ((hasta.r ?? 0) - (de.r ?? 0)) * k };
};
// capa con paralaje: prof 0 = fija, 1 = sigue a la cámara, >1 = primer plano (se mueve más)
export const Plano: React.FC<{ cam: Cam; prof?: number; filtro?: string; children: React.ReactNode }> = ({ cam, prof = 1, filtro, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `translate(${cam.x * prof}px, ${cam.y * prof}px) scale(${1 + (cam.z - 1) * prof}) rotate(${(cam.r ?? 0) * prof}deg)`,
      filter: filtro,
    }}
  >
    {children}
  </div>
);
export const temblor = (f: number, fuerza: number) => ({ x: Math.sin(f * 2.7) * 9 * fuerza + Math.sin(f * 5.1) * 4 * fuerza, y: Math.cos(f * 3.3) * 7 * fuerza });

// ---------- acabado de cine: viñeta, grano y calima ----------
export const Cine: React.FC<{ f: number; vineta?: number; tinte?: string }> = ({ f, vineta = 0.7, tinte }) => (
  <>
    {tinte && <AbsoluteFill style={{ background: tinte, mixBlendMode: "soft-light" }} />}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vineta}) 100%)` }} />
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "overlay" }}>
      <filter id={`grano${Math.floor(f / 2) % 7}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 7} />
      </filter>
      <rect width={W} height={H} filter={`url(#grano${Math.floor(f / 2) % 7})`} />
    </svg>
  </>
);
// distorsión por calor: aplica filter: url(#id) a una capa
export const Calima: React.FC<{ id: string; f: number; fuerza: number }> = ({ id, f, fuerza }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="turbulence" baseFrequency="0.006 0.045" numOctaves={2} seed={Math.floor(f / 3) % 40} />
      <feDisplacementMap in="SourceGraphic" scale={fuerza} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

// ---------- paisaje: cielo, sol, dunas, calima y arena ----------
export const Paisaje: React.FC<{ f: number; noche?: number; sol?: [number, number]; horizonte?: number; tormenta?: number; dunas?: string[] }> = ({ f, noche = 0, sol = [800, 760], horizonte = 1250, tormenta = 0, dunas }) => {
  const arriba = interpolateColors(noche, [0, 0.5, 1], ["#2f7fd0", "#d4553a", "#050a24"]);
  const medio = interpolateColors(noche, [0, 0.5, 1], ["#9fd0f0", "#ff9a55", "#1a2050"]);
  const abajo = interpolateColors(noche, [0, 0.5, 1], ["#fff0c8", "#ffd08a", "#2a2f5e"]);
  const tonos = dunas ?? ["#eab066", "#dc9447", "#c97b34", "#a8612a"];
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(${arriba} 0%, ${medio} 45%, ${abajo} ${(horizonte / H) * 100}%)` }} />
      {noche > 0.55 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(noche, 0.55, 1) }}>
          <ellipse cx={600} cy={500} rx={700} ry={140} fill="#8fa8ff" opacity={0.08} transform="rotate(-25 600 500)" />
          {Array.from({ length: 110 }, (_, i) => (
            <circle key={i} cx={random(`sx${i}`) * W} cy={random(`sy${i}`) * horizonte} r={0.8 + random(`sr${i}`) * 2.6} fill="#fff" opacity={0.35 + 0.55 * Math.abs(Math.sin(f / 10 + i))} />
          ))}
          <circle cx={250} cy={640} r={70} fill="#fff7dc" />
          <circle cx={250} cy={640} r={150} fill="#fff7dc" opacity={0.08} />
        </svg>
      )}
      {noche < 0.65 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - tramo(noche, 0.35, 0.65) }}>
          <defs>
            <radialGradient id="resplandor">
              <stop offset="0" stopColor="#fffbe6" stopOpacity={1} />
              <stop offset="0.18" stopColor="#fff2b0" stopOpacity={0.9} />
              <stop offset="0.45" stopColor="#ffd77a" stopOpacity={0.25} />
              <stop offset="1" stopColor="#ffd77a" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={sol[0]} cy={sol[1]} r={520 + Math.sin(f / 9) * 20} fill="url(#resplandor)" />
          <circle cx={sol[0]} cy={sol[1]} r={95} fill="#fffdf2" />
        </svg>
      )}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {tonos.map((color, k) => {
          const y0 = horizonte + k * 150 - 20;
          const fr = 0.005 - k * 0.0008;
          const amp = 40 + k * 25;
          let d = `M -40 ${H} L -40 ${y0}`;
          for (let x = -40; x <= W + 40; x += 30) d += ` L ${x} ${y0 + Math.sin(x * fr + k * 2.1) * amp + Math.sin(x * fr * 2.7 + k) * amp * 0.25}`;
          d += ` L ${W + 40} ${H} Z`;
          return <path key={k} d={d} fill={interpolateColors(noche, [0, 0.5, 1], [color, ["#c86a3a", "#b05a30", "#93492a", "#7a3b24"][k], ["#2c2a52", "#24224a", "#1c1a3e", "#151332"][k]])} />;
        })}
        {Array.from({ length: 24 + Math.round(tormenta * 140) }, (_, i) => {
          const v = 2 + random(`av${i}`) * 4 + tormenta * 26;
          const x = ((random(`ax${i}`) * W + f * v) % (W + 40)) - 20;
          const y = horizonte - 300 + random(`ay${i}`) * (H - horizonte + 300) + Math.sin(f / 10 + i) * 10;
          return <circle key={i} cx={x} cy={y} r={1.5 + random(`ar${i}`) * 3} fill="#fff1d0" opacity={0.3} />;
        })}
      </svg>
      {tormenta > 0 && <AbsoluteFill style={{ background: `rgba(190,110,50,${0.6 * tormenta})` }} />}
    </>
  );
};

// ---------- el protagonista (sudadera roja, como siempre) ----------
export const Yo: React.FC<{ f: number; x: number; y: number; escala?: number; acciones: [number, Accion2D][]; cara?: Cara; calor?: number; sudadera?: string; piel?: string; mirar?: "derecha" | "izquierda"; sombra?: boolean }> = ({
  f,
  x,
  y,
  escala = 1,
  acciones,
  cara,
  calor = 0,
  sudadera = "#e8433a",
  piel,
  mirar,
  sombra = true,
}) => (
  <>
    {sombra && (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={x + 160 * escala} cy={y + 8} rx={240 * escala} ry={26 * escala} fill="rgba(60,20,0,0.35)" transform={`skewX(-40)`} style={{ transformOrigin: `${x}px ${y}px` }} />
      </svg>
    )}
    <Personaje2D f={f} x={x} y={y} escala={escala} acciones={acciones} cara={cara} piel={piel ?? interpolateColors(calor, [0, 1], ["#f0bf98", "#f08060"])} sudadera={sudadera} sudaderaOscura="#b02a22" mirar={mirar} />
  </>
);

// texto de interfaz (pantallas, HUD)
export const T: React.FC<{ x: number; y: number; tam: number; color?: string; peso?: number; children: React.ReactNode; ancho?: number; alinear?: "left" | "center"; mono?: boolean; op?: number }> = ({
  x,
  y,
  tam,
  color = "#fff",
  peso = 900,
  children,
  ancho,
  alinear = "left",
  mono,
  op = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: alinear === "center" ? x - (ancho ?? 800) / 2 : x,
      top: y,
      width: ancho ?? (alinear === "center" ? 800 : undefined),
      textAlign: alinear,
      fontFamily: mono ? "'Courier New', monospace" : SANS,
      fontWeight: peso,
      fontSize: tam,
      color,
      opacity: op,
      whiteSpace: "pre",
      lineHeight: 1.1,
      textShadow: "0 3px 12px rgba(0,0,0,0.6)",
    }}
  >
    {children}
  </div>
);

// esquinas de visor de cámara + REC
export const Visor: React.FC<{ f: number; texto: string; color?: string }> = ({ f, texto, color = "#fff" }) => (
  <>
    {[
      [70, 470, "borderTop", "borderLeft"],
      [930, 470, "borderTop", "borderRight"],
      [70, 1370, "borderBottom", "borderLeft"],
      [930, 1370, "borderBottom", "borderRight"],
    ].map(([x, y, b1, b2], i) => (
      <div key={i} style={{ position: "absolute", left: (x as number) - (i % 2 ? 80 : 0), top: (y as number) - (i > 1 ? 80 : 0), width: 80, height: 80, [b1 as string]: `6px solid ${color}`, [b2 as string]: `6px solid ${color}` }} />
    ))}
    <T x={100} y={500} tam={34} color={color}>
      <span style={{ color: ROJO, opacity: Math.floor(f / 10) % 2 ? 1 : 0.15 }}>● </span>REC
    </T>
    <T x={100} y={1300} tam={28} color={color} mono>
      {texto}
    </T>
  </>
);

// ---------- 1 · gancho: perdido, alerta de calor extremo ----------
const gancho: Fabrica = ({ en, dur }) => ({ f }) => {
  const tp = en("perdido");
  const td = en("desierto");
  const tg = en("grados?");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 40 }, { z: 1.18, x: 0, y: -30 });
  const huellas = Array.from({ length: 14 }, (_, i) => i);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Calima id="calima-gancho" f={f} fuerza={18} />
      <Plano cam={cam} prof={0.5} filtro="url(#calima-gancho)">
        <Paisaje f={f} sol={[540, 1080]} horizonte={1240} />
      </Plano>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {huellas.map((i) => {
            const t = i / 13;
            const x = 540 + Math.sin(t * 3) * 120 * (1 - t);
            const y = 1880 - t * 520;
            return <ellipse key={i} cx={x + (i % 2 ? 18 : -18) * (1 - t * 0.7)} cy={y} rx={14 * (1 - t * 0.7)} ry={7 * (1 - t * 0.7)} fill="rgba(110,50,10,0.35)" />;
          })}
        </svg>
        <Yo f={f} x={540} y={1370} escala={0.3} acciones={[[0, "andar"]]} calor={0.6} />
      </Plano>
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={0} texto={"¿CUÁNTO\nSOBREVIVIRÍAS"} y={230} tam={110} color="#fff" />
      <Rotulo f={f} inicio={tp} texto="PERDIDO EN EL DESIERTO" y={500} tam={58} color="#3a1a00" fondo={AMARILLO} giro={-2} />
      {/* alerta del móvil, como las de emergencia */}
      {f > td && (
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 640 + (1 - muelle(f, td, 12)) * -120,
            width: 900,
            height: 210,
            borderRadius: 40,
            background: "rgba(200,20,35,0.92)",
            boxShadow: `0 0 ${60 + Math.sin(f / 3) * 25}px rgba(255,40,60,0.7)`,
            opacity: tramo(f, td, td + 5),
          }}
        >
          <svg width={120} height={120} style={{ position: "absolute", left: 30, top: 45 }}>
            <path d="M 60 10 L 112 104 L 8 104 Z" fill="none" stroke="#fff" strokeWidth={9} strokeLinejoin="round" />
            <rect x={55} y={42} width={10} height={36} rx={5} fill="#fff" />
            <circle cx={60} cy={90} r={6} fill="#fff" />
          </svg>
          <T x={170} y={34} tam={32} color="#ffd6dc">ALERTA DE CALOR EXTREMO</T>
          <T x={170} y={84} tam={78}>{f > tg ? "50 °C" : "…"}</T>
          <T x={520} y={110} tam={28} color="#ffd6dc">{"No salgas al exterior.\nBebe agua."}</T>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- 2 · plano detalle: el reloj en la muñeca, 37 → 40 °C ----------
const cuerpo: Fabrica = ({ en, dur }) => ({ f }) => {
  const t37 = en("37");
  const t40 = en("40,");
  const tg = en("golpe");
  const temp = interpolate(f, [t40 - 4, t40 + 10], [37, 40], clamp);
  const alerta = f > tg;
  const cam = mover(f, 0, dur, { z: 1.0, x: 30, y: 20 }, { z: 1.14, x: -10, y: -20 });
  const t = alerta ? temblor(f, 0.6) : { x: 0, y: 0 };
  const cx = 560;
  const cy = 980;
  const anillo = (temp - 35) / 7;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.3} filtro="blur(14px) saturate(1.2)">
        <Paisaje f={f} sol={[300, 700]} horizonte={1100} />
      </Plano>
      <Plano cam={{ ...cam, x: cam.x + t.x, y: cam.y + t.y }} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="brazo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f2b48a" />
              <stop offset="0.5" stopColor={PIEL} />
              <stop offset="1" stopColor="#b8724a" />
            </linearGradient>
          </defs>
          {/* antebrazo cruzando el plano */}
          <path d="M -100 1500 C 200 1200 700 900 1200 640 L 1200 1000 C 800 1180 400 1420 -100 1820 Z" fill="url(#brazo)" />
          {/* gotas de sudor sobre la piel */}
          {Array.from({ length: 16 }, (_, i) => {
            const px = 60 + random(`px${i}`) * 1000;
            const py = 1560 - px * 0.62 + random(`py${i}`) * 240 + (((f + i * 9) % 90) / 90) * 30;
            return (
              <g key={i}>
                <ellipse cx={px} cy={py} rx={9} ry={11} fill="rgba(255,255,255,0.35)" />
                <circle cx={px - 3} cy={py - 4} r={3} fill="#fff" />
              </g>
            );
          })}
          {/* correa */}
          <path d={`M ${cx - 150} ${cy - 420} L ${cx + 70} ${cy - 520} L ${cx + 170} ${cy + 420} L ${cx - 50} ${cy + 520} Z`} fill="#1d222c" />
          {/* caja y pantalla */}
          <rect x={cx - 230} y={cy - 270} width={460} height={540} rx={120} fill="#3d4456" transform={`rotate(-18 ${cx} ${cy})`} />
          <rect x={cx - 205} y={cy - 245} width={410} height={490} rx={100} fill={alerta ? (Math.floor(f / 6) % 2 ? "#a0001a" : "#e8203a") : "#06080e"} transform={`rotate(-18 ${cx} ${cy})`} />
          <g transform={`rotate(-18 ${cx} ${cy})`}>
            <circle cx={cx} cy={cy - 10} r={150} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={22} />
            <circle cx={cx} cy={cy - 10} r={150} fill="none" stroke={alerta ? "#fff" : temp > 38.5 ? NARANJA : VERDE} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${anillo * 942} 942`} transform={`rotate(-90 ${cx} ${cy - 10})`} />
            <text x={cx} y={cy + 20} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={96} fill="#fff">
              {temp.toFixed(1).replace(".", ",")}°
            </text>
            <text x={cx} y={cy - 70} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={24} fill="rgba(255,255,255,0.7)">
              TEMP. CORPORAL
            </text>
            <text x={cx} y={cy + 200} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={alerta ? 34 : 26} fill="#fff">
              {alerta ? "GOLPE DE CALOR" : f > t37 ? "NORMAL" : ""}
            </text>
          </g>
          {/* reflejo del cristal */}
          <path d={`M ${cx - 160} ${cy - 220} Q ${cx - 40} ${cy - 260} ${cx + 60} ${cy - 250} L ${cx - 120} ${cy - 120} Z`} fill="rgba(255,255,255,0.12)" transform={`rotate(-18 ${cx} ${cy})`} />
        </svg>
      </Plano>
      {alerta && <AbsoluteFill style={{ background: `rgba(255,0,30,${0.12 + Math.sin(f / 3) * 0.08})` }} />}
      <Cine f={f} vineta={0.75} />
    </AbsoluteFill>
  );
};

// ---------- 3 · plano detalle: gotas de sudor que caen en la arena y se evaporan ----------
const sudor: Fabrica = ({ en, dur }) => ({ f }) => {
  const ts = en("sudas:");
  const tl = en("litro");
  const th = en("hora.");
  const cam = mover(f, 0, dur, { z: 1.15, x: 0, y: -60 }, { z: 1.0, x: 0, y: 40 });
  const gotas = Array.from({ length: 9 }, (_, i) => ({ x: 160 + random(`gx${i}`) * 760, t0: ts + i * 9 + Math.round(random(`gt${i}`) * 6) }));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "linear-gradient(#f4c98a 0%, #e0a25c 55%, #b9733a 100%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 500 }, (_, i) => (
            <circle key={i} cx={random(`ax${i}`) * W} cy={random(`ay${i}`) * H} r={1 + random(`ar${i}`) * 3.5} fill={i % 3 ? "#c98a45" : "#fff0cc"} opacity={0.5} />
          ))}
          {/* ondas de la arena */}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M -20 ${560 + i * 120} Q 270 ${520 + i * 120} 540 ${560 + i * 120} T 1100 ${560 + i * 120}`} fill="none" stroke="#b9733a" strokeWidth={6} opacity={0.35} />
          ))}
          {/* sombra de tu cabeza sobre la arena */}
          <ellipse cx={420 + Math.sin(f / 30) * 20} cy={980} rx={260} ry={120} fill="rgba(70,25,0,0.28)" />
          <ellipse cx={420 + Math.sin(f / 30) * 20} cy={1180} rx={380} ry={140} fill="rgba(70,25,0,0.22)" />
          {gotas.map((g, i) => {
            if (f < g.t0) return null;
            const caida = tramo(f, g.t0, g.t0 + 12);
            const yS = 1250 - (i % 3) * 120;
            const y = -60 + (yS + 60) * caida * caida;
            const mancha = f > g.t0 + 12 ? 1 - tramo(f, g.t0 + 30, g.t0 + 70) : 0;
            return (
              <g key={i}>
                {caida < 1 && <path d={`M ${g.x} ${y - 40} Q ${g.x + 22} ${y} ${g.x} ${y + 14} Q ${g.x - 22} ${y} ${g.x} ${y - 40} Z`} fill="rgba(200,240,255,0.9)" stroke="#fff" strokeWidth={3} />}
                {mancha > 0 && (
                  <>
                    <ellipse cx={g.x} cy={yS + 10} rx={50 * mancha + 10} ry={18 * mancha + 4} fill="rgba(120,60,20,0.55)" />
                    <path d={`M ${g.x - 10} ${yS - 10 - (1 - mancha) * 80} q 14 -24 0 -48 q -14 -24 0 -48`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.5 * mancha} strokeLinecap="round" />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.65} />
      <Cuenta f={f} a={tl - 4} b={th + 4} desde={0} hasta={1.5} decimales={1} sufijo=" L" y={560} tam={200} color="#fff" />
      <Rotulo f={f} inicio={th} texto="POR HORA" y={790} tam={70} color="#3a1a00" fondo="#fff" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 4 · tu punto de vista: el horizonte se deforma y aparece un oasis que no existe ----------
const cerebro: Fabrica = ({ en, dur }) => ({ f }) => {
  const t2 = en("2");
  const tp = en("peor.");
  const t10 = en("10");
  const td = en("deliras.");
  const agua = f < t10 ? interpolate(f, [t2, t2 + 10], [100, 98], clamp) : interpolate(f, [t10, t10 + 12], [98, 90], clamp);
  const fuerza = interpolate(f, [0, tp, t10, td], [10, 25, 45, 70], clamp);
  const mareo = f > t10 ? Math.sin(f / 9) * 2.5 : 0;
  const cam = mover(f, 0, dur, { z: 1.05, x: 0, y: 0, r: 0 }, { z: 1.2, x: 0, y: 30, r: 0 });
  const doble = f > tp ? tramo(f, tp, tp + 10) * 16 : 0;
  const Vista = () => (
    <>
      <Paisaje f={f} sol={[860, 760]} horizonte={980} />
      {/* espejismo: agua y palmeras en el horizonte */}
      {f > td - 6 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(f, td - 6, td + 6) * (0.7 + Math.sin(f / 4) * 0.2) }}>
          <ellipse cx={420} cy={1005} rx={320} ry={34} fill="#5fc8f5" />
          <ellipse cx={420} cy={1010} rx={260} ry={18} fill="#a8e6ff" opacity={0.7} />
          {[330, 470, 560].map((px, k) => (
            <g key={k}>
              <path d={`M ${px} 1000 Q ${px - 10} ${920 - k * 10} ${px + 14} ${850 - k * 14}`} stroke="#5a3a18" strokeWidth={10} fill="none" />
              {[0, 1, 2, 3, 4].map((j) => (
                <path key={j} d={`M ${px + 14} ${850 - k * 14} q ${-60 + j * 30} ${-24 + Math.abs(j - 2) * 12} ${-100 + j * 50} ${20 + Math.abs(j - 2) * 16}`} stroke="#2e8e46" strokeWidth={14} fill="none" strokeLinecap="round" />
              ))}
            </g>
          ))}
        </svg>
      )}
    </>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Calima id="calima-cerebro" f={f} fuerza={fuerza} />
      <Plano cam={{ ...cam, r: mareo }} prof={1} filtro="url(#calima-cerebro)">
        <Vista />
      </Plano>
      {doble > 0 && (
        <>
          <div style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "screen", transform: `translateX(${-doble}px)`, filter: "url(#calima-cerebro) hue-rotate(-40deg)" }}>
            <Plano cam={{ ...cam, r: mareo }} prof={1}>
              <Vista />
            </Plano>
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "screen", transform: `translateX(${doble}px)`, filter: "url(#calima-cerebro) hue-rotate(160deg)" }}>
            <Plano cam={{ ...cam, r: mareo }} prof={1}>
              <Vista />
            </Plano>
          </div>
        </>
      )}
      <Cine f={f} vineta={0.8} />
      {/* HUD: agua del cuerpo */}
      <div style={{ position: "absolute", left: 120, top: 500, width: 840, height: 120, borderRadius: 30, background: "rgba(5,10,25,0.6)", border: "3px solid rgba(255,255,255,0.3)" }}>
        <T x={30} y={18} tam={30} color="#cfe6ff">AGUA EN TU CUERPO</T>
        <T x={640} y={14} tam={48} color={agua > 99 ? "#8fd8ff" : agua > 95 ? NARANJA : ROJO}>{`${Math.round(agua)} %`}</T>
        <div style={{ position: "absolute", left: 30, top: 74, width: 560, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.15)" }}>
          <div style={{ width: `${(agua - 80) * 5}%`, height: "100%", borderRadius: 11, background: agua > 99 ? "#3fb5ff" : agua > 95 ? NARANJA : ROJO }} />
        </div>
      </div>
      <Rotulo f={f} inicio={tp} texto="PIENSAS PEOR" y={680} tam={60} fondo={NARANJA} color="#fff" giro={-2} />
      <Sello f={f} inicio={td} x={540} y={1430} texto="¿OASIS? NO." color={ROJO} tam={70} giro={-5} />
    </AbsoluteFill>
  );
};

// ---------- 5 · el móvil en la mano, deslumbrado; aviso de temperatura ----------
const movil: Fabrica = ({ en, dur }) => ({ f }) => {
  const tr = en("rinde");
  const tm = en("móvil.");
  const t35 = en("35");
  const aviso = f > tm;
  const cam = mover(f, 0, dur, { z: 1.0, x: 40, y: 30, r: -3 }, { z: 1.16, x: -20, y: -10, r: 2 });
  const x = 520;
  const y = 980;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.3} filtro="blur(16px) brightness(1.1)">
        <Paisaje f={f} sol={[820, 600]} horizonte={1200} />
      </Plano>
      <Plano cam={cam} prof={1}>
        {/* mano */}
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={`M ${x - 260} 1920 L ${x - 220} ${y + 260} Q ${x - 200} ${y + 120} ${x - 120} ${y + 140} L ${x + 200} ${y + 200} Q ${x + 280} ${y + 260} ${x + 260} 1920 Z`} fill={PIEL} />
        </svg>
        <div style={{ position: "absolute", left: x - 200, top: y - 400, width: 400, height: 800, borderRadius: 64, background: "#161a24", border: "12px solid #3a4152", transform: `rotate(-6deg)`, boxShadow: "0 40px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 10, borderRadius: 50, overflow: "hidden", background: aviso ? "#050505" : "linear-gradient(170deg, #4aa3ff, #ff9a55)" }}>
            {!aviso ? (
              <>
                <T x={178} y={120} tam={36} alinear="center" ancho={356}>Valle de la Muerte</T>
                <T x={178} y={180} tam={170} alinear="center" ancho={356}>{`${Math.round(interpolate(f, [0, tm], [44, 50], clamp))}°`}</T>
                <T x={178} y={400} tam={30} alinear="center" ancho={356} color="#fff2d0">{"Soleado\nMáx. 51°  Mín. 33°"}</T>
              </>
            ) : (
              <div style={{ opacity: tramo(f, tm, tm + 6) }}>
                <svg width={356} height={300} style={{ position: "absolute", top: 120 }}>
                  <rect x={162} y={30} width={32} height={150} rx={16} fill="none" stroke="#ffcc00" strokeWidth={9} />
                  <circle cx={178} cy={200} r={38} fill="#ffcc00" />
                  <rect x={170} y={100} width={16} height={100} fill="#ffcc00" />
                </svg>
                <T x={178} y={440} tam={36} alinear="center" ancho={356}>Temperatura</T>
                <T x={178} y={500} tam={24} peso={700} alinear="center" ancho={356} color="#bbb">{"El teléfono necesita\nenfriarse antes de\nque puedas usarlo."}</T>
              </div>
            )}
          </div>
        </div>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* dedos por delante */}
          {[0, 1, 2].map((k) => (
            <rect key={k} x={x + 150} y={y + 40 + k * 90} width={140} height={70} rx={35} fill={PIEL} stroke="#c98a62" strokeWidth={3} />
          ))}
          <rect x={x - 250} y={y + 120} width={110} height={70} rx={35} fill={PIEL} stroke="#c98a62" strokeWidth={3} transform={`rotate(-30 ${x - 200} ${y + 150})`} />
        </svg>
      </Plano>
      {/* destellos del sol en el objetivo */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
        {[
          [0.2, 70, "#fff2b0"],
          [0.45, 40, "#ffb36b"],
          [0.7, 110, "#8fd8ff"],
        ].map(([k, r, c], i) => (
          <circle key={i} cx={820 - (820 - 300) * (k as number) + Math.sin(f / 20) * 30} cy={600 + (1500 - 600) * (k as number)} r={r as number} fill={c as string} opacity={0.18} />
        ))}
      </svg>
      <Cine f={f} vineta={0.7} />
      <Rotulo f={f} inicio={tr} texto="LO PRIMERO QUE SE RINDE…" y={480} tam={54} color="#fff" />
      <Rotulo f={f} inicio={t35} texto="HECHOS PARA 35 °C" y={1500} x={380} tam={52} fondo="#fff" color="#3a1a00" giro={-3} />
    </AbsoluteFill>
  );
};

// ---------- 6 · satélite: del espacio al Valle de la Muerte ----------
const VALLE: [number, number] = [-116.9, 36.5];
const valle: Fabrica = ({ en, dur }) => ({ f }) => {
  const tv = en("Valle");
  const ta = en("aire");
  const t56 = en("56,7");
  const ts = en("suelo,");
  const t94 = en("94.");
  const desde: CamaraGlobo = { lon: -40, lat: 20, zoom: 0.9, y: 1050 };
  const hasta: CamaraGlobo = { lon: VALLE[0], lat: VALLE[1], zoom: 3.4, y: 1050 };
  const k = interpolate(f, [0, tv + 26], [0, 1], { ...clamp, easing: suave });
  const cam = mezclar(desde, hasta, k);
  const cam2 = { ...cam, lon: cam.lon + interpolate(f, [tv + 26, dur], [0, 1.2], clamp) };
  const p = aPantalla(cam2, VALLE);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Tierra camara={cam2} f={f} estilo="satelite" nubes={0.3} fronteras={0.35} />
      {p && f > tv && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={p[0]} cy={p[1]} r={20 + ((f - tv) % 30) * 3} fill="none" stroke={ROJO} strokeWidth={5} opacity={1 - ((f - tv) % 30) / 30} />
          <circle cx={p[0]} cy={p[1]} r={14} fill={ROJO} stroke="#fff" strokeWidth={5} />
          <line x1={p[0] - 90} y1={p[1]} x2={p[0] - 30} y2={p[1]} stroke="#fff" strokeWidth={3} />
          <line x1={p[0] + 30} y1={p[1]} x2={p[0] + 90} y2={p[1]} stroke="#fff" strokeWidth={3} />
          <line x1={p[0]} y1={p[1] - 90} x2={p[0]} y2={p[1] - 30} stroke="#fff" strokeWidth={3} />
          {f > ta && <polyline points={`${p[0]},${p[1]} ${p[0] - 120},${p[1] + 200} ${p[0] - 300},${p[1] + 200}`} fill="none" stroke="#fff" strokeWidth={3} opacity={tramo(f, ta, ta + 8)} />}
          {f > ts && <polyline points={`${p[0]},${p[1]} ${p[0] + 60},${p[1] + 360} ${p[0] - 80},${p[1] + 360}`} fill="none" stroke={ROJO} strokeWidth={3} opacity={tramo(f, ts, ts + 8)} />}
        </svg>
      )}
      <Cine f={f} vineta={0.6} />
      <T x={110} y={500} tam={28} color="#cfe6ff" mono op={tramo(f, tv, tv + 8)}>{`36.5°N  116.9°W  ·  CALIFORNIA`}</T>
      <Rotulo f={f} inicio={tv} texto="VALLE DE LA MUERTE" y={560} tam={64} fondo={ROJO} color="#fff" giro={-2} />
      {p && f > ta && (
        <div style={{ position: "absolute", left: p[0] - 300 - 20, top: p[1] + 120, opacity: tramo(f, ta, ta + 8) }}>
          <T x={0} y={0} tam={30} color="#cfe6ff">AIRE (1913)</T>
          <T x={0} y={34} tam={90} color={NARANJA}>{f > t56 - 4 ? "56,7 °C" : "…"}</T>
        </div>
      )}
      {p && f > ts && (
        <div style={{ position: "absolute", left: p[0] - 80 - 20, top: p[1] + 280, opacity: tramo(f, ts, ts + 8) }}>
          <T x={0} y={0} tam={30} color="#ffd6dc">SUELO (1972)</T>
          <T x={0} y={34} tam={110} color="#fff">{f > t94 - 4 ? "94 °C" : "…"}</T>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- 7 · cámara del turista: el huevo friéndose en el asfalto ----------
const huevos: Fabrica = ({ en, dur }) => ({ f }) => {
  const tg = en("guardabosques");
  const tt = en("turistas");
  const tf = en("freír");
  const th = en("huevos");
  const cuaja = tramo(f, tf, th + 40);
  const cam = mover(f, 0, dur, { z: 1.25, x: 0, y: 0, r: -8 }, { z: 1.0, x: 0, y: 0, r: 4 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Calima id="calima-huevo" f={f} fuerza={14} />
      <Plano cam={cam} prof={1} filtro="url(#calima-huevo)">
        <AbsoluteFill style={{ background: "radial-gradient(circle at 45% 45%, #5a5652 0%, #2c2a28 85%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 600 }, (_, i) => (
            <circle key={i} cx={random(`hx${i}`) * W} cy={random(`hy${i}`) * H} r={1 + random(`hr${i}`) * 4} fill={i % 4 ? "#6a6560" : "#1c1a18"} />
          ))}
          <rect x={700} y={-100} width={70} height={2200} fill={AMARILLO} opacity={0.85} />
          {/* huevo */}
          <path d="M 460 760 C 680 730 760 960 670 1120 C 590 1260 330 1250 280 1090 C 230 930 290 780 460 760 Z" fill={interpolateColors(cuaja, [0, 1], ["rgba(255,255,255,0.45)", "#ffffff"])} />
          <path d="M 470 800 C 600 790 660 900 640 980" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={10} strokeLinecap="round" opacity={cuaja} />
          <circle cx={470} cy={990} r={92} fill="#ffad00" />
          <circle cx={440} cy={960} r={26} fill="#ffe08a" />
          {Array.from({ length: 10 }, (_, i) => {
            const c = ((f + i * 7) % 30) / 30;
            const a = random(`ba${i}`) * Math.PI * 2;
            const rr = 150 + random(`br${i}`) * 110;
            return f > tf ? <circle key={i} cx={470 + Math.cos(a) * rr} cy={990 + Math.sin(a) * rr * 0.8} r={4 + c * 12} fill="none" stroke="#fff" strokeWidth={3} opacity={(1 - c) * 0.8} /> : null;
          })}
          {[0, 1, 2, 3].map((k) => {
            const c = ((f + k * 12) % 48) / 48;
            return <path key={k} d={`M ${380 + k * 60} ${760 - c * 260} q 26 -36 0 -72 q -26 -36 0 -72`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.45 * (1 - c)} />;
          })}
        </svg>
      </Plano>
      {/* cartel del parque que entra por la derecha (primer plano) */}
      {f > tg && (
        <div style={{ position: "absolute", left: 640 + (1 - muelle(f, tg, 12)) * 600, top: 600, width: 400, height: 360, borderRadius: 24, background: "#3d6b3a", border: "10px solid #f2e2b0", transform: "rotate(4deg)", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
          <T x={190} y={26} tam={30} color="#f2e2b0" alinear="center" ancho={380}>PARQUE NACIONAL</T>
          <T x={190} y={90} tam={46} alinear="center" ancho={380}>{f > tf ? "POR FAVOR,\nNO FRÍAN\nHUEVOS" : "AVISO"}</T>
        </div>
      )}
      <Cine f={f} vineta={0.7} />
      {f > tt && <Visor f={f} texto={`CAM TURISTA · 13:${String(42 + Math.floor((f - tt) / 30)).padStart(2, "0")}`} />}
    </AbsoluteFill>
  );
};

// ---------- 8 · dentro del coche averiado: el salpicadero marca la temperatura ----------
const coche: Fabrica = ({ en, dur }) => ({ f }) => {
  const tp = en("para");
  const te = en("encierres");
  const ts = en("sube");
  const tm = en("minutos.");
  const temp = Math.round(interpolate(f, [ts, tm + 6], [50, 60], clamp));
  const t = temblor(f, f > tp && f < tp + 12 ? 1 : 0.15);
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.1, x: 0, y: -20 });
  const puerta = f > te ? tramo(f, te, te + 10) : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* lo que se ve por el parabrisas */}
      <Plano cam={cam} prof={0.4}>
        <Paisaje f={f} sol={[700, 640]} horizonte={1080} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* capó y humo */}
          <path d="M -100 1360 Q 540 1240 1180 1360 L 1180 1500 L -100 1500 Z" fill="#2a63b8" />
          {f > tp &&
            [0, 1, 2, 3, 4].map((k) => {
              const c = ((f - tp + k * 10) % 50) / 50;
              return <circle key={k} cx={540 + Math.sin(f / 9 + k) * 60} cy={1300 - c * 520} r={60 + c * 120} fill="#a8a8a8" opacity={0.55 * (1 - c)} />;
            })}
        </svg>
      </Plano>
      {/* interior: marco oscuro, volante y salpicadero */}
      <Plano cam={{ ...cam, x: cam.x + t.x, y: cam.y + t.y }} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={`M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z M 120 480 Q 540 420 960 480 L 1040 1400 L 40 1400 Z`} fill="#14110f" fillRule="evenodd" />
          <path d="M 0 1380 Q 540 1300 1080 1380 L 1080 1920 L 0 1920 Z" fill="#221d19" />
          <circle cx={300} cy={1780} r={330} fill="none" stroke="#0c0a09" strokeWidth={70} />
          <rect x={360} y={1440} width={360} height={190} rx={26} fill="#05080c" stroke="#333" strokeWidth={6} />
        </svg>
        <T x={540} y={1458} tam={26} color="#7fd3ff" alinear="center" ancho={360}>INTERIOR</T>
        <T x={540} y={1490} tam={100} color={temp >= 56 ? ROJO : "#7fd3ff"} alinear="center" ancho={360}>{`${temp}°`}</T>
        {f > ts && <T x={540} y={1650} tam={30} color={NARANJA} alinear="center" ancho={400}>{`+${Math.min(10, Math.round(interpolate(f, [ts, tm + 6], [0, 10], clamp)))} MIN`}</T>}
      </Plano>
      {/* la puerta se abre: entra la luz */}
      {puerta > 0 && <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(255,250,230,${0.85 * puerta}) 0%, rgba(255,250,230,0) ${30 + puerta * 30}%)` }} />}
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={tp} texto="SE TE PARA EL COCHE" y={540} tam={58} color="#fff" />
      <Sello f={f} inicio={te + 4} x={540} y={760} texto="NO TE ENCIERRES" color={ROJO} tam={62} giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 9 · vista de dron: el coche se ve, tú no ----------
const aire: Fabrica = ({ en, dur }) => ({ f }) => {
  const ts = en("sombra:");
  const tc = en("coche");
  const tp = en("persona.");
  const cam = mover(f, 0, dur, { z: 1.5, x: 0, y: 0, r: 10 }, { z: 1.0, x: 0, y: 0, r: 0 });
  const px = interpolate(f, [ts, ts + 20], [760, 520], clamp);
  const py = interpolate(f, [ts, ts + 20], [1260, 1080], clamp);
  const alt = Math.round(interpolate(f, [0, dur], [180, 320], clamp));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 40% 40%, #f0c07a 0%, #cf8f4a 90%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 16 }, (_, i) => {
            const y = 200 + i * 110;
            return <path key={i} d={`M -40 ${y} Q 270 ${y - 50} 540 ${y} T 1120 ${y}`} fill="none" stroke="#b9773a" strokeWidth={10} opacity={0.4} />;
          })}
          <path d="M 300 -40 C 360 600 260 1200 380 1960" stroke="#a8692f" strokeWidth={60} fill="none" opacity={0.35} />
          <rect x={470} y={880} width={190} height={360} rx={56} fill="rgba(40,15,0,0.35)" transform="translate(70 40)" />
          <rect x={470} y={880} width={190} height={360} rx={56} fill="#2f80ed" />
          <rect x={495} y={950} width={140} height={86} rx={20} fill="#bfe3ff" />
          <rect x={495} y={1120} width={140} height={64} rx={20} fill="#bfe3ff" />
          <circle cx={px + 12} cy={py + 8} r={14} fill="rgba(40,15,0,0.3)" />
          <circle cx={px} cy={py} r={13} fill="#e8433a" />
          <circle cx={px} cy={py - 2} r={6} fill="#f0bf98" />
          {/* sombra del propio dron */}
          <g transform={`translate(${760 + Math.sin(f / 20) * 30} ${700}) rotate(${f})`} opacity={0.25}>
            <rect x={-60} y={-8} width={120} height={16} fill="#000" />
            <rect x={-8} y={-60} width={16} height={120} fill="#000" />
          </g>
        </svg>
      </Plano>
      <Cine f={f} vineta={0.55} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={540} cy={1060} r={34} fill="none" stroke="#fff" strokeWidth={4} opacity={0.7} />
        <line x1={540} y1={980} x2={540} y2={1020} stroke="#fff" strokeWidth={4} opacity={0.7} />
        <line x1={540} y1={1100} x2={540} y2={1140} stroke="#fff" strokeWidth={4} opacity={0.7} />
        {f > tc && <rect x={445} y={860} width={240} height={410} fill="none" stroke={VERDE} strokeWidth={7} strokeDasharray="44 18" opacity={tramo(f, tc, tc + 6)} />}
        {f > tp && <rect x={px - 40} y={py - 40} width={80} height={80} fill="none" stroke={ROJO} strokeWidth={5} opacity={Math.floor(f / 5) % 2 ? 1 : 0.3} />}
      </svg>
      {f > tc && <T x={700} y={870} tam={30} color={VERDE}>COCHE ✓</T>}
      {f > tp && <T x={px + 50} y={py - 20} tam={28} color={ROJO}>¿PERSONA?</T>}
      <Visor f={f} texto={`DRON · ALT ${alt} m · ZOOM 4×`} />
      <Rotulo f={f} inicio={ts} texto="QUÉDATE A SU SOMBRA" y={620} tam={54} fondo="#fff" color="#7a4a10" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 10 · cámara rápida: los días pasan junto al coche… y caminando, ni uno ----------
const dias: Fabrica = ({ en, dur }) => ({ f }) => {
  const tsom = en("sombra,");
  const td = en("días.");
  const tc = en("Caminando");
  const tu = en("uno.");
  const fase = f < tc ? interpolate(f, [tsom - 10, tc], [0, 4], clamp) : 0; // 2 días = 4 medios ciclos
  const noche = f < tc ? (1 - Math.cos(fase * Math.PI)) / 2 : 0;
  const horas = Math.round(interpolate(f, [tsom - 10, tc], [0, 48], clamp));
  const camA = mover(f, 0, tc, { z: 1.0, x: 0, y: 0 }, { z: 1.08, x: 0, y: -10 });
  const camB = mover(f, tc, dur, { z: 1.2, x: 60, y: 0 }, { z: 1.0, x: -40, y: 0 });
  const enB = f >= tc;
  const solX = 100 + ((fase % 2) / 2) * 880;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {!enB ? (
        <Plano cam={camA} prof={1}>
          <Paisaje f={f} noche={noche} sol={[solX, 1100 - Math.sin(((fase % 2) / 2) * Math.PI) * 500]} horizonte={1250} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <ellipse cx={460 + (solX - 540) * -0.5} cy={1520} rx={260} ry={40} fill="rgba(40,15,0,0.35)" />
            <path d="M 200 1500 Q 200 1420 260 1410 L 330 1400 L 390 1330 Q 410 1310 450 1310 L 600 1310 Q 640 1310 660 1340 L 700 1400 L 740 1410 Q 780 1420 780 1470 L 780 1500 Z" fill={interpolateColors(noche, [0, 1], ["#2f80ed", "#1a2a4a"])} />
            {[290, 690].map((cx) => (
              <circle key={cx} cx={cx} cy={1500} r={46} fill="#151515" />
            ))}
          </svg>
          <Yo f={f} x={310} y={1560} escala={0.38} acciones={[[0, "reposo"]]} cara="serio" sombra={false} />
        </Plano>
      ) : (
        <Plano cam={camB} prof={1}>
          <Calima id="calima-dias" f={f} fuerza={30} />
          <div style={{ position: "absolute", inset: 0, filter: "url(#calima-dias)" }}>
            <Paisaje f={f} sol={[540, 650]} horizonte={1250} />
          </div>
          <Yo f={f} x={440} y={1700} escala={0.75} acciones={[[0, "andar"], [tu, "triste"]]} cara="preocupado" calor={1} />
        </Plano>
      )}
      <Cine f={f} vineta={0.65} />
      {!enB && (
        <div style={{ position: "absolute", left: 110, top: 500, width: 420, height: 170, borderRadius: 26, background: "rgba(5,10,25,0.6)", border: "3px solid rgba(255,255,255,0.3)" }}>
          <T x={26} y={16} tam={28} color="#cfe6ff">▶▶ CÁMARA RÁPIDA</T>
          <T x={26} y={60} tam={84} color="#fff">{`${horas} h`}</T>
        </div>
      )}
      <Rotulo f={f} inicio={td} texto="≈ 2 DÍAS" x={780} y={540} tam={80} fondo="#fff" color="#0a3a6a" giro={3} />
      <Rotulo f={f} inicio={tu} texto="< 1 DÍA" y={600} tam={110} fondo={ROJO} color="#fff" giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 11 · mito 1: racionar el agua; el manual militar dice lo contrario ----------
const mito1: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("Mito");
  const tr = en("racionar");
  const tmi = en("militares");
  const ts = en("sudor,");
  const ta = en("agua.");
  const cam = mover(f, 0, dur, { z: 1.1, x: 120, y: 0 }, { z: 1.0, x: -120, y: 0 });
  const nivel = 1 - tramo(f, ta, Math.max(ta + 1, dur)) * 0.7;
  const frase = "RACIONA EL SUDOR,\nNO EL AGUA.";
  const n = Math.floor(interpolate(f, [ts - 8, ts + 12], [0, frase.length], clamp));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.4} filtro="blur(8px)">
        <Paisaje f={f} noche={0.42} sol={[540, 1150]} horizonte={1150} />
      </Plano>
      <Plano cam={cam} prof={1}>
        {/* botella en la arena, a contraluz */}
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <ellipse cx={330} cy={1500} rx={200} ry={30} fill="rgba(60,20,0,0.4)" />
          <rect x={290} y={830} width={80} height={60} rx={14} fill="#2b6cd9" />
          <path d="M 300 890 L 360 890 L 450 990 L 450 1490 L 210 1490 L 210 990 Z" fill="rgba(220,240,255,0.3)" stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
          <rect x={218} y={1000 + 480 * (1 - nivel)} width={224} height={480 * nivel - 6} rx={10} fill="rgba(80,190,255,0.85)" />
          <path d="M 240 1010 L 240 1460" stroke="rgba(255,255,255,0.5)" strokeWidth={10} strokeLinecap="round" />
          {f > tr && [0.25, 0.5, 0.75].map((m, i) => <line key={m} x1={210} x2={210 + 90 * tramo(f, tr + i * 5, tr + i * 5 + 6)} y1={1000 + 480 * m} y2={1000 + 480 * m} stroke={ROJO} strokeWidth={10} strokeLinecap="round" />)}
        </svg>
        {/* página del manual militar */}
        {f > tmi && (
          <div style={{ position: "absolute", left: 540, top: 820 + (1 - muelle(f, tmi, 12)) * 400, width: 480, height: 600, borderRadius: 10, background: "linear-gradient(160deg, #e9dfbf, #cfc29a)", transform: "rotate(5deg)", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
            <T x={240} y={40} tam={26} color="#5a4a2a" mono alinear="center" ancho={480}>MANUAL DE SUPERVIVENCIA</T>
            <T x={240} y={76} tam={22} color="#7a6a4a" mono alinear="center" ancho={480}>EJÉRCITO · CAPÍTULO 13: DESIERTO</T>
            <div style={{ position: "absolute", left: 40, right: 40, top: 130, height: 4, background: "#7a6a4a" }} />
            <T x={40} y={190} tam={46} color="#2a2010" mono>{frase.slice(0, n)}</T>
            {f > ta && (
              <div style={{ position: "absolute", left: 120, top: 420, padding: "6px 20px", border: `8px solid ${ROJO}`, color: ROJO, fontFamily: SANS, fontWeight: 900, fontSize: 52, transform: `rotate(-10deg) scale(${interpolate(muelle(f, ta, 8), [0, 1], [2.4, 1])})` }}>CORRECTO</div>
            )}
          </div>
        )}
      </Plano>
      <Cine f={f} vineta={0.7} />
      <Sello f={f} inicio={tm} x={330} y={560} texto="MITO #1" color={ROJO} tam={80} giro={-6} />
      <Rotulo f={f} inicio={tr} texto="¿RACIONAR?" x={330} y={680} tam={56} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 12 · mito 2: el cactus a contraluz… y el mareo ----------
const mito2: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("Mito");
  const tc = en("cactus.");
  const tv = en("vomitar,");
  const tl = en("líquido.");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 60 }, { z: 1.15, x: 0, y: 0 });
  const mal = f > tv ? tramo(f, tv, tv + 10) : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Calima id="calima-cactus" f={f} fuerza={8 + mal * 30} />
      <Plano cam={{ ...cam, r: mal * Math.sin(f / 6) * 4 }} prof={1} filtro="url(#calima-cactus)">
        <Paisaje f={f} noche={0.5} sol={[560, 1060]} horizonte={1240} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform="translate(640 1560) scale(1.5)" fill="#1a0e14">
            <rect x={-55} y={-560} width={110} height={560} rx={55} />
            <path d="M -55 -280 L -150 -280 Q -180 -280 -180 -320 L -180 -440" stroke="#1a0e14" strokeWidth={84} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 55 -360 L 140 -360 Q 170 -360 170 -400 L 170 -490" stroke="#1a0e14" strokeWidth={84} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {f > tc && <path d={`M 600 ${980} L ${520 - 40 * tramo(f, tc, tc + 8)} ${860} L 420 860`} stroke="#ff5f9e" strokeWidth={16} fill="none" strokeLinecap="round" />}
        </svg>
        <Yo f={f} x={260} y={1700} escala={0.7} acciones={[[0, "reposo"], [tc, "pensar"], [tv, "triste"]]} cara={f > tv ? "triste" : "pensativo"} piel={mal > 0 ? interpolateColors(mal, [0, 1], ["#f0bf98", "#b7d97a"]) : undefined} sombra={false} />
      </Plano>
      {mal > 0 && <AbsoluteFill style={{ background: `rgba(120,200,60,${0.18 * mal})`, mixBlendMode: "multiply" }} />}
      <Cine f={f} vineta={0.75} />
      <Sello f={f} inicio={tm} x={330} y={560} texto="MITO #2" color={ROJO} tam={80} giro={-6} />
      <Rotulo f={f} inicio={tv} texto="VÓMITOS" x={330} y={700} tam={64} color="#c8f08a" />
      <Rotulo f={f} inicio={tl} texto="− MÁS LÍQUIDO" x={330} y={810} tam={56} fondo={ROJO} color="#fff" giro={-3} />
    </AbsoluteFill>
  );
};

// ---------- 13 · de noche, la caravana de beduinos sobre la duna ----------
const Camello: React.FC<{ f: number; x: number; y: number; escala: number; fase: number }> = ({ f, x, y, escala, fase }) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`}>
    <ellipse cx={0} cy={0} rx={120} ry={56} />
    <ellipse cx={-10} cy={-50} rx={56} ry={44} />
    <path d="M 110 -10 Q 160 -60 150 -120 L 188 -132 L 192 -110 L 172 -100 Q 176 -40 126 20 Z" />
    {[-80, -40, 40, 80].map((lx, i) => (
      <rect key={lx} x={lx - 9} y={30} width={18} height={130} transform={`rotate(${Math.sin(f / 6 + i * 1.6 + fase) * 12} ${lx} 30)`} />
    ))}
    {/* jinete con turbante */}
    <path d="M -30 -90 L 10 -90 L 0 -190 L -20 -190 Z" />
    <circle cx={-10} cy={-210} r={24} />
  </g>
);
const noche: Fabrica = ({ en, dur }) => ({ f }) => {
  const tc = en("Camina");
  const tn = en("noche");
  const tt = en("tápate");
  const tb = en("beduinos.");
  const n = interpolate(f, [tn - 12, tn + 20], [0, 1], clamp);
  const cam = mover(f, 0, dur, { z: 1.05, x: 80, y: 0 }, { z: 1.12, x: -80, y: -20 });
  const avance = interpolate(f, [0, dur], [-120, 180]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.3}>
        <Paisaje f={f} noche={n} horizonte={1200} dunas={["#e0a35a", "#d08a40"]} />
      </Plano>
      {/* cresta de la duna con la caravana (capa media) */}
      <Plano cam={cam} prof={0.7}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d="M -200 1420 Q 300 1180 700 1300 T 1400 1260 L 1400 1920 L -200 1920 Z" fill={interpolateColors(n, [0, 1], ["#c97b34", "#1b1838"])} />
          {f > tb - 16 && (
            <g fill={interpolateColors(n, [0, 1], ["#5a2a10", "#0a0818"])} opacity={tramo(f, tb - 16, tb - 4)}>
              {[0, 1, 2].map((k) => (
                <Camello key={k} f={f} x={160 + k * 230 + avance} y={1230 - k * 12 + Math.sin(k) * 10} escala={0.55} fase={k * 2} />
              ))}
            </g>
          )}
        </svg>
      </Plano>
      {/* primer plano: tú, tapado de pies a cabeza */}
      <Plano cam={cam} prof={1.25}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d="M -200 1700 Q 400 1580 1300 1720 L 1300 1920 L -200 1920 Z" fill={interpolateColors(n, [0, 1], ["#a8612a", "#120f28"])} />
        </svg>
        <Yo f={f} x={330} y={1760} escala={0.85} acciones={[[0, "reposo"], [tc, "andar"]]} cara="serio" sudadera={f > tt ? "#6a4a30" : "#e8433a"} sombra={false} />
        {f > tt && (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(f, tt, tt + 8) }}>
            <path d={`M ${330 - 110} ${1760 - 497 - 20} Q 330 ${1760 - 497 - 210} ${330 + 110} ${1760 - 497 - 20} Q 330 ${1760 - 497 - 80} ${330 - 110} ${1760 - 497 - 20} Z`} fill="#e9dcc0" stroke="#c9b48a" strokeWidth={6} />
            <path d={`M ${330 + 100} ${1760 - 497 - 30} q 60 40 40 140`} stroke="#e9dcc0" strokeWidth={26} fill="none" strokeLinecap="round" />
          </svg>
        )}
      </Plano>
      <Cine f={f} vineta={0.75} tinte={n > 0.5 ? "rgba(40,60,160,0.5)" : undefined} />
      <Rotulo f={f} inicio={tn} texto="SOLO DE NOCHE" y={500} tam={78} color={AMARILLO} />
      <Rotulo f={f} inicio={tt} texto="TÁPATE ENTERO" y={630} tam={54} fondo="#fff" color="#1b1838" giro={2} />
    </AbsoluteFill>
  );
};

// ---------- 14 · cámara térmica: túnica negra y blanca, misma temperatura ----------
const PALETA_TERMICA = ["#0b0030", "#4a00a0", "#c0007a", "#ff5a00", "#ffd000", "#fffbe0"];
const tunicas: Fabrica = ({ en, dur }) => ({ f }) => {
  const tn = en("negras");
  const tb = en("blancas,");
  const ta = en("aire");
  const termica = f > tb + 4 ? tramo(f, tb + 4, tb + 12) : 0;
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.12, x: 0, y: -30 });
  const Figura = ({ x, color, calor }: { x: number; color: string; calor?: boolean }) => {
    const rell = calor ? "url(#termo)" : color;
    return (
      <g>
        <path d={`M ${x} 900 L ${x + 190} 1500 L ${x - 190} 1500 Z`} fill={rell} />
        <path d={`M ${x - 105} 860 Q ${x} 690 ${x + 105} 860 L ${x + 125} 990 L ${x - 125} 990 Z`} fill={rell} />
        <ellipse cx={x} cy={890} rx={60} ry={70} fill={calor ? "#ffd000" : "#b77a50"} />
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - termica }}>
          <Paisaje f={f} sol={[540, 760]} horizonte={1300} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {f > tn - 4 && <Figura x={300} color="#0e0e12" />}
            {f > tb - 4 && <Figura x={720} color="#f4f1ea" />}
          </svg>
        </div>
        {termica > 0 && (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: termica }}>
            <defs>
              <linearGradient id="termo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={PALETA_TERMICA[4]} />
                <stop offset="0.5" stopColor={PALETA_TERMICA[3]} />
                <stop offset="1" stopColor={PALETA_TERMICA[2]} />
              </linearGradient>
              <linearGradient id="termofondo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={PALETA_TERMICA[0]} />
                <stop offset="0.65" stopColor={PALETA_TERMICA[1]} />
                <stop offset="1" stopColor={PALETA_TERMICA[2]} />
              </linearGradient>
            </defs>
            <rect width={W} height={H} fill="url(#termofondo)" />
            <Figura x={300} color="" calor />
            <Figura x={720} color="" calor />
            {f > ta &&
              [300, 720].map((x) =>
                [0, 1, 2].map((k) => {
                  const c = ((f - ta + k * 12) % 36) / 36;
                  return <path key={`${x}${k}`} d={`M ${x - 60 + k * 60} ${1480 - c * 520} q 26 -36 0 -72`} fill="none" stroke="#7fe8ff" strokeWidth={9} strokeLinecap="round" opacity={1 - c} />;
                }),
              )}
          </svg>
        )}
      </Plano>
      <Cine f={f} vineta={0.6} />
      {termica > 0 && (
        <>
          <T x={110} y={500} tam={32} color="#fff" mono op={termica}>
            <span style={{ color: ROJO }}>● </span>TÉRMICA
          </T>
          <div style={{ position: "absolute", left: 940, top: 520, width: 30, height: 600, borderRadius: 15, background: `linear-gradient(${[...PALETA_TERMICA].reverse().join(",")})`, opacity: termica }} />
          <T x={210} y={1180} tam={64} op={termica}>36 °C</T>
          <T x={620} y={1180} tam={64} op={termica}>36 °C</T>
        </>
      )}
      <Rotulo f={f} inicio={tn} texto="NEGRA" x={300} y={1540} tam={50} color="#fff" />
      <Rotulo f={f} inicio={tb} texto="BLANCA" x={620} y={1540} tam={50} color="#fff" />
      <Rotulo f={f} inicio={tb + 10} texto="MISMO CALOR" y={620} tam={70} fondo={AMARILLO} color="#3a1a00" giro={-2} />
      <Rotulo f={f} inicio={ta} texto="EL AIRE CIRCULA DENTRO" y={740} tam={46} fondo="#fff" color="#0a3a6a" giro={2} />
    </AbsoluteFill>
  );
};

// ---------- 15 · la tormenta de arena se traga al corredor; rótulo de telediario ----------
const prosperi: Fabrica = ({ en, dur }) => ({ f }) => {
  const t94 = en("1994,");
  const tm = en("Mauro");
  const tp = en("perdió");
  const tn = en("nueve");
  const tc = en("carrera.");
  const muro = interpolate(f, [0, tp + 10], [-700, 600], clamp);
  const tormenta = interpolate(f, [tp, tp + 18], [0, 0.85], clamp);
  const t = temblor(f, tormenta * 0.8);
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.12, x: 30, y: -20 });
  const dia = Math.round(interpolate(f, [tn, tc + 12], [1, 9], clamp));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={{ ...cam, x: cam.x + t.x, y: cam.y + t.y }} prof={1}>
        <Paisaje f={f} tormenta={tormenta * 0.6} sol={[860, 640]} horizonte={1260} />
        {/* muro de arena (haboob) que avanza */}
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="muro" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8a4a1e" />
              <stop offset="0.8" stopColor="#b8702e" />
              <stop offset="1" stopColor="#d89a52" stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={-800} y={400} width={muro + 800} height={1600} fill="url(#muro)" />
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={i} cx={muro - 40 + Math.sin(f / 8 + i) * 40} cy={430 + i * 100} r={120 + Math.sin(f / 6 + i * 2) * 30} fill="#c07a36" opacity={0.85} />
          ))}
        </svg>
        <Yo f={f} x={640} y={1700} escala={0.7} acciones={[[0, "andar"], [tp, "alarma"], [tn, "triste"]]} cara={f > tp ? "preocupado" : "feliz"} calor={0.5} mirar="izquierda" />
        <div style={{ position: "absolute", left: 640 - 36, top: 1700 - 360 * 0.7, width: 72, height: 52, background: "#fff", borderRadius: 6, fontFamily: SANS, fontWeight: 900, fontSize: 26, textAlign: "center", lineHeight: "52px", color: "#111" }}>94</div>
      </Plano>
      {tormenta > 0 && <AbsoluteFill style={{ background: `rgba(170,95,40,${tormenta * 0.55})` }} />}
      <Cine f={f} vineta={0.75} />
      {/* rótulo de telediario */}
      {f > t94 && (
        <div style={{ position: "absolute", left: 0, top: 1180, width: W, opacity: tramo(f, t94, t94 + 6) }}>
          <div style={{ marginLeft: 40, display: "inline-block", background: ROJO, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 32, padding: "8px 22px" }}>ÚLTIMA HORA · 1994</div>
          <div style={{ marginLeft: 40, marginRight: 40, background: "rgba(255,255,255,0.95)", color: "#111", fontFamily: SANS, fontWeight: 900, fontSize: 40, padding: "16px 22px", lineHeight: 1.15 }}>
            {f > tm ? "Mauro Prosperi, corredor italiano, desaparece en el Sahara" : "…"}
          </div>
          <div style={{ marginLeft: 40, marginRight: 40, background: "#0b1a36", color: AMARILLO, fontFamily: SANS, fontWeight: 900, fontSize: 30, padding: "10px 22px", overflow: "hidden", whiteSpace: "nowrap" }}>
            {f > tn ? `DÍA ${dia} DE BÚSQUEDA · MARATÓN DES SABLES · TORMENTA DE ARENA` : "MARATÓN DES SABLES · MARRUECOS"}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- 16 · satélite del Sahara: de Marruecos a Argelia ----------
const SALIDA: [number, number] = [-5.4, 30.6];
const LLEGADA: [number, number] = [-2.6, 29.3];
const argelia: Fabrica = ({ en, dur }) => ({ f }) => {
  const to = en("orina,");
  const tmu = en("murciélagos");
  const ta = en("Argelia,");
  const t300 = en("300");
  const desde: CamaraGlobo = { lon: 5, lat: 25, zoom: 1.6, y: 1050 };
  const hasta: CamaraGlobo = { lon: -4, lat: 30, zoom: 9, y: 1050 };
  const cam = mezclar(desde, hasta, interpolate(f, [0, ta], [0, 1], { ...clamp, easing: suave }));
  const t = tramo(f, ta - 16, t300);
  const a = aPantalla(cam, SALIDA);
  const b = aPantalla(cam, LLEGADA);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Tierra camara={cam} f={f} estilo="satelite" fuentes={["mundo", "europa"]} fronteras={0.6}>
        {(_p, trazo) => <Ruta trazo={trazo} ruta={[SALIDA, [-4.2, 30.3], [-3.4, 29.6], LLEGADA]} t={t} color="#fff" grosor={8} punteada />}
      </Tierra>
      {a && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={a[0]} cy={a[1]} r={14} fill="#fff" />
          {b && t > 0.98 && <circle cx={b[0]} cy={b[1]} r={20 + Math.sin(f / 3) * 4} fill={ROJO} stroke="#fff" strokeWidth={5} />}
        </svg>
      )}
      {/* murciélagos cruzando el plano */}
      {f > tmu && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2, 3].map((k) => {
            const x = -100 + ((f - tmu) * (9 + k * 2) + k * 160) % 1300;
            const y = 700 + k * 110 + Math.sin(f / 5 + k) * 40;
            const ala = Math.sin(f / 1.6 + k) * 30;
            return <path key={k} d={`M ${x} ${y} q -45 ${-30 - ala} -90 ${-8} q 22 20 12 44 q 34 -12 78 -12 q 44 0 78 12 q -10 -24 12 -44 q -45 -22 -90 8 Z`} fill="#120c18" />;
          })}
        </svg>
      )}
      <Cine f={f} vineta={0.6} />
      {a && <T x={a[0] - 70} y={a[1] - 70} tam={30}>SALIDA</T>}
      {b && <Rotulo f={f} inicio={ta} texto="ARGELIA" x={b[0]} y={b[1] - 130} tam={56} fondo={NARANJA} color="#fff" />}
      {a && b && <Rotulo f={f} inicio={t300} texto="≈ 300 KM" x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 + 90} tam={66} fondo="#fff" color="#111" giro={-4} />}
      <Rotulo f={f} inicio={to} texto="BEBIÓ SU ORINA" y={500} tam={54} fondo="rgba(10,15,30,0.85)" color={AMARILLO} />
      <Rotulo f={f} inicio={tmu} texto="COMIÓ MURCIÉLAGOS" y={610} tam={48} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 17 · final interactivo: ¿qué haces? A o B ----------
export const Opcion: React.FC<{ f: number; inicio: number; letra: string; texto: string; color: string; y: number; marcada?: boolean }> = ({ f, inicio, letra, texto, color, y, marcada }) => {
  if (f < inicio) return null;
  const s = muelle(f, inicio, 12);
  return (
    <div style={{ position: "absolute", left: 70, top: y, width: 740, height: 130, borderRadius: 30, background: "rgba(8,10,22,0.82)", border: `4px solid ${marcada ? color : "rgba(255,255,255,0.25)"}`, transform: `translateX(${(1 - s) * -200}px)`, opacity: Math.min(1, s * 1.5), boxShadow: marcada ? `0 0 40px ${color}` : undefined }}>
      <div style={{ position: "absolute", left: 22, top: 22, width: 86, height: 86, borderRadius: 43, background: color, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 56, textAlign: "center", lineHeight: "86px" }}>{letra}</div>
      <div style={{ position: "absolute", left: 130, top: 0, bottom: 0, right: 20, display: "flex", alignItems: "center", fontFamily: SANS, fontWeight: 900, fontSize: 38, color: "#fff", lineHeight: 1.15 }}>{texto}</div>
    </div>
  );
};
const final: Fabrica = ({ en, dur }) => ({ f }) => {
  const tq = en("haces?");
  const ta = en("A:");
  const tb = en("B:");
  const tco = en("Comenta");
  const ts = en("sígueme.");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.1, x: 0, y: -30 });
  const parpadeo = 0.6 + Math.sin(f / 4) * 0.4;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Paisaje f={f} noche={0.85} horizonte={1200} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* luces de la carretera a lo lejos */}
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={760 + k * 50} cy={1190} r={6} fill="#ffe7a0" opacity={parpadeo} />
          ))}
          <ellipse cx={810} cy={1190} rx={140} ry={20} fill="#ffe7a0" opacity={0.12 * parpadeo} />
          {/* coche y botella vacía */}
          <path d="M 120 1560 Q 120 1480 180 1470 L 250 1460 L 310 1390 Q 330 1370 370 1370 L 520 1370 Q 560 1370 580 1400 L 620 1460 L 660 1470 Q 700 1480 700 1530 L 700 1560 Z" fill="#141a30" />
          {[210, 610].map((cx) => (
            <circle key={cx} cx={cx} cy={1560} r={44} fill="#070910" />
          ))}
          <rect x={760} y={1560} width={50} height={110} rx={10} fill="rgba(200,230,255,0.25)" stroke="#9ab" strokeWidth={4} transform="rotate(70 785 1615)" />
        </svg>
      </Plano>
      <Cine f={f} vineta={0.75} tinte="rgba(40,60,160,0.4)" />
      <Rotulo f={f} inicio={0} texto="SE TE ACABÓ EL AGUA" y={500} tam={62} fondo={ROJO} color="#fff" giro={-2} />
      <Rotulo f={f} inicio={tq} texto="¿QUÉ HACES?" y={620} tam={100} color="#fff" />
      <Opcion f={f} inicio={ta} letra="A" texto={"Caminas ya hacia\nla carretera"} color={ROJO} y={860} marcada={f > tco && Math.floor(f / 12) % 2 === 0} />
      <Opcion f={f} inicio={tb} letra="B" texto={"Esperas a la noche\njunto al coche"} color="#2b6cd9" y={1020} marcada={f > tco && Math.floor(f / 12) % 2 === 1} />
      <Rotulo f={f} inicio={tco} texto="COMENTA A o B" y={1190} x={440} tam={60} color={AMARILLO} />
      {f > ts && (
        <div style={{ position: "absolute", left: 440, top: 1300, transform: `translateX(-50%) scale(${muelle(f, ts, 9)})`, padding: "18px 44px", borderRadius: 60, background: f > ts + 8 ? "#2a3550" : ROJO, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 52, whiteSpace: "nowrap", boxShadow: "0 14px 34px rgba(0,0,0,0.5)" }}>
          {f > ts + 8 ? "SIGUIENDO ✓" : "SEGUIR"}
        </div>
      )}
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, Fabrica> = { gancho, cuerpo, sudor, cerebro, movil, valle, huevos, coche, aire, dias, mito1, mito2, noche, tunicas, prosperi, argelia, final };

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> =>
  Object.fromEntries((Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](esc[k])])) as Record<Ilustracion, Dibujo>;
