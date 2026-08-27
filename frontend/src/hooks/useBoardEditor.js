import { useCallback, useMemo, useReducer, useRef, useState } from 'react'

import { isGoalkeeper, teamColorsOf } from '../lib/colors.js'
import {
  DRAW_TOOLS,
  ITEM_TOOLS,
  LABEL_SIZE,
  MAX_PLAYERS_PER_TEAM,
  SURFACES,
  UNDO_DEPTH,
} from '../lib/constants.js'
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
  // Cada equipo entra por su banda; en medio campo, donde se juega hacia el
  // otro lado, las bandas se cambian igual que la alineación.
  const nearTop = (team === 'away') !== Boolean(view.mirrored)
  return {
    x: view.x + 40 + (index % perRow) * step,
    y: nearTop ? view.y + 42 + row * 52 : view.y + view.h - 42 - row * 52,
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
export function useBoardEditor({ tool, color, bibColor, surface, labelText, onWarn }) {
  const [formationSize, setFormationSizeState] = useState('f11')
  const [homeFormation, setHomeFormation] = useState(DEFAULT_FORMATION.f11.home)
  const [awayFormation, setAwayFormation] = useState(DEFAULT_FORMATION.f11.away)

  const [state, dispatch] = useReducer(boardReducer, undefined, initialState)
  const { board } = state

  const [draft, setDraft] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [selectedShapeId, setSelectedShapeId] = useState(null)

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
        // Con la herramienta de petos, tocar una ficha le pone (o le quita) el
        // color elegido: repartir los grupos es un toque por jugador.
        if (tool === 'bib') {
          commit((current) => ({
            ...current,
            players: current.players.map((p) =>
              p.id === target.player ? { ...p, color: bibColor ?? null } : p,
            ),
          }))
          return
        }
        if (tool !== 'select') return
        event.stopPropagation()
        event.currentTarget.setPointerCapture?.(event.pointerId)
        pushHistory()
        dragRef.current = { kind: 'player', id: target.player }
        setSelectedId(target.player)
        setSelectedItemId(null)
        setSelectedShapeId(null)
        return
      }

      if (target?.item) {
        if (tool === 'erase') {
          commit((current) => ({
            ...current,
            items: current.items.filter((i) => i.id !== target.item),
          }))
          setSelectedItemId(null)
          return
        }
        if (tool !== 'select') return
        event.stopPropagation()
        event.currentTarget.setPointerCapture?.(event.pointerId)
        pushHistory()
        dragRef.current = { kind: 'item', id: target.item }
        setSelectedItemId(target.item)
        setSelectedId(null)
        setSelectedShapeId(null)
        return
      }

      // Etiquetas: se seleccionan y se arrastran como una ficha más.
      if (target?.shape) {
        if (tool === 'erase') {
          commit((current) => ({
            ...current,
            shapes: current.shapes.filter((shape) => shape.id !== target.shape),
          }))
          setSelectedShapeId(null)
          return
        }
        if (tool !== 'select') return
        event.stopPropagation()
        event.currentTarget.setPointerCapture?.(event.pointerId)
        pushHistory()
        dragRef.current = {
          kind: 'shape',
          id: target.shape,
          from: point,
          points: board.shapes.find((shape) => shape.id === target.shape)?.points ?? [],
        }
        setSelectedShapeId(target.shape)
        setSelectedId(null)
        setSelectedItemId(null)
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
        setSelectedItemId(null)
        setSelectedShapeId(null)
        return
      }

      // Coloca el balón donde se toca, aunque se hubiera quitado del campo.
      if (tool === 'ball') {
        commit((current) => ({ ...current, ball: point }))
        return
      }

      const itemKind = ITEM_TOOLS[tool]
      if (itemKind) {
        // Se coloca mirando como el último del mismo tipo: al repartir varias
        // escaleras o porterías en la misma dirección basta girar la primera.
        const id = uid()
        commit((current) => {
          const previous = [...current.items].reverse().find((i) => i.kind === itemKind)
          return {
            ...current,
            items: [
              ...current.items,
              { id, kind: itemKind, x: point.x, y: point.y, angle: previous?.angle ?? 0 },
            ],
          }
        })
        setSelectedItemId(id)
        setSelectedId(null)
        setSelectedShapeId(null)
        return
      }

      if (tool === 'text') {
        if (!labelText.trim()) {
          onWarn?.('Escribe el texto de la etiqueta antes de colocarla')
          return
        }
        const id = uid()
        commit((current) => ({
          ...current,
          shapes: [
            ...current.shapes,
            {
              id,
              type: 'text',
              points: [point],
              color,
              text: labelText.trim(),
              size: LABEL_SIZE.default,
              angle: 0,
            },
          ],
        }))
        setSelectedShapeId(id)
        setSelectedId(null)
        setSelectedItemId(null)
        return
      }

      if (DRAW_TOOLS.has(tool)) {
        setDraft({ id: 'draft', type: tool, points: [point, point], color, text: '' })
      }
    },
    [tool, color, bibColor, labelText, board.shapes, commit, pushHistory, pointFrom, onWarn],
  )

  const handlePointerMove = useCallback(
    (event) => {
      const drag = dragRef.current
      if (drag) {
        const point = pointFrom(event)
        setBoard((current) => {
          if (drag.kind === 'ball') return { ...current, ball: point }
          if (drag.kind === 'item') {
            return {
              ...current,
              items: current.items.map((i) => (i.id === drag.id ? { ...i, ...point } : i)),
            }
          }
          if (drag.kind === 'shape') {
            // La etiqueta se mueve entera desde donde se agarró: se recolocan
            // sus puntos de partida, no los actuales, para no acumular error.
            const dx = point.x - drag.from.x
            const dy = point.y - drag.from.y
            return {
              ...current,
              shapes: current.shapes.map((shape) =>
                shape.id === drag.id
                  ? { ...shape, points: drag.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
                  : shape,
              ),
            }
          }
          return {
            ...current,
            players: current.players.map((p) => (p.id === drag.id ? { ...p, ...point } : p)),
          }
        })
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
      const view = SURFACES[surface] ?? SURFACES.full
      commit((current) => ({
        ...current,
        players: [
          ...current.players.filter((p) => p.team !== team),
          ...buildTeam(team, formation, formationSize, view),
        ],
      }))
      if (team === 'home') setHomeFormation(formation)
      else setAwayFormation(formation)
    },
    [commit, formationSize, surface],
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
    (team) => {
      commit((current) => ({
        ...current,
        players: current.players.filter((p) => p.team !== team),
      }))
      setSelectedId(null)
    },
    [commit],
  )

  /** Deja el campo sin ninguna ficha, para colocarlas una a una. */
  const clearPlayers = useCallback(() => {
    commit((current) => ({ ...current, players: [] }))
    setSelectedId(null)
  }, [commit])

  /** Quita una ficha suelta (la seleccionada en el panel). */
  const removePlayer = useCallback(
    (playerId) => {
      commit((current) => ({
        ...current,
        players: current.players.filter((p) => p.id !== playerId),
      }))
      setSelectedId(null)
    },
    [commit],
  )

  /**
   * Orientación del material seleccionado. `rotateItem` gira a saltos (queda en
   * el historial) y `setItemAngle` es el ajuste fino con la rueda, que se
   * dispara en cada movimiento y por eso no se apila.
   */
  const normalizeAngle = (angle) => ((angle % 360) + 360) % 360

  const rotateItem = useCallback(
    (itemId, delta) =>
      commit((current) => ({
        ...current,
        items: current.items.map((i) =>
          i.id === itemId ? { ...i, angle: normalizeAngle((i.angle ?? 0) + delta) } : i,
        ),
      })),
    [commit],
  )

  const setItemAngle = useCallback(
    (itemId, angle) =>
      setBoard((current) => ({
        ...current,
        items: current.items.map((i) =>
          i.id === itemId ? { ...i, angle: normalizeAngle(angle) } : i,
        ),
      })),
    [setBoard],
  )

  const removeItem = useCallback(
    (itemId) => {
      commit((current) => ({ ...current, items: current.items.filter((i) => i.id !== itemId) }))
      setSelectedItemId(null)
    },
    [commit],
  )

  /**
   * Etiquetas de texto: tamaño de letra, inclinación y contenido. El tamaño y
   * la inclinación llegan de un deslizador (un cambio por cada movimiento del
   * ratón), así que no se apilan en el historial; los giros a saltos sí.
   */
  const updateShape = useCallback(
    (shapeId, changes, undoable = false) => {
      const apply = (current) => ({
        ...current,
        shapes: current.shapes.map((shape) =>
          shape.id === shapeId ? { ...shape, ...changes } : shape,
        ),
      })
      if (undoable) commit(apply)
      else setBoard(apply)
    },
    [commit, setBoard],
  )

  const setShapeSize = useCallback(
    (shapeId, size) => updateShape(shapeId, { size }),
    [updateShape],
  )

  const setShapeAngle = useCallback(
    (shapeId, angle) => updateShape(shapeId, { angle: normalizeAngle(angle) }),
    [updateShape],
  )

  const setShapeText = useCallback(
    (shapeId, text) => updateShape(shapeId, { text }),
    [updateShape],
  )

  const rotateShape = useCallback(
    (shapeId, delta) =>
      commit((current) => ({
        ...current,
        shapes: current.shapes.map((shape) =>
          shape.id === shapeId ? { ...shape, angle: normalizeAngle((shape.angle ?? 0) + delta) } : shape,
        ),
      })),
    [commit],
  )

  const removeShape = useCallback(
    (shapeId) => {
      commit((current) => ({
        ...current,
        shapes: current.shapes.filter((shape) => shape.id !== shapeId),
      }))
      setSelectedShapeId(null)
    },
    [commit],
  )

  /** Devuelve todas las fichas de un equipo al color de su equipo. */
  const clearBibs = useCallback(
    (team) =>
      commit((current) => ({
        ...current,
        players: current.players.map((p) => (p.team === team ? { ...p, color: null } : p)),
      })),
    [commit],
  )

  const setFormationSize = useCallback(
    (size) => {
      const home = DEFAULT_FORMATION[size].home
      const away = DEFAULT_FORMATION[size].away
      setFormationSizeState(size)
      setHomeFormation(home)
      setAwayFormation(away)
      const view = SURFACES[surface] ?? SURFACES.full
      commit((current) => ({
        ...current,
        players: [
          ...buildTeam('home', home, size, view),
          ...(current.players.some((p) => p.team === 'away')
            ? buildTeam('away', away, size, view)
            : []),
        ],
      }))
    },
    [commit, surface],
  )

  const resetField = useCallback(() => {
    const view = SURFACES[surface] ?? SURFACES.full
    // Vaciar el campo no debe deshacer los colores elegidos para las fichas.
    commit((current) => ({
      ...emptyBoard(),
      colors: teamColorsOf(current),
      players: buildTeam('home', homeFormation, formationSize, view),
      ball: { x: view.x + view.w / 2, y: view.y + view.h / 2 },
    }))
    setSelectedId(null)
    setSelectedItemId(null)
    setSelectedShapeId(null)
  }, [commit, homeFormation, formationSize, surface])

  const clearAnnotations = useCallback(() => {
    commit((current) => ({ ...current, shapes: [], items: [] }))
    setSelectedItemId(null)
    setSelectedShapeId(null)
  }, [commit])

  /** Quita el balón del campo o lo devuelve al centro. */
  const toggleBall = useCallback(() => {
    const view = SURFACES[surface] ?? SURFACES.full
    commit((current) =>
      current.ball
        ? { ...current, ball: null }
        : { ...current, ball: { x: view.x + view.w / 2, y: view.y + view.h / 2 } },
    )
  }, [commit, surface])

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
   * Recoloca lo dibujado al cambiar de superficie: lo que ocupaba el campo
   * entero se encoge en el medio campo (y al revés, se estira al volver), así
   * no se queda ningún jugador fuera de lo que se está viendo.
   */
  const fitToSurface = useCallback((fromSurface, toSurface) => {
    const from = SURFACES[fromSurface] ?? SURFACES.full
    const to = SURFACES[toSurface] ?? SURFACES.full
    // En medio campo se juega hacia el otro lado, así que además de encoger hay
    // que dar la vuelta al dibujo para que cada equipo siga defendiendo su
    // portería.
    const flip = Boolean(from.mirrored) !== Boolean(to.mirrored)
    // El campo entero y el espacio reducido son el mismo rectángulo, igual que
    // el medio campo y el medio campo horizontal: ahí no hay nada que mover.
    const sameArea =
      from.x === to.x && from.y === to.y && from.w === to.w && from.h === to.h
    if (sameArea && !flip) return

    const move = (point) => {
      const fx = (point.x - from.x) / from.w
      const fy = (point.y - from.y) / from.h
      return {
        ...point,
        x: to.x + (flip ? 1 - fx : fx) * to.w,
        y: to.y + (flip ? 1 - fy : fy) * to.h,
      }
    }

    commit((current) => ({
      ...current,
      players: current.players.map(move),
      items: current.items.map(move),
      shapes: current.shapes.map((shape) => ({ ...shape, points: shape.points.map(move) })),
      ball: current.ball ? move(current.ball) : null,
    }))
  }, [commit])

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
      setSelectedItemId(null)
      setSelectedShapeId(null)

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
    selectedItemId,
    selectedShapeId,
    selectedPlayer: board.players.find((p) => p.id === selectedId) ?? null,
    selectedItem: board.items.find((i) => i.id === selectedItemId) ?? null,
    selectedShape: board.shapes.find((shape) => shape.id === selectedShapeId) ?? null,
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
    clearPlayers,
    removePlayer,
    clearBibs,
    rotateItem,
    setItemAngle,
    removeItem,
    rotateShape,
    setShapeAngle,
    setShapeSize,
    setShapeText,
    removeShape,
    setFormationSize,
    fitToSurface,
    resetField,
    clearAnnotations,
    updatePlayer,
    toggleBall,
    setTeamColor,
    colors: teamColorsOf(board),
    loadBoard,
  }
}
