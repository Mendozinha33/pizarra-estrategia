import { Icon } from '../../components/ui/Icon.jsx'
import { SessionBlock } from './SessionBlock.jsx'

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

/** Plan de sesión: bloques ordenados con su diagrama y sus consignas. */
export function SessionView({ session, plays, onAddBlock, onOpenPlay }) {
  const { blocks, totalMinutes, loading, saving, error } = session

  return (
    <>
      <div className="tray">
        <div>
          <div className="eyebrow">Plan de sesión</div>
          <h2 style={{ fontSize: 22 }}>
            {blocks.length} bloque{blocks.length === 1 ? '' : 's'} · {formatDuration(totalMinutes)}
          </h2>
        </div>

        {saving && <span className="hint">Guardando…</span>}

        <button
          type="button"
          className="btn primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => onAddBlock()}
          disabled={loading || !session.session}
        >
          <Icon name="plus" size={15} />
          Añadir bloque
        </button>
      </div>

      {error && (
        <div className="empty error">
          Problema con la sesión: {error.message}.{' '}
          <button type="button" className="linklike" onClick={session.reload}>
            Reintentar
          </button>
        </div>
      )}

      {loading && <div className="empty">Cargando sesión…</div>}

      {!loading && blocks.length === 0 && (
        <div className="empty">
          Construye la sesión por bloques: calentamiento, tarea principal, competición. Cada bloque
          puede llevar una jugada de la biblioteca.
        </div>
      )}

      {blocks.map((block, index) => (
        <SessionBlock
          key={block.id}
          block={block}
          index={index}
          total={blocks.length}
          plays={plays}
          onEdit={session.editBlock}
          onRemove={session.removeBlock}
          onMove={session.moveBlock}
          onOpenPlay={onOpenPlay}
        />
      ))}
    </>
  )
}
