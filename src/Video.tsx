import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile} from 'remotion';
import {Escena1Intro} from './scenes/Escena1Intro';
import {Escena2Gimnasio} from './scenes/Escena2Gimnasio';
import {Escena3Ciencia} from './scenes/Escena3Ciencia';
import {Escena4Comida} from './scenes/Escena4Comida';
import {Escena5Cronometro} from './scenes/Escena5Cronometro';
import {Escena6Tele} from './scenes/Escena6Tele';
import {Escena7Final} from './scenes/Escena7Final';
import {Subtitles} from './components/Subtitles';
import {Avatar} from './components/Avatar';
import {Sonidos} from './components/Sonidos';
import {Clip} from './components/Clip';
import {ESCENAS, NombreEscena} from './config/escenas';
import {VIDEO} from './config/video';
import {ProveedorCamara} from './camera/Camara';
import type {ConfigCamara, NombrePlano} from './camera/esquema';

/** Orden y componente de cada escena. */
export const ESCENA_COMPONENTES: Record<NombreEscena, React.FC> = {
  intro: Escena1Intro,
  gimnasio: Escena2Gimnasio,
  ciencia: Escena3Ciencia,
  comida: Escena4Comida,
  cronometro: Escena5Cronometro,
  tele: Escena6Tele,
  final: Escena7Final,
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('500 60px Poppins'),
      document.fonts.load('700 60px Poppins'),
      document.fonts.load('800 60px Poppins'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

/** Recibe la configuración de cámara como props (editable en el panel Props del Studio). */
export const Video: React.FC<ConfigCamara> = (camara) => {
  useFonts();
  const fps = VIDEO.fps;
  const ov = VIDEO.solapeTransicion;
  const keys = Object.keys(ESCENA_COMPONENTES) as NombreEscena[];
  return (
    <ProveedorCamara config={camara}>
    <AbsoluteFill style={{background: '#000'}}>
      {keys.map((k, i) => {
        const C = ESCENA_COMPONENTES[k]!;
        const e = ESCENAS[k];
        const from = Math.round(e.inicio * fps);
        const last = i === keys.length - 1;
        const dur = Math.round((e.fin - e.inicio) * fps) + (last ? 0 : ov);
        return (
          <Clip
            key={k}
            from={from}
            dur={dur}
            fadeIn={i === 0 ? 0 : ov}
            fadeOut={last ? 0 : ov}
            entrada={camara.transiciones[k as NombrePlano]}
            salida={last ? 'fundido' : camara.transiciones[keys[i + 1] as NombrePlano]}
            entryScale={1.04}
          >
            <C />
          </Clip>
        );
      })}
      <Avatar />
      {VIDEO.mostrarSubtitulos && <Subtitles />}
      <Sonidos camara={camara} />
      {VIDEO.musica && <Audio src={staticFile(VIDEO.musica)} volume={VIDEO.volumenMusica} />}
      {VIDEO.narracion && (
        <Sequence from={Math.round(VIDEO.retrasoNarracion * fps)}>
          <Audio src={staticFile(VIDEO.narracion)} volume={VIDEO.volumenNarracion} />
        </Sequence>
      )}
    </AbsoluteFill>
    </ProveedorCamara>
  );
};
