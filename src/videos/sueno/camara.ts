import {crearSincro} from '../../camera/sincro';
import {cierre, dramatico, ef, generalAPrimerPlano, lateral, objeto, orbita, plano, pregunta, revelacion, revelarVertical, seguir, sorpresa} from '../../camera/director';
import type {ConfigCamara} from '../../camera/esquema';
import {ESCENAS_SUENO, PLANOS_SUENO, PlanoSueno, SUBTITULOS_SUENO, VIDEO_SUENO} from './config';

/**
 * PLAN DE CÁMARA de "7 días sin dormir".
 * Cada movimiento está atado a una palabra de la narración: w('plano', 'palabra').
 * Todo se puede retocar después en el panel Props del Studio.
 */
const {en, palabra, inicioPlano} = crearSincro(ESCENAS_SUENO, PLANOS_SUENO, SUBTITULOS_SUENO);
export const inicioPlanoSueno = inicioPlano as (p: string) => number;
const w = (p: PlanoSueno, texto: string, desde = 0) => en(p, palabra(texto, desde));

type F = [number, number];
const foco = (f: F) => ({focoX: f[0], focoY: f[1]});

const D: Record<PlanoSueno, number> = {
  gancho: 7.23,
  dia1: ESCENAS_SUENO.dia1.tomas.microsuenos,
  dia1Micro: ESCENAS_SUENO.dia1.fin - inicioPlano('dia1Micro'),
  dia2: ESCENAS_SUENO.dia2.tomas.comida,
  dia2Comida: ESCENAS_SUENO.dia2.fin - inicioPlano('dia2Comida'),
  dia3: ESCENAS_SUENO.dia3.tomas.alucinaciones,
  dia3Aluc: ESCENAS_SUENO.dia3.fin - inicioPlano('dia3Aluc'),
  dia45: ESCENAS_SUENO.dia45.fin - ESCENAS_SUENO.dia45.inicio,
  dia67: ESCENAS_SUENO.dia67.fin - ESCENAS_SUENO.dia67.inicio,
  gardner: ESCENAS_SUENO.gardner.fin - ESCENAS_SUENO.gardner.inicio,
  cierre: ESCENAS_SUENO.cierre.fin - ESCENAS_SUENO.cierre.inicio,
  presentador: VIDEO_SUENO.duracionSegundos,
};

// Posiciones en pantalla (0..1) de lo que menciona la voz
const P = {
  caraCama: [0.5, 0.585] as F,
  reloj: [0.74, 0.29] as F,
  caraMesa: [0.5, 0.625] as F,
  taza: [0.19, 0.68] as F,
  vaso: [0.8, 0.67] as F,
  caraD2: [0.5, 0.755] as F,
  escudo: [0.28, 0.51] as F,
  caraComida: [0.5, 0.54] as F,
  donut: [0.19, 0.78] as F,
  hamburguesa: [0.41, 0.8] as F,
  caraD3: [0.5, 0.705] as F,
  bocadillo: [0.52, 0.48] as F,
  caraAluc: [0.46, 0.68] as F,
  sombra: [0.8, 0.51] as F,
  caraD45: [0.5, 0.675] as F,
  caraD67: [0.5, 0.667] as F,
  corazon: [0.37, 0.81] as F,
  titular: [0.5, 0.38] as F,
  foto: [0.31, 0.62] as F,
  calendario: [0.79, 0.33] as F,
  tarjeta1: [0.195, 0.667] as F,
  tarjeta2: [0.5, 0.667] as F,
  tarjeta3: [0.81, 0.667] as F,
  cerebro: [0.17, 0.4] as F,
  presentador: [0.84, 0.86] as F,
};
const TXT: F = [0.5, 0.44];

