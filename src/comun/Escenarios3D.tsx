// Mundo 3D · escenarios. Cada uno trae su cielo, niebla, suelo y decorado animado.
// Uso: <Mundo escenario="islaPirata" f={f} camara={[0, 2.4, 8]} mira={[0, 1.4, 0]}>…personajes…</Mundo>
// El centro de la escena (0, 0, 0) queda libre para los personajes.
import React, { useMemo } from "react";
import * as THREE from "three";
import { azar, Escenario3D, Hierba, Mar, Mat, Montanas, Palmera, Redondo, Suelo, texturaSuelo, V3 } from "./Mundo3D";

type PropsDeco = { f: number };

// ---------- piezas comunes ----------

const Roca: React.FC<{ pos: V3; escala?: number; color?: string; semilla?: number }> = ({ pos, escala = 1, color = "#6f6a63", semilla = 1 }) => {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const k = 0.75 + azar(Math.round(v.x * 7 + v.y * 13 + v.z * 17) + semilla) * 0.45;
      v.multiplyScalar(k);
      p.setXYZ(i, v.x, v.y * 0.7, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [semilla]);
  const { relieve } = texturaSuelo("tierra", "#808080", 1);
  return (
    <mesh geometry={geo} position={pos} scale={escala} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.95} normalMap={relieve} flatShading />
    </mesh>
  );
};

// partículas que caen (nieve, polvo, confeti)
const Particulas: React.FC<{ f: number; n?: number; color?: string | string[]; tam?: number; area?: [number, number, number]; vel?: number; brillo?: boolean; planas?: boolean }> = ({
  f,
  n = 300,
  color = "#ffffff",
  tam = 0.04,
  area = [24, 12, 16],
  vel = 0.02,
  brillo,
  planas,
}) => {
  const colores = Array.isArray(color) ? color : [color];
  const malla = useMemo(() => {
    const geo = planas ? new THREE.PlaneGeometry(tam * 2, tam) : new THREE.SphereGeometry(tam, 6, 4);
    const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, side: THREE.DoubleSide, emissive: brillo ? "#ffffff" : "#000000", emissiveIntensity: brillo ? 0.6 : 0 });
    const m = new THREE.InstancedMesh(geo, mat, n);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) m.setColorAt(i, c.set(colores[i % colores.length]));
    return m;
  }, [n, tam, brillo, planas, colores.join()]);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const y = area[1] - (((f * vel * (0.6 + azar(i) * 0.8) + azar(i + 9) * area[1]) % area[1]) + area[1]) % area[1];
    o.position.set((azar(i + 3) - 0.5) * area[0] + Math.sin(f / 30 + i) * 0.3, y, (azar(i + 5) - 0.5) * area[2] - 3);
    o.rotation.set(f / 10 + i, f / 13 + i, 0);
    o.updateMatrix();
    malla.setMatrixAt(i, o.matrix);
  }
  malla.instanceMatrix.needsUpdate = true;
  return <primitive object={malla} />;
};

const Estrellas: React.FC<{ n?: number }> = ({ n = 500 }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = azar(i) * Math.PI * 2;
      const b = azar(i + 99) * 1.2 + 0.1;
      p.push(Math.cos(a) * Math.cos(b) * 400, Math.sin(b) * 400, Math.sin(a) * Math.cos(b) * 400 - 100);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, [n]);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} fog={false} />
    </points>
  );
};

// textura de rayas para carpas, bastones de caramelo, piruletas…
const cacheTiras = new Map<string, THREE.CanvasTexture>();
const tiras = (a: string, b: string, n = 8, diagonal = false) => {
  const k = `${a}${b}${n}${diagonal}`;
  const hay = cacheTiras.get(k);
  if (hay) return hay;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const d = c.getContext("2d")!;
  d.fillStyle = a;
  d.fillRect(0, 0, 256, 256);
  d.fillStyle = b;
  const w = 256 / n;
  for (let i = -n; i < n * 2; i += 2) {
    d.beginPath();
    if (diagonal) {
      d.moveTo(i * w, 0);
      d.lineTo(i * w + w, 0);
      d.lineTo(i * w + w + 256, 256);
      d.lineTo(i * w + 256, 256);
    } else {
      d.rect(i * w, 0, w, 256);
    }
    d.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cacheTiras.set(k, t);
  return t;
};

// ---------- 1. Isla pirata ----------

const Cofre: React.FC<{ pos: V3; giro?: number; abre?: number }> = ({ pos, giro = 0, abre = 0.6 }) => (
  <group position={pos} rotation={[0, giro, 0]}>
    <mesh castShadow position={[0, 0.3, 0]}>
      <Redondo args={[1, 0.6, 0.65]} />
      <Mat color="#7a4a24" rugoso={0.8} />
    </mesh>
    {[-0.35, 0.35].map((x) => (
      <mesh key={x} position={[x, 0.3, 0]}>
        <Redondo args={[0.08, 0.62, 0.67]} />
        <Mat color="#c9a043" metal={0.9} rugoso={0.3} />
      </mesh>
    ))}
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} position={[(azar(i) - 0.5) * 0.7, 0.62 + azar(i + 4) * 0.08, (azar(i + 8) - 0.5) * 0.4]} rotation={[azar(i) * 2, 0, azar(i + 1)]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial color="#ffcc33" metalness={1} roughness={0.2} />
      </mesh>
    ))}
    <group position={[0, 0.6, -0.32]} rotation={[-abre * 1.6, 0, 0]}>
      <mesh castShadow position={[0, 0.1, 0.32]} scale={[1, 0.5, 1]}>
        <cylinderGeometry args={[0.33, 0.33, 1, 20, 1, false, 0, Math.PI]} />
        <Mat color="#6b3f1f" rugoso={0.8} />
      </mesh>
    </group>
  </group>
);

