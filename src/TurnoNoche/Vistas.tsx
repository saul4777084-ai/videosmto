import React from "react";
import { random } from "remotion";
import { Desconocido, Dependiente } from "../comun/Terror/Personajes";
import { parpadeo } from "../comun/Terror/Efectos";

// Escenarios de "Turno de noche" dibujados en SVG 1080×1920 (van dentro de <Lienzo>).

const ROJO = "#c0262c";

// ------------------------------------------------------------------ exterior
export const Gasolinera: React.FC<{ f: number; desconocido?: boolean; dependiente?: boolean }> = ({ f, desconocido = false, dependiente = true }) => {
  const neon = parpadeo(f, "neon", 0.07);
  return (
    <g>
      <defs>
        <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03050a" />
          <stop offset="1" stopColor="#141c2c" />
        </linearGradient>
        <linearGradient id="suelo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2533" />
          <stop offset="1" stopColor="#0b0e14" />
        </linearGradient>
        <radialGradient id="charco" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cristalTienda" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5f1dc" />
          <stop offset="1" stopColor="#d9d3b4" />
        </linearGradient>
      </defs>
      <rect width="1080" height="1100" fill="url(#cielo)" />
      <path d="M0 1000 C160 940 300 975 450 950 C620 920 760 980 900 945 C980 930 1040 950 1080 940 L1080 1100 L0 1100 Z" fill="#090c13" />
      <rect y="1060" width="1080" height="860" fill="url(#suelo)" />
      {/* carretera */}
      <rect y="1580" width="1080" height="190" fill="#090b10" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={i * 180 - 40} y="1668" width="100" height="12" fill="#b9a462" opacity="0.7" />
      ))}
      {/* tienda */}
      <rect x="150" y="810" width="780" height="320" fill="#262b35" />
      <rect x="140" y="790" width="800" height="34" fill="#171b22" />
      <rect x="190" y="870" width="700" height="225" fill="url(#cristalTienda)" opacity="0.92" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={230 + i * 120} y="960" width="90" height="135" fill="#9f9a83" />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={236 + i * 120} y={968 + k * 32} width="78" height="18" fill={["#c55a4a", "#5b8bb5", "#d2b34e", "#6f9c62"][(i + k) % 4]} opacity="0.75" />
          ))}
        </g>
      ))}
      <rect x="580" y="870" width="130" height="225" fill="none" stroke="#5e636c" strokeWidth="8" />
      <rect x="740" y="1010" width="140" height="85" fill="#7f7a68" />
      {dependiente && <Dependiente x={800} y={1080} escala={0.24} />}
      <rect x="740" y="1040" width="140" height="55" fill="#6e6a5a" />
      <rect x="150" y="1095" width="780" height="35" fill="url(#ladrillo)" />
      <rect x="150" y="824" width="40" height="271" fill="url(#ladrillo)" />
      <rect x="890" y="824" width="40" height="271" fill="url(#ladrillo)" />
      <rect x="150" y="1095" width="780" height="35" fill="#000" opacity="0.25" />
      {/* marquesina */}
      <rect x="40" y="630" width="1000" height="92" fill="#d6dbe1" />
      <rect x="40" y="690" width="1000" height="18" fill={ROJO} />
      <text x="540" y="678" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="46" fill="#2a2f38" letterSpacing="10">
        GASOLINERA
      </text>
      <rect x="40" y="722" width="1000" height="16" fill="#9aa1aa" />
      {[150, 330, 510, 690, 870].map((x) => (
        <rect key={x} x={x} y="736" width="80" height="8" fill="#fffbe8" />
      ))}
      {/* luz bajo la marquesina */}
      <ellipse cx="540" cy="1290" rx="600" ry="230" fill="url(#charco)" />
      <path d="M60 740 L1020 740 L1100 1400 L-20 1400 Z" fill="#fff8e0" opacity="0.05" />
      <defs>
        <linearGradient id="haz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffbe8" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fffbe8" stopOpacity="0" />
        </linearGradient>
        <pattern id="ladrillo" width="60" height="30" patternUnits="userSpaceOnUse">
          <rect width="60" height="30" fill="#5a3a30" />
          <path d="M0 0 H60 M0 15 H60 M30 0 V15 M0 15 V30 M60 15 V30" stroke="#2a1d18" strokeWidth="2.5" />
          <rect x="3" y="3" width="24" height="9" fill="#6b463a" opacity="0.6" />
          <rect x="33" y="18" width="24" height="9" fill="#4d322a" opacity="0.6" />
        </pattern>
        <linearGradient id="reflejo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[150, 330, 510, 690, 870].map((x) => (
        <path key={x} d={`M${x} 744 L${x + 80} 744 L${x + 230} 1330 L${x - 150} 1330 Z`} fill="url(#haz)" />
      ))}
      {/* columnas */}
      <rect x="226" y="738" width="34" height="600" fill="#b9c0c8" />
      <rect x="820" y="738" width="34" height="600" fill="#b9c0c8" />
      {/* isla y surtidores */}
      <rect x="290" y="1300" width="500" height="44" rx="8" fill="#5f656e" />
      <rect x="290" y="1300" width="500" height="12" rx="6" fill="#7d838c" />
      {[{ x: 360, n: "1" }, { x: 640, n: "2" }].map(({ x, n }) => (
        <g key={n}>
          <rect x={x} y="1070" width="110" height="232" rx="8" fill="#e3e6ea" />
          <rect x={x} y="1070" width="110" height="60" rx="8" fill={ROJO} />
          <text x={x + 55} y="1116" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="40" fill="#fff">
            {n}
          </text>
          <rect x={x + 18} y="1145" width="74" height="40" rx="4" fill="#163322" />
          <rect x={x + 24} y="1152" width="62" height="10" fill="#6dffa0" opacity="0.8" />
          <rect x={x + 24} y="1168" width="40" height="8" fill="#6dffa0" opacity="0.6" />
          <path d={`M${x + 110} 1200 q40 20 30 90`} stroke="#1a1a1a" strokeWidth="9" fill="none" />
          <rect x={x + 125} y="1180" width="22" height="40" rx="4" fill="#2a2a2a" />
        </g>
      ))}
      {desconocido && <Desconocido x={790} y={1325} escala={0.56} cabeza={-4} />}
      {/* reflejos en el suelo mojado */}
      <rect x="360" y="1346" width="110" height="200" fill="url(#reflejo)" />
      <rect x="640" y="1346" width="110" height="200" fill="url(#reflejo)" />
      <rect x="360" y="1346" width="110" height="40" fill="#c0262c" opacity="0.18" />
      <rect x="640" y="1346" width="110" height="40" fill="#c0262c" opacity="0.18" />
      <rect x="40" y="1400" width="1000" height="60" fill="#c0262c" opacity="0.05" />
      {/* charcos */}
      {[[200, 1460, 120], [780, 1500, 160], [480, 1540, 90]].map(([cx, cy, rx]) => (
        <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={rx * 0.16} fill="#8fa3bd" opacity="0.12" />
      ))}
      {/* poste con cartel 24H */}
      <rect x="975" y="500" width="22" height="620" fill="#3b414a" />
      <rect x="890" y="290" width="180" height="230" rx="10" fill="#14171c" stroke="#3b414a" strokeWidth="6" />
      <text x="980" y="380" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="74" fill="#ff3d3d" opacity={neon} style={{ filter: "drop-shadow(0 0 12px #ff2a2a)" }}>
        24H
      </text>
      {["1,689", "1,579"].map((p, i) => (
        <text key={p} x="980" y={440 + i * 52} textAnchor="middle" fontFamily="'DejaVu Sans Mono', monospace" fontSize="38" fill="#ffb347" opacity="0.9">
          {p}
        </text>
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ cartel de carretera
export const Carretera: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect width="1080" height="1920" fill="#04060a" />
    <path d="M0 1050 C200 1010 400 1040 600 1015 C800 990 950 1030 1080 1010 L1080 1920 L0 1920 Z" fill="#080b10" />
    {/* carretera en perspectiva */}
    <path d="M500 1060 L580 1060 L1180 1920 L-100 1920 Z" fill="#0d0f14" />
    {Array.from({ length: 8 }, (_, i) => {
      const z = ((i + (f / 12) % 1) / 8) ** 2;
      const y = 1060 + z * 860;
      const w = 4 + z * 26;
      return <rect key={i} x={540 - w / 2} y={y} width={w} height={8 + z * 70} fill="#b9a462" opacity={0.3 + z * 0.5} />;
    })}
    {/* cartel verde */}
    <rect x="300" y="760" width="18" height="460" fill="#59606a" />
    <rect x="762" y="760" width="18" height="460" fill="#59606a" />
    <rect x="200" y="560" width="680" height="330" rx="18" fill="#0f5a34" stroke="#e9efe9" strokeWidth="10" />
    <text x="540" y="650" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="44" fill="#e9efe9">
      PRÓXIMA GASOLINERA
    </text>
    <text x="540" y="800" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="140" fill="#e9efe9">
      80 km
    </text>
    {/* luz de faros barriendo el cartel */}
    <rect x="200" y="560" width="680" height="330" rx="18" fill="#fff" opacity={0.05 + 0.08 * Math.sin(f / 20)} />
  </g>
);

// ------------------------------------------------------------------ interior de la tienda en perspectiva
const VY = 860;
const esc = (z: number) => 1 / (1 + z * 0.32);
const P = (x: number, y: number, z: number): [number, number] => [540 + x * esc(z), VY + y * esc(z)];
const pts = (...ps: [number, number][]) => ps.map((p) => p.join(",")).join(" ");
const SUELO = 690;
const TECHO = -760;
const ALTO_ESTANTE = 120;
const FONDO = 9;

export type DesconocidoEnTienda = { x: number; z: number; pose?: "pie" | "andar"; paso?: number };

// apagadas: cuántos fluorescentes se han apagado empezando por el fondo
export const Tienda: React.FC<{ f: number; desconocido?: DesconocidoEnTienda | null; apagadas?: number; parpadea?: boolean }> = ({ f, desconocido = null, apagadas = 0, parpadea = true }) => {
  const tubos = [1, 3, 5, 7];
  const luz = parpadea ? parpadeo(f, "tubo", 0.05) : 1;
  const zOscuro = tubos.length - apagadas > 0 ? tubos[tubos.length - apagadas] - 1 : 0;
  const estante = (lado: number) => {
    const xi = lado * 250;
    const xo = lado * 640;
    const z0 = 0.6;
    const z1 = 7.6;
    const productos: React.ReactNode[] = [];
    for (let z = z0; z < z1 - 0.01; z += 0.5) {
      for (let n = 0; n < 4; n++) {
        const yT = ALTO_ESTANTE + n * 140 + 20;
        const yB = yT + 100;
        productos.push(
          <polygon
            key={`${z}-${n}`}
            points={pts(P(xi, yT, z + 0.06), P(xi, yT, z + 0.44), P(xi, yB, z + 0.44), P(xi, yB, z + 0.06))}
            fill={["#b5543f", "#4f7ea6", "#c9a943", "#5f8f58", "#8e5c9a", "#d1d1c4"][Math.floor(random(`prod${lado}${z}${n}`) * 6)]}
          />,
        );
      }
    }
    return (
      <g>
        <polygon points={pts(P(xi, ALTO_ESTANTE, z0), P(xi, ALTO_ESTANTE, z1), P(xi, SUELO, z1), P(xi, SUELO, z0))} fill="#8b8f94" />
        {productos}
        {[0, 1, 2, 3, 4].map((n) => (
          <polygon key={n} points={pts(P(xi, ALTO_ESTANTE + n * 140, z0), P(xi, ALTO_ESTANTE + n * 140, z1), P(xi, ALTO_ESTANTE + n * 140 + 14, z1), P(xi, ALTO_ESTANTE + n * 140 + 14, z0))} fill="#d6d9dc" />
        ))}
        <polygon points={pts(P(xi, ALTO_ESTANTE, z0), P(xo, ALTO_ESTANTE, z0), P(xo, ALTO_ESTANTE, z1), P(xi, ALTO_ESTANTE, z1))} fill="#c3c7cb" />
        <polygon points={pts(P(xi, ALTO_ESTANTE, z0), P(xo, ALTO_ESTANTE, z0), P(xo, SUELO, z0), P(xi, SUELO, z0))} fill="#6f7378" />
      </g>
    );
  };
  // el desconocido: más pequeño cuanto más al fondo
  const d = desconocido;
  return (
    <g>
      <rect width="1080" height="1920" fill="#2b2f33" />
      {/* techo */}
      <polygon points={pts(P(-900, TECHO, 0), P(900, TECHO, 0), P(900, TECHO, FONDO), P(-900, TECHO, FONDO))} fill="#3a3e43" />
      {/* suelo de baldosas */}
      <polygon points={pts(P(-900, SUELO, 0), P(900, SUELO, 0), P(900, SUELO, FONDO), P(-900, SUELO, FONDO))} fill="#c9c6bc" />
      {Array.from({ length: 18 }, (_, i) =>
        Array.from({ length: 12 }, (_, j) =>
          (i + j) % 2 === 0 ? (
            <polygon key={`${i}-${j}`} points={pts(P(-900 + i * 100, SUELO, j * 0.75), P(-800 + i * 100, SUELO, j * 0.75), P(-800 + i * 100, SUELO, (j + 1) * 0.75), P(-900 + i * 100, SUELO, (j + 1) * 0.75))} fill="#a9a69c" />
          ) : null,
        ),
      )}
      {/* pared del fondo con neveras */}
      <polygon points={pts(P(-900, TECHO, FONDO), P(900, TECHO, FONDO), P(900, SUELO, FONDO), P(-900, SUELO, FONDO))} fill="#4a4f55" />
      {[-2, -1, 0, 1].map((k) => (
        <polygon key={k} points={pts(P(k * 220 + 10, -260, FONDO), P(k * 220 + 210, -260, FONDO), P(k * 220 + 210, SUELO, FONDO), P(k * 220 + 10, SUELO, FONDO))} fill="#d9f0f4" opacity="0.8" />
      ))}
      {estante(-1)}
      {estante(1)}
      {d && <Desconocido x={P(d.x, SUELO, d.z)[0]} y={P(d.x, SUELO, d.z)[1]} escala={esc(d.z) * 1.05} pose={d.pose ?? "pie"} paso={d.paso} cabeza={-3} />}
      {/* fluorescentes */}
      {tubos.map((z, i) => {
        const encendido = i < tubos.length - apagadas;
        return <polygon key={z} points={pts(P(-110, TECHO + 4, z), P(110, TECHO + 4, z), P(110, TECHO + 4, z + 0.8), P(-110, TECHO + 4, z + 0.8))} fill={encendido ? "#fbfff4" : "#55595e"} opacity={encendido ? luz : 1} />;
      })}
      {/* zona apagada al fondo */}
      {apagadas > 0 && (
        <rect
          x={P(-900, 0, zOscuro)[0]}
          y={P(0, TECHO, zOscuro)[1]}
          width={P(900, 0, zOscuro)[0] - P(-900, 0, zOscuro)[0]}
          height={P(0, SUELO, zOscuro)[1] - P(0, TECHO, zOscuro)[1]}
          fill="#000"
          opacity="0.82"
        />
      )}
      {/* luz general que tiembla con el fluorescente */}
      <rect width="1080" height="1920" fill="#000" opacity={(1 - luz) * 0.5} />
    </g>
  );
};

// ------------------------------------------------------------------ la caja vista desde la cámara del techo
// encuadre "plano": se ve al dependiente; con agachado = true, el desconocido a sus pies
export const Caja: React.FC<{ f: number; agachado?: boolean }> = ({ f, agachado = false }) => (
  <g>
    <rect width="1080" height="1920" fill="#3c4046" />
    {/* suelo visto desde arriba en diagonal */}
    {Array.from({ length: 14 }, (_, i) =>
      Array.from({ length: 22 }, (_, j) => ((i + j) % 2 === 0 ? <rect key={`${i}-${j}`} x={i * 90 - 60} y={j * 90} width="90" height="90" fill="#33373c" /> : null)),
    )}
    {/* pasillos al fondo (arriba) */}
    {[120, 620].map((x) => (
      <g key={x}>
        <rect x={x} y="80" width="340" height="560" fill="#7b7f84" />
        <rect x={x + 10} y="90" width="320" height="540" fill="#a4a8ad" />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x={x + 20} y={110 + k * 88} width="300" height="60" fill={["#b5543f", "#4f7ea6", "#c9a943", "#5f8f58"][(k + x) % 4]} opacity="0.7" />
        ))}
      </g>
    ))}
    {/* mostrador */}
    <rect x="120" y="880" width="840" height="190" fill="#c8ccd1" />
    <rect x="120" y="1070" width="840" height="60" fill="#8f949a" />
    <rect x="660" y="905" width="200" height="130" rx="10" fill="#26292d" />
    <rect x="680" y="918" width="160" height="70" fill="#5dffa0" opacity="0.5" />
    <rect x="200" y="920" width="150" height="110" fill="#e6e1cf" />
    {/* tú, desde arriba y detrás: gorra, hombros, brazos en el mostrador */}
    <g transform="translate(560 1300) scale(0.8)">
      <ellipse cx="0" cy="60" rx="200" ry="80" fill="#000" opacity="0.25" />
      {/* brazos apoyados en el mostrador */}
      <path d="M-130 -10 L-160 -180 L-120 -250" stroke="#8d939c" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M130 -10 L160 -180 L120 -250" stroke="#8d939c" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="-118" cy="-268" r="26" fill="#d9a988" />
      <circle cx="118" cy="-268" r="26" fill="#d9a988" />
      {/* hombros y chaleco */}
      <ellipse cx="0" cy="20" rx="160" ry="80" fill="#8d939c" />
      <path d="M-120 0 C-120 60 -80 100 -40 100 L40 100 C80 100 120 60 120 0 C80 30 -80 30 -120 0 Z" fill="#b8282e" />
      {/* gorra vista desde arriba, con la visera hacia el mostrador */}
      <path d="M-50 -70 C-40 -130 40 -130 50 -70 Z" fill="#8f1c22" />
      <circle cx="0" cy="-20" r="72" fill="#b8282e" />
      <circle cx="0" cy="-20" r="10" fill="#8f1c22" />
    </g>
    {/* piernas que se pierden hacia abajo */}
    <rect x="500" y="1380" width="50" height="420" fill="#2c3443" />
    <rect x="570" y="1380" width="50" height="420" fill="#2c3443" />
    {agachado && (
      <g>
        <Desconocido x={330} y={1760} escala={0.95} pose="agachado" cabeza={-8 + Math.sin(f / 30) * 3} />
      </g>
    )}
  </g>
);

