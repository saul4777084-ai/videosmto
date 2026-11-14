import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { Intro } from "./Intro";
import { Reel } from "./Vaginosis/Reel";
import { DURACION_TOTAL, FPS } from "./Vaginosis/escenas";
import { ReelBanoRoto } from "./BanoRoto/Reel";
import { DURACION_TOTAL as DURACION_BANO } from "./BanoRoto/escenas";

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
    </>
  );
};
