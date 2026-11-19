// Una ilustración por frase. Cada elemento entra en la palabra que lo nombra (en("palabra")).
// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1420) y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random } from "remotion";
import { Dibujo } from "../comun/tipos";
import { AMARILLO, clamp, Cronometro, Cuenta, H, Marca, Monitor, muelle, ROJO, Rotulo, SANS, Sello, Tarjeta, tramo, Tu, VERDE, W } from "../Frio/Piezas";
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

// corazón dibujado
const Corazon: React.FC<{ x: number; y: number; tam: number; color?: string; latido?: number }> = ({ x, y, tam, color = ROJO, latido = 0 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <g transform={`translate(${x} ${y}) scale(${(tam / 200) * (1 + latido * 0.08)})`} style={{ filter: `drop-shadow(0 0 30px ${color})` }}>
      <path d="M 0 70 C -140 -10 -120 -150 -40 -140 C -10 -136 0 -110 0 -90 C 0 -110 10 -136 40 -140 C 120 -150 140 -10 0 70 Z" transform="scale(1.4)" fill={color} />
      <path d="M -90 -120 Q -120 -80 -100 -40" stroke="rgba(255,255,255,0.45)" strokeWidth={16} fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

// ---------- 2 · un mes tumbado ----------
const mes: Fabrica = ({ en }) => ({ f }) => {
  const tm = en("mes");
  const tl = en("levantarte.");
  const tc = en("cambia");
  const td = en("día.");
  const llenos = Math.floor(interpolate(f, [tm, td], [0, 30], clamp));
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <Tarjeta f={f} inicio={tm - 4} x={540} y={720} ancho={860} alto={520} fondo="#ffffff" borde="#ffd0c8">
        <div style={{ background: CORAL, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 52, textAlign: "center", padding: "10px 0" }}>30 DÍAS EN LA CAMA</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 10, padding: 22 }}>
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} style={{ height: 112, borderRadius: 14, background: i < llenos ? "#ffe3de" : "#eef3f8", position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 30, color: "#5b6b7c", textAlign: "center", lineHeight: "112px" }}>
              {i + 1}
              {i < llenos && <div style={{ position: "absolute", inset: 0, color: ROJO, fontSize: 84, lineHeight: "104px" }}>×</div>}
            </div>
          ))}
        </div>
      </Tarjeta>
      <Cama x={170} y={1250} ancho={720}>
        <Tumbado f={f} x={820} y={1185} escala={0.78} cara={f > tc ? "preocupado" : "serio"} />
      </Cama>
      <Rotulo f={f} inicio={tl} texto="SIN LEVANTARTE" x={430} y={1460} tam={70} fondo="#fff" color="#10283a" giro={-3} />
      <Rotulo f={f} inicio={tc} texto={"CAMBIA DESDE\nEL DÍA 1"} x={380} y={1590} tam={60} color={AMARILLO} />
    </AbsoluteFill>
  );
};

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

