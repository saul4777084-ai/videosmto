import type {Diseno25} from '../../mundo25d/Personaje25D';

/** Escenarios disponibles para un resumen (2D de src/sets/Escenarios.tsx + 2.5D de src/mundo25d). */
export const ESCENARIOS_RESUMEN = [
  // 2D
  'ciudadNoche', 'parque', 'playa', 'espacio', 'bosque', 'hospital', 'aula', 'oficina',
  'montana', 'marino', 'desierto', 'laboratorio', 'cocina',
  // 2.5D (planos con profundidad)
  'cyberpunk', 'selva', 'castillo', 'volcan', 'estacion', 'japon', 'granja', 'steampunk',
] as const;
export type EscenarioResumen = (typeof ESCENARIOS_RESUMEN)[number];

export type Emocion = 'neutral' | 'alegria' | 'miedo' | 'tension' | 'tristeza' | 'sorpresa' | 'enfado';

export type PersonajeGuion = Diseno25 & {id: string};

export type EscenaGuion = {
  escenario: EscenarioResumen;
  /** ids del reparto que aparecen (0, 1 o 2). */
  personajes: string[];
  emocion: Emocion;
  /** Rótulo corto opcional: lugar, época, "AÑOS DESPUÉS"… */
  rotulo?: string;
  /** Frases que dice la narración en esta escena. */
  frases: string[];
};

export type Guion = {
  pelicula: {titulo: string; anio: number; director: string; genero: string};
  /** Filtro de color de src/videos/temas.ts */
  tema: 'original' | 'calido' | 'frio' | 'neon' | 'pastel' | 'noir' | 'sepia' | 'terror' | 'bosque';
  reparto: PersonajeGuion[];
  escenas: EscenaGuion[];
  publicacion: {titulo: string; descripcion: string; hashtags: string[]};
};

export type Palabra = {w: string; inicio: number; fin: number};
export type Tiempos = {
  duracion: number;
  escenas: {inicio: number; fin: number}[];
  frases: {escena: number; texto: string; inicio: number; fin: number; palabras: Palabra[]}[];
};

export type PropsResumen = {
  guion: Guion;
  tiempos: Tiempos;
  /** Rutas dentro de public/ (vacío = sin audio). */
  narracion: string;
  musica: string;
};
