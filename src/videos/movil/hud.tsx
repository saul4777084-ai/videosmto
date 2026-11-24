import React from 'react';
import {interpolate} from 'remotion';
import {aparece} from '../cola/hud';
import plan from './plan.json';
import tiempos from './tiempos.json';
import {foco, golpes} from './tomas';

/**
 * Infografías del vídeo "Móvil 8 horas": título, recompensas impredecibles, bucle del hábito,
 * medidor de concentración, parpadeo, 240 horas, melatonina, riesgos asociados, consejos, cierre
 * y subtítulos. Todo ilustrativo: los días son una estructura narrativa.
 */

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'Poppins, sans-serif';
const CIAN = '#7ad8ff';
const LILA = '#b48aff';
const ORO = '#ffd23a';
const sombra = '0 3px 14px rgba(0,0,0,0.9)';
const EV = plan.eventos;

/** Momento (segundo absoluto) en que se dice una palabra dentro de una frase. */
export const momento = (inicioFrase: string, palabra: string) => {
  const f = tiempos.frases.find((x) => x.texto.startsWith(inicioFrase));
  if (!f) return 0;
  const i = Math.max(0, f.texto.toLowerCase().indexOf(palabra.toLowerCase()));
  return f.palabras[f.texto.slice(0, i).split(' ').length - 1] ?? f.inicio;
};
export const escena = (id: string) => tiempos.escenas.find((e) => e.id === id)!;
const frase = (inicio: string) => tiempos.frases.find((x) => x.texto.startsWith(inicio))!;

const Caja: React.FC<{children: React.ReactNode; o: number; color: string; fondo?: string; ancho?: number; top?: number; derecha?: number}> = ({children, o, color, fondo = 'rgba(3,8,24,0.62)', ancho = 380, top = 560, derecha = 36}) => (
  <div style={{position: 'absolute', right: derecha, top, width: ancho, padding: '16px 20px', borderRadius: 20, background: fondo, border: `2px solid ${color}66`, boxShadow: `0 0 30px ${color}33`, opacity: o, transform: `scale(${0.92 + 0.08 * o})`, transformOrigin: 'right top', fontFamily: F}}>
    {children}
  </div>
);
const Nota: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 8}}>{children}</div>;
const Cabecera: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 1.5}}>{children}</div>;

/* ------------------------------------------------------------------ título */
export const Titulo: React.FC<{t: number}> = ({t}) => {
  const o = aparece(t, 0.3, 5.5, 0.5);
  const esc = interpolate(t, [0.3, 5.5], [1.07, 1], cl);
  const l = (k: number) => ({opacity: interpolate(t, [0.3 + k * 0.25, 0.8 + k * 0.25], [0, 1], cl), transform: `translateY(${interpolate(t, [0.3 + k * 0.25, 0.8 + k * 0.25], [24, 0], cl)}px)`});
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top: 250, textAlign: 'center', opacity: o, transform: `scale(${esc})`, fontFamily: F}}>
      <div style={{...l(0), fontWeight: 700, fontSize: 50, color: '#fff', letterSpacing: 2, textShadow: sombra}}>¿QUÉ LE PASA A TU CEREBRO</div>
      <div style={{...l(1), fontWeight: 800, fontSize: 82, lineHeight: 1.08, color: '#fff', letterSpacing: 1, marginTop: 6, whiteSpace: 'nowrap', textShadow: `0 0 40px rgba(170,120,255,0.8), ${sombra}`}}>
        SI USAS EL <span style={{color: LILA}}>MÓVIL</span>
      </div>
      <div style={{...l(2), fontWeight: 800, fontSize: 82, lineHeight: 1.08, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap', textShadow: `0 0 40px rgba(90,180,255,0.7), ${sombra}`}}>
        <span style={{color: CIAN}}>8 HORAS</span> AL DÍA?
      </div>
      <div style={{...l(3), fontWeight: 600, fontSize: 36, color: 'rgba(255,255,255,0.85)', letterSpacing: 6, marginTop: 10, textShadow: sombra}}>DURANTE 30 DÍAS</div>
    </div>
  );
};

