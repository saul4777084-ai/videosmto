import React from 'react';
import {AbsoluteFill, Composition, Folder, Still, useCurrentFrame} from 'remotion';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import {Video, ESCENA_COMPONENTES} from './Video';
import {VIDEO} from './config/video';
import {ESCENAS} from './config/escenas';
import {CAMARA} from './config/camara';
import {esquemaCamara, ConfigCalorias} from './camera/esquema';
import {ProveedorCamara} from './camera/Camara';
import {calcularMetadatos, crearCalcularMetadatos} from './audio/metadatos';
import {VideoSueno} from './videos/sueno/VideoSueno';
import {CAMARA_SUENO} from './videos/sueno/camara';
import {ESCENAS_SUENO, NOMBRES_PLANO_SUENO, SUBTITULOS_SUENO, VIDEO_SUENO} from './videos/sueno/config';
import {ESCENA_COMPONENTES_SUENO} from './videos/sueno/escenas';
import {crearEsquemaCamara} from './camera/esquema';
import {LAMINAS} from './catalogo/Catalogo';
import {CAMARA_25D, Demo25D, DURACION_DEMO_25D, REPARTO_25D} from './mundo25d/Demo25D';
import {Demo3D, DURACION_DEMO_3D} from './mundo3d/Demo3D';
import {Catalogo3DEscenarios, Catalogo3DPersonajes} from './mundo3d/Catalogo3D';
import {AvatarAyuno, DURACION_AYUNO, FPS_AYUNO, TOMAS_AYUNO, VideoAyuno} from './videos/ayuno/VideoAyuno';
import {TOMAS as TOMAS_AYUNO_C} from './videos/ayuno/tomas';
import {DURACION_COLA, FPS_COLA, VideoCola} from './videos/cola/VideoCola';
import {DURACION_MOVIL, FPS_MOVIL, TOMAS_MOVIL, VideoMovil} from './videos/movil/VideoMovil';
import {TOMAS as TOMAS_MOVIL_C} from './videos/movil/VideoMovil';
import {calcularMetadatosResumen, FPS_RESUMEN, ResumenPelicula} from './videos/resumen/ResumenPelicula';
import type {PropsResumen} from './videos/resumen/tipos';
import EJEMPLO_RESUMEN from '../resumenes/nosferatu/props.json';

const esquema25D = crearEsquemaCamara(REPARTO_25D.map((r) => r.e));