const Galeon: React.FC<{ pos: V3; f: number }> = ({ pos, f }) => (
  <group position={pos} rotation={[Math.sin(f / 25) * 0.03, 0.4, Math.sin(f / 30) * 0.04]}>
    <mesh castShadow position={[0, 0.7, 0]} scale={[1, 0.6, 0.35]}>
      <sphereGeometry args={[3, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      <Mat color="#5a3418" rugoso={0.8} />
    </mesh>
    <mesh position={[0, 0.72, 0]}>
      <Redondo args={[5.6, 0.12, 1.9]} />
      <Mat color="#7a5230" />
    </mesh>
    {[-1.6, 0, 1.6].map((x, i) => (
      <group key={x} position={[x, 0.7, 0]}>
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 4.4, 8]} />
          <Mat color="#4a2c14" />
        </mesh>
        {[1.4, 2.8].map((y) => (
          <mesh key={y} position={[0, y, 0.1]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 1]}>
            <planeGeometry args={[1.4 - i * 0.1, 1.1]} />
            <meshStandardMaterial color="#f3ead7" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    ))}
    <mesh position={[0, 5.3, 0]}>
      <planeGeometry args={[0.6, 0.4]} />
      <meshStandardMaterial color="#111" side={THREE.DoubleSide} />
    </mesh>
  </group>
);

const IslaPirata: React.FC<PropsDeco> = ({ f }) => (
  <group>
    <Mar f={f} z={-4} />
    <mesh position={[0, -1.6, 0]} scale={[1, 0.18, 0.8]} receiveShadow>
      <sphereGeometry args={[10, 48, 24]} />
      <meshStandardMaterial map={texturaSuelo("arena", "#e8d3a2", 6).mapa} normalMap={texturaSuelo("arena", "#e8d3a2", 6).relieve} roughness={0.95} />
    </mesh>
    <group position={[0, 0.2, 0]}>
      <Palmera pos={[-3.6, 0, -4]} escala={1.5} viento={f / 15} />
      <Palmera pos={[4, 0, -5]} escala={1.7} viento={f / 15 + 2} />
      <Palmera pos={[-5.5, 0, -5]} escala={1.3} viento={f / 15 + 4} />
      <Roca pos={[-2.2, 0, 1.6]} escala={0.8} semilla={2} />
      <Roca pos={[-1.5, 0, 2.2]} escala={0.5} semilla={5} />
      <Cofre pos={[2.2, 0, 1]} giro={-0.5} />
      <Hierba color="#8aa84a" n={900} radio={3} centro={[-4.5, 0, -3]} alto={0.3} />
    </group>
    <Galeon pos={[-14, 0, -30]} f={f} />
    <Montanas z={-120} color="#5b8b6e" alto={30} />
  </group>
);

// ---------- 2. Polo Norte ----------

const Iglu: React.FC<{ pos: V3; giro?: number }> = ({ pos, giro = 0 }) => {
  const bloques = tiras("#f4f8ff", "#cbd8ec", 24);
  return (
    <group position={pos} rotation={[0, giro, 0]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.8, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial map={bloques} roughness={0.6} color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.55, 1.6]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 1.1, 24, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#eef4ff" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.5, 2.12]}>
        <circleGeometry args={[0.5, 24, 0, Math.PI]} />
        <meshStandardMaterial color="#ffb347" emissive="#ff9a2e" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0, 0.6, 2.4]} color="#ffa040" intensity={6} distance={6} />
    </group>
  );
};

const Pino: React.FC<{ pos: V3; escala?: number; nieve?: boolean }> = ({ pos, escala = 1, nieve = true }) => (
  <group position={pos} scale={escala}>
    <mesh position={[0, 0.3, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.14, 0.6, 8]} />
      <Mat color="#4a2f1a" />
    </mesh>
    {[0, 1, 2, 3].map((i) => (
      <group key={i} position={[0, 0.8 + i * 0.55, 0]}>
        <mesh castShadow>
          <coneGeometry args={[1 - i * 0.2, 1, 10]} />
          <Mat color="#18402c" rugoso={0.9} />
        </mesh>
        {nieve && (
          <mesh position={[0, 0.18, 0]} scale={[1, 0.4, 1]}>
            <coneGeometry args={[0.65 - i * 0.14, 0.6, 10]} />
            <Mat color="#f2f7ff" rugoso={0.6} />
          </mesh>
        )}
      </group>
    ))}
  </group>
);

