/** Endpoints de sesiones de entrenamiento. */

import { api } from './client.js'

export const sessionsApi = {
  current: (options) => api.get('/sessions/current', options),
  get: (id, options) => api.get(`/sessions/${id}`, options),
  update: (id, payload) => api.patch(`/sessions/${id}`, payload),
  addBlock: (sessionId, payload) => api.post(`/sessions/${sessionId}/blocks`, payload),
  updateBlock: (sessionId, blockId, payload) =>
    api.patch(`/sessions/${sessionId}/blocks/${blockId}`, payload),
  removeBlock: (sessionId, blockId) => api.delete(`/sessions/${sessionId}/blocks/${blockId}`),
  reorderBlocks: (sessionId, blockIds) =>
    api.put(`/sessions/${sessionId}/blocks/order`, { block_ids: blockIds }),
}
