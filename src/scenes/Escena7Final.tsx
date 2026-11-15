import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Clip';
import {capasHabitacion, vinetaHabitacion} from '../sets/BedroomCapas';
import {Camara} from '../camera/Camara';
import {Counter} from '../components/Counter';
import {FloatingHearts} from '../components/Heart';
import {CONTADORES} from '../config/contadores';
import {ESCENAS} from '../config/escenas';
import {ROTULOS} from '../config/textos';
import {pop, s, tween} from '../lib/anim';

const LEN = s(ESCENAS.final.fin - ESCENAS.final.inicio);
const CIERRE = s(ESCENAS.final.tomas.cierre);

/** ESCENA 7 — Conclusión: resultados finales y salida suave. */
export const Escena7Final: React.FC = () => {
  const f = useCurrentFrame();
  const F = ROTULOS.final;
  const el = tween(f, [s(0.3), s(1.8)], [0, CONTADORES.final.el], Easing.out(Easing.cubic));
  const ella = tween(f, [s(0.5), s(2.0)], [0, CONTADORES.final.ella], Easing.out(Easing.cubic));
  // contadores se juntan en el total justo cuando la voz dice "170 calorías"
  const merge = tween(f, [s(1.5), s(2.1)], [0, 1], Easing.inOut(Easing.cubic));
  const total = pop(f, s(2.05), 18);
  const totalVal = tween(f, [s(2.05), s(3.1)], [0, CONTADORES.final.el + CONTADORES.final.ella], Easing.out(Easing.cubic));
  const dim = tween(f, [CIERRE - 10, CIERRE + 10], [0, 0.55]);
  const t1 = pop(f, CIERRE + 4, 18);
  const t2 = pop(f, s(4.25), 20);
  const fadeOut = interpolate(f, [LEN - 22, LEN], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Camara
        plano="final"
        capas={[
          ...capasHabitacion({modo: 'despiertos', movimiento: 0.8, reloj: (fr) => 23 * 60 + 55 + fr * 0.05, idPrefix: 'e7'}),
          {
            id: 'corazones',
            profundidad: 1.1,
            contenido: (
              <Stage>
                <FloatingHearts count={10} area={[200, 1150, 880, 1350]} rise={700} seed="e7h" start={s(2.05)} />
              </Stage>
            ),
          },
          {
            id: 'hud',
            hud: true,
            contenido: (
              <>
                <Counter x={300 + merge * 240} y={545} value={el} color="azul" label={F.el} scale={0.7 * pop(f, 6) * (1 - merge)} opacity={1 - merge} />
                <Counter x={790 - merge * 250} y={545} value={ella} digits={2} color="rosa" label={F.ella} scale={0.7 * pop(f, 12) * (1 - merge)} opacity={1 - merge} />
                {f >= s(2.05) && <Counter x={540} y={545} value={totalVal} color="rojo" label="TOTAL" scale={0.95 * total} />}
              </>
            ),
          },
        ]}
        superposicion={vinetaHabitacion('e7')}
      />
      <AbsoluteFill style={{background: '#0a0616', opacity: dim}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1000, textAlign: 'center', fontFamily: 'Poppins'}}>
        <div style={{fontWeight: 700, fontSize: 58, color: '#fff', opacity: t1, transform: `scale(${t1})`, textShadow: '0 6px 20px rgba(0,0,0,0.7)'}}>{F.cierre}</div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 26,
            padding: '10px 40px',
            borderRadius: 24,
            fontWeight: 800,
            fontSize: 104,
            color: '#ffd84a',
            border: '6px solid #ffd84a',
            background: 'rgba(40,24,70,0.75)',
            boxShadow: '0 0 40px rgba(255,216,74,0.55)',
            opacity: Math.min(1, t2 * 1.5),
            transform: `scale(${t2}) rotate(${(1 - t2) * -8}deg)`,
          }}
        >
          {F.cierre2}
        </div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fadeOut}} />
    </AbsoluteFill>
  );
};
