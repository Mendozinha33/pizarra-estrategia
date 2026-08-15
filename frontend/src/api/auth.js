/** Endpoints de acceso a la aplicación. */

import { api } from './client.js'

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }, { anonymous: true }),
  me: (options) => api.get('/auth/me', options),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
}
