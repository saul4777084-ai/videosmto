import type {Ancla} from '../camera/esquema';

/**
 * MAPA DE TIEMPO guion <-> audio.
 * Las anclas relacionan segundos del guion (tiempos escritos en config/) con
 * segundos reales del archivo de audio. Entre anclas se interpola linealmente
 * y fuera de ellas se avanza a velocidad normal.
 */
const mapear = (t: number, anclas: Ancla[], de: 'guion' | 'audio', a: 'guion' | 'audio') => {
  if (!anclas.length) return t;
  if (t <= anclas[0][de]) return anclas[0][a] + (t - anclas[0][de]);
  const ult = anclas[anclas.length - 1];
  if (t >= ult[de]) return ult[a] + (t - ult[de]);
  for (let i = 1; i < anclas.length; i++) {
    const p = anclas[i - 1];
    const q = anclas[i];
    if (t <= q[de]) {
      const span = q[de] - p[de];
      return span <= 1e-6 ? q[a] : p[a] + ((t - p[de]) / span) * (q[a] - p[a]);
    }
  }
  return t;
};

export const guionAAudio = (t: number, anclas: Ancla[]) => mapear(t, anclas, 'guion', 'audio');
export const audioAGuion = (t: number, anclas: Ancla[]) => mapear(t, anclas, 'audio', 'guion');
