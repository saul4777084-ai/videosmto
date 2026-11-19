import { Golpe } from "../comun/tipos";
import { ESCENARIOS } from "./escenas";
import { Ilustracion } from "./Ilustraciones";

// Cada sonido suena justo en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "olas", 0.25], [e.gancho.en("239"), "subida", 0.3], [e.gancho.en("239") + 18, "golpe", 0.3], [e.gancho.en("Volvieron"), "caida", 0.3], [e.gancho.en("18"), "campana", 0.4]],
  zarpan: [[e.zarpan.en("1519"), "papel", 0.35], [e.zarpan.en("cinco"), "pop", 0.3], [e.zarpan.en("cinco") + 6, "pop", 0.3], [e.zarpan.en("cinco") + 12, "pop", 0.3], [e.zarpan.en("zarparon"), "olas", 0.3], [e.zarpan.en("Sanlúcar"), "ding", 0.3], [e.zarpan.en("Magallanes"), "campana", 0.3]],
  especias: [[0, "swoosh", 0.3], [e.especias.en("especias"), "brillo", 0.35], [e.especias.en("oeste"), "whoosh", 0.3], [e.especias.en("clavo"), "metal", 0.3], [e.especias.en("fortuna"), "caja_registradora", 0.4]],
  atlantico: [[0, "olas", 0.35], [e.atlantico.en("Atlántico"), "brisa", 0.3], [e.atlantico.en("Sudamérica"), "pop", 0.3], [e.atlantico.en("paso"), "magia", 0.3]],
  motin: [[e.motin.en("Patagonia"), "viento", 0.35], [e.motin.en("motín"), "metal", 0.45], [e.motin.en("motín") + 4, "golpe", 0.35], [e.motin.en("aplastó"), "golpe", 0.45]],
  naufragio: [[0, "tormenta", 0.45], [e.naufragio.en("naufragó"), "chapuzon", 0.4], [e.naufragio.en("tormenta"), "trueno", 0.45], [e.naufragio.en("cuatro"), "error", 0.35]],
  estrecho: [[0, "viento", 0.3], [e.estrecho.en("estrecho"), "campana", 0.35], [e.estrecho.en("nombre"), "exito", 0.3], [e.estrecho.en("desertó"), "negacion", 0.35], [e.estrecho.en("España"), "whoosh", 0.3]],
  pacifico: [[0, "brisa", 0.4], [e.pacifico.en("tranquilo"), "olas", 0.25], [e.pacifico.en("Pacífico"), "brillo", 0.4]],
  inmenso: [[0, "olas", 0.3], [e.inmenso.en("inmenso"), "subida", 0.35], [e.inmenso.en("meses"), "reloj", 0.35], [e.inmenso.en("fresca"), "latido", 0.3]],
  hambre: [[e.hambre.en("cuero"), "pop", 0.35], [e.hambre.en("serrín"), "pop", 0.35], [e.hambre.en("ratas"), "boing", 0.35], [e.hambre.en("escorbuto"), "latido", 0.45], [e.hambre.en("escorbuto") + 6, "golpe", 0.3]],
  mactan: [[e.mactan.en("Filipinas"), "ding", 0.3], [e.mactan.en("Magallanes"), "pop", 0.3], [e.mactan.en("murió"), "caida", 0.4], [e.mactan.en("combate"), "metal", 0.4], [e.mactan.en("Lapulapu"), "golpe", 0.35]],
  quema: [[e.quema.en("hombres"), "tic", 0.3], [e.quema.en("quemar"), "fuego", 0.5], [e.quema.en("nave"), "explosion", 0.25]],
  molucas: [[e.molucas.en("Molucas"), "ding", 0.3], [e.molucas.en("bodegas"), "pop", 0.3], [e.molucas.en("bodegas") + 8, "pop", 0.3], [e.molucas.en("clavo"), "moneda", 0.35], [e.molucas.en("agua"), "vertido", 0.35], [e.molucas.en("quedó"), "error", 0.3]],
  elcano: [[0, "brillo", 0.3], [e.elcano.en("Elcano"), "campana", 0.35], [e.elcano.en("Victoria"), "olas", 0.3], [e.elcano.en("última"), "golpe", 0.3]],
  regreso: [[0, "olas", 0.3], [e.regreso.en("Índico"), "pop", 0.3], [e.regreso.en("África"), "pop", 0.3], [e.regreso.en("portugueses"), "alarma", 0.25]],
  llegada: [[e.llegada.en("6"), "papel", 0.35], [e.llegada.en("Sanlúcar"), "campana", 0.4], [e.llegada.en("quedaban"), "caida", 0.3], [e.llegada.en("18"), "golpe", 0.4]],
  calendario: [[e.calendario.en("extraño"), "magia", 0.3], [e.calendario.en("calendario"), "papel", 0.35], [e.calendario.en("día"), "papel", 0.35], [e.calendario.en("detrás"), "golpe", 0.4]],
  escudo: [[e.escudo.en("rey"), "campana", 0.3], [e.escudo.en("escudo"), "metal", 0.35], [e.escudo.en("globo"), "brillo", 0.35], [e.escudo.en("lema"), "papel", 0.35], [e.escudo.en("primero"), "exito", 0.35]],
  final: [[e.final.en("Magallanes"), "pop", 0.35], [e.final.en("Elcano"), "pop", 0.35], [e.final.en("Escríbelo"), "notificacion", 0.35]],
};
