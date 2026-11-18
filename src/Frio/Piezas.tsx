// Piezas comunes del reel del frío: fondo helado con nieve y escarcha, rótulos, termómetro,
// cronómetro, monitor cardiaco y el protagonista 2D (que tirita y se va poniendo azul).
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random, spring } from "remotion";
import { Accion2D, Cara, Personaje2D } from "../comun/Personaje2D";

export const W = 1080;
export const H = 1920;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const SANS = "'Arial Black', 'Helvetica Neue', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

export const HIELO = "#bfe9ff";
export const CIAN = "#5fd4ff";
export const ROJO = "#ff3b4e";
export const VERDE = "#38e07b";
export const AMARILLO = "#ffd23f";

export const muelle = (f: number, inicio: number, damping = 11) =>
  spring({ frame: f - inicio, fps: 30, config: { damping, stiffness: 150 } });
export const tramo = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);

// ---------- fondo: degradado polar, aurora suave, nieve que cae y escarcha en los bordes ----------
export const Fondo: React.FC<{ f: number; de?: string; a?: string; nieve?: number; escarcha?: number; viento?: number; aurora?: boolean }> = ({
  f,
  de = "#1b4a86",
  a = "#040c22",
  nieve = 1,
  escarcha = 0.5,
  viento = 0,
  aurora = true,
}) => (
  <>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, ${de} 0%, ${a} 80%)` }} />
    {aurora && (
      <AbsoluteFill
        style={{
          background: `linear-gradient(${100 + Math.sin(f / 50) * 10}deg, rgba(60,255,190,0) 20%, rgba(60,255,190,0.13) 45%, rgba(120,140,255,0.12) 60%, rgba(60,255,190,0) 80%)`,
          transform: `translateY(${-420 + Math.sin(f / 40) * 30}px) skewY(-8deg)`,
          filter: "blur(30px)",
        }}
      />
    )}
    <Nieve f={f} n={Math.round(70 * nieve)} viento={viento} />
    <Escarcha intensidad={escarcha} f={f} />
  </>
);

export const Nieve: React.FC<{ f: number; n?: number; viento?: number; semilla?: string }> = ({ f, n = 70, viento = 0, semilla = "n" }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {Array.from({ length: n }, (_, i) => {
      const prof = 0.4 + random(`${semilla}p${i}`) * 0.9;
      const vy = (1.5 + random(`${semilla}v${i}`) * 2) * prof;
      const vx = viento * (8 + random(`${semilla}w${i}`) * 10) * prof;
      const x = (((random(`${semilla}x${i}`) * W + f * vx + Math.sin(f / 25 + i) * 18 * prof) % (W + 100)) + W + 100) % (W + 100) - 50;
      const y = ((random(`${semilla}y${i}`) * H + f * vy * 3) % (H + 40)) - 20;
      const r = (2 + random(`${semilla}r${i}`) * 5) * prof;
      return viento > 1.5 ? (
        <line key={i} x1={x} y1={y} x2={x - vx * 2.2} y2={y - vy * 1.5} stroke="#fff" strokeWidth={r * 0.8} strokeLinecap="round" opacity={0.35 + prof * 0.4} />
      ) : (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.3 + prof * 0.5} />
      );
    })}
  </svg>
);

// cristales de hielo en las esquinas y viñeta blanquecina
export const Escarcha: React.FC<{ intensidad: number; f: number }> = ({ intensidad, f }) => {
  if (intensidad <= 0) return null;
  const rama = (x: number, y: number, ang: number, largo: number, k: string, nivel: number): React.ReactNode[] => {
    if (nivel === 0 || largo < 12) return [];
    const x2 = x + Math.cos(ang) * largo;
    const y2 = y + Math.sin(ang) * largo;
    return [
      <line key={k} x1={x} y1={y} x2={x2} y2={y2} stroke="#e8f7ff" strokeWidth={nivel * 1.6} strokeLinecap="round" opacity={0.55} />,
      ...rama(x2, y2, ang - 0.55, largo * 0.62, k + "a", nivel - 1),
      ...rama(x2, y2, ang + 0.55, largo * 0.62, k + "b", nivel - 1),
      ...rama((x + x2) / 2, (y + y2) / 2, ang + (random(k) > 0.5 ? 0.9 : -0.9), largo * 0.45, k + "c", nivel - 1),
    ];
  };
  const esquinas: [number, number, number][] = [
    [0, 0, Math.PI / 4],
    [W, 0, (3 * Math.PI) / 4],
    [0, H, -Math.PI / 4],
    [W, H, (-3 * Math.PI) / 4],
  ];
  return (
    <>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0) ${70 - intensidad * 22}%, rgba(205,235,255,${0.45 * intensidad}) 100%)`,
        }}
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: Math.min(1, intensidad * 1.3) }}>
        {esquinas.map(([x, y, a], i) =>
          [-0.5, 0, 0.5].map((d, j) => (
            <g key={`${i}${j}`}>{rama(x, y, a + d, (120 + 90 * intensidad) * (1 + Math.sin(f / 60 + i) * 0.03), `e${i}${j}`, 5)}</g>
          )),
        )}
      </svg>
    </>
  );
};

