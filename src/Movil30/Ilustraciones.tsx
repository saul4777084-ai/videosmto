// Una ilustración por frase. Cada elemento entra en la palabra que lo nombra (en("palabra")).
// Zona libre: el avatar ocupa la esquina inferior derecha (x > 720, y > 1420) y los subtítulos la franja de arriba (y≈200–420).
import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { Dibujo } from "../comun/tipos";
import { AMARILLO, clamp, Cronometro, Cuenta, H, Marca, muelle, ROJO, Rotulo, SANS, Sello, Tarjeta, Tiritas, tramo, Tu, VERDE, W } from "../Frio/Piezas";
import { Barra, Calendario, Fondo, Texto } from "../Inmovil/Ilustraciones";
import type { Escenario, Ilustracion } from "./escenas";

type Fabrica = (e: Escenario) => Dibujo;
const AZUL = "#4c8dff";
const MORADO = "#9b6bff";
const PIEL = "#f0bf98";

// ---------- el móvil: carcasa con pantalla (encendida o negra) ----------
const Movil: React.FC<{ x: number; y: number; ancho: number; giro?: number; escala?: number; encendido?: boolean; brillo?: number; children?: React.ReactNode }> = ({
  x,
  y,
  ancho,
  giro = 0,
  escala = 1,
  encendido = true,
  brillo = 0,
  children,
}) => {
  const alto = ancho * 2;
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - alto / 2,
        width: ancho,
        height: alto,
        transform: `rotate(${giro}deg) scale(${escala})`,
        borderRadius: ancho * 0.16,
        background: "#161a24",
        border: `${ancho * 0.035}px solid #3a4152`,
        boxShadow: `0 20px 50px rgba(0,0,0,0.55)${brillo > 0 ? `, 0 0 ${120 * brillo}px ${40 * brillo}px rgba(90,160,255,${0.55 * brillo})` : ""}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: ancho * 0.05,
          borderRadius: ancho * 0.11,
          overflow: "hidden",
          background: encendido ? "linear-gradient(160deg, #3d6bff 0%, #8a4dff 60%, #ff5f9e 100%)" : "#05070c",
        }}
      >
        {children}
      </div>
      <div style={{ position: "absolute", left: "50%", top: ancho * 0.08, width: ancho * 0.26, height: ancho * 0.06, marginLeft: -ancho * 0.13, borderRadius: 20, background: "#000" }} />
    </div>
  );
};

// notificación que baja desde arriba
const Notif: React.FC<{ f: number; inicio: number; x: number; y: number; ancho: number; titulo: string; texto: string; color?: string; giro?: number }> = ({ f, inicio, x, y, ancho, titulo, texto, color = ROJO, giro = 0 }) => {
  if (f < inicio) return null;
  const s = muelle(f, inicio, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - 60 + (1 - s) * -80,
        width: ancho,
        height: 120,
        opacity: Math.min(1, s * 1.5),
        transform: `rotate(${giro}deg)`,
        borderRadius: 30,
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ position: "absolute", left: 18, top: 22, width: 76, height: 76, borderRadius: 20, background: color }} />
      <div style={{ position: "absolute", left: 112, top: 14, fontFamily: SANS, fontWeight: 900, fontSize: 30, color: "#5a6b80", whiteSpace: "nowrap" }}>{titulo}</div>
      <div style={{ position: "absolute", left: 112, top: 54, fontFamily: SANS, fontWeight: 900, fontSize: 40, color: "#0b1a36", whiteSpace: "nowrap" }}>{texto}</div>
    </div>
  );
};

// fila de muñequitos (n en total, los primeros "marcados" en color)
const Gente: React.FC<{ f: number; inicio: number; x: number; y: number; n: number; marcados: number; color: string; paso?: number }> = ({ f, inicio, x, y, n, marcados, color, paso = 84 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {Array.from({ length: n }, (_, i) => {
      const s = muelle(f, inicio + i * 2, 10);
      if (f < inicio + i * 2) return null;
      const cx = x + i * paso;
      const c = i < marcados ? color : "rgba(255,255,255,0.35)";
      return (
        <g key={i} transform={`translate(${cx} ${y}) scale(${s})`}>
          <circle cx={0} cy={-70} r={22} fill={c} />
          <path d="M -32 0 Q -32 -42 0 -42 Q 32 -42 32 0 Z" fill={c} />
        </g>
      );
    })}
  </svg>
);

// ---------- 1 · gancho: el móvil sale volando y empiezan los 30 días ----------
const gancho: Fabrica = ({ en, dur }) => ({ f }) => {
  const tc = en("cuerpo");
  const td = en("dejas");
  const tdi = en("días?");
  const vuela = tramo(f, td, td + 16);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#3b2a8a" a="#0b0620" />
      <Rotulo f={f} inicio={0} texto={"¿QUÉ LE PASA\nA TU CUERPO"} y={230} tam={112} color="#fff" />
      <Rotulo f={f} inicio={td - 2} texto="SI DEJAS EL MÓVIL" y={500} tam={84} color={AMARILLO} giro={-2} />
      <Calendario f={f} inicio={tc} x={250} y={700} dia={interpolate(f, [td, dur], [1, 30], clamp)} tam={0.75} />
      <Movil x={interpolate(vuela, [0, 1], [430, 800])} y={interpolate(vuela, [0, 1], [1300, 900])} ancho={170} giro={vuela * 380} />
      {f > tdi && <Marca f={f} inicio={tdi} x={800} y={900} tam={190} tipo="x" />}
      <Tu f={f} x={330} y={1780} escala={0.95} acciones={[[0, "telefono"], [td + 4, "alarma"]]} cara={f > td + 4 ? "sorpresa" : "feliz"} />
      <Sello f={f} inicio={tdi + 6} x={760} y={1230} texto="30 DÍAS" color={ROJO} tam={76} giro={8} />
    </AbsoluteFill>
  );
};

// ---------- 2 · tranquilo, respira… todavía ----------
const respira: Fabrica = ({ en }) => ({ f }) => {
  const tt = en("Tranquilo,");
  const tr = en("respira.");
  const tm = en("muerto");
  const tv = en("todavía.");
  const ciclo = Math.sin((f - tr) / 14);
  const r = f > tr ? 170 + ciclo * 50 : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1f6a73" a="#04161a" />
      <Rotulo f={f} inicio={tt} texto="TRANQUILO" y={470} tam={96} color="#d8fff6" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={540} cy={860} r={r + 40} fill="rgba(127,242,208,0.12)" />
        <circle cx={540} cy={860} r={r} fill="rgba(127,242,208,0.35)" stroke="#7ff2d0" strokeWidth={8} />
      </svg>
      {f > tr && <Texto x={540} y={860} tam={64} color="#fff">{ciclo > 0 ? "INHALA" : "EXHALA"}</Texto>}
      <Tu f={f} x={300} y={1820} escala={0.7} acciones={[[0, "pensar"], [tv, "alarma"]]} cara={f > tv ? "preocupado" : "serio"} />
      <Rotulo f={f} inicio={tm} texto={"MUERTOS\nPOR ESTO: 0"} x={540} y={1100} tam={58} color="#fff" fondo="rgba(0,0,0,0.45)" />
      <Sello f={f} inicio={tv} x={700} y={1360} texto="…TODAVÍA" color={ROJO} tam={80} giro={-8} />
    </AbsoluteFill>
  );
};

// ---------- 3 · 96 veces al día ----------
const veces: Fabrica = ({ en }) => ({ f }) => {
  const tm = en("miras");
  const t96 = en("96");
  const tv = en("veces");
  const td = en("diez");
  const ts = en("sano.");
  const n = Math.round(interpolate(f, [tm, t96 + 6], [0, 96], clamp));
  const flash = f > tm && f < t96 + 10 && Math.floor(f / 3) % 2 === 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#5a2a7a" a="#10061c" />
      <Movil x={300} y={880} ancho={240} brillo={flash ? 0.8 : 0.2} escala={flash ? 1.03 : 1}>
        <Texto x={110} y={150} tam={64} color="#fff">{`${12 + Math.floor(n / 8)}:${String((n * 7) % 60).padStart(2, "0")}`}</Texto>
        {f > tm && <Texto x={110} y={300} tam={34} color="#fff">{"desliza para\nperder el día"}</Texto>}
      </Movil>
      <Cuenta f={f} a={tm} b={t96 + 6} desde={0} hasta={96} x={760} y={560} tam={230} color={AMARILLO} />
      <Rotulo f={f} inicio={tv} texto={"VECES\nAL DÍA"} x={760} y={820} tam={80} color="#fff" />
      {f > td && <Cronometro x={760} y={1180} r={130} vuelta={(f - td) / 40} color={AMARILLO} />}
      <Rotulo f={f} inicio={td} texto="CADA 10 MIN" x={760} y={1340} tam={56} fondo={ROJO} color="#fff" giro={-3} />
      <Sello f={f} inicio={ts} x={330} y={1420} texto="MUY SANO" color={VERDE} tam={72} giro={-8} />
      <Rotulo f={f} inicio={ts + 10} texto="(es broma)" x={330} y={1530} tam={44} color="#ffd6f0" />
    </AbsoluteFill>
  );
};

// ---------- 4 · día 1: la mano busca el móvil en el bolsillo ----------
const dia1: Fabrica = ({ en }) => ({ f }) => {
  const tdia = en("Día");
  const tm = en("mano");
  const tb = en("busca");
  const tt = en("Tocas");
  const tn = en("no");
  // la mano baja al bolsillo y vuelve a subir, como un tic
  const mete = f > tb ? 0.5 - Math.cos((f - tb) / 6) * 0.5 : 0;
  const yMano = 780 + mete * 200;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#22507a" a="#050f1c" />
      <Calendario f={f} inicio={tdia} x={850} y={500} dia={1} tam={0.55} />
      <Rotulo f={f} inicio={tdia} texto="DÍA 1" x={230} y={500} tam={110} color={AMARILLO} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* vaquero con su bolsillo */}
        <rect x={220} y={760} width={640} height={640} rx={60} fill="#2f5c9c" />
        <path d="M 330 860 L 750 860 L 730 1180 Q 540 1260 350 1180 Z" fill="#26508c" stroke="#e9b44c" strokeWidth={8} strokeDasharray="22 14" />
        <path d="M 330 860 Q 540 960 750 860" fill="none" stroke="#173a6a" strokeWidth={14} />
      </svg>
      {f > tm && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: tramo(f, tm, tm + 6) }}>
          <rect x={470} y={yMano - 160} width={140} height={160} rx={50} fill={PIEL} />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={470 + k * 36} y={yMano - 30} width={30} height={110} rx={15} fill={PIEL} stroke="#d99d74" strokeWidth={3} />
          ))}
        </svg>
      )}
      {/* tapa del bolsillo por delante de los dedos */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d="M 330 940 Q 540 1040 750 940 L 730 1180 Q 540 1260 350 1180 Z" fill="#26508c" />
      </svg>
      <Rotulo f={f} inicio={tb} texto="MODO AUTOMÁTICO" x={250} y={680} tam={42} fondo="#fff" color="#173a6a" giro={-2} />
      {f > tn && (
        <div style={{ position: "absolute", left: 120, top: 1440, width: 180, height: 300, border: "10px dashed #fff", borderRadius: 34, opacity: 0.6 + Math.sin(f / 4) * 0.3, transform: `scale(${muelle(f, tn, 10)})` }}>
          <Texto x={80} y={140} tam={140} color="#fff">?</Texto>
        </div>
      )}
      <Rotulo f={f} inicio={tt} texto="¿Y EL MÓVIL?" x={250} y={1290} tam={58} color={AMARILLO} giro={-4} />
      <Sello f={f} inicio={tn + 4} x={470} y={1600} texto="NO ESTÁ" color={ROJO} tam={64} giro={4} />
    </AbsoluteFill>
  );
};

// ---------- 5 · día 2: vibraciones fantasma ----------
const dia2: Fabrica = ({ en }) => ({ f }) => {
  const td = en("dos:");
  const tv = en("vibraciones");
  const tf = en("fantasma.");
  const tn = en("nueve");
  const tu = en("universitarios");
  const fuerza = f > tv ? 0.6 + Math.sin(f / 2) * 0.4 : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#4a2a6e" a="#0c0618" />
      <Calendario f={f} inicio={td} x={850} y={500} dia={2} tam={0.55} />
      <Rotulo f={f} inicio={td} texto="DÍA 2" x={360} y={500} tam={110} color={AMARILLO} />
      <Tu f={f} x={330} y={1380} escala={0.8} acciones={[[0, "reposo"], [tv, "sorpresa"], [tn, "pensar"]]} tirita={f > tv && f < tn ? 0.5 : 0} cara={f > tv ? "sorpresa" : "serio"} />
      <Tiritas f={f} x={330} y={1180} ancho={200} alto={140} fuerza={fuerza} />
      {f > tf && (
        <div style={{ position: "absolute", inset: 0, opacity: 0.55 + Math.sin(f / 5) * 0.25, transform: `translate(${Math.sin(f / 9) * 20}px, ${Math.cos(f / 11) * 16}px)` }}>
          <Movil x={780} y={920} ancho={180} encendido={false} giro={Math.sin(f * 2.4) * 6} />
          <Texto x={780} y={680} tam={50} color="#d9c8ff">{"BZZZ…?"}</Texto>
        </div>
      )}
      <Rotulo f={f} inicio={tf} texto={"VIBRACIONES\nFANTASMA"} x={780} y={1100} tam={58} fondo="#fff" color="#4a2a6e" giro={3} />
      <Gente f={f} inicio={tn} x={120} y={1560} n={10} marcados={f > tu ? 9 : 0} color={MORADO} paso={70} />
      <Rotulo f={f} inicio={tu} texto="9 DE CADA 10" x={420} y={1600} tam={58} color={AMARILLO} />
    </AbsoluteFill>
  );
};

// ---------- 6 · día 3: abstinencia de notificaciones ----------
const dia3: Fabrica = ({ en }) => ({ f }) => {
  const td = en("tres:");
  const ta = en("ansiedad,");
  const th = en("humor");
  const tab = en("aburrimiento.");
  const tf = en("Felicidades,");
  const tabs = en("abstinencia");
  const chips: [number, string, string][] = [
    [ta, "ANSIEDAD", ROJO],
    [th, "MAL HUMOR", "#ff8a3b"],
    [tab, "ABURRIMIENTO", "#7b8aa6"],
  ];
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#6e2a2a" a="#170606" />
      <Calendario f={f} inicio={td} x={850} y={540} dia={3} tam={0.55} />
      <Rotulo f={f} inicio={td} texto="DÍA 3" x={360} y={540} tam={110} color={AMARILLO} />
      {chips.map(([t, txt, c], i) => (
        <Rotulo key={txt} f={f} inicio={t} texto={txt} x={i === 1 ? 600 : 520} y={700 + i * 130} tam={64} fondo={c} color="#fff" giro={i % 2 ? 3 : -3} />
      ))}
      {f > tf &&
        Array.from({ length: 26 }, (_, i) => {
          const x = random(`c${i}`) * W;
          const y = 450 + (f - tf) * (6 + random(`v${i}`) * 8) + random(`y${i}`) * 200;
          const c = [AMARILLO, VERDE, AZUL, "#ff5f9e"][i % 4];
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: 22, height: 34, background: c, transform: `rotate(${f * 9 + i * 40}deg)`, opacity: y < 1500 ? 1 : 0 }} />;
        })}
      <Rotulo f={f} inicio={tf} texto="¡FELICIDADES!" x={540} y={1110} tam={84} color={AMARILLO} giro={-3} />
      <Tu f={f} x={230} y={1820} escala={0.7} acciones={[[0, "triste"], [tf, "alarma"]]} cara={f > tf ? "preocupado" : "triste"} tirita={f > ta ? 0.3 : 0} />
      <Sello f={f} inicio={tabs} x={650} y={1250} texto="ABSTINENCIA" color={ROJO} tam={74} giro={-6} />
    </AbsoluteFill>
  );
};

// ---------- 7 · cada notificación, una máquina de casino ----------
const SIMBOLOS = ["♥", "★", "!", "@", "♪"];
const casino: Fabrica = ({ en, dur }) => ({ f }) => {
  const tno = en("notificación");
  const tma = en("máquina");
  const tn = en("nunca");
  const tp = en("premio,");
  const tpa = en("paras.");
  const palanca = (t: number) => (f > t && f < t + 12 ? Math.sin(((f - t) / 12) * Math.PI) : 0);
  const tirones = [tn, tpa, tpa + 30, tpa + 60].filter((t) => t < dur);
  const baja = Math.max(...tirones.map(palanca));
  const x0 = 470;
  const y0 = 760;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#7a1f4a" a="#16040c" />
      <Notif f={f} inicio={tno} x={540} y={520} ancho={660} titulo="AHORA" texto="Alguien te dio like" />
      {f > tma && (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tma, 11)})`, transformOrigin: `${x0}px ${y0 + 300}px` }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <rect x={x0 - 330} y={y0 - 40} width={660} height={640} rx={60} fill="#d8263f" stroke="#ffd23f" strokeWidth={12} />
            <rect x={x0 - 260} y={y0 - 120} width={520} height={110} rx={40} fill="#ffd23f" />
            <rect x={x0 - 280} y={y0 + 80} width={560} height={260} rx={24} fill="#fff" />
            {/* palanca */}
            <line x1={x0 + 330} y1={y0 + 300} x2={x0 + 420} y2={y0 + 300} stroke="#999" strokeWidth={20} />
            <line x1={x0 + 420} y1={y0 + 300} x2={x0 + 420} y2={y0 + 300 - 220 * (1 - baja * 2)} stroke="#bbb" strokeWidth={18} strokeLinecap="round" />
            <circle cx={x0 + 420} cy={y0 + 300 - 220 * (1 - baja * 2)} r={34} fill={ROJO} stroke="#fff" strokeWidth={6} />
          </svg>
          <Texto x={x0} y={y0 - 66} tam={56} color="#7a1f4a">CASINO</Texto>
          {[0, 1, 2].map((k) => {
            const para = tp + k * 5;
            const gira = f > tn && f < para;
            const sim = gira ? SIMBOLOS[Math.floor(f / 2 + k * 2) % SIMBOLOS.length] : f >= para ? "♥" : SIMBOLOS[k + 1];
            return (
              <Texto key={k} x={x0 - 180 + k * 180} y={y0 + 210 + (gira ? ((f * 13 + k * 17) % 40) - 20 : 0)} tam={150} color={sim === "♥" ? ROJO : "#222"}>
                {sim}
              </Texto>
            );
          })}
        </div>
      )}
      <Rotulo f={f} inicio={tp + 10} texto="+1 LIKE" x={470} y={1170} tam={80} color={AMARILLO} giro={-4} />
      <Rotulo f={f} inicio={tpa} texto={"OTRA VEZ…\nY OTRA…"} x={360} y={1340} tam={64} color="#fff" />
    </AbsoluteFill>
  );
};

