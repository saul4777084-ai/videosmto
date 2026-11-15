import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Clip, Stage} from '../../components/Clip';
import {Camara, useConfigCamara} from '../../camera/Camara';
import {TableBackground} from '../../sets/Table';
import {Heart} from '../../components/Heart';
import {pop, osc, rnd, s, tween} from '../../lib/anim';
import {ESCENAS_SUENO, EscenaSueno} from './config';
import {Insomne, InsomneProps} from './Insomne';
import {CuartoOscuro, Dormitorio, Escritorio, FondoCuerpo, FondoSepia} from './sets';
import {
  Bocadillo,
  Calendario,
  Cerebro,
  Donut,
  Escudo,
  Hamburguesa,
  Interrogacion,
  Luna,
  OjoFlotante,
  Patatas,
  PiezaPuzzle,
  Rayo,
  Refresco,
  SiluetaFoto,
  Sombra,
  Taza,
  Vaso,
  Virus,
} from './objetos';
import {Alucinacion, Glitch, Medidor, microsueno, Parpados, TituloDia, VinetaAlerta} from './efectos';

const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OV = 12;

/** Segundo absoluto del vídeo dentro de una escena/toma. */
const useAbs = (e: EscenaSueno, desde = 0) => ESCENAS_SUENO[e].inicio + desde + useCurrentFrame() / 30;
/** Aparición con rebote a partir de un segundo absoluto. */
const popA = (abs: number, en: number, dur = 0.45) => interpolate(abs, [en, en + dur], [0, 1], {...cl, easing: Easing.out(Easing.back(1.8))});
const entre = (abs: number, a: number, b: number, fade = 0.25) => Math.min(interpolate(abs, [a, a + fade], [0, 1], cl), interpolate(abs, [b - fade, b], [1, 0], cl));

const Personaje: React.FC<{x: number; y: number; esc: number} & InsomneProps> = ({x, y, esc, ...p}) => (
  <Stage>
    <g transform={`translate(${x} ${y}) scale(${esc})`}>
      <Insomne {...p} />
    </g>
  </Stage>
);

const largo = (e: EscenaSueno) => ESCENAS_SUENO[e].fin - ESCENAS_SUENO[e].inicio;

/* ============================================================ 1 · GANCHO */
export const SGancho: React.FC = () => {
  const t = useAbs('gancho');
  const minutos = 22 * 60 + 40 + 520 * Math.pow(t / 7.2, 2.6);
  const titulo = entre(t, 0.05, 2.85, 0.3);
  return (
    <Camara
      plano="gancho"
      capas={[
        {id: 'fondo', profundidad: 0.45, cubrir: true, contenido: <Stage><Dormitorio capa="fondo" minutos={minutos} id="g" /></Stage>},
        {
          id: 'insomne',
          profundidad: 1,
          principal: true,
          contenido: <Personaje x={540} y={1500} esc={1.25} cansancio={0.08} ojos={1} miradaX={0.45} miradaY={-0.55} boca="neutra" cejas={0.3} semilla={1} />,
        },
        {id: 'frente', profundidad: 1.2, contenido: <Stage><Dormitorio capa="frente" luzMovil={0.8 + osc(t * 30, 20, 0.2)} id="g" /></Stage>},
        {
          id: 'hud',
          hud: true,
          contenido: (
            <>
              <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', opacity: titulo, transform: `scale(${0.85 + 0.15 * popA(t, 0.05, 0.6)})`}}>
                <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 64, color: '#fff', lineHeight: 1.1, textShadow: '0 6px 24px rgba(0,0,0,0.8)'}}>
                  ¿QUÉ PASARÍA SI
                  <br />
                  DEJARAS DE DORMIR
                </div>
                <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 150, color: '#ffd84a', WebkitTextStroke: '4px #1a1030', textShadow: '0 0 40px rgba(255,216,74,0.6)', transform: `scale(${popA(t, 1.75, 0.5)})`}}>
                  7 DÍAS?
                </div>
              </div>
              {/* "día a día": siete hojas de calendario */}
              {[1, 2, 3, 4, 5, 6, 7].map((d, i) => {
                const a = popA(t, 3.6 + i * 0.22, 0.4) * entre(t, 3.5, 6.0, 0.3);
                return (
                  <svg key={d} viewBox="-130 -150 260 290" width={136} height={152} style={{position: 'absolute', left: 540 - 4 * 142 + (i + 0.5) * 142 - 68, top: 720, transform: `scale(${a}) rotate(${(1 - a) * 20}deg)`, opacity: Math.min(1, a * 1.5)}}>
                    <Calendario dia={d} color={i < 6 ? '#3f5aa6' : '#e8343c'} />
                  </svg>
                );
              })}
            </>
          ),
        },
      ]}
    />
  );
};

