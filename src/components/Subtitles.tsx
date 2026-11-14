import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {SUBTITULOS} from '../config/textos';
import {FPS} from '../lib/anim';

type Token = {text: string; hl: boolean};

export const tokenize = (t: string): Token[] => {
  const out: Token[] = [];
  t.split(/(\*[^*]+\*)/g).forEach((part) => {
    if (!part) return;
    if (part.startsWith('*') && part.endsWith('*')) {
      // un grupo resaltado; la puntuación pegada al grupo queda fuera
      out.push({text: part.slice(1, -1), hl: true});
    } else {
      part
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w) => {
          // puntuación que sigue a un resaltado se une al anterior
          if (/^[.,:;!?…]+$/.test(w) && out.length) {
            out.push({text: w, hl: false});
          } else out.push({text: w, hl: false});
        });
    }
  });
  return out;
};

/**
 * Subtítulos palabra a palabra (estilo del vídeo de referencia):
 * - palabras anteriores en blanco suave
 * - palabra actual en blanco intenso
 * - palabras clave en amarillo con recuadro
 */
export const Subtitles: React.FC<{top?: number}> = ({top = 210}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cue = SUBTITULOS.find((c) => t >= c.inicio && t < c.fin);
  if (!cue) return null;
  const tokens = tokenize(cue.texto);
  const startF = cue.inicio * FPS;
  const endF = cue.fin * FPS;
  const span = (endF - startF) * 0.88;
  const step = span / tokens.length;
  const outOp = interpolate(frame, [endF - 6, endF], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let current = -1;
  tokens.forEach((_, i) => {
    if (frame >= startF + i * step) current = i;
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        columnGap: 18,
        rowGap: 8,
        fontFamily: 'Poppins',
        fontSize: cue.texto.length > 70 ? 52 : 62,
        lineHeight: 1.18,
        textAlign: 'center',
        opacity: outOp,
      }}
    >
      {tokens.map((tk, i) => {
        const f0 = startF + i * step;
        const a = interpolate(frame, [f0, f0 + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        const isPunct = /^[.,:;!?…]+$/.test(tk.text);
        const isCurrent = i === current;
        const color = tk.hl ? '#ffd84a' : isCurrent ? '#ffffff' : 'rgba(255,255,255,0.72)';
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginLeft: isPunct ? -16 : 0,
              opacity: a,
              transform: `translateY(${(1 - a) * 18}px) scale(${0.9 + 0.1 * a})`,
              color,
              fontWeight: tk.hl || isCurrent ? 800 : 500,
              textShadow: '0 4px 14px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.9)',
              padding: tk.hl ? '0 12px' : 0,
              borderRadius: 10,
              border: tk.hl ? '4px solid rgba(255,216,74,0.95)' : 'none',
              background: tk.hl ? 'rgba(40,24,70,0.72)' : 'transparent',
              boxShadow: tk.hl ? '0 0 22px rgba(255,216,74,0.45)' : 'none',
            }}
          >
            {tk.text}
          </span>
        );
      })}
    </div>
  );
};

/** Etiqueta tipo "píldora" que aparece con rebote. */
export const Pill: React.FC<{
  x: number;
  y: number;
  text: string;
  appear: number; // 0..1
  color?: string;
  size?: number;
  dark?: boolean;
}> = ({x, y, text, appear, color = '#ffd84a', size = 40, dark = true}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${appear})`,
      opacity: Math.min(1, appear * 1.5),
      padding: `${size * 0.25}px ${size * 0.7}px`,
      borderRadius: size,
      background: dark ? 'rgba(20,14,34,0.88)' : color,
      border: `4px solid ${color}`,
      color: dark ? color : '#1b1030',
      fontFamily: 'Poppins',
      fontWeight: 800,
      fontSize: size,
      whiteSpace: 'nowrap',
      boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 24px ${color}55`,
    }}
  >
    {text}
  </div>
);
