import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Freeze, Img, staticFile} from 'remotion';
import {ESCENARIOS, NombreEscenario} from '../sets/Escenarios';
import {Stage} from '../components/Clip';
import {Bedroom} from '../sets/Bedroom';
import {GymBackground, GymRunners} from '../sets/Gym';
import {GridBackground, CanadaFlag} from '../sets/Science';
import {TableBackground, Plate, Toast, FriedEgg} from '../sets/Table';
import {TvRoom} from '../sets/TvRoom';
import {Head} from '../characters/Head';
import {Runner, Treadmill} from '../characters/Runner';
import {Dormitorio, Escritorio, FondoCuerpo, CuartoOscuro, FondoSepia} from '../videos/sueno/sets';
import {Insomne, InsomneProps, PERSONAJES_INSOMNE} from '../videos/sueno/Insomne';
import {Donut, Hamburguesa, Patatas, Refresco, Taza, Vaso, Escudo, Virus, Cerebro, Calendario, Sombra, OjoFlotante} from '../videos/sueno/objetos';
import {TEMAS, NombreTema} from '../videos/temas';

const AZUL = '#0b0d22';

/** Lámina 1080x1920 con título y rejilla de miniaturas. */
const Lamina: React.FC<{titulo: string; sub: string; children: React.ReactNode}> = ({titulo, sub, children}) => {
  const [h] = useState(() => delayRender('fuentes'));
  useEffect(() => {
    Promise.all(['500', '800'].map((w) => document.fonts.load(`${w} 60px Poppins`))).then(() => continueRender(h));
  }, [h]);
  return (
  <AbsoluteFill style={{background: AZUL, fontFamily: 'Poppins', padding: '50px 36px', boxSizing: 'border-box'}}>
    <div style={{color: '#ffd84a', fontWeight: 800, fontSize: 64, lineHeight: 1}}>{titulo}</div>
    <div style={{color: '#c8c4e8', fontWeight: 500, fontSize: 30, margin: '12px 0 28px'}}>{sub}</div>
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center'}}>{children}</div>
  </AbsoluteFill>
  );
};

