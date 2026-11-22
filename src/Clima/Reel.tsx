import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { CON_VOZ, ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Avatar a la derecha (el estilo del usuario). Música propia (scripts/musica_fondo.py) que gira a mayor en
// «La buena noticia». Sin voz mientras tiempos.json sea "provisional"; con la voz alineada suena public/voz/clima.mp3.
export const ReelClima: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    ladoAvatar="derecha"
    tamSubtitulos={62}
    musica="sfx/musica_clima.wav"
    volumenEfectos={CON_VOZ ? 0.55 : 1}
    volumenMusica={CON_VOZ ? 0.08 : 0.3}
    voz={CON_VOZ ? "voz/clima.mp3" : undefined}
  />
);
