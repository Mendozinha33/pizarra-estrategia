import { useCallback, useEffect, useRef, useState } from 'react'

import { ANIMATION_MS, MOVEMENT_SHAPES, PLAYER_SNAP_RADIUS } from '../lib/constants.js'
import { distance, pointAlong } from '../lib/geometry.js'

/**
 * Prepara el recorrido de la jugada: qué trazo sigue cada jugador y por dónde
 * va el balón. Devuelve `null` si no hay nada que animar.
 */
function planRoutes(board) {
  // Cada jugador se queda con el primer trazo de movimiento que empiece cerca.
  const routes = {}
  board.shapes
    .filter((shape) => MOVEMENT_SHAPES.has(shape.type))
    .forEach((shape) => {
      const origin = shape.points[0]
      let closest = null
      let best = PLAYER_SNAP_RADIUS
      board.players.forEach((player) => {
        const d = distance(player, origin)
        if (d < best) {
          best = d
          closest = player
        }
      })
      if (closest && !routes[closest.id]) routes[closest.id] = shape.points
    })

  const passPoints = board.shapes
    .filter((shape) => shape.type === 'pass')
    .flatMap((shape) => shape.points)
  // Si el entrenador ha quitado el balón del campo, los pases se dibujan pero
  // no hay nada que mover.
  const ballRoute = board.ball && passPoints.length > 1 ? [board.ball, ...passPoints] : null

  if (Object.keys(routes).length === 0 && !ballRoute) return null
  return { routes, ballRoute }
}

/**
 * Reproduce la jugada: cada jugador recorre el trazo que nace junto a él y el
 * balón encadena los pases dibujados, en el orden en que se dibujaron.
 *
 * Se puede pausar: se guarda el tiempo ya recorrido y al continuar se retoma
 * desde ese mismo punto, sin volver a empezar.
 */
export function usePlayback(board, { onWarn } = {}) {
  const [animation, setAnimation] = useState(null)
  const [paused, setPaused] = useState(false)
  const frameRef = useRef(0)
  const timeoutRef = useRef(0)
  const planRef = useRef(null)
  const elapsedRef = useRef(0)

  const cancelTimers = () => {
    cancelAnimationFrame(frameRef.current)
    clearTimeout(timeoutRef.current)
  }

  const stop = useCallback(() => {
    cancelTimers()
    planRef.current = null
    elapsedRef.current = 0
    setPaused(false)
    setAnimation(null)
  }, [])

  useEffect(() => cancelTimers, [])

  /** Dibuja el instante `t` (de 0 a 1) de la jugada preparada. */
  const render = useCallback((plan, t) => {
    const players = {}
    Object.entries(plan.routes).forEach(([playerId, points]) => {
      players[playerId] = pointAlong(points, t)
    })
    setAnimation({ players, ball: plan.ballRoute ? pointAlong(plan.ballRoute, t) : null, t })
  }, [])

  /** Arranca (o retoma) el reloj desde el tiempo ya recorrido. */
  const run = useCallback(() => {
    const plan = planRef.current
    if (!plan) return
    const start = performance.now() - elapsedRef.current
    const step = (now) => {
      const elapsed = Math.min(ANIMATION_MS, now - start)
      elapsedRef.current = elapsed
      render(plan, elapsed / ANIMATION_MS)

      if (elapsed < ANIMATION_MS) frameRef.current = requestAnimationFrame(step)
      else timeoutRef.current = setTimeout(stop, 700)
    }
    frameRef.current = requestAnimationFrame(step)
  }, [render, stop])

  /** Reproduce desde el principio, o continúa si estaba en pausa. */
  const play = useCallback(() => {
    if (paused) {
      setPaused(false)
      run()
      return
    }
    if (animation) return

    const plan = planRoutes(board)
    if (!plan) {
      onWarn?.('Dibuja un desplazamiento o un pase para poder reproducirlo')
      return
    }
    planRef.current = plan
    elapsedRef.current = 0
    run()
  }, [animation, paused, board, run, onWarn])

  /** Congela la jugada en el punto en el que va. */
  const pause = useCallback(() => {
    if (!planRef.current || paused) return
    cancelTimers()
    setPaused(true)
  }, [paused])

  return {
    animation,
    isPlaying: animation !== null,
    isPaused: paused,
    play,
    pause,
    stop,
  }
}
