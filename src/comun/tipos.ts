// Tipos y utilidades compartidos por todos los reels con el avatar marioneta.
export type Gesto =
  | "senalar" // apunta con la mano
  | "negar" // dice "no" con el dedo y la cabeza
  | "presentar" // mano abierta presentando
  | "explicar" // las dos manos marcando el ritmo
  | "alarma" // las dos manos arriba, temblando
  | "contar" // golpes de mano, enumerando
  | "saludar" // despedida
  | "leer" // lee el libro abierto con las dos manos
  | "cruzar" // brazos cruzados
  | "reposo"; // de pie, sin gesto

export type Escena<I extends string = string> = {
  texto: string;
  segundos: number;
  ilustracion: I;
  gesto?: Gesto; // solo se usa si el reel muestra el avatar
  clave?: string[]; // palabras que se resaltan en amarillo
  sinSubtitulos?: boolean; // el texto ya está en pantalla
  tiempos?: number[]; // segundos (desde el inicio de la escena) en que se dice cada palabra
};

// Todos los efectos de public/sfx (ver scripts/sonidos_extra.py y src/Muestrario)
export const EFECTOS_DISPONIBLES = {
  interfaz: ["pop", "tic", "clic", "tecla", "ding", "exito", "notificacion", "moneda", "caja_registradora", "camara", "magia", "brillo", "error", "negacion", "alarma"],
  movimiento: ["whoosh", "swoosh", "subida", "caida", "puff", "papel", "boing"],
  clima: ["trueno", "rayo", "lluvia", "tormenta", "viento", "brisa", "nubes"],
  agua: ["gota", "burbuja", "burbujas", "salpicadura", "chapuzon", "arroyo", "vertido", "olas"],
  hielo: ["cubitos", "hielo_crujido", "congelar", "cristal", "cristal_roto"],
  golpes: ["toc", "toc_toc", "madera", "metal", "golpe", "pasos", "latido", "reloj", "campana", "proyector"],
  fuego: ["fuego", "explosion"],
} as const;

export type Efecto = (typeof EFECTOS_DISPONIBLES)[keyof typeof EFECTOS_DISPONIBLES][number];
export type Golpe = [frameLocal: number, efecto: Efecto, volumen?: number];

export type Dibujo = React.FC<{ f: number }>;

export const FPS = 30;
export const framesDe = (s: number) => Math.round(s * FPS);
export const duracionDe = (escenas: Escena[]) => escenas.reduce((t, e) => t + framesDe(e.segundos), 0);
export const iniciosDe = (escenas: Escena[]) =>
  escenas.reduce<number[]>((acc, e, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + framesDe(escenas[i - 1].segundos));
    return acc;
  }, []);
