import {z} from 'zod';

/**
 * ESQUEMA DE CONTROLES DE CÁMARA
 *
 * Este esquema es el que Remotion Studio usa para dibujar el panel de
 * propiedades (pestaña "Props" a la derecha): cada efecto de cada plano se
 * puede activar, desactivar y ajustar con controles numéricos, listas y
 * casillas, y el render (npm run render) usa exactamente esos valores.
 */

export const TIPOS_EFECTO = [
  'zoomIn', // 1. acercamiento progresivo hacia el foco
  'zoomOut', // 2. alejamiento suave (si empieza el plano, el plano arranca cerca)
  'rackFocus', // 3. cambia el plano de enfoque de una capa a otra
  'profundidad', // 4. depth of field: desenfoca lo que no está en el plano de enfoque
  'motionBlur', // 5. barrido rápido con desenfoque de movimiento reforzado
  'paneo', // 6. camera pan horizontal / vertical
  'parallax', // 7. desplaza las capas a distinta velocidad según su profundidad
  'dollyZoom', // 8. el personaje se acerca mientras el fondo cambia de escala
  'focusPull', // 9. desenfoca toda la escena y enfoca progresivamente el elemento
  'temblor', // 10. camera shake de impacto
  'orbita', // órbita lateral 2.5D alrededor del foco (capas, parallax y giro del escenario)
  'resaltar', // foco de luz y anillo sobre el objeto mencionado
  'rotulo', // texto importante en pantalla
] as const;
export type TipoEfecto = (typeof TIPOS_EFECTO)[number];

export const CURVAS = ['suave', 'entrada', 'salida', 'lineal', 'rebote', 'latigo'] as const;
export type Curva = (typeof CURVAS)[number];

export const SFX = [
  'ninguno', 'alarma', 'brillo', 'campana', 'clic', 'ding', 'exito', 'fuego', 'latido', 'magia', 'moneda',
  'negacion', 'papel', 'pasos', 'pop', 'puff', 'reloj', 'subida', 'swoosh', 'tecla', 'tic', 'whoosh',
] as const;

export const TRANSICIONES = ['fundido', 'zoom', 'barrido', 'desenfoque', 'corte'] as const;
export type Transicion = (typeof TRANSICIONES)[number];

/** Planos (tomas) que tienen cámara propia. */
export const NOMBRES_PLANO = [
  'intro',
  'gimnasio',
  'gimnasioVuelta',
  'ciencia',
  'cienciaHabitacion',
  'comida',
  'comidaCinta',
  'cronometro',
  'tele',
  'final',
  /** Cámara global sobre el vídeo completo (escena + presentador). Tiempos absolutos. */
  'presentador',
] as const;
export type NombrePlano = (typeof NOMBRES_PLANO)[number];

export const esquemaEfecto = z.object({
  tipo: z.enum(TIPOS_EFECTO),
  activo: z.boolean(),
  /** Segundo de inicio, relativo al comienzo del plano. */
  inicio: z.number().min(0).max(20).step(0.01),
  /** Duración del efecto en segundos. */
  duracion: z.number().min(0.03).max(20).step(0.01),
  /**
   * Intensidad. Significado según el tipo:
   * zoom/dolly: aumento (0.2 = +20 %) · paneo: ×300 px · parallax: ×100 px
   * rackFocus/profundidad: ×10 px de desenfoque por unidad de profundidad
   * focusPull: ×18 px de desenfoque inicial · temblor: ×28 px de amplitud
   * motionBlur: refuerzo del obturador (+200 % por unidad) y barrido ×260 px
   * orbita: ×25° de arco · resaltar: oscurecido alrededor (0..1) · rotulo: tamaño
   */
  intensidad: z.number().min(0).max(3).step(0.01),
  /**
   * Velocidad del movimiento dentro de su duración (1 = usa toda la duración,
   * 2 = llega al destino en la mitad y se mantiene). En "temblor" es la
   * frecuencia de la vibración.
   */
  velocidad: z.number().min(0.25).max(4).step(0.05),
  curva: z.enum(CURVAS),
  /** true = se queda en la posición final; false = vuelve al terminar. */
  mantener: z.boolean(),
  /** Punto de enfoque/zoom en pantalla (0..1). */
  focoX: z.number().min(0).max(1).step(0.01),
  focoY: z.number().min(0).max(1).step(0.01),
  /** 0 = no centra el foco, 1 = lo lleva al centro del encuadre (zoom/dolly). */
  centrar: z.number().min(0).max(1).step(0.05),
  /** Plano de enfoque (profundidad de capa) inicial y final: 0 fondo · 1 personaje · >1 primer término. */
  planoDesde: z.number().min(0).max(2).step(0.05),
  planoHasta: z.number().min(0).max(2).step(0.05),
  /** Dirección (paneo, parallax, barrido). */
  dirX: z.number().min(-1).max(1).step(0.05),
  dirY: z.number().min(-1).max(1).step(0.05),
  /** Radio del resaltado (fracción del ancho de pantalla). */
  radio: z.number().min(0.02).max(1).step(0.01),
  /** Texto del rótulo. */
  texto: z.string(),
  /** Efecto de sonido sincronizado con el inicio del movimiento. */
  sonido: z.enum(SFX),
  volumen: z.number().min(0).max(1).step(0.05),
});
export type Efecto = z.infer<typeof esquemaEfecto>;

