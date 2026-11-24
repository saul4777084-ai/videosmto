import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { CON_VOZ, ESCENAS } from "./escenas";
import { DIBUJOS } from "./Ilustraciones";

// "Turno de noche — parte 2". Igual que la parte 1: sin avatar, cortes secos, subtítulos de terror
// y ambiente de lluvia + fluorescentes + drone grave.
export const ReelTurnoNoche2: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    mostrarAvatar={false}
    transicion="corte"
    sonidoCambio={false}
    zoomSuave={false}
    estiloSubtitulos="terror"
    voz={CON_VOZ ? "voz/turno-noche-2.mp3" : undefined}
    volumenEfectos={CON_VOZ ? 0.6 : 1}
    musica="sfx/drone.wav"
    volumenMusica={CON_VOZ ? 0.35 : 0.5}
    ambientes={[
      { archivo: "sfx/lluvia.wav", volumen: CON_VOZ ? 0.14 : 0.22 },
      { archivo: "sfx/zumbido.wav", volumen: CON_VOZ ? 0.03 : 0.05 },
    ]}
  />
);