/* ============================================================ 2 · DÍA 1 */
const D1Escritorio: React.FC = () => {
  const t = useAbs('dia1');
  const reflejos = interpolate(t, [10.4, 11.9], [1, 0.58], {...cl, easing: Easing.inOut(Easing.cubic)});
  return (
    <Camara
      plano="dia1"
      capas={[
        {id: 'fondo', profundidad: 0.4, cubrir: true, contenido: <Stage><Escritorio capa="fondo" id="d1" /></Stage>},
        {
          id: 'insomne',
          profundidad: 1,
          principal: true,
          contenido: <Personaje x={540} y={1560} esc={1.2} cansancio={0.3} ojos={0.95} miradaY={0.35} boca={t > 10.5 ? 'preocupada' : 'neutra'} semilla={2} />,
        },
        {
          id: 'mesa',
          profundidad: 1.2,
          contenido: (
            <Stage>
              <Escritorio capa="frente" id="d1" />
              <g transform={`translate(210 ${1300}) scale(0.85)`}>
                <Taza />
              </g>
              <g transform={`translate(860 1300) scale(${0.85 * popA(t, 11.75, 0.5)})`}>
                <Vaso nivel={0.65} />
              </g>
            </Stage>
          ),
        },
        {
          id: 'hud',
          hud: true,
          contenido: (
            <>
              <TituloDia texto="DÍA 1" sub="24 horas despierto" inicio={0} dur={1.25} />
              <Medidor x={540} y={800} valor={reflejos} etiqueta="REFLEJOS" color={reflejos < 0.75 ? '#ff5a3c' : '#5dff9c'} aparicion={entre(t, 10.25, 12.75, 0.3)} />
            </>
          ),
        },
      ]}
    />
  );
};

const D1Microsuenos: React.FC = () => {
  const t = useAbs('dia1', ESCENAS_SUENO.dia1.tomas.microsuenos);
  const cierre = Math.max(microsueno(t, 13.75, 0.3, 0.3, 0.35), microsueno(t, 14.95, 0.25, 0.35, 0.3), microsueno(t, 15.62, 0.15, 0.18, 0.2));
  const cab = Math.max(0, cierre) * 0.9 + Math.max(0, osc(t * 30, 40, 0.15));
  return (
    <AbsoluteFill>
      <Camara
        plano="dia1Micro"
        capas={[
          {id: 'fondo', profundidad: 0.4, cubrir: true, contenido: <Stage><Escritorio capa="fondo" id="d1b" /></Stage>},
          {
            id: 'insomne',
            profundidad: 1,
            principal: true,
            contenido: <Personaje x={540} y={1560} esc={1.2} cansancio={0.42} ojos={1 - cierre} cabeceo={cab} boca={cierre > 0.5 ? 'dormido' : 'neutra'} parpadeo={false} semilla={2} />,
          },
          {id: 'mesa', profundidad: 1.2, contenido: <Stage><Escritorio capa="frente" brilloMonitor={1 - cierre * 0.6} id="d1b" /></Stage>},
        ]}
      />
      <Parpados cierre={cierre} />
    </AbsoluteFill>
  );
};

export const SDia1: React.FC = () => {
  const tr = useConfigCamara().transiciones.dia1Micro;
  const corte = s(ESCENAS_SUENO.dia1.tomas.microsuenos);
  const dur = s(largo('dia1')) + OV;
  return (
    <AbsoluteFill>
      <Clip from={0} dur={corte + OV} fadeIn={0} salida={tr}>
        <D1Escritorio />
      </Clip>
      <Clip from={corte} dur={dur - corte} fadeIn={OV} fadeOut={0} entrada={tr}>
        <D1Microsuenos />
      </Clip>
    </AbsoluteFill>
  );
};

