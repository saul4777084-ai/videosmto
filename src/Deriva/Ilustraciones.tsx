// «A la deriva en el mar» — versión cine, como la cueva y el desierto: planos completos, cámara siempre en movimiento,
// olas animadas, balsa que se mece, viñeta y grano. Todo 2D. Cada elemento entra en su palabra (en("palabra")).
// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1420) y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { Calima, Cine, mover, Opcion, Plano, T, temblor, Yo } from "../Desierto/Ilustraciones";
import { Dibujo } from "../comun/tipos";
import { AMARILLO, clamp, H, Marca, muelle, ROJO, Rotulo, SANS, Sello, tramo, VERDE, W } from "../Frio/Piezas";
import type { Escenario, Ilustracion } from "./escenas";

type Fabrica = (e: Escenario) => Dibujo;
const AZUL = "#4fb4ff";
const NARANJA = "#ff6a13";

// ---------- el mar: cielo, sol o luna, reflejo y filas de olas que se mueven ----------
const Mar: React.FC<{
  f: number;
  horizonte?: number;
  cielo?: [string, string];
  agua?: [string, string];
  sol?: { x: number; y: number; r: number; color?: string };
  luna?: boolean;
  estrellas?: boolean;
  fuerza?: number;
}> = ({ f, horizonte = 1050, cielo = ["#3d8fd6", "#bfe3ff"], agua = ["#1f74b5", "#062b4f"], sol, luna, estrellas, fuerza = 1 }) => {
  const filas = 16;
  const ola = (y: number, amp: number, largo: number, fase: number) => {
    let d = `M -40 ${y}`;
    for (let x = -40; x <= W + 40; x += 20) d += ` L ${x} ${(y + Math.sin(x / largo + fase) * amp + Math.sin(x / (largo * 0.37) - fase * 1.3) * amp * 0.35).toFixed(1)}`;
    return d;
  };
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(${cielo[0]} 0px, ${cielo[1]} ${horizonte}px, ${agua[0]} ${horizonte}px, ${agua[1]} ${H}px)` }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {estrellas &&
          Array.from({ length: 110 }, (_, i) => (
            <circle key={i} cx={random(`me${i}`) * W} cy={random(`mf${i}`) * (horizonte - 40)} r={1 + random(`mr${i}`) * 2.6} fill="#fff" opacity={0.35 + 0.5 * Math.abs(Math.sin(f / 11 + i))} />
          ))}
        {sol && (
          <>
            <circle cx={sol.x} cy={sol.y} r={sol.r * 3.2} fill={sol.color ?? "#fff3c4"} opacity={0.12} />
            <circle cx={sol.x} cy={sol.y} r={sol.r * 1.7} fill={sol.color ?? "#fff3c4"} opacity={0.25} />
            <circle cx={sol.x} cy={sol.y} r={sol.r} fill={luna ? "#f4f1e4" : (sol.color ?? "#fff7d6")} />
            {luna && <circle cx={sol.x + sol.r * 0.35} cy={sol.y - sol.r * 0.2} r={sol.r * 0.85} fill={cielo[0]} opacity={0.0} />}
            {/* reflejo del sol (o la luna) en el agua: destellos que bailan */}
            {Array.from({ length: 34 }, (_, i) => {
              const k = i / 34;
              const y = horizonte + 8 + Math.pow(k, 1.4) * (H - horizonte);
              const ancho = 20 + k * 220;
              const dx = Math.sin(f / 7 + i * 1.9) * ancho * 0.4;
              return <rect key={i} x={sol.x - ancho / 2 + dx} y={y} width={ancho * (0.4 + random(`rs${i}`) * 0.6)} height={3 + k * 9} rx={4} fill={luna ? "#e8ecff" : "#fff6d0"} opacity={(0.55 - k * 0.35) * (0.6 + 0.4 * Math.sin(f / 3 + i))} />;
            })}
          </>
        )}
        {Array.from({ length: filas }, (_, k) => {
          const p = k / (filas - 1);
          const y = horizonte + 6 + Math.pow(p, 1.6) * (H - horizonte + 60);
          const amp = (2 + p * 26) * fuerza;
          const largo = 30 + p * 130;
          const fase = f / (20 - p * 8) + k * 1.7;
          return (
            <g key={k}>
              <path d={ola(y, amp, largo, fase) + ` L ${W + 40} ${y + 60 + p * 80} L -40 ${y + 60 + p * 80} Z`} fill="rgba(0,20,45,0.16)" />
              <path d={ola(y, amp, largo, fase)} stroke="rgba(230,245,255,0.22)" strokeWidth={1.5 + p * 4} fill="none" />
            </g>
          );
        })}
      </svg>
    </>
  );
};

// cabeceo de la balsa con las olas
const vaiven = (f: number, fuerza = 1) => ({ y: Math.sin(f / 14) * 14 * fuerza, r: Math.sin(f / 19) * 3.2 * fuerza });
const Meciendo: React.FC<{ f: number; x: number; y: number; fuerza?: number; children: React.ReactNode }> = ({ f, x, y, fuerza = 1, children }) => {
  const v = vaiven(f, fuerza);
  return <div style={{ position: "absolute", inset: 0, transform: `translateY(${v.y}px) rotate(${v.r}deg)`, transformOrigin: `${x}px ${y}px` }}>{children}</div>;
};

// balsa salvavidas naranja: la parte de atrás va detrás del personaje y el flotador delantero, delante
const BalsaAtras: React.FC<{ x: number; y: number; s?: number; toldo?: number }> = ({ x, y, s = 1, toldo = 0 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {toldo > 0 && (
        <g opacity={toldo}>
          <path d="M -250 -30 Q -230 -520 0 -540 Q 230 -520 250 -30 Z" fill="#ff7b22" />
          <path d="M -250 -30 Q -230 -520 0 -540" stroke="#c94e0c" strokeWidth={14} fill="none" />
          <path d="M -150 -40 Q -130 -340 0 -350 Q 130 -340 150 -40 Z" fill="#2a1306" />
        </g>
      )}
      <ellipse cx={0} cy={-30} rx={275} ry={82} fill="#c94e0c" />
      <ellipse cx={0} cy={-22} rx={225} ry={56} fill="#3a1a0a" />
    </g>
  </svg>
);
const BalsaDelante: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -262 -26 A 262 78 0 0 0 262 -26" stroke={NARANJA} strokeWidth={62} fill="none" strokeLinecap="round" />
      <path d="M -240 -10 A 250 70 0 0 0 240 -10" stroke="#ffb27a" strokeWidth={8} fill="none" opacity={0.7} />
      {[-160, -60, 60, 160].map((dx) => (
        <rect key={dx} x={dx - 22} y={Math.sqrt(Math.max(0, 1 - (dx / 262) ** 2)) * 78 - 46} width={44} height={20} fill="#e9eef2" rx={4} />
      ))}
      {/* el agua lame el flotador */}
      <ellipse cx={0} cy={58} rx={330} ry={40} fill="rgba(20,90,150,0.55)" />
      <path d="M -330 50 Q -160 30 0 52 Q 160 74 330 48" stroke="rgba(230,245,255,0.6)" strokeWidth={6} fill="none" />
    </g>
  </svg>
);
// tú dentro de la balsa
const EnBalsa: React.FC<{
  f: number;
  x: number;
  y: number;
  s?: number;
  acciones: Parameters<typeof Yo>[0]["acciones"];
  cara?: Parameters<typeof Yo>[0]["cara"];
  calor?: number;
  piel?: string;
  toldo?: number;
  fuerza?: number;
  mirar?: "derecha" | "izquierda";
}> = ({ f, x, y, s = 1, acciones, cara, calor, piel, toldo, fuerza, mirar }) => (
  <Meciendo f={f} x={x} y={y} fuerza={fuerza}>
    <BalsaAtras x={x} y={y} s={s} toldo={toldo} />
    <Yo f={f} x={x} y={y - 10 * s} escala={0.62 * s} acciones={acciones} cara={cara} calor={calor} piel={piel} mirar={mirar} sombra={false} />
    <BalsaDelante x={x} y={y} s={s} />
  </Meciendo>
);

// nube sencilla
const Nube: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = "#fff" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <ellipse cx={0} cy={0} rx={150} ry={52} />
    <circle cx={-60} cy={-30} r={60} />
    <circle cx={30} cy={-55} r={78} />
    <circle cx={100} cy={-20} r={55} />
  </g>
);

// pez (dorado), tortuga y pájaro, dibujados mirando a la derecha
const Pez: React.FC<{ x: number; y: number; s?: number; f: number; color?: string }> = ({ x, y, s = 1, f, color = "#f2c230" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M -70 0 L -120 ${-34 + Math.sin(f / 3) * 10} L -110 0 L -120 ${34 + Math.sin(f / 3) * 10} Z`} fill="#2fa36b" />
    <path d="M -80 0 Q -40 -52 40 -40 Q 90 -30 96 0 Q 90 30 40 38 Q -40 50 -80 0 Z" fill={color} />
    <path d="M -40 -38 Q 0 -70 50 -38 Z" fill="#2fa36b" />
    <path d="M -60 4 Q 0 26 80 6" stroke="#3cc0ff" strokeWidth={6} fill="none" opacity={0.7} />
    <circle cx={64} cy={-8} r={8} fill="#111" />
  </g>
);
const Tortuga: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-1, 1].map((k) => (
      <React.Fragment key={k}>
        <ellipse cx={50} cy={k * 52} rx={44} ry={16} fill="#5a8a4a" transform={`rotate(${k * (30 + Math.sin(f / 5) * 18)} 20 ${k * 30})`} />
        <ellipse cx={-50} cy={k * 42} rx={28} ry={12} fill="#5a8a4a" transform={`rotate(${k * -30} -40 ${k * 30})`} />
      </React.Fragment>
    ))}
    <ellipse cx={100} cy={0} rx={32} ry={24} fill="#6b9c58" />
    <circle cx={114} cy={-8} r={5} fill="#111" />
    <ellipse cx={0} cy={0} rx={86} ry={64} fill="#6b4a2a" />
    {[[-30, -20], [20, -24], [-28, 22], [24, 22], [0, 0]].map(([a, b], i) => (
      <ellipse key={i} cx={a} cy={b} rx={22} ry={18} fill="#8a6a3a" stroke="#4a3018" strokeWidth={4} />
    ))}
  </g>
);
const Pajaro: React.FC<{ x: number; y: number; s?: number; f: number; color?: string }> = ({ x, y, s = 1, f, color = "#f4f4f0" }) => {
  const a = Math.sin(f / 3) * 40;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M -10 0 Q -60 ${-30 - a} -120 ${-10 - a * 1.4}`} stroke={color} strokeWidth={18} fill="none" strokeLinecap="round" />
      <path d={`M 10 0 Q 60 ${-30 - a} 120 ${-10 - a * 1.4}`} stroke={color} strokeWidth={18} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={4} rx={40} ry={20} fill={color} />
      <circle cx={38} cy={-6} r={16} fill={color} />
      <path d="M 52 -8 L 76 -2 L 52 2 Z" fill="#f0a020" />
    </g>
  );
};

// vaso con agua (dulce o de mar, con cristales de sal)
const Vaso: React.FC<{ x: number; y: number; s?: number; f: number; sal?: number; nivel?: number }> = ({ x, y, s = 1, f, sal = 0, nivel = 0.75 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <clipPath id={`vaso${x}`}>
      <path d="M -110 -260 L 110 -260 L 86 0 L -86 0 Z" />
    </clipPath>
    <g clipPath={`url(#vaso${x})`}>
      <rect x={-130} y={-260 * nivel + Math.sin(f / 6) * 4} width={260} height={300} fill={sal > 0 ? "rgba(40,140,170,0.75)" : "rgba(120,200,255,0.7)"} />
      {Array.from({ length: Math.round(sal * 40) }, (_, i) => (
        <rect key={i} x={-90 + random(`sx${i}`) * 170} y={-20 - random(`sy${i}`) * 170 * nivel} width={10} height={10} fill="#fff" opacity={0.85} transform={`rotate(${random(`sr${i}`) * 90 + f})`} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      ))}
    </g>
    <path d="M -110 -260 L 110 -260 L 86 0 L -86 0 Z" fill="rgba(255,255,255,0.12)" stroke="#e6f4ff" strokeWidth={8} />
    <path d="M -80 -230 L -64 -30" stroke="#fff" strokeWidth={10} opacity={0.5} strokeLinecap="round" />
  </g>
);

// gotas que caen en diagonal (lluvia)
const Lluvia: React.FC<{ f: number; fuerza: number; semilla?: string }> = ({ f, fuerza, semilla = "ll" }) =>
  fuerza > 0 ? (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: fuerza }}>
      {Array.from({ length: 110 }, (_, i) => {
        const v = 38 + random(`${semilla}v${i}`) * 20;
        const y = ((f * v + random(`${semilla}y${i}`) * H) % (H + 200)) - 100;
        const x = random(`${semilla}x${i}`) * (W + 300) - (y / H) * 260;
        return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 54} stroke="rgba(220,235,255,0.6)" strokeWidth={3} />;
      })}
    </svg>
  ) : null;

