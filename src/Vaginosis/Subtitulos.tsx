import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";

type Props = {
  texto: string;
  clave?: string[];
  frameLocal: number;
  duracion: number;
};

// Subtítulos palabra por palabra: la palabra actual brilla, las siguientes están apagadas.
export const Subtitulos: React.FC<Props> = ({ texto, clave = [], frameLocal, duracion }) => {
  const { fps } = useVideoConfig();
  const palabras = texto.split(" ");
  const util = duracion * 0.78; // deja un respiro al final de cada escena
  const porPalabra = util / palabras.length;
  const actual = Math.floor(frameLocal / porPalabra);

  return (
    <div
      style={{
        position: "absolute",
        top: 230,
        left: 70,
        right: 70,
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: 74,
        fontWeight: 800,
        lineHeight: 1.25,
        textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.9)",
      }}
    >
      {palabras.map((p, i) => {
        const inicio = i * porPalabra;
        const pop = spring({ frame: frameLocal - inicio, fps, config: { damping: 10, mass: 0.5 } });
        const esClave = clave.includes(p);
        const dicha = i <= actual;
        const esActual = i === actual;
        const opacidad = interpolate(frameLocal - inicio, [-4, 0], [0.35, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 12px",
              color: dicha ? (esClave ? "#ffd93b" : "#ffffff") : "rgba(255,255,255,0.45)",
              opacity: opacidad,
              transform: `scale(${esActual ? 1 + 0.12 * pop : 1})`,
              padding: esActual && esClave ? "0 14px" : undefined,
              border: esActual && esClave ? "4px solid #ffd93b" : undefined,
              borderRadius: 12,
            }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
};
