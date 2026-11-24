// «18 días en una cueva, a oscuras» — versión cine, como el desierto: planos completos, cámara siempre en movimiento,
// luz de linterna que recorta la oscuridad, gotas que caen, viñeta y grano. Todo 2D. Cada elemento entra en su palabra.
// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1420) y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { Cine, mover, Opcion, Plano, T, temblor, Yo } from "../Desierto/Ilustraciones";
import { Dibujo } from "../comun/tipos";
import { AMARILLO, clamp, H, Marca, muelle, ROJO, Rotulo, SANS, Sello, tramo, VERDE, W } from "../Frio/Piezas";
import type { Escenario, Ilustracion } from "./escenas";

type Fabrica = (e: Escenario) => Dibujo;
const AZUL = "#4fb4ff";
const CALIDA = "#ffb35c";

// ---------- la cueva: paredes, estalactitas, estalagmitas, charcos y gotas ----------
const Gruta: React.FC<{ f: number; semilla?: string; suelo?: number; tonos?: [string, string, string]; gotas?: boolean }> = ({
  f,
  semilla = "g",
  suelo = 1500,
  tonos = ["#4a3d33", "#2a221c", "#120e0b"],
  gotas = true,
}) => {
  const r = (k: string) => random(semilla + k);
  const estalactitas = Array.from({ length: 13 }, (_, i) => {
    const x = (i + 0.2 + r(`x${i}`) * 0.6) * (W / 12.5);
    return { x, y0: 60 + r(`y${i}`) * 160, largo: 120 + r(`l${i}`) * 360, ancho: 26 + r(`a${i}`) * 50, periodo: 55 + Math.round(r(`p${i}`) * 50), fase: Math.round(r(`f${i}`) * 90) };
  });
  const pared = (lado: number, k: number) => {
    let d = lado < 0 ? `M -20 -20` : `M ${W + 20} -20`;
    for (let y = -20; y <= H + 40; y += 80) {
      const x = 90 + k * 70 + Math.sin(y / 170 + k * 2 + r(`w${k}`) * 6) * 60 + r(`n${k}${y}`) * 40;
      d += ` L ${lado < 0 ? x : W - x} ${y}`;
    }
    return d + (lado < 0 ? ` L -20 ${H + 40} Z` : ` L ${W + 20} ${H + 40} Z`);
  };
  let sueloD = `M -20 ${H + 20} L -20 ${suelo}`;
  for (let x = -20; x <= W + 40; x += 40) sueloD += ` L ${x} ${suelo + Math.sin(x / 120 + r("s") * 6) * 26 + Math.sin(x / 47) * 8}`;
  sueloD += ` L ${W + 20} ${H + 20} Z`;
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${tonos[0]} 0%, ${tonos[1]} 55%, ${tonos[2]} 100%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`roca${semilla}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={tonos[2]} />
            <stop offset="0.45" stopColor={tonos[0]} />
            <stop offset="1" stopColor={tonos[2]} />
          </linearGradient>
        </defs>
        {/* vetas de la roca del fondo */}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M -20 ${300 + i * 150 + r(`v${i}`) * 60} Q 540 ${250 + i * 150 + r(`u${i}`) * 140} 1100 ${320 + i * 150}`} stroke="rgba(0,0,0,0.25)" strokeWidth={10 + r(`g${i}`) * 18} fill="none" />
        ))}
        {[0, 1].map((k) => (
          <React.Fragment key={k}>
            <path d={pared(-1, k)} fill={k ? tonos[1] : tonos[2]} />
            <path d={pared(1, k)} fill={k ? tonos[1] : tonos[2]} />
          </React.Fragment>
        ))}
        {/* techo */}
        <path d={`M -20 -20 L ${W + 20} -20 L ${W + 20} 120 Q 540 260 -20 140 Z`} fill={tonos[2]} />
        {estalactitas.map((e, i) => (
          <g key={i}>
            <path d={`M ${e.x - e.ancho} ${e.y0 - 60} Q ${e.x - e.ancho * 0.35} ${e.y0 + e.largo * 0.55} ${e.x} ${e.y0 + e.largo} Q ${e.x + e.ancho * 0.35} ${e.y0 + e.largo * 0.55} ${e.x + e.ancho} ${e.y0 - 60} Z`} fill={`url(#roca${semilla})`} />
            <path d={`M ${e.x - e.ancho * 0.5} ${e.y0} Q ${e.x - e.ancho * 0.2} ${e.y0 + e.largo * 0.6} ${e.x - 2} ${e.y0 + e.largo - 8}`} stroke="rgba(255,235,210,0.14)" strokeWidth={4} fill="none" />
          </g>
        ))}
        <path d={sueloD} fill={tonos[1]} />
        {Array.from({ length: 7 }, (_, i) => {
          const x = 80 + i * 150 + r(`mx${i}`) * 60;
          const alto = 60 + r(`mh${i}`) * 170;
          const yb = suelo + 30 + r(`my${i}`) * 60;
          return <path key={i} d={`M ${x - 40} ${yb} Q ${x - 10} ${yb - alto * 0.6} ${x} ${yb - alto} Q ${x + 10} ${yb - alto * 0.6} ${x + 40} ${yb} Z`} fill={tonos[0]} opacity={0.9} />;
        })}
        {/* charcos que brillan */}
        <ellipse cx={320} cy={suelo + 150} rx={200} ry={26} fill="rgba(140,190,230,0.12)" />
        <ellipse cx={760} cy={suelo + 250} rx={160} ry={20} fill="rgba(140,190,230,0.1)" />
        {gotas &&
          estalactitas
            .filter((_, i) => i % 3 === 0)
            .map((e, i) => {
              const t = ((f + e.fase) % e.periodo) / e.periodo;
              const y = e.y0 + e.largo + t * t * (suelo + 120 - e.y0 - e.largo);
              return t < 0.92 ? <ellipse key={i} cx={e.x} cy={y} rx={5} ry={9} fill="rgba(190,225,255,0.75)" /> : <ellipse key={i} cx={e.x} cy={suelo + 130} rx={10 + (t - 0.92) * 600} ry={3 + (t - 0.92) * 120} fill="none" stroke="rgba(190,225,255,0.5)" strokeWidth={3} />;
            })}
      </svg>
    </>
  );
};

