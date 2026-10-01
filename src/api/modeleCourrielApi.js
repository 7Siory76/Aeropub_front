import api from './client';

/**
 * Modèles de Courriels (Table Modele_Courriel)
 */
export const modeleCourrielApi = {
  getAll: () => api.get('/modeles-courriels').then(res => res.data.data),
  getByCode: (code) => api.get(`/modeles-courriels/${code}`).then(res => res.data.data),
  updateByCode: (code, data) => api.put(`/modeles-courriels/${code}`, data).then(res => res.data.data),
};