// ---------- 5 · al levantarte, mareo ----------
const mareo: Fabrica = ({ en }) => ({ f }) => {
  const tl = en("levantarte,");
  const tm = en("mareas:");
  const tc = en("corazón");
  const ts = en("subir");
  const tca = en("cabeza.");
  const giro = f > tm ? Math.sin(f / 5) * 4 * tramo(f, tm, tm + 10) : 0;
  const flecha = tramo(f, ts - 4, ts + 14);
  const falla = f > tca ? Math.sin(f / 3) * 12 : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${giro}deg)`, transformOrigin: "420px 1300px" }}>
        <Tu f={f} x={420} y={1700} escala={1.05} acciones={[[0, "reposo"], [tl, "andar"], [tm, "sorpresa"]]} cara={f > tm ? "preocupado" : "serio"} />
      </div>
      {f > tm &&
        [0, 1, 2, 3, 4].map((k) => {
          const a = f / 8 + (k * Math.PI * 2) / 5;
          return <Texto key={k} x={420 + Math.cos(a) * 190} y={1000 + Math.sin(a) * 50} tam={64} color={AMARILLO}>★</Texto>;
        })}
      <Rotulo f={f} inicio={tm} texto="¡MAREO!" x={420} y={560} tam={120} color={AMARILLO} giro={-5} />
      {f > tc && <Corazon x={820} y={1250} tam={150} latido={(Math.sin(f / 3) + 1) / 2} />}
      {f > ts - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={`M 820 1150 Q ${860 + falla} 950 ${640 + falla} ${1150 - 260 * flecha}`} stroke="#ff4b6e" strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray="34 26" strokeDashoffset={-f * 3} opacity={0.95} />
        </svg>
      )}
      <Rotulo f={f} inicio={ts} texto={"LA SANGRE\nNO SUBE"} x={800} y={760} tam={58} fondo="#fff" color="#c0123a" giro={4} />
    </AbsoluteFill>
  );
};

// ---------- 6 · los músculos gastan peor el azúcar ----------
const azucar: Fabrica = ({ en }) => ({ f }) => {
  const t5 = en("cinco");
  const tm = en("músculos");
  const tp = en("peor");
  const ta = en("azúcar.");
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#4a2a6a" a="#0d0618" />
      <Calendario f={f} inicio={t5 - 6} x={250} y={470} dia={interpolate(f, [t5 - 6, t5 + 8], [1, 5], clamp)} tam={0.8} />
      {f > tm - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tm - 4, 10)})`, transformOrigin: "560px 1080px" }}>
          <ellipse cx={560} cy={1080} rx={300} ry={190} fill="#e8586a" />
          {[-120, -40, 40, 120].map((d) => (
            <path key={d} d={`M ${300} ${1080 + d} Q 560 ${1080 + d * 1.25} 820 ${1080 + d}`} stroke="#ff8f9c" strokeWidth={12} fill="none" />
          ))}
          <rect x={500} y={990} width={120} height={180} rx={20} fill="#2a1235" stroke="#fff" strokeWidth={8} />
          <circle cx={595} cy={1080} r={10} fill={AMARILLO} />
        </svg>
      )}
      <Texto x={560} y={1320} tam={52} color="#ffd1d8">{f > tm ? "MÚSCULO" : ""}</Texto>
      {f > ta - 10 &&
        [0, 1, 2, 3].map((k) => {
          const t = f - (ta - 10) - k * 5;
          if (t < 0) return null;
          const xx = 170 + Math.min(t, 18) * 18;
          const rebote = t > 18 ? (t - 18) * 7 : 0;
          return (
            <div key={k} style={{ position: "absolute", left: xx - rebote, top: 820 + k * 110 - (t > 18 ? Math.sin((t - 18) / 4) * 60 : 0), width: 90, height: 90, borderRadius: 16, background: "#fff", boxShadow: "inset -10px -10px 0 #dfe6ee, 0 10px 20px rgba(0,0,0,0.4)", transform: `rotate(${t * 6}deg)` }} />
          );
        })}
      <Rotulo f={f} inicio={ta} texto="AZÚCAR" x={240} y={1350} tam={64} color="#fff" />
      <Sello f={f} inicio={tp} x={700} y={640} texto="GASTA PEOR" tam={72} giro={6} />
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
      {f > tk - 4 && <Cuenta f={f} a={tk - 4} b={tk + 10} desde={0} hasta={-1} decimales={1} sufijo=" kg" x={760} y={1162} tam={58} color={MENTA} />}
      <Rotulo f={f} inicio={tk} texto="−1 KILO" x={760} y={1380} tam={84} color={ROJO} fondo="#fff" giro={4} />
    </AbsoluteFill>
  );
};

