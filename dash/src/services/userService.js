// =============================================
// User Service
// File: frontend/src/services/userService.js
// =============================================

import { apiGet, apiPut, apiDelete } from './api';

// GET /api/users - Liste des utilisateurs
export const getUsers = async (params = {}) => {
  try {
    const response = await apiGet('/users', params);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la récupération des utilisateurs',
    };
  }
};

// GET /api/users/:id - Détails d'un utilisateur
export const getUserById = async (id) => {
  try {
    const response = await apiGet(`/users/${id}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la récupération de l\'utilisateur',
    };
  }
};

// PUT /api/users/:id - Modifier un utilisateur
export const updateUser = async (id, data) => {
  try {
    const response = await apiPut(`/users/${id}`, data);
    return {
      success: true,
      data: response.data,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la modification de l\'utilisateur',
    };
  }
};

// DELETE /api/users/:id - Supprimer un utilisateur
export const deleteUser = async (id) => {
  try {
    const response = await apiDelete(`/users/${id}`);
    return {
      success: true,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la suppression de l\'utilisateur',
    };
  }
};

// PUT /api/users/:id/status - Changer le statut
export const updateUserStatus = async (id, status) => {
  try {
    const response = await apiPut(`/users/${id}/status`, { status });
    return {
      success: true,
      data: response.data,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la modification du statut',
    };
  }
};

// GET /api/users/:id/stats - Statistiques d'un utilisateur
export const getUserStats = async (id) => {
  try {
    const response = await apiGet(`/users/${id}/stats`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la récupération des statistiques',
    };
  }
};
