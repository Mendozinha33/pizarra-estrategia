import { BoardCanvas } from '../../components/board/BoardCanvas.jsx'
import { COLORS } from '../../lib/constants.js'
import { Icon } from '../../components/ui/Icon.jsx'

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function PlayCard({ play, onOpen, onAddToSession, onDelete }) {
  return (
    <article className="play">
      <div className="thumb">
        <BoardCanvas board={play.board} surface={play.surface} readOnly title={play.name} />
      </div>
      <div className="meta">
        <div className="cat">{play.category}</div>
        <h3 className="disp" style={{ fontSize: 19 }}>
          {play.name}
        </h3>
        <div className="mono" style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
          {dateFormatter.format(new Date(play.created_at))}
        </div>
        {play.notes && <p className="hint" style={{ marginTop: 6 }}>{play.notes}</p>}
      </div>
      <div className="acts">
        <button
          type="button"
          className="btn"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => onOpen(play)}
        >
          Abrir
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => onAddToSession(play)}
          title="Añadir a la sesión"
          aria-label={`Añadir ${play.name} a la sesión`}
        >
          <Icon name="clipboard" size={15} />
        </button>
        <button
          type="button"
          className="btn danger"
          onClick={() => onDelete(play)}
          title="Eliminar"
          aria-label={`Eliminar ${play.name}`}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </article>
  )
}
