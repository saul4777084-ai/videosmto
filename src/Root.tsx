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
import { DURACION_TOTAL as DURACION_NAPOLEON } from "./Napoleon/escenas";
import { ReelMillon } from "./Millon/Reel";
import { DURACION_TOTAL as DURACION_MILLON } from "./Millon/escenas";
import { DURACION_MUESTRARIO, Muestrario } from "./Muestrario/Muestrario";

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
      <Composition
        id="ReelNapoleon"
        component={ReelNapoleon}
        durationInFrames={DURACION_NAPOLEON}
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
