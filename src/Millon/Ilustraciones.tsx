import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { Mundo } from "../comun/Escenarios3D";
import {
  Auto,
  Avion,
  azar,
  Barra,
  Billete,
  Casa,
  Cerdito,
  clamp01,
  Fajo,
  Flecha,
  lerp,
  lerp3,
  LluviaBilletes,
  Maletin,
  Moneda,
  pop,
  Tarjeta,
  tramo,
  Tumbona,
  V3,
} from "../comun/Mundo3D";
import { CapitanaBrisa, Dani, HadaMerengue, Lulu, Ramses, SheriffRosa, Tobias, Zorp } from "../comun/Personajes3D";
import { Dibujo } from "../comun/tipos";
import { ESCENARIOS, Escenario, Ilustracion } from "./escenas";

const ORO = "#ffc928";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const muelle = (f: number, inicio: number) => spring({ frame: f - inicio, fps: 30, config: { damping: 11, stiffness: 160 } });

// ---------- textos sobre el 3D ----------

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
  const s = muelle(f, inicio);
  if (f < inicio) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `scale(${s}) rotate(${giro}deg)`,
          fontFamily: "'Inter', system-ui, sans-serif",
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
  const s = muelle(f, inicio);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s})`,
        background: "#fff",
        borderRadius: 30,
        padding: "16px 28px",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 800,
        fontSize: 46,
        color: "#1b1b1b",
        boxShadow: "0 10px 0 rgba(0,0,0,0.25)",
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};

const dinero = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

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
  const late = 1 + 0.06 * Math.sin(f / 3) * (f < b ? 1 : 0);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center" }}>
      <span
        style={{
          display: "inline-block",
          transform: `scale(${late * muelle(f, a - 4)})`,
          fontFamily: "'Inter', system-ui, sans-serif",
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

const Vineta = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />;

// ---------- escenas (cada una en un escenario del Mundo 3D) ----------

// 1 · Feria nocturna: a Lulú le cae un maletín con un millón
const gancho = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cae = en("recibieras");
  const abre = en("millón");
  const yMaletin = lerp(9, 0, clamp01((f - cae) / 12) ** 2);
  return (
    <AbsoluteFill>
      <Mundo escenario="feria" f={f} camara={lerp3([0, 2.8, 10.5], [0.3, 2.3, 7.8], tramo(f, 0, dur))} mira={[0.2, 1.5, 0]}>
        <Lulu f={f} pos={[0.8, 0, 0]} giro={-0.25} accion={f > abre ? "celebrar" : "reposo"} malabares={f < abre} />
        <Maletin pos={[-0.9, yMaletin, 1]} rot={[0, 0.5, 0]} abre={tramo(f, abre, abre + 10)} escala={0.9} />
        <LluviaBilletes f={f} inicio={abre} n={45} area={[8, 5]} />
      </Mundo>
      <Contador f={f} desde={0} hasta={1000000} a={abre} b={en("dólares?") + 14} y={1180} />
      <Vineta />
    </AbsoluteFill>
  );
};

// 2 · Antiguo Egipto: Ramsés, el faraón, cobra un tercio
const impuestos = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const t0 = en("impuestos");
  const pila: V3[] = Array.from({ length: 9 }, (_, i) => [0.5 + (i % 3) * 1.05, Math.floor(i / 3) * 0.32, 1.2]);
  const destino: V3 = [-3.5, 3, -5.5];
  return (
    <AbsoluteFill>
      <Mundo escenario="egipto" f={f} camara={lerp3([0.6, 3.2, 13], [1, 3, 12], tramo(f, 0, dur))} mira={[0.6, 1.5, -1]}>
        <Ramses f={f} pos={[-0.6, 0, 0.8]} giro={0.5} accion={f > t0 ? "senalar" : "hablar"} pose={f > t0 ? { cabeza: -0.6 } : undefined} />
        {pila.map((p, i) => {
          const vuela = i >= 6; // la fila de arriba (un tercio) se la lleva el faraón
          const k = vuela ? tramo(f, t0 + (i - 6) * 6, t0 + (i - 6) * 6 + 24) : 0;
          const pos = lerp3(p, destino, k);
          pos[1] += Math.sin(k * Math.PI) * 3;
          return k < 1 ? <Fajo key={i} pos={pos} rot={[0, k * 6, k * 2]} escala={1 - k * 0.5} /> : null;
        })}
      </Mundo>
      <Rotulo f={f} inicio={t0} texto="IMPUESTOS" y={650} tam={100} fondo="#c62828" />
      <Rotulo f={f} inicio={en("tercio.")} texto="−⅓" y={810} tam={190} color="#ff5252" giro={4} />
      <Vineta />
    </AbsoluteFill>
  );
};

// 3 · Lejano Oeste: Sheriff Rosa señala casa, auto y viajes
const gastos = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tc = en("casa");
  const ta = en("auto");
  const tv = en("viajes.");
  const autoX = interpolate(f, [ta - 12, ta + 8, dur], [-12, 0.6, 2.4], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const avion = tramo(f, tv - 6, dur);
  return (
    <AbsoluteFill>
      <Mundo escenario="oeste" f={f} camara={lerp3([-0.2, 3.6, 15], [0.8, 3.4, 14], tramo(f, 0, dur))} mira={[0.6, 2, 0]}>
        <SheriffRosa f={f} pos={[-1.2, 0, 2.2]} giro={0.5} accion={f > tc ? "senalar" : "hablar"} pose={{ cabeza: f > ta ? 0.3 : -0.2 }} />
        <group scale={pop(f, tc - 4)}>
          <Casa pos={[2.2, 0, -3]} escala={1} techo="#1e88e5" pared="#fff6e6" />
        </group>
        <Auto pos={[autoX, 0, 3]} color="#e53935" ruedas={autoX * 2} escala={0.85} />
        <Avion pos={[lerp(-2, 6, avion), lerp(4, 7, avion), -3]} rot={[0, -0.3, lerp(0.05, 0.3, avion)]} escala={pop(f, tv - 6) * 0.9} />
      </Mundo>
      <Rotulo f={f} inicio={tc} texto="CASA" y={650} tam={90} fondo="#1e88e5" />
      <Rotulo f={f} inicio={ta} texto="AUTO" y={790} tam={90} fondo="#e53935" giro={3} />
      <Rotulo f={f} inicio={tv} texto="VIAJES" y={930} tam={90} fondo="#f0a030" />
      <Vineta />
    </AbsoluteFill>
  );
};

// 4 · Polo Norte: Tobías se queda sin nada
const ruina = ({ en }: Escenario): Dibujo => ({ f }) => {
  const tg = en("ganadores");
  const baja = tramo(f, tg, en("años."));
  const filas = Math.max(0, Math.round(8 * (1 - baja)));
  const tiembla = f > en("ruina") ? Math.sin(f * 2.3) * 0.05 : 0;
  return (
    <AbsoluteFill>
      <Mundo escenario="poloNorte" f={f} camara={[0.5 + tiembla, 3, 12]} mira={[0.5, 1.5, 0]}>
        <Tobias f={f} pos={[-0.2, 0, 0.6]} giro={0.3} accion="reposo" />
        {Array.from({ length: filas }, (_, i) => (
          <Fajo key={i} pos={[1.4, i * 0.3, 0.6]} rot={[0, i * 0.15, 0]} />
        ))}
        <Flecha pos={[2.4, lerp(7, 3.4, tramo(f, en("ruina") - 8, en("ruina") + 4)), -0.5]} rot={[0, 0, Math.PI]} escala={pop(f, en("cuidado:")) * 0.8} />
      </Mundo>
      <Rotulo f={f} inicio={en("cuidado:")} texto="¡CUIDADO!" y={650} tam={88} fondo="#f0a030" color="#1b1b1b" />
      <Rotulo f={f} inicio={en("ruina")} texto="EN LA RUINA" y={810} tam={110} color="#ff5252" giro={-6} />
      <Vineta />
    </AbsoluteFill>
  );
};

// 5 · Marte: a Zorp se le escapan los billetes
const rapido = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const t0 = en("gastar");
  return (
    <AbsoluteFill>
      <Mundo escenario="marte" f={f} camara={lerp3([-0.5, 3, 12], [0.8, 3, 11], tramo(f, 0, dur))} mira={[1, 1.8, 0]}>
        <Zorp f={f} pos={[0.2, 0, 0.6]} giro={Math.PI / 2 - 0.5} accion="andar" pose={{ brazoDer: 1.3, adelanteDer: 1.2, boca: "sorpresa" }} />
        {Array.from({ length: 30 }, (_, i) => {
          const sale = t0 + i * 2.5;
          if (f < sale) return null;
          const t = (f - sale) / 30;
          return <Billete key={i} pos={[0.8 + t * 8, 1.8 + t * 3.5 + Math.sin(t * 6 + i) * 0.5, 0.5 + (azar(i) - 0.5) * 3]} rot={[t * 5 + i, t * 7, t * 3]} escala={0.7} />;
        })}
      </Mundo>
      <Contador f={f} desde={1000000} hasta={0} a={t0} b={en("crees.") + 10} y={650} color="#ff5252" />
      <Rotulo f={f} inicio={en("rápido")} texto="¡SE VA VOLANDO!" y={850} tam={72} fondo="#1b1b1b" />
      <Vineta />
    </AbsoluteFill>
  );
};

// 6 · Feria nocturna: Lulú hace malabares con las tarjetas… y las rompe
const deudas = ({ en }: Escenario): Dibujo => ({ f }) => {
  const tp = en("paga");
  const colores = ["#7e57c2", "#1e88e5", "#ef6c00"];
  const fin = en("deudas.");
  return (
    <AbsoluteFill>
      <Mundo escenario="feria" f={f} camara={[0.6, 2.6, 8.5]} mira={[0.4, 1.8, 0]}>
        <Lulu f={f} pos={[0.8, 0, 0]} giro={-0.2} accion={f > fin ? "celebrar" : "reposo"} malabares={false} pose={f > fin ? undefined : { adelanteDer: 1.2, adelanteIzq: 1.2, codoDer: 1, codoIzq: 1 }} />
        {colores.map((c, i) => {
          const t = f / 8 + (i / 3) * Math.PI * 2;
          const parte = tramo(f, tp + i * 5, tp + i * 5 + 12);
          const cae = Math.min(2.2, Math.max(0, f - (tp + i * 5 + 10)) ** 2 * 0.004);
          return (
            <Tarjeta
              key={i}
              color={c}
              pos={[0.8 + Math.cos(t) * 0.7, 3.1 + Math.abs(Math.sin(t)) * 0.8 - cae, 0.8]}
              rot={[0.1, Math.sin(f / 10 + i) * 0.6, Math.sin(t) * 0.3]}
              parte={parte}
              escala={0.55}
            />
          );
        })}
      </Mundo>
      <Rotulo f={f} inicio={en("inteligente:")} texto="LO INTELIGENTE" y={650} tam={76} fondo="#ffffff" color="#3b2a7a" />
      <Rotulo f={f} inicio={fin} texto="DEUDAS: $0 ✓" y={1240} tam={92} fondo="#2e7d32" giro={2} />
      <Vineta />
    </AbsoluteFill>
  );
};

// 7 · País de las golosinas: el Hada Merengue llena el cerdito con su varita
const fondo = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tg = en("guarda");
  return (
    <AbsoluteFill>
      <Mundo escenario="golosinas" f={f} camara={lerp3([1.5, 3, 10.5], [-0.3, 2.8, 10], tramo(f, 0, dur))} mira={[0.2, 1.5, 0]}>
        <HadaMerengue f={f} pos={[1, 0, 0.3]} giro={-0.6} accion="saludar" />
        <Cerdito pos={[-0.9, 0, 0.6]} giro={0.5 + Math.sin(f / 20) * 0.15} escala={pop(f, 0) * 0.75} />
        {Array.from({ length: 10 }, (_, i) => {
          const sale = tg + i * 4;
          const t = (f - sale) / 14;
          if (t < 0 || t > 1) return null;
          return <Moneda key={i} pos={[lerp(0.6, -0.9, t), lerp(3.2, 1.55, t) + Math.sin(t * Math.PI) * 0.8, lerp(0.6, 0.6, t)]} rot={[0, Math.PI / 2, f / 3]} escala={0.7} />;
        })}
      </Mundo>
      <Rotulo f={f} inicio={en("fondo")} texto={"FONDO DE\nEMERGENCIA"} y={650} tam={86} fondo="#d81b60" />
      <Vineta />
    </AbsoluteFill>
  );
};

// 8 · Estadio: las barras crecen en el campo y Dani celebra el ×2
const invertir = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const ti = en("invierte");
  const td = en("duplica");
  const ang = lerp(-0.35, 0.35, tramo(f, 0, dur));
  const n = 8;
  const alto = (i: number) => 1.1 * Math.pow(1.1, i) * 1.15;
  return (
    <AbsoluteFill>
      <Mundo escenario="estadio" f={f} camara={[Math.sin(ang) * 12 + 0.5, 4.2, Math.cos(ang) * 12]} mira={[0.5, 2, 0]}>
        {Array.from({ length: n }, (_, i) => {
          const sale = interpolate(i, [0, n - 1], [ti, td + 6]);
          return <Barra key={i} pos={[-2.4 + i * 0.75, 0, -0.5]} alto={alto(i) * tramo(f, sale, sale + 10)} color={i === n - 1 ? ORO : "#4dd0a1"} />;
        })}
        {f > td && <Moneda pos={[-2.4 + (n - 1) * 0.75, alto(n - 1) + 0.6 + Math.sin(f / 6) * 0.1, -0.5]} rot={[0, f / 6, 0]} escala={1.2 * pop(f, td)} />}
        <Dani f={f} pos={[2.1, 0, 1.8]} giro={-0.6} accion={f > td ? "celebrar" : "senalar"} balon={f < td} />
      </Mundo>
      <Rotulo f={f} inicio={en("siete")} texto="+7% ANUAL" y={650} tam={84} fondo="#00897b" />
      <Rotulo f={f} inicio={td} texto="×2" y={790} tam={220} color={ORO} giro={-5} />
      <Rotulo f={f} inicio={en("diez")} texto="≈ 10 AÑOS" y={1070} tam={72} fondo="#ffffff" color="#0d3b2e" />
      <Vineta />
    </AbsoluteFill>
  );
};

// 9 · Isla pirata: la Capitana Brisa descansa mientras brotan monedas
const trabaja = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tt = en("trabaja");
  return (
    <AbsoluteFill>
      <Mundo escenario="islaPirata" f={f} camara={lerp3([2.5, 3, 10], [1, 2.6, 8.6], tramo(f, 0, dur))} mira={[0, 1, 0]}>
        <group position={[0, 0.2, 0]}>
          <Tumbona pos={[0, 0, 0.6]} giro={1.1} escala={1.15} />
          <group position={[0, 0.62, 0.6]} rotation={[0, 1.1, 0]}>
            <group rotation={[-1.15, 0, 0]} position={[0, 0, 0.55]}>
              <CapitanaBrisa f={f} pos={[0, -0.95, 0]} accion="reposo" pose={{ brazoIzq: 2.8, brazoDer: 2.8, codoIzq: 1.6, codoDer: 1.6, boca: "sonrisa" }} />
            </group>
          </group>
          {Array.from({ length: 12 }, (_, i) => {
            const sale = tt + i * 5;
            const t = (f - sale) / 22;
            if (t < 0 || t > 1.6) return null;
            const x = (azar(i) - 0.5) * 6;
            const z = (azar(i + 3) - 0.5) * 3 + 0.8;
            return <Moneda key={i} pos={[x, Math.min(t, 1) * 2.4 + 0.3, z]} rot={[0, f / 4 + i, 0]} escala={0.8 * Math.min(1, t * 3)} />;
          })}
        </group>
      </Mundo>
      <Rotulo f={f} inicio={tt} texto="TRABAJA POR TI" y={650} tam={80} fondo="#00897b" />
      <Rotulo f={f} inicio={en("descansas.")} texto="TÚ DESCANSAS" y={800} tam={84} fondo="#ff7043" giro={3} />
      <Vineta />
    </AbsoluteFill>
  );
};

// 10 · Lejano Oeste: todos se acercan a Sheriff Rosa a pedirle dinero
const secreto = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tc = en("cuentes");
  const llega = tramo(f, tc - 6, dur);
  const anda = llega < 1 && f > tc - 6;
  const x = (desde: number) => lerp(desde, desde * 0.32, llega);
  const accion = anda ? "andar" : "hablar";
  return (
    <AbsoluteFill>
      <Mundo escenario="oeste" f={f} camara={[-0.6, 3.8, 14.5]} mira={[0.2, 1.6, 0]}>
        <SheriffRosa f={f} pos={[0.4, 0, 0.8]} accion="reposo" pose={{ adelanteDer: 2.6, brazoDer: 0.3, codoDer: 1.9, boca: "seria", cabeza: Math.sin(f / 6) * (f > tc ? 0.35 : 0) }} />
        <Zorp f={f} pos={[x(-5), 0, 0]} giro={1.1} escala={0.85} accion={accion} />
        <Ramses f={f} pos={[x(-6.5), 0, 2]} giro={1.2} escala={0.85} accion={accion} />
        <Tobias f={f} pos={[x(-4.2), 0, -1.6]} giro={0.9} escala={0.75} accion={anda ? "andar" : "saludar"} />
        <Dani f={f} pos={[x(5.5), 0, 0]} giro={-1.1} escala={0.85} accion={accion} balon={false} />
        <Lulu f={f} pos={[x(6.8), 0, 2]} giro={-1.2} escala={0.85} accion={accion} malabares={false} />
        <HadaMerengue f={f} pos={[x(4.6), 0, -1.6]} giro={-0.9} escala={0.85} accion={accion} />
      </Mundo>
      <Rotulo f={f} inicio={en("importante:")} texto="¡SECRETO!" y={650} tam={96} fondo="#1b1b1b" />
      <Burbuja f={f} inicio={tc + 4} texto="¿Me prestas?" x={300} y={960} />
      <Burbuja f={f} inicio={tc + 12} texto="¡Amiga!" x={800} y={1060} />
      <Burbuja f={f} inicio={tc + 20} texto="Un negocio…" x={720} y={880} />
      <Vineta />
    </AbsoluteFill>
  );
};

// 11 · Estadio: todos los personajes celebran bajo una lluvia de billetes
const final = ({ en }: Escenario): Dibujo => ({ f }) => {
  const ang = Math.sin(f / 70) * 0.3;
  return (
    <AbsoluteFill>
      <Mundo escenario="estadio" f={f} camara={[Math.sin(ang) * 11, 3, Math.cos(ang) * 11]} mira={[0, 1.4, 0]}>
        <Lulu f={f} pos={[-2.9, 0, -0.6]} giro={0.3} escala={0.8} accion="celebrar" malabares={false} semilla={1} />
        <Zorp f={f} pos={[-1.6, 0, 0.2]} giro={0.2} escala={0.8} accion="saludar" />
        <CapitanaBrisa f={f} pos={[-0.4, 0, -0.6]} escala={0.8} accion="celebrar" semilla={3} />
        <Dani f={f} pos={[0.8, 0, 0.2]} giro={-0.1} escala={0.8} accion="celebrar" balon={false} semilla={4} />
        <SheriffRosa f={f} pos={[2, 0, -0.6]} giro={-0.2} escala={0.8} accion="saludar" />
        <HadaMerengue f={f} pos={[3.1, 0, 0.3]} giro={-0.3} escala={0.8} accion="saludar" />
        <Ramses f={f} pos={[-3.6, 0, 1]} giro={0.4} escala={0.8} accion="saludar" />
        <Tobias f={f} pos={[3.9, 0, 1.2]} giro={-0.4} escala={0.7} accion="celebrar" />
        <LluviaBilletes f={f} inicio={0} n={40} area={[10, 6]} />
      </Mundo>
      <Rotulo f={f} inicio={2} texto={"¿Y TÚ QUÉ\nHARÍAS PRIMERO?"} y={650} tam={92} />
      <Rotulo f={f} inicio={en("Escríbelo")} texto="COMENTA ABAJO" y={1260} tam={92} fondo={ORO} color="#1b1b1b" giro={2} />
      <Vineta />
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, (e: Escenario) => Dibujo> = {
  gancho,
  impuestos,
  gastos,
  ruina,
  rapido,
  deudas,
  fondo,
  invertir,
  trabaja,
  secreto,
  final,
};

export const Ilustraciones = Object.fromEntries(
  (Object.keys(FABRICAS) as Ilustracion[]).map((k) => [k, FABRICAS[k](ESCENARIOS[k])]),
) as Record<Ilustracion, Dibujo>;
