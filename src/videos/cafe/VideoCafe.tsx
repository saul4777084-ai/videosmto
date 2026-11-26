import React, {useEffect, useState} from 'react';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/600.css';
import {AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Clip} from '../../components/Clip';
import type {Transicion} from '../../camera/esquema';
import {AvisoInicial, Dia, Etiqueta, Etiquetas} from '../cola/hud';
import {Cierre, Consejos, CurvaCafeina, escena, Indicadores, momento, PanelBloqueo, PanelCinco, PanelPulso, PanelTaza, Subtitulos, Titulo} from './hud';
import plan from './plan.json';
import tiempos from './tiempos.json';
import {
  C_ADENOSINA,
  C_ADRENALINA,
  C_CAFEINA,
  PropsToma,
  TomaAbstinencia,
  TomaCerebro,
  TomaCerebroNoche,
  TomaCorazon,
  TomaCuerpo30,
  TomaFinal,
  TomaIntro,
  TomaReceptores,
  TomaSangre,
  TomaSangreNoche,
  TomaTazas,
  TomaTolerancia,
  TomaTrago,
} from './tomas';

/**
 * "¿Qué le pasa a tu cuerpo si tomas 5 cafés al día durante 30 días?" — vídeo vertical 1080×1920,
 * 30 fps. Escenas, frases y subtítulos salen de tiempos.json (tools/tiempos_cafe.py, con la
 * duración real de la locución); las tomas, de plan.json. Los instantes de cada animación se
 * calculan a partir de las palabras de la voz.
 * Con `audio` se reproduce la mezcla final (public/cafe/mezcla.wav) para revisarla en el Studio.
 */

export const FPS_CAFE = 30;
export const DURACION_CAFE = tiempos.duracion;
const OV = 14; // solape de las transiciones (fotogramas)

type Toma = {escena: string; toma: string; inicio: number; fin: number};
export const TOMAS_CAFE: Toma[] = tiempos.escenas.flatMap((e) => {
  const lista = (plan.escenas as Record<string, {t: number; toma: string}[]>)[e.id];
  return lista.map((x, i) => ({escena: e.id, toma: x.toma, inicio: e.inicio + x.t, fin: i + 1 < lista.length ? e.inicio + lista[i + 1].t : e.fin}));
});
const inicioToma = (id: string) => TOMAS_CAFE.find((x) => x.toma === id)!.inicio;
/** Segundo (relativo al inicio de la toma) en que se dice una palabra. */
const rel = (toma: string, frase: string, palabra: string) => momento(frase, palabra) - inicioToma(toma);

const M = {
  receptores: {a: rel('receptores', 'Allí ocupa', 'ocupa'), b: 0, c: rel('receptores', 'Por eso', 'despejas')},
  corazon: {adrenalina: rel('corazon', 'Por eso', 'adrenalina'), corazon: rel('corazon', 'Por eso', 'corazón')},
  tazas: {cinco: rel('tazas', 'Día siete', 'Cinco'), limite: rel('tazas', 'Es más', '400')},
  tolerancia: {a: rel('tolerancia', 'Y tu cerebro', 'fabricar') - 0.1, b: rel('tolerancia', 'Y tu cerebro', 'receptores') + 0.3, c: rel('tolerancia', 'Y tu cerebro', 'igual')},
  abstinencia: {dolor: rel('abstinencia', 'Día treinta', 'dolor'), cansancio: rel('abstinencia', 'Día treinta', 'cansancio'), irrita: rel('abstinencia', 'Día treinta', 'irritabilidad')},
  cuerpo30: {nervios: rel('cuerpo30', 'Y en dosis', 'nervios'), palpita: rel('cuerpo30', 'Y en dosis', 'palpitaciones'), acidez: rel('cuerpo30', 'Y en dosis', 'acidez')},
};

export const TOMAS: Record<string, React.FC<PropsToma>> = {
  intro: TomaIntro,
  trago: TomaTrago,
  sangre: TomaSangre,
  cerebro: TomaCerebro,
  receptores: (p) => <TomaReceptores {...p} marcas={M.receptores} />,
  corazon: (p) => <TomaCorazon {...p} marcas={M.corazon} />,
  tazas: (p) => <TomaTazas {...p} marcas={M.tazas} />,
  tolerancia: (p) => <TomaTolerancia {...p} marcas={M.tolerancia} />,
  sangreNoche: TomaSangreNoche,
  cerebroNoche: TomaCerebroNoche,
  abstinencia: (p) => <TomaAbstinencia {...p} marcas={M.abstinencia} />,
  cuerpo30: (p) => <TomaCuerpo30 {...p} marcas={M.cuerpo30} />,
  final: TomaFinal,
};

