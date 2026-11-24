import { Golpe } from "../comun/tipos";
import { dur, en, Ilustracion } from "./escenas";

// Golpes de sonido en el momento en que aparece cada palabra; el ambiente va en Reel.tsx
export const GOLPES_CRISTAL = [0.08, 0.3, 0.52, 0.74];

export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  recap: [[0, "estatica", 0.5], [6, "latido_rapido", 0.5]],
  respira: [[0, "respiracion", 0.9], [en("respira", "tobillos."), "latido", 0.5]],
  movil: [[0, "toc_cristal", 0.7], [en("movil", "móvil"), "toc_cristal", 0.9]],
  pantalla: [[4, "tecla", 0.35], [16, "tecla", 0.35], [30, "tecla", 0.35], [48, "tecla", 0.35], [62, "tecla", 0.35], [76, "tecla", 0.35]],
  reloj: [[0, "reloj", 0.35], [en("reloj", "3:33."), "latido", 0.6]],
  recuerdo: [[0, "proyector", 0.25], [en("recuerdo", "abras.»"), "golpe", 0.4]],
  cam2: [[0, "estatica", 0.5], [en("cam2", "coche."), "golpe", 0.35]],
  andando: [[0, "pasos", 0.35], [en("andando", "otro."), "susto", 0.45]],
  cam1: [[0, "estatica", 0.5], [en("cam1", "nadie."), "susto", 0.5]],
  golpes: GOLPES_CRISTAL.map((p): Golpe => [Math.round(p * dur("golpes")), "toc_cristal", 1]),
  tobillo: [[0, "latido_rapido", 0.5], [en("tobillo", "agarra") - 3, "golpe", 0.7], [en("tobillo", "agarra") - 3, "susto", 0.6]],
  susurro: [[0, "estatica", 0.4], [6, "respiracion", 1]],
  aviso: [[0, "estatica", 0.5], [en("aviso", "encargado.»"), "latido", 0.6]],
  sonrisa: [[0, "trueno", 0.3], [en("sonrisa", "demasiado."), "susto", 0.9]],
  sacallaves: [[en("sacallaves", "llaves"), "cubitos", 0.5]],
  cerradura: [[18, "cerradura", 0.9], [en("cerradura", "él."), "latido", 0.6]],
  clic: [[6, "cerradura", 1], [8, "golpe", 0.7], [Math.round(dur("clic") * 0.6), "susto", 0.7]],
  final: [[0, "trueno", 0.35]],
};
