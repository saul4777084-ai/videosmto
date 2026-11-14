import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Clip, Stage} from '../components/Clip';
import {TableBackground, Plate, FriedEgg, Toast} from '../sets/Table';
import {GymBackground} from '../sets/Gym';
import {Runner, Treadmill} from '../characters/Runner';
import {Counter} from '../components/Counter';
import {Pill} from '../components/Subtitles';
import {Flame} from '../components/Flame';
import {Camara, useConfigCamara} from '../camera/Camara';
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
  const vA = tween(f, [s(0.5), s(2.0)], [0, CONTADORES.platoAzul], Easing.out(Easing.cubic));
  const vR = tween(f, [s(3.7), s(5.0)], [0, CONTADORES.platoRosa], Easing.out(Easing.cubic));
  const R = ROTULOS.comida;
  // cada plato es una capa con su contador: el rack focus pasa de uno a otro
  return (
    <Camara
      plano="comida"
      capas={[
        {id: 'mesa', profundidad: 0.4, cubrir: true, contenido: <Stage><TableBackground /></Stage>},
        {
          id: 'platoAzul',
          profundidad: 1,
          contenido: (
            <>
              <Stage>
                <g transform={`translate(${inL} 0)`}>
                  <Plate x={290} y={1300} scale={1.05}>
                    <Toast />
                  </Plate>
                </g>
              </Stage>
              <Counter x={290 + inL} y={930 + osc(f, 60, 6)} value={vA} color="azul" label={R.azul} scale={0.74 * pop(f, s(0.4))} />
              <Pill x={290} y={1500} text={R.platoAzul} appear={pop(f, s(2.8))} color="#3fc3ff" size={40} />
            </>
          ),
        },
        {
          id: 'platoRosa',
          profundidad: 1.25,
          contenido: (
            <>
              <Stage>
                <g transform={`translate(${inR} 0)`}>
                  <Plate x={800} y={1360} scale={1.05}>
                    <FriedEgg />
                  </Plate>
                </g>
              </Stage>
              <Counter x={800 + inR} y={990 + osc(f, 60, 6, 1)} value={vR} color="rosa" label={R.rosa} digits={2} scale={0.74 * pop(f, s(3.6))} />
              <Pill x={700} y={1515} text={R.platoRosa} appear={pop(f, s(6.0))} color="#ff5fb0" size={40} />
            </>
          ),
        },
      ]}
    />
  );
};

const CintaPiernas: React.FC = () => {
  const f = useCurrentFrame();
  const len = DUR - CINTA;
  const kcal = tween(f, [s(0.3), len - s(0.6)], [CONTADORES.cinta.desde, CONTADORES.cinta.hasta], (t) => t);
  return (
    <Camara
      plano="comidaCinta"
      capas={[
        {id: 'fondo', profundidad: 0.35, cubrir: true, contenido: <Stage><GymBackground /></Stage>},
        {
          id: 'cinta',
          profundidad: 1,
          principal: true,
          contenido: (
            <Stage>
              {/* plano cerrado de las piernas sobre la cinta */}
              <g transform="translate(560 1830) scale(2.3)">
                <Treadmill x={0} y={0} speed={12} />
                <Runner x={-10} y={-215} who="el" period={16} />
              </g>
            </Stage>
          ),
        },
        {
          id: 'llamas',
          profundidad: 1.4,
          contenido: (
            <Stage>
              <Flame x={160} y={1150 + osc(f, 30, 10)} size={90} seed={21} />
              <Flame x={930} y={1050 + osc(f, 34, 10, 1)} size={110} seed={22} />
            </Stage>
          ),
        },
        {
          id: 'hud',
          hud: true,
          contenido: (
            <>
              <Counter x={540} y={500} value={kcal} scale={0.85 * pop(f, 6)} />
              <Pill x={540} y={648} text={ROTULOS.comida.cinta} appear={pop(f, s(0.6))} color="#5dd8ff" size={38} />
            </>
          ),
        },
      ]}
    />
  );
};

/** ESCENA 4 — Comparación de calorías con comida y con la cinta. */
export const Escena4Comida: React.FC = () => {
  const tr = useConfigCamara().transiciones.comidaCinta;
  return (
    <AbsoluteFill>
      <Clip from={0} dur={CINTA + 14} fadeIn={0} salida={tr}>
        <Platos />
      </Clip>
      <Clip from={CINTA} dur={DUR - CINTA} fadeIn={14} fadeOut={0} entrada={tr}>
        <CintaPiernas />
      </Clip>
    </AbsoluteFill>
  );
};
