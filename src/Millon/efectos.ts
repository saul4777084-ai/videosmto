import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

const en = (i: Ilustracion, p: string) => ESCENARIOS[i].en(p);
const varios = (desde: number, n: number, cada: number, efecto: Golpe[1], vol = 0.35): Golpe[] =>
  Array.from({ length: n }, (_, k): Golpe => [desde + k * cada, efecto, vol]);

// Efectos de sonido sincronizados con lo que pasa en cada escena 3D
export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  gancho: [[en("gancho", "recibieras") + 10, "golpe", 0.6], [en("gancho", "millón"), "caja_registradora", 0.7], [en("gancho", "millón") + 4, "brillo", 0.5], ...varios(en("gancho", "millón") + 8, 5, 6, "papel", 0.3)],
  impuestos: [[en("impuestos", "impuestos"), "swoosh", 0.5], [en("impuestos", "impuestos") + 8, "whoosh", 0.4], [en("impuestos", "impuestos") + 16, "whoosh", 0.4], [en("impuestos", "tercio."), "negacion", 0.5]],
  gastos: [[en("gastos", "casa") - 2, "pop", 0.6], [en("gastos", "auto") - 6, "swoosh", 0.6], [en("gastos", "viajes.") - 4, "subida", 0.5]],
  ruina: [[en("ruina", "cuidado:"), "alarma", 0.35], [en("ruina", "ganadores"), "caida", 0.5], [en("ruina", "ruina"), "golpe", 0.7], [en("ruina", "ruina") + 2, "trueno", 0.35]],
  rapido: [[en("rapido", "gastar"), "viento", 0.4], ...varios(en("rapido", "gastar"), 6, 9, "papel", 0.3), [en("rapido", "rápido"), "error", 0.4]],
  deudas: [[en("deudas", "inteligente:"), "ding", 0.5], [en("deudas", "paga"), "cristal_roto", 0.45], [en("deudas", "paga") + 10, "cristal_roto", 0.35], [en("deudas", "deudas."), "exito", 0.6]],
  fondo: [...varios(en("fondo", "guarda") + 13, 8, 4, "moneda", 0.35), [en("fondo", "fondo"), "pop", 0.5]],
  invertir: [[en("invertir", "invierte"), "subida", 0.4], [en("invertir", "siete"), "clic", 0.6], [en("invertir", "duplica"), "magia", 0.6], [en("invertir", "duplica") + 3, "moneda", 0.5], [en("invertir", "diez"), "ding", 0.4]],
  trabaja: [[0, "olas", 0.4], ...varios(en("trabaja", "trabaja"), 6, 10, "moneda", 0.3), [en("trabaja", "descansas."), "brisa", 0.4]],
  secreto: [[en("secreto", "importante:"), "tic", 0.5], [en("secreto", "cuentes"), "pasos", 0.5], [en("secreto", "cuentes") + 4, "notificacion", 0.4], [en("secreto", "cuentes") + 12, "pop", 0.4], [en("secreto", "cuentes") + 20, "pop", 0.4]],
  final: [[2, "brillo", 0.5], [en("final", "Escríbelo"), "notificacion", 0.6], [en("final", "comentarios.") , "exito", 0.5]],
};
