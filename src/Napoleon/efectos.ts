import { Golpe } from "../comun/tipos";
import { ESCENARIOS } from "./escenas";
import { Ilustracion } from "./Ilustraciones";

// Cada sonido suena justo en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "proyector", 0.25], [e.gancho.en("Napoleón"), "campana", 0.3], [e.gancho.en("conquistar"), "subida", 0.3], [e.gancho.en("Europa?"), "golpe", 0.35]],
  corcega: [[e.corcega.en("Córcega"), "olas", 0.25], [e.corcega.en("1769"), "papel", 0.35], [e.corcega.en("oficial"), "pop", 0.3], [e.corcega.en("artillería."), "explosion", 0.25]],
  revolucion: [[0, "viento", 0.2], [e.revolucion.en("Revolución"), "campana", 0.3], [e.revolucion.en("mérito,"), "exito", 0.3], [e.revolucion.en("apellido."), "error", 0.3]],
  emperador: [[e.emperador.en("1799"), "papel", 0.3], [e.emperador.en("golpe"), "golpe", 0.45], [e.emperador.en("1804"), "papel", 0.3], [e.emperador.en("coronó"), "magia", 0.35], [e.emperador.en("emperador."), "campana", 0.35]],
  velocidad: [[0, "pasos", 0.3], [e.velocidad.en("velocidad:"), "subida", 0.35], [e.velocidad.en("rápido"), "swoosh", 0.4], [e.velocidad.en("rápido") + 20, "pasos", 0.3]],
  ligeros: [[e.ligeros.en("comían"), "pop", 0.3], [e.ligeros.en("comían") + 6, "pop", 0.3], [e.ligeros.en("encontraban,"), "pop", 0.3], [e.ligeros.en("esperar"), "madera", 0.3], [e.ligeros.en("convoyes."), "negacion", 0.35]],
  cuerpos: [[e.cuerpos.en("cuerpos"), "tic", 0.3], [e.cuerpos.en("separados"), "swoosh", 0.3], [e.cuerpos.en("unían"), "subida", 0.3], [e.cuerpos.en("atacar."), "explosion", 0.35]],
  canones: [
    [e.canones.en("concentraba"), "explosion", 0.25],
    [e.canones.en("concentraba") + 5, "explosion", 0.2],
    [e.canones.en("concentraba") + 10, "explosion", 0.2],
    [e.canones.en("rompía"), "cristal_roto", 0.35],
  ],
  austerlitz: [[e.austerlitz.en("Austerlitz,"), "metal", 0.4], [e.austerlitz.en("Austria"), "toc", 0.35], [e.austerlitz.en("Rusia."), "toc", 0.35], [e.austerlitz.en("Rusia.") + 10, "exito", 0.35]],
  jena: [[e.jena.en("aplastó"), "swoosh", 0.3], [e.jena.en("Jena,"), "explosion", 0.3], [e.jena.en("Friedland."), "explosion", 0.3]],
  codigo: [[e.codigo.en("Código"), "papel", 0.4], [e.codigo.en("leyes"), "papel", 0.35], [e.codigo.en("leyes") + 7, "pop", 0.3], [e.codigo.en("leyes") + 14, "pop", 0.3]],
  hermanos: [[e.hermanos.en("Nápoles,"), "moneda", 0.3], [e.hermanos.en("Holanda,"), "moneda", 0.3], [e.hermanos.en("Westfalia"), "moneda", 0.3], [e.hermanos.en("España."), "brillo", 0.35]],
  imperio: [[e.imperio.en("1811"), "campana", 0.3], [e.imperio.en("dominaba"), "subida", 0.3], [e.imperio.en("Madrid"), "ding", 0.3], [e.imperio.en("Varsovia."), "ding", 0.3]],
  rusia: [[e.rusia.en("1812"), "trueno", 0.3], [e.rusia.en("invadió"), "pasos", 0.35], [e.rusia.en("seiscientos"), "reloj", 0.3]],
  invierno: [[0, "viento", 0.4], [e.invierno.en("frío"), "congelar", 0.35], [e.invierno.en("hambre"), "latido", 0.35], [e.invierno.en("pocos."), "golpe", 0.35]],
  waterloo: [[e.waterloo.en("1815"), "trueno", 0.3], [e.waterloo.en("cayó"), "caida", 0.4], [e.waterloo.en("Waterloo."), "campana", 0.35]],
  final: [[e.final.en("Genio"), "brillo", 0.35], [e.final.en("tirano?"), "golpe", 0.35], [e.final.en("Escríbelo"), "notificacion", 0.35]],
};
