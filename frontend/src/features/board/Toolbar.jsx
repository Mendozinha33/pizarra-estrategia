import { PEN_COLORS, TOOLS } from '../../lib/constants.js'
import { Icon } from '../../components/ui/Icon.jsx'

/** Bandeja de herramientas, colores y acciones del lienzo. */
export function Toolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  labelText,
  onLabelTextChange,
  onPlay,
  isPlaying,
  onUndo,
  canUndo,
  onClear,
  onExport,
}) {
  return (
    <div className="tray">
      <div className="tgroup" role="toolbar" aria-label="Herramientas de dibujo">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tool ${tool === item.id ? 'on' : ''}`}
            title={`${item.label} (${item.key.toUpperCase()})`}
            aria-label={item.label}
            aria-pressed={tool === item.id}
            onClick={() => onToolChange(item.id)}
          >
            <Icon name={item.icon} size={17} />
          </button>
        ))}
      </div>

      <div className="row" style={{ alignItems: 'center', gap: 6 }}>
        {PEN_COLORS.map((pen) => (
          <button
            key={pen.id}
            type="button"
            className={`swatch ${color === pen.hex ? 'on' : ''}`}
            title={`Trazo ${pen.id}`}
            aria-label={`Trazo ${pen.id}`}
            aria-pressed={color === pen.hex}
            style={{ background: pen.hex }}
            onClick={() => onColorChange(pen.hex)}
          />
        ))}
      </div>

      {tool === 'text' && (
        <input
          style={{ width: 190 }}
          value={labelText}
          onChange={(event) => onLabelTextChange(event.target.value)}
          placeholder="Texto de la etiqueta"
          aria-label="Texto de la etiqueta"
        />
      )}

      <div className="row" style={{ marginLeft: 'auto' }}>
        <button type="button" className="btn primary" onClick={onPlay} disabled={isPlaying}>
          <Icon name="play" size={15} />
          {isPlaying ? 'Reproduciendo…' : 'Reproducir jugada'}
        </button>
        <button type="button" className="btn" onClick={onUndo} disabled={!canUndo}>
          <Icon name="undo" size={15} />
          Deshacer
        </button>
        <button type="button" className="btn danger" onClick={onClear}>
          <Icon name="trash" size={15} />
          Limpiar trazos
        </button>
        <button type="button" className="btn" onClick={onExport}>
          <Icon name="download" size={15} />
          PNG
        </button>
      </div>
    </div>
  )
}
