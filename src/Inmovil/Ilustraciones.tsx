// Una ilustración por frase. Cada elemento entra en la palabra que lo nombra (en("palabra")).
// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1420) y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { Dibujo } from "../comun/tipos";
import { AMARILLO, clamp, Cronometro, Cuenta, H, Marca, muelle, ROJO, Rotulo, SANS, Sello, Tarjeta, tramo, Tu, VERDE, W } from "../Frio/Piezas";
import { Astronautas3D } from "./Astronautas3D";
import type { Escenario, Ilustracion } from "./escenas";

type Fabrica = (e: Escenario) => Dibujo;
const CORAL = "#ff6b5b";
const MENTA = "#7ff2d0";

// ---------- fondo: degradado de hospital de noche con motas de luz ----------
export const Fondo: React.FC<{ f: number; de?: string; a?: string; tinte?: string }> = ({ f, de = "#13506a", a = "#04131f", tinte }) => (
  <>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${de} 0%, ${a} 82%)` }} />
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 16 }, (_, i) => {
        const r = 30 + random(`b${i}`) * 90;
        const x = random(`x${i}`) * W + Math.sin(f / 70 + i) * 40;
        const y = ((random(`y${i}`) * H - f * (0.4 + random(`v${i}`) * 0.8)) % H + H) % H;
        return <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? MENTA : "#fff"} opacity={0.05 + random(`o${i}`) * 0.06} />;
      })}
    </svg>
    {tinte && <AbsoluteFill style={{ background: tinte }} />}
  </>
);

// ---------- cama con alguien tumbado (cabeza a la izquierda) ----------
// (x, y): esquina izquierda del colchón; el durmiente tiene los pies en x + ancho - 70.
const Cama: React.FC<{ x: number; y: number; ancho: number; children?: React.ReactNode; manta?: number; colorManta?: string }> = ({ x, y, ancho, children, manta = 0.55, colorManta = "#4a7fd6" }) => (
  <>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <rect x={x - 40} y={y - 170} width={44} height={330} rx={18} fill="#c98a5a" />
      <rect x={x + ancho - 10} y={y - 40} width={40} height={200} rx={16} fill="#c98a5a" />
      <rect x={x} y={y} width={ancho} height={90} rx={30} fill="#eef3f8" />
      <rect x={x} y={y + 70} width={ancho} height={56} rx={20} fill="#a86f45" />
      <rect x={x + 10} y={y - 70} width={190} height={80} rx={36} fill="#ffffff" stroke="#d5e2ee" strokeWidth={6} />
    </svg>
    {children}
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <path d={`M ${x + ancho * (1 - manta)} ${y - 60} Q ${x + ancho * (1 - manta / 2)} ${y - 100} ${x + ancho - 20} ${y - 70} L ${x + ancho} ${y + 60} L ${x + ancho * (1 - manta) - 30} ${y + 60} Z`} fill={colorManta} />
      <path d={`M ${x + ancho * (1 - manta) + 20} ${y - 30} L ${x + ancho - 30} ${y - 40}`} stroke="rgba(255,255,255,0.35)" strokeWidth={10} strokeLinecap="round" />
    </svg>
  </>
);

// alguien tumbado: los pies en (x, y), la cabeza hacia la izquierda
const Tumbado: React.FC<{ f: number; x: number; y: number; escala?: number; acciones?: Parameters<typeof Tu>[0]["acciones"]; cara?: Parameters<typeof Tu>[0]["cara"] }> = ({ f, x, y, escala = 0.8, acciones = [[0, "reposo"]], cara = "serio" }) => (
  <Tu f={f} x={x} y={y} escala={escala} acciones={acciones} giro={-90} cara={cara} />
);

const Texto: React.FC<{ x: number; y: number; tam: number; color?: string; children: React.ReactNode; centro?: boolean; peso?: number }> = ({ x, y, tam, color = "#fff", children, centro = true, peso = 900 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: centro ? "translate(-50%, -50%)" : undefined, fontFamily: SANS, fontWeight: peso, fontSize: tam, color, whiteSpace: "pre", textAlign: "center", lineHeight: 1.05, textShadow: "0 6px 18px rgba(0,0,0,0.6)" }}>
    {children}
  </div>
);

// calendario de pared que pasa hojas: día n
const Calendario: React.FC<{ f: number; inicio: number; x: number; y: number; dia: number; tam?: number }> = ({ f, inicio, x, y, dia, tam = 1 }) => {
  if (f < inicio) return null;
  const s = muelle(f, inicio, 10);
  const ancho = 300 * tam;
  return (
    <div style={{ position: "absolute", left: x - ancho / 2, top: y, width: ancho, transform: `scale(${s}) rotate(-4deg)`, borderRadius: 26, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,0.5)", background: "#fff" }}>
      <div style={{ background: CORAL, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 46 * tam, textAlign: "center", padding: `${10 * tam}px 0` }}>DÍA</div>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 170 * tam, color: "#10283a", textAlign: "center", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{Math.max(1, Math.round(dia))}</div>
    </div>
  );
};

// barra de progreso con etiqueta
const Barra: React.FC<{ x: number; y: number; ancho: number; valor: number; color: string; etiqueta?: string }> = ({ x, y, ancho, valor, color, etiqueta }) => (
  <div style={{ position: "absolute", left: x, top: y, width: ancho }}>
    {etiqueta && <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 42, color: "#dff6ff", marginBottom: 10 }}>{etiqueta}</div>}
    <div style={{ height: 70, borderRadius: 35, background: "rgba(255,255,255,0.15)", border: "5px solid rgba(255,255,255,0.5)", overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(1, valor)) * 100}%`, height: "100%", background: color, borderRadius: 35 }} />
    </div>
  </div>
);