/* ------------------------------------------------------------------ día 1: recompensas impredecibles (toma "feed") */
const ICONO_TXT: Record<string, {c: string; s: string}> = {
  corazon: {c: '#ff3d6a', s: '♥'},
  burbuja: {c: '#36d07a', s: '✉'},
  play: {c: '#ff8a2a', s: '▶'},
  estrella: {c: '#ffc83a', s: '★'},
};
export const PanelRecompensa: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const premios = EV.premios;
  const o = aparece(t, 0.2, dur - 0.1, 0.4);
  const W = 340;
  const H = 120;
  const pts: string[] = [];
  const N = 160;
  const ven = 7; // segundos visibles
  for (let i = 0; i <= N; i++) {
    const tt = (i / N) * ven;
    if (tt > t) break;
    const v = 0.12 + 0.85 * golpes(tt, premios.map((p) => p.t), 0.35);
    pts.push(`${((i / N) * W).toFixed(1)},${(H - v * H * 0.92).toFixed(1)}`);
  }
  return (
    <Caja o={o} color={ORO}>
      <Cabecera>¿CUÁNDO LLEGARÁ?</Cabecera>
      <div style={{display: 'flex', gap: 8, marginTop: 10, minHeight: 44}}>
        {premios
          .filter((p) => p.t <= t)
          .slice(-6)
          .map((p) => {
            const k = Math.min(1, (t - p.t) / 0.25);
            const ic = ICONO_TXT[p.tipo];
            return (
              <div key={p.t} style={{width: 44, height: 44, borderRadius: 12, background: ic.c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800, transform: `scale(${0.5 + 0.5 * k + Math.sin(k * Math.PI) * 0.25})`, boxShadow: `0 0 16px ${ic.c}`}}>
                {ic.s}
              </div>
            );
          })}
      </div>
      <div style={{fontWeight: 600, fontSize: 18, color: ORO, marginTop: 12}}>Dopamina (ilustrativo)</div>
      <svg width={W} height={H} style={{display: 'block', overflow: 'visible', marginTop: 4}}>
        {[0.33, 0.66].map((y) => (
          <line key={y} x1={0} x2={W} y1={H * y} y2={H * y} stroke="rgba(255,255,255,0.08)" />
        ))}
        <polyline points={pts.join(' ')} fill="none" stroke={ORO} strokeWidth={4} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 6px ${ORO})`}} />
      </svg>
      <Nota>Premios a intervalos que no puedes prever</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 7: bucle del hábito */
export const BucleHabito: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const e = escena('dia7');
  const o = aparece(t, momento('Día siete', 'patrón') - e.inicio - 0.3, dur + 0.2, 0.45);
  const nodos = [
    {txt: 'AVISO', c: '#7ab8ff', a: momento('Día siete', 'aviso') - e.inicio},
    {txt: 'MIRAR', c: '#c08aff', a: momento('Día siete', 'mirar') - e.inicio},
    {txt: 'PREMIO', c: '#ffc860', a: momento('Día siete', 'recompensa') - e.inicio},
  ];
  const fuerza = interpolate(t, [momento('Cuanto más', 'Cuanto') - e.inicio, dur - 0.5], [0, 1], cl);
  const vel = 0.5 + fuerza * 1.5;
  const fase = (t * vel) % 1;
  const R = 108;
  const cx = 170;
  const cy = 150;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 3;
  return (
    <Caja o={o} color={LILA} ancho={340}>
      <Cabecera>EL BUCLE DEL HÁBITO</Cabecera>
      <svg width={300} height={300} style={{display: 'block', overflow: 'visible', marginTop: 6}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={`rgba(190,150,255,${0.25 + fuerza * 0.6})`} strokeWidth={4 + fuerza * 10} style={{filter: `drop-shadow(0 0 ${6 + fuerza * 14}px ${LILA})`}} />
        {t > nodos[2].a && (
          <circle cx={cx + Math.cos(-Math.PI / 2 + fase * Math.PI * 2) * R} cy={cy + Math.sin(-Math.PI / 2 + fase * Math.PI * 2) * R} r={10 + fuerza * 4} fill="#fff8e0" style={{filter: 'drop-shadow(0 0 10px #ffe080)'}} />
        )}
        {nodos.map((n, i) => {
          const k = interpolate(t, [n.a - 0.15, n.a + 0.25], [0, 1], cl);
          const x = cx + Math.cos(ang(i)) * R;
          const y = cy + Math.sin(ang(i)) * R;
          return (
            <g key={n.txt} opacity={k} transform={`translate(${x},${y}) scale(${0.6 + 0.4 * k})`}>
              <circle r={44} fill="rgba(6,8,24,0.92)" stroke={n.c} strokeWidth={4} style={{filter: `drop-shadow(0 0 10px ${n.c})`}} />
              <text textAnchor="middle" dy={7} fill="#fff" style={{fontFamily: F, fontWeight: 800, fontSize: 19}}>
                {n.txt}
              </text>
            </g>
          );
        })}
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#fff" opacity={fuerza} style={{fontFamily: F, fontWeight: 800, fontSize: 22 + fuerza * 6}}>
          automático
        </text>
      </svg>
      <Nota>Cuanto más se repite, más se refuerza</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 15: concentración (toma "prefrontal") */
export const MedidorAtencion: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const o = aparece(t, 0.5, dur - 0.1, 0.4);
  const ints = EV.interrupciones;
  const v = foco(t, ints) * interpolate(t, [0, 0.8], [0, 1], cl);
  const W = 330;
  const H = 110;
  const pts: string[] = [];
  const N = 160;
  for (let i = 0; i <= N; i++) {
    const tt = (i / N) * 10.5;
    if (tt > t) break;
    pts.push(`${((i / N) * W).toFixed(1)},${(H - foco(tt, ints) * Math.min(1, tt / 0.8) * H * 0.92).toFixed(1)}`);
  }
  return (
    <Caja o={o} color={CIAN} ancho={370}>
      <Cabecera>CONCENTRACIÓN</Cabecera>
      <div style={{height: 18, borderRadius: 9, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 12}}>
        <div style={{width: `${v * 100}%`, height: '100%', borderRadius: 9, background: 'linear-gradient(90deg,#3a9aff,#7ae8ff)', boxShadow: '0 0 14px #5ad8ff'}} />
      </div>
      <svg width={W} height={H} style={{display: 'block', overflow: 'visible', marginTop: 12}}>
        {ints.map((a) =>
          a <= t ? (
            <g key={a}>
              <line x1={(a / 10.5) * W} x2={(a / 10.5) * W} y1={0} y2={H} stroke="rgba(255,90,106,0.55)" strokeDasharray="4 5" strokeWidth={2} />
              <circle cx={(a / 10.5) * W} cy={8} r={7} fill="#ff5a6a" />
            </g>
          ) : null,
        )}
        <polyline points={pts.join(' ')} fill="none" stroke={CIAN} strokeWidth={4} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 6px ${CIAN})`}} />
      </svg>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 19, fontWeight: 600, color: '#fff'}}>
        <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: '#ff5a6a', boxShadow: '0 0 8px #ff5a6a'}} />
        Interrupción
      </div>
      <Nota>Volver a concentrarse lleva tiempo · ilustrativo</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 15: parpadeo (toma "ojo") */