/* ============================================================ 3 · DÍA 2 */
const D2Defensas: React.FC = () => {
  const t = useAbs('dia2');
  const grieta = interpolate(t, [18.75, 19.7], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const hambre = interpolate(t, [19.5, 20.7], [0.3, 0.97], {...cl, easing: Easing.out(Easing.cubic)});
  const viruses = [
    [120, 620, 1],
    [930, 700, 2],
    [80, 1150, 3],
    [990, 1180, 4],
    [560, 520, 5],
  ];
  return (
    <Camara
      plano="dia2"
      capas={[
        {id: 'fondo', profundidad: 0.35, cubrir: true, contenido: <Stage><FondoCuerpo id="d2" /></Stage>},
        {
          id: 'virus',
          profundidad: 0.75,
          contenido: (
            <Stage>
              {viruses.map(([x, y, k]) => {
                const acerca = interpolate(t, [17.6, 19.8], [0, 0.55], cl);
                const vx = x + (300 - x) * acerca + osc(t * 30, 40 + k * 7, 14, k);
                const vy = y + (980 - y) * acerca + osc(t * 30, 46 + k * 5, 14, k);
                return (
                  <g key={k} transform={`translate(${vx} ${vy}) scale(${popA(t, 17.5 + k * 0.12)})`}>
                    <Virus r={34 + (k % 3) * 8} />
                  </g>
                );
              })}
            </Stage>
          ),
        },
        {
          id: 'insomne',
          profundidad: 1,
          principal: true,
          contenido: <Personaje x={540} y={1780} esc={1.1} cansancio={0.5} ojos={0.9} miradaX={-0.4} boca={t > 19.4 ? 'abierta' : 'preocupada'} cejas={0.7} semilla={3} />,
        },
        {
          id: 'escudo',
          profundidad: 1.2,
          contenido: (
            <Stage>
              <g transform={`translate(${300 + (grieta > 0.3 ? (rnd(Math.floor(t * 30)) - 0.5) * 8 * (1 - grieta) : 0)} 980) scale(${1.25 * popA(t, 17.95, 0.5)})`}>
                <Escudo grieta={grieta} />
              </g>
            </Stage>
          ),
        },
        {
          id: 'hud',
          hud: true,
          contenido: (
            <>
              <TituloDia texto="DÍA 2" sub="48 horas" inicio={0} dur={1.05} />
              <Medidor x={700} y={760} ancho={460} valor={hambre} etiqueta="HAMBRE" color="#ffa53c" aparicion={entre(t, 19.4, 21.4, 0.25)} />
            </>
          ),
        },
      ]}
    />
  );
};

const D2Comida: React.FC = () => {
  const t = useAbs('dia2', ESCENAS_SUENO.dia2.tomas.comida);
  const comidas: [React.FC, number, number, number][] = [
    [Donut, 200, 1500, 21.4],
    [Hamburguesa, 445, 1530, 21.75],
    [Patatas, 690, 1460, 22.1],
    [Refresco, 905, 1470, 22.45],
  ];
  const masca = t > 22.6 && Math.floor(t * 6) % 2 === 0;
  return (
    <Camara
      plano="dia2Comida"
      capas={[
        {id: 'fondo', profundidad: 0.4, cubrir: true, contenido: <Stage><TableBackground /></Stage>},
        {
          id: 'insomne',
          profundidad: 1,
          principal: true,
          contenido: <Personaje x={540} y={1330} esc={0.95} cansancio={0.55} ojos={1} pupilas={0.6} miradaY={0.6} boca={masca ? 'mordida' : 'abierta'} cejas={-0.2} semilla={3} />,
        },
        {
          id: 'comida',
          profundidad: 1.25,
          contenido: (
            <Stage>
              <rect x={-60} y={1370} width={1200} height={620} fill="#7a4628" />
              <rect x={-60} y={1370} width={1200} height={24} fill="#a8693f" />
              {comidas.map(([C, x, y, en], i) => {
                const caida = interpolate(t, [en, en + 0.35], [-900, 0], {...cl, easing: Easing.out(Easing.bounce)});
                return (
                  <g key={i} transform={`translate(${x} ${y + caida}) scale(0.9)`}>
                    <C />
                  </g>
                );
              })}
              <g transform={`translate(540 ${800 + osc(t * 30, 20, 8)}) scale(${0.9 * popA(t, 23.0, 0.4)})`} opacity={entre(t, 22.95, 24.4)}>
                <Rayo />
              </g>
            </Stage>
          ),
        },
      ]}
    />
  );
};

export const SDia2: React.FC = () => {
  const tr = useConfigCamara().transiciones.dia2Comida;
  const corte = s(ESCENAS_SUENO.dia2.tomas.comida);
  const dur = s(largo('dia2')) + OV;
  return (
    <AbsoluteFill>
      <Clip from={0} dur={corte + OV} fadeIn={0} salida={tr}>
        <D2Defensas />
      </Clip>
      <Clip from={corte} dur={dur - corte} fadeIn={OV} fadeOut={0} entrada={tr}>
        <D2Comida />
      </Clip>
    </AbsoluteFill>
  );
};

/* ============================================================ 4 · DÍA 3 */
const D3Mente: React.FC = () => {
  const t = useAbs('dia3');
  const habla = entre(t, 25.6, 26.4, 0.2);
  return (
    <Camara
      plano="dia3"
      capas={[
        {id: 'fondo', profundidad: 0.35, cubrir: true, contenido: <Stage><FondoCuerpo color="#2e1a55" id="d3" /></Stage>},
        {
          id: 'insomne',
          profundidad: 1,
          principal: true,
          contenido: (
            <Personaje
              x={540}
              y={1700}
              esc={1.15}
              cansancio={0.65}
              ojos={0.85}
              miradaX={osc(t * 30, 45, 0.7)}
              miradaY={-0.3}
              boca={t > 26.8 ? 'nerviosa' : 'abierta'}
              cejas={1}
              sudor={t > 26.6}
              semilla={4}
            />
          ),
        },
        {
          id: 'mente',
          profundidad: 1.15,
          contenido: (
            <Stage>
              {/* hablar: letras revueltas */}
              <g transform={`translate(560 ${930}) scale(${popA(t, 25.6, 0.35)})`} opacity={habla}>
                <Bocadillo texto="¿QUÉ DECÍA?" revuelto={interpolate(t, [25.7, 26.2], [0, 1], cl)} />
              </g>
              {/* recordar: piezas que se escapan de la cabeza */}
              {[0, 1, 2, 3, 4].map((k) => {
                const p = interpolate(t, [26.15 + k * 0.1, 27.4 + k * 0.1], [0, 1], cl);
                if (p <= 0 || p >= 1) return null;
                return (
                  <g key={k} transform={`translate(${540 + (k - 2) * 60 + p * (k - 2) * 160} ${1150 - p * 520}) rotate(${p * 200 * (k % 2 ? 1 : -1)}) scale(0.9)`} opacity={1 - p}>
                    <PiezaPuzzle color={['#5dd8ff', '#ffd84a', '#ff5fb0', '#5dff9c', '#ffa53c'][k]} />
                  </g>
                );
              })}
              {/* concentrarse: interrogaciones en órbita */}
              {[0, 1, 2].map((k) => {
                const a = t * 3 + (k * Math.PI * 2) / 3;
                const v = entre(t, 26.85, 27.9, 0.2);
                return (
                  <g key={`q${k}`} transform={`translate(${540 + Math.cos(a) * 260} ${1330 + Math.sin(a) * 90}) scale(${0.7 * v})`}>
                    <Interrogacion />
                  </g>
                );
              })}
            </Stage>
          ),
        },
        {id: 'hud', hud: true, contenido: <TituloDia texto="DÍA 3" sub="72 horas" inicio={0} dur={0.7} />},
      ]}
    />
  );
};

const D3Alucinaciones: React.FC = () => {
  const t = useAbs('dia3', ESCENAS_SUENO.dia3.tomas.alucinaciones);
  const fuerza = interpolate(t, [28.6, 29.4, 31.6], [0, 38, 52], cl);
  const sombra = entre(t, 30.6, 31.75, 0.2);
  const ojos = [
    [170, 520, 1],
    [900, 380, 2],
    [140, 980, 3],
    [960, 900, 4],
    [700, 260, 5],
  ];
  return (
    <Camara
      plano="dia3Aluc"
      capas={[
        {
          id: 'fondo',
          profundidad: 0.45,
          cubrir: true,
          contenido: (
            <Alucinacion fuerza={fuerza}>
              <Stage>
                <Dormitorio capa="fondo" minutos={3 * 60 + 33} id="d3b" />
                {ojos.map(([x, y, k]) => (
                  <g key={k} transform={`translate(${x} ${y}) scale(${popA(t, 29.0 + k * 0.18, 0.5)})`}>
                    <OjoFlotante r={34 + k * 3} semilla={k} />
                  </g>
                ))}
              </Stage>
            </Alucinacion>
          ),
        },
        {
          id: 'sombra',
          profundidad: 0.75,
          contenido: (
            <Stage>
              <g transform={`translate(${860 + osc(t * 30, 50, 10)} 1200)`}>
                <Sombra alto={720} opacidad={sombra} />
              </g>
            </Stage>
          ),
        },
        {
          id: 'insomne',
          profundidad: 1,
          principal: true,
          contenido: (
            <Personaje x={500} y={1650} esc={1.15} cansancio={0.7} ojos={1} pupilas={1} miradaX={t > 30.5 ? 0.85 : osc(t * 30, 30, 0.5)} miradaY={-0.2} boca="abierta" cejas={1} semilla={4} />
          ),
        },
        {id: 'frente', profundidad: 1.2, contenido: <Stage><Dormitorio capa="frente" id="d3b" /></Stage>},
      ]}
    />
  );
};

export const SDia3: React.FC = () => {
  const tr = useConfigCamara().transiciones.dia3Aluc;
  const corte = s(ESCENAS_SUENO.dia3.tomas.alucinaciones);
  const dur = s(largo('dia3')) + OV;
  return (
    <AbsoluteFill>
      <Clip from={0} dur={corte + OV} fadeIn={0} salida={tr}>
        <D3Mente />
      </Clip>
      <Clip from={corte} dur={dur - corte} fadeIn={OV} fadeOut={0} entrada={tr}>
        <D3Alucinaciones />
      </Clip>
    </AbsoluteFill>
  );
};

/* ============================================================ 5 · DÍAS 4 Y 5 */
export const SDia45: React.FC = () => {
  const t = useAbs('dia45');
  const glitch = Math.max(entre(t, 35.63, 35.95, 0.05), entre(t, 36.9, 37.15, 0.05), entre(t, 37.24, 37.6, 0.05), entre(t, 31.9, 32.1, 0.04) * 0.6);
  const doble = interpolate(t, [35.7, 36.4, 37.9], [0, 1, 1], cl);
  const ojos = [
    [120, 420, 1],
    [950, 360, 2],
    [80, 900, 3],
    [1000, 820, 4],
    [260, 650, 5],
    [820, 600, 6],
    [140, 1300, 7],
  ];
  const mirada = Math.sin(t * 9) > 0 ? 0.9 : -0.9;
  const personaje = (dx: number, op: number) => (
    <g opacity={op} transform={`translate(${dx} 0)`}>
      <g transform="translate(540 1640) scale(1.15)">
        <Insomne cansancio={0.82} ojos={0.9} miradaX={mirada} boca="nerviosa" cejas={1} sudor pupilas={0.7} giro={osc(t * 30, 26, 4)} semilla={5} />
      </g>
    </g>
  );
  return (
    <Glitch intensidad={glitch}>
      <Camara
        plano="dia45"
        capas={[
          {
            id: 'fondo',
            profundidad: 0.4,
            cubrir: true,
            escenario: true,
            contenido: (
              <Stage>
                <CuartoOscuro luzPuerta={0.6 + osc(t * 30, 9, 0.3)} id="d45" />
                {ojos.map(([x, y, k]) => (
                  <g key={k} transform={`translate(${x} ${y}) scale(${popA(t, 33.3 + k * 0.15, 0.4)})`}>
                    <OjoFlotante r={26 + (k % 3) * 6} semilla={k + 10} color="#ff3b4f" />
                  </g>
                ))}
              </Stage>
            ),
          },
          {
            id: 'insomne',
            profundidad: 1,
            principal: true,
            contenido: (
              <Stage>
                {/* visión doble: ya no distingue lo real */}
                {doble > 0.01 && personaje(-70 * doble, 0.35 * doble)}
                {doble > 0.01 && personaje(70 * doble, 0.35 * doble)}
                {personaje(0, 1)}
              </Stage>
            ),
          },
          {
            id: 'confusion',
            profundidad: 1.2,
            contenido: (
              <Stage>
                {[0, 1, 2, 3].map((k) => {
                  const a = t * 2.2 + (k * Math.PI) / 2;
                  const v = entre(t, 34.1, 35.7, 0.25);
                  return (
                    <g key={k} transform={`translate(${540 + Math.cos(a) * 330} ${1260 + Math.sin(a) * 140}) rotate(${a * 40}) scale(${0.8 * v})`}>
                      <Interrogacion color={k % 2 ? '#ff5fb0' : '#ffd84a'} />
                    </g>
                  );
                })}
              </Stage>
            ),
          },
          {id: 'hud', hud: true, contenido: <TituloDia texto="DÍAS 4 Y 5" sub="120 horas" inicio={0} dur={1.25} color="#ff7a5a" />},
        ]}
      />
    </Glitch>
  );
};

/* ============================================================ 6 · DÍAS 6 Y 7 */
export const SDia67: React.FC = () => {
  const t = useAbs('dia67');
  const cierre = Math.max(microsueno(t, 39.45, 0.15, 0.25, 0.2), microsueno(t, 40.55, 0.15, 0.3, 0.2), microsueno(t, 41.45, 0.12, 0.35, 0.2), microsueno(t, 41.95, 0.1, 0.18, 0.15));
  const alerta = interpolate(t, [42.4, 42.7], [0, 1], cl);
  const ritmo = alerta > 0 ? 0.42 : 0.62;
  const latido = Math.exp(-((((t % ritmo) / ritmo) * 9)));
  return (
    <AbsoluteFill>
      <Camara
        plano="dia67"
        capas={[
          {id: 'fondo', profundidad: 0.35, cubrir: true, contenido: <Stage><FondoCuerpo color={alerta > 0 ? '#5a0d1c' : '#2a1030'} id="d67" /></Stage>},
          {
            id: 'insomne',
            profundidad: 1,
            principal: true,
            contenido: (
              <Personaje
                x={540}
                y={1640}
                esc={1.2}
                cansancio={1}
                ojos={(alerta > 0 ? 1 : 0.55) * (1 - cierre)}
                pupilas={alerta}
                cabeceo={cierre * 0.8 + (alerta > 0 ? 0 : Math.max(0, osc(t * 30, 50, 0.3)))}
                boca={alerta > 0 ? 'abierta' : cierre > 0.4 ? 'dormido' : 'bostezo'}
                cejas={alerta > 0 ? 1 : -0.3}
                sudor={alerta > 0}
                parpadeo={false}
                semilla={6}
              />
            ),
          },
          {
            id: 'corazon',
            profundidad: 1.2,
            contenido: (
              <Stage>
                <g transform={`translate(400 1560) scale(${(1 + latido * 0.25) * popA(t, 38.6, 0.4)})`}>
                  <Heart x={0} y={0} size={150} color="#ff2b4a" glow />
                </g>
              </Stage>
            ),
          },
          {id: 'hud', hud: true, contenido: <TituloDia texto="DÍAS 6 Y 7" sub="168 horas" inicio={0} dur={1.0} color="#ff3b4f" />},
        ]}
      />
      <VinetaAlerta intensidad={Math.max(alerta, 0.35)} ritmo={ritmo} />
      <Parpados cierre={cierre} />
    </AbsoluteFill>
  );
};

/* ============================================================ 7 · RANDY GARDNER */
export const SGardner: React.FC = () => {
  const t = useAbs('gardner');
  const llega = interpolate(t, [43.95, 44.6], [0, 1], {...cl, easing: Easing.out(Easing.back(1.2))});
  const dia = Math.min(11, Math.max(1, Math.floor(interpolate(t, [46.9, 48.6], [1, 11.99], cl))));
  const tarjetas = [
    {txt: 'Alucinaciones', en: 49.95, icono: <OjoFlotante r={44} semilla={3} />},
    {txt: 'Fallos de memoria', en: 50.8, icono: <PiezaPuzzle color="#5dd8ff" />},
    {txt: 'Le costaba hablar', en: 51.9, icono: <Interrogacion color="#ff5fb0" />},
  ];
  const atenua = interpolate(t, [49.7, 50.1], [0, 0.55], cl);
  return (
    <Camara
      plano="gardner"
      capas={[
        {id: 'fondo', profundidad: 0.4, cubrir: true, contenido: <Stage><FondoSepia id="gd" /></Stage>},
        {
          id: 'periodico',
          profundidad: 1,
          principal: true,
          contenido: (
            <AbsoluteFill>
              <div
                style={{
                  position: 'absolute',
                  left: 110,
                  top: 470,
                  width: 860,
                  height: 1180,
                  background: '#efe2c4',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.55)',
                  transform: `translateY(${(1 - llega) * 1400}px) rotate(${-3 + (1 - llega) * 12}deg)`,
                  padding: '34px 44px',
                  boxSizing: 'border-box',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  color: '#2a1c10',
                  filter: 'sepia(0.35)',
                }}
              >
                <div style={{textAlign: 'center', fontSize: 66, fontWeight: 900, letterSpacing: 4, borderBottom: '6px double #2a1c10', paddingBottom: 10}}>EL DIARIO</div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 24, padding: '8px 0', borderBottom: '2px solid #2a1c10', fontFamily: 'Poppins'}}>
                  <span>ENERO DE 1964</span>
                  <span>EDICIÓN ESPECIAL</span>
                </div>
                <div style={{fontSize: 74, fontWeight: 900, lineHeight: 1.02, margin: '22px 0 12px', textAlign: 'center'}}>17 AÑOS Y 11 DÍAS SIN DORMIR</div>
                <div style={{fontSize: 34, fontStyle: 'italic', textAlign: 'center', marginBottom: 20}}>Randy Gardner bate el récord: 264 horas despierto</div>
                <div style={{display: 'flex', gap: 26}}>
                  <div style={{width: 360, height: 420, background: '#cdb88f', border: '4px solid #2a1c10', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden'}}>
                    <svg viewBox="-180 -180 360 360" width={340} height={340}>
                      <SiluetaFoto />
                    </svg>
                  </div>
                  <div style={{flex: 1, fontSize: 25, lineHeight: 1.45, textAlign: 'justify', columnCount: 1}}>
                    Un estudiante de San Diego permaneció despierto durante once días seguidos bajo observación. Al final del experimento
                    sufría alucinaciones, fallos de memoria y dificultad para hablar. Tras dormir unas catorce horas, se recuperó.
                  </div>
                </div>
              </div>
              <AbsoluteFill style={{background: '#000', opacity: atenua}} />
            </AbsoluteFill>
          ),
        },
        {
          id: 'calendario',
          profundidad: 1.2,
          contenido: (
            <Stage>
              <g transform={`translate(850 640) rotate(8) scale(${0.95 * popA(t, 46.7, 0.4)})`} opacity={entre(t, 46.7, 49.8, 0.3)}>
                <Calendario dia={dia} mes="DÍA" />
              </g>
            </Stage>
          ),
        },
        {
          id: 'tarjetas',
          profundidad: 1.1,
          contenido: (
            <AbsoluteFill>
              {tarjetas.map((c, i) => {
                const a = popA(t, c.en, 0.4);
                return (
                  <div
                    key={c.txt}
                    style={{
                      position: 'absolute',
                      left: 60 + i * 330,
                      top: 1130,
                      width: 300,
                      height: 300,
                      borderRadius: 30,
                      background: 'rgba(24,16,44,0.92)',
                      border: '4px solid #ffd84a',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      transform: `scale(${a}) translateY(${(1 - a) * 80}px)`,
                      opacity: Math.min(1, a * 1.5),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 14,
                    }}
                  >
                    <svg viewBox="-100 -100 200 200" width={140} height={140}>
                      {c.icono}
                    </svg>
                    <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 32, color: '#fff', textAlign: 'center', lineHeight: 1.1, padding: '0 14px'}}>{c.txt}</div>
                  </div>
                );
              })}
            </AbsoluteFill>
          ),
        },
      ]}
    />
  );
};

