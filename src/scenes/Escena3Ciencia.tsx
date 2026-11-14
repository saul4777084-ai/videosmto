import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Clip, Stage} from '../components/Clip';
import {Camara, useConfigCamara} from '../camera/Camara';
import {capasHabitacion, vinetaHabitacion} from '../sets/BedroomCapas';
import {GridBackground, CanadaFlag, PointingArm} from '../sets/Science';
import {Counter} from '../components/Counter';
import {Pill} from '../components/Subtitles';
import {CONTADORES} from '../config/contadores';
import {ESCENAS} from '../config/escenas';
import {ROTULOS} from '../config/textos';
import {osc, pop, s, tween} from '../lib/anim';

const DUR = s(ESCENAS.ciencia.fin - ESCENAS.ciencia.inicio) + 14;
const HAB = s(ESCENAS.ciencia.tomas.habitacion);

const Estudio: React.FC = () => {
  const f = useCurrentFrame();
  const flagIn = tween(f, [6, 36], [0, 1], Easing.out(Easing.back(1.4)));
  const armX = tween(f, [s(0.8), s(1.8)], [-500, 0], Easing.out(Easing.cubic));
  const C = ROTULOS.ciencia;
  return (
    <Camara
      plano="ciencia"
      capas={[
        {id: 'fondo', profundidad: 0.3, cubrir: true, contenido: <Stage><GridBackground idPrefix="e3" /></Stage>},
        {
          id: 'bandera',
          profundidad: 0.95,
          contenido: (
            <>
              <Stage>
                <g transform={`translate(540 860) scale(${flagIn}) translate(-540 -860)`} opacity={flagIn}>
                  <CanadaFlag x={250} y={640} w={600} />
                </g>
              </Stage>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 1015,
                  textAlign: 'center',
                  fontFamily: 'Poppins',
                  fontWeight: 800,
                  fontSize: 92,
                  letterSpacing: 18,
                  color: '#fff',
                  textShadow: '0 0 30px rgba(255,80,90,0.8)',
                  opacity: tween(f, [s(1.2), s(1.8)], [0, 1]),
                  transform: `translateY(${tween(f, [s(1.2), s(1.8)], [30, 0])}px)`,
                }}
              >
                {C.pais.split('').map((ch, i) => (
                  <span key={i} style={{opacity: tween(f, [s(1.2) + i * 3, s(1.2) + i * 3 + 6], [0, 1])}}>
                    {ch}
                  </span>
                ))}
              </div>
            </>
          ),
        },
        {
          id: 'tarjetas',
          profundidad: 1.1,
          contenido: (
            <>
              {C.tarjetas.map((t, i) => (
                <Pill key={t} x={i === 1 ? 600 : 560} y={1300 + i * 140} text={t} appear={pop(f, s(1.8) + i * s(0.8))} color={['#ffd84a', '#5dd8ff', '#ff7ab8'][i]} size={46} />
              ))}
            </>
          ),
        },
        {
          id: 'brazo',
          profundidad: 1.3,
          contenido: (
            <Stage>
              <g transform={`translate(${armX} ${osc(f, 60, 10)})`}>
                <PointingArm x={300} y={1080} angle={-38} />
              </g>
            </Stage>
          ),
        },
      ]}
    />
  );
};

const PasoDelTiempo: React.FC = () => {
  const f = useCurrentFrame();
  const len = DUR - HAB;
  const dia = tween(f, [s(0.4), len - s(0.8)], [CONTADORES.cienciaDias.desde, CONTADORES.cienciaDias.hasta], (t) => t);
  const kcal = tween(f, [s(1.6), len - s(0.6)], [CONTADORES.cienciaKcal.desde, CONTADORES.cienciaKcal.hasta], Easing.out(Easing.quad));
  return (
    <Camara
      plano="cienciaHabitacion"
      capas={[
        ...capasHabitacion({modo: 'dormidos', movimiento: 0.3, corazones: false, llamas: false, reloj: (fr) => 22 * 60 + fr * 9, idPrefix: 'e3b'}),
        {
          id: 'hud',
          hud: true,
          contenido: (
            <>
              <Counter x={330} y={545} value={dia} digits={2} color="azul" icon="reloj" unit="" label={ROTULOS.ciencia.dias} scale={0.8 * pop(f, 4)} />
              <Counter x={770} y={545} value={kcal} digits={3} color="rojo" scale={0.72 * pop(f, s(1.4))} />
            </>
          ),
        },
      ]}
      superposicion={vinetaHabitacion('e3b')}
    />
  );
};

/** ESCENA 3 — Explicación científica y paso del tiempo. */
export const Escena3Ciencia: React.FC = () => {
  const tr = useConfigCamara().transiciones.cienciaHabitacion;
  return (
    <AbsoluteFill>
      <Clip from={0} dur={HAB + 14} fadeIn={0} salida={tr}>
        <Estudio />
      </Clip>
      <Clip from={HAB} dur={DUR - HAB} fadeIn={14} fadeOut={0} entrada={tr}>
        <PasoDelTiempo />
      </Clip>
    </AbsoluteFill>
  );
};
