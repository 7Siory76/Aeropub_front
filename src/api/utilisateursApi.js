import api from './client';

/**
 * Utilisateurs & Rôles (Tables Utilisateur & Role)
 */
export const utilisateursApi = {
  getAll: () => api.get('/utilisateurs').then(res => res.data.data),
  getAllRoles: () => api.get('/utilisateurs/roles').then(res => res.data.data),
  getById: (id) => api.get(`/utilisateurs/${id}`).then(res => res.data.data),
  create: (data) => api.post('/utilisateurs', data).then(res => res.data.data),
  update: (id, data) => api.put(`/utilisateurs/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/utilisateurs/${id}`).then(res => res.data.data),
};
