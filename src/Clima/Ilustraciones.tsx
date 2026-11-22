// «La Tierra tiene fiebre»: planos a pantalla completa con cámara en movimiento (piezas de cine del desierto),
// calles, mar, hielo y laboratorio de datos: sin mapas ni globos (lo pidió el usuario), bandas de calentamiento y gráficas.
// Todo 2D. Cada elemento entra en la palabra que lo nombra (en("palabra")).
// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1420) y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random } from "remotion";
import { Dibujo } from "../comun/tipos";
import { Calima, Cine, mover, Opcion, Paisaje, Plano, T, temblor, Yo } from "../Desierto/Ilustraciones";
import { AMARILLO, clamp, Cuenta, H, muelle, ROJO, Rotulo, SANS, Sello, tramo, VERDE, W } from "../Frio/Piezas";
import type { Escenario, Ilustracion } from "./escenas";

type Fabrica = (e: Escenario) => Dibujo;

// número que cuenta con punto de miles (37.000, 60.000)
const Miles: React.FC<{ f: number; a: number; b: number; hasta: number; y: number; tam: number; color?: string; x?: number }> = ({ f, a, b, hasta, y, tam, color = "#fff", x = W / 2 }) => {
  if (f < a - 6) return null;
  const v = Math.round(interpolate(f, [a, b], [0, hasta], clamp));
  return (
    <div style={{ position: "absolute", left: x - 500, width: 1000, top: y, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: tam, color, fontVariantNumeric: "tabular-nums", textShadow: "0 10px 30px rgba(0,10,40,0.85)", transform: `scale(${0.6 + 0.4 * muelle(f, a - 6, 10)})` }}>
      {String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
    </div>
  );
};
const NARANJA = "#ff8a2b";
const AZUL = "#2b6cd9";

// color de una anomalía de temperatura (°C) al estilo de las «warming stripes»
const colorAnomalia = (a: number) => interpolateColors(a, [-0.6, -0.2, 0.25, 0.7, 1.15, 1.6], ["#08306b", "#4a90d0", "#f4f1ec", "#f4a582", "#d6604d", "#67000d"]);
// serie aproximada 1850–2024 (forma de las series de la OMM; los valores exactos varían según la base de datos)
const anomalia = (anio: number) => {
  const base = anio < 1910 ? -0.3 : anio < 1945 ? interpolate(anio, [1910, 1945], [-0.35, 0.0]) : anio < 1975 ? -0.05 : interpolate(anio, [1975, 2020, 2024], [-0.05, 1.2, 1.55]);
  return base + (random(`an${anio}`) - 0.5) * 0.28;
};

// ---------- calle en perspectiva (edificios a los lados, punto de fuga al centro) ----------
const Calle: React.FC<{ f: number; cielo: [string, string]; fachada: string; sombra: string; ventanas?: string }> = ({ f, cielo, fachada, sombra, ventanas = "#2a2f3a" }) => {
  const fuga: [number, number] = [540, 1050];
  const lado = (izq: boolean) =>
    Array.from({ length: 5 }, (_, i) => {
      const k0 = i / 5;
      const k1 = (i + 1) / 5;
      const xa = izq ? interpolate(k0, [0, 1], [-200, fuga[0] - 60]) : interpolate(k0, [0, 1], [W + 200, fuga[0] + 60]);
      const xb = izq ? interpolate(k1, [0, 1], [-200, fuga[0] - 60]) : interpolate(k1, [0, 1], [W + 200, fuga[0] + 60]);
      const topA = interpolate(k0, [0, 1], [-200, fuga[1] - 260]);
      const topB = interpolate(k1, [0, 1], [-200, fuga[1] - 260]);
      const baseA = interpolate(k0, [0, 1], [H + 200, fuga[1] + 40]);
      const baseB = interpolate(k1, [0, 1], [H + 200, fuga[1] + 40]);
      return (
        <g key={`${izq}${i}`}>
          <path d={`M ${xa} ${topA} L ${xb} ${topB} L ${xb} ${baseB} L ${xa} ${baseA} Z`} fill={i % 2 ? fachada : sombra} />
          {[0.25, 0.5, 0.75].map((v) => (
            <path
              key={v}
              d={`M ${xa + (xb - xa) * 0.25} ${topA + (baseA - topA) * (v - 0.08)} L ${xa + (xb - xa) * 0.7} ${topB + (baseB - topB) * (v - 0.08)} L ${xa + (xb - xa) * 0.7} ${topB + (baseB - topB) * v} L ${xa + (xb - xa) * 0.25} ${topA + (baseA - topA) * v} Z`}
              fill={ventanas}
            />
          ))}
        </g>
      );
    });
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(${cielo[0]} 0%, ${cielo[1]} 55%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d={`M -400 ${H} L ${fuga[0] - 40} ${fuga[1] + 40} L ${fuga[0] + 40} ${fuga[1] + 40} L ${W + 400} ${H} Z`} fill="#4a4440" />
        {Array.from({ length: 7 }, (_, i) => {
          const k = ((i / 7 + f / 160) % 1) ** 2;
          const y = interpolate(k, [0, 1], [fuga[1] + 50, H + 100]);
          const w = interpolate(k, [0, 1], [3, 40]);
          return <rect key={i} x={fuga[0] - w / 2} y={y} width={w} height={w * 4} fill="#f2e2b0" opacity={0.8} />;
        })}
        {lado(true)}
        {lado(false)}
      </svg>
    </>
  );
};

// letrero de farmacia con la temperatura en verde LED
const Farmacia: React.FC<{ f: number; x: number; y: number; temp: number }> = ({ f, x, y, temp }) => (
  <div style={{ position: "absolute", left: x - 150, top: y - 150, width: 300, height: 300 }}>
    <div style={{ position: "absolute", left: 100, top: 0, width: 100, height: 300, background: "#0e3a1a", boxShadow: `0 0 ${50 + Math.sin(f / 4) * 15}px rgba(40,255,90,0.6)` }} />
    <div style={{ position: "absolute", left: 0, top: 100, width: 300, height: 100, background: "#0e3a1a" }} />
    <div style={{ position: "absolute", left: 0, top: 108, width: 300, textAlign: "center", fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 80, color: "#3dff6a", textShadow: "0 0 18px #3dff6a", lineHeight: "84px" }}>
      {`${Math.round(temp)}°`}
    </div>
  </div>
);

// ---------- 1 · gancho: la calle en plena ola de calor; la farmacia marca la fiebre ----------
const gancho: Fabrica = ({ en, dur }) => ({ f }) => {
  const tf = en("fiebre,");
  const tm = en("minuto.");
  const temp = interpolate(f, [0, tf + 20], [36, 47], clamp);
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 30 }, { z: 1.15, x: 0, y: -20 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Calima id="calima-gancho-clima" f={f} fuerza={22} />
      <Plano cam={cam} prof={0.8} filtro="url(#calima-gancho-clima)">
        <Calle f={f} cielo={["#ffd27a", "#fff6dc"]} fachada="#d9a06a" sombra="#a8704a" ventanas="#5a3a2a" />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={540} cy={860} r={300 + Math.sin(f / 8) * 20} fill="#fffbe6" opacity={0.5} />
          <circle cx={540} cy={860} r={110} fill="#fffdf2" />
        </svg>
      </Plano>
      <Plano cam={cam} prof={1}>
        <Farmacia f={f} x={290} y={800} temp={temp} />
        <Yo f={f} x={560} y={1800} escala={1.0} acciones={[[0, "reposo"], [tf, "alarma"]]} cara={f > tf ? "sorpresa" : "preocupado"} calor={tramo(f, 0, tf + 20)} sombra={false} />
      </Plano>
      <AbsoluteFill style={{ background: `rgba(255,120,40,${0.12 + 0.1 * tramo(f, tf, tf + 20)})`, mixBlendMode: "multiply" }} />
      <Cine f={f} vineta={0.55} />
      <Rotulo f={f} inicio={0} texto={"LA TIERRA\nTIENE FIEBRE"} y={220} tam={120} color="#fff" />
      <Rotulo f={f} inicio={tm} texto="TE LO DEMUESTRO EN 1 MINUTO" y={520} tam={46} fondo={AMARILLO} color="#3a1a00" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 2 · bandas de calentamiento 1850–2024 ----------
const record: Fabrica = ({ en, dur }) => ({ f }) => {
  const t24 = en("2024");
  const tc = en("caluroso");
  const t15 = en("1,5");
  const anios = Array.from({ length: 175 }, (_, i) => 1850 + i);
  const visible = interpolate(f, [0, tc + 6], [0, 175], clamp);
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.12, x: -60, y: 0 });
  const ancho = W / 175;
  const anioActual = Math.min(2024, 1850 + Math.floor(visible));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#05070d" }}>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {anios.map((a, i) => (i < visible ? <rect key={a} x={i * ancho} y={0} width={ancho + 0.6} height={H} fill={colorAnomalia(anomalia(a))} /> : null))}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.5} />
      <T x={70} y={1340} tam={40} color="#fff">1850</T>
      <T x={540} y={480} tam={130} color="#fff" alinear="center" ancho={700}>{`${anioActual}`}</T>
      {f > t24 && <T x={540} y={640} tam={40} color="#fff" alinear="center" ancho={900} op={tramo(f, t24, t24 + 8)}>{f > tc ? "EL AÑO MÁS CALUROSO JAMÁS MEDIDO" : " "}</T>}
      <Rotulo f={f} inicio={t15} texto="+1,5 °C" y={760} tam={150} fondo="#67000d" color="#fff" giro={-3} />
    </AbsoluteFill>
  );
};

