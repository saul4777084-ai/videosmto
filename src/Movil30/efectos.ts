import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "whoosh", 0.4], [e.gancho.en("cuerpo"), "latido", 0.45], [e.gancho.en("dejas"), "swoosh", 0.5], [e.gancho.en("dias"), "golpe", 0.45]],
  respira: [[e.respira.en("respira"), "brisa", 0.35], [e.respira.en("muerto"), "pop", 0.35], [e.respira.en("todavia"), "trueno", 0.25]],
  veces: [[e.veces.en("miras"), "tic", 0.35], [e.veces.en("96"), "golpe", 0.45], [e.veces.en("diez"), "reloj", 0.4], [e.veces.en("sano"), "ding", 0.4]],
  dia1: [[e.dia1.en("dia"), "papel", 0.4], [e.dia1.en("busca"), "swoosh", 0.35], [e.dia1.en("bolsillo"), "toc", 0.4], [e.dia1.en("no"), "error", 0.4]],
  dia2: [[e.dia2.en("dos"), "papel", 0.4], [e.dia2.en("vibraciones"), "notificacion", 0.35], [e.dia2.en("fantasma"), "magia", 0.35], [e.dia2.en("universitarios"), "pop", 0.35]],
  dia3: [[e.dia3.en("tres"), "papel", 0.4], [e.dia3.en("ansiedad"), "alarma", 0.25], [e.dia3.en("felicidades"), "exito", 0.4], [e.dia3.en("abstinencia"), "golpe", 0.5]],
  casino: [[e.casino.en("notificacion"), "notificacion", 0.4], [e.casino.en("maquina"), "pop", 0.35], [e.casino.en("nunca"), "metal", 0.4], [e.casino.en("premio"), "caja_registradora", 0.4], [e.casino.en("paras"), "metal", 0.35]],
  sueno: [[e.sueno.en("semana"), "whoosh", 0.35], [e.sueno.en("duermes"), "magia", 0.3], [e.sueno.en("luz"), "brillo", 0.35], [e.sueno.en("retrasa"), "caida", 0.35]],
  cuello: [[e.cuello.en("descansa"), "ding", 0.35], [e.cuello.en("agachada"), "madera", 0.4], [e.cuello.en("27"), "golpe", 0.5], [e.cuello.en("kilos"), "metal", 0.35]],
  mesa: [[e.mesa.en("semana"), "whoosh", 0.35], [e.mesa.en("concentras"), "subida", 0.35], [e.mesa.en("mesa"), "toc", 0.45], [e.mesa.en("peor"), "negacion", 0.4]],
  estudio: [[e.estudio.en("2025"), "papel", 0.4], [e.estudio.en("bloqueo"), "error", 0.35], [e.estudio.en("467"), "tic", 0.4], [e.estudio.en("semanas"), "pop", 0.35]],
  noventa: [[e.noventa.en("91"), "subida", 0.4], [e.noventa.en("algo"), "exito", 0.4], [e.noventa.en("atencion"), "ding", 0.3], [e.noventa.en("animo"), "ding", 0.3], [e.noventa.en("bienestar"), "ding", 0.3]],
  joven: [[e.joven.en("diez"), "reloj", 0.4], [e.joven.en("menos"), "magia", 0.35], [e.joven.en("cremas"), "negacion", 0.35], [e.joven.en("gimnasio"), "negacion", 0.35]],
  dia30: [[e.dia30.en("30"), "papel", 0.4], [e.dia30.en("gente"), "pasos", 0.4], [e.dia30.en("simpaticos"), "exito", 0.4]],
  recaida: [[e.recaida.en("mala"), "trueno", 0.25], [e.recaida.en("recuperas"), "pop", 0.35], [e.recaida.en("300"), "notificacion", 0.45], [e.recaida.en("300") + 8, "notificacion", 0.4], [e.recaida.en("300") + 16, "notificacion", 0.4], [e.recaida.en("antes"), "golpe", 0.45]],
  final: [[e.final.en("aguantarias"), "pop", 0.35], [e.final.en("escribelo"), "tecla", 0.35], [e.final.en("escribelo") + 12, "tecla", 0.3], [e.final.en("si"), "ding", 0.4]],
};
