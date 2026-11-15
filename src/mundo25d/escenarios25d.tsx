import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stars} from '../components/Particles';
import {Flame} from '../components/Flame';
import {osc, rnd} from '../lib/anim';

/**
 * ESCENARIOS 2.5D
 *
 * Cada escenario es una lista de PLANOS con su profundidad (0 = horizonte,
 * 1 = plano del personaje, >1 = primer término). La cámara mueve cada plano a
 * distinta velocidad (parallax real) y los objetos se extruyen hacia un punto de
 * fuga, así que muestran sus caras laterales. Los planos lejanos llevan niebla
 * atmosférica (más claros y menos contrastados).
 */
export type Plano25 = {id: string; profundidad: number; cubrir?: boolean; contenido: React.ReactNode};

const S: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

type V = [number, number];
const sombrear = (hex: string, d: number) => {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const r = n.map((v) => Math.max(0, Math.min(255, Math.round(d >= 0 ? v + (255 - v) * d : v * (1 + d)))));
  return `#${r.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** Caja extruida hacia el punto de fuga `vp` (perspectiva de un punto). */
export const Caja: React.FC<{x: number; y: number; w: number; h: number; d: number; c: string; vp?: V; frente?: React.ReactNode; borde?: string}> = ({
  x,
  y,
  w,
  h,
  d,
  c,
  vp = [540, 900],
  frente,
  borde,
}) => {
  const b = (px: number, py: number): V => [vp[0] + (px - vp[0]) * (1 - d), vp[1] + (py - vp[1]) * (1 - d)];
  const A: V = [x, y];
  const B: V = [x + w, y];
  const C: V = [x + w, y + h];
  const D: V = [x, y + h];
  const [A2, B2, C2, D2] = [b(...A), b(...B), b(...C), b(...D)];
  const pts = (...p: V[]) => p.map((q) => q.join(',')).join(' ');
  return (
    <g>
      {x + w < vp[0] && <polygon points={pts(B, B2, C2, C)} fill={sombrear(c, -0.35)} />}
      {x > vp[0] && <polygon points={pts(A, A2, D2, D)} fill={sombrear(c, -0.35)} />}
      {y > vp[1] && <polygon points={pts(A, B, B2, A2)} fill={sombrear(c, 0.25)} />}
      {y + h < vp[1] && <polygon points={pts(D, C, C2, D2)} fill={sombrear(c, -0.5)} />}
      <rect x={x} y={y} width={w} height={h} fill={c} stroke={borde} strokeWidth={borde ? 4 : 0} />
      {frente}
    </g>
  );
};

/** Niebla atmosférica para planos lejanos. */
const Niebla: React.FC<{color: string; op: number}> = ({color, op}) => <rect x={-300} y={-300} width={1680} height={2520} fill={color} opacity={op} />;

/** Suelo en perspectiva con líneas que convergen al punto de fuga. */
const SueloPerspectiva: React.FC<{y: number; c1: string; c2: string; lineas: string; vp?: V; filas?: number; ajedrez?: boolean}> = ({y, c1, c2, lineas, vp = [540, 900], filas = 9, ajedrez}) => {
  const f = useCurrentFrame();
  const ys = new Array(filas).fill(0).map((_, i) => y + (2000 - y) * Math.pow(i / (filas - 1), 1.8));
  const xs = new Array(15).fill(0).map((_, i) => -1400 + i * 280);
  const proy = (x: number, yy: number) => vp[0] + (x - vp[0]) * ((yy - vp[1]) / (2000 - vp[1]));
  return (
    <g>
      <defs>
        <linearGradient id={`sp${c1.slice(1)}${y}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
      </defs>
      <rect x={-300} y={y} width={1680} height={2200 - y} fill={`url(#sp${c1.slice(1)}${y})`} />
      {ajedrez &&
        ys.slice(0, -1).map((y0, r) =>
          xs.slice(0, -1).map((x0, c) =>
            (r + c) % 2 ? (
              <polygon
                key={`${r}-${c}`}
                points={`${proy(x0, y0)},${y0} ${proy(xs[c + 1], y0)},${y0} ${proy(xs[c + 1], ys[r + 1])},${ys[r + 1]} ${proy(x0, ys[r + 1])},${ys[r + 1]}`}
                fill="#000"
                opacity={0.18}
              />
            ) : null,
          ),
        )}
      {!ajedrez && ys.map((yy, i) => <line key={`h${i}`} x1={-300} y1={yy} x2={1380} y2={yy} stroke={lineas} strokeWidth={2 + i * 0.4} opacity={0.5} />)}
      {!ajedrez && xs.map((x, i) => <line key={`v${i}`} x1={proy(x, y)} y1={y} x2={proy(x, 2000)} y2={2000} stroke={lineas} strokeWidth={3} opacity={0.4} />)}
      {f < 0 && null}
    </g>
  );
};

