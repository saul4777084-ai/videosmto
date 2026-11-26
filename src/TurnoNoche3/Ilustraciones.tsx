import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { Grano, Iris, Lienzo, Lluvia, Mov, Relampago, Vineta, lerp } from "../comun/Terror/Efectos";
import { CaraDesconocido, Desconocido, Encargado, OjosBrillantes } from "../comun/Terror/Personajes";
import { Dibujo } from "../comun/tipos";
import { Mostrador } from "../TurnoNoche2/Ilustraciones";
import { Gasolinera, Puerta, Tienda } from "../TurnoNoche/Vistas";
import { APAGONES, ENCENDIDOS, PISADAS, asomaEn } from "./efectos";
import { dur, en, Ilustracion } from "./escenas";

const Acabado: React.FC<{ f: number; vineta?: number }> = ({ f, vineta = 0.8 }) => (
  <>
    <Vineta fuerza={vineta} />
    <Grano f={f} />
  </>
);

// cuántos de los momentos (fracción de la escena) han pasado ya
const cuantos = (f: number, total: number, momentos: number[]) => momentos.filter((p) => f >= Math.round(p * total)).length;

// el hueco bajo el mostrador, visto desde dentro (lo que tienes alrededor al esconderte)
const BajoMostrador: React.FC<{ vacio?: boolean; f: number }> = ({ vacio = true, f }) => (
  <g>
    <rect width="1080" height="1920" fill="#0b0c0e" />
    {/* panel trasero y balda con cajas */}
    <rect x="0" y="0" width="1080" height="1200" fill="#15171a" />
    <rect x="0" y="560" width="1080" height="26" fill="#2a2d31" />
    {[[80, 380, 220, 180], [330, 420, 160, 140], [760, 360, 240, 200]].map(([x, y, w, h], i) => (
      <g key={i}>
        <rect x={x} y={y} width={w} height={h} fill="#5a4630" />
        <rect x={x} y={y} width={w} height="24" fill="#6b5439" />
        <rect x={x + w * 0.35} y={y} width={w * 0.3} height={h} fill="#c9b48a" opacity="0.25" />
      </g>
    ))}
    {/* suelo */}
    <path d="M0 1200 L1080 1150 L1080 1920 L0 1920 Z" fill="#202226" />
    {Array.from({ length: 9 }, (_, i) => (
      <path key={i} d={`M${i * 150 - 120} 1920 L${160 + i * 100} 1190`} stroke="#18191c" strokeWidth="4" />
    ))}
    {/* charco donde estaba agachado, con gotas que aún caen */}
    <ellipse cx="380" cy="1420" rx="260" ry="60" fill="#7e93ab" opacity="0.18" />
    <ellipse cx="350" cy="1410" rx="120" ry="22" fill="#c9d6ea" opacity="0.12" />
    {[0, 1, 2].map((k) => {
      const r = ((f + k * 17) % 50) / 50;
      return <ellipse key={k} cx={300 + k * 70} cy={1420} rx={10 + r * 70} ry={2 + r * 14} fill="none" stroke="#c9d6ea" strokeOpacity={0.35 * (1 - r)} strokeWidth="3" />;
    })}
    {!vacio && <Desconocido x={380} y={1460} escala={1.15} pose="agachado" cabeza={-12} />}
    {/* luz azul que entra por debajo del mostrador */}
    <path d="M1080 1150 L1080 1920 L700 1920 Z" fill="#9fb4d6" opacity="0.05" />
  </g>
);

