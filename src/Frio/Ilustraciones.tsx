// Una ilustración por frase. Cada elemento entra en la palabra que lo nombra (en("palabra")).
// Zona libre: el avatar ocupa la esquina inferior derecha y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random } from "remotion";
import { Dibujo } from "../comun/tipos";
import type { Escenario, Ilustracion } from "./escenas";
import { Gancho3D } from "./Gancho3D";
import {
  AMARILLO,
  CIAN,
  clamp,
  Cronometro,
  Cuenta,
  Fondo,
  H,
  HIELO,
  Marca,
  Monitor,
  muelle,
  ROJO,
  Rotulo,
  SANS,
  Sello,
  Tarjeta,
  Termometro,
  Tiritas,
  tramo,
  Tu,
  VERDE,
  W,
} from "./Piezas";

type Fabrica = (e: Escenario) => Dibujo;

// ---------- 2 · 37 grados: termómetro y silueta con mapa de calor ----------
const Silueta: React.FC<{ x: number; y: number; escala: number; calor: number; latido?: number }> = ({ x, y, escala, calor, latido = 0 }) => {
  const nucleo = interpolateColors(calor, [0, 0.5, 1], ["#2f6dff", "#a05cff", "#ff3b2e"]);
  const borde = interpolateColors(calor, [0, 1], ["#9fd8ff", "#ffb340"]);
  const id = `sil${Math.round(calor * 100)}`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id={id} cx="50%" cy="38%" r="60%">
          <stop offset="0" stopColor={nucleo} />
          <stop offset="0.55" stopColor={interpolateColors(calor, [0, 1], ["#4f8bff", "#ff7a2e"])} />
          <stop offset="1" stopColor={borde} />
        </radialGradient>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${escala})`} style={{ filter: `drop-shadow(0 0 ${20 + latido * 20}px ${nucleo})` }}>
        <circle cx={0} cy={-330} r={70} fill={`url(#${id})`} />
        <path
          d="M -60 -250 L 60 -250 Q 130 -240 150 -170 L 200 40 Q 206 70 180 74 Q 158 76 150 50 L 105 -110 L 100 60 L 115 330 Q 118 360 88 360 Q 60 360 56 330 L 20 90 L -20 90 L -56 330 Q -60 360 -88 360 Q -118 360 -115 330 L -100 60 L -105 -110 L -150 50 Q -158 76 -180 74 Q -206 70 -200 40 L -150 -170 Q -130 -240 -60 -250 Z"
          fill={`url(#${id})`}
        />
      </g>
    </svg>
  );
};

const cuerpo: Fabrica = ({ dur, en }) => ({ f }) => {
  const t37 = en("37");
  const tp = en("pierda");
  const tpe = en("peligro.");
  const temp = interpolate(f, [0, t37 + 10, tp, tp + 20], [20, 37, 37, 35], clamp);
  const alarma = f > tpe ? (Math.sin(f / 3) + 1) / 2 : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1d4f8f" escarcha={0.3} />
      <AbsoluteFill style={{ background: `rgba(255,40,60,${alarma * 0.18})` }} />
      <Silueta x={690} y={1000} escala={1.15} calor={interpolate(temp, [33, 37], [0.2, 1], clamp)} latido={(Math.sin(f / 4) + 1) / 2} />
      <Termometro x={250} y={560} alto={720} temp={temp} min={25} max={40} marcas={[37, 35, 30]} peligro={35} />
      <Cuenta f={f} a={t37 - 8} b={t37 + 10} desde={20} hasta={37} decimales={0} sufijo="°C" y={470} tam={150} x={690} color={AMARILLO} />
      <Rotulo f={f} inicio={tp} texto="−2°C" x={690} y={1440} tam={110} fondo="#fff" color="#1554d6" giro={-4} />
      <Sello f={f} inicio={tpe} x={540} y={960} texto="PELIGRO" giro={-8} />
    </AbsoluteFill>
  );
};

// ---------- 3 · 35 grados: hipotermia, tiemblas ----------
const hipotermia: Fabrica = ({ en }) => ({ f }) => {
  const th = en("hipotermia:");
  const tt = en("tiemblas");
  const tm = en("manos");
  const tir = tramo(f, tt - 4, tt + 8);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1a4277" escarcha={0.5} />
      <Rotulo f={f} inicio={0} texto="35°C" y={460} tam={190} color={CIAN} />
      <Rotulo f={f} inicio={th} texto="HIPOTERMIA" y={640} tam={96} fondo={CIAN} color="#04122e" giro={-3} />
      <Tu f={f} x={470} y={1620} escala={1.15} acciones={[[0, "reposo"], [tt, "alarma"], [tm + 10, "sorpresa"]]} tirita={tir} frio={0.35 + tir * 0.3} cara="preocupado" />
      <Tiritas f={f} x={470} y={1250} ancho={330} alto={300} fuerza={tir} />
      <Rotulo f={f} inicio={tt + 4} texto="BRRRR" x={210} y={870} tam={80} color={HIELO} giro={-12} />
      {f > tm && (
        <Rotulo f={f} inicio={tm} texto={"MANOS\nTORPES"} x={830} y={830} tam={64} fondo="#fff" color="#d0263a" giro={5} />
      )}
    </AbsoluteFill>
  );
};

// ---------- 4 · 32 grados: el temblor se detiene ----------
const temblor: Fabrica = ({ en }) => ({ f }) => {
  const td = en("detiene.");
  const tb = en("buena");
  const tp = en("peor:");
  const tr = en("rinde.");
  const fuerza = 1 - tramo(f, td - 6, td + 10);
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const px = 140 + (i / 120) * 800;
    const amp = interpolate(px, [140, 940], [1, 0.05]) * (f < td ? 1 : 1 - tramo(f, td, td + 25)) + 0.04;
    pts.push(`${px},${900 + Math.sin(i * 0.9 + f * 0.8) * 70 * amp}`);
  }
  const oscuro = tramo(f, tr - 5, tr + 20);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#173a6b" escarcha={0.65} />
      <Rotulo f={f} inicio={0} texto="32°C" y={460} tam={170} color={HIELO} />
      <Tarjeta f={f} inicio={4} x={540} y={900} ancho={880} alto={240}>
        <div style={{ position: "absolute", left: 26, top: 12, fontFamily: SANS, fontWeight: 900, fontSize: 36, color: HIELO }}>TEMBLOR</div>
      </Tarjeta>
      {f > 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <polyline points={pts.join(" ")} fill="none" stroke={f > td ? "#7fa8d9" : CIAN} strokeWidth={10} strokeLinejoin="round" />
        </svg>
      )}
      <Tu f={f} x={330} y={1700} escala={0.95} acciones={[[0, "alarma"], [td, "reposo"], [tr, "triste"]]} tirita={fuerza} frio={0.7 + oscuro * 0.3} cara={f > tr ? "triste" : "serio"} />
      {f > tb && f < tp && <Marca f={f} inicio={tb} x={760} y={1230} tam={150} tipo="ok" />}
      <Sello f={f} inicio={tp} x={720} y={1230} texto="¡LA PEOR!" tam={88} giro={-8} />
      <AbsoluteFill style={{ background: `rgba(0,0,20,${oscuro * 0.35})` }} />
    </AbsoluteFill>
  );
};

