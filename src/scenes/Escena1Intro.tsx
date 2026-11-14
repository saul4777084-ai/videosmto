import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Counter} from '../components/Counter';
import {Camara} from '../camera/Camara';
import {capasHabitacion, vinetaHabitacion} from '../sets/BedroomCapas';
import {CONTADORES} from '../config/contadores';
import {ESCENAS} from '../config/escenas';
import {pop, s, tween} from '../lib/anim';

/** ESCENA 1 — Introducción: pareja bajo la manta, contador subiendo. */
export const Escena1Intro: React.FC = () => {
  const f = useCurrentFrame();
  const kcal = tween(f, [s(0.8), s(ESCENAS.intro.fin - ESCENAS.intro.inicio) - s(0.3)], [CONTADORES.intro.desde, CONTADORES.intro.hasta], (t) => t);
  const a = pop(f, s(0.6), 16);
  return (
    <Camara
      plano="intro"
      capas={[
        ...capasHabitacion({modo: 'despiertos', movimiento: 1.1, reloj: (fr) => 23 * 60 + fr * 0.35, idPrefix: 'e1'}),
        {id: 'hud', hud: true, contenido: <Counter x={540} y={545} value={kcal} scale={a * 0.92} />},
      ]}
      superposicion={vinetaHabitacion('e1')}
    />
  );
};
