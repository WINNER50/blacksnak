import React, { useState, useEffect } from 'react';
import AuthFlow from './components/AuthFlow';
import GameInterface from './components/GameInterface';
import apiService from './frontend/services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un utilisateur est connecté via l'API
    const checkAuth = async () => {
      const token = apiService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await apiService.getProfile();
        setCurrentUser(profile);
      } catch (err) {
        // Pas connecté ou erreur
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    apiService.logout();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-white mb-8 animate-pulse">Blacksnack</div>
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {!currentUser ? (
        <AuthFlow onLogin={handleLogin} />
      ) : (
        <GameInterface user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
