import React, { useState, useEffect } from 'react';
import { Trophy, Users, Clock, DollarSign } from 'lucide-react';
import TournamentPlay from './TournamentPlay';
import apiService from '../../frontend/services/api';

interface TournamentsProps {
  user: any;
  onUpdate: () => void;
  onPlayTournament: (tournamentId: string) => void;
}

export default function Tournaments({ user, onUpdate, onPlayTournament }: TournamentsProps) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CDF'>('USD');
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<any>(null);
  const [playingTournament, setPlayingTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const EXCHANGE_RATE = 2500;

  const loadTournaments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiService.getTournaments();
      setTournaments(data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des tournois:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
    const interval = setInterval(() => {
      // Uniquement si pas de modal ouverte pour éviter les rafraîchissements gênants
      if (!showPaymentModal && !showLeaderboardModal && !playingTournament) {
        loadTournaments(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [showPaymentModal, showLeaderboardModal, playingTournament]);

  const handleJoinTournament = async (tournament: any, currency: 'USD' | 'CDF') => {
    try {
      await apiService.joinTournament(tournament.id, currency);
      onUpdate();
      await loadTournaments();
      setShowPaymentModal(null);
      alert(`Inscription réussie au tournoi "${tournament.name}" !`);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'inscription au tournoi');
    }
  };

  const handleShowLeaderboard = async (tournament: any) => {
    setShowLeaderboardModal(tournament);
    setLoadingLeaderboard(true);
    try {
      const data = await apiService.getTournament(tournament.id);
      if (data.success) {
        setShowLeaderboardModal(data.data);
      }
    } catch (err) {
      console.error('Erreur chargement classement:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Si on joue à un tournoi, afficher l'interface de jeu
  if (playingTournament) {
    return (
      <TournamentPlay
        user={user}
        onUpdate={onUpdate}
        tournament={playingTournament}
        onBack={() => setPlayingTournament(null)}
      />
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-black via-purple-950 to-black p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8">Tournois</h1>

        {/* Liste des tournois */}
        <div className="grid gap-6 mb-8">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-zinc-900 rounded-lg border border-purple-700 p-6 hover:border-purple-500 transition cursor-pointer"
              onClick={() => handleShowLeaderboard(tournament)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-3 rounded-full">
                    <Trophy className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold">{tournament.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${tournament.status === 'active'
                      ? 'bg-green-500/20 text-green-500'
                      : tournament.status === 'finished'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-blue-500/20 text-blue-500'
                      }`}>
                      {tournament.status === 'active' ? 'En cours' : tournament.status === 'finished' ? '✓ Terminé' : 'À venir'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-purple-400 text-sm">Prix</p>
                  <p className="text-white text-2xl font-bold">{tournament.prize} $</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <DollarSign size={18} />
                  <div>
                    <p className="text-xs">Entrée</p>
                    <p className="text-white font-semibold">{tournament.entryFee} $ / {tournament.entryFee * EXCHANGE_RATE} CDF</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Users size={18} />
                  <div>
                    <p className="text-xs">Joueurs</p>
                    <p className="text-white font-semibold">{tournament.currentPlayers}/{tournament.maxPlayers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock size={18} />
                  <div>
                    <p className="text-xs">{tournament.status === 'active' ? 'Fin' : 'Début'}</p>
                    <p className="text-white font-semibold text-sm">
                      {new Date(tournament.endDate || tournament.startDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {tournament.status === 'upcoming' && (
                <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-3 mb-4">
                  <p className="text-blue-400 text-sm">🚧 En élaboration - Inscription bientôt disponible</p>
                </div>
              )}

              {tournament.status === 'finished' && tournament.winner && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3 mb-4">
                  <p className="text-yellow-400 text-sm font-semibold">🏆 Gagnant : {tournament.winner}</p>
                  <p className="text-yellow-300 text-xs mt-1">Cliquez pour voir le classement complet</p>
                </div>
              )}

              {tournament.status === 'active' && tournament.isParticipating && (
                <div className="bg-green-500/10 border border-green-500 rounded-lg p-3 mb-4">
                  <p className="text-green-400 text-sm font-semibold">✓ Vous participez à ce tournoi !</p>
                  <p className="text-green-300 text-xs mt-1">Donnez le meilleur de vous-même pour gagner !</p>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (tournament.status === 'active') {
                    if (tournament.isParticipating) {
                      // Lancer le jeu en mode tournoi directement
                      setPlayingTournament(tournament);
                    } else {
                      // Afficher la modal de paiement pour rejoindre
                      setShowPaymentModal(tournament);
                      setSelectedCurrency('USD');
                    }
                  } else if (tournament.status === 'finished' || tournament.status === 'completed') {
                    // Cliquer sur terminé ouvre le classement
                    handleShowLeaderboard(tournament);
                  } else {
                    alert('Ce tournoi n\'est pas encore ouvert aux inscriptions');
                  }
                }}
                disabled={tournament.status === 'upcoming'}
                className={`w-full font-semibold py-3 rounded-lg transition-all ${tournament.status === 'finished'
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900 text-white'
                  : tournament.status === 'active'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white'
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  }`}
              >
                {tournament.status === 'active'
                  ? tournament.isParticipating
                    ? '🎮 Jouer'
                    : 'Rejoindre'
                  : tournament.status === 'finished'
                    ? 'Voir le classement'
                    : 'À venir'}
              </button>
            </div>
          ))}
        </div>

        {/* Modal de paiement */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-lg border border-purple-700 p-6 max-w-md w-full">
              <h3 className="text-white text-2xl font-bold mb-4">
                Rejoindre le tournoi
              </h3>
              <p className="text-zinc-400 mb-6">
                {showPaymentModal.name}
              </p>

              <div className="bg-zinc-800 rounded-lg p-4 mb-6">
                <p className="text-purple-400 text-sm mb-3 text-center">
                  Choisir la devise de paiement
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedCurrency('USD')}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold transition-all ${selectedCurrency === 'USD'
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                  >
                    <DollarSign className="inline mb-1" size={16} />
                    <br />
                    {showPaymentModal.entryFee} USD
                  </button>
                  <button
                    onClick={() => setSelectedCurrency('CDF')}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold transition-all ${selectedCurrency === 'CDF'
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                  >
                    <span className="text-lg">FC</span>
                    <br />
                    {showPaymentModal.entryFee * EXCHANGE_RATE} CDF
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleJoinTournament(showPaymentModal, selectedCurrency)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Payer et Rejoindre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Classement détaillé */}
        {showLeaderboardModal && showLeaderboardModal.leaderboard.length > 0 && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-lg border border-purple-700 p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-2xl font-bold">
                  Classement - {showLeaderboardModal.name}
                </h2>
                {showLeaderboardModal.status === 'finished' && (
                  <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ Terminé
                  </span>
                )}
                {showLeaderboardModal.status === 'active' && (
                  <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-semibold">
                    En cours
                  </span>
                )}
              </div>

              {loadingLeaderboard ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-500">Chargement du classement...</p>
                </div>
              ) : showLeaderboardModal.leaderboard && showLeaderboardModal.leaderboard.length > 0 ? (
                <>
                  <div className="space-y-3 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                      .space-y-3::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    {showLeaderboardModal.leaderboard.map((player: any, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center gap-4 p-4 rounded-lg ${index === 0 ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border-2 border-yellow-600' :
                          index === 1 ? 'bg-gradient-to-r from-zinc-400/20 to-zinc-600/20 border-2 border-zinc-400' :
                            index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-orange-800/20 border-2 border-orange-600' :
                              player.username === user.username ? 'bg-purple-600/20 border-2 border-purple-500' :
                                'bg-zinc-800'
                          }`}
                      >
                        <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-zinc-400' :
                            index === 2 ? 'text-orange-500' :
                              player.username === user.username ? 'text-purple-400' :
                                'text-white'
                          }`}>
                          #{index + 1}
                        </div>
                        <img
                          src={player.avatar || 'https://via.placeholder.com/150'}
                          alt={player.username}
                          className={`w-12 h-12 rounded-full ${index === 0 ? 'border-4 border-yellow-500' :
                            index === 1 ? 'border-4 border-zinc-400' :
                              index === 2 ? 'border-4 border-orange-500' :
                                player.username === user.username ? 'border-4 border-purple-500' :
                                  'border-2 border-purple-500'
                            }`}
                        />
                        <div className="flex-1">
                          <p className="text-white font-semibold">
                            {player.username}
                            {player.username === user.username && <span className="text-purple-400 ml-2">(Vous)</span>}
                          </p>
                          <p className="text-zinc-400 text-sm">Score: {player.score}</p>
                        </div>
                        {player.prize && player.prize > 0 && (
                          <div className="text-right">
                            <p className={`font-bold text-lg ${index === 0 ? 'text-yellow-400' :
                              index === 1 ? 'text-zinc-300' :
                                'text-orange-400'
                              }`}>
                              +{player.prize} $
                            </p>
                            <p className="text-xs text-zinc-400">Gain</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-zinc-500 text-lg">Aucun participant pour le moment</p>
                  <p className="text-zinc-600 text-sm mt-2">Soyez le premier à rejoindre ce tournoi !</p>
                </div>
              )}
              <button
                onClick={() => setShowLeaderboardModal(null)}
                className="mt-6 w-full font-semibold py-3 rounded-lg transition-all bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {showLeaderboardModal && showLeaderboardModal.leaderboard.length === 0 && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-lg border border-purple-700 p-6 max-w-md w-full">
              <h2 className="text-white text-2xl font-bold mb-4">
                {showLeaderboardModal.name}
              </h2>
              <p className="text-zinc-400 text-center py-8">
                Aucun participant pour le moment
              </p>
              <button
                onClick={() => setShowLeaderboardModal(null)}
                className="w-full font-semibold py-3 rounded-lg transition-all bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}