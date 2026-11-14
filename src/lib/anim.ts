import {Easing, interpolate, random} from 'remotion';

export const FPS = 30;
export const s = (seg: number) => Math.round(seg * FPS);

/** Interpolación con límites y easing suave por defecto. */
export const tween = (
  frame: number,
  [f0, f1]: [number, number],
  [v0, v1]: [number, number],
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Oscilador senoidal: periodo en frames. */
export const osc = (frame: number, period: number, amp = 1, phase = 0) =>
  Math.sin((frame / period) * Math.PI * 2 + phase) * amp;

/** Aparición con rebote (0 -> 1). */
export const pop = (frame: number, start: number, dur = 14) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.8)),
  });

/** Parpadeo natural: devuelve apertura de ojos 0..1. */
export const blink = (frame: number, seed: number) => {
  const period = 70 + Math.floor(random(`b${seed}`) * 50);
  const t = (frame + Math.floor(random(`o${seed}`) * period)) % period;
  if (t < 3) return 1 - t / 3;
  if (t < 6) return (t - 3) / 3;
  return 1;
};

export const rnd = (seed: string | number) => random(seed);

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