// ---------- 5 · confusión ----------
const confusion: Fabrica = ({ en }) => ({ f }) => {
  const tc = en("confusión:");
  const th = en("hablas");
  const tt = en("tropiezas");
  const tp = en("peligro.");
  const vaiven = Math.sin(f / 9) * 3 * tramo(f, tc, tc + 10);
  const tropieza = f > tt ? Math.sin(tramo(f, tt, tt + 20) * Math.PI) * 14 : 0;
  const borroso = tramo(f, tp - 4, tp + 10) * 6;
  return (
    <AbsoluteFill style={{ transform: `rotate(${vaiven * 0.4}deg) scale(1.03)` }}>
      <Fondo f={f} de="#253a78" escarcha={0.7} />
      <Rotulo f={f} inicio={tc} texto="CONFUSIÓN" y={470} tam={120} color="#d9b8ff" giro={vaiven} />
      {/* interrogaciones girando alrededor de la cabeza */}
      {f > tc &&
        [0, 1, 2, 3].map((k) => {
          const a = f / 14 + (k * Math.PI) / 2;
          return (
            <div key={k} style={{ position: "absolute", left: 440 + Math.cos(a) * 190, top: 960 + Math.sin(a) * 60, fontFamily: SANS, fontWeight: 900, fontSize: 90, color: k % 2 ? AMARILLO : "#d9b8ff", transform: `rotate(${Math.sin(a) * 20}deg)`, textShadow: "0 6px 16px #000" }}>
              ?
            </div>
          );
        })}
      <Tu f={f} x={460} y={1720} escala={1.0} acciones={[[0, "reposo"], [tc, "pensar"], [tt, "sorpresa"], [tt + 25, "pensar"]]} frio={0.85} giro={tropieza} cara="pensativo" />
      {f > th && (
        <div style={{ position: "absolute", left: 120, top: 640, fontFamily: SANS, fontWeight: 900, fontSize: 70, color: "#fff", letterSpacing: interpolate(f, [th, th + 40], [0, 26], clamp), opacity: tramo(f, th, th + 6), textShadow: "0 6px 18px #000" }}>
          hablas… leeeento
        </div>
      )}
      <Rotulo f={f} inicio={tt} texto="¡TROPIEZAS!" x={790} y={780} tam={62} fondo="#fff" color="#4b2bb5" giro={8} />
      {f > tp && (
        <div style={{ position: "absolute", left: 740, top: 1000, transform: "translateX(-50%)", filter: `blur(${borroso}px)`, opacity: 1 - tramo(f, tp + 10, tp + 30) * 0.6 }}>
          <svg width={240} height={210}>
            <path d="M 120 10 L 230 200 L 10 200 Z" fill={AMARILLO} stroke="#000" strokeWidth={8} strokeLinejoin="round" />
            <rect x={110} y={70} width={20} height={80} rx={8} fill="#000" />
            <circle cx={120} cy={175} r={12} fill="#000" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- 6 · 28 grados: pierdes el conocimiento, el corazón falla ----------
const corazon: Fabrica = ({ en }) => ({ f }) => {
  const tco = en("conocimiento");
  const tc = en("corazón");
  const tf = en("fallar.");
  const caos = tramo(f, tf - 5, tf + 15);
  const parpado = tramo(f, tco, tco + 20) * 0.13 + (Math.sin(f / 7) + 1) * 0.015 * tramo(f, tco, tco + 20);
  const late = 1 + Math.max(0, Math.sin(f / (f > tf ? 2.2 : 4.5))) * 0.12;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#13305d" escarcha={0.8} />
      <Rotulo f={f} inicio={0} texto="28°C" y={460} tam={170} color="#8fb8ff" />
      <Monitor f={f} x={110} y={720} ancho={860} alto={330} caos={caos} lento={f > tc ? 1.6 : 1} color={f > tf ? ROJO : VERDE} texto={f > tf ? "ARRITMIA" : f > tc ? "♥ 38" : "♥ 52"} />
      {f > tc && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(330 1290) scale(${late * muelle(f, tc, 9)})`}>
            <path d="M 0 60 C -40 20 -120 0 -120 -60 C -120 -110 -60 -130 0 -80 C 60 -130 120 -110 120 -60 C 120 0 40 20 0 60 Z" fill={f > tf ? ROJO : "#ff5d73"} stroke="#fff" strokeWidth={10} />
          </g>
        </svg>
      )}
      <Rotulo f={f} inicio={tco} texto={"PIERDES EL\nCONOCIMIENTO"} y={1120} x={720} tam={52} fondo="#0b1a36" color="#fff" borde="#8fb8ff" />
      {/* párpados que se cierran */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: H * parpado, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: H * parpado, background: "#000" }} />
    </AbsoluteFill>
  );
};

// ---------- 7 · el reloj y la regla 1-10-1 ----------
const Hoyo: React.FC<{ f: number; y: number; ancho: number; aparece: number; cabeza?: boolean; chapoteo?: number; brazos?: number }> = ({ f, y, ancho, aparece, cabeza = false, chapoteo = 0, brazos = 0 }) => {
  if (f < aparece) return null;
  const s = muelle(f, aparece, 12);
  const bob = Math.sin(f / 6) * 6 + chapoteo * Math.sin(f * 1.3) * 12;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <ellipse cx={W / 2} cy={y} rx={(ancho / 2 + 160) * s} ry={130 * s} fill="#e9f6ff" />
      <ellipse cx={W / 2} cy={y + 8} rx={(ancho / 2) * s} ry={70 * s} fill="#0b3b6e" />
      <ellipse cx={W / 2} cy={y + 8} rx={(ancho / 2 - 20) * s} ry={52 * s} fill="#11558f" />
      {[0, 1, 2].map((k) => {
        const p = ((f + k * 15) % 45) / 45;
        return <ellipse key={k} cx={W / 2} cy={y + 8} rx={(ancho / 2 - 30) * p * s} ry={44 * p * s} fill="none" stroke="#9fdcff" strokeWidth={4} opacity={1 - p} />;
      })}
      {cabeza && (
        <g transform={`translate(${W / 2} ${y - 20 + bob})`}>
          {brazos > 0 &&
            [-1, 1].map((d) => (
              <path key={d} d={`M ${d * 40} 20 Q ${d * 120} ${-40 - Math.sin(f / 3 + d) * 50 * brazos} ${d * 150} ${-10 - Math.cos(f / 3 + d) * 40 * brazos}`} stroke="#c9d6f0" strokeWidth={30} fill="none" strokeLinecap="round" />
            ))}
          <ellipse cx={0} cy={20} rx={70} ry={26} fill="#e8433a" />
          <circle cx={0} cy={-40} r={62} fill="#c9d6f0" />
          <path d="M -62 -50 Q -60 -112 0 -108 Q 60 -112 62 -50 Q 30 -80 -62 -50 Z" fill="#3a2414" />
          <circle cx={-22} cy={-40} r={8} fill="#1b1b1b" />
          <circle cx={22} cy={-40} r={8} fill="#1b1b1b" />
          <ellipse cx={0} cy={-6} rx={chapoteo > 0 ? 16 : 14} ry={chapoteo > 0 ? 18 : 6} fill="#5b1f1f" />
        </g>
      )}
      <ellipse cx={W / 2} cy={y + 50} rx={(ancho / 2) * s} ry={24 * s} fill="#11558f" opacity={0.85} />
    </svg>
  );
};

const NumeroRegla: React.FC<{ f: number; inicio: number; x: number; y: number; texto: string; sub: string; activo: boolean; color: string }> = ({ f, inicio, x, y, texto, sub, activo, color }) => {
  const s = muelle(f, inicio, 9);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 135,
        top: y - 140,
        width: 270,
        height: 280,
        borderRadius: 36,
        background: activo ? color : "rgba(8,22,52,0.85)",
        border: `7px solid ${color}`,
        transform: `scale(${s * (activo ? 1.08 : 1)})`,
        boxShadow: activo ? `0 0 50px ${color}` : "0 14px 30px rgba(0,0,0,0.5)",
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 900,
        color: activo ? "#04122e" : "#fff",
      }}
    >
      <div style={{ fontSize: 150, lineHeight: 1.25 }}>{texto}</div>
      <div style={{ fontSize: 44, marginTop: -6 }}>{sub}</div>
    </div>
  );
};

const regla: Fabrica = ({ dur, en }) => ({ f }) => {
  const tr = en("reloj.");
  const ta = en("agua");
  const t1 = en("uno,");
  const t2 = en("diez,");
  const t3 = en("uno", 2);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#174a85" escarcha={0.45} />
      <Cronometro x={680} y={740} r={190 * muelle(f, tr - 6, 12) + 1} vuelta={tramo(f, tr, dur) * 1.4} />
      <Rotulo f={f} inicio={tr} texto={"EL\nRELOJ"} x={250} y={560} tam={96} color={AMARILLO} giro={-6} />
      <Hoyo f={f} y={1560} ancho={420} aparece={ta} />
      {f > ta && f < t1 + 4 && <Rotulo f={f} inicio={ta} texto="AGUA HELADA" y={1330} tam={70} fondo={CIAN} color="#04122e" />}
      <NumeroRegla f={f} inicio={t1} x={230} y={1140} texto="1" sub="MIN" activo={f >= t1 && f < t2} color={ROJO} />
      <NumeroRegla f={f} inicio={t2} x={540} y={1140} texto="10" sub="MIN" activo={f >= t2 && f < t3} color={AMARILLO} />
      <NumeroRegla f={f} inicio={t3} x={850} y={1140} texto="1" sub="HORA" activo={f >= t3} color={CIAN} />
    </AbsoluteFill>
  );
};

// ---------- 8 · 1 minuto de shock ----------
const minuto: Fabrica = ({ dur, en }) => ({ f }) => {
  const ts = en("shock:");
  const tj = en("jadeas");
  const tt = en("tragas");
  const ta = en("ahogas.");
  const jadeo = tramo(f, tj, tj + 6);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#16508e" escarcha={0.45} />
      <NumeroRegla f={f} inicio={0} x={260} y={600} texto="1" sub="MIN" activo color={ROJO} />
      <Rotulo f={f} inicio={ts} texto="SHOCK" x={700} y={480} tam={130} color={ROJO} giro={-5} />
      <Cuenta f={f} a={0} b={dur} desde={60} hasta={60 - dur / 30} decimales={0} sufijo=" s" x={700} y={650} tam={90} color="#fff" />
      <Hoyo f={f} y={1300} ancho={480} aparece={0} cabeza chapoteo={jadeo} />
      {/* bocanadas de aire */}
      {f > tj &&
        [0, 1, 2, 3, 4].map((k) => {
          const p = ((f - tj + k * 7) % 35) / 35;
          return <div key={k} style={{ position: "absolute", left: 600 + p * 160 + k * 6, top: 1170 - p * 140, width: 60 + p * 80, height: 40 + p * 50, borderRadius: "50%", background: "rgba(255,255,255,0.7)", opacity: 1 - p, filter: "blur(4px)" }} />;
        })}
      <Rotulo f={f} inicio={tj} texto="¡JADEAS!" x={260} y={880} tam={66} fondo="#fff" color="#c4142c" giro={-6} />
      {f > tt && (
        <Rotulo f={f} inicio={tt} texto={"NO TRAGUES\nAGUA"} y={1500} x={380} tam={62} fondo={ROJO} color="#fff" giro={3} />
      )}
      <Marca f={f} inicio={ta} x={160} y={1270} tam={130} tipo="x" />
    </AbsoluteFill>
  );
};

// ---------- 9 · 10 minutos para salir ----------
const diez: Fabrica = ({ dur, en }) => ({ f }) => {
  const tn = en("nadar");
  const ts = en("salir,");
  const tm = en("músculos");
  const ta = en("apaguen.");
  const energia = 1 - tramo(f, tm - 10, ta + 10) * 0.85;
  const seg = Math.max(0, 600 - (f / dur) * 600);
  const reloj = `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, "0")}`;
  const color = interpolateColors(energia, [0.15, 0.5, 1], [ROJO, AMARILLO, VERDE]);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#165090" escarcha={0.5} />
      <NumeroRegla f={f} inicio={0} x={260} y={600} texto="10" sub="MIN" activo color={AMARILLO} />
      <div style={{ position: "absolute", left: 720, top: 520, transform: `translateX(-50%) scale(${muelle(f, 2, 10)})`, fontFamily: SANS, fontWeight: 900, fontSize: 150, color: "#fff", fontVariantNumeric: "tabular-nums", textShadow: "0 10px 30px #000" }}>
        {reloj}
      </div>
      <Rotulo f={f} inicio={tn} texto="¡NADA Y SAL!" x={720} y={720} tam={64} fondo={AMARILLO} color="#04122e" giro={-3} />
      <Hoyo f={f} y={1280} ancho={480} aparece={0} cabeza brazos={f > tn ? energia : 0} chapoteo={f > tn ? 0.3 : 0} />
      {/* batería de los músculos */}
      <Tarjeta f={f} inicio={ts} x={420} y={1580} ancho={620} alto={150}>
        <div style={{ position: "absolute", left: 24, top: 10, fontFamily: SANS, fontWeight: 900, fontSize: 38, color: "#fff" }}>MÚSCULOS</div>
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 22, height: 50, borderRadius: 25, background: "rgba(255,255,255,0.15)" }}>
          <div style={{ width: `${energia * 100}%`, height: "100%", borderRadius: 25, background: color, boxShadow: `0 0 20px ${color}` }} />
        </div>
      </Tarjeta>
    </AbsoluteFill>
  );
};

// ---------- 10 · 1 hora hasta desmayarte ----------
const hora: Fabrica = ({ dur, en }) => ({ f }) => {
  const th = en("hora");
  const td = en("desmayarte");
  const tf = en("frío.");
  const nublado = tramo(f, td, dur);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#154885" escarcha={0.6 + nublado * 0.4} />
      <NumeroRegla f={f} inicio={0} x={260} y={600} texto="1" sub="HORA" activo color={CIAN} />
      <Cronometro x={720} y={640} r={170} vuelta={tramo(f, th - 4, dur) * 1} lleno={tramo(f, th - 4, dur)} color={CIAN} />
      <Cuenta f={f} a={th} b={dur} desde={0} hasta={60} sufijo=" min" x={720} y={860} tam={70} />
      <Tu f={f} x={330} y={1720} escala={0.95} acciones={[[0, "triste"], [td, "pensar"]]} frio={1} cara="triste" giro={-nublado * 8} />
      <Rotulo f={f} inicio={td} texto="DESMAYO" x={760} y={1100} tam={86} fondo="#fff" color="#1b4fb8" giro={5} />
      <Rotulo f={f} inicio={tf} texto="POR EL FRÍO" x={760} y={1240} tam={52} color={HIELO} />
      <AbsoluteFill style={{ backdropFilter: undefined, background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) ${60 - nublado * 30}%, rgba(0,0,0,${nublado * 0.8}) 100%)` }} />
    </AbsoluteFill>
  );
};

