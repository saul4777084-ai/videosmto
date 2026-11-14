import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Clip';
import {Bedroom} from '../sets/Bedroom';
import {Counter} from '../components/Counter';
import {CONTADORES} from '../config/contadores';
import {ESCENAS} from '../config/escenas';
import {pop, s, tween} from '../lib/anim';

/** ESCENA 1 — Introducción: pareja bajo la manta, contador subiendo. */
export const Escena1Intro: React.FC = () => {
  const f = useCurrentFrame();
  const kcal = tween(f, [s(0.8), s(ESCENAS.intro.fin - ESCENAS.intro.inicio) - s(0.3)], [CONTADORES.intro.desde, CONTADORES.intro.hasta], (t) => t);
  const a = pop(f, s(0.6), 16);
  return (
    <AbsoluteFill>
      <Stage>
        <Bedroom modo="despiertos" movimiento={1.1} reloj={(fr) => 23 * 60 + fr * 0.35} idPrefix="e1" />
      </Stage>
      <Counter x={540} y={545} value={kcal} scale={a * 0.92} />
    </AbsoluteFill>
  );
};
