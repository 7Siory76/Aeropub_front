import api from './client';

/**
 * Zones, Aéroports & Périmètres (Tables Zone_Terminal, Aeroport, Perimetre)
 */
export const zonesApi = {
  getAll: () => api.get('/zones').then(res => res.data.data),
  getById: (id) => api.get(`/zones/${id}`).then(res => res.data.data),
  create: (data) => api.post('/zones', data).then(res => res.data.data),
  update: (id, data) => api.put(`/zones/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/zones/${id}`).then(res => res.data.data),
};

export const aeroportsApi = {
  getAll: () => api.get('/aeroports').then(res => res.data.data),
};

export const perimetresApi = {
  getAll: () => api.get('/perimetres').then(res => res.data.data),
};

// Alias de rétro-compatibilité
export const localisationsApi = zonesApi;
