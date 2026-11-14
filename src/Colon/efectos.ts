import { Golpe } from "../comun/tipos";
import { Ilustracion } from "./escenas";

// Efectos de sonido por escena (frame local, efecto, volumen)
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  intro: [[6, "brillo", 0.6]],
  plan: [[8, "whoosh", 0.4], [40, "pop", 0.6]],
  reyes: [[6, "campana", 0.4], [22, "ding", 0.5], [30, "pop", 0.6]],
  zarpa: [[0, "olas", 0.5], [6, "campana", 0.6], [12, "pop", 0.5], [20, "pop", 0.5], [28, "pop", 0.5], [45, "ding", 0.4]],
  travesia: [[0, "olas", 0.6], [70, "olas", 0.5]],
  tierra: [[0, "olas", 0.5], [34, "campana", 0.8], [38, "brillo", 0.6]],
  guanahani: [[6, "whoosh", 0.4], [45, "brillo", 0.6], [70, "ding", 0.5]],
  indias: [[14, "pop", 0.6], [55, "ding", 0.5]],
};