// ---------- 3 · dos horas: la presión daña la piel ----------
const piel: Fabrica = ({ en }) => ({ f }) => {
  const t2 = en("dos");
  const tp = en("presión");
  const tpi = en("piel:");
  const th = en("hospitales");
  const tg = en("giran");
  const vuelta = interpolate(f, [0, t2 + 12], [0, 2 / 12], clamp);
  const pies = 830;
  const yEje = 1170;
  const puntos: [number, string][] = [
    [pies - 20, "TALONES"],
    [pies - 300, "CADERA"],
    [pies - 470, "ESPALDA"],
    [pies - 560, "NUCA"],
  ];
  const giro = tramo(f, tg, tg + 14);
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Cronometro x={280} y={690} r={170} vuelta={vuelta} color={CORAL} lleno={vuelta} />
      <Rotulo f={f} inicio={t2} texto={"2\nHORAS"} x={700} y={560} tam={130} color={AMARILLO} />
      <Cama x={170} y={1240} ancho={720} manta={0.35}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${-giro * 30}px) rotate(${giro * -6}deg)`, transformOrigin: "540px 1170px" }}>
          <Tumbado f={f} x={pies} y={yEje} escala={0.78} cara={f > tpi ? "preocupado" : "serio"} />
        </div>
      </Cama>
      {f > tp &&
        puntos.map(([px], i) => {
          const s = muelle(f, tp + i * 4, 9);
          const brillo = 0.6 + Math.sin(f / 4 + i) * 0.4;
          return (
            <svg key={i} width={W} height={H} style={{ position: "absolute", inset: 0 }}>
              <circle cx={px} cy={yEje + 60} r={46 * s} fill={ROJO} opacity={0.35 * brillo} />
              <circle cx={px} cy={yEje + 60} r={22 * s} fill={ROJO} opacity={0.9} />
            </svg>
          );
        })}
      <Rotulo f={f} inicio={tpi} texto="PIEL DAÑADA" x={420} y={950} tam={66} fondo={ROJO} color="#fff" giro={-3} />
      <Tarjeta f={f} inicio={th} x={380} y={1560} ancho={640} alto={200} fondo="#ffffff" borde="#bfe9ff">
        <div style={{ position: "absolute", left: 26, top: 18, fontFamily: SANS, fontWeight: 900, fontSize: 40, color: "#2b6cd9" }}>EN EL HOSPITAL</div>
        <div style={{ position: "absolute", left: 26, top: 80, fontFamily: SANS, fontWeight: 900, fontSize: 50, color: "#10283a", whiteSpace: "nowrap" }}>{f > tg ? "↻ GIRAN AL PACIENTE" : "…"}</div>
      </Tarjeta>
    </AbsoluteFill>
  );
};

// ---------- 4 · la sangre pierde líquido ----------
const sangre: Fabrica = ({ en }) => ({ f }) => {
  const tpo = en("pocos");
  const ts = en("sangre");
  const t10 = en("10");
  const tl = en("líquido.");
  const nivel = interpolate(f, [t10 - 6, t10 + 14], [1, 0.9], clamp);
  const x = 330;
  const y = 600;
  const ancho = 340;
  const alto = 640;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#5a1630" a="#12040b" />
      <Rotulo f={f} inicio={tpo} texto="EN POCOS DÍAS" x={540} y={450} tam={64} color="#ffd6dc" />
      {f > ts - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, ts - 4, 10)})`, transformOrigin: `${x}px ${y + alto / 2}px` }}>
          <rect x={x - 20} y={y - 70} width={40} height={70} rx={10} fill="#dfe8f2" />
          <rect x={x - ancho / 2} y={y} width={ancho} height={alto} rx={60} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth={10} />
          <clipPath id="bolsa">
            <rect x={x - ancho / 2 + 10} y={y + 10} width={ancho - 20} height={alto - 20} rx={52} />
          </clipPath>
          <g clipPath="url(#bolsa)">
            <rect x={x - ancho / 2} y={y + alto * (1 - nivel * 0.92)} width={ancho} height={alto} fill="#d3123a" />
            <path d={`M ${x - ancho / 2} ${y + alto * (1 - nivel * 0.92)} q ${ancho / 4} ${Math.sin(f / 5) * 18} ${ancho / 2} 0 t ${ancho / 2} 0 V ${y + alto + 20} H ${x - ancho / 2} Z`} fill="#e8264d" />
          </g>
          {[0.25, 0.5, 0.75].map((m) => (
            <line key={m} x1={x + ancho / 2 - 70} x2={x + ancho / 2 - 20} y1={y + alto * m} y2={y + alto * m} stroke="#fff" strokeWidth={6} />
          ))}
          <line x1={x} y1={y + alto} x2={x} y2={y + alto + 260} stroke="#fff" strokeWidth={12} />
          {f > t10 &&
            [0, 1, 2].map((k) => {
              const ciclo = ((f - t10) + k * 12) % 36;
              return <circle key={k} cx={x} cy={y + alto + 280 + ciclo * 7} r={16} fill="#e8264d" opacity={1 - ciclo / 36} />;
            })}
        </svg>
      )}
      <Cuenta f={f} a={t10 - 6} b={t10 + 14} desde={100} hasta={90} sufijo="%" x={760} y={760} tam={150} color="#fff" />
      <Rotulo f={f} inicio={t10} texto="−10%" x={740} y={980} tam={130} color={ROJO} fondo="#fff" giro={-5} />
      <Rotulo f={f} inicio={tl} texto={"DE SU\nLÍQUIDO"} x={760} y={1220} tam={64} color="#ffd6dc" />
    </AbsoluteFill>
  );
};