// ---------- 8 · la fuerza cae: hasta un 1 % al día ----------
const fuerza: Fabrica = ({ en, dur }) => ({ f }) => {
  const tf = en("fuerza");
  const tc = en("cae");
  const tr = en("rápido:");
  const t1 = en("uno");
  const caida = tramo(f, tc, tc + 12);
  const valor = interpolate(f, [tr, dur], [1, 0.74], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#3a3f12" a="#0b0c03" />
      {f > tf - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(540 ${760 + caida * 330}) rotate(${caida * 14})`} opacity={Math.min(1, muelle(f, tf - 4))}>
            <rect x={-300} y={-14} width={600} height={28} rx={14} fill="#c9d3dd" />
            {[-1, 1].map((s) => (
              <g key={s}>
                <rect x={s * 210 - 30} y={-110} width={60} height={220} rx={16} fill="#2a2f38" />
                <rect x={s * 270 - 26} y={-80} width={52} height={160} rx={14} fill="#3c4350" />
              </g>
            ))}
          </g>
        </svg>
      )}
      <Rotulo f={f} inicio={tf} texto="FUERZA" x={540} y={470} tam={110} color={AMARILLO} />
      <Barra x={150} y={1260} ancho={600} valor={valor} color={interpolateColors(valor, [0.74, 1], [ROJO, VERDE])} etiqueta="TU FUERZA" />
      <Rotulo f={f} inicio={t1} texto="−1% CADA DÍA" x={430} y={1450} tam={76} fondo={ROJO} color="#fff" giro={-3} />
    </AbsoluteFill>
  );
};

// ---------- 9 · el corazón se encoge ----------
const corazon: Fabrica = ({ en }) => ({ f }) => {
  const tc = en("corazón");
  const te = en("encoge,");
  const tb = en("bombea");
  const tm = en("menos");
  const tam = interpolate(f, [te, te + 18], [260, 200], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#4d1424" a="#10030a" />
      {f > tc - 4 && <Corazon x={540} y={820} tam={tam * muelle(f, tc - 4, 10)} latido={(Math.sin(f / 3.2) + 1) / 2} />}
      {f > te && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {[-1, 1].map((s) => (
            <path key={s} d={`M ${540 + s * 380} 820 l ${-s * 70} 0 m ${s * 30} -30 l ${-s * 30} 30 l ${s * 30} 30`} stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.6 + Math.sin(f / 4) * 0.3} />
          ))}
        </svg>
      )}
      <Rotulo f={f} inicio={te} texto="SE ENCOGE" x={540} y={1080} tam={84} fondo="#fff" color="#c0123a" giro={-3} />
      {f > tb - 4 && <Monitor f={f} x={110} y={1230} ancho={620} alto={220} caos={0} plano={interpolate(f, [tm, tm + 15], [0, 0.55], clamp)} texto="♥" />}
      <Rotulo f={f} inicio={tm} texto={"MENOS SANGRE\nPOR LATIDO"} x={420} y={1500} tam={56} color={AMARILLO} />
    </AbsoluteFill>
  );
};

// ---------- 10 · los huesos pierden calcio como un astronauta ----------
const huesos: Fabrica = ({ en }) => ({ f }) => {
  const th = en("huesos");
  const tc = en("calcio,");
  const ta = en("astronauta:");
  const t1 = en("uno");
  const agujeros = interpolate(f, [tc, t1 + 20], [0, 26], clamp);
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
      <Rotulo f={f} inicio={t1} texto="−1% AL MES" x={430} y={1420} tam={84} fondo={ROJO} color="#fff" giro={3} />
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

// ---------- 14 · mito: guardar cama si te duele la espalda ----------
const mito: Fabrica = ({ en }) => ({ f }) => {
  const tc = en("cama");
  const te = en("espalda?");
  const tm = en("mito:");
  const tmo = en("moverte");
  const ta = en("antes.");
  const ver = f > tmo ? tramo(f, tmo, tmo + 10) : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - ver * 0.55 }}>
        <Cama x={140} y={840} ancho={640} manta={0.5}>
          <Tumbado f={f} x={710} y={775} escala={0.7} cara={f > te ? "preocupado" : "serio"} />
        </Cama>
      </div>
      <Rotulo f={f} inicio={tc} texto="«GUARDA CAMA»" x={460} y={470} tam={74} fondo="#fff" color="#10283a" giro={-3} />
      {f > te && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M ${430 + k * 40} ${700 - (f - te) % 20} l 20 -30 l 20 30`} stroke={ROJO} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.8} />
          ))}
        </svg>
      )}
      <Sello f={f} inicio={tm} x={760} y={700} texto="MITO" tam={110} giro={-10} />
      {f > tmo && <Tu f={f} x={330} y={1720} escala={0.75} acciones={[[0, "andar"]]} cara="feliz" />}
      {f > tmo && <Marca f={f} inicio={tmo + 4} x={640} y={1300} tam={130} tipo="ok" />}
      <Rotulo f={f} inicio={tmo} texto="MOVERTE" x={640} y={1420} tam={64} color={VERDE} />
      <Rotulo f={f} inicio={ta} texto="TE RECUPERA ANTES" x={420} y={1000} tam={56} fondo={VERDE} color="#05301b" giro={2} />
    </AbsoluteFill>
  );
};

