import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Clip';
import {TvRoom} from '../sets/TvRoom';
import {Counter} from '../components/Counter';
import {Flame} from '../components/Flame';
import {CONTADORES} from '../config/contadores';
import {ESCENAS} from '../config/escenas';
import {ROTULOS} from '../config/textos';
import {pop, s, tween} from '../lib/anim';

const LEN = s(ESCENAS.tele.fin - ESCENAS.tele.inicio);
const COMP = s(ESCENAS.tele.tomas.comparacion);

const Barra: React.FC<{label: string; value: number; max: number; color: string; grow: number; delay: number}> = ({label, value, max, color, grow, delay}) => {
  const w = Math.max(0, Math.min(1, grow)) * (value / max);
  return (
    <div style={{marginTop: delay ? 30 : 0}}>
      <div style={{display: 'flex', justifyContent: 'space-between', color: '#fff', fontFamily: 'Poppins', fontWeight: 700, fontSize: 36, marginBottom: 10}}>
        <span>{label}</span>
        <span style={{color, fontWeight: 800}}>{Math.round(value * Math.max(0, Math.min(1, grow)))} kcal</span>
      </div>
      <div style={{height: 46, borderRadius: 23, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.12)'}}>
        <div style={{width: `${w * 100}%`, height: '100%', borderRadius: 23, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 24px ${color}`}} />
      </div>
    </div>
  );
};

/** ESCENA 6 — Salón con televisión y comparación de resultados. */
export const Escena6Tele: React.FC = () => {
  const f = useCurrentFrame();
  const sofa = tween(f, [s(0.5), COMP], [0, CONTADORES.tele.sofa], (t) => t);
  const tvZoom = tween(f, [0, LEN], [1, 1.25]);
  const panel = pop(f, COMP, 18);
  const g1 = tween(f, [COMP + 8, COMP + 40], [0, 1], Easing.out(Easing.cubic));
  const g2 = tween(f, [COMP + 22, COMP + 64], [0, 1], Easing.out(Easing.cubic));
  const T = ROTULOS.tele;
  return (
    <AbsoluteFill>
      <Stage>
        <TvRoom tvZoom={tvZoom} />
      </Stage>
      <Counter x={540} y={1215} value={sofa} digits={2} color="azul" icon="reloj" label={T.sofa} scale={0.62 * pop(f, s(0.4))} />
      <div
        style={{
          position: 'absolute',
          left: 50,
          right: 290,
          top: 1310,
          padding: '34px 44px 44px',
          borderRadius: 36,
          background: 'rgba(16,12,32,0.86)',
          border: '3px solid rgba(255,255,255,0.14)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          transform: `scale(${panel}) translateY(${(1 - panel) * 60}px)`,
          opacity: Math.min(1, panel * 1.4),
        }}
      >
        <div style={{textAlign: 'center', color: '#ffd84a', fontFamily: 'Poppins', fontWeight: 800, fontSize: 44, marginBottom: 20, letterSpacing: 2}}>{T.titulo}</div>
        <Barra label={T.sofa} value={CONTADORES.tele.sofa} max={CONTADORES.tele.cama} color="#3fc3ff" grow={g1} delay={0} />
        <Barra label={T.cama} value={CONTADORES.tele.cama} max={CONTADORES.tele.cama} color="#ff5fb0" grow={g2} delay={1} />
      </div>
      {f > COMP + 64 && (
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Flame x={130} y={1300} size={90 * pop(f, COMP + 64)} seed={41} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
