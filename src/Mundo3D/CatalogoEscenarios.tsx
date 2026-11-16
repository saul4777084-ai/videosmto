// Catálogo «Mundo 3D · escenarios»: cada escenario con su personaje saludando.
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { ESCENARIOS3D, Mundo, NombreEscenario } from "../comun/Escenarios3D";
import { NombrePersonaje, PERSONAJES } from "../comun/Personajes3D";

export const POR_ESCENARIO = 90;
const LISTA = Object.keys(ESCENARIOS3D) as NombreEscenario[];
export const DURACION_ESCENARIOS = LISTA.length * POR_ESCENARIO;

const Rotulo: React.FC<{ titulo: string; sub: string }> = ({ titulo, sub }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center" }}>
    <div
      style={{
        background: "rgba(40,40,52,0.72)",
        border: "2px solid rgba(255,255,255,0.18)",
        borderRadius: 26,
        padding: "22px 48px",
        textAlign: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 76, fontWeight: 900, color: "#ffd23f" }}>{titulo}</div>
      <div style={{ fontSize: 38, fontWeight: 700, color: "#ffffff" }}>{sub}</div>
    </div>
  </div>
);

const Ficha: React.FC<{ id: NombreEscenario }> = ({ id }) => {
  const f = useCurrentFrame();
  const e = ESCENARIOS3D[id];
  const p = PERSONAJES[e.personaje as NombrePersonaje];
  const { C } = p;
  const ang = Math.sin(f / 60) * 0.25;
  return (
    <AbsoluteFill>
      <Mundo escenario={id} f={f} camara={[Math.sin(ang) * 8, 2.4, Math.cos(ang) * 8]} mira={[0, 1.5, 0]} desplazar={0.06}>
        <C f={f} accion="saludar" />
      </Mundo>
      <Rotulo titulo={e.nombre} sub={`${p.nombre} · ${p.tipo}`} />
    </AbsoluteFill>
  );
};

export const CatalogoEscenarios: React.FC = () => (
  <AbsoluteFill style={{ background: "#0f1020" }}>
    {LISTA.map((id, i) => (
      <Sequence key={id} from={i * POR_ESCENARIO} durationInFrames={POR_ESCENARIO}>
        <Ficha id={id} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
