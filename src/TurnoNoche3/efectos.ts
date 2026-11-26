import { Golpe } from "../comun/tipos";
import { dur, en, Ilustracion } from "./escenas";

// Momentos (fracción de la escena) en que se apaga / se enciende cada fluorescente
export const APAGONES = [0.3, 0.42, 0.54, 0.66];
export const ENCENDIDOS = [0.42, 0.5, 0.58, 0.66];
// Pisadas: fracción de la escena "pasos" en que cada bota toca el suelo
export const PISADAS = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78];
// La cabeza del encargado asoma por el borde del mostrador
export const asomaEn = () => en("asoma", "Por") - 4;

const fr = (id: Ilustracion, p: number) => Math.round(p * dur(id));

export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  abre: [[0, "campanita", 0.9], [4, "viento", 0.45]],
  apagon: [...APAGONES.map((p): Golpe => [fr("apagon", p), "clic", 0.9]), [fr("apagon", 0.68), "golpe", 0.45]],
  ojos: [[0, "latido", 0.5], [en("ojos", "ojos."), "susto", 0.55]],
  tira: [[en("tira", "tira") - 2, "whoosh", 0.8], [en("tira", "tira") + 4, "golpe", 0.8], [en("tira", "tira"), "susto", 0.6]],
  norespires: [[0, "respiracion", 0.7], [8, "latido_rapido", 0.45]],
  pasos: PISADAS.map((p): Golpe => [fr("pasos", p), "salpicadura", 0.4]),
  encima: [[4, "salpicadura", 0.5], [en("encima", "encima"), "latido", 0.7], [fr("encima", 0.75), "gota", 0.6]],
  asoma: [[6, "gota", 0.6], [asomaEn(), "susto", 0.9], [asomaEn() + 2, "golpe", 0.4]],
  reloj: [[0, "reloj", 0.35], [en("reloj", "3:34."), "tic", 0.9], [en("reloj", "3:34."), "golpe", 0.45]],
  luces: [...ENCENDIDOS.map((p): Golpe => [fr("luces", p), "clic", 0.8]), [fr("luces", 0.5), "zumbido", 0.5]],
  nadie: [[0, "whoosh", 0.3], [en("nadie", "nadie."), "susto", 0.45], [fr("nadie", 0.3), "gota", 0.5]],
  manana: [[0, "brisa", 0.5], [6, "whoosh", 0.4]],
  cuentas: [[0, "campanita", 0.5], [en("cuentas", "abrió.»"), "latido", 0.5]],
  nunca: [[en("nunca", "verle.»"), "latido", 0.6]],
  tablon: [[0, "papel", 0.6]],
  empapado: [[0, "estatica", 0.35], [en("empapado", "salvó."), "susto", 0.75], [fr("empapado", 0.4), "gota", 0.5]],
  final: [[0, "trueno", 0.35]],
};
