import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Easing, Freeze, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Clip} from '../../components/Clip';
import {Camara, ProveedorCamara} from '../../camera/Camara';
import {Subtitles} from '../../components/Subtitles';
import {Avatar} from '../../components/Avatar';
import {Sonidos} from '../../components/Sonidos';
import {Counter} from '../../components/Counter';
import {audioAGuion} from '../../audio/tiempo';
import type {ConfigCamara} from '../../camera/esquema';
import {ESCENAS_SUENO, EscenaSueno, GESTOS_SUENO, MUSICA_SUENO, SONIDOS_SUENO, SUBTITULOS_SUENO, VIDEO_SUENO} from './config';
import {ESCENA_COMPONENTES_SUENO} from './escenas';
import {inicioPlanoSueno} from './camara';
import {Grano} from './efectos';

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const useFuentes = () => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['500', '700', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
};

const Escenas: React.FC<{camara: ConfigCamara}> = ({camara}) => {
  const fps = VIDEO_SUENO.fps;
  const ov = VIDEO_SUENO.solapeTransicion;
  const keys = Object.keys(ESCENA_COMPONENTES_SUENO) as EscenaSueno[];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {keys.map((k, i) => {
        const C = ESCENA_COMPONENTES_SUENO[k];
        const e = ESCENAS_SUENO[k];
        const last = i === keys.length - 1;
        return (
          <Clip
            key={k}
            from={Math.round(e.inicio * fps)}
            dur={Math.round((e.fin - e.inicio) * fps) + (last ? 0 : ov)}
            fadeIn={i === 0 ? 0 : ov}
            fadeOut={last ? 0 : ov}
            entrada={camara.transiciones[k]}
            salida={last ? 'fundido' : camara.transiciones[keys[i + 1]]}
            entryScale={1.04}
          >
            <C />
          </Clip>
        );
      })}
    </AbsoluteFill>
  );
};

/** Contador de horas sin dormir: sube de golpe en cada día y pasa a rojo al final. */
const HorasSinDormir: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const tramos: [number, number, number][] = [
    [7.23, 0, 24],
    [17.05, 24, 48],
    [24.27, 48, 72],
    [31.9, 72, 120],
    [38.04, 120, 168],
    [46.5, 168, 264],
  ];
  let h = 0;
  let ultimo = -10;
  tramos.forEach(([en, a, b]) => {
    if (t >= en) {
      h = interpolate(t, [en, en + 0.9], [a, b], {...cl, easing: Easing.out(Easing.cubic)});
      ultimo = en;
    }
  });
  const aparece = interpolate(t, [3.1, 3.5], [0, 1], cl) * interpolate(t, [52.9, 53.3], [1, 0], cl);
  if (aparece <= 0) return null;
  const golpe = 1 + 0.12 * Math.exp(-Math.max(0, t - ultimo) * 6) * (t >= ultimo ? 1 : 0);
  const record = t >= 46.5;
  const color = record ? 'ambar' : t >= 31.9 ? 'rojo' : 'azul';
  return (
    <Counter
      x={540}
      y={545}
      value={h}
      digits={3}
      color={color}
      icon="reloj"
      unit="h"
      label={record ? 'RÉCORD DE 1964' : 'HORAS SIN DORMIR'}
      scale={0.82 * golpe * aparece}
      opacity={aparece}
    />
  );
};

/**
 * "¿QUÉ PASARÍA SI DEJARAS DE DORMIR DURANTE 7 DÍAS?"
 * Toda la parte visual está en tiempo del guion y se reproduce a través del
 * mapa de tiempo guion -> audio, así encaja con la voz real.
 */
export const VideoSueno: React.FC<ConfigCamara> = (camara) => {
  useFuentes();
  const frame = useCurrentFrame();
  const fps = VIDEO_SUENO.fps;
  const frameGuion = audioAGuion(frame / fps, camara.audio.anclas) * fps;
  return (
    <ProveedorCamara config={camara}>
      <AbsoluteFill style={{background: '#000'}}>
        <Freeze frame={Math.max(0, frameGuion)}>
          <Camara
            plano="presentador"
            capas={[
              {id: 'escenas', profundidad: 0.7, cubrir: true, escenario: true, motionBlur: 'direccional', contenido: <Escenas camara={camara} />},
              {id: 'presentador', profundidad: 1, principal: true, contenido: <Avatar gestos={GESTOS_SUENO} />},
            ]}
          />
          <HorasSinDormir />
          <Grano intensidad={0.05} />
          <Subtitles subtitulos={SUBTITULOS_SUENO} />
        </Freeze>
        <Sonidos camara={camara} sonidos={SONIDOS_SUENO} musica={MUSICA_SUENO} inicioPlano={inicioPlanoSueno} />
        {camara.audio.archivo && <Audio src={staticFile(camara.audio.archivo)} volume={camara.audio.volumen} />}
      </AbsoluteFill>
    </ProveedorCamara>
  );
};