// ---------- 11 · el agua roba el calor 25 veces más rápido ----------
const Bloque: React.FC<{ f: number; x: number; titulo: string; color: string; n: number; velocidad: number; inicio: number }> = ({ f, x, titulo, color, n, velocidad, inicio }) => {
  const s = muelle(f, inicio, 11);
  return (
    <>
      <div style={{ position: "absolute", left: x - 210, top: 770, width: 420, height: 580, borderRadius: 40, background: color, opacity: 0.9 * Math.min(1, s * 1.5), transform: `scale(${s})`, overflow: "hidden", border: "6px solid rgba(255,255,255,0.6)" }}>
        <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 66, color: "#fff", marginTop: 20, textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>{titulo}</div>
      </div>
      {f > inicio && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${x} 1110) scale(${0.55 * s})`}>
            <circle cx={0} cy={-260} r={62} fill="#ff6a3d" />
            <path d="M -60 -190 L 60 -190 Q 120 -180 130 -110 L 130 120 L -130 120 L -130 -110 Q -120 -180 -60 -190 Z" fill="#ff6a3d" />
          </g>
          {Array.from({ length: n }, (_, i) => {
            const p = (((f - inicio) * velocidad) / 60 + random(`b${x}${i}`)) % 1;
            const ang = random(`a${x}${i}`) * Math.PI * 2;
            const r = 40 + p * 200;
            return <circle key={i} cx={x + Math.cos(ang) * r} cy={1060 + Math.sin(ang) * r * 1.2} r={9} fill="#ff8a3d" opacity={1 - p} />;
          })}
        </svg>
      )}
    </>
  );
};

const agua: Fabrica = ({ en }) => ({ f }) => {
  const ta = en("agua");
  const t25 = en("25");
  const tai = en("aire.");
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1a4d88" escarcha={0.35} />
      <Rotulo f={f} inicio={0} texto="TE ROBA EL CALOR" y={470} tam={66} color="#ffb36b" />
      <Bloque f={f} x={290} titulo="AIRE" color="#6d8fbf" n={4} velocidad={0.6} inicio={tai - 20 > ta ? tai - 20 : ta + 10} />
      <Bloque f={f} x={790} titulo="AGUA" color="#1561c4" n={40} velocidad={2.5} inicio={ta} />
      {f > t25 && (
        <div style={{ position: "absolute", left: W / 2, top: 545, transform: `translateX(-50%) scale(${muelle(f, t25, 7)}) rotate(-4deg)`, fontFamily: SANS, fontWeight: 900, fontSize: 170, color: AMARILLO, textShadow: "0 12px 40px rgba(0,0,0,0.8)", whiteSpace: "nowrap" }}>
          ×25
        </div>
      )}
      <Rotulo f={f} inicio={t25 + 8} texto="MÁS RÁPIDO" y={1400} x={420} tam={70} fondo="#fff" color="#1561c4" />
    </AbsoluteFill>
  );
};

// ---------- 12 · el viento: −40 °C, piel congelada en menos de 10 min ----------
const Mano: React.FC<{ x: number; y: number; congelado: number; escala?: number }> = ({ x, y, congelado, escala = 1 }) => {
  const piel = "#f0bf98";
  const dedos = [
    [-72, -150, 34, 120],
    [-26, -190, 36, 160],
    [22, -185, 36, 155],
    [66, -150, 33, 125],
  ];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${x} ${y}) scale(${escala})`}>
        <rect x={-110} y={-60} width={220} height={250} rx={80} fill={piel} />
        <rect x={-150} y={-10} width={70} height={150} rx={35} fill={piel} transform="rotate(-35 -115 60)" />
        {dedos.map(([dx, dy, w, h], i) => {
          const hielo = interpolate(congelado, [i * 0.12, i * 0.12 + 0.5], [0, 1], clamp);
          const color = interpolateColors(hielo, [0, 0.5, 1], [piel, "#c9b7e8", "#eef6ff"]);
          return (
            <g key={i}>
              <rect x={dx - w / 2} y={dy} width={w} height={h} rx={w / 2} fill={piel} />
              <rect x={dx - w / 2} y={dy} width={w} height={h * (0.35 + hielo * 0.35)} rx={w / 2} fill={color} />
              {hielo > 0.6 && <path d={`M ${dx - 8} ${dy + 14} l 8 8 l 8 -8`} stroke="#9fd8ff" strokeWidth={4} fill="none" />}
            </g>
          );
        })}
        <rect x={-110} y={130} width={220} height={150} rx={20} fill="#e8433a" />
      </g>
    </svg>
  );
};

