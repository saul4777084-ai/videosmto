import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra (o el momento del mapa) que lo provoca
const e = ESCENARIOS;
const hunde = (t: number): Golpe => [t + 10, "chapuzon", 0.32];
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "viento", 0.35], [14, "golpe", 0.5], [28, "pop", 0.4], [56, "hielo_crujido", 0.4], [70, "olas", 0.4], [84, "subida", 0.3]],
  hielo: [[0, "viento", 0.3], [e.hielo.en("Antartida"), "hielo_crujido", 0.45], [e.hielo.en("hielo"), "pop", 0.35], [e.hielo.en("Groenlandia"), "cristal", 0.4]],
  derrite: [
    [e.derrite.en("derritiera"), "hielo_crujido", 0.5], [e.derrite.en("subiria"), "subida", 0.45], [e.derrite.en("subiria"), "olas", 0.4],
    [e.derrite.en("metros"), "golpe", 0.45], [e.derrite.en("edificio"), "pop", 0.4],
  ],
  europa: [[8, "olas", 0.4], hunde(e.europa.en("Amsterdam")), hunde(e.europa.en("Copenhague")), hunde(e.europa.en("Venecia")), hunde(e.europa.en("Londres"))],
  espana: [[8, "olas", 0.35], hunde(e.espana.en("Sevilla")), hunde(e.espana.en("Valencia")), [e.espana.en("Madrid"), "pop", 0.35], [e.espana.en("salvaria"), "exito", 0.45]],
  florida: [[8, "olas", 0.4], [e.florida.en("Florida"), "pop", 0.35], hunde(e.florida.en("Miami")), hunde(e.florida.en("Cancun"))],
  sudamerica: [[8, "olas", 0.4], [e.sudamerica.en("Buenos") + 12, "chapuzon", 0.32], [e.sudamerica.en("Amazonas"), "arroyo", 0.35], [e.sudamerica.en("mar"), "pop", 0.35]],
  asia: [[8, "olas", 0.4], [e.asia.en("Banglades"), "error", 0.3], hunde(e.asia.en("Shanghai")), hunde(e.asia.en("Bangkok"))],
  tiempo: [[6, "reloj", 0.45], [e.tiempo.en("5.000"), "subida", 0.4], [e.tiempo.en("5.000") + 36, "ding", 0.35]],
  ritmo: [[e.ritmo.en("subido"), "papel", 0.35], [e.ritmo.en("centimetros"), "ding", 0.4], [e.ritmo.en("rapido"), "alarma", 0.28]],
  final: [[12, "golpe", 0.45], [34, "notificacion", 0.45]],
};
