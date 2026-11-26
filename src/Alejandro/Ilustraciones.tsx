import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Dibujo } from "../comun/tipos";
import { LonLat } from "../comun/Globo";
import { CamaraT, mezclarT, Tierra } from "../comun/Tierra";
import { AMARILLO, AZUL, Caja, Capa, Ciudad, Creditos, FlechaG, Linea, NARANJA, Rotulo, Sello, SERIF, Titular, Zona } from "../comun/PiezasNapoleon";
import type { Escenario, Ilustracion } from "./escenas";

// Aspecto de Napoleón: mapa dibujado (tierra verde, mar azul), el imperio de Alejandro en rojo, el persa en azul,
// etiquetas azul marino, años dorados con letra serif, chips y sellos.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.inOut(Easing.cubic);
const NARANJA_CAJA = "#d9773a";
const P = (lon: number, lat: number, zoom: number, y = 1010): CamaraT => ({ lon, lat, zoom, y, plana: true });
const camino = (f: number, desde: number, hasta: number, a: CamaraT, b: CamaraT) => mezclarT(a, b, interpolate(f, [desde, hasta], [0, 1], { ...clamp, easing: suave }));
const k = (f: number, desde: number, dur = 30) => interpolate(f, [desde, desde + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
const fuera = (f: number, desde: number, dur = 20) => 1 - k(f, desde, dur);

const Vineta = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 52%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />;
const Anio: React.FC<{ f: number; inicio: number; texto: string; y?: number }> = ({ f, inicio, texto, y = 1640 }) => (
  <Caja f={f} inicio={inicio} texto={texto} y={y} tam={72} />
);

// ---------- territorios (aproximados; se recortan con la costa real) ----------

// Macedonia y las ciudades griegas que la seguían (Liga de Corinto), 336 a. C.
const MACEDONIA: LonLat[] = [
  [19.4, 40.0], [19.5, 41.8], [21, 42.4], [23, 42.4], [25.5, 41.9], [26.5, 41.5], [26.3, 40.6], [24.5, 39.8], [24.3, 38], [23.8, 36.3], [22.5, 36.2],
  [21, 36.8], [21, 38.5], [20, 39.2], [19.4, 40.0],
];

// Imperio persa (aqueménida) de Darío III
const PERSIA: LonLat[] = [
  [26.0, 40.0], [26.6, 40.6], [29, 41.2], [31, 41.2], [35, 42], [41, 41.5], [46, 41.8], [50, 41], [54, 38], [59, 38.3], [64, 40.5], [69, 41.2],
  [71.5, 40], [71.2, 36.5], [72, 34.5], [71, 31], [69, 28], [68, 24], [66, 25.2], [62, 25], [58, 25.5], [56.3, 26.8], [54, 26.5], [51, 27.5],
  [49, 29.7], [47.5, 30], [45, 30.5], [40, 31.5], [37, 29.5], [35, 28], [33.5, 27.5], [32.6, 24], [31, 22], [28, 24], [25.5, 29.5], [25, 31.6],
  [28.5, 34], [27.5, 36.5], [26.2, 38.5], [26.0, 40.0],
];

const GRECIA_N: LonLat[] = [[19.4, 40.0], [19.5, 41.8], [21, 42.4], [23, 42.4], [25.5, 41.9], [26.5, 41.5], [28.5, 41.3], [31, 41.2], [35, 42]];
const GRECIA_S: LonLat[] = [[25, 36.1], [23.8, 36.3], [22.5, 36.2], [21, 36.8], [21, 38.5], [20, 39.2], [19.4, 40.0]];

// tras Isos (333): Asia Menor hasta Siria
const A333: LonLat[] = [...GRECIA_N, [38, 41.2], [39.5, 40], [38.8, 38], [38.6, 36.4], [37, 35.6], [35.8, 35.4], [33.5, 35.9], [30, 35.9], [27, 36.2], ...GRECIA_S];

// tras Egipto (332)
const A332: LonLat[] = [
  ...GRECIA_N, [38, 41.2], [39.5, 40], [38.8, 38], [38.6, 36.4], [38.2, 34.5], [37, 32.5], [36, 31.0], [35.5, 29.5], [34.9, 29.5], [33.5, 27.5],
  [32.6, 24], [31, 22], [28, 24], [25.5, 29.5], [25, 31.6], [27, 34], [28, 36], ...GRECIA_S,
];

// tras Gaugamela y Persépolis (331-330)
const A330: LonLat[] = [
  ...GRECIA_N, [41, 41.5], [46, 41.8], [49.5, 40.5], [50, 37.5], [53, 36.8], [55.5, 37], [56, 33], [56.5, 27.2], [56.3, 26.8], [54, 26.5], [51, 27.5],
  [49, 29.7], [47.5, 30], [45, 30.5], [40, 31.5], [37, 29.5], [35, 28], [33.5, 27.5], [32.6, 24], [31, 22], [28, 24], [25.5, 29.5], [25, 31.6],
  [27, 34], [28, 36], ...GRECIA_S,
];

// el imperio entero (hacia 323 a. C.)
const ALEJANDRO: LonLat[] = [
  ...GRECIA_N, [41, 41.5], [46, 41.8], [50, 41], [54, 38], [59, 38.3], [64, 40.5], [69, 41.2], [71.5, 40], [71.2, 36.5], [74, 35], [75.8, 32],
  [75.2, 30.5], [74, 29], [71, 26], [68, 24], [66, 25.2], [62, 25], [58, 25.5], [56.3, 26.8], [54, 26.5], [51, 27.5], [49, 29.7], [47.5, 30], [45, 30.5],
  [40, 31.5], [37, 29.5], [35, 28], [33.5, 27.5], [32.6, 24], [31, 22], [28, 24], [25.5, 29.5], [25, 31.6], [27, 34], [28, 36], ...GRECIA_S,
];

const capa = (poligono: LonLat[], revelar?: number, desde?: LonLat, color = NARANJA, opacidad?: number): Capa => ({ poligono, color, revelar, desde, opacidad });

const L: Record<string, LonLat> = {
  pela: [22.52, 40.76],
  granico: [27.3, 40.2],
  isos: [36.2, 36.85],
  tiro: [35.2, 33.27],
  menfis: [31.25, 29.85],
  alejandria: [29.92, 31.2],
  gaugamela: [43.4, 36.55],
  babilonia: [44.42, 32.54],
  susa: [48.25, 32.19],
  persepolis: [52.89, 29.93],
  samarcanda: [66.97, 39.65],
  hidaspes: [73.7, 32.9],
  hifasis: [75.0, 31.6],
};

// la marcha de Alejandro, por tramos
const R_ASIA: LonLat[] = [L.pela, [23.6, 40.9], [25, 40.9], [26.4, 40.4], L.granico];
const R_ISOS: LonLat[] = [L.granico, [28.0, 38.5], [30, 37.2], [32, 39.6], [33.6, 38.6], [34.9, 37.0], L.isos];
const R_EGIPTO: LonLat[] = [L.isos, [35.9, 35.4], L.tiro, [34.45, 31.5], [32.3, 30.9], L.menfis, L.alejandria];
const R_GAUGAMELA: LonLat[] = [[31.4, 30.3], [34.4, 31.5], L.tiro, [36.6, 35.5], [38.4, 36.1], [41.5, 36.6], L.gaugamela];
const R_PERSIA: LonLat[] = [L.gaugamela, L.babilonia, L.susa, L.persepolis];
const R_INDIA: LonLat[] = [L.persepolis, [49.5, 34.5], [55, 36.3], [62.2, 34.35], [65.7, 31.6], [66.9, 36.76], L.samarcanda, [68, 36.2], [69.2, 34.5], [72, 33.8], L.hidaspes];
const R_GANGES: LonLat[] = [L.hidaspes, L.hifasis, [77.5, 30.3], [80.5, 28]];
const R_VUELTA: LonLat[] = [L.hifasis, [71.6, 30.3], [68.4, 25.6], [65, 25.6], [61, 26.4], [57, 28], [52.9, 29.9], L.susa, L.babilonia];
const DARIO_HUYE: LonLat[] = [[36.8, 36.6], [38.6, 36.3], [40.5, 36.1]];
const DARIO_HUYE2: LonLat[] = [[43.9, 36.4], [46, 35.6], [48.5, 34.8]];

// ---------- dibujos sueltos ----------

// elefante de guerra de Poro (silueta)
const Elefante: React.FC<{ x: number; y: number; s: number; espejo?: boolean }> = ({ x, y, s, espejo }) => (
  <g transform={`translate(${x} ${y}) scale(${espejo ? -s : s} ${s})`} style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.5))" }}>
    <g fill="#8d8d93" stroke="#2b2b30" strokeWidth={3} strokeLinejoin="round">
      <rect x={-34} y={8} width={14} height={30} rx={4} />
      <rect x={14} y={8} width={14} height={30} rx={4} />
      <ellipse cx={0} cy={0} rx={44} ry={28} />
      <path d="M 30 -10 C 52 -14 60 4 58 22 C 57 34 50 44 46 44 C 42 44 44 36 46 30 C 48 20 44 10 36 8 Z" />
      <circle cx={40} cy={-8} r={20} />
      <path d="M 30 -20 C 18 -24 16 2 30 8 Z" fill="#7a7a80" />
    </g>
    <path d="M 52 2 C 62 4 66 10 70 6" fill="none" stroke="#f4efe0" strokeWidth={5} strokeLinecap="round" />
    <circle cx={46} cy={-12} r={3} fill="#111" />
    <rect x={-22} y={-40} width={32} height={18} rx={3} fill="#b3332b" stroke="#fff" strokeWidth={2} />
  </g>
);

