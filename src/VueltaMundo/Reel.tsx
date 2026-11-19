import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";
import alineado from "./tiempos.json";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Sin avatar: los videos de mapas van sin avatar (lo pidió el usuario).
// Voz: guion_voz.json (números escritos en letra) → scripts/voz_clonada.py → scripts/alinear_voz.py;
// tiempos.json lleva los tiempos con las palabras de guion.json (cifras) para los subtítulos.
const conVoz = !("provisional" in alineado);

export const ReelVueltaMundo: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    mostrarAvatar={false}
    zoomSuave={false}
    tamSubtitulos={60}
    volumenEfectos={conVoz ? 0.5 : 1}
    volumenMusica={conVoz ? 0.06 : 0.2}
    voz={conVoz ? "voz/vueltamundo.mp3" : undefined}
  />
);
