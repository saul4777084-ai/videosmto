import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Freeze, staticFile, useCurrentFrame} from 'remotion';
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
import {Camara} from './camera/Camara';
import {audioAGuion} from './audio/tiempo';

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

/** Todas las escenas encadenadas con sus transiciones (en tiempo del guion). */
const Escenas: React.FC<{camara: ConfigCamara}> = ({camara}) => {
  const fps = VIDEO.fps;
  const ov = VIDEO.solapeTransicion;
  const keys = Object.keys(ESCENA_COMPONENTES) as NombreEscena[];
  return (
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
    </AbsoluteFill>
  );
};

/**
 * Recibe la configuración de cámara y audio como props (editable en el panel
 * Props del Studio).
 *
 * Toda la parte visual se escribe en "tiempo del guion" y se reproduce a
 * través del mapa de tiempo guion -> audio (Freeze con el frame remapeado),
 * de modo que escenas, cámara, subtítulos y gestos caen exactamente donde la
 * voz real dice cada frase.
 */
export const Video: React.FC<ConfigCamara> = (camara) => {
  useFonts();
  const frame = useCurrentFrame();
  const fps = VIDEO.fps;
  const frameGuion = audioAGuion(frame / fps, camara.audio.anclas) * fps;
  return (
    <ProveedorCamara config={camara}>
      <AbsoluteFill style={{background: '#000'}}>
        <Freeze frame={Math.max(0, frameGuion)}>
          {/* cámara global: escena de fondo + presentador en capas para las órbitas 2.5D */}
          <Camara
            plano="presentador"
            capas={[
              {id: 'escenas', profundidad: 0.7, cubrir: true, escenario: true, motionBlur: 'direccional', contenido: <Escenas camara={camara} />},
              {id: 'presentador', profundidad: 1, principal: true, contenido: <Avatar />},
            ]}
          />
          {VIDEO.mostrarSubtitulos && <Subtitles />}
        </Freeze>
        <Sonidos camara={camara} />
        {VIDEO.musica && <Audio src={staticFile(VIDEO.musica)} volume={VIDEO.volumenMusica} />}
        {camara.audio.archivo && <Audio src={staticFile(camara.audio.archivo)} volume={camara.audio.volumen} />}
      </AbsoluteFill>
    </ProveedorCamara>
  );
};
