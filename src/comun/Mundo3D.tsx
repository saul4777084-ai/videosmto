// Biblioteca 3D realista (three.js + @remotion/three): personajes con rig sencillo y escenarios con
// cielo atmosférico, reflejos de entorno (PMREM), sombras suaves, texturas procedurales con relieve,
// hierba instanciada y posproceso (bloom, profundidad de campo, viñeta, tone mapping ACES).
// Todo se anima con el frame que se pasa por props (nada de useFrame), así el render es determinista.
import React, { useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const W = 1080;
export const H = 1920;

export type V3 = [number, number, number];

// resolución interna de la capa 3D (se escala a 1080×1920; los textos HTML van aparte, siempre nítidos)
export const CALIDAD = 0.67;

// ---------- lienzo: cámara, cielo, entorno, luces y posproceso ----------

// desplazar: baja la imagen una fracción de la altura (deja cielo arriba para subtítulos y rótulos)
const Camara: React.FC<{ pos: V3; mira: V3; fov: number; desplazar: number }> = ({ pos, mira, fov, desplazar }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.position.set(...pos);
    c.fov = fov;
    c.near = 0.1;
    c.far = 3000;
    c.setViewOffset(W, H, 0, -desplazar * H, W, H);
    c.updateProjectionMatrix();
    camera.lookAt(...mira);
  });
  return null;
};

const direccionSol = (elevacion: number, azimut: number) =>
  new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevacion), THREE.MathUtils.degToRad(azimut));

// cielo degradado (para escenas de color: morado, rosa, verde…)
const crearDegradado = (arriba: string, abajo: string) => {
  const geo = new THREE.SphereGeometry(1500, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { a: { value: new THREE.Color(arriba) }, b: { value: new THREE.Color(abajo) } },
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform vec3 a; uniform vec3 b; varying vec3 p; void main(){ float t = smoothstep(-0.1, 0.6, p.y); gl_FragColor = vec4(mix(b, a, t), 1.0);\n#include <colorspace_fragment>\n}",
  });
  return new THREE.Mesh(geo, mat);
};

const Entorno: React.FC<{ cielo: [string, string]; brillo: number }> = ({ cielo, brillo }) => {
  const { gl, scene } = useThree();
  const fondo = useMemo(() => crearDegradado(cielo[0], cielo[1]), [cielo]);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.NoToneMapping; // lo aplica el posproceso
    gl.outputColorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = brillo;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, brillo]);
  return <primitive object={fondo} />;
};

export const Escenario3D: React.FC<{
  camara: V3;
  mira?: V3;
  fov?: number;
  cielo?: [string, string]; // si se da, cielo degradado; si no, cielo atmosférico realista
  niebla?: string;
  sol?: { elevacion?: number; azimut?: number; turbidez?: number };
  luzSol?: V3; // compatibilidad: dirección de la luz principal
  desplazar?: number;
  enfoque?: number; // distancia (unidades) a la que enfoca la profundidad de campo
  desenfoque?: number;
  children: React.ReactNode;
}> = ({ camara, mira = [0, 1, 0], fov = 40, desplazar = 0.12, cielo, niebla, sol = {}, luzSol, enfoque, desenfoque = 0, children }) => {
  const { elevacion = 32, azimut = 150 } = sol;
  const dirLuz = luzSol ? new THREE.Vector3(...luzSol).normalize() : direccionSol(elevacion, azimut);
  const posLuz = dirLuz.clone().multiplyScalar(30).add(new THREE.Vector3(mira[0], 0, mira[2]));
  const calida = elevacion < 15 && !cielo;
  const dist = enfoque ?? Math.hypot(camara[0] - mira[0], camara[1] - mira[1], camara[2] - mira[2]);
  const cieloFinal: [string, string] = cielo ?? (calida ? ["#ff7a3d", "#ffd59a"] : ["#1f6fe0", "#a8d8ff"]);
  const colorNiebla = niebla ?? cieloFinal[1];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W * CALIDAD, height: H * CALIDAD, transform: `scale(${1 / CALIDAD})`, transformOrigin: "0 0" }}>
      <ThreeCanvas
        width={Math.round(W * CALIDAD)}
        height={Math.round(H * CALIDAD)}
        shadows="soft"
        dpr={1}
        gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        camera={{ fov, position: camara, near: 0.1, far: 3000 }}
      >
        <Camara pos={camara} mira={mira} fov={fov} desplazar={desplazar} />
        <Entorno cielo={cieloFinal} brillo={0.7} />
        <fog attach="fog" args={[colorNiebla, 30, 170]} />
        <hemisphereLight args={[cielo ? cielo[0] : "#cfe6ff", "#6b5a45", cielo ? 0.6 : 0.45]} />
        <directionalLight
          position={[posLuz.x, posLuz.y, posLuz.z]}
          target-position={[mira[0], 0, mira[2]]}
          color={calida ? "#ffd2a1" : "#fff6ea"}
          intensity={calida ? 2.6 : 3.2}
          castShadow
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-mapSize-width={1536}
          shadow-mapSize-height={1536}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-camera-far={80}
        />
        {children}
        <EffectComposer multisampling={0}>
          <SMAA />
          {desenfoque > 0 ? (
            <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={desenfoque} worldFocusDistance={dist} worldFocusRange={dist * 0.6} resolutionScale={0.5} />
          ) : (
            <></>
          )}
          <Bloom intensity={0.4} luminanceThreshold={0.9} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette offset={0.32} darkness={0.55} />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      </ThreeCanvas>
      </div>
    </div>
  );
};

