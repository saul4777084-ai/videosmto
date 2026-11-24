import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";
import { Dibujo } from "../comun/tipos";
import { LonLat, puntoEnRuta } from "../comun/Globo";
import { aPantallaT, CamaraT, mezclarT, Tierra } from "../comun/Tierra";
import { Caja, Ciudad, Creditos, FlechaG, LineaG, Linea, NARANJA, Rotulo, Sello, Titular, VERDE, Zona } from "../comun/PiezasNapoleon";
import { Barco } from "../Colon/Barco";
import { Corona } from "../Colon/Ilustraciones";
import type { Escenario, Ilustracion } from "./escenas";

// Estilo Napoleón: mapa dibujado (tierra verde, mar azul), etiquetas azul marino, años dorados serif, chips y sellos.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.inOut(Easing.cubic);
const NARANJA_CAJA = "#d9773a";
const ROJO_CAJA = "#c62828";
// zoom: unos 137 / (grados de longitud que caben a lo ancho)
const P = (lon: number, lat: number, zoom: number, y = 1010): CamaraT => ({ lon, lat, zoom, y, plana: true });
const camino = (f: number, desde: number, hasta: number, a: CamaraT, b: CamaraT) => mezclarT(a, b, interpolate(f, [desde, hasta], [0, 1], { ...clamp, easing: suave }));
const k = (f: number, desde: number, dur = 30) => interpolate(f, [desde, desde + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

const Vineta = () => <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.5) 100%)" }} />;

// ---------- lugares ----------

const L: Record<string, LonLat> = {
  cuba: [-81.6, 22.55],
  veracruz: [-96.13, 19.19],
  cempoala: [-96.4, 19.44],
  xalapa: [-96.92, 19.54],
  tlaxcala: [-98.24, 19.32],
  cholula: [-98.3, 19.06],
  paso: [-98.66, 19.08],
  amecameca: [-98.77, 19.13],
  iztapalapa: [-99.095, 19.335],
  tenochtitlan: [-99.133, 19.433],
  tlacopan: [-99.19, 19.46],
  tepeyac: [-99.117, 19.487],
  otumba: [-98.75, 19.7],
};

const TRAVESIA: LonLat[] = [
  [-84.95, 21.86], [-86.2, 21.0], [-86.95, 20.45], [-86.7, 21.7], [-88.5, 21.9], [-90.5, 21.6], [-91.0, 20.2], [-91.9, 18.9],
  [-92.65, 18.7], [-94.3, 18.4], [-95.4, 19.0], [-96.06, 19.22],
];
const MARCHA_COSTA: LonLat[] = [L.veracruz, L.cempoala, L.xalapa, [-97.4, 19.5], [-97.9, 19.4], L.tlaxcala];
const MARCHA_VALLE: LonLat[] = [L.tlaxcala, L.cholula, L.paso, L.amecameca, [-98.98, 19.28], L.iztapalapa, L.tenochtitlan];
const HUIDA: LonLat[] = [L.tenochtitlan, L.tlacopan, [-99.22, 19.56], [-99.1, 19.7], [-98.9, 19.72], L.otumba, [-98.45, 19.55]];

// Imperio mexica hacia 1519 (aproximado) y aliados
const MEXICA: LonLat[] = [
  [-100.8, 20.3], [-99.5, 21.2], [-98.0, 21.0], [-97.3, 20.7], [-96.3, 19.8], [-95.6, 18.8], [-95.0, 18.0], [-94.6, 17.2], [-95.5, 16.4],
  [-97.0, 15.9], [-98.5, 16.3], [-100.0, 17.0], [-101.4, 17.7], [-101.6, 18.8], [-100.8, 20.3],
];
const TLAXCALA: LonLat[] = [[-98.55, 19.55], [-97.9, 19.6], [-97.75, 19.2], [-98.25, 19.08], [-98.6, 19.3], [-98.55, 19.55]];
const TOTONACAS: LonLat[] = [[-97.1, 20.2], [-96.4, 20.1], [-96.05, 19.4], [-96.6, 19.15], [-97.1, 19.6], [-97.1, 20.2]];
// lago de Texcoco y lagos del sur en 1519 (aproximado)
const LAGO: LonLat[] = [
  [-99.115, 19.49], [-99.09, 19.55], [-99.06, 19.61], [-99.0, 19.635], [-98.95, 19.6], [-98.93, 19.52], [-98.94, 19.44], [-98.98, 19.37],
  [-99.04, 19.33], [-98.98, 19.295], [-98.9, 19.285], [-98.86, 19.255], [-98.9, 19.225], [-99.0, 19.235], [-99.1, 19.25], [-99.16, 19.27],
  [-99.12, 19.3], [-99.09, 19.33], [-99.13, 19.37], [-99.17, 19.41], [-99.175, 19.45], [-99.15, 19.475], [-99.115, 19.49],
];

