import api from './api';

export interface TournamentData {
    name: string;
    description: string;
    entry_fee_usd: number;
    prize_pool_usd: number;
    max_participants: number;
    start_date: string;
    end_date: string;
    game_mode: string;
    rules: string;
}

export const getTournaments = async () => {
    try {
        const response = await api.get('/tournaments');
        return response;
    } catch (error: any) {
        console.error('Erreur lors de la récupération des tournois:', error);
        return { success: false, error: 'Erreur lors de la récupération des tournois' };
    }
};

export const createTournament = async (tournamentData: TournamentData) => {
    try {
        const response = await api.post('/tournaments', tournamentData);
        return response;
    } catch (error: any) {
        console.error('Erreur lors de la création du tournoi:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Erreur lors de la création du tournoi'
        };
    }
};

export const updateTournamentStatus = async (id: number, status: string) => {
    try {
        const response = await api.patch(`/tournaments/${id}/status`, { status });
        return response;
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return { success: false, error: 'Erreur lors de la mise à jour du statut' };
    }
};
export const deleteTournament = async (id: number) => {
    try {
        const response = await api.delete(`/tournaments/${id}`);
        return response;
    } catch (error: any) {
        console.error('Erreur lors de la suppression du tournoi:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Erreur lors de la suppression du tournoi'
        };
    }
};

export const getTournamentLeaderboard = async (id: number) => {
    try {
        const response = await api.get(`/tournaments/${id}/leaderboard`);
        return response;
    } catch (error: any) {
        console.error('Erreur lors de la récupération du classement:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Erreur lors de la récupération du classement'
        };
    }
};
