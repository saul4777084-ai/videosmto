import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { Escenas3D } from "./Escenas3D";
import { ESCENAS } from "./escenas";
import { Ilustraciones } from "./Ilustraciones";

// Sin voz por ahora: el usuario la genera con el texto de guion.json. Cuando llegue el audio,
// alinear con scripts/alinear_voz.py → tiempos.json y pasar VOZ = "voz/millon-hoy.mp3".
const VOZ: string | undefined = "voz/millon-hoy.mp3";

// Avatar con poses en la esquina inferior DERECHA (lo pidió el usuario para este video)
const comunes = {
  escenas: ESCENAS,
  efectos: EFECTOS,
  voz: VOZ,
  volumenMusica: VOZ ? 0.06 : 0.14,
  ladoAvatar: "derecha" as const,
};

// Versión principal: ilustraciones 2D
export const ReelMillonHoy: React.FC = () => <ReelBase {...comunes} dibujos={Ilustraciones} />;

// Versión alternativa con protagonista y escenarios 3D (render con --gl=swangle, muy lento)
export const ReelMillonHoy3D: React.FC = () => <ReelBase {...comunes} dibujos={Escenas3D} zoomSuave={false} />;
