// Versión 3D de "¿Qué pasaría si hoy ganaras un millón de dólares?": un protagonista ("tú") recorre los
// escenarios del Mundo 3D con los demás personajes de secundarios. Los rótulos 2D van encima del 3D.
import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { Mundo } from "../comun/Escenarios3D";
import {
  Accion,
  Auto,
  azar,
  Barra,
  Billete,
  Cerdito,
  clamp01,
  Fajo,
  Flecha,
  lerp,
  lerp3,
  LluviaBilletes,
  Maletin,
  Mansion,
  Mat,
  Moneda,
  Persona,
  Pose,
  pop,
  poseDe,
  Tarjeta,
  tramo,
  Tumbona,
  V3,
} from "../comun/Mundo3D";
import { CapitanaBrisa, Dani, HadaMerengue, Lulu, Ramses, SheriffRosa, Tobias, Zorp } from "../comun/Personajes3D";
import { Dibujo } from "../comun/tipos";
import { ESCENARIOS, Escenario, Ilustracion } from "./escenas";

const ORO = "#ffc928";
const FUENTE = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const muelle = (f: number, inicio: number) => spring({ frame: f - inicio, fps: 30, config: { damping: 11, stiffness: 160 } });
const dinero = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

// ---------- protagonista: "tú" (sudadera, vaqueros, zapatillas) ----------

const Telefono3D: React.FC<{ brilla?: number }> = ({ brilla = 0 }) => (
  <group position={[0, -0.02, 0.06]} rotation={[0.2, 0, 0]}>
    <mesh castShadow>
      <boxGeometry args={[0.14, 0.26, 0.025]} />
      <Mat color="#151515" rugoso={0.3} metal={0.4} />
    </mesh>
    <mesh position={[0, 0, 0.014]}>
      <planeGeometry args={[0.12, 0.23]} />
      <meshStandardMaterial color="#4f8bff" emissive="#4f8bff" emissiveIntensity={0.6 + brilla * 1.5} />
    </mesh>
  </group>
);

const Tu: React.FC<{
  f: number;
  pos?: V3;
  giro?: number;
  escala?: number;
  accion?: Accion;
  pose?: Pose;
  telefono?: number; // brillo de la pantalla si lleva teléfono
}> = ({ f, pos, giro, escala, accion = "reposo", pose, telefono }) => (
  <Persona
    f={f}
    pos={pos}
    giro={giro}
    escala={escala}
    semilla={11}
    piel="#d9a07a"
    pelo="#2a1a10"
    camisa="#2f6fd6"
    pantalon="#3b4f7a"
    estilo={{ pelo: "corto", zapatos: "#f2f2f2", cinturon: false, cuello: null, mangas: "#2f6fd6", ojos: "#3a2414" }}
    pose={{ ...poseDe(accion, f, 11), ...pose }}
    enManoDer={telefono !== undefined ? <Telefono3D brilla={telefono} /> : undefined}
  />
);

// ---------- rótulos 2D sobre el 3D ----------

