// Personaje 2D articulado (estilo ilustración brillante): brazos y piernas con cinemática inversa,
// cara con expresiones, parpadeo, respiración y transiciones suaves entre acciones.
// Uso: <Personaje2D f={f} x={300} y={1800} escala={1} acciones={[[0, "telefono"], [40, "celebrar"]]} />
// (x, y) es el punto entre los pies. Mide unos 680 px de alto con escala 1.
import React from "react";
import { interpolate } from "remotion";

export type Accion2D =
  | "reposo"
  | "celebrar"
  | "senalar" // señala hacia el lado derecho de la pantalla (con mirar="izquierda", al izquierdo)
  | "senalarArriba"
  | "sorpresa" // manos en la cara
  | "alarma" // manos arriba temblando
  | "telefono"
  | "triste"
  | "pensar"
  | "silencio" // dedo en los labios
  | "saludar"
  | "hablar"
  | "pulsar" // dedo hacia abajo a la derecha
  | "andar"
  | "contento"; // manos en la cintura

export type Cara = "feliz" | "euforico" | "sorpresa" | "triste" | "serio" | "pensativo" | "preocupado" | "picaro";

type P = [number, number];
type Pose = {
  manoIzq: P;
  manoDer: P;
  pieIzq: P;
  pieDer: P;
  salto: number;
  inclinar: number; // grados
  cabeza: number; // grados
  mirada: P; // desplazamiento de pupilas
  dedo: number; // 0..1 índice estirado (mano derecha)
  telefono: number; // 0..1 teléfono en la mano derecha
  cara: Cara;
  habla: number; // 0..1 abre la boca
  codoAbajo: number; // 0..1 prefiere el codo derecho pegado al cuerpo (manos cerca de la cara)
  dedoArriba: number; // 0..1 el índice apunta hacia arriba (silencio)
};

const HOMBRO_Y = -480;
const HOMBRO_X = 80;
const CADERA_Y = -265;
const CABEZA_Y = -585;
const L1 = 122;
const L2 = 116;
const M1 = 138;
const M2 = 134;

const poseDe = (a: Accion2D, f: number): Pose => {
  const resp = Math.sin(f / 14) * 4;
  const base: Pose = {
    manoIzq: [-98, -248 + resp],
    manoDer: [98, -248 + resp],
    pieIzq: [-48, 0],
    pieDer: [48, 0],
    salto: 0,
    inclinar: 0,
    cabeza: Math.sin(f / 30) * 2,
    mirada: [0, 0],
    dedo: 0,
    telefono: 0,
    cara: "feliz",
    habla: 0,
    codoAbajo: 0,
    dedoArriba: 0,
  };
  switch (a) {
    case "celebrar": {
      const s = Math.abs(Math.sin(f / 5));
      return { ...base, manoIzq: [-160 - Math.sin(f / 3) * 15, -720], manoDer: [160 + Math.sin(f / 3) * 15, -720], salto: s * 70, pieIzq: [-40, -s * 25], pieDer: [40, -s * 25], cara: "euforico", habla: 0.6 + Math.sin(f / 2) * 0.3 };
    }
    case "senalar":
      return { ...base, manoDer: [320, -500 + Math.sin(f / 9) * 6], dedo: 1, cabeza: 6, mirada: [7, 0], inclinar: 3, habla: Math.abs(Math.sin(f / 3)) * 0.6 };
    case "senalarArriba":
      return { ...base, manoDer: [170, -760], dedo: 1, cabeza: -4, mirada: [4, -7] };
    case "sorpresa":
      return { ...base, manoIzq: [-62, -540], manoDer: [62, -540], cara: "sorpresa", salto: 8, inclinar: -3 };
    case "alarma": {
      const t = Math.sin(f * 1.6) * 10;
      return { ...base, manoIzq: [-190 + t, -650], manoDer: [190 - t, -650], cara: "sorpresa", salto: 10 + Math.abs(Math.sin(f / 3)) * 10 };
    }
    case "telefono":
      return { ...base, manoDer: [26, -405], manoIzq: [-30, -385], telefono: 1, cabeza: -7, mirada: [-2, 8], cara: "sorpresa" };
    case "triste":
      return { ...base, manoIzq: [-62, -235], manoDer: [62, -235], inclinar: 5, cabeza: -10 + Math.sin(f / 10) * 3, mirada: [0, 8], cara: "triste" };
    case "pensar":
      return { ...base, manoDer: [22, -505], manoIzq: [-20, -390], codoAbajo: 1, cabeza: 8, mirada: [6, -8], cara: "pensativo" };
    case "silencio":
      return { ...base, manoDer: [6, -520], dedo: 1, dedoArriba: 1, codoAbajo: 1, mirada: [-8, 0], cabeza: -4, cara: "serio" };
    case "saludar":
      return { ...base, manoDer: [210 + Math.sin(f / 3.2) * 45, -700], cara: "feliz", cabeza: 5, habla: Math.abs(Math.sin(f / 4)) * 0.5 };
    case "hablar":
      return {
        ...base,
        manoIzq: [-165, -385 + Math.sin(f / 6) * 25],
        manoDer: [165, -395 + Math.cos(f / 7) * 25],
        cabeza: Math.sin(f / 8) * 5,
        habla: Math.abs(Math.sin(f / 2.6)),
      };
    case "pulsar":
      return { ...base, manoDer: [255, -330], dedo: 1, inclinar: 6, mirada: [6, 6], cara: "picaro" };
    case "contento":
      return { ...base, manoIzq: [-120, -300], manoDer: [120, -300], cara: "picaro", cabeza: Math.sin(f / 12) * 4 };
    case "andar": {
      const p = f / 4.5;
      return {
        ...base,
        pieIzq: [-30 + Math.sin(p) * 55, -Math.max(0, Math.cos(p)) * 28],
        pieDer: [30 - Math.sin(p) * 55, -Math.max(0, -Math.cos(p)) * 28],
        manoIzq: [-98 - Math.sin(p) * 40, -255],
        manoDer: [98 + Math.sin(p) * 40, -255],
        salto: Math.abs(Math.sin(p)) * 10,
      };
    }
    default:
      return base;
  }
};