// ---------- 4 · al levantarte, mareo ----------
const mareo: Fabrica = ({ en }) => ({ f }) => {
  const tl = en("levantarte,");
  const tm = en("mareas.");
  const giro = f > tm ? Math.sin(f / 5) * 5 * tramo(f, tm, tm + 8) : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Cama x={170} y={1500} ancho={600} manta={0.4} />
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${giro}deg)`, transformOrigin: "460px 1300px" }}>
        <Tu f={f} x={460} y={1720} escala={1.0} acciones={[[0, "reposo"], [tl, "andar"], [tm, "sorpresa"]]} cara={f > tm ? "preocupado" : "serio"} />
      </div>
      {f > tm &&
        [0, 1, 2, 3, 4].map((k) => {
          const a = f / 7 + (k * Math.PI * 2) / 5;
          return <Texto key={k} x={460 + Math.cos(a) * 190} y={1040 + Math.sin(a) * 50} tam={64} color={AMARILLO}>★</Texto>;
        })}
      <Rotulo f={f} inicio={tl} texto="AL LEVANTARTE…" x={540} y={520} tam={78} color="#dff6ff" />
      <Rotulo f={f} inicio={tm} texto="¡MAREO!" x={540} y={660} tam={130} color={AMARILLO} giro={-5} />
    </AbsoluteFill>
  );
};

// ---------- 7 · las piernas se derriten: −1 kg en 10 días ----------
const piernas: Fabrica = ({ en }) => ({ f }) => {
  const tp = en("piernas");
  const td = en("derriten:");
  const t10 = en("diez");
  const tma = en("mayores");
  const tk = en("kilo");
  const encoge = interpolate(f, [td, tk + 10], [1, 0.72], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      {f > tp - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tp - 4, 10)})`, transformOrigin: "330px 1100px" }}>
          <path d="M 250 560 L 430 560 L 410 1100 L 400 1560 L 290 1560 L 270 1100 Z" fill="#f0bf98" />
          <g transform={`translate(340 0) scale(${encoge} 1) translate(-340 0)`}>
            <path d="M 240 600 Q 200 820 270 1060 L 410 1060 Q 480 820 440 600 Z" fill="#e8586a" />
            <path d="M 280 1140 Q 250 1300 300 1440 L 380 1440 Q 430 1300 400 1140 Z" fill="#e8586a" />
          </g>
          {f > td &&
            [0, 1, 2].map((k) => {
              const c = ((f - td) + k * 14) % 42;
              return <ellipse key={k} cx={250 + k * 90} cy={1080 + c * 9} rx={14} ry={22} fill="#e8586a" opacity={1 - c / 42} />;
            })}
        </svg>
      )}
      <Rotulo f={f} inicio={td} texto="SE DERRITEN" x={330} y={460} tam={72} fondo={CORAL} color="#fff" giro={-3} />
      <Calendario f={f} inicio={t10 - 6} x={760} y={540} dia={interpolate(f, [t10 - 6, t10 + 10], [1, 10], clamp)} tam={0.8} />
      <Rotulo f={f} inicio={tma} texto={"PERSONAS\nMAYORES"} x={760} y={930} tam={52} color="#dff6ff" />
      {f > tk - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tk - 4, 9)})`, transformOrigin: "760px 1250px" }}>
          <rect x={600} y={1130} width={320} height={230} rx={40} fill="#eef3f8" />
          <rect x={650} y={1160} width={220} height={90} rx={16} fill="#10283a" />
        </svg>
      )}
      {f > tk - 4 && <Cuenta f={f} a={tk - 4} b={tk + 10} desde={0} hasta={-1} decimales={1} sufijo=" kg" x={760} y={1168} tam={48} color={MENTA} />}
      <Rotulo f={f} inicio={tk} texto="−1 KILO" x={760} y={1380} tam={84} color={ROJO} fondo="#fff" giro={4} />
    </AbsoluteFill>
  );
};

// ---------- 10 · los huesos pierden calcio como un astronauta ----------
const huesos: Fabrica = ({ en, dur }) => ({ f }) => {
  const th = en("huesos");
  const tc = en("calcio,");
  const ta = en("astronauta.");
  const agujeros = interpolate(f, [tc, dur], [0, 26], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#24344f" a="#060a14" />
      {f > th - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `rotate(-30deg) scale(${muelle(f, th - 4, 10)})`, transformOrigin: "420px 950px" }}>
          <path d="M 420 640 Q 360 560 300 600 Q 240 650 300 700 Q 250 760 320 790 Q 370 800 390 760 L 390 1140 Q 370 1100 320 1110 Q 250 1140 300 1200 Q 240 1250 300 1300 Q 360 1340 420 1260 Q 480 1340 540 1300 Q 600 1250 540 1200 Q 590 1140 520 1110 Q 470 1100 450 1140 L 450 760 Q 470 800 520 790 Q 590 760 540 700 Q 600 650 540 600 Q 480 560 420 640 Z" fill="#f4ecd8" stroke="#d8cdb2" strokeWidth={8} />
          {Array.from({ length: Math.floor(agujeros) }, (_, i) => (
            <ellipse key={i} cx={398 + random(`h${i}`) * 44} cy={720 + random(`k${i}`) * 520} rx={6 + random(`r${i}`) * 9} ry={4 + random(`s${i}`) * 7} fill="#b8ab8c" />
          ))}
        </svg>
      )}
      <Rotulo f={f} inicio={tc} texto="PIERDEN CALCIO" x={420} y={470} tam={72} fondo="#f4ecd8" color="#4a3b1a" giro={-3} />
      {f > ta - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, ta - 4, 9)})`, transformOrigin: "820px 820px" }}>
          <circle cx={820} cy={820} r={150} fill="#f2f4f7" />
          <rect x={720} y={760} width={200} height={120} rx={60} fill="#1b2a4a" />
          <path d="M 750 790 Q 790 770 830 790" stroke="rgba(255,255,255,0.5)" strokeWidth={12} fill="none" strokeLinecap="round" />
          <rect x={700} y={960} width={240} height={50} rx={20} fill="#d9dee6" />
        </svg>
      )}
      <Rotulo f={f} inicio={ta + 4} texto={"COMO UN\nASTRONAUTA"} x={840} y={1040} tam={44} color="#dff6ff" />
    </AbsoluteFill>
  );
};