const Rotulo: React.FC<{ f: number; inicio: number; texto: string; y: number; tam?: number; color?: string; fondo?: string; giro?: number }> = ({
  f,
  inicio,
  texto,
  y,
  tam = 96,
  color = "#fff",
  fondo,
  giro = -3,
}) => {
  if (f < inicio) return null;
  const s = muelle(f, inicio);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `scale(${s}) rotate(${giro + Math.sin(f / 14) * 1.2}deg)`,
          fontFamily: FUENTE,
          fontWeight: 900,
          fontSize: tam,
          color,
          background: fondo,
          padding: fondo ? "10px 34px" : 0,
          borderRadius: 24,
          lineHeight: 1.05,
          textAlign: "center",
          WebkitTextStroke: fondo ? undefined : "4px #10131a",
          textShadow: fondo ? undefined : "0 10px 0 rgba(0,0,0,0.35)",
          boxShadow: fondo ? "0 14px 0 rgba(0,0,0,0.3)" : undefined,
          whiteSpace: "pre-line",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

const Burbuja: React.FC<{ f: number; inicio: number; texto: string; x: number; y: number }> = ({ f, inicio, texto, x, y }) => {
  if (f < inicio) return null;
  const s = muelle(f, inicio);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + Math.sin((f + x) / 12) * 6,
        transform: `translate(-50%, -50%) scale(${s})`,
        background: "#fff",
        borderRadius: 30,
        padding: "14px 26px",
        fontFamily: FUENTE,
        fontWeight: 800,
        fontSize: 44,
        color: "#1b1b1b",
        boxShadow: "0 10px 0 rgba(0,0,0,0.25)",
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};

const Contador: React.FC<{ f: number; desde: number; hasta: number; a: number; b: number; y: number; color?: string; tam?: number }> = ({
  f,
  desde,
  hasta,
  a,
  b,
  y,
  color = ORO,
  tam = 130,
}) => {
  if (f < a - 4) return null;
  const v = interpolate(f, [a, b], [desde, hasta], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const late = 1 + 0.05 * Math.sin(f / 3) * (f < b ? 1 : 0);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center" }}>
      <span
        style={{
          display: "inline-block",
          transform: `scale(${late * muelle(f, a - 4)})`,
          fontFamily: FUENTE,
          fontSize: tam,
          fontWeight: 900,
          color,
          WebkitTextStroke: "5px #10131a",
          textShadow: "0 12px 0 rgba(0,0,0,0.35)",
        }}
      >
        {dinero(v)}
      </span>
    </div>
  );
};

// ---------- escenas ----------

// 1 · Feria nocturna: te cae un maletín con un millón y lo celebras
const gancho = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const abre = en("millón");
  const cae = Math.max(0, abre - 14);
  const yMaletin = lerp(9, 0, clamp01((f - cae) / 12) ** 2);
  return (
    <AbsoluteFill>
      <Mundo escenario="feria" f={f} camara={lerp3([0, 2.8, 10.5], [0.2, 2.2, 7.6], tramo(f, 0, dur))} mira={[0, 1.5, 0]}>
        <Tu f={f} pos={[0.9, 0, 0]} giro={-0.3} accion={f > abre ? "celebrar" : "pensar"} />
        <Lulu f={f} pos={[-2.6, 0, -2.2]} giro={0.5} escala={0.85} accion="reposo" malabares />
        <Maletin pos={[-0.8, yMaletin, 1]} rot={[0, 0.5, 0]} abre={tramo(f, abre, abre + 10)} escala={0.9} />
        <LluviaBilletes f={f} inicio={abre} n={45} area={[8, 5]} />
      </Mundo>
      <Rotulo f={f} inicio={0} texto={"¿Y SI HOY\nGANARAS…"} y={300} tam={100} />
      <Contador f={f} desde={0} hasta={1000000} a={abre} b={en("dólares?") + 12} y={1180} />
    </AbsoluteFill>
  );
};

// 2 · Feria, primer plano: saltas y gritas con el corazón a mil
const grito = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tc = en("corazón");
  const tg = en("gritar.");
  const tiembla = f > tg ? Math.sin(f * 2.7) * 0.06 : 0;
  return (
    <AbsoluteFill>
      <Mundo escenario="feria" f={f} camara={lerp3([1.6 + tiembla, 2.1, 5.2], [0.6 + tiembla, 1.9, 4.4], tramo(f, 0, dur))} mira={[0.3, 1.6, 0]}>
        <Tu
          f={f}
          pos={[0.3, 0, 0]}
          giro={0.15}
          accion={f > tg ? "celebrar" : "reposo"}
          pose={f > tg ? { boca: "sorpresa", hablar: 1 } : { brazoDer: 0.5, adelanteDer: 1.2, codoDer: 2.1, boca: "sorpresa" }}
        />
        <LluviaBilletes f={f} inicio={0} n={25} area={[6, 4]} />
      </Mundo>
      <Rotulo f={f} inicio={0} texto="MINUTO 1" y={470} tam={70} fondo="#ff2d55" />
      <Rotulo f={f} inicio={tc} texto="❤️ ×1000" y={1220} tam={96} fondo="#ffffff" color="#d0002a" giro={4} />
      <Rotulo f={f} inicio={tg} texto="¡AAAAAH!" y={1380} tam={130} color={ORO} giro={-6} />
    </AbsoluteFill>
  );
};

