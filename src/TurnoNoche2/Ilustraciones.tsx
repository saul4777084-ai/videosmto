import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { CamaraSeguridad } from "../comun/Terror/Camara";
import { Grano, Iris, Lienzo, Lluvia, Mov, Relampago, Vineta, lerp } from "../comun/Terror/Efectos";
import { CaraDesconocido, Desconocido, Encargado } from "../comun/Terror/Personajes";
import { Dibujo } from "../comun/tipos";
import { Caja, Gasolinera, Puerta } from "../TurnoNoche/Vistas";
import { GOLPES_CRISTAL } from "./efectos";
import { dur, en, Ilustracion } from "./escenas";

const Acabado: React.FC<{ f: number; vineta?: number }> = ({ f, vineta = 0.8 }) => (
  <>
    <Vineta fuerza={vineta} />
    <Grano f={f} />
  </>
);

// gotas pegadas al cristal (encima de lo que hay fuera)
const Gotas: React.FC<{ semilla: string; n?: number }> = ({ semilla, n = 60 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => (
      <circle key={i} cx={random(`${semilla}x${i}`) * 1080} cy={random(`${semilla}y${i}`) * 1920} r={3 + random(`${semilla}r${i}`) * 8} fill="#dce8f5" opacity="0.2" />
    ))}
  </g>
);

// borde del mostrador en primer plano, visto desde la silla
export const Mostrador: React.FC = () => (
  <g>
    <rect x="-20" y="1640" width="1120" height="300" fill="#8f949a" />
    <rect x="-20" y="1620" width="1120" height="30" fill="#c8ccd1" />
    <rect x="700" y="1560" width="220" height="80" rx="10" fill="#26292d" />
  </g>
);

const golpeEn = (f: number, tiempos: number[]) => tiempos.reduce((acc, t) => acc + Math.max(0, 1 - Math.abs(f - t) / 4), 0);

// ------------------------------------------------------------------ planos
const Recap: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 04 · CAJA" inicio="03:36:31" modo="DIRECTO" saltos={[0]}>
    <Mov f={f} rango={[0, dur("recap")]} de={[380, -720, 1.8]} a={[400, -780, 1.9]}>
      <Lienzo>
        <Caja f={f} agachado />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

// tú, quieto, mirando al cristal: el encargado espera fuera bajo la lluvia
const Respira: Dibujo = ({ f }) => {
  const pulso = 0.82 + Math.sin(f / 9) * 0.06;
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("respira")]} de={[0, 0, 1.0]} a={[0, 30, 1.1]} temblor={5}>
        <Lienzo>
          <Puerta f={f} fuera={<Encargado x={540} y={1470} escala={0.95} />} />
          <Mostrador />
        </Lienzo>
      </Mov>
      <Vineta fuerza={pulso} />
      <Grano f={f} />
    </AbsoluteFill>
  );
};

// el encargado pega el móvil al cristal (la pantalla ilumina su cara)
const Movil: Dibujo = ({ f }) => {
  const sube = lerp(f, [en("movil", "móvil") - 10, en("movil", "móvil") + 4], [500, 0]);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("movil")]} de={[0, 0, 1]} a={[0, 0, 1.06]} temblor={3}>
        <Lienzo fondo="#03050a">
          <rect width="1080" height="1920" fill="#070b13" />
          <Lluvia f={f} n={110} opacidad={0.33} />
          <Encargado x={420} y={950 + 590 * 2.6} escala={2.6} />
          <g transform={`translate(760 ${1150 + sube}) rotate(-6)`}>
            <rect x="-150" y="-290" width="300" height="580" rx="40" fill="#111" />
            <rect x="-132" y="-262" width="264" height="524" rx="24" fill="#f4f6f8" />
            <text x="0" y="-150" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="58" fill="#111">ABRE.</text>
            <path d="M-150 120 C-210 140 -220 260 -150 300 L60 330 L60 230 Z" fill="#b98a6a" />
            <rect x="-200" y="290" width="200" height="400" fill="#d9a726" transform="rotate(10)" />
          </g>
          <ellipse cx="700" cy="1000" rx="380" ry="420" fill="#eaf2ff" opacity="0.07" />
          <Gotas semilla="movil" />
        </Lienzo>
      </Mov>
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

