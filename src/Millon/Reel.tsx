import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { CON_VOZ, ESCENAS } from "./escenas";
import { Ilustraciones } from "./Ilustraciones";

// Reel 3D: escenas con three.js, avatar con poses en la esquina inferior izquierda (por defecto de ReelBase)
export const ReelMillon: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={Ilustraciones}
    efectos={EFECTOS}
    voz={CON_VOZ ? "voz/millon.mp3" : undefined}
    volumenMusica={CON_VOZ ? 0.07 : 0.16}
  />
);
