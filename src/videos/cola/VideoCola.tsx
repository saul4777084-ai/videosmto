import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {Clip} from '../../components/Clip';
import type {Transicion} from '../../camera/esquema';
import plan from './plan.json';
import tiempos from './tiempos.json';
import {AvisoInicial, Cierre, Dia, escena, Etiqueta, Etiquetas, GraficaGlucosa, Indicadores, MedidorHigado, momento, PanelAzucar, Subtitulos, Titulo} from './hud';
import {
  PropsToma,
  TomaCerebroCafeina,
  TomaCuerpo30,
  TomaEstomagoCola,
  TomaFinal,
  TomaGlobulos,
  TomaHepatocitosGrasa,
  TomaHigadoGraso,
  TomaHigadoZoom,
  TomaInsulina,
  TomaIntro,
  TomaPancreas,
  TomaTrago,
  TomaVasoAzucar,
} from './tomas';

/**
 * "¿Qué le pasa a tu cuerpo si tomas Coca-Cola durante 30 días?" — vídeo vertical 1080×1920, 30 fps,
 * SIN audio (la voz se graba aparte con el texto de guiones/coca-cola-30-dias.md).
 * Escenas, frases y subtítulos salen de tiempos.json (tools/tiempos_cola.py); las tomas, de plan.json.
 */

export const FPS_COLA = 30;
export const DURACION_COLA = tiempos.duracion;
const OV = 14; // solape de las transiciones (fotogramas)

type Toma = {escena: string; toma: string; inicio: number; fin: number};
export const TOMAS_COLA: Toma[] = tiempos.escenas.flatMap((e) => {
  const lista = (plan.escenas as Record<string, {t: number; toma: string}[]>)[e.id];
  return lista.map((x, i) => ({escena: e.id, toma: x.toma, inicio: e.inicio + x.t, fin: i + 1 < lista.length ? e.inicio + lista[i + 1].t : e.fin}));
});

const e30 = escena('dia30');
const MARCAS_30 = {
  peso: momento('Día treinta', 'aumento') - e30.inicio,
  diabetes: momento('mayor riesgo', 'diabetes') - e30.inicio,
  higado: momento('mayor riesgo', 'hígado') - e30.inicio,
  corazon: momento('mayor riesgo', 'cardiovasculares') - e30.inicio,
};

export const TOMAS: Record<string, React.FC<PropsToma>> = {
  intro: TomaIntro,
  trago: TomaTrago,
  estomago: TomaEstomagoCola,
  vasoAzucar: TomaVasoAzucar,
  globulos: TomaGlobulos,
  pancreas: TomaPancreas,
  insulina: TomaInsulina,
  higadoZoom: TomaHigadoZoom,
  higadoGraso: TomaHigadoGraso,
  hepatocitos: TomaHepatocitosGrasa,
  cuerpo30: (p) => <TomaCuerpo30 {...p} marcas={MARCAS_30} />,
  cerebro: TomaCerebroCafeina,
  final: TomaFinal,
};

/** Transición con la que entra cada toma. */
const ENTRADA: Record<string, Transicion> = {
  trago: 'desenfoque',
  estomago: 'zoom',
  vasoAzucar: 'zoom',
  globulos: 'desenfoque',
  pancreas: 'desenfoque',
  insulina: 'zoom',
  higadoZoom: 'desenfoque',
  higadoGraso: 'zoom',
  hepatocitos: 'zoom',
  cuerpo30: 'desenfoque',
  cerebro: 'zoom',
  final: 'desenfoque',
};

