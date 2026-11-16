// Mundo 3D · personajes. Rig con cadera, piernas, brazos y cabeza: andan, saludan, hablan y parpadean.
// Uso: <CapitanaBrisa f={f} accion="saludar" pos={[0, 0, 0]} />  (accion: reposo, saludar, andar, hablar,
// celebrar, senalar, pensar; o una `pose` a mano que se mezcla encima).
import React, { useMemo } from "react";
import * as THREE from "three";
import { Accion, azar, Mat, Persona, Pose, poseDe, Redondo, Tela, V3 } from "./Mundo3D";

export type PropsPersonaje = {
  f: number;
  pos?: V3;
  giro?: number;
  escala?: number;
  accion?: Accion;
  pose?: Pose;
  semilla?: number;
};

const mezcla = (accion: Accion, f: number, semilla: number, pose?: Pose): Pose => ({ ...poseDe(accion, f, semilla), ...pose });

// ---------- piezas pequeñas ----------

const Estrella: React.FC<{ r?: number; grosor?: number; color?: string; brillo?: boolean }> = ({ r = 0.1, grosor = 0.02, color = "#f5c542", brillo }) => {
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      if (i === 0) sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    const g = new THREE.ExtrudeGeometry(sh, { depth: grosor, bevelEnabled: true, bevelSize: grosor * 0.4, bevelThickness: grosor * 0.4, bevelSegments: 2 });
    g.center();
    return g;
  }, [r, grosor]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} emissive={brillo ? color : "#000"} emissiveIntensity={brillo ? 0.8 : 0} />
    </mesh>
  );
};

let texBalon: THREE.CanvasTexture | null = null;
const texturaBalon = () => {
  if (texBalon) return texBalon;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const d = c.getContext("2d")!;
  d.fillStyle = "#f7f7f2";
  d.fillRect(0, 0, 256, 128);
  d.fillStyle = "#141414";
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 8; x++) {
      const cx = x * 32 + (y % 2) * 16 + 8;
      const cy = y * 32 + 16;
      d.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        d.lineTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
      }
      d.fill();
    }
  texBalon = new THREE.CanvasTexture(c);
  texBalon.colorSpace = THREE.SRGBColorSpace;
  return texBalon;
};

export const Balon: React.FC<{ pos?: V3; giro?: number; r?: number }> = ({ pos = [0, 0, 0], giro = 0, r = 0.22 }) => (
  <mesh position={pos} rotation={[giro, giro * 0.7, 0]} castShadow>
    <sphereGeometry args={[r, 32, 24]} />
    <meshPhysicalMaterial map={texturaBalon()} roughness={0.35} clearcoat={0.6} />
  </mesh>
);

// ---------- Capitana Brisa · pirata ----------

const SombreroPirata: React.FC = () => (
  <group position={[0, 0.3, 0]} rotation={[-0.1, 0, 0]}>
    <mesh castShadow scale={[1, 1, 0.62]}>
      <cylinderGeometry args={[0.68, 0.7, 0.05, 32]} />
      <Mat color="#15151a" rugoso={0.7} />
    </mesh>
    {[-1, 1].map((l) => (
      <mesh key={l} castShadow position={[0.5 * l, 0.1, 0]} rotation={[0, 0, -0.55 * l]} scale={[1, 1, 0.62]}>
        <cylinderGeometry args={[0.2, 0.22, 0.04, 20, 1, false, 0, Math.PI]} />
        <Mat color="#15151a" rugoso={0.7} />
      </mesh>
    ))}
    <mesh castShadow position={[0, 0.17, 0]} scale={[1, 1, 0.85]}>
      <cylinderGeometry args={[0.33, 0.4, 0.32, 28]} />
      <Mat color="#15151a" rugoso={0.7} />
    </mesh>
    <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}>
      <torusGeometry args={[0.68, 0.018, 8, 40]} />
      <Mat color="#d6aa45" metal={0.9} rugoso={0.3} />
    </mesh>
  </group>
);

