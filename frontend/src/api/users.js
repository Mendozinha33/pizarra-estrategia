/** Endpoints de gestión de usuarios (sólo administrador). */

import { api } from './client.js'

export const usersApi = {
  list: (options) => api.get('/users', options),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.patch(`/users/${id}`, payload),
  resetPassword: (id, newPassword) => api.post(`/users/${id}/password`, { new_password: newPassword }),
}
