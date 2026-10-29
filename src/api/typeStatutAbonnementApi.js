import api from './client';

export const typeStatutAbonnementApi = {
  getAll: () => api.get('/types-statuts-abonnements').then(res => res.data.data),
  getById: (id) => api.get(`/types-statuts-abonnements/${id}`).then(res => res.data.data),
  create: (data) => api.post('/types-statuts-abonnements', data).then(res => res.data.data),
  update: (id, data) => api.put(`/types-statuts-abonnements/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/types-statuts-abonnements/${id}`).then(res => res.data.data),
};
