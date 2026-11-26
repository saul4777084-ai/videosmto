import React from 'react';
import {interpolate} from 'remotion';
import {aparece} from '../cola/hud';
import tiempos from './tiempos.json';

/**
 * Infografías del vídeo "5 cafés al día durante 30 días": título, taza (cafeína y tiempo hasta el
 * cerebro), cinco tazas frente al límite diario, curva de la cafeína a lo largo del día, síntomas
 * del día 30, consejos, cierre y subtítulos palabra a palabra. Valores aproximados e ilustrativos.
 */

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'Poppins, sans-serif';
const AMBAR = '#ffb347';
const CREMA = '#ffd9a8';
const LILA = '#b4a4ff';
const ORO = '#ffd23a';
const sombra = '0 3px 14px rgba(0,0,0,0.9)';

/** Segundo absoluto en que se dice una palabra (instantes reales de la locución). */
export const momento = (inicioFrase: string, palabra: string) => {
  const f = tiempos.frases.find((x) => x.texto.startsWith(inicioFrase));
  if (!f) return 0;
  const i = Math.max(0, f.texto.toLowerCase().indexOf(palabra.toLowerCase()));
  return f.palabras[f.texto.slice(0, i).split(' ').length - 1] ?? f.inicio;
};
export const escena = (id: string) => tiempos.escenas.find((e) => e.id === id)!;

const Caja: React.FC<{children: React.ReactNode; o: number; color: string; fondo?: string; ancho?: number; top?: number}> = ({children, o, color, fondo = 'rgba(20,10,4,0.62)', ancho = 380, top = 560}) => (
  <div style={{position: 'absolute', right: 36, top, width: ancho, padding: '16px 20px', borderRadius: 20, background: fondo, border: `2px solid ${color}66`, boxShadow: `0 0 30px ${color}33`, opacity: o, transform: `scale(${0.92 + 0.08 * o})`, transformOrigin: 'right top', fontFamily: F}}>
    {children}
  </div>
);
const Nota: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 8}}>{children}</div>;
const Cabecera: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 1.5}}>{children}</div>;

/** Icono de taza dibujado con CSS. */
const IconoTaza: React.FC<{k: number; color?: string; tam?: number}> = ({k, color = '#f4eee6', tam = 46}) => (
  <div style={{position: 'relative', width: tam * 1.25, height: tam, opacity: k, transform: `scale(${0.5 + 0.5 * k}) translateY(${(1 - k) * 12}px)`}}>
    <div style={{position: 'absolute', left: 0, top: tam * 0.12, width: tam, height: tam * 0.82, borderRadius: `${tam * 0.08}px ${tam * 0.08}px ${tam * 0.32}px ${tam * 0.32}px`, background: color, boxShadow: `0 0 14px ${AMBAR}88`}} />
    <div style={{position: 'absolute', left: tam * 0.08, top: tam * 0.16, width: tam * 0.84, height: tam * 0.14, borderRadius: tam, background: '#5a2e14'}} />
    <div style={{position: 'absolute', left: tam * 0.86, top: tam * 0.3, width: tam * 0.34, height: tam * 0.36, borderRadius: tam, border: `${tam * 0.08}px solid ${color}`}} />
  </div>
);

