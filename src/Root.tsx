import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { Intro } from "./Intro";
import { Reel } from "./Vaginosis/Reel";
import { DURACION_TOTAL, FPS } from "./Vaginosis/escenas";
import { ReelBanoRoto } from "./BanoRoto/Reel";
import { DURACION_TOTAL as DURACION_BANO } from "./BanoRoto/escenas";
import { ReelColon } from "./Colon/Reel";
import { DURACION_TOTAL as DURACION_COLON } from "./Colon/escenas";
import { ReelDescubrimiento } from "./Colon60/Reel";
import { DURACION_TOTAL as DURACION_DESCUBRIMIENTO } from "./Colon60/escenas";
import { ReelNapoleon } from "./Napoleon/Reel";
import { ReelVueltaMundo } from "./VueltaMundo/Reel";
import { ReelPaises } from "./Paises/Reel";
import { DURACION_TOTAL as DURACION_PAISES } from "./Paises/escenas";
import { DURACION_TOTAL as DURACION_VUELTA_MUNDO } from "./VueltaMundo/escenas";
import { ReelFrio, ReelFrio2D } from "./Frio/Reel";
import { DURACION_TOTAL as DURACION_FRIO } from "./Frio/escenas";
import { ReelInmovil, ReelInmovil2D } from "./Inmovil/Reel";
import { DURACION_TOTAL as DURACION_INMOVIL } from "./Inmovil/escenas";
import { ReelMovil30 } from "./Movil30/Reel";
import { DURACION_TOTAL as DURACION_MOVIL30 } from "./Movil30/escenas";
import { ReelDesierto } from "./Desierto/Reel";
import { DURACION_TOTAL as DURACION_DESIERTO } from "./Desierto/escenas";
import { ReelCueva } from "./Cueva/Reel";
import { DURACION_TOTAL as DURACION_CUEVA } from "./Cueva/escenas";
import { ReelDeriva } from "./Deriva/Reel";
import { DURACION_TOTAL as DURACION_DERIVA } from "./Deriva/escenas";
import { ReelClima } from "./Clima/Reel";
import { DURACION_TOTAL as DURACION_CLIMA } from "./Clima/escenas";
import { ReelSahara } from "./Sahara/Reel";
import { DURACION_TOTAL as DURACION_SAHARA } from "./Sahara/escenas";
import { DURACION_TOTAL as DURACION_NAPOLEON } from "./Napoleon/escenas";
import { ReelMillon } from "./Millon/Reel";
import { DURACION_TOTAL as DURACION_MILLON } from "./Millon/escenas";
import { ReelMillonHoy, ReelMillonHoy3D } from "./MillonHoy/Reel";
import { DURACION_TOTAL as DURACION_MILLON_HOY } from "./MillonHoy/escenas";
import { ReelMillonHoyV2 } from "./MillonHoyV2/Reel";
import { CatalogoEscenarios, DURACION_ESCENARIOS } from "./Mundo3D/CatalogoEscenarios";
import { CatalogoPersonajes, DURACION_PERSONAJES } from "./Mundo3D/CatalogoPersonajes";
import { DURACION_MUESTRARIO, Muestrario } from "./Muestrario/Muestrario";
import { MuestraDeshielo, MuestrasMapas, MUESTRAS } from "./MuestrasMapas/Muestras";
import { MuestrasEstilos, MUESTRAS_ESTILOS } from "./MuestrasMapas/Estilos";
import { ReelDeshielo } from "./Deshielo/Reel";
import { ReelMongoles } from "./Mongoles/Reel";
import { ReelCortes } from "./Cortes/Reel";
import { DURACION_TOTAL as DURACION_CORTES } from "./Cortes/escenas";
import { DURACION_TOTAL as DURACION_MONGOLES } from "./Mongoles/escenas";
import { DURACION_TOTAL as DURACION_DESHIELO } from "./Deshielo/escenas";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          titulo: "Mi Proyecto",
          subtitulo: "Videos hechos con HTML",
          puntos: ["Textos animados", "Formato vertical", "Listo para el teléfono"],
          colorFondo1: "#ff6a00",
          colorFondo2: "#7b2ff7",
        }}
      />
      <Composition
        id="ReelVaginosis"
        component={Reel}
        durationInFrames={DURACION_TOTAL}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelBanoRoto"
        component={ReelBanoRoto}
        durationInFrames={DURACION_BANO}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelColon"
        component={ReelColon}
        durationInFrames={DURACION_COLON}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelDescubrimiento"
        component={ReelDescubrimiento}
        durationInFrames={DURACION_DESCUBRIMIENTO}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="ReelFrio" component={ReelFrio} durationInFrames={DURACION_FRIO} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelFrio2D" component={ReelFrio2D} durationInFrames={DURACION_FRIO} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelInmovil" component={ReelInmovil} durationInFrames={DURACION_INMOVIL} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelInmovil2D" component={ReelInmovil2D} durationInFrames={DURACION_INMOVIL} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelMovil30" component={ReelMovil30} durationInFrames={DURACION_MOVIL30} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelDesierto" component={ReelDesierto} durationInFrames={DURACION_DESIERTO} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelCueva" component={ReelCueva} durationInFrames={DURACION_CUEVA} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelDeriva" component={ReelDeriva} durationInFrames={DURACION_DERIVA} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelClima" component={ReelClima} durationInFrames={DURACION_CLIMA} fps={FPS} width={1080} height={1920} />
      <Composition
        id="ReelSahara"
        component={ReelSahara}
        durationInFrames={DURACION_SAHARA}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelNapoleon"
        component={ReelNapoleon}
        durationInFrames={DURACION_NAPOLEON}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelVueltaMundo"
        component={ReelVueltaMundo}
        durationInFrames={DURACION_VUELTA_MUNDO}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="ReelDeshielo" component={ReelDeshielo} durationInFrames={DURACION_DESHIELO} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelCortes" component={ReelCortes} durationInFrames={DURACION_CORTES} fps={FPS} width={1080} height={1920} />
      <Composition id="ReelMongoles" component={ReelMongoles} durationInFrames={DURACION_MONGOLES} fps={FPS} width={1080} height={1920} />
      <Composition id="MuestrasEstilos" component={MuestrasEstilos} durationInFrames={MUESTRAS_ESTILOS * 30} fps={FPS} width={1080} height={1920} />
      <Composition id="MuestrasMapas" component={MuestrasMapas} durationInFrames={MUESTRAS * 30} fps={FPS} width={1080} height={1920} />
      <Composition id="MuestraDeshielo" component={MuestraDeshielo} durationInFrames={180} fps={FPS} width={1080} height={1920} />
      <Composition
        id="ReelPaises"
        component={ReelPaises}
        durationInFrames={DURACION_PAISES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelMillon"
        component={ReelMillon}
        durationInFrames={DURACION_MILLON}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelMillonHoy"
        component={ReelMillonHoy}
        durationInFrames={DURACION_MILLON_HOY}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelMillonHoy3D"
        component={ReelMillonHoy3D}
        durationInFrames={DURACION_MILLON_HOY}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelMillonHoyV2"
        component={ReelMillonHoyV2}
        durationInFrames={DURACION_MILLON_HOY}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Folder name="Mundo3D">
        <Composition id="Mundo3DEscenarios" component={CatalogoEscenarios} durationInFrames={DURACION_ESCENARIOS} fps={FPS} width={1080} height={1920} />
        <Composition id="Mundo3DPersonajes" component={CatalogoPersonajes} durationInFrames={DURACION_PERSONAJES} fps={FPS} width={1080} height={1920} />
      </Folder>
      <Composition
        id="MuestrarioSonidos"
        component={Muestrario}
        durationInFrames={DURACION_MUESTRARIO}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
