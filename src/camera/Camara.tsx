import React, {createContext, useContext, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ConfigCamara} from './esquema';
import {CAMARA} from '../config/camara';
import {
  aplicar,
  calcularZoomBase,
  css,
  DefCapa,
  desplazamiento,
  elementosPantalla,
  EstadoCamara,
  evaluarCamara,
  Matriz,
  transformarCapa,
} from './motor';
import {DesenfoqueDireccional} from './DesenfoqueDireccional';

const Ctx = createContext<ConfigCamara>(CAMARA);
export const ProveedorCamara: React.FC<{config: ConfigCamara; children: React.ReactNode}> = ({config, children}) => (
  <Ctx.Provider value={config}>{children}</Ctx.Provider>
);
export const useConfigCamara = () => useContext(Ctx);

export type Capa = DefCapa & {id: string; contenido: React.ReactNode};

/** Foco de luz + anillo sobre el elemento mencionado por la narración. */
const Resaltado: React.FC<{x: number; y: number; r: number; a: number; pulso: number}> = ({x, y, r, a, pulso}) => {
  if (a <= 0.01) return null;
  const anillo = 1 + 0.06 * Math.sin(pulso * Math.PI * 2 * 1.4);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${x}px ${y}px, rgba(0,0,0,0) ${r * 0.85}px, rgba(8,4,20,${0.55 * a}) ${r * 1.6}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: '6px solid rgba(255,216,74,0.95)',
          boxShadow: '0 0 30px rgba(255,216,74,0.8), inset 0 0 30px rgba(255,216,74,0.35)',
          opacity: a,
          transform: `scale(${(0.7 + 0.3 * a) * anillo})`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Texto importante revelado por la narración. */
const RotuloPantalla: React.FC<{texto: string; x: number; y: number; a: number; escala: number; salida: number; sx: number; sy: number}> = ({
  texto,
  x,
  y,
  a,
  escala,
  salida,
  sx,
  sy,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x + sx * 0.6,
      top: y + sy * 0.6,
      transform: `translate(-50%, -50%) scale(${Math.max(0, a) * escala * (1 - 0.15 * salida)}) rotate(${(1 - Math.min(1, a)) * -6}deg)`,
      opacity: Math.min(1, a * 1.5) * (1 - salida),
      padding: '12px 38px',
      borderRadius: 26,
      fontFamily: 'Poppins',
      fontWeight: 800,
      // tamaño adaptado a la longitud para que nunca se salga del encuadre
      fontSize: Math.min(92, Math.round(1250 / Math.max(1, texto.length))),
      whiteSpace: 'nowrap',
      color: '#ffd84a',
      border: '6px solid #ffd84a',
      background: 'rgba(30,18,58,0.82)',
      boxShadow: '0 0 40px rgba(255,216,74,0.55), 0 20px 40px rgba(0,0,0,0.45)',
      textShadow: '0 4px 14px rgba(0,0,0,0.5)',
    }}
  >
    {texto}
  </div>
);

/**
 * CÁMARA CINEMATOGRÁFICA de un plano.
 *
 * Recibe la escena separada en capas con su profundidad y aplica los efectos
 * configurados para `plano` en config/camara.ts (o en el panel Props del
 * Studio). Cada capa recibe su propia transformación (zoom, paneo, parallax,
 * dolly zoom, órbita, temblor) y su propio desenfoque (profundidad de campo,
 * rack focus, focus pull). Las transformaciones son siempre de cuerpo rígido
 * con escala uniforme: la cámara se mueve, la ilustración nunca se estira.
 * El motion blur es real: la capa se expone varias veces dentro del
 * intervalo del obturador y las exposiciones se promedian.
 */
export const Camara: React.FC<{plano: string; capas: Capa[]; superposicion?: React.ReactNode; desfase?: number}> = ({
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
  const estado = (f: number): EstadoCamara => evaluarCamara(efectos, f, fps, g, zoomBase);
  const ahora = estado(frame);
  const mb = g.motionBlur;
  const obt = Math.min(2, mb.obturador * ahora.mb);
  const antes = mb.activo && obt > 0 ? estado(frame - obt / 2) : null;
  const despues = mb.activo && obt > 0 ? estado(frame + obt / 2) : null;
  const {resaltes, rotulos} = elementosPantalla(efectos, frame, fps);

  const dibujarCapa = (capa: Capa) => {
    const tr = transformarCapa(ahora, capa, g);
    const modo = capa.motionBlur === 'no' ? null : capa.motionBlur === 'direccional' ? 'direccional' : mb.modo;
    let exposiciones: Matriz[] = [tr.m];
    let direccional: {sx: number; sy: number} | null = null;
    if (antes && despues && modo) {
      const a = transformarCapa(antes, capa, g).m;
      const b = transformarCapa(despues, capa, g).m;
      const dsp = desplazamiento(a, b);
      if (dsp.max > mb.umbral) {
        if (modo === 'muestras') {
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
    let cuerpo: React.ReactNode = exposiciones.map((m, i) => (
      <AbsoluteFill key={i} style={{transform: css(m), transformOrigin: '0 0', opacity: 1 / (i + 1)}}>
        {capa.contenido}
      </AbsoluteFill>
    ));
    if (direccional) cuerpo = <DesenfoqueDireccional sx={direccional.sx} sy={direccional.sy}>{cuerpo}</DesenfoqueDireccional>;
    if (Math.abs(tr.rotY) > 0.01) {
      // giro del escenario en perspectiva (2.5D), con margen para no ver bordes
      const extra = 1 + Math.abs(Math.sin((tr.rotY * Math.PI) / 180)) * 0.7;
      cuerpo = (
        <AbsoluteFill style={{transform: `perspective(2200px) rotateY(${tr.rotY.toFixed(3)}deg) scale(${extra.toFixed(4)})`, transformOrigin: '50% 50%'}}>
          {cuerpo}
        </AbsoluteFill>
      );
    }
    return (
      <AbsoluteFill key={capa.id} style={{filter: filtro}}>
        {cuerpo}
      </AbsoluteFill>
    );
  };

  const escena = capas.filter((c) => !c.hud);
  const hud = capas.filter((c) => c.hud);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {escena.map(dibujarCapa)}
      {superposicion}
      {resaltes.map((r, i) => {
        // el resaltado sigue al objeto: se proyecta con la transformación de su profundidad
        const m = transformarCapa(ahora, {profundidad: r.d}, g).m;
        const [x, y] = aplicar(m, r.x, r.y);
        const k = Math.hypot(m[0], m[1]);
        return <Resaltado key={i} x={x} y={y} r={r.r * k} a={r.a} pulso={r.pulso} />;
      })}
      {hud.map(dibujarCapa)}
      {rotulos.map((r, i) => (
        <RotuloPantalla key={i} {...r} sx={ahora.sx} sy={ahora.sy} />
      ))}
    </AbsoluteFill>
  );
};