/* ------------------------------------------------------------------ título */
export const Titulo: React.FC<{t: number}> = ({t}) => {
  const o = aparece(t, 0.3, 5.5, 0.5);
  const esc = interpolate(t, [0.3, 5.5], [1.07, 1], cl);
  const l = (k: number) => ({opacity: interpolate(t, [0.3 + k * 0.25, 0.8 + k * 0.25], [0, 1], cl), transform: `translateY(${interpolate(t, [0.3 + k * 0.25, 0.8 + k * 0.25], [24, 0], cl)}px)`});
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top: 250, textAlign: 'center', opacity: o, transform: `scale(${esc})`, fontFamily: F}}>
      <div style={{...l(0), fontWeight: 700, fontSize: 50, color: '#fff', letterSpacing: 2, textShadow: sombra}}>¿QUÉ LE PASA A TU CUERPO</div>
      <div style={{...l(1), fontWeight: 800, fontSize: 84, lineHeight: 1.08, color: '#fff', letterSpacing: 1, marginTop: 6, whiteSpace: 'nowrap', textShadow: `0 0 40px rgba(255,150,60,0.8), ${sombra}`}}>
        SI TOMAS <span style={{color: AMBAR}}>5 CAFÉS</span>
      </div>
      <div style={{...l(2), fontWeight: 800, fontSize: 84, lineHeight: 1.08, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap', textShadow: `0 0 40px rgba(255,200,140,0.6), ${sombra}`}}>
        AL DÍA?
      </div>
      <div style={{...l(3), fontWeight: 600, fontSize: 36, color: 'rgba(255,255,255,0.85)', letterSpacing: 6, marginTop: 10, textShadow: sombra}}>DURANTE 30 DÍAS</div>
    </div>
  );
};