/* ===================================================================== CYBERPUNK */
const Cyberpunk = (id: string): Plano25[] => {
  const Cielo = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <defs>
          <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0420" />
            <stop offset="60%" stopColor="#3a0a5a" />
            <stop offset="100%" stopColor="#ff2a8a" />
          </linearGradient>
        </defs>
        <rect x={-300} y={-300} width={1680} height={2520} fill={`url(#${id}c)`} />
        <circle cx={540} cy={560} r={240} fill="#ff4fb0" opacity={0.25 + osc(f, 90, 0.05)} />
        <circle cx={540} cy={560} r={170} fill="#ffb3e0" opacity={0.5} />
      </S>
    );
  };
  const Lejos = () => (
    <S>
      {new Array(14).fill(0).map((_, i) => {
        const h = 500 + ((i * 131) % 500);
        return <rect key={i} x={-200 + i * 110} y={1000 - h} width={100} height={h + 100} fill="#2a0a4a" />;
      })}
      <Niebla color="#ff4fb0" op={0.18} />
    </S>
  );
  const Medio = () => {
    const f = useCurrentFrame();
    const neon = ['#00f0ff', '#ff2a8a', '#ffe14a', '#7a5aff'];
    const edif: [number, number, number, number][] = [
      [-120, 380, 300, 760],
      [230, 560, 170, 520],
      [700, 460, 200, 640],
      [960, 300, 320, 840],
    ];
    return (
      <S>
        {edif.map(([x, y, w, h], i) => (
          <Caja
            key={i}
            x={x}
            y={y}
            w={w}
            h={h}
            d={0.22}
            c="#1a1036"
            vp={[540, 1000]}
            frente={
              <g>
                {new Array(Math.floor(h / 60)).fill(0).map((_, r) =>
                  new Array(Math.floor(w / 50)).fill(0).map((__, c) => (
                    <rect key={`${r}${c}`} x={x + 14 + c * 50} y={y + 20 + r * 60} width={28} height={30} fill={neon[(i + r + c) % 4]} opacity={rnd(`${id}${i}${r}${c}`) > 0.6 ? 0.7 : 0.08} />
                  )),
                )}
                <rect x={x + 20} y={y + h * 0.35} width={w - 40} height={90} rx={14} fill="none" stroke={neon[i]} strokeWidth={8} opacity={0.6 + (Math.floor(f / 7 + i) % 5 === 0 ? 0 : 0.4)} />
                <text x={x + w / 2} y={y + h * 0.35 + 64} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={52} fill={neon[i]}>
                  {['BAR', '24H', 'NEON', 'HOTEL'][i]}
                </text>
              </g>
            }
          />
        ))}
        {/* holograma */}
        <g opacity={0.55 + osc(f, 8, 0.2)} transform={`translate(540 ${640 + osc(f, 60, 10)})`}>
          <circle r={90} fill="none" stroke="#00f0ff" strokeWidth={6} />
          <circle r={60} fill="#00f0ff" opacity={0.2} />
          <path d="M -40 0 L 0 -50 L 40 0 L 0 50 Z" fill="none" stroke="#00f0ff" strokeWidth={6} transform={`rotate(${f * 3})`} />
        </g>
      </S>
    );
  };
  const Suelo = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <SueloPerspectiva y={1150} c1="#0a0618" c2="#2a0a4a" lineas="#ff2a8a" vp={[540, 1000]} />
        {/* reflejos de neón en el asfalto mojado */}
        {['#00f0ff', '#ff2a8a', '#ffe14a', '#7a5aff'].map((c, i) => (
          <rect key={i} x={[-60, 290, 760, 1020][i]} y={1180} width={90} height={500 + osc(f, 30, 30, i)} fill={c} opacity={0.15} />
        ))}
      </S>
    );
  };
  const Frente = () => {
    const f = useCurrentFrame();
    return (
      <S>
        {new Array(60).fill(0).map((_, i) => {
          const x = rnd(`${id}lx${i}`) * 1200 - 60;
          const y = ((rnd(`${id}ly${i}`) * 2200 + f * 48) % 2200) - 200;
          return <line key={i} x1={x} y1={y} x2={x - 10} y2={y + 70} stroke="#bfe8ff" strokeWidth={3} opacity={0.45} />;
        })}
        <rect x={-40} y={0} width={70} height={1920} fill="#120a24" />
        <rect x={20} y={300} width={180} height={420} rx={20} fill="#120a24" stroke="#00f0ff" strokeWidth={8} opacity={0.95} />
        <text x={110} y={540} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={70} fill="#00f0ff" opacity={Math.floor(f / 5) % 9 === 0 ? 0.3 : 1}>
          ★
        </text>
      </S>
    );
  };
  return [
    {id: 'cielo', profundidad: 0.1, cubrir: true, contenido: <Cielo />},
    {id: 'lejos', profundidad: 0.3, contenido: <Lejos />},
    {id: 'medio', profundidad: 0.6, contenido: <Medio />},
    {id: 'suelo', profundidad: 0.85, contenido: <Suelo />},
    {id: 'frente', profundidad: 1.35, contenido: <Frente />},
  ];
};

