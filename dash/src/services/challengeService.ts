// =============================================
// Challenge Service
// File: dash/src/services/challengeService.ts
// =============================================

import { apiGet, apiPost, apiDelete } from './api';

export interface ChallengeTemplate {
    id: number;
    title: string;
    description: string;
    entry_fee_usd: number;
    prize_usd: number;
    target_score: number;
    time_limit_seconds: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    is_active: boolean;
    created_at: string;
}

// GET /api/challenge-templates - Récupérer tous les templates
export const getChallengeTemplates = async () => {
    try {
        const response = await apiGet('/challenge-templates');
        return {
            success: true,
            data: response.data as ChallengeTemplate[],
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des templates',
        };
    }
};

// POST /api/challenge-templates - Créer un template
export const createChallengeTemplate = async (data: any) => {
    try {
        const response = await apiPost('/challenge-templates', data);
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la création du template',
        };
    }
};

// DELETE /api/challenge-templates/:id - Supprimer un template
export const deleteChallengeTemplate = async (id: number) => {
    try {
        const response = await apiDelete(`/challenge-templates/${id}`);
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la suppression du template',
        };
    }
};
// GET /api/challenges - Récupérer tous les défis PvP
export const getPvpChallenges = async () => {
    try {
        const response = await apiGet('/challenges');
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des défis PvP',
        };
    }
};

// GET /api/challenges/stats - Récupérer les stats des défis
export const getChallengeStats = async () => {
    try {
        const response = await apiGet('/challenges/stats');
        return {
            success: true,
            data: response.data,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération des statistiques',
        };
    }
};
