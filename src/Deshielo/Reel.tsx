import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { CON_VOZ, ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Vídeo de mapas: SIN avatar (lo pidió el usuario) y sin voz mientras tiempos.json sea "provisional".
// Mapa con el estilo de los vídeos de mapas virales; subtítulos como los vídeos de mapas anteriores (clásicos, 60).
export const ReelDeshielo: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    mostrarAvatar={false}
    zoomSuave={false}
    tamSubtitulos={60}
    volumenEfectos={CON_VOZ ? 0.5 : 1}
    volumenMusica={CON_VOZ ? 0.06 : 0.2}
    voz={CON_VOZ ? "voz/deshielo.mp3" : undefined}
  />
);
