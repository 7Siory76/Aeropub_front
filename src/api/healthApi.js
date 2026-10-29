import api from './client';

// Health Check API
export const checkHealthApi = () => api.get('/health').then(res => res.data);
