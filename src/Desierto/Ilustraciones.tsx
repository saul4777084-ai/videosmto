// Una ilustración por frase, todo en 2D. Cada elemento entra en la palabra que lo nombra (en("palabra")).
// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1420) y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random } from "remotion";
import { Mapa, aPantalla as aPantallaMapa, Camara } from "../Colon/Mapa";
import { aPantalla, CamaraGlobo, Globo, mezclar } from "../comun/Globo";
import { Accion2D, Cara, Personaje2D } from "../comun/Personaje2D";
import { Dibujo } from "../comun/tipos";
import { AMARILLO, clamp, Cronometro, Cuenta, H, Marca, muelle, ROJO, Rotulo, SANS, Sello, Tarjeta, Termometro, tramo, VERDE, W } from "../Frio/Piezas";
import { Barra, Calendario, Texto } from "../Inmovil/Ilustraciones";
import { Movil } from "../Movil30/Ilustraciones";
import type { Escenario, Ilustracion } from "./escenas";

type Fabrica = (e: Escenario) => Dibujo;
const NARANJA = "#ff8a2b";

// ---------- fondo: cielo, sol que quema, dunas, calima y arena que vuela ----------
// noche: 0 = mediodía, 1 = noche cerrada (luna y estrellas)
const Desierto: React.FC<{ f: number; noche?: number; sol?: [number, number]; horizonte?: number; tormenta?: number }> = ({ f, noche = 0, sol = [820, 640], horizonte = 1240, tormenta = 0 }) => {
  const arriba = interpolateColors(noche, [0, 0.5, 1], ["#3d9be0", "#e0663a", "#0a1236"]);
  const abajo = interpolateColors(noche, [0, 0.5, 1], ["#ffe2a8", "#ffb36b", "#2a2f5e"]);
  const dunas = [
    [horizonte, "#e9a95e", 0.004, 50],
    [horizonte + 170, "#dc9447", 0.003, 70],
    [horizonte + 380, "#c97b34", 0.0025, 90],
  ] as const;
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(${arriba} 0%, ${abajo} 62%)` }} />
      {noche > 0.5 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(noche, 0.5, 1) }}>
          {Array.from({ length: 70 }, (_, i) => (
            <circle key={i} cx={random(`sx${i}`) * W} cy={random(`sy${i}`) * horizonte * 0.9} r={1 + random(`sr${i}`) * 2.5} fill="#fff" opacity={0.4 + 0.5 * Math.sin(f / 8 + i)} />
          ))}
          <circle cx={260} cy={620} r={80} fill="#fff6d8" />
          <circle cx={295} cy={595} r={74} fill={arriba} />
        </svg>
      )}
      {noche < 0.6 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 1 - tramo(noche, 0.3, 0.6) }}>
          <circle cx={sol[0]} cy={sol[1]} r={230 + Math.sin(f / 7) * 14} fill="#fff3b0" opacity={0.25} />
          <circle cx={sol[0]} cy={sol[1]} r={160 + Math.sin(f / 9) * 8} fill="#ffe27a" opacity={0.45} />
          <circle cx={sol[0]} cy={sol[1]} r={105} fill="#fff7cf" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 + f / 90;
            return <line key={i} x1={sol[0] + Math.cos(a) * 130} y1={sol[1] + Math.sin(a) * 130} x2={sol[0] + Math.cos(a) * (175 + Math.sin(f / 5 + i) * 15)} y2={sol[1] + Math.sin(a) * (175 + Math.sin(f / 5 + i) * 15)} stroke="#fff3b0" strokeWidth={12} strokeLinecap="round" opacity={0.7} />;
          })}
        </svg>
      )}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {dunas.map(([y0, color, fr, amp], k) => {
          let d = `M 0 ${H} L 0 ${y0}`;
          for (let x = 0; x <= W; x += 40) d += ` L ${x} ${y0 + Math.sin(x * fr + k * 2) * amp + Math.sin(x * fr * 2.3 + k) * amp * 0.3}`;
          d += ` L ${W} ${H} Z`;
          return <path key={k} d={d} fill={interpolateColors(noche, [0, 1], [color, ["#3a3560", "#2e2a50", "#24203f"][k]])} />;
        })}
        {/* calima: líneas onduladas que suben sobre el horizonte */}
        {noche < 0.4 &&
          [0, 1, 2, 3].map((k) => {
            const y = horizonte - 30 - ((f * 1.2 + k * 45) % 180);
            let d = `M 0 ${y}`;
            for (let x = 0; x <= W; x += 30) d += ` L ${x} ${y + Math.sin(x / 40 + f / 6 + k) * 6}`;
            return <path key={k} d={d} fill="none" stroke="#fff" strokeWidth={5} opacity={0.12 * (1 - ((f * 1.2 + k * 45) % 180) / 180)} />;
          })}
        {Array.from({ length: 30 + Math.round(tormenta * 120) }, (_, i) => {
          const v = 2 + random(`av${i}`) * 4 + tormenta * 22;
          const x = ((random(`ax${i}`) * W + f * v) % (W + 40)) - 20;
          const y = horizonte - 200 + random(`ay${i}`) * (H - horizonte + 200) + Math.sin(f / 10 + i) * 10;
          return <circle key={i} cx={x} cy={y} r={2 + random(`ar${i}`) * 3} fill="#fff1d0" opacity={0.35} />;
        })}
      </svg>
      {tormenta > 0 && <AbsoluteFill style={{ background: `rgba(214,140,60,${0.55 * tormenta})` }} />}
    </>
  );
};

// ---------- el protagonista: con calor se pone rojo y suda ----------
const Yo: React.FC<{ f: number; x: number; y: number; escala?: number; acciones: [number, Accion2D][]; cara?: Cara; calor?: number; sudor?: number; piel?: string; sudadera?: string; mirar?: "derecha" | "izquierda" }> = ({
  f,
  x,
  y,
  escala = 1,
  acciones,
  cara,
  calor = 0,
  sudor = 0,
  piel,
  sudadera = "#e8433a",
  mirar,
}) => {
  const tono = piel ?? interpolateColors(calor, [0, 1], ["#f0bf98", "#f08060"]);
  const cy = y - 585 * escala;
  return (
    <>
      <Personaje2D f={f} x={x} y={y} escala={escala} acciones={acciones} cara={cara} piel={tono} sudadera={sudadera} sudaderaOscura="#b02a22" mirar={mirar} />
      {sudor > 0 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: Math.round(2 + sudor * 5) }, (_, i) => {
            const c = ((f + i * 11) % 34) / 34;
            const lado = i % 2 ? 1 : -1;
            const dx = x + lado * (70 + (i % 3) * 18) * escala;
            const dy = cy - 40 * escala + c * 180 * escala;
            return <path key={i} d={`M ${dx} ${dy - 16 * escala} Q ${dx + 11 * escala} ${dy} ${dx} ${dy + 8 * escala} Q ${dx - 11 * escala} ${dy} ${dx} ${dy - 16 * escala} Z`} fill="#8fd8ff" opacity={1 - c} />;
          })}
        </svg>
      )}
    </>
  );
};

// botella de agua que se vacía (nivel 0..1)
const Botella: React.FC<{ x: number; y: number; alto: number; nivel: number; giro?: number; marcas?: boolean }> = ({ x, y, alto, nivel, giro = 0, marcas = false }) => {
  const ancho = alto * 0.42;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <g transform={`rotate(${giro} ${x} ${y + alto / 2})`}>
        <rect x={x - ancho * 0.22} y={y - alto * 0.1} width={ancho * 0.44} height={alto * 0.08} rx={8} fill="#2b6cd9" />
        <path d={`M ${x - ancho * 0.2} ${y} L ${x + ancho * 0.2} ${y} L ${x + ancho / 2} ${y + alto * 0.18} L ${x + ancho / 2} ${y + alto} L ${x - ancho / 2} ${y + alto} L ${x - ancho / 2} ${y + alto * 0.18} Z`} fill="rgba(220,240,255,0.35)" stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
        <clipPath id={`bot${Math.round(x)}${Math.round(y)}`}>
          <rect x={x - ancho / 2 + 6} y={y + alto * 0.2} width={ancho - 12} height={alto * 0.78} rx={14} />
        </clipPath>
        <rect clipPath={`url(#bot${Math.round(x)}${Math.round(y)})`} x={x - ancho / 2} y={y + alto * 0.2 + alto * 0.78 * (1 - nivel)} width={ancho} height={alto} fill="#3fb5ff" />
        {marcas && [0.25, 0.5, 0.75].map((m) => <line key={m} x1={x - ancho / 2 + 10} x2={x - ancho / 2 + 50} y1={y + alto * 0.2 + alto * 0.78 * m} y2={y + alto * 0.2 + alto * 0.78 * m} stroke={ROJO} strokeWidth={8} />)}
      </g>
    </svg>
  );
};

