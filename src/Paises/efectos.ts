import { Golpe } from "../comun/tipos";
import { ESCENARIOS } from "./escenas";
import { Ilustracion } from "./Ilustraciones";

// Cada sonido suena justo en la palabra que lo provoca (volúmenes bajos para no tapar la voz)
const e = ESCENARIOS;
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[0, "whoosh", 0.3], [e.gancho.en("existían"), "subida", 0.3], [e.gancho.en("ningún"), "golpe", 0.4], [e.gancho.en("mapa."), "error", 0.3]],
  urss: [[e.urss.en("Unión"), "campana", 0.35], [e.urss.en("grande"), "subida", 0.3], [e.urss.en("quince"), "golpe", 0.35]],
  urssRompe: [[e.urssRompe.en("1991"), "papel", 0.35], [e.urssRompe.en("rompió"), "cristal_roto", 0.45], [e.urssRompe.en("quince"), "pop", 0.3], [e.urssRompe.en("Rusia"), "ding", 0.3], [e.urssRompe.en("Estonia."), "ding", 0.3]],
  yugo: [[e.yugo.en("Yugoslavia"), "campana", 0.35], [e.yugo.en("serbios,"), "pop", 0.3], [e.yugo.en("croatas,"), "pop", 0.3], [e.yugo.en("bosnios"), "pop", 0.3], [e.yugo.en("eslovenos"), "pop", 0.3], [e.yugo.en("bandera."), "brillo", 0.3]],
  yugoRompe: [[e.yugoRompe.en("guerras"), "explosion", 0.35], [e.yugoRompe.en("guerras") + 6, "explosion", 0.25], [e.yugoRompe.en("partida"), "cristal_roto", 0.4], [e.yugoRompe.en("siete"), "golpe", 0.35]],
  checo: [[e.checo.en("Checoslovaquia"), "campana", 0.3], [e.checo.en("disparo:"), "negacion", 0.3], [e.checo.en("1993"), "papel", 0.35], [e.checo.en("Chequia"), "pop", 0.3], [e.checo.en("Eslovaquia."), "pop", 0.3]],
  alemania: [[e.alemania.en("Alemania"), "metal", 0.3], [e.alemania.en("revés:"), "boing", 0.3], [e.alemania.en("1990"), "papel", 0.35], [e.alemania.en("unió"), "exito", 0.4]],
  grancol: [[e.grancol.en("Gran"), "campana", 0.35], [e.grancol.en("Bolívar"), "brillo", 0.3], [e.grancol.en("Venezuela,"), "pop", 0.3], [e.grancol.en("Ecuador"), "pop", 0.3], [e.grancol.en("Panamá."), "pop", 0.3]],
  grancolRompe: [[e.grancolRompe.en("doce"), "reloj", 0.35], [e.grancolRompe.en("deshizo"), "cristal_roto", 0.4], [e.grancolRompe.en("1831."), "golpe", 0.35]],
  centro: [[e.centro.en("Guatemala,"), "pop", 0.3], [e.centro.en("Honduras,"), "pop", 0.3], [e.centro.en("Salvador,"), "pop", 0.3], [e.centro.en("Nicaragua"), "pop", 0.3], [e.centro.en("Costa"), "pop", 0.3], [e.centro.en("solo"), "golpe", 0.4]],
  centroRompe: [[e.centroRompe.en("Provincias"), "campana", 0.3], [e.centroRompe.en("separó"), "cristal_roto", 0.4], [e.centroRompe.en("1840."), "papel", 0.35]],
  rau: [[e.rau.en("1958,"), "papel", 0.35], [e.rau.en("Egipto"), "pop", 0.3], [e.rau.en("Siria"), "pop", 0.3], [e.rau.en("unieron"), "exito", 0.3], [e.rau.en("tres"), "reloj", 0.35], [e.rau.en("años."), "error", 0.35]],
  final: [[0, "whoosh", 0.3], [e.final.en("Escríbelo"), "notificacion", 0.35]],
};
