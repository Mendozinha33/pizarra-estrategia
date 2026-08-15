import { useState } from 'react'

import { Icon } from '../../components/ui/Icon.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useUsers } from '../../hooks/useUsers.js'
import { generatePassword } from '../../lib/passwords.js'
import { PasswordField } from './PasswordField.jsx'

const MIN_PASSWORD = 8

const ROLES = [
  { id: 'entrenador', label: 'Entrenador' },
  { id: 'admin', label: 'Administrador' },
]

const roleLabel = (role) => ROLES.find((item) => item.id === role)?.label ?? role

/** Alta de usuario: correo, nombre, permiso y contraseña propuesta por el sistema. */
function CreateDialog({ onClose, onCreate }) {
  const toast = useToast()
  const [form, setForm] = useState({
    email: '',
    name: '',
    role: 'entrenador',
    password: generatePassword(),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState(null)

  const update = (changes) => setForm((current) => ({ ...current, ...changes }))

  const submit = async () => {
    if (saving) return
    if (!form.email.includes('@')) {
      setError('Escribe un correo válido')
      return
    }
    if (form.password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onCreate({
        email: form.email.trim(),
        name: form.name.trim(),
        role: form.role,
        password: form.password,
      })
      // No cerramos aún: hay que enseñar la contraseña para poder dársela.
      setCreated({ email: form.email.trim(), password: form.password })
      toast.success('Usuario dado de alta')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    return (
      <Modal title="Usuario dado de alta" onClose={onClose}>
        <p className="hint" style={{ marginBottom: 12 }}>
          Apunta estos datos y dáselos a <strong>{created.email}</strong>. La contraseña no se
          puede volver a ver: si se pierde, se restablece desde el botón «Restablecer contraseña».
        </p>
        <div className="pwshow mono">{created.password}</div>
        <p className="hint" style={{ marginTop: 10 }}>
          La primera vez que entre, la aplicación le pedirá que la cambie por una suya.
        </p>
        <div className="modal__foot">
          <button type="button" className="btn primary" onClick={onClose}>
            Hecho
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Dar de alta un usuario" onClose={onClose}>
      <label className="f" htmlFor="new-email">
        Correo
      </label>
      <input
        id="new-email"
        type="email"
        value={form.email}
        onChange={(event) => update({ email: event.target.value })}
        placeholder="nombre@aravacacf.com"
      />

      <label className="f" htmlFor="new-name">
        Nombre
      </label>
      <input
        id="new-name"
        value={form.name}
        onChange={(event) => update({ name: event.target.value })}
        placeholder="Ej. Luis, entrenador cadete"
      />

      <label className="f" htmlFor="new-role">
        Permisos
      </label>
      <select
        id="new-role"
        value={form.role}
        onChange={(event) => update({ role: event.target.value })}
      >
        {ROLES.map((role) => (
          <option key={role.id} value={role.id}>
            {role.label}
          </option>
        ))}
      </select>
      <p className="hint">
        El entrenador usa la pizarra. El administrador, además, gestiona los usuarios.
      </p>

      <PasswordField
        id="new-password"
        label="Contraseña"
        value={form.password}
        onChange={(password) => update({ password })}
      />

      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}

      <div className="modal__foot">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn primary" onClick={submit} disabled={saving}>
          {saving ? 'Dando de alta…' : 'Dar de alta'}
        </button>
      </div>
    </Modal>
  )
}

/** Edición de los datos de un usuario (no de su contraseña). */
function EditDialog({ user, isMe, onClose, onSave }) {
  const toast = useToast()
  const [form, setForm] = useState({ email: user.email, name: user.name, role: user.role })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (changes) => setForm((current) => ({ ...current, ...changes }))

  const submit = async () => {
    if (saving) return
    if (!form.email.includes('@')) {
      setError('Escribe un correo válido')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ email: form.email.trim(), name: form.name.trim(), role: form.role })
      toast.success('Usuario actualizado')
      onClose()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Editar usuario" onClose={onClose}>
      <label className="f" htmlFor="edit-email">
        Correo
      </label>
      <input
        id="edit-email"
        type="email"
        value={form.email}
        onChange={(event) => update({ email: event.target.value })}
      />

      <label className="f" htmlFor="edit-name">
        Nombre
      </label>
      <input
        id="edit-name"
        value={form.name}
        onChange={(event) => update({ name: event.target.value })}
      />

      <label className="f" htmlFor="edit-role">
        Permisos
      </label>
      <select
        id="edit-role"
        value={form.role}
        onChange={(event) => update({ role: event.target.value })}
        disabled={isMe}
      >
        {ROLES.map((role) => (
          <option key={role.id} value={role.id}>
            {role.label}
          </option>
        ))}
      </select>
      {isMe && <p className="hint">No puedes cambiar tus propios permisos.</p>}

      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}

      <div className="modal__foot">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn primary" onClick={submit} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  )
}

/** Contraseña nueva para un usuario: la propone el sistema y se puede cambiar. */
function ResetDialog({ user, onClose, onReset }) {
  const toast = useToast()
  const [password, setPassword] = useState(generatePassword())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (saving) return
    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onReset(password)
      setDone(true)
      toast.success('Contraseña restablecida')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <Modal title="Contraseña restablecida" onClose={onClose}>
        <p className="hint" style={{ marginBottom: 12 }}>
          Dale esta contraseña a <strong>{user.email}</strong>. Si tenía la aplicación abierta,
          se le ha cerrado la sesión.
        </p>
        <div className="pwshow mono">{password}</div>
        <div className="modal__foot">
          <button type="button" className="btn primary" onClick={onClose}>
            Hecho
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Restablecer contraseña" onClose={onClose}>
      <p className="hint" style={{ marginBottom: 12 }}>
        Vas a poner una contraseña nueva a <strong>{user.name || user.email}</strong>. La
        anterior dejará de funcionar.
      </p>

      <PasswordField
        id="reset-password"
        label="Contraseña nueva"
        value={password}
        onChange={setPassword}
      />

      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}

      <div className="modal__foot">
        <button type="button" className="btn ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn primary" onClick={submit} disabled={saving}>
          {saving ? 'Guardando…' : 'Restablecer'}
        </button>
      </div>
    </Modal>
  )
}

