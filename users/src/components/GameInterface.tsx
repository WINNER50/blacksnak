import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import SnakeGame from './game/SnakeGame';
import Sidebar from './menu/Sidebar';
import Profile from './menu/Profile';
import Wallet from './menu/Wallet';
import Tournaments from './menu/Tournaments';
import Challenges from './menu/Challenges';
import Others from './menu/Others';
import apiService from '../frontend/services/api';

interface GameInterfaceProps {
  user: any;
  onLogout: () => void;
}

export default function GameInterface({ user, onLogout }: GameInterfaceProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'game' | 'profile' | 'wallet' | 'tournaments' | 'challenges' | 'others'>('game');
  const [userData, setUserData] = useState(user);
  const [hasPaymentMethods, setHasPaymentMethods] = useState(true);

  const updateUser = async () => {
    try {
      const profile = await apiService.getProfile();
      setUserData(profile);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
    }
  };

  const checkPaymentMethods = async () => {
    try {
      const methods = await apiService.getPaymentMethods();
      setHasPaymentMethods(methods && methods.length > 0);
    } catch (err) {
      setHasPaymentMethods(false);
    }
  };

  useEffect(() => {
    checkPaymentMethods();
    const interval = setInterval(() => {
      updateUser();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuSelect = (view: string) => {
    setCurrentView(view as any);
    setMenuOpen(false);
  };

  const balance = parseFloat(userData?.balance_usd ?? 0).toFixed(2);
  const avatarUrl = userData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.username}`;

  return (
    <div className="min-h-screen bg-black text-white relative flex overflow-hidden">
      {/* Sidebar - Desktop & Tablet */}
      <Sidebar
        isOpen={menuOpen}
        currentView={currentView}
        onSelect={handleMenuSelect}
        onClose={() => setMenuOpen(false)}
        hasPaymentMethods={hasPaymentMethods}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 relative flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden px-3 py-2 border-b border-purple-700 flex items-center justify-between shrink-0 bg-black/80 backdrop-blur-md z-30">
          {/* Infos utilisateur */}
          <div className="flex items-center gap-2">
            <img
              src={avatarUrl}
              alt={userData?.username || 'Avatar'}
              className="w-8 h-8 rounded-full border-2 border-purple-500 object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.username}`;
              }}
            />
            <div className="leading-tight">
              <p className="text-white text-xs font-semibold">{userData?.username || '...'}</p>
              <p className="text-purple-400 text-xs">{balance} $</p>
            </div>
          </div>

          {/* Bouton menu hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-white hover:bg-zinc-800 rounded-lg transition"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Dynamic View Component */}
        <div className="flex-1 overflow-y-auto scrollbar-hide relative">
          {currentView === 'game' && (
            <SnakeGame
              user={userData}
              updateUser={updateUser}
            />
          )}
          {currentView === 'profile' && <Profile user={userData} onUpdate={updateUser} />}
          {currentView === 'wallet' && <Wallet user={userData} onUpdate={updateUser} />}
          {currentView === 'tournaments' && <Tournaments user={userData} onUpdate={updateUser} onPlayTournament={() => setCurrentView('game')} />}
          {currentView === 'challenges' && <Challenges user={userData} onUpdate={updateUser} />}
          {currentView === 'others' && <Others user={userData} onLogout={onLogout} />}
        </div>
      </main>
    </div>
  );
}