// ---------- textos ----------
export const Rotulo: React.FC<{
  f: number;
  inicio: number;
  texto: string;
  y: number;
  tam: number;
  color?: string;
  fondo?: string;
  giro?: number;
  x?: number;
  borde?: string;
}> = ({ f, inicio, texto, y, tam, color = "#fff", fondo, giro = 0, x = W / 2, borde }) => {
  const s = muelle(f, inicio, 9);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, 0) rotate(${giro}deg) scale(${interpolate(s, [0, 1], [0.4, 1])})`,
        opacity: Math.min(1, s * 1.6),
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: tam,
        lineHeight: 1.02,
        color,
        textAlign: "center",
        whiteSpace: "pre",
        letterSpacing: 1,
        padding: fondo ? "10px 34px 14px" : 0,
        background: fondo,
        borderRadius: 26,
        border: borde ? `6px solid ${borde}` : undefined,
        textShadow: fondo ? "none" : "0 8px 26px rgba(0,10,40,0.85), 0 0 3px #000",
        boxShadow: fondo ? "0 14px 34px rgba(0,0,0,0.45)" : undefined,
      }}
    >
      {texto}
    </div>
  );
};

export const Sello: React.FC<{ f: number; inicio: number; x: number; y: number; texto: string; color?: string; tam?: number; giro?: number }> = ({
  f,
  inicio,
  x,
  y,
  texto,
  color = ROJO,
  tam = 96,
  giro = -10,
}) => {
  const s = muelle(f, inicio, 8);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${giro}deg) scale(${interpolate(s, [0, 1], [2.6, 1])})`,
        opacity: Math.min(1, s * 2),
        border: `10px solid ${color}`,
        color,
        borderRadius: 22,
        padding: "2px 34px 8px",
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: tam,
        background: "rgba(255,255,255,0.94)",
        whiteSpace: "nowrap",
        boxShadow: "0 14px 34px rgba(0,0,0,0.5)",
      }}
    >
      {texto}
    </div>
  );
};

