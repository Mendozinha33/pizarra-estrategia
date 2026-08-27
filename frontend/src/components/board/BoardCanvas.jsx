import { memo } from 'react'

import { inkOn, teamColorsOf, tokenColor } from '../../lib/colors.js'
import { COLORS, PEN_COLORS, PLAYBACK_HIDDEN_SHAPES, SURFACES } from '../../lib/constants.js'
import { viewBoxOf } from '../../lib/geometry.js'
import { BoardShape } from './BoardShape.jsx'
import { PitchMarkings } from './PitchMarkings.jsx'

const STRIPES = Array.from({ length: 10 }, (_, i) => i)

function Ball({ x, y, cursor, counter = 0, interactive, onPointerDown }) {
  return (
    <g
      transform={`translate(${x},${y}) rotate(${counter})`}
      onPointerDown={interactive ? (event) => onPointerDown(event, { ball: true }) : undefined}
      style={{ cursor }}
    >
      <circle r="13" fill="#fff" stroke="rgba(0,0,0,.45)" strokeWidth="2.5" />
      <path d="M0,-7 L6,-2 L4,5 L-4,5 L-6,-2 Z" fill={COLORS.ink} opacity=".85" />
    </g>
  )
}

/** Medidas de las porterías y la escalera, en unidades de pizarra (10 ≈ 1 m). */
const GOALS = {
  big_goal: { w: 76, d: 24, posts: 3.5 },
  small_goal: { w: 42, d: 16, posts: 3 },
}
const LADDER = { w: 62, d: 20, rungs: 5 }

