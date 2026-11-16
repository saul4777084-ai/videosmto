import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import {
  Arbol,
  Auto,
  Avion,
  azar,
  Barra,
  Billete,
  Calle,
  Casa,
  Cerdito,
  clamp01,
  Edificio,
  Escenario3D,
  Fajo,
  Flecha,
  Gobierno,
  lerp,
  lerp3,
  LluviaBilletes,
  Maletin,
  Mar,
  Moneda,
  Montanas,
  Nube,
  Palmera,
  Persona,
  pop,
  Sol,
  Sombrilla,
  Suelo,
  Tarjeta,
  tramo,
  Tumbona,
  V3,
} from "../comun/Mundo3D";
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

// barrio de fondo reutilizable
const Barrio: React.FC<{ z?: number }> = ({ z = -8 }) => (
  <group>
    <Suelo sinHierbaZ={[-0.6, 5]} />
    <Calle z={2.2} />
    {[-9, -5.5, 5.5, 9].map((x, i) => (
      <Casa key={x} pos={[x, 0, z]} escala={0.9} techo={["#d9534f", "#3f7fbf", "#f0a030", "#6a4fb3"][i]} />
    ))}
    <Edificio pos={[-1.5, 0, z - 6]} alto={9} />
    <Edificio pos={[2.5, 0, z - 7]} alto={12} color="#9fb0bb" />
    <Edificio pos={[-6, 0, z - 12]} alto={14} color="#c9b8a0" />
    <Edificio pos={[7, 0, z - 13]} alto={10} color="#a7a39b" />
    <Montanas />
    {[-7, -3.4, 3.4, 7].map((x) => (
      <Arbol key={x} pos={[x, 0, z + 3]} escala={1.1} />
    ))}
    <Nube pos={[-4, 11, -18]} escala={1.6} />
    <Nube pos={[5, 13, -22]} escala={2} />
  </group>
);

// ---------- escenas ----------

const gancho = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cae = en("recibieras");
  const abre = en("millón");
  const yMaletin = lerp(9, 0, clamp01((f - cae) / 12) ** 2);
  const salto = f > abre ? Math.abs(Math.sin((f - abre) / 5)) * 0.6 : 0;
  const cam = lerp3([0, 3.6, 17], [0, 3, 13], tramo(f, 0, dur));
  return (
    <AbsoluteFill>
      <Escenario3D camara={cam} mira={[0, 1.6, 0]}>
        <Barrio />
        <Persona
          pos={[0.9, 0, 0]}
          giro={-0.25}
          pose={f > abre ? { brazoIzq: 2.6, brazoDer: 2.6, salto, boca: "sorpresa" } : { brazoIzq: 0.2, brazoDer: 0.2, cabeza: Math.sin(f / 8) * 0.3 }}
        />
        <Maletin pos={[-0.9, yMaletin, 1]} rot={[0, 0.5, 0]} abre={tramo(f, abre, abre + 10)} />
        <LluviaBilletes f={f} inicio={abre} n={45} area={[8, 5]} />
      </Escenario3D>
      <Contador f={f} desde={0} hasta={1000000} a={abre} b={en("dólares?") + 14} y={1180} />
      <Vineta />
    </AbsoluteFill>
  );
};

