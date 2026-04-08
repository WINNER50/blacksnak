// =============================================
// Recharge Service
// File: frontend/src/services/rechargeService.js
// =============================================

import { apiGet, apiPost } from './api';

// POST /api/recharges - Recharger un compte joueur
export const rechargePlayer = async (data) => {
  try {
    const response = await apiPost('/recharges', data);
    return {
      success: true,
      data: response.data,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la recharge',
    };
  }
};

// GET /api/recharges - Historique des recharges
export const getRechargeHistory = async (params = {}) => {
  try {
    const response = await apiGet('/recharges', params);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la récupération de l\'historique',
    };
  }
};

// POST /api/recharges/system - Opération système
export const systemOperation = async (data) => {
  try {
    const response = await apiPost('/recharges/system', data);
    return {
      success: true,
      data: response.data,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de l\'opération système',
    };
  }
};

// GET /api/recharges/system - Historique des opérations système
export const getSystemHistory = async (params = {}) => {
  try {
    const response = await apiGet('/recharges/system', params);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la récupération de l\'historique système',
    };
  }
};

// GET /api/recharges/system/balance - Solde système actuel
export const getSystemBalance = async () => {
  try {
    const response = await apiGet('/recharges/system/balance');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Erreur lors de la récupération du solde système',
    };
  }
};