const capa = (poligono: LonLat[], color: string, revelar?: number, desde?: LonLat) => ({ poligono, color, revelar, desde });

// ---------- piezas propias ----------

type Trazo = Parameters<NonNullable<React.ComponentProps<typeof Tierra>["children"]>>[1];

// el lago con la isla de Tenochtitlan y sus calzadas
const Lago: React.FC<{ trazo: Trazo; cam: CamaraT; opacidad?: number }> = ({ trazo, cam, opacidad = 1 }) => {
  if (opacidad <= 0) return null;
  const d = trazo({ type: "Polygon", coordinates: [LAGO] }) ?? "";
  const c = aPantallaT(cam, L.tenochtitlan)!;
  const borde = aPantallaT(cam, [L.tenochtitlan[0] + 0.022, L.tenochtitlan[1]])!;
  const r = Math.max(4, borde[0] - c[0]);
  return (
    <g opacity={opacidad}>
      <path d={d} fill="#2f78b4" stroke="#bfe3ff" strokeWidth={3} strokeLinejoin="round" />
      {[L.tlacopan, L.tepeyac, L.iztapalapa].map((p, i) => (
        <LineaG key={i} trazo={trazo} ruta={[L.tenochtitlan, p]} t={1} color="#e8d9a8" grosor={Math.max(3, r * 0.22)} />
      ))}
      <circle cx={c[0]} cy={c[1]} r={r} fill="#d9c58f" stroke="#7a5c2e" strokeWidth={3} />
      <rect x={c[0] - r * 0.25} y={c[1] - r * 0.25} width={r * 0.5} height={r * 0.5} fill="#b5523b" stroke="#5a2a1a" strokeWidth={2} />
    </g>
  );
};

const BarcoEn: React.FC<{ cam: CamaraT; ll: LonLat; f: number; escala: number; fase?: number; hundir?: number; haciaEste?: boolean }> = ({
  cam,
  ll,
  f,
  escala,
  fase = 0,
  hundir,
  haciaEste = false,
}) => {
  const p = aPantallaT(cam, ll);
  if (!p) return null;
  const t = hundir !== undefined ? k(f, hundir, 26) : 0;
  return (
    <g transform={`translate(0 ${t * 60 * escala * 4}) rotate(${t * 24} ${p[0]} ${p[1]})`} opacity={1 - t * 0.85}>
      <Barco x={p[0]} y={p[1]} escala={escala} f={f} fase={fase} haciaEste={haciaEste} />
    </g>
  );
};

