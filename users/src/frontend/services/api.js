import config from '../config';

class ApiService {
  constructor() {
    this.baseURL = config.API_URL;
    this.tokenKey = config.TOKEN_KEY;
  }

  // Obtenir le token depuis le localStorage
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Sauvegarder le token
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Supprimer le token
  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  // Requête générique avec gestion des erreurs
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Gérer les erreurs de statut HTTP
      if (!response.ok) {
        let errorMessage = 'Une erreur est survenue';

        try {
          const data = await response.json();
          errorMessage = data.error || data.message || errorMessage;
        } catch (e) {
          // Si le corps n'est pas du JSON (ex: erreur 500 brute)
          if (response.status === 500) {
            errorMessage = 'Le serveur rencontre un problème technique. Veuillez réessayer plus tard.';
          } else if (response.status === 404) {
            errorMessage = 'Service momentanément indisponible.';
          } else if (response.status === 401) {
            errorMessage = 'Session expirée ou accès non autorisé.';
          }
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      // Gérer les erreurs de réseau (Failed to fetch)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
      }
      throw error;
    }
  }

  // === AUTHENTIFICATION ===

  async register(name, username, phone, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, phone, password }),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async forgotPassword(phone) {
    return await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyResetCode(username, code) {
    return await this.request('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ username, code }),
    });
  }

  async resetPassword(username, newPassword, code) {
    return await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ username, newPassword, code }),
    });
  }

  logout() {
    this.removeToken();
  }

  // === UTILISATEURS ===

  async getProfile() {
    return await this.request('/users/me');
  }

  async getSettings() {
    return await this.request('/users/settings');
  }

  async updateSettings(settings) {
    return await this.request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getEarnings() {
    return await this.request('/users/earnings');
  }

  // === TRANSACTIONS ===

  async createTransaction(transactionData) {
    return await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async getTransactions() {
    return await this.request('/transactions');
  }

  async getPaymentMethods() {
    return await this.request('/transactions/methods');
  }

  // === TOURNOIS ===

  async getTournaments() {
    return await this.request('/tournaments');
  }

  async getTournament(id) {
    return await this.request(`/tournaments/${id}`);
  }

  async joinTournament(id, currency) {
    return await this.request(`/tournaments/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ currency }),
    });
  }

  async updateTournamentScore(id, score) {
    return await this.request(`/tournaments/${id}/score`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  }

  // === DÉFIS ===

  async createChallenge(prize) {
    return await this.request('/challenges', {
      method: 'POST',
      body: JSON.stringify({ prize }),
    });
  }

  async getChallenges() {
    // Retourne l'historique personnel
    return await this.request('/challenges/my-challenges');
  }

  async getPendingChallenges() {
    // Retourne les défis PvP en attente (Marketplace)
    return await this.request('/challenges');
  }

  async getChallengeTemplates() {
    // Retourne les modèles de défis solo (Admin)
    return await this.request('/challenges/templates');
  }

  async getChallengeTemplateLeaderboard(id) {
    return await this.request(`/challenges/templates/${id}/leaderboard`);
  }

  async acceptChallenge(id) {
    return await this.request(`/challenges/${id}/accept`, {
      method: 'POST',
    });
  }

  async submitChallengeScore(id, score) {
    return await this.request(`/challenges/${id}/score`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  }

  // === DÉFIS SOLO ===

  async startSoloChallenge(templateId, multiplier) {
    return await this.request('/challenges/solo', {
      method: 'POST',
      body: JSON.stringify({ templateId, multiplier }),
    });
  }

  async submitSoloChallengeScore(id, score) {
    return await this.request(`/challenges/solo/${id}/score`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  }
}

// Export une instance unique (Singleton)
const apiService = new ApiService();
export default apiService;
