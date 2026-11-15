import React from 'react';
import {AbsoluteFill, Composition, Folder, Still} from 'remotion';
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

const esquema25D = crearEsquemaCamara(REPARTO_25D.map((r) => r.e));

const esquemaSueno = crearEsquemaCamara(NOMBRES_PLANO_SUENO);
const metadatosSueno = crearCalcularMetadatos(SUBTITULOS_SUENO, VIDEO_SUENO.duracionSegundos, VIDEO_SUENO.fps);

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
