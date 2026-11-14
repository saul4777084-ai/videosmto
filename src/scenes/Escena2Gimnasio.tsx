import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Clip, Stage} from '../components/Clip';
import {GymBackground, GymRunners} from '../sets/Gym';
import {Counter} from '../components/Counter';
import {Pill} from '../components/Subtitles';
import {Camara, useConfigCamara} from '../camera/Camara';
import {capasHabitacion, vinetaHabitacion} from '../sets/BedroomCapas';
import {CONTADORES} from '../config/contadores';
import {ESCENAS} from '../config/escenas';
import {ROTULOS} from '../config/textos';
import {pop, s, tween} from '../lib/anim';

const DUR = s(ESCENAS.gimnasio.fin - ESCENAS.gimnasio.inicio) + 14;
const VUELTA = s(ESCENAS.gimnasio.tomas.vueltaHabitacion);

const Gym: React.FC = () => {
  const f = useCurrentFrame();
  const kcal = tween(f, [s(0.5), VUELTA], [CONTADORES.gimnasio.desde, CONTADORES.gimnasio.hasta], (t) => t);
  return (
    <Camara
      plano="gimnasio"
      capas={[
        {id: 'fondo', profundidad: 0.35, cubrir: true, contenido: <Stage><GymBackground /></Stage>},
        {id: 'ella', profundidad: 0.85, contenido: <Stage><GymRunners solo="ella" /></Stage>},
        {id: 'el', profundidad: 1.15, principal: true, contenido: <Stage><GymRunners solo="el" /></Stage>},
        {
          id: 'hud',
          hud: true,
          contenido: (
            <>
              <Counter x={540} y={545} value={kcal} scale={0.92 * pop(f, 8)} />
              <Pill x={540} y={705} text={ROTULOS.gimnasio} appear={pop(f, s(1.2))} color="#5dd8ff" size={38} />
            </>
          ),
        },
      ]}
    />
  );
};

const VueltaHabitacion: React.FC = () => {
  const f = useCurrentFrame();
  const kcal = tween(f, [0, s(2)], [CONTADORES.gimnasioVuelta.desde, CONTADORES.gimnasioVuelta.hasta], (t) => t);
  return (
    <Camara
      plano="gimnasioVuelta"
      capas={[
        ...capasHabitacion({modo: 'despiertos', movimiento: 1, reloj: (fr) => 23 * 60 + 40 + fr * 0.4, idPrefix: 'e2'}),
        {id: 'hud', hud: true, contenido: <Counter x={540} y={545} value={kcal} scale={0.92} />},
      ]}
      superposicion={vinetaHabitacion('e2')}
    />
  );
};

/** ESCENA 2 — Comparación con el gimnasio y vuelta a la habitación. */
export const Escena2Gimnasio: React.FC = () => {
  const tr = useConfigCamara().transiciones.gimnasioVuelta;
  return (
    <AbsoluteFill>
      <Clip from={0} dur={VUELTA + 14} fadeIn={0} salida={tr}>
        <Gym />
      </Clip>
      <Clip from={VUELTA} dur={DUR - VUELTA} fadeIn={14} fadeOut={0} entrada={tr}>
        <VueltaHabitacion />
      </Clip>
    </AbsoluteFill>
  );
};