export const CAMARA_SUENO: ConfigCamara = {
  audio: {archivo: VIDEO_SUENO.narracion, volumen: 1, sincronizar: true, sensibilidad: 0.5, anclas: []},
  global: {
    intensidadGeneral: 1,
    respiracion: 1.2,
    zoomMaximo: 1.9,
    desenfoqueMaxPrincipal: 6,
    desenfoqueMaximo: 22,
    hudSigueCamara: 0.1,
    desenfoqueHud: 0.5,
    motionBlur: {activo: true, modo: 'muestras', obturador: 0.5, muestras: 8, umbral: 2.5},
  },
  transiciones: {
    gancho: 'fundido',
    dia1: 'zoom',
    dia1Micro: 'corte',
    dia2: 'barrido',
    dia2Comida: 'desenfoque',
    dia3: 'zoom',
    dia3Aluc: 'desenfoque',
    dia45: 'corte',
    dia67: 'desenfoque',
    gardner: 'barrido',
    cierre: 'fundido',
    presentador: 'fundido',
  },
  planos: {
    // PREGUNTA inicial: se revela la habitación, acercamiento lento durante la pregunta y,
    // en el silencio, la cámara se precipita hacia el reloj que gira sin control.
    gancho: plano(
      D.gancho,
      [ef('focusPull', 0, 1.3, {intensidad: 0.9, curva: 'salida', planoDesde: 0.45, planoHasta: 1})],
      pregunta(0.15, 2.6, {foco: P.caraCama}),
      lateral(2.7, 3.3, 1, 0.6),
      revelacion(w('gancho', 'día a día'), {impacto: 0.5, desde: 0.6, hasta: 1}),
      [
        ef('zoomIn', 5.95, 1.28, {intensidad: 0.55, curva: 'entrada', centrar: 0.7, ...foco(P.reloj)}),
        ef('motionBlur', 6.5, 0.73, {intensidad: 1.5}),
        ef('temblor', 6.95, 0.3, {intensidad: 0.3}),
      ],
    ),

    // DÍA 1: golpe de título, el café y acercamiento dramático hasta "alcohol".
    dia1: plano(
      D.dia1,
      revelacion(0, {impacto: 1.2, desde: 0.4, hasta: 1}),
      lateral(0.3, 2.0, -1, 0.6),
      objeto(w('dia1', 'despierto'), {foco: P.taza, plano: 1.2, radio: 0.14, zoom: 0, centrar: 0, duracion: 1.3}),
      dramatico(w('dia1', 'alcohol'), {foco: P.caraMesa, texto: '≈ 0,1 % DE ALCOHOL', textoEn: [0.5, 0.36]}),
      objeto(w('dia1', 'alcohol') + 0.25, {foco: P.vaso, plano: 1.2, radio: 0.15, zoom: 0, centrar: 0, duracion: 0.9}),
    ),

    // Microsueños: de plano general a primer plano mientras los párpados se cierran.
    dia1Micro: plano(
      D.dia1Micro,
      generalAPrimerPlano(0, 2.6, {foco: P.caraMesa, intensidad: 0.9}),
      [ef('temblor', 1.19, 0.3, {intensidad: 0.15}), ef('temblor', 2.34, 0.3, {intensidad: 0.15})],
      revelacion(w('dia1Micro', 'microsueños'), {texto: 'MICROSUEÑOS', textoEn: TXT, desde: 0.4, hasta: 1}),
      cierre(3.75, D.dia1Micro),
    ),

    // DÍA 2: el escudo de defensas se agrieta; zoom de sorpresa en "hambre".
    dia2: plano(
      D.dia2,
      revelacion(0, {impacto: 1.2, desde: 0.4, hasta: 1}),
      objeto(w('dia2', 'defensas'), {foco: P.escudo, plano: 1.2, desde: 1, radio: 0.17, zoom: 0.1}),
      [ef('temblor', w('dia2', 'debilitan'), 0.35, {intensidad: 0.3})],
      sorpresa(w('dia2', 'hambre'), {foco: P.caraD2, intensidad: 0.8}),
      cierre(3.15, D.dia2),
    ),

    // Comida basura: movimiento lateral, zoom y resaltado de "azúcar y grasa".
    dia2Comida: plano(
      D.dia2Comida,
      lateral(0, 3.4, 1, 0.5),
      objeto(w('dia2Comida', 'azúcar y grasa'), {foco: P.donut, plano: 1.25, desde: 1, radio: 0.14, zoom: 0.08, duracion: 0.8}),
      objeto(w('dia2Comida', 'azúcar y grasa') + 0.55, {foco: P.hamburguesa, plano: 1.25, desde: 1.25, radio: 0.16, zoom: 0, centrar: 0, duracion: 0.9}),
      revelacion(w('dia2Comida', 'energía'), {impacto: 0.7, desde: 1.25, hasta: 1}),
      cierre(2.85, D.dia2Comida),
    ),

    // DÍA 3: le cuesta hablar (bocadillo), recordar y concentrarse (giro del escenario).
    dia3: plano(
      D.dia3,
      revelacion(0, {impacto: 1.2, desde: 0.4, hasta: 1}),
      objeto(w('dia3', 'hablar'), {foco: P.bocadillo, plano: 1.15, desde: 1, radio: 0.24, zoom: 0.08}),
      [ef('temblor', w('dia3', 'recordar'), 0.3, {intensidad: 0.2})],
      [ef('orbita', w('dia3', 'concentrarte') - 0.2, 0.9, {intensidad: 0.35, dirX: -1, mantener: false, ...foco(P.caraD3)})],
      cierre(2.95, D.dia3),
    ),

    // Alucinaciones: acercamiento dramático y rack focus a la sombra que "no está ahí".
    dia3Aluc: plano(
      D.dia3Aluc,
      dramatico(w('dia3Aluc', 'alucinaciones'), {foco: P.caraAluc, intensidad: 1.1}),
      objeto(w('dia3Aluc', 'no están ahí'), {foco: P.sombra, plano: 0.75, desde: 1, radio: 0.2, zoom: 0.1, centrar: 0.2, duracion: 1.0}),
    ),

    // DÍAS 4 Y 5: órbita inestable, ojos en la oscuridad, glitch y "¿es real?".
    dia45: plano(
      D.dia45,
      revelacion(0, {impacto: 1.4, desde: 0.4, hasta: 1}),
      orbita(0.3, 3.0, {foco: P.caraD45, dir: 1, intensidad: 0.45, acercar: 0.06}),
      [ef('temblor', w('dia45', 'paranoia'), 0.3, {intensidad: 0.3})],
      lateral(3.4, 2.7, -1, 0.6),
      [ef('temblor', en('dia45', 35.63), 0.35, {intensidad: 0.4}), ef('temblor', en('dia45', 36.9), 0.3, {intensidad: 0.4})],
      revelacion(w('dia45', 'real'), {texto: '¿ES REAL?', textoEn: [0.5, 0.42], desde: 1, hasta: 1, impacto: 1.2}),
      cierre(5.6, D.dia45),
    ),

    // DÍAS 6 Y 7: acercamiento con microsueños y dolly zoom en "alerta máxima".
    dia67: plano(
      D.dia67,
      revelacion(0, {impacto: 1.3, desde: 0.4, hasta: 1}),
      generalAPrimerPlano(0.4, 3.4, {foco: P.caraD67, intensidad: 0.75}),
      objeto(w('dia67', 'cuerpo', 41), {foco: P.corazon, plano: 1.2, radio: 0.14, zoom: 0, centrar: 0, duracion: 0.9}),
      [ef('dollyZoom', w('dia67', 'alerta máxima') - 0.2, 1.3, {intensidad: 0.35, ...foco(P.caraD67)})],
      revelacion(w('dia67', 'alerta máxima'), {texto: 'ALERTA MÁXIMA', textoEn: TXT, desde: 0.4, hasta: 1, impacto: 1.5}),
    ),

    // RANDY GARDNER: zoom al titular, paneo vertical a la foto, calendario de 11 días
    // y paneo horizontal siguiendo los tres síntomas.
    gardner: plano(
      D.gardner,
      objeto(w('gardner', 'Randy Gardner'), {foco: P.titular, plano: 1, radio: 0.3, zoom: 0.1, centrar: 0.15, duracion: 1.1}),
      revelarVertical(w('gardner', 'diecisiete') - 0.2, 1.4, 1, 0.5),
      objeto(w('gardner', 'diecisiete'), {foco: P.foto, plano: 1, radio: 0.19, zoom: 0, centrar: 0, duracion: 1.0}),
      objeto(w('gardner', 'once días'), {foco: P.calendario, plano: 1.2, desde: 1, radio: 0.16, zoom: 0.04, centrar: 0}),
      revelacion(w('gardner', 'once días') + 0.15, {texto: '11 DÍAS · 264 H', textoEn: [0.5, 0.5], desde: 1.2, hasta: 1.2}),
      cierre(5.35, 5.5),
      [ef('zoomIn', 5.95, 0.5, {intensidad: 0.12, curva: 'salida', ...foco(P.tarjeta1)})],
      [ef('paneo', 5.95, 0.4, {intensidad: 0.9, dirX: -1, curva: 'salida'})],
      seguir(6.4, 2.1, 1, 1.9),
      objeto(w('gardner', 'alucinaciones', 49), {foco: P.tarjeta1, plano: 1.1, radio: 0.15, zoom: 0, centrar: 0, duracion: 0.7}),
      objeto(w('gardner', 'fallos de memoria'), {foco: P.tarjeta2, plano: 1.1, radio: 0.15, zoom: 0, centrar: 0, duracion: 0.9}),
      objeto(w('gardner', 'hablar', 51), {foco: P.tarjeta3, plano: 1.1, radio: 0.15, zoom: 0, centrar: 0, duracion: 1.0}),
      cierre(8.55, D.gardner),
    ),

    // CIERRE: amanecer, acercamiento al personaje dormido, el cerebro se recupera,
    // aviso "no lo intentes" y alejamiento cinematográfico final.
    cierre: plano(
      D.cierre,
      [ef('focusPull', 0, 1.0, {intensidad: 0.7, curva: 'salida', planoDesde: 0.45, planoHasta: 1})],
      generalAPrimerPlano(0.2, 2.2, {foco: P.caraCama, intensidad: 0.6}),
      objeto(w('cierre', 'se recupera'), {foco: P.cerebro, plano: 1, radio: 0.13, zoom: 0, centrar: 0, duracion: 1.0}),
      revelacion(w('cierre', 'Así', 56), {texto: '¡NO LO INTENTES!', textoEn: TXT, desde: 1, hasta: 1, impacto: 0.9}),
      lateral(4.4, 2.5, -1, 0.5),
      cierre(4.75, D.cierre - 0.45),
    ),

    // Cámara global: órbitas 2.5D alrededor del presentador (sin deformarlo nunca).
    presentador: [
      ...orbita(0.3, 2.6, {foco: P.presentador, dir: 1, intensidad: 0.4, acercar: 0.03}),
      ...orbita(43.95, 3.0, {foco: P.presentador, dir: -1, intensidad: 0.4, acercar: 0.03}),
      ...orbita(53.3, 2.6, {foco: P.presentador, dir: 1, intensidad: 0.4, acercar: 0.03}),
      ...orbita(57.6, 2.3, {foco: P.presentador, dir: -1, intensidad: 0.35, acercar: 0.03, mantener: true}),
    ],
  },
};
