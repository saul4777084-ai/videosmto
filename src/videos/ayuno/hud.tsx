import React from 'react';
import {interpolate} from 'remotion';
import tiempos from './tiempos.json';

/**
 * Infografías superpuestas: título, indicador de día con barra de 7 días, panel de fuentes de
 * energía (ilustrativo), etiquetas de lo que se ve, avisos y subtítulos sincronizados.
 */

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'Poppins, sans-serif';
const CIAN = '#7ad8ff';

export const aparece = (t: number, a: number, b: number, f = 0.4) => interpolate(t, [a, a + f, b - f, b], [0, 1, 1, 0], cl);

/* ------------------------------------------------------------------ título */
export const Titulo: React.FC<{t: number}> = ({t}) => {
  const o = aparece(t, 0.6, 5.2, 0.6);
  const esc = interpolate(t, [0.6, 5.2], [1.06, 1], cl);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: o, transform: `scale(${esc})`}}>
      <div style={{fontFamily: F, fontWeight: 800, fontSize: 112, lineHeight: 1, color: '#fff', letterSpacing: 4, textShadow: '0 0 40px rgba(90,180,255,0.7), 0 6px 20px rgba(0,0,0,0.8)'}}>
        7 DÍAS
        <br />
        SIN COMER
      </div>
      <div style={{fontFamily: F, fontWeight: 500, fontSize: 38, color: CIAN, marginTop: 22, letterSpacing: 2, textShadow: '0 2px 12px rgba(0,0,0,0.9)'}}>¿Qué sucede dentro de tu cuerpo?</div>
    </div>
  );
};

/* ------------------------------------------------------------------ indicador de día */
const DIAS: Record<string, {dia: string; rango: string; n: number}> = {
  dia1: {dia: 'DÍA 1', rango: '≈ primeras 24 horas', n: 1},
  dia2: {dia: 'DÍA 2', rango: '≈ entre 24 y 48 horas', n: 2},
  dia3: {dia: 'DÍA 3', rango: '≈ entre 48 y 72 horas', n: 3},
  dia45: {dia: 'DÍAS 4 Y 5', rango: 'con el paso de los días', n: 5},
  dia67: {dia: 'DÍAS 6 Y 7', rango: 'estrés importante', n: 7},
};
export const Dia: React.FC<{escena: string; t: number; dur: number}> = ({escena, t, dur}) => {
  const d = DIAS[escena];
  if (!d) return null;
  const o = aparece(t, 0.2, dur + 0.2, 0.45);
  const golpe = interpolate(t, [0.2, 0.5, 0.9], [1.25, 0.96, 1], cl);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o}}>
      <div style={{transform: `scale(${golpe})`, padding: '10px 38px', borderRadius: 18, background: 'rgba(4,14,30,0.55)', border: `2px solid ${CIAN}66`, boxShadow: `0 0 30px ${CIAN}33`}}>
        <div style={{fontFamily: F, fontWeight: 800, fontSize: 68, color: '#fff', letterSpacing: 6, textAlign: 'center', textShadow: `0 0 24px ${CIAN}aa`}}>{d.dia}</div>
        <div style={{fontFamily: F, fontWeight: 500, fontSize: 28, color: CIAN, textAlign: 'center', marginTop: -4}}>{d.rango}</div>
      </div>
      <div style={{display: 'flex', gap: 12, marginTop: 18}}>
        {[1, 2, 3, 4, 5, 6, 7].map((k) => {
          const on = k <= d.n;
          const nuevo = on && k > (d.n === 5 ? 3 : d.n === 7 ? 5 : d.n - 1);
          const enc = nuevo ? interpolate(t, [0.4 + (k - 1) * 0.05, 0.9], [0, 1], cl) : on ? 1 : 0;
          return <div key={k} style={{width: 46, height: 8, borderRadius: 4, background: `rgba(122,216,255,${0.15 + 0.85 * enc})`, boxShadow: enc > 0.5 ? `0 0 12px ${CIAN}` : 'none'}} />;
        })}
      </div>
      <div style={{fontFamily: F, fontWeight: 500, fontSize: 22, color: 'rgba(255,255,255,0.6)', marginTop: 10}}>Tiempos aproximados · varían en cada persona</div>
    </div>
  );
};