/* ===================================================================== SELVA */
const Selva = (id: string): Plano25[] => {
  const hoja = (x: number, y: number, s: number, rot: number, c: string, key: string) => (
    <g key={key} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 0 0 C 80 -60 220 -40 300 0 C 220 40 80 60 0 0 Z" fill={c} />
      <path d="M 0 0 L 290 0" stroke={sombrear(c, -0.3)} strokeWidth={6} />
      {[60, 120, 180, 240].map((p) => (
        <path key={p} d={`M ${p} 0 L ${p + 30} -28 M ${p} 0 L ${p + 30} 28`} stroke={sombrear(c, -0.3)} strokeWidth={4} />
      ))}
    </g>
  );
  const Cielo = () => (
    <S>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ad6c8" />
          <stop offset="100%" stopColor="#e8f8c8" />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2520} fill={`url(#${id}c)`} />
      <circle cx={760} cy={380} r={110} fill="#fff8c8" opacity={0.9} />
    </S>
  );
  const Lejos = () => (
    <S>
      <path d="M -300 1100 L 0 600 L 250 900 L 500 520 L 800 950 L 1050 650 L 1380 1000 L 1380 1400 L -300 1400 Z" fill="#4a8a70" />
      <Niebla color="#e8f8e0" op={0.45} />
    </S>
  );
  const Medio = () => {
    const f = useCurrentFrame();
    return (
      <S>
        {/* cascada */}
        <path d="M 600 620 L 760 620 L 800 1250 L 560 1250 Z" fill="#9ae0f0" />
        {new Array(8).fill(0).map((_, i) => (
          <rect key={i} x={590 + i * 26} y={620 + ((f * 18 + i * 70) % 620)} width={10} height={80} fill="#fff" opacity={0.6} />
        ))}
        <ellipse cx={680} cy={1260} rx={200} ry={40} fill="#fff" opacity={0.6 + osc(f, 10, 0.15)} />
        <rect x={420} y={560} width={180} height={700} fill="#5a7a4a" />
        <rect x={760} y={580} width={200} height={680} fill="#4a6a3a" />
        {/* árboles con copa en capas */}
        {[[160, 1250, 1.2], [960, 1260, 1.4]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-26} y={-520} width={52} height={520} fill="#6a4a2a" />
            {[0, 1, 2].map((q) => (
              <ellipse key={q} cx={osc(f, 90, 6, q)} cy={-540 + q * 70} rx={220 - q * 30} ry={110} fill={['#2f8a4a', '#3fa05a', '#56b86a'][q]} />
            ))}
          </g>
        ))}
      </S>
    );
  };
  const Suelo = () => (
    <S>
      <path d="M -300 1250 Q 540 1180 1380 1250 L 1380 2200 L -300 2200 Z" fill="#3f7a3a" />
      <path d="M 400 1260 Q 700 1500 500 2000 L 900 2000 Q 1000 1500 760 1260 Z" fill="#5ab8d6" opacity={0.85} />
    </S>
  );
  const Frente = () => {
    const f = useCurrentFrame();
    return (
      <S>
        {hoja(-80, 1500 + osc(f, 70, 10), 1.6, -30 + osc(f, 60, 4), '#1f6a34', 'a')}
        {hoja(-60, 1800, 1.8, -10, '#2a7a40', 'b')}
        {hoja(1160, 1400 + osc(f, 80, 10), 1.7, 210 + osc(f, 64, 4), '#1f6a34', 'c')}
        {hoja(1180, 1750, 1.9, 190, '#2a7a40', 'd')}
        {/* mariposa */}
        <g transform={`translate(${300 + osc(f, 120, 200)} ${900 + osc(f, 80, 120)})`}>
          <ellipse cx={-14} cy={0} rx={18 * Math.abs(Math.sin(f / 3))} ry={24} fill="#ff7a2f" />
          <ellipse cx={14} cy={0} rx={18 * Math.abs(Math.sin(f / 3))} ry={24} fill="#ff7a2f" />
        </g>
      </S>
    );
  };
  return [
    {id: 'cielo', profundidad: 0.1, cubrir: true, contenido: <Cielo />},
    {id: 'lejos', profundidad: 0.3, contenido: <Lejos />},
    {id: 'medio', profundidad: 0.6, contenido: <Medio />},
    {id: 'suelo', profundidad: 0.85, contenido: <Suelo />},
    {id: 'frente', profundidad: 1.4, contenido: <Frente />},
  ];
};

