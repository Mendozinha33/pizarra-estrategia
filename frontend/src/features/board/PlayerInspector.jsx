/** Edición del dorsal seleccionado. */
export function PlayerInspector({ player, onChange }) {
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
        </>
      ) : (
        <p className="hint">
          Toca un jugador con la herramienta <strong>Mover</strong> para cambiar su dorsal o su
          nombre.
        </p>
      )}
    </div>
  )
}