// llamas sobre una ciudad
const Fuego: React.FC<{ x: number; y: number; f: number; inicio: number }> = ({ x, y, f, inicio }) => {
  if (f < inicio) return null;
  const s = k(f, inicio, 12);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: "drop-shadow(0 0 18px rgba(255,120,0,0.8))" }}>
      {[-26, 0, 26].map((dx, i) => {
        const h = 70 + 18 * Math.sin((f - inicio) * 0.5 + i * 2);
        return (
          <g key={i} transform={`translate(${dx} 0)`}>
            <path d={`M -20 0 C -24 ${-h * 0.4} -6 ${-h * 0.6} 0 ${-h} C 6 ${-h * 0.6} 24 ${-h * 0.4} 20 0 Z`} fill="#ff6a00" />
            <path d={`M -10 0 C -12 ${-h * 0.3} -3 ${-h * 0.45} 0 ${-h * 0.7} C 3 ${-h * 0.45} 12 ${-h * 0.3} 10 0 Z`} fill="#ffd23f" />
          </g>
        );
      })}
    </g>
  );
};

// barrera: el ejército se para aquí
const Barrera: React.FC<{ x: number; y: number; f: number; inicio: number }> = ({ x, y, f, inicio }) => {
  if (f < inicio) return null;
  const s = k(f, inicio, 10);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
      <circle r={52} fill="#c62828" stroke="#fff" strokeWidth={7} />
      <rect x={-30} y={-9} width={60} height={18} rx={4} fill="#fff" />
    </g>
  );
};