// ---------- oscuridad con agujeros de luz (máscara: lo blanco es negro, cada luz lo recorta) ----------
type Foco = { x: number; y: number; r: number; k?: number };
const Oscuridad: React.FC<{ id: string; focos: Foco[]; base?: number; calido?: boolean }> = ({ id, focos, base = 0.97, calido = true }) => (
  <>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0" stopColor="#000" stopOpacity={1} />
          <stop offset="0.35" stopColor="#000" stopOpacity={0.85} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <mask id={`${id}-m`}>
          <rect width={W} height={H} fill="#fff" />
          {focos.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={Math.max(1, l.r)} fill={`url(#${id}-g)`} opacity={l.k ?? 1} />
          ))}
        </mask>
      </defs>
      <rect width={W} height={H} fill="#030202" opacity={base} mask={`url(#${id}-m)`} />
    </svg>
    {calido &&
      focos.map((l, i) => (
        <div key={i} style={{ position: "absolute", left: l.x - l.r, top: l.y - l.r, width: l.r * 2, height: l.r * 2, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,170,80,${0.22 * (l.k ?? 1)}) 0%, rgba(255,170,80,0) 65%)`, mixBlendMode: "screen" }} />
      ))}
  </>
);
const parpadeo = (f: number, fuerza = 1) => 1 - fuerza * (random(`pl${Math.floor(f / 2)}`) > 0.82 ? 0.55 : 0) - fuerza * 0.06 * Math.sin(f / 3);

// punto a una fracción t de una polilínea
const sobreRuta = (pts: [number, number][], t: number): [number, number] => {
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = Math.min(1, Math.max(0, t)) * L.reduce((a, b) => a + b, 0);
  for (let i = 0; i < L.length; i++) {
    if (d <= L[i]) {
      const k = d / L[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= L[i];
  }
  return pts[pts.length - 1];
};

// silueta sentada con las piernas cruzadas (los niños de Tham Luang)
const Sentado: React.FC<{ x: number; y: number; s?: number; borde?: string; color?: string }> = ({ x, y, s = 1, borde = "rgba(255,190,120,0.55)", color = "#0d0907" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={50} ry={16} fill={color} stroke={borde} strokeWidth={2} />
    <path d="M -32 -4 Q -36 -74 0 -82 Q 36 -74 32 -4 Z" fill={color} stroke={borde} strokeWidth={2} />
    <circle cx={0} cy={-106} r={24} fill={color} stroke={borde} strokeWidth={2} />
  </g>
);

// buzo con linterna frontal
const Buzo: React.FC<{ f: number; x: number; y: number; s?: number; giro?: number }> = ({ f, x, y, s = 1, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`}>
    <path d="M 95 -12 L 760 -230 L 760 200 Z" fill="url(#haz)" />
    <rect x={-60} y={-46} width={96} height={24} rx={12} fill="#d9a400" />
    <ellipse cx={0} cy={0} rx={78} ry={24} fill="#0b1014" />
    <path d={`M -70 -4 L -140 ${-6 + Math.sin(f / 4) * 14}`} stroke="#0b1014" strokeWidth={18} strokeLinecap="round" />
    <path d={`M -70 6 L -140 ${10 - Math.sin(f / 4) * 14}`} stroke="#0b1014" strokeWidth={18} strokeLinecap="round" />
    <path d={`M -140 ${-6 + Math.sin(f / 4) * 14} l -60 ${-14 + Math.sin(f / 4) * 20} l 10 30 Z`} fill="#1f6fd0" />
    <path d={`M -140 ${10 - Math.sin(f / 4) * 14} l -60 ${10 - Math.sin(f / 4) * 20} l 14 26 Z`} fill="#1f6fd0" />
    <circle cx={86} cy={-8} r={22} fill="#0b1014" />
    <rect x={92} y={-22} width={18} height={14} rx={4} fill="#fff8d0" />
    {Array.from({ length: 5 }, (_, i) => {
      const t = ((f + i * 11) % 55) / 55;
      return <circle key={i} cx={96 + Math.sin(i + f / 7) * 10} cy={-30 - t * 220} r={5 + i} fill="none" stroke="rgba(220,245,255,0.6)" strokeWidth={2} opacity={1 - t} />;
    })}
  </g>
);

// ---------- 1 · gancho: la entrada se derrumba y la linterna se apaga ----------
const gancho: Fabrica = ({ en, dur }) => ({ f }) => {
  const t18 = en("18");
  const ta = en("atrapado");
  const tc = en("cueva");
  const to = en("oscuras");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 30 }, { z: 1.2, x: 30, y: -40 });
  const caida = tramo(f, ta - 2, ta + 10);
  const sacudida = f > ta + 8 && f < ta + 24 ? temblor(f, 1.2) : { x: 0, y: 0 };
  const entrada = 1 - tramo(f, ta + 6, ta + 14);
  const linterna = f < to ? (f > tc ? parpadeo(f, 0.8) : 1) : 1 - tramo(f, to, to + 4);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={{ ...cam, x: cam.x + sacudida.x, y: cam.y + sacudida.y }} prof={1}>
        <Gruta f={f} semilla="gan" />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* rocas que tapan la entrada */}
          {Array.from({ length: 7 }, (_, i) => {
            const x = 40 + i * 48 + random(`rx${i}`) * 30;
            const yf = 1500 - (i % 3) * 110 - random(`ry${i}`) * 60;
            const y = interpolate(caida, [0, 1], [-200 - i * 80, yf]);
            const rr = 70 + random(`rr${i}`) * 50;
            return <path key={i} d={`M ${x - rr} ${y} L ${x - rr * 0.4} ${y - rr} L ${x + rr * 0.6} ${y - rr * 0.8} L ${x + rr} ${y + rr * 0.2} L ${x + rr * 0.2} ${y + rr * 0.7} Z`} fill={i % 2 ? "#3a3029" : "#2a221c"} stroke="#5c4d40" strokeWidth={4} />;
          })}
          {/* polvo del derrumbe */}
          {f > ta + 8 &&
            Array.from({ length: 30 }, (_, i) => {
              const k = tramo(f, ta + 8, ta + 50);
              return <circle key={i} cx={100 + random(`px${i}`) * 400 + k * 200 * random(`pv${i}`)} cy={1450 - k * 300 * random(`pw${i}`)} r={20 + k * 50} fill="rgba(180,150,120,0.12)" opacity={1 - k} />;
            })}
        </svg>
        <Yo f={f} x={560} y={1520} escala={0.5} acciones={[[0, "reposo"], [ta + 8, "sorpresa"], [to, "alarma"]]} cara={f > ta + 8 ? "preocupado" : undefined} sombra={false} />
      </Plano>
      <Oscuridad
        id="osc-gancho"
        focos={[
          { x: 120, y: 1250, r: 850, k: entrada },
          { x: 640, y: 1250, r: 520 * linterna, k: linterna },
        ]}
      />
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={0} texto={"¿QUÉ LE PASA\nA TU CUERPO…"} y={220} tam={100} color="#fff" />
      <Rotulo f={f} inicio={t18} texto="18 DÍAS EN UNA CUEVA" y={480} tam={58} color="#1a1000" fondo={AMARILLO} giro={-2} />
      {f > to && <Rotulo f={f} inicio={to} texto="A OSCURAS" y={900} tam={120} color="#fff" />}
    </AbsoluteFill>
  );
};

// ---------- 2 · la noche tiene luz; la cueva no. Primer plano del ojo ----------
const oscuridad: Fabrica = ({ en, dur }) => ({ f }) => {
  const tnoche = en("noche");
  const tn = en("negro");
  const tt = en("total");
  const tojos = en("ojos");
  const tnu = en("nunca");
  const noche = 1 - tramo(f, tn - 4, tn + 8);
  const ojo = tramo(f, tojos - 8, tojos + 6);
  const pupila = interpolate(f, [tojos, tnu + 12], [40, 132], clamp) + Math.sin(f / 5) * 3;
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.14, x: 0, y: -20 });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "linear-gradient(#050b26 0%, #13245a 60%, #2a3a72 100%)", opacity: noche }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: noche }}>
          {Array.from({ length: 120 }, (_, i) => (
            <circle key={i} cx={random(`es${i}`) * W} cy={random(`et${i}`) * 1300} r={1 + random(`er${i}`) * 3} fill="#fff" opacity={0.4 + 0.5 * Math.abs(Math.sin(f / 9 + i))} />
          ))}
          <circle cx={780} cy={620} r={80} fill="#fff6dc" />
          <circle cx={780} cy={620} r={190} fill="#fff6dc" opacity={0.08} />
          <path d="M -20 1500 L 200 1300 L 380 1420 L 620 1240 L 860 1400 L 1100 1300 L 1100 1940 L -20 1940 Z" fill="#070a18" />
        </svg>
      </Plano>
      {f > tt && <AbsoluteFill style={{ background: `rgba(255,255,255,${0.05 * (1 - tramo(f, tt, tt + 6))})` }} />}
      {ojo > 0 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: ojo }}>
          <defs>
            <radialGradient id="esclera">
              <stop offset="0" stopColor="#5b554e" />
              <stop offset="1" stopColor="#1a1714" />
            </radialGradient>
            <radialGradient id="iris">
              <stop offset="0" stopColor="#7a5230" />
              <stop offset="1" stopColor="#2a1a0d" />
            </radialGradient>
            <clipPath id="parpados">
              <path d="M 140 1000 Q 540 700 940 1000 Q 540 1290 140 1000 Z" />
            </clipPath>
          </defs>
          <g transform={`translate(${540} ${1000}) scale(${1 + cam.z * 0.04}) translate(-540 -1000)`}>
            <path d="M 140 1000 Q 540 700 940 1000 Q 540 1290 140 1000 Z" fill="url(#esclera)" />
            <g clipPath="url(#parpados)">
              <circle cx={540 + Math.sin(f / 13) * 40} cy={1000} r={175} fill="url(#iris)" />
              {Array.from({ length: 36 }, (_, i) => {
                const a = (i / 36) * Math.PI * 2;
                const cx = 540 + Math.sin(f / 13) * 40;
                return <line key={i} x1={cx + Math.cos(a) * pupila} y1={1000 + Math.sin(a) * pupila} x2={cx + Math.cos(a) * 170} y2={1000 + Math.sin(a) * 170} stroke="rgba(160,110,60,0.35)" strokeWidth={4} />;
              })}
              <circle cx={540 + Math.sin(f / 13) * 40} cy={1000} r={pupila} fill="#000" />
            </g>
            <path d="M 140 1000 Q 540 700 940 1000" fill="none" stroke="#000" strokeWidth={26} />
            <path d="M 140 1000 Q 540 1290 940 1000" fill="none" stroke="#000" strokeWidth={14} />
          </g>
        </svg>
      )}
      <Cine f={f} vineta={0.85} />
      <Rotulo f={f} inicio={tnoche} texto="LA NOCHE: ALGO DE LUZ" y={480} tam={54} color="#cfe0ff" />
      {f > tn && <Rotulo f={f} inicio={tn} texto="LA CUEVA: 0 % LUZ" y={480} tam={62} fondo="#fff" color="#000" giro={-2} />}
      <Rotulo f={f} inicio={tnu} texto={"TUS OJOS NUNCA\nSE ACOSTUMBRAN"} y={1330} x={420} tam={56} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 3 · pared mojada: humedad al 100 % y el calor que se va a la roca ----------