const Sable: React.FC = () => (
  <group rotation={[Math.PI / 2 - 0.2, 0, 0]}>
    <mesh position={[0, -0.05, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.16, 10]} />
      <Mat color="#3b2414" />
    </mesh>
    <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.07, 0.015, 6, 16, Math.PI]} />
      <Mat color="#d6aa45" metal={0.9} rugoso={0.3} />
    </mesh>
    <mesh position={[0, 0.45, 0]} castShadow>
      <Redondo args={[0.06, 0.75, 0.012]} />
      <meshStandardMaterial color="#e8edf2" metalness={1} roughness={0.12} />
    </mesh>
  </group>
);

export const CapitanaBrisa: React.FC<PropsPersonaje> = ({ f, pos, giro, escala, accion = "reposo", pose, semilla = 1 }) => (
  <Persona
    f={f}
    pos={pos}
    giro={giro}
    escala={escala}
    semilla={semilla}
    piel="#d9a27a"
    pelo="#5a3418"
    camisa="#c4202c"
    pantalon="#1c1c24"
    estilo={{ pelo: "largo", mangas: "#c4202c", botas: "#141414", zapatos: "#141414", cuello: "#efe7d8", ojos: "#3b2414" }}
    pose={mezcla(accion, f, semilla, pose)}
    enCabeza={<SombreroPirata />}
    enTorso={
      <group>
        {/* bandolera blanca cruzada */}
        <mesh position={[0, 1.38, 0.235]} rotation={[0, 0, 0.75]}>
          <Redondo args={[0.07, 0.78, 0.02]} />
          <Mat color="#f3efe6" rugoso={0.7} />
        </mesh>
        {[1.52, 1.36, 1.2].map((y) => (
          <mesh key={y} position={[-0.12, y, 0.235]}>
            <sphereGeometry args={[0.025, 10, 10]} />
            <Mat color="#d6aa45" metal={0.9} rugoso={0.3} />
          </mesh>
        ))}
      </group>
    }
    enManoDer={<Sable />}
  />
);

// ---------- Tobías · pingüino ----------

export const Tobias: React.FC<PropsPersonaje> = ({ f, pos = [0, 0, 0], giro = 0, escala = 1, accion = "reposo", semilla = 2 }) => {
  const saluda = accion === "saludar" || accion === "celebrar";
  const anda = accion === "andar";
  const bamboleo = anda ? Math.sin(f / 4) * 0.12 : Math.sin(f / 14) * 0.03;
  const salto = accion === "celebrar" ? Math.abs(Math.sin(f / 5)) * 0.3 : 0;
  const ciclo = (f + semilla * 37) % 95;
  const parpado = ciclo < 4 ? 1 - Math.abs(ciclo - 2) / 2 : 0;
  const negro = "#1b1e29";
  return (
    <group position={[pos[0], pos[1] + salto, pos[2]]} rotation={[0, giro, bamboleo]} scale={escala}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012 - salto, 0]}>
        <circleGeometry args={[0.6, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {/* cuerpo */}
      <mesh position={[0, 0.85, 0]} scale={[1, 1.25, 0.92]} castShadow>
        <sphereGeometry args={[0.62, 40, 32]} />
        <meshPhysicalMaterial color={negro} roughness={0.45} sheen={0.6} sheenColor="#4a5a80" />
      </mesh>
      <mesh position={[0, 0.72, 0.2]} scale={[0.82, 1.08, 0.75]}>
        <sphereGeometry args={[0.6, 36, 28]} />
        <meshPhysicalMaterial color="#f4f2ec" roughness={0.6} sheen={0.5} />
      </mesh>
      {/* cara */}
      {[-1, 1].map((l) => (
        <group key={l} position={[0.17 * l, 1.32, 0.48]}>
          <mesh scale={[1, 1.1, 0.5]}>
            <sphereGeometry args={[0.12, 20, 16]} />
            <meshPhysicalMaterial color="#fbfbf7" roughness={0.15} clearcoat={1} />
          </mesh>
          <mesh position={[0, -0.01, 0.05]} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[0.065, 16, 12]} />
            <Mat color="#0b0706" rugoso={0.1} />
          </mesh>
          <mesh position={[0.025, 0.025, 0.08]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh position={[0, 0, 0.005]} scale={[1.08, 1.2 * Math.max(0.02, parpado), 0.6]}>
            <sphereGeometry args={[0.12, 16, 12]} />
            <Mat color={negro} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.18, 0.6]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1, 0.7]} castShadow>
        <coneGeometry args={[0.1, 0.26, 16]} />
        <meshPhysicalMaterial color="#f29a1d" roughness={0.3} clearcoat={0.8} />
      </mesh>
      {/* aletas */}
      {[-1, 1].map((l) => (
        <group key={l} position={[0.58 * l, 1.05, 0]} rotation={[0, 0, (0.25 + (saluda && l > 0 ? 0.9 + Math.sin(f / 3) * 0.35 : anda ? Math.sin(f / 4 + l) * 0.2 : 0)) * l]}>
          <mesh position={[0, -0.32, 0]} scale={[0.35, 1, 0.8]} castShadow>
            <capsuleGeometry args={[0.13, 0.42, 6, 12]} />
            <Mat color={negro} rugoso={0.45} />
          </mesh>
        </group>
      ))}
      {/* patas */}
      {[-1, 1].map((l) => (
        <mesh key={l} position={[0.2 * l, 0.05, 0.2 + (anda ? Math.sin(f / 4 + (l > 0 ? 0 : Math.PI)) * 0.1 : 0)]} scale={[1, 0.35, 1.5]} castShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshPhysicalMaterial color="#f29a1d" roughness={0.35} clearcoat={0.5} />
        </mesh>
      ))}
      {/* bufanda roja */}
      <mesh position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.92, 1]}>
        <torusGeometry args={[0.5, 0.09, 12, 32]} />
        <Tela color="#d42a2a" />
      </mesh>
      <mesh position={[0.22, 0.75, 0.42]} rotation={[0.25, 0, 0.15]}>
        <Redondo args={[0.17, 0.42, 0.06]} />
        <Tela color="#d42a2a" />
      </mesh>
      {/* gorro de lana */}
      <group position={[0, 1.55, -0.02]}>
        <mesh castShadow scale={[1, 0.9, 0.95]}>
          <sphereGeometry args={[0.45, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Tela color="#2a63c9" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.95, 1]}>
          <torusGeometry args={[0.44, 0.07, 12, 32]} />
          <Tela color="#f4f4f4" />
        </mesh>
        <mesh position={[0, 0.44, 0]}>
          <sphereGeometry args={[0.13, 16, 12]} />
          <Tela color="#f4f4f4" />
        </mesh>
      </group>
    </group>
  );
};

