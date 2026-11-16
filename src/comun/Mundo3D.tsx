// Biblioteca 3D (three.js + @remotion/three): personajes low-poly y piezas de escenario.
// Todo se anima con el frame que se pasa por props (nada de useFrame), así el render es determinista.
import React, { useLayoutEffect } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export const W = 1080;
export const H = 1920;

export type V3 = [number, number, number];

// ---------- lienzo con cámara, luces y cielo ----------

// desplazar: baja la imagen una fracción de la altura (deja cielo arriba para subtítulos y rótulos)
const Camara: React.FC<{ pos: V3; mira: V3; fov: number; desplazar: number }> = ({ pos, mira, fov, desplazar }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.position.set(...pos);
    c.fov = fov;
    c.setViewOffset(W, H, 0, -desplazar * H, W, H);
    c.updateProjectionMatrix();
    camera.lookAt(...mira);
  });
  return null;
};

export const Escenario3D: React.FC<{
  camara: V3;
  mira?: V3;
  fov?: number;
  cielo?: [string, string];
  niebla?: string;
  luzSol?: V3;
  desplazar?: number;
  children: React.ReactNode;
}> = ({ camara, mira = [0, 1, 0], fov = 42, desplazar = 0.12, cielo = ["#5fb4ff", "#d8efff"], niebla, luzSol = [6, 12, 8], children }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${cielo[0]}, ${cielo[1]})` }}>
    <ThreeCanvas width={W} height={H} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov, position: camara }}>
      <Camara pos={camara} mira={mira} fov={fov} desplazar={desplazar} />
      {niebla && <fog attach="fog" args={[niebla, 18, 60]} />}
      <hemisphereLight args={["#ffffff", "#7a8a99", 1.1]} />
      <directionalLight
        position={luzSol}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      {children}
    </ThreeCanvas>
  </div>
);

// ---------- utilidades ----------

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const suave = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
// rebote de "pop": 0 → 1 con un pequeño pasado
export const pop = (f: number, inicio: number, dur = 12) => {
  const t = clamp01((f - inicio) / dur);
  if (t <= 0) return 0;
  return 1 + Math.sin(t * Math.PI) * 0.25 * (1 - t) + (t < 1 ? -(1 - t) * (1 - t) : 0);
};
export const tramo = (f: number, a: number, b: number) => suave((f - a) / Math.max(1, b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// pseudoaleatorio estable
export const azar = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Mat: React.FC<{ color: string; rugoso?: number; metal?: number; emisivo?: string }> = ({ color, rugoso = 0.6, metal = 0, emisivo }) => (
  <meshStandardMaterial color={color} roughness={rugoso} metalness={metal} emissive={emisivo ?? "#000"} emissiveIntensity={emisivo ? 0.6 : 0} />
);

// ---------- suelos ----------

export const Suelo: React.FC<{ color?: string; tam?: number }> = ({ color = "#7cc96b", tam = 120 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[tam, tam]} />
    <Mat color={color} rugoso={1} />
  </mesh>
);

export const Calle: React.FC<{ z?: number }> = ({ z = 0 }) => (
  <group position={[0, 0.01, z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 5]} />
      <Mat color="#3b3f46" rugoso={0.9} />
    </mesh>
    {Array.from({ length: 30 }, (_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-60 + i * 4, 0.01, 0]}>
        <planeGeometry args={[1.8, 0.18]} />
        <Mat color="#f4f1e6" />
      </mesh>
    ))}
  </group>
);

// ---------- personaje ----------

export type Pose = {
  brazoIzq?: number; // ángulo (rad) del brazo izquierdo hacia arriba (0 = colgando, π = arriba)
  brazoDer?: number;
  adelanteIzq?: number; // giro del brazo hacia delante
  adelanteDer?: number;
  salto?: number; // altura extra
  inclinar?: number; // inclinación del cuerpo hacia delante
  cabeza?: number; // giro de la cabeza (sí/no)
  caminar?: number; // fase de caminar (rad); undefined = quieto
  boca?: "sonrisa" | "sorpresa" | "triste" | "seria";
};

export const Persona: React.FC<{
  pos?: V3;
  giro?: number;
  escala?: number;
  camisa?: string;
  pantalon?: string;
  piel?: string;
  pelo?: string;
  pose?: Pose;
}> = ({ pos = [0, 0, 0], giro = 0, escala = 1, camisa = "#ff6b3d", pantalon = "#2d3e66", piel = "#f2c39b", pelo = "#3a2414", pose = {} }) => {
  const { brazoIzq = 0.15, brazoDer = 0.15, adelanteIzq = 0, adelanteDer = 0, salto = 0, inclinar = 0, cabeza = 0, caminar, boca = "sonrisa" } = pose;
  const paso = caminar === undefined ? 0 : Math.sin(caminar) * 0.6;
  const bote = caminar === undefined ? 0 : Math.abs(Math.cos(caminar)) * 0.06;
  return (
    <group position={[pos[0], pos[1] + salto + bote, pos[2]]} rotation={[0, giro, 0]} scale={escala}>
      {/* piernas */}
      {[-1, 1].map((l) => (
        <group key={l} position={[0.17 * l, 0.95, 0]} rotation={[paso * l, 0, 0]}>
          <mesh position={[0, -0.45, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.65, 4, 10]} />
            <Mat color={pantalon} />
          </mesh>
          <mesh position={[0, -0.9, 0.08]} castShadow>
            <boxGeometry args={[0.24, 0.14, 0.38]} />
            <Mat color="#222" />
          </mesh>
        </group>
      ))}
      <group position={[0, 0.95, 0]} rotation={[inclinar, 0, 0]}>
        {/* torso */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.33, 0.55, 6, 14]} />
          <Mat color={camisa} />
        </mesh>
        {/* brazos */}
        {[
          [-1, brazoIzq, adelanteIzq - paso],
          [1, brazoDer, adelanteDer + paso],
        ].map(([l, arriba, adelante]) => (
          <group key={l} position={[0.42 * l, 0.92, 0]} rotation={[-adelante, 0, arriba * l]}>
            <mesh position={[0, -0.36, 0]} castShadow>
              <capsuleGeometry args={[0.1, 0.55, 4, 10]} />
              <Mat color={camisa} />
            </mesh>
            <mesh position={[0, -0.76, 0]} castShadow>
              <sphereGeometry args={[0.12, 12, 12]} />
              <Mat color={piel} />
            </mesh>
          </group>
        ))}
        {/* cabeza */}
        <group position={[0, 1.42, 0]} rotation={[0, cabeza, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.36, 24, 24]} />
            <Mat color={piel} />
          </mesh>
          <mesh position={[0, 0.1, -0.03]} scale={[1.05, 0.85, 1.05]}>
            <sphereGeometry args={[0.36, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color={pelo} />
          </mesh>
          {[-1, 1].map((l) => (
            <group key={l}>
              <mesh position={[0.13 * l, 0.04, 0.32]}>
                <sphereGeometry args={[boca === "sorpresa" ? 0.065 : 0.05, 12, 12]} />
                <Mat color="#1b1b1b" rugoso={0.2} />
              </mesh>
              <mesh position={[0.13 * l, 0.16 + (boca === "triste" ? -0.02 : 0), 0.31]} rotation={[0, 0, (boca === "triste" ? -0.35 : 0.15) * l]}>
                <boxGeometry args={[0.12, 0.025, 0.02]} />
                <Mat color={pelo} />
              </mesh>
            </group>
          ))}
          {boca === "sorpresa" ? (
            <mesh position={[0, -0.14, 0.33]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <Mat color="#5a1a1a" />
            </mesh>
          ) : (
            <mesh position={[0, boca === "triste" ? -0.19 : -0.12, 0.31]} rotation={[0, 0, boca === "triste" ? 0 : Math.PI]}>
              <torusGeometry args={[0.09, 0.022, 8, 16, boca === "seria" ? 0.01 : Math.PI]} />
              <Mat color="#5a1a1a" />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
};

// ---------- dinero ----------

export const Billete: React.FC<{ pos?: V3; rot?: V3; escala?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], escala = 1 }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh castShadow>
      <boxGeometry args={[1, 0.02, 0.45]} />
      <Mat color="#4caf50" rugoso={0.8} />
    </mesh>
    <mesh position={[0, 0.012, 0]}>
      <boxGeometry args={[0.8, 0.005, 0.32]} />
      <Mat color="#a5d6a7" rugoso={0.8} />
    </mesh>
    <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.1, 16]} />
      <Mat color="#2e7d32" />
    </mesh>
  </group>
);

export const Fajo: React.FC<{ pos?: V3; rot?: V3; escala?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], escala = 1 }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh castShadow position={[0, 0.15, 0]}>
      <boxGeometry args={[1, 0.3, 0.45]} />
      <Mat color="#43a047" rugoso={0.8} />
    </mesh>
    <mesh position={[0, 0.15, 0]}>
      <boxGeometry args={[0.22, 0.31, 0.46]} />
      <Mat color="#fff3c4" />
    </mesh>
  </group>
);

export const Moneda: React.FC<{ pos?: V3; rot?: V3; escala?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], escala = 1 }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.07, 28]} />
      <Mat color="#ffc928" metal={0.85} rugoso={0.25} />
    </mesh>
    <mesh position={[0, 0, 0.04]}>
      <torusGeometry args={[0.22, 0.02, 6, 24]} />
      <Mat color="#e6a800" metal={0.85} rugoso={0.25} />
    </mesh>
  </group>
);

export const Maletin: React.FC<{ pos?: V3; rot?: V3; abre?: number; escala?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], abre = 0, escala = 1 }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh castShadow position={[0, 0.2, 0]}>
      <boxGeometry args={[1.8, 0.4, 1.2]} />
      <Mat color="#2b2b2b" rugoso={0.4} metal={0.3} />
    </mesh>
    {/* billetes dentro */}
    {abre > 0 &&
      [-0.55, 0, 0.55].map((x) => <Fajo key={x} pos={[x, 0.3, 0]} rot={[0, Math.PI / 2, 0]} escala={0.5} />)}
    <group position={[0, 0.4, -0.6]} rotation={[-abre * 1.9, 0, 0]}>
      <mesh castShadow position={[0, 0.12, 0.6]}>
        <boxGeometry args={[1.8, 0.24, 1.2]} />
        <Mat color="#333" rugoso={0.4} metal={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0.6]}>
        <torusGeometry args={[0.18, 0.04, 8, 16, Math.PI]} />
        <Mat color="#c9a64a" metal={0.9} rugoso={0.3} />
      </mesh>
    </group>
  </group>
);

// ---------- edificios y vehículos ----------

export const Casa: React.FC<{ pos?: V3; giro?: number; escala?: number; pared?: string; techo?: string }> = ({
  pos = [0, 0, 0],
  giro = 0,
  escala = 1,
  pared = "#fff4e0",
  techo = "#d9534f",
}) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
      <boxGeometry args={[3.2, 2.4, 2.6]} />
      <Mat color={pared} />
    </mesh>
    <mesh castShadow position={[0, 3.1, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[2.6, 1.4, 4]} />
      <Mat color={techo} />
    </mesh>
    <mesh position={[0, 0.7, 1.31]}>
      <boxGeometry args={[0.7, 1.4, 0.05]} />
      <Mat color="#7a4a26" />
    </mesh>
    {[-1, 1].map((l) => (
      <mesh key={l} position={[1 * l, 1.5, 1.31]}>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <Mat color="#9fd8ff" rugoso={0.1} emisivo="#4aa3df" />
      </mesh>
    ))}
    <mesh position={[0.9, 3.4, -0.3]} castShadow>
      <boxGeometry args={[0.35, 0.9, 0.35]} />
      <Mat color="#8d6e63" />
    </mesh>
  </group>
);

export const Mansion: React.FC<{ pos?: V3; giro?: number; escala?: number }> = ({ pos = [0, 0, 0], giro = 0, escala = 1 }) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    <Casa pos={[0, 0, 0]} escala={1.3} pared="#ffffff" techo="#37474f" />
    <Casa pos={[-3.6, 0, 0.3]} escala={0.9} pared="#f5f5f5" techo="#37474f" />
    <Casa pos={[3.6, 0, 0.3]} escala={0.9} pared="#f5f5f5" techo="#37474f" />
    {/* piscina */}
    <mesh position={[0, 0.03, 3.6]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4, 1.6]} />
      <Mat color="#29b6f6" rugoso={0.05} emisivo="#0288d1" />
    </mesh>
  </group>
);

export const Edificio: React.FC<{ pos?: V3; alto?: number; ancho?: number; color?: string }> = ({ pos = [0, 0, 0], alto = 6, ancho = 2.4, color = "#90a4ae" }) => (
  <group position={pos}>
    <mesh castShadow receiveShadow position={[0, alto / 2, 0]}>
      <boxGeometry args={[ancho, alto, ancho]} />
      <Mat color={color} />
    </mesh>
    {Array.from({ length: Math.floor(alto / 1.1) }, (_, i) =>
      [-0.5, 0.5].map((x) => (
        <mesh key={`${i}${x}`} position={[x * ancho * 0.6, 0.9 + i * 1.1, ancho / 2 + 0.01]}>
          <planeGeometry args={[ancho * 0.3, 0.55]} />
          <Mat color="#d6eeff" rugoso={0.1} emisivo="#5c9bd1" />
        </mesh>
      )),
    )}
  </group>
);

// Edificio de gobierno con columnas (impuestos)
export const Gobierno: React.FC<{ pos?: V3; giro?: number; escala?: number }> = ({ pos = [0, 0, 0], giro = 0, escala = 1 }) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    {[0, 1, 2].map((i) => (
      <mesh key={i} receiveShadow castShadow position={[0, 0.12 + i * 0.24, 0.6 - i * 0.25]}>
        <boxGeometry args={[5 - i * 0.3, 0.24, 3.4 - i * 0.5]} />
        <Mat color="#e8e2d4" />
      </mesh>
    ))}
    {Array.from({ length: 6 }, (_, i) => (
      <mesh key={i} castShadow position={[-1.9 + i * 0.76, 1.95, 0.9]}>
        <cylinderGeometry args={[0.18, 0.2, 2.6, 14]} />
        <Mat color="#f4efe4" />
      </mesh>
    ))}
    <mesh castShadow position={[0, 1.95, -0.5]}>
      <boxGeometry args={[4.4, 2.6, 1.6]} />
      <Mat color="#d8d0bf" />
    </mesh>
    <mesh castShadow position={[0, 3.45, 0.2]}>
      <boxGeometry args={[4.8, 0.4, 2.6]} />
      <Mat color="#efe9dc" />
    </mesh>
    <mesh castShadow position={[0, 4.05, 0.2]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1]}>
      <cylinderGeometry args={[2.5, 2.5, 2.4, 3, 1, false, Math.PI / 2 - Math.PI / 3, (Math.PI * 2) / 3]} />
      <Mat color="#efe9dc" />
    </mesh>
  </group>
);

export const Auto: React.FC<{ pos?: V3; giro?: number; escala?: number; color?: string; ruedas?: number }> = ({
  pos = [0, 0, 0],
  giro = 0,
  escala = 1,
  color = "#e53935",
  ruedas = 0,
}) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    <mesh castShadow position={[0, 0.55, 0]}>
      <boxGeometry args={[3.2, 0.55, 1.5]} />
      <Mat color={color} rugoso={0.25} metal={0.5} />
    </mesh>
    <mesh castShadow position={[-0.2, 1.05, 0]}>
      <boxGeometry args={[1.6, 0.5, 1.3]} />
      <Mat color={color} rugoso={0.25} metal={0.5} />
    </mesh>
    <mesh position={[-0.2, 1.05, 0]}>
      <boxGeometry args={[1.5, 0.4, 1.32]} />
      <Mat color="#1d2b3a" rugoso={0.05} metal={0.3} />
    </mesh>
    {[1.6, -1.6].map((x) => (
      <mesh key={x} position={[x, 0.6, 0]}>
        <boxGeometry args={[0.05, 0.18, 1.2]} />
        <Mat color={x > 0 ? "#fff8c4" : "#ff5252"} emisivo={x > 0 ? "#fff3a0" : "#ff1744"} />
      </mesh>
    ))}
    {[-1.05, 1.05].map((x) =>
      [-0.72, 0.72].map((z) => (
        <group key={`${x}${z}`} position={[x, 0.32, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow rotation={[0, ruedas, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.24, 18]} />
            <Mat color="#1a1a1a" />
          </mesh>
          <mesh position={[0, z > 0 ? 0.125 : -0.125, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.02, 12]} />
            <Mat color="#cfd8dc" metal={0.9} rugoso={0.2} />
          </mesh>
        </group>
      )),
    )}
  </group>
);

export const Avion: React.FC<{ pos?: V3; rot?: V3; escala?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], escala = 1 }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
      <capsuleGeometry args={[0.45, 3.2, 8, 16]} />
      <Mat color="#fafafa" rugoso={0.3} />
    </mesh>
    <mesh castShadow>
      <boxGeometry args={[1, 0.08, 5]} />
      <Mat color="#1e88e5" />
    </mesh>
    <mesh castShadow position={[-1.9, 0.6, 0]}>
      <boxGeometry args={[0.7, 1, 0.08]} />
      <Mat color="#1e88e5" />
    </mesh>
    <mesh castShadow position={[-1.9, 0.15, 0]}>
      <boxGeometry args={[0.6, 0.06, 1.8]} />
      <Mat color="#1e88e5" />
    </mesh>
    {Array.from({ length: 6 }, (_, i) => (
      <mesh key={i} position={[1.2 - i * 0.45, 0.15, 0.44]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <Mat color="#26445f" />
      </mesh>
    ))}
  </group>
);

// ---------- naturaleza ----------

export const Arbol: React.FC<{ pos?: V3; escala?: number; color?: string }> = ({ pos = [0, 0, 0], escala = 1, color = "#3fa34d" }) => (
  <group position={pos} scale={escala}>
    <mesh castShadow position={[0, 0.7, 0]}>
      <cylinderGeometry args={[0.14, 0.2, 1.4, 8]} />
      <Mat color="#7a5230" />
    </mesh>
    <mesh castShadow position={[0, 1.9, 0]}>
      <icosahedronGeometry args={[0.9, 0]} />
      <Mat color={color} rugoso={0.9} />
    </mesh>
    <mesh castShadow position={[0.4, 1.5, 0.2]}>
      <icosahedronGeometry args={[0.55, 0]} />
      <Mat color={color} rugoso={0.9} />
    </mesh>
  </group>
);

export const Palmera: React.FC<{ pos?: V3; escala?: number; viento?: number }> = ({ pos = [0, 0, 0], escala = 1, viento = 0 }) => (
  <group position={pos} scale={escala}>
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} castShadow position={[i * 0.06, 0.25 + i * 0.5, 0]} rotation={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.16 - i * 0.008, 0.2 - i * 0.008, 0.5, 8]} />
        <Mat color={i % 2 ? "#8d6e46" : "#a1825a"} />
      </mesh>
    ))}
    <group position={[0.42, 3.6, 0]}>
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} rotation={[0, (i / 7) * Math.PI * 2, 0]}>
          <mesh castShadow position={[0.9, -0.2, 0]} rotation={[0, 0, -0.45 + Math.sin(viento + i) * 0.08]}>
            <boxGeometry args={[1.9, 0.05, 0.42]} />
            <Mat color="#2e9e4f" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <Mat color="#6d4c2f" />
      </mesh>
    </group>
  </group>
);

export const Nube: React.FC<{ pos?: V3; escala?: number }> = ({ pos = [0, 0, 0], escala = 1 }) => (
  <group position={pos} scale={escala}>
    {[
      [0, 0, 0, 1],
      [0.9, -0.15, 0, 0.75],
      [-0.9, -0.2, 0, 0.7],
      [0.3, 0.4, 0, 0.7],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 14, 14]} />
        <meshStandardMaterial color="#ffffff" roughness={1} emissive="#ffffff" emissiveIntensity={0.45} />
      </mesh>
    ))}
  </group>
);

export const Sol: React.FC<{ pos?: V3; escala?: number }> = ({ pos = [0, 0, 0], escala = 1 }) => (
  <mesh position={pos} scale={escala}>
    <sphereGeometry args={[1, 24, 24]} />
    <meshBasicMaterial color="#ffd54f" />
  </mesh>
);

// ---------- objetos ----------

export const Tarjeta: React.FC<{ pos?: V3; rot?: V3; escala?: number; color?: string; parte?: number }> = ({
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  escala = 1,
  color = "#7e57c2",
  parte = 0,
}) => (
  <group position={pos} rotation={rot} scale={escala}>
    {[-1, 1].map((l) => (
      <group key={l} position={[l * (0.425 + parte * 0.6), -parte * 0.4, 0]} rotation={[0, 0, -l * parte * 0.6]}>
        <mesh castShadow>
          <boxGeometry args={[0.85, 1.1, 0.04]} />
          <Mat color={color} rugoso={0.3} metal={0.2} />
        </mesh>
        {l < 0 && (
          <mesh position={[-0.1, 0.15, 0.025]}>
            <boxGeometry args={[0.3, 0.24, 0.01]} />
            <Mat color="#ffd54f" metal={0.8} rugoso={0.3} />
          </mesh>
        )}
        <mesh position={[0, -0.25, 0.025]}>
          <boxGeometry args={[0.7, 0.06, 0.01]} />
          <Mat color="#ffffff" />
        </mesh>
      </group>
    ))}
  </group>
);

export const Cerdito: React.FC<{ pos?: V3; giro?: number; escala?: number }> = ({ pos = [0, 0, 0], giro = 0, escala = 1 }) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    <mesh castShadow position={[0, 1, 0]} scale={[1.25, 1, 1]}>
      <sphereGeometry args={[1, 28, 28]} />
      <Mat color="#ff8fb3" rugoso={0.35} />
    </mesh>
    <mesh castShadow position={[1.2, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.32, 0.32, 0.3, 18]} />
      <Mat color="#ff7aa4" rugoso={0.35} />
    </mesh>
    {[-0.12, 0.12].map((z) => (
      <mesh key={z} position={[1.36, 1.05, z]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <Mat color="#b3305f" />
      </mesh>
    ))}
    {[-0.4, 0.4].map((z) => (
      <group key={z}>
        <mesh position={[0.85, 1.55, z]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <Mat color="#ff7aa4" />
        </mesh>
        <mesh position={[0.95, 1.3, z * 1.1]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <Mat color="#1b1b1b" rugoso={0.2} />
        </mesh>
      </group>
    ))}
    {[-0.6, 0.6].map((x) =>
      [-0.5, 0.5].map((z) => (
        <mesh key={`${x}${z}`} castShadow position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.18, 0.18, 0.45, 10]} />
          <Mat color="#ff7aa4" />
        </mesh>
      )),
    )}
    {/* ranura */}
    <mesh position={[0, 1.99, 0]}>
      <boxGeometry args={[0.55, 0.04, 0.1]} />
      <Mat color="#5a1a33" />
    </mesh>
  </group>
);

export const CajaFuerte: React.FC<{ pos?: V3; giro?: number; escala?: number; abre?: number }> = ({ pos = [0, 0, 0], giro = 0, escala = 1, abre = 0 }) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    <mesh castShadow position={[0, 1, 0]}>
      <boxGeometry args={[2, 2, 1.8]} />
      <Mat color="#546e7a" metal={0.7} rugoso={0.35} />
    </mesh>
    <group position={[-0.9, 1, 0.91]} rotation={[0, -abre * 1.6, 0]}>
      <mesh position={[0.9, 0, 0.04]} castShadow>
        <boxGeometry args={[1.8, 1.8, 0.08]} />
        <Mat color="#607d8b" metal={0.75} rugoso={0.3} />
      </mesh>
      <mesh position={[0.9, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.12, 24]} />
        <Mat color="#cfd8dc" metal={0.9} rugoso={0.2} />
      </mesh>
    </group>
  </group>
);

export const Flecha: React.FC<{ pos?: V3; rot?: V3; escala?: number; color?: string }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], escala = 1, color = "#e53935" }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh castShadow position={[0, 0.9, 0]}>
      <boxGeometry args={[0.45, 1.8, 0.45]} />
      <Mat color={color} rugoso={0.3} />
    </mesh>
    <mesh castShadow position={[0, 2.2, 0]}>
      <coneGeometry args={[0.7, 0.9, 4]} />
      <Mat color={color} rugoso={0.3} />
    </mesh>
  </group>
);

export const Tumbona: React.FC<{ pos?: V3; giro?: number; escala?: number }> = ({ pos = [0, 0, 0], giro = 0, escala = 1 }) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    <mesh castShadow position={[0, 0.45, 0.3]}>
      <boxGeometry args={[0.9, 0.1, 1.6]} />
      <Mat color="#ff7043" />
    </mesh>
    <mesh castShadow position={[0, 0.8, -0.7]} rotation={[0.9, 0, 0]}>
      <boxGeometry args={[0.9, 0.1, 1]} />
      <Mat color="#ff7043" />
    </mesh>
    {[-0.4, 0.4].map((x) =>
      [-0.3, 0.9].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
          <Mat color="#eeeeee" />
        </mesh>
      )),
    )}
  </group>
);

export const Sombrilla: React.FC<{ pos?: V3; escala?: number }> = ({ pos = [0, 0, 0], escala = 1 }) => (
  <group position={pos} scale={escala}>
    <mesh position={[0, 1.3, 0]}>
      <cylinderGeometry args={[0.05, 0.05, 2.6, 8]} />
      <Mat color="#eeeeee" />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={i} castShadow position={[0, 2.6, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
        <coneGeometry args={[1.6, 0.6, 8, 1, true, 0, Math.PI / 4]} />
        <meshStandardMaterial color={i % 2 ? "#ffffff" : "#e53935"} side={THREE.DoubleSide} />
      </mesh>
    ))}
  </group>
);

export const Mar: React.FC<{ f: number; z?: number }> = ({ f, z = -14 }) => (
  <group position={[0, 0.02, z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[140, 24]} />
      <Mat color="#1e9ad6" rugoso={0.15} metal={0.1} />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-30 + i * 7 + Math.sin(f / 20 + i) * 0.6, 0.02, 8 + Math.sin(f / 15 + i * 2) * 0.4]}>
        <planeGeometry args={[3, 0.2]} />
        <Mat color="#d5f2ff" />
      </mesh>
    ))}
  </group>
);

export const Barra: React.FC<{ pos?: V3; alto: number; color?: string; ancho?: number }> = ({ pos = [0, 0, 0], alto, color = "#26a69a", ancho = 0.7 }) => (
  <mesh castShadow receiveShadow position={[pos[0], pos[1] + Math.max(alto, 0.01) / 2, pos[2]]}>
    <boxGeometry args={[ancho, Math.max(alto, 0.01), ancho]} />
    <Mat color={color} rugoso={0.35} />
  </mesh>
);

// Lluvia de billetes: cada billete cae girando desde arriba, de forma estable con el frame
export const LluviaBilletes: React.FC<{ f: number; inicio: number; n?: number; area?: [number, number]; centro?: V3; alto?: number; velocidad?: number }> = ({
  f,
  inicio,
  n = 40,
  area = [10, 6],
  centro = [0, 0, 0],
  alto = 9,
  velocidad = 0.08,
}) => {
  if (f < inicio) return null;
  return (
    <group position={centro}>
      {Array.from({ length: n }, (_, i) => {
        const t = (f - inicio) * velocidad * (0.7 + azar(i) * 0.6) + azar(i + 50) * alto;
        const y = alto - (t % (alto + 1));
        const x = (azar(i + 7) - 0.5) * area[0] + Math.sin(t * 1.3 + i) * 0.4;
        const z = (azar(i + 13) - 0.5) * area[1];
        return <Billete key={i} pos={[x, y, z]} rot={[Math.sin(t * 2 + i) * 1.2, t * 1.5 + i, Math.cos(t * 1.7 + i) * 0.8]} escala={0.7} />;
      })}
    </group>
  );
};
