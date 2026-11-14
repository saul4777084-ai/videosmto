// Guion del reel: cada escena tiene su texto, su ilustración y el gesto del avatar.
export type Gesto =
  | "senalar" // apunta con la mano
  | "negar" // mueve el cuerpo diciendo "no"
  | "presentar" // mano abierta presentando
  | "explicar" // mano sube y baja marcando el ritmo
  | "alarma" // mano en alto, temblando
  | "contar" // golpes de mano, enumerando
  | "saludar" // despedida
  | "leer"; // lee el libro abierto con las dos manos

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

export type Escena = {
  texto: string;
  segundos: number;
  ilustracion: Ilustracion;
  gesto: Gesto;
  // palabras que se resaltan en color
  clave?: string[];
};

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

export const FPS = 30;
export const framesDe = (s: number) => Math.round(s * FPS);
export const DURACION_TOTAL = ESCENAS.reduce((t, e) => t + framesDe(e.segundos), 0);

// Frame de inicio de cada escena
export const INICIOS = ESCENAS.reduce<number[]>((acc, e, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + framesDe(ESCENAS[i - 1].segundos));
  return acc;
}, []);