// ---------- 8 · primera semana: duermes mejor ----------
const sueno: Fabrica = ({ en }) => ({ f }) => {
  const ts = en("semana:");
  const td = en("duermes");
  const tl = en("luz");
  const tr = en("retrasa");
  const tm = en("melatonina,");
  const tsu = en("sueño.");
  const mel = f < tr ? 0.85 : interpolate(f, [tr, tr + 12, tsu, tsu + 30], [0.85, 0.3, 0.3, 0.85], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#1d2a6e" a="#03050f" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={860} cy={620} r={90} fill="#fff4c2" />
        <circle cx={900} cy={590} r={84} fill="#16224f" />
      </svg>
      <Rotulo f={f} inicio={ts} texto="SEMANA 1" x={380} y={470} tam={100} color={AMARILLO} />
      {f > td &&
        [0, 1, 2].map((k) => {
          const c = ((f - td) + k * 20) % 60;
          return (
            <Texto key={k} x={330 + c * 3 + k * 20} y={820 - c * 4} tam={60 + k * 16} color="#cfe0ff">
              <span style={{ opacity: 1 - c / 60 }}>Z</span>
            </Texto>
          );
        })}
      <Tu f={f} x={330} y={1300} escala={0.55} acciones={[[0, "reposo"]]} cara={f > td && f < tl ? "feliz" : "serio"} />
      {f > tl && <Movil x={760} y={1000} ancho={170} brillo={0.6 + Math.sin(f / 5) * 0.2} escala={muelle(f, tl, 10)} />}
      <Rotulo f={f} inicio={tl} texto="LUZ DE NOCHE" x={760} y={1250} tam={50} color="#9cc3ff" />
      <Barra x={130} y={1440} ancho={560} valor={mel} color={MORADO} etiqueta={f > tm - 6 ? "MELATONINA" : " "} />
      {f > tr && f < tsu + 10 && <Texto x={620} y={1618} tam={70} color={ROJO}>↓</Texto>}
      <Rotulo f={f} inicio={tsu} texto="= HORMONA DEL SUEÑO" x={410} y={1650} tam={44} color="#e3d6ff" />
    </AbsoluteFill>
  );
};

