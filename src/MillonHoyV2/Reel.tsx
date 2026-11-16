import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENAS } from "./escenas";
import { Ilustraciones } from "./Ilustraciones";

// Sin voz por ahora (el usuario la genera). Cuando llegue: alinear y poner VOZ = "voz/millon-hoy.mp3".
const VOZ: string | undefined = undefined;

export const ReelMillonHoyV2: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={Ilustraciones}
    efectos={EFECTOS}
    voz={VOZ}
    volumenMusica={VOZ ? 0.06 : 0.14}
    ladoAvatar="derecha"
    estiloSubtitulos="fino"
    oscurecerArriba={false}
    zoomSuave={false}
  />
);
