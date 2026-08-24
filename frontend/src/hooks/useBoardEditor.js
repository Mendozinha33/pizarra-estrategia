import { useCallback, useMemo, useReducer, useRef, useState } from 'react'

import { isGoalkeeper, teamColorsOf } from '../lib/colors.js'
import { ITEM_TOOLS, MAX_PLAYERS_PER_TEAM, PITCH, SURFACES, UNDO_DEPTH } from '../lib/constants.js'
import { buildTeam, DEFAULT_FORMATION, emptyBoard, formationNames } from '../lib/formations.js'
import { distance, toBoardPoint, uid } from '../lib/geometry.js'

const MIN_SHAPE_LENGTH = 14

const resolve = (next, current) => (typeof next === 'function' ? next(current) : next)

const remember = (state) => [...state.past.slice(-UNDO_DEPTH), state.board]

/**
 * Tablero e historial viven en el mismo reducer: apilar el estado anterior y
 * sustituirlo es una sola transición, así nunca quedan desincronizados.
 */
function boardReducer(state, action) {
  switch (action.type) {
    // Cambio deshacible.
    case 'commit':
      return { board: resolve(action.board, state.board), past: remember(state) }
    // Cambio no deshacible (arrastres en curso, edición de un dorsal).
    case 'set':
      return { ...state, board: resolve(action.board, state.board) }
    // Marca el punto de retorno antes de empezar un arrastre.
    case 'checkpoint':
      return { ...state, past: remember(state) }
    case 'undo':
      return state.past.length === 0
        ? state
        : { board: state.past[state.past.length - 1], past: state.past.slice(0, -1) }
    default:
      return state
  }
}

/** Dorsales que se prefieren para los porteros. */
const GK_NUMBERS = ['1', '13', '25']

/** Primer dorsal libre del equipo. */
function nextNumber(players, team, role) {
  const used = new Set(players.filter((p) => p.team === team).map((p) => p.num))
  if (role === 'gk') {
    const preferred = GK_NUMBERS.find((num) => !used.has(num))
    if (preferred) return preferred
  }
  for (let num = role === 'gk' ? 1 : 2; num <= 99; num += 1) {
    if (!used.has(String(num))) return String(num)
  }
  return ''
}

/**
 * Sitio para una ficha añadida a mano: en fila por la banda, dentro de lo que
 * se está viendo, para que el entrenador sólo tenga que arrastrarla al sitio.
 */
function benchSpot(view, index, team) {
  const step = 46
  const perRow = Math.max(1, Math.floor((view.w - 80) / step))
  const row = Math.floor(index / perRow)
  return {
    x: view.x + 40 + (index % perRow) * step,
    y: team === 'away' ? view.y + 42 + row * 52 : view.y + view.h - 42 - row * 52,
  }
}

function initialState() {
  return {
    board: { ...emptyBoard(), players: buildTeam('home', DEFAULT_FORMATION.f11.home, 'f11') },
    past: [],
  }
}

/**
 * Estado editable del tablero: jugadores, trazos, elementos y balón.
 *
 * Toda mutación pasa por `commit`, que apila el estado anterior para deshacer.
 * Los arrastres no se apilan en cada frame: se apila una vez al empezar.
 */
