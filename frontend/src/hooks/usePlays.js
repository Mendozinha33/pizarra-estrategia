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

  const { category, search } = filters
  const requestRef = useRef(null)

  const load = useCallback(async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setLoading(true)
    try {
      const data = await playsApi.list({ category, search }, { signal: controller.signal })
      setPlays(data)
      setError(null)
    } catch (cause) {
      if (cause.name === 'AbortError') return
      setError(cause)
    } finally {
      if (requestRef.current === controller) setLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    load()
    return () => requestRef.current?.abort()
  }, [load])

  const create = useCallback(
    async (payload) => {
      const play = await playsApi.create(payload)
      setPlays((current) => [play, ...current])
      return play
    },
    [],
  )

  const update = useCallback(async (id, payload) => {
    const play = await playsApi.update(id, payload)
    setPlays((current) => current.map((item) => (item.id === id ? play : item)))
    return play
  }, [])

  const remove = useCallback(async (id) => {
    await playsApi.remove(id)
    setPlays((current) => current.filter((item) => item.id !== id))
  }, [])

  return { plays, loading, error, reload: load, create, update, remove }
}