// ---------- 1 · gancho: perdido a 50 grados ----------
const gancho: Fabrica = ({ en }) => ({ f }) => {
  const tp = en("perdido");
  const td = en("desierto");
  const tg = en("grados?");
  const temp = interpolate(f, [td, tg + 6], [25, 50], clamp);
  return (
    <AbsoluteFill>
      <Desierto f={f} />
      <Rotulo f={f} inicio={0} texto={"¿CUÁNTO\nSOBREVIVIRÍAS"} y={220} tam={112} color="#fff" />
      <Rotulo f={f} inicio={tp} texto="PERDIDO EN EL DESIERTO" y={500} tam={60} color="#5a2a00" fondo={AMARILLO} giro={-2} />
      <Tarjeta f={f} inicio={td} x={320} y={700} ancho={470} alto={110} fondo="rgba(255,255,255,0.95)" borde="#ffd7a8">
        <div style={{ position: "absolute", left: 24, top: 18, width: 70, height: 70, borderRadius: 35, background: ROJO, opacity: Math.floor(f / 8) % 2 ? 1 : 0.4 }} />
        <div style={{ position: "absolute", left: 112, top: 28, fontFamily: SANS, fontWeight: 900, fontSize: 40, color: "#3a1a00", whiteSpace: "nowrap" }}>GPS: SIN SEÑAL</div>
      </Tarjeta>
      <Termometro x={860} y={700} alto={380} temp={temp} min={0} max={55} marcas={[0, 25, 50]} />
      <Yo f={f} x={330} y={1760} escala={0.9} acciones={[[0, "andar"], [tg, "alarma"]]} cara={f > tg ? "sorpresa" : "preocupado"} calor={temp / 50} sudor={f > td ? 0.6 : 0} />
      <Sello f={f} inicio={tg + 4} x={800} y={1300} texto="50 °C" color={ROJO} tam={96} giro={8} />
    </AbsoluteFill>
  );
};

