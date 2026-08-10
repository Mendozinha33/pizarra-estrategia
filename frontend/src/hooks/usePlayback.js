import { useCallback, useEffect, useRef, useState } from 'react'

import { ANIMATION_MS, MOVEMENT_SHAPES, PLAYER_SNAP_RADIUS } from '../lib/constants.js'
import { distance, pointAlong } from '../lib/geometry.js'

/**
 * Reproduce la jugada: cada jugador recorre el trazo que nace junto a él y el
 * balón encadena los pases dibujados, en el orden en que se dibujaron.
 */
export function usePlayback(board, { onWarn } = {}) {
  const [animation, setAnimation] = useState(null)
  const frameRef = useRef(0)
  const timeoutRef = useRef(0)

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    clearTimeout(timeoutRef.current)
    setAnimation(null)
  }, [])

  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current)
    clearTimeout(timeoutRef.current)
  }, [])

  const play = useCallback(() => {
    if (animation) return

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
    const ballRoute = passPoints.length > 1 ? [board.ball, ...passPoints] : null

    if (Object.keys(routes).length === 0 && !ballRoute) {
      onWarn?.('Dibuja un desplazamiento o un pase para poder reproducirlo')
      return
    }

    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / ANIMATION_MS)
      const players = {}
      Object.entries(routes).forEach(([playerId, points]) => {
        players[playerId] = pointAlong(points, t)
      })
      setAnimation({ players, ball: ballRoute ? pointAlong(ballRoute, t) : null, t })

      if (t < 1) frameRef.current = requestAnimationFrame(step)
      else timeoutRef.current = setTimeout(() => setAnimation(null), 700)
    }
    frameRef.current = requestAnimationFrame(step)
  }, [animation, board, onWarn])

  return { animation, isPlaying: animation !== null, play, stop }
}