const mezcla = (a: Pose, b: Pose, t: number): Pose => {
  const m = (x: number, y: number) => x + (y - x) * t;
  const mp = (x: P, y: P): P => [m(x[0], y[0]), m(x[1], y[1])];
  return {
    manoIzq: mp(a.manoIzq, b.manoIzq),
    manoDer: mp(a.manoDer, b.manoDer),
    pieIzq: mp(a.pieIzq, b.pieIzq),
    pieDer: mp(a.pieDer, b.pieDer),
    salto: m(a.salto, b.salto),
    inclinar: m(a.inclinar, b.inclinar),
    cabeza: m(a.cabeza, b.cabeza),
    mirada: mp(a.mirada, b.mirada),
    dedo: m(a.dedo, b.dedo),
    telefono: t < 0.5 ? a.telefono : b.telefono,
    cara: t < 0.5 ? a.cara : b.cara,
    habla: m(a.habla, b.habla),
    codoAbajo: m(a.codoAbajo, b.codoAbajo),
    dedoArriba: m(a.dedoArriba, b.dedoArriba),
  };
};

// cinemática inversa de dos huesos: codo/rodilla hacia `lado` (+1 fuera/abajo según `prefiere`)
const ik = (s: P, t: P, l1: number, l2: number, prefiere: (e: P) => number): P => {
  const dx = t[0] - s[0];
  const dy = t[1] - s[1];
  const d = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 0.5, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const alfa = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const e1: P = [s[0] + Math.cos(base + alfa) * l1, s[1] + Math.sin(base + alfa) * l1];
  const e2: P = [s[0] + Math.cos(base - alfa) * l1, s[1] + Math.sin(base - alfa) * l1];
  return prefiere(e1) >= prefiere(e2) ? e1 : e2;
};

// recorta el objetivo al alcance del brazo
const alcance = (s: P, t: P, l: number): P => {
  const d = Math.hypot(t[0] - s[0], t[1] - s[1]);
  if (d <= l) return t;
  return [s[0] + ((t[0] - s[0]) / d) * l, s[1] + ((t[1] - s[1]) / d) * l];
};

