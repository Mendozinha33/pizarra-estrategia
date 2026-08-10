import { useCallback, useReducer, useRef, useState } from 'react'

import { SURFACES, UNDO_DEPTH } from '../lib/constants.js'
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

      if (tool === 'cone' || tool === 'extraBall') {
        commit((current) => ({
          ...current,
          items: [
            ...current.items,
            { id: uid(), kind: tool === 'cone' ? 'cone' : 'ball', x: point.x, y: point.y },
          ],
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
    commit({ ...emptyBoard(), players: buildTeam('home', homeFormation, formationSize) })
    setSelectedId(null)
  }, [commit, homeFormation, formationSize])

  const clearAnnotations = useCallback(
    () => commit((current) => ({ ...current, shapes: [], items: [] })),
    [commit],
  )

  /** Edición en vivo de un jugador (dorsal/nombre): no ensucia el historial. */
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
      commit(structuredClone(nextBoard))
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
    clearTeam,
    setFormationSize,
    resetField,
    clearAnnotations,
    updatePlayer,
    loadBoard,
  }
}
