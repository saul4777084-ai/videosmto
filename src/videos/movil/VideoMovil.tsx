import React, {useEffect, useState} from 'react';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/600.css';
import {AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Clip} from '../../components/Clip';
import type {Transicion} from '../../camera/esquema';
import {AvisoInicial, Dia, Etiqueta, Etiquetas} from '../cola/hud';
import {BucleHabito, Cierre, Consejos, CurvaMelatonina, Indicadores, MedidorAtencion, Panel240, PanelParpadeo, PanelRecompensa, Subtitulos, Titulo} from './hud';
import plan from './plan.json';
import tiempos from './tiempos.json';
import {
  PropsToma,
  TomaBucle,
  TomaCansado,
  TomaCircuito,
  TomaFeed,
  TomaFinal,
  TomaIntro,
  TomaMelatonina,
  TomaNoche,
  TomaNotificacion,
  TomaOjo,
  TomaPrefrontal,
  TomaRecompensa,
  TomaSinapsis,
} from './tomas';

/**
 * "¿Qué le pasa a tu cerebro si usas el móvil 8 horas al día durante 30 días?" — vídeo vertical
 * 1080×1920, 30 fps. Escenas, frases y subtítulos salen de tiempos.json (tools/tiempos_movil.py,
 * con la duración real de la locución); las tomas y los eventos, de plan.json.
 * Con `audio` se reproduce la mezcla final (public/movil/mezcla.wav) para revisarla en el Studio.
 */

export const FPS_MOVIL = 30;
export const DURACION_MOVIL = tiempos.duracion;
const OV = 14; // solape de las transiciones (fotogramas)

type Toma = {escena: string; toma: string; inicio: number; fin: number};
export const TOMAS_MOVIL: Toma[] = tiempos.escenas.flatMap((e) => {
  const lista = (plan.escenas as Record<string, {t: number; toma: string}[]>)[e.id];
  return lista.map((x, i) => ({escena: e.id, toma: x.toma, inicio: e.inicio + x.t, fin: i + 1 < lista.length ? e.inicio + lista[i + 1].t : e.fin}));
});

export const TOMAS: Record<string, React.FC<PropsToma>> = {
  intro: TomaIntro,
  notificacion: TomaNotificacion,
  feed: TomaFeed,
  recompensa: TomaRecompensa,
  sinapsis: TomaSinapsis,
  circuito: TomaCircuito,
  bucle: TomaBucle,
  prefrontal: TomaPrefrontal,
  ojo: TomaOjo,
  noche: TomaNoche,
  melatonina: TomaMelatonina,
  cansado: TomaCansado,
  final: TomaFinal,
};

/** Transición con la que entra cada toma. */
const ENTRADA: Record<string, Transicion> = {
  notificacion: 'desenfoque',
  feed: 'zoom',
  recompensa: 'zoom',
  sinapsis: 'desenfoque',
  circuito: 'zoom',
  bucle: 'desenfoque',
  prefrontal: 'desenfoque',
  ojo: 'zoom',
  noche: 'desenfoque',
  melatonina: 'zoom',
  cansado: 'desenfoque',
  final: 'desenfoque',
};

/** Etiquetas de lo que se ve en cada toma. */
const ETIQUETAS: Record<string, {titulo?: string; lista: Etiqueta[]}> = {
  notificacion: {titulo: 'Notificación', lista: [{texto: 'Luz, sonido y vibración', color: '#7ab8ff'}]},
  feed: {titulo: 'Pequeñas recompensas', lista: [{texto: 'Mensajes', color: '#36d07a'}, {texto: '«Me gusta»', color: '#ff3d6a'}, {texto: 'Vídeos nuevos', color: '#ff8a2a'}]},
  recompensa: {
    titulo: 'Sistema de recompensa',
    lista: [
      {texto: 'Área tegmental ventral', color: '#ff7a2a'},
      {texto: 'Núcleo accumbens', color: '#ffb030'},
      {texto: 'Corteza prefrontal', color: '#ffe080'},
      {texto: 'Dopamina', color: '#ffd23a'},
    ],
  },
  sinapsis: {titulo: 'Sinapsis', lista: [{texto: 'Dopamina', color: '#ffd23a'}, {texto: 'Receptores', color: '#7aa8ff'}, {texto: 'La conexión se refuerza', color: '#c8aaff'}]},
  circuito: {titulo: 'Circuito del hábito', lista: []},
  prefrontal: {titulo: 'Corteza prefrontal', lista: [{texto: 'Atención y concentración', color: '#7ad8ff'}, {texto: 'Notificaciones', color: '#ff5a6a'}]},
  ojo: {titulo: 'Ojos', lista: [{texto: 'Menos parpadeo', color: '#ff8a8a'}]},
  melatonina: {titulo: 'Glándula pineal', lista: [{texto: 'Melatonina', color: '#ffb050'}, {texto: 'Luz de la pantalla', color: '#8ac8ff'}]},
};