/** Miniatura: dibuja una escena completa de 1080x1920 reducida. */
const Mini: React.FC<{nombre: string; detalle?: string; children: React.ReactNode; filtro?: string; ancho?: number}> = ({nombre, detalle, children, filtro, ancho = 320}) => {
  const k = ancho / 1080;
  const alto = 1920 * k * 0.78;
  return (
    <div style={{width: ancho}}>
      <div style={{width: ancho, height: alto, borderRadius: 22, overflow: 'hidden', position: 'relative', border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 14px 30px rgba(0,0,0,0.5)'}}>
        <div style={{position: 'absolute', left: 0, top: -1920 * k * 0.12, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', filter: filtro}}>
          <Freeze frame={50}>{children}</Freeze>
        </div>
      </div>
      <div style={{color: '#fff', fontWeight: 800, fontSize: 30, marginTop: 10, textAlign: 'center'}}>{nombre}</div>
      {detalle && <div style={{color: '#9f9ac8', fontWeight: 500, fontSize: 22, textAlign: 'center', lineHeight: 1.2}}>{detalle}</div>}
    </div>
  );
};

const Leo: React.FC<InsomneProps & {x?: number; y?: number; esc?: number}> = ({x = 540, y = 1500, esc = 1.25, ...p}) => (
  <g transform={`translate(${x} ${y}) scale(${esc})`}>
    <Insomne parpadeo={false} {...p} />
  </g>
);

/* ------------------------------------------------ 1 · ESCENARIOS (vídeo sueño) */
export const CatalogoEscenarios: React.FC = () => (
  <Lamina titulo="Escenarios · 1" sub="Fondos dibujados en SVG, animados y con capas de profundidad">
    <Mini nombre="Dormitorio" detalle="noche · reloj · luna">
      <Stage><Dormitorio capa="fondo" minutos={23 * 60 + 50} id="c1" /><Leo cansancio={0.2} /><Dormitorio capa="frente" luzMovil={0.8} id="c1" /></Stage>
    </Mini>
    <Mini nombre="Dormitorio" detalle="amanecer · cálido">
      <Stage><Dormitorio capa="fondo" hora="amanecer" minutos={7 * 60 + 30} id="c2" /><Leo ojos={0} boca="dormido" giro={10} /><Dormitorio capa="frente" hora="amanecer" id="c2" /></Stage>
    </Mini>
    <Mini nombre="Escritorio" detalle="noche · ciudad · monitor">
      <Stage><Escritorio capa="fondo" id="c3" /><Leo y={1560} esc={1.2} cansancio={0.35} miradaY={0.35} /><Escritorio capa="frente" id="c3" /><g transform="translate(210 1300) scale(0.85)"><Taza /></g></Stage>
    </Mini>
    <Mini nombre="Dentro del cuerpo" detalle="azul · defensas">
      <Stage><FondoCuerpo id="c4" /><g transform="translate(300 900) scale(1.3)"><Escudo /></g><g transform="translate(820 700)"><Virus r={50} /></g><g transform="translate(160 1300)"><Virus r={36} /></g></Stage>
    </Mini>
    <Mini nombre="Mente" detalle="morado · confusión">
      <Stage><FondoCuerpo color="#2e1a55" id="c5" /><g transform="translate(540 900) scale(1.4)"><Cerebro /></g></Stage>
    </Mini>
    <Mini nombre="Alerta" detalle="rojo · tensión">
      <Stage><FondoCuerpo color="#5a0d1c" id="c6" /><Leo y={1640} esc={1.2} cansancio={1} ojos={1} pupilas={1} boca="abierta" cejas={1} sudor /></Stage>
    </Mini>
    <Mini nombre="Cuarto oscuro" detalle="terror · ojos en la sombra">
      <Stage>
        <CuartoOscuro id="c7" />
        {[[160, 520], [900, 420], [140, 980], [960, 900]].map(([x, y], i) => (<g key={i} transform={`translate(${x} ${y})`}><OjoFlotante r={36} semilla={i + 2} color="#ff3b4f" /></g>))}
        <g transform="translate(820 1250)"><Sombra alto={700} /></g>
      </Stage>
    </Mini>
    <Mini nombre="Archivo retro" detalle="sepia · periódico">
      <Stage>
        <FondoSepia id="c8" />
        <rect x={130} y={420} width={820} height={1100} fill="#efe2c4" transform="rotate(-3 540 970)" />
        <text x={540} y={560} textAnchor="middle" fontFamily="Georgia" fontWeight={900} fontSize={80} fill="#2a1c10" transform="rotate(-3 540 970)">EL DIARIO</text>
        <g transform="translate(540 1000) rotate(-3)"><Calendario dia={11} /></g>
      </Stage>
    </Mini>
    <Mini nombre="Mesa de comida" detalle="cocina · comida basura">
      <Stage>
        <TableBackground />
        <rect x={-60} y={1370} width={1200} height={620} fill="#7a4628" />
        <g transform="translate(200 1500) scale(0.9)"><Donut /></g>
        <g transform="translate(445 1530) scale(0.9)"><Hamburguesa /></g>
        <g transform="translate(690 1460) scale(0.9)"><Patatas /></g>
        <g transform="translate(905 1470) scale(0.9)"><Refresco /></g>
      </Stage>
    </Mini>
  </Lamina>
);

/* ------------------------------------------------ 2 · ESCENARIOS (vídeo calorías) */
export const CatalogoEscenarios2: React.FC = () => (
  <Lamina titulo="Escenarios · 2" sub="Del vídeo «¿Quema calorías la cama?»">
    <Mini nombre="Habitación pareja" detalle="noche · manta de corazones">
      <Stage><Bedroom modo="despiertos" idPrefix="k1" /></Stage>
    </Mini>
    <Mini nombre="Gimnasio" detalle="cintas · ciudad">
      <Stage><GymBackground /><GymRunners /></Stage>
    </Mini>
    <Mini nombre="Laboratorio" detalle="cuadrícula científica">
      <Stage><GridBackground idPrefix="k3" /><CanadaFlag x={250} y={640} w={600} /></Stage>
    </Mini>
    <Mini nombre="Mesa" detalle="platos · luz cálida">
      <Stage><TableBackground /><Plate x={290} y={1300} scale={1.05}><Toast /></Plate><Plate x={800} y={1360} scale={1.05}><FriedEgg /></Plate></Stage>
    </Mini>
    <Mini nombre="Salón con tele" detalle="sofá · luz de pantalla">
      <Stage><TvRoom /></Stage>
    </Mini>
    <Mini nombre="Habitación dormidos" detalle="Zzz · paso del tiempo">
      <Stage><Bedroom modo="dormidos" movimiento={0.3} corazones={false} llamas={false} idPrefix="k6" /></Stage>
    </Mini>
  </Lamina>
);

/* ------------------------------------------------ 3 · PERSONAJES */
export const CatalogoPersonajes: React.FC = () => {
  const nombres = Object.keys(PERSONAJES_INSOMNE);
  return (
    <Lamina titulo="Personajes" sub="Mismo dibujo, identidades distintas · listos para cualquier vídeo">
      {nombres.map((n, i) => {
        const p = PERSONAJES_INSOMNE[n];
        const fondo = ['#1d2366', '#4a1d3a', '#123d2e', '#4a3214', '#2a1d55', '#123a52'][i];
        return (
          <Mini key={n} nombre={n[0].toUpperCase() + n.slice(1)} detalle={`pelo ${p.peinado}${p.gafas ? ' · gafas' : ''}`}>
            <Stage>
              <rect width={1080} height={1920} fill={fondo} />
              <circle cx={540} cy={1150} r={520} fill="#fff" opacity={0.06} />
              <Leo y={1620} esc={1.6} colores={p.colores} peinado={p.peinado} gafas={p.gafas} boca="sonrisa" semilla={i + 1} />
            </Stage>
          </Mini>
        );
      })}
      <Mini nombre="Pareja" detalle="él y ella · expresiones">
        <Stage>
          <rect width={1080} height={1920} fill="#2c1f4d" />
          <g transform="translate(360 1150)"><Head who="el" r={190} expr="feliz" /></g>
          <g transform="translate(730 1150)"><Head who="ella" r={185} expr="risa" /></g>
        </Stage>
      </Mini>
      <Mini nombre="Corredores" detalle="articulados · animados">
        <Stage>
          <rect width={1080} height={1920} fill="#35407a" />
          <g transform="translate(540 1700) scale(1.8)"><Treadmill x={0} y={0} /><Runner x={-10} y={-215} who="el" period={20} /></g>
        </Stage>
      </Mini>
      <Mini nombre="Presentador" detalle="traje marrón · 8 poses">
        <AbsoluteFill style={{background: '#3a2a20'}}>
          <Img src={staticFile('poses/explicar.png')} style={{position: 'absolute', left: -280, top: 600, width: 1640}} />
        </AbsoluteFill>
      </Mini>
    </Lamina>
  );
};

/* ------------------------------------------------ 4 · EXPRESIONES */
const EXPRESIONES: {n: string; d: string; p: InsomneProps}[] = [
  {n: 'Descansado', d: 'día 0', p: {cansancio: 0, boca: 'sonrisa'}},
  {n: 'Cansado', d: 'ojeras · párpados', p: {cansancio: 0.45, ojos: 0.9, boca: 'neutra'}},
  {n: 'Preocupado', d: 'cejas arriba', p: {cansancio: 0.3, cejas: 1, boca: 'preocupada'}},
  {n: 'Asustado', d: 'pupilas dilatadas', p: {cansancio: 0.6, ojos: 1, pupilas: 1, cejas: 1, boca: 'abierta'}},
  {n: 'Paranoico', d: 'mirada lateral · sudor', p: {cansancio: 0.8, miradaX: 0.9, cejas: 1, boca: 'nerviosa', sudor: true}},
  {n: 'Comiendo', d: 'boca mordida', p: {cansancio: 0.5, miradaY: 0.6, boca: 'mordida', cejas: -0.2}},
  {n: 'Zombi', d: 'bostezo · palidez', p: {cansancio: 1, ojos: 0.5, boca: 'bostezo', cejas: -0.3}},
  {n: 'Cabeceando', d: 'microsueño', p: {cansancio: 0.7, ojos: 0, cabeceo: 0.9, boca: 'dormido'}},
  {n: 'Dormido', d: 'recuperación', p: {cansancio: 0, ojos: 0, boca: 'dormido', giro: 10}},
];
export const CatalogoExpresiones: React.FC = () => (
  <Lamina titulo="Expresiones" sub="El protagonista empeora o mejora con un solo parámetro: cansancio 0 → 1">
    {EXPRESIONES.map((e, i) => (
      <Mini key={e.n} nombre={e.n} detalle={e.d}>
        <Stage>
          <rect width={1080} height={1920} fill={`hsl(${230 + i * 14}, 45%, ${22 - e.p.cansancio! * 6}%)`} />
          <Leo y={1640} esc={1.65} {...e.p} semilla={3} />
        </Stage>
      </Mini>
    ))}
  </Lamina>
);

/* ------------------------------------------------ 5 · TEMAS DE COLOR */
export const CatalogoTemas: React.FC = () => (
  <Lamina titulo="Temas de color" sub="Se aplican a cualquier escena con una línea: TEMAS.nombre.filtro">
    {(Object.keys(TEMAS) as NombreTema[]).map((t) => (
      <Mini key={t} nombre={TEMAS[t].nombre} detalle={t} filtro={TEMAS[t].filtro}>
        <Stage>
          <Dormitorio capa="fondo" minutos={2 * 60 + 15} id={`t${t}`} />
          <Leo cansancio={0.5} miradaX={0.4} />
          <Dormitorio capa="frente" luzMovil={0.8} id={`t${t}`} />
          <g transform="translate(880 1240) scale(0.7)"><Vaso /></g>
        </Stage>
      </Mini>
    ))}
  </Lamina>
);

/* ------------------------------------------------ 6 · PRESENTADOR */
const POSES = ['original', 'explicar', 'senalar', 'alerta', 'cruzados', 'leer', 'saludar', 'no'];
export const CatalogoPresentador: React.FC = () => (
  <Lamina titulo="Presentador" sub="Poses disponibles (public/poses) · gestos sincronizados con la voz">
    {POSES.map((p) => (
      <Mini key={p} nombre={p}>
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 60%, #5a4030, #1e140e)'}}>
          <Img src={staticFile(`poses/${p}.png`)} style={{position: 'absolute', left: -280, top: 560, width: 1640}} />
        </AbsoluteFill>
      </Mini>
    ))}
    <Mini nombre="Objetos" detalle="taza · vaso · escudo · cerebro…">
      <Stage>
        <rect width={1080} height={1920} fill="#1b1838" />
        <g transform="translate(300 600)"><Taza /></g>
        <g transform="translate(780 600)"><Vaso /></g>
        <g transform="translate(300 1050)"><Escudo grieta={0.6} /></g>
        <g transform="translate(780 1050) scale(0.8)"><Cerebro /></g>
        <g transform="translate(300 1480)"><Donut /></g>
        <g transform="translate(780 1480)"><Calendario dia={7} /></g>
      </Stage>
    </Mini>
  </Lamina>
);

/* ------------------------------------------------ 7 · ESCENARIOS NUEVOS */
const MiniEscenario: React.FC<{n: NombreEscenario}> = ({n}) => {
  const E = ESCENARIOS[n];
  return (
    <Mini nombre={E.nombre} detalle={E.detalle}>
      <Stage>
        <E.C id={`m${n}`} />
      </Stage>
    </Mini>
  );
};
const NUEVOS: NombreEscenario[] = ['ciudadNoche', 'parque', 'playa', 'espacio', 'bosque', 'hospital', 'aula', 'oficina', 'montana'];
export const CatalogoEscenarios3: React.FC = () => (
  <Lamina titulo="Escenarios · 3" sub="Biblioteca nueva (src/sets/Escenarios.tsx) · animados y con capas fondo/frente">
    {NUEVOS.map((n) => (
      <MiniEscenario key={n} n={n} />
    ))}
  </Lamina>
);

const COMBOS: {e: NombreEscenario; p: keyof typeof PERSONAJES_INSOMNE; t: NombreTema; ins: InsomneProps}[] = [
  {e: 'playa', p: 'sara', t: 'original', ins: {boca: 'sonrisa', miradaX: 0.3}},
  {e: 'espacio', p: 'malik', t: 'original', ins: {boca: 'abierta', pupilas: 0.8, cejas: 1}},
  {e: 'aula', p: 'yuki', t: 'original', ins: {boca: 'neutra', miradaY: -0.5, miradaX: -0.4}},
  {e: 'oficina', p: 'hugo', t: 'original', ins: {cansancio: 0.5, boca: 'bostezo'}},
  {e: 'montana', p: 'nora', t: 'frio', ins: {boca: 'sonrisa', miradaY: -0.6}},
];
export const CatalogoEscenarios4: React.FC = () => (
  <Lamina titulo="Escenarios · 4" sub="Más escenarios y ejemplos combinando personaje + escenario + tema">
    {(['marino', 'desierto', 'laboratorio', 'cocina'] as NombreEscenario[]).map((n) => (
      <MiniEscenario key={n} n={n} />
    ))}
    {COMBOS.map((c, i) => {
      const E = ESCENARIOS[c.e].C;
      const P = PERSONAJES_INSOMNE[c.p];
      return (
        <Mini key={i} nombre={`${c.p[0].toUpperCase()}${c.p.slice(1)} · ${ESCENARIOS[c.e].nombre}`} detalle={`ejemplo · tema ${TEMAS[c.t].nombre.toLowerCase()}`} filtro={TEMAS[c.t].filtro}>
          <Stage>
            <E capa="fondo" id={`cb${i}`} />
            <Leo y={1600} esc={1.25} colores={P.colores} peinado={P.peinado} gafas={P.gafas} semilla={i + 2} {...c.ins} />
            <E capa="frente" id={`cb${i}`} />
          </Stage>
        </Mini>
      );
    })}
  </Lamina>
);

export const LAMINAS = {
  'Catalogo-Escenarios-3': CatalogoEscenarios3,
  'Catalogo-Escenarios-4': CatalogoEscenarios4,
  'Catalogo-Escenarios-1': CatalogoEscenarios,
  'Catalogo-Escenarios-2': CatalogoEscenarios2,
  'Catalogo-Personajes': CatalogoPersonajes,
  'Catalogo-Expresiones': CatalogoExpresiones,
  'Catalogo-Temas': CatalogoTemas,
  'Catalogo-Presentador': CatalogoPresentador,
};
