import { memo } from 'react'

import { inkOn, teamColorsOf, tokenColor } from '../../lib/colors.js'
import { COLORS, PEN_COLORS, PLAYBACK_HIDDEN_SHAPES, SURFACES } from '../../lib/constants.js'
import { BoardShape } from './BoardShape.jsx'
import { PitchMarkings } from './PitchMarkings.jsx'

const STRIPES = Array.from({ length: 10 }, (_, i) => i)

function Ball({ x, y, cursor, interactive, onPointerDown }) {
  return (
    <g
      transform={`translate(${x},${y})`}
      onPointerDown={interactive ? (event) => onPointerDown(event, { ball: true }) : undefined}
      style={{ cursor }}
    >
      <circle r="13" fill="#fff" stroke="rgba(0,0,0,.45)" strokeWidth="2.5" />
      <path d="M0,-7 L6,-2 L4,5 L-4,5 L-6,-2 Z" fill={COLORS.ink} opacity=".85" />
    </g>
  )
}

function PlayerToken({ player, position, colors, selected, cursor, onPointerDown }) {
  const fill = tokenColor(player, colors)
  return (
    <g
      transform={`translate(${position.x},${position.y})`}
      onPointerDown={onPointerDown}
      style={{ cursor }}
    >
      <ellipse cx="0" cy="21" rx="17" ry="5" fill="rgba(0,0,0,.28)" />
      <circle
        r="20"
        fill={fill}
        stroke={selected ? COLORS.mint : 'rgba(0,0,0,.45)'}
        strokeWidth={selected ? 4 : 2.5}
      />
      <circle r="20" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" transform="scale(.82)" />
      <text
        y="8"
        textAnchor="middle"
        fontSize="23"
        fontWeight="700"
        fontFamily="'Barlow Condensed', sans-serif"
        fill={inkOn(fill)}
      >
        {player.num}
      </text>
      {player.name && (
        <text
          y="42"
          textAnchor="middle"
          fontSize="20"
          fontWeight="600"
          letterSpacing="1"
          fontFamily="'Barlow Condensed', sans-serif"
          fill="rgba(234,242,236,.95)"
          stroke="rgba(0,0,0,.5)"
          strokeWidth="4"
          paintOrder="stroke"
        >
          {player.name}
        </text>
      )}
    </g>
  )
}

/**
 * Lienzo del campo. En modo `readOnly` sirve como miniatura de una jugada
 * guardada: mismo render, sin interacción.
 */
function BoardCanvasBase({
  board,
  surface = 'full',
  svgRef,
  readOnly = false,
  tool = 'select',
  animation = null,
  draft = null,
  selectedId = null,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onErase,
  title,
}) {
  const view = SURFACES[surface] ?? SURFACES.full
  const eraseMode = !readOnly && tool === 'erase'
  const positionOf = (player) => animation?.players[player.id] ?? player
  const ball = animation?.ball ?? board.ball ?? null
  const colors = teamColorsOf(board)
  // Durante la reproducción se esconden las flechas y líneas: el movimiento ya
  // lo cuentan los dorsales.
  const shapes = animation
    ? board.shapes.filter((shape) => !PLAYBACK_HIDDEN_SHAPES.has(shape.type))
    : board.shapes

  const eraseHandler = (id, kind) => (event) => {
    event.stopPropagation()
    onErase(id, kind)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      role="img"
      aria-label={title ?? 'Pizarra táctica'}
      style={{
        width: '100%',
        display: 'block',
        aspectRatio: `${view.w} / ${view.h}`,
        touchAction: 'none',
        borderRadius: 6,
      }}
      onPointerDown={readOnly ? undefined : onPointerDown}
      onPointerMove={readOnly ? undefined : onPointerMove}
      onPointerUp={readOnly ? undefined : onPointerUp}
      onPointerLeave={readOnly ? undefined : onPointerUp}
    >
      <defs>
        {PEN_COLORS.map((pen) => (
          <marker
            key={pen.id}
            id={`arrow-${pen.hex.replace('#', '')}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,1 L9,5 L0,9 z" fill={pen.hex} />
          </marker>
        ))}
      </defs>

      <g>
        {STRIPES.map((i) => (
          <rect key={i} x={i * 105} y="0" width="105" height="680" fill={i % 2 ? COLORS.grassAlt : COLORS.grass} />
        ))}
      </g>

      <PitchMarkings surface={surface} />

      {board.items.map((item) =>
        item.kind === 'cone' ? (
          <path
            key={item.id}
            d={`M${item.x},${item.y - 15} L${item.x + 13},${item.y + 11} L${item.x - 13},${item.y + 11} Z`}
            fill="#FF8A3D"
            stroke="rgba(0,0,0,.35)"
            strokeWidth="2"
            onPointerDown={eraseMode ? eraseHandler(item.id, 'item') : undefined}
            style={{ cursor: eraseMode ? 'pointer' : 'default' }}
          />
        ) : (
          <circle
            key={item.id}
            cx={item.x}
            cy={item.y}
            r="9"
            fill="#fff"
            stroke="rgba(0,0,0,.4)"
            strokeWidth="2"
            onPointerDown={eraseMode ? eraseHandler(item.id, 'item') : undefined}
            style={{ cursor: eraseMode ? 'pointer' : 'default' }}
          />
        ),
      )}

      {shapes.map((shape) => (
        <BoardShape key={shape.id} shape={shape} eraseMode={eraseMode} onErase={onErase} />
      ))}

      {draft && (
        <g opacity=".85">
          <BoardShape shape={draft} />
        </g>
      )}

      {/* El balón es opcional: la jugada puede empezar sin él. */}
      {ball && (
        <Ball
          x={ball.x}
          y={ball.y}
          interactive={!readOnly && (tool === 'select' || eraseMode)}
          cursor={readOnly ? 'default' : eraseMode ? 'pointer' : tool === 'select' ? 'grab' : 'default'}
          onPointerDown={onPointerDown}
        />
      )}

      {board.players.map((player) => (
        <PlayerToken
          key={player.id}
          player={player}
          position={positionOf(player)}
          colors={colors}
          selected={selectedId === player.id}
          cursor={readOnly ? 'default' : eraseMode ? 'pointer' : 'grab'}
          onPointerDown={readOnly ? undefined : (event) => onPointerDown(event, { player: player.id })}
        />
      ))}
    </svg>
  )
}

export const BoardCanvas = memo(BoardCanvasBase)