// botas de agua del encargado, vistas a ras de suelo; paso: fase de la zancada
const Botas: React.FC<{ x: number; y: number; escala: number; paso: number; quieto?: boolean }> = ({ x, y, escala, paso, quieto = false }) => {
  const a = quieto ? 0 : Math.sin(paso * Math.PI * 2);
  const alza = (s: number) => (quieto ? 0 : Math.max(0, s) * 26);
  const pierna = (dx: number, s: number) => (
    <g transform={`translate(${dx + s * 60} ${-alza(s)})`}>
      <rect x="-36" y="-520" width="72" height="420" fill="#2a3140" />
      <rect x="-36" y="-520" width="22" height="420" fill="#323b4d" />
      <path d="M-42 -130 L40 -130 L44 -20 C90 -16 110 0 110 20 L-46 20 Z" fill="#1a1d22" />
      <rect x="-46" y="10" width="156" height="14" fill="#0c0d10" />
      <path d="M-40 -126 L38 -126" stroke="#3b4048" strokeWidth="6" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <ellipse cx="30" cy="26" rx="190" ry="20" fill="#000" opacity="0.45" />
      {pierna(-50, -a)}
      {pierna(50, a)}
      {/* bajo del impermeable amarillo, chorreando */}
      <path d="M-130 -700 L190 -700 L200 -470 L-140 -470 Z" fill="#d7a623" />
      <path d="M-140 -490 L200 -490 L200 -470 L-140 -470 Z" fill="#a67d16" />
      <path d="M-140 -560 L200 -560 L200 -540 L-140 -540 Z" fill="#c9cdd2" opacity="0.8" />
    </g>
  );
};

// ------------------------------------------------------------------ planos
// la puerta se abre hacia fuera y la figura entra con la lluvia
const Abre: Dibujo = ({ f }) => {
  const abierta = lerp(f, [0, 34], [0, 1]);
  const s = lerp(f, [0, dur("abre")], [0.95, 1.35]);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("abre")]} de={[0, 0, 1.0]} a={[0, 40, 1.12]} temblor={4}>
        <Lienzo>
          <Puerta f={f} abierta={abierta} vistaCamara fuera={<Encargado x={540} y={1470 + (s - 0.95) * 300} escala={s} />} />
          <Mostrador />
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: "linear-gradient(rgba(10,20,40,0.35), rgba(0,0,0,0))" }} />
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

// los fluorescentes se apagan uno a uno, del fondo hacia ti
const Apagon: Dibujo = ({ f }) => {
  const n = cuantos(f, dur("apagon"), APAGONES);
  const negro = lerp(f, [Math.round(APAGONES[3] * dur("apagon")), Math.round(APAGONES[3] * dur("apagon")) + 4], [0, 0.93]);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("apagon")]} de={[0, 0, 1.0]} a={[0, 0, 1.1]} temblor={2}>
        <Lienzo>
          <Tienda f={f} apagadas={n} />
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: "#000", opacity: negro }} />
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

// oscuridad total: solo sus ojos y un brillo de dientes, acercándose
const Ojos: Dibujo = ({ f }) => {
  const s = lerp(f, [0, dur("ojos")], [2.2, 3.4]);
  const y = 950 + 590 * s;
  const brillo = lerp(f, [0, 12], [0, 1]) * (Math.floor(f / 40) % 3 === 2 && f % 40 < 4 ? 0.1 : 1);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Lienzo fondo="#000">
        <Encargado x={540} y={y} escala={s} sonrisa={1} />
        <rect width="1080" height="1920" fill="#000" opacity="0.94" />
        <OjosBrillantes x1={540 - 20 * s} x2={540 + 21 * s} y={y - 594 * s} r={6 * s} intensidad={brillo} />
      </Lienzo>
      <Grano f={f} opacidad={0.12} />
    </AbsoluteFill>
  );
};