/* ------------------------------------------------------------------ día 1: una taza */
export const PanelTaza: React.FC<{tAbs: number}> = ({tAbs}) => {
  const a = momento('Día uno', 'cafeína') - 0.1;
  const b = momento('Allí ocupa', 'Allí') - 0.2;
  const o = aparece(tAbs, a, b, 0.35);
  const mg = Math.round(interpolate(tAbs, [a, a + 0.9], [0, 90], cl));
  const t45 = momento('Día uno', '45') - 0.3;
  const min = Math.round(interpolate(tAbs, [t45, t45 + 1.6], [0, 45], cl));
  const prog = interpolate(tAbs, [t45, t45 + 1.6], [0, 1], cl);
  return (
    <Caja o={o} color={AMBAR}>
      <Cabecera>1 TAZA DE CAFÉ</Cabecera>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 8}}>
        <IconoTaza k={1} />
        <div style={{fontWeight: 800, fontSize: 70, color: '#fff', lineHeight: 1, textShadow: `0 0 24px ${AMBAR}`}}>≈{mg}<span style={{fontSize: 34}}> mg</span></div>
      </div>
      <div style={{fontWeight: 600, fontSize: 24, color: CREMA, marginTop: 6}}>de cafeína</div>
      <div style={{opacity: interpolate(tAbs, [t45 - 0.2, t45 + 0.2], [0, 1], cl), marginTop: 14}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 600, color: '#fff'}}>
          <span>Estómago → cerebro</span>
          <span style={{color: AMBAR}}>{min} min</span>
        </div>
        <div style={{height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.12)', marginTop: 8, overflow: 'hidden'}}>
          <div style={{width: `${prog * 100}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${CREMA}, ${AMBAR})`, boxShadow: `0 0 12px ${AMBAR}`}} />
        </div>
      </div>
      <Nota>Valor aproximado · varía mucho según el café (≈ 60–120 mg)</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 1: adenosina frente a cafeína */
export const PanelBloqueo: React.FC<{t: number; dur: number; a: number; c: number}> = ({t, dur, a, c}) => {
  const o = aparece(t, 0.6, dur - 0.1, 0.4);
  const caf = interpolate(t, [a, a + 2.4], [0, 1], cl);
  const alerta = interpolate(t, [c - 0.3, c + 0.4], [0, 1], cl);
  return (
    <Caja o={o} color={LILA} fondo="rgba(10,6,24,0.62)" ancho={360}>
      <Cabecera>RECEPTORES DE ADENOSINA</Cabecera>
      <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, fontSize: 22, fontWeight: 600, color: '#fff'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, opacity: 1 - caf * 0.6}}>
          <span style={{width: 16, height: 16, borderRadius: 8, background: LILA, boxShadow: `0 0 10px ${LILA}`}} /> Adenosina → cansancio
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, opacity: 0.3 + caf * 0.7}}>
          <span style={{width: 16, height: 16, borderRadius: 8, background: AMBAR, boxShadow: `0 0 10px ${AMBAR}`}} /> Cafeína: bloquea el sitio
        </div>
      </div>
      <div style={{marginTop: 14, fontSize: 20, fontWeight: 700, color: '#fff'}}>Alerta</div>
      <div style={{height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.12)', marginTop: 6, overflow: 'hidden'}}>
        <div style={{width: `${(0.25 + 0.7 * alerta) * 100}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${LILA}, ${AMBAR})`, boxShadow: `0 0 14px ${AMBAR}`}} />
      </div>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 1: pulso */
export const PanelPulso: React.FC<{t: number; dur: number; a: number}> = ({t, dur, a}) => {
  const o = aparece(t, a - 0.3, dur - 0.1, 0.4);
  const bpm = Math.round(interpolate(t, [a, a + 2], [68, 82], cl));
  const W = 320;
  const H = 90;
  const per = interpolate(t, [a, a + 2], [70, 52], cl);
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 2) {
    const f = ((x + t * 120) % per) / per;
    const y = f > 0.3 && f < 0.36 ? -1 : f >= 0.36 && f < 0.42 ? 0.6 : f > 0.55 && f < 0.7 ? -0.18 * Math.sin(((f - 0.55) / 0.15) * Math.PI) : 0;
    pts.push(`${x},${(H / 2 + y * H * 0.45).toFixed(1)}`);
  }
  return (
    <Caja o={o} color="#ff5a4a" fondo="rgba(24,4,6,0.62)" ancho={360} top={1020}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <Cabecera>PULSO</Cabecera>
        <div style={{fontWeight: 800, fontSize: 44, color: '#fff', textShadow: '0 0 16px #ff4a3a'}}>
          {bpm}
          <span style={{fontSize: 20, color: '#ffb0a0'}}> lpm</span>
        </div>
      </div>
      <svg width={W} height={H} style={{display: 'block', marginTop: 4}}>
        <polyline points={pts.join(' ')} fill="none" stroke="#ff6a5a" strokeWidth={4} strokeLinejoin="round" style={{filter: 'drop-shadow(0 0 6px #ff4a3a)'}} />
      </svg>
      <Nota>Ilustrativo · en quien toma café a diario el efecto suele ser pequeño</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 7: cinco tazas y el límite */
export const PanelCinco: React.FC<{tAbs: number}> = ({tAbs}) => {
  const e = escena('dia7');
  const a = momento('Día siete', 'Cinco') - 0.3;
  const fin = momento('Y tu cerebro', 'Y') - 0.1;
  const o = aparece(tAbs, a, fin, 0.4);
  const n = interpolate(tAbs, [a + 0.2, a + 1.4], [0, 5], cl);
  const mg = Math.round(interpolate(tAbs, [momento('Día siete', '450') - 0.6, momento('Día siete', '450') + 0.4], [0, 450], cl));
  const lim = interpolate(tAbs, [momento('Es más', '400') - 0.3, momento('Es más', '400') + 0.3], [0, 1], cl);
  void e;
  return (
    <Caja o={o} color={AMBAR} ancho={420}>
      <Cabecera>5 CAFÉS AL DÍA</Cabecera>
      <div style={{display: 'flex', gap: 4, marginTop: 10}}>
        {[...Array(5)].map((_, i) => (
          <IconoTaza key={i} k={Math.min(1, Math.max(0, n - i))} tam={50} />
        ))}
      </div>
      <div style={{fontWeight: 800, fontSize: 72, color: '#fff', lineHeight: 1.05, marginTop: 8, textShadow: `0 0 24px ${AMBAR}`}}>
        ≈{mg}
        <span style={{fontSize: 32}}> mg</span>
      </div>
      <div style={{position: 'relative', height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.12)', marginTop: 12}}>
        <div style={{width: `${(mg / 500) * 100}%`, height: '100%', borderRadius: 11, background: mg > 400 ? `linear-gradient(90deg, ${AMBAR} 0%, ${AMBAR} 86%, #ff4a3a 89%)` : AMBAR, boxShadow: `0 0 14px ${AMBAR}`}} />
        <div style={{position: 'absolute', left: '80%', top: -8, bottom: -8, width: 4, borderRadius: 2, background: '#fff', opacity: lim, boxShadow: '0 0 10px #fff'}} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8, opacity: lim}}>
        <span style={{fontSize: 19, fontWeight: 500, color: 'rgba(255,255,255,0.7)'}}>Límite adulto sano</span>
        <span style={{fontSize: 22, fontWeight: 800, color: '#fff'}}>400 mg</span>
      </div>
      <Nota>Referencia de la EFSA y la FDA · embarazo: 200 mg</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 15: cafeína a lo largo del día */
// tomas a las 8, 10, 12, 15 y 17 h (90 mg cada una), vida media de 5 h
const DOSIS = [8, 10, 12, 15, 17];
const nivel = (h: number) => DOSIS.reduce((s, d) => s + (h < d ? 0 : h < d + 0.75 ? ((h - d) / 0.75) * 90 : 90 * Math.pow(0.5, (h - d - 0.75) / 5)), 0);
export const CurvaCafeina: React.FC<{tAbs: number}> = ({tAbs}) => {
  const e = escena('dia15');
  const a = e.inicio + 0.8;
  const o = aparece(tAbs, a, e.fin + 0.2, 0.45);
  const W = 400;
  const H = 200;
  const h0 = 7;
  const h1 = 24;
  const prog = interpolate(tAbs, [a + 0.3, momento('El café de', 'noche') + 0.4], [0, 1], cl);
  const max = 260;
  const X = (h: number) => ((h - h0) / (h1 - h0)) * W;
  const Y = (v: number) => H - (v / max) * H;
  const pts: string[] = [];
  for (let h = h0; h <= h0 + (h1 - h0) * prog; h += 0.1) pts.push(`${X(h).toFixed(1)},${Y(nivel(h)).toFixed(1)}`);
  const t17 = momento('El café de', 'cinco');
  const t22 = momento('El café de', 'diez');
  const m17 = interpolate(tAbs, [t17 - 0.2, t17 + 0.3], [0, 1], cl);
  const m22 = interpolate(tAbs, [t22 - 0.2, t22 + 0.3], [0, 1], cl);
  const sueno = interpolate(tAbs, [momento('Duermes', 'Duermes') - 0.2, momento('Duermes', 'Duermes') + 0.4], [0, 1], cl);
  return (
    <div style={{position: 'absolute', right: 36, top: 560, width: W + 40, padding: '16px 20px', borderRadius: 18, background: 'rgba(4,6,24,0.66)', border: '1px solid rgba(160,170,255,0.35)', opacity: o, fontFamily: F}}>
      <Cabecera>CAFEÍNA EN SANGRE</Cabecera>
      <svg width={W} height={H + 30} style={{display: 'block', overflow: 'visible', marginTop: 10}}>
        <rect x={X(23)} y={0} width={X(24) - X(23)} height={H} fill="rgba(120,140,255,0.18)" opacity={sueno} />
        {[8, 12, 16, 20, 24].map((h) => (
          <g key={h}>
            <line x1={X(h)} x2={X(h)} y1={0} y2={H} stroke="rgba(255,255,255,0.08)" />
            <text x={X(h)} y={H + 24} fill="rgba(255,255,255,0.6)" fontSize={17} fontWeight={600} textAnchor="middle" fontFamily={F}>
              {h}h
            </text>
          </g>
        ))}
        {DOSIS.map((d) => (
          <circle key={d} cx={X(d)} cy={H - 6} r={6} fill={AMBAR} opacity={prog * (h0 + (h1 - h0) * prog > d ? 1 : 0)} />
        ))}
        <polyline points={pts.join(' ')} fill="none" stroke={AMBAR} strokeWidth={5} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 6px ${AMBAR})`}} />
        <g opacity={m17}>
          <circle cx={X(17.75)} cy={Y(nivel(17.75))} r={9} fill="#fff" />
          <text x={X(17.75)} y={Y(nivel(17.75)) - 16} fill="#fff" fontSize={19} fontWeight={700} textAnchor="middle" fontFamily={F}>
            17 h
          </text>
        </g>
        <g opacity={m22}>
          <circle cx={X(22)} cy={Y(nivel(22))} r={9} fill={LILA} />
          <text x={X(22) + 10} y={Y(nivel(22)) - 18} fill={LILA} fontSize={19} fontWeight={700} textAnchor="end" fontFamily={F}>
            22 h · aún ≈ {Math.round((nivel(22) / nivel(17.75)) * 100)} %
          </text>
        </g>
      </svg>
      <div style={{fontWeight: 600, fontSize: 21, color: '#fff', marginTop: 6, opacity: sueno}}>Sueño más ligero y corto</div>
      <Nota>Curva ilustrativa · vida media ≈ 5 h (de 2 a 10 h según la persona)</Nota>
    </div>
  );
};

/* ------------------------------------------------------------------ día 30: síntomas */
export const Indicadores: React.FC<{tAbs: number}> = ({tAbs}) => {
  const e = escena('dia30');
  const grupo1 = [
    {txt: 'Dolor de cabeza', col: '#ff5a5a', a: momento('Día treinta', 'dolor')},
    {txt: 'Cansancio', col: LILA, a: momento('Día treinta', 'cansancio')},
    {txt: 'Irritabilidad', col: '#ff9a4a', a: momento('Día treinta', 'irritabilidad')},
  ];
  const grupo2 = [
    {txt: 'Nervios', col: '#c8a0ff', a: momento('Y en dosis', 'nervios')},
    {txt: 'Palpitaciones', col: '#ff4a4a', a: momento('Y en dosis', 'palpitaciones')},
    {txt: 'Acidez', col: '#ffb040', a: momento('Y en dosis', 'acidez')},
  ];
  const corte = momento('Y en dosis', 'Y') - 0.2;
  const fila = (lista: typeof grupo1, titulo: string, desde: number, hasta: number, nota: string) => {
    const on = aparece(tAbs, desde, hasta, 0.4);
    return (
      <div style={{position: 'absolute', left: 40, top: 560, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F, opacity: on}}>
        <div style={{fontWeight: 800, fontSize: 32, color: '#fff', textShadow: sombra}}>{titulo}</div>
        {lista.map((it) => {
          const o = interpolate(tAbs, [it.a - 0.15, it.a + 0.15], [0, 1], cl);
          const s = interpolate(tAbs, [it.a - 0.15, it.a + 0.1, it.a + 0.3], [0.7, 1.08, 1], cl);
          return (
            <div key={it.txt} style={{opacity: o, transform: `scale(${s})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px 9px 12px', borderRadius: 30, background: 'rgba(3,10,24,0.62)', border: `2px solid ${it.col}99`, boxShadow: `0 0 18px ${it.col}44`, alignSelf: 'flex-start'}}>
              <div style={{width: 16, height: 16, borderRadius: 8, background: it.col, boxShadow: `0 0 12px ${it.col}`}} />
              <div style={{fontWeight: 700, fontSize: 28, color: '#fff'}}>{it.txt}</div>
            </div>
          );
        })}
        <div style={{fontWeight: 500, fontSize: 18, color: 'rgba(255,255,255,0.62)', maxWidth: 440, marginTop: 4}}>{nota}</div>
      </div>
    );
  };
  return (
    <>
      {fila(grupo1, 'Abstinencia de cafeína', grupo1[0].a - 0.4, corte, 'Suele empezar 12–24 h sin café y durar de 2 a 9 días')}
      {fila(grupo2, 'Con dosis altas', grupo2[0].a - 0.5, e.fin + 0.2, 'Depende de la sensibilidad de cada persona')}
    </>
  );
};