const MunecoNieve: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    {[
      [0.55, 0.5],
      [0.4, 1.25],
      [0.3, 1.82],
    ].map(([r, y]) => (
      <mesh key={y} position={[0, y, 0]} castShadow>
        <sphereGeometry args={[r, 24, 18]} />
        <Mat color="#f6f9ff" rugoso={0.7} />
      </mesh>
    ))}
    <mesh position={[0, 1.8, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
      <coneGeometry args={[0.05, 0.3, 10]} />
      <Mat color="#f07a1a" />
    </mesh>
    {[-0.1, 0.1].map((x) => (
      <mesh key={x} position={[x, 1.9, 0.26]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <Mat color="#111" />
      </mesh>
    ))}
    <mesh position={[0, 2.18, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.3, 18]} />
      <Mat color="#151515" />
    </mesh>
    <mesh position={[0, 2.04, 0]}>
      <cylinderGeometry args={[0.32, 0.32, 0.03, 20]} />
      <Mat color="#151515" />
    </mesh>
  </group>
);

const Iceberg: React.FC<{ pos: V3; escala?: number; semilla?: number }> = ({ pos, escala = 1, semilla = 1 }) => (
  <group position={pos} scale={escala}>
    <Roca pos={[0, 0.8, 0]} escala={2.2} color="#dcecff" semilla={semilla} />
    <Roca pos={[1.6, 0.4, 0.4]} escala={1.3} color="#cfe4fb" semilla={semilla + 3} />
  </group>
);

const Aurora: React.FC<{ f: number }> = ({ f }) => (
  <group position={[0, 40, -120]}>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[(i - 1) * 50, Math.sin(f / 40 + i) * 4, i * 3]} rotation={[0, 0, Math.sin(f / 50 + i) * 0.15]}>
        <planeGeometry args={[90, 26, 1, 1]} />
        <meshBasicMaterial color={i === 1 ? "#5cf2b0" : "#7a6cff"} transparent opacity={0.22 + Math.sin(f / 20 + i) * 0.06} fog={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    ))}
  </group>
);

const PoloNorte: React.FC<PropsDeco> = ({ f }) => (
  <group>
    <Suelo tipo="nieve" color="#e6eeff" />
    <Estrellas />
    <Aurora f={f} />
    <Iglu pos={[-2.6, 0, -2]} giro={0.5} />
    <Pino pos={[-1, 0, -7]} escala={1.6} />
    <Pino pos={[-4.5, 0, -9]} escala={1.3} />
    <Pino pos={[1.8, 0, -10]} escala={1.1} />
    <MunecoNieve pos={[2.8, 0, -1.5]} />
    <Iceberg pos={[-12, 0, -30]} escala={3} semilla={2} />
    <Iceberg pos={[10, 0, -34]} escala={4} semilla={7} />
    <Montanas z={-90} color="#8fa6d8" alto={35} semilla={4} />
    <Particulas f={f} n={500} color="#ffffff" tam={0.035} vel={0.03} brillo />
  </group>
);

// ---------- 3. Marte ----------

const Cupula: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <mesh>
      <sphereGeometry args={[2.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial color="#dff3ff" roughness={0.05} transmission={0.6} transparent opacity={0.35} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.05, 0]}>
      <cylinderGeometry args={[2.25, 2.3, 0.1, 40]} />
      <meshStandardMaterial color="#c9ccd2" metalness={0.9} roughness={0.3} />
    </mesh>
    {[
      [-0.8, 0.4],
      [0.6, -0.5],
      [0.2, 0.8],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.45, z]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <Mat color={i === 1 ? "#4fae5a" : "#6cc56a"} />
      </mesh>
    ))}
  </group>
);

const Rover: React.FC<{ pos: V3; f: number }> = ({ pos, f }) => (
  <group position={[pos[0] + Math.sin(f / 60) * 0.6, pos[1], pos[2]]} rotation={[0, -0.6, 0]}>
    <mesh castShadow position={[0, 0.65, 0]}>
      <Redondo args={[1.4, 0.35, 0.9]} />
      <meshStandardMaterial color="#e9e9ec" metalness={0.6} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.86, 0]}>
      <Redondo args={[1.2, 0.04, 0.85]} />
      <meshStandardMaterial color="#20335a" metalness={0.7} roughness={0.15} />
    </mesh>
    {[-0.5, 0, 0.5].map((x) =>
      [-0.55, 0.55].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.22, z]} rotation={[Math.PI / 2, f / 8, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} />
          <Mat color="#2a2a2e" />
        </mesh>
      )),
    )}
    <mesh position={[0.45, 1.25, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
      <Mat color="#cfcfd4" metal={0.8} />
    </mesh>
    <mesh position={[0.45, 1.68, 0]}>
      <Redondo args={[0.3, 0.16, 0.2]} />
      <Mat color="#e9e9ec" metal={0.5} />
    </mesh>
  </group>
);

const Parabolica: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <mesh position={[0, 1.4, 0]}>
      <cylinderGeometry args={[0.05, 0.08, 2.8, 10]} />
      <Mat color="#cfd2d8" metal={0.8} rugoso={0.3} />
    </mesh>
    <mesh position={[0, 2.9, 0]} rotation={[-0.6, 0, 0]}>
      <sphereGeometry args={[0.9, 32, 12, 0, Math.PI * 2, 0, 0.7]} />
      <meshStandardMaterial color="#f0f0f2" metalness={0.5} roughness={0.25} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

const Crater: React.FC<{ pos: V3; r?: number }> = ({ pos, r = 1.5 }) => (
  <group position={pos}>
    <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]} receiveShadow castShadow>
      <torusGeometry args={[r, r * 0.25, 10, 32]} />
      <Mat color="#8c3416" rugoso={1} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <circleGeometry args={[r, 32]} />
      <Mat color="#6e2810" rugoso={1} />
    </mesh>
  </group>
);

