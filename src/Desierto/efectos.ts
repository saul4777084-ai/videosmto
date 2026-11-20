import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "viento", 0.35], [e.gancho.en("perdido"), "whoosh", 0.4], [e.gancho.en("desierto"), "error", 0.3], [e.gancho.en("grados"), "fuego", 0.4]],
  cuerpo: [[e.cuerpo.en("cuerpo"), "latido", 0.45], [e.cuerpo.en("37"), "ding", 0.35], [e.cuerpo.en("40"), "golpe", 0.45], [e.cuerpo.en("golpe"), "alarma", 0.3]],
  sudor: [[e.sudor.en("sudas"), "gota", 0.5], [e.sudor.en("litro"), "vertido", 0.4], [e.sudor.en("hora"), "pop", 0.35]],
  cerebro: [[e.cerebro.en("2"), "tic", 0.4], [e.cerebro.en("peor"), "negacion", 0.35], [e.cerebro.en("10"), "golpe", 0.4], [e.cerebro.en("deliras"), "magia", 0.45]],
  movil: [[e.movil.en("rinde"), "swoosh", 0.35], [e.movil.en("movil"), "error", 0.4], [e.movil.en("35"), "alarma", 0.3]],
  valle: [[0, "whoosh", 0.35], [e.valle.en("valle"), "campana", 0.3], [e.valle.en("56,7"), "golpe", 0.4], [e.valle.en("suelo"), "fuego", 0.35], [e.valle.en("94"), "golpe", 0.5]],
  huevos: [[e.huevos.en("guardabosques"), "madera", 0.4], [e.huevos.en("turistas"), "camara", 0.4], [e.huevos.en("freir"), "fuego", 0.35], [e.huevos.en("huevos"), "pop", 0.4]],
  coche: [[e.coche.en("para"), "explosion", 0.25], [e.coche.en("encierres"), "negacion", 0.35], [e.coche.en("sube"), "subida", 0.4], [e.coche.en("minutos"), "reloj", 0.4]],
  aire: [[e.aire.en("sombra"), "brisa", 0.3], [e.aire.en("aire"), "whoosh", 0.4], [e.aire.en("coche"), "exito", 0.4], [e.aire.en("persona"), "error", 0.35]],
  dias: [[e.dias.en("sin"), "reloj", 0.35], [e.dias.en("dias"), "ding", 0.4], [e.dias.en("caminando"), "pasos", 0.45], [e.dias.en("uno"), "golpe", 0.45]],
  mito1: [[e.mito1.en("mito"), "golpe", 0.45], [e.mito1.en("racionar"), "gota", 0.4], [e.mito1.en("militares"), "metal", 0.35], [e.mito1.en("sudor"), "papel", 0.35], [e.mito1.en("agua", 2), "burbujas", 0.4]],
  mito2: [[e.mito2.en("mito"), "golpe", 0.45], [e.mito2.en("cactus"), "boing", 0.35], [e.mito2.en("vomitar"), "salpicadura", 0.4], [e.mito2.en("liquido"), "caida", 0.35]],
  noche: [[e.noche.en("camina"), "pasos", 0.4], [e.noche.en("noche"), "magia", 0.35], [e.noche.en("tapate"), "papel", 0.35], [e.noche.en("beduinos"), "viento", 0.3]],
  tunicas: [[e.tunicas.en("negras"), "pop", 0.35], [e.tunicas.en("blancas"), "pop", 0.35], [e.tunicas.en("aire"), "brisa", 0.4]],
  prosperi: [[e.prosperi.en("1994"), "notificacion", 0.4], [e.prosperi.en("perdio"), "tormenta", 0.35], [e.prosperi.en("nueve"), "reloj", 0.35]],
  argelia: [[0, "whoosh", 0.35], [e.argelia.en("orina"), "vertido", 0.3], [e.argelia.en("murcielagos"), "boing", 0.3], [e.argelia.en("argelia"), "campana", 0.35], [e.argelia.en("300"), "golpe", 0.5]],
  final: [[e.final.en("horas"), "reloj", 0.35], [e.final.en("escribelo"), "tecla", 0.35], [e.final.en("escribelo") + 12, "tecla", 0.3], [e.final.en("sigueme"), "clic", 0.45], [e.final.en("sigueme") + 8, "notificacion", 0.4]],
};
