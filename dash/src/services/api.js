// =============================================
// API Service - Base
// File: frontend/src/services/api.js
// =============================================

import axios from 'axios';
import config, { getToken, removeToken, buildApiUrl } from '../config';

// Créer une instance axios avec configuration
const api = axios.create({
  baseURL: config.API_URL,
  timeout: config.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
  (response) => {
    // Retourner directement les données
    return response.data;
  },
  (error) => {
    // Gérer les erreurs
    if (error.response) {
      // Erreur avec réponse du serveur
      const { status, data } = error.response;

      // Si 401, déconnecter l'utilisateur
      if (status === 401) {
        removeToken();
        window.location.href = '/login';
      }

      // Retourner le message d'erreur du serveur
      return Promise.reject({
        status,
        message: data.message || 'Une erreur est survenue',
        data: data,
      });
    } else if (error.request) {
      // Erreur de réseau (pas de réponse)
      return Promise.reject({
        status: 0,
        message: 'Erreur de connexion au serveur',
      });
    } else {
      // Autre erreur
      return Promise.reject({
        status: 0,
        message: error.message || 'Une erreur inattendue est survenue',
      });
    }
  }
);

// Méthodes helper
export const apiGet = (endpoint, params = {}) => {
  return api.get(endpoint, { params });
};

export const apiPost = (endpoint, data = {}) => {
  return api.post(endpoint, data);
};

export const apiPut = (endpoint, data = {}) => {
  return api.put(endpoint, data);
};

export const apiDelete = (endpoint) => {
  return api.delete(endpoint);
};

// Payment Methods
export const getPaymentMethods = (activeOnly = false) => {
  return apiGet('/payments/methods', { activeOnly });
};

export const togglePaymentMethod = (id, isEnabled) => {
  return api.patch(`/payments/methods/${id}/toggle`, { is_enabled: isEnabled });
};

// Gateways
export const getGateways = () => {
  return apiGet('/gateways');
};

export const updateGateway = (slug, data) => {
  return apiPost(`/gateways/${slug}`, data);
};

// Settings
export const getSettings = () => {
  return apiGet('/settings');
};

export const updateSetting = (key, value) => {
  return apiPost('/settings', { key, value });
};

export default api;
