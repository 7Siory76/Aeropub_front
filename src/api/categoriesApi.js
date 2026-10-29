import api from './client';

/**
 * Catégories de Support & Formats (Tables Categorie_Support & Formats)
 */
export const categoriesApi = {
  getAll: () => api.get('/categories').then(res => res.data.data),
  getById: (id) => api.get(`/categories/${id}`).then(res => res.data.data),
  create: (data) => api.post('/categories', data).then(res => res.data.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/categories/${id}`).then(res => res.data.data),
};

// Formats rétro-compatibles (neutralisé)
export const formatsApi = {
  getAll: () => Promise.resolve([]),
  getById: () => Promise.resolve(null),
};
