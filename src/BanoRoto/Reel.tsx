import React from "react";
import { ReelBase } from "../comun/ReelBase";
import { EFECTOS } from "./efectos";
import { ESCENAS } from "./escenas";
import { Ilustraciones } from "./Ilustraciones";

export const ReelBanoRoto: React.FC = () => (
  <ReelBase escenas={ESCENAS} dibujos={Ilustraciones} efectos={EFECTOS} voz="voz/bano-roto.mp3" volumenMusica={0.06} />
);