const viento: Fabrica = ({ dur, en }) => ({ f }) => {
  const tv = en("viento:");
  const t40 = en("40");
  const tc = en("congela");
  const td = en("diez");
  const congelado = tramo(f, tc - 5, dur);
  const rafaga = tramo(f, tv - 6, tv + 6);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1b3e70" escarcha={0.5 + congelado * 0.4} nieve={1.4} viento={rafaga * 4} />
      {/* rachas de viento */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: rafaga }}>
        {Array.from({ length: 9 }, (_, i) => {
          const y = 520 + i * 120;
          const x = ((f * 38 + random(`v${i}`) * 2000) % 2200) - 600;
          return <path key={i} d={`M ${x} ${y} q 120 -30 240 0 t 240 0 q 60 -10 40 -50`} stroke="rgba(255,255,255,0.75)" strokeWidth={8} fill="none" strokeLinecap="round" />;
        })}
      </svg>
      <Rotulo f={f} inicio={tv} texto="VIENTO" y={470} tam={110} color={HIELO} giro={-3} />
      <Cuenta f={f} a={t40 - 4} b={t40 + 14} desde={0} hasta={-40} sufijo="°C" y={600} tam={150} color={CIAN} />
      <Mano x={400} y={1300} congelado={congelado} escala={1.05} />
      <Rotulo f={f} inicio={tc} texto="CONGELACIÓN" x={760} y={900} tam={56} fondo="#fff" color="#1b4fb8" giro={4} />
      <Tarjeta f={f} inicio={td - 4} x={790} y={1150} ancho={330} alto={210} fondo={ROJO} borde="#fff">
        <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 900, color: "#fff", fontSize: 92, lineHeight: 1.1, marginTop: 14 }}>
          {"<10"}
          <div style={{ fontSize: 50 }}>MIN</div>
        </div>
      </Tarjeta>
    </AbsoluteFill>
  );
};

