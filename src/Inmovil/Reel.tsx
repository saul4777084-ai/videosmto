import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(ESCENARIOS);
const DIBUJOS_2D = crearIlustraciones(ESCENARIOS, false);

// Avatar con poses en la esquina inferior DERECHA (lo pidió el usuario para este video).
const comunes = {
  escenas: ESCENAS,
  efectos: EFECTOS,
  ladoAvatar: "derecha" as const,
  tamSubtitulos: 62,
  volumenEfectos: 0.55,
  volumenMusica: 0.06,
  voz: "voz/inmovil.mp3",
};

// Versión final: los astronautas en 3D (render con --gl=swangle)
export const ReelInmovil: React.FC = () => <ReelBase {...comunes} dibujos={DIBUJOS} />;
// Vista previa rápida sin 3D
export const ReelInmovil2D: React.FC = () => <ReelBase {...comunes} dibujos={DIBUJOS_2D} />;
