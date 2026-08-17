import { BoardCanvas } from '../../components/board/BoardCanvas.jsx'
import { COLORS } from '../../lib/constants.js'
import { PlayerInspector } from './PlayerInspector.jsx'
import { SavePlayPanel } from './SavePlayPanel.jsx'
import { TeamPanel } from './TeamPanel.jsx'
import { Toolbar } from './Toolbar.jsx'

/** Vista principal: bandeja de herramientas, campo y paneles laterales. */
export function BoardView({ workspace, plays }) {
  const { editor, playback } = workspace
  // Sugerencias del campo "Carpeta": las que el usuario ya ha creado.
  const folderNames = [...new Set(plays.folders.map((entry) => entry.folder).filter(Boolean))]

  return (
    <>
      <Toolbar
        tool={workspace.tool}
        onToolChange={workspace.setTool}
        color={workspace.color}
        onColorChange={workspace.setColor}
        labelText={workspace.labelText}
        onLabelTextChange={workspace.setLabelText}
        onPlay={playback.play}
        isPlaying={playback.isPlaying}
        onUndo={editor.undo}
        canUndo={editor.canUndo}
        onClear={editor.clearAnnotations}
        onExport={workspace.exportPng}
      />

      <div className="layout">
        <TeamPanel
          editor={editor}
          homeName={workspace.homeName}
          awayName={workspace.awayName}
          onHomeNameChange={workspace.setHomeName}
          onAwayNameChange={workspace.setAwayName}
          surface={workspace.surface}
          onSurfaceChange={workspace.setSurface}
        />

        <div>
          <div className="board">
            <BoardCanvas
              board={editor.board}
              surface={workspace.surface}
              svgRef={editor.svgRef}
              tool={workspace.tool}
              animation={playback.animation}
              draft={editor.draft}
              selectedId={editor.selectedId}
              onPointerDown={editor.handlePointerDown}
              onPointerMove={editor.handlePointerMove}
              onPointerUp={editor.handlePointerUp}
              onErase={editor.erase}
              title={workspace.draftMeta.name || 'Pizarra táctica'}
            />
            <div className="legend">
              <span>——— desplazamiento</span>
              <span>– – – pase</span>
              <span>∿∿∿ conducción</span>
              <span style={{ marginLeft: 'auto', color: COLORS.mint }}>
                {workspace.homeName} {editor.homeFormation} · {workspace.awayName}{' '}
                {editor.awayFormation}
              </span>
            </div>
          </div>

          <p className="hint" style={{ marginTop: 10 }}>
            Arrastra los dorsales con la herramienta <strong>Mover</strong>. Dibuja los
            desplazamientos partiendo desde el jugador y pulsa{' '}
            <strong>Reproducir jugada</strong>: los dorsales recorren sus flechas y el balón sigue
            los pases en orden.
          </p>

          <PlayerInspector player={editor.selectedPlayer} onChange={editor.updatePlayer} />
        </div>

        <SavePlayPanel
          draftMeta={workspace.draftMeta}
          onDraftMetaChange={workspace.setDraftMeta}
          folderNames={folderNames}
          editingPlay={workspace.editingPlay}
          onSaveNew={workspace.savePlay}
          onUpdate={workspace.updatePlay}
          onDiscardEditing={() => workspace.setEditingPlay(null)}
          saving={workspace.saving}
          recentPlays={plays.plays.slice(0, 5)}
          onOpenPlay={workspace.openPlay}
        />
      </div>
    </>
  )
}
