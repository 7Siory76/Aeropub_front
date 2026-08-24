import axios from 'axios';

// URL de l'API Backend Express (BACK_OFFICE)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Appels HTTP pur vers les liens de l'API REST de BACK_OFFICE pour AeroPub
 */

// 1. Health Check -> http://localhost:5000/api/health
export const checkHealthApi = () => api.get('/health').then(res => res.data);

// 2. EMPLACEMENTS (ex-Publicités) -> http://localhost:5000/api/emplacements
export const emplacementsApi = {
  getAll: () => api.get('/emplacements').then(res => res.data.data),
  getByReference: (ref) => api.get(`/emplacements/${ref}`).then(res => res.data.data),
  create: (data) => api.post('/emplacements', data).then(res => res.data.data),
  update: (ref, data) => api.put(`/emplacements/${ref}`, data).then(res => res.data.data),
  delete: (ref) => api.delete(`/emplacements/${ref}`).then(res => res.data.data),
};

// Alias de rétro-compatibilité
export const publicitesApi = emplacementsApi;

// 3. TYPES DE SUPPORT -> http://localhost:5000/api/typesupports
export const typeSupportsApi = {
  getAll: () => api.get('/typesupports').then(res => res.data.data),
  getById: (id) => api.get(`/typesupports/${id}`).then(res => res.data.data),
  create: (data) => api.post('/typesupports', data).then(res => res.data.data),
  update: (id, data) => api.put(`/typesupports/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/typesupports/${id}`).then(res => res.data.data),
};

// 4. ABONNEMENTS -> http://localhost:5000/api/abonnements
export const abonnementsApi = {
  getAll: () => api.get('/abonnements').then(res => res.data.data),
  getById: (id) => api.get(`/abonnements/${id}`).then(res => res.data.data),
  create: (data) => api.post('/abonnements', data).then(res => res.data.data),
  update: (id, data) => api.put(`/abonnements/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/abonnements/${id}`).then(res => res.data.data),
};

// 5. CLIENTS -> http://localhost:5000/api/clients
export const clientsApi = {
  getAll: () => api.get('/clients').then(res => res.data.data),
  getById: (id) => api.get(`/clients/${id}`).then(res => res.data.data),
  create: (data) => api.post('/clients', data).then(res => res.data.data),
  update: (id, data) => api.put(`/clients/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/clients/${id}`).then(res => res.data.data),
};

// 6. ZONES -> http://localhost:5000/api/zones
export const zonesApi = {
  getAll: () => api.get('/zones').then(res => res.data.data),
  getById: (id) => api.get(`/zones/${id}`).then(res => res.data.data),
  create: (data) => api.post('/zones', data).then(res => res.data.data),
  update: (id, data) => api.put(`/zones/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/zones/${id}`).then(res => res.data.data),
};

// 7. LOCALISATIONS -> http://localhost:5000/api/localisations
export const localisationsApi = {
  getAll: () => api.get('/localisations').then(res => res.data.data),
  getById: (id) => api.get(`/localisations/${id}`).then(res => res.data.data),
  create: (data) => api.post('/localisations', data).then(res => res.data.data),
  update: (id, data) => api.put(`/localisations/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/localisations/${id}`).then(res => res.data.data),
};

// 8. CATÉGORIES -> http://localhost:5000/api/categories
export const categoriesApi = {
  getAll: () => api.get('/categories').then(res => res.data.data),
  getById: (id) => api.get(`/categories/${id}`).then(res => res.data.data),
  create: (data) => api.post('/categories', data).then(res => res.data.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/categories/${id}`).then(res => res.data.data),
};

// 9. FORMATS -> http://localhost:5000/api/formats
export const formatsApi = {
  getAll: () => api.get('/formats').then(res => res.data.data),
  getById: (id) => api.get(`/formats/${id}`).then(res => res.data.data),
  create: (data) => api.post('/formats', data).then(res => res.data.data),
  update: (id, data) => api.put(`/formats/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/formats/${id}`).then(res => res.data.data),
};

// 10. PARAMÉTRAGES -> http://localhost:5000/api/parametrages
export const parametragesApi = {
  getAll: () => api.get('/parametrages').then(res => res.data.data),
  getById: (id) => api.get(`/parametrages/${id}`).then(res => res.data.data),
  create: (data) => api.post('/parametrages', data).then(res => res.data.data),
  update: (id, data) => api.put(`/parametrages/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/parametrages/${id}`).then(res => res.data.data),
};

// 11. IMPORTATION CSV -> http://localhost:5000/api/csv/upload
export const csvApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/csv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
};

export default api;