// ---------- 11 · la sangre se estanca y forma coágulos ----------
const coagulos: Fabrica = ({ en }) => ({ f }) => {
  const tp = en("peligroso:");
  const te = en("estanca");
  const tpi = en("piernas");
  const tc = en("coágulos.");
  // posición acumulada de los glóbulos: van frenando hasta casi parar
  const vel = (t: number) => interpolate(t, [0, te, te + 25], [9, 9, 1.2], clamp);
  let avance = 0;
  for (let t = 0; t < f; t++) avance += vel(t);
  const alarma = f > tp ? (Math.sin(f / 3) + 1) / 2 : 0;
  const juntar = tramo(f, tc - 6, tc + 14);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#3d0d1c" a="#0c0206" tinte={`rgba(255,30,60,${alarma * 0.12})`} />
      <Rotulo f={f} inicio={tp} texto="LO MÁS PELIGROSO" x={540} y={450} tam={70} color={AMARILLO} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={-40} y={820} width={W + 80} height={300} rx={150} fill="#7a1028" stroke="#ff8fa3" strokeWidth={10} />
        {Array.from({ length: 22 }, (_, i) => {
          const base = ((random(`g${i}`) * (W + 300) + avance) % (W + 300)) - 150;
          const yy = 880 + random(`gy${i}`) * 180;
          const cx = interpolate(juntar, [0, 1], [base, 540 + (random(`cx${i}`) - 0.5) * 220]);
          const cy = interpolate(juntar, [0, 1], [yy, 970 + (random(`cy${i}`) - 0.5) * 120]);
          return (
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx={42} ry={28} fill="#e8264d" />
              <ellipse cx={cx} cy={cy} rx={18} ry={10} fill="#b5102f" />
            </g>
          );
        })}
        {juntar > 0.6 && <circle cx={540} cy={970} r={150 * juntar} fill="none" stroke={AMARILLO} strokeWidth={10} strokeDasharray="20 16" />}
      </svg>
      <Rotulo f={f} inicio={te} texto="SE ESTANCA" x={300} y={1200} tam={64} fondo="#fff" color="#a30f2d" giro={-3} />
      <Rotulo f={f} inicio={tpi} texto="EN LAS PIERNAS" x={330} y={1330} tam={48} color="#ffd6dc" />
      <Sello f={f} inicio={tc} x={540} y={680} texto="COÁGULOS" tam={88} giro={-6} />
    </AbsoluteFill>
  );
};

