import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { DURACIONES, ESCENAS } from "./escenas";
import { crearIlustraciones } from "./Ilustraciones";

const DIBUJOS = crearIlustraciones(DURACIONES);

export const ReelDescubrimiento: React.FC = () => (
  <ReelBase escenas={ESCENAS} dibujos={DIBUJOS} efectos={EFECTOS} mostrarAvatar={false} volumenMusica={0.06} voz="voz/america.mp3" />
);
