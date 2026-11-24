import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra (o el momento del mapa) que lo provoca
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "viento", 0.3], [4, "subida", 0.35], [14, "golpe", 0.5], [30, "papel", 0.4]],
  zarpa: [[0, "olas", 0.4], [e.zarpa.en("1519"), "toc", 0.45], [e.zarpa.en("Cuba"), "pop", 0.35], [e.zarpa.en("11"), "campana", 0.4]],
  veracruz: [[0, "olas", 0.35], [e.veracruz.en("Mexico"), "pop", 0.35], [e.veracruz.en("Veracruz"), "campana", 0.4], [e.veracruz.en("Veracruz") + 6, "papel", 0.35]],
  barcos: [[e.barcos.en("hundio"), "madera", 0.45], [e.barcos.en("hundio") + 4, "chapuzon", 0.4], [e.barcos.en("hundio") + 11, "chapuzon", 0.35], [e.barcos.en("hundio") + 18, "chapuzon", 0.35], [e.barcos.en("hundio") + 16, "golpe", 0.45]],
  aliados: [[0, "pasos", 0.35], [e.aliados.en("totonacas"), "pop", 0.35], [e.aliados.en("tlaxcaltecas"), "pop", 0.35], [e.aliados.en("enemigos"), "metal", 0.4]],
  tenochtitlan: [[0, "pasos", 0.35], [e.tenochtitlan.en("Tenochtitlan"), "campana", 0.45], [e.tenochtitlan.en("lago"), "arroyo", 0.35]],
  moctezuma: [[e.moctezuma.en("Moctezuma"), "brillo", 0.4], [e.moctezuma.en("regalos"), "moneda", 0.4], [e.moctezuma.en("regalos") + 8, "moneda", 0.35], [e.moctezuma.en("prisionero"), "metal", 0.45], [e.moctezuma.en("prisionero") + 3, "golpe", 0.45]],
  noche: [[0, "viento", 0.35], [e.noche.en("1520"), "toc", 0.45], [e.noche.en("Noche"), "golpe", 0.45], [e.noche.en("huyeron"), "pasos", 0.45], [e.noche.en("cientos"), "latido", 0.4]],
  asedio: [[e.asedio.en("volvio"), "subida", 0.4], [e.asedio.en("aliados"), "pasos", 0.4], [e.asedio.en("13"), "olas", 0.4], [e.asedio.en("lago"), "madera", 0.35]],
  viruela: [[0, "latido", 0.35], [e.viruela.en("viruela"), "error", 0.4], [e.viruela.en("viruela") + 4, "golpe", 0.4], [e.viruela.en("muchisimos"), "latido", 0.4]],
  caida: [[e.caida.en("agosto"), "toc", 0.45], [e.caida.en("cayo"), "explosion", 0.35], [e.caida.en("Ciudad"), "magia", 0.4], [e.caida.en("Mexico"), "exito", 0.4]],
  final: [[10, "golpe", 0.45], [34, "notificacion", 0.45]],
};
