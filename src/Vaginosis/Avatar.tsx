import React from "react";
import { Img, interpolate, spring, staticFile, useVideoConfig } from "remotion";
import { Gesto } from "./escenas";

// Tamaño original del recorte y punto del codo (eje de giro del antebrazo)
const ANCHO = 483;
const ALTO = 936;
const CODO_X = 322;
const CODO_Y = 345;

type Props = {
  gesto: Gesto;
  frameLocal: number; // frame dentro de la escena actual
  frameGlobal: number;
  altura: number; // altura en pantalla, px
};

// Devuelve rotación del antebrazo (grados, negativo = arriba) y del cuerpo
const pose = (gesto: Gesto, f: number, fps: number) => {
  const t = f / fps;
  const entrada = spring({ frame: f, fps, config: { damping: 11 } });
  switch (gesto) {
    case "senalar":
      return { brazo: -28 * entrada + Math.sin(t * 6) * 3, cuerpo: 2 * entrada, salto: 0 };
    case "negar":
      return { brazo: 18 * entrada, cuerpo: Math.sin(t * 9) * 3.5 * Math.min(1, t * 2), salto: 0 };
    case "presentar":
      return { brazo: -8 * entrada + Math.sin(t * 2.5) * 6, cuerpo: Math.sin(t * 1.5) * 1, salto: 0 };
    case "explicar":
      return { brazo: -10 + Math.sin(t * 7) * 14, cuerpo: Math.sin(t * 3.5) * 1.2, salto: Math.abs(Math.sin(t * 7)) * 6 };
    case "alarma":
      return {
        brazo: -45 * entrada + Math.sin(t * 40) * 2.5,
        cuerpo: -3 * entrada + Math.sin(t * 40) * 0.6,
        salto: interpolate(entrada, [0, 1], [0, 18]),
      };
    case "contar": {
      // tres golpes marcados
      const golpe = Math.max(0, Math.sin(t * Math.PI * 1.6));
      return { brazo: -5 - golpe * 22, cuerpo: golpe * 1.5, salto: golpe * 8 };
    }
    case "saludar":
      return { brazo: -50 * entrada + Math.sin(t * 10) * 14, cuerpo: Math.sin(t * 5) * 2, salto: 0 };
  }
};

export const Avatar: React.FC<Props> = ({ gesto, frameLocal, frameGlobal, altura }) => {
  const { fps } = useVideoConfig();
  const p = pose(gesto, frameLocal, fps);
  const escala = altura / ALTO;
  const respiracion = 1 + Math.sin((frameGlobal / fps) * 2.2) * 0.008;

  return (
    <div
      style={{
        width: ANCHO * escala,
        height: ALTO * escala,
        position: "relative",
        transform: `translateY(${-p.salto}px) rotate(${p.cuerpo}deg) scaleY(${respiracion})`,
        transformOrigin: "50% 100%",
        filter: "drop-shadow(0 25px 30px rgba(0,0,0,0.45))",
      }}
    >
      <div
        style={{
          width: ANCHO,
          height: ALTO,
          position: "absolute",
          left: 0,
          top: 0,
          transform: `scale(${escala})`,
          transformOrigin: "0 0",
        }}
      >
        <Img src={staticFile("avatar-cuerpo.png")} style={{ position: "absolute", left: 0, top: 0 }} />
        <Img
          src={staticFile("avatar-brazo.png")}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `rotate(${p.brazo}deg)`,
            transformOrigin: `${CODO_X}px ${CODO_Y}px`,
          }}
        />
      </div>
    </div>
  );
};
