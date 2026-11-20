import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { CamaraSeguridad, Monitores } from "../comun/Terror/Camara";
import { Grano, Iris, Lienzo, Lluvia, Mov, Relampago, Vineta, lerp } from "../comun/Terror/Efectos";
import { CaraDesconocido as CaraGrande, Desconocido, Encargado } from "../comun/Terror/Personajes";
import { Dibujo } from "../comun/tipos";
import { dur, en, Ilustracion } from "./escenas";
import { SALTOS_SALTOS } from "./efectos";
import { Caja, Carretera, Gasolinera, Puerta, Tienda } from "./Vistas";

// Acabado común de los planos "reales" (no cámara): viñeta y grano
const Acabado: React.FC<{ f: number; vineta?: number }> = ({ f, vineta = 0.8 }) => (
  <>
    <Vineta fuerza={vineta} />
    <Grano f={f} />
  </>
);

// ------------------------------------------------------------------ primeros planos
const Llaves: Dibujo = ({ f }) => {
  const caida = lerp(f, [16, 26], [0, 1]);
  const rebote = f > 26 ? Math.exp(-(f - 26) / 6) * Math.sin((f - 26) / 1.5) * 18 : 0;
  const yLlaves = 760 + caida * 420 - Math.abs(rebote);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("llaves")]} de={[0, 0, 1.05]} a={[0, -20, 1.14]}>
        <Lienzo fondo="#120f0c">
          <rect width="1080" height="1920" fill="#16130f" />
          <rect y="1300" width="1080" height="620" fill="#5a5048" />
          <rect y="1300" width="1080" height="20" fill="#7a6e63" />
          {/* mano del encargado (arriba, manga amarilla) */}
          <g transform={`translate(${520 - caida * 30} ${-40 - caida * 80})`}>
            <path d="M-130 -200 L130 -200 L150 520 L-150 520 Z" fill="#d9a726" />
            <path d="M-130 -200 L-40 -200 L-60 520 L-150 520 Z" fill="#b3861a" />
            <path d="M-120 500 C-140 600 -100 690 -20 700 C60 710 120 660 120 560 L130 500 Z" fill="#b98a6a" />
            {[-70, -25, 20, 65].map((x, i) => (
              <rect key={i} x={x - 18} y={640} width="36" height={110 - Math.abs(i - 1.5) * 14} rx="18" fill="#a87b5c" />
            ))}
          </g>
          {/* llavero */}
          <g transform={`translate(560 ${yLlaves}) rotate(${(1 - caida) * 25 + rebote * 0.6})`}>
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
          {/* tu mano abierta (abajo) */}
          <g transform="translate(540 1500)">
            <path d="M-120 420 L120 420 L150 160 L-150 160 Z" fill="#8d939c" />
            <path d="M-170 40 C-180 -60 -100 -110 0 -110 C110 -110 180 -60 170 40 C160 140 100 180 0 180 C-100 180 -160 140 -170 40 Z" fill="#d9a988" />
            {[-120, -50, 20, 90].map((x, i) => (
              <rect key={i} x={x} y={-260 + Math.abs(i - 1.5) * 20} width="54" height="200" rx="27" fill="#d9a988" />
            ))}
            <rect x="140" y="-80" width="54" height="160" rx="27" fill="#d9a988" transform="rotate(35 167 0)" />
          </g>
        </Lienzo>
      </Mov>
      <Acabado f={f} />
    </AbsoluteFill>
  );
};

const CaraEncargado: Dibujo = ({ f }) => {
  const habla = f < dur("encargado") * 0.8 ? Math.abs(Math.sin(f / 3.2)) * 0.6 : 0;
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("encargado")]} de={[0, 0, 1]} a={[0, 30, 1.1]}>
        <Lienzo fondo="#06080d">
          <rect width="1080" height="1920" fill="#070a10" />
          <rect x="0" y="1200" width="1080" height="720" fill="#0d1119" />
          <Lluvia f={f} n={90} opacidad={0.25} />
          <Encargado x={560} y={2900} escala={3.1} boca={habla} />
        </Lienzo>
      </Mov>
      {/* luz roja del cartel por un lado, sombra por el otro */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(255,40,40,0.28), rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 85%)", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(255,60,60,0.18), rgba(0,0,0,0) 40%)" }} />
      <Relampago f={f} en={8} />
      <Acabado f={f} />
    </AbsoluteFill>
  );
};

