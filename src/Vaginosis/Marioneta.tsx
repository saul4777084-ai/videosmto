import React from "react";
import { Img, interpolate, spring, staticFile, useVideoConfig } from "remotion";
import { Gesto } from "./escenas";

// Lienzo original de las piezas (todas comparten el mismo tamaño y posición)
const ANCHO = 1024;
const ALTO = 1536;
const HOMBRO = { izq: [352, 330], der: [673, 330] } as const;
const CODO = { izq: [287, 560], der: [738, 560] } as const;
const CUELLO = [512, 240] as const;
const MANO_IZQ = [292, 875] as const;

// abd: cuánto se abre el brazo hacia fuera (grados)
// flex: cuánto se dobla el codo hacia el centro del cuerpo (negativo = hacia fuera/arriba)
type Brazo = { abd: number; flex: number };
type Pose = { izq: Brazo; der: Brazo; cabeza: number; cuerpo: number; salto: number; libroAbierto: number };

const REPOSO: Pose = {
  izq: { abd: 4, flex: 12 },
  der: { abd: 4, flex: 8 },
  cabeza: 0,
  cuerpo: 0,
  salto: 0,
  libroAbierto: 0,
};

const poseDe = (gesto: Gesto, t: number): Pose => {
  const s = Math.sin;
  switch (gesto) {
    case "senalar":
      return { ...REPOSO, der: { abd: 78 + s(t * 5) * 3, flex: 12 }, cabeza: 4, cuerpo: 1.5 };
    case "negar":
      return {
        ...REPOSO,
        der: { abd: 22, flex: 105 + s(t * 14) * 14 },
        cabeza: s(t * 9) * 7,
        cuerpo: s(t * 9) * 1.2,
      };
    case "presentar":
      return {
        ...REPOSO,
        der: { abd: 38 + s(t * 2.5) * 5, flex: 40 + s(t * 2.5) * 8 },
        izq: { abd: 10, flex: 30 },
        cabeza: 3 + s(t * 1.5) * 2,
        cuerpo: s(t * 1.5) * 0.8,
      };
    case "explicar":
      return {
        ...REPOSO,
        izq: { abd: 14, flex: 75 + s(t * 6) * 15 },
        der: { abd: 14, flex: 80 + s(t * 6 + 1.6) * 15 },
        cabeza: s(t * 3) * 3,
        salto: Math.abs(s(t * 6)) * 4,
      };
    case "leer":
      return {
        ...REPOSO,
        izq: { abd: 8, flex: 98 + s(t * 2) * 3 },
        der: { abd: 8, flex: 98 + s(t * 2 + 1) * 3 },
        cabeza: -3 + s(t * 1.2) * 2,
        libroAbierto: 1,
      };
    case "alarma":
      return {
        ...REPOSO,
        izq: { abd: 40 + s(t * 35) * 2, flex: -122 },
        der: { abd: 40 + s(t * 35 + 1) * 2, flex: -122 },
        cabeza: s(t * 30) * 2,
        salto: 14,
      };
    case "contar": {
      const golpe = Math.max(0, s(t * Math.PI * 1.6));
      return { ...REPOSO, der: { abd: 18, flex: 70 + golpe * 35 }, cabeza: golpe * 3, salto: golpe * 6 };
    }
    case "saludar":
      return { ...REPOSO, der: { abd: 82, flex: -72 + s(t * 10) * 20 }, cabeza: 5, cuerpo: s(t * 5) * 1.5 };
  }
};

const mezclar = (a: Pose, b: Pose, k: number): Pose => {
  const m = (x: number, y: number) => x + (y - x) * k;
  return {
    izq: { abd: m(a.izq.abd, b.izq.abd), flex: m(a.izq.flex, b.izq.flex) },
    der: { abd: m(a.der.abd, b.der.abd), flex: m(a.der.flex, b.der.flex) },
    cabeza: m(a.cabeza, b.cabeza),
    cuerpo: m(a.cuerpo, b.cuerpo),
    salto: m(a.salto, b.salto),
    libroAbierto: m(a.libroAbierto, b.libroAbierto),
  };
};

