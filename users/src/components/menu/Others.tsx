import React, { useState } from 'react';
import { MessageCircle, History, LogOut, Info, BookOpen, ChevronDown, ChevronUp, Settings, Zap } from 'lucide-react';
import UserGuide from './UserGuide';

interface OthersProps {
  user: any;
  onLogout: () => void;
}

const SPEED_OPTIONS = [
  { label: 'Lent', speed: 250, multiplier: 0.5, color: 'text-blue-400', bgColor: 'bg-blue-500' },
  { label: 'Normal', speed: 150, multiplier: 1.0, color: 'text-green-400', bgColor: 'bg-green-500' },
  { label: 'Rapide', speed: 100, multiplier: 1.5, color: 'text-orange-400', bgColor: 'bg-orange-500' },
  { label: 'Très Rapide', speed: 75, multiplier: 2.0, color: 'text-red-400', bgColor: 'bg-red-500' }
];

export default function Others({ user, onLogout }: OthersProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(() => {
    const saved = localStorage.getItem('blacksnack_speed_config');
    return saved ? JSON.parse(saved) : SPEED_OPTIONS[1]; // Normal par défaut
  });
  
  const handleWhatsAppGroup = () => {
    // Simuler l'ouverture du groupe WhatsApp
    const groupUrl = 'https://chat.whatsapp.com/example'; // URL fictive
    alert('Ouverture du groupe WhatsApp Blacksnack...\n\nDans une vraie app, cela ouvrirait WhatsApp.');
    // window.open(groupUrl, '_blank');
  };

  const earnings = JSON.parse(localStorage.getItem(`blacksnack_transactions_${user.id}`) || '[]')
    .filter((t: any) => t.type === 'deposit');

  const challengeEarnings = JSON.parse(localStorage.getItem(`blacksnack_challenge_history_${user.id}`) || '[]')
    .filter((c: any) => c.success);

  const [showMore, setShowMore] = useState(false);

  const handleSpeedChange = (speed: any) => {
    setSelectedSpeed(speed);
    localStorage.setItem('blacksnack_speed_config', JSON.stringify(speed));
    alert(`✅ Vitesse configurée sur "${speed.label}"\n\nMultiplicateur de gains : ×${speed.multiplier}\n\nLes nouveaux défis utiliseront cette vitesse.`);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-black via-purple-950 to-black p-2 sm:p-4 md:p-6">
      {showGuide && <UserGuide onClose={() => setShowGuide(false)} />}
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Autres</h1>

        {/* Menu Options */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          <button
            onClick={() => setShowGuide(true)}
            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-purple-700 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition group"
          >
            <div className="bg-blue-500 p-2 sm:p-3 rounded-full group-hover:scale-110 transition">
              <BookOpen className="text-white" size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-semibold text-base sm:text-lg">Guide du débutant</h3>
              <p className="text-zinc-400 text-xs sm:text-sm">Apprenez comment jouer à Blacksnack</p>
            </div>
          </button>

          <button
            onClick={handleWhatsAppGroup}
            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-purple-700 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition group"
          >
            <div className="bg-green-500 p-2 sm:p-3 rounded-full group-hover:scale-110 transition">
              <MessageCircle className="text-white" size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-semibold text-base sm:text-lg">Groupe WhatsApp</h3>
              <p className="text-zinc-400 text-xs sm:text-sm">Rejoindre la communauté Blacksnack</p>
            </div>
          </button>

          <div className="w-full bg-zinc-900 border border-purple-700 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-blue-500 p-2 sm:p-3 rounded-full">
                <History className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-base sm:text-lg">Historique des revenus</h3>
                <p className="text-zinc-400 text-xs sm:text-sm">Vos gains et transactions</p>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-zinc-800 rounded-lg p-3 sm:p-4">
                <p className="text-purple-400 text-xs sm:text-sm mb-1">Revenus totaux</p>
                <p className="text-white text-xl sm:text-2xl font-bold">{user.totalEarnings || 0} $</p>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 sm:p-4">
                <p className="text-purple-400 text-xs sm:text-sm mb-1">Défis gagnés</p>
                <p className="text-white text-xl sm:text-2xl font-bold">{challengeEarnings.length}</p>
              </div>
            </div>

            {/* Historique récent */}
            <div className="space-y-2">
              <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Transactions récentes</h4>
              {earnings.length === 0 && challengeEarnings.length === 0 ? (
                <p className="text-zinc-500 text-xs sm:text-sm text-center py-3 sm:py-4">Aucune transaction</p>
              ) : (
                <>
                  {challengeEarnings.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="bg-zinc-800 rounded-lg p-2 sm:p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white text-xs sm:text-sm font-medium">Défi réussi</p>
                        <p className="text-zinc-400 text-xs">
                          {new Date(item.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="text-green-500 font-semibold text-xs sm:text-sm">+{item.earnings} $</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="w-full bg-zinc-900 border border-purple-700 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-purple-500 p-2 sm:p-3 rounded-full">
                <Info className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-base sm:text-lg">À propos</h3>
                <p className="text-zinc-400 text-xs sm:text-sm mb-2 sm:mb-3">Version 1.0 - Blacksnack</p>
                <p className="text-zinc-500 text-xs">
                  Blacksnack est une plateforme de jeu qui combine divertissement et compétition. 
                  Relevez des défis, participez à des tournois et gagnez des récompenses !
                </p>
              </div>
            </div>
          </div>

          {/* Configuration de vitesse */}
          <div className="w-full bg-gradient-to-br from-zinc-900 to-purple-900/20 border-2 border-yellow-500 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="bg-yellow-500 p-3 rounded-full">
                <Zap className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg sm:text-xl flex items-center gap-2">
                  Config <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">NOUVEAU</span>
                </h3>
                <p className="text-zinc-300 text-sm mt-1">Configuration de la vitesse du jeu</p>
              </div>
            </div>

            {/* Vitesse sélectionnée */}
            <div className="bg-zinc-800/80 rounded-lg p-4 mb-4 border border-purple-500/30">
              <p className="text-zinc-400 text-xs mb-2">Vitesse actuelle :</p>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${selectedSpeed.color}`}>
                  {selectedSpeed.label}
                </span>
                <span className="text-white font-semibold bg-purple-600 px-3 py-1 rounded-full text-sm">
                  ×{selectedSpeed.multiplier} gains
                </span>
              </div>
            </div>

            {/* Options de vitesse */}
            <div className="space-y-3">
              <p className="text-purple-300 text-sm font-semibold mb-3">Choisir une vitesse :</p>
              {SPEED_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleSpeedChange(option)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedSpeed.label === option.label
                      ? 'border-yellow-400 bg-yellow-500/10 scale-105'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-purple-500 hover:bg-zinc-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${option.bgColor} p-2 rounded-full`}>
                        <Zap className="text-white" size={20} />
                      </div>
                      <div className="text-left">
                        <p className={`font-bold text-base ${option.color}`}>{option.label}</p>
                        <p className="text-xs text-zinc-400">{option.speed}ms par mouvement</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">×{option.multiplier}</p>
                      <p className="text-xs text-zinc-400">gains</p>
                    </div>
                  </div>
                  {selectedSpeed.label === option.label && (
                    <div className="mt-2 pt-2 border-t border-yellow-500/30">
                      <p className="text-yellow-400 text-xs font-semibold">✓ Sélectionné</p>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Explication */}
            <div className="mt-4 bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
              <p className="text-purple-300 text-xs leading-relaxed">
                💡 <span className="font-semibold">Comment ça marche :</span><br />
                • Vitesse <span className="font-semibold">Lent</span> : Jeu plus facile, gains ×0.5 (20$ → 10$)<br />
                • Vitesse <span className="font-semibold">Normal</span> : Équilibre parfait, gains ×1.0 (20$ → 20$)<br />
                • Vitesse <span className="font-semibold">Rapide</span> : Plus de challenge, gains ×1.5 (20$ → 30$)<br />
                • Vitesse <span className="font-semibold">Très Rapide</span> : Défi extrême, gains ×2.0 (20$ → 40$)
              </p>
            </div>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
              onLogout();
            }
          }}
          className="w-full bg-red-900/20 hover:bg-red-900/30 border border-red-700 text-red-500 font-semibold py-3 sm:py-4 rounded-lg transition flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <LogOut size={18} className="sm:w-5 sm:h-5" />
          Se déconnecter
        </button>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-zinc-600 text-xs sm:text-sm">
            © 2026 Blacksnack. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}