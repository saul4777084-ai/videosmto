import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Dibujo } from "../comun/tipos";
import { LonLat } from "../comun/Globo";
import { CamaraT, mezclarT, Tierra } from "../comun/Tierra";
import { AZUL, Caja, Capa, Ciudad, Creditos, FlechaG, Linea, LineaG, NARANJA, Rotulo, Sello, Titular, Titulares, Zona } from "../comun/PiezasTierra";
import { MONTSERRAT } from "../comun/fuentes";
import type { Escenario, Ilustracion } from "./escenas";

// Estilo de los vídeos de mapas virales: mapa plano con satélite oscuro, el imperio en naranja rayado con
// borde blanco brillante, rótulos grandes inclinados, titulares amarillos y cajas.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.inOut(Easing.cubic);
const NARANJA_CAJA = "#d9773a";
const P = (lon: number, lat: number, zoom: number, y = 1010): CamaraT => ({ lon, lat, zoom, y, plana: true });
const camino = (f: number, desde: number, hasta: number, a: CamaraT, b: CamaraT) => mezclarT(a, b, interpolate(f, [desde, hasta], [0, 1], { ...clamp, easing: suave }));
const k = (f: number, desde: number, dur = 30) => interpolate(f, [desde, desde + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

const Vineta = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 52%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />;

// ---------- el imperio por etapas (aproximado; anillos en sentido horario, se recortan con la costa) ----------

const E1206: LonLat[] = [[88, 49], [90, 52], [98, 52.5], [104, 52.5], [110, 51.5], [117, 50.5], [121, 49], [119, 46], [113, 44], [107, 42.5], [100, 42.5], [95, 44], [90, 45.5], [88, 49]];

const E1227: LonLat[] = [
  [51, 45], [55, 50], [62, 52], [70, 54], [78, 54], [86, 53.5], [94, 53], [104, 53], [112, 52.5], [120, 52], [126, 50], [124, 45], [122, 41.5], [119, 39.5],
  [117, 38.3], [114, 37], [110, 38.5], [106, 36], [102, 35], [98, 37], [94, 38], [88, 38.5], [80, 36], [75, 35], [71, 33], [68, 31], [64, 31], [60, 32.5],
  [57, 35.5], [54, 37], [51, 38], [50, 42], [51, 45],
];

const E1241: LonLat[] = [
  [26, 48], [24, 50.5], [26, 52], [30, 55], [33, 57.5], [38, 59.5], [46, 61], [56, 60.5], [64, 58], [74, 56], [84, 55], [94, 55], [104, 56], [114, 55.5],
  [124, 54.5], [132, 51], [134, 47], [131, 43], [129.5, 42.3], [129.8, 38.5], [129.3, 35.3], [126.3, 34.4], [125.5, 37.5], [124.3, 39.8], [121.5, 39.5],
  [119.5, 37.5], [121, 36.7], [119.3, 34.8], [119.5, 33.8], [116, 33.2], [113, 33], [110, 33.3], [106, 33], [104, 34.5], [101, 36], [98, 37], [94, 38],
  [88, 38.5], [80, 36], [75, 35], [71, 33], [68, 31], [64, 31], [60, 30], [57, 30.5], [54, 31.5], [50, 33], [47.5, 35], [46, 37.5], [44, 39], [42, 41],
  [39, 43.5], [37, 45], [33.5, 45.3], [31, 46.5], [29, 46], [26, 48],
];

const E1259: LonLat[] = [
  [26, 48], [24, 50.5], [26, 52], [30, 55], [33, 57.5], [38, 59.5], [46, 61], [56, 60.5], [64, 58], [74, 56], [84, 55], [94, 55], [104, 56], [114, 55.5],
  [124, 54.5], [132, 51], [134, 47], [131, 43], [129.5, 42.3], [129.8, 38.5], [129.3, 35.3], [126.3, 34.4], [125.5, 37.5], [124.3, 39.8], [121.5, 39.5],
  [119.5, 37.5], [121, 36.7], [119.3, 34.8], [119.5, 33.8], [116, 33.2], [113, 33], [110, 33.3], [106, 32.8], [104, 30], [104.5, 27], [104.3, 24.5],
  [104, 22.7], [102, 21.8], [100.5, 21.4], [98.7, 24], [98.2, 26], [97.5, 28.2], [95, 29], [92, 27.9], [89, 27.3], [86, 27.9], [82, 29.6], [79.5, 30.8],
  [77.3, 32.8], [74.5, 33.5], [72, 32.5], [70.5, 30.5], [69.5, 28.5], [67.6, 25.5], [66.5, 25.3], [62, 24.8], [57.5, 25.2], [56.2, 26.8], [54, 26.2],
  [51, 27.2], [49, 29.6], [48, 29.9], [46, 31], [44, 31.5], [42, 33.5], [40.5, 34.6], [39, 36], [38, 36.9], [36, 36.6], [34, 36.2], [32, 36.1],
  [30.5, 36.5], [29, 37.2], [28, 38], [29.5, 40.5], [31.5, 41.2], [29, 45], [26, 48],
];

const E1279: LonLat[] = [
  [29, 45], [27.5, 48.5], [25.5, 51.5], [30, 55], [33, 57.5], [38, 59.5], [46, 61.5], [56, 61], [64, 58.5], [74, 56.5], [84, 55.5],
  [94, 55], [104, 56.5], [114, 56], [124, 55], [134, 53], [142, 50], [138, 47], [133, 43.5], [131.5, 42], [130.8, 40], [130.5, 36.5],
  [129.2, 34.9], [126, 33], [124, 30], [123, 27], [120.5, 24], [118, 22], [113.5, 20.5], [111, 17.8], [108.5, 18], [107.8, 21.5],
  [106, 22.9], [104, 22.6], [102, 21.8], [100.5, 21.4], [98.7, 24], [98.2, 26], [97.5, 28.2], [95, 29], [92, 27.9], [89, 27.3],
  [86, 27.9], [82, 29.6], [79.5, 30.8], [77.3, 32.8], [74.5, 33.5], [72, 32.5], [70.5, 30.5], [69.5, 28.5], [67.6, 25.5], [66.5, 25.3],
  [62, 24.8], [57.5, 25.2], [56.2, 26.8], [54, 26.2], [51, 27.2], [49, 29.6], [48, 29.9], [46, 31], [44, 31.5], [42, 33.5], [40.5, 34.6],
  [39, 36], [38, 36.9], [36, 36.6], [34, 36.2], [32, 36.1], [30.5, 36.5], [29, 37.2], [28, 38], [29.5, 40.5], [31.5, 41.2], [29, 45],
];

// Imperio de Alejandro Magno (hacia 323 a. C., aproximado)
const ALEJANDRO: LonLat[] = [
  [19.5, 41.8], [23, 42.3], [26.5, 41.8], [28.5, 41.3], [31, 41.2], [35, 42], [41, 41.5], [46, 41.8], [50, 41], [54, 38], [59, 38.3], [64, 40.5],
  [69, 41.2], [71.5, 40], [71.2, 36.5], [74, 35], [75.5, 32], [74, 29], [71, 26], [68, 24], [66, 25.2], [62, 25], [58, 25.5], [56.3, 26.8],
  [54, 26.5], [51, 27.5], [49, 29.7], [47.5, 30], [45, 30.5], [40, 31.5], [37, 29.5], [35, 28], [33.5, 27.5], [32.6, 24], [31, 22], [28, 24],
  [25, 29], [25, 31.6], [22, 32.8], [21, 37], [19.5, 41.8],
];

const capa = (poligono: LonLat[], revelar?: number, desde?: LonLat, color = NARANJA): Capa => ({ poligono, color, revelar, desde });

const L: Record<string, LonLat> = {
  nacimiento: [111.2, 48.9],
  karakorum: [102.8, 47.2],
  pekin: [116.4, 39.9],
  samarcanda: [66.97, 39.65],
  bujara: [64.42, 39.77],
  tumba: [108.9, 48.8],
  kiev: [30.52, 50.45],
  mohi: [20.9, 47.98],
  bagdad: [44.36, 33.31],
  hakata: [130.4, 33.6],
  hapo: [128.6, 35.1],
};

const MURALLA: LonLat[] = [
  [97.9, 39.8], [100.5, 38.9], [102.6, 37.9], [104.3, 37.4], [106.3, 38.5], [107.5, 38.2], [109.6, 38.3], [110.7, 39.4], [111.6, 40.3], [113.0, 40.4],
  [114.6, 40.6], [115.8, 40.4], [117.2, 40.6], [118.8, 40.1], [119.8, 40.0],
];

// remolino de tormenta
const Tormenta: React.FC<{ x: number; y: number; f: number; inicio: number; tam?: number }> = ({ x, y, f, inicio, tam = 90 }) => {
  if (f < inicio) return null;
  const s = k(f, inicio, 14);
  const giro = (f - inicio) * 9;
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`} opacity={0.95} style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
      {[0, 120, 240].map((a) => (
        <path key={a} transform={`rotate(${a})`} d={`M 0 0 Q ${tam * 0.5} ${-tam * 0.2} ${tam * 0.55} ${-tam * 0.75}`} fill="none" stroke="#e8f4ff" strokeWidth={12} strokeLinecap="round" />
      ))}
      <circle r={tam * 0.16} fill="#e8f4ff" />
    </g>
  );
};

// barco que se hunde al final de la flecha
const Hundido: React.FC<{ x: number; y: number; f: number; inicio: number }> = ({ x, y, f, inicio }) => {
  if (f < inicio) return null;
  const t = k(f, inicio, 24);
  return (
    <g transform={`translate(${x} ${y + t * 26}) rotate(${t * 28})`} opacity={1 - t * 0.7}>
      <path d="M -34 0 L 34 0 L 24 16 L -24 16 Z" fill="#6b3f22" stroke="#fff" strokeWidth={3} />
      <rect x={-3} y={-44} width={6} height={44} fill="#fff" />
      <path d="M 3 -40 L 28 -16 L 3 -16 Z" fill="#fff" />
    </g>
  );
};

const Mapa: React.FC<React.ComponentProps<typeof Tierra>> = (props) => <Tierra estilo="mapa" fronteras={0} fuentes={["mundo", "asia"]} {...props} />;

// ---------- escenas ----------

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> => ({
  gancho: ({ f }) => {
    const cam = P(interpolate(f, [0, 126], [84, 80]), 40, interpolate(f, [0, 126], [1.25, 1.35]), 1080);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>{(_p, trazo) => <Zona trazo={trazo} cam={cam} capas={[capa(E1279, k(f, 4, 40), L.karakorum)]} />}</Mapa>
        <Vineta />
        <Linea f={f} inicio={3} texto="El imperio más grande" y={290} tam={62} />
        <Titular f={f} inicio={14} texto="DE LA HISTORIA" y={378} tam={104} />
        <Caja f={f} inicio={30} texto="lo fundó un niño abandonado" y={545} fondo="#d6283c" tam={46} giro={-3} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  nace: ({ f }) => {
    const e = esc.nace;
    const cam = camino(f, 0, 50, P(98, 46, 2.4), P(109, 48.4, 5.6));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {() => (
            <>
              <Rotulo cam={cam} ll={[104.5, 46.6]} texto="Mongolia" f={f} inicio={e.en("Mongolia")} tam={88} giro={-4} />
              <Ciudad cam={cam} ll={L.nacimiento} nombre="Temuyín" f={f} inicio={e.en("Temuyin")} />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "En 1162", tipo: "caja", en: e.en("1162") },
          { texto: "Nace Temuyín", tipo: "grande", en: e.en("Temuyin") },
          { texto: "En las estepas de Mongolia", tipo: "blanco", en: e.en("estepas") },
        ]} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  abandono: ({ f }) => {
    const e = esc.abandono;
    const cam = camino(f, 0, e.dur, P(108.5, 48.5, 5.6), P(108, 48.6, 6.2));
    const ab = e.en("abandono");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {() => (
            <>
              <FlechaG cam={cam} ruta={[[110.6, 49.1], [107.5, 50.2], [104.5, 50.6]]} t={k(f, ab - 6, 26)} color="#ff4d42" />
              <Rotulo cam={cam} ll={[105, 51.2]} texto="Su tribu" f={f} inicio={ab + 10} tam={50} giro={-4} />
              <Ciudad cam={cam} ll={L.nacimiento} nombre="Su familia" f={f} inicio={e.en("familia")} lado="der" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "Envenenan a su padre", tipo: "caja", en: e.en("Envenenaron") },
          { texto: "Abandonados", tipo: "grande", en: ab },
          { texto: "Él y su familia, solos", tipo: "rojo", en: e.en("familia") },
        ]} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  gengis: ({ f }) => {
    const e = esc.gengis;
    const cam = camino(f, 0, e.dur, P(104, 47, 2.9), P(104, 47, 3.3));
    const un = e.en("unio");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(E1206, k(f, un, 34), L.karakorum)]} />
              <Ciudad cam={cam} ll={L.karakorum} nombre="Karakórum" f={f} inicio={un + 20} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "En 1206", tipo: "caja", en: e.en("1206") },
          { texto: "Gengis Kan", tipo: "grande", en: e.en("Gengis") },
          { texto: "Une a todas las tribus", tipo: "naranja", en: un },
        ]} />
        <Linea f={f} inicio={e.en("Gengis") + 8} texto="«señor universal»" y={1560} tam={46} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  muralla: ({ f }) => {
    const e = esc.muralla;
    const cam = camino(f, 0, e.dur, P(106, 44, 3.0), P(112, 42, 3.9));
    const cr = e.en("Cruzo");
    const pk = e.en("Pekin");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(E1206)]} />
              <LineaG trazo={trazo} ruta={MURALLA} t={k(f, 0, 30)} color="#e3cf96" grosor={9} />
              <Rotulo cam={cam} ll={[106.5, 37.2]} texto="Gran Muralla" f={f} inicio={e.en("Gran")} tam={46} giro={6} />
              <FlechaG cam={cam} ruta={[[106, 45.5], [111, 43], [116.4, 40.2]]} t={k(f, cr, pk - cr + 6)} />
              <Ciudad cam={cam} ll={L.pekin} nombre="Pekín" f={f} inicio={pk} />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "En 1215", tipo: "caja", en: e.en("1215") },
          { texto: "Cae Pekín", tipo: "grande", en: pk },
          { texto: "Cruza la Gran Muralla", tipo: "naranja", en: cr },
        ]} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  corasmia: ({ f }) => {
    const e = esc.corasmia;
    const cam = camino(f, 0, e.dur, P(88, 43, 2.0), P(74, 41, 2.7));
    const ar = e.en("arraso");
    const sa = e.en("Samarcanda");
    const bu = e.en("Bujara");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(E1206), capa(E1227, k(f, ar, 40), [80, 43])]} />
              <FlechaG cam={cam} ruta={[[96, 46], [84, 44.5], [74, 41.5], [67.6, 39.8]]} t={k(f, 4, sa - 4)} />
              <Ciudad cam={cam} ll={L.samarcanda} nombre="Samarcanda" f={f} inicio={sa} hundida={sa + 8} />
              <Ciudad cam={cam} ll={L.bujara} nombre="Bujará" f={f} inicio={bu} hundida={bu + 8} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "En 1219", tipo: "caja", en: e.en("1219") },
          { texto: "Arrasa Asia Central", tipo: "grande", en: ar },
          { texto: "Samarcanda y Bujará", tipo: "blanco", en: sa },
        ]} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  muerte: ({ f }) => {
    const e = esc.muerte;
    const cam = camino(f, 0, 40, P(86, 43, 1.7), P(104, 47, 3.2));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(E1227)]} />
              <Ciudad cam={cam} ll={L.tumba} nombre="¿Su tumba?" f={f} inicio={e.en("tumba")} />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "En 1227", tipo: "caja", en: e.en("1227") },
          { texto: "Muere Gengis Kan", tipo: "grande", en: e.en("Murio") },
          { texto: "Su tumba, sin encontrar", tipo: "rojo", en: e.en("tumba") },
        ]} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  europa: ({ f }) => {
    const e = esc.europa;
    const cam = camino(f, 0, e.dur, P(48, 48, 1.9), P(36, 49, 2.4));
    const ki = e.en("Kiev");
    const hu = e.en("Hungria");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(E1227), capa(E1241, k(f, e.en("nietos"), 40), [55, 50])]} />
              <FlechaG cam={cam} ruta={[[56, 52], [44, 51.5], [31.5, 50.5], [25, 49], [21.4, 48.1]]} t={interpolate(f, [4, ki, hu + 4], [0, 0.6, 1], clamp)} />
              <Ciudad cam={cam} ll={L.kiev} nombre="Kiev" f={f} inicio={ki} />
              <Rotulo cam={cam} ll={[19.2, 46.6]} texto="Hungría" f={f} inicio={hu} tam={52} giro={-5} />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "Sus nietos", tipo: "caja", en: e.en("nietos") },
          { texto: "Llegan a Europa", tipo: "grande", en: e.en("llegaron") },
          { texto: "Kiev y Hungría · 1241", tipo: "blanco", en: ki },
        ]} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  bagdad: ({ f }) => {
    const e = esc.bagdad;
    const cam = camino(f, 0, e.dur, P(54, 37, 2.4), P(48, 35, 3.0));
    const ca = e.en("cayo");
    const bg = e.en("Bagdad");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(E1241), capa(E1259, k(f, ca, 40), [58, 36])]} />
              <FlechaG cam={cam} ruta={[[59, 37], [52, 35.5], [45.2, 33.6]]} t={k(f, 4, bg)} />
              <Ciudad cam={cam} ll={L.bagdad} nombre="Bagdad" f={f} inicio={bg} hundida={bg + 10} lado="izq" />
            </>
          )}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "En 1258", tipo: "caja", en: e.en("1258") },
          { texto: "Cae Bagdad", tipo: "grande", en: ca },
          { texto: "La joya del mundo islámico", tipo: "blanco", en: e.en("joya") },
        ]} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  maximo: ({ f }) => {
    const e = esc.maximo;
    const co = e.en("conquisto");
    const mi = e.en("24");
    const cam = camino(f, 0, mi, P(108, 32, 2.2, 980), P(84, 42, 1.3, 1000));
    const v = Math.round(interpolate(f, [mi, mi + 30], [0, 24], { ...clamp, easing: Easing.out(Easing.cubic) }));
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => <Zona trazo={trazo} cam={cam} capas={[capa(E1259), capa(E1279, k(f, co, 36), [114, 28])]} />}
        </Mapa>
        <Vineta />
        {f >= mi && (
          <div style={{ position: "absolute", top: 1300, left: 0, right: 0, textAlign: "center", fontFamily: MONTSERRAT, fontWeight: 900, fontSize: 108, whiteSpace: "nowrap", color: "#ffe23a", fontVariantNumeric: "tabular-nums", textShadow: "0 0 30px rgba(255,226,58,0.7), 0 10px 26px rgba(0,0,0,0.7)" }}>
            {v} MILLONES
          </div>
        )}
        <Linea f={f} inicio={mi + 6} texto="de km²" y={1440} tam={64} />
        <Caja f={f} inicio={mi + 24} texto="más que toda Sudamérica" y={1620} fondo={NARANJA_CAJA} tam={44} giro={-2} />
        <Titulares f={f} partes={[
          { texto: "En 1279", tipo: "caja", en: e.en("1279") },
          { texto: "Toda China", tipo: "grande", en: e.en("China") },
          { texto: "Kublai Kan", tipo: "naranja", en: e.en("Kublai") },
        ]} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  japon: ({ f }) => {
    const e = esc.japon;
    const cam = camino(f, 0, e.dur, P(131, 35.5, 4.0), P(131, 35, 4.6));
    const ja = e.en("Japon");
    const segunda = e.en("veces", 2);
    const tor = e.en("tormentas");
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(proy, trazo) => {
            const h = proy(L.hakata) as [number, number];
            return (
              <>
                <Zona trazo={trazo} cam={cam} capas={[capa(E1279)]} />
                <Rotulo cam={cam} ll={[136.5, 35.9]} texto="Japón" f={f} inicio={ja} tam={84} giro={-32} />
                <FlechaG cam={cam} ruta={[L.hapo, [129.4, 34.5], [130.1, 33.9]]} t={k(f, 6, 26)} color="#ff4d42" />
                <FlechaG cam={cam} ruta={[[128.9, 35.6], [129.9, 34.9], [130.5, 34.1]]} t={k(f, segunda, 26)} color="#ff4d42" />
                <Tormenta x={h[0] + 10} y={h[1] + 20} f={f} inicio={tor - 14} tam={110} />
                <Hundido x={h[0] - 40} y={h[1] + 10} f={f} inicio={tor} />
              </>
            );
          }}
        </Mapa>
        <Vineta />
        <Titulares f={f} partes={[
          { texto: "Dos intentos", tipo: "caja", en: e.en("Dos") },
          { texto: "Invadir Japón", tipo: "grande", en: e.en("invadir") },
          { texto: "Las tormentas lo impiden", tipo: "rojo", en: tor },
        ]} />
        <Caja f={f} inicio={8} texto="1274" y={1360} x={330} tam={60} />
        <Caja f={f} inicio={segunda} texto="1281" y={1360} x={750} tam={60} />
        <Sello f={f} inicio={tor + 4} texto="kamikaze" x={540} y={1560} tam={78} giro={-8} />
        <Linea f={f} inicio={tor + 14} texto="«viento divino»" y={1680} tam={44} />
        <Creditos />
      </AbsoluteFill>
    );
  },

  final: ({ f }) => {
    const cam = P(interpolate(f, [0, 150], [70, 76]), 38, 1.22, 1120);
    return (
      <AbsoluteFill>
        <Mapa camara={cam} f={f}>
          {(_p, trazo) => (
            <>
              <Zona trazo={trazo} cam={cam} capas={[capa(E1279), { poligono: ALEJANDRO, color: AZUL, revelar: k(f, 20, 30), desde: [45, 33] }]} />
              <Rotulo cam={cam} ll={[100, 47]} texto="Gengis Kan" f={f} inicio={10} tam={58} giro={-4} />
              <Rotulo cam={cam} ll={[47, 31]} texto="Alejandro" f={f} inicio={30} tam={54} giro={-4} />
            </>
          )}
        </Mapa>
        <Vineta />
        <Linea f={f} inicio={2} texto="¿Quién fue más grande?" y={270} tam={62} />
        <Titular f={f} inicio={10} texto="GENGIS KAN" y={360} tam={92} />
        <Linea f={f} inicio={22} texto="o" y={478} tam={52} />
        <Titular f={f} inicio={30} texto="ALEJANDRO MAGNO" y={550} tam={78} color="#8cc8ff" brillo="rgba(120,190,255,0.7)" />
        <Caja f={f} inicio={52} texto="Comenta" y={1680} fondo={NARANJA_CAJA} tam={62} />
        <Creditos />
      </AbsoluteFill>
    );
  },
});