// la mano te arrastra hacia abajo: la cámara cae del mostrador al hueco de debajo
const Tira: Dibujo = ({ f }) => {
  const t = en("tira", "tira") - 2;
  const baja = lerp(f, [t, t + 7], [0, 1]);
  const borroso = Math.sin(baja * Math.PI) * 14;
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("tira")]} de={[0, 0, 1.05]} a={[0, 0, 1.15]} temblor={f > t ? 8 : 2}>
        <AbsoluteFill style={{ transform: `translateY(${-baja * 100}%) rotate(${baja * (1 - baja) * 30}deg)`, filter: `blur(${borroso}px)` }}>
          <Lienzo fondo="#000">
            <rect width="1080" height="1920" fill="#030405" />
            <Mostrador />
            <OjosBrillantes x1={500} x2={560} y={980} r={7} intensidad={0.8} />
          </Lienzo>
          <AbsoluteFill style={{ top: "100%" }}>
            <Lienzo fondo="#0b0c0e">
              <BajoMostrador f={f} vacio={false} />
            </Lienzo>
          </AbsoluteFill>
        </AbsoluteFill>
      </Mov>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 45% at 40% 62%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.9) 100%)" }} />
      <Grano f={f} />
    </AbsoluteFill>
  );
};

// la cara del desconocido pegada a la tuya, un dedo en los labios
const NoRespires: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("norespires")]} de={[0, 0, 1.05]} a={[0, 30, 1.18]} temblor={2}>
      <Lienzo fondo="#07090c">
        <rect width="1080" height="1920" fill="#0b0d10" />
        <CaraDesconocido x={540} y={1000} escala={1.5} ojos={0.75} giro={-3} />
        {/* dedo huesudo sobre los labios */}
        <g transform="translate(548 1150) rotate(-4)">
          <rect x="-24" y="0" width="48" height="300" rx="24" fill="#a3aaa1" />
          <rect x="-20" y="8" width="40" height="40" rx="14" fill="#c8cec6" opacity="0.5" />
          <path d="M-24 90 L24 90 M-24 190 L24 190" stroke="#000" strokeOpacity="0.2" strokeWidth="4" />
          <path d="M-120 260 C-140 340 -60 460 60 450 C150 440 170 330 120 260 Z" fill="#a3aaa1" />
        </g>
      </Lienzo>
    </Mov>
    <AbsoluteFill style={{ background: "linear-gradient(rgba(40,70,110,0.25), rgba(0,0,0,0.5))", mixBlendMode: "multiply" }} />
    <Acabado f={f} vineta={0.92} />
  </AbsoluteFill>
);

// a ras de suelo, por la rendija del mostrador: las botas cruzan la tienda dejando charcos
const SueloTienda: React.FC = () => (
  <g>
    <rect x="0" y="900" width="1080" height="820" fill="#24262a" />
    {Array.from({ length: 14 }, (_, i) => (
      <path key={i} d={`M${i * 110 - 200} 1720 L${300 + i * 40} 900`} stroke="#1b1c1f" strokeWidth="4" />
    ))}
    {[960, 1020, 1110, 1240, 1420].map((y) => (
      <path key={y} d={`M0 ${y} L1080 ${y}`} stroke="#1b1c1f" strokeWidth="4" />
    ))}
    {/* el borde inferior del mostrador arriba y tu escondite abajo */}
    <rect x="0" y="0" width="1080" height="900" fill="#050506" />
    <rect x="0" y="880" width="1080" height="24" fill="#111215" />
    <rect x="0" y="1720" width="1080" height="200" fill="#050506" />
  </g>
);

const Pasos: Dibujo = ({ f }) => {
  const D = dur("pasos");
  const x = lerp(f, [0, D * 0.9], [-180, 700], (t) => t);
  const pisadas = PISADAS.map((p) => Math.round(p * D));
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, D]} de={[0, 0, 1.0]} a={[0, 0, 1.06]} temblor={2}>
        <Lienzo fondo="#050506">
          <SueloTienda />
          {/* charcos que va dejando */}
          {pisadas.map((t, i) =>
            f >= t ? <ellipse key={i} cx={lerp(t, [0, D * 0.9], [-180, 700], (k) => k) + (i % 2 ? 40 : -20)} cy={1470} rx={70} ry={12} fill="#9fb4d0" opacity={0.25} /> : null,
          )}
          <Botas x={x} y={1460} escala={0.8} paso={f / (D * 0.14)} />
          <rect x="0" y="0" width="1080" height="880" fill="#050506" />
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.7), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.7))" }} />
      <Acabado f={f} vineta={0.9} />
    </AbsoluteFill>
  );
};

