/** Colores de los personajes: cámbialos aquí para rediseñarlos. */
export const PERSONAJES = {
  el: {
    piel: '#f0bf98',
    pielSombra: '#d99b76',
    pelo: '#3a2722',
    camiseta: '#3f7fe0',
    camisetaSombra: '#2c5fb0',
    pantalon: '#26304f',
    zapatilla: '#ffffff',
    suela: '#ff5a3c',
  },
  ella: {
    piel: '#f7d0b0',
    pielSombra: '#e3aa86',
    pelo: '#8a3a2a',
    peloBrillo: '#b4523b',
    camiseta: '#ff5f9e',
    camisetaSombra: '#d9407e',
    pantalon: '#3b2a5c',
    zapatilla: '#ffffff',
    suela: '#3fc3ff',
  },
};
export type Quien = keyof typeof PERSONAJES;