// 3 · Lejano Oeste: el teléfono no para y todos vienen hacia ti
const telefono = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tt = en("teléfono");
  const tr = en("repente");
  const llega = tramo(f, tr - 8, dur);
  const anda = llega < 1 && f > tr - 8;
  const x = (desde: number) => lerp(desde, desde * 0.35, llega);
  const accion: Accion = anda ? "andar" : "saludar";
  const vibra = f > tt ? Math.sin(f * 3) * 0.6 : 0;
  return (
    <AbsoluteFill>
      <Mundo escenario="oeste" f={f} camara={[-0.4, 3.6, 14]} mira={[0.2, 1.6, 0]}>
        <Tu f={f} pos={[0.3, 0, 0.8]} accion="reposo" telefono={vibra} pose={{ adelanteDer: 1.3, brazoDer: 0.2, codoDer: 1.5, cabeza: -0.15 }} />
        <SheriffRosa f={f} pos={[x(-5), 0, 0]} giro={1.1} escala={0.85} accion={accion} />
        <Ramses f={f} pos={[x(-6.5), 0, 2]} giro={1.2} escala={0.85} accion={accion} />
        <Dani f={f} pos={[x(5.5), 0, 0]} giro={-1.1} escala={0.85} accion={accion} balon={false} />
        <Lulu f={f} pos={[x(6.8), 0, 2]} giro={-1.2} escala={0.85} accion={accion} malabares={false} />
        <Zorp f={f} pos={[x(4.6), 0, -1.6]} giro={-0.9} escala={0.85} accion={accion} />
      </Mundo>
      <Rotulo f={f} inicio={0} texto="1 HORA DESPUÉS" y={470} tam={66} fondo="#ffd400" color="#1b1b1b" />
      <Rotulo f={f} inicio={tt} texto="📱 99+" y={610} tam={80} fondo="#ff1744" giro={5} />
      <Burbuja f={f} inicio={tr + 2} texto="¡Hola, primo! 😍" x={290} y={1000} />
      <Burbuja f={f} inicio={tr + 10} texto="¿Café? ❤️" x={820} y={1100} />
      <Burbuja f={f} inicio={tr + 18} texto="Un negocio… 💼" x={330} y={1180} />
      <Rotulo f={f} inicio={en("amigos.")} texto="¡TODOS TUS AMIGOS!" y={1340} tam={66} fondo="#1b1b1b" />
    </AbsoluteFill>
  );
};

// 4 · Antiguo Egipto: Ramsés cobra los impuestos y se lleva un tercio de los fajos
const impuestos = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const t0 = en("impuestos");
  const pila: V3[] = Array.from({ length: 9 }, (_, i) => [0.5 + (i % 3) * 1.05, Math.floor(i / 3) * 0.32, 1.2]);
  const destino: V3 = [-3.5, 3, -5.5];
  return (
    <AbsoluteFill>
      <Mundo escenario="egipto" f={f} camara={lerp3([0.6, 3.2, 13], [1, 3, 12], tramo(f, 0, dur))} mira={[0.6, 1.5, -1]}>
        <Ramses f={f} pos={[-1.4, 0, 0.6]} giro={0.6} accion={f > t0 ? "senalar" : "hablar"} />
        <Tu f={f} pos={[3.6, 0, 1.6]} giro={-0.7} accion={f > en("tercio.") ? "reposo" : "reposo"} pose={f > t0 ? { boca: "triste", brazoIzq: 0.9, brazoDer: 0.9, codoIzq: 0.4, codoDer: 0.4 } : undefined} />
        {pila.map((p, i) => {
          const vuela = i >= 6;
          const k = vuela ? tramo(f, t0 + (i - 6) * 6, t0 + (i - 6) * 6 + 24) : 0;
          const pos = lerp3(p, destino, k);
          pos[1] += Math.sin(k * Math.PI) * 3;
          return k < 1 ? <Fajo key={i} pos={pos} rot={[0, k * 6, k * 2]} escala={1 - k * 0.5} /> : null;
        })}
      </Mundo>
      <Rotulo f={f} inicio={en("ojo:")} texto="⚠️ OJO" y={470} tam={70} fondo="#ff3d00" />
      <Rotulo f={f} inicio={t0} texto="IMPUESTOS" y={620} tam={100} fondo="#c62828" />
      <Rotulo f={f} inicio={en("tercio.")} texto="−⅓ o más" y={780} tam={130} color="#ff5252" giro={4} />
    </AbsoluteFill>
  );
};