const impuestos = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const t0 = en("impuestos");
  const pila: V3[] = Array.from({ length: 9 }, (_, i) => [-0.2 + (i % 3) * 1.05, Math.floor(i / 3) * 0.32, 0.6]);
  const destino: V3 = [3.2, 2.5, -4];
  return (
    <AbsoluteFill>
      <Escenario3D camara={lerp3([-1, 4.5, 14], [0.6, 4, 12.5], tramo(f, 0, dur))} mira={[0.9, 1.4, -1]}>
        <Suelo />
        <Montanas />
        <Arbol pos={[-4, 0, -6]} escala={1.3} />
        <Arbol pos={[6.5, 0, -7]} escala={1.5} />
        <Gobierno pos={[3.2, 0, -4.5]} giro={-0.35} escala={0.9} />
        <Persona pos={[-1.5, 0, 2]} giro={0.4} escala={0.9} camisa="#ff6b3d" pose={{ boca: f > en("tercio.") ? "triste" : "seria", brazoDer: 0.3 }} />
        {pila.map((p, i) => {
          const vuela = i >= 6; // la fila de arriba (un tercio) se la lleva Hacienda
          const k = vuela ? tramo(f, t0 + (i - 6) * 6, t0 + (i - 6) * 6 + 22) : 0;
          const pos = lerp3(p, destino, k);
          pos[1] += Math.sin(k * Math.PI) * 3;
          return k < 1 ? <Fajo key={i} pos={pos} rot={[0, k * 6, k * 2]} escala={1 - k * 0.5} /> : null;
        })}
      </Escenario3D>
      <Rotulo f={f} inicio={t0} texto="IMPUESTOS" y={650} tam={100} fondo="#c62828" />
      <Rotulo f={f} inicio={en("tercio.")} texto="−⅓" y={810} tam={190} color="#ff5252" giro={4} />
      <Vineta />
    </AbsoluteFill>
  );
};

const gastos = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tc = en("casa");
  const ta = en("auto");
  const tv = en("viajes.");
  const camX = interpolate(f, [0, tc, ta, tv, dur], [-4.4, -4, 0, 3.6, 3.8], clamp);
  const autoX = interpolate(f, [ta - 12, ta + 8, dur], [-10, 0, 3.2], { ...clamp, easing: (t) => 1 - (1 - t) ** 3 });
  const avion = tramo(f, tv - 6, dur);
  return (
    <AbsoluteFill>
      <Escenario3D camara={[camX, 4.5, 17]} mira={[camX, 2, 0]}>
        <Suelo sinHierbaZ={[-0.4, 5.2]} />
        <Montanas />
        <Calle z={2.4} />
        <group scale={pop(f, tc - 4)}>
          <Casa pos={[-4, 0, -1]} escala={1.15} techo="#1e88e5" />
        </group>
        <Auto pos={[autoX, 0, 2.4]} color="#e53935" ruedas={autoX * 2} />
        <Avion pos={[lerp(1, 6, avion), lerp(2.5, 5.5, avion), -2]} rot={[0, -0.3, lerp(0.05, 0.3, avion)]} escala={pop(f, tv - 6)} />
        {[-9, -3, 3, 9].map((x) => (
          <Arbol key={x} pos={[x, 0, -4]} />
        ))}
        <Nube pos={[6, 8, -10]} escala={1.4} />
        <Nube pos={[-5, 9, -12]} escala={1.6} />
      </Escenario3D>
      <Rotulo f={f} inicio={tc} texto="CASA" y={670} tam={90} fondo="#1e88e5" />
      <Rotulo f={f} inicio={ta} texto="AUTO" y={810} tam={90} fondo="#e53935" giro={3} />
      <Rotulo f={f} inicio={tv} texto="VIAJES" y={950} tam={90} fondo="#f0a030" />
      <Vineta />
    </AbsoluteFill>
  );
};

const ruina = ({ en }: Escenario): Dibujo => ({ f }) => {
  const tg = en("ganadores");
  const baja = tramo(f, tg, en("años."));
  const filas = Math.max(0, Math.round(8 * (1 - baja)));
  const tiembla = f > en("ruina") ? Math.sin(f * 2.3) * 0.06 : 0;
  return (
    <AbsoluteFill>
      <Escenario3D camara={[0.5 + tiembla, 3.4, 12.5]} mira={[0.3, 2, 0]} cielo={["#56606e", "#a9b3bf"]} niebla="#a9b3bf">
        <Suelo tipo="cesped" color="#55703f" />
        <Montanas color="#59636b" />
        <Persona pos={[-1, 0, 0.5]} giro={0.3} pose={{ boca: f > tg ? "triste" : "sorpresa", inclinar: baja * 0.25, brazoIzq: 0.05, brazoDer: 0.05 }} />
        {Array.from({ length: filas }, (_, i) => (
          <Fajo key={i} pos={[1.4, i * 0.3, 0.3]} rot={[0, i * 0.15, 0]} />
        ))}
        <Flecha pos={[1.8, lerp(7, 3.6, tramo(f, en("ruina") - 8, en("ruina") + 4)), -1]} rot={[0, 0, Math.PI]} escala={pop(f, en("cuidado:"))} />
        <Nube pos={[-3, 7, -6]} escala={1.5} />
      </Escenario3D>
      <Rotulo f={f} inicio={en("cuidado:")} texto="¡CUIDADO!" y={650} tam={88} fondo="#f0a030" color="#1b1b1b" />
      <Rotulo f={f} inicio={en("ruina")} texto="EN LA RUINA" y={810} tam={110} color="#ff5252" giro={-6} />
      <Vineta />
    </AbsoluteFill>
  );
};

