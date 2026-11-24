import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "viento", 0.3], [e.gancho.en("18"), "golpe", 0.4], [e.gancho.en("atrapado"), "explosion", 0.35], [e.gancho.en("atrapado") + 10, "golpe", 0.5], [e.gancho.en("oscuras"), "clic", 0.5]],
  oscuridad: [[e.oscuridad.en("noche"), "brisa", 0.3], [e.oscuridad.en("negro"), "puff", 0.4], [e.oscuridad.en("ojos"), "latido", 0.45], [e.oscuridad.en("nunca"), "negacion", 0.35]],
  humedad: [[e.humedad.en("humedad"), "gota", 0.45], [e.humedad.en("100"), "ding", 0.35], [e.humedad.en("mojado"), "salpicadura", 0.35], [e.humedad.en("robando"), "congelar", 0.35]],
  reloj: [[e.reloj.en("sol"), "negacion", 0.35], [e.reloj.en("reloj"), "reloj", 0.45], [e.reloj.en("desajusta"), "magia", 0.35], [e.reloj.en("alargan"), "subida", 0.35], [e.reloj.en("dia"), "pop", 0.4], [e.reloj.en("noche"), "pop", 0.4]],
  siffre: [[e.siffre.en("1962"), "proyector", 0.4], [e.siffre.en("michel"), "camara", 0.35], [e.siffre.en("reloj"), "reloj", 0.35], [e.siffre.en("contar"), "tic", 0.35], [e.siffre.en("cinco"), "golpe", 0.5]],
  calendario: [[e.calendario.en("salir"), "whoosh", 0.4], [e.calendario.en("agosto"), "papel", 0.4], [e.calendario.en("septiembre"), "papel", 0.45], [e.calendario.en("septiembre") + 10, "golpe", 0.45]],
  alucina: [[e.alucina.en("cerebro"), "latido", 0.4], [e.alucina.en("luces"), "brillo", 0.4], [e.alucina.en("formas"), "magia", 0.4], [e.alucina.en("existen") + 4, "cristal_roto", 0.35]],
  agua: [[e.agua.en("agua"), "gota", 0.5], [e.agua.en("beber"), "burbujas", 0.35], [e.agua.en("3"), "alarma", 0.3], [e.agua.en("semanas"), "exito", 0.4]],
  grasa: [[0, "proyector", 0.3], [e.grasa.en("segundo"), "tic", 0.4], [e.grasa.en("quema"), "fuego", 0.35], [e.grasa.en("cerebro"), "subida", 0.35], [e.grasa.en("cetonas"), "brillo", 0.45]],
  mito1: [[e.mito1.en("mito"), "golpe", 0.45], [e.mito1.en("buscar"), "pasos", 0.45], [e.mito1.en("ciegas"), "error", 0.4], [e.mito1.en("quieto"), "ding", 0.4], [e.mito1.en("energia"), "exito", 0.4]],
  mito2: [[e.mito2.en("mito"), "golpe", 0.45], [e.mito2.en("charco"), "salpicadura", 0.4], [e.mito2.en("charco") + 6, "error", 0.35], [e.mito2.en("seguro"), "whoosh", 0.35], [e.mito2.en("gotea"), "gota", 0.5], [e.mito2.en("gotea") + 4, "exito", 0.35]],
  thamluang: [[e.thamluang.en("2018"), "notificacion", 0.4], [e.thamluang.en("12"), "pasos", 0.4], [e.thamluang.en("inundacion"), "tormenta", 0.4], [e.thamluang.en("inundacion") + 10, "arroyo", 0.35], [e.thamluang.en("tham"), "campana", 0.3]],
  meditar: [[e.meditar.en("agua"), "gota", 0.45], [e.meditar.en("entrenador"), "pop", 0.35], [e.meditar.en("meditar"), "campana", 0.4], [e.meditar.en("energia"), "caida", 0.35]],
  buzos: [[0, "burbujas", 0.4], [e.buzos.en("encontraron"), "chapuzon", 0.4], [e.buzos.en("10"), "golpe", 0.4], [e.buzos.en("4"), "pop", 0.4], [e.buzos.en("13"), "ding", 0.35], [e.buzos.en("vida"), "exito", 0.5]],
  flamini: [[e.flamini.en("espanola"), "pop", 0.4], [e.flamini.en("beatriz"), "camara", 0.35], [e.flamini.en("500"), "reloj", 0.4], [e.flamini.en("salir"), "whoosh", 0.4], [e.flamini.en("170"), "golpe", 0.5]],
  final: [[0, "viento", 0.3], [e.final.en("haces"), "golpe", 0.4], [e.final.en("a"), "pop", 0.45], [e.final.en("b"), "pop", 0.45], [e.final.en("comenta"), "tecla", 0.35], [e.final.en("sigueme"), "clic", 0.45], [e.final.en("sigueme") + 8, "notificacion", 0.4]],
};