const humedad: Fabrica = ({ en, dur }) => ({ f }) => {
  const th = en("humedad");
  const t100 = en("100");
  const tm = en("mojado");
  const tr = en("robando");
  const tca = en("calor");
  const cam = mover(f, 0, dur, { z: 1.12, x: 40, y: 0 }, { z: 1.0, x: -30, y: 20 });
  const temp = interpolate(f, [tr, tca + 20], [36.5, 35.0], clamp);
  const tirita = f > tca ? temblor(f, 0.25) : { x: 0, y: 0 };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Gruta f={f} semilla="hum" suelo={1620} tonos={["#4b4a44", "#2a2a26", "#121210"]} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* regueros de agua por la pared */}
          {Array.from({ length: 16 }, (_, i) => {
            const x = 60 + i * 64 + random(`hx${i}`) * 30;
            const largo = 500 + random(`hl${i}`) * 700;
            const avance = ((f * (2 + random(`hv${i}`) * 3) + i * 70) % largo) + 300;
            return (
              <g key={i} opacity={0.25 + tramo(f, th, th + 20) * 0.5}>
                <path d={`M ${x} 300 Q ${x + 14} ${300 + largo / 2} ${x - 6} ${300 + largo}`} stroke="rgba(190,220,255,0.18)" strokeWidth={8} fill="none" />
                <ellipse cx={x + Math.sin(avance / 60) * 6} cy={avance} rx={6} ry={12} fill="rgba(210,235,255,0.8)" />
              </g>
            );
          })}
        </svg>
        {/* tú, empapado, pegado a la roca */}
        <div style={{ position: "absolute", inset: 0, transform: `translate(${tirita.x}px, ${tirita.y}px)` }}>
          <Yo f={f} x={360} y={1650} escala={0.72} acciones={[[0, "reposo"], [tm, "triste"]]} cara={f > tm ? "preocupado" : "serio"} sudadera="#8a2a22" sombra={false} />
        </div>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {f > tm &&
            Array.from({ length: 8 }, (_, i) => {
              const t = ((f - tm + i * 7) % 40) / 40;
              return <ellipse key={i} cx={260 + i * 26} cy={1350 + t * 280} rx={4} ry={8} fill="rgba(200,230,255,0.85)" opacity={1 - t} />;
            })}
          {/* ondas de calor que se escapan del cuerpo hacia la roca y se enfrían */}
          {f > tr &&
            Array.from({ length: 6 }, (_, i) => {
              const t = ((f - tr + i * 10) % 60) / 60;
              const x = 470 + t * 400;
              const color = t < 0.5 ? CALIDA : AZUL;
              return <path key={i} d={`M ${x} ${1050 + i * 60} q 20 -18 40 0 t 40 0 t 40 0`} stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" opacity={1 - t * 0.7} />;
            })}
        </svg>
      </Plano>
      <Oscuridad id="osc-hum" focos={[{ x: 470, y: 1150, r: 820 }]} base={0.9} />
      <Cine f={f} vineta={0.7} tinte="rgba(40,80,140,0.35)" />
      <div style={{ position: "absolute", left: 90, top: 480, width: 900, height: 130, borderRadius: 30, background: "rgba(5,10,25,0.65)", border: "3px solid rgba(255,255,255,0.3)", opacity: tramo(f, th - 6, th + 4) }}>
        <T x={30} y={20} tam={30} color="#cfe6ff">HUMEDAD</T>
        <T x={640} y={18} tam={56} color={AZUL}>{`${Math.round(interpolate(f, [th, t100 + 6], [60, 100], clamp))} %`}</T>
        <div style={{ position: "absolute", left: 30, top: 78, width: 560, height: 24, borderRadius: 12, background: "rgba(255,255,255,0.15)" }}>
          <div style={{ width: `${interpolate(f, [th, t100 + 6], [60, 100], clamp)}%`, height: "100%", borderRadius: 12, background: AZUL }} />
        </div>
      </div>
      {f > tr && (
        <div style={{ position: "absolute", left: 600, top: 1180, opacity: tramo(f, tr, tr + 6) }}>
          <T x={0} y={0} tam={28} color="#cfe6ff">TU CUERPO</T>
          <T x={0} y={36} tam={84} color={temp > 35.8 ? CALIDA : AZUL}>{`${temp.toFixed(1).replace(".", ",")} °`}</T>
        </div>
      )}
      <Rotulo f={f} inicio={tr} texto="LA ROCA TE ROBA EL CALOR" y={650} tam={52} fondo={AZUL} color="#00111f" giro={-2} />
    </AbsoluteFill>
  );
};

// ---------- 4 · el reloj del cuerpo sin sol: se derrite y el día se alarga ----------
const reloj: Fabrica = ({ en, dur }) => ({ f }) => {
  const ts = en("sol");
  const tr = en("reloj");
  const td = en("desajusta");
  const tal = en("alargan");
  const tdia = en("dia");
  const tno = en("noche");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 30 }, { z: 1.12, x: 0, y: -20 });
  const derrite = tramo(f, td, td + 30);
  const giro = f * (3 + derrite * 4);
  const cx = 540;
  const cy = 980;
  const solFuera = tramo(f, ts, ts + 10);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="derrite" x="-10%" y="-10%" width="120%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.004 0.02" numOctaves={2} seed={3} />
          <feDisplacementMap in="SourceGraphic" scale={derrite * 50 + Math.sin(f / 8) * derrite * 8} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <Plano cam={cam} prof={1}>
        <Gruta f={f} semilla="rel" />
      </Plano>
      <Oscuridad id="osc-rel" focos={[{ x: cx, y: cy, r: 760 }]} base={0.93} />
      <div style={{ position: "absolute", inset: 0, filter: derrite > 0 ? "url(#derrite)" : undefined, transform: `translate(0, ${derrite * 40}px) scaleY(${1 + derrite * 0.12})`, transformOrigin: `${cx}px ${cy - 300}px`, opacity: tramo(f, tr - 8, tr + 4) }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={cx} cy={cy} r={340} fill="#0d1222" stroke="#e6edf7" strokeWidth={14} />
          <path d={`M ${cx - 340} ${cy} A 340 340 0 0 1 ${cx + 340} ${cy} Z`} fill="rgba(255,190,80,0.12)" />
          <path d={`M ${cx - 340} ${cy} A 340 340 0 0 0 ${cx + 340} ${cy} Z`} fill="rgba(80,120,255,0.14)" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
            const largo = i % 6 === 0 ? 46 : 22;
            return <line key={i} x1={cx + Math.cos(a) * 320} y1={cy + Math.sin(a) * 320} x2={cx + Math.cos(a) * (320 - largo)} y2={cy + Math.sin(a) * (320 - largo)} stroke="#e6edf7" strokeWidth={i % 6 === 0 ? 10 : 5} />;
          })}
          {/* sol (arriba) y luna (abajo) */}
          <g opacity={1 - solFuera * 0.8}>
            <circle cx={cx} cy={cy - 190} r={52} fill="#ffd23f" />
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2;
              return <line key={i} x1={cx + Math.cos(a) * 66} y1={cy - 190 + Math.sin(a) * 66} x2={cx + Math.cos(a) * 88} y2={cy - 190 + Math.sin(a) * 88} stroke="#ffd23f" strokeWidth={8} strokeLinecap="round" />;
            })}
          </g>
          {solFuera > 0 && (
            <g opacity={solFuera} stroke={ROJO} strokeWidth={16} strokeLinecap="round">
              <line x1={cx - 70} y1={cy - 260} x2={cx + 70} y2={cy - 120} />
              <line x1={cx + 70} y1={cy - 260} x2={cx - 70} y2={cy - 120} />
            </g>
          )}
          <path d={`M ${cx + 30} ${cy + 140} a 60 60 0 1 0 0 110 a 46 46 0 1 1 0 -110 Z`} fill="#cfe0ff" />
          <line x1={cx} y1={cy} x2={cx + Math.cos(((giro - 90) * Math.PI) / 180) * 270} y2={cy + Math.sin(((giro - 90) * Math.PI) / 180) * 270} stroke={ROJO} strokeWidth={14} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={22} fill="#e6edf7" />
        </svg>
      </div>
      <Cine f={f} vineta={0.7} />
      <Rotulo f={f} inicio={tr} texto="TU RELOJ INTERNO" y={480} tam={62} color="#fff" />
      {f > tal && (
        <div style={{ position: "absolute", left: 0, top: 1380, width: 720, textAlign: "center", opacity: tramo(f, tal, tal + 6) }}>
          <T x={360} y={0} tam={34} alinear="center" ancho={700} color="#cfe0ff">TU «DÍA» DURA</T>
          <T x={360} y={42} tam={96} alinear="center" ancho={700} color={AMARILLO}>{`${interpolate(f, [tal, tal + 40], [24, 25], clamp).toFixed(1).replace(".", ",")} h`}</T>
        </div>
      )}
      <Rotulo f={f} inicio={tdia} texto="¿DÍA" y={600} x={360} tam={74} fondo={f > tno && Math.floor(f / 8) % 2 ? "rgba(0,0,0,0.6)" : AMARILLO} color={f > tno && Math.floor(f / 8) % 2 ? "#fff" : "#1a1000"} giro={-4} />
      <Rotulo f={f} inicio={tno} texto="O NOCHE?" y={600} x={720} tam={74} fondo={Math.floor(f / 8) % 2 ? "#2b4bd9" : "rgba(0,0,0,0.6)"} color="#fff" giro={3} />
    </AbsoluteFill>
  );
};

