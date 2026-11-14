import React, {createContext, useContext, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ConfigCamara, NombrePlano} from './esquema';
import {CAMARA} from '../config/camara';
import {calcularZoomBase, css, DefCapa, desplazamiento, evaluarCamara, Matriz, transformarCapa} from './motor';
import {DesenfoqueDireccional} from './DesenfoqueDireccional';

const Ctx = createContext<ConfigCamara>(CAMARA);
export const ProveedorCamara: React.FC<{config: ConfigCamara; children: React.ReactNode}> = ({config, children}) => (
  <Ctx.Provider value={config}>{children}</Ctx.Provider>
);
export const useConfigCamara = () => useContext(Ctx);

export type Capa = DefCapa & {id: string; contenido: React.ReactNode};

/**
 * CÁMARA CINEMATOGRÁFICA de un plano.
 *
 * Recibe la escena separada en capas con su profundidad y aplica los efectos
 * configurados para `plano` en config/camara.ts (o en el panel Props del
 * Studio). Cada capa recibe su propia transformación (zoom, paneo, parallax,
 * dolly zoom, temblor) y su propio desenfoque (profundidad de campo, rack
 * focus, focus pull). El motion blur es real: la capa se expone varias veces
 * dentro del intervalo del obturador y las exposiciones se promedian.
 *
 * `desfase` (frames) permite evaluar el plano con un tiempo adelantado.
 */
export const Camara: React.FC<{plano: NombrePlano; capas: Capa[]; superposicion?: React.ReactNode; desfase?: number}> = ({
  plano,
  capas,
  superposicion,
  desfase = 0,
}) => {
  const frame = useCurrentFrame() + desfase;
  const {fps} = useVideoConfig();
  const cfg = useConfigCamara();
  const g = cfg.global;
  const efectos = cfg.planos[plano] ?? [];
  const zoomBase = useMemo(() => calcularZoomBase(efectos, fps, g.intensidadGeneral), [efectos, fps, g.intensidadGeneral]);
  const estado = (f: number) => evaluarCamara(efectos, f, fps, g, zoomBase);
  const ahora = estado(frame);
  const mb = g.motionBlur;
  const obt = Math.min(2, mb.obturador * ahora.mb);
  const antes = mb.activo && obt > 0 ? estado(frame - obt / 2) : null;
  const despues = mb.activo && obt > 0 ? estado(frame + obt / 2) : null;

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {capas.map((capa) => {
        const tr = transformarCapa(ahora, capa, g);
        let exposiciones: Matriz[] = [tr.m];
        let direccional: {sx: number; sy: number} | null = null;
        if (antes && despues) {
          const a = transformarCapa(antes, capa, g).m;
          const b = transformarCapa(despues, capa, g).m;
          const dsp = desplazamiento(a, b);
          if (dsp.max > mb.umbral) {
            if (mb.modo === 'muestras') {
              const n = Math.max(2, Math.min(mb.muestras, Math.ceil(dsp.max / 3)));
              exposiciones = new Array(n).fill(0).map((_, i) => {
                const f = frame + (i / (n - 1) - 0.5) * obt;
                return transformarCapa(estado(f), capa, g).m;
              });
            } else {
              direccional = {sx: Math.abs(dsp.vx) / 2.5, sy: Math.abs(dsp.vy) / 2.5};
            }
          }
        }
        const filtro = tr.blur > 0.05 ? `blur(${tr.blur.toFixed(2)}px)` : undefined;
        const cuerpo = exposiciones.map((m, i) => (
          <AbsoluteFill key={i} style={{transform: css(m), transformOrigin: '0 0', opacity: 1 / (i + 1)}}>
            {capa.contenido}
          </AbsoluteFill>
        ));
        return (
          <AbsoluteFill key={capa.id} style={{filter: filtro}}>
            {direccional ? (
              <DesenfoqueDireccional sx={direccional.sx} sy={direccional.sy}>
                {cuerpo}
              </DesenfoqueDireccional>
            ) : (
              cuerpo
            )}
          </AbsoluteFill>
        );
      })}
      {superposicion}
    </AbsoluteFill>
  );
};