export const PanelParpadeo: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const o = aparece(t, 0.6, dur + 0.2, 0.4);
  const menos = interpolate(t, [1.0, 2.2], [0, 1], cl);
  const seca = interpolate(t, [momento('Y frente', 'secan') - (escena('dia15').inicio + 10.8) - 0.3, dur - 0.5], [0, 1], cl);
  return (
    <Caja o={o} color="#ff8a8a" ancho={340}>
      <Cabecera>FRENTE A LA PANTALLA</Cabecera>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 10}}>
        <div style={{fontWeight: 800, fontSize: 46, color: '#fff'}}>Parpadeo</div>
        <div style={{fontWeight: 800, fontSize: 46, color: '#ff8a8a', transform: `translateY(${menos * 6}px)`, opacity: menos}}>↓</div>
      </div>
      {['Ojos secos', 'Fatiga visual'].map((txt, i) => (
        <div key={txt} style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, opacity: interpolate(seca, [i * 0.25, i * 0.25 + 0.3], [0, 1], cl), fontSize: 24, fontWeight: 600, color: '#fff'}}>
          <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: '#ff8a8a', boxShadow: '0 0 8px #ff8a8a'}} />
          {txt}
        </div>
      ))}
      <Nota>Al mirar fijamente parpadeamos menos</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 30: 240 horas */
