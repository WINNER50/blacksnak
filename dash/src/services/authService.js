// =============================================
// Auth Service
// File: frontend/src/services/authService.js
// =============================================

import { apiPost, apiGet } from './api';
import { setToken, setAdmin, removeToken } from '../config';

// POST /api/auth/login - Connexion
export const login = async (email, password) => {
  try {
    const response = await apiPost('/auth/login', { email, password });
    
    if (response.success && response.data) {
      // Sauvegarder le token et les données admin
      setToken(response.data.token);
      setAdmin(response.data.admin);
      
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      message: response.message || 'Erreur de connexion',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur de connexion',
    };
  }
};

// POST /api/auth/logout - Déconnexion
export const logout = async () => {
  try {
    await apiPost('/auth/logout');
    removeToken();
    return { success: true };
  } catch (error) {
    // Déconnecter quand même côté client
    removeToken();
    return { success: true };
  }
};

// GET /api/auth/me - Profil actuel
export const getMe = async () => {
  try {
    const response = await apiGet('/auth/me');
    
    if (response.success && response.data) {
      setAdmin(response.data);
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      message: response.message || 'Erreur lors de la récupération du profil',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la récupération du profil',
    };
  }
};

// POST /api/auth/refresh - Rafraîchir le token
export const refreshToken = async () => {
  try {
    const response = await apiPost('/auth/refresh');
    
    if (response.success && response.data) {
      setToken(response.data.token);
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      message: response.message || 'Erreur lors du rafraîchissement du token',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors du rafraîchissement du token',
    };
  }
};
