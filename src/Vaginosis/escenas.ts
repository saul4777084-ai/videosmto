// Guion del reel de vaginosis: texto, ilustración y gesto del avatar en cada escena.
import { duracionDe, Escena as EscenaBase, FPS, iniciosDe } from "../comun/tipos";

export type Ilustracion =
  | "pez"
  | "jabon"
  | "lacto"
  | "acido"
  | "invasion"
  | "nombre"
  | "riesgo"
  | "limon"
  | "medico"
  | "final";

export type Escena = EscenaBase<Ilustracion>;

export const ESCENAS: Escena[] = [
  { texto: "¿Tu flujo huele a pescado?", segundos: 3.5, ilustracion: "pez", gesto: "senalar", clave: ["pescado?"] },
  { texto: "Tranquila, no es falta de higiene.", segundos: 3.5, ilustracion: "jabon", gesto: "negar", clave: ["higiene."] },
  { texto: "Por dentro te protegen bacterias buenas: los lactobacilos.", segundos: 4.5, ilustracion: "lacto", gesto: "explicar", clave: ["buenas:", "lactobacilos."] },
  { texto: "Fabrican ácido y mantienen el pH bajo.", segundos: 4, ilustracion: "acido", gesto: "leer", clave: ["ácido", "pH"] },
  { texto: "Pero cuando bajan, otras bacterias crecen sin control.", segundos: 4.5, ilustracion: "invasion", gesto: "alarma", clave: ["bajan,", "control."] },
  { texto: "Eso se llama vaginosis bacteriana.", segundos: 3.5, ilustracion: "nombre", gesto: "presentar", clave: ["vaginosis", "bacteriana."] },
  { texto: "Las duchas vaginales y el sexo sin condón aumentan el riesgo.", segundos: 5, ilustracion: "riesgo", gesto: "contar", clave: ["duchas", "condón", "riesgo."] },
  { texto: "No uses limón ni vinagre: lo empeoran.", segundos: 4, ilustracion: "limon", gesto: "negar", clave: ["limón", "vinagre:"] },
  { texto: "Tiene tratamiento. Consulta a tu médico.", segundos: 4.5, ilustracion: "medico", gesto: "presentar", clave: ["tratamiento.", "médico."] },
  { texto: "Sígueme para más salud.", segundos: 3, ilustracion: "final", gesto: "saludar", clave: ["Sígueme"] },
];

export { FPS };
export const DURACION_TOTAL = duracionDe(ESCENAS);
export const INICIOS = iniciosDe(ESCENAS);