/* ===================================================================== CASTILLO */
const Castillo = (id: string): Plano25[] => {
  const vp: V = [540, 980];
  const Fondo = () => (
    <S>
      <rect x={-300} y={-300} width={1680} height={2520} fill="#2a2430" />
      {new Array(30).fill(0).map((_, r) =>
        new Array(12).fill(0).map((__, c) => <rect key={`${r}${c}`} x={-200 + c * 130 + (r % 2) * 65} y={-200 + r * 62} width={124} height={56} fill="#3a3242" stroke="#221c28" strokeWidth={4} />),
      )}
      {/* ventana gótica con luna */}
      <path d="M 400 900 L 400 560 Q 540 380 680 560 L 680 900 Z" fill="#1a2a5a" />
      <circle cx={590} cy={600} r={50} fill="#fff4d6" />
      <path d="M 400 900 L 400 560 Q 540 380 680 560 L 680 900 Z" fill="none" stroke="#5a4a5a" strokeWidth={18} />
      <line x1={540} y1={470} x2={540} y2={900} stroke="#5a4a5a" strokeWidth={12} />
      <polygon points="400,900 680,900 900,1600 200,1600" fill="#bfd0ff" opacity={0.08} />
      {/* estandartes */}
      {[180, 900].map((x, i) => (
        <path key={i} d={`M ${x - 70} 420 L ${x + 70} 420 L ${x + 70} 900 L ${x} 840 L ${x - 70} 900 Z`} fill={i ? '#2a5ad6' : '#c42a3a'} />
      ))}
    </S>
  );
  const Pilares = () => {
    const f = useCurrentFrame();
    return (
      <S>
        {[[60, 300], [860, 300]].map(([x, y], i) => (
          <g key={i}>
            <Caja x={x} y={y} w={160} h={1000} d={0.18} c="#5a5060" vp={vp} />
            <g transform={`translate(${x + 80} 720)`}>
              <rect x={-14} y={0} width={28} height={70} fill="#4a3a2a" />
              <Flame x={0} y={-10} size={60 + osc(f, 9, 4)} seed={i + 40} />
              <circle cx={0} cy={-40} r={220} fill="#ff9a3a" opacity={0.12 + osc(f, 7, 0.03)} />
            </g>
          </g>
        ))}
      </S>
    );
  };
  const Suelo = () => (
    <S>
      <SueloPerspectiva y={1300} c1="#5a4a3a" c2="#3a3028" lineas="#2a2018" vp={vp} filas={10} ajedrez />
      <path d="M 400 1300 L 680 1300 L 900 2000 L 180 2000 Z" fill="#8a1a2a" opacity={0.85} />
    </S>
  );
  const Frente = () => (
    <S>
      <path d="M -60 -60 L 1140 -60 L 1140 300 Q 540 0 -60 300 Z" fill="#1a1620" />
      <rect x={-60} y={-60} width={140} height={2100} fill="#1a1620" />
      <rect x={1000} y={-60} width={140} height={2100} fill="#1a1620" />
    </S>
  );
  return [
    {id: 'fondo', profundidad: 0.3, cubrir: true, contenido: <Fondo />},
    {id: 'pilares', profundidad: 0.65, contenido: <Pilares />},
    {id: 'suelo', profundidad: 0.85, contenido: <Suelo />},
    {id: 'frente', profundidad: 1.35, contenido: <Frente />},
  ];
};

/* ===================================================================== VOLCÁN */
const Volcan = (id: string): Plano25[] => {
  const Cielo = () => (
    <S>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a0a" />
          <stop offset="60%" stopColor="#6a1a0a" />
          <stop offset="100%" stopColor="#ff6a1a" />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2520} fill={`url(#${id}c)`} />
    </S>
  );
  const Volcano = () => {
    const f = useCurrentFrame();
    return (
      <S>
        {[0, 1, 2, 3].map((i) => {
          const t = ((f + i * 30) % 120) / 120;
          return <circle key={i} cx={540 + osc(f + i * 20, 80, 60)} cy={560 - t * 500} r={90 + t * 160} fill="#3a2a2a" opacity={(1 - t) * 0.7} />;
        })}
        <path d="M -100 1300 L 420 600 L 660 600 L 1180 1300 Z" fill="#3a1a14" />
        <path d="M 540 600 L 660 600 L 1180 1300 L 760 1300 Z" fill="#2a100c" />
        <path d={`M 470 610 Q 500 900 430 1300 L 520 1300 Q 560 900 560 610 Z`} fill="#ff6a1a" opacity={0.9} />
        <ellipse cx={540} cy={600} rx={130} ry={26} fill="#ffb03a" />
        {new Array(16).fill(0).map((_, i) => {
          const t = ((f * 1.4 + i * 9) % 50) / 50;
          const a = -Math.PI / 2 + (rnd(`${id}a${i}`) - 0.5) * 1.6;
          return <circle key={i} cx={540 + Math.cos(a) * t * 400} cy={600 + Math.sin(a) * t * 500 + t * t * 500} r={10} fill="#ffcf3a" opacity={1 - t} />;
        })}
        <Niebla color="#ff6a1a" op={0.12} />
      </S>
    );
  };
  const Rocas = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <path d="M -300 1300 Q 540 1240 1380 1300 L 1380 2200 L -300 2200 Z" fill="#2a1612" />
        <path d={`M 200 2000 Q 400 1600 560 1300 L 640 1300 Q 600 1600 700 2000 Z`} fill="#ff5a1a" opacity={0.85 + osc(f, 20, 0.1)} />
        <Caja x={40} y={1420} w={220} h={180} d={0.25} c="#4a2a22" vp={[540, 1100]} />
        <Caja x={820} y={1460} w={240} h={200} d={0.25} c="#4a2a22" vp={[540, 1100]} />
      </S>
    );
  };
  const Frente = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <path d="M -60 1980 L -60 1650 Q 120 1580 300 1700 L 360 1980 Z" fill="#1a0c0a" />
        <path d="M 1140 1980 L 1140 1600 Q 960 1560 820 1720 L 760 1980 Z" fill="#1a0c0a" />
        {new Array(24).fill(0).map((_, i) => (
          <circle key={i} cx={rnd(`${id}e${i}`) * 1080 + osc(f, 50, 30, i)} cy={2000 - ((f * (2 + (i % 3)) + i * 90) % 2100)} r={4 + (i % 3) * 2} fill="#ffb03a" opacity={0.8} />
        ))}
      </S>
    );
  };
  return [
    {id: 'cielo', profundidad: 0.1, cubrir: true, contenido: <Cielo />},
    {id: 'volcan', profundidad: 0.3, contenido: <Volcano />},
    {id: 'rocas', profundidad: 0.8, contenido: <Rocas />},
    {id: 'frente', profundidad: 1.35, contenido: <Frente />},
  ];
};

