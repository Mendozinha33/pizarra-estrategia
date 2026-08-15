import { useEffect } from 'react'

import { Icon } from './Icon.jsx'

/** Ventana emergente sencilla: fondo oscurecido, título y contenido. */
export function Modal({ title, onClose, children, closable = true }) {
  useEffect(() => {
    if (!closable) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, closable])

  return (
    <div
      className="modal"
      role="presentation"
      onMouseDown={(event) => {
        if (closable && event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal__box card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          <h3>{title}</h3>
          {closable && (
            <button type="button" className="btn ghost" onClick={onClose} aria-label="Cerrar">
              <Icon name="x" size={15} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
