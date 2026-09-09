import api from './client';

/**
 * Clients & Contacts (Tables Client & Contact)
 */
export const clientsApi = {
  getAll: () => api.get('/clients').then(res => res.data.data),
  getById: (id) => api.get(`/clients/${id}`).then(res => res.data.data),
  create: (data) => api.post('/clients', data).then(res => res.data.data),
  update: (id, data) => api.put(`/clients/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/clients/${id}`).then(res => res.data.data),
};
