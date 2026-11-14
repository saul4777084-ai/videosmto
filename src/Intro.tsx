import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type IntroProps = {
  titulo: string;
  subtitulo: string;
  puntos: string[];
  colorFondo1: string;
  colorFondo2: string;
};

// Video hecho con HTML + CSS normales: cada frame es una página web.
export const Intro: React.FC<IntroProps> = ({
  titulo,
  subtitulo,
  puntos,
  colorFondo1,
  colorFondo2,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const entradaTitulo = spring({ frame, fps, config: { damping: 12 } });
  const opacidadSub = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const salida = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const giro = interpolate(frame, [0, durationInFrames], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${giro}deg, ${colorFondo1}, ${colorFondo2})`,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        color: "white",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity: salida,
      }}
    >
      <h1
        style={{
          fontSize: 150,
          fontWeight: 900,
          margin: 0,
          textAlign: "center",
          lineHeight: 1,
          transform: `scale(${entradaTitulo}) translateY(${(1 - entradaTitulo) * 200}px)`,
          textShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
      >
        {titulo}
      </h1>
      <p
        style={{
          fontSize: 60,
          marginTop: 40,
          opacity: opacidadSub,
          textAlign: "center",
        }}
      >
        {subtitulo}
      </p>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 80, width: "100%" }}>
        {puntos.map((p, i) => {
          const s = spring({ frame: frame - 50 - i * 15, fps, config: { damping: 14 } });
          return (
            <li
              key={p}
              style={{
                fontSize: 56,
                fontWeight: 600,
                background: "rgba(255,255,255,0.18)",
                borderRadius: 30,
                padding: "30px 50px",
                marginBottom: 30,
                opacity: s,
                transform: `translateX(${(1 - s) * -600}px)`,
              }}
            >
              ✓ {p}
            </li>
          );
        })}
      </ul>
    </AbsoluteFill>
  );
};
