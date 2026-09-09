/**
 * apiService.js - Pont de rétro-compatibilité
 * Re-exporte tous les modules d'API par table/domaine depuis ./index
 */
export * from './index';
import api from './client';
export default api;
