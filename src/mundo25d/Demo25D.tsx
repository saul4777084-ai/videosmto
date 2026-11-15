import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Camara, ProveedorCamara} from '../camera/Camara';
import {Clip} from '../components/Clip';
import {ef, generalAPrimerPlano, lateral, orbita} from '../camera/director';
import type {ConfigCamara, Transicion} from '../camera/esquema';
import {ESCENARIOS_25D, NombreEscenario25} from './escenarios25d';
import {Personaje25D, PERSONAJES_25D} from './Personaje25D';

const SEG = 3.6;
const FPS = 30;
const OV = 12;

/** Qué personaje va en cada escenario y con qué transición entra. */
export const REPARTO_25D: {e: NombreEscenario25; p: keyof typeof PERSONAJES_25D; tr: Transicion}[] = [
  {e: 'cyberpunk', p: 'robot', tr: 'fundido'},
  {e: 'selva', p: 'exploradora', tr: 'barrido'},
  {e: 'castillo', p: 'abuelo', tr: 'zoom'},
  {e: 'volcan', p: 'cientifica', tr: 'desenfoque'},
  {e: 'estacion', p: 'astronauta', tr: 'zoom'},
  {e: 'japon', p: 'nina', tr: 'barrido'},
  {e: 'granja', p: 'chef', tr: 'desenfoque'},
  {e: 'steampunk', p: 'doctor', tr: 'zoom'},
];
export const DURACION_DEMO_25D = REPARTO_25D.length * SEG;

const C = [0.5, 0.62] as [number, number];
export const CAMARA_25D: ConfigCamara = {
  audio: {archivo: '', volumen: 1, sincronizar: false, sensibilidad: 0.5, anclas: []},
  global: {
    intensidadGeneral: 1,
    respiracion: 1,
    zoomMaximo: 1.9,
    desenfoqueMaxPrincipal: 4,
    desenfoqueMaximo: 18,
    hudSigueCamara: 0,
    desenfoqueHud: 0,
    motionBlur: {activo: true, modo: 'muestras', obturador: 0.5, muestras: 6, umbral: 2.5},
  },
  transiciones: Object.fromEntries(REPARTO_25D.map((r) => [r.e, r.tr])),
  planos: {
    cyberpunk: [...orbita(0, SEG + 0.4, {foco: C, dir: 1, intensidad: 0.8, acercar: 0.14}), ef('profundidad', 0, 1, {intensidad: 0.6, planoHasta: 1})],
    selva: [...lateral(0, SEG + 0.4, -1, 1.4), ef('zoomIn', 0, SEG, {intensidad: 0.1, ...{focoX: C[0], focoY: C[1]}}), ef('profundidad', 0, 1, {intensidad: 0.5, planoHasta: 1})],
    castillo: [...generalAPrimerPlano(0, SEG, {foco: C, intensidad: 0.8}), ...orbita(0, SEG + 0.4, {foco: C, dir: -1, intensidad: 0.5, acercar: 0})],
    volcan: [...orbita(0, SEG + 0.4, {foco: C, dir: 1, intensidad: 0.6, acercar: 0.1}), ef('temblor', 1.6, 0.6, {intensidad: 0.5}), ef('profundidad', 0, 1, {intensidad: 0.5, planoHasta: 1})],
    estacion: [ef('zoomIn', 0, SEG, {intensidad: 0.28, curva: 'suave', centrar: 0.3, focoX: 0.5, focoY: 0.5}), ...orbita(0.3, SEG, {foco: C, dir: 1, intensidad: 0.35, acercar: 0})],
    japon: [...lateral(0, SEG + 0.4, 1, 1.2), ef('rackFocus', 0.2, 1.2, {intensidad: 0.7, planoDesde: 1.4, planoHasta: 1})],
    granja: [ef('zoomOut', 0, SEG, {intensidad: 0.25, curva: 'suave', focoX: C[0], focoY: C[1]}), ...orbita(0, SEG + 0.4, {foco: C, dir: -1, intensidad: 0.45, acercar: 0})],
    steampunk: [...orbita(0, SEG + 0.4, {foco: C, dir: -1, intensidad: 0.8, acercar: 0.15}), ef('profundidad', 0, 1, {intensidad: 0.6, planoHasta: 1})],
  },
};

const Escena: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const {e, p} = REPARTO_25D[i];
  const E = ESCENARIOS_25D[e];
  const planos = E.planos(`d${i}`);
  // el personaje gira de un lado a otro durante el plano: se ve el 2.5D del rig
  const giro = interpolate(t, [0, SEG * 0.45, SEG], [i % 2 ? 0.75 : -0.75, 0, i % 2 ? -0.6 : 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });
  const rotulo = interpolate(t, [0.2, 0.6, SEG - 0.4, SEG], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Camara
      plano={e}
      capas={[
        ...planos.filter((q) => q.profundidad <= 1).map((q) => ({id: q.id, profundidad: q.profundidad, cubrir: q.cubrir, escenario: q.profundidad < 0.5, contenido: q.contenido})),
        {
          id: 'personaje',
          profundidad: 1,
          principal: true,
          contenido: (
            <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
              <g transform={`translate(540 ${E.personajeY}) scale(1.05)`}>
                <Personaje25D diseno={PERSONAJES_25D[p]} giro={giro} habla={t > 0.8 && t < 2.6} boca="sonrisa" semilla={i + 1} />
              </g>
            </svg>
          ),
        },
        ...planos.filter((q) => q.profundidad > 1).map((q) => ({id: q.id, profundidad: q.profundidad, contenido: q.contenido})),
        {
          id: 'hud',
          hud: true,
          contenido: (
            <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', opacity: rotulo, transform: `translateY(${(1 - rotulo) * -30}px)`}}>
              <div style={{display: 'inline-block', padding: '14px 40px', borderRadius: 30, background: 'rgba(12,8,30,0.72)', border: '4px solid rgba(255,255,255,0.2)'}}>
                <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 64, color: '#ffd84a'}}>{E.nombre}</div>
                <div style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 36, color: '#fff'}}>{PERSONAJES_25D[p].nombre}</div>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
};

/** Vídeo de muestra del mundo 2.5D: 8 escenarios × 8 personajes con cámara en profundidad. */
export const Demo25D: React.FC<ConfigCamara> = (cfg) => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['700', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  const seg = Math.round(SEG * FPS);
  return (
    <ProveedorCamara config={cfg}>
      <AbsoluteFill style={{background: '#000'}}>
        {REPARTO_25D.map((r, i) => {
          const last = i === REPARTO_25D.length - 1;
          return (
            <Clip
              key={r.e}
              from={i * seg}
              dur={seg + (last ? 0 : OV)}
              fadeIn={i === 0 ? 0 : OV}
              fadeOut={last ? 18 : OV}
              entrada={r.tr}
              salida={last ? 'fundido' : REPARTO_25D[i + 1].tr}
            >
              <Escena i={i} />
            </Clip>
          );
        })}
        <Audio src={staticFile('sfx/musica.wav')} volume={(f) => 0.35 * interpolate(f, [0, 20, seg * 8 - 30, seg * 8], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        {REPARTO_25D.slice(1).map((r, i) => (
          <Sequence key={r.e} from={(i + 1) * seg - 4} durationInFrames={40} layout="none">
            <Audio src={staticFile(r.tr === 'zoom' ? 'sfx/whoosh.wav' : 'sfx/swoosh.wav')} volume={0.35} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </ProveedorCamara>
  );
};