// ---------- 3 · +1,5 °C en tu cuerpo = fiebre ----------
const fiebre: Fabrica = ({ en, dur }) => ({ f }) => {
  const tp = en("poco,");
  const ts = en("sube");
  const tf = en("fiebre.");
  const temp = interpolate(f, [ts, ts + 20], [37, 38.5], clamp);
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 30 }, { z: 1.1, x: 0, y: -10 });
  const x0 = 140;
  const ancho = 800;
  const xDe = (v: number) => x0 + ((v - 35) / 7) * ancho;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.5}>
        <AbsoluteFill style={{ background: "linear-gradient(#1b2a4a, #0b1222)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <rect x={620} y={480} width={340} height={440} rx={20} fill="#2c4a7a" stroke="#4a6a9a" strokeWidth={14} />
          <line x1={790} y1={480} x2={790} y2={920} stroke="#4a6a9a" strokeWidth={10} />
          <circle cx={880} cy={560} r={36} fill="#fff6d8" opacity={0.8} />
        </svg>
      </Plano>
      <Plano cam={cam} prof={1}>
        <Yo f={f} x={330} y={1780} escala={0.95} acciones={[[0, "reposo"], [tp, "pensar"], [tf, "triste"]]} cara={f > tf ? "triste" : "pensativo"} calor={tramo(f, ts, tf + 10)} sombra={false} />
      </Plano>
      {/* termómetro clínico en horizontal */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={x0 - 40} y={600} width={ancho + 110} height={120} rx={60} fill="rgba(255,255,255,0.95)" />
        <rect x={x0} y={640} width={ancho} height={40} rx={20} fill="#dce7f3" />
        <rect x={x0} y={644} width={xDe(temp) - x0} height={32} rx={16} fill={temp > 37.9 ? ROJO : NARANJA} />
        <circle cx={x0 - 10} cy={660} r={52} fill={temp > 37.9 ? ROJO : NARANJA} />
        {[35, 36, 37, 38, 39, 40, 41, 42].map((v) => (
          <g key={v}>
            <line x1={xDe(v)} x2={xDe(v)} y1={600} y2={630} stroke="#555" strokeWidth={4} />
            <text x={xDe(v)} y={770} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={34} fill="#fff">{v}</text>
          </g>
        ))}
      </svg>
      <T x={540} y={480} tam={90} color="#fff" alinear="center" ancho={600}>{`${temp.toFixed(1).replace(".", ",")} °C`}</T>
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={tf} texto="FIEBRE" x={700} y={880} tam={110} fondo={ROJO} color="#fff" giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 4 · la manta invisible: efecto invernadero ----------
const Molecula: React.FC<{ x: number; y: number; s: number; giro: number }> = ({ x, y, s, giro }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`}>
    <line x1={-34} y1={0} x2={34} y2={0} stroke="#ddd" strokeWidth={8} />
    <circle cx={0} cy={0} r={20} fill="#222" stroke="#666" strokeWidth={3} />
    <circle cx={-40} cy={0} r={16} fill="#e23b3b" />
    <circle cx={40} cy={0} r={16} fill="#e23b3b" />
  </g>
);
const manta: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("manta");
  const tc = en("CO2");
  const tp = en("petróleo,");
  const tg = en("gas");
  const tca = en("carbón.");
  const cam = mover(f, 0, dur, { z: 1.08, x: 0, y: 40 }, { z: 1.0, x: 0, y: -20 });
  const capa = 820;
  const nMol = Math.round(interpolate(f, [tc, dur], [6, 26], clamp));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "linear-gradient(#050b24 0%, #12306a 45%, #5fa3d8 75%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={170} cy={540} r={90} fill="#fff3b0" />
          <circle cx={170} cy={540} r={170} fill="#fff3b0" opacity={0.15} />
          {/* suelo curvo de la Tierra */}
          <circle cx={540} cy={3400} r={2050} fill="#2e7d32" />
          <circle cx={540} cy={3400} r={2050} fill="none" stroke="#7fd3ff" strokeWidth={30} opacity={0.4} />
          {/* rayos de sol que entran */}
          {[0, 1, 2].map((k) => {
            const c = ((f + k * 15) % 45) / 45;
            const x = 300 + k * 160;
            return <line key={k} x1={x - 120 + c * 0} y1={600} x2={x - 120 + (x - 180) * 0 + 200 * c} y2={600 + 760 * c} stroke="#ffe27a" strokeWidth={14} strokeLinecap="round" opacity={0.9} />;
          })}
          {/* calor que sube y rebota en la manta */}
          {f > tm &&
            [0, 1, 2].map((k) => {
              const c = ((f - tm + k * 18) % 54) / 54;
              const sube = c < 0.5;
              const y = sube ? 1360 - (1360 - capa - 40) * (c / 0.5) : capa + 40 + (1360 - capa - 40) * ((c - 0.5) / 0.5);
              const x = 520 + k * 120 + (c - 0.5) * 120;
              let d = `M ${x} ${y}`;
              for (let j = 1; j <= 6; j++) d += ` q 12 ${sube ? -14 : 14} 0 ${sube ? -28 : 28}`;
              return <path key={k} d={d} fill="none" stroke="#ff5a3a" strokeWidth={10} strokeLinecap="round" />;
            })}
          {/* la manta */}
          {f > tm - 4 && <rect x={-40} y={capa - 60} width={W + 80} height={120} fill="rgba(255,255,255,0.14)" opacity={tramo(f, tm - 4, tm + 8)} />}
          {f > tc &&
            Array.from({ length: nMol }, (_, i) => (
              <Molecula key={i} x={(random(`mx${i}`) * W + f * (0.6 + random(`mv${i}`))) % W} y={capa - 40 + random(`my${i}`) * 80 + Math.sin(f / 10 + i) * 10} s={0.7 * muelle(f, tc + i * 2, 10)} giro={f * (1 + random(`mg${i}`)) + i * 40} />
            ))}
          {/* fuentes: petróleo, gas y carbón */}
          {f > tp && (
            <g transform={`translate(160 1400) scale(${muelle(f, tp, 10)})`}>
              <rect x={-10} y={-160} width={20} height={160} fill="#222" />
              <line x1={-100} y1={-150 + Math.sin(f / 6) * 30} x2={100} y2={-150 - Math.sin(f / 6) * 30} stroke="#333" strokeWidth={18} strokeLinecap="round" />
              <rect x={-110} y={-10} width={220} height={20} fill="#333" />
            </g>
          )}
          {f > tg && (
            <g transform={`translate(380 1400) scale(${muelle(f, tg, 10)})`}>
              <rect x={-12} y={-140} width={24} height={140} fill="#555" />
              <path d={`M 0 ${-140} q ${-30 + Math.sin(f / 3) * 8} -50 0 ${-110} q ${30 + Math.sin(f / 2) * 8} 60 0 110 Z`} fill="#4fa3ff" />
            </g>
          )}
          {f > tca && (
            <g transform={`translate(600 1400) scale(${muelle(f, tca, 10)})`}>
              <rect x={-90} y={-120} width={180} height={120} fill="#3a3a3a" />
              <rect x={30} y={-300} width={44} height={200} fill="#4a4a4a" />
              {[0, 1, 2].map((k) => {
                const c = ((f + k * 14) % 42) / 42;
                return <circle key={k} cx={52 + c * 60} cy={-320 - c * 220} r={30 + c * 50} fill="#777" opacity={0.6 * (1 - c)} />;
              })}
            </g>
          )}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.55} />
      <Rotulo f={f} inicio={tm} texto="UNA MANTA INVISIBLE" y={500} tam={62} color="#fff" />
      <Rotulo f={f} inicio={tc} texto="CO₂" x={860} y={620} tam={90} fondo="#fff" color="#111" giro={4} />
      <T x={60} y={1440} tam={30} op={tramo(f, tp, tp + 6)}>PETRÓLEO</T>
      <T x={330} y={1440} tam={30} op={tramo(f, tg, tg + 6)}>GAS</T>
      <T x={520} y={1440} tam={30} op={tramo(f, tca, tca + 6)}>CARBÓN</T>
    </AbsoluteFill>
  );
};

// ---------- 5 · la ciudad al anochecer echando humo: 37.000 millones de toneladas ----------
const toneladas: Fabrica = ({ en, dur }) => ({ f }) => {
  const tl = en("lanzamos");
  const t37 = en("37.000");
  const tt = en("toneladas.");
  const cam = mover(f, 0, dur, { z: 1.0, x: 60, y: 0 }, { z: 1.12, x: -60, y: -20 });
  const smog = tramo(f, tl, dur);
  const edificios = (semilla: string, base: number, alto: number, color: string) =>
    Array.from({ length: 14 }, (_, i) => {
      const a = alto * (0.4 + random(`${semilla}a${i}`) * 0.6);
      return <rect key={i} x={-60 + i * 90} y={base - a} width={84} height={a + 400} fill={color} />;
    });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.3}>
        <AbsoluteFill style={{ background: `linear-gradient(#1a1030 0%, #7a3050 45%, #ff9a55 75%)` }} />
      </Plano>
      <Plano cam={cam} prof={0.6}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {edificios("f", 1300, 420, "#3a2440")}
        </svg>
      </Plano>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {edificios("c", 1480, 520, "#1a1022")}
          {/* ventanas */}
          {Array.from({ length: 80 }, (_, i) => (
            <rect key={i} x={-40 + random(`wx${i}`) * 1160} y={1050 + random(`wy${i}`) * 400} width={14} height={20} fill="#ffd27a" opacity={0.4 + random(`wo${i}`) * 0.5} />
          ))}
          {/* chimeneas con humo */}
          {[180, 520].map((cx, k) => (
            <g key={cx}>
              <rect x={cx - 26} y={900} width={52} height={600} fill="#120a18" />
              {[0, 1, 2, 3, 4].map((j) => {
                const c = ((f + j * 12 + k * 7) % 60) / 60;
                return <circle key={j} cx={cx + c * 160 + Math.sin(f / 10 + j) * 20} cy={880 - c * 420} r={40 + c * 90} fill="#6a5a6a" opacity={(0.55 + smog * 0.3) * (1 - c)} />;
              })}
            </g>
          ))}
          {/* autopista con faros */}
          <rect x={-40} y={1500} width={W + 80} height={140} fill="#0d0a12" />
          {Array.from({ length: 22 }, (_, i) => {
            const x = ((i * 70 + f * (i % 2 ? 9 : -7)) % (W + 100) + W + 100) % (W + 100) - 50;
            return <circle key={i} cx={x} cy={i % 2 ? 1545 : 1595} r={6} fill={i % 2 ? "#fff6d8" : ROJO} />;
          })}
          {/* avión con estela */}
          <line x1={-100 + f * 6} y1={640 - f * 0.8} x2={-500 + f * 6} y2={640 - f * 0.8 + 50} stroke="#fff" strokeWidth={6} opacity={0.5} />
          <circle cx={-100 + f * 6} cy={640 - f * 0.8} r={8} fill="#fff" />
        </svg>
      </Plano>
      <AbsoluteFill style={{ background: `rgba(120,90,80,${0.25 * smog})` }} />
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={tl} texto="CADA AÑO" y={480} tam={60} color="#fff" />
      <Miles f={f} a={t37 - 6} b={t37 + 16} hasta={37000} y={580} tam={170} />
      <Rotulo f={f} inicio={t37 + 6} texto="MILLONES DE TONELADAS" y={790} tam={50} fondo="#fff" color="#3a1a00" giro={-2} />
      <Rotulo f={f} inicio={tt} texto="DE CO₂" y={900} tam={80} color={NARANJA} />
    </AbsoluteFill>
  );
};

// ---------- 6 · la gráfica de 800.000 años: dientes de sierra… y el pico ----------
const curva: Fabrica = ({ en, dur }) => ({ f }) => {
  const t50 = en("50");
  const t18 = en("1800:");
  const t8 = en("800.000");
  const x0 = 80;
  const x1 = 960;
  const yDe = (ppm: number) => 1400 - ((ppm - 150) / 300) * 760;
  // 8 ciclos glaciares entre ~180 y ~290 ppm
  const puntos: [number, number][] = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    const ciclo = (t * 8) % 1;
    const ppm = ciclo < 0.85 ? 285 - ciclo * 120 : 180 + ((ciclo - 0.85) / 0.15) * 105;
    puntos.push([x0 + t * (x1 - 40 - x0), yDe(ppm + (random(`p${i}`) - 0.5) * 10)]);
  }
  const dibujo = tramo(f, 0, t50 - 4);
  const pico = tramo(f, t50 - 4, t50 + 12);
  const n = Math.floor(dibujo * puntos.length);
  const d = puntos.slice(0, Math.max(1, n)).map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  const cam = mover(f, 0, dur, { z: 1.15, x: 120, y: 0 }, { z: 1.0, x: -40, y: 0 });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(#08121f, #0d2236)" }}>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {[200, 300, 400].map((p) => (
            <g key={p}>
              <line x1={x0} x2={x1} y1={yDe(p)} y2={yDe(p)} stroke="rgba(255,255,255,0.12)" strokeWidth={3} />
              <text x={x0} y={yDe(p) - 10} fontFamily={SANS} fontWeight={900} fontSize={28} fill="rgba(255,255,255,0.4)">{`${p} ppm`}</text>
            </g>
          ))}
          <line x1={x0} x2={x1} y1={yDe(300)} y2={yDe(300)} stroke="#7fd3ff" strokeWidth={4} strokeDasharray="16 12" />
          <path d={d} fill="none" stroke="#7fd3ff" strokeWidth={7} strokeLinejoin="round" />
          {pico > 0 && <path d={`M ${x1 - 40} ${yDe(280)} L ${x1 - 40 + 30 * pico} ${yDe(280 + 144 * pico)}`} fill="none" stroke={ROJO} strokeWidth={12} strokeLinecap="round" />}
          {pico > 0.98 && <circle cx={x1 - 10} cy={yDe(424)} r={18 + Math.sin(f / 3) * 4} fill={ROJO} />}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.55} />
      <T x={80} y={1440} tam={30} color="rgba(255,255,255,0.7)">HACE 800.000 AÑOS</T>
      <T x={560} y={1440} tam={30} color="rgba(255,255,255,0.7)" alinear="left">HOY →</T>
      <T x={80} y={480} tam={40} color="#7fd3ff">CO₂ EN EL AIRE</T>
      <Rotulo f={f} inicio={t50} texto="+50 %" x={700} y={520} tam={120} fondo={ROJO} color="#fff" giro={-3} />
      <Rotulo f={f} inicio={t18} texto="1800: 280 ppm → HOY: 424" x={540} y={1520} tam={40} color="#fff" fondo="rgba(5,10,25,0.8)" />
      <Sello f={f} inicio={t8} x={420} y={1180} texto="MÁXIMO EN 800.000 AÑOS" color={ROJO} tam={44} giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 7 · los diez años más calurosos: 2015–2024 ----------
