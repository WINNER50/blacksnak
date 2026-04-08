// =============================================
// Withdrawal Service
// File: dash/src/services/withdrawalService.ts
// =============================================

import { apiGet, apiPost } from './api';

export interface Withdrawal {
    id: number;
    user_id: number;
    player_name: string;
    amount_usd: number | null;
    amount_cdf: number | null;
    currency: 'USD' | 'CDF';
    reason: string;
    admin_name: string;
    balance_before_usd: number;
    balance_after_usd: number;
    created_at: string;
}

// POST /api/withdrawals - Effectuer un retrait pour un joueur
export const withdrawPlayer = async (data: { userId: number, amount: number, currency: string, reason: string, method?: string, phone?: string, network?: string }) => {
    try {
        const response = await apiPost('/withdrawals', data);
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erreur lors du retrait',
        };
    }
};

// GET /api/withdrawals - Historique des retraits joueurs
export const getWithdrawalHistory = async (params: { page?: number, limit?: number, userId?: number } = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.userId) queryParams.append('userId', params.userId.toString());

        const response = await apiGet(`/withdrawals?${queryParams.toString()}`);
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération de l\'historique',
        };
    }
};

// Réutiliser systemOperation de rechargeService ou en créer un ici ? 
// Je vais en créer un spécifique pour la clarté
export const withdrawSystem = async (data: { amount: number, reason: string, paymentMethod?: string, paymentReference?: string, phone?: string, network?: string }) => {
    try {
        const response = await apiPost('/recharges/system', {
            type: 'debit',
            ...data
        });
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erreur lors du retrait système',
        };
    }
};