const rapido = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const t0 = en("gastar");
  return (
    <AbsoluteFill>
      <Escenario3D camara={lerp3([-1, 3.4, 13], [1, 3.4, 12], tramo(f, 0, dur))} mira={[1.6, 2, 0]}>
        <Barrio z={-9} />
        <Persona pos={[0, 0, 0.5]} giro={Math.PI / 2 - 0.4} pose={{ caminar: f / 2.5, brazoDer: 1.3, adelanteDer: 1.2, boca: "sorpresa" }} />
        {Array.from({ length: 30 }, (_, i) => {
          const sale = t0 + i * 2.5;
          if (f < sale) return null;
          const t = (f - sale) / 30;
          return <Billete key={i} pos={[0.8 + t * 9, 1.6 + t * 3 + Math.sin(t * 6 + i) * 0.5, 0.5 + (azar(i) - 0.5) * 3]} rot={[t * 5 + i, t * 7, t * 3]} escala={0.7} />;
        })}
      </Escenario3D>
      <Contador f={f} desde={1000000} hasta={0} a={t0} b={en("crees.") + 10} y={600} color="#ff5252" />
      <Rotulo f={f} inicio={en("rápido")} texto="¡SE VA VOLANDO!" y={890} tam={72} fondo="#1b1b1b" />
      <Vineta />
    </AbsoluteFill>
  );
};

const deudas = ({ en }: Escenario): Dibujo => ({ f }) => {
  const tp = en("paga");
  const colores = ["#7e57c2", "#1e88e5", "#ef6c00"];
  return (
    <AbsoluteFill>
      <Escenario3D camara={[0, 3, 9.5]} mira={[0, 2, 0]} cielo={["#3b2a7a", "#8f7be0"]}>
        <Suelo color="#5a4aa6" />
        {colores.map((c, i) => {
          const parte = tramo(f, tp + i * 5, tp + i * 5 + 12);
          const cae = Math.min(0.6, Math.max(0, f - (tp + i * 5 + 10)) ** 2 * 0.004);
          return (
            <Tarjeta
              key={i}
              color={c}
              pos={[-1.4 + i * 1.4, 2.4 + Math.sin(f / 9 + i) * 0.15 - cae, 0]}
              rot={[0.1, Math.sin(f / 14 + i) * 0.5, 0]}
              parte={parte}
              escala={pop(f, 2 + i * 4) * 1.1}
            />
          );
        })}
        <Persona pos={[1.5, 0, -2]} escala={0.9} pose={{ brazoIzq: f > en("deudas.") ? 2.6 : 0.2, brazoDer: f > en("deudas.") ? 2.6 : 0.2 }} />
      </Escenario3D>
      <Rotulo f={f} inicio={en("inteligente:")} texto="LO INTELIGENTE" y={650} tam={76} fondo="#ffffff" color="#3b2a7a" />
      <Rotulo f={f} inicio={en("deudas.")} texto="DEUDAS: $0 ✓" y={1240} tam={92} fondo="#2e7d32" giro={2} />
      <Vineta />
    </AbsoluteFill>
  );
};

