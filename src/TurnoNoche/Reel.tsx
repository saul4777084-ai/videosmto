import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENAS } from "./escenas";
import { DIBUJOS } from "./Ilustraciones";

// "Turno de noche" — historia de terror en segunda persona, SIN avatar y SIN voz (lo pidió el usuario):
// cortes secos, subtítulos estilo terror y ambiente de lluvia + fluorescentes + drone grave.
export const ReelTurnoNoche: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    mostrarAvatar={false}
    transicion="corte"
    sonidoCambio={false}
    zoomSuave={false}
    estiloSubtitulos="terror"
    musica="sfx/drone.wav"
    volumenMusica={0.5}
    ambientes={[
      { archivo: "sfx/lluvia.wav", volumen: 0.22 },
      { archivo: "sfx/zumbido.wav", volumen: 0.05 },
    ]}
  />
);
