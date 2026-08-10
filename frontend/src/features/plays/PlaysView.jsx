import { PLAY_CATEGORIES } from '../../lib/constants.js'
import { Icon } from '../../components/ui/Icon.jsx'
import { PlayCard } from './PlayCard.jsx'

/** Biblioteca de jugadas guardadas, con filtros por categoría y texto. */
export function PlaysView({ plays, filters, onFiltersChange, onOpen, onAddToSession, onDelete, onGoToBoard }) {
  const count = plays.plays.length

  return (
    <>
      <div className="tray">
        <div>
          <div className="eyebrow">Biblioteca</div>
          <h2 style={{ fontSize: 22 }}>
            {count} {count === 1 ? 'jugada' : 'jugadas'}{' '}
            {filters.category || filters.search
              ? count === 1
                ? 'filtrada'
                : 'filtradas'
              : count === 1
                ? 'guardada'
                : 'guardadas'}
          </h2>
        </div>

        <div className="row" style={{ marginLeft: 'auto', alignItems: 'center', gap: 8 }}>
          <div className="search">
            <Icon name="search" size={14} />
            <input
              value={filters.search}
              placeholder="Buscar jugada"
              aria-label="Buscar jugada"
              onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            />
          </div>
          <select
            value={filters.category}
            aria-label="Filtrar por categoría"
            onChange={(event) => onFiltersChange({ ...filters, category: event.target.value })}
          >
            <option value="">Todas las categorías</option>
            {PLAY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={onGoToBoard}>
            <Icon name="grid" size={15} />
            Ir a la pizarra
          </button>
        </div>
      </div>

      {plays.error && (
        <div className="empty error">
          No se han podido cargar las jugadas: {plays.error.message}.{' '}
          <button type="button" className="linklike" onClick={plays.reload}>
            Reintentar
          </button>
        </div>
      )}

      {plays.loading && count === 0 && <div className="empty">Cargando jugadas…</div>}

      {!plays.loading && count === 0 && !plays.error && (
        <div className="empty">
          {filters.search || filters.category
            ? 'Ninguna jugada coincide con el filtro.'
            : 'Aún no hay jugadas. Diséñala en la pizarra y guárdala para tenerla aquí.'}
        </div>
      )}

      {count > 0 && (
        <div className="grid-plays">
          {plays.plays.map((play) => (
            <PlayCard
              key={play.id}
              play={play}
              onOpen={onOpen}
              onAddToSession={onAddToSession}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  )
}
