import React from "react";

type Props = {
  x: number;
  y: number;
  escala: number;
  f: number;
  fase?: number; // desfase del balanceo para que cada barco se mueva distinto
  haciaEste?: boolean; // por defecto navega hacia el oeste (proa a la izquierda)
  velaCruz?: boolean; // la Santa María llevaba la cruz en la vela
  nombre?: string;
};

// Carabela vista de lado, en coordenadas locales (proa a la izquierda)
export const Barco: React.FC<Props> = ({ x, y, escala, f, fase = 0, haciaEste = false, velaCruz = false, nombre }) => {
  const balanceo = Math.sin((f + fase) / 9) * 3.5;
  const sube = Math.sin((f + fase) / 7) * 5;
  const viento = Math.sin((f + fase) / 5) * 4;
  return (
    <g transform={`translate(${x} ${y + sube * escala}) scale(${haciaEste ? -escala : escala} ${escala}) rotate(${balanceo})`}>
      {/* estela */}
      <path d="M 120 48 Q 170 55 230 50" stroke="rgba(255,255,255,0.6)" strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* mástiles */}
      <rect x={-54} y={-120} width={7} height={125} fill="#4e342e" />
      <rect x={6} y={-185} width={8} height={190} fill="#4e342e" />
      <rect x={66} y={-115} width={6} height={120} fill="#4e342e" />
      {/* velas cuadradas, hinchadas por el viento */}
      <path d={`M -82 -112 L -20 -112 Q ${-12 + viento} -80 -20 -48 L -82 -48 Q ${-74 + viento} -80 -82 -112 Z`} fill="#f5ecd7" stroke="#5d4037" strokeWidth={3} />
      <path d={`M -28 -175 L 50 -175 Q ${60 + viento} -125 50 -72 L -28 -72 Q ${-18 + viento} -125 -28 -175 Z`} fill="#f5ecd7" stroke="#5d4037" strokeWidth={3} />
      {velaCruz && (
        <g transform={`translate(${12 + viento * 0.5} -124)`}>
          <rect x={-6} y={-36} width={12} height={72} fill="#c62828" />
          <rect x={-30} y={-6} width={60} height={12} fill="#c62828" />
        </g>
      )}
      {/* vela latina (triangular) de mesana */}
      <path d={`M 70 -112 L 70 -40 L ${118 + viento} -42 Z`} fill="#efe3c6" stroke="#5d4037" strokeWidth={3} />
      {/* banderines */}
      <path d={`M 14 -185 L ${44 + viento} -178 L 14 -170 Z`} fill="#c62828" />
      <path d={`M -47 -120 L ${-26 + viento} -115 L -47 -110 Z`} fill="#fdd835" />
      {/* casco */}
      <path d="M -125 -14 L 128 -24 Q 122 30 92 52 L -70 52 Q -112 30 -125 -14 Z" fill="#8d5524" stroke="#3e2112" strokeWidth={5} />
      <path d="M -118 4 L 124 -4" stroke="#5d3a1a" strokeWidth={6} />
      <path d="M -105 24 L 112 20" stroke="#5d3a1a" strokeWidth={4} />
      {/* castillos de proa y popa */}
      <path d="M -125 -14 L -120 -40 L -78 -38 L -80 -12 Z" fill="#a0652f" stroke="#3e2112" strokeWidth={4} />
      <path d="M 70 -18 L 72 -58 L 132 -62 L 128 -24 Z" fill="#a0652f" stroke="#3e2112" strokeWidth={4} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={-60 + i * 30} cy={14} r={5} fill="#2b1608" />
      ))}
      {/* olas delante del casco */}
      <path
        d={`M -150 52 Q -125 ${40 + viento} -100 52 T -50 52 T 0 52 T 50 52 T 100 52 T 150 52`}
        stroke="#bbdefb"
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
      />
      {nombre && (
        <text
          x={0}
          y={110}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontWeight={900}
          fontSize={42}
          fill="#fff"
          stroke="#0a2c4f"
          strokeWidth={8}
          paintOrder="stroke"
          transform={haciaEste ? "scale(-1 1)" : undefined}
        >
          {nombre}
        </text>
      )}
    </g>
  );
};