/* ===================================================================== ESTACIÓN ESPACIAL */
const Estacion = (id: string): Plano25[] => {
  const vp: V = [540, 860];
  const Ventanal = () => (
    <S>
      <rect x={-300} y={-300} width={1680} height={2520} fill="#02030c" />
      <Stars count={80} area={[200, 500, 880, 1220]} seed={`${id}s`} />
      <circle cx={620} cy={980} r={210} fill="#3a7ad6" />
      <path d="M 470 900 Q 560 840 640 900 Q 700 980 600 1020 Q 500 1040 470 900 Z" fill="#5ac86a" />
      <circle cx={620} cy={980} r={240} fill="#7ac8ff" opacity={0.15} />
    </S>
  );
  const Pasillo = () => {
    const f = useCurrentFrame();
    // marcos del pasillo en perspectiva de un punto
    const marcos = [0, 1, 2, 3, 4].map((i) => 1 - i * 0.18);
    const r = (s: number) => ({x: vp[0] - 560 * s, y: vp[1] - 980 * s, w: 1120 * s, h: 2000 * s});
    return (
      <S>
        {/* paredes, techo y suelo */}
        <polygon points={`-300,-300 ${vp[0] - 260},${vp[1] - 360} ${vp[0] - 260},${vp[1] + 360} -300,2300`} fill="#3a4258" />
        <polygon points={`1380,-300 ${vp[0] + 260},${vp[1] - 360} ${vp[0] + 260},${vp[1] + 360} 1380,2300`} fill="#2e3448" />
        <polygon points={`-300,-300 1380,-300 ${vp[0] + 260},${vp[1] - 360} ${vp[0] - 260},${vp[1] - 360}`} fill="#4a5470" />
        <polygon points={`-300,2300 1380,2300 ${vp[0] + 260},${vp[1] + 360} ${vp[0] - 260},${vp[1] + 360}`} fill="#262a3a" />
        {marcos.map((s, i) => {
          const q = r(s * 0.9 + 0.1);
          return <rect key={i} x={q.x} y={q.y} width={q.w} height={q.h} fill="none" stroke="#6a7a9a" strokeWidth={14 * s} />;
        })}
        {/* luces que recorren el pasillo */}
        {[0, 1, 2].map((i) => {
          const t = ((f / 40 + i / 3) % 1);
          const s = 1 - t * 0.75;
          return <rect key={i} x={vp[0] - 40 * s} y={vp[1] + 380 * s + 300 * s} width={80 * s} height={12 * s} fill="#3fd8ff" opacity={0.8 * (1 - t)} />;
        })}
        {/* hueco del ventanal (recortado) */}
        <rect x={vp[0] - 260} y={vp[1] - 360} width={520} height={720} fill="none" stroke="#8a9aba" strokeWidth={20} />
        {/* panel con luces */}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={130} cy={700 + i * 60} r={14} fill={['#ff4f6e', '#5dff9c', '#ffd84a', '#3fd8ff'][i]} opacity={Math.floor(f / 10 + i) % 3 === 0 ? 0.3 : 1} />
        ))}
      </S>
    );
  };
  const Flotantes = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <g transform={`translate(${860 + osc(f, 90, 30)} ${560 + osc(f, 70, 40)}) rotate(${f})`}>
          <rect x={-40} y={-50} width={80} height={100} rx={12} fill="#eef1f6" />
          <rect x={-30} y={-40} width={60} height={30} rx={6} fill="#3fd8ff" />
        </g>
        <g transform={`translate(${200 + osc(f, 110, 20)} ${1300 + osc(f, 80, 30)}) rotate(${-f * 0.7})`}>
          <circle r={34} fill="#ff7a2f" />
          <rect x={-8} y={-60} width={16} height={30} fill="#9aaab8" />
        </g>
      </S>
    );
  };
  return [
    {id: 'ventanal', profundidad: 0.15, cubrir: true, contenido: <Ventanal />},
    {id: 'pasillo', profundidad: 0.75, cubrir: true, contenido: <Pasillo />},
    {id: 'flotantes', profundidad: 1.3, contenido: <Flotantes />},
  ];
};