const Marte: React.FC<PropsDeco> = ({ f }) => (
  <group>
    <Suelo tipo="tierra" color="#a9431f" />
    <Cupula pos={[-4, 0, -4]} />
    <Rover pos={[3.6, 0, -3]} f={f} />
    <Parabolica pos={[-1.5, 0, -8]} />
    <Crater pos={[2, 0.02, 2.5]} r={1.2} />
    <Crater pos={[-6, 0.02, -12]} r={3} />
    <Roca pos={[-2.2, 0.1, 1.8]} escala={0.45} color="#7a2c12" semilla={3} />
    <Roca pos={[4.5, 0.1, 0.5]} escala={0.6} color="#7a2c12" semilla={8} />
    <Roca pos={[-7, 0.3, -6]} escala={1.2} color="#83321a" semilla={11} />
    <Montanas z={-80} color="#9c4a2a" alto={30} semilla={6} />
    <mesh position={[30, 55, -200]}>
      <sphereGeometry args={[7, 24, 16]} />
      <meshBasicMaterial color="#f3dcc4" fog={false} />
    </mesh>
    <mesh position={[-45, 70, -220]}>
      <sphereGeometry args={[4, 24, 16]} />
      <meshBasicMaterial color="#e8c9ae" fog={false} />
    </mesh>
    <Particulas f={f} n={250} color="#f4c7a0" tam={0.03} vel={0.01} />
  </group>
);

// ---------- 4. Antiguo Egipto ----------

const Piramide: React.FC<{ pos: V3; escala?: number }> = ({ pos, escala = 1 }) => {
  const { mapa, relieve } = texturaSuelo("liso", "#d9b77a", 3);
  return (
    <mesh position={[pos[0], pos[1] + 5 * escala, pos[2]]} rotation={[0, Math.PI / 4, 0]} scale={escala} castShadow receiveShadow>
      <coneGeometry args={[7, 10, 4]} />
      <meshStandardMaterial map={mapa} normalMap={relieve} roughness={0.95} flatShading />
    </mesh>
  );
};

const Templo: React.FC<{ pos: V3; giro?: number }> = ({ pos, giro = 0 }) => {
  const { mapa, relieve } = texturaSuelo("liso", "#e3cfa0", 2);
  return (
    <group position={pos} rotation={[0, giro, 0]}>
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <Redondo args={[7, 0.4, 3]} />
        <meshStandardMaterial map={mapa} normalMap={relieve} roughness={0.9} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} position={[-2.8 + i * 1.4, 0.4, 0.8]}>
          <mesh castShadow position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.38, 0.42, 3.6, 20]} />
            <meshStandardMaterial map={mapa} normalMap={relieve} roughness={0.9} />
          </mesh>
          {[2.9, 3.15].map((y, k) => (
            <mesh key={y} position={[0, y, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.12, 20]} />
              <Mat color={k ? "#2457b8" : "#c8402a"} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 4.35, 0.6]} castShadow>
        <Redondo args={[7.2, 0.7, 2]} />
        <meshStandardMaterial map={mapa} normalMap={relieve} roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2, -0.6]} receiveShadow>
        <Redondo args={[6.6, 3.6, 0.6]} />
        <meshStandardMaterial map={mapa} normalMap={relieve} roughness={0.9} />
      </mesh>
    </group>
  );
};

const Obelisco: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <mesh castShadow position={[0, 3, 0]}>
      <cylinderGeometry args={[0.32, 0.5, 6, 4]} />
      <meshStandardMaterial color="#d8b77d" roughness={0.9} flatShading />
    </mesh>
    <mesh castShadow position={[0, 6.3, 0]}>
      <coneGeometry args={[0.32, 0.6, 4]} />
      <meshStandardMaterial color="#e2b23a" metalness={0.9} roughness={0.25} flatShading />
    </mesh>
  </group>
);

