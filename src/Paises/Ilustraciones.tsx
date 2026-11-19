import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { Dibujo } from "../comun/tipos";
import { Calendario, Etiqueta } from "../Colon/Ilustraciones";
import { Chip, Rotulo, Sello, useAparicion } from "../Napoleon/Ilustraciones";
import { aPantalla, CamaraGlobo, Globo, LonLat, mezclar } from "../comun/Globo";
import type { Escenario } from "./escenas";

const W = 1080;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.inOut(Easing.cubic);
const SANS = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const ORO = "#f2c230";
const ROJO = "#e53935";

export type Ilustracion =
  | "gancho"
  | "urss"
  | "urssRompe"
  | "yugo"
  | "yugoRompe"
  | "checo"
  | "alemania"
  | "grancol"
  | "grancolRompe"
  | "centro"
  | "centroRompe"
  | "rau"
  | "final";

// ---------- países (nombres de world-atlas) ----------

const URSS = ["Russia", "Ukraine", "Belarus", "Kazakhstan", "Uzbekistan", "Turkmenistan", "Kyrgyzstan", "Tajikistan", "Georgia", "Armenia", "Azerbaijan", "Moldova", "Lithuania", "Latvia", "Estonia"];
const YUGO = ["Slovenia", "Croatia", "Bosnia and Herz.", "Serbia", "Montenegro", "Macedonia", "Kosovo"];
const CHECO = ["Czechia", "Slovakia"];
const GRANCOL = ["Colombia", "Venezuela", "Ecuador", "Panama"];
const CENTRO = ["Guatemala", "Honduras", "El Salvador", "Nicaragua", "Costa Rica"];
const RAU = ["Egypt", "Syria"];

// paleta para las piezas cuando un país se rompe
const PALETA = ["229,57,53", "30,136,229", "255,179,0", "67,160,71", "142,36,170", "0,172,193", "244,81,30", "124,179,66", "216,27,96", "57,73,171", "255,112,67", "0,137,123", "192,202,51", "109,76,65", "120,144,156"];

type Colores = Record<string, { color: string; opacidad: number }>;
const pintar = (nombres: string[], color: string, opacidad: number): Colores => Object.fromEntries(nombres.map((n) => [n, { color, opacidad }]));
const pintarVarios = (nombres: string[], opacidad: number, desde = 0): Colores =>
  Object.fromEntries(nombres.map((n, i) => [n, { color: PALETA[(i + desde) % PALETA.length], opacidad }]));
// mezcla de un color común a uno distinto por pieza (k de 0 a 1)
const romper = (nombres: string[], comun: string, k: number, desde = 0): Colores =>
  Object.fromEntries(
    nombres.map((n, i) => {
      const a = comun.split(",").map(Number);
      const b = PALETA[(i + desde) % PALETA.length].split(",").map(Number);
      return [n, { color: a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(","), opacidad: 1 }];
    }),
  );

const ROJO_URSS = "198,40,40";
const AZUL_YUGO = "30,64,175";
const ORO_GC = "240,180,30";
const AZUL_CA = "21,101,192";
const VERDE_RAU = "46,125,50";

// ---------- piezas ----------

const EtiquetaG: React.FC<{ f: number; inicio: number; cam: CamaraGlobo; ll: LonLat; texto: string; dy?: number; color?: string; tam?: number }> = ({
  f,
  inicio,
  cam,
  ll,
  texto,
  dy = 0,
  color = "#0d1b2a",
  tam = 44,
}) => {
  const p = aPantalla(cam, ll);
  if (!p || f < inicio || p[0] < 60 || p[0] > W - 60) return null;
  return <Etiqueta f={f} x={Math.max(220, Math.min(W - 220, p[0]))} y={Math.max(460, Math.min(1700, p[1] + dy))} texto={texto} inicio={inicio} color={color} tam={tam} />;
};

