import React, {useEffect, useMemo, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ESCENARIOS} from '../../sets/Escenarios';
import {ESCENARIOS_25D, EscenarioCompleto, NombreEscenario25} from '../../mundo25d/escenarios25d';
import {Boca25, Personaje25D} from '../../mundo25d/Personaje25D';
import {TEMAS} from '../temas';
import type {Emocion, EscenaGuion, Palabra, PersonajeGuion, PropsResumen} from './tipos';

/**
 * RESUMEN DE PELÍCULA (1080×1920, 30 fps)
 *
 * Plantilla genérica: todo lo que se ve sale de `guion` (escenas, reparto, textos) y de
 * `tiempos` (segundo exacto de cada palabra de la narración, generado por tools/resumen.py).
 * Las ilustraciones son originales (SVG por código): no usa fotogramas, pósters ni música
 * de la película.
 */

export const FPS_RESUMEN = 30;
const FUNDIDO = 0.35; // s de fundido entre escenas

export const calcularMetadatosResumen: CalculateMetadataFunction<PropsResumen> = ({props}) => ({
  durationInFrames: Math.max(30, Math.ceil((props.tiempos?.duracion ?? 10) * FPS_RESUMEN)),
});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const ACENTO: Record<string, string> = {
  terror: '#ff4040',
  noir: '#f4f4f4',
  sepia: '#ffcf7a',
  neon: '#3ff0ff',
  frio: '#7ad8ff',
};

const BOCA: Record<Emocion, Boca25> = {
  neutral: 'neutra',
  alegria: 'sonrisa',
  miedo: 'sorpresa',
  sorpresa: 'sorpresa',
  tension: 'seria',
  tristeza: 'seria',
  enfado: 'seria',
};
const CEJAS: Record<Emocion, number> = {neutral: 0, alegria: 0.3, miedo: 1, sorpresa: 1.2, tension: -0.5, tristeza: 0.8, enfado: -1.2};

/* ---------------------------------------------------------------- escena */

const Personajes: React.FC<{reparto: PersonajeGuion[]; escena: EscenaGuion; t: number; y: number; i: number}> = ({reparto, escena, t, y, i}) => {
  const lista = escena.personajes.map((id) => reparto.find((p) => p.id === id)).filter(Boolean).slice(0, 2) as PersonajeGuion[];
  if (!lista.length) return null;
  const dos = lista.length === 2;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {lista.map((p, k) => {
        const x = dos ? (k === 0 ? 310 : 770) : 540;
        const escala = dos ? 0.74 : 0.9;
        // se miran entre ellos (o miran a cámara con un ligero vaivén)
        const base = dos ? (k === 0 ? -0.55 : 0.55) : 0;
        const giro = base + Math.sin(t * 0.9 + k * 2 + i) * 0.25;
        const entra = interpolate(t, [0, 0.5], [40, 0], {...clamp, easing: Easing.out(Easing.cubic)});
        return (
          <g key={p.id} transform={`translate(${x} ${y + entra}) scale(${escala})`}>
            <Personaje25D diseno={p} giro={giro} boca={BOCA[escena.emocion] ?? 'neutra'} cejas={CEJAS[escena.emocion] ?? 0} semilla={i * 3 + k + 1} />
          </g>
        );
      })}
    </svg>
  );
};

