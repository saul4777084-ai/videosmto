// Astronauta caminando en una cinta en Marte (con Zorp animando): los astronautas hacen ~2 h de ejercicio al día.
// Render con --gl=swangle (≈4 s/fotograma). con3D=false dibuja un fondo 2D (para previsualizar rápido).
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Mundo } from "../comun/Escenarios3D";
import { lerp3, Persona, poseDe, Tela, tramo as tramo3 } from "../comun/Mundo3D";
import { Zorp } from "../comun/Personajes3D";
import { AMARILLO, H, Rotulo, Tu, W } from "../Frio/Piezas";

const Cinta: React.FC<{ f: number }> = ({ f }) => (
  <group>
    <mesh position={[0, 0.08, 0]}>
      <boxGeometry args={[0.95, 0.16, 1.9]} />
      <Tela color="#2a2f38" rugoso={0.6} />
    </mesh>
    {/* rayas de la cinta que corren hacia atrás */}
    {Array.from({ length: 6 }, (_, i) => (
      <mesh key={i} position={[0, 0.165, ((((i * 0.32 - (f * 0.03)) % 1.9) + 1.9) % 1.9) - 0.95]}>
        <boxGeometry args={[0.8, 0.01, 0.05]} />
        <Tela color="#5a6372" />
      </mesh>
    ))}
    {[-0.42, 0.42].map((x) => (
      <mesh key={x} position={[x, 0.65, 0.85]}>
        <cylinderGeometry args={[0.035, 0.035, 1.1, 12]} />
        <Tela color="#c9d3dd" rugoso={0.3} />
      </mesh>
    ))}
    <mesh position={[0, 1.2, 0.85]}>
      <boxGeometry args={[0.95, 0.12, 0.2]} />
      <Tela color="#e0332b" rugoso={0.4} />
    </mesh>
  </group>
);

export const Astronautas3D: React.FC<{ f: number; dur: number; en: (p: string, n?: number) => number; con3D: boolean }> = ({ f, dur, en, con3D }) => {
  const ta = en("astronautas");
  const t2 = en("dos");
  const te = en("ejercicio");
  return (
    <AbsoluteFill>
      {con3D ? (
        <Mundo escenario="marte" f={f} camara={lerp3([2.4, 2.7, 8.6], [1.7, 2.3, 6.8], tramo3(f, 0, dur + 20))} mira={[0, 2.05, 0]}>
          <Cinta f={f} />
          <Persona
            f={f}
            pos={[0, 0.16, 0]}
            giro={0}
            semilla={21}
            piel="#e9b48f"
            pelo="#2a1a10"
            camisa="#f2f4f7"
            pantalon="#e2e6ec"
            estilo={{ pelo: "corto", zapatos: "#3c4350", cinturon: false, cuello: null, mangas: "#f2f4f7", ojos: "#3a2414" }}
            pose={poseDe("andar", f, 21)}
            enCabeza={
              <mesh>
                <sphereGeometry args={[0.6, 32, 24]} />
                <meshPhysicalMaterial color="#cfe8ff" transparent opacity={0.28} roughness={0.05} />
              </mesh>
            }
            enTorso={
              <mesh position={[0, 1.25, -0.32]}>
                <boxGeometry args={[0.55, 0.65, 0.25]} />
                <Tela color="#d9dee6" />
              </mesh>
            }
          />
          <Zorp f={f} pos={[-1.6, 0, -0.6]} giro={0.5} escala={0.85} accion={f > te ? "celebrar" : "senalar"} />
        </Mundo>
      ) : (
        <>
          <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #b5512a 0%, #2a0d06 85%)" }} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 40 }, (_, i) => (
              <circle key={i} cx={random(`e${i}`) * W} cy={random(`f${i}`) * H * 0.6} r={2 + random(`g${i}`) * 3} fill="#fff" opacity={0.5} />
            ))}
            <rect x={240} y={1560} width={460} height={60} rx={20} fill="#2a2f38" />
          </svg>
          <Tu f={f} x={470} y={1570} escala={0.9} acciones={[[0, "andar"]]} cara="feliz" sudadera="#f2f4f7" />
        </>
      )}
      <Rotulo f={f} inicio={ta - 4} texto="ASTRONAUTAS" x={540} y={460} tam={86} color="#fff" />
      <Rotulo f={f} inicio={t2} texto="2 HORAS AL DÍA" x={540} y={600} tam={84} fondo={AMARILLO} color="#2a1405" giro={-3} />
      <Rotulo f={f} inicio={te} texto="DE EJERCICIO" x={540} y={740} tam={60} color="#fff" />
    </AbsoluteFill>
  );
};
