import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Voz de Gerardo (ElevenLabs) y avatar con poses abajo a la izquierda (por defecto de ReelBase)
export const ReelSahara: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    zoomSuave={false}
    tamSubtitulos={60}
    volumenEfectos={0.5}
    volumenMusica={0.06}
    voz="voz/sahara.mp3"
  />
);