// las botas, quietas, justo delante; el agua gotea del impermeable
const Encima: Dibujo = ({ f }) => {
  const D = dur("encima");
  const llega = lerp(f, [0, 10], [380, 540]);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, D]} de={[0, 0, 1.0]} a={[0, 60, 1.18]} temblor={f > en("encima", "encima") ? 4 : 1}>
        <Lienzo fondo="#050506">
          <SueloTienda />
          <ellipse cx="560" cy="1520" rx="300" ry="40" fill="#9fb4d0" opacity="0.22" />
          <Botas x={llega - 40} y={1560} escala={1.6} paso={0} quieto />
          {/* gotas que caen del bajo del impermeable */}
          {[0, 1, 2, 3].map((k) => {
            const p = ((f + k * 11) % 26) / 26;
            return <ellipse key={k} cx={llega - 160 + k * 110} cy={900 + p * 620} rx="5" ry="11" fill="#c9d6ea" opacity={0.6 * (1 - p * 0.5)} />;
          })}
          <rect x="0" y="0" width="1080" height="880" fill="#050506" />
          <rect x="0" y="1720" width="1080" height="200" fill="#050506" />
        </Lienzo>
      </Mov>
      <Acabado f={f} vineta={0.9} />
    </AbsoluteFill>
  );
};

// desde abajo: su cabeza asoma del revés por el borde del mostrador, sonriendo
const Asoma: Dibujo = ({ f }) => {
  const t = asomaEn();
  const baja = lerp(f, [t, t + 6], [0, 1]);
  const s = 2.6;
  const cabeza = -400 + baja * 1080; // y del centro de la cabeza
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("asoma")]} de={[0, 0, 1.0]} a={[0, 40, 1.15]} temblor={f > t ? 6 : 1}>
        <Lienzo fondo="#060708">
          <rect width="1080" height="1920" fill="#0d0f12" />
          {/* la tienda oscura al fondo, de lado */}
          <rect x="0" y="380" width="1080" height="1540" fill="#121418" />
          <rect x="0" y="1500" width="1080" height="420" fill="#1b1d21" />
          <g transform={`rotate(180 540 ${cabeza})`}>
            <Encargado x={540} y={cabeza + 590 * s} escala={s} sonrisa={baja} ojos={baja} />
          </g>
          {/* gotas que caen de su cara hacia ti */}
          {baja > 0.9 &&
            [0, 1].map((k) => {
              const p = ((f - t + k * 13) % 24) / 24;
              return <ellipse key={k} cx={520 + k * 40} cy={cabeza + 130 + p * 1100} rx="6" ry="13" fill="#c9d6ea" opacity={0.6} />;
            })}
          {/* el tablero del mostrador visto desde abajo, con sus dedos agarrando el borde */}
          <rect x="0" y="0" width="1080" height="390" fill="#2a2d31" />
          <rect x="0" y="370" width="1080" height="28" fill="#8f949a" />
          {[[300, 1], [780, -1]].map(([x, l]) =>
            baja > 0
              ? [0, 1, 2, 3].map((k) => <rect key={`${x}${k}`} x={x + k * 26 * l} y={380} width="20" height={30 + (k % 2) * 10} rx="10" fill="#b98a6a" />)
              : null,
          )}
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.88) 100%)" }} />
      <Relampago f={f} en={t} />
      <Grano f={f} />
    </AbsoluteFill>
  );
};