/** Transición con la que entra cada toma. */
const ENTRADA: Record<string, Transicion> = {
  trago: 'desenfoque',
  sangre: 'zoom',
  cerebro: 'desenfoque',
  receptores: 'zoom',
  corazon: 'desenfoque',
  tazas: 'desenfoque',
  tolerancia: 'zoom',
  sangreNoche: 'desenfoque',
  cerebroNoche: 'desenfoque',
  abstinencia: 'desenfoque',
  cuerpo30: 'desenfoque',
  final: 'desenfoque',
};

/** Etiquetas de lo que se ve en cada toma. */
const ETIQUETAS: Record<string, {titulo?: string; lista: Etiqueta[]}> = {
  trago: {titulo: 'Esófago → estómago', lista: [{texto: 'Café', color: '#c8884a'}]},
  sangre: {titulo: 'Torrente sanguíneo', lista: [{texto: 'Cafeína', color: C_CAFEINA}, {texto: 'Glóbulos rojos', color: '#ff5a5a'}]},
  cerebro: {titulo: 'Cerebro', lista: [{texto: 'Llega la cafeína', color: C_CAFEINA}]},
  receptores: {titulo: 'Neurona', lista: [{texto: 'Adenosina', color: C_ADENOSINA}, {texto: 'Cafeína', color: C_CAFEINA}, {texto: 'Receptores', color: '#7aa8ff'}]},
  corazon: {titulo: 'Corazón', lista: [{texto: 'Adrenalina', color: C_ADRENALINA}]},
  tolerancia: {titulo: 'Tolerancia', lista: [{texto: 'Receptores nuevos', color: '#7ae0f0'}, {texto: 'Adenosina', color: C_ADENOSINA}, {texto: 'Cafeína', color: C_CAFEINA}]},
  sangreNoche: {titulo: 'Sangre · 22:00', lista: [{texto: 'Aún queda cafeína', color: C_CAFEINA}]},
  cerebroNoche: {titulo: 'Cerebro de noche', lista: [{texto: 'Sueño profundo ↓', color: '#8a9aff'}]},
};

const Superposicion: React.FC<{tm: Toma}> = ({tm}) => {
  const f = useCurrentFrame();
  const t = f / FPS_CAFE;
  const dur = tm.fin - tm.inicio;
  const et = ETIQUETAS[tm.toma];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {et && <Etiquetas lista={et.lista} titulo={et.titulo} t={t} dur={dur} />}
      {tm.toma === 'receptores' && <PanelBloqueo t={t} dur={dur} a={M.receptores.a} c={M.receptores.c} />}
      {tm.toma === 'corazon' && <PanelPulso t={t} dur={dur} a={M.corazon.adrenalina} />}
    </AbsoluteFill>
  );
};

const CapaEscena: React.FC<{id: string; dur: number}> = ({id, dur}) => {
  const f = useCurrentFrame();
  const t = f / FPS_CAFE;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {id === 'intro' && (
        <>
          <Titulo t={t} />
          <AvisoInicial t={t} />
        </>
      )}
      <Dia escena={id} t={t} dur={dur} />
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
      <PanelTaza tAbs={t} />
      <PanelCinco tAbs={t} />
      <CurvaCafeina tAbs={t} />
      <Indicadores tAbs={t} />
      <Consejos tAbs={t} />
      {subtitulos && <Subtitulos tAbs={t} />}
    </AbsoluteFill>
  );
};

export const VideoCafe: React.FC<{subtitulos?: boolean; audio?: boolean}> = ({subtitulos = true, audio = false}) => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['300', '500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  const fr = (s: number) => Math.round(s * FPS_CAFE);
  const total = fr(DURACION_CAFE);
  void escena;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {TOMAS_CAFE.map((tm, i) => {
        const C = TOMAS[tm.toma];
        const ultimo = i === TOMAS_CAFE.length - 1;
        const desde = fr(tm.inicio);
        const dur = fr(tm.fin) - desde + (ultimo ? 0 : OV);
        const sig = TOMAS_CAFE[i + 1];
        return (
          <Clip key={tm.toma} from={desde} dur={dur} fadeIn={i === 0 ? 18 : OV} fadeOut={ultimo ? 40 : OV} entrada={i === 0 ? 'fundido' : ENTRADA[tm.toma]} salida={ultimo ? 'fundido' : ENTRADA[sig.toma]}>
            <TomaViva C={C} d={dur / FPS_CAFE} />
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
      {audio && <Audio src={staticFile('cafe/mezcla.wav')} />}
      <Sequence from={total - 1} durationInFrames={1} layout="none">
        <AbsoluteFill style={{background: '#000'}} />
      </Sequence>
    </AbsoluteFill>
  );
};

const TomaViva: React.FC<{C: React.FC<PropsToma>; d: number}> = ({C, d}) => {
  const f = useCurrentFrame();
  return <C t={f / FPS_CAFE} d={d} />;
};
