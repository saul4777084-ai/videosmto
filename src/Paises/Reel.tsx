import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";
import alineado from "./tiempos.json";

const DIBUJOS = crearIlustraciones(ESCENARIOS);

// Video de mapas: sin avatar (lo pidió el usuario). Voz: guion_voz.json → scripts/voz_clonada.py;
// tiempos.json sale de scripts/alinear_voz.py con guion.json (el transcriptor escribe las cifras igual).
const conVoz = !("provisional" in alineado);

export const ReelPaises: React.FC = () => (
  <ReelBase
    escenas={ESCENAS}
    dibujos={DIBUJOS}
    efectos={EFECTOS}
    mostrarAvatar={false}
    zoomSuave={false}
    tamSubtitulos={60}
    volumenEfectos={conVoz ? 0.5 : 1}
    volumenMusica={conVoz ? 0.06 : 0.2}
    voz={conVoz ? "voz/paises.mp3" : undefined}
  />
);