// la pantalla del móvil en grande, el mensaje escribiéndose
const MENSAJE = ["ABRE.", "RÁPIDO.", "NO LE", "MIRES."];
const Pantalla: Dibujo = ({ f }) => {
  const letras = Math.floor(f / ((dur("pantalla") * 0.8) / MENSAJE.join("").length));
  let quedan = letras;
  const cursor = Math.floor(f / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: "#05070b" }}>
      <Mov f={f} rango={[0, dur("pantalla")]} de={[0, 0, 1.02]} a={[0, 0, 1.1]} temblor={4}>
        <Lienzo fondo="#05070b">
          <Lluvia f={f} n={90} opacidad={0.25} />
          <rect x="150" y="260" width="780" height="1420" rx="90" fill="#0e0e0e" />
          <rect x="185" y="300" width="710" height="1340" rx="60" fill="#f4f6f8" />
          <rect x="460" y="320" width="160" height="34" rx="17" fill="#0e0e0e" />
          <text x="230" y="440" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="36" fill="#9aa0a6">Notas</text>
          {MENSAJE.map((linea, i) => {
            const visible = linea.slice(0, Math.max(0, quedan));
            quedan -= linea.length;
            return (
              <text key={i} x="240" y={640 + i * 170} fontFamily="Inter, sans-serif" fontWeight="900" fontSize="128" fill={i >= 2 ? "#d21f1f" : "#111"}>
                {visible}
                {quedan <= 0 && quedan > -linea.length - 1 && cursor ? "|" : ""}
              </text>
            );
          })}
          {/* dedos sujetando el móvil contra el cristal */}
          <path d="M110 1200 C60 1260 60 1420 120 1480 L210 1460 L210 1210 Z" fill="#b98a6a" />
          <path d="M970 900 C1030 960 1030 1120 970 1180 L880 1160 L880 920 Z" fill="#b98a6a" />
          <Gotas semilla="pantalla" n={80} />
          <path d="M100 0 L300 0 L-100 1920 L-300 1920 Z" fill="#fff" opacity="0.05" />
        </Lienzo>
      </Mov>
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

const Reloj: Dibujo = ({ f }) => {
  const dos = Math.floor(f / 15) % 2 === 0;
  const pulso = interpolate(f - en("reloj", "3:33."), [0, 3, 14], [1, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <Mov f={f} rango={[0, dur("reloj")]} de={[0, 0, 1.12]} a={[0, 0, 1.25]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 860, height: 380, borderRadius: 30, background: "#0d0d0d", boxShadow: "inset 0 0 0 8px #1d1d1d, 0 0 120px rgba(255,30,30,0.15)", display: "flex", justifyContent: "center", alignItems: "center", transform: `scale(${pulso})` }}>
            <span style={{ fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 230, color: "#ff2b2b", textShadow: "0 0 30px #ff1a1a, 0 0 80px rgba(255,0,0,0.5)", letterSpacing: 6 }}>
              03<span style={{ opacity: dos ? 1 : 0.15 }}>:</span>33
            </span>
          </div>
        </AbsoluteFill>
      </Mov>
      <Acabado f={f} vineta={0.9} />
    </AbsoluteFill>
  );
};

// recuerdo: la advertencia del principio, en sepia y con borde quemado
const Recuerdo: Dibujo = ({ f }) => {
  const habla = f > en("recuerdo", "«Si") - 2 && f < dur("recuerdo") * 0.82 ? Math.abs(Math.sin(f / 3.2)) * 0.6 : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "sepia(0.85) contrast(1.05) brightness(0.9) blur(0.6px)" }}>
        <Mov f={f} rango={[0, dur("recuerdo")]} de={[0, 20, 1.05]} a={[0, 40, 1.15]}>
          <Lienzo fondo="#06080d">
            <rect width="1080" height="1920" fill="#0b0e14" />
            <Lluvia f={f} n={90} opacidad={0.22} />
            <Encargado x={560} y={2900} escala={3.1} boca={habla} />
          </Lienzo>
        </Mov>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255,240,210,0) 55%, rgba(255,240,210,0.35) 80%, rgba(20,12,4,0.9) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff8e8", opacity: interpolate(f, [0, 3, 10], [0.7, 0.4, 0], { extrapolateRight: "clamp" }) }} />
      <Grano f={f} opacidad={0.16} />
    </AbsoluteFill>
  );
};

