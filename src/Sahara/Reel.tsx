import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Voz de Gerardo (ElevenLabs). Sin avatar (lo pidió el usuario).
export const ReelSahara: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    mostrarAvatar={false}
    zoomSuave={false}
    tamSubtitulos={60}
    volumenEfectos={0.5}
    volumenMusica={0.06}
    voz="voz/sahara.mp3"
  />
);