// 5 · Isla pirata: mansión, deportivo… y el dinero se esfuma
const gastos = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tm = en("mansión");
  const ta = en("auto");
  const te = en("esfuma");
  const autoX = interpolate(f, [ta - 12, ta + 8, dur], [-12, 0.4, 1.6], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const quedan = Math.round(lerp(8, 0, tramo(f, te - 4, en("meses.") + 6)));
  return (
    <AbsoluteFill>
      <Mundo escenario="islaPirata" f={f} camara={lerp3([-0.4, 3.6, 15], [0.6, 3.2, 13.5], tramo(f, 0, dur))} mira={[0.4, 2, 0]}>
        <group scale={pop(f, tm - 4)}>
          <Mansion pos={[1.8, 0, -4.5]} escala={0.9} />
        </group>
        <Auto pos={[autoX, 0, 2.6]} color="#e53935" ruedas={autoX * 2} escala={0.85} />
        <Tu f={f} pos={[-1.3, 0, 2.2]} giro={0.6} accion={f < te ? "senalar" : "reposo"} pose={f >= te ? { boca: "sorpresa", brazoIzq: 2.2, brazoDer: 2.2, codoIzq: 1.6, codoDer: 1.6 } : undefined} />
        {Array.from({ length: quedan }, (_, i) => (
          <Fajo key={i} pos={[-2.6, i * 0.3, 3.0]} rot={[0, i * 0.2, 0]} escala={0.8} />
        ))}
        {f > te &&
          Array.from({ length: 16 }, (_, i) => {
            const t = (f - te - i * 2) / 28;
            if (t < 0 || t > 1) return null;
            return <Billete key={i} pos={[-3.4 + t * 4 * (azar(i) - 0.3), 1 + t * 5, 2.6 + (azar(i + 9) - 0.5) * 2]} rot={[t * 6 + i, t * 5, 0]} escala={0.6} />;
          })}
      </Mundo>
      <Rotulo f={f} inicio={tm} texto="🏰 MANSIÓN" y={470} tam={74} fondo="#7b1fa2" />
      <Rotulo f={f} inicio={ta} texto="🏎️ AUTO DE LUJO" y={610} tam={70} fondo="#e53935" giro={3} />
      <Rotulo f={f} inicio={en("meses.")} texto="¡SE ESFUMA EN MESES!" y={1300} tam={70} fondo="#1b1b1b" />
    </AbsoluteFill>
  );
};

// 6 · Polo Norte de noche: los ganadores que se quedan sin nada
const loteria = ({ en }: Escenario): Dibujo => ({ f }) => {
  const tl = en("lotería");
  const baja = tramo(f, en("acaban"), en("dinero.") + 6);
  const filas = Math.max(0, Math.round(8 * (1 - baja)));
  const tiembla = f > en("problemas") ? Math.sin(f * 2.3) * 0.05 : 0;
  return (
    <AbsoluteFill>
      <Mundo escenario="poloNorte" f={f} camara={[0.5 + tiembla, 3, 12]} mira={[0.5, 1.5, 0]}>
        <Tu f={f} pos={[-0.4, 0, 0.6]} giro={0.35} accion="reposo" pose={{ boca: "triste", inclinar: 0.12 * baja, cabeza: Math.sin(f / 8) * 0.2 * baja }} />
        <Tobias f={f} pos={[-2.6, 0, -1]} giro={0.6} escala={0.8} accion="reposo" />
        {Array.from({ length: filas }, (_, i) => (
          <Fajo key={i} pos={[1.5, i * 0.3, 0.6]} rot={[0, i * 0.15, 0]} />
        ))}
        <Flecha pos={[2.6, lerp(7, 3.4, tramo(f, en("problemas") - 8, en("problemas") + 4)), -0.5]} rot={[0, 0, Math.PI]} escala={pop(f, tl) * 0.8} />
      </Mundo>
      <Rotulo f={f} inicio={tl} texto="🎟️ GANADORES DE LOTERÍA" y={470} tam={58} fondo="#ffffff" color="#c62828" />
      <Rotulo f={f} inicio={en("problemas")} texto={"PROBLEMAS\nDE DINERO"} y={640} tam={100} color="#ff5252" giro={-5} />
    </AbsoluteFill>
  );
};

