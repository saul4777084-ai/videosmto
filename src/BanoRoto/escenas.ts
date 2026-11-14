// Guion: "Consecuencias de un baño roto" (20 s)
import { duracionDe, Escena } from "../comun/tipos";

export type Ilustracion = "inodoro" | "fuga" | "factura" | "moho" | "danos" | "reparar";

export const ESCENAS: Escena<Ilustracion>[] = [
  { texto: "¿Tu baño está roto?", segundos: 3, ilustracion: "inodoro", gesto: "senalar", clave: ["roto?"] },
  { texto: "Una fuga desperdicia hasta 750 litros al día.", segundos: 3.5, ilustracion: "fuga", gesto: "alarma", clave: ["750", "litros"] },
  { texto: "Y tu factura de agua se dispara.", segundos: 3, ilustracion: "factura", gesto: "negar", clave: ["factura", "dispara."] },
  { texto: "La humedad trae moho y malos olores.", segundos: 3.5, ilustracion: "moho", gesto: "explicar", clave: ["moho", "olores."] },
  { texto: "Daña pisos, paredes y al vecino de abajo.", segundos: 3.5, ilustracion: "danos", gesto: "contar", clave: ["pisos,", "paredes", "vecino"] },
  { texto: "¡Repáralo a tiempo!", segundos: 3.5, ilustracion: "reparar", gesto: "presentar", clave: ["¡Repáralo", "tiempo!"] },
];

export const DURACION_TOTAL = duracionDe(ESCENAS);
