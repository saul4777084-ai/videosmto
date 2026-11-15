import React from 'react';
import {Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {MUSICA, SONIDOS, Sonido} from '../config/sonidos';
import type {ConfigCamara, NombrePlano} from '../camera/esquema';
import {inicioPlano} from '../camera/sincro';
import {guionAAudio} from '../audio/tiempo';

/** Sonidos asociados a efectos de cámara (campo "sonido" de cada efecto). */
const sonidosCamara = (c?: ConfigCamara): Sonido[] => {
  if (!c) return [];
  const out: Sonido[] = [];
  (Object.keys(c.planos) as NombrePlano[]).forEach((p) =>
    c.planos[p].forEach((e) => {
      if (e.activo && e.sonido !== 'ninguno') out.push({t: inicioPlano(p) + e.inicio, sfx: e.sonido, vol: e.volumen});
    }),
  );
  return out;
};

/** Reproduce la música de fondo y todos los efectos de config/sonidos.ts. */
export const Sonidos: React.FC<{camara?: ConfigCamara}> = ({camara}) => {
  const {fps, durationInFrames} = useVideoConfig();
  return (
    <>
      {MUSICA.archivo && (
        <Audio
          src={staticFile(MUSICA.archivo)}
          loop
          volume={(f) =>
            MUSICA.volumen *
            interpolate(f, [0, 15, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
          }
        />
      )}
      {[...SONIDOS, ...sonidosCamara(camara)].map((s0, i) => {
        // los SFX están escritos en tiempo del guion: se llevan al tiempo real del audio
        const anclas = camara?.audio.anclas ?? [];
        const s = {...s0, t: guionAAudio(s0.t, anclas), hasta: s0.hasta !== undefined ? guionAAudio(s0.hasta, anclas) : undefined};
        const from = Math.round(s.t * fps);
        const dur = s.hasta ? Math.max(1, Math.round((s.hasta - s.t) * fps)) : Math.round(fps * 5);
        const vol = s.vol ?? 0.5;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <Audio
              src={staticFile(`sfx/${s.sfx}.wav`)}
              loop={!!s.hasta}
              volume={s.hasta ? (f) => vol * interpolate(f, [0, 6, dur - 8, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : vol}
            />
          </Sequence>
        );
      })}
    </>
  );
};
