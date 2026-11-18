// Gancho en 3D: tú, temblando en el Polo Norte de noche (aurora, iglú), mientras el termómetro se desploma.
// Render con --gl=swangle (≈4 s/fotograma). con3D=false dibuja un fondo 2D (para previsualizar rápido).
import React from "react";
import { AbsoluteFill } from "remotion";
import { Mundo } from "../comun/Escenarios3D";
import { lerp3, Persona, tramo as tramo3 } from "../comun/Mundo3D";
import { Tobias } from "../comun/Personajes3D";
import { Cuenta, Escarcha, Fondo, Nieve, Rotulo, Sello, tramo, CIAN } from "./Piezas";

export const Gancho3D: React.FC<{ f: number; dur: number; en: (p: string, n?: number) => number; con3D: boolean }> = ({ f, dur, en, con3D }) => {
  const tt = en("tiempo");
  const ta = en("atrapado");
  const tc = en("cero?");
  const tiembla = Math.sin(f * 2.6) * 0.012 + Math.sin(f * 4.1) * 0.006;
  return (
    <AbsoluteFill>
      {con3D ? (
        <Mundo escenario="poloNorte" f={f} camara={lerp3([0.8, 2.3, 9.5], [0.3, 1.9, 6.6], tramo3(f, 0, dur + 20))} mira={[0, 1.75, 0]}>
          <Persona
            f={f}
            pos={[tiembla, 0, 0]}
            giro={-0.15}
            semilla={11}
            piel="#cfb2a4"
            pelo="#2a1a10"
            camisa="#e8433a"
            pantalon="#3b4f7a"
            estilo={{ pelo: "corto", zapatos: "#f2f2f2", cinturon: false, cuello: null, mangas: "#e8433a", ojos: "#3a2414" }}
            pose={{ brazoIzq: 0.35, brazoDer: 0.35, adelanteIzq: 1.25, adelanteDer: 1.25, codoIzq: 2.3, codoDer: 2.3, boca: "sorpresa", inclinar: 0.12, cabeza: Math.sin(f * 2.2) * 0.05 }}
          />
          <Tobias f={f} pos={[1.5, 0, -1.2]} giro={-0.6} escala={0.8} accion={f > tc ? "pensar" : "reposo"} />
        </Mundo>
      ) : (
        <Fondo f={f} de="#22336b" a="#050d26" escarcha={0} />
      )}
      <Nieve f={f} n={80} viento={0.8} semilla="g" />
      <Escarcha intensidad={0.3 + tramo(f, 0, dur) * 0.6} f={f} />
      <Rotulo f={f} inicio={0} texto={"¿CUÁNTO\nTIEMPO"} y={250} tam={130} color="#fff" />
      <Rotulo f={f} inicio={tt + 2} texto="SOBREVIVIRÍAS?" y={530} tam={104} color={CIAN} giro={-2} />
      <Rotulo f={f} inicio={ta} texto="ATRAPADO EN EL HIELO" y={690} tam={50} fondo="#fff" color="#0b2a5c" />
      <Cuenta f={f} a={ta} b={dur} desde={5} hasta={-30} sufijo="°C" y={1240} x={300} tam={150} color={f > tc ? CIAN : "#fff"} />
      <Sello f={f} inicio={tc} x={330} y={1480} texto="BAJO CERO" color="#1b4fb8" tam={80} giro={-7} />
    </AbsoluteFill>
  );
};
