import { NO_FOLDER_LABEL, PLAY_KINDS } from '../../lib/constants.js'
import { Icon } from '../../components/ui/Icon.jsx'

/**
 * Carpetas de la biblioteca: dos fijas (Entrenamientos y Partidos) y, dentro de
 * cada una, las que ha creado el usuario al guardar sus jugadas.
 *
 * `selection` es `{ kind, folder }`: `kind` vacío significa todas; `folder`
 * `null` significa la carpeta fija entera y `''` las jugadas sueltas.
 */
export function FolderTree({ folders, selection, onSelect }) {
  const total = folders.reduce((sum, entry) => sum + entry.count, 0)

  const isActive = (kind, folder) => selection.kind === kind && selection.folder === folder

  return (
    <nav className="folders card" aria-label="Carpetas">
      <h3>Carpetas</h3>

      <button
        type="button"
        className={`folder root ${isActive('', null) ? 'on' : ''}`}
        onClick={() => onSelect({ kind: '', folder: null })}
      >
        <Icon name="grid" size={13} />
        <span className="ellipsis">Todas las jugadas</span>
        <span className="count">{total}</span>
      </button>

      {PLAY_KINDS.map((kind) => {
        const inside = folders.filter((entry) => entry.kind === kind.id)
        const count = inside.reduce((sum, entry) => sum + entry.count, 0)

        return (
          <div key={kind.id} className="folder-group">
            <button
              type="button"
              className={`folder root ${isActive(kind.id, null) ? 'on' : ''}`}
              onClick={() => onSelect({ kind: kind.id, folder: null })}
            >
              <Icon name="clipboard" size={13} />
              <span className="ellipsis">{kind.label}</span>
              <span className="count">{count}</span>
            </button>

            {inside.map((entry) => (
              <button
                key={`${entry.kind}:${entry.folder}`}
                type="button"
                className={`folder ${isActive(kind.id, entry.folder) ? 'on' : ''}`}
                onClick={() => onSelect({ kind: kind.id, folder: entry.folder })}
              >
                <span className="ellipsis">{entry.folder || NO_FOLDER_LABEL}</span>
                <span className="count">{entry.count}</span>
              </button>
            ))}
          </div>
        )
      })}

      <p className="hint" style={{ marginTop: 10 }}>
        Las carpetas se crean solas: al guardar una jugada, escribe el nombre de la carpeta que
        quieras en la pizarra.
      </p>
    </nav>
  )
}
