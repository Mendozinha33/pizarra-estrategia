import { useState } from 'react'

import { Icon } from '../../components/ui/Icon.jsx'
import { generatePassword } from '../../lib/passwords.js'

/**
 * Campo de contraseña que el sistema rellena solo. El administrador puede
 * generar otra, escribir la suya o copiarla para dársela al usuario.
 */
export function PasswordField({ id, label, value, onChange, hint }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await window.navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Navegador sin permiso para copiar: la contraseña se ve en pantalla igual.
      setCopied(false)
    }
  }

  return (
    <>
      <label className="f" htmlFor={id}>
        {label}
      </label>
      <div className="pwfield">
        <input
          id={id}
          type="text"
          className="mono"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        <button
          type="button"
          className="btn ghost"
          onClick={() => onChange(generatePassword())}
          title="Generar otra contraseña"
        >
          <Icon name="rotate" size={15} />
        </button>
        <button type="button" className="btn ghost" onClick={copy} title="Copiar contraseña">
          <Icon name={copied ? 'save' : 'download'} size={15} />
        </button>
      </div>
      <p className="hint">{hint ?? 'La ha propuesto el sistema. Puedes cambiarla o generar otra.'}</p>
    </>
  )
}