// ---------- texturas procedurales (ruido determinista → color + relieve) ----------

const cacheTex = new Map<string, { mapa: THREE.CanvasTexture; relieve: THREE.CanvasTexture }>();

const ruido2 = (tam: number, semilla: number) => {
  // value noise con varias octavas, repetible (tileable)
  const out = new Float32Array(tam * tam);
  const rejilla = (n: number, s: number) => {
    const g = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) g[i] = azar(i * 1.37 + s * 91.1);
    return g;
  };
  let amp = 1;
  let suma = 0;
  for (let o = 0; o < 6; o++) {
    const n = 4 << o;
    const g = rejilla(n, semilla + o);
    for (let y = 0; y < tam; y++)
      for (let x = 0; x < tam; x++) {
        const fx = (x / tam) * n;
        const fy = (y / tam) * n;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fx - x0;
        const ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const v = (a: number, b: number) => g[((b % n) * n + (a % n)) % (n * n)];
        const top = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * sx;
        const bot = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * sx;
        out[y * tam + x] += (top + (bot - top) * sy) * amp;
      }
    suma += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= suma;
  return out;
};

export type TipoSuelo = "cesped" | "arena" | "asfalto" | "tierra" | "nieve" | "liso";

export const texturaSuelo = (tipo: TipoSuelo, color: string, repetir: number) => {
  const clave = `${tipo}|${color}|${repetir}`;
  const hay = cacheTex.get(clave);
  if (hay) return hay;
  const tam = 256;
  const h = ruido2(tam, tipo.length * 7 + color.length);
  const base = new THREE.Color(color);
  const c1 = document.createElement("canvas");
  const c2 = document.createElement("canvas");
  c1.width = c1.height = c2.width = c2.height = tam;
  const d1 = c1.getContext("2d")!;
  const d2 = c2.getContext("2d")!;
  const img = d1.createImageData(tam, tam);
  const nrm = d2.createImageData(tam, tam);
  const alt = (x: number, y: number) => {
    const xx = (x + tam) % tam;
    const yy = (y + tam) % tam;
    let v = h[yy * tam + xx];
    if (tipo === "arena") v = v * 0.4 + 0.6 * (0.5 + 0.5 * Math.sin((yy / tam) * Math.PI * 2 * 18 + v * 9)); // ondas de arena
    if (tipo === "asfalto") v = v * 0.5 + azar(xx * 3.1 + yy * 7.7) * 0.5; // grano
    return v;
  };
  for (let y = 0; y < tam; y++)
    for (let x = 0; x < tam; x++) {
      const i = (y * tam + x) * 4;
      const v = alt(x, y);
      const grano = azar(x * 12.9 + y * 78.2);
      let k = 0.78 + v * 0.38 + (grano - 0.5) * (tipo === "cesped" ? 0.22 : 0.08);
      if (tipo === "liso") k = 0.92 + v * 0.14;
      const col = base.clone().multiplyScalar(k);
      if (tipo === "cesped") col.offsetHSL((v - 0.5) * 0.04, 0, (grano - 0.5) * 0.05);
      img.data[i] = Math.min(255, col.r * 255);
      img.data[i + 1] = Math.min(255, col.g * 255);
      img.data[i + 2] = Math.min(255, col.b * 255);
      img.data[i + 3] = 255;
      const fuerza = tipo === "liso" ? 1.5 : tipo === "arena" ? 5 : 3.5;
      const dx = (alt(x + 1, y) - alt(x - 1, y)) * fuerza;
      const dy = (alt(x, y + 1) - alt(x, y - 1)) * fuerza;
      const n = new THREE.Vector3(-dx, -dy, 1).normalize();
      nrm.data[i] = (n.x * 0.5 + 0.5) * 255;
      nrm.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      nrm.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      nrm.data[i + 3] = 255;
    }
  d1.putImageData(img, 0, 0);
  d2.putImageData(nrm, 0, 0);
  const mapa = new THREE.CanvasTexture(c1);
  const relieve = new THREE.CanvasTexture(c2);
  mapa.colorSpace = THREE.SRGBColorSpace;
  for (const t of [mapa, relieve]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repetir, repetir);
    t.anisotropy = 8;
  }
  const r = { mapa, relieve };
  cacheTex.set(clave, r);
  return r;
};

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

const Mat: React.FC<{ color: string; rugoso?: number; metal?: number; emisivo?: string; laca?: number }> = ({ color, rugoso = 0.6, metal = 0, emisivo, laca = 0 }) =>
  laca > 0 ? (
    <meshPhysicalMaterial color={color} roughness={rugoso} metalness={metal} clearcoat={laca} clearcoatRoughness={0.08} emissive={emisivo ?? "#000"} emissiveIntensity={emisivo ? 0.6 : 0} />
  ) : (
    <meshStandardMaterial color={color} roughness={rugoso} metalness={metal} emissive={emisivo ?? "#000"} emissiveIntensity={emisivo ? 0.6 : 0} />
  );

