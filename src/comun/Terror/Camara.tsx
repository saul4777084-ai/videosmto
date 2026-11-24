import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { Textura } from "./Efectos";

export type ModoCamara = "REC" | "DIRECTO" | "GRABACION" | "REBOBINAR";

const dosCifras = (n: number) => String(Math.floor(n)).padStart(2, "0");
export const reloj = (segundos: number) => {
  const s = ((Math.floor(segundos) % 86400) + 86400) % 86400;
  return `${dosCifras(s / 3600)}:${dosCifras((s % 3600) / 60)}:${dosCifras(s % 60)}`;
};
// "03:33:12" → segundos
export const hora = (texto: string) => texto.split(":").reduce((t, p) => t * 60 + Number(p), 0);

type Props = {
  f: number;
  etiqueta: string; // "CAM 02 · SURTIDORES"
  inicio: string; // hora del primer frame, "03:33:12"
  modo?: ModoCamara;
  saltos?: number[]; // frames con salto de imagen (glitch)
  mini?: boolean; // dentro de un monitor: letra pequeña
  velocidad?: number; // segundos de grabación por segundo real (negativo = rebobinando)
  children: React.ReactNode;
};

// Cámara de seguridad con visión nocturna verde: REC, hora, etiqueta, líneas de barrido y saltos de imagen.
export const CamaraSeguridad: React.FC<Props> = ({ f, etiqueta, inicio, modo = "REC", saltos = [], mini = false, velocidad = 1, children }) => {
  // salto de imagen: 5 frames de interferencia
  const salto = saltos.find((s) => f >= s && f < s + 5);
  const enSalto = salto !== undefined;
  const k = enSalto ? f - (salto as number) : 0;
  const dx = enSalto ? (random(`sx${salto}${k}`) - 0.5) * 90 : 0;
  const brillo = enSalto ? 1.6 - k * 0.1 : 1.22;
  const t = hora(inicio) + (f / 30) * (modo === "REBOBINAR" ? -Math.abs(velocidad) * 40 : velocidad);
  const fs = mini ? 15 : 30;
  const pad = mini ? 12 : 54;
  const parpadeo = Math.floor(f / 15) % 2 === 0;
  const textoModo = { REC: "REC", DIRECTO: "DIRECTO", GRABACION: "GRABACIÓN", REBOBINAR: "REBOBINANDO" }[modo];

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill
        style={{
          filter: `grayscale(1) contrast(1.12) brightness(${brillo})`,
          transform: `translateX(${dx}px)${enSalto ? ` skewX(${(random(`sk${salto}${k}`) - 0.5) * 6}deg)` : ""}`,
        }}
      >
        {children}
        {!mini && <Textura opacidad={0.5} />}
      </AbsoluteFill>
      {/* verde de visión nocturna: los blancos se vuelven verde menta y los negros, verde oscuro */}
      <AbsoluteFill style={{ background: "#66ff95", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "#0c3a1c", mixBlendMode: "screen" }} />
      {/* líneas de barrido y una banda que baja despacio */}
      <AbsoluteFill style={{ background: `repeating-linear-gradient(rgba(0,0,0,0.16) 0 ${mini ? 1 : 2}px, rgba(0,0,0,0) ${mini ? 1 : 2}px ${mini ? 3 : 5}px)` }} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(rgba(255,255,255,0) ${((f * 0.6) % 120) - 20}%, rgba(200,255,210,0.07) ${((f * 0.6) % 120) - 12}%, rgba(255,255,255,0) ${((f * 0.6) % 120) - 4}%)`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,20,8,0.7) 100%)" }} />
      {enSalto && (
        <AbsoluteFill style={{ opacity: interpolate(k, [0, 4], [0.7, 0]) }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${random(`by${salto}${k}${i}`) * 100}%`,
                height: `${2 + random(`bh${salto}${k}${i}`) * 9}%`,
                background: "rgba(210,255,220,0.55)",
                transform: `translateX(${(random(`bx${salto}${k}${i}`) - 0.5) * 200}px)`,
              }}
            />
          ))}
        </AbsoluteFill>
      )}
      {/* interfaz de la cámara */}
      <div style={{ position: "absolute", inset: 0, fontFamily: "'DejaVu Sans Mono', 'Courier New', monospace", color: "#e4ffe9", fontSize: fs, letterSpacing: 1, textShadow: "0 0 6px rgba(120,255,160,0.6)" }}>
        <div style={{ position: "absolute", left: pad, top: mini ? pad : 420, display: "flex", alignItems: "center", gap: fs * 0.4 }}>
          {modo === "REC" || modo === "DIRECTO" ? (
            <span style={{ width: fs * 0.6, height: fs * 0.6, borderRadius: "50%", background: "#ff3b30", opacity: parpadeo ? 1 : 0.25, boxShadow: "0 0 8px #ff3b30" }} />
          ) : (
            <span>{modo === "REBOBINAR" ? "◀◀" : "▶"}</span>
          )}
          <span>{textoModo}</span>
        </div>
        <div style={{ position: "absolute", right: pad, top: mini ? pad : 420 }}>{reloj(t)}</div>
        <div style={{ position: "absolute", left: pad, bottom: mini ? pad : 430 }}>{etiqueta}</div>
      </div>
    </AbsoluteFill>
  );
};

