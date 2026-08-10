import { BoardCanvas } from '../../components/board/BoardCanvas.jsx'
import { COLORS } from '../../lib/constants.js'
import { Icon } from '../../components/ui/Icon.jsx'

/** Un bloque del plan de sesión: diagrama, duración y consignas. */
export function SessionBlock({ block, index, total, plays, onEdit, onRemove, onMove, onOpenPlay }) {
  const play = block.play

  return (
    <section className="block">
      <div>
        <div className="mono block__index">Bloque {index + 1}</div>
        {play ? (
          <button
            type="button"
            className="thumb-button"
            onClick={() => onOpenPlay(play)}
            title={`Abrir ${play.name} en la pizarra`}
          >
            <BoardCanvas board={play.board} surface={play.surface} readOnly title={play.name} />
          </button>
        ) : (
          <div className="empty" style={{ padding: 18, fontSize: 12 }}>
            Sin diagrama
          </div>
        )}
        <div className="row" style={{ marginTop: 8, gap: 4 }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => onMove(block.id, -1)}
            disabled={index === 0}
            title="Subir bloque"
            aria-label="Subir bloque"
          >
            <Icon name="chevronUp" size={14} />
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => onMove(block.id, 1)}
            disabled={index === total - 1}
            title="Bajar bloque"
            aria-label="Bajar bloque"
          >
            <Icon name="chevronDown" size={14} />
          </button>
        </div>
      </div>

      <div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label className="f" htmlFor={`block-title-${block.id}`}>
              Título
            </label>
            <input
              id={`block-title-${block.id}`}
              value={block.title}
              onChange={(event) => onEdit(block.id, { title: event.target.value })}
            />
          </div>
          <div style={{ width: 110 }}>
            <label className="f" htmlFor={`block-minutes-${block.id}`}>
              <Icon name="clock" size={11} style={{ verticalAlign: -1 }} /> Minutos
            </label>
            <input
              id={`block-minutes-${block.id}`}
              type="number"
              min="1"
              max="240"
              value={block.minutes}
              onChange={(event) =>
                onEdit(block.id, { minutes: Number(event.target.value) || 1 })
              }
            />
          </div>
          <div style={{ width: 46, display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="btn danger"
              onClick={() => onRemove(block.id)}
              title="Quitar bloque"
              aria-label="Quitar bloque"
            >
              <Icon name="x" size={15} />
            </button>
          </div>
        </div>

        <label className="f" htmlFor={`block-play-${block.id}`}>
          Jugada asociada
        </label>
        <select
          id={`block-play-${block.id}`}
          value={block.play_id ?? ''}
          onChange={(event) => onEdit(block.id, { play_id: event.target.value })}
        >
          <option value="">Sin diagrama</option>
          {plays.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <label className="f" htmlFor={`block-notes-${block.id}`}>
          Objetivo y consignas
        </label>
        <textarea
          id={`block-notes-${block.id}`}
          rows="3"
          value={block.notes}
          placeholder="Qué quieres que aprendan y cómo lo vas a corregir"
          onChange={(event) => onEdit(block.id, { notes: event.target.value })}
        />

        {play && (
          <p className="hint" style={{ marginTop: 8, color: COLORS.muted }}>
            Diagrama: <strong>{play.name}</strong> · {play.category}
          </p>
        )}
      </div>
    </section>
  )
}
