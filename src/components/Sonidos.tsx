import React from 'react';
import {Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {MUSICA, SONIDOS} from '../config/sonidos';

/** Reproduce la música de fondo y todos los efectos de config/sonidos.ts. */
export const Sonidos: React.FC = () => {
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
      {SONIDOS.map((s, i) => {
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
