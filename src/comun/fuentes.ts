import { continueRender, delayRender, staticFile } from "remotion";

// Montserrat (SIL Open Font License, public/fuentes/MONTSERRAT_LICENCIA.txt): la letra de los vídeos de mapas virales.
// Se carga una vez al importar este archivo; el render espera a que esté lista.
export const MONTSERRAT = "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

if (typeof document !== "undefined" && typeof FontFace !== "undefined") {
  const pesos = ["700", "800", "900"];
  const espera = delayRender("fuente Montserrat");
  Promise.all(
    pesos.map((peso) => {
      const ff = new FontFace("Montserrat", `url(${staticFile(`fuentes/montserrat-latin-${peso}-normal.woff2`)}) format("woff2")`, { weight: peso });
      return ff.load().then((cargada) => document.fonts.add(cargada));
    }),
  )
    .then(() => continueRender(espera))
    .catch(() => continueRender(espera));
}