const Reloj: Dibujo = ({ f }) => {
  const minuto = f < 24 ? "03:32" : "03:33";
  const pulso = f >= 24 ? interpolate(f - 24, [0, 3, 12], [1.12, 1.12, 1], { extrapolateRight: "clamp" }) : 1;
  const dos = Math.floor(f / 15) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <Mov f={f} rango={[0, dur("reloj")]} de={[0, 0, 1]} a={[0, 0, 1.12]}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 860, height: 380, borderRadius: 30, background: "#0d0d0d", boxShadow: "inset 0 0 0 8px #1d1d1d, 0 0 120px rgba(255,30,30,0.15)", display: "flex", justifyContent: "center", alignItems: "center", transform: `scale(${pulso})` }}>
            <span style={{ fontFamily: "'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 230, color: "#ff2b2b", textShadow: "0 0 30px #ff1a1a, 0 0 80px rgba(255,0,0,0.5)", letterSpacing: 6 }}>
              {minuto.slice(0, 2)}
              <span style={{ opacity: dos ? 1 : 0.15 }}>:</span>
              {minuto.slice(3)}
            </span>
          </div>
        </AbsoluteFill>
      </Mov>
      <Acabado f={f} vineta={0.9} />
    </AbsoluteFill>
  );
};

const Nudillos: Dibujo = ({ f }) => {
  const golpes = [0, 1, 2].map((k) => en("nudillos", "Toc.", k));
  const g = golpes.reduce((acc, t) => acc + Math.max(0, 1 - Math.abs(f - t) / 4), 0);
  const visible = lerp(f, [0, 5], [0, 1]);
  return (
    <AbsoluteFill>
      <Lienzo fondo="#03050a">
        <rect width="1080" height="1920" fill="#060a12" />
        <Lluvia f={f} n={110} opacidad={0.3} />
        {/* puño pálido al otro lado del cristal */}
        <g transform={`translate(560 1000) scale(${1 + g * 0.08})`} opacity={visible * 0.9} style={{ filter: "blur(1.5px)" }}>
          <path d="M-110 120 L110 120 L150 700 L-150 700 Z" fill="#1b1e23" />
          <rect x="-190" y="-130" width="380" height="270" rx="90" fill="#b3b9b1" />
          {[-135, -45, 45, 135].map((x, i) => (
            <g key={i}>
              <rect x={x - 44} y={-170} width="88" height="150" rx="44" fill="#c4cac2" />
              <ellipse cx={x} cy={-130} rx="26" ry="16" fill="#d8ddd5" />
              <path d={`M${x - 44} -40 L${x + 44} -40`} stroke="#8f958d" strokeWidth="6" />
            </g>
          ))}
          <path d="M-190 40 C-120 20 -60 40 -10 30 L60 60" stroke="#8f958d" strokeWidth="10" fill="none" strokeLinecap="round" />
        </g>
        {/* gotas y reflejos en el cristal */}
        {Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={random(`nx${i}`) * 1080} cy={random(`ny${i}`) * 1920 + ((f * random(`nv${i}`) * 2) % 60)} r={3 + random(`nr${i}`) * 9} fill="#dce8f5" opacity="0.22" />
        ))}
        <path d="M120 0 L320 0 L-80 1920 L-280 1920 Z" fill="#fff" opacity="0.04" />
      </Lienzo>
      <AbsoluteFill style={{ transform: `translateX(${g * 6}px)`, background: `rgba(255,255,255,${g * 0.05})` }} />
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

const CaraDesconocido: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 02 · SURTIDORES" inicio="03:33:52" modo="DIRECTO" saltos={[0]}>
    <Mov f={f} rango={[0, dur("cam2cara")]} de={[0, 0, 1]} a={[0, 60, 1.25]}>
      <Lienzo fondo="#0b0e14">
        <rect width="1080" height="1920" fill="#10141c" />
        <CaraGrande x={540} y={1000} escala={1.5} ojos={lerp(f, [30, 50], [0.6, 1])} giro={lerp(f, [0, 110], [-2, -7])} />
        <Lluvia f={f} n={80} opacidad={0.3} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

