import React from "react";
import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { ESCENAS, INICIOS, framesDe, Ilustracion } from "./escenas";

type Efecto = "whoosh" | "pop" | "burbuja" | "boing" | "error" | "alarma" | "brillo" | "ding" | "tic";
type Golpe = [frameLocal: number, efecto: Efecto, volumen?: number];

// Efectos de cada escena, sincronizados con lo que aparece en pantalla
const EFECTOS: Record<Ilustracion, Golpe[]> = {
  pez: [[8, "boing", 0.8]],
  jabon: [[4, "burbuja", 0.5], [18, "burbuja", 0.5], [30, "error", 0.7], [50, "burbuja", 0.4]],
  lacto: [[4, "pop", 0.5], [10, "pop", 0.5], [16, "pop", 0.5], [22, "pop", 0.5], [8, "brillo", 0.5]],
  acido: [[8, "burbuja", 0.45], [24, "burbuja", 0.45], [40, "burbuja", 0.45], [56, "burbuja", 0.45], [72, "burbuja", 0.45]],
  invasion: [
    [10, "alarma", 0.45],
    ...Array.from({ length: 12 }, (_, i): Golpe => [i * 8, "pop", 0.4]),
  ],
  nombre: [[4, "brillo", 0.7]],
  riesgo: [[20, "pop", 0.7], [55, "pop", 0.7]],
  limon: [[15, "error", 0.7], [35, "error", 0.6]],
  medico: [[2, "brillo", 0.6], [25, "pop", 0.6]],
  final: [[10, "pop", 0.7], [16, "ding", 0.6]],
};

// Un "tic" suave cada vez que se resalta una palabra clave
const ticsDePalabrasClave = (i: number): Golpe[] => {
  const e = ESCENAS[i];
  const palabras = e.texto.split(" ");
  const porPalabra = (framesDe(e.segundos) * 0.78) / palabras.length;
  return palabras.flatMap((p, k): Golpe[] => ((e.clave ?? []).includes(p) ? [[Math.round(k * porPalabra), "tic", 0.3]] : []));
};

export const Sonidos: React.FC<{ duracion: number }> = ({ duracion }) => (
  <>
    <Audio src={staticFile("sfx/musica.wav")} volume={0.16} durationInFrames={duracion} />
    {ESCENAS.map((e, i) => {
      const golpes: Golpe[] = [
        ...(i > 0 ? ([[0, "whoosh", 0.45]] as Golpe[]) : []),
        ...EFECTOS[e.ilustracion],
        ...ticsDePalabrasClave(i),
      ];
      return golpes.map(([f, efecto, vol = 0.6], k) => (
        <Sequence key={`${i}-${k}`} from={INICIOS[i] + f} durationInFrames={60} layout="none">
          <Audio src={staticFile(`sfx/${efecto}.wav`)} volume={vol} />
        </Sequence>
      ));
    })}
  </>
);