const Escena: React.FC<{escena: EscenaGuion; reparto: PersonajeGuion[]; i: number; t: number; dur: number}> = ({escena, reparto, i, t, dur}) => {
  const n = escena.escenario;
  const es25 = n in ESCENARIOS_25D;
  const y = es25 ? ESCENARIOS_25D[n as NombreEscenario25].personajeY : 1600;
  const pj = <Personajes reparto={reparto} escena={escena} t={t} y={y} i={i} />;

  // cámara "Ken Burns": acercamiento lento con desplazamiento lateral alterno
  const p = interpolate(t, [0, dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const dir = i % 2 ? 1 : -1;
  const zoom = i % 3 === 2 ? interpolate(p, [0, 1], [1.15, 1.03]) : interpolate(p, [0, 1], [1.03, 1.15]);
  const tx = dir * interpolate(p, [0, 1], [-35, 35]);
  // golpe de cámara al entrar en escenas de miedo / sorpresa
  const golpe = escena.emocion === 'miedo' || escena.emocion === 'sorpresa' ? Math.exp(-t * 5) * Math.sin(t * 60) * 14 : 0;

  let fondo: React.ReactNode;
  if (es25) {
    fondo = <EscenarioCompleto nombre={n as NombreEscenario25} id={`r${i}`} personaje={pj} />;
  } else {
    const C = (ESCENARIOS as Record<string, {C: React.FC<{capa?: 'todo' | 'fondo' | 'frente'; id?: string}>}>)[n]?.C ?? ESCENARIOS.ciudadNoche.C;
    fondo = (
      <>
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <C capa="fondo" id={`r${i}`} />
        </svg>
        {pj}
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <C capa="frente" id={`r${i}f`} />
        </svg>
      </>
    );
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${tx + golpe}px, ${golpe * 0.6}px) scale(${zoom})`, transformOrigin: '50% 62%'}}>{fondo}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- textos */

type Bloque = {palabras: Palabra[]; inicio: number; fin: number};

/** Agrupa las palabras de la narración en bloques cortos de subtítulo (máx. 4 palabras). */
const bloques = (frases: PropsResumen['tiempos']['frases']): Bloque[] => {
  const out: Bloque[] = [];
  for (const f of frases) {
    let actual: Palabra[] = [];
    f.palabras.forEach((w, k) => {
      actual.push(w);
      const ultima = k === f.palabras.length - 1;
      const pausa = /[,;:.!?…]$/.test(w.w);
      if (ultima || actual.length >= 4 || (pausa && actual.length >= 2)) {
        out.push({palabras: actual, inicio: actual[0].inicio, fin: actual[actual.length - 1].fin});
        actual = [];
      }
    });
  }
  return out;
};

const Subtitulos: React.FC<{lista: Bloque[]; t: number; acento: string}> = ({lista, t, acento}) => {
  const idx = lista.findIndex((b, k) => t >= b.inicio - 0.05 && t < (lista[k + 1]?.inicio ?? Infinity) && t < b.fin + 0.3);
  if (idx < 0) return null;
  const b = lista[idx];
  const pop = interpolate(t - b.inicio, [-0.05, 0.12], [0.82, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 610, height: 330, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: `scale(${pop})`, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 42, rowGap: 4, lineHeight: 1.12}}>
        {b.palabras.map((w, k) => {
          const activa = t >= w.inicio && t < (b.palabras[k + 1]?.inicio ?? b.fin + 0.6);
          return (
            <span
              key={k}
              style={{
                display: 'inline-block',
                fontFamily: 'Poppins',
                fontWeight: 800,
                fontSize: 96,
                textTransform: 'uppercase',
                color: activa ? acento : '#ffffff',
                transform: `scale(${activa ? 1.1 : 1})`,
                WebkitTextStroke: '14px #000',
                paintOrder: 'stroke fill',
                textShadow: '0 10px 30px rgba(0,0,0,0.6)',
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const Cabecera: React.FC<{titulo: string; anio: number; t: number}> = ({titulo, anio, t}) => {
  const o = interpolate(t, [3.2, 3.8], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', top: 96, left: 0, right: 0, textAlign: 'center', opacity: o}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 34px', borderRadius: 999, background: 'rgba(0,0,0,0.62)', border: '3px solid rgba(255,255,255,0.18)'}}>
        <span style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 30, letterSpacing: 4, color: '#ff4b4b'}}>● RESUMEN</span>
        <span style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 38, color: '#fff'}}>
          {titulo} ({anio})
        </span>
      </div>
    </div>
  );
};

/** Cartel de título al principio del vídeo. */
const Titulo: React.FC<{guion: PropsResumen['guion']; t: number; acento: string}> = ({guion, t, acento}) => {
  const o = interpolate(t, [0.1, 0.5, 3.0, 3.5], [0, 1, 1, 0], clamp);
  const z = interpolate(t, [0, 3.5], [1.08, 1], clamp);
  const {titulo, anio, director} = guion.pelicula;
  const largo = titulo.length > 14;
  return (
    <div style={{position: 'absolute', top: 170, left: 40, right: 40, textAlign: 'center', opacity: o, transform: `scale(${z})`}}>
      <div style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 40, letterSpacing: 14, color: '#fff', textShadow: '0 4px 18px #000'}}>RESUMEN DE</div>
      <div
        style={{
          fontFamily: 'Poppins',
          fontWeight: 800,
          fontSize: largo ? 104 : 150,
          lineHeight: 1.0,
          color: acento,
          textTransform: 'uppercase',
          WebkitTextStroke: '10px #000',
          paintOrder: 'stroke fill',
          textShadow: `0 0 40px ${acento}88, 0 12px 30px #000`,
        }}
      >
        {titulo}
      </div>
      <div style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 36, color: '#fff', marginTop: 10, textShadow: '0 4px 18px #000'}}>
        {anio} · {director}
      </div>
    </div>
  );
};

