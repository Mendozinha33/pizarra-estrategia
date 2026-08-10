import { polylinePath, wavyPath } from '../../lib/geometry.js'

const HIT_WIDTH = 24

/** Un trazo del entrenador: desplazamiento, pase, conducción, zona o etiqueta. */
export function BoardShape({ shape, eraseMode = false, onErase }) {
  const handleErase = eraseMode
    ? (event) => {
        event.stopPropagation()
        onErase(shape.id, 'shape')
      }
    : undefined

  const stroke = {
    stroke: shape.color,
    fill: 'none',
    strokeWidth: 5,
    strokeLinecap: 'round',
    style: { cursor: eraseMode ? 'pointer' : 'default' },
    onPointerDown: handleErase,
  }

  const first = shape.points[0]
  const last = shape.points[shape.points.length - 1]
  const arrow = `url(#arrow-${shape.color.replace('#', '')})`

  if (shape.type === 'zone') {
    return (
      <rect
        x={Math.min(first.x, last.x)}
        y={Math.min(first.y, last.y)}
        width={Math.abs(last.x - first.x)}
        height={Math.abs(last.y - first.y)}
        {...stroke}
        fill={shape.color}
        fillOpacity=".1"
        strokeDasharray="14 10"
      />
    )
  }

  if (shape.type === 'text') {
    return (
      <text
        x={first.x}
        y={first.y}
        fill={shape.color}
        fontSize="30"
        fontFamily="'Barlow Condensed', sans-serif"
        fontWeight="600"
        letterSpacing="1"
        style={stroke.style}
        onPointerDown={handleErase}
      >
        {shape.text}
      </text>
    )
  }

  if (shape.type === 'dribble') {
    return (
      <>
        <path d={wavyPath(first, last)} {...stroke} markerEnd={arrow} />
        {eraseMode && <path d={wavyPath(first, last)} {...stroke} stroke="transparent" strokeWidth={HIT_WIDTH} />}
      </>
    )
  }

  if (shape.type === 'free') {
    return (
      <>
        <path d={polylinePath(shape.points)} {...stroke} markerEnd={arrow} />
        {eraseMode && (
          <path d={polylinePath(shape.points)} {...stroke} stroke="transparent" strokeWidth={HIT_WIDTH} />
        )}
      </>
    )
  }

  // run | pass
  return (
    <g>
      <line
        x1={first.x}
        y1={first.y}
        x2={last.x}
        y2={last.y}
        {...stroke}
        markerEnd={arrow}
        strokeDasharray={shape.type === 'pass' ? '18 12' : undefined}
      />
      {eraseMode && (
        <line
          x1={first.x}
          y1={first.y}
          x2={last.x}
          y2={last.y}
          stroke="transparent"
          strokeWidth={HIT_WIDTH}
          style={{ cursor: 'pointer' }}
          onPointerDown={handleErase}
        />
      )}
    </g>
  )
}
