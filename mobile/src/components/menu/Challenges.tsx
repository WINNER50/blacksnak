import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Image, Alert } from 'react-native';
import { Target, Timer, TrendingUp, Play, DollarSign, X } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import ChallengeSnakeGame from '../game/ChallengeSnakeGame';
import apiService from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChallengesProps {
  user: any;
  onUpdate: () => void;
}

export default function Challenges({ user, onUpdate }: ChallengesProps) {
  const [challengeOptions, setChallengeOptions] = useState<any[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'CDF'>('USD');
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [challengeResult, setChallengeResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const EXCHANGE_RATE = 2500;

  const [speedConfig, setSpeedConfig] = useState({ label: 'Normal', speed: 150, multiplier: 1.0 });

  useEffect(() => {
    AsyncStorage.getItem('blacksnack_speed_config').then(saved => {
      if (saved) setSpeedConfig(JSON.parse(saved));
    });
  }, []);

  const loadTemplates = async (silent = false) => {
    if (!silent) setLoadingTemplates(true);
    try {
      const data = await apiService.getChallengeTemplates();
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
      console.log('Erreur templates', err);
    } finally {
      if (!silent) setLoadingTemplates(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await apiService.getChallenges();
      setHistory(data || []);
    } catch (err) {
      console.log('Erreur historique', err);
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
      const data = await apiService.startSoloChallenge(template.id, speedConfig.multiplier);
      onUpdate();

      setActiveChallenge({
        ...template,
        id: data.challenge.id,
        startTime: Date.now(),
        currency: currency,
        potential: data.challenge.potential,
        paidAmount: currency === 'USD' ? template.entryFee : template.entryFee * EXCHANGE_RATE
      });
      setSelectedAmount(null);
      setChallengeResult(null);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors du démarrage du défi');
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
      Alert.alert('Erreur', err.message || 'Erreur soumission score');
    }
    setActiveChallenge(null);
  };

  const handleCancelChallenge = () => {
    setActiveChallenge(null);
    Alert.alert('Information', 'Défi abandonné. La mise ne sera pas remboursée.');
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
      console.log('Erreur leaderboard', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20';
      case 'medium': return 'bg-blue-500/20';
      case 'hard': return 'bg-orange-500/20';
      case 'expert': return 'bg-red-500/20';
      default: return 'bg-purple-500/20';
    }
  };

  const getDifficultyIconColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4ade80';
      case 'medium': return '#60a5fa';
      case 'hard': return '#fb923c';
      case 'expert': return '#f87171';
      default: return '#c084fc';
    }
  };

  if (activeChallenge) {
    return (
      <View style={tw`flex-1 p-4 bg-black`}>
        <View style={tw`bg-[#18181b] rounded-lg border border-purple-700/50 p-3 shadow-sm shadow-purple-500/10 mb-2`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View style={tw`w-2 h-2 rounded-full bg-green-500 mr-2`} />
              <Text style={tw`text-white font-bold text-lg mr-4`}>{activeChallenge.title}</Text>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`flex-row items-center`}>
                  <Target size={12} color="#c084fc" />
                  <Text style={tw`text-white text-xs ml-1`}>{activeChallenge.target}</Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  <Timer size={12} color="#60a5fa" />
                  <Text style={tw`text-white text-xs ml-1`}>{activeChallenge.timeLimit}s</Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  <TrendingUp size={12} color="#4ade80" />
                  <Text style={tw`text-green-400 font-bold text-xs ml-1`}>{parseFloat(activeChallenge.potential).toFixed(2)}$</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <ChallengeSnakeGame
          user={user}
          updateUser={onUpdate}
          challenge={activeChallenge}
          onComplete={handleChallengeComplete}
        />
      </View>
    );
  }

  if (challengeResult) {
    return (
      <View style={tw`flex-1 bg-black`}>
        <ScrollView contentContainerStyle={tw`p-6 items-center justify-center min-h-full`}>
          <View style={tw`bg-zinc-900 border border-zinc-800 rounded-xl p-8 items-center w-full max-w-sm shadow-2xl`}>
            <View style={tw`p-6 rounded-full w-24 h-24 items-center justify-center mb-6 border-4 ${challengeResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <Target size={48} color={challengeResult.success ? '#22c55e' : '#ef4444'} />
            </View>
            <Text style={tw`text-3xl font-black text-center mb-2 uppercase tracking-wide ${challengeResult.success ? 'text-green-500' : 'text-red-500'}`}>
              {challengeResult.success ? 'DÉFI RÉUSSI' : 'DÉFI ÉCHOUÉ'}
            </Text>
            <Text style={tw`text-zinc-400 text-sm text-center mb-8`}>
              {challengeResult.success ? 'Félicitations, vos gains ont été ajoutés.' : 'Objectif non atteint, tentez à nouveau votre chance !'}
            </Text>

            <View style={tw`w-full bg-black/40 rounded-xl p-6 mb-8 border border-white/5`}>
              <View style={tw`flex-row justify-between mb-4`}>
                <Text style={tw`text-zinc-500 font-medium`}>Score final</Text>
                <Text style={tw`text-white font-black text-2xl`}>{challengeResult.score}</Text>
              </View>
              <View style={tw`flex-row justify-between mb-6 pb-6 border-b border-white/5`}>
                <Text style={tw`text-zinc-500 font-medium`}>Objectif</Text>
                <Text style={tw`text-zinc-300 font-bold text-lg`}>{challengeResult.target}</Text>
              </View>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`font-medium ${challengeResult.success ? 'text-green-500' : 'text-zinc-500'}`}>
                  {challengeResult.success ? 'Gains' : 'Résultat'}
                </Text>
                <Text style={tw`font-black text-3xl ${challengeResult.success ? 'text-green-500' : 'text-red-500'}`}>
                  {challengeResult.success ? `+${parseFloat(challengeResult.earnings).toFixed(2)} $` : `-${parseFloat(challengeResult.paidAmount).toFixed(2)} $`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setChallengeResult(null);
                setSelectedAmount(null);
              }}
              style={tw`w-full rounded-xl overflow-hidden`}
            >
              <LinearGradient colors={['#9333ea', '#6b21a8']} style={tw`py-4 items-center`}>
                <Text style={tw`text-white font-black text-lg uppercase`}>Continuer</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={tw`p-4 sm:p-6 bg-black flex-grow`}>
      <View style={tw`flex-row justify-between items-start mb-8`}>
        <View style={tw`flex-1 mr-4`}>
          <Text style={tw`text-white text-3xl font-bold mb-2`}>Défis Personnels</Text>
          <Text style={tw`text-zinc-400 text-sm font-medium`}>Relevez des défis solo et gagnez l'argent instantanément !</Text>
        </View>
        <View style={tw`bg-zinc-900 border border-yellow-500/50 rounded-lg p-3 items-end`}>
          <Text style={tw`text-zinc-500 text-[10px] uppercase font-bold`}>Vitesse Config.</Text>
          <Text style={tw`text-yellow-500 font-black`}>{speedConfig.label} (x{speedConfig.multiplier})</Text>
        </View>
      </View>

      {loadingTemplates ? (
        <View style={tw`py-20 items-center justify-center`}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={tw`text-zinc-500 mt-4 font-bold`}>Chargement des défis...</Text>
        </View>
      ) : (
        <View style={tw`gap-6 mb-12`}>
          {challengeOptions.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              activeOpacity={0.8}
              onPress={() => setSelectedAmount(selectedAmount === challenge.id ? null : challenge.id)}
              style={tw`bg-zinc-900 rounded-xl border-2 overflow-hidden ${selectedAmount === challenge.id ? 'border-purple-600' : 'border-zinc-800'}`}
            >
              <View style={tw`p-6 ${selectedAmount === challenge.id ? 'bg-purple-600/10' : ''}`}>
                <View style={tw`p-3 rounded-full w-14 h-14 items-center justify-center mb-4 border border-white/5 ${getDifficultyColor(challenge.difficulty)}`}>
                  <Target size={28} color={getDifficultyIconColor(challenge.difficulty)} />
                </View>

                <Text style={tw`text-white font-black text-xl mb-1`}>{challenge.title}</Text>
                <Text style={tw`text-zinc-400 text-xs font-medium mb-6`} numberOfLines={2}>{challenge.description}</Text>

                <View style={tw`bg-black/40 rounded-xl p-4 mb-6 border border-white/5 items-center`}>
                  <Text style={tw`text-purple-400 text-[10px] uppercase font-bold tracking-widest mb-1`}>Prix à gagner</Text>
                  <Text style={tw`text-white font-black text-3xl mb-1`}>{parseFloat(challenge.potential).toFixed(2)} $</Text>
                  <Text style={tw`text-zinc-500 text-xs font-bold`}>≈ {Math.round(challenge.potential * EXCHANGE_RATE)} CDF</Text>

                  {speedConfig.multiplier !== 1 && (
                    <View style={tw`absolute top-2 right-2 bg-yellow-500 px-2 py-0.5 rounded-full`}>
                      <Text style={tw`text-black text-[10px] font-black`}>x{speedConfig.multiplier}</Text>
                    </View>
                  )}
                </View>

                <View style={tw`gap-3 mb-6`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center gap-2`}><Target size={16} color="#71717a" /><Text style={tw`text-zinc-400 font-bold`}>Objectif</Text></View>
                    <Text style={tw`text-white font-bold`}>{challenge.target} pts</Text>
                  </View>
                  <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center gap-2`}><Timer size={16} color="#71717a" /><Text style={tw`text-zinc-400 font-bold`}>Temps</Text></View>
                    <Text style={tw`text-white font-bold`}>{challenge.timeLimit}s</Text>
                  </View>
                  <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center gap-2`}><TrendingUp size={16} color="#71717a" /><Text style={tw`text-zinc-400 font-bold`}>Mise</Text></View>
                    <Text style={tw`text-purple-400 font-black`}>{parseFloat(challenge.entryFee).toFixed(2)} $</Text>
                  </View>
                </View>

                {selectedAmount === challenge.id && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleStartChallenge(challenge, 'USD');
                    }}
                    disabled={loading}
                    style={tw`rounded-xl overflow-hidden mb-4`}
                  >
                    <LinearGradient colors={['#9333ea', '#2563eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`py-4 flex-row items-center justify-center`}>
                      {loading ? <ActivityIndicator color="white" style={tw`mr-2`} /> : <Play size={20} color="white" style={tw`mr-2`} />}
                      <Text style={tw`text-white font-black text-base`}>Commencer</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    fetchGlobalLeaderboard(challenge);
                  }}
                  style={tw`py-3 rounded-xl border border-purple-500/30 items-center justify-center flex-row bg-purple-900/10`}
                >
                  <TrendingUp size={16} color="#c084fc" style={tw`mr-2`} />
                  <Text style={tw`text-purple-400 font-bold text-xs uppercase tracking-wider`}>Voir le classement</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Global challenge leaderboard modal goes here, similar to tournaments */}
    </ScrollView>
  );
}