// número grande que cuenta
const Cifra: React.FC<{ f: number; inicio: number; fin: number; de: number; a: number; y: number; tam: number; color?: string; sufijo?: string }> = ({
  f,
  inicio,
  fin,
  de,
  a,
  y,
  tam,
  color = "#fff",
  sufijo = "",
}) => {
  const s = useAparicion(f, inicio, 10);
  if (f < inicio) return null;
  const v = Math.round(interpolate(f, [inicio, fin], [de, a], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: tam,
        lineHeight: 1,
        color,
        transform: `scale(${s})`,
        textShadow: "0 10px 30px rgba(0,0,0,0.85), 0 0 4px #000",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {v}
      {sufijo}
    </div>
  );
};

const oscuroArriba = <AbsoluteFill style={{ background: "linear-gradient(rgba(3,5,14,0.75), rgba(3,5,14,0) 36%)" }} />;
const oscuroAbajo = <AbsoluteFill style={{ background: "linear-gradient(rgba(3,5,14,0) 62%, rgba(3,5,14,0.7))" }} />;

const camaraHacia = (f: number, hasta: number, a: CamaraGlobo, b: CamaraGlobo) => mezclar(a, b, interpolate(f, [0, hasta], [0, 1], { ...clamp, easing: suave }));

// ---------- escenas ----------

const gancho = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: -80 + f * 1.6, lat: 30, zoom: 1, y: 1250 };
  const parpadeo = (i: number) => 0.55 + 0.45 * Math.sin(f / 6 + i * 1.7);
  const colores: Colores = {
    ...pintar(URSS, ROJO_URSS, parpadeo(0)),
    ...pintar(YUGO, AZUL_YUGO, parpadeo(1)),
    ...pintar(CHECO, "142,36,170", parpadeo(2)),
    ...pintar(GRANCOL, ORO_GC, parpadeo(3)),
    ...pintar(CENTRO, AZUL_CA, parpadeo(4)),
    ...pintar(RAU, VERDE_RAU, parpadeo(5)),
  };
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={colores} />
      {oscuroArriba}
      <Rotulo f={f} inicio={0} texto="PAÍSES QUE" y={250} tam={110} color="#fff" />
      <Rotulo f={f} inicio={en("existían")} texto={"YA NO\nEXISTEN"} y={380} tam={150} />
      <Sello f={f} inicio={en("ningún")} x={540} y={820} texto="BORRADOS DEL MAPA" tam={60} giro={-6} />
    </AbsoluteFill>
  );
};

const urss = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraHacia(f, dur, { lon: 40, lat: 40, zoom: 1, y: 1100 }, { lon: 75, lat: 52, zoom: 1.5, y: 1100 });
  const k = interpolate(f, [en("Unión"), en("Soviética") + 10], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={pintar(URSS, ROJO_URSS, k)} />
      {oscuroArriba}
      <Rotulo f={f} inicio={en("Unión")} texto="URSS" y={400} tam={170} color="#fff" />
      <Chip f={f} inicio={en("grande")} x={540} y={640} texto="EL PAÍS MÁS GRANDE DEL MUNDO" fondo={ORO} color="#13204a" tam={44} />
      <Chip f={f} inicio={en("quince")} x={540} y={1620} texto="15 REPÚBLICAS" fondo={ROJO} color="#fff" tam={64} />
    </AbsoluteFill>
  );
};

const urssRompe = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: 70, lat: 52, zoom: interpolate(f, [0, dur], [1.5, 1.35]), y: 1100 };
  const k = interpolate(f, [en("rompió"), en("rompió") + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={romper(URSS, ROJO_URSS, k)} separar={{ nombres: URSS, k, px: 45 }} />
      {oscuroArriba}
      <Calendario f={f} mes="DIC." dia="26" anio="1991" inicio={en("1991")} />
      <Cifra f={f} inicio={en("rompió")} fin={en("quince") + 4} de={1} a={15} y={420} tam={200} color={ORO} />
      <Rotulo f={f} inicio={en("países")} texto="PAÍSES" y={630} tam={80} color="#fff" />
      <EtiquetaG f={f} inicio={en("Rusia")} cam={cam} ll={[60, 60]} texto="RUSIA" tam={50} />
      <EtiquetaG f={f} inicio={en("Estonia")} cam={cam} ll={[25.5, 58.7]} texto="ESTONIA" dy={-70} tam={40} />
    </AbsoluteFill>
  );
};