// giro alrededor de un punto del lienzo
const giro = ([x, y]: readonly [number, number], grados: number) =>
  `translate(${x}px, ${y}px) rotate(${grados}deg) translate(${-x}px, ${-y}px)`;

const capa = (archivo: string, transform: string, extra?: React.CSSProperties) => (
  <Img
    src={staticFile(`marioneta/${archivo}`)}
    style={{ position: "absolute", left: 0, top: 0, width: ANCHO, height: ALTO, transform, transformOrigin: "0 0", ...extra }}
  />
);

type Props = {
  gesto: Gesto;
  gestoAnterior: Gesto | null;
  frameLocal: number;
  frameGlobal: number;
  altura: number;
};

export const Marioneta: React.FC<Props> = ({ gesto, gestoAnterior, frameLocal, frameGlobal, altura }) => {
  const { fps } = useVideoConfig();
  const t = frameGlobal / fps;
  const k = spring({ frame: frameLocal, fps, config: { damping: 14, mass: 0.7 } });
  const anterior = gestoAnterior ? poseDe(gestoAnterior, t) : REPOSO;
  const p = mezclar(anterior, poseDe(gesto, t), k);

  // respiración y balanceo suave constantes
  const respira = Math.sin(t * 2.2);
  const brazoIzq = { abd: p.izq.abd + respira * 1.2, flex: p.izq.flex };
  const brazoDer = { abd: p.der.abd + respira * 1.2, flex: p.der.flex };

  // izq: abrir = girar a favor del reloj; der: al revés
  const tBrazoIzq = giro(HOMBRO.izq, brazoIzq.abd);
  const tBrazoDer = giro(HOMBRO.der, -brazoDer.abd);
  const tAnteIzq = `${tBrazoIzq} ${giro(CODO.izq, -brazoIzq.flex)}`;
  const tAnteDer = `${tBrazoDer} ${giro(CODO.der, brazoDer.flex)}`;
  const tCabeza = `${giro(CUELLO, p.cabeza)} translateY(${respira * 2}px)`;

  const escala = altura / ALTO;
  const cerrado = 1 - p.libroAbierto;

  return (
    <div
      style={{
        width: ANCHO * escala,
        height: ALTO * escala,
        position: "relative",
        transform: `translateY(${-p.salto}px) rotate(${p.cuerpo + Math.sin(t * 1.3) * 0.6}deg)`,
        transformOrigin: "50% 100%",
        filter: "drop-shadow(0 25px 30px rgba(0,0,0,0.45))",
      }}
    >
      <div style={{ position: "absolute", width: ANCHO, height: ALTO, transform: `scale(${escala})`, transformOrigin: "0 0" }}>
        {capa("brazo-izq.png", tBrazoIzq)}
        {capa("brazo-der.png", tBrazoDer)}
        {capa("cabeza.png", tCabeza)}
        {capa("cuerpo.png", `scaleY(${1 + respira * 0.004})`, { transformOrigin: "50% 100%" })}
        {/* libro cerrado en la mano izquierda (detrás de los dedos) */}
        {cerrado > 0.01 &&
          capa(
            "libro-cerrado.png",
            `${tAnteIzq} translate(${MANO_IZQ[0] - 95}px, ${MANO_IZQ[1] - 110}px) rotate(-8deg) scale(0.34)`,
            { width: 562, height: 614, opacity: cerrado },
          )}
        {/* libro abierto delante del pecho */}
        {p.libroAbierto > 0.01 &&
          capa(
            "libro-abierto.png",
            `translate(${512 - 713 * 0.42 * 0.5}px, ${interpolate(p.libroAbierto, [0, 1], [640, 455])}px) scale(0.42)`,
            { width: 713, height: 516, opacity: p.libroAbierto },
          )}
        {capa("antebrazo-izq.png", tAnteIzq)}
        {capa("antebrazo-der.png", tAnteDer)}
      </div>
    </div>
  );
};
