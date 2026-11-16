import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { Escenas3D } from "./Escenas3D";
import { CON_VOZ, ESCENAS } from "./escenas";
import { Ilustraciones } from "./Ilustraciones";

// Avatar con poses en la esquina inferior DERECHA (lo pidió el usuario para este video)
const comunes = {
  escenas: ESCENAS,
  efectos: EFECTOS,
  voz: CON_VOZ ? "voz/millon-hoy.mp3" : undefined,
  volumenMusica: CON_VOZ ? 0.06 : 0.16,
  ladoAvatar: "derecha" as const,
};

// Versión principal: protagonista y escenarios 3D (render con --gl=swangle)
export const ReelMillonHoy: React.FC = () => <ReelBase {...comunes} dibujos={Escenas3D} zoomSuave={false} />;

// Versión 2D (ilustraciones planas, render rápido)
export const ReelMillonHoy2D: React.FC = () => <ReelBase {...comunes} dibujos={Ilustraciones} />;
