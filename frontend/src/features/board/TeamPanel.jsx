import { COLORS, SURFACE_OPTIONS } from '../../lib/constants.js'
import { formationNames } from '../../lib/formations.js'
import { Icon } from '../../components/ui/Icon.jsx'

/** Columna izquierda: equipos, formaciones y superficie de juego. */
export function TeamPanel({
  editor,
  homeName,
  awayName,
  onHomeNameChange,
  onAwayNameChange,
  surface,
  onSurfaceChange,
}) {
  const options = formationNames(editor.formationSize)

  return (
    <div>
      <div className="card">
        <h3>
          <Icon name="users" size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
          Equipos
        </h3>

        <div className="seg" role="group" aria-label="Modalidad">
          {[
            ['f11', 'Fútbol 11'],
            ['f7', 'Fútbol 7'],
          ].map(([size, label]) => (
            <button
              key={size}
              type="button"
              className={editor.formationSize === size ? 'on' : ''}
              aria-pressed={editor.formationSize === size}
              onClick={() => editor.setFormationSize(size)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="f" htmlFor="home-name">
          <span className="teamdot" style={{ background: COLORS.home }} />
          Equipo propio
        </label>
        <input id="home-name" value={homeName} onChange={(e) => onHomeNameChange(e.target.value)} />
        <select
          style={{ marginTop: 6 }}
          aria-label="Formación del equipo propio"
          value={editor.homeFormation}
          onChange={(e) => editor.applyFormation('home', e.target.value)}
        >
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <label className="f" htmlFor="away-name">
          <span className="teamdot" style={{ background: COLORS.away }} />
          Rival
        </label>
        <input id="away-name" value={awayName} onChange={(e) => onAwayNameChange(e.target.value)} />
        <select
          style={{ marginTop: 6 }}
          aria-label="Formación del rival"
          value={editor.awayFormation}
          onChange={(e) => editor.applyFormation('away', e.target.value)}
        >
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <div className="row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn ghost"
            style={{ flex: 1 }}
            onClick={() => editor.applyFormation('away', editor.awayFormation)}
          >
            <Icon name="plus" size={14} />
            Rival
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => editor.clearTeam('away')}
            title="Quitar rival"
            aria-label="Quitar rival"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={editor.resetField}>
            <Icon name="rotate" size={14} />
            Reiniciar campo
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Superficie</h3>
        <div style={{ display: 'grid', gap: 4 }}>
          {SURFACE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`btn ${surface === option.id ? 'primary' : 'ghost'}`}
              style={{ justifyContent: 'flex-start' }}
              aria-pressed={surface === option.id}
              onClick={() => onSurfaceChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
