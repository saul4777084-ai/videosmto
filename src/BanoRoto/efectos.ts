import { Golpe } from "../comun/tipos";
import { Ilustracion } from "./escenas";

// Efectos de sonido sincronizados con cada ilustración (frame local, efecto, volumen)
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  inodoro: [[6, "error", 0.5], [20, "burbuja", 0.5], [45, "burbuja", 0.5], [70, "burbuja", 0.5]],
  fuga: [[6, "alarma", 0.4], ...Array.from({ length: 8 }, (_, i): Golpe => [10 + i * 11, "burbuja", 0.35])],
  factura: [[8, "pop", 0.7], [30, "error", 0.6], [60, "ding", 0.4]],
  moho: [[6, "boing", 0.6], ...Array.from({ length: 6 }, (_, i): Golpe => [15 + i * 12, "pop", 0.35])],
  danos: [[14, "error", 0.5], [40, "error", 0.5], [70, "burbuja", 0.5]],
  reparar: [[6, "whoosh", 0.4], [22, "brillo", 0.7], [40, "ding", 0.6]],
};
