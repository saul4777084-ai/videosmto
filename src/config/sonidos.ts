/**
 * EFECTOS DE SONIDO (archivos en public/sfx/).
 * t = segundo del vídeo · vol = volumen 0..1 · hasta = si se indica, el sonido
 * se repite en bucle desde t hasta ese segundo.
 */
export type Sonido = {t: number; sfx: string; vol?: number; hasta?: number};

/** Tics rápidos mientras un contador sube. */
const tics = (desde: number, hasta: number, cada = 0.2, vol = 0.12, sfx = 'tecla'): Sonido[] => {
  const out: Sonido[] = [];
  for (let t = desde; t < hasta; t += cada) out.push({t: Math.round(t * 100) / 100, sfx, vol});
  return out;
};

export const MUSICA = {archivo: 'sfx/musica.wav', volumen: 0.1};

export const SONIDOS: Sonido[] = [
  // 1 · Intro: habitación
  {t: 0.0, sfx: 'brillo', vol: 0.3},
  {t: 0.6, sfx: 'pop', vol: 0.5},
  {t: 0.0, sfx: 'reloj', vol: 0.18, hasta: 4.3},
  ...tics(0.8, 4.0, 0.25),
  {t: 2.0, sfx: 'fuego', vol: 0.12, hasta: 4.3},

  // 2 · Gimnasio
  {t: 4.28, sfx: 'whoosh', vol: 0.5},
  {t: 4.5, sfx: 'pasos', vol: 0.35, hasta: 11.44},
  {t: 4.55, sfx: 'pop', vol: 0.5},
  {t: 5.5, sfx: 'pop', vol: 0.4},
  ...tics(4.8, 11.3, 0.18),
  {t: 10.4, sfx: 'ding', vol: 0.35},
  {t: 11.44, sfx: 'swoosh', vol: 0.45},
  {t: 11.6, sfx: 'negacion', vol: 0.35},

  // 3 · Ciencia: Canadá
  {t: 13.02, sfx: 'whoosh', vol: 0.5},
  {t: 13.15, sfx: 'magia', vol: 0.35},
  {t: 13.85, sfx: 'swoosh', vol: 0.45},
  {t: 14.25, sfx: 'tic', vol: 0.4},
  {t: 14.82, sfx: 'pop', vol: 0.5},
  {t: 15.62, sfx: 'pop', vol: 0.5},
  {t: 16.42, sfx: 'pop', vol: 0.5},
  // paso del tiempo en la habitación
  {t: 17.27, sfx: 'swoosh', vol: 0.45},
  {t: 17.3, sfx: 'reloj', vol: 0.3, hasta: 22.5},
  ...tics(17.7, 22.2, 0.16, 0.1),
  {t: 22.0, sfx: 'ding', vol: 0.3},

  // 4 · Comida y cinta
  {t: 22.52, sfx: 'whoosh', vol: 0.5},
  {t: 22.65, sfx: 'swoosh', vol: 0.4},
  {t: 22.92, sfx: 'swoosh', vol: 0.4},
  {t: 22.95, sfx: 'pop', vol: 0.5},
  ...tics(23.05, 24.5, 0.12, 0.12),
  {t: 24.55, sfx: 'moneda', vol: 0.35},
  {t: 25.35, sfx: 'pop', vol: 0.45},
  {t: 26.12, sfx: 'pop', vol: 0.5},
  ...tics(26.25, 27.5, 0.12, 0.12),
  {t: 27.55, sfx: 'moneda', vol: 0.35},
  {t: 28.55, sfx: 'pop', vol: 0.45},
  {t: 29.51, sfx: 'swoosh', vol: 0.45},
  {t: 29.6, sfx: 'pasos', vol: 0.45, hasta: 31.92},
  ...tics(29.7, 31.7, 0.12, 0.12),

  // 5 · Cronómetro
  {t: 31.92, sfx: 'whoosh', vol: 0.5},
  {t: 32.45, sfx: 'clic', vol: 0.6},
  {t: 32.5, sfx: 'reloj', vol: 0.35, hasta: 36.0},
  {t: 32.5, sfx: 'latido', vol: 0.55, hasta: 36.6},
  {t: 32.6, sfx: 'fuego', vol: 0.15, hasta: 36.6},
  {t: 33.75, sfx: 'pop', vol: 0.45},
  {t: 36.0, sfx: 'ding', vol: 0.35},

  // 6 · Tele y comparación
  {t: 36.61, sfx: 'whoosh', vol: 0.5},
  {t: 36.9, sfx: 'clic', vol: 0.5},
  ...tics(37.1, 39.1, 0.22, 0.1),
  {t: 39.18, sfx: 'swoosh', vol: 0.4},
  {t: 39.45, sfx: 'subida', vol: 0.35},
  {t: 39.9, sfx: 'subida', vol: 0.4},
  {t: 41.3, sfx: 'exito', vol: 0.3},

  // 7 · Final
  {t: 42.22, sfx: 'whoosh', vol: 0.5},
  {t: 42.4, sfx: 'pop', vol: 0.45},
  ...tics(42.55, 43.75, 0.12, 0.12),
  {t: 43.8, sfx: 'magia', vol: 0.35},
  {t: 44.27, sfx: 'pop', vol: 0.5},
  ...tics(44.3, 45.3, 0.1, 0.12),
  {t: 46.5, sfx: 'exito', vol: 0.45},
  {t: 46.55, sfx: 'brillo', vol: 0.3},
  {t: 47.4, sfx: 'whoosh', vol: 0.3},
];