// ---------- 9 · el cuello carga hasta 27 kilos ----------
const cuello: Fabrica = ({ en }) => ({ f }) => {
  const tc = en("cuello");
  const tde = en("descansa:");
  const ta = en("agachada");
  const tm = en("móvil,");
  const t27 = en("27");
  const tk = en("kilos.");
  const ang = interpolate(f, [ta, tm + 6], [0, 60], clamp); // grados de inclinación
  const rad = (ang * Math.PI) / 180;
  const px = 300;
  const py = 1000; // base del cuello
  const hx = px + Math.sin(rad) * 190;
  const hy = py - Math.cos(rad) * 190;
  const peso = tramo(f, t27, t27 + 12);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#245a4a" a="#04120d" />
      <Rotulo f={f} inicio={tc} texto="TU CUELLO" x={330} y={470} tam={90} color="#fff" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* torso y columna */}
        <path d={`M ${px - 150} ${py + 520} Q ${px - 160} ${py + 40} ${px} ${py + 20} Q ${px + 160} ${py + 40} ${px + 150} ${py + 520} Z`} fill="#e8433a" />
        <line x1={px} y1={py + 30} x2={px} y2={py + 480} stroke="#fff" strokeWidth={10} strokeDasharray="30 12" opacity={0.6} />
        <line x1={px} y1={py + 30} x2={hx * 0.45 + px * 0.55} y2={hy * 0.45 + py * 0.55} stroke={PIEL} strokeWidth={70} strokeLinecap="round" />
        <line x1={px} y1={py + 30} x2={hx * 0.45 + px * 0.55} y2={hy * 0.45 + py * 0.55} stroke={ang > 30 ? ROJO : "#fff"} strokeWidth={10} strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={120} fill={PIEL} />
        <path d={`M ${hx - 120} ${hy - 10} Q ${hx} ${hy - 170} ${hx + 120} ${hy - 10} Q ${hx} ${hy - 90} ${hx - 120} ${hy - 10}`} fill="#3a2418" transform={`rotate(${ang} ${hx} ${hy})`} />
        <circle cx={hx + 50 * Math.cos(rad)} cy={hy + 20 + 50 * Math.sin(rad)} r={12} fill="#222" />
        {/* arco del ángulo */}
        {ang > 2 && <path d={`M ${px} ${py - 120} A 120 120 0 0 1 ${px + Math.sin(rad) * 120} ${py - Math.cos(rad) * 120}`} fill="none" stroke={AMARILLO} strokeWidth={8} />}
        {/* pesa encima de la cabeza */}
        {peso > 0 && (
          <g transform={`translate(${hx} ${hy - 200}) scale(${0.4 + peso * 0.6})`} opacity={peso}>
            <path d="M -110 60 L 110 60 L 80 -70 L -80 -70 Z" fill="#2b2f3a" />
            <rect x={-40} y={-120} width={80} height={60} rx={20} fill="none" stroke="#2b2f3a" strokeWidth={22} />
          </g>
        )}
      </svg>
      {f > tm - 8 && <Movil x={hx + 150} y={py + 140} ancho={110} giro={-30} />}
      <Marca f={f} inicio={tde} x={840} y={640} tam={130} tipo="ok" />
      {ang > 2 && <Rotulo f={f} inicio={ta} texto={`${Math.round(ang)}°`} x={840} y={800} tam={90} color={AMARILLO} />}
      <Cuenta f={f} a={t27 - 6} b={t27 + 14} desde={5} hasta={27} sufijo=" KG" x={800} y={1180} tam={110} color="#fff" />
      <Rotulo f={f} inicio={tk} texto={"COMO UN NIÑO\nDE 8 AÑOS"} x={800} y={950} tam={44} fondo="#fff" color="#245a4a" giro={3} />
    </AbsoluteFill>
  );
};

