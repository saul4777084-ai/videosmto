import React from "react";
import { Img, interpolate, staticFile, useVideoConfig } from "remotion";
import { Gesto } from "./tipos";

// Avatar de dorso hacia arriba que cambia entre poses dibujadas (public/poses/*.png).
// Cada imagen mide 1104×912 y tiene la cabeza centrada en x=552, y=120.
const ANCHO = 1104;
const ALTO = 912;

const POSE_DE: Record<Gesto, string> = {
  reposo: "original",
  senalar: "senalar",
  negar: "no",
  presentar: "explicar",
  explicar: "explicar",
  alarma: "alerta",
  contar: "no",
  saludar: "saludar",
  leer: "leer",
  cruzar: "cruzados",
};

// movimiento extra de cada gesto (grados de giro, píxeles de salto)
const movimiento = (g: Gesto, t: number) => {
  switch (g) {
    case "negar":
      return { giro: Math.sin(t * 14) * 2.2, salto: 0 };
    case "alarma":
      return { giro: Math.sin(t * 40) * 0.8, salto: 10 + Math.abs(Math.sin(t * 8)) * 6 };
    case "saludar":
      return { giro: Math.sin(t * 9) * 2.5, salto: 0 };
    case "explicar":
    case "presentar":
      return { giro: Math.sin(t * 3) * 1.2, salto: Math.abs(Math.sin(t * 5)) * 8 };
    case "contar":
      return { giro: 0, salto: Math.max(0, Math.sin(t * Math.PI * 1.6)) * 12 };
    case "senalar":
      return { giro: 2 + Math.sin(t * 4) * 0.8, salto: 0 };
    default:
      return { giro: Math.sin(t * 1.3) * 0.6, salto: 0 };
  }
};

type Props = {
  gesto: Gesto;
  gestoAnterior: Gesto | null;
  frameLocal: number;
  frameGlobal: number;
  ancho: number; // ancho en pantalla del lienzo de la pose
};

export const AvatarPoses: React.FC<Props> = ({ gesto, gestoAnterior, frameLocal, frameGlobal, ancho }) => {
  const { fps } = useVideoConfig();
  const t = frameGlobal / fps;
  const escala = ancho / ANCHO;
  const cambio = interpolate(frameLocal, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = 1 + (1 - cambio) * 0.04 * (gestoAnterior && POSE_DE[gestoAnterior] !== POSE_DE[gesto] ? 1 : 0);
  const m = movimiento(gesto, t);
  const respira = 1 + Math.sin(t * 2.2) * 0.008;
  const anterior = gestoAnterior ? POSE_DE[gestoAnterior] : null;
  const actual = POSE_DE[gesto];

  const imagen = (archivo: string, opacidad: number) => (
    <Img
      src={staticFile(`poses/${archivo}.png`)}
      style={{ position: "absolute", left: 0, top: 0, width: ANCHO * escala, height: ALTO * escala, opacity: opacidad }}
    />
  );

  return (
    <div
      style={{
        width: ANCHO * escala,
        height: ALTO * escala,
        position: "relative",
        transform: `translateY(${-m.salto}px) rotate(${m.giro}deg) scale(${pop}) scaleY(${respira})`,
        transformOrigin: "50% 100%",
        filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.45))",
      }}
    >
      {anterior && anterior !== actual && cambio < 1 && imagen(anterior, 1 - cambio)}
      {imagen(actual, anterior && anterior !== actual ? cambio : 1)}
    </div>
  );
};
