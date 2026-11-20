import React from 'react';
import {interpolate} from 'remotion';
import tiempos from './tiempos.json';

/**
 * Infografías del vídeo "Coca-Cola 30 días": título, indicador de día (barra de 30 días),
 * panel de azúcar, gráfica de glucosa e insulina, medidor de grasa hepática, indicadores del
 * día 30, cierre y subtítulos. Todo ilustrativo: los días son una estructura narrativa.
 */

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'Poppins, sans-serif';
const CIAN = '#7ad8ff';
const ROJO = '#ff4a3a';

export const aparece = (t: number, a: number, b: number, f = 0.4) => interpolate(t, [a, a + f, b - f, b], [0, 1, 1, 0], cl);
const sombra = '0 3px 14px rgba(0,0,0,0.9)';

/** Momento (segundo absoluto) en que se dice una palabra dentro de una frase (reparto por letras). */
export const momento = (inicioFrase: string, palabra: string) => {
  const f = tiempos.frases.find((x) => x.texto.startsWith(inicioFrase));
  if (!f) return 0;
  const i = f.texto.toLowerCase().indexOf(palabra.toLowerCase());
  return f.inicio + (f.fin - f.inicio) * (Math.max(0, i) / f.texto.length);
};
export const escena = (id: string) => tiempos.escenas.find((e) => e.id === id)!;

/* ------------------------------------------------------------------ título */
export const Titulo: React.FC<{t: number}> = ({t}) => {
  const o = aparece(t, 0.3, 5.4, 0.5);
  const esc = interpolate(t, [0.3, 5.4], [1.07, 1], cl);
  const l = (k: number) => ({opacity: interpolate(t, [0.3 + k * 0.25, 0.8 + k * 0.25], [0, 1], cl), transform: `translateY(${interpolate(t, [0.3 + k * 0.25, 0.8 + k * 0.25], [24, 0], cl)}px)`});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 250, textAlign: 'center', opacity: o, transform: `scale(${esc})`, fontFamily: F}}>
      <div style={{...l(0), fontWeight: 700, fontSize: 50, color: '#fff', letterSpacing: 2, textShadow: sombra}}>¿QUÉ LE PASA A TU CUERPO</div>
      <div style={{...l(1), fontWeight: 800, fontSize: 80, lineHeight: 1.08, color: '#fff', letterSpacing: 1, marginTop: 6, whiteSpace: 'nowrap', textShadow: `0 0 40px rgba(255,60,50,0.75), ${sombra}`}}>
        SI TOMAS <span style={{color: '#ff4a40'}}>COCA-COLA</span>
      </div>
      <div style={{...l(2), fontWeight: 800, fontSize: 80, lineHeight: 1.08, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap', textShadow: `0 0 40px rgba(90,180,255,0.7), ${sombra}`}}>DURANTE 30 DÍAS?</div>
    </div>
  );
};

export const AvisoInicial: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', opacity: aparece(t, 5.4, 9.4, 0.5), fontFamily: F, fontWeight: 500, fontSize: 26, color: 'rgba(255,255,255,0.8)', textShadow: sombra}}>
    Contenido educativo · los días son una forma de contarlo
  </div>
);

/* ------------------------------------------------------------------ indicador de día */
const DIAS: Record<string, {dia: string; n: number; prev: number}> = {
  dia1: {dia: 'DÍA 1', n: 1, prev: 0},
  dia7: {dia: 'DÍA 7', n: 7, prev: 1},
  dia15: {dia: 'DÍA 15', n: 15, prev: 7},
  dia30: {dia: 'DÍA 30', n: 30, prev: 15},
};
export const Dia: React.FC<{escena: string; t: number; dur: number}> = ({escena: id, t, dur}) => {
  const d = DIAS[id];
  if (!d) return null;
  const o = aparece(t, 0.15, dur + 0.2, 0.45);
  const golpe = interpolate(t, [0.15, 0.45, 0.85], [1.3, 0.95, 1], cl);
  const lleno = d.prev + (d.n - d.prev) * interpolate(t, [0.4, 1.3], [0, 1], cl);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o, fontFamily: F}}>
      <div style={{transform: `scale(${golpe})`, padding: '8px 40px', borderRadius: 18, background: 'rgba(4,14,30,0.55)', border: `2px solid ${CIAN}66`, boxShadow: `0 0 30px ${CIAN}33`}}>
        <div style={{fontWeight: 800, fontSize: 72, color: '#fff', letterSpacing: 6, textAlign: 'center', textShadow: `0 0 24px ${CIAN}aa`}}>{d.dia}</div>
      </div>
      <div style={{display: 'flex', gap: 4, marginTop: 16}}>
        {[...Array(30)].map((_, k) => {
          const enc = Math.min(1, Math.max(0, lleno - k));
          const hito = [0, 6, 14, 29].includes(k);
          return <div key={k} style={{width: 17, height: hito ? 14 : 8, alignSelf: 'center', borderRadius: 3, background: `rgba(122,216,255,${0.14 + 0.86 * enc})`, boxShadow: enc > 0.5 ? `0 0 10px ${CIAN}` : 'none'}} />;
        })}
      </div>
      <div style={{fontWeight: 500, fontSize: 21, color: 'rgba(255,255,255,0.62)', marginTop: 10}}>Estructura narrativa · no son plazos médicos</div>
    </div>
  );
};