// tela: color con un poco de relieve
const Tela: React.FC<{ color: string; rugoso?: number }> = ({ color, rugoso = 0.85 }) => {
  const { relieve } = texturaSuelo("liso", "#808080", 3);
  return <meshStandardMaterial color={color} roughness={rugoso} normalMap={relieve} normalScale={new THREE.Vector2(0.6, 0.6)} />;
};


// caja con bordes redondeados (el detalle que más "realismo" da a objetos simples)
const cacheCajas = new Map<string, THREE.BufferGeometry>();
const Redondo: React.FC<{ args: [number, number, number] }> = ({ args }) => {
  const [w, h, d] = args;
  const r = Math.min(w, h, d) * 0.18;
  const k = `${w}|${h}|${d}`;
  let g = cacheCajas.get(k);
  if (!g) {
    g = r < 0.004 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 3, r);
    cacheCajas.set(k, g);
  }
  return <primitive object={g} attach="geometry" />;
};

// ---------- suelos ----------

export const Suelo: React.FC<{ color?: string; tam?: number; tipo?: TipoSuelo; hierba?: boolean; sinHierbaZ?: [number, number] }> = ({ color, tam = 160, tipo, hierba, sinHierbaZ }) => {
  const t: TipoSuelo = tipo ?? (color ? "liso" : "cesped");
  const c = color ?? (t === "arena" ? "#e6cf9c" : t === "asfalto" ? "#3d4046" : t === "tierra" ? "#a5502c" : t === "nieve" ? "#eef4ff" : "#5f9e43");
  const { mapa, relieve } = texturaSuelo(t, c, tam / 6);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[tam, tam]} />
        <meshStandardMaterial map={mapa} normalMap={relieve} roughness={t === "nieve" ? 0.6 : 0.95} />
      </mesh>
      {(hierba ?? t === "cesped") && <Hierba color={c} sinZ={sinHierbaZ} />}
    </group>
  );
};

// hierba instanciada (briznas) alrededor del centro
export const Hierba: React.FC<{ color?: string; n?: number; radio?: number; centro?: V3; alto?: number; sinZ?: [number, number] }> = ({ color = "#5f9e43", n = 6000, radio = 16, centro = [0, 0, 0], alto = 0.16, sinZ }) => {
  const malla = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.012, 1, 3, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(1.15), roughness: 0.9 });
    const m = new THREE.InstancedMesh(geo, mat, n);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(azar(i * 3.3)) * radio;
      const a = azar(i * 7.1) * Math.PI * 2;
      let z = Math.sin(a) * r * 0.8;
      if (sinZ && z > sinZ[0] && z < sinZ[1]) z = azar(i * 1.9) < 0.5 ? sinZ[0] - azar(i) * 2 : sinZ[1] + azar(i) * 4;
      o.position.set(Math.cos(a) * r, 0, z);
      o.rotation.set((azar(i) - 0.5) * 0.5, azar(i * 2.2) * 6.28, (azar(i * 5) - 0.5) * 0.5);
      o.scale.set(1, alto * (0.5 + azar(i * 9.9)), 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(color).offsetHSL((azar(i * 4) - 0.5) * 0.05, 0, (azar(i * 6) - 0.5) * 0.12));
    }
    m.receiveShadow = true;
    return m;
  }, [color, n, radio, alto, sinZ]);
  return <primitive object={malla} position={centro} />;
};