export function useBoardEditor({ tool, color, surface, labelText, onWarn }) {
  const [formationSize, setFormationSizeState] = useState('f11')
  const [homeFormation, setHomeFormation] = useState(DEFAULT_FORMATION.f11.home)
  const [awayFormation, setAwayFormation] = useState(DEFAULT_FORMATION.f11.away)

  const [state, dispatch] = useReducer(boardReducer, undefined, initialState)
  const { board } = state

  const [draft, setDraft] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const svgRef = useRef(null)
  const dragRef = useRef(null)

  const commit = useCallback((next) => dispatch({ type: 'commit', board: next }), [])
  const setBoard = useCallback((next) => dispatch({ type: 'set', board: next }), [])
  const pushHistory = useCallback(() => dispatch({ type: 'checkpoint' }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])

  const pointFrom = useCallback(
    (event) => toBoardPoint(event, svgRef.current, SURFACES[surface]),
    [surface],
  )

  const handlePointerDown = useCallback(
    (event, target) => {
      const point = pointFrom(event)

      if (target?.player) {
        if (tool === 'erase') {
          commit((current) => ({
            ...current,
            players: current.players.filter((p) => p.id !== target.player),
          }))
          return
        }
        if (tool !== 'select') return
        event.stopPropagation()
        event.currentTarget.setPointerCapture?.(event.pointerId)
        pushHistory()
        dragRef.current = { kind: 'player', id: target.player }
        setSelectedId(target.player)
        return
      }

      if (target?.ball) {
        if (tool === 'erase') {
          commit((current) => ({ ...current, ball: null }))
          return
        }
        if (tool !== 'select') return
        event.stopPropagation()
        event.currentTarget.setPointerCapture?.(event.pointerId)
        pushHistory()
        dragRef.current = { kind: 'ball' }
        return
      }

      if (tool === 'select') {
        setSelectedId(null)
        return
      }

      // Coloca el balón donde se toca, aunque se hubiera quitado del campo.
      if (tool === 'ball') {
        commit((current) => ({ ...current, ball: point }))
        return
      }

      const itemKind = ITEM_TOOLS[tool]
      if (itemKind) {
        commit((current) => ({
          ...current,
          items: [...current.items, { id: uid(), kind: itemKind, x: point.x, y: point.y }],
        }))
        return
      }

      if (tool === 'text') {
        if (!labelText.trim()) {
          onWarn?.('Escribe el texto de la etiqueta antes de colocarla')
          return
        }
        commit((current) => ({
          ...current,
          shapes: [
            ...current.shapes,
            { id: uid(), type: 'text', points: [point], color, text: labelText.trim() },
          ],
        }))
        return
      }

      if (tool !== 'erase') {
        setDraft({ id: 'draft', type: tool, points: [point, point], color, text: '' })
      }
    },
    [tool, color, labelText, commit, pushHistory, pointFrom, onWarn],
  )

  const handlePointerMove = useCallback(
    (event) => {
      const drag = dragRef.current
      if (drag) {
        const point = pointFrom(event)
        setBoard((current) =>
          drag.kind === 'ball'
            ? { ...current, ball: point }
            : {
                ...current,
                players: current.players.map((p) => (p.id === drag.id ? { ...p, ...point } : p)),
              },
        )
        return
      }

      if (!draft) return
      const point = pointFrom(event)
      setDraft((current) =>
        current.type === 'free'
          ? { ...current, points: [...current.points, point] }
          : { ...current, points: [current.points[0], point] },
      )
    },
    [draft, pointFrom, setBoard],
  )

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
    if (!draft) return

    const first = draft.points[0]
    const last = draft.points[draft.points.length - 1]
    if (distance(first, last) > MIN_SHAPE_LENGTH) {
      commit((current) => ({ ...current, shapes: [...current.shapes, { ...draft, id: uid() }] }))
    }
    setDraft(null)
  }, [draft, commit])

  const erase = useCallback(
    (id, kind) => {
      commit((current) =>
        kind === 'item'
          ? { ...current, items: current.items.filter((item) => item.id !== id) }
          : { ...current, shapes: current.shapes.filter((shape) => shape.id !== id) },
      )
    },
    [commit],
  )

  const applyFormation = useCallback(
    (team, formation) => {
      commit((current) => ({
        ...current,
        players: [
          ...current.players.filter((p) => p.team !== team),
          ...buildTeam(team, formation, formationSize),
        ],
      }))
      if (team === 'home') setHomeFormation(formation)
      else setAwayFormation(formation)
    },
    [commit, formationSize],
  )

  /** Recuento de fichas por equipo, para los topes y los contadores del panel. */
  const squadCounts = useMemo(() => {
    const counts = { home: { field: 0, gk: 0 }, away: { field: 0, gk: 0 } }
    board.players.forEach((player) => {
      const team = player.team === 'away' ? 'away' : 'home'
      counts[team][isGoalkeeper(player) ? 'gk' : 'field'] += 1
    })
    return counts
  }, [board.players])

  /** Añade una ficha suelta al equipo, además de las de la formación. */
  const addPlayer = useCallback(
    (team, role) => {
      if (squadCounts[team][role] >= MAX_PLAYERS_PER_TEAM[role]) {
        onWarn?.(
          role === 'gk'
            ? `Ya hay ${MAX_PLAYERS_PER_TEAM.gk} porteros en ese equipo`
            : `Ya hay ${MAX_PLAYERS_PER_TEAM.field} jugadores en ese equipo`,
        )
        return
      }
      const view = SURFACES[surface] ?? SURFACES.full
      const squad = board.players.filter((p) => p.team === team)
      const player = {
        id: uid(),
        team,
        num: nextNumber(board.players, team, role),
        name: '',
        role,
        ...benchSpot(view, squad.length, team),
      }
      commit((current) => ({ ...current, players: [...current.players, player] }))
      setSelectedId(player.id)
    },
    [board.players, squadCounts, surface, commit, onWarn],
  )

  const clearTeam = useCallback(
    (team) => commit((current) => ({ ...current, players: current.players.filter((p) => p.team !== team) })),
    [commit],
  )

  const setFormationSize = useCallback(
    (size) => {
      const home = DEFAULT_FORMATION[size].home
      const away = DEFAULT_FORMATION[size].away
      setFormationSizeState(size)
      setHomeFormation(home)
      setAwayFormation(away)
      commit((current) => ({
        ...current,
        players: [
          ...buildTeam('home', home, size),
          ...(current.players.some((p) => p.team === 'away') ? buildTeam('away', away, size) : []),
        ],
      }))
    },
    [commit],
  )

  const resetField = useCallback(() => {
    // Vaciar el campo no debe deshacer los colores elegidos para las fichas.
    commit((current) => ({
      ...emptyBoard(),
      colors: teamColorsOf(current),
      players: buildTeam('home', homeFormation, formationSize),
    }))
    setSelectedId(null)
  }, [commit, homeFormation, formationSize])

  const clearAnnotations = useCallback(
    () => commit((current) => ({ ...current, shapes: [], items: [] })),
    [commit],
  )

  /** Quita el balón del campo o lo devuelve al centro. */
  const toggleBall = useCallback(() => {
    commit((current) =>
      current.ball
        ? { ...current, ball: null }
        : { ...current, ball: { x: PITCH.width / 2, y: PITCH.height / 2 } },
    )
  }, [commit])

  /**
   * Color de las fichas de un equipo. Como el selector de color dispara un
   * cambio por cada movimiento del ratón, no se apila en el historial.
   */
  const setTeamColor = useCallback(
    (team, kind, hex) => {
      setBoard((current) => {
        const colors = teamColorsOf(current)
        return { ...current, colors: { ...colors, [team]: { ...colors[team], [kind]: hex } } }
      })
    },
    [setBoard],
  )

  /** Edición en vivo de un jugador (dorsal/nombre/portero): no ensucia el historial. */
  const updatePlayer = useCallback((playerId, changes) => {
    setBoard((current) => ({
      ...current,
      players: current.players.map((p) => (p.id === playerId ? { ...p, ...changes } : p)),
    }))
  }, [setBoard])

  /**
   * Carga una jugada guardada (el estado anterior queda en el historial).
   * Restaura también las etiquetas de formación: si no, los selectores y la
   * leyenda mostrarían una formación que no existe en esa modalidad.
   */
  const loadBoard = useCallback(
    (nextBoard, meta = {}) => {
      const loaded = structuredClone(nextBoard)
      commit({ ...loaded, colors: teamColorsOf(loaded) })
      setSelectedId(null)

      const size = meta.formationSize ?? formationSize
      setFormationSizeState(size)
      const options = formationNames(size)
      const pick = (value, fallback) => (options.includes(value) ? value : fallback)
      setHomeFormation(pick(meta.homeFormation, DEFAULT_FORMATION[size].home))
      setAwayFormation(pick(meta.awayFormation, DEFAULT_FORMATION[size].away))
    },
    [commit, formationSize],
  )

  return {
    board,
    draft,
    svgRef,
    selectedId,
    setSelectedId,
    selectedPlayer: board.players.find((p) => p.id === selectedId) ?? null,
    canUndo: state.past.length > 0,
    formationSize,
    homeFormation,
    awayFormation,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    erase,
    undo,
    applyFormation,
    addPlayer,
    squadCounts,
    clearTeam,
    setFormationSize,
    resetField,
    clearAnnotations,
    updatePlayer,
    toggleBall,
    setTeamColor,
    colors: teamColorsOf(board),
    loadBoard,
  }
}
