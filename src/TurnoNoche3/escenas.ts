// "Turno de noche" (gasolinera, parte 3 y final). Sigue justo donde acabó la parte 2 (src/TurnoNoche2):
// el falso encargado abre la puerta con tus llaves.
// Versión sin voz: cuando llegue el audio, se alinea con scripts/alinear_voz.py (guion.json → tiempos.json)
// y se hace como en la parte 2 (CON_VOZ = true, segundos y tiempos desde tiempos.json).
import { Escena, framesDe } from "../comun/tipos";

export const CON_VOZ = false;

export type Ilustracion =
  | "abre"
  | "apagon"
  | "ojos"
  | "tira"
  | "norespires"
  | "pasos"
  | "encima"
  | "asoma"
  | "reloj"
  | "luces"
  | "nadie"
  | "manana"
  | "cuentas"
  | "nunca"
  | "tablon"
  | "empapado"
  | "final";

const SIN_VOZ: Escena<Ilustracion>[] = [
  { ilustracion: "abre", segundos: 2.8, texto: "La puerta se abre.", clave: ["abre."] },
  { ilustracion: "apagon", segundos: 4.2, texto: "Y todos los fluorescentes se apagan a la vez.", clave: ["apagan"] },
  { ilustracion: "ojos", segundos: 3.8, texto: "En la oscuridad, solo brillan sus ojos.", clave: ["ojos."] },
  { ilustracion: "tira", segundos: 4.2, texto: "La mano helada tira de ti bajo el mostrador.", clave: ["tira", "mostrador."] },
  { ilustracion: "norespires", segundos: 2.8, texto: "«No respires.»", clave: ["respires.»"] },
  { ilustracion: "pasos", segundos: 4, texto: "Sus pasos mojados cruzan la tienda.", clave: ["mojados"] },
  { ilustracion: "encima", segundos: 3.6, texto: "Y se detienen justo encima de ti.", clave: ["encima"] },
  { ilustracion: "asoma", segundos: 5, texto: "«Sé que estás ahí. Por algo te di las llaves.»", clave: ["ahí.", "llaves.»"] },
  { ilustracion: "reloj", segundos: 3.6, texto: "Entonces, el reloj marca las 3:34.", clave: ["3:34."] },
  { ilustracion: "luces", segundos: 4.8, texto: "Silencio. Las luces vuelven. La tienda está vacía.", clave: ["vacía."] },
  { ilustracion: "nadie", segundos: 4.6, texto: "Te giras para darle las gracias… y no hay nadie.", clave: ["nadie."] },
  { ilustracion: "manana", segundos: 4.6, texto: "A las seis llega el encargado. El de verdad.", clave: ["verdad."] },
  { ilustracion: "cuentas", segundos: 5, texto: "Le cuentas todo. Solo dice: «El de antes que tú abrió.»", clave: ["abrió.»"] },
  { ilustracion: "nunca", segundos: 3.2, texto: "«Nunca volvimos a verle.»", clave: ["Nunca"] },
  { ilustracion: "tablon", segundos: 4.4, texto: "En el tablón, su foto: empleado del mes.", clave: ["foto:"] },
  { ilustracion: "empapado", segundos: 4.2, texto: "Es el hombre empapado. El que te salvó.", clave: ["empapado.", "salvó."] },
  { ilustracion: "final", segundos: 5, texto: "Esta noche te toca otra vez. ¿Volverías?", clave: ["¿Volverías?"] },
];

export const ESCENAS: Escena<Ilustracion>[] = SIN_VOZ;

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