// ---------- 5 · 1962: Michel Siffre en su campamento bajo tierra ----------
const siffre: Fabrica = ({ en, dur }) => ({ f }) => {
  const t62 = en("1962");
  const tmi = en("michel");
  const tme = en("meses");
  const tco = en("contar");
  const tci = en("cinco");
  const cam = mover(f, 0, dur, { z: 1.0, x: -20, y: 20 }, { z: 1.14, x: 30, y: -30 });
  const contado = Math.round(interpolate(f, [tco, tci + 6], [1, 120], clamp));
  const real = interpolate(f, [tco, tci + 6], [0, 300], clamp);
  const mm = Math.floor(real / 60);
  const ss = Math.floor(real % 60);
  const lampara = 0.92 + Math.sin(f / 4) * 0.05;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1} filtro="sepia(0.55) contrast(1.08)">
        <Gruta f={f} semilla="sif" tonos={["#5a4a3a", "#30261d", "#140f0b"]} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* tienda de campaña y cable del teléfono que sube a la superficie */}
          <path d="M 600 1460 L 790 1130 L 980 1460 Z" fill="#c98a2e" stroke="#7a4f16" strokeWidth={6} />
          <path d="M 760 1460 L 790 1200 L 820 1460 Z" fill="#3a2810" />
          <path d="M 300 1270 Q 200 900 260 200 L 270 -20" stroke="#111" strokeWidth={6} fill="none" />
          {/* lámpara */}
          <rect x={520} y={1400} width={40} height={60} rx={8} fill="#333" />
          <circle cx={540} cy={1395} r={22} fill="#fff4c8" opacity={lampara} />
        </svg>
        <Yo f={f} x={330} y={1500} escala={0.56} acciones={[[0, "telefono"]]} sudadera="#4a5a6a" sombra={false} />
      </Plano>
      <Oscuridad id="osc-sif" focos={[{ x: 540, y: 1360, r: 700 * lampara }]} base={0.94} />
      <Cine f={f} vineta={0.75} tinte="rgba(120,80,30,0.3)" />
      <Rotulo f={f} inicio={t62} texto="1962" y={460} x={300} tam={120} color={AMARILLO} />
      <Rotulo f={f} inicio={tmi} texto="MICHEL SIFFRE" y={500} x={730} tam={46} fondo="#fff" color="#1a1000" giro={-3} />
      <Rotulo f={f} inicio={tme} texto="2 MESES · SIN RELOJ" y={630} tam={50} color="#fff" />
      {f > tco && (
        <>
          <div style={{ position: "absolute", left: 90, top: 760, width: 420, height: 230, borderRadius: 30, background: "rgba(10,8,4,0.8)", border: "4px solid rgba(255,255,255,0.3)", transform: `scale(${muelle(f, tco, 10)})` }}>
            <T x={210} y={22} tam={28} alinear="center" ancho={400} color="#ddd">ÉL CONTABA</T>
            <T x={210} y={70} tam={110} alinear="center" ancho={400}>{`${contado}`}</T>
          </div>
          <div style={{ position: "absolute", left: 570, top: 760, width: 420, height: 230, borderRadius: 30, background: "rgba(10,8,4,0.8)", border: `4px solid ${f > tci ? ROJO : "rgba(255,255,255,0.3)"}`, transform: `scale(${muelle(f, tco + 4, 10)})` }}>
            <T x={210} y={22} tam={28} alinear="center" ancho={400} color="#ddd">RELOJ REAL</T>
            <T x={210} y={70} tam={110} alinear="center" ancho={400} color={f > tci ? ROJO : "#fff"} mono>{`${mm}:${String(ss).padStart(2, "0")}`}</T>
          </div>
        </>
      )}
      <Sello f={f} inicio={tci} x={540} y={1110} texto="2 MIN = 5 MIN" color={ROJO} tam={64} giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 6 · el calendario: creía agosto, era septiembre ----------
