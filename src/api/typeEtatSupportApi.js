import api from './client';

export const typeEtatSupportApi = {
  getAll: () => api.get('/types-etats-supports').then(res => res.data.data),
  getById: (id) => api.get(`/types-etats-supports/${id}`).then(res => res.data.data),
  create: (data) => api.post('/types-etats-supports', data).then(res => res.data.data),
  update: (id, data) => api.put(`/types-etats-supports/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/types-etats-supports/${id}`).then(res => res.data.data),
};
