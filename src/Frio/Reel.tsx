import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { CON_VOZ, ESCENARIOS, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(ESCENARIOS);
const DIBUJOS_2D = crearIlustraciones(ESCENARIOS, false);

// Avatar con poses en la esquina inferior DERECHA (lo pidió el usuario para este video).
// Sin voz mientras tiempos.json sea "provisional"; al alinear la voz del usuario con
// scripts/alinear_voz.py suena public/voz/frio.mp3.
const comunes = {
  escenas: ESCENAS,
  efectos: EFECTOS,
  ladoAvatar: "derecha" as const,
  tamSubtitulos: 62,
  volumenEfectos: CON_VOZ ? 0.55 : 1,
  volumenMusica: CON_VOZ ? 0.06 : 0.18,
  voz: CON_VOZ ? "voz/frio.mp3" : undefined,
};

// Versión final: el gancho en 3D (render con --gl=swangle)
export const ReelFrio: React.FC = () => <ReelBase {...comunes} dibujos={DIBUJOS} />;
// Vista previa rápida sin 3D
export const ReelFrio2D: React.FC = () => <ReelBase {...comunes} dibujos={DIBUJOS_2D} />;