/* ------------------------------------------------------------------ etiquetas de lo que se ve */
export type Etiqueta = {texto: string; color: string};
export const Etiquetas: React.FC<{lista: Etiqueta[]; t: number; dur: number; titulo?: string; top?: number}> = ({lista, t, dur, titulo, top = 560}) => (
  <div style={{position: 'absolute', left: 40, top, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F}}>
    {titulo && <div style={{opacity: aparece(t, 0.4, dur - 0.1, 0.4), fontWeight: 800, fontSize: 36, color: '#fff', letterSpacing: 1, textShadow: sombra, maxWidth: 560}}>{titulo}</div>}
    {lista.map((e, i) => {
      const o = aparece(t, 0.7 + i * 0.25, dur - 0.1, 0.35);
      return (
        <div key={e.texto} style={{opacity: o, transform: `translateX(${(1 - o) * -24}px)`, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 8px 12px', borderRadius: 30, background: 'rgba(3,10,24,0.55)', border: `1px solid ${e.color}66`, alignSelf: 'flex-start'}}>
          <div style={{width: 16, height: 16, borderRadius: 8, background: e.color, boxShadow: `0 0 12px ${e.color}`}} />
          <div style={{fontWeight: 600, fontSize: 27, color: '#fff'}}>{e.texto}</div>
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ día 1: azúcar de una lata */
export const PanelAzucar: React.FC<{tAbs: number}> = ({tAbs}) => {
  const a = momento('Una lata', '35') - 0.2;
  const b = momento('Ese azúcar', 'Ese') + 0.4;
  const o = aparece(tAbs, a, b, 0.35);
  const cucharas = momento('Una lata', 'siete') - 0.1;
  const n = interpolate(tAbs, [cucharas, cucharas + 1.0], [0, 7], cl);
  const contador = Math.round(interpolate(tAbs, [a, a + 0.9], [0, 35], cl));
  return (
    <div style={{position: 'absolute', right: 40, top: 560, width: 360, padding: '18px 22px', borderRadius: 20, background: 'rgba(24,6,4,0.6)', border: '2px solid rgba(255,140,90,0.45)', boxShadow: '0 0 30px rgba(255,90,40,0.25)', opacity: o, transform: `scale(${0.92 + 0.08 * o})`, fontFamily: F}}>
      <div style={{fontWeight: 600, fontSize: 21, color: 'rgba(255,255,255,0.75)', letterSpacing: 1}}>LATA DE 330 ml · CLÁSICA</div>
      <div style={{fontWeight: 800, fontSize: 84, color: '#fff', lineHeight: 1.05, textShadow: '0 0 24px rgba(255,140,80,0.7)'}}>
        ≈{contador} g
      </div>
      <div style={{fontWeight: 600, fontSize: 26, color: '#ffc8a0', marginTop: -4}}>de azúcar</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14}}>
        {[...Array(7)].map((_, i) => {
          const k = Math.min(1, Math.max(0, n - i));
          return (
            <div key={i} style={{width: 38, height: 38, borderRadius: 7, background: 'linear-gradient(145deg,#ffffff,#d8e4f0)', boxShadow: '0 0 14px rgba(255,255,255,0.6), inset -4px -4px 0 rgba(150,170,200,0.5)', opacity: k, transform: `scale(${0.4 + 0.6 * k}) rotate(${(1 - k) * 30}deg)`}} />
          );
        })}
      </div>
      <div style={{fontWeight: 600, fontSize: 24, color: '#fff', marginTop: 10, opacity: Math.min(1, n / 2)}}>≈ 7 cucharaditas</div>
      <div style={{fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 6}}>Valor aproximado · varía según el país y la receta</div>
    </div>
  );
};

/* ------------------------------------------------------------------ día 7: glucosa e insulina */
const curvaGlucosa = (x: number) => {
  // picos tras cada bebida (una por "día") que vuelven a su nivel gracias a la insulina
  const p = x % 1;
  return 0.25 + 0.6 * Math.exp(-(((p - 0.25) / 0.09) ** 2)) * (p > 0.12 ? 1 : 0.4 + p * 5);
};
const curvaInsulina = (x: number) => {
  const p = x % 1;
  return 0.15 + 0.55 * Math.exp(-(((p - 0.36) / 0.11) ** 2));
};
export const GraficaGlucosa: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const o = aparece(t, 0.8, dur - 0.1, 0.45);
  const W = 380;
  const H = 190;
  const ciclos = 3;
  const prog = interpolate(t, [1.0, dur - 1.2], [0.08, 1], cl);
  const pts = (fn: (x: number) => number) => {
    const r: string[] = [];
    const N = 180;
    for (let i = 0; i <= N * prog; i++) {
      const u = i / N;
      r.push(`${(u * W).toFixed(1)},${(H - fn(u * ciclos) * H * 0.92).toFixed(1)}`);
    }
    return r.join(' ');
  };
  const insul = interpolate(t, [4.6, 5.6], [0, 1], cl);
  return (
    <div style={{position: 'absolute', right: 36, top: 560, width: W + 36, padding: '16px 18px', borderRadius: 18, background: 'rgba(3,10,24,0.6)', border: '1px solid rgba(122,216,255,0.32)', opacity: o, fontFamily: F}}>
      <div style={{fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 1.5, marginBottom: 8}}>NIVEL EN SANGRE</div>
      <svg width={W} height={H} style={{display: 'block', overflow: 'visible'}}>
        {[0.25, 0.5, 0.75].map((y) => (
          <line key={y} x1={0} x2={W} y1={H * y} y2={H * y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        ))}
        {[1, 2].map((k) => (
          <line key={k} x1={(W * k) / ciclos} x2={(W * k) / ciclos} y1={0} y2={H} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 6" />
        ))}
        <polyline points={pts(curvaInsulina)} fill="none" stroke="#7dffa8" strokeWidth={4} strokeLinejoin="round" opacity={insul} style={{filter: 'drop-shadow(0 0 6px #7dffa8)'}} />
        <polyline points={pts(curvaGlucosa)} fill="none" stroke="#9af0ff" strokeWidth={5} strokeLinejoin="round" style={{filter: 'drop-shadow(0 0 6px #9af0ff)'}} />
      </svg>
      <div style={{display: 'flex', gap: 18, marginTop: 10, fontSize: 20, fontWeight: 600, color: '#fff'}}>
        <span>
          <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: '#9af0ff', marginRight: 8, boxShadow: '0 0 8px #9af0ff'}} />
          Glucosa
        </span>
        <span style={{opacity: insul}}>
          <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: '#7dffa8', marginRight: 8, boxShadow: '0 0 8px #7dffa8'}} />
          Insulina
        </span>
      </div>
      <div style={{fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 6}}>Curvas ilustrativas · una bebida al día</div>
    </div>
  );
};

/* ------------------------------------------------------------------ día 15: grasa en el hígado */
export const MedidorHigado: React.FC<{tAbs: number}> = ({tAbs}) => {
  const e = escena('dia15');
  const a = momento('Cuando el exceso', 'parte') - 0.3;
  const o = aparece(tAbs, a, e.fin + 0.2, 0.45);
  const v = interpolate(tAbs, [a, e.fin - 0.5], [0.08, 0.62], cl);
  return (
    <div style={{position: 'absolute', right: 40, top: 560, width: 330, padding: '16px 20px', borderRadius: 18, background: 'rgba(24,16,2,0.6)', border: '1px solid rgba(255,208,64,0.45)', opacity: o, fontFamily: F}}>
      <div style={{fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 1.5}}>GRASA EN EL HÍGADO</div>
      <div style={{height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 12}}>
        <div style={{width: `${v * 100}%`, height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#ffe080,#ffb020)', boxShadow: '0 0 14px #ffc030'}} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginTop: 6}}>
        <span>gradual</span>
        <span>con el tiempo →</span>
      </div>
      <div style={{fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 8}}>Representación · depende de toda la dieta</div>
    </div>
  );
};

/* ------------------------------------------------------------------ día 30: indicadores */
export const Indicadores: React.FC<{tAbs: number}> = ({tAbs}) => {
  const e = escena('dia30');
  const items = [
    {txt: 'Aumento de peso', col: '#ffb030', a: momento('Día treinta', 'aumento')},
    {txt: 'Diabetes tipo 2', col: '#7dffb0', a: momento('mayor riesgo', 'diabetes')},
    {txt: 'Hígado graso', col: '#ffd040', a: momento('mayor riesgo', 'hígado')},
    {txt: 'Corazón y vasos', col: '#ff5a5a', a: momento('mayor riesgo', 'cardiovasculares')},
    {txt: 'Sueño (cafeína)', col: '#c8a0ff', a: momento('Y su cafeína', 'cafeína')},
  ];
  const fin = e.fin + 0.2;
  const nota = aparece(tAbs, items[0].a + 0.3, fin, 0.5);
  return (
    <div style={{position: 'absolute', left: 40, top: 540, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F}}>
      <div style={{opacity: nota, fontWeight: 800, fontSize: 30, color: '#fff', textShadow: sombra}}>Riesgos asociados</div>
      {items.map((it, i) => {
        const o = aparece(tAbs, it.a - 0.15, fin, 0.3);
        const s = interpolate(tAbs, [it.a - 0.15, it.a + 0.1, it.a + 0.3], [0.7, 1.08, 1], cl);
        return (
          <div key={it.txt} style={{opacity: o, transform: `scale(${s})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px 9px 12px', borderRadius: 30, background: 'rgba(3,10,24,0.62)', border: `2px solid ${it.col}99`, boxShadow: `0 0 18px ${it.col}44`, alignSelf: 'flex-start'}}>
            <div style={{width: 16, height: 16, borderRadius: 8, background: it.col, boxShadow: `0 0 12px ${it.col}`}} />
            <div style={{fontWeight: 700, fontSize: 27, color: '#fff'}}>{it.txt}</div>
            {i > 0 && i < 4 && <div style={{fontWeight: 800, fontSize: 24, color: it.col}}>↑</div>}
          </div>
        );
      })}
      <div style={{opacity: nota, fontWeight: 500, fontSize: 18, color: 'rgba(255,255,255,0.62)', maxWidth: 420, marginTop: 4}}>Con consumo habitual durante meses o años</div>
    </div>
  );
};

/* ------------------------------------------------------------------ cierre */
export const Cierre: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const a = momento('Tu mejor bebida', 'Tu') - escena('final').inicio;
  const o = aparece(t, a + 0.3, dur + 1, 0.7);
  const o2 = aparece(t, a + 3.4, dur + 1, 0.7);
  return (
    <>
      <div style={{position: 'absolute', left: 60, right: 60, top: 270, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: F}}>
        <div style={{fontWeight: 600, fontSize: 40, color: CIAN, letterSpacing: 3, textShadow: sombra}}>TU MEJOR BEBIDA DIARIA</div>
        <div style={{fontWeight: 800, fontSize: 120, lineHeight: 1.05, color: '#fff', letterSpacing: 6, textShadow: '0 0 40px rgba(90,190,255,0.8), 0 6px 20px rgba(0,0,0,0.85)'}}>AGUA</div>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 520, textAlign: 'center', opacity: o2, fontFamily: F, fontWeight: 500, fontSize: 25, color: 'rgba(255,255,255,0.82)', lineHeight: 1.35, textShadow: sombra}}>
        Contenido educativo. Cada persona es distinta:
        <br />
        ante cualquier duda, consulta a un profesional sanitario.
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ subtítulos */
const CLAVE = /^(coca-cola|30|esófago|estómago|35|azúcar|sangre|glucosa|insulina|páncreas|células|hígado|fructosa|grasa|peso|diabetes|cardiovasculares|cafeína|sueño|agua|siete|uno|quince|treinta)/i;
export const Subtitulos: React.FC<{tAbs: number}> = ({tAbs}) => {
  const s = tiempos.subtitulos.find((x) => tAbs >= x.inicio - 0.05 && tAbs < x.fin + 0.1);
  if (!s) return null;
  const o = interpolate(tAbs, [s.inicio - 0.05, s.inicio + 0.06, s.fin, s.fin + 0.1], [0, 1, 1, 0], cl);
  const pop = interpolate(tAbs, [s.inicio - 0.05, s.inicio + 0.12], [0.9, 1], cl);
  const palabras = s.texto.split(' ');
  const total = s.texto.length;
  let acum = 0;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1330, display: 'flex', justifyContent: 'center', opacity: o, transform: `scale(${pop})`}}>
      <div style={{padding: '12px 26px', borderRadius: 18, background: 'rgba(0,0,0,0.45)', fontFamily: F, fontWeight: 800, fontSize: 54, lineHeight: 1.16, textAlign: 'center', color: '#fff', textShadow: '0 3px 10px rgba(0,0,0,0.95)'}}>
        {palabras.map((p, i) => {
          const ini = s.inicio + ((s.fin - s.inicio) * acum) / total;
          acum += p.length + 1;
          const dicha = tAbs >= ini;
          const clave = CLAVE.test(p.replace(/^[¿(]/, ''));
          return (
            <span key={i} style={{color: dicha ? (clave ? '#ffd23a' : '#ffffff') : 'rgba(255,255,255,0.5)'}}>
              {p}
              {i < palabras.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export {ROJO};