export const Calle: React.FC<{ z?: number }> = ({ z = 0 }) => {
  const { mapa, relieve } = texturaSuelo("asfalto", "#3a3d43", 20);
  return (
    <group position={[0, 0.015, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 5]} />
        <meshStandardMaterial map={mapa} normalMap={relieve} roughness={0.85} />
      </mesh>
      {[-2.6, 2.6].map((zz) => (
        <mesh key={zz} position={[0, 0.07, zz]} receiveShadow castShadow>
          <Redondo args={[160, 0.15, 0.3]} />
          <Mat color="#b9b5ad" rugoso={0.9} />
        </mesh>
      ))}
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-80 + i * 4, 0.01, 0]}>
          <planeGeometry args={[1.8, 0.16]} />
          <Mat color="#f2efe3" rugoso={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// ---------- personaje ----------

export type Pose = {
  brazoIzq?: number; // ángulo (rad) del brazo hacia arriba por el lado (0 = colgando, π = arriba)
  brazoDer?: number;
  adelanteIzq?: number; // giro del brazo hacia delante
  adelanteDer?: number;
  codoIzq?: number; // flexión del codo
  codoDer?: number;
  salto?: number; // altura extra
  inclinar?: number; // inclinación del cuerpo hacia delante
  cabeza?: number; // giro de la cabeza (sí/no)
  caminar?: number; // fase de caminar (rad); undefined = quieto
  boca?: "sonrisa" | "sorpresa" | "triste" | "seria";
  hablar?: number; // 0..1 apertura de boca
  mirada?: number; // desplazamiento de las pupilas (−1 izquierda … 1 derecha)
};

export type Estilo = {
  pelo?: "corto" | "largo" | "rizado" | "calvo";
  sombrero?: "ninguno" | "vaquero" | "gorra" | "copa";
  colorSombrero?: string;
  ojos?: string;
  zapatos?: string;
  cinturon?: boolean;
  corbata?: string;
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
  estilo?: Estilo;
  f?: number; // frame, para parpadear y respirar
  semilla?: number;
}> = ({ pos = [0, 0, 0], giro = 0, escala = 1, camisa = "#d6452f", pantalon = "#25324f", piel = "#e9b48f", pelo = "#3a2414", pose = {}, estilo = {}, f = 0, semilla = 0 }) => {
  const {
    brazoIzq = 0.12,
    brazoDer = 0.12,
    adelanteIzq = 0,
    adelanteDer = 0,
    codoIzq = 0.25,
    codoDer = 0.25,
    salto = 0,
    inclinar = 0,
    cabeza = 0,
    caminar,
    boca = "sonrisa",
    hablar = 0,
    mirada = 0,
  } = pose;
  const { pelo: peinado = "corto", sombrero = "ninguno", colorSombrero = "#6b3f1f", ojos = "#4a2c17", zapatos = "#2a1d16", cinturon = true, corbata } = estilo;
  const paso = caminar === undefined ? 0 : Math.sin(caminar) * 0.55;
  const bote = caminar === undefined ? 0 : Math.abs(Math.cos(caminar)) * 0.05;
  const respira = Math.sin(f / 14 + semilla) * 0.012;
  // parpadeo determinista cada ~3 s
  const ciclo = (f + semilla * 37) % 95;
  const parpado = ciclo < 4 ? 1 - Math.abs(ciclo - 2) / 2 : 0;
  const abre = boca === "sorpresa" ? 0.8 : hablar * (0.4 + 0.6 * Math.abs(Math.sin(f / 2.3 + semilla)));
  const pantorrilla = caminar === undefined ? 0 : Math.max(0, -Math.sin(caminar + 1)) * 0.7;

  const pierna = (l: number) => {
    const fase = paso * l;
    const rodilla = caminar === undefined ? 0 : Math.max(0, Math.sin((caminar ?? 0) * 1 + (l > 0 ? 0 : Math.PI) + 1.2)) * 0.8;
    return (
      <group key={l} position={[0.16 * l, 0.92, 0]} rotation={[fase, 0, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.3, 6, 14]} />
          <Tela color={pantalon} />
        </mesh>
        <group position={[0, -0.46, 0]} rotation={[rodilla + pantorrilla * 0, 0, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.115, 0.28, 6, 14]} />
            <Tela color={pantalon} />
          </mesh>
          <mesh position={[0, -0.42, 0.06]} castShadow>
            <capsuleGeometry args={[0.11, 0.2, 6, 12]} />
            <Mat color={zapatos} rugoso={0.35} laca={0.6} />
          </mesh>
        </group>
      </group>
    );
  };

  const brazo = (l: number, arriba: number, adelante: number, codo: number) => (
    <group key={l} position={[0.4 * l, 1.6, 0]} rotation={[-adelante, 0, arriba * l]}>
      <mesh position={[0, -0.18, 0]} castShadow>
        <capsuleGeometry args={[0.095, 0.24, 6, 12]} />
        <Tela color={camisa} />
      </mesh>
      <group position={[0, -0.38, 0]} rotation={[-codo, 0, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.22, 6, 12]} />
          <Mat color={piel} rugoso={0.5} />
        </mesh>
        <mesh position={[0, -0.34, 0.01]} castShadow scale={[1, 1.1, 0.8]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <Mat color={piel} rugoso={0.5} />
        </mesh>
        <mesh position={[0.06 * -l, -0.3, 0.05]} rotation={[0, 0, 0.6 * l]} castShadow>
          <capsuleGeometry args={[0.03, 0.06, 4, 8]} />
          <Mat color={piel} rugoso={0.5} />
        </mesh>
      </group>
    </group>
  );

  return (
    <group position={[pos[0], pos[1] + salto + bote, pos[2]]} rotation={[0, giro, 0]} scale={escala}>
      {/* sombra de contacto suave */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012 - salto - bote, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22 / (1 + salto * 2)} depthWrite={false} />
      </mesh>
      {pierna(-1)}
      {pierna(1)}
      <group position={[0, 0.92, 0]} rotation={[inclinar, 0, 0]}>
        <group position={[0, -0.92, 0]} scale={[1, 1 + respira, 1]}>
          {/* cadera y cinturón */}
          <mesh position={[0, 0.98, 0]} castShadow scale={[1, 0.7, 0.8]}>
            <sphereGeometry args={[0.31, 20, 16]} />
            <Tela color={pantalon} />
          </mesh>
          {cinturon && (
            <mesh position={[0, 1.08, 0]} scale={[1, 1, 0.82]}>
              <cylinderGeometry args={[0.305, 0.305, 0.07, 24]} />
              <Mat color="#3b2414" rugoso={0.4} laca={0.4} />
            </mesh>
          )}
          {cinturon && (
            <mesh position={[0, 1.08, 0.255]}>
              <Redondo args={[0.1, 0.07, 0.02]} />
              <Mat color="#d9b45a" metal={0.9} rugoso={0.25} />
            </mesh>
          )}
          {/* torso */}
          <mesh position={[0, 1.38, 0]} castShadow scale={[1, 1, 0.78]}>
            <capsuleGeometry args={[0.3, 0.42, 8, 20]} />
            <Tela color={camisa} />
          </mesh>
          {/* cuello de la camisa */}
          <mesh position={[0, 1.7, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.04, 8, 20]} />
            <Tela color={new THREE.Color(camisa).multiplyScalar(0.8).getStyle()} />
          </mesh>
          {corbata && (
            <mesh position={[0, 1.45, 0.23]} rotation={[0.08, 0, 0]}>
              <Redondo args={[0.09, 0.42, 0.02]} />
              <Mat color={corbata} rugoso={0.4} />
            </mesh>
          )}
          {brazo(-1, brazoIzq, adelanteIzq - paso, codoIzq)}
          {brazo(1, brazoDer, adelanteDer + paso, codoDer)}
          {/* cuello */}
          <mesh position={[0, 1.78, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.18, 14]} />
            <Mat color={piel} rugoso={0.5} />
          </mesh>
          {/* cabeza */}
          <group position={[0, 2.18, 0]} rotation={[0, cabeza, 0]}>
            <mesh castShadow scale={[1, 1.02, 0.95]}>
              <sphereGeometry args={[0.42, 40, 32]} />
              <meshPhysicalMaterial color={piel} roughness={0.48} sheen={0.4} sheenColor="#ffb6a0" />
            </mesh>
            {/* orejas */}
            {[-1, 1].map((l) => (
              <mesh key={`o${l}`} position={[0.41 * l, -0.02, 0]} scale={[0.5, 1, 0.8]}>
                <sphereGeometry args={[0.09, 14, 12]} />
                <Mat color={piel} rugoso={0.5} />
              </mesh>
            ))}
            {/* nariz */}
            <mesh position={[0, -0.04, 0.4]} scale={[1, 0.85, 0.9]}>
              <sphereGeometry args={[0.055, 14, 12]} />
              <Mat color={new THREE.Color(piel).multiplyScalar(0.94).getStyle()} rugoso={0.45} />
            </mesh>
            {/* mejillas */}
            {[-1, 1].map((l) => (
              <mesh key={`m${l}`} position={[0.22 * l, -0.1, 0.33]} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.07, 12, 10]} />
                <meshStandardMaterial color="#ff8f80" transparent opacity={0.35} roughness={0.6} depthWrite={false} />
              </mesh>
            ))}
            {/* ojos */}
            {[-1, 1].map((l) => (
              <group key={`e${l}`} position={[0.15 * l, 0.06, 0.34]}>
                <mesh scale={[1, 1.12, 0.55]}>
                  <sphereGeometry args={[0.1, 24, 20]} />
                  <meshPhysicalMaterial color="#fbfbf7" roughness={0.15} clearcoat={1} />
                </mesh>
                <mesh position={[mirada * 0.03, -0.005, 0.05]} scale={[1, 1, 0.5]}>
                  <sphereGeometry args={[0.062, 20, 16]} />
                  <Mat color={ojos} rugoso={0.2} />
                </mesh>
                <mesh position={[mirada * 0.03, -0.005, 0.072]} scale={[1, 1, 0.4]}>
                  <sphereGeometry args={[0.034, 16, 12]} />
                  <Mat color="#0b0706" rugoso={0.1} />
                </mesh>
                <mesh position={[mirada * 0.03 + 0.022, 0.025, 0.085]}>
                  <sphereGeometry args={[0.014, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                {/* párpado */}
                <mesh position={[0, 0.002, 0.004]} scale={[1.08, 1.18 * Math.max(0.02, parpado), 0.6]} rotation={[0, 0, 0]}>
                  <sphereGeometry args={[0.1, 20, 16]} />
                  <Mat color={piel} rugoso={0.5} />
                </mesh>
                {/* ceja */}
                <mesh
                  position={[0, 0.15 + (boca === "sorpresa" ? 0.03 : 0), 0.04]}
                  rotation={[0, 0, (boca === "triste" ? -0.3 : boca === "seria" ? 0.18 : 0.08) * l]}
                >
                  <capsuleGeometry args={[0.022, 0.1, 4, 8]} />
                  <Mat color={pelo} rugoso={0.8} />
                </mesh>
              </group>
            ))}
            {/* boca */}
            {abre > 0.05 ? (
              <mesh position={[0, -0.2, 0.37]} scale={[1, 0.4 + abre, 0.4]}>
                <sphereGeometry args={[0.07, 16, 12]} />
                <Mat color="#5a1a1f" rugoso={0.4} />
              </mesh>
            ) : (
              <mesh position={[0, boca === "triste" ? -0.24 : -0.17, 0.37]} rotation={[0, 0, boca === "triste" ? 0 : Math.PI]}>
                <torusGeometry args={[0.075, 0.018, 8, 18, boca === "seria" ? 0.6 : Math.PI * 0.85]} />
                <Mat color="#8a3b36" rugoso={0.4} />
              </mesh>
            )}
            {/* pelo */}
            {peinado !== "calvo" && (
              <mesh position={[0, 0.05, -0.04]} scale={[1.06, 0.98, 1.06]} rotation={[-0.55, 0, 0]}>
                <sphereGeometry args={[0.42, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
                <Mat color={pelo} rugoso={0.75} />
              </mesh>
            )}
            {peinado === "rizado" &&
              Array.from({ length: 14 }, (_, i) => {
                const a = (i / 14) * Math.PI * 2;
                return (
                  <mesh key={i} position={[Math.cos(a) * 0.32, 0.25 + azar(i) * 0.06, Math.sin(a) * 0.3 - 0.04]}>
                    <sphereGeometry args={[0.13, 12, 10]} />
                    <Mat color={pelo} rugoso={0.8} />
                  </mesh>
                );
              })}
            {peinado === "largo" && (
              <mesh position={[0, -0.25, -0.2]} castShadow scale={[1, 1, 0.55]}>
                <capsuleGeometry args={[0.36, 0.5, 8, 16]} />
                <Mat color={pelo} rugoso={0.75} />
              </mesh>
            )}
            {sombrero === "vaquero" && (
              <group position={[0, 0.3, -0.02]} rotation={[-0.12, 0, 0]}>
                <mesh castShadow scale={[1, 1, 0.9]}>
                  <cylinderGeometry args={[0.72, 0.74, 0.04, 32]} />
                  <Mat color={colorSombrero} rugoso={0.8} />
                </mesh>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <cylinderGeometry args={[0.3, 0.38, 0.4, 24]} />
                  <Mat color={colorSombrero} rugoso={0.8} />
                </mesh>
                <mesh position={[0, 0.07, 0]}>
                  <cylinderGeometry args={[0.385, 0.385, 0.07, 24]} />
                  <Mat color="#2b1a10" />
                </mesh>
              </group>
            )}
            {sombrero === "gorra" && (
              <group position={[0, 0.16, 0]} rotation={[-0.15, 0, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.45, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
                  <Tela color={colorSombrero} />
                </mesh>
                <mesh position={[0, 0.02, 0.45]} rotation={[0.15, 0, 0]} scale={[1, 1, 0.7]}>
                  <cylinderGeometry args={[0.3, 0.3, 0.03, 24, 1, false, 0, Math.PI]} />
                  <Tela color={colorSombrero} />
                </mesh>
              </group>
            )}
            {sombrero === "copa" && (
              <group position={[0, 0.34, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.6, 0.6, 0.04, 32]} />
                  <Mat color="#151515" rugoso={0.5} />
                </mesh>
                <mesh position={[0, 0.3, 0]} castShadow>
                  <cylinderGeometry args={[0.33, 0.33, 0.6, 28]} />
                  <Mat color="#151515" rugoso={0.5} />
                </mesh>
                <mesh position={[0, 0.07, 0]}>
                  <cylinderGeometry args={[0.335, 0.335, 0.09, 28]} />
                  <Mat color="#b3202a" />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};

// ---------- dinero ----------

let texBillete: THREE.CanvasTexture | null = null;
const texturaBillete = () => {
  if (texBillete) return texBillete;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 230;
  const d = c.getContext("2d")!;
  d.fillStyle = "#cfe3c4";
  d.fillRect(0, 0, 512, 230);
  d.strokeStyle = "#2f5d3a";
  d.lineWidth = 10;
  d.strokeRect(10, 10, 492, 210);
  d.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    d.beginPath();
    d.arc(256, 115, 20 + i * 3, 0, Math.PI * 2);
    d.strokeStyle = `rgba(47,93,58,${0.05 + (i % 3) * 0.03})`;
    d.stroke();
  }
  d.fillStyle = "#8fb59a";
  d.beginPath();
  d.ellipse(256, 115, 62, 78, 0, 0, Math.PI * 2);
  d.fill();
  d.fillStyle = "#2f5d3a";
  d.beginPath();
  d.arc(256, 95, 26, 0, Math.PI * 2);
  d.fill();
  d.fillRect(222, 125, 68, 50);
  d.font = "900 64px Inter, sans-serif";
  d.fillText("100", 30, 80);
  d.fillText("100", 380, 200);
  d.font = "900 26px Inter, sans-serif";
  d.fillText("DÓLARES", 360, 52);
  texBillete = new THREE.CanvasTexture(c);
  texBillete.colorSpace = THREE.SRGBColorSpace;
  texBillete.anisotropy = 8;
  return texBillete;
};

export const Billete: React.FC<{ pos?: V3; rot?: V3; escala?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], escala = 1 }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh castShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 0.45]} />
      <meshStandardMaterial map={texturaBillete()} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

export const Fajo: React.FC<{ pos?: V3; rot?: V3; escala?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], escala = 1 }) => (
  <group position={pos} rotation={rot} scale={escala}>
    <mesh castShadow position={[0, 0.15, 0]}>
      <Redondo args={[1, 0.3, 0.45]} />
      <meshStandardMaterial color="#9fbf98" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.301, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1, 0.45]} />
      <meshStandardMaterial map={texturaBillete()} roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.15, 0]}>
      <Redondo args={[0.22, 0.31, 0.46]} />
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
      <Redondo args={[1.8, 0.4, 1.2]} />
      <Mat color="#2b2b2b" rugoso={0.4} metal={0.3} />
    </mesh>
    {/* billetes dentro */}
    {abre > 0 &&
      [-0.55, 0, 0.55].map((x) => <Fajo key={x} pos={[x, 0.3, 0]} rot={[0, Math.PI / 2, 0]} escala={0.5} />)}
    <group position={[0, 0.4, -0.6]} rotation={[-abre * 1.9, 0, 0]}>
      <mesh castShadow position={[0, 0.12, 0.6]}>
        <Redondo args={[1.8, 0.24, 1.2]} />
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
      <Redondo args={[3.2, 2.4, 2.6]} />
      <Mat color={pared} />
    </mesh>
    <mesh castShadow position={[0, 3.1, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[2.6, 1.4, 4]} />
      <Mat color={techo} />
    </mesh>
    <mesh position={[0, 0.7, 1.31]}>
      <Redondo args={[0.7, 1.4, 0.05]} />
      <Mat color="#7a4a26" />
    </mesh>
    {[-1, 1].map((l) => (
      <mesh key={l} position={[1 * l, 1.5, 1.31]}>
        <Redondo args={[0.6, 0.6, 0.05]} />
        <Mat color="#9fd8ff" rugoso={0.1} emisivo="#4aa3df" />
      </mesh>
    ))}
    <mesh position={[0.9, 3.4, -0.3]} castShadow>
      <Redondo args={[0.35, 0.9, 0.35]} />
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

export const Edificio: React.FC<{ pos?: V3; alto?: number; ancho?: number; color?: string }> = ({ pos = [0, 0, 0], alto = 6, ancho = 2.4, color = "#b8b2a7" }) => {
  const { mapa, relieve } = texturaSuelo("liso", color, 2);
  const pisos = Math.floor(alto / 1.1);
  return (
    <group position={pos}>
      <mesh castShadow receiveShadow position={[0, alto / 2, 0]}>
        <Redondo args={[ancho, alto, ancho]} />
        <meshStandardMaterial map={mapa} normalMap={relieve} roughness={0.9} />
      </mesh>
      {/* azotea */}
      <mesh castShadow position={[0, alto + 0.12, 0]}>
        <Redondo args={[ancho * 1.04, 0.24, ancho * 1.04]} />
        <Mat color="#8d8a84" rugoso={0.8} />
      </mesh>
      {Array.from({ length: pisos }, (_, i) =>
        [-1, 0, 1].map((x) =>
          [0, 1].map((cara) => (
            <mesh
              key={`${i}${x}${cara}`}
              position={cara ? [ancho / 2 + 0.01, 0.8 + i * 1.1, x * ancho * 0.3] : [x * ancho * 0.3, 0.8 + i * 1.1, ancho / 2 + 0.01]}
              rotation={[0, cara ? Math.PI / 2 : 0, 0]}
            >
              <planeGeometry args={[ancho * 0.22, 0.62]} />
              <meshStandardMaterial
                color={azar(i * 7 + x * 3 + cara) > 0.8 ? "#ffe2a8" : "#1d3550"}
                roughness={0.06}
                metalness={0.9}
                emissive={azar(i * 7 + x * 3 + cara) > 0.8 ? "#ffb35c" : "#000"}
                emissiveIntensity={0.25}
              />
            </mesh>
          )),
        ),
      )}
    </group>
  );
};

// cordillera lejana (se funde con la bruma del cielo)
export const Montanas: React.FC<{ z?: number; color?: string; alto?: number; semilla?: number }> = ({ z = -90, color = "#5f7f73", alto = 22, semilla = 1 }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(420, 60, 140, 20);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i) + 30; // 0..60
      const k = y / 60;
      const cresta =
        Math.abs(Math.sin(x * 0.021 + semilla)) * 0.6 + Math.abs(Math.sin(x * 0.057 + semilla * 3)) * 0.3 + azar(Math.round(x * 2) + semilla) * 0.06;
      pos.setY(i, k * alto * (0.35 + cresta));
      pos.setZ(i, -k * 25);
    }
    g.computeVertexNormals();
    return g;
  }, [alto, semilla]);
  return (
    <mesh geometry={geo} position={[0, 0, z]} receiveShadow>
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </mesh>
  );
};