const Campanita: Dibujo = ({ f }) => {
  const t0 = en("campanita", "campanita.") - 2;
  const giro = f > t0 ? Math.sin((f - t0) / 2.4) * 28 * Math.exp(-(f - t0) / 40) : 0;
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("campanita")]} de={[0, 0, 1.05]} a={[0, 0, 1.15]}>
        <Lienzo fondo="#1a1c1f">
          <rect width="1080" height="1920" fill="#1c1f23" />
          <rect x="0" y="560" width="1080" height="90" fill="#5d6268" />
          <rect x="0" y="650" width="1080" height="1270" fill="#0b0f17" />
          <rect x="0" y="650" width="1080" height="1270" fill="#9fc3d6" opacity="0.06" />
          <Lluvia f={f} n={70} opacidad={0.22} />
          <rect x="470" y="560" width="140" height="40" rx="8" fill="#3d4146" />
          <g transform={`translate(540 600) rotate(${giro})`}>
            <path d="M0 0 C40 40 -40 80 0 120 C40 160 -40 200 0 240" stroke="#8a7a4a" strokeWidth="9" fill="none" />
            <path d="M-120 470 C-120 320 120 320 120 470 L150 520 L-150 520 Z" fill="#c9a43e" />
            <path d="M-120 470 C-120 320 -40 300 -20 320 C-70 360 -80 430 -70 520 L-150 520 Z" fill="#e3c25e" />
            <rect x="-150" y="510" width="300" height="24" rx="10" fill="#a8862e" />
            <circle cx={giro * 1.5} cy="560" r="28" fill="#8a6d22" />
            <circle cx="0" cy="250" r="20" fill="#a8862e" />
          </g>
        </Lienzo>
      </Mov>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(255,220,140,0.12), rgba(0,0,0,0) 40%)" }} />
      <Acabado f={f} />
    </AbsoluteFill>
  );
};

const CristalEncargado: Dibujo = ({ f }) => {
  const cara = lerp(f, [36, 46], [0, 1]);
  const grita = f > 46 ? 0.6 + Math.abs(Math.sin(f / 2.5)) * 0.4 : 0;
  const golpes = [0, 14, 27];
  const g = golpes.reduce((acc, t) => acc + Math.max(0, 1 - Math.abs(f - t) / 4), 0);
  return (
    <AbsoluteFill>
      <Mov f={f} rango={[0, dur("cristal")]} de={[0, 0, 1]} a={[0, 0, 1.08]} temblor={4 + g * 10}>
        <Lienzo fondo="#03050a">
          <rect width="1080" height="1920" fill="#070b13" />
          <Lluvia f={f} n={120} opacidad={0.35} velocidad={1.3} />
          {/* puño golpeando al principio */}
          <g opacity={1 - cara} transform={`translate(540 1000) scale(${1 + g * 0.1})`}>
            <path d="M-130 -40 C-130 -130 130 -130 130 -40 L120 140 C100 230 -100 230 -120 140 Z" fill="#b98a6a" />
            <path d="M-80 200 L80 200 L110 700 L-110 700 Z" fill="#d9a726" />
          </g>
          {/* la cara del encargado aplastada contra el cristal, gritando */}
          <g opacity={cara}>
            <Encargado x={540} y={950 + 590 * 3.2} escala={3.2} boca={grita} />
            {[-1, 1].map((l) => (
              <g key={l} transform={`translate(${540 + l * 330} 1180) rotate(${l * 12})`}>
                <path d="M-80 -60 C-80 -120 80 -120 80 -60 L80 120 L-80 120 Z" fill="#c99a78" />
                {[-60, -20, 20, 60].map((x, i) => (
                  <rect key={i} x={x - 17} y={-230 + Math.abs(i - 1.5) * 18} width="34" height="190" rx="17" fill="#c99a78" />
                ))}
              </g>
            ))}
          </g>
          {Array.from({ length: 60 }, (_, i) => (
            <circle key={i} cx={random(`cx${i}`) * 1080} cy={random(`cy${i}`) * 1920} r={3 + random(`cr${i}`) * 8} fill="#dce8f5" opacity="0.2" />
          ))}
        </Lienzo>
      </Mov>
      <Relampago f={f} en={44} />
      <Acabado f={f} vineta={0.85} />
    </AbsoluteFill>
  );
};

