# videosmto — Animación "¿Quema calorías la cama?"

Vídeo explicativo animado en 2D, vertical 9:16 (1080×1920, 30 fps), hecho con **React + Remotion + SVG**.
Todos los personajes, fondos e iconos están dibujados con código (SVG): no hay ninguna imagen fija.

Vídeo renderizado: `out/calorias-cama.mp4`

## Uso

```bash
npm install
npm run studio   # previsualizar y editar en el navegador
npm run render   # exporta out/calorias-cama.mp4
```

## Qué editar

| Quieres cambiar…              | Archivo                         |
|-------------------------------|---------------------------------|
| Narración (MP3/WAV) y sincronía | panel **Props** → `audio`, o `audio` en `src/config/camara.ts` (archivo en `public/`) |
| Música / duración base        | `src/config/video.ts` |
| Tiempos de cada escena        | `src/config/escenas.ts`         |
| Subtítulos y rótulos          | `src/config/textos.ts` (`*palabra*` = resaltado) |
| Valores de los contadores     | `src/config/contadores.ts`      |
| Colores de los personajes     | `src/characters/palette.ts`     |
| Efectos de sonido y música    | `src/config/sonidos.ts` (archivos en `public/sfx/`) |
| Avatar y sus gestos           | `src/config/avatar.ts` (poses en `public/poses/`) |
| Cámara, efectos y transiciones | `src/config/camara.ts` (o panel **Props** del Studio) |

## Estructura

- `src/scenes/` — las 7 escenas (cada una es también una composición independiente en el Studio, carpeta "Escenas").
- `src/sets/` — escenarios: habitación, gimnasio, fondo científico, mesa, salón con tele.
- `src/characters/` — cabeza con expresiones, corredor articulado, cinta de correr.
- `src/components/` — contador digital de 7 segmentos, llamas, corazones, relojes, cronómetro, subtítulos, transiciones (`Clip`).

## Cámara cinematográfica

Cada plano (toma) se compone de **capas con profundidad** (`0` fondo lejano · `1` personaje · `>1` primer término)
y una lista de efectos en `src/config/camara.ts`. El motor (`src/camera/`) calcula la cámara como función pura del
frame, así que lo que ves en el Studio es exactamente lo que sale en el MP4.

| Efecto        | Qué hace | Intensidad = |
|---------------|----------|--------------|
| `zoomIn`      | Acercamiento progresivo hacia `focoX/focoY` | +% de zoom (0.2 = +20 %) |
| `zoomOut`     | Alejamiento; si no hay zoom previo, el plano arranca cerca | % de zoom |
| `rackFocus`   | Pasa el enfoque de la profundidad `planoDesde` a `planoHasta` | ×10 px de desenfoque por unidad de profundidad |
| `profundidad` | Depth of field: enfoca `planoHasta`, desenfoca el resto | ×10 px por unidad |
| `motionBlur`  | Refuerza el obturador (y barrido si `dirX/dirY` ≠ 0) | +200 % obturador, ×260 px |
| `paneo`       | Movimiento horizontal/vertical (`dirX`, `dirY`) | ×300 px |
| `parallax`    | Desplaza cada capa según su profundidad | ×100 px |
| `dollyZoom`   | El personaje se acerca poco y el fondo cambia mucho de escala | aumento |
| `focusPull`   | Desenfoca la escena y enfoca progresivamente `planoHasta` (y los rótulos) | ×18 px |
| `temblor`     | Camera shake con ataque rápido y caída (`velocidad` = frecuencia) | ×28 px |

Parámetros comunes: `inicio`, `duracion` (segundos dentro del plano), `velocidad` (2 = llega al destino en la mitad
del tiempo), `curva` (`suave`, `entrada`, `salida`, `lineal`, `rebote`, `latigo`), `mantener` (quedarse o volver),
`centrar` (llevar el foco al centro), `sonido` + `volumen` (SFX sincronizado con el inicio del efecto).