// pie que sube y baja desde el tobillo
const Pie: React.FC<{ x: number; y: number; ang: number }> = ({ x, y, ang }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <rect x={x - 40} y={y - 260} width={80} height={270} rx={36} fill="#f0bf98" />
    <g transform={`rotate(${ang} ${x} ${y})`}>
      <path d={`M ${x - 40} ${y - 30} L ${x + 150} ${y - 20} Q ${x + 200} ${y} ${x + 160} ${y + 40} L ${x - 50} ${y + 40} Z`} fill="#f0bf98" />
      <circle cx={x + 170} cy={y + 8} r={16} fill="#e9a982" />
    </g>
    <circle cx={x} cy={y} r={20} fill="none" stroke={AMARILLO} strokeWidth={6} />
  </svg>
);

// ---------- 15 · consejos: tobillos y caminar ----------
const consejos: Fabrica = ({ en }) => ({ f }) => {
  const tc = en("cama,");
  const tt = en("tobillos");
  const tl = en("levántate");
  const tca = en("caminar");
  const ang = f > tt ? Math.sin((f - tt) / 4) * 28 : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#0f5a4a" a="#03130f" />
      <Rotulo f={f} inicio={tc - 6} texto="SI ESTÁS EN CAMA" x={540} y={460} tam={66} color={MENTA} />
      <Tarjeta f={f} inicio={tt - 6} x={300} y={900} ancho={480} alto={560} fondo="rgba(4,30,24,0.85)" borde={MENTA}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 20, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 46, color: AMARILLO }}>1 · TOBILLOS</div>
      </Tarjeta>
      {f > tt - 2 && <Pie x={250} y={1020} ang={ang} />}
      <Tarjeta f={f} inicio={tl - 4} x={790} y={900} ancho={440} alto={560} fondo="rgba(4,30,24,0.85)" borde={MENTA}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 20, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 46, color: AMARILLO }}>2 · CAMINA</div>
      </Tarjeta>
      {f > tl && <Tu f={f} x={790} y={1160} escala={0.55} acciones={[[0, "reposo"], [tca, "andar"]]} cara="feliz" />}
      <Rotulo f={f} inicio={tca} texto="SIEMPRE QUE PUEDAS" x={430} y={1260} tam={56} fondo={MENTA} color="#03231c" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 17 · la buena noticia: casi todo vuelve ----------
const vuelve: Fabrica = ({ en, dur }) => ({ f }) => {
  const tb = en("buena");
  const tv = en("vuelve.");
  const td = en("Dallas");
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
  mes,
  piel,
  sangre,
  mareo,
  azucar,
  piernas,
  fuerza,
  corazon,
  huesos,
  coagulos,
  dallas,
  edad,
  mito,
  consejos,
  astronautas: null,
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
