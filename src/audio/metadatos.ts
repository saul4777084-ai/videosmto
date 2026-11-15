import {CalculateMetadataFunction, staticFile} from 'remotion';
import {getAudioData} from '@remotion/media-utils';
import type {ConfigCamara} from '../camera/esquema';
import {alinearFrases} from './alinear';
import {guionAAudio} from './tiempo';
import {SUBTITULOS} from '../config/textos';
import {VIDEO} from '../config/video';

/**
 * Antes de previsualizar o renderizar, carga el MP3/WAV indicado en
 * props.audio.archivo, lo analiza y alinea el guion con la voz real.
 * La duración del vídeo pasa a ser la del audio (o la del guion reajustado
 * si es mayor) y las anclas resultantes viajan en las props.
 */
export const calcularMetadatos: CalculateMetadataFunction<ConfigCamara> = async ({props}) => {
  let anclas = props.audio.anclas;
  let duracion = VIDEO.duracionSegundos;
  if (props.audio.archivo && props.audio.sincronizar) {
    const datos = await getAudioData(staticFile(props.audio.archivo));
    const canales = datos.channelWaveforms;
    const mono = new Float32Array(canales[0].length);
    canales.forEach((c) => c.forEach((v, i) => (mono[i] += v / canales.length)));
    const r = alinearFrases(mono, datos.sampleRate, SUBTITULOS, props.audio.sensibilidad);
    anclas = r.anclas;
    duracion = r.duracionAudio + 0.3;
  }
  duracion = Math.max(duracion, guionAAudio(VIDEO.duracionSegundos, anclas));
  return {
    durationInFrames: Math.ceil(duracion * VIDEO.fps),
    props: {...props, audio: {...props.audio, anclas}},
  };
};