// huellas mojadas desde la carretera hasta la puerta
const Huellas: React.FC<{ hasta: number }> = ({ hasta }) => (
  <g fill="#dfe8f2">
    {Array.from({ length: 14 }, (_, i) => {
      const p = i / 13;
      if (p > hasta) return null;
      const x = 560 + p * 85 + (i % 2 ? 16 : -16);
      const y = 1700 - p * 590;
      const s = 1 - p * 0.45;
      return <ellipse key={i} cx={x} cy={y} rx={10 * s} ry={20 * s} opacity={0.5} />;
    })}
  </g>
);

const Cam2: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 02 · SURTIDORES" inicio="03:37:02" modo="DIRECTO" saltos={[0]}>
    <Mov f={f} rango={[0, dur("cam2")]} de={[0, -330, 1.5]} a={[0, -460, 1.6]}>
      <Lienzo>
        <Gasolinera f={f} dependiente={false} />
        <Lluvia f={f} n={120} opacidad={0.4} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

const Andando: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 02 · SURTIDORES" inicio="03:37:06" modo="DIRECTO">
    <Mov f={f} rango={[0, dur("andando")]} de={[0, -460, 1.6]} a={[-60, -700, 2.0]}>
      <Lienzo>
        <Gasolinera f={f} dependiente={false} />
        <Huellas hasta={lerp(f, [0, dur("andando") * 0.6], [0, 1])} />
        <Lluvia f={f} n={120} opacidad={0.4} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

const Cam1: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 01 · PUERTA" inicio="03:37:11" modo="DIRECTO" saltos={[0, Math.round(dur("cam1") * 0.55)]}>
    <Mov f={f} rango={[0, dur("cam1")]} de={[0, 0, 1.05]} a={[0, 20, 1.2]}>
      <Lienzo>
        <Puerta f={f} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

// él, pegado al cristal, golpeando
const Golpes: Dibujo = ({ f }) => {
  const tiempos = GOLPES_CRISTAL.map((p) => Math.round(p * dur("golpes")));
  const g = golpeEn(f, tiempos);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("golpes")]} de={[0, 0, 1.0]} a={[0, 0, 1.08]} temblor={3 + g * 14}>
        <Lienzo>
          <Puerta
            f={f}
            fuera={
              <g>
                <Encargado x={540} y={2060} escala={1.6} />
                <g transform={`translate(700 ${1010 - g * 20}) scale(${1 + g * 0.12})`}>
                  <path d="M-70 -50 C-70 -110 70 -110 70 -50 L60 80 C50 130 -50 130 -60 80 Z" fill="#b98a6a" />
                  <rect x="-50" y="110" width="100" height="300" fill="#d9a726" />
                </g>
              </g>
            }
          />
          <Mostrador />
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: `rgba(255,255,255,${g * 0.05})` }} />
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

