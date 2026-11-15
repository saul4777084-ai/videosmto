import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AVATAR, Gesto} from '../config/avatar';
import {FPS} from '../lib/anim';

// Avatar de dorso hacia arriba con poses dibujadas (public/poses/*.png, 1104×912).
const ANCHO = 1104;
const ALTO = 912;

const POSE_DE: Record<Gesto, string> = {
  reposo: 'original',
  senalar: 'senalar',
  negar: 'no',
  presentar: 'explicar',
  explicar: 'explicar',
  alarma: 'alerta',
  contar: 'no',
  saludar: 'saludar',
  leer: 'leer',
  cruzar: 'cruzados',
};

// movimiento extra de cada gesto (grados de giro, píxeles de salto)
const movimiento = (g: Gesto, t: number) => {
  switch (g) {
    case 'negar':
      return {giro: Math.sin(t * 14) * 2.2, salto: 0};
    case 'alarma':
      return {giro: Math.sin(t * 40) * 0.8, salto: 10 + Math.abs(Math.sin(t * 8)) * 6};
    case 'saludar':
      return {giro: Math.sin(t * 9) * 2.5, salto: 0};
    case 'explicar':
    case 'presentar':
      return {giro: Math.sin(t * 3) * 1.2, salto: Math.abs(Math.sin(t * 5)) * 8};
    case 'contar':
      return {giro: 0, salto: Math.max(0, Math.sin(t * Math.PI * 1.6)) * 12};
    case 'senalar':
      return {giro: 2 + Math.sin(t * 4) * 0.8, salto: 0};
    default:
      return {giro: Math.sin(t * 1.3) * 0.6, salto: 0};
  }
};

/** Avatar en la esquina inferior izquierda que cambia de gesto según config/avatar.ts. */
export const Avatar: React.FC = () => {
  const frame = useCurrentFrame();
  if (!AVATAR.mostrar) return null;
  const t = frame / FPS;
  let i = 0;
  AVATAR.gestos.forEach((g, k) => {
    if (t >= g.desde) i = k;
  });
  const gesto = AVATAR.gestos[i].gesto;
  const previo = i > 0 ? AVATAR.gestos[i - 1].gesto : null;
  const local = frame - Math.round(AVATAR.gestos[i].desde * FPS);
  const cambio = interpolate(local, [0, 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const actual = POSE_DE[gesto];
  const anterior = previo ? POSE_DE[previo] : null;
  const distinto = anterior && anterior !== actual;
  const pop = 1 + (1 - cambio) * 0.04 * (distinto ? 1 : 0);
  const m = movimiento(gesto, t);
  // respiración como leve desplazamiento vertical: el diseño nunca se estira
  const respira = Math.sin(t * 2.2) * 2.5;
  const entrada = interpolate(frame, [0, 14], [-500, 0], {extrapolateRight: 'clamp'});
  const derecha = AVATAR.lado === 'derecha';
  const lado = derecha ? {right: AVATAR.margen + entrada} : {left: AVATAR.margen + entrada};
  const escala = AVATAR.ancho / ANCHO;
  const img = (archivo: string, op: number) => (
    <Img src={staticFile(`poses/${archivo}.png`)} style={{position: 'absolute', left: 0, top: 0, width: ANCHO * escala, height: ALTO * escala, opacity: op}} />
  );
  return (
    <div style={{position: 'absolute', ...lado, bottom: AVATAR.abajo, transform: AVATAR.espejo ? 'scaleX(-1)' : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 40,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)',
        }}
      />
      <div
        style={{
          width: ANCHO * escala,
          height: ALTO * escala,
          position: 'relative',
          transform: `translateY(${-m.salto + respira}px) rotate(${m.giro}deg) scale(${pop})`,
          transformOrigin: '50% 100%',
          filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.45))',
        }}
      >
        {distinto && cambio < 1 && img(anterior!, 1 - cambio)}
        {img(actual, distinto ? cambio : 1)}
      </div>
    </div>
  );
};