// ---------- 1 · gancho: una balsa diminuta en medio del océano ----------
const gancho: Fabrica = ({ en, dur }) => ({ f }) => {
  const tde = en("deriva");
  const tma = en("mar");
  const tag = en("agua");
  const tna = en("nadie");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.55, x: -60, y: -260 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={980} cielo={["#2f7fc8", "#cfe9ff"]} sol={{ x: 820, y: 760, r: 70 }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Nube x={220} y={720} s={0.7} color="rgba(255,255,255,0.85)" />
          <Nube x={620} y={620} s={0.45} color="rgba(255,255,255,0.7)" />
        </svg>
        <EnBalsa f={f} x={540} y={1360} s={0.42} acciones={[[0, "reposo"], [tna, "alarma"]]} cara={f > tag ? "preocupado" : "serio"} />
      </Plano>
      {/* radar vacío: nadie en kilómetros */}
      {f > tna && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(f, tna, tna + 8) }}>
          {[160, 320, 480].map((r) => (
            <circle key={r} cx={540} cy={1280} r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeDasharray="12 14" />
          ))}
          <path d={`M 540 1280 L ${540 + Math.cos(f / 8) * 480} ${1280 + Math.sin(f / 8) * 480}`} stroke="rgba(160,255,190,0.7)" strokeWidth={6} />
        </svg>
      )}
      <Cine f={f} vineta={0.55} />
      <Rotulo f={f} inicio={0} texto={"¿QUÉ LE PASA\nA TU CUERPO…"} y={220} tam={100} color="#fff" />
      <Rotulo f={f} inicio={tde} texto="A LA DERIVA" y={480} tam={92} color="#1a1000" fondo={AMARILLO} giro={-2} />
      <Rotulo f={f} inicio={tma} texto="EN EL MAR" y={620} tam={70} color="#fff" />
      <Rotulo f={f} inicio={tag} texto="SIN AGUA" y={1560} x={300} tam={62} fondo={ROJO} color="#fff" giro={-3} />
      <Rotulo f={f} inicio={tna} texto="SIN NADIE" y={1680} x={330} tam={62} fondo="#fff" color="#111" giro={2} />
    </AbsoluteFill>
  );
};

