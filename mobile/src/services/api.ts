import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import config from '../config';

const api = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (axiosConfig) => {
    try {
      const token = await SecureStore.getItemAsync(config.TOKEN_KEY);
      if (token) {
        axiosConfig.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching token from SecureStore', e);
    }
    return axiosConfig;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est 401 et qu'on n'a pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync(config.REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response: any = await axios.post(`${config.API_URL}/auth/refresh`, { refreshToken });
          const newToken = response.data.token;
          if (newToken) {
            await SecureStore.setItemAsync(config.TOKEN_KEY, newToken);
            api.defaults.headers.Authorization = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        await SecureStore.deleteItemAsync(config.TOKEN_KEY);
        await SecureStore.deleteItemAsync(config.REFRESH_TOKEN_KEY);
      }
    }

    // Gestion des messages d'erreur pour l'utilisateur
    let message = 'Une erreur technique est survenue. Veuillez réessayer plus tard.';

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      if (status >= 500) {
        message = 'Le serveur est temporairement indisponible. Nos équipes s\'en occupent.';
      } else {
        message = responseData?.message || responseData?.error || message;
      }
    } else if (error.request) {
      message = 'Connexion impossible. Vérifiez votre accès internet.';
    }

    console.warn('[API ERROR]', {
      status: error.response?.status,
      originalMessage: error.response?.data?.error || error.message
    });

    const finalError: any = new Error(message);
    finalError.status = error.response?.status;
    finalError.isNetworkError = !error.response;

    return Promise.reject(finalError);
  }
);

class ApiService {
  async register(name: string, username: string, phone: string, password: string): Promise<any> {
    const data: any = await api.post('auth/register', { name, username, phone, password });
    if (data.token) {
      await SecureStore.setItemAsync(config.TOKEN_KEY, data.token);
    }
    if (data.refreshToken) {
      await SecureStore.setItemAsync(config.REFRESH_TOKEN_KEY, data.refreshToken);
    }
    if (data.user) {
      await SecureStore.setItemAsync(config.USER_KEY, JSON.stringify(data.user));
    }
    return data;
  }

  async login(username: string, password: string): Promise<any> {
    const data: any = await api.post('auth/login', { username, password });
    if (data.token) {
      await SecureStore.setItemAsync(config.TOKEN_KEY, data.token);
    }
    if (data.refreshToken) {
      await SecureStore.setItemAsync(config.REFRESH_TOKEN_KEY, data.refreshToken);
    }
    if (data.user) {
      await SecureStore.setItemAsync(config.USER_KEY, JSON.stringify(data.user));
    }
    return data;
  }

  async forgotPassword(phone: string): Promise<any> {
    return await api.post('auth/forgot-password', { phone });
  }

  async verifyResetCode(username: string, code: string): Promise<any> {
    return await api.post('auth/verify-reset-code', { username, code });
  }

  async resetPassword(username: string, newPassword: string, code: string): Promise<any> {
    return await api.post('auth/reset-password', { username, newPassword, code });
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(config.TOKEN_KEY);
    await SecureStore.deleteItemAsync(config.REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(config.USER_KEY);
  }

  async getProfile(): Promise<any> {
    try {
      const profile = await api.get('/users/me');
      if (profile) {
        await SecureStore.setItemAsync(config.USER_KEY, JSON.stringify(profile));
      }
      return profile;
    } catch (error) {
      // Si erreur, on essaie de charger le profil local
      const cached = await SecureStore.getItemAsync(config.USER_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  async getPaymentMethods(): Promise<any> {
    return await api.get('/transactions/methods');
  }

  async getTransactions(): Promise<any> {
    return await api.get('/transactions');
  }

  async createTransaction(data: any): Promise<any> {
    return await api.post('/transactions', data);
  }

  async updateSettings(data: any): Promise<any> {
    return await api.post('/users/settings', data);
  }

  // --- Tournois ---
  async getTournaments(): Promise<any> {
    return await api.get('tournaments');
  }

  async getTournament(id: string): Promise<any> {
    return await api.get(`/tournaments/${id}`);
  }

  async joinTournament(id: string, currency: string): Promise<any> {
    return await api.post(`/tournaments/${id}/join`, { currency });
  }

  async updateTournamentScore(id: string, score: number): Promise<any> {
    return await api.post(`/tournaments/${id}/score`, { score });
  }

  // --- Défis ---
  async getChallengeTemplates(): Promise<any> {
    return await api.get('/challenges/templates');
  }

  async getChallenges(): Promise<any> {
    return await api.get('/challenges/my-challenges');
  }

  async startSoloChallenge(templateId: string, speedMultiplier: number = 1.0): Promise<any> {
    return await api.post('/challenges/solo', { templateId, multiplier: speedMultiplier });
  }

  async submitSoloChallengeScore(id: string, score: number): Promise<any> {
    return await api.post(`/challenges/solo/${id}/score`, { score });
  }

  async getChallengeTemplateLeaderboard(templateId: string): Promise<any> {
    return await api.get(`/challenges/templates/${templateId}/leaderboard`);
  }

  async getAppSettings(): Promise<any> {
    return await api.get('settings');
  }
}

export default new ApiService();