// 7 · Marte: rompes tus tarjetas de deuda una a una
const deudas = ({ en }: Escenario): Dibujo => ({ f }) => {
  const tp = en("paga");
  const fin = en("deudas.");
  const colores = ["#7e57c2", "#1e88e5", "#ef6c00"];
  return (
    <AbsoluteFill>
      <Mundo escenario="marte" f={f} camara={[0.6, 2.6, 8.5]} mira={[0.4, 1.8, 0]}>
        <Tu f={f} pos={[0.8, 0, 0]} giro={-0.2} accion={f > fin + 6 ? "celebrar" : "reposo"} pose={f > fin + 6 ? undefined : { adelanteDer: 1.2, adelanteIzq: 1.2, codoDer: 1, codoIzq: 1 }} />
        <Zorp f={f} pos={[-2.4, 0, -1.4]} giro={0.6} escala={0.8} accion={f > fin ? "celebrar" : "reposo"} />
        {colores.map((c, i) => {
          const t = f / 8 + (i / 3) * Math.PI * 2;
          const parte = tramo(f, tp + i * 5, tp + i * 5 + 12);
          const cae = Math.min(2.2, Math.max(0, f - (tp + i * 5 + 10)) ** 2 * 0.004);
          return (
            <Tarjeta
              key={i}
              color={c}
              pos={[0.8 + Math.cos(t) * 1.1, 3.7 + Math.abs(Math.sin(t)) * 0.6 - cae * 1.6, 0.4]}
              rot={[0.1, Math.sin(f / 10 + i) * 0.6, Math.sin(t) * 0.3]}
              parte={parte}
              escala={0.55}
            />
          );
        })}
      </Mundo>
      <Rotulo f={f} inicio={en("inteligente:")} texto="EL PLAN INTELIGENTE" y={470} tam={64} fondo="#ffffff" color="#3b2a7a" />
      <Rotulo f={f} inicio={en("primero,")} texto="1 · PAGA TUS DEUDAS" y={600} tam={70} fondo="#06a77d" giro={2} />
      <Rotulo f={f} inicio={fin} texto="DEUDAS: $0 ✓" y={1280} tam={92} fondo="#2e7d32" giro={2} />
    </AbsoluteFill>
  );
};

// 8 · País de las golosinas: el Hada Merengue te ayuda a llenar el cerdito
const emergencias = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tg = en("guarda");
  return (
    <AbsoluteFill>
      <Mundo escenario="golosinas" f={f} camara={lerp3([1.5, 3, 10.5], [-0.3, 2.8, 10], tramo(f, 0, dur))} mira={[0.2, 1.5, 0]}>
        <HadaMerengue f={f} pos={[2.2, 0, -0.6]} giro={-0.7} escala={0.85} accion="saludar" />
        <Tu f={f} pos={[0.8, 0, 0.6]} giro={-0.5} accion="reposo" pose={{ adelanteDer: 1.2, codoDer: 0.6, brazoDer: 0.3, boca: "sonrisa" }} />
        <Cerdito pos={[-0.9, 0, 0.6]} giro={0.5 + Math.sin(f / 20) * 0.15} escala={pop(f, 0) * 0.75} />
        {Array.from({ length: 12 }, (_, i) => {
          const sale = tg + i * 4;
          const t = (f - sale) / 14;
          if (t < 0 || t > 1) return null;
          return <Moneda key={i} pos={[lerp(0.6, -0.9, t), lerp(2.6, 1.55, t) + Math.sin(t * Math.PI) * 0.8, 0.6]} rot={[0, Math.PI / 2, f / 3]} escala={0.7} />;
        })}
      </Mundo>
      <Rotulo f={f} inicio={0} texto="2 · FONDO DE EMERGENCIA" y={470} tam={62} fondo="#f77f00" />
      <Rotulo f={f} inicio={en("seis")} texto="6 MESES" y={620} tam={130} color={ORO} giro={-4} />
    </AbsoluteFill>
  );
};

