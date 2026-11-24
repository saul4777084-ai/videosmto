import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { CON_VOZ, ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Vídeo de mapas: SIN avatar (lo pidió el usuario) y sin voz mientras tiempos.json sea "provisional".
// Mapa dibujado como Napoleón (estilo "dibujo" + PiezasNapoleon); subtítulos clásicos (60).
export const ReelCortes: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    mostrarAvatar={false}
    zoomSuave={false}
    tamSubtitulos={60}
    volumenEfectos={CON_VOZ ? 0.5 : 1}
    volumenMusica={CON_VOZ ? 0.06 : 0.2}
    voz={CON_VOZ ? "voz/cortes.mp3" : undefined}
  />
);