const Vasija: React.FC<{ pos: V3; color?: string; escala?: number }> = ({ pos, color = "#c0602e", escala = 1 }) => {
  const geo = useMemo(() => {
    const pts = [0, 0.2, 0.32, 0.36, 0.3, 0.16, 0.13, 0.17].map((r, i) => new THREE.Vector2(r, i * 0.1));
    return new THREE.LatheGeometry(pts, 24);
  }, []);
  return (
    <mesh geometry={geo} position={pos} scale={escala} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.5} clearcoat={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
};

const Egipto: React.FC<PropsDeco> = () => (
  <group>
    <Suelo tipo="arena" color="#e3c68b" />
    <Templo pos={[-3.5, 0, -6]} giro={0.25} />
    <Piramide pos={[8, 0, -26]} escala={1.3} />
    <Piramide pos={[22, 0, -40]} escala={1.6} />
    <Piramide pos={[-14, 0, -45]} escala={1.1} />
    <Obelisco pos={[3.5, 0, -5]} />
    <Vasija pos={[2.2, 0, 1.2]} escala={1.2} />
    <Vasija pos={[2.8, 0, 1.6]} color="#2a5fb8" />
    <Montanas z={-70} color="#d9b47a" alto={12} semilla={9} />
    <Hierba color="#7fa04a" n={600} radio={2} centro={[-4.5, 0, 0.5]} alto={0.5} />
  </group>
);

// ---------- 5. Feria nocturna ----------

const Bombilla: React.FC<{ pos: V3; color: string; r?: number }> = ({ pos, color, r = 0.07 }) => (
  <mesh position={pos}>
    <sphereGeometry args={[r, 10, 8]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
  </mesh>
);

const Noria: React.FC<{ pos: V3; f: number }> = ({ pos, f }) => {
  const giro = f / 120;
  const colores = ["#ff4fa0", "#ffd23f", "#4fd2ff", "#8cff6a"];
  return (
    <group position={pos}>
      {[-1, 1].map((l) => (
        <mesh key={l} position={[0.9 * l, 3.4, 0]} rotation={[0, 0, l * 0.25]}>
          <cylinderGeometry args={[0.12, 0.16, 7, 8]} />
          <Mat color="#d8d8e0" metal={0.8} rugoso={0.3} />
        </mesh>
      ))}
      <group position={[0, 6.6, 0]} rotation={[0, 0, giro]}>
        <mesh>
          <torusGeometry args={[5, 0.08, 8, 64]} />
          <meshStandardMaterial color="#c977ff" emissive="#b04dff" emissiveIntensity={1.5} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <group key={i}>
              <mesh rotation={[0, 0, a]} position={[Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0]}>
                <boxGeometry args={[5, 0.05, 0.05]} />
                <Mat color="#e6e6ee" metal={0.8} />
              </mesh>
              <Bombilla pos={[Math.cos(a) * 5, Math.sin(a) * 5, 0.1]} color={colores[i % 4]} r={0.14} />
              <group position={[Math.cos(a) * 5, Math.sin(a) * 5, 0]} rotation={[0, 0, -giro]}>
                <mesh position={[0, -0.55, 0]} castShadow>
                  <Redondo args={[0.7, 0.6, 0.7]} />
                  <meshPhysicalMaterial color={colores[(i + 1) % 4]} roughness={0.3} clearcoat={1} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
};

const Carpa: React.FC<{ pos: V3 }> = ({ pos }) => {
  const t = tiras("#d61f2c", "#f6f1e6", 16);
  return (
    <group position={pos}>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3, 3, 2.8, 32, 1, true]} />
        <meshStandardMaterial map={t} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 4, 0]} castShadow>
        <coneGeometry args={[3.4, 2.6, 32, 1, true]} />
        <meshStandardMaterial map={t} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <coneGeometry args={[0.05, 0.6, 8]} />
        <Mat color="#ffd23f" metal={0.8} />
      </mesh>
      <mesh position={[0, 1.1, 2.98]}>
        <planeGeometry args={[1.4, 2.2]} />
        <meshStandardMaterial color="#ffcf7a" emissive="#ff9e3a" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
};

const Guirnalda: React.FC<{ desde: V3; hasta: V3; n?: number; caida?: number }> = ({ desde, hasta, n = 14, caida = 0.8 }) => {
  const colores = ["#ffd76a", "#ff6a8a", "#6ad2ff", "#a6ff6a"];
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        return (
          <Bombilla
            key={i}
            pos={[desde[0] + (hasta[0] - desde[0]) * t, desde[1] + (hasta[1] - desde[1]) * t - Math.sin(t * Math.PI) * caida, desde[2] + (hasta[2] - desde[2]) * t]}
            color={colores[i % 4]}
            r={0.09}
          />
        );
      })}
    </group>
  );
};

const Globo: React.FC<{ pos: V3; color: string; f: number; i: number }> = ({ pos, color, f, i }) => (
  <group position={[pos[0], pos[1] + Math.sin(f / 20 + i) * 0.12, pos[2]]} rotation={[0, 0, Math.sin(f / 25 + i) * 0.08]}>
    <mesh scale={[1, 1.15, 1]}>
      <sphereGeometry args={[0.38, 24, 18]} />
      <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} />
    </mesh>
    <mesh position={[0, -1.3, 0]}>
      <cylinderGeometry args={[0.006, 0.006, 2.2, 4]} />
      <Mat color="#ddd" />
    </mesh>
  </group>
);

const Feria: React.FC<PropsDeco> = ({ f }) => (
  <group>
    <Suelo tipo="asfalto" color="#211a26" />
    <Estrellas n={300} />
    <Noria pos={[-4, 0, -9]} f={f} />
    <Carpa pos={[4.5, 0, -5]} />
    <Guirnalda desde={[-6, 3.2, -1.5]} hasta={[0, 3.6, -2]} />
    <Guirnalda desde={[0, 3.6, -2]} hasta={[5, 3.2, -1.2]} />
    {["#ff4757", "#ffd23f", "#2bb673", "#3e8ef7", "#b85cff", "#ff7ac6"].map((c, i) => (
      <Globo key={c} pos={[-3.2 + i * 0.35, 2.6 + (i % 2) * 0.3, -1.2 - (i % 3) * 0.2]} color={c} f={f} i={i} />
    ))}
    <pointLight position={[0, 3.5, 0]} color="#ffb070" intensity={8} distance={12} />
    <pointLight position={[-4, 6, -6]} color="#c77dff" intensity={10} distance={18} />
  </group>
);

// ---------- 6. País de las golosinas ----------

const Piruleta: React.FC<{ pos: V3; colores: [string, string]; escala?: number; f: number }> = ({ pos, colores, escala = 1, f }) => {
  const t = tiras(colores[0], colores[1], 6, true);
  return (
    <group position={pos} scale={escala}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.3} clearcoat={1} />
      </mesh>
      <mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, f / 60]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.18, 40]} />
        <meshPhysicalMaterial map={t} roughness={0.15} clearcoat={1} />
      </mesh>
    </group>
  );
};

