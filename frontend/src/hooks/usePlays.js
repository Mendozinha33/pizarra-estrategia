import { useCallback, useEffect, useRef, useState } from 'react'

import { playsApi } from '../api/plays.js'

/**
 * Biblioteca de jugadas: carga, filtra y persiste contra la API.
 * Mantiene la lista en memoria y la refresca tras cada escritura.
 */
export function usePlays(filters = {}) {
  const [plays, setPlays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [folders, setFolders] = useState([])

  const { category, search, kind, folder } = filters
  const requestRef = useRef(null)

  const load = useCallback(async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setLoading(true)
    try {
      const data = await playsApi.list(
        {
          // Vacío significa "sin filtro" salvo en la carpeta, donde significa
          // "las que no están en ninguna"; por eso sólo ahí se envía tal cual.
          category: category || undefined,
          search: search || undefined,
          kind: kind || undefined,
          folder: folder ?? undefined,
        },
        { signal: controller.signal },
      )
      setPlays(data)
      setError(null)
    } catch (cause) {
      if (cause.name === 'AbortError') return
      setError(cause)
    } finally {
      if (requestRef.current === controller) setLoading(false)
    }
  }, [category, search, kind, folder])

  /** Árbol de carpetas del usuario; se refresca tras cada cambio en la biblioteca. */
  const loadFolders = useCallback(async () => {
    try {
      setFolders(await playsApi.folders())
    } catch {
      // Si falla, la biblioteca sigue usable sin el árbol.
    }
  }, [])

  useEffect(() => {
    load()
    return () => requestRef.current?.abort()
  }, [load])

  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  const create = useCallback(
    async (payload) => {
      const play = await playsApi.create(payload)
      setPlays((current) => [play, ...current])
      loadFolders()
      return play
    },
    [loadFolders],
  )

  const update = useCallback(
    async (id, payload) => {
      const play = await playsApi.update(id, payload)
      setPlays((current) => current.map((item) => (item.id === id ? play : item)))
      loadFolders()
      return play
    },
    [loadFolders],
  )

  const remove = useCallback(
    async (id) => {
      await playsApi.remove(id)
      setPlays((current) => current.filter((item) => item.id !== id))
      loadFolders()
    },
    [loadFolders],
  )

  return { plays, folders, loading, error, reload: load, create, update, remove }
}