// ------------------------------------------------------------------ puerta de cristal vista desde dentro
// abierta: 0..1 (la hoja gira hacia fuera)
// fuera: lo que se ve al otro lado del cristal (por ejemplo, alguien de pie)
export const Puerta: React.FC<{ f: number; abierta?: number; vistaCamara?: boolean; fuera?: React.ReactNode }> = ({ f, abierta = 0, vistaCamara = false, fuera }) => {
  const anchoHoja = 520 * (1 - abierta * 0.75);
  return (
    <g>
      <rect width="1080" height="1920" fill="#2e3237" />
      {/* suelo */}
      <path d="M0 1500 L1080 1500 L1080 1920 L0 1920 Z" fill="#a9a69c" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${i * 100 - 100} 1920 L${270 + i * 50} 1500`} stroke="#8f8c84" strokeWidth="3" />
      ))}
      {/* hueco de la puerta: el exterior de noche */}
      <rect x="250" y="380" width="580" height="1120" fill="#0a0f18" />
      <rect x="250" y="1150" width="580" height="350" fill="#141b27" />
      <ellipse cx="540" cy="1260" rx="300" ry="70" fill="#fff6dc" opacity="0.12" />
      {/* surtidores lejanos */}
      {[380, 640].map((x) => (
        <g key={x}>
          <rect x={x} y="1080" width="60" height="140" fill="#cfd3d8" opacity="0.6" />
          <rect x={x} y="1080" width="60" height="34" fill="#c0262c" opacity="0.7" />
        </g>
      ))}
      <rect x="250" y="960" width="580" height="20" fill="#d6dbe1" opacity="0.4" />
      {fuera}
      {/* lluvia vista a través del cristal */}
      <g opacity="0.5">
        {Array.from({ length: 60 }, (_, i) => {
          const x = 260 + random(`pl${i}`) * 560;
          const y = ((random(`py${i}`) * 1200 + f * 42) % 1120) + 380;
          return <line key={i} x1={x} y1={y} x2={x + 6} y2={y - 50} stroke="#b9c7dc" strokeWidth="2" />;
        })}
      </g>
      {/* marco y hoja de cristal */}
      <rect x="230" y="360" width="620" height="20" fill="#75797f" />
      <rect x="230" y="360" width="20" height="1150" fill="#75797f" />
      <rect x="830" y="360" width="20" height="1150" fill="#75797f" />
      <g>
        <rect x="270" y="400" width={anchoHoja} height="1090" fill="#9fc3d6" opacity="0.1" stroke="#8b9096" strokeWidth="14" />
        <rect x={270 + anchoHoja - 70} y="900" width="16" height="200" rx="6" fill="#b6bbc1" />
        {abierta < 0.3 && (
          <g>
            <rect x="420" y="760" width="220" height="80" rx="8" fill="#1d2b1f" />
            <text x="530" y="814" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="40" fill="#6dff9b">
              ABIERTO
            </text>
          </g>
        )}
        {/* gotas en el cristal */}
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={280 + random(`gx${i}`) * (anchoHoja - 20)} cy={420 + random(`gy${i}`) * 1050} r={3 + random(`gr${i}`) * 6} fill="#dfe9f5" opacity="0.25" />
        ))}
      </g>
      {/* la campanita sobre la puerta */}
      <g transform={`translate(560 300) rotate(${vistaCamara ? Math.sin(f / 3) * 20 * abierta : 0})`}>
        <path d="M0 0 L0 40" stroke="#6b5a2a" strokeWidth="5" />
        <path d="M-26 70 C-26 40 26 40 26 70 L32 84 L-32 84 Z" fill="#c9a43e" />
      </g>
    </g>
  );
};