const yugo = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraHacia(f, en("Yugoslavia") + 20, { lon: 40, lat: 50, zoom: 1.4, y: 1100 }, { lon: 18.5, lat: 43.8, zoom: 7, y: 1100 });
  const k = interpolate(f, [en("Yugoslavia"), en("Yugoslavia") + 14], [0, 1], clamp);
  const pueblos: [string, string, number, number][] = [
    ["serbios", "SERBIOS", 770, 1180],
    ["croatas", "CROATAS", 330, 820],
    ["bosnios", "BOSNIOS", 470, 1050],
    ["eslovenos", "ESLOVENOS", 300, 640],
  ];
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={pintar(YUGO, AZUL_YUGO, k)} />
      {oscuroArriba}
      <Rotulo f={f} inicio={en("Yugoslavia")} texto="YUGOSLAVIA" y={1500} tam={120} color="#fff" />
      {pueblos.map(([w, t, x, y]) => (
        <Chip key={w} f={f} inicio={en(w)} x={x} y={y} texto={t} fondo="#fff" color="#13204a" tam={42} />
      ))}
      <Chip f={f} inicio={en("bandera")} x={540} y={1700} texto="UNA SOLA BANDERA" fondo={ORO} color="#13204a" tam={48} />
    </AbsoluteFill>
  );
};