// 9 · Estadio: inviertes con calma junto a tu asesora (Sheriff Rosa) y las barras crecen
const invertir = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const ti = en("invierte");
  const ta = en("asesor");
  const ang = lerp(-0.3, 0.3, tramo(f, 0, dur));
  const n = 8;
  const alto = (i: number) => 1.0 * Math.pow(1.1, i) * 1.15;
  return (
    <AbsoluteFill>
      <Mundo escenario="estadio" f={f} camara={[Math.sin(ang) * 12 + 0.5, 4.2, Math.cos(ang) * 12]} mira={[0.5, 2, 0]}>
        {Array.from({ length: n }, (_, i) => {
          const sale = interpolate(i, [0, n - 1], [ti, ti + 50]);
          return <Barra key={i} pos={[-2.6 + i * 0.75, 0, -0.5]} alto={alto(i) * tramo(f, sale, sale + 10)} color={i === n - 1 ? ORO : "#4dd0a1"} />;
        })}
        <Tu f={f} pos={[1.0, 0, 2.2]} giro={-0.5} accion={f > ta ? "hablar" : "senalar"} />
        <group scale={pop(f, ta - 6)}>
          <SheriffRosa f={f} pos={[2.3, 0, 1.6]} giro={-1.2} escala={0.95} accion={f > ta ? "hablar" : "saludar"} />
        </group>
      </Mundo>
      <Rotulo f={f} inicio={0} texto="3 · INVIERTE CON CALMA" y={470} tam={62} fondo="#118ab2" />
      <Rotulo f={f} inicio={ta} texto="🤝 ASESOR DE CONFIANZA" y={620} tam={60} fondo="#ffffff" color="#0b3954" giro={2} />
    </AbsoluteFill>
  );
};

// 10 · Isla pirata: descansas en la tumbona mientras brotan monedas
const interes = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tt = en("treinta");
  return (
    <AbsoluteFill>
      <Mundo escenario="islaPirata" f={f} camara={lerp3([2.5, 3, 10], [1, 2.6, 8.6], tramo(f, 0, dur))} mira={[0, 1, 0]}>
        <group position={[0, 0.2, 0]}>
          <Tumbona pos={[0, 0, 0.6]} giro={1.1} escala={1.15} />
          <group position={[0, 0.62, 0.6]} rotation={[0, 1.1, 0]}>
            <group rotation={[-1.15, 0, 0]} position={[0, 0, 0.55]}>
              <Tu f={f} pos={[0, -0.95, 0]} accion="reposo" pose={{ brazoIzq: 2.8, brazoDer: 2.8, codoIzq: 1.6, codoDer: 1.6, boca: "sonrisa" }} />
            </group>
          </group>
          {Array.from({ length: 14 }, (_, i) => {
            const sale = tt - 10 + i * 5;
            const t = (f - sale) / 22;
            if (t < 0 || t > 1.6) return null;
            const x = (azar(i) - 0.5) * 6;
            const z = (azar(i + 3) - 0.5) * 3 + 0.8;
            return <Moneda key={i} pos={[x, Math.min(t, 1) * 2.4 + 0.3, z]} rot={[0, f / 4 + i, 0]} escala={0.8 * Math.min(1, t * 3)} />;
          })}
        </group>
        <CapitanaBrisa f={f} pos={[-2.8, 0, -1.4]} giro={0.6} escala={0.85} accion="saludar" />
      </Mundo>
      <Rotulo f={f} inicio={en("cinco")} texto="$630.000 × 5 %" y={470} tam={74} fondo="#00897b" />
      <Contador f={f} desde={0} hasta={31500} a={tt} b={tt + 24} y={600} tam={140} />
      <Rotulo f={f} inicio={en("año")} texto="AL AÑO, SIN TOCARLO" y={780} tam={64} fondo="#ff7043" giro={3} />
    </AbsoluteFill>
  );
};