const Grito: Dibujo = ({ f }) => {
  const sacudida = Math.max(0, 1 - f / 40);
  const dx = (random(`gx${f}`) - 0.5) * 50 * sacudida;
  const dy = (random(`gy${f}`) - 0.5) * 50 * sacudida;
  const destello = f >= 3 && f < 7;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {destello && (
        <CamaraSeguridad f={f} etiqueta="CAM 04 · CAJA" inicio="03:36:31" modo="DIRECTO" saltos={[3]}>
          <Lienzo fondo="#0b0e14">
            <Desconocido x={540} y={960 + 330 * 2.6} escala={2.6} pose="agachado" />
          </Lienzo>
        </CamaraSeguridad>
      )}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translate(${dx}px, ${dy}px) scale(${1 + sacudida * 0.15})` }}>
        <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 900, fontSize: 168, lineHeight: 1.02, color: "#ff2222", textAlign: "center", textShadow: "0 0 40px rgba(255,0,0,0.7)" }}>
          ¡NO LE
          <br />
          MIRES!
        </div>
      </AbsoluteFill>
      <Grano f={f} opacidad={0.2} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ planos de cámara de seguridad
const Cam2: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 02 · SURTIDORES" inicio="03:33:41" modo="DIRECTO" saltos={[0]}>
    <Mov f={f} rango={[0, dur("cam2")]} de={[0, -330, 1.55]} a={[-90, -420, 1.75]}>
      <Lienzo>
        <Gasolinera f={f} desconocido />
        <Lluvia f={f} n={120} opacidad={0.4} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

const Rebobinar: Dibujo = ({ f }) => {
  const rebobina = f < 45;
  const g = f - 45;
  return (
    <CamaraSeguridad
      f={rebobina ? f : g}
      etiqueta="CAM 01 · PUERTA"
      inicio={rebobina ? "03:34:30" : "03:20:04"}
      modo={rebobina ? "REBOBINAR" : "GRABACION"}
      saltos={rebobina ? [0, 20, 38] : [0]}
    >
      <Mov f={f} rango={[45, dur("rebobinar")]} de={[0, 0, 1.05]} a={[0, 20, 1.15]}>
        <Lienzo>
          <Puerta f={f} abierta={rebobina ? lerp(f, [0, 40], [1, 0]) : lerp(g, [en("rebobinar", "puerta") - 45, en("rebobinar", "sola.") - 45], [0, 1])} vistaCamara />
        </Lienzo>
      </Mov>
    </CamaraSeguridad>
  );
};

const Cam3: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 03 · TIENDA" inicio="03:35:02" modo="DIRECTO" saltos={[0]}>
    <Mov f={f} rango={[0, dur("cam3")]} de={[0, 0, 1.05]} a={[0, 40, 1.22]}>
      <Lienzo>
        <Tienda f={f} desconocido={{ x: 0, z: 8.2 }} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

// cada salto de imagen: un pasillo más cerca y un fluorescente menos
const Saltos: Dibujo = ({ f }) => {
  const k = SALTOS_SALTOS.filter((s) => f >= s + 2).length;
  const z = [8.2, 6.3, 4.4, 2.7, 1.2][k];
  const x = [0, -40, 30, -20, 0][k];
  return (
    <CamaraSeguridad f={f} etiqueta="CAM 03 · TIENDA" inicio="03:35:07" modo="DIRECTO" saltos={SALTOS_SALTOS}>
      <Mov f={f} rango={[0, dur("saltos")]} de={[0, 40, 1.22]} a={[0, 60, 1.3]}>
        <Lienzo>
          <Tienda f={f} desconocido={{ x, z }} apagadas={Math.min(3, k)} />
        </Lienzo>
      </Mov>
    </CamaraSeguridad>
  );
};

const Vacias: Dibujo = ({ f }) => (
  <Mov f={f} rango={[0, dur("vacias")]} de={[0, 0, 1]} a={[0, 30, 1.08]}>
    <Monitores
      f={f}
      pantallas={[
        { etiqueta: "CAM 01 · PUERTA", inicio: "03:35:21", modo: "DIRECTO", saltos: [0], nodo: <Lienzo><Puerta f={f} /></Lienzo> },
        {
          etiqueta: "CAM 02 · SURTIDORES",
          inicio: "03:35:21",
          modo: "DIRECTO",
          saltos: [0],
          nodo: (
            <Lienzo>
              <g transform="translate(-300 -650) scale(1.6)">
                <Gasolinera f={f} />
              </g>
            </Lienzo>
          ),
        },
        { etiqueta: "CAM 03 · TIENDA", inicio: "03:35:21", modo: "DIRECTO", saltos: [0], nodo: <Lienzo><Tienda f={f} apagadas={3} /></Lienzo> },
        { etiqueta: "CAM 04 · CAJA", inicio: "03:35:21", modo: "DIRECTO", saltos: [0], nodo: <Lienzo><g transform="translate(-200 -500) scale(1.4)"><Caja f={f} /></g></Lienzo> },
      ]}
    />
  </Mov>
);

const Pasillo: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("pasillo")]} de={[0, 0, 1.0]} a={[0, 0, 1.12]} temblor={7}>
      <Lienzo>
        <Tienda f={f} apagadas={2} />
      </Lienzo>
    </Mov>
    <AbsoluteFill style={{ background: "rgba(10,20,40,0.25)", mixBlendMode: "multiply" }} />
    <Acabado f={f} vineta={0.9} />
  </AbsoluteFill>
);

const Cam4: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 04 · CAJA" inicio="03:36:10" modo="DIRECTO" saltos={[0]}>
    <Mov f={f} rango={[0, dur("cam4")]} de={[0, -80, 1.1]} a={[0, -110, 1.18]}>
      <Lienzo>
        <Caja f={f} />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

const Cam4Pies: Dibujo = ({ f }) => (
  <CamaraSeguridad f={f} etiqueta="CAM 04 · CAJA" inicio="03:36:14" modo="DIRECTO">
    <Mov f={f} rango={[en("cam4pies", "pies,") - 6, en("cam4pies", "él.")]} de={[0, -110, 1.18]} a={[380, -720, 1.8]}>
      <Lienzo>
        <Caja f={f} agachado />
      </Lienzo>
    </Mov>
  </CamaraSeguridad>
);

// ------------------------------------------------------------------ exteriores
const Exterior: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("exterior")]} de={[0, -40, 1.3]} a={[0, -150, 1.5]}>
      <Lienzo>
        <Gasolinera f={f} />
        <Lluvia f={f} n={160} opacidad={0.38} />
      </Lienzo>
    </Mov>
    <Relampago f={f} en={2} />
    <Acabado f={f} />
  </AbsoluteFill>
);

const Cartel: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("cartel")]} de={[90, 0, 1.05]} a={[-40, -20, 1.15]}>
      <Lienzo>
        <Carretera f={f} />
        <Lluvia f={f} n={150} opacidad={0.35} semilla="carretera" />
      </Lienzo>
    </Mov>
    <Acabado f={f} vineta={0.85} />
  </AbsoluteFill>
);

const PuertaVacia: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("puerta")]} de={[0, 0, 1.0]} a={[0, 20, 1.15]} temblor={4}>
      <Lienzo>
        <Puerta f={f} />
      </Lienzo>
    </Mov>
    <Acabado f={f} vineta={0.85} />
  </AbsoluteFill>
);

const Final: Dibujo = ({ f }) => (
  <AbsoluteFill>
    <Mov f={f} rango={[0, dur("final")]} de={[-120, -200, 1.6]} a={[0, -60, 1.35]}>
      <Lienzo>
        <Gasolinera f={f} desconocido dependiente />
        <Lluvia f={f} n={160} opacidad={0.38} semilla="final" />
      </Lienzo>
    </Mov>
    <Acabado f={f} />
    <Iris f={f} rango={[dur("final") - 40, dur("final") - 4]} x={73} y={58} />
  </AbsoluteFill>
);

export const DIBUJOS: Record<Ilustracion, Dibujo> = {
  exterior: Exterior,
  cartel: Cartel,
  llaves: Llaves,
  encargado: CaraEncargado,
  reloj: Reloj,
  nudillos: Nudillos,
  puerta: PuertaVacia,
  cam2: Cam2,
  cam2cara: CaraDesconocido,
  rebobinar: Rebobinar,
  campanita: Campanita,
  cam3: Cam3,
  saltos: Saltos,
  vacias: Vacias,
  pasillo: Pasillo,
  cam4: Cam4,
  cam4pies: Cam4Pies,
  cristal: CristalEncargado,
  grito: Grito,
  final: Final,
};
