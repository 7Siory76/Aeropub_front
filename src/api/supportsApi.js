import api from './client';

/**
 * Supports & Emplacements Publicitaires (Table Support & Etat_Support)
 */
export const supportsApi = {
  getAll: () => api.get('/supports').then(res => res.data.data),
  getByReference: (ref) => api.get(`/supports/${ref}`).then(res => res.data.data),
  create: (data) => api.post('/supports', data).then(res => res.data.data),
  update: (ref, data) => api.put(`/supports/${ref}`, data).then(res => res.data.data),
  delete: (ref) => api.delete(`/supports/${ref}`).then(res => res.data.data),
  getHistoriqueEtats: (ref) => api.get(`/supports/${ref}/etats`).then(res => res.data.data),
};

// Alias de rétro-compatibilité
export const emplacementsApi = supportsApi;
export const publicitesApi = supportsApi;