// bajo el mostrador: una mano pálida te agarra el tobillo
const Tobillo: Dibujo = ({ f }) => {
  const t = en("tobillo", "agarra") - 3;
  const entra = lerp(f, [t - 6, t + 2], [0, 1]);
  const aprieta = f > t ? 1 + Math.sin((f - t) / 2) * 0.02 : 1;
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("tobillo")]} de={[0, 0, 1.05]} a={[0, 0, 1.15]} temblor={f > t ? 10 : 2}>
        <Lienzo fondo="#060708">
          <rect width="1080" height="1920" fill="#0b0c0e" />
          {/* suelo bajo el mostrador */}
          <path d="M0 1250 L1080 1150 L1080 1920 L0 1920 Z" fill="#26282c" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${i * 160 - 100} 1920 L${180 + i * 110} 1230`} stroke="#1c1e21" strokeWidth="4" />
          ))}
          {/* tu pierna y tu zapatilla */}
          <rect x="560" y="0" width="230" height="1300" fill="#2c3443" />
          <rect x="560" y="0" width="60" height="1300" fill="#252c39" />
          <path d="M540 1290 L800 1290 L810 1400 C900 1420 990 1460 990 1520 L540 1520 Z" fill="#e8e8e8" />
          <path d="M540 1500 L990 1500 L990 1540 L540 1540 Z" fill="#b8282e" />
          <rect x="560" y="1240" width="230" height="70" fill="#d9a988" />
          {/* la mano huesuda desde la oscuridad */}
          <g transform={`translate(${-420 + entra * 900} 1240) scale(${aprieta})`}>
            <path d="M-700 -40 L-120 -60 L-110 60 L-700 80 Z" fill="#14161a" />
            <path d="M-140 -70 C-60 -110 40 -100 80 -60 L80 70 C30 100 -60 100 -140 70 Z" fill="#c8cec6" />
            {[-60, -20, 20, 60].map((y, i) => (
              <path key={i} d={`M60 ${y - 14} C140 ${y - 30} 210 ${y - 10} 230 ${y + 20} L215 ${y + 30} C190 ${y + 10} 140 ${y} 60 ${y + 14} Z`} fill="#c8cec6" />
            ))}
            <path d="M-40 -80 C20 -150 90 -150 140 -120 L130 -100 C80 -120 30 -110 -10 -60 Z" fill="#c8cec6" />
          </g>
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 45% at 60% 62%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.92) 100%)" }} />
      <Grano f={f} />
    </AbsoluteFill>
  );
};

const Susurro: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 04 · CAJA" inicio="03:37:24" modo="DIRECTO" saltos={[0]}>
    <Mov f={f} rango={[0, dur("susurro")]} de={[0, 0, 1]} a={[0, 40, 1.12]}>
      <Lienzo fondo="#0b0e14">
        <rect width="1080" height="1920" fill="#33373c" />
        <Desconocido x={540} y={1050 + 330 * 2.6} escala={2.6} pose="agachado" cabeza={-10 + Math.sin(f / 12) * 3} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

const Aviso: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 04 · CAJA" inicio="03:37:28" modo="DIRECTO" saltos={[0]}>
    <Mov f={f} rango={[0, dur("aviso")]} de={[0, 0, 1]} a={[0, 60, 1.2]}>
      <Lienzo fondo="#10141c">
        <rect width="1080" height="1920" fill="#33373c" />
        <CaraDesconocido x={540} y={1000} escala={1.5} giro={lerp(f, [0, dur("aviso")], [6, 1])} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

// la sonrisa: se estira de oreja a oreja y los ojos se encienden
const Sonrisa: Dibujo = ({ f }) => {
  const t = en("sonrisa", "demasiado.");
  const s = lerp(f, [en("sonrisa", "sonríe…") - 4, t], [0.15, 1]);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("sonrisa")]} de={[0, 0, 1]} a={[0, 60, 1.25]} temblor={f > t ? 6 : 1}>
        <Lienzo fondo="#03050a">
          <rect width="1080" height="1920" fill="#070b13" />
          <Lluvia f={f} n={120} opacidad={0.35} />
          <Encargado x={540} y={950 + 590 * 3.2} escala={3.2} sonrisa={s} ojos={lerp(f, [t - 4, t + 4], [0, 1])} />
          <Gotas semilla="sonrisa" />
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(255,40,40,0.22), rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 90%)" }} />
      <Relampago f={f} en={t} />
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

// llavero (igual que el que te dio en la parte 1)
const Llavero: React.FC<{ giro: number }> = ({ giro }) => (
  <g transform={`rotate(${giro})`}>
    <circle cx="0" cy="0" r="38" fill="none" stroke="#c9ccd1" strokeWidth="9" />
    {[-35, 5, 40].map((a, i) => (
      <g key={i} transform={`rotate(${a}) translate(0 40)`}>
        <rect x="-10" y="0" width="20" height="120" rx="6" fill={i === 1 ? "#c9a43e" : "#b4b8be"} />
        <circle cx="0" cy="0" r="22" fill={i === 1 ? "#c9a43e" : "#b4b8be"} />
        <path d="M10 70 l14 0 l0 12 l-8 0 l0 10 l8 0 l0 12 l-14 0 Z" fill={i === 1 ? "#c9a43e" : "#b4b8be"} />
      </g>
    ))}
    <rect x="-70" y="30" width="80" height="50" rx="8" fill="#c0262c" transform="rotate(-50)" />
    <text x="-30" y="64" textAnchor="middle" fontFamily="Inter" fontWeight="900" fontSize="26" fill="#fff" transform="rotate(-50)">
      24H
    </text>
  </g>
);

const SacaLlaves: Dibujo = ({ f }) => {
  const sube = lerp(f, [0, en("sacallaves", "llaves") + 4], [700, 0]);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("sacallaves")]} de={[0, 0, 1.0]} a={[0, -30, 1.12]}>
        <Lienzo fondo="#03050a">
          <rect width="1080" height="1920" fill="#070b13" />
          <Lluvia f={f} n={110} opacidad={0.33} />
          <g transform={`translate(560 ${880 + sube})`}>
            <rect x="-120" y="260" width="240" height="900" fill="#d9a726" />
            <rect x="-120" y="260" width="80" height="900" fill="#b3861a" />
            <path d="M-110 120 C-130 230 -90 300 -10 300 C70 300 120 250 110 140 L100 60 L-100 60 Z" fill="#b98a6a" />
            <rect x="-30" y="-10" width="60" height="120" rx="30" fill="#a87b5c" />
            <g transform="translate(0 -40)">
              <Llavero giro={Math.sin(f / 7) * 18} />
            </g>
          </g>
          <Gotas semilla="llaves" />
        </Lienzo>
      </Mov>
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

// la cerradura de la puerta vista de cerca; la llave entra desde fuera y gira
const Cerrojo: React.FC<{ f: number; entra: number; gira: number }> = ({ f, entra, gira }) => (
  <g>
    <rect width="1080" height="1920" fill="#0a0e15" />
    <Lluvia f={f} n={70} opacidad={0.25} />
    {/* marco metálico de la puerta */}
    <rect x="330" y="0" width="420" height="1920" fill="#6d7278" />
    <rect x="330" y="0" width="40" height="1920" fill="#8b9096" />
    <rect x="710" y="0" width="40" height="1920" fill="#565a60" />
    {/* bombín */}
    <circle cx="540" cy="980" r="150" fill="#b4b8be" />
    <circle cx="540" cy="980" r="118" fill="#9a9ea4" />
    <g transform={`rotate(${gira * 90} 540 980)`}>
      <circle cx="540" cy="980" r="80" fill="#c9a43e" />
      <rect x="530" y="920" width="20" height="120" rx="8" fill="#2a2a2a" />
      {/* la llave asomando: crece al entrar */}
      <g opacity={entra}>
        <rect x="528" y={950 - (1 - entra) * 60} width="24" height="60" fill="#d8b54c" />
        <rect x={480} y={880 - (1 - entra) * 160} width="120" height="90" rx="40" fill="#c9a43e" transform={`scale(1)`} />
      </g>
    </g>
    <Gotas semilla="cerrojo" n={50} />
  </g>
);

const Cerradura: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("cerradura")]} de={[0, 0, 1.0]} a={[0, 0, 1.2]} temblor={2}>
      <Lienzo fondo="#0a0e15">
        <Cerrojo f={f} entra={lerp(f, [10, 22], [0, 1])} gira={0} />
      </Lienzo>
    </Mov>
    <Acabado f={f} vineta={0.85} />
  </AbsoluteFill>
);

const Clic: Dibujo = ({ f }) => {
  const negro = interpolate(f, [dur("clic") * 0.55, dur("clic") * 0.62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, 10]} de={[0, 0, 1.2]} a={[0, 0, 1.3]} temblor={f > 6 ? 8 : 0}>
        <Lienzo fondo="#0a0e15">
          <Cerrojo f={f} entra={1} gira={lerp(f, [4, 8], [0, 1])} />
        </Lienzo>
      </Mov>
      <Acabado f={f} vineta={0.85} />
      <AbsoluteFill style={{ background: "#000", opacity: negro }} />
    </AbsoluteFill>
  );
};

const Final: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("final")]} de={[-120, -200, 1.6]} a={[0, -60, 1.35]}>
      <Lienzo>
        <Gasolinera f={f} dependiente />
        <Encargado x={645} y={1112} escala={0.24} ojos={1} />
        <Lluvia f={f} n={160} opacidad={0.38} semilla="final2" />
      </Lienzo>
    </Mov>
    <Acabado f={f} />
    <Iris f={f} rango={[dur("final") - 40, dur("final") - 4]} x={60} y={56} />
  </AbsoluteFill>
);

export const DIBUJOS: Record<Ilustracion, Dibujo> = {
  recap: Recap,
  respira: Respira,
  movil: Movil,
  pantalla: Pantalla,
  reloj: Reloj,
  recuerdo: Recuerdo,
  cam2: Cam2,
  andando: Andando,
  cam1: Cam1,
  golpes: Golpes,
  tobillo: Tobillo,
  susurro: Susurro,
  aviso: Aviso,
  sonrisa: Sonrisa,
  sacallaves: SacaLlaves,
  cerradura: Cerradura,
  clic: Clic,
  final: Final,
};