// ---------- Zorp · alienígena ----------

export const Zorp: React.FC<PropsPersonaje> = ({ f, pos, giro, escala, accion = "reposo", pose, semilla = 3 }) => {
  const ciclo = (f + 50) % 110;
  const parpado = ciclo < 4 ? 1 - Math.abs(ciclo - 2) / 2 : 0;
  return (
    <Persona
      f={f}
      pos={pos}
      giro={giro}
      escala={escala}
      semilla={semilla}
      piel="#7cc447"
      pelo="#3f6b22"
      camisa="#aeb3bb"
      pantalon="#a3a8b0"
      estilo={{ pelo: "calvo", orejas: false, mejillas: false, cabezaEscala: 1.3, guantes: "#7cc447", zapatos: "#8b9099", cuello: null, ojos: "#0d0d0d" }}
      pose={mezcla(accion, f, semilla, pose)}
      enCabeza={
        <group>
          {/* tercer ojo */}
          <group position={[0, 0.3, 0.27]} rotation={[-0.75, 0, 0]}>
            <mesh scale={[1, 1, 0.55]}>
              <sphereGeometry args={[0.11, 20, 16]} />
              <meshPhysicalMaterial color="#fbfbf7" roughness={0.15} clearcoat={1} />
            </mesh>
            <mesh position={[0, 0, 0.05]} scale={[1, 1, 0.5]}>
              <sphereGeometry args={[0.06, 16, 12]} />
              <Mat color="#0b0706" rugoso={0.1} />
            </mesh>
            <mesh position={[0, 0, 0.005]} scale={[1.08, 1.18 * Math.max(0.02, parpado), 0.6]}>
              <sphereGeometry args={[0.11, 16, 12]} />
              <Mat color="#7cc447" />
            </mesh>
          </group>
          {/* antenas */}
          {[-1, 1].map((l) => (
            <group key={l} position={[0.16 * l, 0.36, -0.05]} rotation={[-0.2, 0, -0.35 * l + Math.sin(f / 8 + l) * 0.06]}>
              <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[0.012, 0.016, 0.32, 8]} />
                <Mat color="#5d9c33" />
              </mesh>
              <mesh position={[0, 0.34, 0]}>
                <sphereGeometry args={[0.05, 14, 12]} />
                <meshStandardMaterial color="#ff7ad9" emissive="#ff4fcf" emissiveIntensity={1.2} />
              </mesh>
            </group>
          ))}
        </group>
      }
      enTorso={
        <group>
          <mesh position={[0, 1.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.17, 0.035, 10, 28]} />
            <meshStandardMaterial color="#9ff3ff" emissive="#4fe3ff" emissiveIntensity={1.4} />
          </mesh>
          <mesh position={[0, 1.42, 0.235]}>
            <sphereGeometry args={[0.075, 18, 14]} />
            <meshStandardMaterial color="#c9fbff" emissive="#61e8ff" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0, 1.42, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.018, 8, 24]} />
            <meshStandardMaterial color="#d9dde3" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      }
    />
  );
};

