/**
 * Script de test pour l'API Blacksnack
 * Exécuter avec: node test-api.js
 */

const API_URL = 'http://localhost:5000/api';
let authToken = '';

// Fonction utilitaire pour faire des requêtes
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur');
    }

    return data;
  } catch (error) {
    console.error(`❌ Erreur sur ${endpoint}:`, error.message);
    throw error;
  }
}

// Tests
async function runTests() {
  console.log('🧪 Début des tests API Blacksnack\n');

  try {
    // Test 1 : Santé du serveur
    console.log('1️⃣ Test de santé du serveur...');
    const health = await fetch('http://localhost:5000/health');
    const healthData = await health.json();
    console.log('✅ Serveur en ligne:', healthData);
    console.log('');

    // Test 2 : Inscription
    console.log('2️⃣ Test d\'inscription...');
    const registerData = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: `testuser${Date.now()}`,
        phone: `+2439${Math.floor(Math.random() * 100000000)}`,
        password: 'Test123456'
      }),
    });
    authToken = registerData.token;
    console.log('✅ Inscription réussie:', registerData.user.username);
    console.log('Token:', authToken.substring(0, 20) + '...');
    console.log('');

    // Test 3 : Profil utilisateur
    console.log('3️⃣ Test de récupération du profil...');
    const profile = await request('/users/me');
    console.log('✅ Profil récupéré:', profile.username, '- Solde:', profile.balance + '$');
    console.log('');

    // Test 4 : Liste des tournois
    console.log('4️⃣ Test de récupération des tournois...');
    const tournaments = await request('/tournaments');
    console.log(`✅ ${tournaments.length} tournois trouvés`);
    if (tournaments.length > 0) {
      console.log('Premier tournoi:', tournaments[0].name);
    }
    console.log('');

    // Test 5 : Créer une transaction
    console.log('5️⃣ Test de création de transaction...');
    const transaction = await request('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'deposit',
        amount: 100,
        currency: 'USD',
        method: 'mobile',
        network: 'vodacom',
        phone: '+243971234567'
      }),
    });
    console.log('✅ Transaction créée:', transaction.message);
    console.log('');

    // Test 6 : Vérifier le nouveau solde
    console.log('6️⃣ Test de vérification du solde...');
    const updatedProfile = await request('/users/me');
    console.log('✅ Nouveau solde:', updatedProfile.balance + '$');
    console.log('');

    // Test 7 : Créer un défi
    console.log('7️⃣ Test de création de défi...');
    const challenge = await request('/challenges', {
      method: 'POST',
      body: JSON.stringify({
        prize: 50
      }),
    });
    console.log('✅ Défi créé avec succès');
    console.log('');

    // Test 8 : Liste des défis
    console.log('8️⃣ Test de récupération des défis...');
    const challenges = await request('/challenges');
    console.log(`✅ ${challenges.length} défis disponibles`);
    console.log('');

    console.log('🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('💥 Échec des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
runTests();
