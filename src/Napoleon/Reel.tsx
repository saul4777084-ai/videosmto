import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";
import alineado from "./tiempos.json";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Sin avatar (lo pidió el usuario). Mientras tiempos.json sea "provisional" (sin voz grabada),
// el reel va solo con texto, música y efectos; al alinear una voz con scripts/alinear_voz.py suena la voz.
const conVoz = !("provisional" in alineado);

export const ReelNapoleon: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    mostrarAvatar={false}
    zoomSuave={false}
    volumenMusica={conVoz ? 0.06 : 0.2}
    voz={conVoz ? "voz/napoleon.mp3" : undefined}
  />
);
