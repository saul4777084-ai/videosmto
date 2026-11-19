// "Países que ya no existen" — voz alineada palabra por palabra.
// Los tiempos salen de scripts/alinear_voz.py → tiempos.json (y scripts de números → ver README del reel en Reel.tsx)
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import type { Ilustracion } from "./Ilustraciones";
import alineado from "./tiempos.json";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "reposo", clave: [], sinSubtitulos: true },
  { ilustracion: "urss", gesto: "reposo", clave: ["Unión", "Soviética", "quince"] },
  { ilustracion: "urssRompe", gesto: "reposo", clave: ["1991", "rompió", "quince"], enfasis: { palabra: "rompió", x: 50, y: 50, zoom: 1.12 } },
  { ilustracion: "yugo", gesto: "reposo", clave: ["Yugoslavia", "bandera."] },
  { ilustracion: "yugoRompe", gesto: "reposo", clave: ["guerras", "siete"] },
  { ilustracion: "checo", gesto: "reposo", clave: ["Checoslovaquia", "disparo:", "Chequia", "Eslovaquia."] },
  { ilustracion: "alemania", gesto: "reposo", clave: ["Alemania", "Este", "revés:", "Oeste."] },
  { ilustracion: "grancol", gesto: "reposo", clave: ["Gran", "Colombia", "Bolívar"] },
  { ilustracion: "grancolRompe", gesto: "reposo", clave: ["doce", "años", "1831."] },
  { ilustracion: "centro", gesto: "reposo", clave: ["un", "solo", "país."] },
  { ilustracion: "centroRompe", gesto: "reposo", clave: ["Provincias", "Unidas", "1840."], enfasis: { palabra: "separó", x: 50, y: 52, zoom: 1.12 } },
  { ilustracion: "rau", gesto: "reposo", clave: ["Egipto", "Siria", "República", "tres", "años."] },
  { ilustracion: "final", gesto: "reposo", clave: [], sinSubtitulos: true },
];

function enfasisDe(texto: string, tiempos: number[], c?: Clave): Enfasis | undefined {
  if (!c) return undefined;
  const { palabra, ...resto } = c;
  const k = texto.split(" ").indexOf(palabra);
  if (k < 0) throw new Error(`"${palabra}" no está en: ${texto}`);
  return { en: tiempos[k], ...resto };
}

export const ESCENAS: Escena<Ilustracion>[] = alineado.frases.map((fr, i) => ({
  texto: fr.texto,
  segundos: fr.segundos,
  tiempos: fr.tiempos,
  ilustracion: ESCENA[i].ilustracion,
  gesto: ESCENA[i].gesto,
  clave: ESCENA[i].clave,
  sinSubtitulos: ESCENA[i].sinSubtitulos,
  enfasis: enfasisDe(fr.texto, fr.tiempos, ESCENA[i].enfasis),
}));

export const DURACION_TOTAL = Math.ceil(alineado.duracion * 30);

const normal = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export type Escenario = {
  dur: number; // frames de la escena
  en: (palabra: string, n?: number) => number; // frame (local) en que se dice esa palabra
};

export const ESCENARIOS = Object.fromEntries(
  ESCENAS.map((e) => {
    const palabras = e.texto.split(" ").map(normal);
    const en = (palabra: string, n = 1) => {
      const buscada = normal(palabra);
      let vistos = 0;
      for (let k = 0; k < palabras.length; k++) {
        if (palabras[k] === buscada && ++vistos === n) return Math.round((e.tiempos?.[k] ?? 0) * 30);
      }
      throw new Error(`"${palabra}" no está en: ${e.texto}`);
    };
    return [e.ilustracion, { dur: framesDe(e.segundos), en }];
  }),
) as Record<Ilustracion, Escenario>;