export const Panel240: React.FC<{tAbs: number}> = ({tAbs}) => {
  const f = frase('Día treinta');
  const a = momento('Día treinta', '8') - 0.2;
  const o = aparece(tAbs, a, f.fin + 0.6, 0.4);
  const horas = Math.round(interpolate(tAbs, [momento('Día treinta', '240') - 0.6, momento('Día treinta', '240') + 0.4], [8, 240], cl));
  const dias = interpolate(tAbs, [momento('Día treinta', 'diez') - 0.2, momento('Día treinta', 'diez') + 0.8], [0, 10], cl);
  return (
    <Caja o={o} color={CIAN} ancho={400} top={560}>
      <div style={{fontWeight: 600, fontSize: 24, color: 'rgba(255,255,255,0.8)'}}>8 h al día × 30 días</div>
      <div style={{fontWeight: 800, fontSize: 96, color: '#fff', lineHeight: 1.05, textShadow: `0 0 24px ${CIAN}`}}>{horas} h</div>
      <div style={{display: 'flex', gap: 6, marginTop: 10}}>
        {[...Array(10)].map((_, i) => {
          const k = Math.min(1, Math.max(0, dias - i));
          return (
            <div key={i} style={{width: 28, height: 28, borderRadius: 14, border: `3px solid ${CIAN}`, background: `conic-gradient(${CIAN} ${k * 360}deg, rgba(122,216,255,0.08) 0deg)`, opacity: 0.35 + 0.65 * k, boxShadow: k > 0.9 ? `0 0 10px ${CIAN}` : 'none'}} />
          );
        })}
      </div>
      <div style={{fontWeight: 700, fontSize: 30, color: CIAN, marginTop: 10, opacity: Math.min(1, dias / 2)}}>= 10 días enteros</div>
      <Nota>De 24 horas · casi la mitad de tus horas despierto</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 30: melatonina */
const mel = (x: number, retraso: number, alto: number) => alto * Math.exp(-(((x - (0.55 + retraso)) / 0.16) ** 2));
export const CurvaMelatonina: React.FC<{tAbs: number}> = ({tAbs}) => {
  const f = frase('De noche');
  const o = aparece(tAbs, f.inicio - 0.2, f.fin + 0.6, 0.4);
  const k = interpolate(tAbs, [momento('De noche', 'retrasar') - 0.3, momento('De noche', 'melatonina') + 0.5], [0, 1], cl);
  const W = 340;
  const H = 130;
  const curva = (ret: number, alto: number) => {
    const r: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = i / 120;
      r.push(`${(x * W).toFixed(1)},${(H - mel(x, ret, alto) * H * 0.9 - 4).toFixed(1)}`);
    }
    return r.join(' ');
  };
  return (
    <Caja o={o} color="#ffb050" ancho={390}>
      <Cabecera>MELATONINA DE NOCHE</Cabecera>
      <svg width={W} height={H + 26} style={{display: 'block', overflow: 'visible', marginTop: 10}}>
        <polyline points={curva(0, 1)} fill="none" stroke="rgba(255,176,80,0.55)" strokeWidth={3} strokeDasharray="7 6" />
        <polyline points={curva(0.18 * k, 1 - 0.3 * k)} fill="none" stroke="#ffb050" strokeWidth={5} strokeLinejoin="round" style={{filter: 'drop-shadow(0 0 6px #ffb050)'}} />
        {['21 h', '00 h', '03 h', '06 h'].map((h, i) => (
          <text key={h} x={(i / 3) * W} y={H + 22} textAnchor="middle" fill="rgba(255,255,255,0.55)" style={{fontFamily: F, fontSize: 15, fontWeight: 600}}>
            {h}
          </text>
        ))}
      </svg>
      <div style={{display: 'flex', gap: 16, marginTop: 8, fontSize: 18, fontWeight: 600, color: '#fff'}}>
        <span style={{opacity: 0.7}}>- - sin pantalla</span>
        <span style={{color: '#ffb050'}}>— con pantalla</span>
      </div>
      <Nota>Curvas ilustrativas · el efecto varía entre personas</Nota>
    </Caja>
  );
};

/* ------------------------------------------------------------------ día 30: lo que se asocia a dormir peor */
export const Indicadores: React.FC<{tAbs: number}> = ({tAbs}) => {
  const e = escena('dia30');
  const items = [
    {txt: 'Sueño', col: '#9a8aff', a: momento('Y dormir', 'dormir'), f: '↓'},
    {txt: 'Atención', col: CIAN, a: momento('Y dormir', 'atención'), f: '↓'},
    {txt: 'Memoria', col: '#7dffb0', a: momento('Y dormir', 'memoria'), f: '↓'},
    {txt: 'Ansiedad', col: '#ff6a6a', a: momento('Y dormir', 'ansiedad'), f: '↑'},
  ];
  const fin = e.fin + 0.2;
  const nota = aparece(tAbs, items[0].a + 0.3, fin, 0.5);
  return (
    <div style={{position: 'absolute', left: 40, top: 560, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F}}>
      <div style={{opacity: nota, fontWeight: 800, fontSize: 30, color: '#fff', textShadow: sombra}}>Dormir peor se asocia con</div>
      {items.map((it) => {
        const o = aparece(tAbs, it.a - 0.15, fin, 0.3);
        const s = interpolate(tAbs, [it.a - 0.15, it.a + 0.1, it.a + 0.3], [0.7, 1.08, 1], cl);
        return (
          <div key={it.txt} style={{opacity: o, transform: `scale(${s})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px 9px 12px', borderRadius: 30, background: 'rgba(3,10,24,0.62)', border: `2px solid ${it.col}99`, boxShadow: `0 0 18px ${it.col}44`, alignSelf: 'flex-start'}}>
            <div style={{width: 16, height: 16, borderRadius: 8, background: it.col, boxShadow: `0 0 12px ${it.col}`}} />
            <div style={{fontWeight: 700, fontSize: 27, color: '#fff'}}>{it.txt}</div>
            <div style={{fontWeight: 800, fontSize: 26, color: it.col}}>{it.f}</div>
          </div>
        );
      })}
      <div style={{opacity: nota, fontWeight: 500, fontSize: 18, color: 'rgba(255,255,255,0.62)', maxWidth: 440, marginTop: 4}}>Asociación observada en estudios · no una causa única</div>
    </div>
  );
};

/* ------------------------------------------------------------------ final: consejos y cierre */
export const Consejos: React.FC<{tAbs: number}> = ({tAbs}) => {
  const f = frase('Silencia');
  const fin = momento('La buena', 'tu') - 0.1;
  const items = [
    {txt: 'Notificaciones en silencio', col: CIAN, a: momento('Silencia', 'Silencia')},
    {txt: '1 hora sin pantalla antes de dormir', col: '#ffc890', a: momento('Silencia', 'deja')},
  ];
  const o0 = aparece(tAbs, f.inicio - 0.1, fin, 0.4);
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, fontFamily: F, opacity: o0}}>
      {items.map((it) => {
        const o = aparece(tAbs, it.a - 0.1, fin, 0.3);
        return (
          <div key={it.txt} style={{opacity: o, transform: `translateY(${(1 - o) * 16}px)`, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 26px', borderRadius: 34, background: 'rgba(3,10,24,0.65)', border: `2px solid ${it.col}aa`, boxShadow: `0 0 22px ${it.col}55`}}>
            <div style={{width: 18, height: 18, borderRadius: 9, background: it.col, boxShadow: `0 0 12px ${it.col}`}} />
            <div style={{fontWeight: 700, fontSize: 32, color: '#fff'}}>{it.txt}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Cierre: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const a = momento('La buena', 'La') - escena('final').inicio;
  const o = aparece(t, a + 0.2, dur + 1, 0.7);
  const o2 = aparece(t, a + 3.2, dur + 1, 0.7);
  return (
    <>
      <div style={{position: 'absolute', left: 50, right: 50, top: 260, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: F}}>
        <div style={{fontWeight: 600, fontSize: 40, color: '#7affd0', letterSpacing: 3, textShadow: sombra}}>TU CEREBRO NECESITA</div>
        <div style={{fontWeight: 800, fontSize: 118, lineHeight: 1.05, color: '#fff', letterSpacing: 5, textShadow: '0 0 40px rgba(90,255,200,0.7), 0 6px 20px rgba(0,0,0,0.85)'}}>DESCANSO</div>
      </div>
      <div style={{position: 'absolute', left: 80, right: 80, top: 520, textAlign: 'center', opacity: o2, fontFamily: F, fontWeight: 500, fontSize: 25, color: 'rgba(255,255,255,0.82)', lineHeight: 1.35, textShadow: sombra}}>
        Contenido educativo. Cada persona es distinta:
        <br />
        si el uso del móvil te preocupa, consulta a un profesional.
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ subtítulos */
const CLAVE = /^(cerebro|móvil|8|30|notificación|recompensa|dopamina|patrón|aviso|mirar|circuito|precio|interrupción|frontal|concentrarse|parpadeas|ojos|240|diez|pantalla|melatonina|sueño|atención|memoria|ansiedad|descanso|notificaciones|dormir|recuperarse|uno|siete|quince|treinta)/i;
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