// ---------- Ramsés · momia ----------

export const Ramses: React.FC<PropsPersonaje> = ({ f, pos, giro, escala, accion = "reposo", pose, semilla = 4 }) => (
  <Persona
    f={f}
    pos={pos}
    giro={giro}
    escala={escala}
    semilla={semilla}
    piel="#e3d6b8"
    pelo="#5a4a30"
    camisa="#e3d6b8"
    pantalon="#e3d6b8"
    estilo={{ vendas: true, cinturon: false, orejas: false, ojos: "#1a1208", cuello: null }}
    pose={mezcla(accion, f, semilla, pose)}
    enCabeza={
      <group>
        {/* rendija oscura de los ojos */}
        <mesh position={[0, 0.06, 0.3]} scale={[1, 0.42, 0.4]}>
          <sphereGeometry args={[0.3, 24, 16]} />
          <Mat color="#2a2015" rugoso={0.9} />
        </mesh>
        {/* moño de vendas */}
        <mesh position={[0.05, 0.44, -0.05]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.06, 0.12, 6, 10]} />
          <Mat color="#d8c9a6" rugoso={0.95} />
        </mesh>
      </group>
    }
    enTorso={
      <group>
        {/* collar egipcio: oro y lapislázuli */}
        {[
          [0.2, "#d6aa45"],
          [0.25, "#2457b8"],
          [0.3, "#d6aa45"],
        ].map(([r, c], i) => (
          <mesh key={i} position={[0, 1.72 - i * 0.03, 0.02]} rotation={[Math.PI / 2 + 0.25, 0, 0]} scale={[1, 0.85, 1]}>
            <torusGeometry args={[r as number, 0.03, 8, 32]} />
            <meshStandardMaterial color={c as string} metalness={i === 1 ? 0.2 : 0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>
    }
  />
);

// ---------- Lulú · malabarista ----------

const GorroFiesta: React.FC = () => (
  <group position={[0.08, 0.42, 0]} rotation={[0, 0, -0.2]}>
    <mesh castShadow position={[0, 0.25, 0]}>
      <coneGeometry args={[0.2, 0.55, 24]} />
      <meshPhysicalMaterial color="#2bb673" roughness={0.4} clearcoat={0.6} />
    </mesh>
    <mesh position={[0, 0.55, 0]}>
      <sphereGeometry args={[0.07, 14, 12]} />
      <Tela color="#ffd23f" />
    </mesh>
  </group>
);

export const Lulu: React.FC<PropsPersonaje & { malabares?: boolean }> = ({ f, pos, giro, escala, accion = "reposo", pose, semilla = 5, malabares = true }) => {
  const colores = ["#ff4757", "#ffd23f", "#2bb673", "#3e8ef7"];
  return (
    <group>
      <Persona
        f={f}
        pos={pos}
        giro={giro}
        escala={escala}
        semilla={semilla}
        piel="#f7efe7"
        pelo="#ff6a1a"
        camisa="#6b2fc4"
        pantalon="#f2c318"
        estilo={{ pelo: "rizado", nariz: "#e3172b", mangas: "#6b2fc4", guantes: "#ffffff", zapatos: "#d4212b", cinturon: false, cuello: null, ojos: "#2a5ab8" }}
        pose={mezcla(accion, f, semilla, malabares && accion === "reposo" ? { adelanteDer: 1, adelanteIzq: 1, codoDer: 0.9, codoIzq: 0.9, brazoDer: 0.3, brazoIzq: 0.3, ...pose } : pose)}
        enCabeza={<GorroFiesta />}
        enTorso={
          <group>
            {/* gola blanca de payaso */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.22, 1.72, Math.sin(a) * 0.19]}>
                  <sphereGeometry args={[0.085, 12, 10]} />
                  <Tela color="#ffffff" />
                </mesh>
              );
            })}
            {[1.55, 1.38, 1.21].map((y) => (
              <mesh key={y} position={[0, y, 0.235]}>
                <sphereGeometry args={[0.045, 14, 12]} />
                <meshPhysicalMaterial color="#ffd23f" roughness={0.25} clearcoat={1} />
              </mesh>
            ))}
          </group>
        }
      />
      {malabares &&
        colores.map((c, i) => {
          const t = f / 9 + (i / colores.length) * Math.PI * 2;
          const p = pos ?? [0, 0, 0];
          const e = escala ?? 1;
          return (
            <mesh key={c} position={[p[0] + Math.cos(t) * 0.35 * e, p[1] + (2.6 + Math.abs(Math.sin(t)) * 0.7) * e, p[2] + 0.55 * e]}>
              <sphereGeometry args={[0.08 * e, 16, 12]} />
              <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} />
            </mesh>
          );
        })}
    </group>
  );
};

