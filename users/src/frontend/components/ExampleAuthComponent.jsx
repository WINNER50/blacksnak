import React, { useState } from 'react';
import apiService from '../services/api';

/**
 * Exemple de composant d'authentification utilisant l'API
 * Ce composant montre comment intégrer les appels API dans votre frontend
 */
export default function ExampleAuthComponent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Appel API pour la connexion
      const response = await apiService.login(username, password);
      setSuccess(`Connexion réussie ! Bienvenue ${response.user.username}`);
      console.log('Utilisateur connecté:', response.user);
      
      // Vous pouvez maintenant rediriger ou mettre à jour l'état global
      // Par exemple: navigate('/dashboard') ou setUser(response.user)
      
    } catch (err) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Appel API pour l'inscription
      const response = await apiService.register(username, phone, password);
      setSuccess(`Inscription réussie ! Bienvenue ${response.user.username}`);
      console.log('Utilisateur créé:', response.user);
      
    } catch (err) {
      setError(err.message || 'Erreur d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-900 rounded-lg border border-purple-700">
      <h2 className="text-white text-2xl font-bold mb-6 text-center">
        {isLogin ? 'Connexion' : 'Inscription'}
      </h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-500 p-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
        <div>
          <label className="text-purple-400 text-sm mb-2 block">Nom d'utilisateur</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none"
            required
          />
        </div>

        {!isLogin && (
          <div>
            <label className="text-purple-400 text-sm mb-2 block">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none"
              required
            />
          </div>
        )}

        <div>
          <label className="text-purple-400 text-sm mb-2 block">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="w-full mt-4 text-purple-400 hover:text-purple-300 text-sm"
      >
        {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
      </button>
    </div>
  );
}