const ranking: Fabrica = ({ en, dur }) => ({ f }) => {
  const td = en("diez");
  const tj = en("justo,");
  const tu = en("últimos");
  const anios = Array.from({ length: 10 }, (_, i) => 2015 + i);
  const cam = mover(f, 0, dur, { z: 1.05, x: 0, y: 20 }, { z: 1.0, x: 0, y: -20 });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "radial-gradient(circle at 50% 50%, #3a0a0a, #0a0303)" }}>
      <Plano cam={cam} prof={1}>
        {anios.map((a, i) => {
          const ini = td + 4 + i * Math.max(2, Math.round((tj - td) / 10));
          if (f < ini) return null;
          const s = muelle(f, ini, 11);
          const enciende = f > tu ? tramo(f, tu + i * 1.5, tu + i * 1.5 + 6) : 0;
          const col = i % 2;
          const fila = Math.floor(i / 2);
          return (
            <div
              key={a}
              style={{
                position: "absolute",
                left: 120 + col * 440,
                top: 560 + fila * 150,
                width: 400,
                height: 126,
                borderRadius: 26,
                background: interpolateColors(enciende, [0, 1], ["#2a2f3a", "#c81e1e"]),
                transform: `scale(${s}) rotateX(${(1 - s) * 80}deg)`,
                boxShadow: enciende > 0 ? `0 0 ${40 * enciende}px rgba(255,60,30,0.8)` : "0 10px 30px rgba(0,0,0,0.5)",
                fontFamily: SANS,
                fontWeight: 900,
                fontSize: 80,
                color: "#fff",
                textAlign: "center",
                lineHeight: "126px",
              }}
            >
              {a}
            </div>
          );
        })}
      </Plano>
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={td} texto="LOS 10 AÑOS MÁS CALUROSOS" y={460} tam={52} color="#fff" />
      <Sello f={f} inicio={tu + 12} x={540} y={1420} texto="¡LOS ÚLTIMOS 10!" color={ROJO} tam={64} giro={-5} />
    </AbsoluteFill>
  );
};

