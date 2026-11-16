import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

const en = (i: Ilustracion, p: string) => ESCENARIOS[i].en(p);
const varios = (desde: number, n: number, cada: number, efecto: Golpe[1], vol = 0.3): Golpe[] =>
  Array.from({ length: n }, (_, k): Golpe => [Math.max(0, Math.round(desde + k * cada)), efecto, vol]);

// Sonidos de dinero sincronizados con lo que pasa en cada escena de la versión 2
const m = en("gancho", "millón");
const tt = en("telefono", "teléfono");
const ttA = en("telefono", "amigos.");
const ti = en("impuestos", "impuestos");
const tTer = en("impuestos", "tercio.");
const tm = en("gastos", "mansión");
const ta = en("gastos", "auto");
const te = en("gastos", "esfuma");
const tp = en("deudas", "paga");
const td = en("deudas", "deudas.");
const ts = en("emergencias", "seis");
const tinv = en("invertir", "invierte");
const tas = en("invertir", "asesor");
const tc = en("interes", "cinco");
const tint = en("interes", "treinta");
const tcu = en("secreto", "cuentes");

export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  // el marcador rueda hasta el millón y llueven billetes
  gancho: [...varios(3, 8, Math.max(2, (m - 3) / 8), "tic", 0.18), [m, "caja_registradora", 0.6], [m + 2, "brillo", 0.4], ...varios(m + 4, 8, 5, "papel", 0.22), ...varios(m + 6, 4, 8, "moneda", 0.25)],
  // reloj inteligente: latidos que se aceleran y grito
  grito: [[0, "campana", 0.25], ...varios(en("grito", "corazón"), 8, 7, "latido", 0.5), [en("grito", "gritar."), "boing", 0.35]],
  // notificaciones del teléfono
  telefono: [...varios(tt, 5, Math.max(7, (ttA - tt) / 5), "notificacion", 0.4), [ttA, "pop", 0.35]],
  // la mano se lleva los fajos
  impuestos: [[en("impuestos", "ojo:"), "alarma", 0.15], [ti - 10, "swoosh", 0.45], [ti + 8, "papel", 0.35], [ti + 12, "papel", 0.3], [ti + 16, "whoosh", 0.35], [ti + 4, "caja_registradora", 0.35], [tTer, "negacion", 0.4]],
  // compras con caja registradora y el saldo arde
  gastos: [[tm - 2, "pop", 0.5], [tm + 2, "caja_registradora", 0.45], [ta - 2, "pop", 0.5], [ta + 2, "caja_registradora", 0.45], [te - 4, "fuego", 0.45], [te + 6, "puff", 0.35], [en("gastos", "meses."), "caida", 0.35]],
  // aparecen los boletos y se apagan uno a uno
  loteria: [...varios(en("loteria", "lotería") - 10, 7, 3.6, "pop", 0.2), ...varios(en("loteria", "acaban"), 8, 3.2, "negacion", 0.15), [en("loteria", "problemas"), "error", 0.35]],
  // el dedo pulsa PAGAR y las tarjetas se parten
  deudas: [[tp - 14, "swoosh", 0.3], [tp, "clic", 0.55], [tp + 10, "cristal_roto", 0.35], [tp + 16, "cristal_roto", 0.3], [tp + 22, "cristal_roto", 0.3], [td, "exito", 0.5], [td + 3, "caja_registradora", 0.35]],
  // monedas cayendo en el frasco y el calendario
  emergencias: [...varios(ts + 6, 8, 4, "moneda", 0.4), ...varios(ts, 6, 4, "papel", 0.18)],
  // el árbol crece y brotan monedas
  invertir: [[tinv - 4, "subida", 0.35], ...varios(tinv, 6, 7, "brillo", 0.15), ...varios(tas - 6, 3, 6, "moneda", 0.35), [tas, "ding", 0.35]],
  // el dedo pone en marcha el cronómetro y caen los intereses
  interes: [[Math.max(0, tc - 8), "clic", 0.55], ...varios(Math.max(0, tc - 4), 10, 6, "reloj", 0.12), ...varios(tint - 6, 8, 4, "moneda", 0.3), [tint + 26, "caja_registradora", 0.5]],
  // los vecinos se asoman y cierras las cortinas
  secreto: [[0, "viento", 0.2], [en("secreto", "importante:"), "tic", 0.45], [tcu + 2, "swoosh", 0.4], [tcu + 20, "toc", 0.35]],
  // final: las opciones aparecen y el comentario
  final: [...varios(4, 4, 5, "pop", 0.35), [6, "brillo", 0.35], [en("final", "Escríbelo") - 2, "notificacion", 0.55], [en("final", "comentarios."), "exito", 0.4]],
};