// ---------- 10 · segunda semana: concentración; con el móvil en la mesa rindes peor ----------
const mesa: Fabrica = ({ en }) => ({ f }) => {
  const ts = en("semana:");
  const tc = en("concentras");
  const tme = en("mesa,");
  const ta = en("apagado,");
  const tp = en("peor.");
  const foco = interpolate(f, [tc, tc + 18, tp, tp + 12], [0.35, 0.9, 0.9, 0.5], clamp);
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#2a4a7a" a="#050c18" />
      <Rotulo f={f} inicio={ts} texto="SEMANA 2" x={380} y={470} tam={100} color={AMARILLO} />
      <Barra x={140} y={640} ancho={800} valor={foco} color={f > tp ? ROJO : VERDE} etiqueta={f > tc - 4 ? "CONCENTRACIÓN" : " "} />
      <Tu f={f} x={330} y={1420} escala={0.62} acciones={[[0, "pensar"], [tp, "triste"]]} cara={f > tp ? "preocupado" : "pensativo"} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <rect x={80} y={1150} width={920} height={40} rx={14} fill="#a86f45" />
        <rect x={140} y={1190} width={36} height={300} fill="#8a5a36" />
        <rect x={904} y={1190} width={36} height={230} fill="#8a5a36" />
        {/* libro abierto */}
        <path d="M 200 1150 L 330 1100 L 460 1150 Z" fill="#fff" />
        <path d="M 330 1100 L 330 1150" stroke="#bbb" strokeWidth={4} />
      </svg>
      {f > tme && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - muelle(f, tme, 10)) * -300}px)` }}>
          <Movil x={680} y={1060} ancho={90} encendido={f < ta} giro={8} />
        </div>
      )}
      <Rotulo f={f} inicio={ta} texto="APAGADO" x={700} y={900} tam={50} fondo="#fff" color="#050c18" giro={-4} />
      <Sello f={f} inicio={tp} x={540} y={1330} texto="RINDES PEOR" color={ROJO} tam={74} giro={-5} />
    </AbsoluteFill>
  );
};

// ---------- 11 · el estudio de 2025: 467 personas sin internet en el móvil ----------
const estudio: Fabrica = ({ en }) => ({ f }) => {
  const t25 = en("2025,");
  const te = en("estudio");
  const tb = en("bloqueó");
  const ti = en("internet");
  const t467 = en("467");
  const tse = en("semanas.");
  const llenos = Math.round(interpolate(f, [t467 - 6, t467 + 20], [0, 467], clamp));
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#3a3f5a" a="#07080f" />
      <Tarjeta f={f} inicio={t25} x={540} y={540} ancho={760} alto={190} fondo="#fff" borde="#d6e4f5" giro={-2}>
        <div style={{ position: "absolute", left: 30, top: 18, fontFamily: SANS, fontWeight: 900, fontSize: 40, color: AZUL }}>{f > te ? "ESTUDIO CIENTÍFICO" : " "}</div>
        <div style={{ position: "absolute", left: 30, top: 74, fontFamily: SANS, fontWeight: 900, fontSize: 80, color: "#0b1a36" }}>2025</div>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ position: "absolute", left: 300, top: 96 + k * 26, width: 400 - k * 60, height: 12, borderRadius: 6, background: "#d8e0ea" }} />
        ))}
      </Tarjeta>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 468 }, (_, i) => (
          <circle key={i} cx={140 + (i % 18) * 26} cy={760 + Math.floor(i / 18) * 26} r={9} fill={i < llenos ? AMARILLO : "rgba(255,255,255,0.12)"} />
        ))}
      </svg>
      {f > tb && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${muelle(f, tb, 10)})`, transformOrigin: "830px 860px" }}>
          {[1, 2, 3].map((k) => (
            <path key={k} d={`M ${830 - k * 50} ${900 - k * 40} Q 830 ${900 - k * 90} ${830 + k * 50} ${900 - k * 40}`} fill="none" stroke="#fff" strokeWidth={18} strokeLinecap="round" />
          ))}
          <circle cx={830} cy={910} r={18} fill="#fff" />
        </svg>
      )}
      {f > ti && <Marca f={f} inicio={ti} x={830} y={830} tam={150} tipo="x" />}
      <Cuenta f={f} a={t467 - 6} b={t467 + 20} desde={0} hasta={467} x={830} y={1020} tam={120} color={AMARILLO} />
      <Rotulo f={f} inicio={t467 + 6} texto="PERSONAS" x={830} y={1170} tam={54} color="#fff" />
      <Rotulo f={f} inicio={tse} texto="2 SEMANAS" x={830} y={1290} tam={58} fondo={AZUL} color="#fff" giro={3} />
    </AbsoluteFill>
  );
};

