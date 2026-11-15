import type {Ancla} from '../camera/esquema';

/**
 * ALINEACIÓN AUTOMÁTICA DEL GUION CON EL AUDIO REAL
 *
 * 1. Calcula la envolvente de energía de la voz (ventanas de 10 ms).
 * 2. Detecta dónde empieza y acaba la voz, las pausas (silencios) y los
 *    valles de energía entre palabras (útil en locuciones sin pausas).
 * 3. Asigna a cada cambio de frase del guion la pausa del audio que mejor
 *    encaja (programación dinámica: cercanía a la posición esperada + fuerza
 *    de la pausa, siempre en orden).
 * 4. Devuelve anclas guion -> audio para reajustar toda la animación.
 *
 * El texto de config/textos.ts debe corresponder a lo que dice la voz y en
 * el mismo orden de frases.
 */

export type Frase = {inicio: number; fin: number};
type Candidato = {ini: number; fin: number; centro: number; fuerza: number};

const HOP = 0.01;

const percentil = (v: number[], p: number) => {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor((p / 100) * s.length)))];
};

export const envolvente = (muestras: Float32Array, sr: number) => {
  const hop = Math.max(1, Math.round(sr * HOP));
  const win = hop * 2;
  const n = Math.max(1, Math.floor((muestras.length - win) / hop));
  const db: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let acc = 0;
    const o = i * hop;
    for (let j = 0; j < win; j++) {
      const x = muestras[o + j] || 0;
      acc += x * x;
    }
    db[i] = 20 * Math.log10(Math.sqrt(acc / win) + 1e-6);
  }
  // suavizado de 30 ms
  return db.map((_, i) => (db[Math.max(0, i - 1)] + db[i] + db[Math.min(n - 1, i + 1)]) / 3);
};

export const alinearFrases = (muestras: Float32Array, sr: number, frases: Frase[], sensibilidad = 0.5) => {
  const duracionAudio = muestras.length / sr;
  const db = envolvente(muestras, sr);
  const suelo = percentil(db, 10);
  const pico = percentil(db, 95);
  const umbral = suelo + (pico - suelo) * (0.12 + 0.3 * sensibilidad);
  const voz = db.map((v) => v > umbral);
  const primero = voz.indexOf(true);
  const ultimo = voz.lastIndexOf(true);
  if (primero < 0 || frases.length === 0) return {anclas: [] as Ancla[], duracionAudio, voz: {inicio: 0, fin: duracionAudio}};
  const vozIni = Math.max(0, primero * HOP - 0.02);
  const vozFin = Math.min(duracionAudio, (ultimo + 2) * HOP);

  // candidatos: silencios y valles de energía
  const cands: Candidato[] = [];
  let i = primero;
  while (i <= ultimo) {
    if (!voz[i]) {
      let j = i;
      while (j <= ultimo && !voz[j]) j++;
      const len = (j - i) * HOP;
      if (len >= 0.04) cands.push({ini: i * HOP, fin: j * HOP, centro: ((i + j) / 2) * HOP, fuerza: Math.min(0.6, len)});
      i = j;
    } else i++;
  }
  const R = 15; // ±150 ms
  const prof = 8 - 4 * sensibilidad;
  for (let k = primero + R; k < ultimo - R; k++) {
    if (!voz[k]) continue;
    let izq = -Infinity;
    let der = -Infinity;
    let esMin = true;
    for (let d = 1; d <= R; d++) {
      izq = Math.max(izq, db[k - d]);
      der = Math.max(der, db[k + d]);
      if (db[k - d] < db[k] || db[k + d] < db[k]) esMin = false;
    }
    const hondo = Math.min(izq, der) - db[k];
    if (esMin && hondo > prof) cands.push({ini: k * HOP, fin: k * HOP, centro: k * HOP, fuerza: Math.min(0.15, hondo / 100)});
  }
  cands.sort((a, b) => a.centro - b.centro);

  // posiciones esperadas de cada cambio de frase (guion escalado a la voz)
  const g0 = frases[0].inicio;
  const g1 = frases[frases.length - 1].fin;
  const esc = (g: number) => vozIni + ((g - g0) / Math.max(1e-3, g1 - g0)) * (vozFin - vozIni);
  const esperados = frases.slice(0, -1).map((f, k) => esc((f.fin + frases[k + 1].inicio) / 2));

  // programación dinámica (asignación ordenada, se permite no asignar)
  const B = esperados.length;
  const C = cands.length;
  const sigma = 0.35 + 0.5 * ((vozFin - vozIni) / Math.max(1, frases.length)) * 0.25;
  const SALTO = 3;
  const coste = (k: number, c: number) => ((cands[c].centro - esperados[k]) / sigma) ** 2 - 6 * cands[c].fuerza;
  // estado: último candidato usado (índice + 1; 0 = ninguno)
  let dp = new Array(C + 1).fill(Infinity);
  dp[0] = 0;
  const desde: number[][] = [];
  for (let k = 0; k < B; k++) {
    const nd = new Array(C + 1).fill(Infinity);
    const de = new Array(C + 1).fill(-1);
    let mejor = Infinity;
    let mejorIdx = -1;
    for (let s = 0; s <= C; s++) {
      // saltar: el estado se mantiene
      if (dp[s] + SALTO < nd[s]) {
        nd[s] = dp[s] + SALTO;
        de[s] = s + (C + 1) * 1; // marca de salto
      }
      // asignar el candidato s (s>=1) usando el mejor estado previo < s
      if (s >= 1 && mejorIdx >= 0) {
        const v = mejor + coste(k, s - 1);
        if (v < nd[s]) {
          nd[s] = v;
          de[s] = mejorIdx;
        }
      }
      if (dp[s] < mejor) {
        mejor = dp[s];
        mejorIdx = s;
      }
    }
    desde.push(de);
    dp = nd;
  }
  let s = dp.indexOf(Math.min(...dp));
  const asignado: (Candidato | null)[] = new Array(B).fill(null);
  for (let k = B - 1; k >= 0; k--) {
    const d = desde[k][s];
    if (d >= C + 1) {
      asignado[k] = null; // salto
    } else {
      asignado[k] = cands[s - 1];
      s = d;
    }
  }

  const anclas: Ancla[] = [{guion: frases[0].inicio, audio: vozIni}];
  asignado.forEach((c, k) => {
    const ini = c ? c.ini : esperados[k] - 0.02;
    const fin = c ? c.fin : esperados[k] + 0.02;
    anclas.push({guion: frases[k].fin, audio: ini});
    anclas.push({guion: frases[k + 1].inicio, audio: Math.max(fin, ini + 0.01)});
  });
  anclas.push({guion: frases[frases.length - 1].fin, audio: vozFin});
  // orden estricto
  for (let k = 1; k < anclas.length; k++) {
    if (anclas[k].audio <= anclas[k - 1].audio) anclas[k].audio = anclas[k - 1].audio + 0.01;
  }
  return {
    anclas: anclas.map((a) => ({guion: Math.round(a.guion * 1000) / 1000, audio: Math.round(a.audio * 1000) / 1000})),
    duracionAudio,
    voz: {inicio: vozIni, fin: vozFin},
  };
};