const Cupcake: React.FC<{ pos: V3; escala?: number }> = ({ pos, escala = 1 }) => (
  <group position={pos} scale={escala}>
    <mesh position={[0, 0.6, 0]} castShadow>
      <cylinderGeometry args={[1.2, 0.9, 1.2, 32]} />
      <meshStandardMaterial map={tiras("#f7a1c4", "#ffd0e3", 24)} roughness={0.6} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 1.35 + i * 0.4, 0]} castShadow>
        <sphereGeometry args={[1.25 - i * 0.35, 32, 20]} />
        <meshPhysicalMaterial color="#fff2f8" roughness={0.4} sheen={1} />
      </mesh>
    ))}
    <mesh position={[0, 2.55, 0]}>
      <sphereGeometry args={[0.25, 20, 16]} />
      <meshPhysicalMaterial color="#e3172b" roughness={0.1} clearcoat={1} />
    </mesh>
  </group>
);

const Caramelo: React.FC<{ pos: V3; color: string; f: number; i: number }> = ({ pos, color, f, i }) => (
  <group position={[pos[0], pos[1] + Math.sin(f / 18 + i) * 0.15, pos[2]]} rotation={[0, f / 40 + i, 0.4]}>
    <mesh scale={[1.3, 1, 1]}>
      <sphereGeometry args={[0.22, 20, 16]} />
      <meshPhysicalMaterial color={color} roughness={0.1} clearcoat={1} />
    </mesh>
    {[-1, 1].map((l) => (
      <mesh key={l} position={[0.38 * l, 0, 0]} rotation={[0, 0, (Math.PI / 2) * -l]}>
        <coneGeometry args={[0.16, 0.25, 12]} />
        <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={1} transparent opacity={0.85} />
      </mesh>
    ))}
  </group>
);

const Baston: React.FC<{ pos: V3; escala?: number }> = ({ pos, escala = 1 }) => {
  const t = tiras("#ffffff", "#e3172b", 10, true);
  return (
    <group position={pos} scale={escala}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 2.8, 16]} />
        <meshPhysicalMaterial map={t} roughness={0.2} clearcoat={1} />
      </mesh>
      <mesh position={[0.4, 2.8, 0]} castShadow>
        <torusGeometry args={[0.4, 0.14, 12, 24, Math.PI]} />
        <meshPhysicalMaterial map={t} roughness={0.2} clearcoat={1} />
      </mesh>
    </group>
  );
};

const RioChocolate: React.FC<{ f: number }> = ({ f }) => {
  const { relieve } = texturaSuelo("arena", "#808080", 8);
  relieve.offset.set(f * 0.002, 0);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0.2]} position={[0, 0.03, -6]}>
      <planeGeometry args={[60, 3.5]} />
      <meshPhysicalMaterial color="#5a2e16" roughness={0.15} clearcoat={1} normalMap={relieve} normalScale={new THREE.Vector2(0.4, 0.4)} />
    </mesh>
  );
};

const Golosinas: React.FC<PropsDeco> = ({ f }) => (
  <group>
    <Suelo tipo="liso" color="#ffd3ea" />
    <Hierba color="#ff9fd0" n={2500} radio={12} alto={0.22} />
    <RioChocolate f={f} />
    <Piruleta pos={[-2.8, 0, -1.5]} colores={["#ff3b6b", "#ffffff"]} escala={1.2} f={f} />
    <Piruleta pos={[-4.5, 0, -4]} colores={["#3bc46b", "#ffffff"]} escala={1.4} f={f} />
    <Cupcake pos={[3.2, 0, -3]} escala={1.1} />
    <Baston pos={[4.4, 0, 0.5]} escala={0.8} />
    {["#b85cff", "#ffd23f", "#3e8ef7", "#2bb673", "#ff7a3d"].map((c, i) => (
      <Caramelo key={c} pos={[-3 + i * 1.6, 2.4 + (i % 2) * 0.8, -2.5 - (i % 3)]} color={c} f={f} i={i} />
    ))}
    {[-1, 1].map((l) => (
      <mesh key={l} position={[1.5 * l, 0.3, 1.5]}>
        <sphereGeometry args={[0.3, 20, 16]} />
        <meshPhysicalMaterial color={l > 0 ? "#ffd23f" : "#b85cff"} roughness={0.1} clearcoat={1} />
      </mesh>
    ))}
    <Montanas z={-70} color="#f7b6d6" alto={14} semilla={12} />
  </group>
);

// ---------- 7. Lejano Oeste ----------

const Saloon: React.FC<{ pos: V3; giro?: number }> = ({ pos, giro = 0 }) => {
  const tablas = tiras("#8a5530", "#74452a", 32);
  return (
    <group position={pos} rotation={[0, giro, 0]}>
      <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
        <boxGeometry args={[5, 4.4, 4]} />
        <meshStandardMaterial map={tablas} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 5, 1.9]}>
        <boxGeometry args={[5.4, 1.6, 0.2]} />
        <meshStandardMaterial map={tablas} roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.2, 2.02]}>
        <planeGeometry args={[3, 0.6]} />
        <Mat color="#efe2c0" />
      </mesh>
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 2.8, 2.02]}>
          <planeGeometry args={[1, 1.2]} />
          <meshStandardMaterial color="#ffcf7a" emissive="#ffa040" emissiveIntensity={1.6} />
        </mesh>
      ))}
      <mesh position={[0, 1.1, 2.02]}>
        <planeGeometry args={[1.2, 1.8]} />
        <Mat color="#3b2414" />
      </mesh>
      {/* porche */}
      <mesh position={[0, 3.3, 2.7]} castShadow>
        <boxGeometry args={[5.4, 0.12, 1.6]} />
        <Mat color="#6b3f1f" />
      </mesh>
      {[-2.5, 2.5].map((x) => (
        <mesh key={x} position={[x, 1.65, 3.4]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3.3, 8]} />
          <Mat color="#5a3418" />
        </mesh>
      ))}
    </group>
  );
};

