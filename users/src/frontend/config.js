// Configuration de l'API pour le Frontend Blacksnack

const config = {
  // URL du Backend API
  API_URL: 'http://localhost:5000/api',
  
  // Token de stockage
  TOKEN_KEY: 'blacksnack_token',
  
  // Taux de change
  EXCHANGE_RATE: 2500, // 1 USD = 2500 CDF
  
  // Configuration du jeu
  GAME: {
    GRID_SIZE: 20,
    SPEEDS: {
      SLOW: { label: 'Lent', speed: 200, multiplier: 0.8 },
      NORMAL: { label: 'Normal', speed: 150, multiplier: 1.0 },
      FAST: { label: 'Rapide', speed: 100, multiplier: 1.2 },
      EXTREME: { label: 'Extrême', speed: 50, multiplier: 1.5 }
    }
  }
};

export default config;
