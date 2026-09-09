import api from './client';

/**
 * Abonnements & Contrats (Tables Abonnement, Abonnement_Support, Statut_Abonnement)
 */
export const abonnementsApi = {
  getAll: () => api.get('/abonnements').then(res => res.data.data),
  getById: (id) => api.get(`/abonnements/${id}`).then(res => res.data.data),
  create: (data) => api.post('/abonnements', data).then(res => res.data.data),
  update: (id, data) => api.put(`/abonnements/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/abonnements/${id}`).then(res => res.data.data),
};
