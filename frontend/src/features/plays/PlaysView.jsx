import { NO_FOLDER_LABEL, PLAY_CATEGORIES, PLAY_KINDS } from '../../lib/constants.js'
import { Icon } from '../../components/ui/Icon.jsx'
import { FolderTree } from './FolderTree.jsx'
import { PlayCard } from './PlayCard.jsx'

/** Título de la carpeta abierta, para que se vea siempre dónde está uno. */
function placeLabel({ kind, folder }) {
  if (!kind) return 'Todas las jugadas'
  const label = PLAY_KINDS.find((entry) => entry.id === kind)?.label ?? kind
  if (folder === null) return label
  return `${label} · ${folder || NO_FOLDER_LABEL}`
}

/** Biblioteca de jugadas guardadas, organizada en carpetas. */
export function PlaysView({
  plays,
  filters,
  onFiltersChange,
  onOpen,
  onAddToSession,
  onDelete,
  onGoToBoard,
}) {
  const count = plays.plays.length
  const filtered = Boolean(filters.category || filters.search)

  return (
    <>
      <div className="tray">
        <div>
          <div className="eyebrow">{placeLabel(filters)}</div>
          <h2 style={{ fontSize: 22 }}>
            {count} {count === 1 ? 'jugada' : 'jugadas'}{' '}
            {filtered
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

      <div className="library">
        <FolderTree
          folders={plays.folders}
          selection={{ kind: filters.kind, folder: filters.folder }}
          onSelect={(selection) => onFiltersChange({ ...filters, ...selection })}
        />

        <div>
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
              {filtered
                ? 'Ninguna jugada coincide con el filtro.'
                : filters.kind || filters.folder !== null
                  ? 'Esta carpeta está vacía.'
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
        </div>
      </div>
    </>
  )
}
