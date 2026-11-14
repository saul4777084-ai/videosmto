/**
 * Ajustes generales del vídeo.
 *
 * NARRACIÓN: copia tu archivo de audio dentro de la carpeta /public
 * (por ejemplo public/narracion.mp3) y escribe aquí su nombre:
 *   narracion: 'narracion.mp3'
 * Lo mismo para la música de fondo.
 */
export const VIDEO = {
  fps: 30,
  ancho: 1080,
  alto: 1920,
  duracionSegundos: 48.27,

  narracion: 'narracion.mp3' as string | null, // archivo dentro de /public
  volumenNarracion: 1,
  /** Segundos de retraso de la narración respecto al inicio del vídeo. */
  retrasoNarracion: 0,

  /** Muestra u oculta los subtítulos (config/textos.ts). */
  mostrarSubtitulos: true,

  musica: null as string | null, // p. ej. 'musica.mp3'
  volumenMusica: 0.18,

  /** Frames que se solapan dos escenas durante la transición. */
  solapeTransicion: 14,
};