// número que cuenta hacia arriba
const Contador: React.FC<{ f: number; inicio: number; hasta: number; texto: string; y: number; tam?: number }> = ({ f, inicio, hasta, texto, y, tam = 108 }) => {
  if (f < inicio) return null;
  const v = Math.round(interpolate(f, [inicio, inicio + 30], [0, hasta], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: tam, whiteSpace: "nowrap", color: AMARILLO, fontVariantNumeric: "tabular-nums", textShadow: "0 10px 26px rgba(0,0,0,0.7), 0 0 4px #000" }}>
      {v.toLocaleString("es-ES")} {texto}
    </div>
  );
};

const Mapa: React.FC<React.ComponentProps<typeof Tierra>> = (props) => <Tierra estilo="dibujo" fronteras={0.4} fuentes={["mundo", "europa", "asia"]} {...props} />;

// ---------- escenas ----------

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> => ({
  gancho: ({ f }) => {
    const cam = P(interpolate(f, [0, 120], [46, 48]), 33, interpolate(f, [0, 120], [2.2, 2.4]), 1120);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>{(_p, trazo) => <Zona trazo={trazo} cam={cam} capas={[capa(ALEJANDRO, k(f, 4, 44), L.pela)]} />}</Mapa>
        <Vineta />
        <Linea f={f} inicio={3} texto="Antes de cumplir" y={280} tam={62} />
        <Titular f={f} inicio={12} texto="33 AÑOS" y={362} tam={140} />
        <Caja f={f} inicio={28} texto="conquistó medio mundo" y={570} fondo="#c62828" tam={50} giro={-3} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  nace: ({ f }) => {
    const e = esc.nace;
    const cam = camino(f, 0, 50, P(28, 39, 3.2), P(22.6, 40.4, 7.5));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {() => (
            <>
              <Rotulo cam={cam} ll={[22.3, 41.6]} texto="Macedonia" f={f} inicio={e.en("Macedonia")} tam={88} />
              <Rotulo cam={cam} ll={[23.6, 38.6]} texto="Grecia" f={f} inicio={e.en("Macedonia") + 8} tam={70} />
              <Ciudad cam={cam} ll={L.pela} nombre="Pela" f={f} inicio={e.en("Pela")} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titular f={f} inicio={e.en("Alejandro")} texto="ALEJANDRO" y={1330} tam={118} />
        <Anio f={f} inicio={e.en("356")} texto="356 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  rey: ({ f }) => {
    const e = esc.rey;
    const cam = camino(f, 0, e.dur, P(22.6, 40.4, 7.0), P(22.8, 39.6, 5.4));
    const re = e.en("rey");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(MACEDONIA, k(f, e.en("20"), 34), L.pela)]} />
              <Ciudad cam={cam} ll={L.pela} nombre="Pela" f={f} inicio={0} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Caja f={f} inicio={e.en("Aristoteles")} texto="Maestro: Aristóteles" y={1240} tam={50} />
        <Titular f={f} inicio={re} texto={"REY\nA LOS 20"} y={1320} tam={96} />
        <Anio f={f} inicio={re + 8} texto="336 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  asia: ({ f }) => {
    const e = esc.asia;
    const cam = camino(f, 0, e.dur, P(24, 40.2, 6.0), P(29, 39.3, 4.8));
    const cr = e.en("cruzo");
    const as = e.en("Asia");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(PERSIA, k(f, 0, 30), [36, 38], AZUL), capa(MACEDONIA)]} />
              <Rotulo cam={cam} ll={[33.5, 38.0]} texto="Imperio persa" f={f} inicio={as} tam={70} />
              <FlechaG cam={cam} ruta={R_ASIA} t={k(f, cr - 4, as - cr + 12)} />
              <Ciudad cam={cam} ll={L.granico} nombre="Gránico" f={f} inicio={as + 10} lado="der" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Caja f={f} inicio={e.en("40.000")} texto="menos de 40.000 hombres" y={1450} fondo={NARANJA_CAJA} tam={46} giro={-2} />
        <Anio f={f} inicio={e.en("334")} texto="334 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  isos: ({ f }) => {
    const e = esc.isos;
    const cam = camino(f, 0, e.dur, P(29, 39.3, 4.8), P(33, 37.6, 4.4));
    const is = e.en("Isos");
    const hu = e.en("huyo");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(proy, trazo) => {
            const p = proy(L.isos) as [number, number];
            return (
              <>
                <Zona trazo={trazo} cam={cam} capas={[capa(PERSIA, undefined, undefined, AZUL), capa(MACEDONIA), capa(A333, k(f, is, 40), L.granico)]} />
                <FlechaG cam={cam} ruta={R_ISOS} t={k(f, 0, is + 4)} />
                <FlechaG cam={cam} ruta={DARIO_HUYE} t={k(f, hu - 4, 22)} color="#5aa0ff" grosor={13} />
                <Ciudad cam={cam} ll={L.isos} nombre="Isos" f={f} inicio={is + 2} lado="izq" />
                {f >= e.en("Dario") && (
                  <text x={p[0] - 30} y={p[1] + 120} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={46} fill="#fff" stroke="rgba(0,0,0,0.75)" strokeWidth={8} paintOrder="stroke" opacity={k(f, e.en("Dario"), 10)}>
                    DARÍO III
                  </text>
                )}
              </>
            );
          }}
        </Mapa>
        <Vineta />
        <Sello f={f} inicio={hu} texto="Darío huye" x={560} y={1430} tam={70} giro={-8} />
        <Anio f={f} inicio={is} texto="333 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  egipto: ({ f }) => {
    const e = esc.egipto;
    const cam = camino(f, 0, 60, P(35, 36, 3.6), P(32, 31.2, 4.4));
    const eg = e.en("Egipto");
    const al = e.en("Alejandria");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(PERSIA, undefined, undefined, AZUL), capa(A333), capa(A332, k(f, eg + 6, 40), L.tiro)]} />
              <FlechaG cam={cam} ruta={R_EGIPTO} t={interpolate(f, [0, e.en("faraon"), al], [0, 0.8, 1], clamp)} />
              <Ciudad cam={cam} ll={L.tiro} nombre="Tiro" f={f} inicio={8} lado="der" />
              <Rotulo cam={cam} ll={[30.2, 26.6]} texto="Egipto" f={f} inicio={eg} tam={80} />
              <Ciudad cam={cam} ll={L.alejandria} nombre="Alejandría" f={f} inicio={al} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titular f={f} inicio={e.en("faraon")} texto="FARAÓN" y={1360} tam={120} />
        <Anio f={f} inicio={eg} texto="332 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  gaugamela: ({ f }) => {
    const e = esc.gaugamela;
    const cam = camino(f, 0, e.dur, P(34, 33, 3.3), P(42, 34, 3.2));
    const ga = e.en("Gaugamela");
    const de = e.en("derrumbo");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(PERSIA, undefined, undefined, AZUL, fuera(f, de, 24)), capa(A332), capa(A330, k(f, de - 4, 40), L.gaugamela)]} />
              <FlechaG cam={cam} ruta={R_GAUGAMELA} t={k(f, 0, ga + 6)} />
              <FlechaG cam={cam} ruta={DARIO_HUYE2} t={k(f, e.en("Dario"), 22)} color="#5aa0ff" grosor={13} />
              <Ciudad cam={cam} ll={L.gaugamela} nombre="Gaugamela" f={f} inicio={ga + 4} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Sello f={f} inicio={de} texto="Imperio persa: derrotado" x={540} y={1440} tam={56} giro={-6} />
        <Anio f={f} inicio={ga} texto="331 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  persepolis: ({ f }) => {
    const e = esc.persepolis;
    const cam = camino(f, 0, e.dur, P(45, 34, 4.0), P(49, 31.5, 4.2));
    const ba = e.en("Babilonia");
    const pe = e.en("Persepolis");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(proy, trazo) => {
            const p = proy(L.persepolis) as [number, number];
            return (
              <>
                <Zona trazo={trazo} cam={cam} capas={[capa(A330)]} />
                <FlechaG cam={cam} ruta={R_PERSIA} t={interpolate(f, [0, ba, pe], [0, 0.3, 1], clamp)} />
                <Ciudad cam={cam} ll={L.babilonia} nombre="Babilonia" f={f} inicio={ba} lado="izq" />
                <Fuego x={p[0]} y={p[1] - 14} f={f} inicio={e.en("quemo") + 6} />
                <Ciudad cam={cam} ll={L.persepolis} nombre="Persépolis" f={f} inicio={pe} hundida={e.en("quemo") + 6} lado="izq" />
              </>
            );
          }}
        </Mapa>
        <Vineta />
        <Sello f={f} inicio={pe + 6} texto="en llamas" x={560} y={1440} tam={74} giro={-8} />
        <Anio f={f} inicio={ba} texto="330 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  india: ({ f }) => {
    const e = esc.india;
    const cam = camino(f, 0, e.dur - 10, P(56, 33, 2.9), P(70, 33, 3.6));
    const ind = e.en("India");
    const po = e.en("Poro");
    const el = e.en("elefantes");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(proy, trazo) => {
            const h = proy(L.hidaspes) as [number, number];
            return (
              <>
                <Zona trazo={trazo} cam={cam} capas={[capa(A330), capa(ALEJANDRO, k(f, 4, ind + 10), L.persepolis)]} />
                <FlechaG cam={cam} ruta={R_INDIA} t={k(f, 0, ind + 6)} />
                <Rotulo cam={cam} ll={[78.5, 25.5]} texto="India" f={f} inicio={ind} tam={86} />
                <Ciudad cam={cam} ll={L.hidaspes} nombre="Hidaspes" f={f} inicio={po} lado="izq" />
                {[0, 1, 2].map((i) =>
                  f >= el - 4 + i * 4 ? <Elefante key={i} x={h[0] + 90 + i * 100} y={h[1] + 90 + (i % 2) * 60} s={1.5 * k(f, el - 4 + i * 4, 10)} espejo /> : null,
                )}
              </>
            );
          }}
        </Mapa>
        <Vineta />
        <Caja f={f} inicio={po} texto="Rey Poro" y={1440} tam={54} />
        <Anio f={f} inicio={e.en("326")} texto="326 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  motin: ({ f }) => {
    const e = esc.motin;
    const ne = e.en("nego");
    const vo = e.en("volver");
    const cam = camino(f, vo - 6, e.dur, P(73, 31, 3.8), P(62, 30, 2.7));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(proy, trazo) => {
            const b = proy(L.hifasis) as [number, number];
            return (
              <>
                <Zona trazo={trazo} cam={cam} capas={[capa(ALEJANDRO)]} />
                <FlechaG cam={cam} ruta={R_GANGES} t={interpolate(f, [0, ne - 4], [0.02, 0.42], clamp)} color="rgba(255,255,255,0.9)" grosor={12} />
                <Rotulo cam={cam} ll={[80.8, 26.6]} texto="Ganges" f={f} inicio={6} tam={60} />
                <Barrera x={b[0] + 34} y={b[1] - 12} f={f} inicio={ne} />
                <FlechaG cam={cam} ruta={R_VUELTA} t={k(f, vo - 2, e.dur - vo)} color="#ff4d42" />
              </>
            );
          }}
        </Mapa>
        <Vineta />
        <Caja f={f} inicio={e.en("agotado")} texto="8 años marchando" y={1380} fondo={NARANJA_CAJA} tam={46} giro={-2} />
        <Sello f={f} inicio={ne} texto="¡No seguimos!" x={540} y={1550} tam={72} giro={-8} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  muerte: ({ f }) => {
    const e = esc.muerte;
    const cam = camino(f, 0, 40, P(58, 30, 2.6), P(45, 33, 3.8));
    const mu = e.en("Murio");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(ALEJANDRO)]} />
              <Ciudad cam={cam} ll={L.babilonia} nombre="Babilonia" f={f} inicio={e.en("Babilonia")} hundida={mu + 2} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titular f={f} inicio={e.en("32")} texto={"SOLO\n32 AÑOS"} y={1300} tam={104} />
        <Anio f={f} inicio={e.en("323")} texto="323 a. C." />
        <Creditos />
      </AbsoluteFill>
    );
  },

  maximo: ({ f }) => {
    const e = esc.maximo;
    const mi = e.en("5");
    const ba = e.en("batalla");
    const cam = camino(f, 0, mi, P(45, 34, 3.2), P(46, 34, 1.9, 900));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(ALEJANDRO)]} />
              <Rotulo cam={cam} ll={[47, 37.6]} texto="Imperio de Alejandro" f={f} inicio={mi + 10} tam={66} />
            </>
          )}
        </Mapa>
        <Vineta />
        <Caja f={f} inicio={e.en("11")} texto="en solo 11 años" y={1240} tam={50} />
        <Contador f={f} inicio={mi} hasta={5} texto="MILLONES" y={1320} />
        <Linea f={f} inicio={mi + 6} texto="de km²" y={1460} tam={64} />
        <Caja f={f} inicio={ba - 6} texto="0 batallas perdidas" y={1650} fondo="#c62828" tam={52} giro={-2} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  final: ({ f }) => {
    const cam = P(interpolate(f, [0, 150], [30, 33]), 33, 2.1, 1080);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(proy, trazo) => {
            const ar = proy([45, 22]) as [number, number];
            const ca = proy([10.2, 36.9]) as [number, number];
            const ro = proy([12.5, 41.9]) as [number, number];
            const q = (p: [number, number], ini: number) =>
              f >= ini ? (
                <text x={p[0]} y={p[1] + 26} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={130 * k(f, ini, 10)} fill={AMARILLO} stroke="rgba(0,0,0,0.8)" strokeWidth={8} paintOrder="stroke">
                  ?
                </text>
              ) : null;
            return (
              <>
                <Zona trazo={trazo} cam={cam} capas={[capa(ALEJANDRO)]} />
                <FlechaG cam={cam} ruta={[L.babilonia, [46, 27], [45.5, 23.5]]} t={k(f, 16, 24)} color="rgba(255,255,255,0.9)" grosor={12} />
                <FlechaG cam={cam} ruta={[L.alejandria, [22, 32.6], [14, 34.5], [10.8, 36.4]]} t={k(f, 26, 26)} color="rgba(255,255,255,0.9)" grosor={12} />
                <FlechaG cam={cam} ruta={[L.pela, [19.5, 41.3], [16, 41.4], [13.2, 41.8]]} t={k(f, 36, 24)} color="rgba(255,255,255,0.9)" grosor={12} />
                {q(ar, 40)}
                {q(ca, 52)}
                {q(ro, 60)}
              </>
            );
          }}
        </Mapa>
        <Vineta />
        <Linea f={f} inicio={2} texto="¿Hasta dónde" y={270} tam={66} />
        <Linea f={f} inicio={8} texto="habría llegado" y={350} tam={66} />
        <Titular f={f} inicio={16} texto="ALEJANDRO?" y={440} tam={112} />
        <Caja f={f} inicio={64} texto="Comenta" y={1680} fondo={NARANJA_CAJA} tam={62} />
        <Creditos />
      </AbsoluteFill>
    );
  },
});