// ---------- 2 · reloj inteligente: 37 → 40 °C, golpe de calor ----------
const Reloj: React.FC<{ f: number; x: number; y: number; temp: number; alerta: boolean }> = ({ f, x, y, temp, alerta }) => {
  const fondo = alerta ? (Math.floor(f / 6) % 2 ? "#b3001b" : "#ff2a45") : "#0b0f1a";
  let ecg = `M ${x - 200} ${y + 150}`;
  for (let i = 0; i <= 40; i++) {
    const fase = (i + f * (alerta ? 1.6 : 0.8)) % 20;
    const pico = fase > 9 && fase < 11 ? (fase < 10 ? -60 : 40) : 0;
    ecg += ` L ${x - 200 + i * 10} ${y + 150 + pico}`;
  }
  return (
    <>
      <div style={{ position: "absolute", left: x - 130, top: y - 470, width: 260, height: 940, borderRadius: 60, background: "linear-gradient(#2a2f3a, #161a22)" }} />
      <div style={{ position: "absolute", left: x - 240, top: y - 290, width: 480, height: 580, borderRadius: 130, background: "#3a4152", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }} />
      <div style={{ position: "absolute", left: x - 215, top: y - 265, width: 430, height: 530, borderRadius: 110, background: fondo, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 34, color: "#9fb3cc" }}>TEMP. CORPORAL</div>
        <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 150, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{temp.toFixed(1).replace(".", ",")}°</div>
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d={ecg} fill="none" stroke={alerta ? "#fff" : VERDE} strokeWidth={8} strokeLinejoin="round" />
      </svg>
    </>
  );
};
const cuerpo: Fabrica = ({ en }) => ({ f }) => {
  const tc = en("cuerpo");
  const t37 = en("37");
  const t40 = en("40,");
  const tg = en("golpe");
  const temp = f < t40 - 4 ? 37 : interpolate(f, [t40 - 4, t40 + 10], [37, 40], clamp);
  return (
    <AbsoluteFill>
      <Desierto f={f} sol={[860, 560]} />
      {f > tc - 6 && (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tc - 6, 12)})`, transformOrigin: "400px 900px" }}>
          <Reloj f={f} x={400} y={900} temp={temp} alerta={f > tg} />
        </div>
      )}
      <Rotulo f={f} inicio={t37} texto="37 °C = NORMAL" x={800} y={520} tam={46} fondo={VERDE} color="#04260f" giro={3} />
      <Rotulo f={f} inicio={t40} texto="40 °C" x={820} y={700} tam={110} color="#fff" fondo={ROJO} giro={-4} />
      <Sello f={f} inicio={tg} x={430} y={1480} texto="GOLPE DE CALOR" color={ROJO} tam={66} giro={-5} />
    </AbsoluteFill>
  );
};

// ---------- 3 · sudas hasta litro y medio por hora ----------
const sudor: Fabrica = ({ en }) => ({ f }) => {
  const te = en("enfriarte,");
  const ts = en("sudas:");
  const tl = en("litro");
  const th = en("hora.");
  const litros = interpolate(f, [tl - 4, th + 4], [0, 1.5], clamp);
  return (
    <AbsoluteFill>
      <Desierto f={f} />
      <Rotulo f={f} inicio={te} texto="PARA ENFRIARTE…" x={540} y={470} tam={70} color="#fff" />
      <Yo f={f} x={340} y={1760} escala={1.05} acciones={[[0, "reposo"], [ts, "triste"]]} cara="preocupado" calor={0.6} sudor={f > ts ? 1 : 0.2} />
      <Rotulo f={f} inicio={ts} texto="SUDAS" x={300} y={640} tam={96} color="#8fd8ff" giro={-3} />
      <Botella x={820} y={640} alto={480} nivel={1 - litros / 1.6} />
      <Cuenta f={f} a={tl - 4} b={th + 4} desde={0} hasta={1.5} decimales={1} sufijo=" L" x={800} y={1150} tam={110} color="#fff" />
      <Rotulo f={f} inicio={th} texto="POR HORA" x={800} y={1290} tam={60} fondo="#fff" color="#0a4a7a" giro={2} />
    </AbsoluteFill>
  );
};

// ---------- 4 · deshidratación: 2 % piensas peor, 10 % deliras ----------
const cerebro: Fabrica = ({ en }) => ({ f }) => {
  const t2 = en("2");
  const tp = en("peor.");
  const t10 = en("10");
  const td = en("deliras.");
  const agua = f < t2 ? 100 : f < t10 ? interpolate(f, [t2, t2 + 10], [100, 98], clamp) : interpolate(f, [t10, t10 + 12], [98, 90], clamp);
  const glitch = f > td ? 1 : 0;
  const Cerebro = ({ dx, color, op }: { dx: number; color: string; op: number }) => (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: op, transform: `translateX(${dx}px)` }}>
      <ellipse cx={540} cy={830} rx={260} ry={200} fill={color} />
      {[-120, -40, 40, 120].map((x, i) => (
        <path key={i} d={`M ${540 + x} ${660} q 40 60 0 120 q -40 60 0 120 q 40 50 0 100`} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={12} strokeLinecap="round" />
      ))}
      <line x1={540} y1={640} x2={540} y2={1020} stroke="rgba(0,0,0,0.25)" strokeWidth={10} />
    </svg>
  );
  return (
    <AbsoluteFill style={{ transform: glitch ? `translate(${Math.sin(f * 3.1) * 10}px, ${Math.cos(f * 2.3) * 6}px)` : undefined }}>
      <Desierto f={f} />
      {glitch > 0 && <Cerebro dx={-18} color="rgba(255,0,80,0.8)" op={0.6} />}
      {glitch > 0 && <Cerebro dx={18} color="rgba(0,220,255,0.8)" op={0.6} />}
      <Cerebro dx={0} color="#ff9ab8" op={1} />
      <Barra x={140} y={1080} ancho={800} valor={agua / 100} color={agua > 99 ? "#3fb5ff" : agua > 95 ? NARANJA : ROJO} />
      <Rotulo f={f} inicio={0} texto={`AGUA DEL CUERPO: ${Math.round(agua)} %`} x={540} y={990} tam={44} fondo="rgba(10,15,30,0.85)" color="#fff" />
      <Rotulo f={f} inicio={tp} texto="PIENSAS PEOR" x={540} y={1260} tam={64} fondo={NARANJA} color="#fff" giro={-2} />
      {/* espejismo: un oasis que no existe */}
      {f > td && (
        <div style={{ position: "absolute", inset: 0, opacity: 0.55 + Math.sin(f / 3) * 0.25 }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <ellipse cx={330} cy={1530} rx={220} ry={50} fill="#4fc3f7" />
            <path d="M 300 1520 Q 290 1420 320 1340" stroke="#7a4a20" strokeWidth={18} fill="none" />
            {[0, 1, 2, 3, 4].map((k) => (
              <path key={k} d={`M 320 1340 q ${-90 + k * 45} ${-40 + Math.abs(k - 2) * 20} ${-150 + k * 75} ${30 + Math.abs(k - 2) * 25}`} stroke="#2e9e4a" strokeWidth={22} fill="none" strokeLinecap="round" />
            ))}
          </svg>
          <Texto x={330} y={1640} tam={48} color="#fff">¿OASIS?</Texto>
        </div>
      )}
      <Sello f={f} inicio={td} x={660} y={1420} texto="DELIRAS" color={ROJO} tam={80} giro={6} />
    </AbsoluteFill>
  );
};

// ---------- 5 · el móvil se rinde antes que tú ----------
const movil: Fabrica = ({ en }) => ({ f }) => {
  const tr = en("rinde");
  const tt = en("tú:");
  const tm = en("móvil.");
  const t35 = en("35");
  const aviso = f > tm;
  return (
    <AbsoluteFill>
      <Desierto f={f} sol={[860, 600]} />
      <Rotulo f={f} inicio={tr} texto="LO PRIMERO QUE SE RINDE" x={540} y={470} tam={52} color="#fff" />
      <Rotulo f={f} inicio={tt} texto="NO ERES TÚ" x={540} y={560} tam={60} color={AMARILLO} giro={-2} />
      <Movil x={360} y={1080} ancho={300} encendido={!aviso} giro={aviso ? Math.sin(f * 1.7) * 2 : 0} brillo={aviso ? 0 : 0.3}>
        {aviso && (
          <div style={{ position: "absolute", inset: 0, background: "#0b0b0b", opacity: tramo(f, tm, tm + 6) }}>
            <svg width={260} height={600} style={{ position: "absolute", left: 0, top: 0 }}>
              <rect x={115} y={110} width={30} height={130} rx={15} fill="none" stroke="#ffcc00" strokeWidth={8} />
              <circle cx={130} cy={260} r={34} fill="#ffcc00" />
              <rect x={122} y={170} width={16} height={80} fill="#ffcc00" />
            </svg>
            <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 30, color: "#fff" }}>Temperatura</div>
            <div style={{ position: "absolute", top: 380, left: 20, right: 20, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 21, color: "#ccc", lineHeight: 1.25 }}>
              El teléfono necesita enfriarse antes de que puedas usarlo.
            </div>
          </div>
        )}
      </Movil>
      <Rotulo f={f} inicio={t35} texto={"HECHOS PARA\nMÁX. 35 °C"} x={800} y={760} tam={54} fondo="#fff" color="#3a1a00" giro={3} />
      <Cuenta f={f} a={t35 + 4} b={t35 + 24} desde={35} hasta={50} sufijo=" °C" x={800} y={1000} tam={96} color={ROJO} />
      <Rotulo f={f} inicio={t35 + 10} texto="AHORA" x={800} y={1130} tam={44} fondo={ROJO} color="#fff" />
      <Marca f={f} inicio={t35 + 16} x={560} y={760} tam={110} tipo="x" />
    </AbsoluteFill>
  );
};

// ---------- 6 · Valle de la Muerte en el globo: 56,7 °C el aire y 94 °C el suelo ----------
const VALLE: [number, number] = [-116.9, 36.5];
const valle: Fabrica = ({ en }) => ({ f }) => {
  const tv = en("Valle");
  const ta = en("aire");
  const t56 = en("56,7");
  const ts = en("suelo,");
  const t94 = en("94.");
  const desde: CamaraGlobo = { lon: -20, lat: 20, zoom: 0.95, y: 1050 };
  const hasta: CamaraGlobo = { lon: VALLE[0], lat: VALLE[1], zoom: 2.6, y: 1050 };
  const k = interpolate(f, [0, tv + 20], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const cam = mezclar(desde, hasta, k);
  const p = aPantalla(cam, VALLE);
  return (
    <AbsoluteFill>
      <Globo f={f} camara={cam} colores={{ "United States of America": { color: "255,138,43", opacidad: 0.55 * tramo(f, tv, tv + 10) } }} />
      {p && f > tv && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <circle cx={p[0]} cy={p[1]} r={30 + ((f - tv) % 30) * 2} fill="none" stroke={ROJO} strokeWidth={6} opacity={1 - ((f - tv) % 30) / 30} />
          <path d={`M ${p[0]} ${p[1]} l -30 -60 a 34 34 0 1 1 60 0 Z`} fill={ROJO} stroke="#fff" strokeWidth={6} />
          <circle cx={p[0]} cy={p[1] - 80} r={12} fill="#fff" />
        </svg>
      )}
      <Rotulo f={f} inicio={tv} texto="VALLE DE LA MUERTE" x={540} y={470} tam={66} fondo={ROJO} color="#fff" giro={-2} />
      <Tarjeta f={f} inicio={ta} x={290} y={1430} ancho={460} alto={190} fondo="rgba(255,255,255,0.95)" borde="#ffd7a8" giro={-2}>
        <div style={{ position: "absolute", left: 28, top: 18, fontFamily: SANS, fontWeight: 900, fontSize: 38, color: "#5a6b80" }}>AIRE</div>
        <div style={{ position: "absolute", left: 28, top: 62, fontFamily: SANS, fontWeight: 900, fontSize: 96, color: NARANJA }}>{f > t56 - 4 ? "56,7 °C" : "…"}</div>
      </Tarjeta>
      <Tarjeta f={f} inicio={ts} x={560} y={1670} ancho={420} alto={190} fondo={ROJO} borde="#fff" giro={3}>
        <div style={{ position: "absolute", left: 28, top: 18, fontFamily: SANS, fontWeight: 900, fontSize: 38, color: "#ffd6dc" }}>SUELO</div>
        <div style={{ position: "absolute", left: 28, top: 62, fontFamily: SANS, fontWeight: 900, fontSize: 96, color: "#fff" }}>{f > t94 - 4 ? "94 °C" : "…"}</div>
      </Tarjeta>
    </AbsoluteFill>
  );
};

// ---------- 7 · turistas friendo huevos en el suelo ----------
const huevos: Fabrica = ({ en }) => ({ f }) => {
  const tg = en("guardabosques");
  const tt = en("turistas");
  const tf = en("freír");
  const th = en("huevos");
  const cuaja = tramo(f, th, th + 30);
  return (
    <AbsoluteFill>
      {/* asfalto visto desde arriba */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #4a4a4a 0%, #2a2a2a 90%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={510} y={((i * 360 + f * 2) % 2160) - 240} width={60} height={220} rx={10} fill={AMARILLO} opacity={0.9} />
        ))}
        {Array.from({ length: 80 }, (_, i) => (
          <circle key={i} cx={random(`gx${i}`) * W} cy={random(`gy${i}`) * H} r={2 + random(`gr${i}`) * 3} fill="#5a5a5a" />
        ))}
      </svg>
      {/* el huevo */}
      {f > tf - 4 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tf - 4, 10)})`, transformOrigin: "360px 1000px" }}>
          <path d={`M 360 840 C 520 820 560 980 500 1080 C 440 1180 260 1170 220 1060 C 180 950 230 850 360 840 Z`} fill={interpolateColors(cuaja, [0, 1], ["rgba(255,255,255,0.55)", "#ffffff"])} />
          <circle cx={370} cy={990} r={70} fill="#ffb300" />
          <circle cx={350} cy={970} r={20} fill="#ffd866" />
          {[0, 1, 2].map((k) => {
            const c = ((f + k * 15) % 45) / 45;
            return <path key={k} d={`M ${300 + k * 60} ${820 - c * 160} q 20 -30 0 -60 q -20 -30 0 -60`} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.6 * (1 - c)} />;
          })}
        </svg>
      )}
      {/* cámara del turista grabando */}
      {f > tt && (
        <div style={{ position: "absolute", left: 110, top: 720, width: 500, height: 560, opacity: tramo(f, tt, tt + 6) }}>
          {[
            [0, 0, "borderTop", "borderLeft"],
            [1, 0, "borderTop", "borderRight"],
            [0, 1, "borderBottom", "borderLeft"],
            [1, 1, "borderBottom", "borderRight"],
          ].map(([cx, cy, b1, b2], i) => (
            <div key={i} style={{ position: "absolute", left: cx ? undefined : 0, right: cx ? 0 : undefined, top: cy ? undefined : 0, bottom: cy ? 0 : undefined, width: 70, height: 70, [b1 as string]: "8px solid #fff", [b2 as string]: "8px solid #fff" }} />
          ))}
          <div style={{ position: "absolute", left: 24, top: 20, fontFamily: SANS, fontWeight: 900, fontSize: 36, color: "#fff" }}>
            <span style={{ color: ROJO, opacity: Math.floor(f / 10) % 2 ? 1 : 0.2 }}>● </span>REC
          </div>
        </div>
      )}
      <Rotulo f={f} inicio={tt} texto="TURISTAS" x={360} y={1340} tam={60} color="#fff" />
      {/* cartel del parque */}
      {f > tg && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - muelle(f, tg, 11)) * 600}px)` }}>
          <div style={{ position: "absolute", left: 800, top: 900, width: 36, height: 520, background: "#7a4a20" }} />
          <div style={{ position: "absolute", left: 610, top: 560, width: 380, height: 380, borderRadius: 24, background: "#3d6b3a", border: "10px solid #f2e2b0", transform: "rotate(3deg)" }}>
            <div style={{ position: "absolute", top: 26, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 32, color: "#f2e2b0" }}>PARQUE NACIONAL</div>
            <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 48, color: "#fff", lineHeight: 1.1 }}>{f > tf ? "POR FAVOR,\nNO FRÍAN\nHUEVOS" : "ATENCIÓN"}</div>
          </div>
        </div>
      )}
      <Sello f={f} inicio={th + 8} x={360} y={1480} texto="EN EL SUELO" color={NARANJA} tam={60} giro={-5} />
    </AbsoluteFill>
  );
};

// ---------- 8 · el coche parado: dentro sube 10 °C en 10 minutos ----------
const Coche: React.FC<{ f: number; x: number; y: number; escala?: number; humo?: boolean }> = ({ f, x, y, escala = 1, humo }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <ellipse cx={0} cy={95} rx={330} ry={26} fill="rgba(0,0,0,0.3)" />
      <path d="M -320 40 Q -320 -30 -250 -40 L -160 -50 L -90 -130 Q -70 -150 -30 -150 L 130 -150 Q 170 -150 190 -120 L 240 -50 L 290 -40 Q 330 -30 330 20 L 330 60 L -320 60 Z" fill="#2f80ed" />
      <path d="M -70 -120 L 60 -120 L 60 -55 L -140 -55 Z" fill="#bfe3ff" />
      <path d="M 80 -120 L 150 -120 Q 165 -120 175 -105 L 210 -55 L 80 -55 Z" fill="#bfe3ff" />
      <rect x={-300} y={0} width={70} height={20} rx={8} fill="#ffe27a" />
      <rect x={280} y={0} width={40} height={20} rx={8} fill={ROJO} />
      {[-190, 200].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={60} r={58} fill="#1a1a1a" />
          <circle cx={cx} cy={60} r={26} fill="#bbb" />
        </g>
      ))}
      {humo &&
        [0, 1, 2, 3].map((k) => {
          const c = ((f + k * 12) % 48) / 48;
          return <circle key={k} cx={-260 + Math.sin(f / 8 + k) * 20} cy={-60 - c * 260} r={30 + c * 50} fill="#9a9a9a" opacity={0.6 * (1 - c)} />;
        })}
    </g>
  </svg>
);
const coche: Fabrica = ({ en }) => ({ f }) => {
  const tp = en("para");
  const te = en("encierres");
  const ts = en("sube");
  const tm = en("minutos.");
  return (
    <AbsoluteFill>
      <Desierto f={f} sol={[860, 560]} horizonte={1180} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d="M 0 1500 L 1080 1440 L 1080 1600 L 0 1700 Z" fill="#3a3a3a" />
      </svg>
      <Coche f={f} x={430} y={1460} escala={1} humo={f > tp} />
      <Rotulo f={f} inicio={tp} texto="SE TE PARA EL COCHE" x={540} y={470} tam={60} color="#fff" />
      <Tarjeta f={f} inicio={te} x={340} y={830} ancho={500} alto={300} fondo="rgba(10,15,30,0.9)" borde="#ff8a2b">
        <div style={{ position: "absolute", left: 30, top: 20, fontFamily: SANS, fontWeight: 900, fontSize: 38, color: "#ffb36b" }}>DENTRO DEL COCHE</div>
        <div style={{ position: "absolute", left: 30, top: 80, fontFamily: SANS, fontWeight: 900, fontSize: 130, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(interpolate(f, [ts, tm + 6], [50, 60], clamp))} °C
        </div>
      </Tarjeta>
      {f > ts && <Cronometro x={830} y={850} r={130} vuelta={interpolate(f, [ts, tm + 6], [0, 10 / 60], clamp)} color={NARANJA} lleno={interpolate(f, [ts, tm + 6], [0, 10 / 60], clamp)} />}
      <Rotulo f={f} inicio={ts} texto="+10 °C" x={830} y={1040} tam={70} color={ROJO} fondo="#fff" giro={4} />
      <Rotulo f={f} inicio={tm} texto="EN 10 MIN" x={830} y={1150} tam={46} color="#fff" />
      <Sello f={f} inicio={te + 4} x={360} y={1220} texto="NO TE ENCIERRES" color={ROJO} tam={56} giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 9 · vista de dron: el coche se ve, la persona no ----------
const aire: Fabrica = ({ en }) => ({ f }) => {
  const ts = en("sombra:");
  const ta = en("aire,");
  const tc = en("coche");
  const tp = en("persona.");
  const zoom = interpolate(f, [ta, ta + 30], [1.3, 1], clamp);
  const px = interpolate(f, [ts, ts + 20], [700, 470], clamp);
  const py = interpolate(f, [ts, ts + 20], [1180, 1020], clamp);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 40% 40%, #f2c27b 0%, #d99a52 90%)" }} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 14 }, (_, i) => {
            const y = 300 + i * 120;
            return <path key={i} d={`M 0 ${y} Q 270 ${y - 50} 540 ${y} T 1080 ${y}`} fill="none" stroke="#c98a45" strokeWidth={8} opacity={0.5} />;
          })}
          {/* coche desde arriba con su sombra */}
          <rect x={430} y={830} width={180} height={340} rx={50} fill="rgba(0,0,0,0.3)" transform="translate(40 30)" />
          <rect x={430} y={830} width={180} height={340} rx={50} fill="#2f80ed" />
          <rect x={455} y={900} width={130} height={80} rx={18} fill="#bfe3ff" />
          <rect x={455} y={1060} width={130} height={60} rx={18} fill="#bfe3ff" />
          {/* persona: un puntito */}
          <circle cx={px} cy={py} r={14} fill="#e8433a" />
          <circle cx={px} cy={py - 2} r={7} fill="#f0bf98" />
        </svg>
      </div>
      {/* HUD del dron */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={540} cy={1000} r={300} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        <line x1={540} y1={680} x2={540} y2={1320} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        <line x1={220} y1={1000} x2={860} y2={1000} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
        <path d={`M 540 1000 L ${540 + Math.cos(f / 12) * 300} ${1000 + Math.sin(f / 12) * 300}`} stroke={VERDE} strokeWidth={6} opacity={0.7} />
        {f > tc && <rect x={410} y={810} width={240} height={400} fill="none" stroke={VERDE} strokeWidth={8} strokeDasharray="40 16" opacity={tramo(f, tc, tc + 6)} />}
        {f > tp && <rect x={px - 40} y={py - 40} width={80} height={80} fill="none" stroke={ROJO} strokeWidth={6} opacity={Math.floor(f / 5) % 2 ? 1 : 0.3} />}
      </svg>
      <Texto x={170} y={520} tam={34} color="#fff" centro={false}>
        <span style={{ color: ROJO, opacity: Math.floor(f / 10) % 2 ? 1 : 0.2 }}>● </span>DRON · ALT 300 m
      </Texto>
      <Rotulo f={f} inicio={ts} texto="QUÉDATE A SU SOMBRA" x={540} y={600} tam={56} fondo="#fff" color="#7a4a10" giro={-2} />
      <Rotulo f={f} inicio={tc} texto="COCHE: VISIBLE" x={330} y={1360} tam={52} fondo={VERDE} color="#04260f" giro={-3} />
      <Rotulo f={f} inicio={tp} texto="PERSONA: ¿DÓNDE?" x={420} y={1470} tam={52} fondo={ROJO} color="#fff" giro={2} />
    </AbsoluteFill>
  );
};

// ---------- 10 · cuánto aguantas: 2 días quieto a la sombra, ni uno caminando al sol ----------
const Reloj2: React.FC<{ f: number; x: number; y: number; arena: number; color: string }> = ({ f, x, y, arena, color }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <path d={`M ${x - 80} ${y - 130} L ${x + 80} ${y - 130} L ${x + 10} ${y} L ${x + 80} ${y + 130} L ${x - 80} ${y + 130} L ${x - 10} ${y} Z`} fill="rgba(255,255,255,0.25)" stroke="#fff" strokeWidth={8} strokeLinejoin="round" />
    <path d={`M ${x - 80 + 70 * (1 - arena)} ${y - 130 + 130 * (1 - arena)} L ${x + 80 - 70 * (1 - arena)} ${y - 130 + 130 * (1 - arena)} L ${x} ${y} Z`} fill={color} />
    <path d={`M ${x - 80 * (1 - arena) - 20} ${y + 130} L ${x + 80 * (1 - arena) + 20} ${y + 130} L ${x} ${y + 130 - 120 * (1 - arena)} Z`} fill={color} />
    {arena > 0.02 && <line x1={x} y1={y} x2={x} y2={y + 130} stroke={color} strokeWidth={5} strokeDasharray="8 8" strokeDashoffset={-f * 2} />}
  </svg>
);
const dias: Fabrica = ({ en, dur }) => ({ f }) => {
  const ts = en("Sin");
  const tsom = en("sombra,");
  const td = en("días.");
  const tc = en("Caminando");
  const tu = en("uno.");
  return (
    <AbsoluteFill>
      <Desierto f={f} />
      <Tarjeta f={f} inicio={ts} x={290} y={950} ancho={460} alto={720} fondo="rgba(10,40,70,0.88)" borde="#8fd8ff">
        <div style={{ position: "absolute", top: 26, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 40, color: "#8fd8ff", lineHeight: 1.1, whiteSpace: "pre" }}>{"QUIETO\nA LA SOMBRA"}</div>
      </Tarjeta>
      {f > tsom && <Reloj2 f={f} x={290} y={1000} arena={interpolate(f, [tsom, dur], [1, 0.6], clamp)} color="#8fd8ff" />}
      <Rotulo f={f} inicio={td} texto="≈ 2 DÍAS" x={290} y={1180} tam={76} color="#fff" />
      <Tarjeta f={f} inicio={tc} x={790} y={950} ancho={460} alto={720} fondo="rgba(90,20,10,0.9)" borde={NARANJA}>
        <div style={{ position: "absolute", top: 26, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 40, color: "#ffb36b", lineHeight: 1.1, whiteSpace: "pre" }}>{"CAMINANDO\nAL SOL"}</div>
      </Tarjeta>
      {f > tc && <Reloj2 f={f} x={790} y={1000} arena={interpolate(f, [tc, tu + 10], [1, 0.05], clamp)} color={NARANJA} />}
      <Rotulo f={f} inicio={tu} texto="< 1 DÍA" x={790} y={1180} tam={76} color={ROJO} fondo="#fff" giro={-4} />
      <Rotulo f={f} inicio={ts} texto="SIN AGUA" x={540} y={470} tam={84} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 11 · mito 1: racionar el agua ----------
const mito1: Fabrica = ({ en, dur }) => ({ f }) => {
  const tm = en("Mito");
  const tr = en("racionar");
  const tmi = en("militares");
  const ts = en("sudor,");
  const ta = en("agua.");
  const bebe = tramo(f, ta, Math.min(dur, ta + 30));
  return (
    <AbsoluteFill>
      <Desierto f={f} />
      <Sello f={f} inicio={tm} x={330} y={520} texto="MITO #1" color={ROJO} tam={80} giro={-6} />
      <Botella x={300} y={720} alto={460} nivel={1 - bebe * 0.8} marcas={f > tr} giro={bebe * -35} />
      <Rotulo f={f} inicio={tr} texto="¿RACIONAR?" x={300} y={1260} tam={60} color="#fff" />
      <Marca f={f} inicio={tmi} x={300} y={960} tam={170} tipo="x" />
      {f > tmi && (
        <div style={{ position: "absolute", left: 560, top: 700, width: 470, height: 520, borderRadius: 18, background: "#4b5a32", border: "10px solid #2f3a1e", transform: `rotate(2deg) scale(${muelle(f, tmi, 11)})`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
          <div style={{ position: "absolute", top: 30, width: "100%", textAlign: "center", fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 34, color: "#d8d2a8", letterSpacing: 4 }}>MANUAL MILITAR</div>
          <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 52, color: "#fff", lineHeight: 1.15, letterSpacing: 2 }}>
            {f > ts ? "RACIONA\nEL SUDOR,\nNO EL AGUA" : "…"}
          </div>
        </div>
      )}
      <Marca f={f} inicio={ta} x={800} y={1290} tam={110} tipo="ok" />
    </AbsoluteFill>
  );
};

// ---------- 12 · mito 2: beber de un cactus ----------
const Cactus: React.FC<{ x: number; y: number; escala: number }> = ({ x, y, escala }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <rect x={-55} y={-520} width={110} height={520} rx={55} fill="#3aa35a" />
      <path d="M -55 -260 L -140 -260 Q -170 -260 -170 -300 L -170 -400" stroke="#3aa35a" strokeWidth={80} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 55 -330 L 130 -330 Q 160 -330 160 -370 L 160 -450" stroke="#3aa35a" strokeWidth={80} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[-440, -360, -280, -200, -120].map((yy) => (
        <g key={yy}>
          <line x1={-55} y1={yy} x2={-80} y2={yy - 10} stroke="#fff6c9" strokeWidth={5} />
          <line x1={55} y1={yy + 30} x2={80} y2={yy + 20} stroke="#fff6c9" strokeWidth={5} />
        </g>
      ))}
    </g>
  </svg>
);
const mito2: Fabrica = ({ en }) => ({ f }) => {
  const tm = en("Mito");
  const tc = en("cactus.");
  const tv = en("vomitar,");
  const tl = en("líquido.");
  return (
    <AbsoluteFill>
      <Desierto f={f} />
      <Sello f={f} inicio={tm} x={330} y={520} texto="MITO #2" color={ROJO} tam={80} giro={-6} />
      {f > tc - 4 && (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tc - 4, 11)})`, transformOrigin: "760px 1300px" }}>
          <Cactus x={760} y={1320} escala={1.15} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <path d="M 720 900 L 620 760 L 560 760" stroke="#ff5f9e" strokeWidth={16} fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <Yo f={f} x={330} y={1760} escala={0.95} acciones={[[0, "reposo"], [tc, "pensar"], [tv, "triste"]]} cara={f > tv ? "triste" : "pensativo"} piel={f > tv ? interpolateColors(tramo(f, tv, tv + 8), [0, 1], ["#f0bf98", "#b7d97a"]) : undefined} calor={0.4} />
      {f > tv && <Texto x={330} y={900} tam={90} color="#9ad65a">{Math.floor(f / 6) % 2 ? "¡BLEGH!" : "¡BLEH!"}</Texto>}
      <Marca f={f} inicio={tv + 6} x={760} y={680} tam={140} tipo="x" />
      <Rotulo f={f} inicio={tl} texto="− AÚN MÁS LÍQUIDO" x={500} y={1050} tam={56} fondo={ROJO} color="#fff" giro={-3} />
    </AbsoluteFill>
  );
};

