import { Golpe } from "../comun/tipos";
import { EFECTOS as BASE } from "../Colon/efectos";
import { Ilustracion } from "./Ilustraciones";

// efectos más suaves que en la versión sin voz, para que no tapen al narrador
const bajar = (g: Golpe[]): Golpe[] => g.map(([f, e, v = 0.6]) => [f, e, v * 0.6]);

export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  intro: bajar(BASE.intro),
  plan: bajar(BASE.plan),
  portugal: [[14, "error", 0.35], [70, "ding", 0.25]],
  reyes: bajar(BASE.reyes),
  zarpa: bajar(BASE.zarpa),
  flota: [[0, "olas", 0.3], [6, "pop", 0.3], [40, "pop", 0.3], [60, "pop", 0.3], [80, "campana", 0.3]],
  canarias: [[60, "pop", 0.3], [80, "pop", 0.3]],
  oceano: [[0, "olas", 0.35], [30, "brillo", 0.25]],
  semanas: [[0, "olas", 0.3]],
  miedo: [[0, "olas", 0.4], [10, "error", 0.3], [50, "error", 0.3]],
  tierra: bajar(BASE.tierra),
  guanahani: bajar(BASE.guanahani),
  tainos: [[0, "olas", 0.3], [8, "pop", 0.3]],
  indias: [[8, "pop", 0.3]],
  america: [[40, "brillo", 0.35], [120, "ding", 0.3]],
  final: [[8, "brillo", 0.35], [40, "campana", 0.3]],
};
