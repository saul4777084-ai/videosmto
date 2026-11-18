import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "viento", 0.45], [e.gancho.en("atrapado"), "congelar", 0.4], [e.gancho.en("cero?"), "hielo_crujido", 0.5]],
  cuerpo: [[e.cuerpo.en("37"), "latido", 0.45], [e.cuerpo.en("pierda"), "caida", 0.35], [e.cuerpo.en("peligro."), "alarma", 0.3]],
  hipotermia: [[e.hipotermia.en("hipotermia:"), "golpe", 0.35], [e.hipotermia.en("tiemblas"), "cubitos", 0.45], [e.hipotermia.en("manos"), "pop", 0.35]],
  temblor: [[0, "brisa", 0.3], [e.temblor.en("detiene."), "negacion", 0.35], [e.temblor.en("buena"), "ding", 0.3], [e.temblor.en("peor:"), "golpe", 0.45], [e.temblor.en("rinde."), "caida", 0.3]],
  confusion: [[e.confusion.en("confusión:"), "magia", 0.3], [e.confusion.en("tropiezas"), "boing", 0.35], [e.confusion.en("peligro."), "error", 0.3]],
  corazon: [[0, "latido", 0.45], [e.corazon.en("conocimiento"), "puff", 0.35], [e.corazon.en("corazón"), "latido", 0.5], [e.corazon.en("fallar."), "alarma", 0.35]],
  regla: [[e.regla.en("reloj."), "reloj", 0.45], [e.regla.en("agua"), "chapuzon", 0.45], [e.regla.en("uno,"), "pop", 0.4], [e.regla.en("diez,"), "pop", 0.4], [e.regla.en("uno."), "pop", 0.4]],
  minuto: [[0, "salpicadura", 0.4], [e.minuto.en("shock:"), "golpe", 0.45], [e.minuto.en("jadeas"), "burbujas", 0.4], [e.minuto.en("ahogas."), "error", 0.35]],
  diez: [[0, "reloj", 0.35], [e.diez.en("nadar"), "olas", 0.35], [e.diez.en("salir,"), "salpicadura", 0.35], [e.diez.en("apaguen."), "negacion", 0.35]],
  hora: [[0, "reloj", 0.35], [e.hora.en("desmayarte"), "caida", 0.4], [e.hora.en("frío."), "congelar", 0.4]],
  agua: [[e.agua.en("agua"), "gota", 0.45], [e.agua.en("25"), "golpe", 0.45], [e.agua.en("aire."), "brisa", 0.3]],
  viento: [[e.viento.en("viento:"), "viento", 0.55], [e.viento.en("40"), "subida", 0.3], [e.viento.en("congela"), "congelar", 0.45], [e.viento.en("diez"), "alarma", 0.3]],
  ropa: [[e.ropa.en("ropa"), "papel", 0.35], [e.ropa.en("20"), "hielo_crujido", 0.35], [e.ropa.en("viento,"), "viento", 0.45], [e.ropa.en("horas."), "reloj", 0.4]],
  desvestir: [[e.desvestir.en("escalofriante:"), "trueno", 0.3], [e.desvestir.en("quitan"), "swoosh", 0.45], [e.desvestir.en("calor"), "fuego", 0.35], [e.desvestir.en("falso."), "error", 0.35]],
  refugio: [[e.refugio.en("viento"), "viento", 0.35], [e.refugio.en("suelo:"), "madera", 0.4], [e.refugio.en("roba"), "congelar", 0.3]],
  seco: [[e.seco.en("seco,"), "exito", 0.3], [e.seco.en("mojada"), "gota", 0.4], [e.seco.en("abriga,"), "negacion", 0.35], [e.seco.en("nieve"), "hielo_crujido", 0.35], [e.seco.en("derretirla."), "fuego", 0.35]],
  alcohol: [[e.alcohol.en("alcohol:"), "cristal", 0.4], [e.alcohol.en("alcohol:") + 6, "negacion", 0.35], [e.alcohol.en("sensación"), "fuego", 0.3], [e.alcohol.en("enfría"), "congelar", 0.4]],
  anna: [[e.anna.en("1999,"), "papel", 0.35], [e.anna.en("hielo."), "hielo_crujido", 0.45], [e.anna.en("13,7"), "latido", 0.45], [e.anna.en("sobrevivió."), "exito", 0.5]],
  medicos: [[e.medicos.en("nadie"), "latido", 0.35], [e.medicos.en("caliente"), "campana", 0.4]],
  final: [[e.final.en("Escríbelo"), "tecla", 0.35], [e.final.en("Escríbelo") + 12, "tecla", 0.3], [e.final.en("sígueme"), "clic", 0.45], [e.final.en("sígueme") + 8, "notificacion", 0.4]],
};