// ---------- 2 · sed rodeado de agua: un vaso de mar lleno de sal ----------
const sed: Fabrica = ({ en, dur }) => ({ f }) => {
  const tro = en("rodeado");
  const tsed = en("sed");
  const tsal = en("sal");
  const tbe = en("beberlo");
  const tse = en("seca");
  const cam = mover(f, 0, dur, { z: 1.05, x: 30, y: 0 }, { z: 1.2, x: -30, y: -40 });
  const sal = tramo(f, tsal - 4, tsal + 14);
  const gota = tramo(f, tbe, tse + 6);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={900} cielo={["#4a9be0", "#e6f4ff"]} sol={{ x: 220, y: 600, r: 80 }} />
        <EnBalsa f={f} x={360} y={1580} s={0.95} acciones={[[0, "reposo"], [tsed, "triste"], [tse, "alarma"]]} cara={f > tsed ? "preocupado" : "serio"} calor={0.3} />
      </Plano>
      {f > tro && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(f, tsal - 10, tsal) }}>
          <g transform={`translate(0 ${(1 - muelle(f, tsal - 10, 10)) * 300})`}>
            <Vaso x={790} y={1260} s={1.1} f={f} sal={sal} />
          </g>
        </svg>
      )}
      {/* la gota de agua del cuerpo se evapora: te secas */}
      {f > tbe && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(620 ${900 + gota * 60}) scale(${1 - gota * 0.7})`} opacity={1 - gota * 0.6}>
            <path d="M 0 -90 Q 60 0 50 30 Q 40 80 0 80 Q -40 80 -50 30 Q -60 0 0 -90 Z" fill={AZUL} stroke="#fff" strokeWidth={6} />
          </g>
          {f > tse && <line x1={540} y1={820} x2={700} y2={1040} stroke={ROJO} strokeWidth={18} strokeLinecap="round" opacity={tramo(f, tse, tse + 4)} />}
        </svg>
      )}
      <Cine f={f} vineta={0.6} tinte="rgba(255,190,90,0.25)" />
      <Rotulo f={f} inicio={tro} texto="RODEADO DE AGUA…" y={470} tam={60} color="#fff" />
      <Rotulo f={f} inicio={tsed} texto="…Y MUERTO DE SED" y={570} tam={66} fondo={ROJO} color="#fff" giro={-2} />
      <Rotulo f={f} inicio={tsal} texto="3,5 % DE SAL" y={1000} x={790} tam={52} fondo="#fff" color="#0b3d63" giro={3} />
    </AbsoluteFill>
  );
};

// ---------- 3 · riñones: sale más agua de la que entra; 3 días ----------
const rinon: Fabrica = ({ en }) => ({ f }) => {
  const tri = en("rinones");
  const tma = en("mas");
  const tsa = en("sal");
  const tdu = en("dulce");
  const t3 = en("3");
  const entra = tramo(f, tri, tri + 16);
  const sale = tramo(f, tma, tma + 22);
  const bateria = interpolate(f, [tdu, t3 + 20], [1, 0.12], clamp);
  const latido = f > t3 ? 1 + 0.05 * Math.max(0, Math.sin(f / 4)) : 1;
  const Rinon = ({ x, giro }: { x: number; giro: number }) => (
    <g transform={`translate(${x} 960) rotate(${giro}) scale(${latido})`}>
      <path d="M 0 -170 Q 120 -180 130 -40 Q 140 90 40 160 Q -40 210 -100 140 Q -60 80 -60 20 Q -60 -40 -100 -90 Q -70 -170 0 -170 Z" fill="#b8394a" stroke="#ffd0d6" strokeWidth={6} />
      <path d="M -40 -60 Q 20 0 -40 60" stroke="#7a1d2a" strokeWidth={16} fill="none" strokeLinecap="round" />
    </g>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "radial-gradient(ellipse at 50% 45%, #10314f 0%, #061524 70%, #02070d 100%)" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Rinon x={350} giro={0} />
        <g transform="translate(1080 0) scale(-1 1)">
          <Rinon x={350} giro={0} />
        </g>
        {/* entra un poco de agua salada (puntos blancos = sal) */}
        {Array.from({ length: 10 }, (_, i) => {
          const t = ((f - tri + i * 6) % 50) / 50;
          if (f < tri) return null;
          const y = 520 + t * 300;
          return (
            <g key={i} opacity={entra * (1 - t * 0.5)}>
              <circle cx={540 + Math.sin(i * 2) * 30} cy={y} r={14} fill="rgba(80,180,230,0.9)" />
              <rect x={536 + Math.sin(i * 2) * 30} y={y - 4} width={8} height={8} fill="#fff" />
            </g>
          );
        })}
        {/* sale mucha más agua para echar la sal */}
        {Array.from({ length: 24 }, (_, i) => {
          if (f < tma) return null;
          const t = ((f - tma + i * 3) % 60) / 60;
          const lado = i % 2 ? 1 : -1;
          const x = 540 + lado * (200 + t * 60);
          const y = 1150 + t * 360;
          return <ellipse key={i} cx={x + Math.sin(i) * 20} cy={y} rx={14} ry={20} fill={AZUL} opacity={sale * (1 - t)} />;
        })}
      </svg>
      <T x={540} y={1040} tam={40} alinear="center" color="#cfe6ff" op={tramo(f, tsa, tsa + 6)}>
        {"PARA ECHAR LA SAL"}
      </T>
      <Rotulo f={f} inicio={tri} texto="ENTRA:  1 VASO" y={460} x={540} tam={52} fondo="rgba(5,20,40,0.85)" color={AZUL} />
      <Rotulo f={f} inicio={tma} texto="SALE: MÁS DE 1 VASO" y={1560} x={420} tam={50} fondo={ROJO} color="#fff" giro={-2} />
      {/* batería de agua del cuerpo */}
      {f > tdu && (
        <div style={{ position: "absolute", left: 340, top: 600, width: 400, height: 130, borderRadius: 24, border: "6px solid #fff", opacity: tramo(f, tdu, tdu + 6) }}>
          <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: `${bateria * 94}%`, borderRadius: 14, background: bateria < 0.3 ? ROJO : bateria < 0.6 ? AMARILLO : VERDE }} />
          <div style={{ position: "absolute", right: -26, top: 36, width: 20, height: 46, borderRadius: 6, background: "#fff" }} />
          <T x={200} y={34} tam={50} alinear="center" ancho={400}>{`${Math.round(bateria * 100)} %`}</T>
        </div>
      )}
      {f > t3 && (
        <div style={{ position: "absolute", left: 0, top: 760, width: W, textAlign: "center", fontFamily: SANS, fontWeight: 900, transform: `scale(${muelle(f, t3, 9)})` }}>
          <div style={{ fontSize: 210, color: "#fff", lineHeight: 1, textShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>3</div>
          <div style={{ fontSize: 60, color: AMARILLO, textShadow: "0 6px 20px rgba(0,0,0,0.9)" }}>DÍAS SIN AGUA DULCE</div>
        </div>
      )}
      <Cine f={f} vineta={0.6} />
    </AbsoluteFill>
  );
};

// ---------- 4 · sol de arriba y de abajo; la sal abre heridas ----------
const sol: Fabrica = ({ en, dur }) => ({ f }) => {
  const tso = en("sombra");
  const tar = en("arriba");
  const tre = en("rebota");
  const tsal = en("sal");
  const the = en("heridas");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 40 }, { z: 1.25, x: 40, y: -60 });
  const calor = tramo(f, tar, the);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Calima id="calima-sol" f={f} fuerza={10 + calor * 18} />
      <Plano cam={cam} prof={1} filtro="url(#calima-sol)">
        <Mar f={f} horizonte={760} cielo={["#ffd77a", "#fff4d6"]} agua={["#2a8ac0", "#0b3d63"]} sol={{ x: 540, y: 300, r: 120, color: "#fffbe6" }} />
        <EnBalsa f={f} x={420} y={1520} s={1} acciones={[[0, "reposo"], [tar, "triste"], [the, "sorpresa"]]} cara={f > tar ? "preocupado" : "serio"} calor={calor} />
      </Plano>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* rayos que bajan del sol y rayos que rebotan en el agua */}
        {f > tar &&
          [-1, 0, 1].map((k) => {
            const t = tramo(f, tar + k * 3, tar + 14 + k * 3);
            return <line key={k} x1={540 + k * 60} y1={420} x2={540 + k * 60 + (420 + k * 40 - 540 - k * 60) * t} y2={420 + 640 * t} stroke={AMARILLO} strokeWidth={14} strokeLinecap="round" strokeDasharray="30 22" strokeDashoffset={-f * 4} />;
          })}
        {f > tre &&
          [-1, 1].map((k) => {
            const t = tramo(f, tre, tre + 14);
            return <line key={k} x1={420 + k * 260} y1={1660} x2={420 + k * 260 + (-k * 120) * t} y2={1660 - 380 * t} stroke="#fff2a0" strokeWidth={12} strokeLinecap="round" strokeDasharray="26 20" strokeDashoffset={f * 4} />;
          })}
        {/* heridas de sal en los brazos */}
        {f > the &&
          [[300, 1260], [540, 1250], [330, 1330], [520, 1340]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={14 * muelle(f, the + i * 3, 10)} fill="#d8303a" stroke="#ffd6c0" strokeWidth={4} />
          ))}
        {f > tsal &&
          Array.from({ length: 20 }, (_, i) => (
            <rect key={i} x={240 + random(`cs${i}`) * 360} y={1180 + random(`ct${i}`) * 200} width={8} height={8} fill="#fff" opacity={tramo(f, tsal, tsal + 10) * 0.9} transform={`rotate(45 ${244 + random(`cs${i}`) * 360} ${1184 + random(`ct${i}`) * 200})`} />
          ))}
      </svg>
      <Cine f={f} vineta={0.55} tinte="rgba(255,140,40,0.35)" />
      <Rotulo f={f} inicio={tso} texto="CERO SOMBRA" y={470} tam={66} fondo="#fff" color="#7a2a00" giro={-2} />
      <Rotulo f={f} inicio={tre} texto="EL SOL TE DA ARRIBA Y ABAJO" y={590} tam={44} color="#fff" />
      <Rotulo f={f} inicio={the} texto="HERIDAS DE SAL" y={960} x={720} tam={52} fondo={ROJO} color="#fff" giro={3} />
    </AbsoluteFill>
  );
};

// ---------- 5 · de noche: viento, mojado y tiritando ----------
const noche: Fabrica = ({ en, dur }) => ({ f }) => {
  const tno = en("noche");
  const tmo = en("mojado");
  const tvi = en("viento");
  const tti = en("tiritas");
  const ttr = en("tropico");
  const cam = mover(f, 0, dur, { z: 1.1, x: -30, y: 0 }, { z: 1.0, x: 30, y: 20 });
  const tirita = f > tti ? temblor(f, 0.35) : { x: 0, y: 0 };
  const temp = interpolate(f, [tvi, ttr + 20], [36.6, 35.2], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={980} cielo={["#03081c", "#18295a"]} agua={["#0c2348", "#02081a"]} sol={{ x: 780, y: 620, r: 60 }} luna estrellas fuerza={1.4} />
        <div style={{ position: "absolute", inset: 0, transform: `translate(${tirita.x}px, ${tirita.y}px)` }}>
          <EnBalsa f={f} x={400} y={1540} s={1} fuerza={1.6} acciones={[[0, "reposo"], [tti, "triste"]]} cara={f > tmo ? "preocupado" : "serio"} piel={f > tti ? "#d9c2b8" : undefined} />
        </div>
      </Plano>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* ráfagas de viento */}
        {f > tvi &&
          Array.from({ length: 9 }, (_, i) => {
            const t = ((f - tvi + i * 9) % 40) / 40;
            const y = 800 + i * 90;
            return <path key={i} d={`M ${-200 + t * 1500} ${y} q 60 -20 120 0 t 120 0`} stroke="rgba(200,220,255,0.5)" strokeWidth={6} fill="none" strokeLinecap="round" opacity={1 - Math.abs(t - 0.5) * 1.6} />;
          })}
        {/* gotas que te escurren */}
        {f > tmo &&
          Array.from({ length: 8 }, (_, i) => {
            const t = ((f - tmo + i * 7) % 36) / 36;
            return <ellipse key={i} cx={320 + i * 22} cy={1180 + t * 220} rx={5} ry={9} fill="rgba(200,230,255,0.85)" opacity={1 - t} />;
          })}
      </svg>
      <Cine f={f} vineta={0.75} tinte="rgba(40,80,180,0.35)" />
      <Rotulo f={f} inicio={tno} texto="DE NOCHE" y={470} tam={80} color="#cfe0ff" />
      {f > tti && (
        <div style={{ position: "absolute", left: 640, top: 760, width: 340, padding: "16px 0", textAlign: "center", borderRadius: 28, background: "rgba(5,10,30,0.8)", border: `4px solid ${AZUL}`, fontFamily: SANS, fontWeight: 900, transform: `scale(${muelle(f, tti, 10)})` }}>
          <div style={{ fontSize: 30, color: "#cfe6ff" }}>TU CUERPO</div>
          <div style={{ fontSize: 86, color: AZUL, lineHeight: 1 }}>{temp.toFixed(1).replace(".", ",")}°</div>
        </div>
      )}
      <Rotulo f={f} inicio={tti} texto="TIRITAS" y={590} tam={74} fondo={AZUL} color="#001a33" giro={-3} />
      <Rotulo f={f} inicio={ttr} texto="…AUNQUE SEA EL TRÓPICO" y={1100} x={700} tam={40} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 6 · espejismos: barcos y tierra que no existen ----------
const mente: Fabrica = ({ en, dur }) => ({ f }) => {
  const tce = en("cerebro");
  const tfa = en("fallar");
  const tba = en("barcos");
  const tti = en("tierra");
  const tex = en("existen");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.18, x: -20, y: -40 });
  const fantasma = (t0: number) => (f < t0 ? 0 : f > tex + 4 ? 1 - tramo(f, tex + 4, tex + 10) : tramo(f, t0, t0 + 12) * (0.55 + 0.35 * Math.sin(f / 4)));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Calima id="calima-mente" f={f} fuerza={14 + tramo(f, tce, tfa) * 30} />
      <Plano cam={cam} prof={1} filtro="url(#calima-mente)">
        <Mar f={f} horizonte={1000} cielo={["#e9a066", "#ffe7c2"]} agua={["#3a7fb0", "#0b2c4a"]} sol={{ x: 200, y: 700, r: 90, color: "#fff0c8" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* barco fantasma */}
          <g opacity={fantasma(tba)} transform="translate(720 990)">
            <path d="M -170 0 L 170 0 L 130 50 L -140 50 Z" fill="#40312a" />
            <rect x={-80} y={-70} width={150} height={70} fill="#eee3d0" />
            <rect x={-30} y={-130} width={40} height={60} fill="#c0392b" />
            <path d="M -10 -140 q 30 -40 80 -50" stroke="rgba(80,80,80,0.5)" strokeWidth={14} fill="none" />
          </g>
          {/* isla fantasma */}
          <g opacity={fantasma(tti)} transform="translate(330 1000)">
            <path d="M -220 0 Q -120 -110 0 -90 Q 120 -120 220 0 Z" fill="#3f7a3a" />
            <path d="M 20 -100 Q 30 -200 10 -250" stroke="#6b4a2a" strokeWidth={14} fill="none" />
            <path d="M 10 -250 q -80 0 -110 50 M 10 -250 q 80 -10 110 40 M 10 -250 q -40 -40 -90 -40 M 10 -250 q 40 -50 90 -40" stroke="#2f8a3a" strokeWidth={16} fill="none" strokeLinecap="round" />
          </g>
        </svg>
        <EnBalsa f={f} x={400} y={1560} s={0.95} acciones={[[0, "reposo"], [tba, "senalar"], [tex, "sorpresa"]]} cara={f > tex ? "sorpresa" : f > tba ? "feliz" : "serio"} calor={0.6} />
      </Plano>
      <Cine f={f} vineta={0.7} tinte="rgba(200,80,160,0.25)" />
      <Rotulo f={f} inicio={tce} texto="TU CEREBRO FALLA" y={470} tam={64} fondo="#fff" color="#5a1050" giro={-2} />
      <Rotulo f={f} inicio={tba} texto="¿UN BARCO?" y={780} x={760} tam={50} color="#fff" />
      <Rotulo f={f} inicio={tti} texto="¿TIERRA?" y={700} x={300} tam={50} color="#fff" />
      <Sello f={f} inicio={tex} x={540} y={1200} texto="NO EXISTEN" color={ROJO} tam={80} giro={-6} />
    </AbsoluteFill>
  );
};

// ---------- 7 · Steven Callahan: 76 días en balsa, destiladores solares ----------
const callahan: Fabrica = ({ en, dur }) => ({ f }) => {
  const t82 = en("1982");
  const tst = en("steven");
  const t76 = en("76");
  const tba = en("balsa");
  const tat = en("atlantico");
  const tdu = en("dulce");
  const tde = en("destiladores");
  const cam = mover(f, 0, dur, { z: 1.15, x: 0, y: -40 }, { z: 1.0, x: 0, y: 20 });
  const dias = Math.round(interpolate(f, [t76 - 6, t76 + 24], [1, 76], clamp));
  const destil = muelle(f, tde - 4, 12);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={1020} cielo={["#4f8fc6", "#dbeeff"]} sol={{ x: 840, y: 780, r: 60 }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Nube x={260} y={760} s={0.6} color="rgba(255,255,255,0.9)" />
          {/* destilador solar hinchable: una bola transparente que gotea agua dulce */}
          {f > tde - 4 && (
            <g transform={`translate(820 ${1430 + Math.sin(f / 14) * 12}) scale(${destil})`}>
              <ellipse cx={0} cy={60} rx={110} ry={26} fill="rgba(0,40,70,0.4)" />
              <circle cx={0} cy={-40} r={110} fill="rgba(220,240,255,0.35)" stroke="#e9f6ff" strokeWidth={6} />
              <circle cx={0} cy={-40} r={60} fill="rgba(30,30,30,0.55)" />
              <path d="M -70 -110 Q -40 -140 0 -142" stroke="#fff" strokeWidth={10} fill="none" opacity={0.7} strokeLinecap="round" />
              {Array.from({ length: 4 }, (_, i) => {
                const t = ((f + i * 12) % 48) / 48;
                return <ellipse key={i} cx={-20 + i * 14} cy={70 + t * 90} rx={6} ry={10} fill={AZUL} opacity={1 - t} />;
              })}
            </g>
          )}
        </svg>
        <EnBalsa f={f} x={380} y={1560} s={1} toldo={tramo(f, tba - 6, tba + 6)} acciones={[[0, "reposo"], [tdu, "senalar"]]} cara={f > tdu ? "feliz" : "serio"} calor={0.25} />
      </Plano>
      <Cine f={f} vineta={0.6} tinte="rgba(255,200,120,0.18)" />
      <Rotulo f={f} inicio={t82} texto="1982" y={460} x={260} tam={90} fondo={AMARILLO} color="#1a1000" giro={-3} />
      <Rotulo f={f} inicio={tst} texto="STEVEN CALLAHAN" y={480} x={700} tam={44} fondo="#fff" color="#111" giro={2} />
      {f > t76 - 6 && (
        <div style={{ position: "absolute", left: 0, top: 600, width: W, textAlign: "center", fontFamily: SANS, fontWeight: 900, transform: `scale(${0.7 + 0.3 * muelle(f, t76 - 6, 10)})` }}>
          <div style={{ fontSize: 170, color: "#fff", lineHeight: 1, textShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>{dias}</div>
          <div style={{ fontSize: 44, color: "#fff", textShadow: "0 4px 14px rgba(0,0,0,0.7)" }}>DÍAS EN UNA BALSA</div>
        </div>
      )}
      <Rotulo f={f} inicio={tat} texto="OCÉANO ATLÁNTICO" y={1720} x={360} tam={40} color="#fff" />
      <Rotulo f={f} inicio={tde} texto={"DESTILADOR\nSOLAR"} y={1100} x={820} tam={40} fondo="rgba(5,20,40,0.85)" color={AZUL} giro={3} />
    </AbsoluteFill>
  );
};

// ---------- 8 · bajo la balsa: pesca con arpón, pierde un tercio de su peso, llega vivo ----------
const peces: Fabrica = ({ en, dur }) => ({ f }) => {
  const tpe = en("pescaba");
  const tar = en("arpon");
  const tte = en("tercio");
  const tpes = en("peso");
  const tvi = en("vivo");
  const tca = en("caribe");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.12, x: 0, y: -30 });
  const lanza = tramo(f, tar, tar + 6);
  const peso = interpolate(f, [tte, tpes + 16], [100, 67], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        {/* plano partido: arriba la balsa, abajo el agua y los dorados */}
        <AbsoluteFill style={{ background: "linear-gradient(#8fcaf5 0px, #d9f0ff 560px, #1d78b8 560px, #0a3a66 1300px, #031628 1920px)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M ${i * 180 - 60} 560 L ${i * 180 + 40 + Math.sin(f / 20 + i) * 30} 1900 L ${i * 180 + 90} 1900 L ${i * 180 + 20} 560 Z`} fill="rgba(200,240,255,0.06)" />
          ))}
          <path d={`M -20 560 ${Array.from({ length: 30 }, (_, i) => `L ${i * 40} ${560 + Math.sin(i / 2 + f / 8) * 8}`).join(" ")} L 1100 560`} stroke="rgba(255,255,255,0.7)" strokeWidth={6} fill="none" />
          {/* sombra de la balsa vista desde abajo */}
          <ellipse cx={420} cy={590} rx={290} ry={42} fill="rgba(60,25,5,0.85)" />
          {Array.from({ length: 5 }, (_, i) => {
            const x = ((f * (2.4 + i * 0.4) + i * 260) % 1400) - 200;
            const y = 900 + i * 130 + Math.sin(f / 10 + i) * 20;
            const pinchado = i === 1 && f > tar + 6;
            if (pinchado) return null;
            return <Pez key={i} x={x} y={y} s={0.9 - i * 0.05} f={f + i * 7} />;
          })}
          {/* el arpón baja y atrapa un dorado */}
          {f > tpe && (
            <g transform={`translate(480 ${560 + lanza * 380})`}>
              <line x1={0} y1={-400} x2={0} y2={0} stroke="#6b4a2a" strokeWidth={12} />
              <path d="M -16 -6 L 0 40 L 16 -6 Z" fill="#cfd8dc" />
              {f > tar + 6 && <Pez x={0} y={50} s={0.8} f={0} />}
            </g>
          )}
        </svg>
        <div style={{ position: "absolute", inset: 0, clipPath: "inset(0 0 1360px 0)" }}>
          <EnBalsa f={f} x={420} y={600} s={0.7} toldo={1} acciones={[[0, "reposo"], [tar, "pulsar"], [tvi, "celebrar"]]} cara={f > tvi ? "euforico" : "serio"} piel={f > tte && f < tvi ? "#e8c8a8" : undefined} />
        </div>
      </Plano>
      <Cine f={f} vineta={0.6} tinte="rgba(0,120,160,0.2)" />
      <Rotulo f={f} inicio={tar} texto="ARPÓN" y={1240} x={300} tam={54} fondo="#fff" color="#111" giro={-3} />
      {f > tte && (
        <div style={{ position: "absolute", left: 90, top: 1420, width: 560, height: 150, borderRadius: 28, background: "rgba(5,15,30,0.85)", border: "3px solid rgba(255,255,255,0.3)", transform: `scale(${muelle(f, tte, 10)})` }}>
          <T x={28} y={18} tam={30} color="#cfe6ff">SU PESO</T>
          <T x={380} y={14} tam={52} color={ROJO}>{`${Math.round(peso)} %`}</T>
          <div style={{ position: "absolute", left: 28, top: 90, width: 500, height: 30, borderRadius: 15, background: "rgba(255,255,255,0.15)" }}>
            <div style={{ width: `${peso}%`, height: "100%", borderRadius: 15, background: peso < 75 ? ROJO : AMARILLO }} />
          </div>
        </div>
      )}
      <Rotulo f={f} inicio={tte} texto="− 1/3" y={1240} x={780} tam={90} color={ROJO} />
      <Sello f={f} inicio={tvi} x={540} y={760} texto="LLEGÓ VIVO" color="#12a052" tam={76} giro={-5} />
      <Rotulo f={f} inicio={tca} texto="AL CARIBE" y={860} x={540} tam={50} fondo={AMARILLO} color="#1a1000" giro={3} />
    </AbsoluteFill>
  );
};