export const esquemaGlobal = z.object({
  /** Multiplica la intensidad de todos los efectos (0 = cámara fija). */
  intensidadGeneral: z.number().min(0).max(2).step(0.05),
  /** Leve deriva de cámara en mano para que ningún plano quede rígido. */
  respiracion: z.number().min(0).max(2).step(0.05),
  zoomMaximo: z.number().min(1).max(3).step(0.05),
  /** Desenfoque máximo del personaje principal: lo mantiene siempre reconocible. */
  desenfoqueMaxPrincipal: z.number().min(0).max(20).step(0.5),
  desenfoqueMaximo: z.number().min(0).max(40).step(0.5),
  /** Cuánto siguen los rótulos/contadores al zoom de la cámara (0 = fijos). */
  hudSigueCamara: z.number().min(0).max(1).step(0.05),
  /** Cuánto afecta el focus pull a los rótulos (desenfoque antes de revelar datos). */
  desenfoqueHud: z.number().min(0).max(1).step(0.05),
  motionBlur: z.object({
    activo: z.boolean(),
    /** 'muestras' = desenfoque temporal real (varias exposiciones por frame). 'direccional' = filtro direccional, más rápido. */
    modo: z.enum(['muestras', 'direccional']),
    /** Fracción del frame que el obturador está abierto (0.5 = 180°). */
    obturador: z.number().min(0).max(2).step(0.05),
    /** Número máximo de exposiciones por frame. */
    muestras: z.number().int().min(2).max(16),
    /** Desplazamiento mínimo en px por frame para activar el desenfoque. */
    umbral: z.number().min(0).max(40).step(0.5),
  }),
});
export type CamaraGlobal = z.infer<typeof esquemaGlobal>;

export const esquemaAncla = z.object({
  /** Segundo del guion (tiempos de config/textos.ts). */
  guion: z.number(),
  /** Segundo real en el archivo de audio. */
  audio: z.number(),
});
export type Ancla = z.infer<typeof esquemaAncla>;

export const esquemaAudio = z.object({
  /** Archivo MP3 o WAV dentro de /public (p. ej. "narracion.mp3" o "voz.wav"). */
  archivo: z.string(),
  volumen: z.number().min(0).max(2).step(0.05),
  /**
   * true = analiza el audio y alinea cada frase del guion (config/textos.ts)
   * con su posición real; toda la animación, los subtítulos y los efectos se
   * reajustan a esos tiempos y la duración pasa a ser la del audio.
   */
  sincronizar: z.boolean(),
  /** Sensibilidad para detectar pausas (0..1). Más alto = detecta pausas más suaves. */
  sensibilidad: z.number().min(0).max(1).step(0.05),
  /** Anclas guion -> audio. Se calculan solas al sincronizar; se pueden retocar a mano. */
  anclas: z.array(esquemaAncla),
});
export type ConfigAudio = z.infer<typeof esquemaAudio>;

export const esquemaCamara = z.object({
  audio: esquemaAudio,
  global: esquemaGlobal,
  transiciones: z.object(
    Object.fromEntries(NOMBRES_PLANO.map((p) => [p, z.enum(TRANSICIONES)])) as Record<NombrePlano, z.ZodEnum<{[K in Transicion]: K}>>,
  ),
  planos: z.object(Object.fromEntries(NOMBRES_PLANO.map((p) => [p, z.array(esquemaEfecto)])) as Record<NombrePlano, z.ZodArray<typeof esquemaEfecto>>),
});
export type ConfigCamara = z.infer<typeof esquemaCamara>;
