/** Endpoints de jugadas. */

import { api } from './client.js'

const query = (params) => {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const playsApi = {
  list: (filters, options) => api.get(`/plays${query(filters)}`, options),
  get: (id, options) => api.get(`/plays/${id}`, options),
  create: (payload) => api.post('/plays', payload),
  update: (id, payload) => api.patch(`/plays/${id}`, payload),
  remove: (id) => api.delete(`/plays/${id}`),
}