// ---------- 13 · ropa normal a −20 °C con viento: pocas horas ----------
const Reloj: React.FC<{ f: number; x: number; y: number; inicio: number; p: number }> = ({ f, x, y, inicio, p }) => {
  const s = muelle(f, inicio, 10);
  if (f < inicio) return null;
  const giro = p > 0.95 ? 180 * tramo(p, 0.95, 1) : 0;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${x} ${y}) scale(${s}) rotate(${giro})`}>
        <rect x={-130} y={-200} width={260} height={30} rx={12} fill="#8b5a2b" />
        <rect x={-130} y={170} width={260} height={30} rx={12} fill="#8b5a2b" />
        <path d="M -100 -170 L 100 -170 Q 100 -60 12 0 Q 100 60 100 170 L -100 170 Q -100 60 -12 0 Q -100 -60 -100 -170 Z" fill="rgba(220,240,255,0.35)" stroke="#e8f6ff" strokeWidth={8} />
        <path d={`M ${-90 + p * 70} ${-160 + p * 150} L ${90 - p * 70} ${-160 + p * 150} Q 40 -30 0 0 Q -40 -30 ${-90 + p * 70} ${-160 + p * 150} Z`} fill={AMARILLO} opacity={1 - p} />
        <path d={`M 0 ${170 - p * 110} Q ${70 * p + 20} ${170 - p * 40} 92 168 L -92 168 Q ${-70 * p - 20} ${170 - p * 40} 0 ${170 - p * 110} Z`} fill={AMARILLO} />
        <line x1={0} y1={0} x2={0} y2={168} stroke={AMARILLO} strokeWidth={6} opacity={p < 1 ? 1 : 0} />
      </g>
    </svg>
  );
};

const ropa: Fabrica = ({ dur, en }) => ({ f }) => {
  const tr = en("ropa");
  const t20 = en("20");
  const tv = en("viento,");
  const th = en("horas.");
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1c4579" escarcha={0.55} nieve={1.2} viento={f > tv ? 2.4 : 0.6} />
      <Tu f={f} x={300} y={1720} escala={1.0} acciones={[[0, "reposo"], [tv, "alarma"]]} tirita={tramo(f, tv, tv + 10) * 0.8} frio={0.4 + tramo(f, 0, dur) * 0.4} cara="preocupado" />
      <Rotulo f={f} inicio={tr} texto="ROPA NORMAL" x={300} y={760} tam={54} fondo="#fff" color="#c43a2f" giro={-4} />
      <Rotulo f={f} inicio={t20} texto="−20°C" x={780} y={450} tam={130} color={CIAN} />
      <Rotulo f={f} inicio={tv} texto="+ VIENTO" x={780} y={600} tam={70} color="#fff" />
      <Reloj f={f} x={780} y={980} inicio={t20} p={tramo(f, t20, dur)} />
      <Rotulo f={f} inicio={th - 6} texto={"POCAS\nHORAS"} x={780} y={1220} tam={78} fondo={AMARILLO} color="#04122e" giro={3} />
    </AbsoluteFill>
  );
};

// ---------- 14 · desvestimiento paradójico ----------
const desvestir: Fabrica = ({ en }) => ({ f }) => {
  const te = en("escalofriante:");
  const tq = en("quitan");
  const tc = en("calor");
  const tf = en("falso.");
  const vuela = tramo(f, tq, tq + 30);
  const calor = tramo(f, tc - 6, tc + 12);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1a3a6c" escarcha={0.75} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 35% 65%, rgba(255,90,40,${calor * 0.5}) 0%, rgba(255,90,40,0) 45%)` }} />
      <Rotulo f={f} inicio={te} texto="ESCALOFRIANTE" y={500} tam={92} color="#ff8a7a" />
      <Tu f={f} x={380} y={1720} escala={1.05} acciones={[[0, "triste"], [tq, "celebrar"], [tc, "contento"]]} frio={0.9} sudadera={f > tq + 8 ? "#f2f2f2" : "#e8433a"} cara={f > tc ? "feliz" : "triste"} />
      {/* la chaqueta sale volando */}
      {f > tq && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - tramo(f, tq + 24, tq + 34) }}>
          <g transform={`translate(${380 + vuela * 520} ${1250 - Math.sin(vuela * Math.PI) * 500 - vuela * 120}) rotate(${vuela * 400}) scale(${1 - vuela * 0.3})`}>
            <path d="M -90 -110 L -30 -130 Q 0 -100 30 -130 L 90 -110 L 150 10 L 105 40 L 80 -10 L 80 130 L -80 130 L -80 -10 L -105 40 L -150 10 Z" fill="#e8433a" stroke="#8f1d17" strokeWidth={6} />
          </g>
        </svg>
      )}
      <Rotulo f={f} inicio={tq + 4} texto={"SE QUITAN\nLA ROPA"} x={760} y={680} tam={58} fondo="#fff" color="#b3261e" giro={4} />
      {f > tc && (
        <div style={{ position: "absolute", left: 760, top: 940, transform: `translateX(-50%) scale(${muelle(f, tc, 9)})`, textAlign: "center", fontFamily: SANS, fontWeight: 900 }}>
          <div style={{ fontSize: 40, color: "#ffb08a" }}>SIENTEN</div>
          <div style={{ fontSize: 96, color: "#ff6a3d", textShadow: "0 0 30px #ff3b00" }}>CALOR</div>
        </div>
      )}
      <Sello f={f} inicio={tf} x={760} y={1250} texto="FALSO" tam={96} color="#1b4fb8" giro={-8} />
    </AbsoluteFill>
  );
};

