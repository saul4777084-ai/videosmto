import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EFECTOS_DISPONIBLES } from "../comun/tipos";
import duraciones from "./duraciones.json";

// Video que reproduce cada efecto de sonido con su nombre en pantalla, para elegir de oído.
const ICONOS: Record<string, string> = { interfaz: "📱", movimiento: "💨", clima: "⛈️", agua: "💧", hielo: "🧊", golpes: "🚪", fuego: "🔥" };
const COLORES: Record<string, string> = {
  interfaz: "#7b2ff7",
  movimiento: "#00897b",
  clima: "#37474f",
  agua: "#0277bd",
  hielo: "#4fc3f7",
  golpes: "#6d4c41",
  fuego: "#e65100",
};

const MAX = 2.6; // segundos máximos por sonido
const PAUSA = 0.35;

export const LISTA = Object.entries(EFECTOS_DISPONIBLES).flatMap(([cat, nombres]) =>
  nombres.map((n) => ({ cat, nombre: n as string, seg: Math.min(MAX, (duraciones as Record<string, number>)[n] ?? 1) + PAUSA })),
);
export const DURACION_MUESTRARIO = Math.ceil(LISTA.reduce((t, s) => t + s.seg, 0) * 30);

const Tarjeta: React.FC<{ cat: string; nombre: string; numero: number; dur: number }> = ({ cat, nombre, numero, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 11 } });
  const progreso = interpolate(f, [0, dur], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${COLORES[cat]}, #0b0b16)`, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 50, color: "rgba(255,255,255,0.7)", fontFamily: "system-ui", fontWeight: 800, letterSpacing: 4, position: "absolute", top: 260 }}>
        {ICONOS[cat]} {cat.toUpperCase()}
      </div>
      <div style={{ transform: `scale(${s})`, textAlign: "center" }}>
        <div style={{ fontSize: 60, color: "#ffd93b", fontFamily: "system-ui", fontWeight: 900 }}>#{numero}</div>
        <div style={{ fontSize: 120, color: "#fff", fontFamily: "system-ui", fontWeight: 900, textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>{nombre}</div>
        <div style={{ fontSize: 40, color: "rgba(255,255,255,0.75)", fontFamily: "monospace", marginTop: 20 }}>"{nombre}"</div>
      </div>
      <div style={{ position: "absolute", bottom: 300, left: 140, right: 140, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.2)" }}>
        <div style={{ width: `${progreso * 100}%`, height: "100%", borderRadius: 8, background: "#ffd93b" }} />
      </div>
    </AbsoluteFill>
  );
};

export const Muestrario: React.FC = () => {
  let desde = 0;
  return (
    <AbsoluteFill style={{ background: "#0b0b16" }}>
      {LISTA.map((s, i) => {
        const dur = Math.round(s.seg * 30);
        const el = (
          <Sequence key={s.nombre} from={desde} durationInFrames={dur}>
            <Tarjeta cat={s.cat} nombre={s.nombre} numero={i + 1} dur={dur} />
            <Audio src={staticFile(`sfx/${s.nombre}.wav`)} volume={0.9} durationInFrames={Math.round((s.seg - PAUSA) * 30)} />
          </Sequence>
        );
        desde += dur;
        return el;
      })}
    </AbsoluteFill>
  );
};