**Sincronía con la voz:** `en('plano', palabra('276 calorías'))` devuelve el segundo del plano en el que esa palabra
aparece en los subtítulos; `en('plano', 10.4)` convierte un segundo absoluto (p. ej. el de un SFX de `sonidos.ts`).

**Ajustes globales** (`CAMARA.global`): intensidad general, cámara en mano (`respiracion`), zoom máximo,
desenfoque máximo del personaje principal (para que siempre sea reconocible), cuánto siguen los rótulos a la cámara
y el **motion blur real**: en modo `muestras` cada capa se expone varias veces dentro del obturador
(`obturador` 0.5 = 180°) y se promedian; se activa solo cuando el movimiento supera `umbral` px por frame.
El modo `direccional` usa un filtro SVG, más rápido de renderizar.

**Transiciones** (`CAMARA.transiciones`, cómo entra cada plano): `fundido`, `zoom`, `barrido` (empuje lateral con
desenfoque de movimiento), `desenfoque`, `corte`.

**Controles en el Studio:** `npm run studio` → composición `CaloriasCama` (o cada escena en la carpeta *Escenas*) →
panel **Props**. Ahí se puede activar/desactivar cada efecto y cambiar su intensidad, duración, velocidad, curva y
posición del foco con vista previa inmediata. Para renderizar con unos ajustes propios sin tocar el código:
`npx remotion render CaloriasCama out/video.mp4 --props=mis-ajustes.json`.

## Edición de documental: la cámara sigue a la narración

`src/camera/director.ts` convierte lo que pasa en la voz en movimientos de cámara. El plan de cada plano en
`src/config/camara.ts` está escrito con estas piezas, siempre colgadas de palabras reales de la narración
(`w('plano', 'palabra')`):

| Cuando la voz…               | Función               | Qué hace la cámara |
|------------------------------|-----------------------|--------------------|
| hace una **pregunta**        | `pregunta()`          | acercamiento lento durante la frase + pequeña pausa visual |
| **menciona un objeto**       | `objeto()`            | zoom hacia el objeto, enfoque en su profundidad (lo secundario se desenfoca) y resaltado con foco de luz y anillo |
| **revela información**       | `revelacion()`        | cambio rápido de enfoque, pequeño impacto (temblor + golpe de zoom) y rótulo grande en pantalla |
| dice **algo importante**     | `dramatico()`         | plano general → acercamiento lento → fondo desenfocándose con el personaje nítido → pausa → zoom extra rápido en el impacto → regreso lento al general |
| se **sorprende** ("Pero…")   | `sorpresa()`          | zoom rápido con motion blur |
| **termina una idea**         | `cierre()`            | alejamiento que deshace los acercamientos del plano y desemboca en la transición |
| —                            | `seguir()` / `revelarVertical()` | paneo horizontal siguiendo al personaje / paneo vertical que revela objetos |
| —                            | `generalAPrimerPlano()`, `lateral()` | de plano general a primer plano / desplazamiento lateral con parallax |
| —                            | `orbita()`            | órbita 2.5D alrededor del personaje con acercamiento durante el giro |

- Las velocidades de los acercamientos se van alternando (`RITMOS`) para que dos zooms seguidos nunca sean iguales.
- `plano()` rellena con un desplazamiento lateral suave cualquier tramo de más de 1,1 s en el que la cámara se quedaría quieta.
- Todo usa curvas con aceleración y frenado suaves. La cámara solo traslada, gira y escala de forma uniforme:
  ninguna ilustración se estira (el avatar ya tampoco "respira" estirándose; sube y baja).

## Sincronización con un MP3 o WAV real

1. Copia el audio en `public/` (por ejemplo `public/voz.wav`).
2. En el Studio, panel **Props** → `audio.archivo` = `voz.wav` (o cámbialo en `src/config/camara.ts`).
3. Con `audio.sincronizar` activado, antes de mostrar o renderizar se analiza el audio: se detecta dónde
   empieza y acaba la voz y sus pausas, y cada frase de `src/config/textos.ts` se alinea con su posición real
   (`src/audio/alinear.ts`). Toda la parte visual —escenas, cámara, subtítulos, gestos del avatar y efectos de
   sonido— se reproduce a través de ese mapa de tiempo, y la duración del vídeo pasa a ser la del audio.