const esquemaSueno = crearEsquemaCamara(NOMBRES_PLANO_SUENO);
const metadatosSueno = crearCalcularMetadatos(SUBTITULOS_SUENO, VIDEO_SUENO.duracionSegundos, VIDEO_SUENO.fps);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Resumen de película: plantilla genérica (props = resumenes/<slug>/props.json, ver tools/resumen.py) */}
      <Composition
        id="ResumenPelicula"
        component={ResumenPelicula}
        defaultProps={EJEMPLO_RESUMEN as unknown as PropsResumen}
        calculateMetadata={calcularMetadatosResumen}
        durationInFrames={FPS_RESUMEN * 60}
        fps={FPS_RESUMEN}
        width={1080}
        height={1920}
      />
      <Composition
        id="CaloriasCama"
        component={Video}
        schema={esquemaCamara}
        defaultProps={CAMARA}
        calculateMetadata={calcularMetadatos}
        durationInFrames={Math.round(VIDEO.duracionSegundos * VIDEO.fps)}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />
      {/* Mundo 2.5D: vídeo de muestra */}
      <Composition
        id="Mundo25D"
        component={Demo25D}
        schema={esquema25D}
        defaultProps={CAMARA_25D as never}
        durationInFrames={Math.round(DURACION_DEMO_25D * 30)}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ¿Qué le pasa a tu cuerpo si tomas Coca-Cola durante 30 días? (3D médico, sin audio) */}
      <Composition id="CocaCola30Dias" component={VideoCola} durationInFrames={Math.round(DURACION_COLA * FPS_COLA)} fps={FPS_COLA} width={1080} height={1920} />
      {/* ¿Qué le pasa a tu cerebro si usas el móvil 8 horas al día durante 30 días? (3D médico) */}
      <Composition id="Movil8Horas" component={VideoMovil} defaultProps={{subtitulos: true, audio: false}} durationInFrames={Math.round(DURACION_MOVIL * FPS_MOVIL)} fps={FPS_MOVIL} width={1080} height={1920} />
      <Folder name="Movil-Tomas">
        {TOMAS_MOVIL.map((tm) => {
          const C = TOMAS_MOVIL_C[tm.toma];
          const d = tm.fin - tm.inicio;
          const Toma: React.FC = () => {
            const f = useCurrentFrame();
            return <C t={f / FPS_MOVIL} d={d} />;
          };
          return <Composition key={tm.toma} id={`Movil-${tm.toma}`} component={Toma} durationInFrames={Math.max(1, Math.round(d * FPS_MOVIL))} fps={FPS_MOVIL} width={1080} height={1920} />;
        })}
      </Folder>
      {/* ¿Qué sucede dentro de tu cuerpo si pasas 7 días sin comer? (3D médico) */}
      <Composition id="SieteDiasSinComer" component={VideoAyuno} durationInFrames={Math.round(DURACION_AYUNO * FPS_AYUNO)} fps={FPS_AYUNO} width={1080} height={1920} />
      {/* Solo el avatar, con fondo transparente, para componerlo sobre un vídeo ya renderizado */}
      <Composition id="SieteDiasSinComer-Avatar" component={AvatarAyuno} durationInFrames={Math.round(DURACION_AYUNO * FPS_AYUNO)} fps={FPS_AYUNO} width={1080} height={1920} />
      <Folder name="Ayuno-Tomas">
        {TOMAS_AYUNO.map((tm) => {
          const C = TOMAS_AYUNO_C[tm.toma];
          const d = tm.fin - tm.inicio;
          const Toma: React.FC = () => {
            const f = useCurrentFrame();
            return <C t={f / FPS_AYUNO} d={d} />;
          };
          return <Composition key={tm.toma} id={`Ayuno-${tm.toma}`} component={Toma} durationInFrames={Math.max(1, Math.round(d * FPS_AYUNO))} fps={FPS_AYUNO} width={1080} height={1920} />;
        })}
      </Folder>
      {/* Mundo 3D (three.js): vídeo de muestra y láminas */}
      <Composition id="Mundo3D" component={Demo3D} durationInFrames={Math.round(DURACION_DEMO_3D * 30)} fps={30} width={1080} height={1920} />
      <Folder name="Catalogo3D">
        <Still id="Catalogo-3D-Escenarios" component={Catalogo3DEscenarios} width={1080} height={1920} />
        <Still id="Catalogo-3D-Personajes" component={Catalogo3DPersonajes} width={1080} height={1920} />
      </Folder>
      {/* Catálogo de escenarios, personajes, expresiones y temas (imágenes) */}
      <Folder name="Catalogo">
        {Object.entries(LAMINAS).map(([id, C]) => (
          <Still key={id} id={id} component={C} width={1080} height={1920} />
        ))}
      </Folder>
      {/* ¿Qué pasaría si dejaras de dormir 7 días? */}
      <Composition
        id="SieteDiasSinDormir"
        component={VideoSueno}
        schema={esquemaSueno}
        defaultProps={CAMARA_SUENO as never}
        calculateMetadata={metadatosSueno as never}
        durationInFrames={Math.round(VIDEO_SUENO.duracionSegundos * VIDEO_SUENO.fps)}
        fps={VIDEO_SUENO.fps}
        width={VIDEO_SUENO.ancho}
        height={VIDEO_SUENO.alto}
      />
      <Folder name="Sueno-Escenas">
        {(Object.keys(ESCENA_COMPONENTES_SUENO) as (keyof typeof ESCENA_COMPONENTES_SUENO)[]).map((k) => {
          const C = ESCENA_COMPONENTES_SUENO[k];
          const e = ESCENAS_SUENO[k];
          return (
            <Composition
              key={k}
              id={`Sueno-${k}`}
              component={(props: typeof CAMARA_SUENO) => (
                <ProveedorCamara config={props}>
                  <AbsoluteFill style={{background: '#000'}}>
                    <C />
                  </AbsoluteFill>
                </ProveedorCamara>
              )}
              schema={esquemaSueno}
              defaultProps={CAMARA_SUENO as never}
              durationInFrames={Math.round((e.fin - e.inicio) * VIDEO_SUENO.fps)}
              fps={VIDEO_SUENO.fps}
              width={VIDEO_SUENO.ancho}
              height={VIDEO_SUENO.alto}
            />
          );
        })}
      </Folder>
      {/* Cada escena por separado, para editarla y previsualizarla aislada */}
      <Folder name="Escenas">
        {(Object.keys(ESCENA_COMPONENTES) as (keyof typeof ESCENA_COMPONENTES)[]).map((k, i) => {
          const C = ESCENA_COMPONENTES[k];
          const e = ESCENAS[k];
          return (
            <Composition
              key={k}
              id={`Escena${i + 1}-${k}`}
              component={(props: ConfigCalorias) => (
                <ProveedorCamara config={props}>
                  <AbsoluteFill style={{background: '#000'}}>
                    <C />
                  </AbsoluteFill>
                </ProveedorCamara>
              )}
              schema={esquemaCamara}
              defaultProps={CAMARA}
              durationInFrames={Math.round((e.fin - e.inicio) * VIDEO.fps)}
              fps={VIDEO.fps}
              width={VIDEO.ancho}
              height={VIDEO.alto}
            />
          );
        })}
      </Folder>
    </>
  );
};
