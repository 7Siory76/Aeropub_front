import api from './client';

/**
 * Documents Liés (Table Document_Lie)
 */
export const documentsApi = {
  getAll: () => api.get('/documents').then(res => res.data.data),
  getById: (id) => api.get(`/documents/${id}`).then(res => res.data.data),
  create: (data) => api.post('/documents', data).then(res => res.data.data),
  delete: (id) => api.delete(`/documents/${id}`).then(res => res.data.data),
};
