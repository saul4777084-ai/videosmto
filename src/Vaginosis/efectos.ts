import { Golpe } from "../comun/tipos";
import { Ilustracion } from "./escenas";

// Efectos de cada escena, sincronizados con lo que aparece en pantalla
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  pez: [[8, "boing", 0.8]],
  jabon: [[4, "burbuja", 0.5], [18, "burbuja", 0.5], [30, "error", 0.7], [50, "burbuja", 0.4]],
  lacto: [[4, "pop", 0.5], [10, "pop", 0.5], [16, "pop", 0.5], [22, "pop", 0.5], [8, "brillo", 0.5]],
  acido: [[8, "burbuja", 0.45], [24, "burbuja", 0.45], [40, "burbuja", 0.45], [56, "burbuja", 0.45], [72, "burbuja", 0.45]],
  invasion: [
    [10, "alarma", 0.45],
    ...Array.from({ length: 12 }, (_, i): Golpe => [i * 8, "pop", 0.4]),
  ],
  nombre: [[4, "brillo", 0.7]],
  riesgo: [[20, "pop", 0.7], [55, "pop", 0.7]],
  limon: [[15, "error", 0.7], [35, "error", 0.6]],
  medico: [[2, "brillo", 0.6], [25, "pop", 0.6]],
  final: [[10, "pop", 0.7], [16, "ding", 0.6]],
};
