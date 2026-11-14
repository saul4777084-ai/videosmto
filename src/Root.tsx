import React from 'react';
import {AbsoluteFill, Composition, Folder} from 'remotion';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import {Video, ESCENA_COMPONENTES} from './Video';
import {VIDEO} from './config/video';
import {ESCENAS} from './config/escenas';
import {CAMARA} from './config/camara';
import {esquemaCamara, ConfigCamara} from './camera/esquema';
import {ProveedorCamara} from './camera/Camara';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CaloriasCama"
        component={Video}
        schema={esquemaCamara}
        defaultProps={CAMARA}
        durationInFrames={Math.round(VIDEO.duracionSegundos * VIDEO.fps)}
        fps={VIDEO.fps}
        width={VIDEO.ancho}
        height={VIDEO.alto}
      />
      {/* Cada escena por separado, para editarla y previsualizarla aislada */}
      <Folder name="Escenas">
        {(Object.keys(ESCENA_COMPONENTES) as (keyof typeof ESCENA_COMPONENTES)[]).map((k, i) => {
          const C = ESCENA_COMPONENTES[k];
          const e = ESCENAS[k];
          return (
            <Composition
              key={k}
              id={`Escena${i + 1}-${k}`}
              component={(props: ConfigCamara) => (
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