const Superposicion: React.FC<{tm: Toma}> = ({tm}) => {
  const f = useCurrentFrame();
  const t = f / FPS_MOVIL;
  const dur = tm.fin - tm.inicio;
  const et = ETIQUETAS[tm.toma];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {et && <Etiquetas lista={et.lista} titulo={et.titulo} t={t} dur={dur} />}
      {tm.toma === 'feed' && <PanelRecompensa t={t} dur={dur} />}
      {tm.toma === 'prefrontal' && <MedidorAtencion t={t} dur={dur} />}
      {tm.toma === 'ojo' && <PanelParpadeo t={t} dur={dur} />}
    </AbsoluteFill>
  );
};

const CapaEscena: React.FC<{id: string; dur: number}> = ({id, dur}) => {
  const f = useCurrentFrame();
  const t = f / FPS_MOVIL;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {id === 'intro' && (
        <>
          <Titulo t={t} />
          <AvisoInicial t={t} />
        </>
      )}
      <Dia escena={id} t={t} dur={dur} />
      {id === 'dia7' && <BucleHabito t={t} dur={dur} />}
      {id === 'final' && <Cierre t={t} dur={dur} />}
    </AbsoluteFill>
  );
};

const Global: React.FC<{subtitulos: boolean}> = ({subtitulos}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Panel240 tAbs={t} />
      <CurvaMelatonina tAbs={t} />
      <Indicadores tAbs={t} />
      <Consejos tAbs={t} />
      {subtitulos && <Subtitulos tAbs={t} />}
    </AbsoluteFill>
  );
};

export const VideoMovil: React.FC<{subtitulos?: boolean; audio?: boolean}> = ({subtitulos = true, audio = false}) => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['300', '500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  const fr = (s: number) => Math.round(s * FPS_MOVIL);
  const total = fr(DURACION_MOVIL);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {TOMAS_MOVIL.map((tm, i) => {
        const C = TOMAS[tm.toma];
        const ultimo = i === TOMAS_MOVIL.length - 1;
        const desde = fr(tm.inicio);
        const dur = fr(tm.fin) - desde + (ultimo ? 0 : OV);
        const sig = TOMAS_MOVIL[i + 1];
        return (
          <Clip key={tm.toma} from={desde} dur={dur} fadeIn={i === 0 ? 18 : OV} fadeOut={ultimo ? 40 : OV} entrada={i === 0 ? 'fundido' : ENTRADA[tm.toma]} salida={ultimo ? 'fundido' : ENTRADA[sig.toma]}>
            <TomaViva C={C} d={dur / FPS_MOVIL} />
            <Superposicion tm={tm} />
          </Clip>
        );
      })}
      {tiempos.escenas.map((e) => (
        <Sequence key={e.id} from={fr(e.inicio)} durationInFrames={Math.max(1, fr(e.fin) - fr(e.inicio))} layout="none">
          <CapaEscena id={e.id} dur={e.fin - e.inicio} />
        </Sequence>
      ))}
      <Global subtitulos={subtitulos} />
      {audio && <Audio src={staticFile('movil/mezcla.wav')} />}
      <Sequence from={total - 1} durationInFrames={1} layout="none">
        <AbsoluteFill style={{background: '#000'}} />
      </Sequence>
    </AbsoluteFill>
  );
};

const TomaViva: React.FC<{C: React.FC<PropsToma>; d: number}> = ({C, d}) => {
  const f = useCurrentFrame();
  return <C t={f / FPS_MOVIL} d={d} />;
};
