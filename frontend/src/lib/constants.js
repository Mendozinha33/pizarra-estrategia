/** Constantes de dominio y de presentación de la pizarra. */

export const COLORS = {
  ink: '#0C1116',
  panel: '#141C24',
  panel2: '#1B252F',
  line: '#243340',
  chalk: '#EAF2EC',
  muted: '#7D93A3',
  mint: '#3FE0B0',
  grass: '#0E6B4F',
  grassAlt: '#0B5C43',
}

/**
 * Colores por defecto de las fichas. Cada jugada guarda los suyos en
 * `board.colors`; esto es sólo el punto de partida y el valor de respaldo para
 * las jugadas guardadas antes de poder elegirlos.
 * Deben coincidir con `DEFAULT_COLORS` del backend.
 */
export const TEAM_COLORS = {
  home: { player: '#F4F7F3', gk: '#FFD447' },
  away: { player: '#D6274B', gk: '#2B6CF6' },
}

/** Dimensiones del campo en unidades de pizarra (deben coincidir con el backend). */
export const PITCH = { width: 1050, height: 680 }

export const SURFACES = {
  full: { x: 0, y: 0, w: 1050, h: 680, label: 'Campo completo' },
  half: { x: 525, y: 0, w: 525, h: 680, label: 'Medio campo' },
  grid: { x: 0, y: 0, w: 1050, h: 680, label: 'Espacio reducido' },
}

export const SURFACE_OPTIONS = Object.entries(SURFACES).map(([id, s]) => ({
  id,
  label: s.label,
}))

/** Debe coincidir con `PlayCategory` del backend. */
export const PLAY_CATEGORIES = ['Ataque', 'Defensa', 'ABP', 'Entrenamiento']

export const PEN_COLORS = [
  { id: 'amarillo', hex: '#FFD447' },
  { id: 'blanco', hex: '#EAF2EC' },
  { id: 'azul', hex: '#5FD0FF' },
]

/** Herramientas del lienzo. `key` es el atajo de teclado. */
export const TOOLS = [
  { id: 'select', icon: 'pointer', label: 'Mover', key: 'v' },
  { id: 'run', icon: 'arrowRight', label: 'Desplazamiento', key: 'd' },
  { id: 'pass', icon: 'chevronRight', label: 'Pase', key: 'p' },
  { id: 'dribble', icon: 'waves', label: 'Conducción', key: 'c' },
  { id: 'free', icon: 'pen', label: 'Trazo libre', key: 'l' },
  { id: 'zone', icon: 'square', label: 'Zona', key: 'z' },
  { id: 'text', icon: 'type', label: 'Etiqueta', key: 't' },
  { id: 'cone', icon: 'triangle', label: 'Cono', key: 'o' },
  { id: 'extraBall', icon: 'circle', label: 'Balón extra', key: 'b' },
  { id: 'erase', icon: 'eraser', label: 'Borrar', key: 'e' },
]

/** Trazos que la reproducción sabe animar. */
export const MOVEMENT_SHAPES = new Set(['run', 'dribble', 'free'])

/**
 * Trazos que se ocultan mientras se reproduce la jugada: las flechas y líneas
 * estorban cuando los dorsales ya las están recorriendo. Las zonas y las
 * etiquetas siguen viéndose porque son contexto, no movimiento.
 */
export const PLAYBACK_HIDDEN_SHAPES = new Set(['run', 'pass', 'dribble', 'free'])

export const ANIMATION_MS = 2600

/** Radio, en unidades de pizarra, para asociar un trazo al jugador que lo inicia. */
export const PLAYER_SNAP_RADIUS = 55

export const UNDO_DEPTH = 40