// número que cuenta de un valor a otro
export const Cuenta: React.FC<{ f: number; a: number; b: number; desde: number; hasta: number; decimales?: number; sufijo?: string; y: number; tam: number; color?: string; x?: number }> = ({
  f,
  a,
  b,
  desde,
  hasta,
  decimales = 0,
  sufijo = "",
  y,
  tam,
  color = "#fff",
  x = W / 2,
}) => {
  const v = interpolate(f, [a, b], [desde, hasta], clamp);
  const s = muelle(f, a - 6, 10);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, 0) scale(${0.6 + 0.4 * s})`,
        opacity: Math.min(1, s * 1.5),
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: tam,
        color,
        whiteSpace: "nowrap",
        textShadow: "0 10px 30px rgba(0,10,40,0.85)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {v.toFixed(decimales).replace(".", ",").replace("-", "−")}
      {sufijo}
    </div>
  );
};

// ---------- termómetro ----------
// temp en °C; el rango [min, max] se reparte en la altura del tubo. El mercurio pasa de rojo a azul.
export const Termometro: React.FC<{ x: number; y: number; alto: number; temp: number; min?: number; max?: number; marcas?: number[]; peligro?: number; escala?: number }> = ({
  x,
  y,
  alto,
  temp,
  min = 10,
  max = 40,
  marcas = [],
  peligro,
  escala = 1,
}) => {
  const t = Math.max(0, Math.min(1, (temp - min) / (max - min)));
  const color = interpolateColors(temp, [min, (min + max) / 2, max - 3], ["#3b8bff", "#8a6bff", "#ff3b4e"]);
  const ancho = 70;
  const bulbo = 70;
  const yNivel = alto - t * alto;
  const yDe = (v: number) => alto - ((v - min) / (max - min)) * alto;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${x} ${y}) scale(${escala})`}>
        <rect x={-ancho / 2 - 12} y={-30} width={ancho + 24} height={alto + 60} rx={(ancho + 24) / 2} fill="rgba(255,255,255,0.95)" />
        <circle cx={0} cy={alto + bulbo * 0.7} r={bulbo + 12} fill="rgba(255,255,255,0.95)" />
        <rect x={-ancho / 2} y={-18} width={ancho} height={alto + 40} rx={ancho / 2} fill="#dce7f3" />
        {peligro !== undefined && <rect x={-ancho / 2} y={yDe(peligro)} width={ancho} height={alto - yDe(peligro) + 20} fill="rgba(80,140,255,0.18)" />}
        <rect x={-ancho / 2 + 12} y={yNivel} width={ancho - 24} height={alto - yNivel + 40} rx={(ancho - 24) / 2} fill={color} />
        <circle cx={0} cy={alto + bulbo * 0.7} r={bulbo} fill={color} />
        <circle cx={-20} cy={alto + bulbo * 0.5} r={16} fill="rgba(255,255,255,0.5)" />
        <rect x={-ancho / 2 + 18} y={yNivel + 10} width={8} height={Math.max(0, alto - yNivel - 10)} rx={4} fill="rgba(255,255,255,0.35)" />
        {marcas.map((m) => (
          <g key={m}>
            <line x1={ancho / 2 + 16} x2={ancho / 2 + 46} y1={yDe(m)} y2={yDe(m)} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
            <text x={ancho / 2 + 56} y={yDe(m) + 15} fill="#fff" fontFamily={SANS} fontWeight={900} fontSize={42} style={{ textShadow: "0 3px 8px #000" } as React.CSSProperties}>
              {m}°
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

// ---------- cronómetro ----------
export const Cronometro: React.FC<{ x: number; y: number; r: number; vuelta: number; color?: string; lleno?: number }> = ({ x, y, r, vuelta, color = CIAN, lleno }) => {
  const ang = vuelta * Math.PI * 2 - Math.PI / 2;
  const p = lleno ?? vuelta;
  const arco = (() => {
    const v = Math.min(0.9999, Math.max(0, p));
    const a = v * Math.PI * 2 - Math.PI / 2;
    const xa = x + Math.cos(a) * (r - 30);
    const ya = y + Math.sin(a) * (r - 30);
    return `M ${x} ${y} L ${x} ${y - r + 30} A ${r - 30} ${r - 30} 0 ${v > 0.5 ? 1 : 0} 1 ${xa} ${ya} Z`;
  })();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <rect x={x - 34} y={y - r - 70} width={68} height={50} rx={12} fill="#dfe8f2" />
      <rect x={x - 60} y={y - r - 92} width={120} height={34} rx={14} fill="#fff" />
      <circle cx={x} cy={y} r={r + 16} fill="#e8f1fb" />
      <circle cx={x} cy={y} r={r} fill="#0b1a36" />
      <path d={arco} fill={color} opacity={0.35} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={x + Math.cos(a) * (r - 14)} y1={y + Math.sin(a) * (r - 14)} x2={x + Math.cos(a) * (r - 40)} y2={y + Math.sin(a) * (r - 40)} stroke="#fff" strokeWidth={8} strokeLinecap="round" />;
      })}
      <line x1={x} y1={y} x2={x + Math.cos(ang) * (r - 50)} y2={y + Math.sin(ang) * (r - 50)} stroke={color} strokeWidth={14} strokeLinecap="round" />
      <circle cx={x} cy={y} r={20} fill={color} />
    </svg>
  );
};

// ---------- monitor cardiaco ----------
export const Monitor: React.FC<{ f: number; x: number; y: number; ancho: number; alto: number; caos: number; lento?: number; color?: string; texto?: string; plano?: number }> = ({
  f,
  x,
  y,
  ancho,
  alto,
  caos,
  lento = 1,
  color = VERDE,
  texto = "♥ 72",
  plano = 0,
}) => {
  const pts: string[] = [];
  const periodo = 70 * lento;
  for (let i = 0; i <= 160; i++) {
    const px = (i / 160) * ancho;
    const t = (i * 2.2 + f * 6) % periodo;
    let v = 0;
    if (t > 20 && t < 26) v = -0.2;
    else if (t >= 26 && t < 30) v = 1;
    else if (t >= 30 && t < 34) v = -0.5;
    else if (t > 44 && t < 54) v = 0.18;
    v += caos * (Math.sin(i * 0.9 + f * 0.7) * 0.4 + (random(`m${i}${Math.floor(f / 3)}`) - 0.5) * 0.7);
    v *= 1 - plano;
    pts.push(`${px},${alto / 2 - v * alto * 0.38}`);
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, width: ancho, height: alto, borderRadius: 30, background: "#03140e", border: "8px solid #2b3a4f", boxShadow: "0 18px 40px rgba(0,0,0,0.6)", overflow: "hidden" }}>
      <svg width={ancho} height={alto} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={(i * ancho) / 12} x2={(i * ancho) / 12} y1={0} y2={alto} stroke="rgba(56,224,123,0.1)" strokeWidth={2} />
        ))}
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={8} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", right: 24, top: 14, fontFamily: SANS, fontWeight: 900, fontSize: 48, color }}>{texto}</div>
    </div>
  );
};