const Cactus: React.FC<{ pos: V3; escala?: number }> = ({ pos, escala = 1 }) => {
  const verde = "#3f8a3a";
  return (
    <group position={pos} scale={escala}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <capsuleGeometry args={[0.28, 1.9, 8, 14]} />
        <Mat color={verde} rugoso={0.7} />
      </mesh>
      {[-1, 1].map((l) => (
        <group key={l} position={[0.45 * l, 1.1 + (l > 0 ? 0.3 : 0), 0]}>
          <mesh rotation={[0, 0, (Math.PI / 2) * l]}>
            <capsuleGeometry args={[0.16, 0.3, 6, 10]} />
            <Mat color={verde} rugoso={0.7} />
          </mesh>
          <mesh position={[0.18 * l, 0.4, 0]} castShadow>
            <capsuleGeometry args={[0.16, 0.6, 6, 10]} />
            <Mat color={verde} rugoso={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Deposito: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    {[-1, 1].map((x) =>
      [-1, 1].map((z) => (
        <mesh key={`${x}${z}`} position={[x * 0.9, 2, z * 0.9]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 4, 6]} />
          <Mat color="#5a3418" />
        </mesh>
      )),
    )}
    <mesh position={[0, 5, 0]} castShadow>
      <cylinderGeometry args={[1.4, 1.4, 2.2, 24]} />
      <meshStandardMaterial map={tiras("#8a5530", "#6b3f1f", 40)} roughness={0.9} />
    </mesh>
    <mesh position={[0, 6.4, 0]} castShadow>
      <coneGeometry args={[1.6, 0.8, 24]} />
      <Mat color="#5a3418" />
    </mesh>
  </group>
);

const Meseta: React.FC<{ pos: V3; escala?: number }> = ({ pos, escala = 1 }) => (
  <mesh position={[pos[0], pos[1] + 6 * escala, pos[2]]} scale={escala} castShadow receiveShadow>
    <cylinderGeometry args={[6, 8, 12, 9]} />
    <meshStandardMaterial map={tiras("#c2673a", "#a8532c", 10)} roughness={1} flatShading />
  </mesh>
);

const Rodadora: React.FC<{ f: number }> = ({ f }) => {
  const x = -8 + ((f * 0.06) % 16);
  return (
    <mesh position={[x, 0.45, 1.5]} rotation={[0, 0, -x * 2]}>
      <icosahedronGeometry args={[0.45, 1]} />
      <meshStandardMaterial color="#9a7a45" wireframe />
    </mesh>
  );
};

const Oeste: React.FC<PropsDeco> = ({ f }) => (
  <group>
    <Suelo tipo="tierra" color="#c47a3f" />
    <Saloon pos={[-3.5, 0, -5]} giro={0.35} />
    <Deposito pos={[4, 0, -6]} />
    <Cactus pos={[2.6, 0, -1.5]} escala={0.9} />
    <Cactus pos={[-6, 0, -1]} escala={1.1} />
    <Meseta pos={[-20, 0, -60]} escala={1.6} />
    <Meseta pos={[18, 0, -70]} escala={2} />
    <Roca pos={[3.5, 0.1, 1.5]} escala={0.5} color="#7a4a2a" semilla={4} />
    <Rodadora f={f} />
    <Montanas z={-110} color="#b56a40" alto={18} semilla={14} />
  </group>
);

// ---------- 8. Estadio ----------

const Porteria: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    {[-3.6, 3.6].map((x) => (
      <mesh key={x} position={[x, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 2.4, 10]} />
        <Mat color="#ffffff" rugoso={0.3} />
      </mesh>
    ))}
    <mesh position={[0, 2.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.07, 0.07, 7.3, 10]} />
      <Mat color="#ffffff" rugoso={0.3} />
    </mesh>
    <mesh position={[0, 1.2, -1]} rotation={[0.4, 0, 0]}>
      <planeGeometry args={[7.2, 2.6, 36, 13]} />
      <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.5} />
    </mesh>
  </group>
);

const Publico: React.FC<{ f: number }> = ({ f }) => {
  const n = 1400;
  const malla = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.18, 0.3, 4, 6), new THREE.MeshStandardMaterial({ roughness: 0.8 }), n);
    const c = new THREE.Color();
    const cols = ["#d62828", "#1d4ed8", "#f5c518", "#ffffff", "#111111", "#d62828", "#1d4ed8"];
    for (let i = 0; i < n; i++) m.setColorAt(i, c.set(cols[Math.floor(azar(i) * cols.length)]));
    return m;
  }, []);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const fila = Math.floor(i / 70);
    const col = i % 70;
    const salta = Math.max(0, Math.sin(f / 4 + col * 0.3 + fila)) * 0.15;
    o.position.set(-24 + col * 0.7, 1 + fila * 0.75 + salta, -16 - fila * 0.8);
    o.updateMatrix();
    malla.setMatrixAt(i, o.matrix);
  }
  malla.instanceMatrix.needsUpdate = true;
  return (
    <group>
      {Array.from({ length: 20 }, (_, fila) => (
        <mesh key={fila} position={[0, 0.5 + fila * 0.75, -16 - fila * 0.8]}>
          <boxGeometry args={[52, 0.3, 0.8]} />
          <Mat color="#3a3f4a" />
        </mesh>
      ))}
      <primitive object={malla} />
    </group>
  );
};

