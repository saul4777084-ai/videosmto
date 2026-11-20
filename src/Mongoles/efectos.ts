import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra (o el momento del mapa) que lo provoca
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "viento", 0.35], [4, "subida", 0.35], [14, "golpe", 0.5], [30, "papel", 0.4]],
  nace: [[0, "viento", 0.3], [e.nace.en("1162"), "toc", 0.45], [e.nace.en("Temuyin"), "pop", 0.4], [e.nace.en("Mongolia"), "brisa", 0.35]],
  abandono: [[e.abandono.en("Envenenaron"), "error", 0.35], [e.abandono.en("abandono") - 6, "pasos", 0.4], [e.abandono.en("abandono") + 6, "golpe", 0.45], [e.abandono.en("familia"), "latido", 0.4]],
  gengis: [[e.gengis.en("1206"), "toc", 0.45], [e.gengis.en("unio"), "subida", 0.4], [e.gengis.en("Gengis"), "campana", 0.45], [e.gengis.en("Gengis") + 4, "golpe", 0.4]],
  muralla: [[0, "pasos", 0.35], [e.muralla.en("Gran"), "madera", 0.4], [e.muralla.en("Cruzo"), "whoosh", 0.35], [e.muralla.en("tomo"), "metal", 0.45], [e.muralla.en("tomo") + 4, "golpe", 0.4]],
  corasmia: [[e.corasmia.en("1219"), "toc", 0.45], [e.corasmia.en("arraso"), "fuego", 0.45], [e.corasmia.en("Samarcanda") + 8, "explosion", 0.3], [e.corasmia.en("Bujara") + 8, "explosion", 0.3]],
  muerte: [[e.muerte.en("Murio"), "campana", 0.4], [e.muerte.en("tumba"), "latido", 0.4], [e.muerte.en("encontrarse"), "golpe", 0.45]],
  europa: [[e.europa.en("nietos"), "subida", 0.4], [e.europa.en("Kiev"), "metal", 0.4], [e.europa.en("Hungria"), "metal", 0.4], [e.europa.en("1241"), "toc", 0.45]],
  bagdad: [[e.bagdad.en("1258"), "toc", 0.45], [e.bagdad.en("cayo"), "subida", 0.35], [e.bagdad.en("Bagdad") + 10, "explosion", 0.35], [e.bagdad.en("joya"), "brillo", 0.35]],
  maximo: [[e.maximo.en("1279"), "toc", 0.45], [e.maximo.en("conquisto"), "subida", 0.45], [e.maximo.en("24"), "caja_registradora", 0.4], [e.maximo.en("24") + 24, "exito", 0.4]],
  japon: [[6, "whoosh", 0.35], [8, "olas", 0.4], [e.japon.en("veces", 2), "whoosh", 0.35], [e.japon.en("tormentas") - 14, "tormenta", 0.5], [e.japon.en("tormentas"), "trueno", 0.45], [e.japon.en("tormentas") + 4, "golpe", 0.45]],
  final: [[10, "golpe", 0.45], [30, "golpe", 0.45], [52, "notificacion", 0.45]],
};