// ---------- 8 · el Ártico: un oso polar sobre un bloque de hielo que se agrieta y se encoge ----------
const artico: Fabrica = ({ en, dur }) => ({ f }) => {
  const ta = en("Ártico");
  const tp = en("perdido");
  const t40 = en("40");
  const k = tramo(f, ta, t40 + 10);
  const anio = Math.round(interpolate(k, [0, 1], [1979, 2024]));
  const escala = interpolate(k, [0, 1], [1, 0.6]);
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.15, x: 0, y: -30 });
  const cx = 470;
  const cy = 1330;
  const bloque = (e: number) => `M ${cx - 330 * e} ${cy} L ${cx - 250 * e} ${cy - 50 * e} L ${cx - 60 * e} ${cy - 70 * e} L ${cx + 180 * e} ${cy - 55 * e} L ${cx + 320 * e} ${cy - 10 * e} L ${cx + 260 * e} ${cy + 40 * e} L ${cx - 200 * e} ${cy + 45 * e} Z`;
  const trozos = [0, 1, 2].map((i) => {
    const t0 = tp + i * 12;
    const d = f > t0 ? (f - t0) * (1.2 + i * 0.4) : 0;
    return { t0, d, x: cx + (i - 1) * 260, y: cy + 10 };
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.4}>
        <AbsoluteFill style={{ background: "linear-gradient(#9cc6e8 0%, #e8d4e0 50%, #f6e6d8 62%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d="M -40 1180 L 200 1120 L 330 1170 L 520 1100 L 700 1160 L 900 1110 L 1120 1170 L 1120 1200 L -40 1200 Z" fill="#dfeaf5" opacity={0.7} />
        </svg>
      </Plano>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <rect x={-60} y={1190} width={W + 120} height={800} fill="#0d3b5a" />
          {Array.from({ length: 10 }, (_, i) => {
            const y = 1230 + i * 70;
            let d = `M -60 ${y}`;
            for (let x = -60; x <= W + 60; x += 40) d += ` L ${x} ${y + Math.sin(x / 60 + f / 10 + i) * (4 + i)}`;
            return <path key={i} d={d} fill="none" stroke="#3a7aa8" strokeWidth={3} opacity={0.5} />;
          })}
          {/* trozos que se desprenden y se alejan */}
          {trozos.map((t, i) =>
            f > t.t0 ? <path key={i} d={`M ${t.x - 50} ${t.y} l 40 -22 l 60 6 l 10 24 l -60 14 Z`} transform={`translate(${(i - 1) * t.d * 2} ${t.d * 0.6})`} fill="#f4f9ff" stroke="#9fd0f0" strokeWidth={4} /> : null,
          )}
          {/* bloque principal con su reflejo */}
          <path d={bloque(escala)} fill="#f4f9ff" stroke="#9fd0f0" strokeWidth={6} />
          <path d={bloque(escala)} transform={`translate(0 ${100 * escala}) scale(1 -0.3)`} style={{ transformOrigin: `${cx}px ${cy}px` }} fill="#5a9ac8" opacity={0.3} />
          {f > tp && <path d={`M ${cx - 40} ${cy - 60 * escala} l 20 30 l -15 25 l 25 30`} stroke="#7ab8e0" strokeWidth={5} fill="none" opacity={tramo(f, tp, tp + 6)} />}
          {/* oso polar */}
          <g transform={`translate(${cx} ${cy - 55 * escala}) scale(${0.8 + escala * 0.2})`}>
            <ellipse cx={0} cy={-55} rx={110} ry={62} fill="#fbfbf6" />
            <ellipse cx={-100} cy={-80} rx={48} ry={40} fill="#fbfbf6" />
            <circle cx={-120} cy={-110} r={14} fill="#fbfbf6" />
            <circle cx={-136} cy={-80} r={6} fill="#222" />
            <circle cx={-108} cy={-92} r={4} fill="#222" />
            {[-70, -20, 30, 80].map((lx, i) => (
              <rect key={lx} x={lx - 18} y={-20} width={36} height={60} rx={14} fill="#f0f0ea" transform={`rotate(${Math.sin(f / 18 + i) * 3} ${lx} -20)`} />
            ))}
          </g>
        </svg>
      </Plano>
      <Cine f={f} vineta={0.55} />
      <div style={{ position: "absolute", left: 100, top: 470, width: 540, height: 170, borderRadius: 24, background: "rgba(5,10,25,0.7)", border: "3px solid rgba(255,255,255,0.3)" }} />
      <T x={130} y={490} tam={28} color="#cfe6ff">HIELO DEL ÁRTICO EN VERANO</T>
      <T x={130} y={535} tam={84} color="#fff">{f > ta ? `${anio}` : "1979"}</T>
      <Rotulo f={f} inicio={t40} texto="−40 %" x={800} y={560} tam={130} fondo={ROJO} color="#fff" giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 9 · bajo el mar: los corales pierden el color ----------
const coral: Fabrica = ({ en, dur }) => ({ f }) => {
  const t84 = en("84");
  const tb = en("blanqueó.");
  const blanco = tramo(f, t84 - 4, tb + 16);
  const cam = mover(f, 0, dur, { z: 1.1, x: -40, y: 0 }, { z: 1.0, x: 40, y: -20 });
  const corales: [number, number, string, "rama" | "cerebro" | "abanico"][] = [
    [160, 1480, "#ff6fa8", "rama"],
    [360, 1540, "#ffb347", "cerebro"],
    [560, 1460, "#b36bff", "abanico"],
    [760, 1520, "#ff7a5c", "rama"],
    [950, 1500, "#4fd1c5", "cerebro"],
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "linear-gradient(#0a6fa8 0%, #064a7a 40%, #021a33 100%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* rayos de luz desde la superficie */}
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={`M ${180 + k * 230 + Math.sin(f / 30 + k) * 40} 0 L ${260 + k * 230 + Math.sin(f / 30 + k) * 40} 0 L ${420 + k * 230} 1600 L ${220 + k * 230} 1600 Z`} fill="#bfefff" opacity={0.08} />
          ))}
          <path d="M -40 1560 Q 300 1480 540 1560 T 1120 1540 L 1120 1920 L -40 1920 Z" fill={interpolateColors(blanco, [0, 1], ["#d8b77a", "#c9c4b6"])} />
          {corales.map(([x, y, c, tipo], i) => {
            const col = interpolateColors(blanco, [0, 1], [c, "#f2f0ea"]);
            const vaiven = Math.sin(f / 20 + i) * 4;
            if (tipo === "rama")
              return (
                <g key={i} stroke={col} strokeWidth={22} strokeLinecap="round" fill="none" transform={`rotate(${vaiven} ${x} ${y})`}>
                  <path d={`M ${x} ${y} L ${x} ${y - 200}`} />
                  <path d={`M ${x} ${y - 90} L ${x - 70} ${y - 190}`} />
                  <path d={`M ${x} ${y - 130} L ${x + 70} ${y - 240}`} />
                  <path d={`M ${x - 70} ${y - 190} L ${x - 90} ${y - 260}`} />
                </g>
              );
            if (tipo === "cerebro")
              return (
                <g key={i}>
                  <ellipse cx={x} cy={y - 60} rx={110} ry={80} fill={col} />
                  {[0, 1, 2].map((j) => (
                    <path key={j} d={`M ${x - 80} ${y - 90 + j * 30} q 40 -20 80 0 t 80 0`} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={6} />
                  ))}
                </g>
              );
            return <path key={i} d={`M ${x} ${y} L ${x - 130} ${y - 280} Q ${x} ${y - 360} ${x + 130} ${y - 280} Z`} fill={col} opacity={0.9} transform={`rotate(${vaiven} ${x} ${y})`} />;
          })}
          {/* peces: se van cuando se blanquea */}
          {Array.from({ length: 6 }, (_, i) => {
            const huye = f > tb ? (f - tb) * (10 + i * 2) : 0;
            const x = ((random(`fx${i}`) * W + f * (2 + i * 0.5)) % (W + 200)) - 100 + huye;
            const y = 900 + random(`fy${i}`) * 400 + Math.sin(f / 8 + i) * 20;
            const c = ["#ffd23f", "#ff7a5c", "#4fd1c5"][i % 3];
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <ellipse cx={0} cy={0} rx={34} ry={16} fill={c} />
                <path d="M -30 0 L -56 -16 L -56 16 Z" fill={c} />
                <circle cx={18} cy={-4} r={4} fill="#111" />
              </g>
            );
          })}
          {Array.from({ length: 14 }, (_, i) => {
            const c = ((f + i * 13) % 120) / 120;
            return <circle key={i} cx={random(`bx${i}`) * W + Math.sin(f / 9 + i) * 10} cy={1600 - c * 1300} r={4 + random(`br${i}`) * 8} fill="none" stroke="#dff6ff" strokeWidth={2} opacity={0.6 * (1 - c)} />;
          })}
        </svg>
      </Plano>
      <AbsoluteFill style={{ background: `rgba(220,220,220,${0.12 * blanco})`, mixBlendMode: "screen" }} />
      <Cine f={f} vineta={0.6} />
      <Cuenta f={f} a={t84 - 6} b={t84 + 14} desde={0} hasta={84} sufijo=" %" y={520} tam={190} color="#fff" />
      <Rotulo f={f} inicio={t84 + 6} texto="DE LOS ARRECIFES" y={740} tam={56} fondo="#fff" color="#064a7a" giro={-2} />
      <Rotulo f={f} inicio={tb} texto="BLANQUEADOS" y={860} tam={70} color="#f2f0ea" />
    </AbsoluteFill>
  );
};

