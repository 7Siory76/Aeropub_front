import api from './client';

export const documentsApi = {
  getAll: () => api.get('/documents').then(res => res.data.data),
  getByAbonnement: (ref) => api.get(`/documents/abonnement/${ref}`).then(res => res.data.data),
  getById: (id) => api.get(`/documents/${id}`).then(res => res.data.data),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data.data),
  create: (data) => api.post('/documents', data).then(res => res.data.data),
  delete: (id) => api.delete(`/documents/${id}`).then(res => res.data.data),
};