/* ------------------------------------------------------------------ panel de energía */
type Fuentes = [number, number, number, number, number];
const NOMBRES = ['Comida reciente', 'Glucógeno', 'Grasa', 'Cuerpos cetónicos', 'Proteínas'];
const COLORES = ['#8ad8ff', '#ffc84a', '#ffe070', '#5affb8', '#ff7a6a'];
const NIVELES: Record<string, [Fuentes, Fuentes]> = {
  dia1: [[0.75, 0.3, 0.15, 0.02, 0.05], [0.15, 0.85, 0.3, 0.05, 0.06]],
  dia2: [[0.05, 0.55, 0.45, 0.1, 0.1], [0.02, 0.15, 0.78, 0.22, 0.12]],
  dia3: [[0.02, 0.1, 0.78, 0.3, 0.12], [0.02, 0.06, 0.8, 0.62, 0.14]],
  dia45: [[0.02, 0.05, 0.8, 0.65, 0.16], [0.02, 0.04, 0.75, 0.7, 0.32]],
  dia67: [[0.02, 0.04, 0.72, 0.7, 0.32], [0.02, 0.03, 0.68, 0.68, 0.36]],
};
export const PanelEnergia: React.FC<{escena: string; t: number; dur: number}> = ({escena, t, dur}) => {
  const n = NIVELES[escena];
  if (!n) return null;
  const o = aparece(t, 1.0, dur - 0.1, 0.5);
  const k = interpolate(t, [1.0, dur - 1], [0, 1], cl);
  return (
    <div style={{position: 'absolute', right: 40, top: 520, width: 330, padding: '18px 20px', borderRadius: 18, background: 'rgba(3,10,24,0.55)', border: '1px solid rgba(122,216,255,0.3)', opacity: o, fontFamily: F}}>
      <div style={{fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 2, marginBottom: 10}}>FUENTES DE ENERGÍA</div>
      {NOMBRES.map((nom, i) => {
        const v = n[0][i] + (n[1][i] - n[0][i]) * k;
        return (
          <div key={nom} style={{marginBottom: 9}}>
            <div style={{fontWeight: 500, fontSize: 19, color: 'rgba(255,255,255,0.85)'}}>{nom}</div>
            <div style={{height: 9, borderRadius: 5, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
              <div style={{width: `${v * 100}%`, height: '100%', borderRadius: 5, background: COLORES[i], boxShadow: `0 0 10px ${COLORES[i]}`}} />
            </div>
          </div>
        );
      })}
      <div style={{fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 6}}>Uso relativo · ilustrativo</div>
    </div>
  );
};

/* ------------------------------------------------------------------ etiquetas de lo que se ve */
export type Etiqueta = {texto: string; color: string};
export const Etiquetas: React.FC<{lista: Etiqueta[]; t: number; dur: number; titulo?: string}> = ({lista, t, dur, titulo}) => (
  <div style={{position: 'absolute', left: 40, top: 520, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F}}>
    {titulo && (
      <div style={{opacity: aparece(t, 0.4, dur - 0.1, 0.4), fontWeight: 800, fontSize: 34, color: '#fff', letterSpacing: 1, textShadow: '0 2px 12px rgba(0,0,0,0.9)', maxWidth: 520}}>{titulo}</div>
    )}
    {lista.map((e, i) => {
      const o = aparece(t, 0.7 + i * 0.25, dur - 0.1, 0.35);
      return (
        <div key={e.texto} style={{opacity: o, transform: `translateX(${(1 - o) * -24}px)`, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 8px 12px', borderRadius: 30, background: 'rgba(3,10,24,0.55)', border: `1px solid ${e.color}66`, alignSelf: 'flex-start'}}>
          <div style={{width: 16, height: 16, borderRadius: 8, background: e.color, boxShadow: `0 0 12px ${e.color}`}} />
          <div style={{fontWeight: 600, fontSize: 26, color: '#fff'}}>{e.texto}</div>
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ síntomas (días 4-5) y alertas */
const fraseDe = (texto: string) => tiempos.frases.find((f) => f.texto.startsWith(texto));
/** Momento en que se dice una palabra dentro de una frase (reparto por letras). */
export const momento = (inicioFrase: string, palabra: string) => {
  const f = fraseDe(inicioFrase);
  if (!f) return 0;
  const i = f.texto.toLowerCase().indexOf(palabra.toLowerCase());
  return f.inicio + (f.fin - f.inicio) * (Math.max(0, i) / f.texto.length);
};
export const Sintomas: React.FC<{tAbs: number}> = ({tAbs}) => {
  const items = [
    {txt: 'Debilidad', p: 'debilidad', ic: '⚡'},
    {txt: 'Mareos', p: 'mareos', ic: '◎'},
    {txt: 'Deshidratación', p: 'deshidratación', ic: '💧'},
    {txt: 'Electrolitos alterados', p: 'electrolitos', ic: '⚖'},
  ];
  const fin = (fraseDe('Pueden aparecer')?.fin ?? 0) + 2.2;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 760, display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', fontFamily: F}}>
      {items.map((it) => {
        const a = momento('Pueden aparecer', it.p) - 0.1;
        const o = aparece(tAbs, a, fin, 0.3);
        const s = interpolate(tAbs, [a, a + 0.25, a + 0.45], [0.7, 1.08, 1], cl);
        return (
          <div key={it.txt} style={{opacity: o, transform: `scale(${s})`, padding: '12px 22px', borderRadius: 16, background: 'rgba(40,6,10,0.6)', border: '2px solid rgba(255,110,90,0.7)', boxShadow: '0 0 20px rgba(255,80,60,0.35)', color: '#fff', fontWeight: 700, fontSize: 30}}>
            <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: '#ff6a5a', boxShadow: '0 0 10px #ff6a5a', marginRight: 12, verticalAlign: 'middle'}} />
            {it.txt}
          </div>
        );
      })}
    </div>
  );
};

export const Alerta: React.FC<{texto: string; sub?: string; t: number; dur: number; top?: number}> = ({texto, sub, t, dur, top = 560}) => {
  const o = aparece(t, 0.5, dur - 0.1, 0.4);
  const pulso = 0.6 + 0.4 * Math.abs(Math.sin(t * 3));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: o, fontFamily: F}}>
      <div style={{padding: '14px 30px', borderRadius: 18, background: 'rgba(40,4,8,0.62)', border: `2px solid rgba(255,90,70,${pulso})`, boxShadow: `0 0 ${30 * pulso}px rgba(255,60,40,0.45)`, textAlign: 'center'}}>
        <div style={{fontWeight: 800, fontSize: 36, color: '#fff', letterSpacing: 1}}>{texto}</div>
        {sub && <div style={{fontWeight: 500, fontSize: 24, color: '#ffc8c0', marginTop: 4}}>{sub}</div>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ cierre */
export const Cierre: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const o = aparece(t, 3.6, dur + 1, 0.8);
  const o2 = aparece(t, 6.5, dur + 1, 0.8);
  return (
    <>
      <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`}}>
        <div style={{fontFamily: F, fontWeight: 800, fontSize: 78, lineHeight: 1.08, color: '#fff', letterSpacing: 2, textShadow: '0 0 36px rgba(90,180,255,0.7), 0 6px 20px rgba(0,0,0,0.85)'}}>
          TU CUERPO NECESITA ENERGÍA PARA SOBREVIVIR
        </div>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 610, textAlign: 'center', opacity: o2, fontFamily: F, fontWeight: 500, fontSize: 26, color: 'rgba(255,255,255,0.82)', lineHeight: 1.35, textShadow: '0 2px 10px rgba(0,0,0,0.9)'}}>
        Contenido educativo. No es un reto ni una recomendación.
        <br />
        Ante cualquier duda sobre el ayuno, consulta a un profesional sanitario.
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ aviso inicial y subtítulos */
export const AvisoInicial: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 240, textAlign: 'center', opacity: aparece(t, 5.6, 10.6, 0.5), fontFamily: F, fontWeight: 500, fontSize: 26, color: 'rgba(255,255,255,0.78)', textShadow: '0 2px 10px rgba(0,0,0,0.9)'}}>
    Contenido educativo · cada organismo responde de forma distinta
  </div>
);

export const Subtitulos: React.FC<{tAbs: number}> = ({tAbs}) => {
  const s = tiempos.subtitulos.find((x) => tAbs >= x.inicio - 0.05 && tAbs < x.fin + 0.12);
  if (!s) return null;
  const o = interpolate(tAbs, [s.inicio - 0.05, s.inicio + 0.08, s.fin, s.fin + 0.12], [0, 1, 1, 0], cl);
  const palabras = s.texto.split(' ');
  const k = (tAbs - s.inicio) / Math.max(0.1, s.fin - s.inicio);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 1370, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{padding: '12px 26px', borderRadius: 16, background: 'rgba(0,0,0,0.5)', fontFamily: F, fontWeight: 700, fontSize: 46, lineHeight: 1.18, textAlign: 'center', color: '#fff', textShadow: '0 3px 10px rgba(0,0,0,0.9)'}}>
        {palabras.map((p, i) => (
          <span key={i} style={{color: i / palabras.length <= k ? '#ffffff' : 'rgba(255,255,255,0.55)'}}>
            {p}
            {i < palabras.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};
