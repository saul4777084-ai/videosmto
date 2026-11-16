// Catálogo «Mundo 3D · personajes»: cada personaje en un pedestal, girando y saludando.
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Escenario3D, Mat } from "../comun/Mundo3D";
import { NombrePersonaje, PERSONAJES } from "../comun/Personajes3D";

export const POR_PERSONAJE = 75;
const LISTA = Object.keys(PERSONAJES) as NombrePersonaje[];
export const DURACION_PERSONAJES = LISTA.length * POR_PERSONAJE;

const Etiqueta: React.FC<{ titulo: string; sub: string }> = ({ titulo, sub }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 1480, textAlign: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
    <div style={{ fontSize: 96, fontWeight: 900, color: "#fff", textShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>{titulo}</div>
    <div style={{ fontSize: 44, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{sub}</div>
  </div>
);

const Ficha: React.FC<{ id: NombrePersonaje }> = ({ id }) => {
  const f = useCurrentFrame();
  const { C, nombre, tipo, fondo } = PERSONAJES[id];
  const accion = f < 30 ? "reposo" : "saludar";
  return (
    <AbsoluteFill>
      <Escenario3D camara={[0, 2.1, 7.4]} mira={[0, 1.45, 0]} cielo={[fondo, fondo]} desplazar={0.04} niebla={fondo}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <Mat color={fondo} rugoso={0.9} />
        </mesh>
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <cylinderGeometry args={[1.25, 1.3, 0.12, 48]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.35} roughness={0.3} clearcoat={1} />
        </mesh>
        <group position={[0, 0.12, 0]}>
          <C f={f} accion={accion} giro={Math.sin(f / 30) * 0.35} />
        </group>
      </Escenario3D>
      <Etiqueta titulo={nombre} sub={tipo} />
    </AbsoluteFill>
  );
};

export const CatalogoPersonajes: React.FC = () => (
  <AbsoluteFill style={{ background: "#0f1020" }}>
    {LISTA.map((id, i) => (
      <Sequence key={id} from={i * POR_PERSONAJE} durationInFrames={POR_PERSONAJE}>
        <Ficha id={id} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
