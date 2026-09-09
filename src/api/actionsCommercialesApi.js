import api from './client';

/**
 * Actions Commerciales & Alertes J-30 (Table Action_Commerciale)
 */
export const actionsCommercialesApi = {
  getAll: () => api.get('/actions-commerciales').then(res => res.data.data),
  getById: (id) => api.get(`/actions-commerciales/${id}`).then(res => res.data.data),
  create: (data) => api.post('/actions-commerciales', data).then(res => res.data.data),
  update: (id, data) => api.put(`/actions-commerciales/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/actions-commerciales/${id}`).then(res => res.data.data),
};
