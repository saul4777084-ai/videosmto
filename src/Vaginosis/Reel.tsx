import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Marioneta } from "./Marioneta";
import { DURACION_TOTAL, ESCENAS, INICIOS, framesDe } from "./escenas";
import { Ilustraciones } from "./Ilustraciones";
import { Subtitulos } from "./Subtitulos";
import { Sonidos } from "./Sonidos";

const FUNDIDO = 8;

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();

  // escena actual (para el gesto del avatar, que nunca desaparece)
  let actual = 0;
  INICIOS.forEach((ini, i) => {
    if (frame >= ini) actual = i;
  });
  const escena = ESCENAS[actual];
  const local = frame - INICIOS[actual];

  // el avatar entra deslizándose al principio
  const entradaAvatar = interpolate(frame, [0, 14], [-500, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sonidos duracion={DURACION_TOTAL} />
      {ESCENAS.map((e, i) => {
        const Dibujo = Ilustraciones[e.ilustracion];
        const dur = framesDe(e.segundos);
        return (
          <Sequence key={i} from={INICIOS[i]} durationInFrames={dur + (i < ESCENAS.length - 1 ? FUNDIDO : 0)}>
            <Capa duracion={dur} primera={i === 0}>
              {(f) => <Dibujo f={f} />}
            </Capa>
          </Sequence>
        );
      })}

      {/* oscurecer arriba para que se lean los subtítulos */}
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0) 30%)" }} />

      <Subtitulos texto={escena.texto} clave={escena.clave} frameLocal={local} duracion={framesDe(escena.segundos)} />

      <div style={{ position: "absolute", left: -40 + entradaAvatar, bottom: 20 }}>
        <Marioneta
          gesto={escena.gesto}
          gestoAnterior={actual > 0 ? ESCENAS[actual - 1].gesto : null}
          frameLocal={local}
          frameGlobal={frame}
          altura={900}
        />
      </div>
    </AbsoluteFill>
  );
};

// Capa que hace aparecer la escena con un fundido
const Capa: React.FC<{ duracion: number; primera: boolean; children: (f: number) => React.ReactNode }> = ({
  primera,
  children,
}) => {
  const f = useCurrentFrame();
  const opacidad = primera ? 1 : interpolate(f, [0, FUNDIDO], [0, 1], { extrapolateRight: "clamp" });
  const zoom = interpolate(f, [0, 150], [1.04, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: opacidad, transform: `scale(${zoom})` }}>{children(f)}</AbsoluteFill>;
};
