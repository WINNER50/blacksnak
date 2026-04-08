import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, X } from 'lucide-react-native';
import tw from 'twrnc';
import Sidebar from './menu/Sidebar';
import Wallet from './menu/Wallet';
import Profile from './menu/Profile';
import Tournaments from './menu/Tournaments';
import Challenges from './menu/Challenges';
import Others from './menu/Others';
import SnakeGame from './game/SnakeGame';
import apiService from '../../src/services/api';

interface GameInterfaceProps {
  user: any;
  onLogout: () => void;
}

export default function GameInterface({ user, onLogout }: GameInterfaceProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'game' | 'profile' | 'wallet' | 'tournaments' | 'challenges' | 'others'>('game');
  const [userData, setUserData] = useState(user);
  const [hasPaymentMethods, setHasPaymentMethods] = useState(true);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

  const handleTournamentComplete = async (score: number) => {
    if (activeTournamentId) {
      try {
        await apiService.updateTournamentScore(activeTournamentId, score);
        setActiveTournamentId(null);
        setCurrentView('tournaments');
        updateUser();
      } catch (e) {
        console.error('Erreur submission score tournoi', e);
      }
    }
  };

  const updateUser = async () => {
    try {
      const profile = await apiService.getProfile();
      setUserData(profile);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
    }
  };

  useEffect(() => {
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
  const avatarUrl = userData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${userData?.username}`;

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      {/* Mobile Header */}
      <View style={tw`flex-row items-center justify-between px-4 py-3 border-b border-purple-800 bg-black/90`}>
        {/* Infos utilisateur */}
        <View style={tw`flex-row items-center gap-3`}>
          <Image
            source={{ uri: avatarUrl }}
            style={tw`w-10 h-10 rounded-full border-2 border-purple-500`}
          />
          <View>
            <Text style={tw`text-white text-sm font-semibold`}>{userData?.username || '...'}</Text>
            <Text style={tw`text-purple-400 text-sm font-bold`}>{balance} $</Text>
          </View>
        </View>

        {/* Bouton menu hamburger */}
        <TouchableOpacity
          onPress={() => setMenuOpen(!menuOpen)}
          style={tw`p-2 bg-zinc-900 rounded-lg`}
          activeOpacity={0.7}
        >
           <Menu size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Dynamic View Component */}
      <View style={tw`flex-1`}>
        {currentView === 'game' && <SnakeGame user={userData} updateUser={updateUser} tournamentId={activeTournamentId || undefined} onTournamentComplete={handleTournamentComplete} />}
        {currentView === 'profile' && <Profile user={userData} onUpdate={updateUser} />}
        {currentView === 'wallet' && <Wallet user={userData} onUpdate={updateUser} />}
        {currentView === 'tournaments' && <Tournaments user={userData} onUpdate={updateUser} onPlayTournament={(id) => { setActiveTournamentId(id); setCurrentView('game'); }} />}
        {currentView === 'challenges' && <Challenges user={userData} onUpdate={updateUser} />}
        {currentView === 'others' && <Others user={userData} onLogout={onLogout} />}
      </View>

      {/* Sidebar Overlay (Rendered last to show on top) */}
      <Sidebar
        isOpen={menuOpen}
        currentView={currentView}
        onSelect={handleMenuSelect}
        onClose={() => setMenuOpen(false)}
        hasPaymentMethods={hasPaymentMethods}
      />
    </SafeAreaView>
  );
}