// ---------- 12 · Dallas, 1966: cinco jóvenes, tres semanas en cama ----------
const dallas: Fabrica = ({ en }) => ({ f }) => {
  const t66 = en("1966,");
  const t5 = en("cinco");
  const ts = en("sanos");
  const t3 = en("tres");
  const tc = en("cama");
  const td = en("Dallas.");
  const tumbar = tramo(f, tc, tc + 14);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#5a4a2a" a="#120d05" />
      <Tarjeta f={f} inicio={t66 - 4} x={540} y={600} ancho={760} alto={260} fondo="#f3e6c8" borde="#c9b07a" giro={-2}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 22, textAlign: "center", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 54, color: "#3b2a10" }}>ESTUDIO DE REPOSO</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 100, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 110, color: "#8a2b14" }}>{f > td ? "DALLAS · 1966" : "1966"}</div>
      </Tarjeta>
      {[0, 1, 2, 3, 4].map((k) => {
        const ini = t5 + k * 3;
        if (f < ini) return null;
        const x = interpolate(tumbar, [0, 1], [150 + k * 150, 640]);
        const y = interpolate(tumbar, [0, 1], [1300, 930 + k * 95]);
        return (
          <div key={k} style={{ position: "absolute", inset: 0, opacity: Math.min(1, muelle(f, ini, 10) * 1.4) }}>
            <div style={{ position: "absolute", inset: 0, transform: `rotate(${-90 * tumbar}deg)`, transformOrigin: `${x}px ${y}px` }}>
              <Tu f={f + k * 7} x={x} y={y} escala={0.4} acciones={[[0, "reposo"], [ts, "contento"], [tc, "reposo"]]} cara={f > tc ? "serio" : "feliz"} />
            </div>
          </div>
        );
      })}
      {f > ts && <Marca f={f} inicio={ts} x={880} y={1080} tam={120} tipo="ok" />}
      <Rotulo f={f} inicio={ts} texto="SANOS" x={880} y={1170} tam={52} color={VERDE} />
      <Rotulo f={f} inicio={t3} texto="3 SEMANAS EN CAMA" x={450} y={1400} tam={64} fondo="#fff" color="#10283a" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 13 · peor que 30 años de edad ----------
