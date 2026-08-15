import { useState } from 'react'

import { Modal } from '../../components/ui/Modal.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'

const MIN_LENGTH = 8

/**
 * Cambio de la propia contraseña. Cuando es obligatorio (usuario recién dado de
 * alta o contraseña restablecida) no se puede cerrar sin cambiarla.
 */
export function PasswordDialog({ onClose, required = false }) {
  const { changePassword } = useAuth()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (saving) return
    if (next.length < MIN_LENGTH) {
      setError(`La contraseña nueva debe tener al menos ${MIN_LENGTH} caracteres`)
      return
    }
    if (next !== repeat) {
      setError('Las dos contraseñas nuevas no coinciden')
      return
    }
    setSaving(true)
    setError('')
    try {
      await changePassword(current, next)
      toast.success('Contraseña actualizada')
      onClose()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Cambiar mi contraseña" onClose={onClose} closable={!required}>
      {required && (
        <p className="hint" style={{ marginBottom: 12 }}>
          Por seguridad, elige una contraseña nueva antes de seguir.
        </p>
      )}

      <label className="f" htmlFor="pw-current">
        Contraseña actual
      </label>
      <input
        id="pw-current"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
      />

      <label className="f" htmlFor="pw-next">
        Contraseña nueva
      </label>
      <input
        id="pw-next"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(event) => setNext(event.target.value)}
        placeholder={`Mínimo ${MIN_LENGTH} caracteres`}
      />

      <label className="f" htmlFor="pw-repeat">
        Repite la contraseña nueva
      </label>
      <input
        id="pw-repeat"
        type="password"
        autoComplete="new-password"
        value={repeat}
        onChange={(event) => setRepeat(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && submit()}
      />

      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}

      <div className="modal__foot">
        {!required && (
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
        )}
        <button type="button" className="btn primary" onClick={submit} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </div>
    </Modal>
  )
}
