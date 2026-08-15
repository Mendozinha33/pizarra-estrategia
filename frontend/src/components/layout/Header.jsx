import { useEffect, useRef, useState } from 'react'

import { useAuth } from '../../hooks/useAuth.jsx'
import { Icon } from '../ui/Icon.jsx'

export const VIEWS = [
  { id: 'pizarra', label: 'Pizarra', icon: 'grid' },
  { id: 'jugadas', label: 'Jugadas', icon: 'save' },
  { id: 'sesion', label: 'Sesión', icon: 'clipboard' },
]

/** Botón de usuario: quién ha entrado y qué puede hacer con su cuenta. */
function UserMenu({ onViewChange, onChangePassword }) {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  // Cerrar al pulsar fuera o con Escape.
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (action) => {
    setOpen(false)
    action()
  }

  return (
    <div className="usermenu" ref={boxRef}>
      <button
        type="button"
        className={`btn${open ? ' on' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="users" size={15} />
        <span className="ellipsis usermenu__name">{user.name || user.email}</span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={14} />
      </button>

      {open && (
        <div className="usermenu__panel card" role="menu">
          <div className="usermenu__who">
            <strong className="ellipsis">{user.name || 'Sin nombre'}</strong>
            <span className="hint ellipsis">{user.email}</span>
          </div>

          {isAdmin && (
            <button type="button" role="menuitem" onClick={() => choose(() => onViewChange('usuarios'))}>
              <Icon name="users" size={15} />
              Usuarios
            </button>
          )}

          <button type="button" role="menuitem" onClick={() => choose(onChangePassword)}>
            <Icon name="rotate" size={15} />
            Cambiar mi contraseña
          </button>

          <button type="button" role="menuitem" onClick={() => choose(logout)}>
            <Icon name="x" size={15} />
            Salir
          </button>
        </div>
      )}
    </div>
  )
}

export function Header({ view, onViewChange, offline, onChangePassword }) {
  return (
    <header className="bar">
      <div className="brand">
        <span className="name">Club Manager</span>
        <span className="badge">Táctica</span>
      </div>

      {offline && (
        <span className="badge badge--warn" title="La API no responde">
          Sin conexión con el servidor
        </span>
      )}

      <nav aria-label="Secciones">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? 'on' : ''}
            aria-current={view === item.id ? 'page' : undefined}
            onClick={() => onViewChange(item.id)}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </nav>

      <UserMenu onViewChange={onViewChange} onChangePassword={onChangePassword} />
    </header>
  )
}
