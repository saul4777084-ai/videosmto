// "El descubrimiento de América" (1 min) con la voz alineada palabra por palabra.
// Los tiempos salen de scripts/alinear_voz.py → tiempos.json
import { Escena, framesDe } from "../comun/tipos";
import { Ilustracion } from "./Ilustraciones";
import alineado from "./tiempos.json";

const ESCENA: { ilustracion: Ilustracion; clave: string[] }[] = [
  { ilustracion: "intro", clave: ["1492,", "atrevido."] },
  { ilustracion: "plan", clave: ["Colón,", "Asia", "oeste."] },
  { ilustracion: "portugal", clave: ["Portugal", "no.", "España"] },
  { ilustracion: "reyes", clave: ["Reyes", "Católicos,"] },
  { ilustracion: "zarpa", clave: ["agosto", "Palos", "barcos."] },
  { ilustracion: "flota", clave: ["Santa", "María,", "Pinta", "Niña,", "noventa"] },
  { ilustracion: "canarias", clave: ["Canarias"] },
  { ilustracion: "oceano", clave: ["océano", "desconocido."] },
  { ilustracion: "semanas", clave: ["semanas", "tierra."] },
  { ilustracion: "miedo", clave: ["miedo", "volver."] },
  { ilustracion: "tierra", clave: ["octubre,", "¡Tierra!"] },
  { ilustracion: "guanahani", clave: ["Bahamas", "Guanahaní."] },
  { ilustracion: "tainos", clave: ["taínos,", "curiosidad."] },
  { ilustracion: "indias", clave: ["Indias,", "indios."] },
  { ilustracion: "america", clave: ["continente", "nuevo", "América."] },
  { ilustracion: "final", clave: ["historia", "siempre."] },
];

export const ESCENAS: Escena<Ilustracion>[] = alineado.frases.map((fr, i) => ({
  texto: fr.texto,
  segundos: fr.segundos,
  tiempos: fr.tiempos,
  ilustracion: ESCENA[i].ilustracion,
  clave: ESCENA[i].clave,
}));

export const DURACION_TOTAL = Math.ceil(alineado.duracion * 30);

// duración real (en frames) de cada escena, para que sus animaciones se ajusten a la voz
export const DURACIONES = Object.fromEntries(ESCENAS.map((e) => [e.ilustracion, framesDe(e.segundos)])) as Record<Ilustracion, number>;
