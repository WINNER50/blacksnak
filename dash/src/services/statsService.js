// =============================================
// Stats Service
// File: frontend/src/services/statsService.js
// =============================================

import { apiGet } from './api';

// GET /api/stats/global - Statistiques globales
export const getGlobalStats = async () => {
    try {
        const response = await apiGet('/stats/global');
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des statistiques globales',
        };
    }
};

// GET /api/stats/recent-transactions - Transactions récentes
export const getRecentTransactions = async () => {
    try {
        const response = await apiGet('/stats/recent-transactions');
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des transactions',
        };
    }
};

// GET /api/stats/recent-users - Derniers inscrits
export const getRecentUsers = async () => {
    try {
        const response = await apiGet('/stats/recent-users');
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des inscrits',
        };
    }
};
// GET /api/stats/revenue-7days - Revenus des 7 derniers jours
export const getRevenue7Days = async () => {
    try {
        const response = await apiGet('/stats/revenue-7days');
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des revenus',
        };
    }
};

// GET /api/stats/revenue-30days - Revenus des 30 derniers jours
export const getRevenue30Days = async () => {
    try {
        const response = await apiGet('/stats/revenue-30days');
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des revenus 30 jours',
        };
    }
};
// GET /api/stats/advanced - Statistiques avancées
export const getAdvancedStats = async () => {
    try {
        const response = await apiGet('/stats/advanced');
        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des statistiques avancées',
        };
    }
};