const fondo = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tg = en("guarda");
  return (
    <AbsoluteFill>
      <Escenario3D camara={lerp3([4, 4.5, 11], [-1.5, 4, 10.5], tramo(f, 0, dur))} mira={[0, 1.4, 0]} cielo={["#ff9aa2", "#ffe0e6"]}>
        <Suelo color="#ffc2cf" />
        <Cerdito pos={[0, 0, 0]} giro={-0.6 + Math.sin(f / 20) * 0.2} escala={pop(f, 0) * 1.1} />
        {Array.from({ length: 10 }, (_, i) => {
          const sale = tg + i * 4;
          const t = (f - sale) / 14;
          if (t < 0 || t > 1) return null;
          return <Moneda key={i} pos={[0, lerp(6, 2.1, t * t), 0]} rot={[0, Math.PI / 2, f / 3]} escala={0.9} />;
        })}
        <Persona pos={[2.4, 0, -1]} giro={-0.5} escala={0.8} pose={{ brazoDer: 1.4, adelanteDer: 0.8 }} />
      </Escenario3D>
      <Rotulo f={f} inicio={en("fondo")} texto={"FONDO DE\nEMERGENCIA"} y={650} tam={86} fondo="#d81b60" />
      <Vineta />
    </AbsoluteFill>
  );
};

const invertir = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const ti = en("invierte");
  const td = en("duplica");
  const ang = lerp(-0.5, 0.5, tramo(f, 0, dur));
  const radio = 16;
  const n = 10;
  return (
    <AbsoluteFill>
      <Escenario3D camara={[Math.sin(ang) * radio, 6.5, Math.cos(ang) * radio]} mira={[0, 2.6, 0]} cielo={["#0d3b2e", "#2f8f6b"]}>
        <Suelo color="#1f5e48" />
        {Array.from({ length: n }, (_, i) => {
          const sale = interpolate(i, [0, n - 1], [ti, td + 6]);
          const alto = 1.4 * Math.pow(1.07, i * 1.03) * 1.35 * tramo(f, sale, sale + 10);
          return <Barra key={i} pos={[-3.6 + i * 0.8, 0, 0]} alto={alto * (i === n - 1 ? 1 : 1)} color={i === n - 1 ? ORO : "#4dd0a1"} />;
        })}
        {f > td && <Moneda pos={[3.6, 1.4 * Math.pow(1.07, 9 * 1.03) * 1.35 + 0.6 + Math.sin(f / 6) * 0.1, 0]} rot={[0, f / 6, 0]} escala={1.3 * pop(f, td)} />}
        <Persona pos={[-4.6, 0, 1.5]} giro={0.5} escala={0.8} pose={{ brazoDer: 1.6, adelanteDer: 0.6 }} />
      </Escenario3D>
      <Rotulo f={f} inicio={en("siete")} texto="+7% ANUAL" y={650} tam={84} fondo="#00897b" />
      <Rotulo f={f} inicio={td} texto="×2" y={790} tam={220} color={ORO} giro={-5} />
      <Rotulo f={f} inicio={en("diez")} texto="≈ 10 AÑOS" y={1070} tam={72} fondo="#ffffff" color="#0d3b2e" />
      <Vineta />
    </AbsoluteFill>
  );
};

const trabaja = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tt = en("trabaja");
  return (
    <AbsoluteFill>
      <Escenario3D camara={lerp3([2, 3.4, 11.5], [0.5, 3, 10], tramo(f, 0, dur))} mira={[0, 1.2, 0]} cielo={["#ff9e57", "#ffe6a8"]} luzSol={[-6, 9, 5]}>
        <Suelo tipo="arena" color="#ead2a0" />
        <Montanas z={-110} color="#4f7d63" alto={28} />
        <Mar f={f} z={-15} />
        <Sol pos={[-5, 9, -25]} escala={2.6} />
        <Palmera pos={[-2.6, 0, -1.5]} escala={1.1} viento={f / 15} />
        <Palmera pos={[3.4, 0, -3]} escala={1.3} viento={f / 15 + 1} />
        <Sombrilla pos={[1.4, 0, -0.3]} />
        <Tumbona pos={[0, 0, 0.6]} giro={1.1} />
        <group position={[0, 0.55, 0.6]} rotation={[0, 1.1, 0]}>
          <group rotation={[-1.15, 0, 0]} position={[0, 0, 0.5]}>
            <Persona pos={[0, -0.9, 0]} camisa="#29b6f6" pantalon="#ff7043" pose={{ brazoIzq: 2.8, brazoDer: 2.8, boca: "sonrisa" }} />
          </group>
        </group>
        {Array.from({ length: 12 }, (_, i) => {
          const sale = tt + i * 5;
          const t = (f - sale) / 22;
          if (t < 0 || t > 1.6) return null;
          const x = (azar(i) - 0.5) * 6;
          const z = (azar(i + 3) - 0.5) * 3 + 0.5;
          return <Moneda key={i} pos={[x, Math.min(t, 1) * 2.4 + 0.3, z]} rot={[0, f / 4 + i, 0]} escala={0.8 * Math.min(1, t * 3)} />;
        })}
      </Escenario3D>
      <Rotulo f={f} inicio={tt} texto="TRABAJA POR TI" y={650} tam={80} fondo="#00897b" />
      <Rotulo f={f} inicio={en("descansas.")} texto="TÚ DESCANSAS" y={810} tam={84} fondo="#ff7043" giro={3} />
      <Vineta />
    </AbsoluteFill>
  );
};

