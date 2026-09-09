import api from './client';

/**
 * Paramétrages & Ingestion CSV (Table Parametrage & Batch CSV)
 */
export const parametragesApi = {
  getAll: () => api.get('/parametrages').then(res => res.data.data),
  getById: (id) => api.get(`/parametrages/${id}`).then(res => res.data.data),
  create: (data) => api.post('/parametrages', data).then(res => res.data.data),
  update: (id, data) => api.put(`/parametrages/${id}`, data).then(res => res.data.data),
  delete: (id) => api.delete(`/parametrages/${id}`).then(res => res.data.data),
};

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