// ---------- 13 · camina de noche y tápate como los beduinos ----------
const noche: Fabrica = ({ en, dur }) => ({ f }) => {
  const tc = en("Camina");
  const tn = en("noche");
  const tt = en("tápate");
  const tb = en("beduinos.");
  const n = interpolate(f, [tn - 10, tn + 25], [0, 1], clamp);
  const camello = interpolate(f, [tb - 10, dur + 30], [-260, 400], clamp);
  return (
    <AbsoluteFill>
      <Desierto f={f} noche={n} />
      {f > tb - 10 && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${camello} 1150)`} fill="#14112a">
            <ellipse cx={0} cy={0} rx={120} ry={60} />
            <ellipse cx={-20} cy={-50} rx={50} ry={40} />
            <ellipse cx={50} cy={-45} rx={40} ry={34} />
            <path d="M 110 -10 Q 160 -60 150 -120 L 185 -130 L 190 -110 L 170 -100 Q 175 -40 125 20 Z" />
            {[-80, -40, 40, 80].map((lx, i) => (
              <rect key={lx} x={lx - 9} y={30} width={18} height={130} transform={`rotate(${Math.sin(f / 5 + i * 1.5) * 10} ${lx} 30)`} />
            ))}
          </g>
        </svg>
      )}
      <Yo f={f} x={360} y={1760} escala={0.95} acciones={[[0, "reposo"], [tc, "andar"]]} cara="serio" sudadera={f > tt ? "#5a3a24" : "#e8433a"} calor={0.3 * (1 - n)} />
      {f > tt && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(f, tt, tt + 8) }}>
          {/* turbante */}
          <path d={`M ${360 - 120} ${1760 - 585 * 0.95 - 30} Q 360 ${1760 - 585 * 0.95 - 230} ${360 + 120} ${1760 - 585 * 0.95 - 30} Q 360 ${1760 - 585 * 0.95 - 90} ${360 - 120} ${1760 - 585 * 0.95 - 30} Z`} fill="#e9dcc0" stroke="#c9b48a" strokeWidth={6} />
        </svg>
      )}
      <Rotulo f={f} inicio={tn} texto="SOLO DE NOCHE" x={600} y={500} tam={74} color={AMARILLO} />
      <Rotulo f={f} inicio={tt} texto="TÁPATE ENTERO" x={650} y={640} tam={56} fondo="#fff" color="#2a2f5e" giro={3} />
      <Rotulo f={f} inicio={tb} texto="COMO LOS BEDUINOS" x={600} y={770} tam={54} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 14 · túnica negra = túnica blanca (el aire circula por dentro) ----------
const Tunica: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <path d={`M ${x} ${y - 300} L ${x + 170} ${y + 200} L ${x - 170} ${y + 200} Z`} fill={color} stroke={color === "#111" ? "#444" : "#ccc"} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={x} cy={y - 360} r={80} fill="#c98a5a" />
    <path d={`M ${x - 95} ${y - 360} Q ${x} ${y - 520} ${x + 95} ${y - 360} L ${x + 110} ${y - 250} L ${x - 110} ${y - 250} Z`} fill={color} opacity={0.95} />
  </svg>
);
const tunicas: Fabrica = ({ en }) => ({ f }) => {
  const tn = en("negras");
  const tb = en("blancas,");
  const ta = en("aire");
  return (
    <AbsoluteFill>
      <Desierto f={f} sol={[540, 560]} />
      {f > tn - 4 && <Tunica x={250} y={1050} color="#111" />}
      {f > tb - 4 && <Tunica x={650} y={1050} color="#f4f1ea" />}
      <Termometro x={250} y={1360} alto={110} temp={interpolate(f, [tn, tn + 15], [20, 38], clamp)} min={0} max={50} escala={0.8} />
      {f > tb && <Termometro x={650} y={1360} alto={110} temp={interpolate(f, [tb, tb + 15], [20, 38], clamp)} min={0} max={50} escala={0.8} />}
      <Rotulo f={f} inicio={tb + 6} texto="=" x={450} y={940} tam={160} color="#fff" />
      {f > ta &&
        [0, 1, 2].map((k) => {
          const c = ((f - ta + k * 14) % 42) / 42;
          return (
            <svg key={k} width={W} height={H} style={{ position: "absolute", inset: 0 }}>
              <path d={`M ${160 + k * 60} ${1230 - c * 460} q 30 -40 0 -80`} fill="none" stroke="#8fd8ff" strokeWidth={10} strokeLinecap="round" opacity={1 - c} />
            </svg>
          );
        })}
      <Rotulo f={f} inicio={ta} texto="EL AIRE CIRCULA" x={540} y={480} tam={50} fondo="#fff" color="#0a4a7a" giro={-3} />
      <Rotulo f={f} inicio={tn} texto="NEGRA" x={250} y={1265} tam={44} color="#fff" />
      <Rotulo f={f} inicio={tb} texto="BLANCA" x={650} y={1265} tam={44} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 15 · 1994: Mauro Prosperi se pierde en una tormenta de arena ----------
const prosperi: Fabrica = ({ en }) => ({ f }) => {
  const t94 = en("1994,");
  const tm = en("Mauro");
  const tp = en("perdió");
  const tn = en("nueve");
  const tc = en("carrera.");
  const tormenta = interpolate(f, [tp, tp + 15], [0, 0.8], clamp);
  return (
    <AbsoluteFill>
      <Desierto f={f} tormenta={tormenta} />
      <Tarjeta f={f} inicio={t94} x={540} y={600} ancho={860} alto={250} fondo="#fff" borde="#e6e6e6" giro={-1}>
        <div style={{ position: "absolute", left: 30, top: 20, fontFamily: SANS, fontWeight: 900, fontSize: 30, color: ROJO }}>ÚLTIMA HORA · 1994</div>
        <div style={{ position: "absolute", left: 30, top: 66, right: 30, fontFamily: SANS, fontWeight: 900, fontSize: 52, color: "#111", lineHeight: 1.1 }}>{f > tm ? "Un corredor desaparece en el Sahara" : "…"}</div>
      </Tarjeta>
      <Yo f={f} x={330} y={1760} escala={0.95} acciones={[[0, "andar"], [tp, "alarma"], [tn, "triste"]]} cara={f > tp ? "preocupado" : "feliz"} calor={0.5} sudor={0.5} />
      {/* dorsal */}
      <div style={{ position: "absolute", left: 330 - 50, top: 1760 - 360 * 0.95, width: 100, height: 70, background: "#fff", borderRadius: 8, fontFamily: SANS, fontWeight: 900, fontSize: 34, textAlign: "center", lineHeight: "70px", color: "#111" }}>94</div>
      {f > tp && <Cronometro x={820} y={1000} r={110} vuelta={(f - tp) / 9} color={NARANJA} />}
      <Rotulo f={f} inicio={tp} texto="BRÚJULA: ???" x={820} y={1150} tam={40} color="#fff" />
      <Calendario f={f} inicio={tn} x={600} y={1000} dia={interpolate(f, [tn, tc + 10], [1, 9], clamp)} tam={0.6} />
      <Rotulo f={f} inicio={tc} texto="MARATÓN DES SABLES" x={540} y={820} tam={46} fondo={NARANJA} color="#fff" giro={2} />
    </AbsoluteFill>
  );
};

// ---------- 16 · el mapa: apareció en Argelia a casi 300 km ----------
const SALIDA: [number, number] = [-5.4, 30.6];
const LLEGADA: [number, number] = [-2.6, 29.3];
const argelia: Fabrica = ({ en }) => ({ f }) => {
  const to = en("orina,");
  const tmu = en("murciélagos");
  const ta = en("Argelia,");
  const t300 = en("300");
  const cam: Camara = { lon: interpolate(f, [0, ta + 20], [-6, -3.8], clamp), lat: 29.2, zoom: interpolate(f, [0, ta + 20], [7, 12], clamp) };
  const a = aPantallaMapa(cam, SALIDA);
  const b = aPantallaMapa(cam, LLEGADA);
  const t = tramo(f, ta - 20, t300);
  const fin: [number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return (
    <AbsoluteFill>
      <Mapa camara={cam} colores={{ Algeria: { color: "255,138,43", opacidad: 0.5 * tramo(f, ta, ta + 10) }, Morocco: { color: "242,194,123", opacidad: 0.35 } }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <line x1={a[0]} y1={a[1]} x2={fin[0]} y2={fin[1]} stroke="#fff" strokeWidth={10} strokeDasharray="4 22" strokeLinecap="round" />
        <circle cx={a[0]} cy={a[1]} r={20} fill="#fff" />
        {t > 0 && <circle cx={fin[0]} cy={fin[1]} r={26 + Math.sin(f / 3) * 4} fill={ROJO} stroke="#fff" strokeWidth={6} />}
      </svg>
      <Texto x={a[0] - 10} y={a[1] - 60} tam={36} color="#fff">SALIDA</Texto>
      <Rotulo f={f} inicio={ta} texto="ARGELIA" x={b[0]} y={b[1] - 110} tam={56} fondo={NARANJA} color="#fff" />
      <Rotulo f={f} inicio={t300} texto="≈ 300 KM" x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 + 120} tam={70} fondo="#fff" color="#111" giro={-4} />
      {/* lo que comió y bebió */}
      <Tarjeta f={f} inicio={to} x={280} y={560} ancho={420} alto={110} fondo="rgba(10,15,30,0.9)" borde={AMARILLO}>
        <div style={{ position: "absolute", left: 26, top: 26, fontFamily: SANS, fontWeight: 900, fontSize: 44, color: AMARILLO }}>SU ORINA</div>
      </Tarjeta>
      <Rotulo f={f} inicio={to + 8} texto="(no lo intentes)" x={280} y={640} tam={36} color="#fff" />
      {f > tmu && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2].map((k) => {
            const x = 620 + k * 140 + Math.sin(f / 6 + k) * 30;
            const y = 560 + Math.cos(f / 5 + k) * 30;
            const ala = Math.sin(f / 2 + k) * 25;
            return <path key={k} d={`M ${x} ${y} q -40 ${-30 - ala} -80 ${-10} q 20 20 10 40 q 30 -10 70 -10 q 40 0 70 10 q -10 -20 10 -40 q -40 -20 -80 10 Z`} fill="#1a1426" />;
          })}
        </svg>
      )}
      <Rotulo f={f} inicio={tmu} texto="MURCIÉLAGOS CRUDOS" x={760} y={660} tam={36} color="#fff" fondo="rgba(10,15,30,0.85)" />
    </AbsoluteFill>
  );
};

// ---------- 17 · final ----------
const final: Fabrica = ({ en }) => ({ f }) => {
  const te = en("Escríbelo");
  const ts = en("sígueme");
  const texto = "Yo, 20 minutos…";
  const n = Math.floor(interpolate(f, [te, te + 26], [0, texto.length], clamp));
  const pulsa = f > ts + 8;
  return (
    <AbsoluteFill>
      <Desierto f={f} noche={0.5} sol={[540, 1150]} />
      <Rotulo f={f} inicio={0} texto={"¿CUÁNTAS HORAS\nAGUANTARÍAS?"} y={240} tam={104} color="#fff" />
      <Tarjeta f={f} inicio={te - 4} x={540} y={760} ancho={820} alto={220} fondo="#fff" borde="#ffd7a8">
        <div style={{ position: "absolute", left: 30, top: 24, width: 80, height: 80, borderRadius: 40, background: `linear-gradient(135deg, ${AMARILLO}, ${NARANJA})` }} />
        <div style={{ position: "absolute", left: 132, top: 22, fontFamily: SANS, fontWeight: 900, fontSize: 34, color: "#5a6b80" }}>tú</div>
        <div style={{ position: "absolute", left: 132, top: 70, right: 24, fontFamily: SANS, fontWeight: 900, fontSize: 52, color: "#0b1a36", whiteSpace: "nowrap" }}>
          {texto.slice(0, n)}
          <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span>
        </div>
      </Tarjeta>
      <Rotulo f={f} inicio={te} texto="COMENTA" x={540} y={920} tam={60} color={AMARILLO} />
      {f > ts && (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 1060,
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
      <Yo f={f} x={300} y={1800} escala={0.8} acciones={[[0, "pensar"], [ts, "saludar"]]} cara={f > ts ? "feliz" : "pensativo"} calor={0.4} sudor={0.4} />
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, Fabrica> = { gancho, cuerpo, sudor, cerebro, movil, valle, huevos, coche, aire, dias, mito1, mito2, noche, tunicas, prosperi, argelia, final };

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> =>
  Object.fromEntries((Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](esc[k])])) as Record<Ilustracion, Dibujo>;