const Reloj: Dibujo = ({ f }) => {
  const t = en("reloj", "3:34.");
  const cambia = f >= t;
  const glitch = f >= t && f < t + 5;
  const dos = Math.floor(f / 15) % 2 === 0;
  const pulso = interpolate(f - t, [0, 3, 14], [1, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <Mov f={f} rango={[0, dur("reloj")]} de={[0, 0, 1.12]} a={[0, 0, 1.25]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              width: 860,
              height: 380,
              borderRadius: 30,
              background: "#0d0d0d",
              boxShadow: "inset 0 0 0 8px #1d1d1d, 0 0 120px rgba(255,30,30,0.15)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scale(${pulso}) translateX(${glitch ? (random(`g${f}`) - 0.5) * 60 : 0}px)`,
            }}
          >
            <span style={{ fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 230, color: "#ff2b2b", textShadow: "0 0 30px #ff1a1a, 0 0 80px rgba(255,0,0,0.5)", letterSpacing: 6 }}>
              03<span style={{ opacity: dos ? 1 : 0.15 }}>:</span>3{cambia ? "4" : "3"}
            </span>
          </div>
        </AbsoluteFill>
      </Mov>
      <Acabado f={f} vineta={0.9} />
    </AbsoluteFill>
  );
};

// silencio; luego los tubos se encienden uno a uno y la tienda está vacía
const Luces: Dibujo = ({ f }) => {
  const encendidos = cuantos(f, dur("luces"), ENCENDIDOS);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Mov f={f} rango={[0, dur("luces")]} de={[0, 0, 1.12]} a={[0, 0, 1.0]}>
        <Lienzo>
          <Tienda f={f} apagadas={4 - encendidos} parpadea={encendidos > 0} />
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: "#000", opacity: encendidos === 0 ? 0.96 : 0 }} />
      <Acabado f={f} vineta={0.75} />
    </AbsoluteFill>
  );
};

// giras la cabeza bajo el mostrador: solo queda el charco
const Nadie: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("nadie") * 0.6]} de={[420, 0, 1.25]} a={[60, 0, 1.15]} temblor={2}>
      <Lienzo fondo="#0b0c0e">
        <BajoMostrador f={f} />
      </Lienzo>
    </Mov>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 45% at 45% 62%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)" }} />
    <Grano f={f} />
  </AbsoluteFill>
);

