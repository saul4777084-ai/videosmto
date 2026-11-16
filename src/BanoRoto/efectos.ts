import { Golpe } from "../comun/tipos";
import { Ilustracion } from "./escenas";

// Efectos sincronizados con cada ilustración (frame local, efecto, volumen). Bajos para no tapar la voz.
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  inodoro: [[2, "golpe", 0.3]],
  fuga: [[6, "alarma", 0.2], [12, "vertido", 0.25], ...Array.from({ length: 6 }, (_, i): Golpe => [20 + i * 18, "gota", 0.22])],
  factura: [[6, "papel", 0.35], [28, "subida", 0.3], [60, "caja_registradora", 0.35]],
  moho: [[6, "puff", 0.3], ...Array.from({ length: 5 }, (_, i): Golpe => [18 + i * 14, "pop", 0.2])],
  danos: [[30, "madera", 0.3], [62, "golpe", 0.25], [95, "salpicadura", 0.25]],
  reparar: [[4, "metal", 0.35], [20, "exito", 0.45], [40, "brillo", 0.35]],
};
