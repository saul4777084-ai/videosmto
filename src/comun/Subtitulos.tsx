import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { MONTSERRAT } from "./fuentes";

type Props = {
  tam?: number; // tamaño de letra en px (74 por defecto)
  texto: string;
  clave?: string[];
  frameLocal: number;
  duracion: number;
  tiempos?: number[]; // frame (local) en que se dice cada palabra, si hay voz alineada
  estilo?: "clasico" | "fino" | "mapa"; // fino: letra pequeña, clave en recuadro azul · mapa: mayúsculas Montserrat, clave amarilla con brillo
};

// Subtítulos palabra por palabra: la palabra actual brilla, las siguientes están apagadas.
export const Subtitulos: React.FC<Props> = ({ texto, clave = [], frameLocal, duracion, tiempos, estilo = "clasico", tam = 74 }) => {
  const { fps } = useVideoConfig();
  const palabras = texto.split(" ");
  const util = duracion * 0.78; // deja un respiro al final de cada escena
  const porPalabra = util / palabras.length;
  const inicioDe = (i: number) => (tiempos && tiempos[i] !== undefined ? tiempos[i] : i * porPalabra);
  let actual = -1;
  palabras.forEach((_, i) => {
    if (frameLocal >= inicioDe(i)) actual = i;
  });

  // con voz, se enseñan bloques cortos (máx. 5 palabras) que avanzan con lo que se dice
  const bloques: number[][] = [];
  if (tiempos) {
    let b: number[] = [];
    palabras.forEach((p, i) => {
      b.push(i);
      if (b.length >= 5 || (/[.,:;!?…]$/.test(p) && b.length >= 2)) {
        bloques.push(b);
        b = [];
      }
    });
    if (b.length) bloques.push(b);
  }
  const visibles = tiempos ? (bloques.find((bl) => bl.includes(Math.max(0, actual))) ?? bloques[0]) : palabras.map((_, i) => i);

  if (estilo === "mapa") {
    return (
      <div
        style={{
          position: "absolute",
          top: 190,
          left: 60,
          right: 60,
          textAlign: "center",
          fontFamily: MONTSERRAT,
          fontSize: tam,
          fontWeight: 900,
          lineHeight: 1.18,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {visibles
          .filter((i) => i <= actual)
          .map((i) => {
            const p = palabras[i];
            const pop = spring({ frame: frameLocal - inicioDe(i), fps, config: { damping: 11, mass: 0.5 } });
            const esClave = clave.includes(p);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  margin: `0 ${Math.round(tam * 0.14)}px`,
                  color: esClave ? "#ffe23a" : "#ffffff",
                  opacity: Math.min(1, pop * 1.5),
                  transform: `translateY(${(1 - pop) * 16}px)`,
                  fontSize: esClave ? tam * 1.12 : tam,
                  textShadow: esClave
                    ? "0 0 22px rgba(255,226,58,0.75), 0 0 6px rgba(255,226,58,0.6), 0 6px 18px rgba(0,0,0,0.75)"
                    : "0 5px 0 rgba(0,0,0,0.22), 0 6px 20px rgba(0,0,0,0.85)",
                }}
              >
                {p}
              </span>
            );
          })}
      </div>
    );
  }

  if (estilo === "fino") {
    return (
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 90,
          right: 90,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          fontSize: 54,
          lineHeight: 1.3,
          color: "#fff",
          textShadow: "0 3px 12px rgba(0,0,0,0.8)",
        }}
      >
        {visibles
          .filter((i) => i <= actual)
          .map((i) => {
            const p = palabras[i];
            const inicio = inicioDe(i);
            const entra = interpolate(frameLocal - inicio, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const esClave = clave.includes(p);
            const esActual = i === actual;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  margin: "0 9px",
                  fontWeight: esActual || esClave ? 800 : 500,
                  opacity: (esActual || esClave ? 1 : 0.8) * entra,
                  transform: `translateY(${(1 - entra) * 10}px)`,
                  padding: esClave ? "0 10px" : undefined,
                  border: esClave ? "3px solid #4da3ff" : undefined,
                  background: esClave ? "rgba(30,90,200,0.35)" : undefined,
                  borderRadius: 6,
                }}
              >
                {p}
              </span>
            );
          })}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 230,
        left: 70,
        right: 70,
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: tam,
        fontWeight: 800,
        lineHeight: 1.25,
        textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.9)",
      }}
    >
      {visibles.map((i) => {
        const p = palabras[i];
        const inicio = inicioDe(i);
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
              margin: `0 ${Math.round(tam * 0.16)}px`,
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
