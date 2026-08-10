import { useCallback, useEffect, useState } from 'react'

import { useToast } from '../components/ui/Toast.jsx'
import { PEN_COLORS, TOOLS } from '../lib/constants.js'
import { exportSvgToPng } from '../lib/exportPng.js'
import { useBoardEditor } from './useBoardEditor.js'
import { usePlayback } from './usePlayback.js'

const EMPTY_META = { name: '', category: 'Ataque', notes: '' }

/**
 * Estado de trabajo de la pizarra: herramientas, tablero, reproducción y el
 * puente con la biblioteca de jugadas. Vive en la raíz para que cambiar de
 * pestaña no pierda lo que hay dibujado.
 */
export function useWorkspace(plays) {
  const toast = useToast()

  const [tool, setTool] = useState('select')
  const [color, setColor] = useState(PEN_COLORS[0].hex)
  const [labelText, setLabelText] = useState('Presión alta')
  const [surface, setSurface] = useState('full')
  const [homeName, setHomeName] = useState('Mi equipo')
  const [awayName, setAwayName] = useState('Rival')
  const [draftMeta, setDraftMeta] = useState(EMPTY_META)
  const [editingPlay, setEditingPlay] = useState(null)
  const [saving, setSaving] = useState(false)

  const editor = useBoardEditor({ tool, color, surface, labelText, onWarn: toast.notify })
  const playback = usePlayback(editor.board, { onWarn: toast.notify })

  // Atajos de teclado para las herramientas; no interfieren con los formularios.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
          event.preventDefault()
          editor.undo()
        }
        return
      }
      const target = event.target
      if (target.matches?.('input, textarea, select, [contenteditable]')) return

      const match = TOOLS.find((item) => item.key === event.key.toLowerCase())
      if (match) setTool(match.id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editor])

  const boardPayload = useCallback(
    () => ({
      players: editor.board.players,
      items: editor.board.items,
      shapes: editor.board.shapes,
      ball: editor.board.ball,
    }),
    [editor.board],
  )

  const savePlay = useCallback(async () => {
    const name = draftMeta.name.trim()
    if (!name) {
      toast.error('Pon un nombre a la jugada para guardarla')
      return null
    }
    setSaving(true)
    try {
      const play = await plays.create({
        name,
        category: draftMeta.category,
        notes: draftMeta.notes,
        surface,
        formation_size: editor.formationSize,
        home_formation: editor.homeFormation,
        away_formation: editor.awayFormation,
        board: boardPayload(),
      })
      setEditingPlay(play)
      toast.success(`Jugada guardada: ${play.name}`)
      return play
    } catch (error) {
      toast.error(error.message)
      return null
    } finally {
      setSaving(false)
    }
  }, [
    draftMeta,
    plays,
    surface,
    editor.formationSize,
    editor.homeFormation,
    editor.awayFormation,
    boardPayload,
    toast,
  ])

  const updatePlay = useCallback(async () => {
    if (!editingPlay) return null
    setSaving(true)
    try {
      const play = await plays.update(editingPlay.id, {
        name: draftMeta.name.trim() || editingPlay.name,
        category: draftMeta.category,
        notes: draftMeta.notes,
        surface,
        formation_size: editor.formationSize,
        home_formation: editor.homeFormation,
        away_formation: editor.awayFormation,
        board: boardPayload(),
      })
      setEditingPlay(play)
      toast.success('Cambios guardados')
      return play
    } catch (error) {
      toast.error(error.message)
      return null
    } finally {
      setSaving(false)
    }
  }, [
    editingPlay,
    draftMeta,
    plays,
    surface,
    editor.formationSize,
    editor.homeFormation,
    editor.awayFormation,
    boardPayload,
    toast,
  ])

  const openPlay = useCallback(
    (play) => {
      editor.loadBoard(play.board, {
        formationSize: play.formation_size,
        homeFormation: play.home_formation,
        awayFormation: play.away_formation,
      })
      setSurface(play.surface)
      setDraftMeta({ name: play.name, category: play.category, notes: play.notes ?? '' })
      setEditingPlay(play)
      toast.notify(`Jugada cargada: ${play.name}`)
    },
    [editor, toast],
  )

  const newPlay = useCallback(() => {
    editor.resetField()
    setDraftMeta(EMPTY_META)
    setEditingPlay(null)
  }, [editor])

  const exportPng = useCallback(async () => {
    try {
      await exportSvgToPng(editor.svgRef.current, {
        surface,
        filename: draftMeta.name || 'pizarra',
      })
      toast.success('Imagen descargada')
    } catch (error) {
      toast.error(error.message)
    }
  }, [editor.svgRef, surface, draftMeta.name, toast])

  return {
    tool,
    setTool,
    color,
    setColor,
    labelText,
    setLabelText,
    surface,
    setSurface,
    homeName,
    setHomeName,
    awayName,
    setAwayName,
    draftMeta,
    setDraftMeta,
    editingPlay,
    setEditingPlay,
    saving,
    editor,
    playback,
    savePlay,
    updatePlay,
    openPlay,
    newPlay,
    exportPng,
  }
}