const yugoRompe = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: 19.5, lat: 43.6, zoom: 6.6, y: 1100 };
  const k = interpolate(f, [en("guerras"), en("partida") + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const fuego = f >= en("guerras") && f < en("guerras") + 30 ? 0.25 + 0.2 * Math.sin(f * 1.3) : 0;
  const tiembla = f >= en("guerras") && f < en("guerras") + 14 ? Math.sin(f * 3) * 8 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${tiembla}px)` }}>
      <Globo camara={cam} f={f} colores={romper(YUGO, AZUL_YUGO, k, 3)} separar={{ nombres: YUGO, k, px: 70 }} />
      <AbsoluteFill style={{ background: `rgba(200,30,0,${fuego})` }} />
      {oscuroArriba}
      <Sello f={f} inicio={en("guerras")} x={540} y={560} texto="GUERRAS" tam={100} />
      <Cifra f={f} inicio={en("siete")} fin={en("siete") + 10} de={1} a={7} y={1430} tam={200} color={ORO} />
      <Rotulo f={f} inicio={en("países")} texto="PAÍSES" y={1640} tam={80} color="#fff" />
    </AbsoluteFill>
  );
};

const checo = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraHacia(f, en("separó") + 10, { lon: 19, lat: 45, zoom: 5, y: 1100 }, { lon: 17.3, lat: 49.3, zoom: 9.5, y: 1100 });
  const k = interpolate(f, [en("1993"), en("1993") + 18], [0, 1], { ...clamp, easing: suave });
  const colores: Colores = { Czechia: { color: k > 0 ? "30,136,229" : "142,36,170", opacidad: 1 }, Slovakia: { color: k > 0 ? "229,57,53" : "142,36,170", opacidad: 1 } };
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={colores} separar={{ nombres: CHECO, k, px: 40 }} />
      {oscuroArriba}
      <Rotulo f={f} inicio={0} texto="CHECOSLOVAQUIA" y={330} tam={92} color="#fff" />
      <Chip f={f} inicio={en("disparo")} x={540} y={1650} texto="SIN UN SOLO DISPARO 🤝" fondo="#fff" color="#13204a" tam={50} />
      <Calendario f={f} mes="ENERO" dia="1" anio="1993" inicio={en("1993")} />
      <EtiquetaG f={f} inicio={en("Chequia")} cam={cam} ll={[15.3, 49.8]} texto="CHEQUIA" dy={-20} color="#0d47a1" tam={48} />
      <EtiquetaG f={f} inicio={en("Eslovaquia")} cam={cam} ll={[19.5, 48.7]} texto="ESLOVAQUIA" dy={60} color="#b71c1c" tam={48} />
    </AbsoluteFill>
  );
};

// frontera aproximada entre las dos Alemanias (1949–1990)
const TELON: LonLat[] = [
  [10.9, 54.0], [10.8, 53.6], [11.3, 53.15], [10.6, 52.85], [10.95, 52.3], [10.6, 51.75], [10.05, 51.45], [10.2, 50.95], [9.95, 50.6], [10.6, 50.3], [11.3, 50.45], [11.9, 50.35], [12.15, 50.3],
];
const alemania = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraHacia(f, en("Este") + 14, { lon: 14, lat: 47, zoom: 5, y: 1100 }, { lon: 10.4, lat: 51.2, zoom: 9.5, y: 1100 });
  const une = interpolate(f, [en("unió"), en("unió") + 18], [0, 1], { ...clamp, easing: suave });
  const linea = interpolate(f, [en("Alemania"), en("Este") + 10], [0, 1], clamp) * (1 - une);
  const berlin = aPantalla(cam, [13.4, 52.52]);
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={{ Germany: { color: une > 0.5 ? "255,193,7" : "120,120,130", opacidad: 0.4 + 0.6 * Math.max(linea, une) } }}>
        {(_, trazo) => (
          <>
            {linea > 0 && (
              <>
                <path d={trazo({ type: "LineString", coordinates: TELON }) ?? ""} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={22} opacity={linea} />
                <path d={trazo({ type: "LineString", coordinates: TELON }) ?? ""} fill="none" stroke={ROJO} strokeWidth={12} strokeDasharray="26 14" opacity={linea} />
              </>
            )}
            {berlin && <circle cx={berlin[0]} cy={berlin[1]} r={14} fill="#fff" stroke="#000" strokeWidth={4} />}
          </>
        )}
      </Globo>
      {oscuroArriba}
      {une < 0.5 && (
        <>
          <Chip f={f} inicio={en("Este")} x={760} y={1250} texto="ESTE" fondo="#b71c1c" color="#fff" tam={58} />
          <Chip f={f} inicio={en("Oeste")} x={300} y={1250} texto="OESTE" fondo="#0d47a1" color="#fff" tam={58} />
        </>
      )}
      <Rotulo f={f} inicio={en("revés")} texto="AL REVÉS" y={320} tam={110} color="#fff" />
      <Calendario f={f} mes="OCT." dia="3" anio="1990" inicio={en("1990")} />
      {une > 0 && <Chip f={f} inicio={en("unió")} x={540} y={1580} texto="UNA SOLA ALEMANIA" fondo={ORO} color="#13204a" tam={56} />}
    </AbsoluteFill>
  );
};

const grancol = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraHacia(f, en("Colombia", 1) + 10, { lon: -40, lat: 15, zoom: 1.2, y: 1100 }, { lon: -73, lat: 4.5, zoom: 4.3, y: 1100 });
  const paises: [string, string, string, LonLat][] = [
    ["Colombia", "Colombia", "COLOMBIA", [-73.5, 3.5]],
    ["Venezuela", "Venezuela", "VENEZUELA", [-66, 7.5]],
    ["Ecuador", "Ecuador", "ECUADOR", [-78.3, -1.3]],
    ["Panama", "Panamá", "PANAMÁ", [-80.2, 8.6]],
  ];
  const colores: Colores = Object.fromEntries(
    paises.map(([n, w], i) => [n, { color: ORO_GC, opacidad: interpolate(f, [en(w, w === "Colombia" ? 2 : 1), en(w, w === "Colombia" ? 2 : 1) + 8], [0, 1], clamp) * (i >= 0 ? 1 : 0) }]),
  );
  // "Gran Colombia" pinta todo a la vez un instante antes de nombrar cada país
  const todo = interpolate(f, [en("Gran"), en("Gran") + 10], [0, 0.45], clamp);
  Object.keys(colores).forEach((n) => (colores[n].opacidad = Math.max(colores[n].opacidad, todo)));
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={colores} />
      {oscuroArriba}
      <Rotulo f={f} inicio={en("Gran")} texto={"GRAN\nCOLOMBIA"} y={400} tam={120} />
      <Chip f={f} inicio={en("Bolívar")} x={540} y={700} texto="SIMÓN BOLÍVAR" fondo="#fff" color="#13204a" tam={50} />
      {paises.map(([n, w, t, ll]) => (
        <EtiquetaG key={n} f={f} inicio={en(w, w === "Colombia" ? 2 : 1)} cam={cam} ll={ll} texto={t} tam={40} />
      ))}
    </AbsoluteFill>
  );
};

const grancolRompe = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: -73, lat: 4.5, zoom: 4.3, y: 1100 };
  const k = interpolate(f, [en("deshizo"), en("deshizo") + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={romper(GRANCOL, ORO_GC, k, 1)} separar={{ nombres: GRANCOL, k, px: 60 }} />
      {oscuroArriba}
      {oscuroAbajo}
      <Cifra f={f} inicio={en("apenas")} fin={en("años") + 6} de={0} a={12} y={420} tam={190} color={ORO} />
      <Rotulo f={f} inicio={en("años")} texto="AÑOS" y={620} tam={80} color="#fff" />
      <Chip f={f} inicio={en("1831")} x={540} y={1620} texto="1819 → 1831" fondo="#fff" color="#13204a" tam={60} />
    </AbsoluteFill>
  );
};

const centro = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraHacia(f, en("Guatemala") + 12, { lon: -80, lat: 8, zoom: 3.5, y: 1100 }, { lon: -86.2, lat: 13.2, zoom: 8, y: 1100 });
  const paises: [string, string, string, LonLat, number][] = [
    ["Guatemala", "Guatemala,", "GUATEMALA", [-90.4, 15.5], -40],
    ["Honduras", "Honduras,", "HONDURAS", [-86.6, 14.8], -110],
    ["El Salvador", "Salvador,", "EL SALVADOR", [-88.9, 13.7], 70],
    ["Nicaragua", "Nicaragua", "NICARAGUA", [-85, 12.8], 20],
    ["Costa Rica", "Costa", "COSTA RICA", [-84.1, 9.9], 60],
  ];
  const uno = interpolate(f, [en("solo"), en("país") + 6], [0, 1], clamp);
  const colores: Colores = Object.fromEntries(
    paises.map(([n, w], i) => {
      const k = interpolate(f, [en(w), en(w) + 8], [0, 1], clamp);
      const a = PALETA[i + 5].split(",").map(Number);
      const b = AZUL_CA.split(",").map(Number);
      return [n, { color: a.map((v, j) => Math.round(v + (b[j] - v) * uno)).join(","), opacidad: k }];
    }),
  );
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={colores} />
      {oscuroArriba}
      {paises.map(([n, w, t, ll, dy]) => (
        <EtiquetaG key={n} f={f} inicio={en(w)} cam={cam} ll={ll} texto={t} dy={dy} tam={38} />
      ))}
      <Sello f={f} inicio={en("solo")} x={540} y={600} texto="UN SOLO PAÍS" tam={86} color="#1565c0" />
    </AbsoluteFill>
  );
};

const centroRompe = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: -86.2, lat: 13.2, zoom: 8, y: 1150 };
  const k = interpolate(f, [en("separó"), en("separó") + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={romper(CENTRO, AZUL_CA, k, 5)} separar={{ nombres: CENTRO, k, px: 50 }} />
      {oscuroArriba}
      <Rotulo f={f} inicio={en("Provincias")} texto={"PROVINCIAS UNIDAS\nDEL CENTRO\nDE AMÉRICA"} y={430} tam={78} />
      <Chip f={f} inicio={en("1840")} x={540} y={1640} texto="SEPARADAS HACIA 1840" fondo={ROJO} color="#fff" tam={52} />
    </AbsoluteFill>
  );
};

const rau = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam = camaraHacia(f, en("Egipto") + 10, { lon: 20, lat: 25, zoom: 1.8, y: 1150 }, { lon: 33.5, lat: 29.5, zoom: 4.6, y: 1150 });
  const eg = interpolate(f, [en("Egipto"), en("Egipto") + 8], [0, 1], clamp);
  const si = interpolate(f, [en("Siria"), en("Siria") + 8], [0, 1], clamp);
  const fin = interpolate(f, [en("tres"), en("años") + 10], [0, 1], clamp);
  const lazo = interpolate(f, [en("unieron"), en("unieron") + 14], [0, 1], clamp) * (1 - fin);
  const colores: Colores = {
    Egypt: { color: VERDE_RAU, opacidad: eg },
    Syria: { color: VERDE_RAU, opacidad: si * (1 - fin * 0.85) },
  };
  const a = aPantalla(cam, [30.5, 27]);
  const b = aPantalla(cam, [38.5, 35]);
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={colores}>
        {() =>
          a && b && lazo > 0 ? (
            <path
              d={`M ${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2 + 120} ${(a[1] + b[1]) / 2 - 60} ${a[0] + (b[0] - a[0]) * lazo} ${a[1] + (b[1] - a[1]) * lazo}`}
              stroke="#fff"
              strokeWidth={12}
              strokeDasharray="22 14"
              fill="none"
              strokeLinecap="round"
            />
          ) : null
        }
      </Globo>
      {oscuroArriba}
      <Calendario f={f} mes="FEB." dia="1" anio="1958" inicio={en("1958")} izquierda />
      <EtiquetaG f={f} inicio={en("Egipto")} cam={cam} ll={[30, 26]} texto="EGIPTO" tam={46} />
      <EtiquetaG f={f} inicio={en("Siria")} cam={cam} ll={[38.5, 35]} texto="SIRIA" dy={-60} tam={46} />
      <Rotulo f={f} inicio={en("República")} texto={"REPÚBLICA\nÁRABE UNIDA"} y={1440} tam={88} color="#fff" />
      <Sello f={f} inicio={en("tres")} x={760} y={640} texto="3 AÑOS" tam={86} />
    </AbsoluteFill>
  );
};

const final = ({ dur, en }: Escenario): Dibujo => ({ f }) => {
  const cam: CamaraGlobo = { lon: 20 + f * 1.4, lat: 25, zoom: 1, y: 1250 };
  const colores: Colores = { ...pintarVarios(URSS, 0.8), ...pintarVarios(YUGO, 0.8, 4), ...pintarVarios(GRANCOL, 0.8, 8), ...pintarVarios(CENTRO, 0.8, 2), ...pintar(RAU, VERDE_RAU, 0.8) };
  return (
    <AbsoluteFill>
      <Globo camara={cam} f={f} colores={colores} />
      {oscuroArriba}
      <Rotulo f={f} inicio={0} texto={"¿QUÉ PAÍS\nDESAPARECIDO\nQUIERES?"} y={260} tam={100} color="#fff" />
      <Chip f={f} inicio={en("Escríbelo")} x={540} y={720} texto="ESCRÍBELO EN COMENTARIOS 👇" fondo={ORO} color="#13204a" tam={48} />
    </AbsoluteFill>
  );
};

const FABRICAS: Record<Ilustracion, (e: Escenario) => Dibujo> = {
  gancho,
  urss,
  urssRompe,
  yugo,
  yugoRompe,
  checo,
  alemania,
  grancol,
  grancolRompe,
  centro,
  centroRompe,
  rau,
  final,
};

export const crearIlustraciones = (esc: Record<Ilustracion, Escenario>) =>
  Object.fromEntries(Object.entries(FABRICAS).map(([k, fab]) => [k, fab(esc[k as Ilustracion])])) as Record<Ilustracion, Dibujo>;