// ---------- 9 · mito 1: «un poco de agua de mar no hace daño» ----------
const mito1: Fabrica = ({ en, dur }) => ({ f }) => {
  const tmi = en("mito");
  const tpo = en("poco");
  const tfa = en("falso");
  const tde = en("deshidrata");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.12, x: 0, y: -30 });
  const marchita = tramo(f, tfa, tde + 14);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={1100} cielo={["#2a6fae", "#a8d6ff"]} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(540 ${1300 - (1 - muelle(f, tpo, 11)) * -400})`}>
            <Vaso x={0} y={0} s={1.5} f={f} sal={0.6} nivel={0.35} />
          </g>
          <text x={540} y={1180} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={40} fill="#fff" opacity={tramo(f, tpo, tpo + 6)}>
            «SOLO UN SORBITO»
          </text>
          {/* el cuerpo se queda sin agua: gotas que se evaporan de la silueta */}
          {f > tde &&
            Array.from({ length: 10 }, (_, i) => {
              const t = ((f - tde + i * 5) % 40) / 40;
              return <ellipse key={i} cx={260 + (i % 5) * 140} cy={1500 - t * 300} rx={10 * (1 - t)} ry={16 * (1 - t)} fill={AZUL} opacity={1 - t} />;
            })}
        </svg>
      </Plano>
      <AbsoluteFill style={{ background: `rgba(120,60,0,${marchita * 0.25})` }} />
      <Cine f={f} vineta={0.65} />
      <Rotulo f={f} inicio={tmi} texto="MITO Nº 1" y={460} tam={80} fondo={ROJO} color="#fff" giro={-3} />
      <Rotulo f={f} inicio={tpo} texto={"«UN POCO DE AGUA\nDE MAR NO HACE DAÑO»"} y={610} tam={50} color="#fff" />
      {f > tfa && <Marca f={f} inicio={tfa} x={540} y={1180} tam={420} tipo="x" />}
      <Sello f={f} inicio={tfa} x={540} y={1610} texto="FALSO" color={ROJO} tam={96} giro={-8} />
    </AbsoluteFill>
  );
};

// ---------- 10 · mito 2: nadar a la costa vs. quedarse en la balsa (desde el avión de rescate) ----------
const mito2: Fabrica = ({ en, dur }) => ({ f }) => {
  const tmi = en("mito");
  const tna = en("nadar");
  const tsa = en("salva");
  const tqu = en("quedarte");
  const tve = en("ve");
  const tca = en("cabeza");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.08, x: 0, y: -20 });
  const ola = (x: number, y: number, k: number) => `M ${x - 80} ${y} q 40 ${-14 - Math.sin(f / 6 + k) * 6} 80 0 t 80 0`;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        {/* vista cenital del mar */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #1e6aa6 0%, #0b3d6b 60%, #052340 100%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <path key={i} d={ola(random(`ox${i}`) * W, random(`oy${i}`) * H + Math.sin(f / 20 + i) * 10, i)} stroke="rgba(220,240,255,0.25)" strokeWidth={4} fill="none" />
          ))}
          {/* nadador: una cabecita */}
          <g transform={`translate(300 ${1040 + Math.sin(f / 8) * 6})`}>
            <circle r={60} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={4} strokeDasharray="8 10" />
            <circle r={16} fill="#5a3a22" />
            <path d={`M -24 4 q 12 ${-10 + Math.sin(f / 3) * 8} 24 0 t 24 0`} stroke="#fff" strokeWidth={4} fill="none" />
          </g>
          {/* balsa vista desde arriba */}
          <g transform={`translate(760 1060) rotate(${Math.sin(f / 20) * 8}) scale(${0.6 + 0.4 * muelle(f, tqu, 12)})`} opacity={f > tqu ? 1 : 0.85}>
            <circle r={150} fill={NARANJA} />
            <circle r={110} fill="#3a1a0a" />
            <path d="M -110 0 A 110 110 0 0 1 110 0 Z" fill="#ff7b22" />
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <rect key={k} x={-14} y={-158} width={28} height={16} fill="#e9eef2" transform={`rotate(${k * 60})`} />
            ))}
          </g>
          {/* el foco del avión de rescate barre el mar */}
          {f > tsa && (
            <circle cx={interpolate(f, [tsa, tve], [200, 760], clamp)} cy={interpolate(f, [tsa, tve], [700, 1060], clamp)} r={230} fill="rgba(255,250,200,0.18)" stroke="rgba(255,250,200,0.5)" strokeWidth={4} />
          )}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.6} />
      <Rotulo f={f} inicio={tmi} texto="MITO Nº 2" y={460} tam={80} fondo={ROJO} color="#fff" giro={-3} />
      <Rotulo f={f} inicio={tna} texto="«NADA HACIA LA COSTA»" y={590} tam={52} color="#fff" />
      {f > tqu && <Marca f={f} inicio={tqu} x={300} y={1040} tam={200} tipo="x" />}
      {f > tve && <Marca f={f} inicio={tve} x={760} y={1060} tam={200} tipo="ok" />}
      <Rotulo f={f} inicio={tqu} texto="QUÉDATE EN LA BALSA" y={1280} x={600} tam={50} fondo={VERDE} color="#00240f" giro={-2} />
      <Rotulo f={f} inicio={tca} texto="UNA CABEZA NO SE VE" y={830} x={300} tam={36} color="#ffd0d0" />
    </AbsoluteFill>
  );
};

// ---------- 11 · truco: el día 1 no bebas; recoge la lluvia ----------
const truco: Fabrica = ({ en, dur }) => ({ f }) => {
  const ttr = en("truco");
  const tpr = en("primer");
  const tna = en("nada");
  const tgu = en("guarda");
  const tgo = en("gota");
  const tll = en("lluvia");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.15, x: 30, y: -40 });
  const lluvia = tramo(f, tgo - 10, tgo + 6);
  const nivel = interpolate(f, [tgo, tll + 40], [0.1, 0.8], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={1000} cielo={lluvia > 0 ? ["#3a4a5e", "#9aaabb"] : ["#4f8fc6", "#dbeeff"]} agua={["#2a5f88", "#08223d"]} fuerza={1 + lluvia * 0.5} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {[[200, 700], [600, 620], [900, 760]].map(([x, y], i) => (
            <Nube key={i} x={x + Math.sin(f / 40 + i) * 20} y={y - (1 - lluvia) * 400} s={1.1} color="#5c6878" />
          ))}
        </svg>
        <EnBalsa f={f} x={380} y={1560} s={1} toldo={1} acciones={[[0, "reposo"], [tna, "silencio"], [tgo, "celebrar"]]} cara={f > tgo ? "feliz" : "serio"} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {/* botella que se llena con la lluvia que recoge el toldo */}
          {f > tgu && (
            <g transform={`translate(800 ${1380 + (1 - muelle(f, tgu, 12)) * 400})`}>
              <clipPath id="botella">
                <path d="M -60 -220 L -60 -280 L -30 -300 L -30 -340 L 30 -340 L 30 -300 L 60 -280 L 60 0 L -60 0 Z" />
              </clipPath>
              <rect x={-70} y={-300 * nivel} width={140} height={320} fill={AZUL} clipPath="url(#botella)" />
              <path d="M -60 -220 L -60 -280 L -30 -300 L -30 -340 L 30 -340 L 30 -300 L 60 -280 L 60 0 L -60 0 Z" fill="rgba(255,255,255,0.15)" stroke="#e9f6ff" strokeWidth={7} />
            </g>
          )}
        </svg>
      </Plano>
      <Lluvia f={f} fuerza={lluvia} />
      <Cine f={f} vineta={0.6} tinte={lluvia > 0 ? "rgba(60,90,140,0.3)" : undefined} />
      <Rotulo f={f} inicio={ttr} texto="TRUCO DE SUPERVIVENCIA" y={460} tam={52} fondo={VERDE} color="#00240f" giro={-2} />
      {f > tpr && (
        <div style={{ position: "absolute", left: 600, top: 600, width: 380, height: 300, borderRadius: 26, background: "#fff", boxShadow: "0 14px 34px rgba(0,0,0,0.45)", overflow: "hidden", fontFamily: SANS, fontWeight: 900, textAlign: "center", transform: `rotate(3deg) scale(${muelle(f, tpr, 10)})` }}>
          <div style={{ background: ROJO, color: "#fff", fontSize: 40, padding: "12px 0" }}>DÍA 1</div>
          <div style={{ fontSize: 110, color: "#111", lineHeight: 1.1 }}>0 ml</div>
          <div style={{ fontSize: 30, color: "#555" }}>{f > tna ? "NO BEBAS NADA" : ""}</div>
        </div>
      )}
      <Rotulo f={f} inicio={tll} texto="CADA GOTA DE LLUVIA" y={1000} x={360} tam={46} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 12 · el récord: Alvarenga, 438 días en una barca en el Pacífico ----------
const Barca: React.FC<{ f: number; x: number; y: number; s?: number }> = ({ f, x, y, s = 1 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <g transform={`translate(${x} ${y + Math.sin(f / 14) * 12}) rotate(${Math.sin(f / 19) * 3}) scale(${s})`}>
      <path d="M -330 -60 L 330 -90 Q 300 40 200 60 L -260 60 Q -320 20 -330 -60 Z" fill="#e9eef2" />
      <path d="M -330 -60 L 330 -90 L 326 -64 L -326 -36 Z" fill="#2b6cd9" />
      <rect x={-300} y={-150} width={60} height={90} fill="#3a3a3a" />
      <rect x={-290} y={-60} width={40} height={130} fill="#555" />
      <ellipse cx={0} cy={66} rx={380} ry={36} fill="rgba(20,90,150,0.55)" />
    </g>
  </svg>
);
const alvarenga: Fabrica = ({ en, dur }) => ({ f }) => {
  const tre = en("record");
  const tjo = en("jose");
  const tal = en("alvarenga");
  const tpe = en("pescador");
  const t438 = en("438");
  const tpa = en("pacifico");
  const cam = mover(f, 0, dur, { z: 1.2, x: 40, y: -40 }, { z: 1.0, x: -20, y: 20 });
  const dias = Math.round(interpolate(f, [t438 - 8, t438 + 30], [1, 438], clamp));
  const barba = tramo(f, t438, t438 + 30);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={1000} cielo={["#ff9a5a", "#ffe2b8"]} agua={["#2d6c9a", "#071f38"]} sol={{ x: 760, y: 900, r: 110, color: "#ffd08a" }} />
        <Barca f={f} x={460} y={1600} s={1} />
        <Meciendo f={f} x={460} y={1560}>
          <Yo f={f} x={420} y={1540} escala={0.6} acciones={[[0, "reposo"], [t438, "pensar"]]} cara={f > t438 ? "pensativo" : "serio"} sudadera="#2a5a8a" piel={barba > 0.5 ? "#c9906a" : undefined} />
        </Meciendo>
      </Plano>
      <Cine f={f} vineta={0.6} tinte="rgba(255,120,40,0.25)" />
      <Rotulo f={f} inicio={tre} texto="EL RÉCORD" y={460} tam={80} fondo={AMARILLO} color="#1a1000" giro={-3} />
      <Rotulo f={f} inicio={tjo} texto="JOSÉ SALVADOR" y={600} x={540} tam={50} color="#fff" />
      <Rotulo f={f} inicio={tal} texto="ALVARENGA" y={670} x={540} tam={64} color="#fff" />
      {f > tpe && (
        <div style={{ position: "absolute", left: 340, top: 770, width: 400, height: 70, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", transform: `scale(${muelle(f, tpe, 10)})`, boxShadow: "0 10px 24px rgba(0,0,0,0.4)" }}>
          <div style={{ flex: 1, background: "#0f47af" }} />
          <div style={{ flex: 1, background: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 18, color: "#0f47af", textAlign: "center", lineHeight: "23px" }}>PESCADOR · EL SALVADOR</div>
          <div style={{ flex: 1, background: "#0f47af" }} />
        </div>
      )}
      {f > t438 - 8 && (
        <div style={{ position: "absolute", left: 0, top: 880, width: W, textAlign: "center", fontFamily: SANS, fontWeight: 900, transform: `scale(${0.7 + 0.3 * muelle(f, t438 - 8, 10)})` }}>
          <div style={{ fontSize: 190, color: "#fff", lineHeight: 1, textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>{dias}</div>
          <div style={{ fontSize: 50, color: AMARILLO, textShadow: "0 4px 14px rgba(0,0,0,0.8)" }}>DÍAS A LA DERIVA</div>
        </div>
      )}
      <Rotulo f={f} inicio={tpa} texto="OCÉANO PACÍFICO" y={1780} x={400} tam={40} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 13 · qué comía: peces, tortugas, pájaros y agua de lluvia ----------
const comida: Fabrica = ({ en, dur }) => ({ f }) => {
  const tco = en("comia");
  const tpe = en("peces");
  const tto = en("tortugas");
  const tpa = en("pajaros");
  const tma = en("manos");
  const tll = en("lluvia");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.1, x: 0, y: -30 });
  const Tarjeta = ({ t0, x, y, texto, children }: { t0: number; x: number; y: number; texto: string; children: React.ReactNode }) => {
    if (f < t0) return null;
    const s = muelle(f, t0, 10);
    return (
      <div style={{ position: "absolute", left: x - 170, top: y - 170, width: 340, height: 340, borderRadius: 40, background: "rgba(5,20,40,0.82)", border: "4px solid rgba(255,255,255,0.35)", transform: `scale(${s}) rotate(${(1 - s) * 20}deg)` }}>
        <svg width={340} height={260} style={{ position: "absolute", left: 0, top: 10 }}>
          {children}
        </svg>
        <div style={{ position: "absolute", left: 0, bottom: 22, width: 340, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 40, color: "#fff" }}>{texto}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={760} cielo={["#3c86c4", "#d4ebff"]} agua={["#1f6aa3", "#061f3a"]} sol={{ x: 880, y: 560, r: 60 }} />
      </Plano>
      <Cine f={f} vineta={0.55} />
      <Rotulo f={f} inicio={tco} texto="¿QUÉ COMÍA?" y={460} tam={80} color="#fff" />
      <Tarjeta t0={tpe} x={300} y={820} texto="PECES">
        <Pez x={170} y={130} s={1.2} f={f} />
      </Tarjeta>
      <Tarjeta t0={tto} x={780} y={820} texto="TORTUGAS">
        <Tortuga x={160} y={130} s={1.2} f={f} />
      </Tarjeta>
      <Tarjeta t0={tpa} x={300} y={1220} texto="PÁJAROS">
        <Pajaro x={170} y={140} s={1.1} f={f} />
      </Tarjeta>
      <Tarjeta t0={tll} x={780} y={1220} texto="LLUVIA">
        {Array.from({ length: 6 }, (_, i) => {
          const t = ((f + i * 9) % 54) / 54;
          return <path key={i} transform={`translate(${70 + i * 40} ${40 + t * 160}) scale(0.4)`} d="M 0 -90 Q 60 0 50 30 Q 40 80 0 80 Q -40 80 -50 30 Q -60 0 0 -90 Z" fill={AZUL} opacity={1 - t * 0.5} />;
        })}
      </Tarjeta>
      <Rotulo f={f} inicio={tma} texto="¡CON LAS MANOS!" y={1450} x={360} tam={58} fondo={AMARILLO} color="#1a1000" giro={-3} />
    </AbsoluteFill>
  );
};

// ---------- 14 · el viaje: de México a las Islas Marshall, ~10.000 km ----------
const llegada: Fabrica = ({ en, dur }) => ({ f }) => {
  const tme = en("mexico");
  const tma = en("marshall");
  const tkm = en("10000");
  const tvi = en("vivo");
  const cam = mover(f, 0, tvi, { z: 1.0, x: 0, y: 0 }, { z: 1.08, x: 0, y: 0 });
  // mapa esquemático del Pacífico norte (de este a oeste: la corriente lo llevó hacia la izquierda)
  const A: [number, number] = [930, 1020]; // Chiapas
  const B: [number, number] = [150, 1180]; // Ebon, Islas Marshall
  const avance = tramo(f, tme, tkm + 10);
  const ctrl: [number, number] = [540, 760];
  const punto = (t: number): [number, number] => [(1 - t) ** 2 * A[0] + 2 * (1 - t) * t * ctrl[0] + t * t * B[0], (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * ctrl[1] + t * t * B[1]];
  const [bx, by] = punto(avance);
  const km = Math.round(interpolate(f, [tme, tkm + 10], [0, 10000], clamp) / 100) * 100;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0a3a66" }}>
      <Plano cam={cam} prof={1}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #1b6aa8 0%, #0a3a66 70%, #062546 100%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={0} y1={560 + i * 100} x2={W} y2={560 + i * 100} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
          ))}
          {/* costa de México y Centroamérica */}
          <path d="M 1100 520 L 860 560 Q 820 640 860 720 Q 900 820 880 900 Q 900 980 960 1030 Q 1010 1080 1060 1120 L 1100 1150 Z" fill="#4f9a4a" stroke="#d7f0c8" strokeWidth={4} />
          {/* atolones de las Islas Marshall */}
          {[[150, 1180], [190, 1120], [120, 1100], [220, 1060], [170, 1010]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={14} ry={8} fill="#f2e2a8" stroke="#4f9a4a" strokeWidth={4} opacity={tramo(f, tma - 6, tma + 4)} />
          ))}
          <path d={`M ${A[0]} ${A[1]} Q ${ctrl[0]} ${ctrl[1]} ${B[0]} ${B[1]}`} stroke="rgba(255,255,255,0.25)" strokeWidth={6} fill="none" strokeDasharray="4 18" strokeLinecap="round" />
          {Array.from({ length: 60 }, (_, i) => {
            const t = (i / 60) * avance;
            const [x, y] = punto(t);
            return <circle key={i} cx={x} cy={y} r={6} fill={AMARILLO} />;
          })}
          <circle cx={A[0]} cy={A[1]} r={14} fill={ROJO} stroke="#fff" strokeWidth={4} />
          <g transform={`translate(${bx} ${by - 6})`}>
            <circle r={30} fill="rgba(255,255,255,0.2)" />
            <path d="M -26 0 L 26 -4 Q 22 12 12 14 L -18 14 Q -24 10 -26 0 Z" fill="#fff" />
          </g>
          {f > tvi && <circle cx={B[0]} cy={B[1]} r={30 + ((f - tvi) % 30) * 3} fill="none" stroke={VERDE} strokeWidth={6} opacity={1 - ((f - tvi) % 30) / 30} />}
        </svg>
      </Plano>
      <Cine f={f} vineta={0.55} />
      <Rotulo f={f} inicio={tme} texto="MÉXICO" y={1120} x={860} tam={46} fondo="#fff" color="#111" giro={2} />
      <Rotulo f={f} inicio={tma} texto={"ISLAS\nMARSHALL"} y={1250} x={240} tam={44} fondo="#fff" color="#111" giro={-2} />
      {f > tme && (
        <div style={{ position: "absolute", left: 0, top: 520, width: W, textAlign: "center", fontFamily: SANS, fontWeight: 900, color: "#fff", textShadow: "0 8px 24px rgba(0,0,0,0.7)" }}>
          <div style={{ fontSize: 120, lineHeight: 1 }}>{km.toLocaleString("es-ES")}</div>
          <div style={{ fontSize: 44, color: "#cfe6ff" }}>KILÓMETROS</div>
        </div>
      )}
      <Sello f={f} inicio={tvi} x={420} y={1520} texto="¡VIVO!" color="#12a052" tam={110} giro={-6} />
    </AbsoluteFill>
  );
};

// ---------- 15 · final interactivo: ves tierra; ¿nadas o te quedas? ----------
const final: Fabrica = ({ en, dur }) => ({ f }) => {
  const tti = en("tierra");
  const tq = en("haces");
  const ta = en("a");
  const tb = en("b");
  const tco = en("comenta");
  const ts = en("sigueme");
  const cam = mover(f, 0, dur, { z: 1.0, x: 0, y: 0 }, { z: 1.1, x: 0, y: -30 });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Plano cam={cam} prof={1}>
        <Mar f={f} horizonte={1250} cielo={["#ff8a5a", "#ffd9a8"]} agua={["#2d6c9a", "#071f38"]} sol={{ x: 260, y: 1150, r: 90, color: "#ffd08a" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(f, tti, tti + 10) }}>
          <path d="M 560 1252 Q 680 1200 760 1215 Q 860 1180 1000 1252 Z" fill="#3a5a38" />
        </svg>
        <EnBalsa f={f} x={260} y={1720} s={0.75} acciones={[[0, "reposo"], [tti, "senalar"], [tq, "pensar"]]} cara="pensativo" calor={0.4} />
      </Plano>
      <Cine f={f} vineta={0.7} />
      <Rotulo f={f} inicio={tti} texto="VES TIERRA A LO LEJOS" y={500} tam={56} fondo={AMARILLO} color="#1a1000" giro={-2} />
      <Rotulo f={f} inicio={tq} texto="¿QUÉ HACES?" y={620} tam={100} color="#fff" />
      <Opcion f={f} inicio={ta} letra="A" texto={"Nadas hacia\nla tierra"} color={ROJO} y={820} marcada={f > tco && Math.floor(f / 12) % 2 === 0} />
      <Opcion f={f} inicio={tb} letra="B" texto={"Te quedas\nen la balsa"} color="#2b6cd9" y={980} marcada={f > tco && Math.floor(f / 12) % 2 === 1} />
      <Rotulo f={f} inicio={tco} texto="COMENTA A o B" y={1140} x={440} tam={60} color={AMARILLO} />
      {f > ts && (
        <div style={{ position: "absolute", left: 600, top: 1260, transform: `translateX(-50%) scale(${muelle(f, ts, 9)})`, padding: "18px 44px", borderRadius: 60, background: f > ts + 8 ? "#2a3550" : ROJO, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 52, whiteSpace: "nowrap", boxShadow: "0 14px 34px rgba(0,0,0,0.5)" }}>
          {f > ts + 8 ? "SIGUIENDO ✓" : "SEGUIR"}
        </div>
      )}
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, Fabrica> = { gancho, sed, rinon, sol, noche, mente, callahan, peces, mito1, mito2, truco, alvarenga, comida, llegada, final };

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> =>
  Object.fromEntries((Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](esc[k])])) as Record<Ilustracion, Dibujo>;