// ---------- protagonista ("tú"): tirita y se pone azul ----------
export const Tu: React.FC<{
  f: number;
  x: number;
  y: number;
  escala?: number;
  acciones: [number, Accion2D][];
  tirita?: number; // 0..1 amplitud del temblor
  frio?: number; // 0..1 piel azulada
  cara?: Cara;
  mirar?: "derecha" | "izquierda";
  giro?: number;
  sudadera?: string;
}> = ({ f, x, y, escala = 1, acciones, tirita = 0, frio = 0, cara, mirar, giro = 0, sudadera = "#e8433a" }) => {
  const dx = tirita * (Math.sin(f * 2.9) * 7 + Math.sin(f * 5.3) * 3);
  const piel = interpolateColors(frio, [0, 1], ["#f0bf98", "#b9c9e8"]);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${dx}px) rotate(${giro}deg)`, transformOrigin: `${x}px ${y}px` }}>
      <Personaje2D f={f} x={x} y={y} escala={escala} acciones={acciones} cara={cara} mirar={mirar} piel={piel} sudadera={sudadera} sudaderaOscura="#b02a22" />
    </div>
  );
};

// líneas de temblor alrededor de algo
export const Tiritas: React.FC<{ f: number; x: number; y: number; ancho: number; alto: number; fuerza: number }> = ({ f, x, y, ancho, alto, fuerza }) => {
  if (fuerza <= 0.02) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: fuerza }}>
      {[-1, 1].map((lado) =>
        [0, 1, 2].map((k) => {
          const cx = x + lado * (ancho / 2 + 30 + k * 34);
          const cy = y - alto / 2 + k * 40;
          const o = Math.sin(f * 1.4 + k) * 8;
          return <path key={`${lado}${k}`} d={`M ${cx} ${cy + o} q ${lado * 18} 30 0 60 q ${-lado * 18} 30 0 60`} fill="none" stroke="#dff4ff" strokeWidth={8} strokeLinecap="round" />;
        }),
      )}
    </svg>
  );
};

// tarjeta con borde y aparición
export const Tarjeta: React.FC<{ f: number; inicio: number; x: number; y: number; ancho: number; alto: number; children: React.ReactNode; fondo?: string; borde?: string; giro?: number }> = ({
  f,
  inicio,
  x,
  y,
  ancho,
  alto,
  children,
  fondo = "rgba(8,22,52,0.86)",
  borde = "rgba(191,233,255,0.6)",
  giro = 0,
}) => {
  const s = muelle(f, inicio, 11);
  if (f < inicio) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - ancho / 2,
        top: y - alto / 2,
        width: ancho,
        height: alto,
        transform: `rotate(${giro}deg) scale(${s})`,
        borderRadius: 34,
        background: fondo,
        border: `6px solid ${borde}`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

// X roja o check verde dibujados
export const Marca: React.FC<{ f: number; inicio: number; x: number; y: number; tam: number; tipo: "x" | "ok" }> = ({ f, inicio, x, y, tam, tipo }) => {
  if (f < inicio) return null;
  const p = tramo(f, inicio, inicio + 9);
  const color = tipo === "x" ? ROJO : VERDE;
  const s = tam / 2;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <circle cx={x} cy={y} r={s * 1.25 * muelle(f, inicio, 9)} fill="#fff" opacity={0.95} />
      {tipo === "x" ? (
        <>
          <line x1={x - s * 0.6} y1={y - s * 0.6} x2={x - s * 0.6 + s * 1.2 * Math.min(1, p * 2)} y2={y - s * 0.6 + s * 1.2 * Math.min(1, p * 2)} stroke={color} strokeWidth={tam * 0.16} strokeLinecap="round" />
          {p > 0.5 && <line x1={x + s * 0.6} y1={y - s * 0.6} x2={x + s * 0.6 - s * 1.2 * (p * 2 - 1)} y2={y - s * 0.6 + s * 1.2 * (p * 2 - 1)} stroke={color} strokeWidth={tam * 0.16} strokeLinecap="round" />}
        </>
      ) : (
        <polyline points={`${x - s * 0.6},${y} ${x - s * 0.15},${y + s * 0.45} ${x + s * 0.65},${y - s * 0.5}`} fill="none" stroke={color} strokeWidth={tam * 0.16} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={tam * 2} strokeDashoffset={tam * 2 * (1 - p)} />
      )}
    </svg>
  );
};