const edad: Fabrica = ({ en }) => ({ f }) => {
  const tf = en("forma");
  const tc = en("cayó");
  const t30 = en("treinta");
  const te = en("edad");
  const td = en("daño.");
  // forma física (consumo máximo de oxígeno): −27 % tras 3 semanas en cama; −11 % a los 50 años (McGuire et al., 2001)
  const barras: [string, number, number, string][] = [
    ["ANTES", 1, tf, VERDE],
    ["3 SEMANAS\nEN CAMA", 0.73, tc, ROJO],
    ["30 AÑOS\nDESPUÉS", 0.89, t30, AMARILLO],
  ];
  const base = 1300;
  const altoMax = 640;
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Rotulo f={f} inicio={tf - 4} texto="FORMA FÍSICA" x={540} y={460} tam={80} color="#dff6ff" />
      {barras.map(([etiqueta, v, ini, color], i) => {
        const p = tramo(f, ini, ini + 14);
        const x = 180 + i * 250;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x, top: base - altoMax * v * p, width: 190, height: altoMax * v * p, borderRadius: "24px 24px 0 0", background: color, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }} />
            {f > ini && <Texto x={x + 95} y={base + 70} tam={34} color="#fff">{etiqueta}</Texto>}
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 150, top: base, width: 780, height: 8, background: "#fff", borderRadius: 4 }} />
      {f > te && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={`M 775 ${base - altoMax * 0.89 - 30} Q 650 ${base - altoMax - 60} 525 ${base - altoMax * 0.73 - 30}`} stroke="#fff" strokeWidth={10} fill="none" strokeDasharray="22 16" strokeDashoffset={-f * 2} />
        </svg>
      )}
      <Sello f={f} inicio={td} x={540} y={880} texto={"¡PEOR QUE\n30 AÑOS!"} tam={74} giro={-6} />
    </AbsoluteFill>
  );
};

// ---------- 17 · la buena noticia: casi todo vuelve ----------
const vuelve: Fabrica = ({ en, dur }) => ({ f }) => {
  const tb = en("buena");
  const tv = en("vuelve.");
  const td = en("ellos");
  const t8 = en("ocho");
  const te = en("entrenamiento.");
  const valor = interpolate(f, [tv, dur - 6], [0.3, 1], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#13603a" a="#03140b" />
      <Rotulo f={f} inicio={tb - 4} texto="LA BUENA NOTICIA" x={540} y={460} tam={74} color={VERDE} />
      <Barra x={140} y={640} ancho={800} valor={valor} color={VERDE} etiqueta={f > tv ? "RECUPERACIÓN" : " "} />
      <Rotulo f={f} inicio={tv} texto="CASI TODO VUELVE" x={540} y={830} tam={66} fondo="#fff" color="#0b4d2a" giro={-2} />
      <Calendario f={f} inicio={td} x={760} y={980} dia={interpolate(f, [t8 - 8, t8 + 12], [1, 56], clamp)} tam={0.75} />
      <Rotulo f={f} inicio={t8} texto="8 SEMANAS" x={760} y={1330} tam={64} color={AMARILLO} />
      <Tu f={f} x={320} y={1720} escala={0.85} acciones={[[0, "andar"], [te, "celebrar"]]} cara={f > te ? "euforico" : "feliz"} />
    </AbsoluteFill>
  );
};

