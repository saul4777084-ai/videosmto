/**
 * TEMAS DE COLOR aplicables a cualquier escena (filtro CSS real, se renderiza en el MP4).
 * Uso: <AbsoluteFill style={{filter: TEMAS.neon.filtro}}>…</AbsoluteFill>
 */
export const TEMAS = {
  original: {nombre: 'Original', filtro: 'none'},
  calido: {nombre: 'Cálido', filtro: 'sepia(0.25) saturate(1.3) hue-rotate(-12deg) brightness(1.05)'},
  frio: {nombre: 'Frío', filtro: 'hue-rotate(25deg) saturate(1.1) brightness(0.95)'},
  neon: {nombre: 'Neón', filtro: 'saturate(2) contrast(1.15) hue-rotate(-35deg)'},
  pastel: {nombre: 'Pastel', filtro: 'saturate(0.55) brightness(1.18) contrast(0.9)'},
  noir: {nombre: 'Cine negro', filtro: 'grayscale(1) contrast(1.35) brightness(0.9)'},
  sepia: {nombre: 'Retro sepia', filtro: 'sepia(0.85) contrast(1.05)'},
  terror: {nombre: 'Terror', filtro: 'hue-rotate(-60deg) saturate(1.6) contrast(1.2) brightness(0.8)'},
  bosque: {nombre: 'Bosque', filtro: 'hue-rotate(80deg) saturate(1.1)'},
} as const;
export type NombreTema = keyof typeof TEMAS;