const BOCA: Record<Cara, (h: number) => React.ReactNode> = {
  feliz: (h) => (h > 0.15 ? <path d={`M -30 28 Q 0 ${44 + h * 20} 30 28 Q 0 ${36 + h * 6} -30 28 Z`} fill="#7a1f2b" /> : <path d="M -28 26 Q 0 50 28 26" stroke="#5a1a20" strokeWidth={7} fill="none" strokeLinecap="round" />),
  euforico: (h) => (
    <g>
      <path d={`M -38 22 Q 0 ${70 + h * 16} 38 22 Z`} fill="#7a1f2b" />
      <path d="M -30 24 L 30 24 L 26 32 L -26 32 Z" fill="#fff" />
      <ellipse cx={0} cy={50 + h * 8} rx={16} ry={8} fill="#ff6b81" />
    </g>
  ),
  sorpresa: (h) => <ellipse cx={0} cy={36} rx={16 + h * 4} ry={20 + h * 8} fill="#7a1f2b" />,
  triste: () => <path d="M -26 44 Q 0 22 26 44" stroke="#5a1a20" strokeWidth={7} fill="none" strokeLinecap="round" />,
  serio: () => <path d="M -20 36 L 20 36" stroke="#5a1a20" strokeWidth={7} strokeLinecap="round" />,
  pensativo: () => <path d="M -14 38 Q 6 30 24 36" stroke="#5a1a20" strokeWidth={7} fill="none" strokeLinecap="round" />,
  preocupado: () => <path d="M -26 40 Q -13 30 0 40 Q 13 50 26 40" stroke="#5a1a20" strokeWidth={7} fill="none" strokeLinecap="round" />,
  picaro: () => <path d="M -26 28 Q 6 50 30 22" stroke="#5a1a20" strokeWidth={7} fill="none" strokeLinecap="round" />,
};

// inclinación de cejas por expresión (grados, interior arriba > 0)
const CEJAS: Record<Cara, { y: number; giro: number }> = {
  feliz: { y: -48, giro: -6 },
  euforico: { y: -56, giro: -10 },
  sorpresa: { y: -62, giro: -4 },
  triste: { y: -46, giro: 16 },
  serio: { y: -44, giro: -12 },
  pensativo: { y: -50, giro: 8 },
  preocupado: { y: -50, giro: 14 },
  picaro: { y: -48, giro: -14 },
};

type Props = {
  f: number;
  x: number;
  y: number;
  escala?: number;
  acciones: [desde: number, accion: Accion2D][]; // línea de tiempo de acciones (frames locales)
  cara?: Cara; // fuerza una expresión
  mirar?: "derecha" | "izquierda";
  sudadera?: string;
  sudaderaOscura?: string;
  piel?: string;
  pelo?: string;
  pantalon?: string;
  zapatillas?: string;
};

