import { useCallback, useEffect, useRef, useState } from 'react'

import { usersApi } from '../api/users.js'

/** Lista de usuarios dados de alta. Sólo la usa el administrador. */
export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestRef = useRef(null)

  const load = useCallback(async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setLoading(true)
    try {
      const data = await usersApi.list({ signal: controller.signal })
      setUsers(data)
      setError(null)
    } catch (cause) {
      if (cause.name === 'AbortError') return
      setError(cause)
    } finally {
      if (requestRef.current === controller) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => requestRef.current?.abort()
  }, [load])

  const replace = useCallback((user) => {
    setUsers((current) => current.map((item) => (item.id === user.id ? user : item)))
  }, [])

  const create = useCallback(async (payload) => {
    const user = await usersApi.create(payload)
    setUsers((current) => [...current, user])
    return user
  }, [])

  const update = useCallback(
    async (id, payload) => {
      const user = await usersApi.update(id, payload)
      replace(user)
      return user
    },
    [replace],
  )

  const resetPassword = useCallback(
    async (id, newPassword) => {
      const user = await usersApi.resetPassword(id, newPassword)
      replace(user)
      return user
    },
    [replace],
  )

  return { users, loading, error, reload: load, create, update, resetPassword }
}