/* ===================================================================== JARDÍN JAPONÉS */
const Japon = (id: string): Plano25[] => {
  const Cielo = () => (
    <S>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a4a9a" />
          <stop offset="55%" stopColor="#ff9ab8" />
          <stop offset="100%" stopColor="#ffd8a8" />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2520} fill={`url(#${id}c)`} />
      <circle cx={300} cy={620} r={120} fill="#ff6a6a" opacity={0.9} />
    </S>
  );
  const Fuji = () => (
    <S>
      <path d="M -100 1150 L 440 560 L 640 560 L 1180 1150 Z" fill="#6a5a9a" />
      <path d="M 440 560 L 640 560 L 720 650 Q 640 620 600 680 Q 540 620 480 690 Q 420 640 360 650 Z" fill="#fff" />
      <Niebla color="#ffd8e8" op={0.35} />
    </S>
  );
  const Templo = () => {
    const tejado = (y: number, w: number) => (
      <path d={`M ${540 - w} ${y} Q ${540 - w * 0.6} ${y - 30} 540 ${y - 70} Q ${540 + w * 0.6} ${y - 30} ${540 + w} ${y} Q ${540 + w * 0.8} ${y - 10} ${540 + w * 0.85} ${y - 26} L ${540 - w * 0.85} ${y - 26} Q ${540 - w * 0.8} ${y - 10} ${540 - w} ${y} Z`} fill="#3a2a3a" />
    );
    return (
      <S>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={540 - (120 - i * 20)} y={1080 - i * 170} width={(120 - i * 20) * 2} height={150} fill="#c43a3a" />
            {tejado(1090 - i * 170, 220 - i * 35)}
          </g>
        ))}
        {/* torii extruido */}
        <Caja x={150} y={900} w={40} h={420} d={0.06} c="#e0302a" vp={[540, 950]} />
        <Caja x={390} y={900} w={40} h={420} d={0.06} c="#e0302a" vp={[540, 950]} />
        <rect x={110} y={880} width={360} height={40} rx={10} fill="#e0302a" />
        <rect x={130} y={950} width={320} height={24} fill="#c42a24" />
      </S>
    );
  };
  const Estanque = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <path d="M -300 1300 Q 540 1240 1380 1300 L 1380 2200 L -300 2200 Z" fill="#7ab86a" />
        <ellipse cx={600} cy={1600} rx={460} ry={180} fill="#4a8ad6" />
        <ellipse cx={600} cy={1600} rx={460} ry={180} fill="#fff" opacity={0.1} />
        {[0, 1].map((i) => {
          const a = f / 40 + i * Math.PI;
          return (
            <g key={i} transform={`translate(${600 + Math.cos(a) * 280} ${1600 + Math.sin(a) * 90}) rotate(${(a * 180) / Math.PI + 90})`}>
              <ellipse rx={40} ry={16} fill={i ? '#ffffff' : '#ff7a2f'} />
              <circle cx={-10} cy={0} r={8} fill="#ff7a2f" />
            </g>
          );
        })}
        <path d="M 200 1620 Q 600 1420 1000 1620" stroke="#c43a3a" strokeWidth={30} fill="none" />
      </S>
    );
  };
  const Frente = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <path d={`M -60 200 Q 300 260 520 ${180 + osc(f, 80, 10)}`} stroke="#3a2a2a" strokeWidth={30} fill="none" strokeLinecap="round" />
        {new Array(14).fill(0).map((_, i) => (
          <circle key={i} cx={40 + i * 34} cy={200 + Math.sin(i) * 40 + osc(f, 70, 6, i)} r={46} fill={i % 2 ? '#ffb8d0' : '#ffd0e0'} />
        ))}
        {new Array(22).fill(0).map((_, i) => {
          const y = ((f * (2 + (i % 3)) + i * 100) % 2100) - 100;
          return <ellipse key={`p${i}`} cx={rnd(`${id}p${i}`) * 1080 + Math.sin(y / 80) * 40} cy={y} rx={10} ry={6} fill="#ffc0d8" transform={`rotate(${y} ${rnd(`${id}p${i}`) * 1080} ${y})`} />;
        })}
      </S>
    );
  };
  return [
    {id: 'cielo', profundidad: 0.1, cubrir: true, contenido: <Cielo />},
    {id: 'fuji', profundidad: 0.25, contenido: <Fuji />},
    {id: 'templo', profundidad: 0.55, contenido: <Templo />},
    {id: 'estanque', profundidad: 0.85, contenido: <Estanque />},
    {id: 'frente', profundidad: 1.4, contenido: <Frente />},
  ];
};

