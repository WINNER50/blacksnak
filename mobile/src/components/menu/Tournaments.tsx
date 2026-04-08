import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Users, Clock, DollarSign, X } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const EXCHANGE_RATE = 2500;

  const loadTournaments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiService.getTournaments();
      setTournaments(data.data || []);
    } catch (err) {
      console.log('Erreur tournaments', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
    const interval = setInterval(() => {
      if (!showPaymentModal && !showLeaderboardModal) {
        loadTournaments(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [showPaymentModal, showLeaderboardModal]);

  const handleJoinTournament = async (tournament: any, currency: 'USD' | 'CDF') => {
    try {
      await apiService.joinTournament(tournament.id, currency);
      onUpdate();
      await loadTournaments();
      setShowPaymentModal(null);
      Alert.alert('Succès', `Inscription réussie au tournoi "${tournament.name}" !`);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur lors de l\'inscription au tournoi');
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
      console.log('Erreur leaderboard', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={tw`p-4 sm:p-6 bg-black flex-grow`}>
      <Text style={tw`text-white text-3xl font-bold mb-8`}>Tournois</Text>

      {/* Liste des tournois */}
      <View style={tw`gap-6 mb-8`}>
        {loading ? (
          <ActivityIndicator size="large" color="#a855f7" style={tw`my-10`} />
        ) : (
          tournaments.map((tournament) => (
            <TouchableOpacity
              key={tournament.id}
              activeOpacity={0.8}
              onPress={() => handleShowLeaderboard(tournament)}
              style={tw`bg-zinc-900 rounded-xl border border-purple-800 border-b-4 overflow-hidden`}
            >
              <View style={tw`p-6`}>
                <View style={tw`flex-row items-start justify-between mb-6`}>
                  <View style={tw`flex-row items-center flex-1 pr-4`}>
                    <LinearGradient colors={['#9333ea', '#3b82f6']} style={tw`p-3 rounded-full mr-3`}>
                      <Trophy color="white" size={24} />
                    </LinearGradient>
                    <View>
                      <Text style={tw`text-white text-lg font-bold`} numberOfLines={1}>{tournament.name}</Text>
                      <View style={tw`mt-2 self-start rounded-full px-3 py-1 ${tournament.status === 'active' ? 'bg-green-500/20' : tournament.status === 'finished' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                        <Text style={tw`text-xs font-bold ${tournament.status === 'active' ? 'text-green-500' : tournament.status === 'finished' ? 'text-yellow-500' : 'text-blue-500'}`}>
                          {tournament.status === 'active' ? 'En cours' : tournament.status === 'finished' ? '✓ Terminé' : 'À venir'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={tw`text-purple-400 text-xs font-bold`}>Prix</Text>
                    <Text style={tw`text-white text-2xl font-black`}>{tournament.prize} $</Text>
                  </View>
                </View>

                <View style={tw`flex-row justify-between mb-6 bg-black/30 p-4 rounded-xl`}>
                  <View style={tw`items-center`}>
                    <View style={tw`flex-row items-center mb-1`}>
                      <DollarSign color="#a1a1aa" size={14} style={tw`mr-1`} />
                      <Text style={tw`text-zinc-500 text-[10px] uppercase font-bold`}>Entrée</Text>
                    </View>
                    <Text style={tw`text-white font-bold`}>{tournament.entryFee} $</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <View style={tw`flex-row items-center mb-1`}>
                      <Users color="#a1a1aa" size={14} style={tw`mr-1`} />
                      <Text style={tw`text-zinc-500 text-[10px] uppercase font-bold`}>Joueurs</Text>
                    </View>
                    <Text style={tw`text-white font-bold`}>{tournament.currentPlayers}/{tournament.maxPlayers}</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <View style={tw`flex-row items-center mb-1`}>
                      <Clock color="#a1a1aa" size={14} style={tw`mr-1`} />
                      <Text style={tw`text-zinc-500 text-[10px] uppercase font-bold`}>{tournament.status === 'active' ? 'Fin' : 'Début'}</Text>
                    </View>
                    <Text style={tw`text-white font-bold text-sm`}>
                      {new Date(tournament.endDate || tournament.startDate).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>

                {tournament.status === 'upcoming' && (
                  <View style={tw`bg-blue-500/10 border border-blue-500 rounded-lg p-3 mb-4`}>
                    <Text style={tw`text-blue-400 text-sm font-bold text-center`}>🚧 Inscription bientôt disponible</Text>
                  </View>
                )}

                {tournament.status === 'finished' && tournament.winner && (
                  <View style={tw`bg-yellow-500/10 border border-yellow-500 rounded-lg p-3 mb-4`}>
                    <Text style={tw`text-yellow-400 text-sm font-bold text-center`}>🏆 Gagnant : {tournament.winner}</Text>
                    <Text style={tw`text-yellow-300 text-xs mt-1 text-center`}>Cliquez pour voir le classement complet</Text>
                  </View>
                )}

                {tournament.status === 'active' && tournament.isParticipating && (
                  <View style={tw`bg-green-500/10 border border-green-500 rounded-lg p-3 mb-4`}>
                    <Text style={tw`text-green-400 text-sm font-bold text-center`}>✓ Vous participez !</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={(e) => {
                    if (tournament.status === 'active') {
                      if (tournament.isParticipating) {
                        onPlayTournament(tournament.id); // Trigger play mode via GameInterface
                      } else {
                        setShowPaymentModal(tournament);
                        setSelectedCurrency('USD');
                      }
                    } else if (tournament.status === 'finished' || tournament.status === 'completed') {
                      handleShowLeaderboard(tournament);
                    } else {
                      Alert.alert('Information', 'Ce tournoi n\'est pas encore ouvert aux inscriptions');
                    }
                  }}
                  disabled={tournament.status === 'upcoming'}
                  style={tw`rounded-xl overflow-hidden mt-2`}
                >
                  <LinearGradient
                    colors={tournament.status === 'finished' ? ['#ca8a04', '#713f12'] : tournament.status === 'active' ? ['#9333ea', '#6b21a8'] : ['#3f3f46', '#27272a']}
                    style={tw`py-4 items-center justify-center`}
                  >
                    <Text style={tw`text-white font-bold text-base`}>
                      {tournament.status === 'active'
                        ? tournament.isParticipating ? '🎮 Jouer' : 'Rejoindre'
                        : tournament.status === 'finished' ? 'Voir le classement' : 'À venir'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Modal de paiement */}
      <Modal visible={!!showPaymentModal} transparent animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-black/80 p-4`}>
          <View style={tw`bg-zinc-900 rounded-xl border border-purple-800 p-6 w-full max-w-sm`}>
            <Text style={tw`text-white text-2xl font-bold mb-2`}>Rejoindre le tournoi</Text>
            <Text style={tw`text-zinc-400 mb-6 font-medium`}>{showPaymentModal?.name}</Text>

            <View style={tw`bg-zinc-800 rounded-xl p-4 mb-6 border border-zinc-700`}>
              <Text style={tw`text-purple-400 text-sm mb-4 text-center font-bold uppercase`}>Devise de paiement</Text>
              <View style={tw`flex-row gap-3`}>
                <TouchableOpacity
                  onPress={() => setSelectedCurrency('USD')}
                  style={tw`flex-1 py-4 px-2 rounded-xl items-center border-2 ${selectedCurrency === 'USD' ? 'bg-purple-600/20 border-purple-500' : 'bg-zinc-900 border-zinc-700'}`}
                >
                  <DollarSign color={selectedCurrency === 'USD' ? '#fff' : '#a1a1aa'} size={20} style={tw`mb-2`} />
                  <Text style={tw`font-bold ${selectedCurrency === 'USD' ? 'text-white' : 'text-zinc-400'}`}>
                    {showPaymentModal?.entryFee} USD
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedCurrency('CDF')}
                  style={tw`flex-1 py-4 px-2 rounded-xl items-center border-2 ${selectedCurrency === 'CDF' ? 'bg-purple-600/20 border-purple-500' : 'bg-zinc-900 border-zinc-700'}`}
                >
                  <Text style={tw`text-xl font-black mb-2 ${selectedCurrency === 'CDF' ? 'text-white' : 'text-zinc-400'}`}>FC</Text>
                  <Text style={tw`font-bold ${selectedCurrency === 'CDF' ? 'text-white' : 'text-zinc-400'}`}>
                    {showPaymentModal ? showPaymentModal.entryFee * EXCHANGE_RATE : 0} CDF
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={tw`flex-row gap-3 mt-6`}>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(null)}
                style={tw`flex-1 bg-zinc-800 h-14 rounded-xl items-center justify-center border border-zinc-700`}
              >
                <Text style={tw`text-white font-bold text-base`}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleJoinTournament(showPaymentModal, selectedCurrency)}
                style={tw`flex-1 h-14 rounded-xl overflow-hidden`}
              >
                <LinearGradient colors={['#9333ea', '#6b21a8']} style={tw`flex-1 items-center justify-center`}>
                  <Text style={tw`text-white font-bold text-base`}>Payer & Rejoindre</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Classement */}
      <Modal visible={!!showLeaderboardModal} transparent animationType="slide">
        <View style={tw`flex-1 bg-black/60 justify-end`}>
          <SafeAreaView edges={['top']} style={tw`bg-zinc-950 rounded-t-3xl border-t-2 border-purple-800 h-[92%]`}>
            <View style={tw`p-6 flex-1`}>
              <View style={tw`flex-row items-center justify-between mb-8 pb-4 border-b border-white/10`}>
                <View style={tw`flex-1 pr-4`}>
                  <Text style={tw`text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1`}>Classement</Text>
                  <Text style={tw`text-white text-xl font-black`} numberOfLines={1}>{showLeaderboardModal?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLeaderboardModal(null)} style={tw`p-2 bg-zinc-800 rounded-full`}>
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>

              {loadingLeaderboard ? (
                <View style={tw`flex-1 items-center justify-center`}>
                  <ActivityIndicator size="large" color="#a855f7" />
                  <Text style={tw`text-zinc-400 mt-4 font-bold`}>Chargement...</Text>
                </View>
              ) : showLeaderboardModal?.leaderboard?.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-12`}>
                  {showLeaderboardModal.leaderboard.map((player: any, index: number) => {
                    const isUser = player.username === user.username;
                    return (
                      <View key={index} style={tw`flex-row items-center p-4 mb-3 rounded-2xl border-2 ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/50' : index === 1 ? 'bg-zinc-400/10 border-zinc-400/50' : index === 2 ? 'bg-orange-500/10 border-orange-500/50' : isUser ? 'bg-purple-600/20 border-purple-500' : 'bg-zinc-900 border-transparent'}`}>
                        <View style={tw`w-8 items-center`}>
                          <Text style={tw`text-lg font-black ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-zinc-400' : index === 2 ? 'text-orange-500' : 'text-zinc-600'}`}>
                            {index + 1}
                          </Text>
                        </View>
                        <Image source={{ uri: player.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${player.username}` }} style={tw`w-12 h-12 rounded-full border-2 ${index === 0 ? 'border-yellow-500' : index === 1 ? 'border-zinc-400' : index === 2 ? 'border-orange-500' : isUser ? 'border-purple-500' : 'border-zinc-700'} mx-3`} />
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-white font-bold text-base`} numberOfLines={1}>{player.username} {isUser && <Text style={tw`text-purple-400`}>(Vous)</Text>}</Text>
                          <Text style={tw`text-zinc-400 text-xs font-semibold`}>Score: {player.score}</Text>
                        </View>
                        {player.prize && player.prize > 0 && (
                          <View style={tw`items-end pr-1`}>
                            <Text style={tw`font-black text-lg ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-zinc-300' : 'text-orange-400'}`}>+{player.prize} $</Text>
                            <Text style={tw`text-[10px] text-zinc-500 font-bold uppercase`}>Gain</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={tw`flex-1 items-center justify-center`}>
                  <Text style={tw`text-zinc-500 text-lg font-bold`}>Aucun participant</Text>
                  <Text style={tw`text-zinc-600 mt-2`}>Soyez le premier à rejoindre !</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

    </ScrollView>
  );
}
