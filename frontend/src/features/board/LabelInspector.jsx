import { Icon } from '../../components/ui/Icon.jsx'
import { LABEL_SIZE } from '../../lib/constants.js'

/** Texto, tamaño y giro de la etiqueta seleccionada en el campo. */
export function LabelInspector({ shape, onTextChange, onSizeChange, onRotate, onAngleChange, onRemove }) {
  if (!shape || shape.type !== 'text') return null

  const size = Math.round(shape.size ?? LABEL_SIZE.default)
  const angle = Math.round(shape.angle ?? 0)

  return (
    <div className="card">
      <h3>Etiqueta seleccionada</h3>

      <label className="f" htmlFor="label-text">
        Texto
      </label>
      <input
        id="label-text"
        type="text"
        maxLength={80}
        value={shape.text}
        onChange={(e) => onTextChange(shape.id, e.target.value)}
      />

      <label className="f" htmlFor="label-size" style={{ marginTop: 8 }}>
        Tamaño de la letra · {size}
      </label>
      <input
        id="label-size"
        type="range"
        min={LABEL_SIZE.min}
        max={LABEL_SIZE.max}
        step={LABEL_SIZE.step}
        style={{ width: '100%' }}
        value={size}
        onChange={(e) => onSizeChange(shape.id, Number(e.target.value))}
      />

      <label className="f" htmlFor="label-angle" style={{ marginTop: 8 }}>
        Inclinación · {angle}°
      </label>
      <div className="row" style={{ alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          className="btn ghost"
          title="Girar 15° a la izquierda"
          aria-label="Girar 15° a la izquierda"
          onClick={() => onRotate(shape.id, -15)}
        >
          <Icon name="rotate" size={15} />
          15°
        </button>
        <input
          id="label-angle"
          type="range"
          min="0"
          max="355"
          step="5"
          style={{ flex: 1 }}
          value={angle}
          onChange={(e) => onAngleChange(shape.id, Number(e.target.value))}
        />
        <button
          type="button"
          className="btn ghost"
          title="Girar 15° a la derecha"
          aria-label="Girar 15° a la derecha"
          onClick={() => onRotate(shape.id, 15)}
        >
          <Icon name="rotateRight" size={15} />
          15°
        </button>
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn ghost"
          style={{ flex: 1 }}
          onClick={() => onAngleChange(shape.id, 0)}
        >
          Poner derecha
        </button>
        <button
          type="button"
          className="btn ghost"
          style={{ flex: 1 }}
          onClick={() => onAngleChange(shape.id, 270)}
        >
          Poner en vertical
        </button>
        <button type="button" className="btn danger" onClick={() => onRemove(shape.id)}>
          <Icon name="trash" size={14} />
          Quitar
        </button>
      </div>

      <p className="hint" style={{ marginTop: 8 }}>
        Con la herramienta <strong>Mover</strong> puedes arrastrarla por el campo.
      </p>
    </div>
  )
}
