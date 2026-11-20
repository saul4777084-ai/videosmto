# Reglas del proyecto (videos para redes)

- **Idioma:** responde siempre en español.
- **Avatar:** todos los videos con avatar lo muestran **en la esquina inferior izquierda, pequeño y de la
  cintura hacia arriba**, usando las poses de `public/poses/` (componente `src/comun/AvatarPoses.tsx`).
  Es la opción por defecto de `ReelBase` (`avatar="poses"`); no la cambies salvo que el usuario lo pida.
  **Excepción: los videos de mapas (estilo Napoleón, Colón, vuelta al mundo…) van siempre SIN avatar**
  (`mostrarAvatar={false}`), lo pidió el usuario.
  Gestos disponibles: reposo, senalar, explicar, presentar, alarma, cruzar, negar, contar, saludar, leer.
- **Plantilla:** cada video nuevo se hace con `src/comun/ReelBase.tsx` (escenas + subtítulos + avatar + sonidos)
  en su propia carpeta `src/<Video>/` (escenas.ts, Ilustraciones.tsx, efectos.ts, Reel.tsx) y se registra en `src/Root.tsx`.
- **Formato:** vertical 1080×1920, 30 fps.
- **Voz:** si el usuario manda un audio, alinéalo con `python3 scripts/alinear_voz.py AUDIO guion.json tiempos.json`
  (modelo Parakeet en `~/.cache/becario-reels/`) y pasa `voz` y `tiempos` a la plantilla. Si pesa más de ~28 MB,
  recomprime el MP4 final con ffmpeg (crf 23 + loudnorm) para que se pueda descargar en el teléfono.
- **Sonidos:** biblioteca en `public/sfx/` (lista en `EFECTOS_DISPONIBLES` de `src/comun/tipos.ts`;
  se regeneran con `scripts/sonidos_extra.py`). Muestrario: composición `MuestrarioSonidos`.
- **Mundo 3D:** motor realista en `src/comun/Mundo3D.tsx` (three.js + @remotion/three, render con `--gl=swangle`),
  8 personajes en `src/comun/Personajes3D.tsx` (Capitana Brisa, Tobías, Zorp, Ramsés, Lulú, Hada Merengue,
  Sheriff Rosa, Dani; acciones: reposo, saludar, andar, hablar, celebrar, senalar, pensar) y 8 escenarios en
  `src/comun/Escenarios3D.tsx` (isla pirata, Polo Norte, Marte, Egipto, feria, golosinas, oeste, estadio) con
  `<Mundo escenario=…>`. Catálogos: composiciones `Mundo3DPersonajes` y `Mundo3DEscenarios`. Render 3D ≈ 4 s/fotograma:
  renderiza por tramos con `--frames` si pasa de ~25 min.
- **Personaje 2D:** `src/comun/Personaje2D.tsx` (protagonista con sudadera, brazos y piernas articulados con
  cinemática inversa, expresiones y parpadeo). Acciones: reposo, celebrar, senalar, senalarArriba, sorpresa, alarma,
  telefono, triste, pensar, silencio, saludar, hablar, pulsar, andar, contento. Se usa con una línea de tiempo:
  `acciones={[[0, "telefono"], [40, "celebrar"]]}`. Ejemplo: `src/MillonHoyV2`.
- **Mapas:** `src/Colon/Mapa.tsx` (fronteras reales con world-atlas + d3-geo, cámara, niebla, rutas).
  Para el mundo entero: `src/comun/Globo.tsx` (globo terráqueo que gira, países pintados, rutas que se recortan
  en la cara oculta; ejemplo: `src/VueltaMundo`).
  **Mapas de alta calidad (preferido):** `src/comun/Tierra.tsx` (satélite real + relieve con alturas reales; globo o
  plano Mercator con `camara.plana`; `estilo="mapa"` = estilo de los vídeos de mapas virales que pidió el usuario;
  `nivelMar` inunda por alturas reales) con las piezas de `src/comun/PiezasTierra.tsx` (Zona rayada, Paises, Rotulo,
  Ciudad, FlechaG, Caja, Titular, Sello) y subtítulos `estiloSubtitulos="mapa"`. Ejemplos: `src/Deshielo`, `src/Mongoles`.
  Texturas: `scripts/texturas_mapa.py [region]` (añade regiones en REGIONES). Sin voz: `scripts/tiempos_sin_voz.py`.
  Fotogramas sueltos para revisar: `node scripts/fotos.mjs COMPOSICION CARPETA FRAME...`.
- **Entrega:** copia cada video terminado a `videos/`, envíaselo al usuario y haz commit y push a `main`.
- **Publicar:** descripciones y hashtags en `publicaciones/descripciones.md`. Nunca publiques en redes sin el OK del usuario.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
