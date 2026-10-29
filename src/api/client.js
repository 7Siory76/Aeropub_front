import axios from 'axios';

// URL de l'API Backend Express (Local ou Koyeb)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Intercepteur de Requête : Attache le badge numérique (Token JWT) à chaque appel
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aeropub_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Intercepteur de Réponse : Détecte l'erreur 401 (Token expiré ou absent)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config ? error.config.url || '' : '';
      const isLoginRequest = url.includes('/utilisateurs/login');

      // Si l'erreur 401 ne vient pas de la page de login elle-même (ex: session expirée lors d'un appel API)
      if (!isLoginRequest) {
        localStorage.removeItem('aeropub_token');
        localStorage.removeItem('aeropub_user');
        localStorage.setItem('aeropub_session_expired', 'true');
        window.dispatchEvent(new CustomEvent('aeropub:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