/* ------------------------------------------------------------------ final: consejos y cierre */
export const Consejos: React.FC<{tAbs: number}> = ({tAbs}) => {
  const fin = momento('La mejor', 'La') - 0.2;
  const items = [
    {txt: 'Hasta 3–4 tazas al día', a: momento('El café no', 'hasta'), col: AMBAR},
    {txt: 'El último, 6 h antes de dormir', a: momento('La clave', 'último'), col: LILA},
  ];
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 560, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', fontFamily: F}}>
      {items.map((it) => {
        const o = aparece(tAbs, it.a - 0.2, fin, 0.35);
        return (
          <div key={it.txt} style={{opacity: o, transform: `translateY(${(1 - o) * 16}px)`, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 26px', borderRadius: 34, background: 'rgba(16,8,3,0.66)', border: `2px solid ${it.col}aa`, boxShadow: `0 0 22px ${it.col}44`}}>
            <div style={{width: 18, height: 18, borderRadius: 9, background: it.col, boxShadow: `0 0 12px ${it.col}`}} />
            <div style={{fontWeight: 700, fontSize: 32, color: '#fff'}}>{it.txt}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Cierre: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const a = momento('La mejor', 'La') - escena('final').inicio;
  const o = aparece(t, a + 0.2, dur + 1, 0.7);
  const o2 = aparece(t, a + 3.0, dur + 1, 0.7);
  return (
    <>
      <div style={{position: 'absolute', left: 50, right: 50, top: 260, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: F}}>
        <div style={{fontWeight: 600, fontSize: 40, color: CREMA, letterSpacing: 3, textShadow: sombra}}>LA MEJOR ENERGÍA</div>
        <div style={{fontWeight: 800, fontSize: 112, lineHeight: 1.05, color: '#fff', letterSpacing: 4, whiteSpace: 'nowrap', textShadow: '0 0 40px rgba(255,170,80,0.75), 0 6px 20px rgba(0,0,0,0.85)'}}>DORMIR BIEN</div>
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
const CLAVE = /^(5|cafés?|30|cafeína|estómago|sangre|45|cerebro|adenosina|cansancio|despejas|adrenalina|corazón|450|miligramos|400|seguros|adapta|receptores|igual|cinco|mitad|noche|diez|peor|cansado|dolor|cabeza|irritabilidad|abstinencia|nervios|palpitaciones|acidez|enemigo|3|4|beneficios|dosis|hora|seis|dormir|energía|uno|siete|quince|treinta)/i;
export const Subtitulos: React.FC<{tAbs: number}> = ({tAbs}) => {
  const s = tiempos.subtitulos.find((x) => tAbs >= x.inicio - 0.05 && tAbs < x.fin + 0.1);
  if (!s) return null;
  const o = interpolate(tAbs, [s.inicio - 0.05, s.inicio + 0.06, s.fin, s.fin + 0.1], [0, 1, 1, 0], cl);
  const pop = interpolate(tAbs, [s.inicio - 0.05, s.inicio + 0.12], [0.9, 1], cl);
  const palabras = s.texto.split(' ');
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1330, display: 'flex', justifyContent: 'center', opacity: o, transform: `scale(${pop})`}}>
      <div style={{padding: '12px 26px', borderRadius: 18, background: 'rgba(0,0,0,0.45)', fontFamily: F, fontWeight: 800, fontSize: 54, lineHeight: 1.16, textAlign: 'center', color: '#fff', textShadow: '0 3px 10px rgba(0,0,0,0.95)'}}>
        {palabras.map((p, i) => {
          const dicha = tAbs >= s.palabras[i];
          const clave = CLAVE.test(p.replace(/^[¿(«]/, ''));
          return (
            <span key={i} style={{color: dicha ? (clave ? ORO : '#ffffff') : 'rgba(255,255,255,0.5)'}}>
              {p}
              {i < palabras.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};
