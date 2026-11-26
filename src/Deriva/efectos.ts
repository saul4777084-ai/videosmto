import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "olas", 0.45], [0, "viento", 0.25], [e.gancho.en("deriva"), "golpe", 0.45], [e.gancho.en("agua"), "gota", 0.5], [e.gancho.en("nadie"), "latido", 0.5]],
  sed: [[0, "olas", 0.3], [e.sed.en("sed"), "negacion", 0.35], [e.sed.en("sal"), "cubitos", 0.4], [e.sed.en("seca"), "error", 0.4]],
  rinon: [[e.rinon.en("rinones"), "latido", 0.45], [e.rinon.en("mas"), "vertido", 0.4], [e.rinon.en("dulce"), "alarma", 0.3], [e.rinon.en("3"), "golpe", 0.5], [e.rinon.en("dias"), "reloj", 0.35]],
  sol: [[0, "olas", 0.25], [e.sol.en("sombra"), "fuego", 0.35], [e.sol.en("arriba"), "subida", 0.35], [e.sol.en("rebota"), "brillo", 0.4], [e.sol.en("heridas"), "error", 0.4]],
  noche: [[0, "olas", 0.3], [e.noche.en("noche"), "brisa", 0.35], [e.noche.en("viento"), "viento", 0.45], [e.noche.en("tiritas"), "congelar", 0.4], [e.noche.en("tropico"), "pop", 0.35]],
  mente: [[e.mente.en("cerebro"), "latido", 0.4], [e.mente.en("fallar"), "magia", 0.4], [e.mente.en("barcos"), "campana", 0.3], [e.mente.en("tierra"), "brillo", 0.35], [e.mente.en("existen"), "cristal_roto", 0.4]],
  callahan: [[0, "olas", 0.3], [e.callahan.en("1982"), "proyector", 0.4], [e.callahan.en("steven"), "camara", 0.35], [e.callahan.en("76"), "reloj", 0.4], [e.callahan.en("destiladores"), "burbujas", 0.4]],
  peces: [[0, "burbujas", 0.35], [e.peces.en("arpon"), "chapuzon", 0.45], [e.peces.en("tercio"), "caida", 0.4], [e.peces.en("vivo"), "exito", 0.5], [e.peces.en("caribe"), "ding", 0.4]],
  mito1: [[e.mito1.en("mito"), "golpe", 0.45], [e.mito1.en("poco"), "vertido", 0.35], [e.mito1.en("falso"), "error", 0.45], [e.mito1.en("deshidrata"), "puff", 0.35]],
  mito2: [[e.mito2.en("mito"), "golpe", 0.45], [e.mito2.en("nadar"), "salpicadura", 0.4], [e.mito2.en("salva"), "whoosh", 0.35], [e.mito2.en("quedarte"), "error", 0.3], [e.mito2.en("ve"), "exito", 0.45]],
  truco: [[e.truco.en("truco"), "ding", 0.4], [e.truco.en("primer"), "papel", 0.4], [e.truco.en("nada"), "negacion", 0.35], [e.truco.en("gota"), "trueno", 0.35], [e.truco.en("gota"), "lluvia", 0.4], [e.truco.en("lluvia"), "gota", 0.5]],
  alvarenga: [[0, "olas", 0.3], [e.alvarenga.en("record"), "golpe", 0.45], [e.alvarenga.en("alvarenga"), "camara", 0.35], [e.alvarenga.en("pescador"), "pop", 0.4], [e.alvarenga.en("438"), "reloj", 0.4], [e.alvarenga.en("pacifico"), "brisa", 0.3]],
  comida: [[e.comida.en("peces"), "pop", 0.45], [e.comida.en("tortugas"), "pop", 0.45], [e.comida.en("pajaros"), "pop", 0.45], [e.comida.en("manos"), "golpe", 0.4], [e.comida.en("lluvia"), "gota", 0.5]],
  llegada: [[e.llegada.en("mexico"), "whoosh", 0.4], [e.llegada.en("marshall"), "pop", 0.4], [e.llegada.en("10000"), "subida", 0.35], [e.llegada.en("vivo"), "exito", 0.55]],
  final: [[0, "olas", 0.3], [e.final.en("tierra"), "campana", 0.3], [e.final.en("haces"), "golpe", 0.4], [e.final.en("a"), "pop", 0.45], [e.final.en("b"), "pop", 0.45], [e.final.en("comenta"), "tecla", 0.35], [e.final.en("sigueme"), "clic", 0.45], [e.final.en("sigueme") + 8, "notificacion", 0.4]],
};
