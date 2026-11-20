import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";

// Kit de historias de terror: capas de ambiente (lluvia, grano, viñeta, polvo),
// movimiento de cámara dentro de un plano y utilidades.

export const suave = Easing.bezier(0.45, 0, 0.55, 1);

export const lerp = (f: number, rango: [number, number], valores: [number, number], easing = suave) =>
  interpolate(f, rango, valores, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Vista SVG de 1080×1920 que llena su caja recortando lo que sobre (sirve también en un monitor apaisado)
export const Lienzo: React.FC<{ children: React.ReactNode; fondo?: string }> = ({ children, fondo = "#05070c" }) => (
  <svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: fondo }}>
    {children}
  </svg>
);

// Movimiento de cámara: interpola posición (px) y zoom de [x, y, zoom] a [x, y, zoom] entre dos frames
export const Mov: React.FC<{ f: number; rango: [number, number]; de: [number, number, number]; a: [number, number, number]; children: React.ReactNode; temblor?: number }> = ({
  f,
  rango,
  de,
  a,
  children,
  temblor = 0,
}) => {
  const x = lerp(f, rango, [de[0], a[0]]);
  const y = lerp(f, rango, [de[1], a[1]]);
  const z = lerp(f, rango, [de[2], a[2]]);
  // temblor de cámara en mano: suave y continuo
  const tx = temblor * (Math.sin(f / 9) * 0.6 + Math.sin(f / 4.3) * 0.4);
  const ty = temblor * (Math.cos(f / 11) * 0.6 + Math.sin(f / 5.1) * 0.4);
  return (
    <AbsoluteFill style={{ transform: `translate(${x + tx}px, ${y + ty}px) scale(${z})`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
  );
};

// Lluvia en diagonal. Dentro de un <svg> 1080×1920.
export const Lluvia: React.FC<{ f: number; n?: number; opacidad?: number; semilla?: string; velocidad?: number }> = ({ f, n = 140, opacidad = 0.35, semilla = "lluvia", velocidad = 1 }) => (
  <g stroke="#c9d6ea" strokeLinecap="round">
    {Array.from({ length: n }, (_, i) => {
      const x0 = random(`${semilla}x${i}`) * 1400 - 160;
      const y0 = random(`${semilla}y${i}`) * 2100;
      const v = (38 + random(`${semilla}v${i}`) * 30) * velocidad;
      const largo = 40 + random(`${semilla}l${i}`) * 60;
      const y = ((y0 + f * v) % 2100) - 100;
      const x = x0 - (y - y0) * 0.18;
      return <line key={i} x1={x} y1={y} x2={x + largo * 0.18} y2={y - largo} strokeWidth={1.5 + random(`${semilla}w${i}`) * 2} opacity={opacidad * (0.4 + random(`${semilla}o${i}`) * 0.6)} />;
    })}
  </g>
);

// Polvo flotando en el haz de luz. Dentro de un <svg> 1080×1920.
export const Polvo: React.FC<{ f: number; n?: number; color?: string }> = ({ f, n = 60, color = "#fff" }) => (
  <g fill={color}>
    {Array.from({ length: n }, (_, i) => {
      const x = (random(`px${i}`) * 1080 + Math.sin(f / 40 + i) * 30 + f * 0.3) % 1080;
      const y = (random(`py${i}`) * 1920 + Math.cos(f / 50 + i) * 40 - f * 0.4 + 1920) % 1920;
      return <circle key={i} cx={x} cy={y} r={1.5 + random(`pr${i}`) * 3} opacity={0.15 + random(`po${i}`) * 0.35} />;
    })}
  </g>
);

// Grano de película (cambia cada 2 frames)
export const Grano: React.FC<{ f: number; opacidad?: number }> = ({ f, opacidad = 0.09 }) => (
  <AbsoluteFill style={{ opacity: opacidad, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <svg width="100%" height="100%" viewBox="0 0 270 480" preserveAspectRatio="none">
      <filter id={`grano${Math.floor(f / 2) % 8}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(f / 2) % 8} />
      </filter>
      <rect width="270" height="480" filter={`url(#grano${Math.floor(f / 2) % 8})`} />
    </svg>
  </AbsoluteFill>
);

export const Vineta: React.FC<{ fuerza?: number; color?: string }> = ({ fuerza = 0.75, color = "0,0,0" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 50%, rgba(${color},0) 40%, rgba(${color},${fuerza}) 100%)`, pointerEvents: "none" }} />
);

// Linterna en primera persona: todo oscuro salvo el haz, que se mueve un poco
export const Linterna: React.FC<{ f: number; x?: number; y?: number; radio?: number }> = ({ f, x = 50, y = 55, radio = 38 }) => {
  const cx = x + Math.sin(f / 23) * 2.5;
  const cy = y + Math.cos(f / 31) * 2;
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse ${radio}% ${radio * 0.62}% at ${cx}% ${cy}%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.96) 100%)` }} />;
};

// Fluorescente que parpadea: devuelve 0..1 (1 = encendido)
export const parpadeo = (f: number, semilla: string, frecuencia = 0.04) => {
  const tramo = Math.floor(f / 3);
  return random(`${semilla}${tramo}`) < frecuencia ? 0.25 + random(`${semilla}b${tramo}`) * 0.3 : 1;
};

// Destello blanco de relámpago en el frame indicado
export const Relampago: React.FC<{ f: number; en: number }> = ({ f, en }) => {
  const o = interpolate(f - en, [0, 2, 4, 6, 14], [0, 0.75, 0.15, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return o > 0 ? <AbsoluteFill style={{ background: "#dfe8ff", opacity: o, mixBlendMode: "screen" }} /> : null;
};

// Cierre en iris (agujero que se cierra hasta negro)
export const Iris: React.FC<{ f: number; rango: [number, number]; x?: number; y?: number }> = ({ f, rango, x = 50, y = 50 }) => {
  const r = lerp(f, rango, [140, 0], Easing.in(Easing.cubic));
  return <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}% ${y}%, rgba(0,0,0,0) ${r * 0.9}%, #000 ${r}%)` }} />;
};
