import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra (o el momento del mapa) que lo provoca
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "viento", 0.35], [4, "subida", 0.35], [12, "golpe", 0.5], [28, "papel", 0.4]],
  nace: [[0, "viento", 0.3], [e.nace.en("356"), "toc", 0.45], [e.nace.en("Alejandro"), "campana", 0.4], [e.nace.en("Pela"), "pop", 0.4]],
  rey: [[e.rey.en("Aristoteles"), "papel", 0.4], [e.rey.en("20"), "subida", 0.4], [e.rey.en("rey"), "campana", 0.45], [e.rey.en("rey") + 4, "golpe", 0.4]],
  asia: [[e.asia.en("334"), "toc", 0.45], [e.asia.en("cruzo") - 4, "pasos", 0.4], [e.asia.en("Asia"), "whoosh", 0.35], [e.asia.en("40.000"), "metal", 0.4]],
  isos: [[0, "pasos", 0.35], [e.isos.en("Isos"), "metal", 0.45], [e.isos.en("Isos") + 4, "golpe", 0.45], [e.isos.en("huyo") - 4, "whoosh", 0.4], [e.isos.en("huyo"), "golpe", 0.4]],
  egipto: [[e.egipto.en("Egipto"), "toc", 0.45], [e.egipto.en("faraon"), "magia", 0.4], [e.egipto.en("Alejandria"), "pop", 0.4], [e.egipto.en("Alejandria") + 6, "brillo", 0.35]],
  gaugamela: [[0, "pasos", 0.35], [e.gaugamela.en("Gaugamela"), "metal", 0.45], [e.gaugamela.en("Dario"), "whoosh", 0.35], [e.gaugamela.en("derrumbo") - 4, "caida", 0.4], [e.gaugamela.en("derrumbo"), "golpe", 0.5]],
  persepolis: [[e.persepolis.en("Babilonia"), "pop", 0.4], [e.persepolis.en("Persepolis"), "toc", 0.4], [e.persepolis.en("quemo") + 6, "fuego", 0.5], [e.persepolis.en("quemo") + 10, "explosion", 0.3]],
  india: [[0, "pasos", 0.35], [e.india.en("326"), "toc", 0.45], [e.india.en("India"), "whoosh", 0.35], [e.india.en("Poro"), "metal", 0.4], [e.india.en("elefantes") - 4, "boing", 0.25], [e.india.en("elefantes"), "golpe", 0.45]],
  motin: [[0, "pasos", 0.3], [e.motin.en("agotado"), "latido", 0.4], [e.motin.en("nego"), "error", 0.4], [e.motin.en("nego") + 2, "golpe", 0.45], [e.motin.en("volver"), "swoosh", 0.4]],
  muerte: [[e.muerte.en("Murio"), "campana", 0.4], [e.muerte.en("323"), "toc", 0.45], [e.muerte.en("32"), "latido", 0.45], [e.muerte.en("32") + 4, "golpe", 0.4]],
  maximo: [[e.maximo.en("11"), "reloj", 0.35], [e.maximo.en("5"), "caja_registradora", 0.4], [e.maximo.en("5") + 24, "exito", 0.4], [e.maximo.en("batalla") - 6, "golpe", 0.45]],
  final: [[4, "golpe", 0.45], [16, "whoosh", 0.3], [26, "whoosh", 0.3], [36, "whoosh", 0.3], [64, "notificacion", 0.45]],
};