/* ===================================================================== GRANJA */
const Granja = (id: string): Plano25[] => {
  const Cielo = () => (
    <S>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ab8ff" />
          <stop offset="70%" stopColor="#ffe0a8" />
          <stop offset="100%" stopColor="#ffb07a" />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2520} fill={`url(#${id}c)`} />
      <circle cx={820} cy={900} r={130} fill="#fff3b0" />
    </S>
  );
  const Colinas = () => (
    <S>
      <path d="M -300 1050 Q 200 880 600 1000 T 1380 960 L 1380 1400 L -300 1400 Z" fill="#9ac86a" />
      {new Array(7).fill(0).map((_, i) => (
        <path key={i} d={`M -300 ${1060 + i * 30} Q 200 ${900 + i * 30} 600 ${1010 + i * 30} T 1380 ${970 + i * 30}`} stroke={i % 2 ? '#e8c85a' : '#7ab84a'} strokeWidth={12} fill="none" opacity={0.7} />
      ))}
      <Niebla color="#fff0d0" op={0.3} />
    </S>
  );
  const Granero = () => {
    const f = useCurrentFrame();
    const vp: V = [540, 1000];
    return (
      <S>
        <Caja x={120} y={820} w={360} h={380} d={0.2} c="#c4302a" vp={vp} frente={<path d="M 220 1200 L 220 1000 L 380 1000 L 380 1200 M 220 1000 L 380 1200 M 380 1000 L 220 1200" stroke="#fff" strokeWidth={10} fill="none" />} />
        <polygon points="100,830 300,660 500,830" fill="#8a2a24" />
        <Caja x={620} y={760} w={110} h={440} d={0.12} c="#c8c8d0" vp={vp} />
        <ellipse cx={675} cy={760} rx={56} ry={30} fill="#9a9aa8" />
        {/* molino */}
        <g transform="translate(900 820)">
          <polygon points="-24,0 24,0 40,380 -40,380" fill="#e8e0d0" />
          <g transform={`rotate(${f * 2})`}>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={-14} y={-200} width={28} height={190} fill="#fff" stroke="#9a8a7a" strokeWidth={4} transform={`rotate(${i * 90})`} />
            ))}
          </g>
          <circle r={16} fill="#5a4a3a" />
        </g>
      </S>
    );
  };
  const Suelo = () => (
    <S>
      <path d="M -300 1200 Q 540 1150 1380 1200 L 1380 2200 L -300 2200 Z" fill="#6aa84a" />
      <path d="M 420 1200 L 660 1200 L 900 2000 L 160 2000 Z" fill="#c8a06a" />
      {new Array(8).fill(0).map((_, i) => {
        const t = i / 7;
        const y = 1220 + Math.pow(t, 1.7) * 700;
        const s = 0.4 + t * 1.2;
        return (
          <g key={i}>
            <rect x={60 - t * 240} y={y - 80 * s} width={14 * s} height={90 * s} fill="#8a5a3a" />
            <rect x={60 - t * 240} y={y - 64 * s} width={90 * s} height={10 * s} fill="#8a5a3a" />
          </g>
        );
      })}
    </S>
  );
  const Frente = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <Caja x={-40} y={1660} w={300} h={220} d={0.18} c="#e8c85a" vp={[540, 1100]} />
        {[[860, 1550], [980, 1620]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${osc(f, 70, 4, i)})`}>
            <rect x={-6} y={0} width={12} height={400} fill="#3a8a3a" />
            {new Array(12).fill(0).map((_, q) => (
              <ellipse key={q} cx={0} cy={-50} rx={16} ry={50} fill="#ffcf2a" transform={`rotate(${q * 30} 0 0)`} />
            ))}
            <circle r={36} fill="#6a3a1a" />
          </g>
        ))}
      </S>
    );
  };
  return [
    {id: 'cielo', profundidad: 0.1, cubrir: true, contenido: <Cielo />},
    {id: 'colinas', profundidad: 0.3, contenido: <Colinas />},
    {id: 'granero', profundidad: 0.6, contenido: <Granero />},
    {id: 'suelo', profundidad: 0.85, contenido: <Suelo />},
    {id: 'frente', profundidad: 1.35, contenido: <Frente />},
  ];
};

/* ===================================================================== TALLER STEAMPUNK */
const Engranaje: React.FC<{r: number; dientes: number; c: string; rot: number}> = ({r, dientes, c, rot}) => (
  <g transform={`rotate(${rot})`}>
    {new Array(dientes).fill(0).map((_, i) => (
      <rect key={i} x={-r * 0.12} y={-r - r * 0.18} width={r * 0.24} height={r * 0.36} rx={4} fill={c} transform={`rotate(${(i * 360) / dientes})`} />
    ))}
    <circle r={r} fill={c} />
    <circle r={r * 0.82} fill={sombrear(c, -0.2)} />
    <circle r={r * 0.72} fill={c} />
    {[0, 1, 2, 3, 4].map((i) => (
      <circle key={i} cx={Math.cos((i * 2 * Math.PI) / 5) * r * 0.45} cy={Math.sin((i * 2 * Math.PI) / 5) * r * 0.45} r={r * 0.13} fill={sombrear(c, -0.45)} />
    ))}
    <circle r={r * 0.18} fill={sombrear(c, 0.35)} />
  </g>
);

const Steampunk = (id: string): Plano25[] => {
  const Pared = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <rect x={-300} y={-300} width={1680} height={2520} fill="#4a2a1a" />
        {new Array(34).fill(0).map((_, r) =>
          new Array(12).fill(0).map((__, c) => <rect key={`${r}${c}`} x={-200 + c * 120 + (r % 2) * 60} y={-200 + r * 60} width={114} height={54} fill="#6a3a24" opacity={0.9} />),
        )}
        <g transform="translate(280 560)">
          <Engranaje r={170} dientes={14} c="#b8862a" rot={f * 1.2} />
        </g>
        <g transform="translate(560 400)">
          <Engranaje r={110} dientes={10} c="#8a6a3a" rot={-f * 1.85 + 14} />
        </g>
        <g transform="translate(820 640)">
          <Engranaje r={140} dientes={12} c="#c89a4a" rot={f * 1.45} />
        </g>
        <Niebla color="#ffb06a" op={0.1} />
      </S>
    );
  };
  const Tuberias = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <path d="M -100 1000 L 300 1000 Q 360 1000 360 940 L 360 760 Q 360 700 420 700 L 1200 700" stroke="#a8742a" strokeWidth={46} fill="none" />
        <path d="M -100 1000 L 300 1000 Q 360 1000 360 940 L 360 760 Q 360 700 420 700 L 1200 700" stroke="#e0b060" strokeWidth={10} fill="none" opacity={0.6} transform="translate(-8 -10)" />
        {[200, 660, 980].map((x, i) => (
          <g key={i} transform={`translate(${x} ${i === 0 ? 1000 : 700})`}>
            <circle r={58} fill="#e8e0c8" stroke="#a8742a" strokeWidth={12} />
            <line x1={0} y1={0} x2={Math.cos(osc(f, 40, 1.2, i) - 1.2) * 40} y2={Math.sin(osc(f, 40, 1.2, i) - 1.2) * 40} stroke="#c42a2a" strokeWidth={6} strokeLinecap="round" />
          </g>
        ))}
        {[0, 1, 2].map((i) => {
          const t = ((f + i * 18) % 54) / 54;
          return <circle key={i} cx={1040 + t * 60} cy={660 - t * 240} r={30 + t * 70} fill="#fff" opacity={(1 - t) * 0.5} />;
        })}
      </S>
    );
  };
  const Suelo = () => <S><SueloPerspectiva y={1250} c1="#6a4024" c2="#3a2416" lineas="#2a1810" vp={[540, 950]} /></S>;
  const Frente = () => {
    const f = useCurrentFrame();
    return (
      <S>
        <g transform="translate(1080 1900)">
          <Engranaje r={300} dientes={18} c="#7a5a2a" rot={-f * 0.8} />
        </g>
        <g transform="translate(-40 260)">
          <Engranaje r={160} dientes={12} c="#6a4a24" rot={f * 1.5} />
        </g>
      </S>
    );
  };
  return [
    {id: 'pared', profundidad: 0.3, cubrir: true, contenido: <Pared />},
    {id: 'tuberias', profundidad: 0.6, contenido: <Tuberias />},
    {id: 'suelo', profundidad: 0.85, contenido: <Suelo />},
    {id: 'frente', profundidad: 1.4, contenido: <Frente />},
  ];
};

export const ESCENARIOS_25D = {
  cyberpunk: {nombre: 'Ciudad cyberpunk', detalle: 'neón · lluvia · hologramas', planos: Cyberpunk, personajeY: 1560},
  selva: {nombre: 'Selva tropical', detalle: 'cascada · hojas gigantes', planos: Selva, personajeY: 1560},
  castillo: {nombre: 'Castillo', detalle: 'antorchas · pilares · alfombra', planos: Castillo, personajeY: 1600},
  volcan: {nombre: 'Volcán', detalle: 'lava · ceniza · brasas', planos: Volcan, personajeY: 1600},
  estacion: {nombre: 'Estación espacial', detalle: 'pasillo en perspectiva', planos: Estacion, personajeY: 1580},
  japon: {nombre: 'Jardín japonés', detalle: 'pagoda · torii · cerezos', planos: Japon, personajeY: 1600},
  granja: {nombre: 'Granja', detalle: 'granero · molino · girasoles', planos: Granja, personajeY: 1580},
  steampunk: {nombre: 'Taller steampunk', detalle: 'engranajes · vapor · manómetros', planos: Steampunk, personajeY: 1600},
};
export type NombreEscenario25 = keyof typeof ESCENARIOS_25D;

/** Pinta un escenario completo (todos los planos, opcionalmente con algo en medio). */
export const EscenarioCompleto: React.FC<{nombre: NombreEscenario25; id: string; personaje?: React.ReactNode}> = ({nombre, id, personaje}) => {
  const planos = ESCENARIOS_25D[nombre].planos(id);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {planos.filter((p) => p.profundidad <= 1).map((p) => <div key={p.id} style={{position: 'absolute', inset: 0}}>{p.contenido}</div>)}
      {personaje}
      {planos.filter((p) => p.profundidad > 1).map((p) => <div key={p.id} style={{position: 'absolute', inset: 0}}>{p.contenido}</div>)}
    </div>
  );
};