// Edificio de gobierno con columnas (impuestos)
export const Gobierno: React.FC<{ pos?: V3; giro?: number; escala?: number }> = ({ pos = [0, 0, 0], giro = 0, escala = 1 }) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    {[0, 1, 2].map((i) => (
      <mesh key={i} receiveShadow castShadow position={[0, 0.12 + i * 0.24, 0.6 - i * 0.25]}>
        <Redondo args={[5 - i * 0.3, 0.24, 3.4 - i * 0.5]} />
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
      <Redondo args={[4.4, 2.6, 1.6]} />
      <Mat color="#d8d0bf" />
    </mesh>
    <mesh castShadow position={[0, 3.45, 0.2]}>
      <Redondo args={[4.8, 0.4, 2.6]} />
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
      <Redondo args={[3.2, 0.55, 1.5]} />
      <Mat color={color} rugoso={0.25} metal={0.5} />
    </mesh>
    <mesh castShadow position={[-0.2, 1.05, 0]}>
      <Redondo args={[1.6, 0.5, 1.3]} />
      <Mat color={color} rugoso={0.25} metal={0.5} />
    </mesh>
    <mesh position={[-0.2, 1.05, 0]}>
      <Redondo args={[1.5, 0.4, 1.32]} />
      <Mat color="#1d2b3a" rugoso={0.05} metal={0.3} />
    </mesh>
    {[1.6, -1.6].map((x) => (
      <mesh key={x} position={[x, 0.6, 0]}>
        <Redondo args={[0.05, 0.18, 1.2]} />
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
      <Redondo args={[1, 0.08, 5]} />
      <Mat color="#1e88e5" />
    </mesh>
    <mesh castShadow position={[-1.9, 0.6, 0]}>
      <Redondo args={[0.7, 1, 0.08]} />
      <Mat color="#1e88e5" />
    </mesh>
    <mesh castShadow position={[-1.9, 0.15, 0]}>
      <Redondo args={[0.6, 0.06, 1.8]} />
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

export const Arbol: React.FC<{ pos?: V3; escala?: number; color?: string }> = ({ pos = [0, 0, 0], escala = 1, color = "#3f8f3a" }) => {
  const { relieve } = texturaSuelo("cesped", "#808080", 2);
  const k = pos[0] * 13 + pos[2] * 7;
  return (
    <group position={pos} scale={escala}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 1.6, 10]} />
        <Mat color="#6b4a2e" rugoso={0.95} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + k;
        const r = i === 0 ? 0 : 0.55;
        return (
          <mesh key={i} castShadow receiveShadow position={[Math.cos(a) * r, 2 + (i === 0 ? 0.35 : azar(i + k) * 0.5), Math.sin(a) * r]}>
            <icosahedronGeometry args={[i === 0 ? 0.85 : 0.55 + azar(i * 3 + k) * 0.2, 2]} />
            <meshStandardMaterial
              color={new THREE.Color(color).offsetHSL(0, 0, (azar(i + k * 2) - 0.5) * 0.08)}
              roughness={0.9}
              normalMap={relieve}
              normalScale={new THREE.Vector2(2, 2)}
            />
          </mesh>
        );
      })}
    </group>
  );
};

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
            <Redondo args={[1.9, 0.05, 0.42]} />
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
          <Redondo args={[0.85, 1.1, 0.04]} />
          <Mat color={color} rugoso={0.3} metal={0.2} />
        </mesh>
        {l < 0 && (
          <mesh position={[-0.1, 0.15, 0.025]}>
            <Redondo args={[0.3, 0.24, 0.01]} />
            <Mat color="#ffd54f" metal={0.8} rugoso={0.3} />
          </mesh>
        )}
        <mesh position={[0, -0.25, 0.025]}>
          <Redondo args={[0.7, 0.06, 0.01]} />
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
      <Redondo args={[0.55, 0.04, 0.1]} />
      <Mat color="#5a1a33" />
    </mesh>
  </group>
);