/** Portería vista desde arriba: dos palos, larguero y red. Centrada en (0,0). */
function Goal({ kind }) {
  const { w, d, posts } = GOALS[kind]
  const left = -w / 2
  const top = -d / 2
  const nets = [0.25, 0.5, 0.75]
  return (
    <>
      <rect x={left} y={top} width={w} height={d} fill="rgba(255,255,255,.14)" />
      {nets.map((f) => (
        <line
          key={f}
          x1={left + w * f}
          y1={top}
          x2={left + w * f}
          y2={top + d}
          stroke="rgba(234,242,236,.5)"
          strokeWidth="1.5"
        />
      ))}
      <path
        d={`M${left},${top + d} L${left},${top} L${left + w},${top} L${left + w},${top + d}`}
        fill="none"
        stroke="#EAF2EC"
        strokeWidth={posts}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

/** Escalera de coordinación, centrada en (0,0). */
function Ladder() {
  const { w, d, rungs } = LADDER
  const left = -w / 2
  const top = -d / 2
  return (
    <>
      <rect x={left} y={top} width={w} height={d} fill="rgba(255,212,71,.16)" />
      {Array.from({ length: rungs + 1 }, (_, i) => (
        <line
          key={i}
          x1={left + (w / rungs) * i}
          y1={top}
          x2={left + (w / rungs) * i}
          y2={top + d}
          stroke="#FFD447"
          strokeWidth="2.5"
        />
      ))}
      <rect x={left} y={top} width={w} height={d} fill="none" stroke="#FFD447" strokeWidth="3" />
    </>
  )
}

/** Dibujo de cada material, siempre centrado en (0,0) para poder girarlo. */
function ItemShape({ kind }) {
  if (kind === 'cone') {
    return (
      <path d="M0,-15 L13,11 L-13,11 Z" fill="#FF8A3D" stroke="rgba(0,0,0,.35)" strokeWidth="2" />
    )
  }
  if (kind === 'small_goal' || kind === 'big_goal') return <Goal kind={kind} />
  if (kind === 'ladder') return <Ladder />
  return <circle r="9" fill="#fff" stroke="rgba(0,0,0,.4)" strokeWidth="2" />
}

/** Radio del aro de selección de cada material. */
const ITEM_HALO = { cone: 20, small_goal: 28, big_goal: 45, ladder: 36, ball: 15 }

/**
 * Material colocado en el campo: conos, balones, porterías y escaleras. Se
 * dibuja en el origen y se coloca y gira con la transformación del grupo, así
 * cada elemento puede mirar hacia donde el entrenador quiera.
 */
function FieldItem({ item, selected, cursor, interactive, onPointerDown }) {
  return (
    <g
      transform={`translate(${item.x},${item.y}) rotate(${item.angle ?? 0})`}
      onPointerDown={
        interactive
          ? (event) => {
              event.stopPropagation()
              onPointerDown(event, { item: item.id })
            }
          : undefined
      }
      style={{ cursor }}
    >
      {selected && (
        <circle
          r={ITEM_HALO[item.kind] ?? 24}
          fill="none"
          stroke={COLORS.mint}
          strokeWidth="3"
          strokeDasharray="6 5"
        />
      )}
      <ItemShape kind={item.kind} />
    </g>
  )
}

function PlayerToken({ player, position, colors, selected, cursor, counter = 0, onPointerDown }) {
  const fill = tokenColor(player, colors)
  return (
    <g
      transform={`translate(${position.x},${position.y}) rotate(${counter})`}
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
  selectedItemId = null,
  selectedShapeId = null,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onErase,
  title,
}) {
  const view = SURFACES[surface] ?? SURFACES.full
  const box = viewBoxOf(view)
  // El medio campo horizontal se dibuja girando todo el campo; las fichas y las
  // etiquetas se giran de vuelta para que se lean derechas.
  const spin = view.rotate ?? 0
  const counter = -spin
  const eraseMode = !readOnly && tool === 'erase'
  const positionOf = (player) => animation?.players[player.id] ?? player
  const ball = animation?.ball ?? board.ball ?? null
  const colors = teamColorsOf(board)
  // Durante la reproducción se esconden las flechas y líneas: el movimiento ya
  // lo cuentan los dorsales.
  const shapes = animation
    ? board.shapes.filter((shape) => !PLAYBACK_HIDDEN_SHAPES.has(shape.type))
    : board.shapes

  return (
    <svg
      ref={svgRef}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      role="img"
      aria-label={title ?? 'Pizarra táctica'}
      style={{
        width: '100%',
        display: 'block',
        aspectRatio: `${box.w} / ${box.h}`,
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

      <g transform={`rotate(${spin})`}>
        <g>
          {STRIPES.map((i) => (
            <rect key={i} x={i * 105} y="0" width="105" height="680" fill={i % 2 ? COLORS.grassAlt : COLORS.grass} />
          ))}
        </g>

        <PitchMarkings surface={surface} />

        {board.items.map((item) => (
          <FieldItem
            key={item.id}
            item={item}
            selected={selectedItemId === item.id}
            interactive={!readOnly && (tool === 'select' || eraseMode)}
            cursor={readOnly ? 'default' : eraseMode ? 'pointer' : tool === 'select' ? 'grab' : 'default'}
            onPointerDown={onPointerDown}
          />
        ))}

        {shapes.map((shape) => (
          <BoardShape
            key={shape.id}
            shape={shape}
            counter={counter}
            eraseMode={eraseMode}
            onErase={onErase}
            selected={selectedShapeId === shape.id}
            interactive={!readOnly && tool === 'select' && shape.type === 'text'}
            onPointerDown={onPointerDown}
          />
        ))}

        {draft && (
          <g opacity=".85">
            <BoardShape shape={draft} counter={counter} />
          </g>
        )}

        {/* El balón es opcional: la jugada puede empezar sin él. */}
        {ball && (
          <Ball
            x={ball.x}
            y={ball.y}
            counter={counter}
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
            counter={counter}
            selected={selectedId === player.id}
            cursor={readOnly ? 'default' : eraseMode || tool === 'bib' ? 'pointer' : 'grab'}
            onPointerDown={readOnly ? undefined : (event) => onPointerDown(event, { player: player.id })}
          />
        ))}
      </g>
    </svg>
  )
}

export const BoardCanvas = memo(BoardCanvasBase)
