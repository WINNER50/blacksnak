// =============================================
// Frontend Configuration
// File: frontend/src/config.js
// =============================================

// Configuration de l'API
const config = {
  // URL de base de l'API backend
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',

  // Timeout pour les requêtes (ms)
  REQUEST_TIMEOUT: 30000,

  // Clé de stockage du token
  TOKEN_KEY: 'blacksnack_token',

  // Clé de stockage des données admin
  ADMIN_KEY: 'blacksnack_admin',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,

  // Devise par défaut
  DEFAULT_CURRENCY: 'USD',

  // Taux de conversion (exemple)
  CDF_TO_USD_RATE: 2500,
};

export default config;

// Helper pour construire les URLs
export const buildApiUrl = (endpoint) => {
  // Supprimer le / initial si présent
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${config.API_URL}/${cleanEndpoint}`;
};

// Helper pour récupérer le token
export const getToken = () => {
  return localStorage.getItem(config.TOKEN_KEY);
};

// Helper pour sauvegarder le token
export const setToken = (token) => {
  localStorage.setItem(config.TOKEN_KEY, token);
};

// Helper pour supprimer le token
export const removeToken = () => {
  localStorage.removeItem(config.TOKEN_KEY);
  localStorage.removeItem(config.ADMIN_KEY);
};

// Helper pour récupérer les données admin
export const getAdmin = () => {
  const adminData = localStorage.getItem(config.ADMIN_KEY);
  return adminData ? JSON.parse(adminData) : null;
};

// Helper pour sauvegarder les données admin
export const setAdmin = (admin) => {
  localStorage.setItem(config.ADMIN_KEY, JSON.stringify(admin));
};
