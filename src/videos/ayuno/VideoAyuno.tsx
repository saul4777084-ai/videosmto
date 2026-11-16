import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Clip} from '../../components/Clip';
import type {Transicion} from '../../camera/esquema';
import plan from './plan.json';
import tiempos from './tiempos.json';
import {Alerta, AvisoInicial, Cierre, Dia, Etiqueta, Etiquetas, PanelEnergia, Sintomas, Subtitulos, Titulo} from './hud';
import {TOMAS} from './tomas';
import {Avatar} from '../../components/Avatar';
import {GESTOS_AYUNO} from './avatar';

/**
 * "¿Qué sucede dentro de tu cuerpo si pasas 7 días sin comer?" — vídeo vertical 1080×1920, 30 fps.
 * Los tiempos de escenas, frases y subtítulos salen de la narración (tiempos.json) y el reparto
 * de tomas de plan.json; la banda sonora está sincronizada con ambos.
 */

export const FPS_AYUNO = 30;
export const DURACION_AYUNO = tiempos.duracion;
const OV = 14; // solape de las transiciones (fotogramas)

type Toma = {escena: string; toma: string; inicio: number; fin: number};
export const TOMAS_AYUNO: Toma[] = tiempos.escenas.flatMap((e) => {
  const lista = (plan.escenas as Record<string, {t: number; toma: string}[]>)[e.id];
  return lista.map((x, i) => ({escena: e.id, toma: x.toma, inicio: e.inicio + x.t, fin: i + 1 < lista.length ? e.inicio + lista[i + 1].t : e.fin}));
});

/** Transición con la que entra cada toma. */
const ENTRADA: Record<string, Transicion> = {
  estomago: 'zoom',
  higado: 'desenfoque',
  vasoGlucosa: 'zoom',
  hepatocitos: 'zoom',
  adipocitos: 'desenfoque',
  vasoGrasa: 'zoom',
  higadoCetonas: 'desenfoque',
  mitocondria: 'zoom',
  cerebro: 'desenfoque',
  neuronas: 'zoom',
  cuerpoMusculos: 'desenfoque',
  fibras: 'zoom',
  electrolitos: 'desenfoque',
  corazon: 'desenfoque',
  rinones: 'desenfoque',
  cerebroAlerta: 'desenfoque',
  cuerpoRecorrido: 'desenfoque',
  cuerpoCierre: 'desenfoque',
};

/** Etiquetas de lo que se ve en cada toma. */
const ETIQUETAS: Record<string, {titulo?: string; lista: Etiqueta[]}> = {
  estomago: {titulo: 'Estómago sin alimentos nuevos', lista: []},
  higado: {titulo: 'Hígado', lista: [{texto: 'Glucógeno (reserva)', color: '#ffc84a'}, {texto: 'Glucosa', color: '#9af0ff'}]},
  vasoGlucosa: {titulo: 'Torrente sanguíneo', lista: [{texto: 'Glucosa', color: '#9af0ff'}, {texto: 'Glóbulos rojos', color: '#ff5a5a'}]},
  hepatocitos: {titulo: 'Células del hígado', lista: [{texto: 'Glucógeno ↓', color: '#ffc84a'}, {texto: 'Glucosa liberada', color: '#9af0ff'}]},
  adipocitos: {titulo: 'Tejido graso', lista: [{texto: 'Grasa almacenada', color: '#ffd060'}, {texto: 'Ácidos grasos', color: '#ffe070'}]},
  vasoGrasa: {titulo: 'Hacia músculos y órganos', lista: [{texto: 'Ácidos grasos', color: '#ffe070'}]},
  higadoCetonas: {titulo: 'Hígado', lista: [{texto: 'Produce cuerpos cetónicos', color: '#5affb8'}]},
  mitocondria: {titulo: 'Mitocondrias', lista: [{texto: 'Cuerpos cetónicos', color: '#5affb8'}]},
  cerebro: {titulo: 'Cerebro', lista: [{texto: 'Combustible alternativo', color: '#5affb8'}]},
  neuronas: {titulo: 'Neuronas', lista: [{texto: 'Cuerpos cetónicos', color: '#5affb8'}, {texto: 'Actividad eléctrica', color: '#e8d8ff'}]},
  cuerpoMusculos: {titulo: 'Grasa y proteínas', lista: [{texto: 'Reservas de grasa ↓', color: '#ffb030'}, {texto: 'Masa muscular ↓', color: '#ff6a4a'}]},
  fibras: {titulo: 'Fibras musculares', lista: [{texto: 'Aminoácidos', color: '#ffd04a'}]},
  electrolitos: {lista: [{texto: 'Sodio (Na⁺)', color: '#ffb02a'}, {texto: 'Potasio (K⁺)', color: '#c85aff'}, {texto: 'Agua', color: '#7ad8ff'}]},
  rinones: {titulo: 'Riñones', lista: [{texto: 'Líquidos y electrolitos', color: '#7ad8ff'}]},
  cerebroAlerta: {titulo: 'Cerebro', lista: []},
};

