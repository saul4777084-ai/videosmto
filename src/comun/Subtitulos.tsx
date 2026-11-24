import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";

type Props = {
  tam?: number; // tamaño de letra en px (74 por defecto)
  texto: string;
  clave?: string[];
  frameLocal: number;
  duracion: number;
  tiempos?: number[]; // frame (local) en que se dice cada palabra, si hay voz alineada
  estilo?: "clasico" | "fino" | "terror"; // fino: letra pequeña, aparecen al decirse, clave en recuadro azul
  // terror: frases cortas que se escriben palabra a palabra; la actual en negrita y la clave en recuadro negro
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
  if (tiempos || estilo === "terror") {
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
  const visibles = tiempos || estilo === "terror" ? (bloques.find((bl) => bl.includes(Math.max(0, actual))) ?? bloques[0]) : palabras.map((_, i) => i);

  if (estilo === "terror") {
    return (
      <>
      {/* franja oscura detrás del texto, como en el vídeo de referencia */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, height: 300, background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.42) 22%, rgba(0,0,0,0.42) 78%, rgba(0,0,0,0))" }} />
      <div
        style={{
          position: "absolute",
          top: 190,
          left: 80,
          right: 80,
          textAlign: "center",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          fontSize: tam === 74 ? 60 : tam,
          lineHeight: 1.35,
          color: "#fff",
          textShadow: "0 3px 14px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.8)",
        }}
      >
        {visibles
          .filter((i) => i <= actual)
          .map((i) => {
            const p = palabras[i];
            const entra = interpolate(frameLocal - inicioDe(i), [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const esClave = clave.includes(p);
            const esActual = i === actual;
            return (
              <span
                key={i}
                style={{
                  position: "relative",
                  display: "inline-block",
                  margin: "0 8px",
                  fontWeight: esActual || esClave ? 800 : 400,
                  color: esActual || esClave ? "#fff" : "rgba(255,255,255,0.62)",
                  opacity: entra,
                  padding: esClave ? "0 10px" : undefined,
                  background: esClave ? "rgba(0,0,0,0.92)" : undefined,
                  textShadow: esClave ? "none" : undefined,
                }}
              >
                {p}
                {esClave &&
                  [
                    { left: -5, top: -5 },
                    { right: -5, bottom: -5 },
                  ].map((pos, k) => (
                    <span
                      key={k}
                      style={{ position: "absolute", width: 9, height: 9, borderRadius: 5, border: "2px solid #fff", background: "#000", ...pos }}
                    />
                  ))}
              </span>
            );
          })}
      </div>
      </>
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