// ---------- Hada Merengue · hada de las golosinas ----------

const Varita: React.FC<{ f: number }> = ({ f }) => (
  <group rotation={[Math.PI / 2 - 0.3, 0, 0]}>
    <mesh position={[0, 0.2, 0]}>
      <cylinderGeometry args={[0.014, 0.014, 0.45, 8]} />
      <meshPhysicalMaterial color="#ffffff" roughness={0.2} clearcoat={1} />
    </mesh>
    <group position={[0, 0.46, 0]} rotation={[0, f / 10, 0]}>
      <Estrella r={0.09} grosor={0.02} color="#ffd84a" brillo />
    </group>
  </group>
);

export const HadaMerengue: React.FC<PropsPersonaje> = ({ f, pos, giro, escala, accion = "reposo", pose, semilla = 6 }) => {
  const aleteo = Math.sin(f / 2.2) * 0.35;
  const virutas = ["#ff5a8a", "#59c3ff", "#ffd23f", "#7be07b", "#b07bff"];
  return (
    <Persona
      f={f}
      pos={pos}
      giro={giro}
      escala={escala}
      semilla={semilla}
      piel="#f6cbb5"
      pelo="#c4ecff"
      camisa="#ff8cc6"
      pantalon="#ff9fd0"
      estilo={{ falda: "#ffc2e2", botas: "#e2408f", zapatos: "#e2408f", cinturon: false, cuello: "#ffd6ec", ojos: "#5a3a8a" }}
      pose={mezcla(accion, f, semilla, pose)}
      enCabeza={
        <group>
          <mesh position={[0, 0.42, -0.08]} castShadow>
            <sphereGeometry args={[0.2, 20, 16]} />
            <Mat color="#c4ecff" rugoso={0.7} />
          </mesh>
          {Array.from({ length: 16 }, (_, i) => {
            const a = azar(i * 3.1) * Math.PI * 2;
            const b = azar(i * 5.7) * 1.1;
            return (
              <mesh key={i} position={[Math.cos(a) * Math.sin(b) * 0.44, 0.12 + Math.cos(b) * 0.36, Math.sin(a) * Math.sin(b) * 0.42 - 0.05]} rotation={[a, b, 0]}>
                <capsuleGeometry args={[0.015, 0.05, 4, 6]} />
                <meshPhysicalMaterial color={virutas[i % virutas.length]} roughness={0.3} clearcoat={1} />
              </mesh>
            );
          })}
        </group>
      }
      enTorso={
        <group position={[0, 1.45, -0.2]}>
          {[-1, 1].map((l) =>
            [0, 1].map((k) => (
              <mesh key={`${l}${k}`} position={[0.3 * l, k ? -0.2 : 0.12, -0.02]} rotation={[0, l * (0.5 + aleteo), l * (k ? -0.6 : 0.5)]} scale={[k ? 0.32 : 0.45, k ? 0.22 : 0.3, 1]}>
                <circleGeometry args={[1, 28]} />
                <meshPhysicalMaterial color="#e6d6ff" roughness={0.1} transparent opacity={0.45} side={THREE.DoubleSide} iridescence={1} depthWrite={false} />
              </mesh>
            )),
          )}
        </group>
      }
      enManoDer={<Varita f={f} />}
    />
  );
};