const secreto = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const tc = en("cuentes");
  const llega = tramo(f, tc - 6, dur);
  const gente: { x: number; z: number; c: string }[] = [
    { x: -5, z: -1, c: "#8e24aa" },
    { x: 5, z: -1, c: "#43a047" },
    { x: -6, z: 2, c: "#fdd835" },
    { x: 6, z: 2, c: "#00acc1" },
    { x: -4, z: -4, c: "#6d4c41" },
    { x: 4, z: -4, c: "#e91e63" },
  ];
  return (
    <AbsoluteFill>
      <Escenario3D camara={[0, 4.5, 14]} mira={[0, 1.6, 0]}>
        <Barrio z={-10} />
        <Persona pos={[0, 0, 0.5]} pose={{ brazoDer: 0.5, adelanteDer: 2.5, boca: "seria", cabeza: Math.sin(f / 6) * (f > tc ? 0.35 : 0) }} />
        {gente.map((g, i) => {
          const x = lerp(g.x, g.x * 0.42, llega);
          return (
            <Persona
              key={i}
              pos={[x, 0, g.z]}
              giro={(g.x < 0 ? 1 : -1) * (Math.PI / 2 - 0.4)}
              escala={0.9}
              camisa={g.c}
              pelo={i % 2 ? "#111" : "#c98a3a"}
              pose={{ caminar: llega < 1 && f > tc - 6 ? f / 3 + i : undefined, brazoDer: 1.2, adelanteDer: 1.2, boca: "sonrisa" }}
            />
          );
        })}
      </Escenario3D>
      <Rotulo f={f} inicio={en("importante:")} texto="¡SECRETO!" y={650} tam={96} fondo="#1b1b1b" />
      <Burbuja f={f} inicio={tc + 4} texto="¿Me prestas?" x={300} y={900} />
      <Burbuja f={f} inicio={tc + 12} texto="¡Primo!" x={800} y={1000} />
      <Burbuja f={f} inicio={tc + 20} texto="Un negocio…" x={720} y={820} />
      <Vineta />
    </AbsoluteFill>
  );
};

const final = ({ en }: Escenario): Dibujo => ({ f }) => {
  const ang = f / 60;
  return (
    <AbsoluteFill>
      <Escenario3D camara={[Math.sin(ang) * 12, 3.6, Math.cos(ang) * 12]} mira={[0, 1.8, 0]}>
        <Barrio />
        <Persona pos={[0.6, 0, 0]} giro={ang} pose={{ brazoDer: 2.4 + Math.sin(f / 4) * 0.4, brazoIzq: 0.3, boca: "sonrisa" }} />
        <Maletin pos={[-1.2, 0, 0.8]} rot={[0, ang + 0.5, 0]} abre={1} />
        <LluviaBilletes f={f} inicio={0} n={35} area={[9, 6]} />
      </Escenario3D>
      <Rotulo f={f} inicio={2} texto={"¿Y TÚ QUÉ\nHARÍAS PRIMERO?"} y={650} tam={92} />
      <Rotulo f={f} inicio={en("Escríbelo")} texto="COMENTA ABAJO" y={1180} tam={92} fondo={ORO} color="#1b1b1b" giro={2} />
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