// ---------- 15 · refúgiate del viento y aíslate del suelo ----------
const refugio: Fabrica = ({ dur, en }) => ({ f }) => {
  const tv = en("viento");
  const ts = en("suelo:");
  const tr = en("roba");
  const ramas = tramo(f, ts, ts + 12);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1d4d86" escarcha={0.35} />
      <Rotulo f={f} inicio={0} texto="SOBREVIVIR" y={470} tam={110} color={VERDE} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* suelo helado */}
        <rect x={0} y={1350} width={W} height={570} fill="#dceeff" />
        <rect x={0} y={1350} width={W} height={20} fill="#fff" />
        {/* refugio de nieve en corte */}
        <g transform={`translate(520 1360) scale(${muelle(f, 4, 12)})`}>
          <path d="M -360 0 Q -340 -480 0 -500 Q 340 -480 360 0 Z" fill="#f4fbff" stroke="#a9d3f5" strokeWidth={8} />
          <path d="M -250 0 Q -240 -330 0 -350 Q 240 -330 250 0 Z" fill="#0f2c55" />
          <path d="M -250 0 Q -240 -330 0 -350 Q 240 -330 250 0 Z" fill="url(#calorRef)" opacity={0.7} />
          <defs>
            <radialGradient id="calorRef" cx="50%" cy="80%" r="60%">
              <stop offset="0" stopColor="#ff9a3d" />
              <stop offset="1" stopColor="#ff9a3d" stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* capa de ramas aislante */}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={-230 + i * 50} y1={-8 - (i % 3) * 8} x2={-230 + i * 50 + 80 * ramas} y2={-22 + (i % 2) * 10} stroke="#7a4a1d" strokeWidth={16} strokeLinecap="round" opacity={ramas} />
          ))}
        </g>
        {/* flechas del viento que rebotan */}
        {f > tv &&
          [0, 1, 2].map((k) => {
            const p = ((f - tv + k * 12) % 36) / 36;
            const x = 40 + p * 200;
            return <path key={k} d={`M ${x - 80} ${1000 + k * 90} L ${x} ${1000 + k * 90} l -24 -20 m 24 20 l -24 20`} stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={1 - p} />;
          })}
        {/* frío del suelo bloqueado */}
        {f > ts &&
          [0, 1, 2, 3].map((k) => {
            const p = ((f - ts + k * 9) % 30) / 30;
            return <path key={k} d={`M ${400 + k * 50} ${1520 - p * 120} l -16 24 m 16 -24 l 16 24`} stroke="#3b8bff" strokeWidth={9} fill="none" strokeLinecap="round" opacity={(1 - p) * 0.9} />;
          })}
      </svg>
      <Tu f={f} x={520} y={1340} escala={0.42} acciones={[[0, "contento"]]} frio={0.3} />
      <Rotulo f={f} inicio={tv} texto="SIN VIENTO" x={250} y={720} tam={56} fondo="#fff" color="#1554d6" giro={-5} />
      <Rotulo f={f} inicio={ts} texto="AÍSLATE DEL SUELO" x={430} y={1600} tam={52} fondo={VERDE} color="#04122e" />
      {f > tr && <Rotulo f={f} inicio={tr} texto="EL SUELO TE ROBA CALOR" x={430} y={1720} tam={38} color="#fff" />}
    </AbsoluteFill>
  );
};

// ---------- 16 · mantente seco y no comas nieve ----------
const Camiseta: React.FC<{ x: number; y: number; mojado: number; f: number }> = ({ x, y, mojado, f }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <g transform={`translate(${x} ${y})`}>
      <path d="M -70 -120 Q 0 -90 70 -120 L 160 -60 L 120 10 L 90 -10 L 90 140 L -90 140 L -90 -10 L -120 10 L -160 -60 Z" fill={interpolateColors(mojado, [0, 1], ["#e8433a", "#8e2a24"])} />
      {Array.from({ length: 6 }, (_, i) => {
        const p = ((f + i * 10) % 50) / 50;
        return <path key={i} d={`M ${-70 + i * 28} ${-40 + p * 200} q -10 18 0 26 q 10 -8 0 -26 Z`} fill="#7fd0ff" opacity={mojado * (1 - p)} />;
      })}
    </g>
  </svg>
);

