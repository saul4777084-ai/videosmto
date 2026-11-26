import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { CON_VOZ, ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Avatar con poses en la esquina inferior DERECHA (lo pidió el usuario), como en la cueva.
// Sin voz mientras tiempos.json sea "provisional"; al alinear la voz del usuario con
// scripts/alinear_voz.py suena public/voz/deriva.mp3.
export const ReelDeriva: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    ladoAvatar="derecha"
    tamSubtitulos={62}
    volumenEfectos={CON_VOZ ? 0.55 : 1}
    volumenMusica={CON_VOZ ? 0.06 : 0.18}
    voz={CON_VOZ ? "voz/deriva.mp3" : undefined}
  />
);