4. Las anclas calculadas aparecen en `audio.anclas` y se pueden retocar a mano (con `sincronizar` desactivado).
   `audio.sensibilidad` ajusta la detección de pausas.

Requisito: el texto de los subtítulos debe ser lo que dice la voz, con las mismas frases y en el mismo orden.
La alineación es por frases (pausas y valles de energía), no reconocimiento de voz palabra a palabra; dentro de
cada frase las palabras se reparten como en los subtítulos. Con la narración actual recupera los tiempos
ajustados a mano con una desviación máxima de 0,17 s, y con la misma voz ralentizada al 90 % y 1,5 s de
silencio delante sigue las frases con ±0,15 s.

## Cámara orbital alrededor del presentador

El vídeo completo pasa por una cámara global (plano `presentador`) con dos capas: la escena como escenario de
fondo y el presentador (cabeza negra sin rostro, traje marrón a rayas…) como capa principal. En las órbitas
la escena se desplaza y se escala según su profundidad, gira ligeramente en perspectiva y la cámara se acerca
durante el giro; el presentador hace de pivote y conserva su ilustración original intacta (sin giros 3D, sin
deformar y sin inventar otros ángulos). Las órbitas están en sus gestos clave (presentación, señalar, explicar,
cierre y despedida) y se editan en `planos.presentador`.

---

# Vídeo 2 · ¿Qué pasaría si dejaras de dormir durante 7 días?

Composición `SieteDiasSinDormir` (1080×1920, 30 fps, ~60 s) · vídeo renderizado: `out/7-dias-sin-dormir.mp4`

```bash
npm run render:sueno   # exporta out/7-dias-sin-dormir.mp4
npm run audio:sueno    # regenera la música y los efectos sintetizados
```

| Quieres cambiar…                     | Archivo |
|--------------------------------------|---------|
| Tiempos de escenas, subtítulos, gestos y SFX | `src/videos/sueno/config.ts` |
| Movimientos de cámara (atados a palabras de la voz) | `src/videos/sueno/camara.ts` o panel **Props** |
| Escenas                              | `src/videos/sueno/escenas.tsx` |
| Protagonista (expresiones y cansancio) | `src/videos/sueno/Insomne.tsx` |
| Escenarios / objetos / efectos       | `sets.tsx` · `objetos.tsx` · `efectos.tsx` |
| Música y efectos de sonido           | `tools/sintetizar_sueno.py` → `public/sueno/` |
| Locución                             | `public/sueno/narracion.mp3` (se sincroniza sola) |

- **Protagonista** dibujado desde cero en SVG: mismo diseño en todo el vídeo; solo empeoran sus signos de
  cansancio día a día (ojeras, ojos rojos, párpados caídos, palidez, pelo revuelto, sudor).
- **8 escenas** (gancho, día 1, día 2, día 3, días 4-5, días 6-7, Randy Gardner, cierre) con capas de
  profundidad, contador de horas sin dormir que salta en cada día y presentador con órbitas 2.5D.
- **Efectos que se renderizan de verdad**: párpados que cierran la pantalla en los microsueños, deformación
  por turbulencia en las alucinaciones, glitch RGB y visión doble en "ya no distingues lo que es real",
  viñeta roja que late en "alerta máxima", grano de película, motion blur y profundidad de campo.
- **Sonido**: música sintetizada que sube de tensión con cada día y resuelve en un acorde mayor en
  "La buena noticia", más golpes, parpadeos, grietas, glitch, susurros y zumbido sincronizados.
- Los tiempos de las frases se midieron sobre la locución entregada; si se sustituye el audio, la
  sincronización automática reajusta todo.
