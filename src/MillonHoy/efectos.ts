import { Golpe } from "../comun/tipos";
import { ESCENARIOS, Ilustracion } from "./escenas";

const en = (i: Ilustracion, p: string) => ESCENARIOS[i].en(p);
const varios = (desde: number, n: number, cada: number, efecto: Golpe[1], vol = 0.3): Golpe[] =>
  Array.from({ length: n }, (_, k): Golpe => [Math.max(0, Math.round(desde + k * cada)), efecto, vol]);

// Sonidos de dinero y efectos sincronizados con lo que pasa en cada escena 3D (bajos para no tapar la voz)
const g = en("gancho", "millón");
const tt = en("telefono", "teléfono");
const tr = en("telefono", "repente");
const ti = en("impuestos", "impuestos");
const te = en("gastos", "esfuma");
const tp = en("deudas", "paga");
const tg = en("emergencias", "guarda");
const tinv = en("invertir", "invierte");
const tint = en("interes", "treinta");

export const EFECTOS: Record<Ilustracion, Golpe[]> = {
  // cae el maletín, se abre, caja registradora y lluvia de billetes
  gancho: [[Math.max(0, g - 14), "caida", 0.35], [g - 2, "golpe", 0.55], [g, "caja_registradora", 0.6], [g + 3, "brillo", 0.4], ...varios(g + 4, 8, 5, "papel", 0.22), ...varios(g + 6, 5, 7, "moneda", 0.25)],
  // corazón latiendo, grito y billetes cayendo
  grito: [[en("grito", "Minuto"), "campana", 0.3], ...varios(en("grito", "corazón"), 6, 9, "latido", 0.5), [en("grito", "gritar."), "boing", 0.3], ...varios(0, 6, 22, "papel", 0.15)],
  // notificaciones del teléfono y burbujas de mensajes
  telefono: [...varios(tt, 4, 6, "notificacion", 0.35), [tr - 8, "pasos", 0.35], [tr + 2, "pop", 0.4], [tr + 10, "pop", 0.4], [tr + 18, "pop", 0.4], [en("telefono", "amigos."), "ding", 0.35]],
  // los fajos salen volando hacia el faraón
  impuestos: [[en("impuestos", "ojo:"), "alarma", 0.18], [ti, "swoosh", 0.45], [ti + 6, "whoosh", 0.4], [ti + 12, "whoosh", 0.4], [ti + 2, "caja_registradora", 0.35], [en("impuestos", "tercio."), "negacion", 0.4]],
  // aparece la mansión, llega el auto, compras y el dinero se va volando
  gastos: [[en("gastos", "mansión") - 4, "pop", 0.5], [en("gastos", "mansión"), "caja_registradora", 0.4], [en("gastos", "auto") - 10, "swoosh", 0.5], [en("gastos", "auto") + 2, "caja_registradora", 0.4], ...varios(te, 8, 4, "papel", 0.25), [te, "puff", 0.4], [en("gastos", "meses."), "caida", 0.4]],
  // la pila de fajos se encoge y baja la flecha
  loteria: [[en("loteria", "lotería"), "ding", 0.35], ...varios(en("loteria", "acaban"), 6, 7, "puff", 0.22), [en("loteria", "problemas"), "golpe", 0.5], [en("loteria", "problemas") + 2, "error", 0.35]],
  // las tarjetas se rompen una a una y se celebra
  deudas: [[en("deudas", "inteligente:"), "ding", 0.4], [tp + 6, "cristal_roto", 0.4], [tp + 11, "cristal_roto", 0.35], [tp + 16, "cristal_roto", 0.35], [en("deudas", "deudas."), "exito", 0.5], [en("deudas", "deudas.") + 4, "caja_registradora", 0.35]],
  // monedas cayendo una a una en el cerdito
  emergencias: [[2, "magia", 0.3], ...varios(tg + 13, 12, 4, "moneda", 0.35), [en("emergencias", "seis"), "pop", 0.4]],
  // las barras crecen, sube el gráfico y aparece la asesora
  invertir: [[tinv, "subida", 0.4], ...varios(tinv, 8, 50 / 7, "pop", 0.25), [en("invertir", "asesor") - 6, "brillo", 0.35], [en("invertir", "asesor"), "clic", 0.4], [en("invertir", "asesor") + 6, "moneda", 0.35]],
  // olas en la isla, monedas que brotan y el contador
  interes: [[0, "olas", 0.3], [en("interes", "cinco"), "clic", 0.45], ...varios(tint - 10, 14, 5, "moneda", 0.3), [tint + 24, "caja_registradora", 0.5]],
  // silencio, Tobías se acerca
  secreto: [[0, "viento", 0.2], [en("secreto", "importante:"), "tic", 0.45], [en("secreto", "cuentes") - 4, "pasos", 0.35], [en("secreto", "cuentes"), "negacion", 0.3]],
  // fiesta final con lluvia de billetes
  final: [[2, "caja_registradora", 0.45], [4, "exito", 0.35], ...varios(6, 10, 9, "papel", 0.18), ...varios(10, 6, 14, "moneda", 0.22), [en("final", "Escríbelo"), "notificacion", 0.55]],
};
