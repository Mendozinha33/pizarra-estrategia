import { Component } from 'react'

/** Evita que un fallo de render deje la pantalla en blanco. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error de render', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="empty error" style={{ margin: 40 }}>
        <h2 style={{ marginBottom: 8 }}>Algo ha fallado en la pizarra</h2>
        <p className="hint">{this.state.error.message}</p>
        <button type="button" className="btn" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    )
  }
}
