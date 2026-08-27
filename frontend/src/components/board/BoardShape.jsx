import { COLORS, LABEL_SIZE } from '../../lib/constants.js'
import { polylinePath, wavyPath } from '../../lib/geometry.js'

const HIT_WIDTH = 24

/** Ancho aproximado de una etiqueta, para su zona de agarre y su marco. */
const labelWidth = (text, size) => Math.max(size, (text?.length ?? 0) * size * 0.5)

/**
 * Un trazo del entrenador: desplazamiento, pase, conducción, zona o etiqueta.
 *
 * `counter` son los grados que hay que descontar para que el texto salga
 * derecho cuando el campo se dibuja girado (medio campo horizontal).
 */
export function BoardShape({
  shape,
  eraseMode = false,
  onErase,
  counter = 0,
  selected = false,
  interactive = false,
  onPointerDown,
}) {
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
    const size = shape.size ?? LABEL_SIZE.default
    const width = labelWidth(shape.text, size)
    // La etiqueta se coloca y se gira con la transformación del grupo, así se
    // puede arrastrar, agrandar e inclinar sin tocar sus coordenadas.
    const angle = (shape.angle ?? 0) + counter
    const grab = interactive
      ? (event) => {
          event.stopPropagation()
          onPointerDown(event, { shape: shape.id })
        }
      : handleErase
    const cursor = eraseMode ? 'pointer' : interactive ? 'grab' : 'default'

    return (
      <g
        transform={`translate(${first.x},${first.y}) rotate(${angle})`}
        onPointerDown={grab}
        style={{ cursor }}
      >
        {selected && (
          <rect
            x={-8}
            y={-size - 2}
            width={width + 16}
            height={size + 14}
            rx="5"
            fill="none"
            stroke={COLORS.mint}
            strokeWidth="2.5"
            strokeDasharray="6 5"
          />
        )}
        {/* Zona de agarre: sin ella sólo se podría tocar el trazo de las letras. */}
        <rect x={-8} y={-size - 2} width={width + 16} height={size + 14} fill="transparent" />
        <text
          fill={shape.color}
          fontSize={size}
          fontFamily="'Barlow Condensed', sans-serif"
          fontWeight="600"
          letterSpacing="1"
        >
          {shape.text}
        </text>
      </g>
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
