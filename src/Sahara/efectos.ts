import { Golpe } from "../comun/tipos";
import { ESCENARIOS } from "./escenas";
import { Ilustracion } from "./Ilustraciones";

// Cada sonido suena justo en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "viento", 0.35], [e.gancho.en("desierto"), "whoosh", 0.3], [e.gancho.en("enorme?"), "golpe", 0.4]],
  tamano: [[e.tamano.en("nueve"), "subida", 0.3], [e.tamano.en("cuadrados:"), "ding", 0.3], [e.tamano.en("casi"), "swoosh", 0.35], [e.tamano.en("Estados"), "pop", 0.35]],
  distancia: [[e.distancia.en("Atlántico"), "olas", 0.25], [e.distancia.en("Atlántico") + 4, "swoosh", 0.3], [e.distancia.en("cinco"), "reloj", 0.25], [e.distancia.en("arena"), "pop", 0.3], [e.distancia.en("roca."), "madera", 0.3]],
  paises: [[e.paises.en("reparte"), "tic", 0.3], [e.paises.en("entre"), "tic", 0.3], [e.paises.en("once"), "tic", 0.3], [e.paises.en("países."), "ding", 0.35]],
  cielo: [[e.cielo.en("cielo:"), "brillo", 0.3], [e.cielo.en("caliente"), "fuego", 0.2], [e.cielo.en("sube"), "subida", 0.3], [e.cielo.en("lluvia."), "lluvia", 0.3]],
  seco: [[e.seco.en("seco,"), "puff", 0.3], [e.seco.en("viaja"), "viento", 0.3], [e.seco.en("baja"), "caida", 0.3], [e.seco.en("Sahara."), "pop", 0.3]],
  nubes: [[e.nubes.en("calienta"), "fuego", 0.25], [e.nubes.en("formen"), "nubes", 0.25], [e.nubes.en("nubes."), "negacion", 0.35]],
  ancha: [[e.ancha.en("Segunda"), "campana", 0.3], [e.ancha.en("anchísima"), "swoosh", 0.35], [e.ancha.en("mar"), "olas", 0.25], [e.ancha.en("lejísimos."), "ding", 0.3]],
  atlas: [[e.atlas.en("Tercera:"), "campana", 0.3], [e.atlas.en("montañas"), "madera", 0.3], [e.atlas.en("frenan"), "golpe", 0.35], [e.atlas.en("frenan") + 4, "lluvia", 0.25]],
  corriente: [[e.corriente.en("costa,"), "olas", 0.3], [e.corriente.en("fría"), "congelar", 0.3], [e.corriente.en("formen"), "trueno", 0.25], [e.corriente.en("tormentas."), "negacion", 0.35]],
  lluvia: [[0, "viento", 0.25], [e.lluvia.en("caen"), "gota", 0.35], [e.lluvia.en("veinticinco"), "gota", 0.35], [e.lluvia.en("lluvia"), "vertido", 0.25]],
  arena: [[e.arena.en("ojo:"), "boing", 0.3], [e.arena.en("arena."), "pop", 0.35], [e.arena.en("resto"), "swoosh", 0.3], [e.arena.en("roca."), "golpe", 0.35]],
  verde: [[e.verde.en("verde,"), "magia", 0.35], [e.verde.en("lagos,"), "salpicadura", 0.3], [e.verde.en("jirafas"), "pop", 0.3], [e.verde.en("hipopótamos."), "chapuzon", 0.3]],
  bamboleo: [[e.bamboleo.en("bamboleo"), "swoosh", 0.3], [e.bamboleo.en("lluvias,"), "caida", 0.3], [e.bamboleo.en("volvió"), "viento", 0.3], [e.bamboleo.en("desierto."), "puff", 0.3]],
  crece: [[e.crece.en("creciendo:"), "subida", 0.3], [e.crece.en("1920"), "papel", 0.3], [e.crece.en("diez"), "alarma", 0.2]],
  final: [[e.final.en("desierto"), "brillo", 0.35], [e.final.en("quieres"), "pop", 0.3], [e.final.en("Escríbelo"), "notificacion", 0.35]],
};
