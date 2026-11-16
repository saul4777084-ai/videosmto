import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { AvatarPoses } from "./AvatarPoses";
import { Marioneta } from "./Marioneta";
import { Subtitulos } from "./Subtitulos";
import { Dibujo, duracionDe, Escena, framesDe, Golpe, iniciosDe } from "./tipos";

const FUNDIDO = 8;

type Props<I extends string> = {
  escenas: Escena<I>[];
  dibujos: Record<I, Dibujo>;
  efectos: Record<I, Golpe[]>;
  volumenMusica?: number;
  mostrarAvatar?: boolean;
  voz?: string; // archivo de voz en public/ que suena de principio a fin
  avatar?: "poses" | "marioneta"; // poses: dorso hacia arriba con poses dibujadas
};

// Plantilla de reel: escenas ilustradas con fundido, subtítulos palabra por palabra,
// avatar marioneta siempre visible y efectos de sonido sincronizados.
export function ReelBase<I extends string>({ escenas, dibujos, efectos, volumenMusica = 0.16, mostrarAvatar = true, voz, avatar = "poses" }: Props<I>) {
  const frame = useCurrentFrame();
  const inicios = iniciosDe(escenas);
  const duracion = duracionDe(escenas);

  let actual = 0;
  inicios.forEach((ini, i) => {
    if (frame >= ini) actual = i;
  });
  const escena = escenas[actual];
  const local = frame - inicios[actual];
  const entradaAvatar = interpolate(frame, [0, 14], [-500, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {voz && <Audio src={staticFile(voz)} volume={1} />}
      <Sonidos escenas={escenas} efectos={efectos} inicios={inicios} duracion={duracion} volumenMusica={volumenMusica} />

      {escenas.map((e, i) => {
        const D: Dibujo = dibujos[e.ilustracion];
        const dur = framesDe(e.segundos);
        return (
          <Sequence key={i} from={inicios[i]} durationInFrames={dur + (i < escenas.length - 1 ? FUNDIDO : 0)}>
            <Capa primera={i === 0}>{(f) => <D f={f} />}</Capa>
          </Sequence>
        );
      })}

      {/* oscurecer arriba para que se lean los subtítulos */}
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0) 30%)" }} />

      {!escena.sinSubtitulos && (
      <Subtitulos
        texto={escena.texto}
        clave={escena.clave}
        frameLocal={local}
        duracion={framesDe(escena.segundos)}
        tiempos={escena.tiempos?.map((t) => t * 30)}
      />
      )}

      {mostrarAvatar && avatar === "poses" && (
        <div style={{ position: "absolute", left: -150 + entradaAvatar, bottom: -110 }}>
          {/* halo suave detrás para que se separe del fondo */}
          <div
            style={{
              position: "absolute",
              left: 120,
              top: 40,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)",
            }}
          />
          <AvatarPoses
            gesto={escena.gesto ?? "presentar"}
            gestoAnterior={actual > 0 ? (escenas[actual - 1].gesto ?? "presentar") : null}
            frameLocal={local}
            frameGlobal={frame}
            ancho={640}
          />
        </div>
      )}
      {mostrarAvatar && avatar === "marioneta" && (
        <div style={{ position: "absolute", left: -40 + entradaAvatar, bottom: 20 }}>
          <Marioneta
            gesto={escena.gesto ?? "presentar"}
            gestoAnterior={actual > 0 ? (escenas[actual - 1].gesto ?? "presentar") : null}
            frameLocal={local}
            frameGlobal={frame}
            altura={900}
          />
        </div>
      )}
    </AbsoluteFill>
  );
}

const Capa: React.FC<{ primera: boolean; children: (f: number) => React.ReactNode }> = ({ primera, children }) => {
  const f = useCurrentFrame();
  const opacidad = primera ? 1 : interpolate(f, [0, FUNDIDO], [0, 1], { extrapolateRight: "clamp" });
  const zoom = interpolate(f, [0, 150], [1.04, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: opacidad, transform: `scale(${zoom})` }}>{children(f)}</AbsoluteFill>;
};

// Un "tic" suave cada vez que se resalta una palabra clave
const ticsDe = (e: Escena): Golpe[] => {
  const palabras = e.texto.split(" ");
  const porPalabra = (framesDe(e.segundos) * 0.78) / palabras.length;
  const t = (k: number) => (e.tiempos && e.tiempos[k] !== undefined ? e.tiempos[k] * 30 : k * porPalabra);
  return palabras.flatMap((p, k): Golpe[] => ((e.clave ?? []).includes(p) ? [[Math.round(t(k)), "tic", 0.25]] : []));
};

function Sonidos<I extends string>({
  escenas,
  efectos,
  inicios,
  duracion,
  volumenMusica,
}: {
  escenas: Escena<I>[];
  efectos: Record<I, Golpe[]>;
  inicios: number[];
  duracion: number;
  volumenMusica: number;
}) {
  return (
    <>
      <Audio src={staticFile("sfx/musica.wav")} volume={volumenMusica} durationInFrames={duracion} />
      {escenas.map((e, i) => {
        const golpes: Golpe[] = [...(i > 0 ? ([[0, "whoosh", 0.45]] as Golpe[]) : []), ...efectos[e.ilustracion], ...ticsDe(e)];
        return golpes.map(([f, efecto, vol = 0.6], k) => (
          <Sequence key={`${i}-${k}`} from={inicios[i] + f} durationInFrames={60} layout="none">
            <Audio src={staticFile(`sfx/${efecto}.wav`)} volume={vol} />
          </Sequence>
        ));
      })}
    </>
  );
}
