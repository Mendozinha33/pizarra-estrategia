import { Icon } from '../ui/Icon.jsx'

export const VIEWS = [
  { id: 'pizarra', label: 'Pizarra', icon: 'grid' },
  { id: 'jugadas', label: 'Jugadas', icon: 'save' },
  { id: 'sesion', label: 'Sesión', icon: 'clipboard' },
]

export function Header({ view, onViewChange, offline }) {
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
    </header>
  )
}