export const Personaje2D: React.FC<Props> = ({
  f,
  x,
  y,
  escala = 1,
  acciones,
  cara,
  mirar = "derecha",
  sudadera = "#3a7bf0",
  sudaderaOscura = "#2554c4",
  piel = "#f0bf98",
  pelo = "#3a2414",
  pantalon = "#2c3e66",
  zapatillas = "#ef3b3b",
}) => {
  // acción actual y anterior, con mezcla suave de 8 frames
  let k = 0;
  acciones.forEach(([desde], i) => {
    if (f >= desde) k = i;
  });
  const [desde, actual] = acciones[k];
  const anterior = k > 0 ? acciones[k - 1][1] : actual;
  const t = interpolate(f - desde, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (v) => v * v * (3 - 2 * v) });
  const p = mezcla(poseDe(anterior, f), poseDe(actual, f), k === 0 ? 1 : t);
  const expresion = cara ?? p.cara;

  const hIzq: P = [-HOMBRO_X, HOMBRO_Y];
  const hDer: P = [HOMBRO_X, HOMBRO_Y];
  const mIzq = alcance(hIzq, p.manoIzq, L1 + L2 - 1);
  const mDer = alcance(hDer, p.manoDer, L1 + L2 - 1);
  const cIzq = ik(hIzq, mIzq, L1, L2, (e) => -e[0] + e[1] * 0.6);
  const cDer = ik(hDer, mDer, L1, L2, (e) => e[0] * (1 - p.codoAbajo) + e[1] * (0.6 + p.codoAbajo * 2));
  const caIzq: P = [-42, CADERA_Y];
  const caDer: P = [42, CADERA_Y];
  const pIzq: P = [p.pieIzq[0], p.pieIzq[1] + p.salto];
  const pDer: P = [p.pieDer[0], p.pieDer[1] + p.salto];
  const ptIzq = alcance(caIzq, pIzq, M1 + M2 - 1);
  const ptDer = alcance(caDer, pDer, M1 + M2 - 1);
  const rIzq = ik(caIzq, ptIzq, M1, M2, (e) => -e[0] * 0.3 - e[1] * 0.2);
  const rDer = ik(caDer, ptDer, M1, M2, (e) => e[0] * 0.3 - e[1] * 0.2);
  const parpadeo = (f + 17) % 95 < 4 ? 0.12 : 1;
  const dirAntebrazo = Math.atan2(mDer[1] - cDer[1], mDer[0] - cDer[0]);
  const dirDedo = dirAntebrazo + (-Math.PI / 2 - dirAntebrazo) * p.dedoArriba;
  const id = `p2d${sudadera.replace("#", "")}`;

  const hueso = (a: P, b: P, ancho: number, color: string) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={ancho} strokeLinecap="round" />;

  const brazo = (h: P, c: P, m: P, der: boolean) => (
    <g>
      {hueso(h, c, 50, sudaderaOscura)}
      {hueso(h, c, 40, sudadera)}
      {hueso(c, m, 44, sudaderaOscura)}
      {hueso(c, m, 34, sudadera)}
      <circle cx={m[0]} cy={m[1]} r={27} fill={piel} />
      {der && p.dedo > 0.05 && (
        <g transform={`translate(${m[0]} ${m[1]}) rotate(${(dirDedo * 180) / Math.PI})`}>
          <rect x={10} y={-8} width={30 + 20 * p.dedo} height={16} rx={8} fill={piel} />
        </g>
      )}
      {der && p.telefono > 0.5 && (
        <g transform={`translate(${m[0] - 4} ${m[1] - 38}) rotate(-8)`}>
          <rect x={-26} y={-46} width={52} height={92} rx={9} fill="#141418" />
          <rect x={-21} y={-40} width={42} height={78} rx={5} fill="#5aa0ff" />
          <rect x={-21} y={-40} width={42} height={78} rx={5} fill="#bfe0ff" opacity={0.25 + 0.25 * Math.sin(f / 3)} />
        </g>
      )}
    </g>
  );

  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <radialGradient id={`${id}piel`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffe0c8" />
          <stop offset="1" stopColor={piel} />
        </radialGradient>
        <linearGradient id={`${id}tela`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={sudadera} />
          <stop offset="1" stopColor={sudaderaOscura} />
        </linearGradient>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${escala * (mirar === "izquierda" ? -1 : 1)} ${escala})`}>
        {/* sombra en el suelo */}
        <ellipse cx={0} cy={6} rx={130 - p.salto * 0.6} ry={24} fill="rgba(0,0,0,0.35)" />
        <g transform={`translate(0 ${-p.salto})`}>
          {/* piernas */}
          {[
            [caIzq, rIzq, ptIzq],
            [caDer, rDer, ptDer],
          ].map(([ca, r, pie], i) => {
            return (
              <g key={i}>
                {hueso(ca, r, 56, "#1f2d4d")}
                {hueso(ca, r, 46, pantalon)}
                {hueso(r, pie, 50, "#1f2d4d")}
                {hueso(r, pie, 40, pantalon)}
                <g transform={`translate(${pie[0]} ${pie[1]})`}>
                  <path d={`M ${i ? -24 : -48} 0 Q ${i ? -24 : -48} -36 ${i ? 4 : -4} -36 Q ${i ? 48 : 24} -30 ${i ? 52 : 24} 0 Z`} fill={zapatillas} />
                  <rect x={i ? -28 : -52} y={-8} width={84} height={14} rx={7} fill="#f5f5f5" />
                </g>
              </g>
            );
          })}
          <g transform={`rotate(${p.inclinar} 0 ${CADERA_Y})`}>
            {/* capucha detrás de la cabeza */}
            <ellipse cx={0} cy={HOMBRO_Y - 30} rx={92} ry={56} fill={sudaderaOscura} />
            {/* torso */}
            <path
              d={`M ${-HOMBRO_X - 22} ${HOMBRO_Y + 6} Q ${-HOMBRO_X - 10} ${HOMBRO_Y - 26} ${-40} ${HOMBRO_Y - 22} L 40 ${HOMBRO_Y - 22} Q ${HOMBRO_X + 10} ${HOMBRO_Y - 26} ${HOMBRO_X + 22} ${HOMBRO_Y + 6} L ${88} ${CADERA_Y + 10} Q 0 ${CADERA_Y + 30} ${-88} ${CADERA_Y + 10} Z`}
              fill={`url(#${id}tela)`}
            />
            <rect x={-88} y={CADERA_Y - 20} width={176} height={34} rx={14} fill={sudaderaOscura} />
            <path d={`M -58 ${CADERA_Y - 30} L -46 ${CADERA_Y - 100} L 46 ${CADERA_Y - 100} L 58 ${CADERA_Y - 30} Z`} fill={sudaderaOscura} opacity={0.6} />
            <line x1={-18} y1={HOMBRO_Y - 14} x2={-22} y2={HOMBRO_Y + 70} stroke="#f5f5f5" strokeWidth={6} strokeLinecap="round" />
            <line x1={18} y1={HOMBRO_Y - 14} x2={22} y2={HOMBRO_Y + 70} stroke="#f5f5f5" strokeWidth={6} strokeLinecap="round" />
            <ellipse cx={-38} cy={HOMBRO_Y + 40} rx={26} ry={60} fill="#fff" opacity={0.1} />
            {/* cuello y cabeza */}
            <rect x={-24} y={HOMBRO_Y - 50} width={48} height={40} rx={14} fill={piel} />
            <g transform={`rotate(${p.cabeza} 0 ${HOMBRO_Y - 30})`}>
              <g transform={`translate(0 ${CABEZA_Y})`}>
                <circle cx={-88} cy={6} r={20} fill={piel} />
                <circle cx={88} cy={6} r={20} fill={piel} />
                <circle cx={0} cy={0} r={92} fill={`url(#${id}piel)`} />
                {/* pelo */}
                <path d="M -94 -6 Q -100 -96 -10 -104 Q 70 -110 96 -30 Q 98 -6 90 4 Q 70 -54 20 -50 Q 30 -36 10 -28 Q -10 -50 -40 -44 Q -70 -40 -94 -6 Z" fill={pelo} />
                <ellipse cx={-30} cy={-80} rx={30} ry={10} fill="#fff" opacity={0.15} transform="rotate(-15 -30 -80)" />
                {/* cejas */}
                {[-1, 1].map((s) => (
                  <rect key={s} x={s * 34 - 18} y={CEJAS[expresion].y} width={36} height={9} rx={4.5} fill={pelo} transform={`rotate(${s * CEJAS[expresion].giro} ${s * 34} ${CEJAS[expresion].y + 4})`} />
                ))}
                {/* ojos */}
                {[-1, 1].map((s) => (
                  <g key={s} transform={`translate(${s * 34} -10) scale(1 ${parpadeo})`}>
                    <ellipse cx={0} cy={0} rx={19} ry={expresion === "sorpresa" || expresion === "euforico" ? 25 : 22} fill="#fff" />
                    <circle cx={p.mirada[0]} cy={p.mirada[1]} r={11} fill="#2a1a10" />
                    <circle cx={p.mirada[0] + 4} cy={p.mirada[1] - 4} r={4} fill="#fff" />
                  </g>
                ))}
                {/* mejillas */}
                <ellipse cx={-58} cy={22} rx={16} ry={9} fill="#ff8a8a" opacity={0.45} />
                <ellipse cx={58} cy={22} rx={16} ry={9} fill="#ff8a8a" opacity={0.45} />
                <path d="M -6 2 Q 0 16 8 10" stroke="#c98563" strokeWidth={5} fill="none" strokeLinecap="round" />
                {BOCA[expresion](p.habla)}
                {expresion === "preocupado" && <path d="M 78 -40 Q 90 -20 80 -12 Q 68 -20 78 -40 Z" fill="#7fd0ff" />}
              </g>
            </g>
            {/* brazos (delante del torso) */}
            {brazo(hIzq, cIzq, mIzq, false)}
            {brazo(hDer, cDer, mDer, true)}
          </g>
        </g>
      </g>
    </svg>
  );
};
