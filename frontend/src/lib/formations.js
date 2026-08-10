/**
 * Catálogo de formaciones.
 *
 * Cada posición es [dorsal, x, y] en fracciones del campo, vista desde el
 * equipo local (ataca hacia la derecha). El rival se refleja al colocarse.
 */

import { PITCH } from './constants.js'
import { uid } from './geometry.js'

export const FORMATIONS_11 = {
  '4-4-2': [
    [1, 0.05, 0.5], [2, 0.22, 0.85], [5, 0.2, 0.62], [4, 0.2, 0.38], [3, 0.22, 0.15],
    [7, 0.42, 0.85], [6, 0.4, 0.62], [8, 0.4, 0.38], [11, 0.42, 0.15],
    [9, 0.62, 0.58], [10, 0.62, 0.4],
  ],
  '4-3-3': [
    [1, 0.05, 0.5], [2, 0.22, 0.85], [5, 0.2, 0.62], [4, 0.2, 0.38], [3, 0.22, 0.15],
    [6, 0.38, 0.5], [8, 0.42, 0.7], [10, 0.42, 0.3],
    [7, 0.62, 0.85], [9, 0.68, 0.5], [11, 0.62, 0.15],
  ],
  '4-2-3-1': [
    [1, 0.05, 0.5], [2, 0.22, 0.85], [5, 0.2, 0.62], [4, 0.2, 0.38], [3, 0.22, 0.15],
    [6, 0.35, 0.6], [8, 0.35, 0.4],
    [7, 0.52, 0.82], [10, 0.5, 0.5], [11, 0.52, 0.18], [9, 0.68, 0.5],
  ],
  '3-5-2': [
    [1, 0.05, 0.5], [4, 0.2, 0.7], [5, 0.18, 0.5], [6, 0.2, 0.3],
    [2, 0.42, 0.9], [3, 0.42, 0.1], [8, 0.38, 0.65], [10, 0.36, 0.5], [11, 0.38, 0.35],
    [9, 0.64, 0.58], [7, 0.64, 0.42],
  ],
  '5-3-2': [
    [1, 0.05, 0.5], [2, 0.2, 0.9], [4, 0.2, 0.7], [5, 0.18, 0.5], [6, 0.2, 0.3], [3, 0.2, 0.1],
    [8, 0.4, 0.7], [10, 0.38, 0.5], [11, 0.4, 0.3],
    [9, 0.62, 0.58], [7, 0.62, 0.42],
  ],
  '4-1-4-1': [
    [1, 0.05, 0.5], [2, 0.22, 0.85], [5, 0.2, 0.62], [4, 0.2, 0.38], [3, 0.22, 0.15],
    [6, 0.32, 0.5],
    [7, 0.48, 0.85], [8, 0.46, 0.62], [10, 0.46, 0.38], [11, 0.48, 0.15], [9, 0.66, 0.5],
  ],
}

export const FORMATIONS_7 = {
  '2-3-1': [
    [1, 0.06, 0.5], [2, 0.22, 0.68], [3, 0.22, 0.32],
    [7, 0.44, 0.82], [8, 0.42, 0.5], [11, 0.44, 0.18], [9, 0.66, 0.5],
  ],
  '3-2-1': [
    [1, 0.06, 0.5], [2, 0.22, 0.78], [4, 0.2, 0.5], [3, 0.22, 0.22],
    [8, 0.44, 0.65], [10, 0.44, 0.35], [9, 0.66, 0.5],
  ],
  '1-3-2': [
    [1, 0.06, 0.5], [4, 0.2, 0.5],
    [2, 0.4, 0.8], [8, 0.38, 0.5], [3, 0.4, 0.2], [9, 0.64, 0.62], [7, 0.64, 0.38],
  ],
}

export const DEFAULT_FORMATION = { f11: { home: '4-3-3', away: '4-4-2' }, f7: { home: '2-3-1', away: '3-2-1' } }

export function formationsFor(size) {
  return size === 'f7' ? FORMATIONS_7 : FORMATIONS_11
}

export function formationNames(size) {
  return Object.keys(formationsFor(size))
}

/** Genera los 7/11 jugadores de un equipo en la formación indicada. */
export function buildTeam(team, formation, size) {
  const layout = formationsFor(size)[formation]
  if (!layout) return []
  const mirrored = team === 'away'
  return layout.map(([num, fx, fy]) => ({
    id: uid(),
    team,
    num: String(num),
    name: '',
    x: (mirrored ? 1 - fx : fx) * PITCH.width,
    y: (mirrored ? 1 - fy : fy) * PITCH.height,
  }))
}

export function emptyBoard() {
  return {
    players: [],
    items: [],
    shapes: [],
    ball: { x: PITCH.width / 2, y: PITCH.height / 2 },
  }
}