// ---------- 10 · la ola de calor de 2022: calle vacía, farmacia a 44° y ambulancias ----------
const europa: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("mata:");
  const t22 = en("2022");
  const t60 = en("60.000");
  const temp = interpolate(f, [0, tm + 20], [40, 44], clamp);
  const cam = mover(f, 0, dur, { z: 1.1, x: -40, y: 0 }, { z: 1.0, x: 40, y: -20 });
  const amb = interpolate(f, [tm - 10, tm + 70], [-700, 1300], clamp);
  const destello = f > tm - 10 && Math.floor(f / 4) % 2 === 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Calima id="calima-europa" f={f} fuerza={16} />
      <Plano cam={cam} prof={1} filtro="url(#calima-europa)">
        <Calle f={f} cielo={["#ff9a55", "#ffe0b0"]} fachada="#e6c49a" sombra="#b58a62" ventanas="#4a3226" />
      </Plano>
      <Plano cam={cam} prof={1}>
        <Farmacia f={f} x={790} y={1000} temp={temp} />
        {/* ambulancia que cruza */}
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${amb} 1500)`}>
            <ellipse cx={0} cy={150} rx={300} ry={24} fill="rgba(0,0,0,0.3)" />
            <rect x={-280} y={-120} width={420} height={250} rx={24} fill="#f6f6f2" />
            <path d="M 140 -60 L 230 -60 L 290 30 L 290 130 L 140 130 Z" fill="#f6f6f2" />
            <path d="M 160 -40 L 220 -40 L 265 30 L 160 30 Z" fill="#7fb8e0" />
            <rect x={-280} y={20} width={570} height={36} fill="#e8203a" />
            <rect x={-110} y={-80} width={36} height={100} fill="#e8203a" />
            <rect x={-142} y={-48} width={100} height={36} fill="#e8203a" />
            <rect x={-60} y={-150} width={110} height={30} rx={10} fill={destello ? "#3a8bff" : "#1a3a7a"} />
            {[-180, 190].map((cx) => (
              <circle key={cx} cx={cx} cy={130} r={52} fill="#1a1a1a" />
            ))}
          </g>
        </svg>
      </Plano>
      {destello && <AbsoluteFill style={{ background: "rgba(40,120,255,0.18)" }} />}
      <Cine f={f} vineta={0.6} />
      {/* rótulo de telediario */}
      {f > t22 && (
        <div style={{ position: "absolute", left: 100, right: 100, top: 1180, opacity: tramo(f, t22, t22 + 6) }}>
          <div style={{ display: "inline-block", background: ROJO, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 32, padding: "8px 22px" }}>OLA DE CALOR · EUROPA</div>
          <div style={{ background: "rgba(255,255,255,0.95)", color: "#111", fontFamily: SANS, fontWeight: 900, fontSize: 36, padding: "14px 22px" }}>Verano de 2022: el más mortal en décadas</div>
        </div>
      )}
      <Miles f={f} a={t60 - 6} b={t60 + 16} hasta={60000} y={520} tam={160} />
      <Rotulo f={f} inicio={t60 + 8} texto="MUERTES POR CALOR" y={720} tam={56} fondo={ROJO} color="#fff" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 11 · incendios, sequías, tormentas (tres planos rápidos) ----------
const extremos: Fabrica = ({ en, dur }) => ({ f }) => {
  const ti = en("incendios,");
  const ts = en("sequías");
  const tt = en("tormentas");
  const plano = f < ts ? 0 : f < tt ? 1 : 2;
  const ini = [0, ts, tt][plano];
  const cam = mover(f, ini, ini + 60, { z: 1.2, x: 0, y: 0 }, { z: 1.0, x: 0, y: 0 });
  const rayo = plano === 2 && (f - tt) % 37 < 3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {plano === 0 && (
        <Plano cam={{ ...cam, ...temblor(f, 0.2) }} prof={1}>
          <AbsoluteFill style={{ background: "linear-gradient(#2a0a04 0%, #a8300a 50%, #ff8a2b 80%)" }} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M ${i * 100 - 20} 1500 L ${i * 100 + 30} ${1150 - random(`ta${i}`) * 200} L ${i * 100 + 80} 1500 Z`} fill="#1a0602" />
            ))}
            {Array.from({ length: 16 }, (_, i) => {
              const x = i * 72 + Math.sin(f / 4 + i) * 10;
              const h = 220 + Math.sin(f / 3 + i * 1.7) * 80 + random(`fh${i}`) * 120;
              return <path key={i} d={`M ${x - 50} 1560 Q ${x - 30} ${1560 - h * 0.6} ${x} ${1560 - h} Q ${x + 30} ${1560 - h * 0.6} ${x + 50} 1560 Z`} fill={i % 2 ? "#ffb347" : "#ff5a1f"} opacity={0.9} />;
            })}
            {Array.from({ length: 30 }, (_, i) => {
              const c = ((f + i * 9) % 70) / 70;
              return <circle key={i} cx={random(`ex${i}`) * W + c * 120} cy={1500 - c * 1000} r={3 + random(`er${i}`) * 4} fill="#ffd27a" opacity={1 - c} />;
            })}
            <rect x={-40} y={1540} width={W + 80} height={400} fill="#120402" />
          </svg>
        </Plano>
      )}
      {plano === 1 && (
        <Plano cam={cam} prof={1}>
          <AbsoluteFill style={{ background: "linear-gradient(#f4e2b8 0%, #e8c88a 40%)" }} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <circle cx={800} cy={620} r={110} fill="#fffbe6" />
            <rect x={-40} y={1050} width={W + 80} height={900} fill="#b88a50" />
            {Array.from({ length: 40 }, (_, i) => {
              const cx = (i % 6) * 200 + (Math.floor(i / 6) % 2) * 100 - 40;
              const cy = 1100 + Math.floor(i / 6) * 130;
              return <path key={i} d={`M ${cx} ${cy} l 90 ${-20 + random(`q${i}`) * 40} l 80 ${30 + random(`r${i}`) * 30} l -30 90 l -100 20 Z`} fill="none" stroke="#6a4a24" strokeWidth={6} />;
            })}
            <g stroke="#3a2a14" strokeWidth={16} strokeLinecap="round" fill="none">
              <path d="M 300 1250 L 300 950 M 300 1050 L 220 960 M 300 1000 L 380 900 M 220 960 L 190 900" />
            </g>
          </svg>
        </Plano>
      )}
      {plano === 2 && (
        <Plano cam={cam} prof={1}>
          <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 55%, #2a3a4a 0%, #070b10 80%)" }} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(540 1050) rotate(${-f * 2})`} style={{ filter: "blur(6px)" }}>
              {Array.from({ length: 6 }, (_, k) => {
                let d = "";
                for (let j = 0; j <= 40; j++) {
                  const a = j * 0.12 + (k * Math.PI) / 3;
                  const r = 50 * Math.exp(j * 0.055);
                  d += `${j ? "L" : "M"} ${Math.cos(a) * r} ${Math.sin(a) * r} `;
                }
                return <path key={k} d={d} fill="none" stroke="#e8f0f8" strokeWidth={36 + (k % 2) * 20} strokeLinecap="round" opacity={0.55} />;
              })}
              <circle cx={0} cy={0} r={150} fill="#e8f0f8" opacity={0.35} />
              <circle cx={0} cy={0} r={40} fill="#1a2a3a" />
            </g>
            {rayo && <path d="M 700 500 L 640 760 L 700 760 L 600 1100" stroke="#fff" strokeWidth={10} fill="none" />}
          </svg>
        </Plano>
      )}
      {rayo && <AbsoluteFill style={{ background: "rgba(255,255,255,0.35)" }} />}
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={ti} texto="INCENDIOS" y={560} tam={110} color="#ffd27a" />
      <Rotulo f={f} inicio={ts} texto="SEQUÍAS" y={700} tam={110} color="#fff" fondo={plano === 1 ? "rgba(90,60,20,0.85)" : undefined} />
      <Rotulo f={f} inicio={tt} texto="TORMENTAS" y={840} tam={110} color="#bfe9ff" />
    </AbsoluteFill>
  );
};

