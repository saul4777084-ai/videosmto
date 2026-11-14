import React from 'react';
import {Stage} from '../components/Clip';
import {Bedroom, BedroomProps} from './Bedroom';
import type {Capa} from '../camera/Camara';

/** Capas estándar de la habitación: pared al fondo, pareja, pie de cama delante. */
export const capasHabitacion = (props: BedroomProps): Capa[] => [
  {id: 'fondo', profundidad: 0.45, cubrir: true, contenido: <Stage><Bedroom {...props} capa="fondo" /></Stage>},
  {id: 'pareja', profundidad: 1, principal: true, contenido: <Stage><Bedroom {...props} capa="pareja" /></Stage>},
  {id: 'frente', profundidad: 1.25, contenido: <Stage><Bedroom {...props} capa="frente" /></Stage>},
];
export const vinetaHabitacion = (idPrefix: string) => (
  <Stage>
    <Bedroom capa="vineta" idPrefix={idPrefix} />
  </Stage>
);
