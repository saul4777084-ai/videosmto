import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Clip, Stage} from '../components/Clip';
import {TableBackground, Plate, FriedEgg, Toast} from '../sets/Table';
import {GymBackground} from '../sets/Gym';
import {Runner, Treadmill} from '../characters/Runner';
import {Counter} from '../components/Counter';
import {Pill} from '../components/Subtitles';
import {Flame} from '../components/Flame';
import {CONTADORES} from '../config/contadores';
import {ESCENAS} from '../config/escenas';
import {ROTULOS} from '../config/textos';
import {osc, pop, s, tween} from '../lib/anim';

const DUR = s(ESCENAS.comida.fin - ESCENAS.comida.inicio) + 14;
const CINTA = s(ESCENAS.comida.tomas.cinta);

const Platos: React.FC = () => {
  const f = useCurrentFrame();
  const inL = tween(f, [4, 30], [-700, 0], Easing.out(Easing.back(1.2)));
  const inR = tween(f, [12, 38], [700, 0], Easing.out(Easing.back(1.2)));
  const vA = tween(f, [s(0.9), s(2.6)], [0, CONTADORES.platoAzul], Easing.out(Easing.cubic));
  const vR = tween(f, [s(1.3), s(3.0)], [0, CONTADORES.platoRosa], Easing.out(Easing.cubic));
  const R = ROTULOS.comida;
  return (
    <AbsoluteFill>
      <Stage>
        <TableBackground />
        <g transform={`translate(${inL} 0)`}>
          <Plate x={290} y={1300} scale={1.05}>
            <Toast />
          </Plate>
        </g>
        <g transform={`translate(${inR} 0)`}>
          <Plate x={800} y={1360} scale={1.05}>
            <FriedEgg />
          </Plate>
        </g>
      </Stage>
      <Counter x={290 + inL} y={930 + osc(f, 60, 6)} value={vA} color="azul" label={R.azul} scale={0.74 * pop(f, s(0.8))} />
      <Counter x={800 + inR} y={990 + osc(f, 60, 6, 1)} value={vR} color="rosa" label={R.rosa} digits={2} scale={0.74 * pop(f, s(1.2))} />
      <Pill x={290} y={1500} text={R.platoAzul} appear={pop(f, s(3.6))} color="#3fc3ff" size={40} />
      <Pill x={800} y={1560} text={R.platoRosa} appear={pop(f, s(4.2))} color="#ff5fb0" size={40} />
    </AbsoluteFill>
  );
};

const CintaPiernas: React.FC = () => {
  const f = useCurrentFrame();
  const len = DUR - CINTA;
  const kcal = tween(f, [s(0.3), len - s(0.6)], [CONTADORES.cinta.desde, CONTADORES.cinta.hasta], (t) => t);
  return (
    <AbsoluteFill>
      <Stage>
        <GymBackground />
        {/* plano cerrado de las piernas sobre la cinta */}
        <g transform="translate(560 1830) scale(2.3)">
          <Treadmill x={0} y={0} speed={12} />
          <Runner x={-10} y={-215} who="el" period={16} />
        </g>
        <Flame x={160} y={1150 + osc(f, 30, 10)} size={90} seed={21} />
        <Flame x={930} y={1050 + osc(f, 34, 10, 1)} size={110} seed={22} />
      </Stage>
      <Counter x={540} y={500} value={kcal} scale={0.85 * pop(f, 6)} />
      <Pill x={540} y={648} text={ROTULOS.comida.cinta} appear={pop(f, s(0.6))} color="#5dd8ff" size={38} />
    </AbsoluteFill>
  );
};

/** ESCENA 4 — Comparación de calorías con comida y con la cinta. */
export const Escena4Comida: React.FC = () => (
  <AbsoluteFill>
    <Clip from={0} dur={CINTA + 14} fadeIn={0} zoom={[1.0, 1.07]} origin="50% 60%">
      <Platos />
    </Clip>
    <Clip from={CINTA} dur={DUR - CINTA} fadeIn={14} fadeOut={0} zoom={[1.0, 1.1]} pan={[0, 0, 0, -40]} origin="50% 75%">
      <CintaPiernas />
    </Clip>
  </AbsoluteFill>
);
