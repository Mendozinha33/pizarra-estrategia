import { useCallback, useEffect, useRef, useState } from 'react'

import { sessionsApi } from '../api/sessions.js'

const SAVE_DEBOUNCE_MS = 600

/**
 * Sesión de entrenamiento activa.
 *
 * Los campos de texto se editan en local y se persisten con debounce, para no
 * lanzar una petición por pulsación de tecla.
 */
export function useTrainingSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Por bloque: el temporizador en vuelo y los cambios acumulados que aún no
  // se han enviado. Acumular es imprescindible: si se edita el título y acto
  // seguido los minutos, el segundo debounce no debe descartar el primero.
  const timers = useRef(new Map())
  const pendingChanges = useRef(new Map())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setSession(await sessionsApi.current())
      setError(null)
    } catch (cause) {
      setError(cause)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const pending = timers.current
    return () => {
      pending.forEach((timer) => clearTimeout(timer))
      pending.clear()
    }
  }, [load])

  const replaceBlock = useCallback((block) => {
    setSession((current) =>
      current
        ? { ...current, blocks: current.blocks.map((b) => (b.id === block.id ? block : b)) }
        : current,
    )
  }, [])

  const addBlock = useCallback(async (payload = {}) => {
    const block = await sessionsApi.addBlock(session.id, payload)
    setSession((current) => ({ ...current, blocks: [...current.blocks, block] }))
    return block
  }, [session])

  const removeBlock = useCallback(async (blockId) => {
    await sessionsApi.removeBlock(session.id, blockId)
    setSession((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== blockId),
    }))
  }, [session])

  /** Aplica el cambio en la UI al instante y lo persiste con debounce. */
  const editBlock = useCallback(
    (blockId, changes) => {
      setSession((current) => ({
        ...current,
        blocks: current.blocks.map((block) =>
          block.id === blockId ? { ...block, ...changes } : block,
        ),
      }))

      const merged = { ...pendingChanges.current.get(blockId), ...changes }
      pendingChanges.current.set(blockId, merged)

      clearTimeout(timers.current.get(blockId))
      timers.current.set(
        blockId,
        setTimeout(async () => {
          timers.current.delete(blockId)
          const payload = pendingChanges.current.get(blockId)
          pendingChanges.current.delete(blockId)
          setSaving(true)
          try {
            replaceBlock(await sessionsApi.updateBlock(session.id, blockId, payload))
          } catch (cause) {
            setError(cause)
            load() // el servidor manda: recargamos para no quedarnos con datos falsos
          } finally {
            setSaving(false)
          }
        }, SAVE_DEBOUNCE_MS),
      )
    },
    [session, replaceBlock, load],
  )

  const moveBlock = useCallback(
    async (blockId, direction) => {
      const order = session.blocks.map((block) => block.id)
      const from = order.indexOf(blockId)
      const to = from + direction
      if (from < 0 || to < 0 || to >= order.length) return
      order.splice(to, 0, ...order.splice(from, 1))

      setSession((current) => ({
        ...current,
        blocks: order.map((id) => current.blocks.find((block) => block.id === id)),
      }))
      setSession(await sessionsApi.reorderBlocks(session.id, order))
    },
    [session],
  )

  const totalMinutes = session?.blocks.reduce((sum, block) => sum + (block.minutes || 0), 0) ?? 0

  return {
    session,
    blocks: session?.blocks ?? [],
    totalMinutes,
    loading,
    saving,
    error,
    reload: load,
    addBlock,
    editBlock,
    removeBlock,
    moveBlock,
  }
}
