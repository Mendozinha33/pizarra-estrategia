import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ToastContext = createContext(null)

const VISIBLE_MS = 2600

/** Avisos efímeros. Un único toast a la vez: la pizarra no debe llenarse de ruido. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const notify = useCallback((message, tone = 'info') => {
    if (!message) return
    setToast({ message, tone, id: Date.now() })
  }, [])

  const value = useMemo(
    () => ({
      notify,
      success: (message) => notify(message, 'success'),
      error: (message) => notify(message, 'error'),
    }),
    [notify],
  )

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast--${toast.tone}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return context
}