// 11 · Polo Norte: guardas el secreto mientras Tobías intenta enterarse
const secreto = ({ en }: Escenario): Dibujo => ({ f }) => {
  const tc = en("cuentes");
  const asoma = tramo(f, tc - 4, tc + 16);
  return (
    <AbsoluteFill>
      <Mundo escenario="poloNorte" f={f} camara={[0.4, 2.2, 6.5]} mira={[0.2, 1.6, 0]}>
        <Tu
          f={f}
          pos={[0.4, 0, 0.4]}
          giro={-0.15}
          accion="reposo"
          pose={{ adelanteDer: 2.5, brazoDer: 0.35, codoDer: 2.0, boca: "seria", cabeza: f > tc ? Math.sin(f / 5) * 0.3 : 0, mirada: f > tc ? -0.8 : 0 }}
        />
        <Tobias f={f} pos={[lerp(-4, -1.3, asoma), 0, -0.3]} giro={1.2} escala={0.8} accion={asoma > 0 && asoma < 1 ? "andar" : "reposo"} />
      </Mundo>
      <Rotulo f={f} inicio={en("importante:")} texto="LO MÁS IMPORTANTE" y={470} tam={64} fondo="#ffd400" color="#1b1b1b" />
      <Rotulo f={f} inicio={tc} texto="🤫 ¡NO LO CUENTES!" y={1300} tam={76} fondo="#1b1b1b" />
    </AbsoluteFill>
  );
};

// 12 · Estadio: todos celebran contigo bajo una lluvia de billetes
const final = ({ en }: Escenario): Dibujo => ({ f }) => {
  const ang = Math.sin(f / 70) * 0.3;
  return (
    <AbsoluteFill>
      <Mundo escenario="estadio" f={f} camara={[Math.sin(ang) * 11, 3, Math.cos(ang) * 11]} mira={[0, 1.4, 0]}>
        <Tu f={f} pos={[0, 0, 0.8]} accion="saludar" />
        <Lulu f={f} pos={[-2.9, 0, -0.6]} giro={0.3} escala={0.8} accion="celebrar" malabares={false} semilla={1} />
        <Zorp f={f} pos={[-1.6, 0, -0.4]} giro={0.2} escala={0.8} accion="saludar" />
        <CapitanaBrisa f={f} pos={[-0.6, 0, -1.4]} escala={0.8} accion="celebrar" semilla={3} />
        <Dani f={f} pos={[1.4, 0, -0.4]} giro={-0.1} escala={0.8} accion="celebrar" balon={false} semilla={4} />
        <SheriffRosa f={f} pos={[2.4, 0, -1.2]} giro={-0.2} escala={0.8} accion="saludar" />
        <HadaMerengue f={f} pos={[3.2, 0, 0.1]} giro={-0.3} escala={0.8} accion="saludar" />
        <Ramses f={f} pos={[-3.6, 0, 1]} giro={0.4} escala={0.8} accion="saludar" />
        <Tobias f={f} pos={[3.9, 0, 1.2]} giro={-0.4} escala={0.7} accion="celebrar" />
        <LluviaBilletes f={f} inicio={0} n={40} area={[10, 6]} />
      </Mundo>
      <Rotulo f={f} inicio={2} texto={"¿Y TÚ QUÉ\nHARÍAS PRIMERO?"} y={330} tam={96} />
      <Rotulo f={f} inicio={en("Escríbelo")} texto="💬 COMENTA ABAJO 👇" y={1290} tam={80} fondo={ORO} color="#1b1b1b" giro={2} />
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, (e: Escenario) => Dibujo> = {
  gancho,
  grito,
  telefono,
  impuestos,
  gastos,
  loteria,
  deudas,
  emergencias,
  invertir,
  interes,
  secreto,
  final,
};

export const Escenas3D = Object.fromEntries(
  (Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](ESCENARIOS[k])]),
) as Record<Ilustracion, Dibujo>;
