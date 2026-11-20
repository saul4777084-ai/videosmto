import React, { useLayoutEffect, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { cancelRender, continueRender, delayRender, random, staticFile } from "remotion";
import mundo50 from "world-atlas/countries-50m.json";
import FUENTES from "./tierra_fuentes.json";
import { aPantalla, CamaraGlobo, LonLat, mezclar, proyeccionDe, RADIO } from "./Globo";

// «Tierra»: globo de alta calidad hecho con imagen real (no con dibujos vectoriales).
//  · color: satélite (NASA Blue Marble) o atlas físico (tintas hipsométricas), con el relieve sombreado
//  · alturas reales (AWS Terrain Tiles): el mar puede subir metro a metro (nivelMar) y entra por donde entraría
//  · luz 3D, atmósfera, nubes que se mueven y fronteras finas encima
//  · modo plano (camara.plana): mapa Mercator a pantalla completa, como los vídeos de mapas virales
//  · estilo "mapa": satélite oscuro, relieve marcado y océano azul petróleo (el de esos vídeos)
// En modo globo usa la misma cámara y proyección que src/comun/Globo.tsx. Para las piezas de encima,
// usa siempre proyeccionT / aPantallaT / mezclarT, que valen para los dos modos.
// Las texturas salen de scripts/texturas_mapa.py → public/mapas/ y tierra_fuentes.json.

const W = 1080;
const H = 1920;

export type EstiloTierra = "satelite" | "relieve" | "mapa" | "dibujo";
export type CamaraT = CamaraGlobo & { plana?: boolean };

// proyección d3 de una cámara (globo ortográfico o Mercator plano) para dibujar encima
export const proyeccionT = (c: CamaraT) =>
  c.plana
    ? geoMercator()
        .scale(RADIO * c.zoom)
        .center([c.lon, c.lat])
        .translate([W / 2, c.y ?? 1000])
        .precision(0.5)
    : proyeccionDe(c);

// lon/lat -> pantalla (null si cae en la cara oculta del globo)
export const aPantallaT = (c: CamaraT, ll: LonLat): [number, number] | null =>
  c.plana ? (proyeccionT(c)(ll) as [number, number]) : aPantalla(c, ll);

export const mezclarT = (a: CamaraT, b: CamaraT, k: number): CamaraT => ({ ...mezclar(a, b, k), plana: a.plana });
type NombreFuente = keyof typeof FUENTES;
type Meta = { z: number; x0: number; y0: number; ancho: number; alto: number };

// ---------- carga de texturas (una vez por pestaña del render) ----------

type Tex = { w: number; h: number; d: Uint8ClampedArray };
const cache = new Map<string, Promise<Tex>>();
const cargar = (archivo: string): Promise<Tex> => {
  if (!cache.has(archivo)) {
    cache.set(
      archivo,
      fetch(staticFile(archivo))
        .then((r) => r.blob())
        .then((b) => createImageBitmap(b, { colorSpaceConversion: "none", premultiplyAlpha: "none" }))
        .then((img) => {
          const c = new OffscreenCanvas(img.width, img.height);
          const ctx = c.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(img, 0, 0);
          return { w: img.width, h: img.height, d: ctx.getImageData(0, 0, img.width, img.height).data };
        }),
    );
  }
  return cache.get(archivo)!;
};

type Fuente = { nombre: string; meta: Meta; color: Tex; alt: Tex };
const useTexturas = (estilo: EstiloTierra, nombres: NombreFuente[], conNubes: boolean) => {
  const [datos, setDatos] = useState<{ fuentes: Fuente[]; nubes: Tex | null } | null>(null);
  const [handle] = useState(() => delayRender("texturas de la Tierra", { timeoutInMilliseconds: 120000 }));
  const clave = `${estilo}|${nombres.join(",")}|${conNubes}`;
  useLayoutEffect(() => {
    let vivo = true;
    Promise.all([
      Promise.all(
        nombres.map(async (n) => ({
          nombre: n,
          meta: FUENTES[n] as Meta,
          color: await cargar(`mapas/${n}_${estilo}.jpg`),
          alt: await cargar(`mapas/${n}_alt.png`),
        })),
      ),
      conNubes ? cargar("mapas/nubes.jpg") : Promise.resolve(null),
    ])
      .then(([fuentes, nubes]) => {
        if (!vivo) return;
        setDatos({ fuentes, nubes });
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return datos;
};

// ---------- colores ----------

// agua por profundidad (m) — igual que AGUA y AGUA_MAPA en scripts/texturas_mapa.py
type Paleta = [number, number, number, number][];
export const AGUA_MAPA: Paleta = [
  [0, 44, 88, 100],
  [30, 32, 74, 90],
  [200, 25, 62, 81],
  [1000, 21, 53, 73],
  [3000, 18, 45, 65],
  [6000, 13, 34, 52],
];
// agua NUEVA (tierra inundada) en el estilo mapa: más clara, para que se vea por dónde entra el mar
const INUNDA_MAPA: Paleta = [
  [0, 96, 176, 190],
  [15, 74, 150, 170],
  [60, 54, 120, 145],
  [200, 34, 84, 104],
  [6000, 20, 52, 72],
];
// agua nueva en el estilo dibujo (Napoleón, Colón): el mismo azul liso del mar
const INUNDA_DIBUJO: Paleta = [
  [0, 78, 160, 208],
  [60, 56, 140, 194],
  [6000, 34, 112, 168],
];
const AGUA_CLARA: Paleta = [
  [0, 120, 205, 220],
  [25, 66, 170, 208],
  [200, 38, 124, 184],
  [1000, 24, 88, 158],
  [3000, 14, 58, 122],
  [6000, 8, 34, 84],
];
const colorAgua = (p: number, out: number[], AGUA: Paleta) => {
  let i = 0;
  while (i < AGUA.length - 2 && p > AGUA[i + 1][0]) i++;
  const a = AGUA[i];
  const b = AGUA[i + 1];
  const k = Math.max(0, Math.min(1, (p - a[0]) / (b[0] - a[0])));
  out[0] = a[1] + (b[1] - a[1]) * k;
  out[1] = a[2] + (b[2] - a[2]) * k;
  out[2] = a[3] + (b[3] - a[3]) * k;
};

// ---------- fronteras ----------

const topo = mundo50 as unknown as Topology<{ countries: GeometryCollection }>;
export const PAISES_50 = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features;
const FRONTERAS = mesh(topo, topo.objects.countries, (a, b) => a !== b);

const PAISES = PAISES_50;
export const paisGeo = (nombre: string) => PAISES.find((p) => p.properties.name === nombre);

// ---------- estrellas ----------

const ESTRELLAS = Array.from({ length: 180 }, (_, i) => ({
  x: random(`tx${i}`) * W,
  y: random(`ty${i}`) * H,
  r: 0.7 + random(`tr${i}`) ** 2 * 3,
  o: 0.25 + random(`to${i}`) * 0.65,
  fase: random(`tf${i}`) * 6,
}));

// ---------- componente ----------

type Props = {
  camara: CamaraT;
  f: number;
  estilo?: EstiloTierra;
  nivelMar?: number; // metros sobre el nivel actual (0 = hoy)
  nubes?: number; // 0..1 opacidad de las nubes
  fronteras?: number; // 0..1 opacidad de las fronteras
  fuentes?: NombreFuente[]; // texturas que se cargan (mundo siempre; añade "europa", "asia"...)
  fondo?: "espacio" | "ninguno";
  hielo?: number; // 0..1: cuánto hielo queda en Groenlandia y la Antártida (1 = todo, 0 = derretido)
  children?: (proy: ReturnType<typeof proyeccionDe>, trazo: ReturnType<typeof geoPath>) => React.ReactNode;
};

export const Tierra: React.FC<Props> = ({
  camara,
  f,
  estilo = "satelite",
  nivelMar = 0,
  nubes = 0,
  fronteras = 0.5,
  fuentes = ["mundo"],
  fondo,
  hielo = 1,
  children,
}) => {
  const lista = (fuentes.includes("mundo") ? fuentes : ["mundo", ...fuentes]) as NombreFuente[];
  const datos = useTexturas(estilo, lista, nubes > 0);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const plana = !!camara.plana;
  const verFondo = fondo ?? (plana ? "ninguno" : "espacio");
  const proy = proyeccionT(camara);
  const trazo = geoPath(proy);
  const cx = W / 2;
  const cy = camara.y ?? 1000;
  const R = RADIO * camara.zoom;

  useLayoutEffect(() => {
    if (!datos || !lienzo.current) return;
    const ctx = lienzo.current.getContext("2d")!;
    const img = ctx.createImageData(W, H);
    pintar(img.data, datos.fuentes, datos.nubes, { cx, cy, R, lon0: camara.lon, lat0: camara.lat, nivelMar, nubes, f, hielo, plana, estilo });
    ctx.putImageData(img, 0, 0);
  }, [datos, cx, cy, R, camara.lon, camara.lat, nivelMar, nubes, f, hielo, plana, estilo]);

  const verHalo = R < 4000;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {verFondo === "espacio" && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="t-espacio" cx="50%" cy="50%" r="75%">
              <stop offset="0" stopColor="#101a3c" />
              <stop offset="1" stopColor="#02040b" />
            </radialGradient>
            <radialGradient id="t-halo">
              <stop offset="0.9" stopColor="#8fd4ff" stopOpacity={0.55} />
              <stop offset="0.95" stopColor="#5aa8ff" stopOpacity={0.22} />
              <stop offset="1" stopColor="#3b7bff" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#t-espacio)" />
          {ESTRELLAS.map((e, i) => (
            <circle key={i} cx={e.x} cy={e.y} r={e.r} fill="#fff" opacity={e.o * (0.7 + 0.3 * Math.sin(f / 9 + e.fase))} />
          ))}
          {verHalo && <circle cx={cx} cy={cy} r={R * 1.1} fill="url(#t-halo)" />}
        </svg>
      )}
      <canvas ref={lienzo} width={W} height={H} style={{ position: "absolute", inset: 0 }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {fronteras > 0 && (
          <path d={trazo(FRONTERAS) ?? ""} fill="none" stroke={`rgba(255,255,255,${0.55 * fronteras})`} strokeWidth={1.6} strokeLinejoin="round" />
        )}
        {children?.(proy as ReturnType<typeof proyeccionDe>, trazo)}
      </svg>
    </div>
  );
};

// ---------- el pintor (píxel a píxel) ----------

type Params = {
  cx: number;
  cy: number;
  R: number;
  lon0: number;
  lat0: number;
  nivelMar: number;
  nubes: number;
  f: number;
  hielo: number;
  plana: boolean;
  estilo: EstiloTierra;
};

const RAD = Math.PI / 180;
const LUZ = (() => {
  const v = [-0.48, 0.58, 0.66];
  const n = Math.hypot(v[0], v[1], v[2]);
  return v.map((x) => x / n);
})();

function pintar(out: Uint8ClampedArray, fuentes: Fuente[], nubesTex: Tex | null, p: Params) {
  const { cx, cy, R, lon0, lat0, nivelMar, nubes, f, hielo, plana, estilo } = p;
  const AGUA = estilo === "mapa" ? INUNDA_MAPA : estilo === "dibujo" ? INUNDA_DIBUJO : AGUA_CLARA;
  const POLO_N = estilo === "mapa" ? [18, 44, 64] : [26, 78, 138];
  const Y0 = Math.log(Math.tan(Math.PI / 4 + (lat0 * RAD) / 2)); // Mercator del centro (modo plano)
  const sinF0 = Math.sin(lat0 * RAD);
  const cosF0 = Math.cos(lat0 * RAD);
  // resolución de pantalla en radianes por píxel (en el centro)
  const radPx = 1 / R;
  // peso de cada fuente según su resolución: las regionales solo se usan si no se ven "con grano fino de más"
  const pesos = fuentes.map((fu) => {
    if (fu.nombre === "mundo") return 1;
    const texel = (2 * Math.PI) / (256 * 2 ** fu.meta.z);
    const r = radPx / texel; // >1: un píxel de pantalla cubre varios texeles (se vería con ruido)
    return Math.max(0, Math.min(1, (3.5 - r) / 1.0));
  });
  const activas = fuentes.map((fu, i) => ({ fu, peso: pesos[i] })).filter((a) => a.peso > 0);
  const base = activas.find((a) => a.fu.nombre === "mundo")!;
  const regionales = activas.filter((a) => a.fu.nombre !== "mundo");

  const s = [0, 0, 0, 0, 0]; // r g b mascara altura
  const t = [0, 0, 0, 0, 0];
  const ag = [0, 0, 0];
  const deriva = f * 0.012; // las nubes avanzan despacio hacia el este

  const yMin = plana ? 0 : Math.max(0, Math.floor(cy - R));
  const yMax = plana ? H - 1 : Math.min(H - 1, Math.ceil(cy + R));
  for (let y = yMin; y <= yMax; y++) {
    const py = (cy - (y + 0.5)) / R;
    const py2 = py * py;
    let xMin = 0;
    let xMax = W - 1;
    let latFila = 0;
    if (plana) {
      latFila = Math.atan(Math.sinh(Y0 + py)) / RAD;
    } else {
      if (py2 >= 1) continue;
      const ancho = Math.sqrt(1 - py2) * R;
      xMin = Math.max(0, Math.floor(cx - ancho));
      xMax = Math.min(W - 1, Math.ceil(cx + ancho));
    }
    for (let x = xMin; x <= xMax; x++) {
      const px = (x + 0.5 - cx) / R;
      let lat: number;
      let lon: number;
      let zz = 1;
      let rho2 = 0;
      if (plana) {
        lat = latFila;
        lon = lon0 + px / RAD;
      } else {
        rho2 = px * px + py2;
        if (rho2 >= 1) continue;
        zz = Math.sqrt(1 - rho2);
        lat = Math.asin(Math.max(-1, Math.min(1, zz * sinF0 + py * cosF0))) / RAD;
        lon = lon0 + Math.atan2(px, zz * cosF0 - py * sinF0) / RAD;
      }
      lon = ((((lon + 180) % 360) + 360) % 360) - 180;

      muestrear(base.fu, lon, lat, s, true);
      for (const r of regionales) {
        const borde = muestrear(r.fu, lon, lat, t, false);
        if (borde > 0) {
          const w = borde * r.peso;
          for (let k = 0; k < 5; k++) s[k] += (t[k] - s[k]) * w;
        }
      }
      let cr = s[0];
      let cg = s[1];
      let cb = s[2];
      // casquetes polares: la textura Mercator acaba en ±85°; se funde con un color liso para que no salgan rayas
      const polo = Math.max(0, Math.min(1, (Math.abs(lat) - 82.5) / 2.5));
      if (polo > 0) {
        const [pr, pg, pb] = lat > 0 ? POLO_N : [236, 240, 246];
        cr += (pr - cr) * polo;
        cg += (pg - cg) * polo;
        cb += (pb - cb) * polo;
      }
      const tierra = s[3];
      const alt = s[4];

      // hielo que se derrite: Groenlandia y la Antártida pasan de blanco a roca
      if (hielo < 1 && tierra > 0.3 && (lat < -60 || (lat > 59 && lon > -75 && lon < -10))) {
        const blanco = Math.max(0, Math.min(1, (Math.min(cr, cg, cb) - 150) / 70));
        if (blanco > 0) {
          const k = blanco * (1 - hielo);
          cr += (112 - cr) * k;
          cg += (104 - cg) * k;
          cb += (96 - cb) * k;
        }
      }

      // el mar sube: inunda la tierra por debajo del nivel (con la altura "rellena" desde el océano)
      if (nivelMar > 0 && tierra > 0) {
        const moja = Math.max(0, Math.min(1, (nivelMar - alt) / 3 + 0.5)) * tierra;
        if (moja > 0) {
          const prof = Math.max(0, nivelMar - alt);
          colorAgua(prof, ag, AGUA);
          // agua poco profunda: se intuye el terreno debajo
          const vela = Math.min(1, 0.55 + prof / 60);
          const wr = ag[0] * vela + cr * 0.6 * (1 - vela);
          const wg = ag[1] * vela + cg * 0.75 * (1 - vela);
          const wb = ag[2] * vela + cb * 0.9 * (1 - vela);
          // espuma en la orilla nueva
          const orilla = Math.max(0, 1 - Math.abs(nivelMar - alt) / 2.5) * 0.35;
          cr += (wr - cr) * moja + orilla * 255 * moja;
          cg += (wg - cg) * moja + orilla * 255 * moja;
          cb += (wb - cb) * moja + orilla * 255 * moja;
        }
      }

      // nubes con su sombra
      if (nubesTex && nubes > 0) {
        const n = nube(nubesTex, lon - deriva, lat) * nubes;
        const sombra = nube(nubesTex, lon - deriva + 0.7, lat - 0.5) * nubes * 0.28;
        cr *= 1 - sombra;
        cg *= 1 - sombra;
        cb *= 1 - sombra;
        cr += (250 - cr) * n;
        cg += (252 - cg) * n;
        cb += (255 - cb) * n;
      }

      let a = 1;
      if (!plana) {
        // luz 3D (más suave cuanto más cerca está la cámara)
        const dif = px * LUZ[0] + py * LUZ[1] + zz * LUZ[2];
        const luz = 0.6 + 0.52 * Math.max(0, dif);
        cr *= luz;
        cg *= luz;
        cb *= luz;
        // atmósfera en el borde
        const rim = rho2 * rho2 * rho2 * 0.55;
        cr += (150 - cr) * rim;
        cg += (205 - cg) * rim;
        cb += (255 - cb) * rim;
        // borde del disco con antialias
        a = Math.max(0, Math.min(1, (1 - Math.sqrt(rho2)) * R));
      }

      const o = (y * W + x) * 4;
      out[o] = cr;
      out[o + 1] = cg;
      out[o + 2] = cb;
      out[o + 3] = a * 255;
    }
  }
}

// muestra bilineal de una fuente: devuelve el peso por cercanía al borde (0 = fuera)
function muestrear(fu: Fuente, lon: number, lat: number, o: number[], envolver: boolean): number {
  const { z, x0, y0, ancho, alto } = fu.meta;
  const n = 256 * 2 ** z;
  const la = Math.max(-85.05, Math.min(85.05, lat)) * RAD;
  let X = ((lon + 180) / 360) * n - x0 * 256 - 0.5;
  const Y = ((1 - Math.log(Math.tan(Math.PI / 4 + la / 2)) / Math.PI) / 2) * n - y0 * 256 - 0.5;
  let borde = 1;
  if (!envolver) {
    if (X < 0 || Y < 0 || X > ancho - 2 || Y > alto - 2) return 0;
    const m = Math.min(X, Y, ancho - 2 - X, alto - 2 - Y);
    borde = Math.min(1, m / 60);
  } else {
    X = ((X % ancho) + ancho) % ancho;
  }
  const Yc = Math.max(0, Math.min(alto - 1.001, Y));
  const xi = Math.floor(X);
  const yi = Math.floor(Yc);
  const tx = X - xi;
  const ty = Yc - yi;
  const x1 = envolver ? (xi + 1) % ancho : Math.min(ancho - 1, xi + 1);
  const i00 = (yi * ancho + xi) * 4;
  const i10 = (yi * ancho + x1) * 4;
  const i01 = ((yi + 1) * ancho + xi) * 4;
  const i11 = ((yi + 1) * ancho + x1) * 4;
  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;
  const C = fu.color.d;
  const A = fu.alt.d;
  o[0] = C[i00] * w00 + C[i10] * w10 + C[i01] * w01 + C[i11] * w11;
  o[1] = C[i00 + 1] * w00 + C[i10 + 1] * w10 + C[i01 + 1] * w01 + C[i11 + 1] * w11;
  o[2] = C[i00 + 2] * w00 + C[i10 + 2] * w10 + C[i01 + 2] * w01 + C[i11 + 2] * w11;
  o[3] = (A[i00 + 2] * w00 + A[i10 + 2] * w10 + A[i01 + 2] * w01 + A[i11 + 2] * w11) / 255;
  o[4] =
    (A[i00] * 256 + A[i00 + 1]) * w00 + (A[i10] * 256 + A[i10 + 1]) * w10 + (A[i01] * 256 + A[i01 + 1]) * w01 + (A[i11] * 256 + A[i11 + 1]) * w11 - 32768;
  return borde;
}

function nube(tex: Tex, lon: number, lat: number) {
  const X = ((((lon + 180) / 360) * tex.w) % tex.w + tex.w) % tex.w;
  const Y = Math.max(0, Math.min(tex.h - 1, ((90 - lat) / 180) * tex.h));
  return tex.d[(Math.floor(Y) * tex.w + Math.floor(X)) * 4] / 255;
}