// ---------- 12 · mito 1: «siempre ha cambiado» — velocímetro ----------
const mito1: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("Mito");
  const tsi = en("Sí,");
  const td = en("diez");
  const v = f < tsi ? 1 : interpolate(f, [td - 6, td + 12], [1, 10], clamp);
  const ang = -120 + ((v - 1) / 9) * 240;
  const cx = 540;
  const cy = 1130;
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.08, x: 0, y: -30 });
  const t = v > 8 ? temblor(f, 0.4) : { x: 0, y: 0 };
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "radial-gradient(circle at 50% 55%, #1a2440, #05070d)" }}>
      <Plano cam={{ ...cam, x: cam.x + t.x, y: cam.y + t.y }} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = ((-120 + (i / 9) * 240 - 90) * Math.PI) / 180;
            return (
              <g key={i}>
                <line x1={cx + Math.cos(a) * 330} y1={cy + Math.sin(a) * 330} x2={cx + Math.cos(a) * 380} y2={cy + Math.sin(a) * 380} stroke={i > 6 ? ROJO : "#fff"} strokeWidth={12} strokeLinecap="round" />
                <text x={cx + Math.cos(a) * 270} y={cy + Math.sin(a) * 270 + 16} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={44} fill={i > 6 ? ROJO : "#fff"}>{`${i + 1}×`}</text>
              </g>
            );
          })}
          <path d={`M ${cx - 380 * Math.sin((120 * Math.PI) / 180)} ${cy + 380 * Math.cos((120 * Math.PI) / 180)} A 380 380 0 1 1 ${cx + 380 * Math.sin((120 * Math.PI) / 180)} ${cy + 380 * Math.cos((120 * Math.PI) / 180)}`} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8} />
          <line x1={cx} y1={cy} x2={cx + Math.sin((ang * Math.PI) / 180) * 300} y2={cy - Math.cos((ang * Math.PI) / 180) * 300} stroke={v > 7 ? ROJO : AMARILLO} strokeWidth={18} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={34} fill="#fff" />
        </svg>
        <T x={540} y={1230} tam={36} color="#cfe6ff" alinear="center" ancho={800}>VELOCIDAD DEL CAMBIO</T>
      </Plano>
      <Cine f={f} vineta={0.6} />
      <Sello f={f} inicio={tm} x={330} y={540} texto="MITO #1" color={ROJO} tam={78} giro={-6} />
      <Rotulo f={f} inicio={tsi} texto="SÍ, PERO…" x={760} y={500} tam={56} color="#fff" />
      <Rotulo f={f} inicio={td + 8} texto="10 VECES MÁS RÁPIDO" y={1330} tam={58} fondo={ROJO} color="#fff" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 13 · mito 2: el tiempo (un día) frente al clima (30 años) ----------