const calendario: Fabrica = ({ en, dur }) => ({ f }) => {
  const ts = en("salir");
  const ta = en("agosto");
  const tse = en("septiembre");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 30 }, { z: 1.1, x: 0, y: -20 });
  const salida = tramo(f, ts - 6, ts + 14);
  const cambio = f > tse + 8;
  const Hoja: React.FC<{ mes: string; dia: string; color: string }> = ({ mes, dia, color }) => (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 150, background: color, borderRadius: "34px 34px 0 0", fontFamily: SANS, fontWeight: 900, fontSize: 64, color: "#fff", textAlign: "center", lineHeight: "150px" }}>{mes}</div>
      <div style={{ position: "absolute", left: 0, top: 170, right: 0, fontFamily: SANS, fontWeight: 900, fontSize: 300, color: "#1a1a1a", textAlign: "center", lineHeight: 1 }}>{dia}</div>
    </>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Gruta f={f} semilla="cal" />
      </Plano>
      <Oscuridad id="osc-cal" focos={[{ x: 540, y: 200, r: 600 + salida * 900 }]} base={0.95} calido={false} />
      {/* rayos de luz de la salida */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: salida * 0.7, mixBlendMode: "screen" }}>
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M ${380 + i * 50} -20 L ${100 + i * 150 + Math.sin(f / 20 + i) * 20} ${H} L ${160 + i * 150 + Math.sin(f / 20 + i) * 20} ${H} Z`} fill="rgba(255,250,225,0.12)" />
        ))}
      </svg>
      <Cine f={f} vineta={0.6} />
      {f > ta - 4 && (
        <div style={{ position: "absolute", left: 250, top: 600, width: 580, height: 600, transform: `scale(${muelle(f, ta - 4, 11)}) rotate(-3deg)` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 34, background: "#f6f2ea", boxShadow: "0 30px 70px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            {cambio ? <Hoja mes="SEPTIEMBRE" dia="14" color={ROJO} /> : <Hoja mes="AGOSTO" dia="20" color="#2b6cd9" />}
          </div>
          {/* hojas que vuelan al pasar los días */}
          {f > tse &&
            Array.from({ length: 5 }, (_, i) => {
              const t = tramo(f, tse + i * 2, tse + i * 2 + 14);
              if (t <= 0 || t >= 1) return null;
              return (
                <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 34, background: "#f6f2ea", overflow: "hidden", transform: `translate(${t * 700}px, ${-t * 500}px) rotate(${t * 70}deg)`, opacity: 1 - t, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
                  <Hoja mes={["AGOSTO", "AGOSTO", "SEPTIEMBRE", "SEPTIEMBRE", "SEPTIEMBRE"][i]} dia={["24", "29", "3", "8", "12"][i]} color={i < 2 ? "#2b6cd9" : ROJO} />
                </div>
              );
            })}
        </div>
      )}
      <Rotulo f={f} inicio={ta} texto={cambio ? "ERA" : "CREÍA"} y={480} tam={70} fondo={cambio ? ROJO : "#2b6cd9"} color="#fff" giro={-2} />
      <Sello f={f} inicio={tse + 10} x={460} y={1320} texto="25 DÍAS PERDIDOS" color={ROJO} tam={56} giro={-5} />
    </AbsoluteFill>
  );
};

// ---------- 7 · sin nada que ver, el cerebro se inventa luces y formas ----------
const alucina: Fabrica = ({ en, dur }) => ({ f }) => {
  const tce = en("cerebro");
  const tin = en("inventa");
  const tlu = en("luces");
  const tfo = en("formas");
  const tex = en("existen");
  const apagado = f > tex + 4;
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0, r: 0 }, { z: 1.15, x: 0, y: 0, r: 6 });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="aluc" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves={2} seed={Math.floor(f / 4) % 30} />
          <feDisplacementMap in="SourceGraphic" scale={50} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {!apagado && (
        <Plano cam={cam} prof={1} filtro="url(#aluc)">
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {/* el cerebro, apenas un contorno */}
            {f > tce && (
              <g opacity={0.5 * tramo(f, tce, tce + 10)} fill="none" stroke="#b58cff" strokeWidth={6}>
                <path d="M 360 1000 Q 330 820 470 790 Q 540 740 620 790 Q 760 800 740 960 Q 760 1080 640 1110 Q 540 1150 450 1110 Q 340 1090 360 1000 Z" />
                <path d="M 540 790 Q 520 900 560 1000 Q 530 1060 545 1120" />
                <path d="M 420 900 q 40 30 80 0 M 600 880 q 40 40 90 10 M 420 1020 q 50 -30 90 10 M 600 1030 q 40 -20 90 0" />
              </g>
            )}
            {/* fosfenos: manchas de luz que no existen */}
            {f > tlu &&
              Array.from({ length: 22 }, (_, i) => {
                const t0 = tlu + i * 2;
                if (f < t0) return null;
                const x = 140 + random(`lx${i}`) * 800 + Math.sin(f / 25 + i) * 60;
                const y = 520 + random(`ly${i}`) * 900 + Math.cos(f / 30 + i) * 60;
                const color = `hsl(${(random(`lc${i}`) * 360 + f * 2) % 360}, 90%, 60%)`;
                return <circle key={i} cx={x} cy={y} r={20 + random(`lr${i}`) * 60 + Math.sin(f / 6 + i) * 10} fill={color} opacity={0.35 * tramo(f, t0, t0 + 10)} />;
              })}
            {/* formas geométricas que giran */}
            {f > tfo &&
              Array.from({ length: 6 }, (_, k) => {
                const lados = 3 + k;
                const rr = 120 + k * 70;
                const a0 = f * (k % 2 ? 0.02 : -0.015) + k;
                const pts = Array.from({ length: lados }, (_, j) => {
                  const a = a0 + (j / lados) * Math.PI * 2;
                  return `${540 + Math.cos(a) * rr},${980 + Math.sin(a) * rr}`;
                }).join(" ");
                return <polygon key={k} points={pts} fill="none" stroke={`hsl(${(k * 60 + f * 3) % 360}, 90%, 65%)`} strokeWidth={6} opacity={0.6 * tramo(f, tfo + k * 2, tfo + k * 2 + 8)} />;
              })}
          </svg>
        </Plano>
      )}
      {apagado && <AbsoluteFill style={{ background: `rgba(255,255,255,${0.25 * (1 - tramo(f, tex + 4, tex + 10))})` }} />}
      <Cine f={f} vineta={0.85} />
      <Rotulo f={f} inicio={tin} texto={"TU CEREBRO\nSE LO INVENTA"} y={480} tam={70} color="#fff" />
      <Sello f={f} inicio={tex + 4} x={540} y={1060} texto="NO EXISTEN" color={ROJO} tam={90} giro={-6} />
    </AbsoluteFill>
  );
};

// ---------- 8 · el agua manda: 3 días sin beber, semanas sin comer ----------
const agua: Fabrica = ({ en, dur }) => ({ f }) => {
  const tag = en("agua");
  const tb = en("beber");
  const t3 = en("3");
  const tco = en("comer");
  const tse = en("semanas");
  const cam = mover(f, 0, dur, { z: 1.15, x: 0, y: -40 }, { z: 1.0, x: 0, y: 20 });
  const caida = (f % 45) / 45;
  const ancho = 720;
  const barra = (desde: number, hasta: number, de: number, a: number) => interpolate(f, [desde, hasta], [de, a], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Gruta f={f} semilla="agu" gotas={false} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* una gota grande que cae en el charco, en primer plano */}
          <path d="M 520 0 L 560 0 L 548 330 Q 540 380 532 330 Z" fill="#3a3029" />
          {caida < 0.8 ? (
            <path d={`M 540 ${360 + caida * caida * 900} q 26 40 0 60 q -26 -20 0 -60 Z`} fill="rgba(200,235,255,0.95)" />
          ) : (
            [0, 1, 2].map((k) => <ellipse key={k} cx={540} cy={1190} rx={(caida - 0.8) * 1500 + k * 50} ry={((caida - 0.8) * 1500 + k * 50) * 0.18} fill="none" stroke="rgba(200,235,255,0.6)" strokeWidth={4} opacity={1 - (caida - 0.8) * 5} />)
          )}
          <ellipse cx={540} cy={1200} rx={330} ry={56} fill="rgba(120,180,230,0.35)" />
        </svg>
      </Plano>
      <Oscuridad id="osc-agu" focos={[{ x: 540, y: 900, r: 820 }]} base={0.9} />
      <Cine f={f} vineta={0.7} tinte="rgba(30,80,150,0.3)" />
      <Rotulo f={f} inicio={tag} texto="EL AGUA TE MANTIENE VIVO" y={480} tam={52} fondo={AZUL} color="#00111f" giro={-2} />
      {f > tb - 4 && (
        <div style={{ position: "absolute", left: 80, top: 1240, width: ancho + 40, opacity: tramo(f, tb - 4, tb + 4) }}>
          <T x={0} y={0} tam={34} color="#cfe6ff">SIN BEBER</T>
          <div style={{ position: "absolute", left: 0, top: 46, width: ancho * barra(tb, t3 + 6, 0, 0.1), height: 44, borderRadius: 22, background: ROJO }} />
          {f > t3 && <T x={ancho * 0.1 + 20} y={42} tam={44} color={ROJO}>≈ 3 DÍAS</T>}
          {f > tco - 4 && (
            <>
              <T x={0} y={120} tam={34} color="#cfe6ff">SIN COMER</T>
              <div style={{ position: "absolute", left: 0, top: 166, width: ancho * barra(tco, tse + 10, 0, 1), height: 44, borderRadius: 22, background: VERDE }} />
            </>
          )}
          <div style={{ position: "absolute", left: 0, top: 230, width: ancho, height: 4, background: "rgba(255,255,255,0.4)" }} />
          {[0, 7, 14, 21, 28].map((d) => (
            <T key={d} x={(d / 28) * ancho - 12} y={240} tam={24} color="#aaa">{`${d}`}</T>
          ))}
        </div>
      )}
      <Rotulo f={f} inicio={tse} texto="SEMANAS" y={1090} x={560} tam={84} color={VERDE} />
    </AbsoluteFill>
  );
};

// ---------- 9 · rayos X: del azúcar a la grasa, y el cerebro con cetonas ----------
const grasa: Fabrica = ({ en, dur }) => ({ f }) => {
  const tse = en("segundo");
  const tq = en("quema");
  const tce = en("cerebro");
  const tke = en("cetonas");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 40 }, { z: 1.14, x: 0, y: 80 });
  const dia = f > tse ? 2 : 1;
  const celulas = Array.from({ length: 16 }, (_, i) => ({ x: 430 + (i % 4) * 70 + random(`cx${i}`) * 20, y: 1180 + Math.floor(i / 4) * 64 + random(`cy${i}`) * 16 }));
  const brillo = tramo(f, tke - 4, tke + 10);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#020812" }}>
      <Plano cam={cam} prof={1}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* rejilla de escáner */}
          {Array.from({ length: 20 }, (_, i) => (
            <line key={i} x1={0} y1={i * 100} x2={W} y2={i * 100} stroke="rgba(80,180,255,0.07)" strokeWidth={2} />
          ))}
          <line x1={0} y1={(f * 12) % H} x2={W} y2={(f * 12) % H} stroke="rgba(120,220,255,0.25)" strokeWidth={6} />
          {/* silueta */}
          <g fill="rgba(60,160,255,0.12)" stroke="#5fc8ff" strokeWidth={5}>
            <circle cx={540} cy={760} r={120} />
            <path d="M 480 880 L 600 880 L 610 930 Q 760 950 790 1060 L 800 1400 L 740 1400 L 720 1120 L 700 1560 L 380 1560 L 360 1120 L 340 1400 L 280 1400 L 290 1060 Q 320 950 470 930 Z" />
          </g>
          {/* cerebro */}
          <path d="M 455 760 Q 440 680 510 670 Q 545 650 580 670 Q 640 680 625 760 Q 630 820 570 830 Q 540 840 510 830 Q 450 820 455 760 Z" fill={`rgba(255,${120 + brillo * 100},${200 - brillo * 120},${0.35 + brillo * 0.5})`} stroke="#ff9ad8" strokeWidth={4} />
          {brillo > 0 && <circle cx={540} cy={750} r={130 + Math.sin(f / 4) * 10} fill="none" stroke={AMARILLO} strokeWidth={6} opacity={brillo * 0.7} />}
          {/* células de grasa que se queman */}
          {celulas.map((c, i) => {
            const quema = tramo(f, tq + i * 2, tq + i * 2 + 40);
            const rr = 26 * (1 - quema * 0.45);
            return (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r={rr} fill="rgba(255,210,63,0.55)" stroke={AMARILLO} strokeWidth={3} />
                {quema > 0 && quema < 1 && <path d={`M ${c.x - 8} ${c.y - rr} q 8 ${-22 - Math.sin(f / 2 + i) * 6} 16 0`} fill="#ff7a2b" opacity={0.9} />}
              </g>
            );
          })}
          {/* combustible que sube al cerebro */}
          {f > tce &&
            Array.from({ length: 12 }, (_, i) => {
              const t = ((f - tce + i * 6) % 50) / 50;
              const x = 540 + Math.sin(t * 9 + i) * 30;
              const y = 1180 - t * 400;
              return <circle key={i} cx={x} cy={y} r={9} fill={AMARILLO} opacity={1 - t} />;
            })}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.6} />
      <div style={{ position: "absolute", left: 90, top: 470, padding: "10px 26px", borderRadius: 20, background: "rgba(5,20,40,0.85)", border: "3px solid #5fc8ff" }}>
        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 44, color: dia === 2 ? AMARILLO : "#5fc8ff" }}>{`DÍA ${dia} SIN COMER`}</span>
      </div>
      <Rotulo f={f} inicio={tq} texto="QUEMA GRASA" y={1600} x={400} tam={64} fondo={AMARILLO} color="#1a1000" giro={-3} />
      <Rotulo f={f} inicio={tke} texto="CETONAS" y={600} x={830} tam={54} color={AMARILLO} />
    </AbsoluteFill>
  );
};

// ---------- 10 · mito 1: buscar la salida a ciegas (hay un pozo delante) ----------
const mito1: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("mito");
  const tb = en("buscar");
  const tci = en("ciegas");
  const tsa = en("salva");
  const tq = en("quieto");
  const ten = en("energia");
  const anda = f < tsa;
  const x = interpolate(f, [tb, tsa], [170, 560], clamp);
  const cam = mover(f, 0, dur, { z: 1.05, x: 60, y: 0 }, { z: 1.12, x: -60, y: -20 });
  const pila = tramo(f, ten - 6, ten + 30);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Gruta f={f} semilla="mi1" />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* el pozo delante */}
          <path d="M 660 1500 Q 700 1470 760 1490 L 1100 1480 L 1100 1940 L 640 1940 Z" fill="#000" />
          <path d="M 660 1500 Q 700 1470 760 1490 L 1100 1480" stroke="rgba(255,200,140,0.35)" strokeWidth={4} fill="none" />
        </svg>
        <Yo f={f} x={x} y={1510} escala={0.5} acciones={anda ? [[0, "andar"]] : [[0, "reposo"], [tq, "contento"]]} cara={anda ? "preocupado" : "serio"} sombra={false} />
      </Plano>
      <Oscuridad id="osc-mi1" focos={[{ x: x, y: 1350, r: anda ? 380 : 520, k: 0.9 }, { x: 820, y: 1520, r: 380, k: f > tci && anda ? 0.7 : 0 }]} base={0.96} calido />
      <Cine f={f} vineta={0.7} />
      <Rotulo f={f} inicio={tm} texto="MITO Nº 1" y={470} tam={80} fondo={ROJO} color="#fff" giro={-3} />
      <Rotulo f={f} inicio={tb} texto="BUSCAR LA SALIDA A CIEGAS" y={610} tam={46} color="#fff" />
      <Marca f={f} inicio={tci} x={820} y={1200} tam={150} tipo="x" />
      {f > tq && <Rotulo f={f} inicio={tq} texto="QUÉDATE QUIETO" y={820} tam={70} fondo={VERDE} color="#002a10" giro={-2} />}
      {f > ten - 6 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(f, ten - 6, ten) }}>
          <rect x={430} y={980} width={220} height={110} rx={18} fill="none" stroke="#fff" strokeWidth={8} />
          <rect x={650} y={1015} width={18} height={40} rx={4} fill="#fff" />
          <rect x={446} y={996} width={188 * pila} height={78} rx={10} fill={VERDE} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

// ---------- 11 · mito 2: el charco no; el agua que gotea de la roca, sí ----------
const mito2: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("mito");
  const tch = en("charco");
  const tse = en("seguro");
  const tg = en("gotea");
  const cam = mover(f, 0, dur, { z: 1.1, x: 0, y: 30 }, { z: 1.0, x: 0, y: -20 });
  const segunda = tramo(f, tse - 4, tse + 8);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {segunda < 1 && (
        <AbsoluteFill style={{ opacity: 1 - segunda }}>
          <Plano cam={cam} prof={1}>
            <Gruta f={f} semilla="mi2" gotas={false} tonos={["#4a3a28", "#2a2016", "#120c08"]} />
            <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
              <ellipse cx={540} cy={1250} rx={420} ry={110} fill="#4a3a1a" />
              <ellipse cx={540} cy={1240} rx={380} ry={90} fill="#5e5226" />
              {Array.from({ length: 10 }, (_, i) => (
                <circle key={i} cx={260 + random(`bx${i}`) * 560} cy={1200 + random(`by${i}`) * 70} r={5 + random(`br${i}`) * 10} fill="#7a6e3a" opacity={0.6 + Math.sin(f / 6 + i) * 0.3} />
              ))}
            </svg>
          </Plano>
          {/* lupa con bichos */}
          {f > tch - 4 && (
            <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tch - 4, 11)})`, transformOrigin: "540px 900px" }}>
              <circle cx={540} cy={900} r={230} fill="#3a4a1a" stroke="#ddd" strokeWidth={18} />
              <line x1={700} y1={1065} x2={830} y2={1200} stroke="#ddd" strokeWidth={34} strokeLinecap="round" />
              {Array.from({ length: 12 }, (_, i) => {
                const x = 540 + Math.cos(i * 2.1 + f / 20) * (60 + (i % 4) * 35);
                const y = 900 + Math.sin(i * 1.7 + f / 17) * (50 + (i % 3) * 40);
                return <path key={i} d={`M ${x - 20} ${y} q 10 -14 20 0 t 20 0`} stroke="#9cff5a" strokeWidth={8} fill="none" strokeLinecap="round" />;
              })}
            </svg>
          )}
          <Marca f={f} inicio={tch + 6} x={760} y={720} tam={130} tipo="x" />
        </AbsoluteFill>
      )}
      {segunda > 0 && (
        <AbsoluteFill style={{ opacity: segunda }}>
          <Plano cam={{ z: 1.0 + tramo(f, tse, dur) * 0.1, x: 0, y: 0 }} prof={1}>
            <Gruta f={f} semilla="mi2b" />
            <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
              <path d="M 470 0 L 610 0 Q 580 400 548 640 Q 540 680 532 640 Q 500 400 470 0 Z" fill="#5a4a3c" />
              <path d="M 490 0 Q 520 400 538 630" stroke="rgba(255,240,220,0.2)" strokeWidth={6} fill="none" />
              {Array.from({ length: 3 }, (_, i) => {
                const t = ((f + i * 15) % 45) / 45;
                return <ellipse key={i} cx={540} cy={680 + t * t * 420} rx={10} ry={16} fill="rgba(210,240,255,0.95)" />;
              })}
              {/* manos en cuenco recogiendo el agua */}
              <path d="M 380 1110 Q 400 1230 540 1240 Q 680 1230 700 1110 Q 620 1150 540 1150 Q 460 1150 380 1110 Z" fill="#e8a77e" stroke="#b8724a" strokeWidth={5} />
              <ellipse cx={540} cy={1140} rx={140} ry={22} fill="rgba(160,215,255,0.7)" />
            </svg>
          </Plano>
          <Oscuridad id="osc-mi2" focos={[{ x: 540, y: 900, r: 700 }]} base={0.92} />
          <Marca f={f} inicio={tg} x={800} y={900} tam={130} tipo="ok" />
          <Rotulo f={f} inicio={tg} texto="LA ROCA LA FILTRA" y={1320} x={420} tam={54} fondo={VERDE} color="#002a10" giro={-2} />
        </AbsoluteFill>
      )}
      <Cine f={f} vineta={0.7} />
      <Rotulo f={f} inicio={tm} texto="MITO Nº 2" y={470} tam={80} fondo={ROJO} color="#fff" giro={-3} />
    </AbsoluteFill>
  );
};