/** Pantalla de usuarios: quién puede entrar y qué puede hacer. */
export function UsersView() {
  const { user: me } = useAuth()
  const toast = useToast()
  const { users, loading, error, reload, create, update, resetPassword } = useUsers()
  const [dialog, setDialog] = useState(null)

  const toggleBlock = async (user) => {
    const blocking = !user.blocked
    const question = blocking
      ? `¿Bloquear a ${user.name || user.email}? Dejará de poder entrar.`
      : `¿Desbloquear a ${user.name || user.email}?`
    if (!window.confirm(question)) return
    try {
      await update(user.id, { blocked: blocking })
      toast.success(blocking ? 'Usuario bloqueado' : 'Usuario desbloqueado')
    } catch (cause) {
      toast.error(cause.message)
    }
  }

  return (
    <div className="users">
      <div className="users__head">
        <div>
          <h2 className="disp">Usuarios</h2>
          <p className="hint">Quién puede entrar en la pizarra y con qué permisos.</p>
        </div>
        <button type="button" className="btn primary" onClick={() => setDialog({ type: 'create' })}>
          <Icon name="plus" size={15} />
          Dar de alta
        </button>
      </div>

      {loading && <div className="empty">Cargando usuarios…</div>}

      {error && (
        <div className="empty error">
          No se han podido cargar los usuarios.{' '}
          <button type="button" className="linklike" onClick={reload}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="users__list">
          {users.map((user) => (
            <div key={user.id} className={`user card${user.blocked ? ' user--blocked' : ''}`}>
              <div className="user__info">
                <strong className="ellipsis">{user.name || user.email}</strong>
                <span className="hint ellipsis">{user.email}</span>
                <div className="user__tags">
                  <span className="badge">{roleLabel(user.role)}</span>
                  {user.id === me.id && <span className="badge">Tú</span>}
                  {user.blocked && <span className="badge badge--warn">Bloqueado</span>}
                  {user.must_change_password && !user.blocked && (
                    <span className="badge">Pendiente de cambiar contraseña</span>
                  )}
                </div>
              </div>

              <div className="user__acts">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setDialog({ type: 'edit', user })}
                >
                  <Icon name="pen" size={14} />
                  Editar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setDialog({ type: 'reset', user })}
                >
                  <Icon name="rotate" size={14} />
                  Restablecer contraseña
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => toggleBlock(user)}
                  disabled={user.id === me.id}
                  title={
                    user.id === me.id ? 'No puedes bloquear tu propio usuario' : undefined
                  }
                >
                  <Icon name="x" size={14} />
                  {user.blocked ? 'Desbloquear' : 'Bloquear'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog?.type === 'create' && (
        <CreateDialog onClose={() => setDialog(null)} onCreate={create} />
      )}

      {dialog?.type === 'edit' && (
        <EditDialog
          user={dialog.user}
          isMe={dialog.user.id === me.id}
          onClose={() => setDialog(null)}
          onSave={(payload) => update(dialog.user.id, payload)}
        />
      )}

      {dialog?.type === 'reset' && (
        <ResetDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onReset={(password) => resetPassword(dialog.user.id, password)}
        />
      )}
    </div>
  )
}
