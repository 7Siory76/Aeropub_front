import api from './client';

/**
 * Types de Support (Table Type_Support)
 */
export const typeSupportsApi = {
  getAll: () => api.get('/typesupports').then(res => res.data.data),
  getById: (id) => api.get(`/typesupports/${id}`).then(res => res.data.data),
  create: (data) => api.post('/typesupports', data).then(res => res.data.data),
  update: (id, data) => api.put(`/typesupports/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/typesupports/${id}`).then(res => res.data.data),
};