// ---------- 12 · Tham Luang: corte de la montaña, la inundación y los 13 al fondo ----------
const TUNEL: [number, number][] = [
  [60, 1240],
  [200, 1290],
  [320, 1380],
  [440, 1340],
  [540, 1420],
  [660, 1330],
  [770, 1250],
  [880, 1110],
];
const thamluang: Fabrica = ({ en, dur }) => ({ f }) => {
  const t18 = en("2018");
  const t12 = en("12");
  const ten = en("entrenador");
  const tin = en("inundacion");
  const tth = en("tham");
  const tta = en("tailandia");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.22, x: -140, y: 60 });
  const nivel = interpolate(f, [tin - 6, tin + 50], [1500, 1335], clamp);
  const lluvia = tramo(f, tin - 12, tin);
  const d = TUNEL.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0a1420" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "linear-gradient(#1b2a3c 0%, #33475c 35%, #0a1420 36%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <clipPath id="agua-tunel">
              <rect x={0} y={nivel} width={W} height={H} />
            </clipPath>
          </defs>
          {/* montaña con selva */}
          <path d="M -20 1150 L 120 900 L 300 760 L 520 640 L 700 700 L 880 560 L 1100 700 L 1100 1940 L -20 1940 Z" fill="#4a3a2c" />
          <path d="M -20 1150 L 120 900 L 300 760 L 520 640 L 700 700 L 880 560 L 1100 700" stroke="#2f7a3a" strokeWidth={50} fill="none" strokeLinejoin="round" />
          {Array.from({ length: 22 }, (_, i) => {
            const x = 40 + i * 48;
            const y = x < 520 ? 1150 - (x / 520) * 510 : x < 880 ? 640 + Math.sin(((x - 520) / 360) * Math.PI) * 60 - ((x - 520) / 360) * 80 : 560 + ((x - 880) / 220) * 140;
            return <circle key={i} cx={x} cy={y - 30} r={34 + random(`ar${i}`) * 18} fill={i % 2 ? "#2f8a3e" : "#246d31"} />;
          })}
          {/* estratos */}
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M -20 ${1000 + i * 120} Q 540 ${960 + i * 130} 1100 ${900 + i * 120}`} stroke="rgba(0,0,0,0.2)" strokeWidth={14} fill="none" />
          ))}
          {/* túnel */}
          <path d={d} stroke="#120c08" strokeWidth={70} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={d} stroke="#1f160f" strokeWidth={50} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <ellipse cx={890} cy={1090} rx={110} ry={56} fill="#1f160f" />
          <path d={d} stroke="#2b6cd9" strokeWidth={50} fill="none" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#agua-tunel)" opacity={0.9} />
          {/* lluvia */}
          {lluvia > 0 &&
            Array.from({ length: 60 }, (_, i) => {
              const x = (random(`lx${i}`) * W + f * 4) % W;
              const y = ((random(`ly${i}`) * 800 + f * 40) % 800) + 0;
              return <line key={i} x1={x} y1={y} x2={x - 8} y2={y + 36} stroke="rgba(180,210,255,0.6)" strokeWidth={3} opacity={lluvia} />;
            })}
          {/* los 13: entran en fila y se refugian al fondo */}
          {f > t12 &&
            Array.from({ length: 13 }, (_, i) => {
              const t = interpolate(f, [t12 + i * 2, tin + 10 + i], [0, 1], clamp);
              const [x, y] = sobreRuta(TUNEL, t * 0.96 + (i % 4) * 0.01);
              const entrenador = i === 12;
              return <circle key={i} cx={x + (t > 0.95 ? (i % 5) * 18 - 36 : 0)} cy={y - 10 - (t > 0.95 ? Math.floor(i / 5) * 18 : 0)} r={entrenador ? 13 : 9} fill={entrenador && f > ten ? ROJO : AMARILLO} stroke="#000" strokeWidth={2} />;
            })}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={t18} texto="2018" y={460} x={260} tam={110} color={AMARILLO} />
      <Rotulo f={f} inicio={t12} texto="12 NIÑOS" y={480} x={700} tam={60} fondo={AMARILLO} color="#1a1000" giro={-3} />
      <Rotulo f={f} inicio={ten} texto="+ SU ENTRENADOR" y={590} x={700} tam={44} fondo={ROJO} color="#fff" giro={2} />
      <Rotulo f={f} inicio={tin} texto="INUNDACIÓN" y={1560} x={360} tam={66} fondo="#2b6cd9" color="#fff" giro={-2} />
      <Rotulo f={f} inicio={tth} texto="CUEVA THAM LUANG" y={720} tam={50} color="#fff" />
      <Rotulo f={f} inicio={tta} texto="TAILANDIA" y={800} tam={40} fondo="#fff" color="#a0001a" />
    </AbsoluteFill>
  );
};

// ---------- 13 · la cámara del fondo: agua de las paredes y meditación ----------
const meditar: Fabrica = ({ en, dur }) => ({ f }) => {
  const tag = en("agua");
  const ten = en("entrenador");
  const tme = en("meditar");
  const teg = en("energia");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 20 }, { z: 1.12, x: 0, y: -40 });
  const resp = (Math.sin((f - tme) / 18) + 1) / 2;
  const gasto = interpolate(f, [teg - 6, teg + 24], [0.85, 0.35], clamp);
  const ninos: [number, number, number][] = [
    [190, 1290, 0.72],
    [300, 1250, 0.7],
    [410, 1230, 0.68],
    [680, 1230, 0.68],
    [790, 1250, 0.7],
    [900, 1290, 0.72],
    [250, 1400, 0.8],
    [380, 1380, 0.78],
    [700, 1380, 0.78],
    [830, 1400, 0.8],
    [470, 1440, 0.82],
    [610, 1440, 0.82],
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Gruta f={f} semilla="med" suelo={1320} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {ninos.map(([x, y, s], i) => (
            <Sentado key={i} x={x} y={y} s={s} />
          ))}
          {f > tme && <circle cx={545} cy={1190} r={110 + resp * 80} fill="none" stroke="rgba(255,220,150,0.6)" strokeWidth={6} />}
          <Sentado x={545} y={1300} s={1.05} borde={f > ten ? AMARILLO : "rgba(255,190,120,0.55)"} />
          {/* gotas de la pared en un vaso */}
          {f > tag &&
            Array.from({ length: 3 }, (_, i) => {
              const t = ((f + i * 14) % 42) / 42;
              return <ellipse key={i} cx={120} cy={900 + t * 300} rx={6} ry={11} fill="rgba(210,240,255,0.9)" />;
            })}
        </svg>
      </Plano>
      <Oscuridad id="osc-med" focos={[{ x: 545, y: 1250, r: 640 * (0.95 + Math.sin(f / 5) * 0.04) }, { x: 120, y: 1000, r: 260, k: tramo(f, tag - 4, tag + 4) }]} base={0.95} />
      <Cine f={f} vineta={0.7} />
      <Rotulo f={f} inicio={tag} texto="AGUA DE LAS PAREDES" y={470} tam={52} fondo={AZUL} color="#00111f" giro={-2} />
      {f > tme && <Rotulo f={f} inicio={tme} texto={resp > 0.5 ? "INSPIRA…" : "ESPIRA…"} y={900} tam={60} color="#ffe2a8" />}
      {f > teg - 6 && (
        <div style={{ position: "absolute", left: 90, top: 600, width: 900, height: 120, borderRadius: 30, background: "rgba(5,10,25,0.65)", border: "3px solid rgba(255,255,255,0.3)", opacity: tramo(f, teg - 6, teg + 2) }}>
          <T x={30} y={18} tam={30} color="#ffe2a8">GASTO DE ENERGÍA</T>
          <div style={{ position: "absolute", left: 30, top: 70, width: 840, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.15)" }}>
            <div style={{ width: `${gasto * 100}%`, height: "100%", borderRadius: 13, background: gasto > 0.6 ? CALIDA : VERDE }} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- 14 · los buzos: túnel inundado, día 10, 4 km… y salen los 13 ----------
const buzos: Fabrica = ({ en, dur }) => ({ f }) => {
  const tbu = en("buzos");
  const tenc = en("encontraron");
  const t10 = en("10");
  const t4 = en("4");
  const tsa = en("salieron");
  const t13 = en("13");
  const tvi = en("vida");
  const cam = mover(f, 0, dur, { z: 1.08, x: 40, y: 0 }, { z: 1.0, x: -40, y: -20 });
  const avance = interpolate(f, [0, tenc + 10], [-250, 360], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "linear-gradient(#0b0807 0%, #0b0807 44%, #06323f 45%, #021a24 100%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="haz" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff6cc" stopOpacity={0.55} />
              <stop offset="1" stopColor="#fff6cc" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* techo y suelo del túnel */}
          <path d="M -20 -20 L 1100 -20 L 1100 520 Q 800 640 540 560 Q 260 480 -20 600 Z" fill="#1a120d" />
          <path d="M -20 1940 L -20 1600 Q 300 1500 560 1580 Q 820 1660 1100 1540 L 1100 1940 Z" fill="#0d0a08" />
          {/* repisa seca con los 13 */}
          <path d="M 560 860 L 1100 820 L 1100 900 L 540 900 Z" fill="#2a1f17" />
          {Array.from({ length: 13 }, (_, i) => (
            <Sentado key={i} x={610 + (i % 7) * 58} y={862 - Math.floor(i / 7) * 34} s={0.42} borde={f > tenc ? "rgba(255,240,190,0.9)" : "rgba(255,190,120,0.2)"} />
          ))}
          {/* superficie del agua */}
          <path d={`M -20 864 ${Array.from({ length: 30 }, (_, i) => `L ${i * 40} ${864 + Math.sin(i / 2 + f / 8) * 6}`).join(" ")} L 1100 864`} stroke="rgba(150,220,255,0.5)" strokeWidth={4} fill="none" />
          {/* partículas en suspensión */}
          {Array.from({ length: 50 }, (_, i) => (
            <circle key={i} cx={(((random(`px${i}`) * W - f * 0.6 * (1 + random(`pv${i}`))) % W) + W) % W} cy={900 + random(`py${i}`) * 700} r={2 + random(`pr${i}`) * 3} fill="rgba(200,240,255,0.25)" />
          ))}
          {f > tbu - 10 && (
            <>
              <Buzo f={f} x={avance} y={1180} s={0.9} giro={f > tenc ? -14 : -4} />
              <Buzo f={f + 7} x={avance - 230} y={1330} s={0.85} giro={f > tenc ? -10 : 2} />
            </>
          )}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.7} tinte="rgba(0,120,160,0.25)" />
      <Rotulo f={f} inicio={tbu} texto="2 BUZOS BRITÁNICOS" y={470} tam={50} color="#fff" />
      <Rotulo f={f} inicio={t10} texto="DÍA 10" y={570} x={300} tam={80} fondo={AMARILLO} color="#1a1000" giro={-3} />
      <Rotulo f={f} inicio={t4} texto="≈ 4 KM" y={580} x={760} tam={70} fondo="#fff" color="#111" giro={2} />
      {f > tsa &&
        Array.from({ length: 13 }, (_, i) => {
          const t0 = t13 - 6 + i * 2;
          if (f < t0) return null;
          return (
            <div key={i} style={{ position: "absolute", left: 90 + i * 47, top: 1380, width: 40, height: 40, borderRadius: 20, background: VERDE, transform: `scale(${muelle(f, t0, 9)})`, color: "#002a10", fontFamily: SANS, fontWeight: 900, fontSize: 28, textAlign: "center", lineHeight: "40px" }}>
              ✓
            </div>
          );
        })}
      <Sello f={f} inicio={tvi} x={420} y={1260} texto="13 DE 13 CON VIDA" color="#12a052" tam={56} giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 15 · Beatriz Flamini: 500 días en una cueva de Granada ----------
const flamini: Fabrica = ({ en, dur }) => ({ f }) => {
  const tes = en("espanola");
  const tbe = en("beatriz");
  const t500 = en("500");
  const tgr = en("granada");
  const tsa = en("salir");
  const tcr = en("creia");
  const t170 = en("170");
  const cam = mover(f, 0, dur, { z: 1.0, x: -20, y: 30 }, { z: 1.15, x: 40, y: -30 });
  const dias = Math.round(interpolate(f, [t500 - 10, t500 + 24], [1, 500], clamp));
  const rayas = Math.min(64, Math.floor(interpolate(f, [0, t500 + 24], [0, 64], clamp)));
  const salida = tramo(f, tsa - 4, tsa + 12);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Gruta f={f} semilla="fla" tonos={["#55463a", "#2e251e", "#130f0c"]} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* tienda y lámpara */}
          <path d="M 560 1500 L 760 1170 L 960 1500 Z" fill="#2b6cd9" stroke="#163a7a" strokeWidth={6} />
          <path d="M 730 1500 L 760 1240 L 790 1500 Z" fill="#0d1a33" />
          <circle cx={500} cy={1430} r={20} fill="#fff4c8" />
          {/* rayas en la pared para contar los días (dejó de contar hacia los dos meses) */}
          {Array.from({ length: rayas }, (_, i) => {
            const grupo = Math.floor(i / 5);
            const x = 640 + (grupo % 4) * 90 + (i % 5) * 14;
            const y = 930 + Math.floor(grupo / 4) * 90;
            return i % 5 === 4 ? <line key={i} x1={x - 62} y1={y + 52} x2={x + 4} y2={y + 8} stroke="#e8dcc8" strokeWidth={5} /> : <line key={i} x1={x} y1={y} x2={x} y2={y + 60} stroke="#e8dcc8" strokeWidth={5} />;
          })}
        </svg>
        <Yo f={f} x={320} y={1500} escala={0.56} acciones={[[0, "reposo"], [tsa, "sorpresa"], [t170, "celebrar"]]} sudadera="#2a8a6a" sombra={false} />
      </Plano>
      <Oscuridad id="osc-fla" focos={[{ x: 520, y: 1300, r: 700 }, { x: 540, y: -100, r: 300 + salida * 1300, k: salida }]} base={0.93} />
      <Cine f={f} vineta={0.7} />
      <Rotulo f={f} inicio={tes} texto="ESPAÑA" y={460} x={250} tam={54} fondo="#c60b1e" color={AMARILLO} giro={-3} />
      <Rotulo f={f} inicio={tbe} texto="BEATRIZ FLAMINI" y={460} x={690} tam={46} fondo="#fff" color="#111" giro={2} />
      <Rotulo f={f} inicio={tgr} texto="CUEVA DE GRANADA" y={1560} x={360} tam={46} color="#fff" />
      {f > t500 - 10 && (
        <div style={{ position: "absolute", left: 0, top: 580, width: W, textAlign: "center", fontFamily: SANS, fontWeight: 900, transform: `scale(${0.7 + 0.3 * muelle(f, t500 - 10, 10)})` }}>
          <div style={{ fontSize: 34, color: "#cfe0ff" }}>DÍAS REALES</div>
          <div style={{ fontSize: 170, color: "#fff", lineHeight: 1, textShadow: "0 10px 30px rgba(0,0,0,0.8)" }}>{dias}</div>
        </div>
      )}
      {f > tcr && (
        <div style={{ position: "absolute", left: 100, top: 1000, width: 440, textAlign: "center", fontFamily: SANS, fontWeight: 900, transform: `scale(${muelle(f, tcr, 10)}) rotate(-4deg)`, padding: "14px 0 20px", borderRadius: 30, background: "rgba(10,5,5,0.85)", border: `5px solid ${ROJO}` }}>
          <div style={{ fontSize: 34, color: "#ffc2c8" }}>ELLA CREÍA</div>
          <div style={{ fontSize: 120, color: ROJO, lineHeight: 1 }}>{Math.round(interpolate(f, [tcr, t170 + 6], [1, 170], clamp))}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- 16 · final interactivo: ¿qué haces? A o B ----------
const final: Fabrica = ({ en, dur }) => ({ f }) => {
  const tq = en("haces");
  const ta = en("a");
  const tb = en("b");
  const tco = en("comenta");
  const ts = en("sigueme");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.1, x: 0, y: -30 });
  const luz = parpadeo(f, 0.9);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Gruta f={f} semilla="fin" />
        <Yo f={f} x={230} y={1700} escala={0.42} acciones={[[0, "pensar"]]} cara="preocupado" sombra={false} />
      </Plano>
      <Oscuridad id="osc-fin" focos={[{ x: 230, y: 1560, r: 360 * luz, k: luz }]} base={0.96} />
      <Cine f={f} vineta={0.75} />
      <Rotulo f={f} inicio={0} texto="ATRAPADO SIN LUZ" y={500} tam={62} fondo={ROJO} color="#fff" giro={-2} />
      <Rotulo f={f} inicio={tq} texto="¿QUÉ HACES?" y={620} tam={100} color="#fff" />
      <Opcion f={f} inicio={ta} letra="A" texto={"Buscas la salida"} color={ROJO} y={860} marcada={f > tco && Math.floor(f / 12) % 2 === 0} />
      <Opcion f={f} inicio={tb} letra="B" texto={"Te quedas quieto\ny esperas"} color="#2b6cd9" y={1020} marcada={f > tco && Math.floor(f / 12) % 2 === 1} />
      <Rotulo f={f} inicio={tco} texto="COMENTA A o B" y={1190} x={440} tam={60} color={AMARILLO} />
      {f > ts && (
        <div style={{ position: "absolute", left: 440, top: 1300, transform: `translateX(-50%) scale(${muelle(f, ts, 9)})`, padding: "18px 44px", borderRadius: 60, background: f > ts + 8 ? "#2a3550" : ROJO, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 52, whiteSpace: "nowrap", boxShadow: "0 14px 34px rgba(0,0,0,0.5)" }}>
          {f > ts + 8 ? "SIGUIENDO ✓" : "SEGUIR"}
        </div>
      )}
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, Fabrica> = { gancho, oscuridad, humedad, reloj, siffre, calendario, alucina, agua, grasa, mito1, mito2, thamluang, meditar, buzos, flamini, final };

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> =>
  Object.fromEntries((Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](esc[k])])) as Record<Ilustracion, Dibujo>;
