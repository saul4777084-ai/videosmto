import { Golpe } from "../comun/tipos";
import { dur, en, Ilustracion } from "./escenas";

// Sin voz, el sonido cuenta la mitad de la historia: ambiente (lluvia, zumbido y drone en Reel.tsx)
// y golpes en el momento exacto en que aparece cada palabra.
// saltos de imagen repartidos por la escena (sirve con y sin voz)
export const SALTOS_SALTOS = [0.16, 0.36, 0.56, 0.76].map((p) => Math.round(p * dur("saltos")));

export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  exterior: [[0, "trueno", 0.35]],
  cartel: [[0, "viento", 0.3]],
  llaves: [[22, "cubitos", 0.35], [en("llaves", "cosa:"), "golpe", 0.3]],
  encargado: [[8, "trueno", 0.5], [en("encargado", "3:33"), "latido", 0.5], [en("encargado", "abras.»"), "golpe", 0.45]],
  reloj: [[0, "reloj", 0.3], [12, "tic", 0.6], [14, "latido", 0.6]],
  nudillos: [[en("nudillos", "Toc.", 0), "toc_cristal", 0.9], [en("nudillos", "Toc.", 1), "toc_cristal", 0.9], [en("nudillos", "Toc.", 2), "toc_cristal", 0.9]],
  puerta: [[0, "viento", 0.35], [en("puerta", "nadie."), "golpe", 0.3]],
  cam2: [[0, "estatica", 0.5], [en("cam2", "hombre"), "latido", 0.45], [en("cam2", "coche,"), "golpe", 0.35]],
  cam2cara: [[0, "estatica", 0.4], [en("cam2cara", "cámara."), "susto", 0.45]],
  rebobinar: [[0, "rebobinar", 0.45], [48, "clic", 0.5], [en("rebobinar", "sola."), "golpe", 0.4]],
  campanita: [[en("campanita", "campanita."), "campanita", 0.6], [en("campanita", "viento."), "viento", 0.3]],
  cam3: [[0, "estatica", 0.45], [en("cam3", "dentro."), "susto", 0.4]],
  saltos: [[0, "latido_rapido", 0.5], [Math.round(dur("saltos") / 2), "latido_rapido", 0.55], ...SALTOS_SALTOS.map((s): Golpe => [s, "estatica", 0.6])],
  vacias: [[0, "estatica", 0.6], [en("vacias", "desaparece"), "golpe", 0.4]],
  pasillo: [[0, "latido", 0.45], [30, "zumbido", 0.4], [en("pasillo", "vacío."), "latido", 0.5]],
  cam4: [[0, "estatica", 0.4], [10, "latido_rapido", 0.45]],
  cam4pies: [[0, "latido_rapido", 0.55], [en("cam4pies", "él."), "susto", 0.85]],
  cristal: [[en("cristal", "Toc.", 0), "toc_cristal", 1], [en("cristal", "Toc.", 1), "toc_cristal", 1], [en("cristal", "Toc.", 2), "toc_cristal", 1], [en("cristal", "encargado,"), "golpe", 0.5]],
  grito: [[0, "susto", 1], [0, "golpe", 0.8], [Math.round(dur("grito") * 0.5), "estatica", 0.5]],
  final: [[0, "trueno", 0.35]],
};