// ---------- 18 · final: ¿cuántas horas pasas sentado? ----------
const final: Fabrica = ({ en }) => ({ f }) => {
  const te = en("Escríbelo");
  const ts = en("sígueme");
  const texto = "Unas 8 horas…";
  const n = Math.floor(interpolate(f, [te, te + 26], [0, texto.length], clamp));
  const pulsa = f > ts + 8;
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Rotulo f={f} inicio={0} texto={"¿CUÁNTAS HORAS\nPASAS SENTADO\nAL DÍA?"} y={240} tam={104} color="#fff" />
      <Tarjeta f={f} inicio={te - 4} x={520} y={1000} ancho={800} alto={220} fondo="#fff" borde="#d6e4f5">
        <div style={{ position: "absolute", left: 30, top: 24, width: 80, height: 80, borderRadius: 40, background: `linear-gradient(135deg, ${MENTA}, #2b6cd9)` }} />
        <div style={{ position: "absolute", left: 132, top: 22, fontFamily: SANS, fontWeight: 900, fontSize: 34, color: "#5a6b80" }}>tú</div>
        <div style={{ position: "absolute", left: 132, top: 70, right: 24, fontFamily: SANS, fontWeight: 900, fontSize: 52, color: "#0b1a36", whiteSpace: "nowrap" }}>
          {texto.slice(0, n)}
          <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span>
        </div>
      </Tarjeta>
      <Rotulo f={f} inicio={te} texto="COMENTA" x={520} y={1160} tam={56} color={AMARILLO} />
      {f > ts && (
        <div
          style={{
            position: "absolute",
            left: 360,
            top: 1300,
            width: 440,
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

// ---------- 1 · gancho: tumbado mientras pasan los días ----------
const gancho: Fabrica = ({ en, dur }) => ({ f }) => {
  const tc = en("cuerpo");
  const tm = en("mueves");
  const tme = en("mes?");
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#175a78" />
      <Rotulo f={f} inicio={0} texto={"¿QUÉ LE PASA\nA TU CUERPO"} y={250} tam={112} color="#fff" />
      <Rotulo f={f} inicio={tm - 2} texto="SI NO TE MUEVES" y={540} tam={88} color={CORAL} giro={-2} />
      <Rotulo f={f} inicio={tme} texto="EN UN MES?" y={670} tam={72} fondo="#fff" color="#10283a" />
      <Calendario f={f} inicio={tc} x={250} y={820} dia={interpolate(f, [tm, dur], [1, 30], clamp)} tam={0.75} />
      <Cama x={170} y={1290} ancho={720}>
        <Tumbado f={f} x={820} y={1225} escala={0.78} cara={f > tme ? "preocupado" : "serio"} />
      </Cama>
      <Sello f={f} inicio={tme + 4} x={740} y={960} texto="30 DÍAS" color={CORAL} tam={76} giro={8} />
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, Fabrica | null> = {
  gancho,
  piel,
  sangre,
  mareo,
  piernas,
  huesos,
  astronautas: null,
  coagulos,
  dallas,
  edad,
  vuelve,
  final,
};

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>, con3D = true): Record<Ilustracion, Dibujo> =>
  Object.fromEntries(
    (Object.keys(FABRICAS) as Ilustracion[]).map((k) => {
      if (k === "astronautas") {
        const e = esc.astronautas;
        const D: Dibujo = ({ f }) => <Astronautas3D f={f} dur={e.dur} en={e.en} con3D={con3D} />;
        return [k, D];
      }
      return [k, (FABRICAS[k] as Fabrica)(esc[k])];
    }),
  ) as Record<Ilustracion, Dibujo>;