const ALERTAS: Record<string, [string, string?]> = {
  corazon: ['Corazón bajo estrés', 'Los desequilibrios pueden afectar al ritmo'],
  rinones: ['Órganos vitales comprometidos'],
  cerebroAlerta: ['Menos energía disponible'],
  cuerpoRecorrido: ['No existe una respuesta igual', 'para todas las personas'],
};

const Superposicion: React.FC<{tm: Toma}> = ({tm}) => {
  const f = useCurrentFrame();
  const t = f / FPS_AYUNO;
  const dur = tm.fin - tm.inicio;
  const et = ETIQUETAS[tm.toma];
  const al = ALERTAS[tm.toma];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {et && <Etiquetas lista={et.lista} titulo={et.titulo} t={t} dur={dur} />}
      {al && <Alerta texto={al[0]} sub={al[1]} t={t} dur={dur} top={tm.toma === 'cuerpoRecorrido' ? 1180 : 1180} />}
    </AbsoluteFill>
  );
};

const CapaEscena: React.FC<{id: string; dur: number}> = ({id, dur}) => {
  const f = useCurrentFrame();
  const t = f / FPS_AYUNO;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {id === 'intro' && (
        <>
          <Titulo t={t} />
          <AvisoInicial t={t} />
        </>
      )}
      <Dia escena={id} t={t} dur={dur} />
      {id !== 'dia45' && <PanelEnergia escena={id} t={t} dur={dur} />}
      {id === 'cierre' && <Cierre t={t} dur={dur} />}
    </AbsoluteFill>
  );
};

const Global: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Sintomas tAbs={t} />
      <Subtitulos tAbs={t} />
    </AbsoluteFill>
  );
};

export const VideoAyuno: React.FC<{avatar?: boolean}> = ({avatar = true}) => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['500', '700', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  const fr = (s: number) => Math.round(s * FPS_AYUNO);
  const total = fr(DURACION_AYUNO);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {TOMAS_AYUNO.map((tm, i) => {
        const C = TOMAS[tm.toma];
        const ultimo = i === TOMAS_AYUNO.length - 1;
        const desde = fr(tm.inicio);
        const dur = fr(tm.fin) - desde + (ultimo ? 0 : OV);
        const sig = TOMAS_AYUNO[i + 1];
        return (
          <Clip key={tm.toma} from={desde} dur={dur} fadeIn={i === 0 ? 20 : OV} fadeOut={ultimo ? 45 : OV} entrada={i === 0 ? 'fundido' : ENTRADA[tm.toma]} salida={ultimo ? 'fundido' : ENTRADA[sig.toma]}>
            <TomaViva C={C} d={dur / FPS_AYUNO} />
            <Superposicion tm={tm} />
          </Clip>
        );
      })}
      {tiempos.escenas.map((e) => (
        <Sequence key={e.id} from={fr(e.inicio)} durationInFrames={Math.max(1, fr(e.fin) - fr(e.inicio))} layout="none">
          <CapaEscena id={e.id} dur={e.fin - e.inicio} />
        </Sequence>
      ))}
      {avatar && <AvatarAyuno />}
      <Global />
      <Audio src={staticFile('ayuno/narracion.wav')} volume={1} />
      <Audio src={staticFile('ayuno/banda.wav')} volume={0.85} />
      <Sequence from={total - 1} durationInFrames={1} layout="none">
        <AbsoluteFill style={{background: '#000'}} />
      </Sequence>
    </AbsoluteFill>
  );
};

const TomaViva: React.FC<{C: React.FC<{t: number; d: number}>; d: number}> = ({C, d}) => {
  const f = useCurrentFrame();
  return <C t={f / FPS_AYUNO} d={d} />;
};

/** Avatar presentador (abajo a la derecha) con gestos sincronizados con la narración. */
export const AvatarAyuno: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <Avatar gestos={GESTOS_AYUNO} />
  </AbsoluteFill>
);