const Rotulo: React.FC<{texto?: string; t: number}> = ({texto, t}) => {
  if (!texto) return null;
  const o = interpolate(t, [0.15, 0.45, 2.6, 3.0], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * -16}px)`}}>
      <span style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 40, letterSpacing: 6, color: '#fff', padding: '8px 26px', background: 'rgba(0,0,0,0.55)', borderLeft: '8px solid #fff', textTransform: 'uppercase'}}>
        {texto}
      </span>
    </div>
  );
};

const Llamada: React.FC<{t: number; total: number; acento: string}> = ({t, total, acento}) => {
  const o = interpolate(t, [total - 4.2, total - 3.7], [0, 1], clamp);
  if (o <= 0) return null;
  const latido = 1 + Math.max(0, Math.sin(t * 6)) * 0.05;
  return (
    <div style={{position: 'absolute', top: 980, left: 0, right: 0, textAlign: 'center', opacity: o}}>
      <div style={{display: 'inline-block', transform: `scale(${latido})`, padding: '22px 46px', borderRadius: 26, background: acento, boxShadow: '0 14px 40px rgba(0,0,0,0.5)'}}>
        <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 50, color: '#111'}}>SIGUE PARA MÁS RESÚMENES</div>
      </div>
      <div style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 38, color: '#fff', margin: '20px 80px 0', textShadow: '0 4px 14px #000'}}>¿Qué película resumo ahora?<br />Dímelo en comentarios</div>
    </div>
  );
};

/** Grano de película + viñeta. */
const Pelicula: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.09, mixBlendMode: 'overlay'}}>
      <filter id="grano">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 12} />
      </filter>
      <rect width={1080} height={1920} filter="url(#grano)" />
    </svg>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, transparent 52%, rgba(0,0,0,0.6) 100%)'}} />
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- vídeo */

export const ResumenPelicula: React.FC<PropsResumen> = ({guion, tiempos, narracion, musica}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = f / fps;
  const total = durationInFrames / fps;
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['700', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  const lista = useMemo(() => bloques(tiempos.frases), [tiempos]);
  const acento = ACENTO[guion.tema] ?? '#ffd84a';
  const filtro = TEMAS[guion.tema]?.filtro ?? 'none';

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* escenas con fundido cruzado */}
      <AbsoluteFill style={{filter: filtro}}>
        {guion.escenas.map((e, i) => {
          const tr = tiempos.escenas[i];
          if (!tr || t < tr.inicio - FUNDIDO || t > tr.fin + FUNDIDO) return null;
          const o = interpolate(t, [tr.inicio - FUNDIDO, tr.inicio + FUNDIDO * 0.2], [i === 0 ? 1 : 0, 1], clamp);
          const lt = t - tr.inicio + FUNDIDO;
          return (
            <AbsoluteFill key={i} style={{opacity: o}}>
              <Escena escena={e} reparto={guion.reparto} i={i} t={lt} dur={tr.fin - tr.inicio + 2 * FUNDIDO} />
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
      <Pelicula f={f} />

      {/* textos */}
      <Titulo guion={guion} t={t} acento={acento} />
      <Cabecera titulo={guion.pelicula.titulo} anio={guion.pelicula.anio} t={t} />
      {guion.escenas.map((e, i) => {
        const tr = tiempos.escenas[i];
        if (i === 0 || !tr || t < tr.inicio || t > tr.fin) return null;
        return <Rotulo key={i} texto={e.rotulo} t={t - tr.inicio} />;
      })}
      <Subtitulos lista={lista} t={t} acento={acento} />
      <Llamada t={t} total={total} acento={acento} />
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 12, width: `${(t / total) * 100}%`, background: acento}} />

      {/* sonido */}
      {narracion ? <Audio src={staticFile(narracion)} /> : null}
      {musica ? <Audio src={staticFile(musica)} volume={(fr) => 0.22 * interpolate(fr, [0, 30, durationInFrames - 45, durationInFrames], [0, 1, 1, 0], clamp)} /> : null}
      {tiempos.escenas.slice(1).map((e, i) => (
        <Sequence key={i} from={Math.max(0, Math.round((e.inicio - 0.3) * fps))} durationInFrames={30} layout="none">
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.18} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
