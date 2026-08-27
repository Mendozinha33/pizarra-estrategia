import { BoardCanvas } from '../../components/board/BoardCanvas.jsx'
import { COLORS } from '../../lib/constants.js'
import { ItemInspector } from './ItemInspector.jsx'
import { LabelInspector } from './LabelInspector.jsx'
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
        bibColor={workspace.bibColor}
        onBibColorChange={workspace.setBibColor}
        labelText={workspace.labelText}
        onLabelTextChange={workspace.setLabelText}
        onPlay={playback.play}
        onPause={playback.pause}
        onStop={playback.stop}
        isPlaying={playback.isPlaying}
        isPaused={playback.isPaused}
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
              selectedItemId={editor.selectedItemId}
              selectedShapeId={editor.selectedShapeId}
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
            los pases en orden; puedes <strong>pausarla</strong> para explicar un detalle y
            continuar donde iba. Con <strong>Colocar balón</strong> lo pones donde quieras que
            empiece, y puedes quitarlo del campo si la jugada no lo necesita. Con las
            herramientas de material colocas conos, balones, porterías y escaleras: tócalos luego con{' '}
            <strong>Mover</strong> para arrastrarlos o girarlos hacia donde quieras. Con{' '}
            <strong>Poner peto</strong> eliges un color y tocas las fichas que quieras de ese
            color: así repartes grupos dentro de un mismo equipo. Las{' '}
            <strong>etiquetas</strong> también se arrastran con <strong>Mover</strong>, y al
            tocarlas puedes cambiarles el texto, el tamaño y la inclinación.
          </p>

          <ItemInspector
            item={editor.selectedItem}
            onRotate={editor.rotateItem}
            onAngleChange={editor.setItemAngle}
            onRemove={editor.removeItem}
          />

          <LabelInspector
            shape={editor.selectedShape}
            onTextChange={editor.setShapeText}
            onSizeChange={editor.setShapeSize}
            onRotate={editor.rotateShape}
            onAngleChange={editor.setShapeAngle}
            onRemove={editor.removeShape}
          />

          <PlayerInspector
            player={editor.selectedPlayer}
            colors={editor.colors}
            onChange={editor.updatePlayer}
          />
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