const seco: Fabrica = ({ dur, en }) => ({ f }) => {
  const tm = en("mojada");
  const ta = en("abriga,");
  const tn = en("nieve");
  const td = en("derretirla.");
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1c4d85" escarcha={0.35} />
      <Rotulo f={f} inicio={0} texto="SECO" y={470} tam={130} color={AMARILLO} />
      <Tarjeta f={f} inicio={4} x={290} y={950} ancho={440} alto={560}>
        <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 46, color: "#fff", marginTop: 20 }}>ROPA MOJADA</div>
      </Tarjeta>
      {f > 4 && <Camiseta x={290} y={980} mojado={tramo(f, tm - 6, tm + 10)} f={f} />}
      <Marca f={f} inicio={ta} x={290} y={1180} tam={110} tipo="x" />
      <Tarjeta f={f} inicio={tn - 4} x={790} y={950} ancho={440} alto={560}>
        <div style={{ textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 46, color: "#fff", marginTop: 20 }}>{f > td ? "DERRÍTELA" : "¿NIEVE?"}</div>
      </Tarjeta>
      {f > tn && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {f < td ? (
            <g transform={`translate(790 990) scale(${muelle(f, tn, 9)})`}>
              <circle r={110} fill="#f4fbff" stroke="#a9d3f5" strokeWidth={8} />
              <circle cx={-30} cy={-30} r={20} fill="#fff" />
            </g>
          ) : (
            <g transform="translate(790 1000)">
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M ${-50 + k * 50} 120 q ${-20} -50 0 -${70 + Math.sin(f / 3 + k) * 15} q 20 40 0 70 Z`} fill={k === 1 ? AMARILLO : "#ff6a3d"} />
              ))}
              <path d="M -110 -40 L 110 -40 L 90 60 L -90 60 Z" fill="#5d6b7a" />
              <rect x={-120} y={-56} width={240} height={22} rx={10} fill="#8796a6" />
              <ellipse cx={0} cy={-46} rx={100} ry={12} fill="#7fd0ff" />
              {[0, 1, 2].map((k) => {
                const p = ((f + k * 12) % 36) / 36;
                return <path key={k} d={`M ${-40 + k * 40} ${-70 - p * 90} q 14 -20 0 -40`} stroke="#fff" strokeWidth={6} fill="none" opacity={1 - p} />;
              })}
            </g>
          )}
        </svg>
      )}
      {f > tn + 6 && f < td && <Marca f={f} inicio={tn + 6} x={790} y={1180} tam={110} tipo="x" />}
      <Marca f={f} inicio={td + 4} x={790} y={1180} tam={110} tipo="ok" />
    </AbsoluteFill>
  );
};

// ---------- 17 · ni una gota de alcohol ----------
const alcohol: Fabrica = ({ dur, en }) => ({ f }) => {
  const ta = en("alcohol:");
  const ts = en("sensación");
  const te = en("enfría");
  const temp = interpolate(f, [te - 4, dur], [36, 33], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1b4479" escarcha={0.45} />
      <Rotulo f={f} inicio={ta} texto="ALCOHOL" y={470} tam={120} color="#ffb36b" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(320 1000) rotate(${Math.sin(f / 10) * 4}) scale(${muelle(f, 2, 10)})`}>
          <rect x={-34} y={-300} width={68} height={120} rx={12} fill="#2f7d3a" />
          <rect x={-40} y={-320} width={80} height={30} rx={8} fill="#d8b23a" />
          <path d="M -34 -180 Q -110 -140 -110 -40 L -110 260 Q -110 290 -80 290 L 80 290 Q 110 290 110 260 L 110 -40 Q 110 -140 34 -180 Z" fill="#3f9b4a" />
          <rect x={-90} y={0} width={180} height={150} rx={14} fill="#f3e2b6" />
          <rect x={-70} y={70} width={140} height={14} rx={7} fill="#9b6b2a" />
          <rect x={-60} y={-110} width={22} height={300} rx={11} fill="rgba(255,255,255,0.25)" />
        </g>
      </svg>
      <Marca f={f} inicio={ta + 6} x={320} y={1020} tam={240} tipo="x" />
      {f > ts && (
        <div style={{ position: "absolute", left: 760, top: 660, transform: `translateX(-50%) scale(${muelle(f, ts, 9)})`, textAlign: "center", fontFamily: SANS, fontWeight: 900 }}>
          <div style={{ fontSize: 40, color: "#ffb08a" }}>SENSACIÓN DE</div>
          <div style={{ fontSize: 90, color: "#ff6a3d", textShadow: "0 0 30px #ff3b00" }}>CALOR</div>
        </div>
      )}
      {f > te && <Termometro x={760} y={940} alto={340} temp={temp} min={30} max={38} escala={0.9} />}
      {f > te && <Cuenta f={f} a={te} b={dur} desde={36} hasta={33} decimales={1} sufijo="°" x={760} y={1340} tam={70} color={CIAN} />}
      <Rotulo f={f} inicio={te} texto="TE ENFRÍA" x={300} y={1340} tam={64} fondo={CIAN} color="#04122e" giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 18 · Anna Bågenholm: 13,7 °C y sobrevivió ----------
const anna: Fabrica = ({ dur, en }) => ({ f }) => {
  const ta = en("Anna");
  const th = en("hielo.");
  const tc = en("cuerpo");
  const t13 = en("13,7");
  const ts = en("sobrevivió.");
  const temp = interpolate(f, [tc, t13 + 10], [37, 13.7], clamp);
  const vive = f > ts;
  return (
    <AbsoluteFill>
      <Fondo f={f} de={vive ? "#245c8f" : "#123461"} escarcha={0.6} />
      <Rotulo f={f} inicio={0} texto="1999" y={440} x={300} tam={110} color={AMARILLO} />
      <Rotulo f={f} inicio={ta} texto="ANNA BÅGENHOLM" y={590} x={420} tam={52} fondo="#fff" color="#0b2a5c" />
      {/* lago helado en corte */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={1050} width={W} height={870} fill="#0b3f74" />
        <rect x={0} y={980} width={W} height={80} fill="#dff3ff" opacity={muelle(f, th - 6, 12)} />
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={i * 140 + 20} y1={985} x2={i * 140 + 80} y2={1055} stroke="#a9d3f5" strokeWidth={4} opacity={muelle(f, th - 6, 12)} />
        ))}
        <g transform={`translate(330 ${1200 + Math.sin(f / 15) * 8}) rotate(-70)`} opacity={0.95}>
          <circle cx={0} cy={-150} r={42} fill="#b9c9e8" />
          <rect x={-46} y={-105} width={92} height={180} rx={36} fill="#3a5f9a" />
          <rect x={-40} y={70} width={30} height={130} rx={15} fill="#2c3e66" />
          <rect x={10} y={70} width={30} height={130} rx={15} fill="#2c3e66" />
        </g>
        {[0, 1, 2, 3].map((k) => {
          const p = ((f + k * 20) % 80) / 80;
          return <circle key={k} cx={300 + k * 25} cy={1180 - p * 120} r={8 + k * 2} fill="none" stroke="#9fdcff" strokeWidth={3} opacity={1 - p} />;
        })}
      </svg>
      {f > tc && <Termometro x={790} y={700} alto={520} temp={temp} min={10} max={40} marcas={[37, 13.7]} />}
      {f > tc && <Cuenta f={f} a={tc} b={t13 + 10} desde={37} hasta={13.7} decimales={1} sufijo="°C" x={560} y={1450} tam={120} color={CIAN} />}
      <Sello f={f} inicio={ts} x={540} y={1250} texto="¡SOBREVIVIÓ!" color={VERDE} tam={92} giro={-6} />
      {vive && <AbsoluteFill style={{ background: `rgba(255,200,80,${(1 - tramo(f, ts, ts + 20)) * 0.35})` }} />}
    </AbsoluteFill>
  );
};

