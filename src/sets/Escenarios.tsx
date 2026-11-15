import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Sparkles, Stars} from '../components/Particles';
import {osc, rnd} from '../lib/anim';

/**
 * BIBLIOTECA DE ESCENARIOS (1080x1920, SVG animado).
 * Todos aceptan:
 *   capa: 'todo' | 'fondo' | 'frente'  -> para la cámara por capas (parallax, desenfoque)
 *   id:   prefijo único para los degradados (obligatorio si se usa el mismo escenario dos veces)
 * El personaje se coloca entre la capa 'fondo' y la capa 'frente'.
 */
export type CapaEscenario = 'todo' | 'fondo' | 'frente';
type P = {capa?: CapaEscenario; id?: string};
const ver = (capa: CapaEscenario, c: 'fondo' | 'frente') => capa === 'todo' || capa === c;
const G = '#ffffff';

const Degradado: React.FC<{id: string; c: string[]; v?: boolean}> = ({id, c, v = true}) => (
  <linearGradient id={id} x1="0" y1="0" x2={v ? 0 : 1} y2={v ? 1 : 0}>
    {c.map((col, i) => (
      <stop key={i} offset={`${(i / (c.length - 1)) * 100}%`} stopColor={col} />
    ))}
  </linearGradient>
);

/* ------------------------------------------------------------------ CIUDAD DE NOCHE */
export const CiudadNoche: React.FC<P> = ({capa = 'todo', id = 'cn'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  return (
    <g>
      <defs>
        <Degradado id={k('cielo')} c={['#060824', '#1b1f5c', '#5a2a6e', '#c4507a']} />
        <Degradado id={k('calle')} c={['#1a1730', '#0b0a16']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('cielo')})`} />
          <Stars count={40} area={[0, 0, 1080, 700]} seed={`${id}s`} />
          <circle cx={820} cy={330} r={70} fill="#fff1cf" />
          <circle cx={820} cy={330} r={140} fill="#fff1cf" opacity={0.1} />
          {/* rascacielos en dos planos */}
          {[0, 1].map((plano) =>
            new Array(9).fill(0).map((_, i) => {
              const w = 110 + ((i * 37) % 60);
              const h = (plano ? 520 : 760) + ((i * 113 + plano * 50) % 380);
              const x = -40 + i * 130 + plano * 60;
              const base = 1360;
              return (
                <g key={`${plano}-${i}`} opacity={plano ? 1 : 0.55}>
                  <rect x={x} y={base - h} width={w} height={h} fill={plano ? '#14122e' : '#2a2357'} />
                  {plano === 1 &&
                    new Array(Math.floor(h / 46)).fill(0).map((__, r) =>
                      [0, 1, 2].map((c) => (
                        <rect
                          key={`${r}-${c}`}
                          x={x + 14 + c * ((w - 28) / 3)}
                          y={base - h + 20 + r * 46}
                          width={(w - 28) / 3 - 10}
                          height={22}
                          fill={rnd(`${id}${i}${r}${c}`) > 0.55 ? '#ffd27a' : '#2b2850'}
                          opacity={0.85 + osc(f, 60 + r * 3, 0.1, c)}
                        />
                      )),
                    )}
                </g>
              );
            }),
          )}
          <rect x={-200} y={1360} width={1480} height={760} fill={`url(#${k('calle')})`} />
          {/* estelas de coches */}
          {[0, 1, 2].map((i) => {
            const x = ((f * (14 + i * 6) + i * 400) % 1600) - 260;
            return <rect key={i} x={x} y={1450 + i * 46} width={260} height={10} rx={5} fill={i % 2 ? '#ff4f6e' : '#ffe9a8'} opacity={0.8} />;
          })}
          {new Array(8).fill(0).map((_, i) => (
            <rect key={i} x={i * 160 - ((f * 6) % 160)} y={1620} width={90} height={12} fill="#ffd84a" opacity={0.6} />
          ))}
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          <rect x={-60} y={1760} width={1200} height={220} fill="#2a2440" />
          <rect x={90} y={980} width={22} height={800} fill="#3a3456" />
          <path d="M 101 990 Q 101 940 180 940 L 230 940" stroke="#3a3456" strokeWidth={18} fill="none" />
          <ellipse cx={240} cy={960} rx={40} ry={18} fill="#fff1b8" />
          <polygon points="200,970 280,970 400,1780 80,1780" fill="#fff1b8" opacity={0.08} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ PARQUE DE DÍA */
export const Parque: React.FC<P> = ({capa = 'todo', id = 'pq'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const arbol = (x: number, y: number, s: number, c: string) => (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${osc(f, 90, 1.2, x)})`}>
      <rect x={-18} y={-40} width={36} height={240} rx={14} fill="#7a4a2a" />
      <circle cx={0} cy={-120} r={130} fill={c} />
      <circle cx={-90} cy={-60} r={90} fill={c} />
      <circle cx={90} cy={-60} r={95} fill={c} />
      <circle cx={-30} cy={-170} r={60} fill="#fff" opacity={0.08} />
    </g>
  );
  return (
    <g>
      <defs>
        <Degradado id={k('cielo')} c={['#5cc4ff', '#a6e2ff', '#e8f8ff']} />
        <Degradado id={k('cesped')} c={['#7fd46a', '#3f9a44']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('cielo')})`} />
          <circle cx={860} cy={300} r={90} fill="#fff3a8" />
          <circle cx={860} cy={300} r={160} fill="#fff3a8" opacity={0.25} />
          {[0, 1, 2].map((i) => {
            const x = ((f * (0.6 + i * 0.3) + i * 420) % 1500) - 250;
            return (
              <g key={i} transform={`translate(${x} ${220 + i * 160})`} opacity={0.95}>
                <ellipse cx={0} cy={0} rx={110} ry={44} fill={G} />
                <ellipse cx={-60} cy={10} rx={70} ry={34} fill={G} />
                <ellipse cx={60} cy={14} rx={80} ry={32} fill={G} />
              </g>
            );
          })}
          <path d="M -200 1150 Q 300 1000 700 1120 T 1300 1080 L 1300 2100 L -200 2100 Z" fill="#9be08a" />
          {arbol(160, 1080, 0.9, '#4fb35a')}
          {arbol(900, 1060, 1.05, '#3e9e4c')}
          <path d="M -200 1300 Q 400 1220 1300 1320 L 1300 2100 L -200 2100 Z" fill={`url(#${k('cesped')})`} />
          {/* camino */}
          <path d="M 420 2000 Q 520 1600 560 1300 L 640 1300 Q 680 1600 880 2000 Z" fill="#e8d2a0" />
          {/* banco */}
          <g transform="translate(250 1430)">
            <rect x={0} y={0} width={260} height={22} rx={8} fill="#c27a3a" />
            <rect x={0} y={-50} width={260} height={18} rx={8} fill="#c27a3a" />
            <rect x={20} y={20} width={14} height={70} fill="#4a3a30" />
            <rect x={226} y={20} width={14} height={70} fill="#4a3a30" />
          </g>
          {/* pájaros */}
          {[0, 1].map((i) => (
            <path
              key={i}
              d={`M 0 0 Q 15 ${-12 + osc(f, 12, 8, i)} 30 0 Q 45 ${-12 + osc(f, 12, 8, i)} 60 0`}
              transform={`translate(${((f * 3 + i * 300) % 1400) - 200} ${520 + i * 60})`}
              stroke="#2a3a4a"
              strokeWidth={5}
              fill="none"
            />
          ))}
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          {[-40, 260, 820, 1060].map((x, i) => (
            <g key={i} transform={`translate(${x} ${1840 + osc(f, 70, 6, i)})`}>
              <circle cx={0} cy={0} r={130} fill="#2f8a3c" />
              <circle cx={90} cy={30} r={100} fill="#3a9e48" />
              {[0, 1, 2].map((q) => (
                <circle key={q} cx={-40 + q * 50} cy={-60 + (q % 2) * 20} r={14} fill={['#ff6f9f', '#ffd84a', '#fff'][q]} />
              ))}
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ PLAYA AL ATARDECER */
export const Playa: React.FC<P> = ({capa = 'todo', id = 'pl'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const ola = (y: number, a: number, fase: number) =>
    `M -200 ${y} ` + new Array(18).fill(0).map((_, i) => `Q ${-140 + i * 90} ${y + (i % 2 ? a : -a) + osc(f + fase, 40, 6)} ${-110 + i * 90} ${y}`).join(' ') + ' L 1300 2100 L -200 2100 Z';
  return (
    <g>
      <defs>
        <Degradado id={k('cielo')} c={['#3b2a7a', '#c4507a', '#ff9a5c', '#ffd27a']} />
        <Degradado id={k('mar')} c={['#ff8a6a', '#3a4aa6', '#1d2a6a']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('cielo')})`} />
          <circle cx={540} cy={1000} r={190} fill="#ffe08a" />
          <circle cx={540} cy={1000} r={320} fill="#ffe08a" opacity={0.18} />
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={((f * 0.5 + i * 400) % 1500) - 200} cy={420 + i * 130} rx={170} ry={26} fill="#ffb6a0" opacity={0.55} />
          ))}
          <rect x={-200} y={1060} width={1480} height={1060} fill={`url(#${k('mar')})`} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={430 + osc(f, 30 + i * 7, 20, i)} y={1090 + i * 40} width={220 - i * 30} height={8} rx={4} fill="#ffe08a" opacity={0.6} />
          ))}
          <path d={ola(1420, 16, 0)} fill="#5a7ad6" opacity={0.7} />
          <path d={ola(1520, 14, 20)} fill="#7fa0f0" opacity={0.7} />
          <path d="M -200 1620 Q 300 1560 700 1610 T 1300 1590 L 1300 2100 L -200 2100 Z" fill="#f2c98a" />
          <path d={`M -200 ${1622 + osc(f, 50, 10)} Q 300 ${1580 + osc(f, 50, 10)} 700 ${1612 + osc(f, 50, 10)} T 1300 ${1592 + osc(f, 50, 10)}`} stroke="#fff" strokeWidth={10} fill="none" opacity={0.6} />
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          {/* palmera */}
          <path d="M 930 1960 C 900 1600 960 1300 1040 1120" stroke="#5a3a24" strokeWidth={44} fill="none" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = -150 + i * 45 + osc(f, 60, 4, i);
            return (
              <path
                key={i}
                d="M 0 0 Q 120 -60 240 30 Q 120 -20 0 0 Z"
                transform={`translate(1040 1120) rotate(${a})`}
                fill="#2f7a3c"
                stroke="#245e2e"
                strokeWidth={6}
              />
            );
          })}
          <circle cx={1020} cy={1150} r={22} fill="#7a4a2a" />
          <circle cx={1060} cy={1160} r={20} fill="#7a4a2a" />
          <g transform="translate(160 1780)">
            <path d="M -80 0 Q -40 -60 0 -70 Q 40 -60 80 0 Z" fill="#ff5f9e" />
            <path d="M -80 0 Q -40 -60 0 -70 L 0 0 Z" fill="#fff" opacity={0.4} />
          </g>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ ESPACIO */
export const Espacio: React.FC<P> = ({capa = 'todo', id = 'es'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  return (
    <g>
      <defs>
        <radialGradient id={k('neb')} cx="30%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7a3ad6" stopOpacity={0.7} />
          <stop offset="50%" stopColor="#2a1a6a" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#03030f" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={k('planeta')} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffb86b" />
          <stop offset="100%" stopColor="#a0402a" />
        </radialGradient>
        <radialGradient id={k('tierra')} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#6fd0ff" />
          <stop offset="100%" stopColor="#1b4aa6" />
        </radialGradient>
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill="#03030f" />
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('neb')})`} />
          <Stars count={120} area={[-100, -100, 1180, 2020]} seed={`${id}st`} />
          <g transform={`translate(780 520) rotate(${-18})`}>
            <circle r={190} fill={`url(#${k('planeta')})`} />
            <ellipse rx={330} ry={60} fill="none" stroke="#ffd9a8" strokeWidth={18} opacity={0.75} />
            <path d="M -330 0 A 330 60 0 0 0 330 0" fill="none" stroke="#ffd9a8" strokeWidth={18} opacity={0.75} />
          </g>
          <g transform="translate(240 1500)">
            <circle r={260} fill={`url(#${k('tierra')})`} />
            <path d="M -150 -120 Q -60 -180 20 -110 Q 60 -40 -30 0 Q -120 20 -150 -120 Z M 60 60 Q 160 30 190 120 Q 120 200 40 150 Z" fill="#5ac86a" opacity={0.85} />
            <circle r={290} fill="#6fd0ff" opacity={0.12} />
          </g>
          {/* estrella fugaz */}
          {(() => {
            const t = (f % 120) / 120;
            return t < 0.25 ? <line x1={900 - t * 1600} y1={200 + t * 800} x2={1000 - t * 1600} y2={150 + t * 800} stroke="#fff" strokeWidth={5} opacity={1 - t * 4} strokeLinecap="round" /> : null;
          })()}
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          {[[120, 900, 70], [960, 1280, 90], [700, 1820, 120]].map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x + osc(f, 120, 20, i)} ${y + osc(f, 100, 16, i)}) rotate(${f * (0.5 + i * 0.3)})`}>
              <path d={`M ${-r} 0 Q ${-r} ${-r * 0.8} 0 ${-r} Q ${r * 0.9} ${-r * 0.9} ${r} 0 Q ${r * 0.8} ${r} 0 ${r * 0.9} Q ${-r * 0.9} ${r * 0.8} ${-r} 0 Z`} fill="#5a5070" />
              <circle cx={-r * 0.3} cy={-r * 0.2} r={r * 0.2} fill="#433a58" />
              <circle cx={r * 0.35} cy={r * 0.3} r={r * 0.15} fill="#433a58" />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ BOSQUE CON NIEBLA */
export const Bosque: React.FC<P> = ({capa = 'todo', id = 'bq'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const pino = (x: number, y: number, s: number, c: string) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-12} y={-40} width={24} height={80} fill="#2a1a14" />
      {[0, 1, 2, 3].map((i) => {
        const cima = -400 + i * 80;
        const ancho = 60 + i * 34;
        return <polygon key={i} points={`0,${cima} ${-ancho},${cima + 170} ${ancho},${cima + 170}`} fill={c} />;
      })}
    </g>
  );
  return (
    <g>
      <defs>
        <Degradado id={k('cielo')} c={['#0f2a2a', '#2a5a4a', '#a8d0a0']} />
        <Degradado id={k('niebla')} c={['#d8f0e0', '#d8f0e000']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('cielo')})`} />
          <circle cx={760} cy={380} r={90} fill="#f4ffe8" opacity={0.9} />
          <circle cx={760} cy={380} r={170} fill="#f4ffe8" opacity={0.12} />
          {[0, 1, 2].map((fila) =>
            new Array(7).fill(0).map((_, i) => {
              const x = -40 + i * 175 + (fila % 2) * 85 + (rnd(`${id}px${fila}${i}`) - 0.5) * 50;
              const esc = [0.75, 1.0, 1.3][fila] * (0.85 + rnd(`${id}ps${fila}${i}`) * 0.3);
              return <g key={`${fila}-${i}`}>{pino(x, [1120, 1300, 1520][fila], esc, ['#6a9a80', '#3f7a5a', '#21503a'][fila])}</g>;
            }),
          )}
          <rect x={-200} y={1550} width={1480} height={570} fill="#163a28" />
          <rect x={-200} y={1150 + osc(f, 160, 30)} width={1480} height={380} fill={`url(#${k('niebla')})`} opacity={0.45} />
          {/* luciérnagas */}
          {new Array(16).fill(0).map((_, i) => (
            <circle
              key={i}
              cx={rnd(`${id}x${i}`) * 1080 + osc(f, 80 + i * 4, 40, i)}
              cy={1100 + rnd(`${id}y${i}`) * 700 + osc(f, 60 + i * 3, 30, i)}
              r={6}
              fill="#e8ff8a"
              opacity={0.5 + osc(f, 20 + i, 0.5, i)}
            />
          ))}
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          {[-80, 1100].map((x, i) => <g key={i}>{pino(x, 1880, 2.4, '#0d2a1c')}</g>)}
          {new Array(9).fill(0).map((_, i) => (
            <path key={i} d={`M ${i * 130} 1920 Q ${i * 130 - 40 + osc(f, 50, 10, i)} 1780 ${i * 130 - 70} 1720 Q ${i * 130 + 10} 1800 ${i * 130 + 20} 1920 Z`} fill="#1f5a34" />
          ))}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ HOSPITAL / CONSULTA */
export const Hospital: React.FC<P> = ({capa = 'todo', id = 'ho'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const ecg = new Array(40)
    .fill(0)
    .map((_, i) => {
      const x = i * 12;
      const fase = (i + Math.floor(f / 2)) % 20;
      const y = fase === 8 ? -60 : fase === 9 ? 40 : fase === 10 ? -20 : 0;
      return `${i ? 'L' : 'M'} ${x} ${y}`;
    })
    .join(' ');
  return (
    <g>
      <defs>
        <Degradado id={k('pared')} c={['#dff3f6', '#b9e0e8']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('pared')})`} />
          <rect x={-200} y={1300} width={1480} height={820} fill="#8fc4cf" />
          <rect x={-200} y={1290} width={1480} height={20} fill="#6aa8b6" />
          {/* ventana */}
          <rect x={90} y={360} width={360} height={460} rx={16} fill="#fff" />
          <rect x={110} y={380} width={320} height={420} rx={10} fill="#9ed8ff" />
          <rect x={262} y={380} width={16} height={420} fill="#fff" />
          {/* cruz */}
          <g transform="translate(800 420)">
            <rect x={-30} y={-90} width={60} height={180} rx={10} fill="#ff4f6e" />
            <rect x={-90} y={-30} width={180} height={60} rx={10} fill="#ff4f6e" />
          </g>
          {/* monitor cardíaco */}
          <g transform="translate(620 760)">
            <rect x={-20} y={-160} width={400} height={300} rx={24} fill="#1b2a3a" />
            <rect x={0} y={-140} width={360} height={220} rx={12} fill="#0a141e" />
            <path d={ecg} transform="translate(0 -30)" stroke="#5dff9c" strokeWidth={6} fill="none" />
            <text x={340} y={60} textAnchor="end" fontFamily="Poppins" fontWeight={800} fontSize={44} fill="#5dff9c">
              {72 + Math.round(osc(f, 60, 3))}
            </text>
          </g>
          {/* gotero */}
          <rect x={140} y={900} width={10} height={600} fill="#9aaab8" />
          <rect x={100} y={880} width={90} height={14} rx={6} fill="#9aaab8" />
          <path d="M 110 900 L 180 900 L 170 1040 Q 145 1060 120 1040 Z" fill="#e8f6ff" stroke="#9aaab8" strokeWidth={4} />
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          <rect x={-60} y={1500} width={1200} height={480} rx={30} fill="#f6fbff" />
          <rect x={-60} y={1480} width={1200} height={50} rx={20} fill="#ffffff" />
          <rect x={-60} y={1560} width={1200} height={30} fill="#7fc8e0" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ AULA */
export const Aula: React.FC<P> = ({capa = 'todo', id = 'au'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const escrito = Math.min(1, (f % 150) / 90);
  return (
    <g>
      <defs>
        <Degradado id={k('pared')} c={['#ffe9c2', '#f6cf96']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('pared')})`} />
          <rect x={-200} y={1380} width={1480} height={740} fill="#b47a4a" />
          {new Array(10).fill(0).map((_, i) => (
            <line key={i} x1={i * 130 - 100} y1={1380} x2={i * 200 - 400} y2={1920} stroke="#9a643a" strokeWidth={4} />
          ))}
          {/* pizarra */}
          <rect x={80} y={380} width={920} height={600} rx={16} fill="#6a4a2a" />
          <rect x={104} y={404} width={872} height={552} rx={8} fill="#24503a" />
          <text x={160} y={520} fontFamily="Poppins" fontWeight={700} fontSize={64} fill="#f4f4e8" opacity={0.9}>
            E = mc²
          </text>
          <text x={160} y={640} fontFamily="Poppins" fontWeight={500} fontSize={48} fill="#f4f4e8" opacity={0.85}>
            {'a² + b² = c²'.slice(0, Math.ceil(11 * escrito))}
          </text>
          <path d="M 640 760 Q 720 600 820 760 Q 900 900 960 700" stroke="#ffd84a" strokeWidth={8} fill="none" opacity={0.8} />
          <circle cx={560} cy={860} r={50} fill="none" stroke="#f4f4e8" strokeWidth={6} opacity={0.7} />
          <rect x={120} y={968} width={840} height={20} rx={6} fill="#8a6a4a" />
          {/* reloj */}
          <circle cx={900} cy={230} r={80} fill="#fff" stroke="#6a4a2a" strokeWidth={10} />
          <line x1={900} y1={230} x2={900 + Math.sin(f / 90) * 50} y2={230 - Math.cos(f / 90) * 50} stroke="#333" strokeWidth={6} strokeLinecap="round" />
          <line x1={900} y1={230} x2={940} y2={230} stroke="#333" strokeWidth={8} strokeLinecap="round" />
          {/* mapa / póster */}
          <rect x={120} y={140} width={260} height={180} rx={8} fill="#9ed8ff" stroke="#6a4a2a" strokeWidth={8} />
          <path d="M 160 240 Q 200 180 250 220 Q 300 260 340 200" stroke="#5ac86a" strokeWidth={22} fill="none" />
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          {[[-40, 1620], [560, 1620]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect x={0} y={0} width={560} height={40} rx={10} fill="#d8a46a" />
              <rect x={20} y={40} width={24} height={300} fill="#5a4a3a" />
              <rect x={516} y={40} width={24} height={300} fill="#5a4a3a" />
              <rect x={60} y={-40} width={160} height={40} rx={6} fill="#ff6f9f" transform="rotate(-6 140 -20)" />
              <rect x={300} y={-14} width={180} height={12} rx={6} fill="#ffd84a" transform="rotate(8 390 -8)" />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ OFICINA */
export const Oficina: React.FC<P> = ({capa = 'todo', id = 'of'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  return (
    <g>
      <defs>
        <Degradado id={k('pared')} c={['#e9eef7', '#c9d3e6']} />
        <Degradado id={k('ventana')} c={['#7ec8ff', '#d6efff']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('pared')})`} />
          <rect x={60} y={260} width={960} height={760} rx={14} fill="#54627e" />
          <rect x={80} y={280} width={920} height={720} rx={8} fill={`url(#${k('ventana')})`} />
          {new Array(10).fill(0).map((_, i) => {
            const h = 200 + ((i * 71) % 300);
            return <rect key={i} x={90 + i * 92} y={1000 - h} width={80} height={h} fill="#a9c8e8" opacity={0.8} />;
          })}
          <rect x={530} y={280} width={20} height={720} fill="#54627e" />
          <rect x={80} y={630} width={920} height={16} fill="#54627e" />
          <rect x={-200} y={1300} width={1480} height={820} fill="#8a94aa" />
          {/* planta */}
          <g transform="translate(940 1300)">
            <path d="M -60 0 L 60 0 L 46 120 L -46 120 Z" fill="#e2763f" />
            {[0, 1, 2, 3, 4].map((i) => (
              <ellipse key={i} cx={0} cy={-80} rx={26} ry={90} fill="#3e9e4c" transform={`rotate(${-50 + i * 25 + osc(f, 80, 3, i)} 0 0)`} />
            ))}
          </g>
          {/* pizarra de gráficas */}
          <g transform="translate(120 1080)">
            <rect x={0} y={0} width={300} height={200} rx={10} fill="#fff" stroke="#54627e" strokeWidth={6} />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={30 + i * 66} y={170 - (40 + i * 30) * (0.8 + 0.2 * Math.sin(f / 30 + i))} width={40} height={(40 + i * 30) * (0.8 + 0.2 * Math.sin(f / 30 + i))} fill={['#3fc3ff', '#5dff9c', '#ffd84a', '#ff5f9e'][i]} />
            ))}
          </g>
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          <rect x={-60} y={1420} width={1200} height={560} fill="#f2f2f6" />
          <rect x={-60} y={1400} width={1200} height={36} fill="#ffffff" />
          <g transform="translate(700 1240)">
            <rect x={0} y={0} width={320} height={200} rx={12} fill="#1b2230" />
            <rect x={14} y={14} width={292} height={160} rx={6} fill="#3fc3ff" opacity={0.6 + osc(f, 40, 0.1)} />
            <rect x={140} y={200} width={40} height={60} fill="#1b2230" />
          </g>
          <g transform="translate(160 1360)">
            <rect x={0} y={0} width={70} height={80} rx={8} fill="#fff" stroke="#c9d3e6" strokeWidth={4} />
            <path d="M 70 20 Q 100 20 100 45 Q 100 70 70 70" stroke="#c9d3e6" strokeWidth={8} fill="none" />
          </g>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ MONTAÑA CON AURORA */
export const MontanaAurora: React.FC<P> = ({capa = 'todo', id = 'ma'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const aurora = (y: number, c: string, fase: number) =>
    `M -200 ${y} ` + new Array(8).fill(0).map((_, i) => `Q ${-60 + i * 200} ${y + osc(f + fase, 90 + i * 9, 80, i)} ${40 + i * 200} ${y + osc(f + fase, 70, 30, i)}`).join(' ') + ` L 1300 ${y + 300} L -200 ${y + 300} Z`;
  return (
    <g>
      <defs>
        <Degradado id={k('cielo')} c={['#020a1a', '#0a2a4a', '#1a4a6a']} />
        <linearGradient id={k('aur')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5dff9c" stopOpacity={0} />
          <stop offset="50%" stopColor="#5dff9c" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#3fc3ff" stopOpacity={0} />
        </linearGradient>
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('cielo')})`} />
          <Stars count={70} area={[-100, -100, 1180, 900]} seed={`${id}st`} />
          <path d={aurora(260, '', 0)} fill={`url(#${k('aur')})`} />
          <path d={aurora(420, '', 40)} fill={`url(#${k('aur')})`} opacity={0.6} />
          <polygon points="-200,1300 200,700 520,1150 760,820 1280,1300" fill="#2a4a6a" />
          <polygon points="200,700 120,820 210,800 280,860 330,800" fill="#e8f4ff" />
          <polygon points="760,820 690,920 770,900 830,950 880,900" fill="#e8f4ff" />
          <polygon points="-200,1500 300,1000 700,1400 1000,1100 1280,1500" fill="#1a3450" />
          <rect x={-200} y={1480} width={1480} height={640} fill="#dce9f6" />
          {/* nieve */}
          {new Array(40).fill(0).map((_, i) => (
            <circle key={i} cx={(rnd(`${id}nx${i}`) * 1300 + osc(f, 80, 30, i)) % 1100} cy={((rnd(`${id}ny${i}`) * 2000 + f * (2 + (i % 3))) % 2000) - 40} r={3 + (i % 3) * 2} fill="#fff" opacity={0.85} />
          ))}
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          {[[-40, 1900, 2], [1100, 1880, 2.3]].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              {[0, 1, 2].map((q) => (
                <polygon key={q} points={`0,${-300 + q * 80} -120,${-120 + q * 80} 120,${-120 + q * 80}`} fill="#0f2a3a" />
              ))}
              {[0, 1, 2].map((q) => (
                <polygon key={`n${q}`} points={`0,${-300 + q * 80} -60,${-210 + q * 80} 60,${-210 + q * 80}`} fill="#e8f4ff" opacity={0.9} />
              ))}
            </g>
          ))}
          <path d="M -60 1820 Q 540 1740 1140 1830 L 1140 1980 L -60 1980 Z" fill="#f4f9ff" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ FONDO MARINO */
export const FondoMarino: React.FC<P> = ({capa = 'todo', id = 'fm'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const pez = (x: number, y: number, c: string, s: number, dir: number) => (
    <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`}>
      <ellipse cx={0} cy={0} rx={60} ry={34} fill={c} />
      <polygon points={`-50,0 -100,${-30 + osc(f, 10, 8)} -100,${30 + osc(f, 10, 8)}`} fill={c} />
      <circle cx={30} cy={-8} r={8} fill="#fff" />
      <circle cx={32} cy={-8} r={4} fill="#111" />
    </g>
  );
  return (
    <g>
      <defs>
        <Degradado id={k('agua')} c={['#3fd0e0', '#1a7ab6', '#0a2a5a', '#050f2a']} />
        <linearGradient id={k('rayo')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('agua')})`} />
          {[0, 1, 2, 3].map((i) => (
            <polygon key={i} points={`${100 + i * 260 + osc(f, 120, 30, i)},-100 ${200 + i * 260 + osc(f, 120, 30, i)},-100 ${360 + i * 220},1500 ${160 + i * 220},1500`} fill={`url(#${k('rayo')})`} opacity={0.6} />
          ))}
          {pez(((f * 4) % 1500) - 200, 700, '#ffa53c', 1, 1)}
          {pez(1300 - ((f * 3 + 500) % 1500), 980, '#ff5f9e', 0.8, -1)}
          {pez(((f * 5 + 800) % 1500) - 200, 560, '#ffd84a', 0.6, 1)}
          <path d="M -200 1600 Q 200 1500 540 1580 T 1300 1560 L 1300 2100 L -200 2100 Z" fill="#c9a86a" />
          {/* corales */}
          {[[180, 1600, '#ff6f8a'], [820, 1590, '#ff9a5c'], [520, 1620, '#c46ad6']].map(([x, y, c], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              {[0, 1, 2].map((q) => (
                <path key={q} d={`M 0 0 Q ${-30 + q * 30} -80 ${-50 + q * 50} -160`} stroke={c as string} strokeWidth={26} fill="none" strokeLinecap="round" />
              ))}
            </g>
          ))}
          {new Array(14).fill(0).map((_, i) => (
            <circle key={i} cx={rnd(`${id}b${i}`) * 1080 + osc(f, 30, 10, i)} cy={1900 - ((f * (3 + (i % 4)) + i * 140) % 2000)} r={6 + (i % 4) * 4} fill="none" stroke="#e8fbff" strokeWidth={3} opacity={0.7} />
          ))}
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          {[-20, 140, 940, 1080].map((x, i) => (
            <path
              key={i}
              d={`M ${x} 1980 C ${x + osc(f, 60, 40, i)} 1700 ${x - 40 + osc(f, 50, 50, i)} 1500 ${x + osc(f, 70, 60, i)} 1250`}
              stroke="#2f9a5a"
              strokeWidth={34}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ DESIERTO */
export const Desierto: React.FC<P> = ({capa = 'todo', id = 'de'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const cactus = (x: number, y: number, s: number) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-30} y={-300} width={60} height={300} rx={30} fill="#3f8a4a" />
      <path d="M -30 -150 L -80 -150 Q -100 -150 -100 -180 L -100 -230" stroke="#3f8a4a" strokeWidth={44} fill="none" strokeLinecap="round" />
      <path d="M 30 -200 L 70 -200 Q 90 -200 90 -230 L 90 -260" stroke="#3f8a4a" strokeWidth={40} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={-300} r={14} fill="#ff6f9f" />
    </g>
  );
  return (
    <g>
      <defs>
        <Degradado id={k('cielo')} c={['#ff9a3c', '#ffd27a', '#fff2c2']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('cielo')})`} />
          <circle cx={540} cy={560} r={180} fill="#fff8d6" />
          <circle cx={540} cy={560} r={300} fill="#fff8d6" opacity={0.25 + osc(f, 40, 0.05)} />
          <polygon points="620,1150 820,820 1020,1150" fill="#e0a65a" />
          <polygon points="820,820 1020,1150 880,1150" fill="#c48a44" />
          <polygon points="300,1150 420,960 540,1150" fill="#e0a65a" opacity={0.8} />
          <path d="M -200 1150 Q 200 1050 540 1140 T 1300 1120 L 1300 2100 L -200 2100 Z" fill="#f2c27a" />
          <path d="M -200 1400 Q 300 1280 700 1380 T 1300 1350 L 1300 2100 L -200 2100 Z" fill="#e8ac5c" />
          {/* calima */}
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M -100 ${1180 + i * 30} Q 200 ${1170 + i * 30 + osc(f, 20, 8, i)} 540 ${1180 + i * 30} T 1200 ${1180 + i * 30}`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.25} />
          ))}
          {cactus(200, 1360, 0.8)}
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          {cactus(960, 1900, 1.4)}
          <path d="M -60 1800 Q 400 1700 1140 1820 L 1140 1980 L -60 1980 Z" fill="#d6964a" />
          <ellipse cx={240} cy={1800} rx={60} ry={24} fill="#a8783a" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ LABORATORIO */
export const Laboratorio: React.FC<P> = ({capa = 'todo', id = 'lb'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  const matraz = (x: number, y: number, c: string, s: number) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -24 -140 L 24 -140 L 24 -60 L 90 60 Q 100 90 70 90 L -70 90 Q -100 90 -90 60 L -24 -60 Z" fill="rgba(220,240,255,0.25)" stroke="#e8f6ff" strokeWidth={6} />
      <path d="M -60 20 L 60 20 L 90 60 Q 100 90 70 90 L -70 90 Q -100 90 -90 60 Z" fill={c} opacity={0.85} />
      {[0, 1, 2].map((i) => {
        const t = ((f + i * 15) % 45) / 45;
        return <circle key={i} cx={-20 + i * 20} cy={40 - t * 220} r={6 + i * 2} fill={c} opacity={1 - t} />;
      })}
    </g>
  );
  return (
    <g>
      <defs>
        <Degradado id={k('pared')} c={['#13203a', '#22385a']} />
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${k('pared')})`} />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect x={60} y={380 + r * 260} width={960} height={18} fill="#4a5a7a" />
              {new Array(6).fill(0).map((_, i) => (
                <rect key={i} x={100 + i * 150} y={380 + r * 260 - (80 + ((i + r) % 3) * 30)} width={60} height={80 + ((i + r) % 3) * 30} rx={10} fill={['#3fc3ff', '#5dff9c', '#ff5f9e', '#ffd84a'][(i + r) % 4]} opacity={0.55} />
              ))}
            </g>
          ))}
          {/* doble hélice */}
          <g transform="translate(860 1100)">
            {new Array(12).fill(0).map((_, i) => {
              const a = i * 0.6 + f / 20;
              return (
                <g key={i}>
                  <line x1={Math.sin(a) * 60} y1={i * 26 - 150} x2={-Math.sin(a) * 60} y2={i * 26 - 150} stroke="#8fa6ff" strokeWidth={4} opacity={0.6} />
                  <circle cx={Math.sin(a) * 60} cy={i * 26 - 150} r={9} fill="#5dd8ff" />
                  <circle cx={-Math.sin(a) * 60} cy={i * 26 - 150} r={9} fill="#ff6f9f" />
                </g>
              );
            })}
          </g>
          <Sparkles count={12} color="#9fe8ff" seed={`${id}sp`} speed={0.3} size={3} />
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          <rect x={-60} y={1480} width={1200} height={500} fill="#2a3a52" />
          <rect x={-60} y={1460} width={1200} height={30} fill="#5a6e90" />
          {matraz(170, 1380, '#5dff9c', 1)}
          {matraz(900, 1380, '#ff5f9e', 0.9)}
          {/* microscopio */}
          <g transform="translate(560 1460)">
            <rect x={-80} y={-20} width={160} height={20} rx={6} fill="#dfe6f2" />
            <path d="M 30 -20 L 30 -200 Q 30 -230 0 -240 L -40 -260" stroke="#dfe6f2" strokeWidth={26} fill="none" strokeLinecap="round" />
            <rect x={-70} y={-300} width={40} height={90} rx={10} fill="#8fa6c8" transform="rotate(-30 -50 -255)" />
          </g>
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ COCINA */
export const Cocina: React.FC<P> = ({capa = 'todo', id = 'co'}) => {
  const f = useCurrentFrame();
  const k = (s: string) => `${id}-${s}`;
  return (
    <g>
      <defs>
        <pattern id={k('azulejo')} width="90" height="90" patternUnits="userSpaceOnUse">
          <rect width="90" height="90" fill="#fff4e8" />
          <rect x="3" y="3" width="84" height="84" rx="6" fill="#ffe2c8" />
        </pattern>
      </defs>
      {ver(capa, 'fondo') && (
        <g>
          <rect x={-200} y={-200} width={1480} height={2320} fill="#ffcf9e" />
          <rect x={-200} y={700} width={1480} height={700} fill={`url(#${k('azulejo')})`} />
          {/* muebles altos */}
          <rect x={60} y={260} width={420} height={360} rx={14} fill="#5ab8a8" />
          <rect x={600} y={260} width={420} height={360} rx={14} fill="#5ab8a8" />
          <rect x={250} y={420} width={40} height={10} rx={5} fill="#fff" />
          <rect x={790} y={420} width={40} height={10} rx={5} fill="#fff" />
          {/* nevera */}
          <rect x={800} y={700} width={240} height={700} rx={20} fill="#e8eef6" />
          <rect x={800} y={960} width={240} height={10} fill="#c9d3e6" />
          <rect x={1000} y={760} width={14} height={140} rx={7} fill="#9aaab8" />
          {/* fogón con olla */}
          <g transform="translate(330 1210)">
            <rect x={-170} y={0} width={340} height={40} rx={8} fill="#3a3a48" />
            <path d="M -110 0 L -100 -140 Q -100 -160 -80 -160 L 80 -160 Q 100 -160 100 -140 L 110 0 Z" fill="#c9d3e6" />
            <rect x={-130} y={-180} width={260} height={30} rx={14} fill="#9aaab8" />
            {[0, 1, 2].map((i) => {
              const t = ((f + i * 20) % 60) / 60;
              return <path key={i} d={`M ${-50 + i * 50} -190 q 20 -40 0 -80 q -20 -40 0 -80`} transform={`translate(0 ${-t * 60})`} stroke="#fff" strokeWidth={10} fill="none" opacity={(1 - t) * 0.6} strokeLinecap="round" />;
            })}
          </g>
        </g>
      )}
      {ver(capa, 'frente') && (
        <g>
          <rect x={-60} y={1400} width={1200} height={580} fill="#5ab8a8" />
          <rect x={-60} y={1380} width={1200} height={40} fill="#e8d2b0" />
          <g transform="translate(200 1330)">
            <ellipse cx={0} cy={40} rx={110} ry={26} fill="#fff" />
            {[[-40, 10, '#ff5a3c'], [10, 0, '#5ac86a'], [50, 16, '#ffd84a']].map(([x, y, c], i) => (
              <circle key={i} cx={x as number} cy={y as number} r={26} fill={c as string} />
            ))}
          </g>
        </g>
      )}
    </g>
  );
};

export const ESCENARIOS = {
  ciudadNoche: {nombre: 'Ciudad de noche', detalle: 'rascacielos · tráfico · farola', C: CiudadNoche},
  parque: {nombre: 'Parque', detalle: 'día · nubes · pájaros', C: Parque},
  playa: {nombre: 'Playa', detalle: 'atardecer · olas · palmera', C: Playa},
  espacio: {nombre: 'Espacio', detalle: 'planetas · nebulosa · asteroides', C: Espacio},
  bosque: {nombre: 'Bosque', detalle: 'niebla · luciérnagas', C: Bosque},
  hospital: {nombre: 'Hospital', detalle: 'monitor cardíaco · camilla', C: Hospital},
  aula: {nombre: 'Aula', detalle: 'pizarra · fórmulas · pupitres', C: Aula},
  oficina: {nombre: 'Oficina', detalle: 'ventanal · gráficas · ordenador', C: Oficina},
  montana: {nombre: 'Montaña', detalle: 'aurora boreal · nieve', C: MontanaAurora},
  marino: {nombre: 'Fondo marino', detalle: 'peces · corales · burbujas', C: FondoMarino},
  desierto: {nombre: 'Desierto', detalle: 'dunas · calima · pirámides', C: Desierto},
  laboratorio: {nombre: 'Laboratorio', detalle: 'matraces · ADN · microscopio', C: Laboratorio},
  cocina: {nombre: 'Cocina', detalle: 'fogón · olla · nevera', C: Cocina},
};
export type NombreEscenario = keyof typeof ESCENARIOS;