// ---------- Sheriff Rosa · vaquera ----------

export const SheriffRosa: React.FC<PropsPersonaje> = ({ f, pos, giro, escala, accion = "reposo", pose, semilla = 7 }) => (
  <Persona
    f={f}
    pos={pos}
    giro={giro}
    escala={escala}
    semilla={semilla}
    piel="#f0c09b"
    pelo="#e6c35c"
    camisa="#d8a32c"
    pantalon="#2f4f8a"
    estilo={{ pelo: "largo", sombrero: "vaquero", colorSombrero: "#8a5428", mangas: "#d8a32c", botas: "#6b3f1f", zapatos: "#5a3418", cuello: null, ojos: "#3b5a8a" }}
    pose={mezcla(accion, f, semilla, pose)}
    enTorso={
      <group>
        {/* pañuelo rojo */}
        <mesh position={[0, 1.66, 0.2]} rotation={[0.35, 0, Math.PI]} scale={[1, 1, 0.35]}>
          <coneGeometry args={[0.2, 0.3, 3]} />
          <Tela color="#c8202a" />
        </mesh>
        <mesh position={[0, 1.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.04, 8, 24]} />
          <Tela color="#c8202a" />
        </mesh>
        {/* estrella de sheriff */}
        <group position={[-0.14, 1.5, 0.24]}>
          <Estrella r={0.075} grosor={0.015} />
        </group>
      </group>
    }
  />
);

// ---------- Dani · futbolista ----------

export const Dani: React.FC<PropsPersonaje & { balon?: boolean }> = ({ f, pos = [0, 0, 0], giro = 0, escala = 1, accion = "reposo", pose, semilla = 8, balon = true }) => {
  const toque = balon && accion === "reposo" ? Math.abs(Math.sin(f / 6)) : 0;
  return (
    <group>
      <Persona
        f={f}
        pos={pos}
        giro={giro}
        escala={escala}
        semilla={semilla}
        piel="#6b3e26"
        pelo="#141010"
        camisa="#f5f5f5"
        pantalon="#1b2547"
        estilo={{ rayas: "#1a1a1a", piernaBaja: "#1b2547", zapatos: "#e0332b", cinturon: false, cuello: "#1a1a1a", ojos: "#2a1a10", mejillas: false }}
        pose={mezcla(accion, f, semilla, pose)}
        enCabeza={
          <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
            <torusGeometry args={[0.41, 0.035, 10, 36]} />
            <Tela color="#e0332b" />
          </mesh>
        }
      />
      {balon && (
        <group position={pos} rotation={[0, giro, 0]} scale={escala}>
          <Balon pos={[0.3, 0.22 + toque * 0.5, 0.45]} giro={f / 5} />
        </group>
      )}
    </group>
  );
};

export const PERSONAJES = {
  capitanaBrisa: { nombre: "Capitana Brisa", tipo: "pirata", C: CapitanaBrisa, fondo: "#3f6fc9" },
  tobias: { nombre: "Tobías", tipo: "pingüino", C: Tobias, fondo: "#5aa2d8" },
  zorp: { nombre: "Zorp", tipo: "alienígena", C: Zorp, fondo: "#6a3aa0" },
  ramses: { nombre: "Ramsés", tipo: "momia", C: Ramses, fondo: "#c9993e" },
  lulu: { nombre: "Lulú", tipo: "malabarista", C: Lulu, fondo: "#9c2f6e" },
  hadaMerengue: { nombre: "Hada Merengue", tipo: "hada de las golosinas", C: HadaMerengue, fondo: "#e07ab8" },
  sheriffRosa: { nombre: "Sheriff Rosa", tipo: "vaquera", C: SheriffRosa, fondo: "#c8683a" },
  dani: { nombre: "Dani", tipo: "futbolista", C: Dani, fondo: "#2f9a4a" },
} as const;

export type NombrePersonaje = keyof typeof PERSONAJES;
