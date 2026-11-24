// "Turno de noche" (gasolinera, parte 2). Sigue justo donde acabó la parte 1 (src/TurnoNoche).
// Sin voz: cada escena dura lo necesario para leerla. Al recibir la voz, se alinea igual que la parte 1.
import { Escena, framesDe } from "../comun/tipos";

export type Ilustracion =
  | "recap"
  | "respira"
  | "movil"
  | "pantalla"
  | "reloj"
  | "recuerdo"
  | "cam2"
  | "andando"
  | "cam1"
  | "golpes"
  | "tobillo"
  | "susurro"
  | "aviso"
  | "sonrisa"
  | "sacallaves"
  | "cerradura"
  | "clic"
  | "final";

export const ESCENAS: Escena<Ilustracion>[] = [
  { ilustracion: "recap", segundos: 3.5, texto: "No bajas la mirada.", clave: ["mirada."] },
  { ilustracion: "respira", segundos: 4, texto: "Algo respira junto a tus tobillos.", clave: ["respira", "tobillos."] },
  { ilustracion: "movil", segundos: 4.5, texto: "Fuera, el encargado pega su móvil al cristal.", clave: ["móvil"] },
  { ilustracion: "pantalla", segundos: 4, texto: "«ABRE. RÁPIDO. NO LE MIRES.»", sinSubtitulos: true },
  { ilustracion: "reloj", segundos: 4, texto: "Pero el reloj sigue marcando las 3:33.", clave: ["3:33."] },
  { ilustracion: "recuerdo", segundos: 5.5, texto: "Y él mismo te lo dijo: «Si llaman al cristal, no abras.»", clave: ["no", "abras.»"] },
  { ilustracion: "cam2", segundos: 4, texto: "En la cámara 2 no hay ningún coche.", clave: ["ningún", "coche."] },
  { ilustracion: "andando", segundos: 3.8, texto: "Ha venido andando… como el otro.", clave: ["como", "otro."] },
  { ilustracion: "cam1", segundos: 5, texto: "Y en la cámara de la puerta… fuera no hay nadie.", clave: ["nadie."] },
  { ilustracion: "golpes", segundos: 4.5, texto: "Pero tú lo estás viendo. Golpeando el cristal.", clave: ["viendo."] },
  { ilustracion: "tobillo", segundos: 4.5, texto: "Entonces, una mano helada te agarra el tobillo.", clave: ["helada", "tobillo."] },
  { ilustracion: "susurro", segundos: 3.8, texto: "Y una voz rota susurra desde abajo:", clave: ["susurra"] },
  { ilustracion: "aviso", segundos: 3.5, texto: "«Ese no es el encargado.»", clave: ["no", "es"] },
  { ilustracion: "sonrisa", segundos: 5, texto: "Miras al cristal. El encargado sonríe… demasiado.", clave: ["demasiado."] },
  { ilustracion: "sacallaves", segundos: 3.8, texto: "Y saca unas llaves del bolsillo.", clave: ["llaves"] },
  { ilustracion: "cerradura", segundos: 4, texto: "Tus llaves. Las que te dio él.", clave: ["Tus", "él."] },
  { ilustracion: "clic", segundos: 2.2, texto: "Clic.", clave: ["Clic."] },
  { ilustracion: "final", segundos: 4.5, texto: "¿Abrirías tú? Parte 3 en mi perfil.", clave: ["Parte", "3"] },
];

export const DURACION_TOTAL = ESCENAS.reduce((t, e) => t + framesDe(e.segundos), 0);

// Frame (dentro de su escena) en que aparece una palabra, igual que lo calculan los subtítulos
export const en = (id: Ilustracion, palabra: string, n = 0) => {
  const e = ESCENAS.find((x) => x.ilustracion === id)!;
  const palabras = e.texto.split(" ");
  let k = -1;
  for (let i = 0, vistos = 0; i < palabras.length; i++) {
    if (palabras[i] === palabra && vistos++ === n) {
      k = i;
      break;
    }
  }
  if (k < 0) throw new Error(`"${palabra}" no está en: ${e.texto}`);
  if (e.tiempos) return Math.round(e.tiempos[k] * 30);
  return Math.round((k * framesDe(e.segundos) * 0.78) / palabras.length);
};
export const dur = (id: Ilustracion) => framesDe(ESCENAS.find((x) => x.ilustracion === id)!.segundos);