export const CajaFuerte: React.FC<{ pos?: V3; giro?: number; escala?: number; abre?: number }> = ({ pos = [0, 0, 0], giro = 0, escala = 1, abre = 0 }) => (
  <group position={pos} rotation={[0, giro, 0]} scale={escala}>
    <mesh castShadow position={[0, 1, 0]}>
      <Redondo args={[2, 2, 1.8]} />
      <Mat color="#546e7a" metal={0.7} rugoso={0.35} />
    </mesh>
    <group position={[-0.9, 1, 0.91]} rotation={[0, -abre * 1.6, 0]}>
      <mesh position={[0.9, 0, 0.04]} castShadow>
        <Redondo args={[1.8, 1.8, 0.08]} />
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
      <Redondo args={[0.45, 1.8, 0.45]} />
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
      <Redondo args={[0.9, 0.1, 1.6]} />
      <Mat color="#ff7043" />
    </mesh>
    <mesh castShadow position={[0, 0.8, -0.7]} rotation={[0.9, 0, 0]}>
      <Redondo args={[0.9, 0.1, 1]} />
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

export const Mar: React.FC<{ f: number; z?: number }> = ({ f, z = -14 }) => {
  const { relieve } = texturaSuelo("arena", "#808080", 30);
  relieve.offset.set(f * 0.0015, f * 0.002);
  return (
  <group position={[0, 0.02, z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[400, 24]} />
      <meshPhysicalMaterial color="#1683b8" roughness={0.08} metalness={0.15} clearcoat={1} normalMap={relieve} normalScale={new THREE.Vector2(0.5, 0.5)} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -60]}>
      <planeGeometry args={[400, 100]} />
      <meshPhysicalMaterial color="#106e9e" roughness={0.1} metalness={0.15} clearcoat={1} normalMap={relieve} normalScale={new THREE.Vector2(0.4, 0.4)} />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => (
      <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-30 + i * 7 + Math.sin(f / 20 + i) * 0.6, 0.02, 8 + Math.sin(f / 15 + i * 2) * 0.4]}>
        <planeGeometry args={[3, 0.2]} />
        <Mat color="#d5f2ff" />
      </mesh>
    ))}
  </group>
  );
};

export const Barra: React.FC<{ pos?: V3; alto: number; color?: string; ancho?: number }> = ({ pos = [0, 0, 0], alto, color = "#26a69a", ancho = 0.7 }) => (
  <mesh castShadow receiveShadow position={[pos[0], pos[1] + Math.max(alto, 0.01) / 2, pos[2]]}>
    <Redondo args={[ancho, Math.max(alto, 0.01), ancho]} />
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
