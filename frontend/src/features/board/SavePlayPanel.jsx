import { COLORS, PLAY_CATEGORIES, PLAY_KINDS } from '../../lib/constants.js'
import { Icon } from '../../components/ui/Icon.jsx'

/** Columna derecha: metadatos de la jugada y acceso rápido a la biblioteca. */
export function SavePlayPanel({
  draftMeta,
  onDraftMetaChange,
  folderNames,
  editingPlay,
  onSaveNew,
  onUpdate,
  onDiscardEditing,
  saving,
  recentPlays,
  onOpenPlay,
}) {
  const update = (changes) => onDraftMetaChange({ ...draftMeta, ...changes })

  return (
    <div className="side-r">
      <div className="card">
        <h3>{editingPlay ? 'Editando jugada' : 'Guardar jugada'}</h3>

        {editingPlay && (
          <p className="hint" style={{ marginBottom: 8 }}>
            Estás trabajando sobre <strong>{editingPlay.name}</strong>.{' '}
            <button type="button" className="linklike" onClick={onDiscardEditing}>
              Desvincular
            </button>
          </p>
        )}

        <label className="f" htmlFor="play-name">
          Nombre
        </label>
        <input
          id="play-name"
          value={draftMeta.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Ej. Salida en 3 desde portero"
        />

        <label className="f" htmlFor="play-category">
          Categoría
        </label>
        <select
          id="play-category"
          value={draftMeta.category}
          onChange={(e) => update({ category: e.target.value })}
        >
          {PLAY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label className="f" htmlFor="play-kind">
          Guardar en
        </label>
        <select
          id="play-kind"
          value={draftMeta.kind}
          onChange={(e) => update({ kind: e.target.value })}
        >
          {PLAY_KINDS.map((kind) => (
            <option key={kind.id} value={kind.id}>
              {kind.label}
            </option>
          ))}
        </select>

        <label className="f" htmlFor="play-folder">
          Carpeta
        </label>
        <input
          id="play-folder"
          list="folder-names"
          maxLength={60}
          value={draftMeta.folder}
          onChange={(e) => update({ folder: e.target.value })}
          placeholder="Ej. Jornada 3 (opcional)"
        />
        <datalist id="folder-names">
          {folderNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <label className="f" htmlFor="play-notes">
          Consignas
        </label>
        <textarea
          id="play-notes"
          rows="3"
          value={draftMeta.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Qué buscas con esta jugada"
        />

        {editingPlay && (
          <button
            type="button"
            className="btn primary"
            style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
            onClick={onUpdate}
            disabled={saving}
          >
            <Icon name="save" size={15} />
            Guardar cambios
          </button>
        )}
        <button
          type="button"
          className={`btn ${editingPlay ? '' : 'primary'}`}
          style={{ width: '100%', marginTop: editingPlay ? 8 : 12, justifyContent: 'center' }}
          onClick={onSaveNew}
          disabled={saving}
        >
          <Icon name={editingPlay ? 'plus' : 'save'} size={15} />
          {editingPlay ? 'Guardar como nueva' : 'Guardar jugada'}
        </button>
      </div>

      <div className="card">
        <h3>Últimas jugadas</h3>
        {recentPlays.length === 0 ? (
          <p className="hint">
            Todavía no hay jugadas guardadas. La primera que guardes aparecerá aquí.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {recentPlays.map((play) => (
              <button
                key={play.id}
                type="button"
                className="btn ghost"
                style={{ justifyContent: 'space-between', textAlign: 'left' }}
                onClick={() => onOpenPlay(play)}
              >
                <span className="ellipsis">{play.name}</span>
                <span className="mono" style={{ fontSize: 10, color: COLORS.mint }}>
                  {play.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