const mito2: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("Mito");
  const tfr = en("frío.");
  const td = en("día;");
  const tt = en("treinta");
  const cam = mover(f, 0, dur, { z: 1.05, x: 0, y: 0 }, { z: 1.0, x: 0, y: 0 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "linear-gradient(#9fb8d0, #e6eef5)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <rect x={-40} y={1500} width={W + 80} height={500} fill="#f8fbff" />
          {Array.from({ length: 50 }, (_, i) => {
            const y = ((random(`ny${i}`) * H + f * (3 + random(`nv${i}`) * 3)) % H);
            return <circle key={i} cx={random(`nx${i}`) * W + Math.sin(f / 10 + i) * 20} cy={y} r={3 + random(`nr${i}`) * 5} fill="#fff" />;
          })}
        </svg>
        <Yo f={f} x={250} y={1750} escala={0.75} acciones={[[0, "reposo"], [tfr, "alarma"]]} cara="preocupado" sombra={false} sudadera="#2b6cd9" />
      </Plano>
      {/* 30 años: cuadrícula de 30 casillas que se van poniendo rojas */}
      {f > tt - 4 && (
        <div style={{ position: "absolute", left: 480, top: 620, width: 520, padding: 24, borderRadius: 30, background: "rgba(10,15,30,0.85)", transform: `scale(${muelle(f, tt - 4, 11)})` }}>
          <T x={0} y={0} tam={34} color="#ffb36b">EL CLIMA = 30 AÑOS</T>
          <div style={{ height: 56 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} style={{ height: 60, borderRadius: 10, background: f > tt + i ? interpolateColors(i, [0, 29], ["#f4a582", "#a50f15"]) : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
        </div>
      )}
      <Cine f={f} vineta={0.45} />
      <Sello f={f} inicio={tm} x={330} y={540} texto="MITO #2" color={ROJO} tam={78} giro={-6} />
      <Rotulo f={f} inicio={tfr} texto="«HOY HACE FRÍO»" x={330} y={680} tam={52} color="#0b1a36" fondo="#fff" />
      <Rotulo f={f} inicio={td} texto="EL TIEMPO = 1 DÍA" x={300} y={820} tam={46} fondo={AZUL} color="#fff" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 14 · ¿medio grado importa? corales a 1,5 °C y a 2 °C ----------
const dos: Fabrica = ({ en, dur }) => ({ f }) => {
  const tme = en("medio");
  const t2 = en("2");
  const tc = en("corales");
  const temp = f < t2 ? 1.5 : interpolate(f, [t2 - 4, t2 + 12], [1.5, 2], clamp);
  const vivos = temp < 1.55 ? 2 : temp < 1.9 ? 1 : 0; // de 10: −70–90 % a 1,5 °C; > 99 % a 2 °C
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.1, x: 0, y: -30 });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(#064a7a, #021a33)" }}>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 10 }, (_, i) => {
            const x = 150 + (i % 5) * 180;
            const y = 1000 + Math.floor(i / 5) * 230;
            const vivo = i < vivos;
            const col = vivo ? ["#ff6fa8", "#ffb347"][i % 2] : "#e8e4da";
            return (
              <g key={i} stroke={col} strokeWidth={20} strokeLinecap="round" fill="none" opacity={vivo ? 1 : 0.55}>
                <path d={`M ${x} ${y} L ${x} ${y - 150}`} />
                <path d={`M ${x} ${y - 70} L ${x - 50} ${y - 140}`} />
                <path d={`M ${x} ${y - 100} L ${x + 50} ${y - 180}`} />
              </g>
            );
          })}
        </svg>
      </Plano>
      {/* deslizador de temperatura */}
      <div style={{ position: "absolute", left: 120, top: 560, width: 840, height: 30, borderRadius: 15, background: "linear-gradient(90deg, #f4a582, #a50f15)" }} />
      <div style={{ position: "absolute", left: 120 + ((temp - 1) / 1.5) * 840 - 40, top: 535, width: 80, height: 80, borderRadius: 40, background: "#fff", boxShadow: "0 8px 20px rgba(0,0,0,0.5)" }} />
      <T x={540} y={640} tam={110} alinear="center" ancho={600}>{`${temp.toFixed(1).replace(".", ",")} °C`}</T>
      <Cine f={f} vineta={0.55} />
      <Rotulo f={f} inicio={tme} texto="¿MEDIO GRADO IMPORTA?" y={460} tam={52} color="#fff" />
      <T x={110} y={1460} tam={34} color="#ffd6dc" op={f < t2 ? tramo(f, tme, tme + 8) : 0}>A 1,5 °C: SE PIERDEN 70–90 %</T>
      <Rotulo f={f} inicio={tc} texto="A 2 °C: MÁS DEL 99 %" x={420} y={1440} tam={50} fondo={ROJO} color="#fff" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 15 · la buena noticia: amanecer en un parque solar ----------
const solar: Fabrica = ({ en, dur }) => ({ f }) => {
  const tb = en("buena");
  const ts = en("solar");
  const tba = en("barata");
  const sol = interpolate(f, [0, dur], [1250, 900], clamp);
  const cam = mover(f, 0, dur, { z: 1.12, x: 0, y: 40 }, { z: 1.0, x: 0, y: -20 });
  const precio = tramo(f, ts, tba + 10);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.4}>
        <Paisaje f={f} noche={interpolate(f, [0, dur], [0.5, 0.15])} sol={[540, sol]} horizonte={1180} dunas={["#7aa84a", "#5f8f3a", "#4a7a2e", "#3a6224"]} />
      </Plano>
      <Plano cam={cam} prof={0.7}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {[160, 420, 880].map((x, i) => (
            <g key={x}>
              <line x1={x} y1={1200 - i * 20} x2={x} y2={900 - i * 20} stroke="#eef2f5" strokeWidth={10} />
              <g transform={`translate(${x} ${900 - i * 20}) rotate(${f * 4 + i * 40})`}>
                {[0, 120, 240].map((a) => (
                  <path key={a} d="M 0 0 L 8 -150 L -8 -150 Z" fill="#eef2f5" transform={`rotate(${a})`} />
                ))}
              </g>
            </g>
          ))}
        </svg>
      </Plano>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 5 }, (_, fila) => {
            const y = 1300 + fila * 120;
            const e = 1 + fila * 0.25;
            return Array.from({ length: 6 }, (_, c) => {
              const x = -60 + c * 220 * e - fila * 40;
              return (
                <g key={`${fila}-${c}`}>
                  <path d={`M ${x} ${y} L ${x + 180 * e} ${y} L ${x + 150 * e} ${y - 70 * e} L ${x + 30 * e} ${y - 70 * e} Z`} fill="#1a3a6a" stroke="#8fb8e8" strokeWidth={3} />
                  <path d={`M ${x + 90 * e} ${y} L ${x + 90 * e} ${y - 70 * e}`} stroke="#8fb8e8" strokeWidth={2} />
                  <path d={`M ${x + 40 * e} ${y - 35 * e} L ${x + 165 * e} ${y - 35 * e}`} stroke="#8fb8e8" strokeWidth={2} />
                  <path d={`M ${x + 60 * e} ${y - 60 * e} L ${x + 100 * e} ${y - 10 * e}`} stroke="#fff" strokeWidth={6} opacity={0.25 + Math.sin(f / 10 + c + fila) * 0.15} />
                </g>
              );
            });
          })}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.5} tinte="rgba(255,200,120,0.4)" />
      <Rotulo f={f} inicio={tb} texto="LA BUENA NOTICIA" y={470} tam={66} fondo={VERDE} color="#04260f" giro={-2} />
      {f > ts && (
        <div style={{ position: "absolute", left: 120, top: 600, width: 560, height: 300, borderRadius: 26, background: "rgba(5,15,10,0.75)", border: "3px solid rgba(255,255,255,0.3)", opacity: tramo(f, ts, ts + 6) }}>
          <T x={24} y={16} tam={28} color="#c8f5d0">PRECIO DE LA ELECTRICIDAD SOLAR</T>
          <svg width={560} height={300} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={`M 40 90 ${Array.from({ length: 20 }, (_, i) => `L ${40 + i * 25} ${90 + (1 - Math.exp(-i / 5)) * 160}`).slice(0, Math.max(1, Math.round(precio * 20))).join(" ")}`} fill="none" stroke={VERDE} strokeWidth={8} strokeLinejoin="round" />
          </svg>
          <T x={24} y={250} tam={24} color="#9fd8b0">2010</T>
          <T x={470} y={250} tam={24} color="#9fd8b0">HOY</T>
          {precio > 0.9 && <T x={380} y={120} tam={56} color="#fff">−90 %</T>}
        </div>
      )}
      <Sello f={f} inicio={tba} x={540} y={1060} texto="LA MÁS BARATA DE LA HISTORIA" color={VERDE} tam={42} giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 16 · un kilo de ternera = 60 kilos de CO2 (balanza) ----------
