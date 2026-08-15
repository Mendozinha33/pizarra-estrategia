/** Cliente HTTP de la API: un único sitio donde se maneja red y errores. */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function describe(status, body) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    // Errores de validación de Pydantic: campo + motivo.
    const first = detail[0]
    const field = Array.isArray(first.loc) ? first.loc.slice(1).join('.') : ''
    return field ? `${field}: ${first.msg}` : first.msg
  }
  return `Error ${status} del servidor`
}

/**
 * Credencial de la sesión. La guarda `useAuth`; aquí sólo se conserva la última
 * conocida para poder añadirla a cada petición sin pasarla por todas las llamadas.
 */
let sessionToken = null
let onSessionExpired = null

export function setSessionToken(token) {
  sessionToken = token || null
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

export async function request(path, { method = 'GET', body, signal, anonymous = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (sessionToken && !anonymous) headers.Authorization = `Bearer ${sessionToken}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new ApiError('No se ha podido contactar con el servidor', { status: 0 })
  }

  // Sesión caducada, contraseña cambiada o usuario bloqueado: volver a la entrada.
  if (response.status === 401 && !anonymous) onSessionExpired?.()

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(describe(response.status, payload), {
      status: response.status,
      details: payload?.detail,
    })
  }
  return payload
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