// ---------- 12 · el 91 % mejoró en algo ----------
const noventa: Fabrica = ({ en }) => ({ f }) => {
  const t91 = en("91");
  const tal = en("algo:");
  const ta = en("atención,");
  const tan = en("ánimo");
  const tb = en("bienestar.");
  const p = interpolate(f, [t91 - 8, t91 + 16], [0, 0.91], clamp);
  const r = 230;
  const cx = 540;
  const cy = 820;
  const a = p * Math.PI * 2 - Math.PI / 2;
  const items: [number, string][] = [
    [ta, "ATENCIÓN"],
    [tan, "ÁNIMO"],
    [tb, "BIENESTAR"],
  ];
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#16603a" a="#03130b" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={60} />
        {p > 0 && <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${p > 0.5 ? 1 : 0} 1 ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`} fill="none" stroke={VERDE} strokeWidth={60} strokeLinecap="round" />}
      </svg>
      <Cuenta f={f} a={t91 - 8} b={t91 + 16} desde={0} hasta={91} sufijo="%" x={cx} y={cy - 90} tam={150} color="#fff" />
      <Rotulo f={f} inicio={tal} texto="MEJORÓ EN ALGO" x={540} y={1110} tam={64} color={AMARILLO} />
      {items.map(([t, txt], i) => (
        <React.Fragment key={txt}>
          <Rotulo f={f} inicio={t} texto={txt} x={380} y={1240 + i * 120} tam={60} fondo="#fff" color="#16603a" />
          <Marca f={f} inicio={t + 3} x={680} y={1290 + i * 120} tam={70} tipo="ok" />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

// ---------- 13 · atención de diez años menos, sin cremas ni gimnasio ----------
const joven: Fabrica = ({ en }) => ({ f }) => {
  const ta = en("atención");
  const td = en("diez");
  const tm = en("menos.");
  const tc = en("cremas");
  const tg = en("gimnasio.");
  const rebobina = f > td ? -(f - td) / 12 : 0;
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#6a3a8a" a="#0f0618" />
      <Rotulo f={f} inicio={ta} texto="SU ATENCIÓN" x={540} y={470} tam={84} color="#fff" />
      {f > td && <Cronometro x={330} y={820} r={160} vuelta={rebobina} color={AMARILLO} />}
      <Cuenta f={f} a={td} b={tm + 6} desde={0} hasta={-10} x={760} y={680} tam={170} color={AMARILLO} />
      <Rotulo f={f} inicio={tm} texto="AÑOS" x={760} y={880} tam={80} color="#fff" />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {f > tc && (
          <g transform={`translate(300 1200) scale(${muelle(f, tc, 10)})`}>
            <rect x={-110} y={-30} width={220} height={140} rx={30} fill="#ffd6f0" />
            <rect x={-120} y={-80} width={240} height={60} rx={20} fill="#ff5f9e" />
          </g>
        )}
        {f > tg && (
          <g transform={`translate(640 1210) scale(${muelle(f, tg, 10)})`}>
            <rect x={-150} y={-15} width={300} height={30} rx={10} fill="#bbb" />
            <rect x={-170} y={-70} width={50} height={140} rx={14} fill="#2b2f3a" />
            <rect x={120} y={-70} width={50} height={140} rx={14} fill="#2b2f3a" />
          </g>
        )}
      </svg>
      <Marca f={f} inicio={tc + 4} x={300} y={1220} tam={150} tipo="x" />
      <Marca f={f} inicio={tg + 4} x={640} y={1220} tam={150} tipo="x" />
      <Rotulo f={f} inicio={tg + 8} texto="GRATIS" x={470} y={1380} tam={80} fondo={VERDE} color="#fff" giro={-4} />
    </AbsoluteFill>
  );
};

// ---------- 14 · día 30: existe gente ----------
const dia30: Fabrica = ({ en }) => ({ f }) => {
  const t30 = en("30:");
  const td = en("descubres");
  const tg = en("gente…");
  const ts = en("simpáticos.");
  const otros: [number, string, number][] = [
    [140, "#38a0e0", 0],
    [560, "#f2a33a", 5],
  ];
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#2a7a5a" a="#04140d" />
      <Calendario f={f} inicio={t30} x={850} y={500} dia={30} tam={0.55} />
      <Rotulo f={f} inicio={t30} texto="DÍA 30" x={360} y={500} tam={110} color={AMARILLO} />
      <Rotulo f={f} inicio={tg} texto={"EXISTE\nGENTE"} x={540} y={680} tam={96} color="#fff" />
      <Tu f={f} x={350} y={1650} escala={0.75} acciones={[[0, "reposo"], [td, "sorpresa"], [ts, "saludar"]]} cara={f > ts ? "feliz" : f > td ? "sorpresa" : "serio"} />
      {otros.map(([x, color, d]) =>
        f > tg + d ? (
          <div key={x} style={{ position: "absolute", inset: 0, opacity: tramo(f, tg + d, tg + d + 8), transform: `translateX(${(1 - muelle(f, tg + d, 12)) * (x < 350 ? -300 : 300)}px)` }}>
            <Tu f={f} x={x} y={1560} escala={0.55} sudadera={color} acciones={[[0, "andar"], [tg + d + 14, "reposo"], [ts + d, "celebrar"]]} cara={f > ts ? "euforico" : "serio"} />
          </div>
        ) : null,
      )}
      <Rotulo f={f} inicio={ts} texto="¡Y SON SIMPÁTICOS!" x={470} y={1000} tam={62} fondo="#fff" color="#2a7a5a" giro={-3} />
    </AbsoluteFill>
  );
};

// ---------- 15 · la mala noticia: 300 notificaciones y vuelta a empezar ----------
const recaida: Fabrica = ({ en }) => ({ f }) => {
  const tm = en("mala");
  const tr = en("recuperas,");
  const t300 = en("300");
  const tv = en("vuelves");
  const ta = en("antes.");
  const cayendo = Math.floor(interpolate(f, [t300 - 4, tv], [0, 7], clamp));
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#7a2a1f" a="#170504" />
      <Rotulo f={f} inicio={tm} texto="LA MALA NOTICIA" x={540} y={460} tam={78} color={AMARILLO} />
      {f > tr && (
        <Movil x={330} y={980} ancho={260} escala={muelle(f, tr, 10)} giro={f > t300 ? Math.sin(f * 2.2) * 3 : 0}>
          {f > t300 && (
            <div style={{ position: "absolute", right: 10, top: 10, minWidth: 110, height: 76, borderRadius: 38, background: ROJO, color: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 48, textAlign: "center", lineHeight: "76px", padding: "0 10px" }}>
              {Math.round(interpolate(f, [t300 - 4, t300 + 16], [0, 300], clamp))}
            </div>
          )}
        </Movil>
      )}
      {Array.from({ length: cayendo }, (_, i) => (
        <Notif key={i} f={f} inicio={t300 - 4 + i * 4} x={720 - (i % 2) * 40} y={640 + i * 112} ancho={520} titulo="HACE 30 DÍAS" texto={["Grupo familia (87)", "Oferta!!!", "Te etiquetaron", "Nuevo seguidor", "Mamá: ¿VIVES?"][i % 5]} color={[ROJO, AZUL, VERDE, MORADO, AMARILLO][i % 5]} giro={(i % 3) - 1} />
      ))}
      <Tu f={f} x={330} y={1810} escala={0.6} acciones={[[0, "reposo"], [tv, "telefono"]]} cara={f > tv ? "picaro" : "serio"} />
      <Sello f={f} inicio={ta} x={600} y={1300} texto="VUELTA A EMPEZAR" color={ROJO} tam={62} giro={-6} />
    </AbsoluteFill>
  );
};

// ---------- 16 · final: ¿cuántos días aguantarías? ----------
const final: Fabrica = ({ en }) => ({ f }) => {
  const ta = en("aguantarías");
  const te = en("Escríbelo");
  const tc = en("comentarios.");
  const ts = en("Sí,");
  const texto = "Ni uno, la verdad…";
  const n = Math.floor(interpolate(f, [te, te + 30], [0, texto.length], clamp));
  return (
    <AbsoluteFill>
      <Fondo f={f} de="#3b2a8a" a="#0b0620" />
      <Rotulo f={f} inicio={0} texto={"¿CUÁNTOS DÍAS"} y={240} tam={110} color="#fff" />
      <Rotulo f={f} inicio={ta - 2} texto="AGUANTARÍAS?" y={380} tam={110} color={AMARILLO} giro={-2} />
      <Tarjeta f={f} inicio={te - 4} x={540} y={760} ancho={840} alto={220} fondo="#fff" borde="#d6e4f5">
        <div style={{ position: "absolute", left: 30, top: 24, width: 80, height: 80, borderRadius: 40, background: `linear-gradient(135deg, ${MORADO}, ${AZUL})` }} />
        <div style={{ position: "absolute", left: 132, top: 22, fontFamily: SANS, fontWeight: 900, fontSize: 34, color: "#5a6b80" }}>tú</div>
        <div style={{ position: "absolute", left: 132, top: 70, right: 24, fontFamily: SANS, fontWeight: 900, fontSize: 52, color: "#0b1a36", whiteSpace: "nowrap" }}>
          {texto.slice(0, n)}
          <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span>
        </div>
      </Tarjeta>
      <Rotulo f={f} inicio={tc} texto="COMENTA" x={540} y={920} tam={64} color={AMARILLO} />
      <Tu f={f} x={330} y={1800} escala={0.85} acciones={[[0, "pensar"], [te, "telefono"]]} cara={f > ts ? "picaro" : "pensativo"} />
      <Sello f={f} inicio={ts} x={640} y={1180} texto="SÍ, CON EL MÓVIL" color={MORADO} tam={60} giro={-5} />
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, Fabrica> = { gancho, respira, veces, dia1, dia2, dia3, casino, sueno, cuello, mesa, estudio, noventa, joven, dia30, recaida, final };

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> =>
  Object.fromEntries((Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](esc[k])])) as Record<Ilustracion, Dibujo>;