/* ============================================================ 8 · CIERRE */
export const SCierre: React.FC = () => {
  const t = useAbs('cierre');
  const recupera = interpolate(t, [54.9, 56.2], [0.15, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const cansancio = interpolate(t, [53.2, 56.3], [0.7, 0], cl);
  const zz = entre(t, 53.4, 60, 0.4);
  const fin = interpolate(t, [59.65, 60.1], [0, 1], cl);
  return (
    <AbsoluteFill>
      <Camara
        plano="cierre"
        capas={[
          {id: 'fondo', profundidad: 0.45, cubrir: true, contenido: <Stage><Dormitorio capa="fondo" hora="amanecer" minutos={7 * 60 + 30 + (t - 53) * 2} id="ci" /></Stage>},
          {
            id: 'insomne',
            profundidad: 1,
            principal: true,
            contenido: (
              <Stage>
                <g transform="translate(540 1500) scale(1.25)">
                  <Insomne cansancio={cansancio} ojos={0} boca="dormido" giro={10} parpadeo={false} semilla={7} />
                </g>
                {[0, 1, 2].map((k) => {
                  const c = ((t * 30 + k * 24) % 72) / 72;
                  return (
                    <text key={k} x={700 + c * 120} y={1000 - c * 240} fontFamily="Poppins" fontWeight={800} fontSize={60 + c * 40} fill="#fff" opacity={zz * (c < 0.2 ? c * 5 : 1 - c)}>
                      Z
                    </text>
                  );
                })}
              </Stage>
            ),
          },
          {id: 'frente', profundidad: 1.2, contenido: <Stage><Dormitorio capa="frente" hora="amanecer" id="ci" /></Stage>},
          {
            id: 'hud',
            hud: true,
            contenido: (
              <>
                <div style={{position: 'absolute', left: 0, right: 0, top: 640, opacity: entre(t, 54.7, 56.4, 0.3)}}>
                  <svg viewBox="-170 -170 340 340" width={260} height={260} style={{position: 'absolute', left: 60, top: 0, transform: `scale(${popA(t, 54.75)})`}}>
                    <Cerebro brillo={recupera} />
                  </svg>
                  <Medidor x={650} y={50} ancho={500} valor={recupera} etiqueta="RECUPERACIÓN" color="#5dff9c" aparicion={popA(t, 54.85)} />
                </div>
                {/* 7–9 horas */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 640,
                    textAlign: 'center',
                    transform: `scale(${popA(t, 58.15, 0.5)})`,
                    opacity: entre(t, 58.1, 60.2, 0.3),
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 24,
                      padding: '22px 50px',
                      borderRadius: 40,
                      background: 'rgba(30,20,70,0.85)',
                      border: '6px solid #ffd84a',
                      boxShadow: '0 0 50px rgba(255,216,74,0.5)',
                    }}
                  >
                    <svg viewBox="-100 -100 200 200" width={130} height={130}>
                      <Luna r={70} color="#ffd84a" />
                    </svg>
                    <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 130, color: '#ffd84a', lineHeight: 1}}>7–9 h</div>
                  </div>
                  <div style={{marginTop: 18, fontFamily: 'Poppins', fontWeight: 800, fontSize: 50, color: '#fff', textShadow: '0 4px 16px rgba(0,0,0,0.6)'}}>cada noche</div>
                </div>
              </>
            ),
          },
        ]}
      />
      <AbsoluteFill style={{background: '#000', opacity: fin}} />
    </AbsoluteFill>
  );
};

export const ESCENA_COMPONENTES_SUENO: Record<EscenaSueno, React.FC> = {
  gancho: SGancho,
  dia1: SDia1,
  dia2: SDia2,
  dia3: SDia3,
  dia45: SDia45,
  dia67: SDia67,
  gardner: SGardner,
  cierre: SCierre,
};
export {tween, pop};