export type Pantalla = { etiqueta: string; inicio: string; modo?: ModoCamara; nodo: React.ReactNode; saltos?: number[] };

// Mesa con pared de monitores vista desde la silla del vigilante
export const Monitores: React.FC<{ f: number; pantallas: Pantalla[]; columnas?: number; arriba?: number }> = ({ f, pantallas, columnas = 2, arriba = 470 }) => {
  const filas = Math.ceil(pantallas.length / columnas);
  const ancho = 960 / columnas;
  const alto = Math.min(470, 920 / filas);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#0b0f14, #11161d 60%, #1d1712 75%, #120e0a)" }}>
      {pantallas.map((p, i) => {
        const col = i % columnas;
        const fila = Math.floor(i / columnas);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 60 + col * ancho,
              top: arriba + fila * alto,
              width: ancho - 16,
              height: alto - 16,
              background: "#2a2f35",
              borderRadius: 14,
              padding: 12,
              boxShadow: "0 0 50px rgba(90,255,140,0.18), inset 0 0 0 2px #3a4048",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 6, overflow: "hidden" }}>
              <CamaraSeguridad f={f} etiqueta={p.etiqueta} inicio={p.inicio} modo={p.modo} saltos={p.saltos} mini>
                {p.nodo}
              </CamaraSeguridad>
            </div>
          </div>
        );
      })}
      {/* mesa: teclado, taza y papeles */}
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <path d="M0 1500 L1080 1460 L1080 1920 L0 1920 Z" fill="#3a2c20" />
        <path d="M0 1500 L1080 1460 L1080 1480 L0 1520 Z" fill="#4a3828" />
        <rect x="260" y="1560" width="470" height="120" rx="12" fill="#22262b" transform="rotate(-3 495 1620)" />
        {Array.from({ length: 36 }, (_, i) => (
          <rect key={i} x={278 + (i % 12) * 37} y={1575 + Math.floor(i / 12) * 34} width="30" height="26" rx="4" fill="#33383e" transform="rotate(-3 495 1620)" />
        ))}
        <rect x="810" y="1540" width="110" height="130" rx="14" fill="#b8392b" />
        <ellipse cx="865" cy="1540" rx="55" ry="16" fill="#2b130e" />
        <path d="M920 1570 q45 10 0 70" stroke="#b8392b" strokeWidth="16" fill="none" />
        <rect x="60" y="1600" width="180" height="230" fill="#e9e4d6" transform="rotate(-8 150 1715)" />
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x="80" y={1630 + i * 28} width={140 - (i % 3) * 25} height="6" fill="#b5ae9c" transform="rotate(-8 150 1715)" />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};
