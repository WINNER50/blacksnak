import React, { useState, useEffect } from 'react';
import { Target, Timer, TrendingUp, Play, DollarSign, X, Loader2 } from 'lucide-react';
import ChallengeSnakeGame from './ChallengeSnakeGame';
import apiService from '../../frontend/services/api';

interface ChallengesProps {
  user: any;
  onUpdate: () => void;
}

export default function Challenges({ user, onUpdate }: ChallengesProps) {
  const [challengeOptions, setChallengeOptions] = useState<any[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CDF'>('USD');
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [challengeResult, setChallengeResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Taux de change (pour affichage CDF)
  const EXCHANGE_RATE = 2500;

  const [speedConfig, setSpeedConfig] = useState(() => {
    const saved = localStorage.getItem('blacksnack_speed_config');
    return saved ? JSON.parse(saved) : { label: 'Normal', speed: 150, multiplier: 1.0 };
  });

  // Recharger la vitesse quand on revient sur le composant (au cas où elle ait changé dans "Autres")
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('blacksnack_speed_config');
      if (saved) setSpeedConfig(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorageChange);
    // Aussi vérifier périodiquement
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadTemplates = async (silent = false) => {
    if (!silent) setLoadingTemplates(true);
    try {
      const data = await apiService.getChallengeTemplates();
      // Formater les données pour le composant
      const formatted = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        target: t.target_score,
        timeLimit: t.time_limit_seconds,
        basePotential: t.prize_usd,
        potential: (parseFloat(t.prize_usd) * speedConfig.multiplier).toFixed(2),
        entryFee: t.entry_fee_usd,
        difficulty: t.difficulty
      }));
      setChallengeOptions(formatted);
    } catch (err) {
      console.error('Erreur chargement templates:', err);
    } finally {
      if (!silent) setLoadingTemplates(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await apiService.getChallenges();
      setHistory(data || []); // my-challenges retournés directement en tant qu'array
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique des défis:', err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [speedConfig.multiplier]);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(() => {
      if (!activeChallenge && !challengeResult && !showGlobalLeaderboard) {
        loadTemplates(true);
        loadHistory();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChallenge, challengeResult, showGlobalLeaderboard]);

  const handleStartChallenge = async (template: any, currency: 'USD' | 'CDF') => {
    setLoading(true);
    try {
      // Envoyer le multiplicateur actuel au backend
      const data = await apiService.startSoloChallenge(template.id, speedConfig.multiplier);

      onUpdate(); // Mettre à jour le solde de l'utilisateur

      setActiveChallenge({
        ...template,
        id: data.challenge.id,
        startTime: Date.now(),
        currency: currency,
        potential: data.challenge.potential, // Utiliser le prix calculé par le back
        // On affiche le frais d'entrée converti si besoin, mais le débit est géré en USD côté back
        paidAmount: currency === 'USD' ? template.entryFee : template.entryFee * EXCHANGE_RATE
      });
      setSelectedAmount(null);
      setChallengeResult(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du démarrage du défi');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeComplete = async (finalScore: number) => {
    if (!activeChallenge) return;

    try {
      const data = await apiService.submitSoloChallengeScore(activeChallenge.id, finalScore);

      onUpdate();
      setChallengeResult({
        success: data.status === 'won',
        score: finalScore,
        target: activeChallenge.target,
        earnings: data.earnings,
        currency: activeChallenge.currency,
        paidAmount: activeChallenge.paidAmount
      });

      loadHistory();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la soumission du score');
    }

    setActiveChallenge(null);
  };

  const handleCancelChallenge = () => {
    setActiveChallenge(null);
    alert('Défi abandonné. La mise ne sera pas remboursée.');
    onUpdate();
  };

  const fetchGlobalLeaderboard = async (template: any) => {
    setShowGlobalLeaderboard(template);
    setLoadingLeaderboard(true);
    try {
      const data = await apiService.getChallengeTemplateLeaderboard(template.id);
      if (data.success) {
        setLeaderboardData(data.data);
      }
    } catch (err) {
      console.error('Erreur chargement classement défi:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-blue-400';
      case 'hard': return 'text-orange-400';
      case 'expert': return 'text-red-400';
      default: return 'text-purple-400';
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-black via-purple-950 to-black p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {!activeChallenge && !challengeResult && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-white text-3xl font-bold mb-2">Défis Personnels</h1>
                <p className="text-zinc-400">
                  Rélevez des défis solo et gagnez des récompenses instantanées !
                </p>
              </div>
              <div className="bg-zinc-900 border border-yellow-500/50 rounded-lg p-3 text-right">
                <p className="text-zinc-500 text-[10px] uppercase">Vitesse configurée</p>
                <p className="text-yellow-500 font-bold">{speedConfig.label} (x{speedConfig.multiplier})</p>
              </div>
            </div>

            {loadingTemplates ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                <p className="text-zinc-500">Chargement des défis...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challengeOptions.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`bg-zinc-900 rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${selectedAmount === challenge.id
                      ? 'border-purple-600 bg-purple-600/10 transform scale-105'
                      : 'border-zinc-800 hover:border-purple-500'
                      }`}
                    onClick={() => setSelectedAmount(challenge.id)}
                  >
                    <div className="p-6">
                      <div className={`p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 bg-zinc-800 ${getDifficultyColor(challenge.difficulty)}`}>
                        <Target size={24} />
                      </div>

                      <h3 className="text-white font-bold text-lg mb-1">{challenge.title}</h3>
                      <p className="text-zinc-400 text-xs mb-4 line-clamp-2">{challenge.description}</p>

                      <div className="text-center mb-4 py-2 bg-black/30 rounded-lg border border-white/5 relative">
                        <p className="text-purple-400 text-[10px] uppercase tracking-wider mb-1">Prix à gagner</p>
                        <p className="text-white text-2xl font-bold">{parseFloat(challenge.potential).toFixed(2)} $</p>
                        <p className="text-zinc-500 text-xs">≈ {Math.round(challenge.potential * EXCHANGE_RATE)} CDF</p>
                        {speedConfig.multiplier !== 1 && (
                          <span className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            x{speedConfig.multiplier}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 flex items-center gap-1.5"><Target size={14} /> Objectif</span>
                          <span className="text-white font-medium">{challenge.target} points</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 flex items-center gap-1.5"><Timer size={14} /> Temps</span>
                          <span className="text-white font-medium">{challenge.timeLimit}s</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 flex items-center gap-1.5"><TrendingUp size={14} /> Mise</span>
                          <span className="text-purple-400 font-bold">{parseFloat(challenge.entryFee).toFixed(2)} $</span>
                        </div>
                      </div>

                      {selectedAmount === challenge.id && (
                        <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChallenge(challenge, selectedCurrency);
                            }}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group"
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play size={20} className="group-hover:scale-110 transition-transform" />}
                            Commencer
                          </button>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchGlobalLeaderboard(challenge);
                        }}
                        className="w-full mt-2 text-purple-400 hover:text-purple-300 text-xs font-semibold py-2 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-all flex items-center justify-center gap-2"
                      >
                        <TrendingUp size={14} />
                        Voir le classement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal Classement Global */}
        {showGlobalLeaderboard && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-zinc-900 rounded-lg border border-purple-700 p-6 max-w-md w-full max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-purple-500" />
                  Top Scores - {showGlobalLeaderboard.title}
                </h2>
                <button onClick={() => setShowGlobalLeaderboard(null)} className="text-zinc-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {loadingLeaderboard ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                  <p className="text-zinc-500 text-sm">Chargement...</p>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-zinc-500 italic">Aucun score enregistré</p>
                </div>
              ) : (
                <div className="overflow-y-auto space-y-2 pr-1">
                  {leaderboardData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-center font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-zinc-400' : index === 2 ? 'text-orange-500' : 'text-zinc-600'}`}>
                          #{index + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden border border-purple-400/30">
                          {entry.avatar ? (
                            <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-white">{entry.username[0].toUpperCase()}</span>
                          )}
                        </div>
                        <span className="text-white font-medium">{entry.username}</span>
                      </div>
                      <span className="text-green-500 font-bold">{entry.score} pts</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowGlobalLeaderboard(null)}
                className="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {activeChallenge && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-lg border border-purple-700/50 p-4 shadow-2xl shadow-purple-500/10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`}></span>
                    <h2 className="text-white text-xl font-bold">{activeChallenge.title}</h2>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <p className="text-purple-400 flex items-center gap-1">
                      <Target size={14} /> <span className="text-white">{activeChallenge.target} pts</span>
                    </p>
                    <p className="text-blue-400 flex items-center gap-1">
                      <Timer size={14} /> <span className="text-white">{activeChallenge.timeLimit}s</span>
                    </p>
                    <p className="text-green-400 flex items-center gap-1">
                      <TrendingUp size={14} /> <span className="text-white">{activeChallenge.potential}$</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelChallenge}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded-lg transition-all text-sm flex items-center gap-2 border border-white/5"
                >
                  <X size={16} /> Abandonner
                </button>
              </div>
            </div>

            <ChallengeSnakeGame
              user={user}
              updateUser={onUpdate}
              challenge={activeChallenge}
              onComplete={handleChallengeComplete}
            />
          </div>
        )}

        {challengeResult && (
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center animate-in zoom-in duration-300">
            <div className={`p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 ${challengeResult.success
              ? 'bg-green-500/10 text-green-500 ring-4 ring-green-500/5'
              : 'bg-red-500/10 text-red-500 ring-4 ring-red-500/5'
              }`}>
              <Target size={48} />
            </div>

            <h2 className={`text-4xl font-bold mb-2 ${challengeResult.success ? 'text-green-500' : 'text-red-500'}`}>
              {challengeResult.success ? 'DÉFI RÉUSSI !' : 'DÉFI ÉCHOUÉ'}
            </h2>
            <p className="text-zinc-500 mb-8">{challengeResult.success ? 'Félicitations, vos gains ont été ajoutés à votre solde.' : 'Objectif non atteint, tentez à nouveau votre chance !'}</p>

            <div className="bg-black/40 rounded-xl p-6 mb-8 max-w-sm mx-auto border border-white/5">
              <div className="flex justify-between mb-4">
                <span className="text-zinc-500">Score final</span>
                <span className="text-white font-bold text-2xl">{challengeResult.score}</span>
              </div>
              <div className="flex justify-between mb-6 pb-6 border-b border-white/5">
                <span className="text-zinc-500">Objectif</span>
                <span className="text-zinc-300 font-medium">{challengeResult.target}</span>
              </div>

              <div className="flex justify-between">
                <span className={challengeResult.success ? 'text-green-500' : 'text-zinc-500'}>
                  {challengeResult.success ? 'Gains' : 'Résultat'}
                </span>
                <span className={`font-bold text-2xl ${challengeResult.success ? 'text-green-500' : 'text-red-500'}`}>
                  {challengeResult.success ? `+${parseFloat(challengeResult.earnings).toFixed(2)} $` : `-${parseFloat(challengeResult.paidAmount).toFixed(2)} $`}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setChallengeResult(null);
                setSelectedAmount(null);
              }}
              className="bg-white text-black hover:bg-zinc-200 font-bold px-10 py-4 rounded-xl transition-all shadow-xl shadow-white/5"
            >
              RETOURNER AUX DÉFIS
            </button>
          </div>
        )}

        {!activeChallenge && !challengeResult && (
          <div className="mt-12">
            <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
              <Timer className="text-purple-500" size={20} />
              Dernières performances
            </h2>
            {history.length === 0 ? (
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 py-12 text-center">
                <p className="text-zinc-600">Aucun défi relevé pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...history].slice(0, 5).map((item: any, index: number) => (
                  <div key={item.id} className="bg-zinc-900 border border-zinc-100/5 rounded-xl p-4 flex items-center justify-between group hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${item.status === 'won' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          Score: {item.score} <span className="text-zinc-500 font-normal">/ {item.target_score}</span>
                        </p>
                        <p className="text-zinc-500 text-xs">
                          {new Date(item.created_at).toLocaleDateString('fr-FR')} à {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${item.status === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                        {item.status === 'won' ? `+${item.earnings} $` : `-${item.bet_amount} $`}
                      </p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">Solo Challenge</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}