import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

// Cada sonido suena en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "whoosh", 0.4], [e.gancho.en("fiebre,"), "latido", 0.5], [e.gancho.en("fiebre,") + 22, "latido", 0.45], [e.gancho.en("minuto."), "golpe", 0.45]],
  record: [[e.record.en("2024"), "proyector", 0.35], [e.record.en("caluroso"), "fuego", 0.35], [e.record.en("1,5"), "golpe", 0.5]],
  fiebre: [[e.fiebre.en("poco,"), "tic", 0.35], [e.fiebre.en("sube"), "subida", 0.4], [e.fiebre.en("fiebre."), "alarma", 0.3]],
  manta: [[e.manta.en("manta"), "magia", 0.35], [e.manta.en("CO2"), "burbujas", 0.35], [e.manta.en("petróleo,"), "vertido", 0.3], [e.manta.en("carbón."), "fuego", 0.35]],
  toneladas: [[e.toneladas.en("lanzamos"), "puff", 0.4], [e.toneladas.en("37.000"), "caja_registradora", 0.35], [e.toneladas.en("toneladas."), "golpe", 0.5]],
  curva: [[e.curva.en("50"), "subida", 0.4], [e.curva.en("1800:"), "papel", 0.35], [e.curva.en("800.000"), "hielo_crujido", 0.4]],
  ranking: [[e.ranking.en("diez"), "tic", 0.35], [e.ranking.en("historia"), "tic", 0.35], [e.ranking.en("justo,"), "ding", 0.35], [e.ranking.en("últimos"), "golpe", 0.45]],
  artico: [[e.artico.en("ártico"), "viento", 0.35], [e.artico.en("perdido"), "hielo_crujido", 0.45], [e.artico.en("40"), "cristal_roto", 0.35], [e.artico.en("1979."), "reloj", 0.35]],
  coral: [[0, "burbujas", 0.4], [e.coral.en("84"), "golpe", 0.45], [e.coral.en("blanqueo"), "magia", 0.35]],
  europa: [[e.europa.en("mata:"), "latido", 0.5], [e.europa.en("2022"), "fuego", 0.35], [e.europa.en("60.000"), "golpe", 0.5], [e.europa.en("europa."), "campana", 0.3]],
  extremos: [[e.extremos.en("incendios,"), "fuego", 0.5], [e.extremos.en("sequias"), "madera", 0.4], [e.extremos.en("tormentas"), "trueno", 0.45], [e.extremos.en("violentas."), "rayo", 0.35]],
  mito1: [[e.mito1.en("mito"), "golpe", 0.45], [e.mito1.en("si,"), "negacion", 0.35], [e.mito1.en("diez"), "subida", 0.4], [e.mito1.en("rapido."), "whoosh", 0.45]],
  mito2: [[e.mito2.en("mito"), "golpe", 0.45], [e.mito2.en("frio."), "viento", 0.4], [e.mito2.en("dia"), "pop", 0.35], [e.mito2.en("treinta"), "reloj", 0.4]],
  dos: [[e.dos.en("medio"), "tic", 0.35], [e.dos.en("2"), "golpe", 0.45], [e.dos.en("corales"), "caida", 0.4]],
  solar: [[e.solar.en("buena"), "brillo", 0.4], [e.solar.en("solar"), "magia", 0.35], [e.solar.en("barata"), "exito", 0.45]],
  ternera: [[e.ternera.en("cuentas:"), "ding", 0.35], [e.ternera.en("ternera"), "madera", 0.4], [e.ternera.en("60"), "puff", 0.45], [e.ternera.en("CO2."), "pop", 0.35]],
  final: [[e.final.en("cambiarias"), "golpe", 0.4], [e.final.en("a"), "pop", 0.45], [e.final.en("b"), "pop", 0.45], [e.final.en("comenta"), "tecla", 0.35], [e.final.en("sigueme."), "clic", 0.45], [e.final.en("sigueme.") + 8, "notificacion", 0.4]],
};