const ternera: Fabrica = ({ en, dur }) => ({ f }) => {
  const tc = en("cuentas:");
  const tt = en("ternera");
  const t60 = en("60");
  const globos = Math.round(interpolate(f, [t60 - 8, t60 + 18], [0, 60], clamp));
  const inclina = interpolate(globos, [0, 60], [-12, 10]);
  const cam = mover(f, 0, dur, { z: 1.05, x: 0, y: 0 }, { z: 1.0, x: 0, y: -20 });
  const cx = 540;
  const cy = 1180;
  const rad = (inclina * Math.PI) / 180;
  const izq: [number, number] = [cx - Math.cos(rad) * 320, cy - Math.sin(rad) * 320];
  const der: [number, number] = [cx + Math.cos(rad) * 320, cy + Math.sin(rad) * 320];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(#3a2a20, #120c08)" }}>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <rect x={-40} y={1480} width={W + 80} height={500} fill="#5a3a24" />
          <path d={`M ${cx - 60} 1480 L ${cx} ${cy} L ${cx + 60} 1480 Z`} fill="#c9a24a" />
          <line x1={izq[0]} y1={izq[1]} x2={der[0]} y2={der[1]} stroke="#e8c870" strokeWidth={16} strokeLinecap="round" />
          {/* platos */}
          <path d={`M ${izq[0] - 120} ${izq[1] + 60} L ${izq[0] + 120} ${izq[1] + 60} Q ${izq[0]} ${izq[1] + 120} ${izq[0] - 120} ${izq[1] + 60} Z`} fill="#c9a24a" />
          <line x1={izq[0]} y1={izq[1]} x2={izq[0]} y2={izq[1] + 60} stroke="#c9a24a" strokeWidth={6} />
          <path d={`M ${der[0] - 120} ${der[1] + 60} L ${der[0] + 120} ${der[1] + 60} Q ${der[0]} ${der[1] + 120} ${der[0] - 120} ${der[1] + 60} Z`} fill="#c9a24a" />
          <line x1={der[0]} y1={der[1]} x2={der[0]} y2={der[1] + 60} stroke="#c9a24a" strokeWidth={6} />
          {/* filete */}
          {f > tt - 4 && (
            <g transform={`translate(${izq[0]} ${izq[1] + 30}) scale(${muelle(f, tt - 4, 10)})`}>
              <path d="M -90 0 Q -100 -60 -20 -70 Q 80 -80 95 -20 Q 100 20 40 20 L -60 20 Q -90 20 -90 0 Z" fill="#b8323a" />
              <path d="M -50 -30 Q 0 -50 50 -30" stroke="#f2d6c8" strokeWidth={10} fill="none" />
            </g>
          )}
          {/* globos de CO2 */}
          {Array.from({ length: globos }, (_, i) => {
            const gx = der[0] - 110 + (i % 8) * 30 + Math.sin(f / 8 + i) * 4;
            const gy = der[1] + 20 - Math.floor(i / 8) * 34 - 30;
            return <circle key={i} cx={gx} cy={gy} r={18} fill={i % 2 ? "#8a8f9a" : "#6a6f7a"} stroke="#aab" strokeWidth={2} />;
          })}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={tc} texto="TÚ TAMBIÉN CUENTAS" y={470} tam={60} color="#fff" />
      <Rotulo f={f} inicio={tt} texto="1 KG DE TERNERA" x={300} y={760} tam={44} fondo="#fff" color="#5a1a1a" giro={-3} />
      <Cuenta f={f} a={t60 - 8} b={t60 + 18} desde={0} hasta={60} sufijo=" KG" x={780} y={640} tam={110} color={AMARILLO} />
      <Rotulo f={f} inicio={t60 + 6} texto="DE CO₂" x={780} y={780} tam={56} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 17 · final: el cruce de caminos, ¿A o B? ----------
const final: Fabrica = ({ en, dur }) => ({ f }) => {
  const tq = en("cambiarías");
  const ta = en("A:");
  const tb = en("B:");
  const tco = en("Comenta");
  const ts = en("sígueme.");
  const cam = mover(f, 0, dur, { z: 1.1, x: 0, y: 40 }, { z: 1.0, x: 0, y: -20 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={0.5}>
        <Paisaje f={f} noche={0.45} sol={[540, 1150]} horizonte={1200} dunas={["#7aa84a", "#5f8f3a", "#4a7a2e", "#3a6224"]} />
      </Plano>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* camino que se divide en dos */}
          <path d="M 380 1920 L 470 1640 L 250 1430 L 330 1430 L 520 1600 L 560 1600 L 750 1430 L 830 1430 L 610 1640 L 700 1920 Z" fill="#c9a87a" />
          <g transform="translate(0 200)">
          {/* poste A: coche */}
          <rect x={196} y={1050} width={14} height={190} fill="#6a4a2a" />
          <rect x={120} y={1000} width={170} height={80} rx={14} fill={ROJO} />
          <text x={205} y={1056} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={50} fill="#fff">A</text>
          <path d="M 150 980 Q 150 950 175 948 L 190 930 L 230 930 L 245 948 Q 265 950 265 975 L 265 980 Z" fill="#fff" opacity={0.9} />
          {/* poste B: plato */}
          <rect x={866} y={1050} width={14} height={190} fill="#6a4a2a" />
          <rect x={790} y={1000} width={170} height={80} rx={14} fill={AZUL} />
          <text x={875} y={1056} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={50} fill="#fff">B</text>
          <ellipse cx={875} cy={960} rx={52} ry={16} fill="#fff" opacity={0.9} />
          </g>
        </svg>
        <Yo f={f} x={540} y={1820} escala={0.7} acciones={[[0, "pensar"], [tco, "senalarArriba"]]} cara={f > tco ? "feliz" : "pensativo"} sombra={false} />
      </Plano>
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={tq - 4} texto="¿QUÉ CAMBIARÍAS TÚ?" y={480} tam={78} color="#fff" />
      <Opcion f={f} inicio={ta} letra="A" texto="Usar menos el coche" color={ROJO} y={620} marcada={f > tco && Math.floor(f / 12) % 2 === 0} />
      <Opcion f={f} inicio={tb} letra="B" texto="Comer menos carne" color={AZUL} y={770} marcada={f > tco && Math.floor(f / 12) % 2 === 1} />
      <Rotulo f={f} inicio={tco} texto="COMENTA A o B" x={440} y={920} tam={56} color={AMARILLO} />
      {f > ts && (
        <div style={{ position: "absolute", left: 440, top: 1020, transform: `translateX(-50%) scale(${muelle(f, ts, 9)})`, padding: "18px 44px", borderRadius: 60, background: f > ts + 8 ? "#2a3550" : ROJO, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 52, whiteSpace: "nowrap", boxShadow: "0 14px 34px rgba(0,0,0,0.5)" }}>
          {f > ts + 8 ? "SIGUIENDO ✓" : "SEGUIR"}
        </div>
      )}
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, Fabrica> = { gancho, record, fiebre, manta, toneladas, curva, ranking, artico, coral, europa, extremos, mito1, mito2, dos, solar, ternera, final };

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> =>
  Object.fromEntries((Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](esc[k])])) as Record<Ilustracion, Dibujo>;
