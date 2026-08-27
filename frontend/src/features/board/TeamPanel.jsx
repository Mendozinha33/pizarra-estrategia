import { MAX_PLAYERS_PER_TEAM, SURFACE_OPTIONS } from '../../lib/constants.js'
import { formationNames } from '../../lib/formations.js'
import { Icon } from '../../components/ui/Icon.jsx'

/** Pareja de selectores de color de un equipo: jugadores de campo y portero. */
function TeamColorPicker({ team, label, colors, onChange }) {
  return (
    <div className="colors">
      {[
        ['player', 'Jugadores'],
        ['gk', 'Portero'],
      ].map(([kind, kindLabel]) => (
        <label key={kind} className="colorpick">
          <input
            type="color"
            value={colors[kind]}
            aria-label={`Color de ${kindLabel.toLowerCase()} · ${label}`}
            onChange={(e) => onChange(team, kind, e.target.value)}
          />
          {kindLabel}
        </label>
      ))}
    </div>
  )
}

/** Vuelve a poner todo el equipo del color del equipo (quita los petos). */
function ClearBibs({ team, hasBibs, onClear }) {
  return (
    <button
      type="button"
      className="btn ghost"
      style={{ marginTop: 6, width: '100%' }}
      disabled={!hasBibs}
      title="Devolver todas las fichas del equipo al color del equipo"
      onClick={() => onClear(team)}
    >
      <Icon name="rotate" size={13} />
      Quitar petos
    </button>
  )
}

/**
 * Fichas de un equipo: sumar jugadores o porteros sueltos (con el recuento
 * actual) y dejar el equipo sin ninguna ficha para colocarlas a mano.
 */
function SquadButtons({ team, label, counts, onAdd, onClear }) {
  return (
    <div className="row" style={{ marginTop: 6 }}>
      {[
        ['field', 'Jugador'],
        ['gk', 'Portero'],
      ].map(([role, roleLabel]) => (
        <button
          key={role}
          type="button"
          className="btn ghost"
          style={{ flex: 1 }}
          title={`Añadir ${roleLabel.toLowerCase()}`}
          disabled={counts[role] >= MAX_PLAYERS_PER_TEAM[role]}
          onClick={() => onAdd(team, role)}
        >
          <Icon name="plus" size={13} />
          {roleLabel} {counts[role]}/{MAX_PLAYERS_PER_TEAM[role]}
        </button>
      ))}
      <button
        type="button"
        className="btn ghost"
        title={`Quitar todas las fichas de ${label.toLowerCase()}`}
        aria-label={`Quitar todas las fichas de ${label.toLowerCase()}`}
        disabled={counts.field + counts.gk === 0}
        onClick={() => onClear(team)}
      >
        <Icon name="x" size={13} />
      </button>
    </div>
  )
}

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
  const colors = editor.colors
  const hasBibs = (team) =>
    editor.board.players.some((player) => player.team === team && player.color)

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
          <span className="teamdot" style={{ background: colors.home.player }} />
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
        <TeamColorPicker
          team="home"
          label="Equipo propio"
          colors={colors.home}
          onChange={editor.setTeamColor}
        />
        <ClearBibs team="home" hasBibs={hasBibs('home')} onClear={editor.clearBibs} />
        <SquadButtons
          team="home"
          label="tu equipo"
          counts={editor.squadCounts.home}
          onAdd={editor.addPlayer}
          onClear={editor.clearTeam}
        />

        <label className="f" htmlFor="away-name">
          <span className="teamdot" style={{ background: colors.away.player }} />
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
        <TeamColorPicker
          team="away"
          label="Rival"
          colors={colors.away}
          onChange={editor.setTeamColor}
        />
        <ClearBibs team="away" hasBibs={hasBibs('away')} onClear={editor.clearBibs} />
        <SquadButtons
          team="away"
          label="el rival"
          counts={editor.squadCounts.away}
          onAdd={editor.addPlayer}
          onClear={editor.clearTeam}
        />

        <div className="row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn ghost"
            style={{ flex: 1 }}
            onClick={() => editor.applyFormation('away', editor.awayFormation)}
          >
            <Icon name="plus" size={14} />
            Poner el rival en formación
          </button>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={editor.toggleBall}>
            <Icon name="ball" size={14} />
            {editor.board.ball ? 'Quitar balón' : 'Poner balón'}
          </button>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn ghost"
            style={{ flex: 1 }}
            title="Dejar el campo sin fichas para colocarlas una a una"
            disabled={editor.board.players.length === 0}
            onClick={editor.clearPlayers}
          >
            <Icon name="x" size={14} />
            Vaciar el campo
          </button>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={editor.resetField}>
            <Icon name="rotate" size={14} />
            Reiniciar campo
          </button>
        </div>

        <p className="hint" style={{ marginTop: 8 }}>
          <strong>Vaciar el campo</strong> quita todas las fichas; luego las vas poniendo una a
          una con <strong>+ Jugador</strong> y <strong>+ Portero</strong>. Para quitar sólo
          alguna, tócala y pulsa <strong>Quitar ficha</strong>, o usa la herramienta{' '}
          <strong>Borrar</strong>. Funciona igual en las cuatro superficies.
        </p>
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
        <p className="hint" style={{ marginTop: 8 }}>
          En medio campo la portería que se ve es la tuya: la alineación se coloca en el
          sentido del ataque, con el portero en portería, la defensa delante y el ataque hacia
          la línea de medio campo. Al cambiar de superficie lo dibujado se recoloca solo.
        </p>
      </div>
    </div>
  )
}