// coche con los faros encendidos (de lado)
const Coche: React.FC<{ x: number; y: number; escala?: number; f: number }> = ({ x, y, escala = 1, f }) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`}>
    <path d="M-260 0 L-600 -40 L-600 40 Z" fill="#fff4c8" opacity="0.18" />
    <ellipse cx="0" cy="10" rx="250" ry="20" fill="#000" opacity="0.5" />
    <path d="M-240 -10 L-230 -80 L-130 -95 L-80 -160 L110 -160 L170 -95 L240 -80 L245 -10 Z" fill="#3d4a5c" />
    <path d="M-70 -150 L-10 -150 L-10 -100 L-115 -100 Z M10 -150 L100 -150 L150 -100 L10 -100 Z" fill="#9fb4c8" opacity="0.6" />
    <rect x="-246" y="-60" width="22" height="20" rx="4" fill="#fff4c8" />
    <rect x="228" y="-60" width="18" height="18" rx="4" fill="#c0262c" />
    {[-150, 150].map((cx) => (
      <g key={cx} transform={`rotate(${-f * 6} ${cx} -10)`}>
        <circle cx={cx} cy="-10" r="40" fill="#111" />
        <circle cx={cx} cy="-10" r="18" fill="#777" />
        <rect x={cx - 3} y="-28" width="6" height="36" fill="#555" />
      </g>
    ))}
  </g>
);

// amanece: llega el encargado de verdad, en coche
const Manana: Dibujo = ({ f }) => {
  const D = dur("manana");
  const x = lerp(f, [0, D * 0.55], [1350, 760]);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, D]} de={[-60, -120, 1.45]} a={[-120, -200, 1.55]}>
        <Lienzo>
          <Gasolinera f={f} dependiente />
          <Coche x={x} y={1650} escala={0.85} f={f < D * 0.55 ? f : D * 0.55} />
          <Lluvia f={f} n={40} opacidad={0.15} semilla="manana" />
        </Lienzo>
      </Mov>
      {/* luz del amanecer, fría y rosada */}
      <AbsoluteFill style={{ background: "linear-gradient(rgba(255,150,120,0.45), rgba(120,140,190,0.25) 45%, rgba(0,0,0,0) 70%)", mixBlendMode: "screen" }} />
      <Acabado f={f} vineta={0.6} />
    </AbsoluteFill>
  );
};

// el encargado, dentro, con la luz del día
const EncargadoHabla: React.FC<{ f: number; habla: boolean; escala: number; y: number }> = ({ f, habla, escala, y }) => (
  <Lienzo>
    <Tienda f={f} parpadea={false} />
    <rect width="1080" height="1920" fill="#f0d9b8" opacity="0.12" />
    <Encargado x={540} y={y} escala={escala} boca={habla ? Math.abs(Math.sin(f / 3.2)) * 0.6 : 0} />
  </Lienzo>
);

const Cuentas: Dibujo = ({ f }) => {
  const habla = f > en("cuentas", "«El") - 2 && f < dur("cuentas") * 0.9;
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("cuentas")]} de={[0, 0, 1.0]} a={[0, 0, 1.12]}>
        <EncargadoHabla f={f} habla={habla} escala={2.4} y={950 + 590 * 2.4} />
      </Mov>
      <Acabado f={f} vineta={0.7} />
    </AbsoluteFill>
  );
};

const Nunca: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("nunca")]} de={[0, 0, 1.0]} a={[0, 30, 1.1]}>
      <EncargadoHabla f={f} habla={f < dur("nunca") * 0.8} escala={3.4} y={900 + 590 * 3.4} />
    </Mov>
    <AbsoluteFill style={{ background: "rgba(10,20,40,0.25)" }} />
    <Acabado f={f} vineta={0.85} />
  </AbsoluteFill>
);

// la foto del tablón: el chico de antes, con la gorra roja de la gasolinera
const Foto: React.FC<{ ojos: number; f: number; gota: number }> = ({ ojos, gota }) => (
  <g>
    <rect x="-230" y="-300" width="460" height="580" fill="#efe9dc" />
    <defs>
      <clipPath id="marcoFoto">
        <rect x="-200" y="-270" width="400" height="440" />
      </clipPath>
    </defs>
    <g clipPath="url(#marcoFoto)">
      <rect x="-200" y="-270" width="400" height="440" fill="#6f7d86" />
      <g style={{ filter: "sepia(0.35)" }}>
        <CaraDesconocido x={0} y={-30} escala={0.6} ojos={ojos} />
        {/* gorra roja de la gasolinera */}
        <g transform="translate(0 -128) scale(0.6)">
          <path d="M-200 30 C-200 -140 200 -140 200 30 Z" fill="#b8282e" />
          <path d="M-40 20 L260 34 L250 64 L-40 52 Z" fill="#8f1c22" />
          <circle cx="0" cy="-100" r="12" fill="#8f1c22" />
        </g>
      </g>
      {/* gota de agua que resbala por la foto */}
      <ellipse cx="80" cy={-270 + gota * 460} rx="7" ry="12" fill="#dfe9f5" opacity={gota > 0 ? 0.7 : 0} />
      <rect x="77" y="-270" width="6" height={gota * 460} fill="#dfe9f5" opacity="0.25" />
    </g>
    <text x="0" y="240" textAnchor="middle" fontFamily="'Caveat', 'DejaVu Sans', cursive" fontWeight="700" fontSize="40" fill="#2a2f38">
      ¡Gracias, Mario!
    </text>
  </g>
);

const Tablon: React.FC<{ f: number; ojos: number; gota: number }> = ({ f, ojos, gota }) => (
  <g>
    <rect width="1080" height="1920" fill="#2b2f33" />
    <rect x="70" y="420" width="940" height="1100" fill="#a7774a" stroke="#5a3d24" strokeWidth="26" />
    {Array.from({ length: 220 }, (_, i) => (
      <circle key={i} cx={90 + random(`cx${i}`) * 900} cy={440 + random(`cy${i}`) * 1060} r={2 + random(`cr${i}`) * 3} fill="#7d5532" opacity="0.5" />
    ))}
    {/* papeles: turnos y normas */}
    <g transform="translate(150 500) rotate(-4)">
      <rect width="300" height="380" fill="#f4f1e6" />
      <text x="150" y="60" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="38" fill="#c0262c">TURNOS</text>
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x="30" y={100 + i * 38} width={160 + (i % 3) * 40} height="14" fill="#9aa0a6" />
      ))}
    </g>
    <g transform="translate(640 1180) rotate(5)">
      <rect width="300" height="260" fill="#fff6a8" />
      <text x="150" y="70" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="34" fill="#111">3:33</text>
      <text x="150" y="140" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="46" fill="#c0262c">NO ABRIR</text>
    </g>
    {/* cartel de empleado del mes y la foto */}
    <g transform="translate(660 720) rotate(3)">
      <rect x="-250" y="-430" width="500" height="100" fill="#c0262c" />
      <text x="0" y="-365" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="44" fill="#fff" letterSpacing="2">EMPLEADO DEL MES</text>
      <Foto ojos={ojos} f={f} gota={gota} />
      <circle cx="0" cy="-300" r="14" fill="#2d6bd4" />
    </g>
  </g>
);

const TablonPlano: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("tablon")]} de={[0, 120, 1.0]} a={[-160, 280, 1.5]}>
      <Lienzo>
        <Tablon f={f} ojos={0} gota={0} />
      </Lienzo>
    </Mov>
    <AbsoluteFill style={{ background: "#f0d9b8", opacity: 0.06 }} />
    <Acabado f={f} vineta={0.7} />
  </AbsoluteFill>
);

// primerísimo plano de la foto: sus ojos se encienden
const Empapado: Dibujo = ({ f }) => {
  const t = en("empapado", "salvó.");
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("empapado")]} de={[-400, 1050, 2.6]} a={[-420, 1150, 3.1]} temblor={f > t ? 4 : 0}>
        <Lienzo>
          <Tablon f={f} ojos={lerp(f, [t - 4, t + 4], [0, 1])} gota={lerp(f, [dur("empapado") * 0.3, dur("empapado")], [0, 1])} />
        </Lienzo>
      </Mov>
      <Relampago f={f} en={t} />
      <Acabado f={f} vineta={0.9} />
    </AbsoluteFill>
  );
};

// otra noche: tú dentro y él, otra vez, junto al surtidor
const Final: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("final")]} de={[0, -60, 1.35]} a={[-120, -200, 1.6]}>
      <Lienzo>
        <Gasolinera f={f} dependiente desconocido />
        <Lluvia f={f} n={160} opacidad={0.38} semilla="final3" />
      </Lienzo>
    </Mov>
    <Acabado f={f} />
    <Iris f={f} rango={[dur("final") - 40, dur("final") - 4]} x={73} y={58} />
  </AbsoluteFill>
);

export const DIBUJOS: Record<Ilustracion, Dibujo> = {
  abre: Abre,
  apagon: Apagon,
  ojos: Ojos,
  tira: Tira,
  norespires: NoRespires,
  pasos: Pasos,
  encima: Encima,
  asoma: Asoma,
  reloj: Reloj,
  luces: Luces,
  nadie: Nadie,
  manana: Manana,
  cuentas: Cuentas,
  nunca: Nunca,
  tablon: TablonPlano,
  empapado: Empapado,
  final: Final,
};