// ---------- 19 · "nadie está muerto hasta que está caliente y muerto" ----------
const medicos: Fabrica = ({ en }) => ({ f }) => {
  const tn = en("nadie");
  const tc = en("caliente");
  const palabras = ["NADIE", "ESTÁ", "MUERTO", "HASTA", "QUE", "ESTÁ"];
  const claves = ["nadie", "esta", "muerto", "hasta", "que", "esta"];
  const tiemposP = claves.map((p, i) => (i === 5 ? en("está", 2) : i === 1 ? en("está", 1) : en(p)));
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#3a2a6e" a="#0b0b26" escarcha={0.2} />
      <Rotulo f={f} inicio={0} texto="LOS MÉDICOS DICEN" y={300} tam={64} color={HIELO} />
      <Tarjeta f={f} inicio={tn - 6} x={540} y={900} ancho={940} alto={760} fondo="rgba(255,255,255,0.96)" borde={AMARILLO}>
        <div style={{ position: "absolute", left: 30, top: -40, fontSize: 260, color: AMARILLO, fontFamily: "Georgia, serif", fontWeight: 900 }}>“</div>
        <div style={{ position: "absolute", left: 60, right: 60, top: 120, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 88, lineHeight: 1.15, color: "#0b1a36" }}>
          {palabras.map((p, i) => (
            <span key={i} style={{ opacity: f >= tiemposP[i] ? 1 : 0.12, marginRight: 22, display: "inline-block" }}>
              {p}
            </span>
          ))}
          <div
            style={{
              display: "inline-block",
              marginTop: 18,
              padding: "6px 26px",
              borderRadius: 20,
              background: f >= tc ? "#ff5a2e" : "transparent",
              color: f >= tc ? "#fff" : "#0b1a36",
              opacity: f >= tc ? 1 : 0.12,
              transform: `scale(${f >= tc ? muelle(f, tc, 8) : 1})`,
            }}
          >
            CALIENTE Y MUERTO
          </div>
        </div>
      </Tarjeta>
      <Monitor f={f} x={110} y={1330} ancho={560} alto={180} caos={0} plano={1 - tramo(f, tc, tc + 15)} color={VERDE} texto={f > tc ? "♥" : ""} />
    </AbsoluteFill>
  );
};

// ---------- 20 · ¿y tú, cuánto aguantarías? ----------
const final: Fabrica = ({ dur, en }) => ({ f }) => {
  const te = en("Escríbelo");
  const ts = en("sígueme");
  const texto = "Yo aguanto 5 minutos 🥶";
  const n = Math.floor(interpolate(f, [te, te + 40], [0, texto.length], clamp));
  const pulsa = f > ts + 8;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1d58a0" escarcha={0.4} />
      <Rotulo f={f} inicio={0} texto={"¿Y TÚ,\nCUÁNTO\nAGUANTARÍAS?"} y={260} tam={118} color="#fff" />
      <Termometro x={180} y={760} alto={420} temp={interpolate(f, [0, dur], [5, -30], clamp)} min={-40} max={20} escala={0.85} />
      <Tarjeta f={f} inicio={te - 4} x={600} y={1000} ancho={760} alto={220} fondo="#fff" borde="#d6e4f5">
        <div style={{ position: "absolute", left: 30, top: 24, width: 80, height: 80, borderRadius: 40, background: "linear-gradient(135deg,#5fd4ff,#3b5bff)" }} />
        <div style={{ position: "absolute", left: 132, top: 22, fontFamily: SANS, fontWeight: 900, fontSize: 34, color: "#5a6b80" }}>tú</div>
        <div style={{ position: "absolute", left: 132, top: 70, right: 24, fontFamily: SANS, fontWeight: 900, fontSize: 48, color: "#0b1a36", whiteSpace: "nowrap" }}>
          {texto.slice(0, n)}
          <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span>
        </div>
      </Tarjeta>
      <Rotulo f={f} inicio={te} texto="COMENTA" x={600} y={1160} tam={56} color={AMARILLO} />
      {f > ts && (
        <div
          style={{
            position: "absolute",
            left: 330,
            top: 1300,
            width: 420,
            height: 130,
            borderRadius: 65,
            background: pulsa ? "#2a3550" : ROJO,
            transform: `translateX(-50%) scale(${muelle(f, ts, 9) * (f > ts + 6 && f < ts + 12 ? 0.9 : 1)})`,
            textAlign: "center",
            lineHeight: "130px",
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 60,
            color: "#fff",
            boxShadow: "0 14px 34px rgba(0,0,0,0.5)",
          }}
        >
          {pulsa ? "SIGUIENDO ✓" : "SEGUIR"}
        </div>
      )}
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, Fabrica | null> = {
  gancho: null,
  cuerpo,
  hipotermia,
  temblor,
  confusion,
  corazon,
  regla,
  minuto,
  diez,
  hora,
  agua,
  viento,
  ropa,
  desvestir,
  refugio,
  seco,
  alcohol,
  anna,
  medicos,
  final,
};

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>, conGancho3D = true): Record<Ilustracion, Dibujo> =>
  Object.fromEntries(
    (Object.keys(FABRICAS) as Ilustracion[]).map((k) => {
      if (k === "gancho") {
        const e = esc.gancho;
        const D: Dibujo = ({ f }) => <Gancho3D f={f} dur={e.dur} en={e.en} con3D={conGancho3D} />;
        return [k, D];
      }
      return [k, (FABRICAS[k] as Fabrica)(esc[k])];
    }),
  ) as Record<Ilustracion, Dibujo>;


