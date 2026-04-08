import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import apiService from '../../frontend/services/api';

interface LoginProps {
  onLogin: (user: any) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export default function Login({ onLogin, onRegister, onForgotPassword }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiService.login(username, password);
      // Récupérer le profil complet après connexion
      const profile = await apiService.getProfile();
      onLogin(profile);
    } catch (err: any) {
      setError(err.message || 'Nom d\'utilisateur ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition"
          required
        />
      </div>

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>

      <div className="flex justify-between text-sm">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-purple-400 hover:text-purple-300 transition"
        >
          Mot de passe oublié ?
        </button>
        <button
          type="button"
          onClick={onRegister}
          className="text-blue-400 hover:text-blue-300 transition"
        >
          Créer un compte
        </button>
      </div>
    </form>
  );
}
