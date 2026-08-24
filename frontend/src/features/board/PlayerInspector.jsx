import { isGoalkeeper, teamTokenColor, tokenColor } from '../../lib/colors.js'
import { BIB_COLORS } from '../../lib/constants.js'

/** Paleta del color propio de una ficha, con vuelta al color de su equipo. */
function PlayerColorPicker({ player, colors, onChange }) {
  const teamHex = teamTokenColor(player, colors)
  const current = tokenColor(player, colors)

  return (
    <>
      <label className="f">Color de esta ficha</label>
      <div className="row" style={{ flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          className={`swatch ${player.color ? '' : 'on'}`}
          title="Color del equipo"
          aria-label="Color del equipo"
          aria-pressed={!player.color}
          style={{ background: teamHex }}
          onClick={() => onChange(player.id, { color: null })}
        />
        {BIB_COLORS.map((bib) => (
          <button
            key={bib.id}
            type="button"
            className={`swatch ${player.color === bib.hex ? 'on' : ''}`}
            title={`Peto ${bib.id}`}
            aria-label={`Peto ${bib.id}`}
            aria-pressed={player.color === bib.hex}
            style={{ background: bib.hex }}
            onClick={() => onChange(player.id, { color: bib.hex })}
          />
        ))}
        <label className="colorpick">
          <input
            type="color"
            value={current}
            aria-label="Otro color para esta ficha"
            onChange={(e) => onChange(player.id, { color: e.target.value })}
          />
          Otro
        </label>
      </div>
      <p className="hint" style={{ marginTop: 6 }}>
        El primer círculo devuelve la ficha al color de su equipo.
      </p>
    </>
  )
}

/** Edición del dorsal seleccionado. */
export function PlayerInspector({ player, colors, onChange }) {
  return (
    <div className="card">
      <h3>Dorsal seleccionado</h3>
      {player ? (
        <>
          <label className="f" htmlFor="player-num">
            Dorsal
          </label>
          <input
            id="player-num"
            value={player.num}
            maxLength={3}
            onChange={(e) => onChange(player.id, { num: e.target.value })}
          />

          <label className="f" htmlFor="player-name">
            Nombre en el campo
          </label>
          <input
            id="player-name"
            value={player.name}
            maxLength={40}
            placeholder="Opcional"
            onChange={(e) => onChange(player.id, { name: e.target.value })}
          />

          <label className="check" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={isGoalkeeper(player)}
              onChange={(e) => onChange(player.id, { role: e.target.checked ? 'gk' : 'field' })}
            />
            Es portero (lleva el color de portero)
          </label>

          <PlayerColorPicker player={player} colors={colors} onChange={onChange} />
        </>
      ) : (
        <p className="hint">
          Toca un jugador con la herramienta <strong>Mover</strong> para cambiar su dorsal, su
          nombre, su color o marcarlo como portero.
        </p>
      )}
    </div>
  )
}