/** Etiquetas de lo que se ve en cada toma. */
const ETIQUETAS: Record<string, {titulo?: string; lista: Etiqueta[]}> = {
  trago: {titulo: 'Boca → esófago → estómago', lista: [{texto: 'Refresco de cola', color: '#ff8a3a'}]},
  estomago: {titulo: 'Estómago', lista: [{texto: 'Azúcar disuelto', color: '#ffffff'}, {texto: 'Gas (CO₂)', color: '#ffd0a0'}]},
  vasoAzucar: {titulo: 'Torrente sanguíneo', lista: [{texto: 'Glucosa', color: '#9af0ff'}, {texto: 'Fructosa', color: '#ffa23a'}, {texto: 'Glóbulos rojos', color: '#ff5a5a'}]},
  globulos: {titulo: 'Glucosa en sangre ↑', lista: [{texto: 'Glucosa', color: '#9af0ff'}, {texto: 'Glóbulos rojos', color: '#ff5a5a'}]},
  pancreas: {titulo: 'Páncreas', lista: [{texto: 'Libera insulina', color: '#7dffa8'}]},
  insulina: {titulo: 'Membrana celular', lista: [{texto: 'Insulina', color: '#7dffa8'}, {texto: 'Receptor', color: '#7aa8ff'}, {texto: 'La glucosa entra', color: '#9af0ff'}]},
  higadoZoom: {titulo: 'Hígado', lista: [{texto: 'Procesa la fructosa', color: '#ffa23a'}]},
  higadoGraso: {titulo: 'Hígado', lista: [{texto: 'Gotas de grasa', color: '#ffd040'}]},
  hepatocitos: {titulo: 'Células del hígado', lista: [{texto: 'Grasa acumulada', color: '#ffd868'}]},
};
/** Tomas en las que el panel de la derecha ocupa el sitio: las etiquetas van más abajo. */
const ETIQUETAS_ABAJO = new Set<string>();

const Superposicion: React.FC<{tm: Toma}> = ({tm}) => {
  const f = useCurrentFrame();
  const t = f / FPS_COLA;
  const dur = tm.fin - tm.inicio;
  const et = ETIQUETAS[tm.toma];
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{et && <Etiquetas lista={et.lista} titulo={et.titulo} t={t} dur={dur} top={ETIQUETAS_ABAJO.has(tm.toma) ? 900 : 560} />}</AbsoluteFill>;
};

const CapaEscena: React.FC<{id: string; dur: number}> = ({id, dur}) => {
  const f = useCurrentFrame();
  const t = f / FPS_COLA;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {id === 'intro' && (
        <>
          <Titulo t={t} />
          <AvisoInicial t={t} />
        </>
      )}
      <Dia escena={id} t={t} dur={dur} />
      {id === 'dia7' && <GraficaGlucosa t={t} dur={dur} />}
      {id === 'final' && <Cierre t={t} dur={dur} />}
    </AbsoluteFill>
  );
};

const Global: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <PanelAzucar tAbs={t} />
      <MedidorHigado tAbs={t} />
      <Indicadores tAbs={t} />
      <Subtitulos tAbs={t} />
    </AbsoluteFill>
  );
};

export const VideoCola: React.FC<{subtitulos?: boolean}> = ({subtitulos = true}) => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  const fr = (s: number) => Math.round(s * FPS_COLA);
  const total = fr(DURACION_COLA);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {TOMAS_COLA.map((tm, i) => {
        const C = TOMAS[tm.toma];
        const ultimo = i === TOMAS_COLA.length - 1;
        const desde = fr(tm.inicio);
        const dur = fr(tm.fin) - desde + (ultimo ? 0 : OV);
        const sig = TOMAS_COLA[i + 1];
        return (
          <Clip key={tm.toma} from={desde} dur={dur} fadeIn={i === 0 ? 18 : OV} fadeOut={ultimo ? 40 : OV} entrada={i === 0 ? 'fundido' : ENTRADA[tm.toma]} salida={ultimo ? 'fundido' : ENTRADA[sig.toma]}>
            <TomaViva C={C} d={dur / FPS_COLA} />
            <Superposicion tm={tm} />
          </Clip>
        );
      })}
      {tiempos.escenas.map((e) => (
        <Sequence key={e.id} from={fr(e.inicio)} durationInFrames={Math.max(1, fr(e.fin) - fr(e.inicio))} layout="none">
          <CapaEscena id={e.id} dur={e.fin - e.inicio} />
        </Sequence>
      ))}
      {subtitulos ? <Global /> : null}
      <Sequence from={total - 1} durationInFrames={1} layout="none">
        <AbsoluteFill style={{background: '#000'}} />
      </Sequence>
    </AbsoluteFill>
  );
};

const TomaViva: React.FC<{C: React.FC<PropsToma>; d: number}> = ({C, d}) => {
  const f = useCurrentFrame();
  return <C t={f / FPS_COLA} d={d} />;
};