// ---------- escenas ----------

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>): Record<Ilustracion, Dibujo> => {
  const Mapa: React.FC<React.ComponentProps<typeof Tierra>> = (props) => (
    <Tierra estilo="dibujo" fronteras={0.5} fuentes={["mundo", "america_norte", "mexico", "valle"]} {...props} />
  );
  return {
    gancho: ({ f }) => {
      const cam = P(-98.2, 18.9, interpolate(f, [0, 126], [16, 19]), 1120);
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => (
              <>
                <Zona trazo={trazo} cam={cam} capas={[capa(MEXICA, NARANJA, k(f, 4, 40), L.tenochtitlan)]} />
                <Ciudad cam={cam} ll={L.tenochtitlan} nombre="Tenochtitlan" f={f} inicio={30} />
              </>
            )}
          </Mapa>
          <Vineta />
          <Linea f={f} inicio={3} texto="Con 500 hombres" y={290} tam={64} />
          <Titular f={f} inicio={14} texto={"DERROTÓ A\nUN IMPERIO"} y={370} tam={104} />
          <Caja f={f} inicio={30} texto="de millones de personas" y={640} fondo={ROJO_CAJA} tam={44} giro={-3} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    zarpa: ({ f }) => {
      const e = esc.zarpa;
      const cam = camino(f, 0, e.dur, P(-88.6, 21.2, 6.2), P(-89.6, 20.6, 6.8));
      const t = interpolate(f, [6, e.dur - 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {() => (
              <>
                <Rotulo cam={cam} ll={L.cuba} texto="Cuba" f={f} inicio={e.en("Cuba")} />
                <Rotulo cam={cam} ll={[-91.5, 24.6]} texto="Golfo de México" f={f} inicio={4} />
                <FlechaG cam={cam} ruta={TRAVESIA} t={t} />
                <BarcoEn cam={cam} ll={puntoEnRuta(TRAVESIA, t)} f={f} escala={0.32} />
              </>
            )}
          </Mapa>
          <Vineta />
          <Titular f={f} inicio={e.en("1519")} texto="1519" y={430} tam={120} />
          <Caja f={f} inicio={e.en("11")} texto="11 barcos · 500 hombres · 16 caballos" y={1640} tam={40} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    veracruz: ({ f }) => {
      const e = esc.veracruz;
      const cam = camino(f, 0, e.dur, P(-96.45, 19.3, 70), P(-96.4, 19.28, 82));
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {() => (
              <>
                <Rotulo cam={cam} ll={[-96.85, 19.72]} texto="México" f={f} inicio={e.en("Mexico")} />
                {[[-95.92, 19.24], [-95.86, 19.33], [-95.98, 19.12]].map((ll, i) => (
                  <BarcoEn key={i} cam={cam} ll={ll as LonLat} f={f} escala={0.3} fase={i * 11} />
                ))}
                <Ciudad cam={cam} ll={L.veracruz} nombre="Veracruz" f={f} inicio={e.en("Veracruz")} lado="izq" />
              </>
            )}
          </Mapa>
          <Vineta />
          <Caja f={f} inicio={e.en("Veracruz") + 6} texto="Villa Rica de la Vera Cruz" y={1640} fondo={NARANJA_CAJA} tam={42} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    barcos: ({ f }) => {
      const e = esc.barcos;
      const cam = P(-96.4, 19.28, 82 + f * 0.05);
      const h = e.en("hundio");
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {() => (
              <>
                {[[-95.92, 19.24], [-95.86, 19.33], [-95.98, 19.12]].map((ll, i) => (
                  <BarcoEn key={i} cam={cam} ll={ll as LonLat} f={f} escala={0.3} fase={i * 11} hundir={h + i * 7} />
                ))}
                <Ciudad cam={cam} ll={L.veracruz} nombre="Veracruz" f={f} inicio={0} lado="izq" />
              </>
            )}
          </Mapa>
          <Vineta />
          <Sello f={f} inicio={h + 16} texto="¡Sin vuelta atrás!" x={540} y={1560} tam={64} giro={-8} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    aliados: ({ f }) => {
      const e = esc.aliados;
      const cam = camino(f, 0, e.dur, P(-97.2, 19.45, 34), P(-97.5, 19.4, 40));
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => (
              <>
                <Zona
                  trazo={trazo}
                  cam={cam}
                  capas={[capa(MEXICA, NARANJA), capa(TOTONACAS, VERDE, k(f, e.en("totonacas"), 24), L.cempoala), capa(TLAXCALA, VERDE, k(f, e.en("tlaxcaltecas"), 24), L.tlaxcala)]}
                />
                <FlechaG cam={cam} ruta={MARCHA_COSTA} t={interpolate(f, [6, e.dur - 10], [0, 1], clamp)} />
                <Rotulo cam={cam} ll={[-96.75, 19.95]} texto="Totonacas" f={f} inicio={e.en("totonacas")} />
                <Rotulo cam={cam} ll={[-98.2, 19.62]} texto="Tlaxcala" f={f} inicio={e.en("tlaxcaltecas")} />
                <Rotulo cam={cam} ll={[-98.9, 19.0]} texto="Mexicas" f={f} inicio={e.en("mexicas")} />
              </>
            )}
          </Mapa>
          <Vineta />
          <Caja f={f} inicio={e.en("enemigos")} texto="Enemigos de los mexicas" y={1640} fondo={ROJO_CAJA} tam={44} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    tenochtitlan: ({ f }) => {
      const e = esc.tenochtitlan;
      const te = e.en("Tenochtitlan");
      const cam = camino(f, te - 20, te + 24, P(-98.75, 19.25, 46), P(-99.07, 19.4, 165));
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => (
              <>
                <Lago trazo={trazo} cam={cam} />
                <FlechaG cam={cam} ruta={MARCHA_VALLE} t={interpolate(f, [4, te], [0, 1], clamp)} grosor={14} />
                <Rotulo cam={cam} ll={[-98.62, 18.97]} texto="Popocatépetl" f={f} inicio={6} salida={te - 10} />
                <Rotulo cam={cam} ll={[-98.64, 19.22]} texto="Iztaccíhuatl" f={f} inicio={12} salida={te - 10} />
                <Ciudad cam={cam} ll={L.tenochtitlan} nombre="Tenochtitlan" f={f} inicio={te} lado="izq" />
              </>
            )}
          </Mapa>
          <Vineta />
          <Caja f={f} inicio={e.en("lago")} texto="≈ 200.000 habitantes" y={1640} fondo={NARANJA_CAJA} tam={46} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    moctezuma: ({ f }) => {
      const e = esc.moctezuma;
      const cam = camino(f, 0, e.dur, P(-99.12, 19.42, 230), P(-99.125, 19.425, 270));
      const mo = e.en("Moctezuma");
      const re = e.en("regalos");
      const pr = e.en("prisionero");
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => {
              const c = aPantallaT(cam, L.tenochtitlan)!;
              const sc = k(f, mo, 14);
              const caida = k(f, pr, 16);
              return (
                <>
                  <Lago trazo={trazo} cam={cam} />
                  <g opacity={1 - caida * 0.55}>
                    <Corona x={c[0]} y={c[1] - 150 + caida * 30} s={0.9 * sc} />
                  </g>
                  {[0, 1, 2, 3, 4].map((i) => {
                    if (f < re + i * 4) return null;
                    const t = k(f, re + i * 4, 18);
                    return <circle key={i} cx={c[0] - 160 + i * 80} cy={c[1] + 120 - t * 30} r={22 * t} fill="#ffc400" stroke="#8d6e00" strokeWidth={5} />;
                  })}
                  <Rotulo cam={cam} ll={[L.tenochtitlan[0], L.tenochtitlan[1] + 0.045]} texto="Moctezuma" f={f} inicio={mo} />
                </>
              );
            }}
          </Mapa>
          <Vineta />
          <Sello f={f} inicio={pr} texto="Prisionero" x={540} y={1560} tam={78} giro={-8} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    noche: ({ f }) => {
      const e = esc.noche;
      const cam = camino(f, 0, e.dur, P(-99.02, 19.5, 150), P(-98.95, 19.52, 130));
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => (
              <>
                <Lago trazo={trazo} cam={cam} />
                <rect width={1080} height={1920} fill="rgba(6,10,40,0.5)" />
                <circle cx={860} cy={560} r={58} fill="#fff6d5" opacity={0.9} />
                <circle cx={884} cy={545} r={52} fill="rgba(6,10,40,0.95)" />
                <FlechaG cam={cam} ruta={HUIDA} t={interpolate(f, [6, e.dur - 10], [0, 1], clamp)} color="#e53935" grosor={16} />
                <Ciudad cam={cam} ll={L.otumba} nombre="Otumba" f={f} inicio={Math.round(e.dur * 0.65)} />
              </>
            )}
          </Mapa>
          <Vineta />
          <Titular f={f} inicio={e.en("1520")} texto="1520" y={430} tam={120} />
          <Sello f={f} inicio={e.en("Noche")} texto="Noche Triste" x={540} y={1560} tam={74} giro={-8} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    asedio: ({ f }) => {
      const e = esc.asedio;
      const cam = P(-99.07, 19.42, 175 + f * 0.08);
      const vu = e.en("volvio");
      const tr = e.en("13");
      // 13 bergantines en corro alrededor de la isla
      const barcos = Array.from({ length: 13 }, (_, i) => {
        const a = (i / 13) * Math.PI * 2;
        return [L.tenochtitlan[0] + Math.cos(a) * 0.075, L.tenochtitlan[1] + Math.sin(a) * 0.06] as LonLat;
      });
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => (
              <>
                <Lago trazo={trazo} cam={cam} />
                {[[[-99.32, 19.48], L.tlacopan, [-99.15, 19.44]], [[-99.1, 19.62], L.tepeyac, [-99.13, 19.45]], [[-99.0, 19.25], L.iztapalapa, [-99.125, 19.42]]].map((r, i) => (
                  <FlechaG key={i} cam={cam} ruta={r as LonLat[]} t={k(f, vu + i * 5, 30)} color="#e53935" grosor={14} />
                ))}
                {barcos.map((ll, i) => (f >= tr + i * 2 ? <BarcoEn key={i} cam={cam} ll={ll} f={f} escala={0.13} fase={i * 7} haciaEste={i % 2 === 0} /> : null))}
              </>
            )}
          </Mapa>
          <Vineta />
          <Titular f={f} inicio={vu} texto="1521" y={430} tam={120} />
          <Caja f={f} inicio={e.en("aliados")} texto="+ miles de aliados" y={1520} fondo={ROJO_CAJA} tam={44} />
          <Caja f={f} inicio={tr} texto="13 bergantines" y={1640} tam={48} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    viruela: ({ f }) => {
      const e = esc.viruela;
      const cam = P(-98.95, 19.38, 62 + f * 0.04);
      const vi = e.en("viruela");
      const puntos = Array.from({ length: 70 }, (_, i) => ({
        ll: [-99.7 + random(`vx${i}`) * 1.7, 18.95 + random(`vy${i}`) * 0.95] as LonLat,
        t: random(`vt${i}`) * (e.dur - 20),
      }));
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => (
              <>
                <Lago trazo={trazo} cam={cam} />
                {puntos.map((p, i) => {
                  if (f < p.t) return null;
                  const q = aPantallaT(cam, p.ll)!;
                  const s = k(f, p.t, 10);
                  const onda = ((f - p.t) % 40) / 40;
                  return (
                    <g key={i}>
                      <circle cx={q[0]} cy={q[1]} r={10 + onda * 26} fill="none" stroke="#e53935" strokeWidth={3} opacity={(1 - onda) * 0.8} />
                      <circle cx={q[0]} cy={q[1]} r={9 * s} fill="#c62828" stroke="#fff" strokeWidth={2.5} />
                    </g>
                  );
                })}
              </>
            )}
          </Mapa>
          <Vineta />
          <Sello f={f} inicio={vi} texto="Viruela" x={540} y={1560} tam={90} giro={-8} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    caida: ({ f }) => {
      const e = esc.caida;
      const cd = e.en("Ciudad");
      const cam = camino(f, 0, e.dur, P(-99.12, 19.42, 210), P(-99.12, 19.42, 150));
      const lago = 1 - k(f, cd - 6, 30);
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => (
              <>
                <Lago trazo={trazo} cam={cam} opacidad={lago} />
                {f < cd ? (
                  <Ciudad cam={cam} ll={L.tenochtitlan} nombre="Tenochtitlan" f={f} inicio={0} hundida={e.en("cayo")} lado="izq" />
                ) : (
                  <Ciudad cam={cam} ll={L.tenochtitlan} nombre="Ciudad de México" f={f} inicio={cd} lado="izq" />
                )}
              </>
            )}
          </Mapa>
          <Vineta />
          <Titular f={f} inicio={e.en("1521")} texto="1521" y={430} tam={120} />
          <Caja f={f} inicio={e.en("agosto")} texto="13 de agosto" y={1640} tam={48} />
          <Creditos />
        </AbsoluteFill>
      );
    },

    final: ({ f }) => {
      const cam = P(-98.4, 19.0, interpolate(f, [0, 140], [20, 22]), 1150);
      return (
        <AbsoluteFill>
          <Mapa camara={cam} f={f}>
            {(_p, trazo) => <Zona trazo={trazo} cam={cam} capas={[capa(MEXICA, NARANJA), capa(TLAXCALA, VERDE)]} />}
          </Mapa>
          <Vineta />
          <Linea f={f} inicio={2} texto="Hernán Cortés" y={290} tam={64} />
          <Titular f={f} inicio={10} texto={"¿HÉROE O\nVILLANO?"} y={370} tam={110} />
          <Caja f={f} inicio={34} texto="Escríbelo en los comentarios" y={1660} fondo={NARANJA_CAJA} tam={46} />
          <Creditos />
        </AbsoluteFill>
      );
    },
  };
};
