import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "whoosh", 0.4], [e.gancho.en("cuerpo"), "latido", 0.45], [e.gancho.en("mueves"), "reloj", 0.4], [e.gancho.en("mes?"), "golpe", 0.45]],
  mes: [[e.mes.en("mes"), "papel", 0.4], [e.mes.en("tumbado,"), "puff", 0.4], [e.mes.en("cambia"), "magia", 0.3], [e.mes.en("dia"), "ding", 0.3]],
  piel: [[e.piel.en("dos"), "reloj", 0.45], [e.piel.en("piel"), "alarma", 0.3], [e.piel.en("hospitales"), "notificacion", 0.3], [e.piel.en("giran"), "swoosh", 0.45]],
  sangre: [[e.sangre.en("sangre"), "gota", 0.5], [e.sangre.en("10"), "golpe", 0.45], [e.sangre.en("liquido"), "vertido", 0.35]],
  mareo: [[e.mareo.en("levantarte,"), "subida", 0.35], [e.mareo.en("mareas"), "magia", 0.35], [e.mareo.en("corazon"), "latido", 0.5], [e.mareo.en("cabeza"), "boing", 0.35]],
  azucar: [[e.azucar.en("cinco"), "pop", 0.4], [e.azucar.en("musculos"), "golpe", 0.3], [e.azucar.en("peor"), "negacion", 0.35], [e.azucar.en("azucar"), "cubitos", 0.4]],
  piernas: [[e.piernas.en("piernas"), "whoosh", 0.35], [e.piernas.en("derriten"), "vertido", 0.4], [e.piernas.en("diez"), "reloj", 0.35], [e.piernas.en("kilo"), "golpe", 0.5]],
  fuerza: [[e.fuerza.en("fuerza"), "metal", 0.4], [e.fuerza.en("cae"), "caida", 0.45], [e.fuerza.en("uno"), "pop", 0.4], [e.fuerza.en("dia"), "error", 0.3]],
  corazon: [[0, "latido", 0.4], [e.corazon.en("encoge,"), "puff", 0.4], [e.corazon.en("bombea"), "latido", 0.45], [e.corazon.en("latido"), "latido", 0.35]],
  huesos: [[e.huesos.en("huesos"), "madera", 0.45], [e.huesos.en("calcio,"), "cristal", 0.35], [e.huesos.en("astronauta"), "magia", 0.35], [e.huesos.en("mes"), "cristal_roto", 0.3]],
  coagulos: [[e.coagulos.en("peligroso"), "alarma", 0.35], [e.coagulos.en("estanca"), "gota", 0.4], [e.coagulos.en("coagulos"), "golpe", 0.5]],
  dallas: [[e.dallas.en("1966,"), "papel", 0.4], [e.dallas.en("cinco"), "camara", 0.4], [e.dallas.en("tres"), "pop", 0.35], [e.dallas.en("cama"), "puff", 0.35], [e.dallas.en("dallas"), "campana", 0.3]],
  edad: [[e.edad.en("cayo"), "caida", 0.45], [e.edad.en("treinta"), "reloj", 0.4], [e.edad.en("edad"), "trueno", 0.25], [e.edad.en("dano"), "golpe", 0.5]],
  mito: [[e.mito.en("cama"), "puff", 0.35], [e.mito.en("espalda"), "error", 0.3], [e.mito.en("mito"), "negacion", 0.45], [e.mito.en("moverte"), "exito", 0.4]],
  consejos: [[e.consejos.en("tobillos"), "pop", 0.4], [e.consejos.en("tobillos") + 9, "pop", 0.35], [e.consejos.en("levantate"), "subida", 0.35], [e.consejos.en("caminar"), "pasos", 0.45]],
  astronautas: [[0, "whoosh", 0.35], [e.astronautas.en("dos"), "ding", 0.35], [e.astronautas.en("ejercicio"), "pasos", 0.45], [e.astronautas.en("espacio"), "brillo", 0.35]],
  vuelve: [[e.vuelve.en("buena"), "brillo", 0.35], [e.vuelve.en("vuelve"), "subida", 0.4], [e.vuelve.en("ocho"), "pop", 0.4], [e.vuelve.en("entrenamiento"), "exito", 0.5]],
  final: [[e.final.en("horas"), "reloj", 0.35], [e.final.en("escribelo"), "tecla", 0.35], [e.final.en("escribelo") + 12, "tecla", 0.3], [e.final.en("sigueme"), "clic", 0.45], [e.final.en("sigueme") + 8, "notificacion", 0.4]],
};
