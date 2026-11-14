// Guion: "La llegada de Colón" (35 s, sin avatar)
import { duracionDe, Escena } from "../comun/tipos";

export type Ilustracion = "intro" | "plan" | "reyes" | "zarpa" | "travesia" | "tierra" | "guanahani" | "indias";

export const ESCENAS: Escena<Ilustracion>[] = [
  { texto: "En 1492, un navegante tenía un plan.", segundos: 4, ilustracion: "intro", clave: ["1492,", "plan."] },
  { texto: "Llegar a Asia navegando hacia el oeste.", segundos: 4.5, ilustracion: "plan", clave: ["Asia", "oeste."] },
  { texto: "Los Reyes Católicos pagaron el viaje.", segundos: 4, ilustracion: "reyes", clave: ["Reyes", "Católicos"] },
  { texto: "El 3 de agosto zarpó de Palos con tres barcos.", segundos: 5, ilustracion: "zarpa", clave: ["agosto", "tres", "barcos."] },
  { texto: "Cruzaron el Atlántico durante más de dos meses.", segundos: 5, ilustracion: "travesia", clave: ["Atlántico", "meses."] },
  { texto: "El 12 de octubre, un vigía gritó: ¡Tierra!", segundos: 4, ilustracion: "tierra", clave: ["octubre,", "¡Tierra!"] },
  { texto: "Desembarcaron en Guanahaní, en las Bahamas.", segundos: 4.5, ilustracion: "guanahani", clave: ["Guanahaní,", "Bahamas."] },
  { texto: "Colón creyó que era Asia… pero era América.", segundos: 4, ilustracion: "indias", clave: ["Asia…", "América."] },
];

export const DURACION_TOTAL = duracionDe(ESCENAS);
