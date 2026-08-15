import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { authApi } from '../api/auth.js'
import { setSessionExpiredHandler, setSessionToken } from '../api/client.js'

const AuthContext = createContext(null)

const STORAGE_KEY = 'pizarra.session'

function readStoredToken() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Navegador con el almacenamiento bloqueado: se trabaja sin recordar la sesión.
    return null
  }
}

function writeStoredToken(token) {
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* sin almacenamiento no se recuerda la sesión, pero la app funciona igual */
  }
}

/**
 * Sesión del usuario. La credencial se guarda en el navegador para no tener que
 * volver a entrar en cada recarga, y se comprueba contra el servidor al arrancar.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // `checking` evita el parpadeo de la pantalla de entrada mientras se comprueba.
  const [checking, setChecking] = useState(true)

  const closeSession = useCallback(() => {
    setSessionToken(null)
    writeStoredToken(null)
    setUser(null)
  }, [])

  const openSession = useCallback((token, nextUser) => {
    setSessionToken(token)
    writeStoredToken(token)
    setUser(nextUser)
  }, [])

  // Al recargar la página: si había credencial guardada, se valida.
  useEffect(() => {
    const token = readStoredToken()
    if (!token) {
      setChecking(false)
      return undefined
    }
    const controller = new AbortController()
    setSessionToken(token)
    authApi
      .me({ signal: controller.signal })
      .then((profile) => setUser(profile))
      .catch((error) => {
        // Si el servidor no responde no borramos la sesión: puede estar despertando.
        if (error?.name !== 'AbortError' && error?.status !== 0) closeSession()
      })
      .finally(() => setChecking(false))
    return () => controller.abort()
  }, [closeSession])

  // Cualquier petición rechazada por el servidor devuelve a la pantalla de entrada.
  useEffect(() => {
    setSessionExpiredHandler(closeSession)
    return () => setSessionExpiredHandler(null)
  }, [closeSession])

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email, password)
      openSession(data.token, data.user)
      return data.user
    },
    [openSession],
  )

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const data = await authApi.changePassword(currentPassword, newPassword)
      openSession(data.token, data.user)
      return data.user
    },
    [openSession],
  )

  const value = useMemo(
    () => ({
      user,
      checking,
      isAdmin: user?.role === 'admin',
      login,
      logout: closeSession,
      changePassword,
    }),
    [user, checking, login, closeSession, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
