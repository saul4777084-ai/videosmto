import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Clip';
import {GridBackground} from '../sets/Science';
import {Stopwatch} from '../components/Clocks';
import {Counter} from '../components/Counter';
import {Pill} from '../components/Subtitles';
import {FloatingHearts, Heart} from '../components/Heart';
import {Flame} from '../components/Flame';
import {Camara} from '../camera/Camara';
import {CONTADORES} from '../config/contadores';
import {ESCENAS} from '../config/escenas';
import {ROTULOS} from '../config/textos';
import {osc, pop, s, tween} from '../lib/anim';

const LEN = s(ESCENAS.cronometro.fin - ESCENAS.cronometro.inicio);

/** ESCENA 5 — Cronómetro central, corazones y llamas. */
export const Escena5Cronometro: React.FC = () => {
  const f = useCurrentFrame();
  const runStart = s(0.6);
  const runEnd = LEN - s(0.6);
  const prog = tween(f, [runStart, runEnd], [0, 1], Easing.inOut(Easing.quad));
  const seconds = prog * CONTADORES.cronometro.minutos * 60;
  const kcal = prog * CONTADORES.cronometro.kcalHasta;
  const mm = Math.floor(seconds / 60);
  const ss = Math.floor(seconds % 60);
  const sw = pop(f, 4, 20);
  const press = f > runStart - 6 && f < runStart + 4 ? 1 : 0;
  return (
    <Camara
      plano="cronometro"
      capas={[
        {id: 'fondo', profundidad: 0.3, cubrir: true, contenido: <Stage><GridBackground idPrefix="e5" /></Stage>},
        {
          id: 'corazones',
          profundidad: 0.6,
          contenido: (
            <Stage>
              <FloatingHearts count={12} area={[80, 1300, 1000, 1750]} rise={900} seed="e5h" minSize={40} maxSize={90} />
            </Stage>
          ),
        },
        {
          id: 'cronometro',
          profundidad: 1,
          principal: true,
          contenido: (
            <Stage>
              <g transform={`translate(540 1090) scale(${sw}) rotate(${osc(f, 90, 1.5)}) translate(-540 -1090)`}>
                <Stopwatch x={540} y={1090} r={300} seconds={seconds} progress={prog} press={press} />
              </g>
            </Stage>
          ),
        },
        {
          id: 'llamas',
          profundidad: 1.3,
          contenido: (
            <Stage>
              <Flame x={140 + osc(f, 50, 10)} y={1540} size={110 * pop(f, s(1.5))} seed={31} />
              <Flame x={950 + osc(f, 46, 10, 2)} y={1500} size={120 * pop(f, s(1.8))} seed={32} />
              <Flame x={210} y={860} size={70 * pop(f, s(2.4))} seed={33} />
              <Flame x={880} y={820} size={80 * pop(f, s(2.7))} seed={34} />
              <g transform={`translate(${190} ${1660})`}>
                <Heart x={0} y={0} size={110 * pop(f, s(0.3))} beat />
              </g>
            </Stage>
          ),
        },
        {
          id: 'hud',
          hud: true,
          contenido: (
            <>
              <Counter x={540} y={545} value={kcal} scale={0.86 * pop(f, 8)} />
              <Counter
                x={540}
                y={1590}
                value={0}
                text={`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}
                color="verde"
                icon="ninguno"
                unit={ROTULOS.cronometro.etiqueta}
                scale={0.7 * pop(f, s(0.6))}
              />
              <Pill x={540} y={1770} text={ROTULOS.cronometro.ritmo} appear={pop(f, s(1.8))} color="#ffd84a" size={44} />
            </>
          ),
        },
      ]}
    />
  );
};
