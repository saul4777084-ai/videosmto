/**
 * Ajustes generales del vídeo.
 *
 * NARRACIÓN: copia tu archivo MP3 o WAV dentro de la carpeta /public y
 * escribe aquí su nombre (es el valor inicial de audio.archivo; también se
 * puede cambiar en el panel Props del Studio). Con audio.sincronizar la
 * animación se ajusta sola a los tiempos reales de la voz.
 * duracionSegundos es la duración del guion; la del vídeo final sale del audio.
 */
export const VIDEO = {
  fps: 30,
  ancho: 1080,
  alto: 1920,
  duracionSegundos: 48.27,

  narracion: 'narracion.mp3' as string | null, // archivo dentro de /public
  volumenNarracion: 1,

  /** Muestra u oculta los subtítulos (config/textos.ts). */
  mostrarSubtitulos: true,

  musica: null as string | null, // p. ej. 'musica.mp3'
  volumenMusica: 0.18,

  /** Frames que se solapan dos escenas durante la transición. */
  solapeTransicion: 14,
};