const Foco: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <mesh position={[0, 9, 0]}>
      <cylinderGeometry args={[0.15, 0.25, 18, 8]} />
      <Mat color="#7a808c" metal={0.8} />
    </mesh>
    <mesh position={[0, 18.5, 0]} rotation={[0.4, 0, 0]}>
      <boxGeometry args={[3, 1.4, 0.3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} />
    </mesh>
  </group>
);

const Estadio: React.FC<PropsDeco> = ({ f }) => {
  const cesped = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const d = c.getContext("2d")!;
    for (let i = 0; i < 8; i++) {
      d.fillStyle = i % 2 ? "#3c9a3f" : "#47ad48";
      d.fillRect(0, i * 32, 256, 32);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 6);
    return t;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={cesped} roughness={0.9} />
      </mesh>
      <Hierba color="#3f9c3f" n={4000} radio={10} alto={0.12} />
      {/* líneas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]}>
        <ringGeometry args={[3.6, 3.75, 64]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2]}>
        <planeGeometry args={[40, 0.14]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Porteria pos={[6, 0, -9]} />
      <Publico f={f} />
      <Foco pos={[-14, 0, -12]} />
      <Foco pos={[14, 0, -12]} />
      <Estrellas n={200} />
      <Particulas f={f} n={260} color={["#ff3b3b", "#ffd23f", "#3e8ef7", "#2bb673", "#ffffff"]} tam={0.06} vel={0.03} planas area={[16, 10, 10]} />
    </group>
  );
};

// ---------- registro ----------

type Config = {
  nombre: string;
  personaje: string; // personaje típico del escenario
  cielo: [string, string];
  niebla?: string;
  sol?: { elevacion?: number; azimut?: number };
  luz?: number; // intensidad de la luz principal (noche < 1)
  colorLuz?: string;
  Deco: React.FC<PropsDeco>;
};

export const ESCENARIOS3D = {
  islaPirata: { nombre: "Isla pirata", personaje: "capitanaBrisa", cielo: ["#5aa9e6", "#fff0d6"], sol: { elevacion: 35 }, Deco: IslaPirata },
  poloNorte: { nombre: "Polo Norte", personaje: "tobias", cielo: ["#050d26", "#22336b"], niebla: "#1b2756", sol: { elevacion: 25, azimut: 220 }, luz: 0.45, colorLuz: "#b9c8ff", Deco: PoloNorte },
  marte: { nombre: "Marte", personaje: "zorp", cielo: ["#b5512a", "#f2a466"], niebla: "#d98450", sol: { elevacion: 30 }, colorLuz: "#ffd9b8", Deco: Marte },
  egipto: { nombre: "Antiguo Egipto", personaje: "ramses", cielo: ["#62b2ea", "#f7e6c0"], niebla: "#f1dcae", sol: { elevacion: 45 }, Deco: Egipto },
  feria: { nombre: "Feria nocturna", personaje: "lulu", cielo: ["#0d0418", "#3a1452"], niebla: "#24103a", sol: { elevacion: 20 }, luz: 0.3, colorLuz: "#d6b8ff", Deco: Feria },
  golosinas: { nombre: "País de las golosinas", personaje: "hadaMerengue", cielo: ["#ffc4e6", "#fff4fb"], niebla: "#ffe3f2", sol: { elevacion: 40 }, Deco: Golosinas },
  oeste: { nombre: "Lejano Oeste", personaje: "sheriffRosa", cielo: ["#e98a3e", "#ffd9a6"], niebla: "#f4b67c", sol: { elevacion: 14, azimut: 120 }, colorLuz: "#ffcf96", Deco: Oeste },
  estadio: { nombre: "Estadio", personaje: "dani", cielo: ["#060b1f", "#17234d"], niebla: "#101a3a", sol: { elevacion: 55 }, luz: 0.9, colorLuz: "#f2f6ff", Deco: Estadio },
} satisfies Record<string, Config>;

export type NombreEscenario = keyof typeof ESCENARIOS3D;

// Lienzo con un escenario completo; los hijos son los personajes y objetos de la escena.
export const Mundo: React.FC<{
  escenario: NombreEscenario;
  f: number;
  camara: V3;
  mira?: V3;
  fov?: number;
  desplazar?: number;
  children?: React.ReactNode;
}> = ({ escenario, f, camara, mira = [0, 1.4, 0], fov = 40, desplazar, children }) => {
  const e: Config = ESCENARIOS3D[escenario];
  const { Deco } = e;
  return (
    <Escenario3D camara={camara} mira={mira} fov={fov} cielo={e.cielo} niebla={e.niebla} sol={e.sol} luz={e.luz} colorLuz={e.colorLuz} desplazar={desplazar}>
      <Deco f={f} />
      {children}
    </Escenario3D>
  );
};

