/** Colores de las fichas: qué color lleva cada jugador y con qué tinta se lee. */

import { COLORS, TEAM_COLORS } from './constants.js'

/**
 * Colores del tablero completados con los de por defecto. Las jugadas guardadas
 * antes de poder elegir color no traen `colors`, o lo traen a medias.
 */
export function teamColorsOf(board) {
  const saved = board?.colors ?? {}
  return {
    home: { ...TEAM_COLORS.home, ...(saved.home ?? {}) },
    away: { ...TEAM_COLORS.away, ...(saved.away ?? {}) },
  }
}

/**
 * En las jugadas antiguas los jugadores no tienen rol guardado: entonces se
 * toma el dorsal 1 como portero, que es como se reparten las formaciones.
 */
export function isGoalkeeper(player) {
  return player.role ? player.role === 'gk' : player.num === '1'
}

/** Color de la ficha de un jugador según su equipo y si es portero. */
export function tokenColor(player, colors) {
  const team = player.team === 'home' ? colors.home : colors.away
  return isGoalkeeper(player) ? team.gk : team.player
}

const expand = (hex) =>
  hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex

/**
 * Tinta legible sobre un color de ficha: oscura sobre colores claros y blanca
 * sobre los oscuros, para que el dorsal se lea con cualquier elección.
 */
export function inkOn(hex) {
  const full = expand(hex)
  const r = parseInt(full.slice(1, 3), 16)
  const g = parseInt(full.slice(3, 5), 16)
  const b = parseInt(full.slice(5, 7), 16)
  // Luminancia percibida (ITU-R BT.601): el verde pesa más que el azul.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? COLORS.ink : '#fff'
}
