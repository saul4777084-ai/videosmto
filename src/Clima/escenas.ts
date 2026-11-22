// "La Tierra tiene fiebre" — calentamiento global. Sin voz: tiempos.json es "provisional" (scripts/tiempos_sin_voz.py);
// si llega la voz del usuario, se alinea con scripts/alinear_voz.py y suena public/voz/clima.mp3.
// Música: public/sfx/musica_clima.wav (scripts/musica_fondo.py) gira a mayor en «La buena noticia»; con otra voz,
// vuelve a generarla con --giro = inicio de esa frase / duración.
// Datos: OMM (2024 ≈ +1,55 °C sobre la era preindustrial; 2015–2024, los diez años más cálidos), NOAA (CO2 ≈ 424 ppm
// frente a ~280 en 1800; máximo en 800.000 años por testigos de hielo; 4.º blanqueo global de corales: 84 % de los
// arrecifes, 2023–2025), Global Carbon Project (≈ 37.000 Mt de CO2 fósil al año), NSIDC (hielo ártico de septiembre
// ≈ −40 % desde 1979), Ballester et al. 2023, Nature Medicine (≈ 61.600 muertes por calor en Europa, verano 2022),
// NASA (calentamiento actual ≈ 10 veces más rápido que la salida de la última glaciación), IPCC SR1.5 (corales:
// −70–90 % a 1,5 °C, > 99 % a 2 °C), AIE 2020 (solar, «la electricidad más barata de la historia»),
// Poore y Nemecek 2018, Science (ternera ≈ 60 kg CO2e por kg).
import { Enfasis, Escena, framesDe, Gesto } from "../comun/tipos";
import alineado from "./tiempos.json";

export type Ilustracion =
  | "gancho"
  | "record"
  | "fiebre"
  | "manta"
  | "toneladas"
  | "curva"
  | "ranking"
  | "artico"
  | "coral"
  | "europa"
  | "extremos"
  | "mito1"
  | "mito2"
  | "dos"
  | "solar"
  | "ternera"
  | "final";

type Clave = { palabra: string } & Omit<Enfasis, "en">;

const ESCENA: { ilustracion: Ilustracion; gesto: Gesto; clave: string[]; sinSubtitulos?: boolean; enfasis?: Clave }[] = [
  { ilustracion: "gancho", gesto: "alarma", clave: [], sinSubtitulos: true },
  { ilustracion: "record", gesto: "senalar", clave: ["caluroso", "1,5"], enfasis: { palabra: "1,5", x: 50, y: 45, zoom: 1.1 } },
  { ilustracion: "fiebre", gesto: "explicar", clave: ["1,5", "fiebre."] },
  { ilustracion: "manta", gesto: "presentar", clave: ["manta", "CO2"] },
  { ilustracion: "toneladas", gesto: "alarma", clave: ["37.000", "toneladas."], enfasis: { palabra: "37.000", x: 50, y: 40, zoom: 1.1 } },
  { ilustracion: "curva", gesto: "senalar", clave: ["50", "800.000"] },
  { ilustracion: "ranking", gesto: "contar", clave: ["diez", "últimos"] },
  { ilustracion: "artico", gesto: "alarma", clave: ["Ártico", "40"], enfasis: { palabra: "40", x: 50, y: 50, zoom: 1.1 } },
  { ilustracion: "coral", gesto: "negar", clave: ["84", "blanqueó."] },
  { ilustracion: "europa", gesto: "alarma", clave: ["mata:", "60.000"], enfasis: { palabra: "60.000", x: 50, y: 50, zoom: 1.1 } },
  { ilustracion: "extremos", gesto: "contar", clave: ["incendios,", "sequías", "tormentas"] },
  { ilustracion: "mito1", gesto: "negar", clave: ["siempre", "diez"] },
  { ilustracion: "mito2", gesto: "explicar", clave: ["día;", "treinta"] },
  { ilustracion: "dos", gesto: "alarma", clave: ["2", "corales"] },
  { ilustracion: "solar", gesto: "presentar", clave: ["buena", "barata"], enfasis: { palabra: "barata", x: 50, y: 50, zoom: 1.1 } },
  { ilustracion: "ternera", gesto: "senalar", clave: ["ternera", "60"] },
  { ilustracion: "final", gesto: "presentar", clave: ["A:", "B:", "Comenta"] },
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
export const CON_VOZ = !("provisional" in alineado);

const normal = (p: string) =>
  p
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export type Escenario = {
  dur: number; // frames de la escena
  en: (palabra: string, n?: number) => number; // frame local en que se dice esa palabra
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
