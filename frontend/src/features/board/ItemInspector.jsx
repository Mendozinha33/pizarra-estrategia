import { Icon } from '../../components/ui/Icon.jsx'

const ITEM_LABELS = {
  cone: 'Cono',
  ball: 'Balón',
  small_goal: 'Portería pequeña',
  big_goal: 'Portería grande',
  ladder: 'Escalera',
}

/** Orientación y retirada del material seleccionado en el campo. */
export function ItemInspector({ item, onRotate, onAngleChange, onRemove }) {
  if (!item) return null
  const angle = Math.round(item.angle ?? 0)

  return (
    <div className="card">
      <h3>{ITEM_LABELS[item.kind] ?? 'Material'} seleccionado</h3>

      <label className="f" htmlFor="item-angle">
        Hacia dónde mira · {angle}°
      </label>
      <div className="row" style={{ alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          className="btn ghost"
          title="Girar 45° a la izquierda"
          aria-label="Girar 45° a la izquierda"
          onClick={() => onRotate(item.id, -45)}
        >
          <Icon name="rotate" size={15} />
          45°
        </button>
        <input
          id="item-angle"
          type="range"
          min="0"
          max="355"
          step="5"
          style={{ flex: 1 }}
          value={angle}
          onChange={(e) => onAngleChange(item.id, Number(e.target.value))}
        />
        <button
          type="button"
          className="btn ghost"
          title="Girar 45° a la derecha"
          aria-label="Girar 45° a la derecha"
          onClick={() => onRotate(item.id, 45)}
        >
          <Icon name="rotateRight" size={15} />
          45°
        </button>
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn ghost"
          style={{ flex: 1 }}
          onClick={() => onRotate(item.id, 90)}
        >
          Poner de lado (90°)
        </button>
        <button type="button" className="btn danger" onClick={() => onRemove(item.id)}>
          <Icon name="trash" size={14} />
          Quitar
        </button>
      </div>

      <p className="hint" style={{ marginTop: 8 }}>
        Con la herramienta <strong>Mover</strong> puedes arrastrarlo por el campo, y con la rueda
        de arriba lo giras hacia donde quieras.
      </p>
    </div>
  )
}
