import { useState } from 'react'

import { Icon } from '../../components/ui/Icon.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'

/** Pantalla de entrada: sin sesión iniciada no se ve nada más de la aplicación. */
export function LoginView() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (sending) return
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña')
      return
    }
    setSending(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (cause) {
      setError(cause.message)
      setPassword('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="login">
      <div className="login__card card">
        <div className="brand" style={{ marginBottom: 4 }}>
          <span className="name">Club Manager</span>
          <span className="badge">Táctica</span>
        </div>
        <p className="hint" style={{ marginBottom: 16 }}>
          Entra con tu correo y tu contraseña para ver las jugadas y las sesiones.
        </p>

        <label className="f" htmlFor="login-email">
          Correo
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          placeholder="nombre@aravacacf.com"
        />

        <label className="f" htmlFor="login-password">
          Contraseña
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          placeholder="Tu contraseña"
        />

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn primary"
          style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
          onClick={submit}
          disabled={sending}
        >
          <Icon name="users" size={15} />
          {sending ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="hint" style={{ marginTop: 14 }}>
          ¿No tienes acceso o has olvidado la contraseña? Pídeselo al administrador.
        </p>
      </div>
    </div>
  )
}
