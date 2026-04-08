import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, History, LogOut, Info, BookOpen, Zap, X } from 'lucide-react-native';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

interface OthersProps {
   user: any;
   onLogout: () => void;
}

const SPEED_OPTIONS = [
   { label: 'Lent', speed: 250, multiplier: 0.5, color: '#60a5fa', bgColor: '#3b82f6' },
   { label: 'Normal', speed: 150, multiplier: 1.0, color: '#4ade80', bgColor: '#22c55e' },
   { label: 'Rapide', speed: 100, multiplier: 1.5, color: '#fb923c', bgColor: '#f97316' },
   { label: 'Très Rapide', speed: 75, multiplier: 2.0, color: '#f87171', bgColor: '#ef4444' }
];

export default function Others({ user, onLogout }: OthersProps) {
   const [showGuide, setShowGuide] = useState(false);
   const [selectedSpeed, setSelectedSpeed] = useState(SPEED_OPTIONS[1]);
   const [earnings, setEarnings] = useState<any[]>([]);
   const [challengeEarnings, setChallengeEarnings] = useState<any[]>([]);
   const [appSettings, setAppSettings] = useState<any>({});
   const [loadingContext, setLoadingContext] = useState(true);

   useEffect(() => {
      // Fetch app settings from backend
      const fetchSettings = async () => {
         try {
            const settings = await api.getAppSettings();
            setAppSettings(settings);
         } catch (err) {
            console.error('Error fetching settings:', err);
         } finally {
            setLoadingContext(false);
         }
      };
      fetchSettings();

      AsyncStorage.getItem('blacksnack_speed_config').then(saved => {
         if (saved) {
            setSelectedSpeed(JSON.parse(saved));
         }
      });

      // We fetch mocked history the exact same way the web version did using local storage
      const loadHistory = async () => {
         try {
            const txRaw = await AsyncStorage.getItem(`blacksnack_transactions_${user.id}`);
            if (txRaw) {
               setEarnings(JSON.parse(txRaw).filter((t: any) => t.type === 'deposit'));
            }
            const challengeRaw = await AsyncStorage.getItem(`blacksnack_challenge_history_${user.id}`);
            if (challengeRaw) {
               setChallengeEarnings(JSON.parse(challengeRaw).filter((c: any) => c.success));
            }
         } catch (err) { }
      };
      loadHistory();
   }, [user.id]);

   const handleWhatsAppGroup = () => {
      const link = appSettings.whatsapp_group_link;
      if (link) {
         Linking.openURL(link).catch(() => {
            Alert.alert('Erreur', 'Impossible d\'ouvrir le lien WhatsApp');
         });
      } else {
         Alert.alert('Information', 'Le lien du groupe WhatsApp n\'est pas encore configuré.');
      }
   };

   const handleSupport = () => {
      const phone = appSettings.whatsapp_support_number;
      if (phone) {
         const formattedPhone = phone.replace(/\D/g, '');
         Linking.openURL(`whatsapp://send?phone=${formattedPhone}`).catch(() => {
            Linking.openURL(`https://wa.me/${formattedPhone}`).catch(() => {
               Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp. Vérifiez que l\'application est installée.');
            });
         });
      } else {
         Alert.alert('Information', 'Le numéro de support n\'est pas encore configuré.');
      }
   };

   const handleSpeedChange = async (speed: typeof SPEED_OPTIONS[0]) => {
      setSelectedSpeed(speed);
      await AsyncStorage.setItem('blacksnack_speed_config', JSON.stringify(speed));
      Alert.alert(
         'Vitesse configurée',
         `✅ Vitesse configurée sur "${speed.label}"\n\nMultiplicateur de gains : ×${speed.multiplier}\n\nLes nouveaux défis utiliseront cette vitesse.`
      );
   };

   const handleLogout = () => {
      Alert.alert(
         'Déconnexion',
         'Êtes-vous sûr de vouloir vous déconnecter ?',
         [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se déconnecter', style: 'destructive', onPress: onLogout }
         ]
      );
   };

   const renderGuideModal = () => (
      <Modal visible={showGuide} transparent animationType="slide">
         <View style={tw`flex-1 bg-black/60 justify-end`}>
            <SafeAreaView edges={['top']} style={tw`bg-zinc-900 rounded-t-3xl border-t-2 border-purple-800 h-[85%]`}>
               <View style={tw`p-6 flex-1`}>
                  <View style={tw`flex-row justify-between items-center mb-6 border-b border-white/10 pb-4`}>
                     <Text style={tw`text-white font-bold text-2xl`}>Guide du débutant</Text>
                     <TouchableOpacity onPress={() => setShowGuide(false)} style={tw`p-2 bg-zinc-800 rounded-full`}>
                        <X color="white" size={24} />
                     </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-10`}>
                     {appSettings.beginner_guide_content ? (
                        <Text style={tw`text-zinc-300 leading-6 text-base`}>
                           {appSettings.beginner_guide_content}
                        </Text>
                     ) : (
                        <>
                           <Text style={tw`text-zinc-300 mb-4`}>Bienvenue sur Blacksnack ! Voici comment débuter :</Text>
                           <View style={tw`bg-zinc-800 rounded-xl p-4 mb-4`}>
                              <Text style={tw`text-white font-bold mb-2`}>1. 🎮 Comment jouer au snake</Text>
                              <Text style={tw`text-zinc-400 text-sm`}>Mangez les proies pour grandir et augmenter votre score. Évitez les murs et votre propre corps.</Text>
                           </View>
                           <View style={tw`bg-zinc-800 rounded-xl p-4 mb-4`}>
                              <Text style={tw`text-white font-bold mb-2`}>2. 🏆 Les tournois</Text>
                              <Text style={tw`text-zinc-400 text-sm`}>Inscrivez-vous aux tournois, battez le meilleur score et gagnez une part de la cagnotte.</Text>
                           </View>
                           <View style={tw`bg-zinc-800 rounded-xl p-4 mb-4`}>
                              <Text style={tw`text-white font-bold mb-2`}>3. 💸 Dépôts & Retraits</Text>
                              <Text style={tw`text-zinc-400 text-sm`}>Utilisez Mobile Money pour recharger votre compte instantanément et retirer vos gains.</Text>
                           </View>
                        </>
                     )}
                     <TouchableOpacity
                        onPress={handleSupport}
                        style={tw`mt-6 mb-8 bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex-row items-center justify-center`}
                     >
                        <MessageCircle color="#22c55e" size={20} style={tw`mr-2`} />
                        <Text style={tw`text-green-500 font-bold`}>Besoin d'aide ? Contactez le support</Text>
                     </TouchableOpacity>
                  </ScrollView>
               </View>
            </SafeAreaView>
         </View>
      </Modal>
   );

   return (
      <ScrollView contentContainerStyle={tw`p-4 sm:p-6 bg-black flex-grow pb-12`}>
         <Text style={tw`text-white text-3xl font-bold mb-8`}>Autres</Text>

         <View style={tw`gap-4 mb-8`}>
            {/* Guide button */}
            <TouchableOpacity
               onPress={() => setShowGuide(true)}
               style={tw`bg-zinc-900 border border-purple-800 p-4 rounded-xl flex-row items-center`}
            >
               <View style={tw`bg-blue-500 p-3 rounded-full mr-4`}>
                  <BookOpen color="white" size={20} />
               </View>
               <View style={tw`flex-1`}>
                  <Text style={tw`text-white font-bold text-lg`}>Guide du débutant</Text>
                  <Text style={tw`text-zinc-400 text-sm`}>Apprenez comment jouer à Blacksnack</Text>
               </View>
            </TouchableOpacity>

            {/* Whatsapp Group button */}
            <TouchableOpacity
               onPress={handleWhatsAppGroup}
               style={tw`bg-zinc-900 border border-purple-800 p-4 rounded-xl flex-row items-center`}
            >
               <View style={tw`bg-green-500 p-3 rounded-full mr-4`}>
                  <MessageCircle color="white" size={20} />
               </View>
               <View style={tw`flex-1`}>
                  <Text style={tw`text-white font-bold text-lg`}>Groupe WhatsApp</Text>
                  <Text style={tw`text-zinc-400 text-sm`}>Rejoindre la communauté Blacksnack</Text>
               </View>
            </TouchableOpacity>
         </View>

         {/* History Stats Block */}
         <View style={tw`w-full bg-zinc-900 border border-purple-800 rounded-xl p-5 mb-8`}>
            <View style={tw`flex-row items-center mb-6`}>
               <View style={tw`bg-blue-500 p-3 rounded-full mr-4`}>
                  <History color="white" size={20} />
               </View>
               <View>
                  <Text style={tw`text-white font-bold text-lg`}>Historique des revenus</Text>
                  <Text style={tw`text-zinc-400 text-sm`}>Vos gains et transactions</Text>
               </View>
            </View>

            <View style={tw`flex-row gap-4 mb-6`}>
               <View style={tw`flex-1 bg-zinc-800 rounded-xl p-4`}>
                  <Text style={tw`text-purple-400 text-sm mb-1`}>Revenus totaux</Text>
                  <Text style={tw`text-white text-2xl font-bold`}>{user.totalEarnings || 0} $</Text>
               </View>
               <View style={tw`flex-1 bg-zinc-800 rounded-xl p-4`}>
                  <Text style={tw`text-purple-400 text-sm mb-1`}>Défis gagnés</Text>
                  <Text style={tw`text-white text-2xl font-bold`}>{challengeEarnings.length}</Text>
               </View>
            </View>

            <View style={tw`gap-2`}>
               <Text style={tw`text-white font-bold mb-3`}>Transactions récentes</Text>
               {earnings.length === 0 && challengeEarnings.length === 0 ? (
                  <Text style={tw`text-zinc-500 text-center py-4`}>Aucune transaction</Text>
               ) : (
                  challengeEarnings.slice(0, 3).map((item: any, index: number) => (
                     <View key={index} style={tw`bg-zinc-800 rounded-lg p-3 flex-row items-center justify-between`}>
                        <View>
                           <Text style={tw`text-white text-sm font-medium`}>Défi réussi</Text>
                           <Text style={tw`text-zinc-400 text-xs mt-1`}>
                              {new Date(item.date || Date.now()).toLocaleDateString('fr-FR')}
                           </Text>
                        </View>
                        <Text style={tw`text-green-500 font-bold`}>+{item.earnings} $</Text>
                     </View>
                  ))
               )}
            </View>
         </View>

         <View style={tw`w-full bg-zinc-900 border border-purple-800 rounded-xl p-5 mb-8`}>
            <View style={tw`flex-row items-center mb-4`}>
               <View style={tw`bg-purple-500 p-3 rounded-full mr-4`}>
                  <Info color="white" size={20} />
               </View>
               <View style={tw`flex-1`}>
                  <Text style={tw`text-white font-bold text-lg`}>À propos</Text>
                  <Text style={tw`text-zinc-400 text-sm mb-3`}>Version 1.0 - Blacksnack</Text>
                  <Text style={tw`text-zinc-500 text-xs leading-5`}>
                     Blacksnack est une plateforme de jeu qui combine divertissement et compétition.
                     Relevez des défis, participez à des tournois et gagnez des récompenses !
                  </Text>
               </View>
            </View>
         </View>

         {/* Configuration Vitesse Block */}
         <LinearGradient colors={['#18181b', '#3b0764']} style={tw`w-full border-2 border-yellow-500 rounded-xl p-6 mb-8`}>
            <View style={tw`flex-row items-center mb-6`}>
               <View style={tw`bg-yellow-500 p-3 rounded-full mr-4`}>
                  <Zap color="white" size={24} />
               </View>
               <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center gap-2 mb-1`}>
                     <Text style={tw`text-white font-black text-xl`}>Config</Text>
                     <View style={tw`bg-yellow-500 px-2 py-0.5 rounded-full`}>
                        <Text style={tw`text-black text-[10px] font-bold`}>NOUVEAU</Text>
                     </View>
                  </View>
                  <Text style={tw`text-zinc-300 text-sm`}>Configuration de la vitesse du jeu</Text>
               </View>
            </View>

            <View style={tw`bg-zinc-800/80 border border-purple-500/30 rounded-xl p-5 mb-6`}>
               <Text style={tw`text-zinc-400 text-xs mb-3 font-semibold uppercase tracking-wider`}>Vitesse de jeu actuelle</Text>
               <View style={tw`flex-row justify-between items-center`}>
                  <Text style={[tw`text-2xl font-black`, { color: selectedSpeed.color }]}>{selectedSpeed.label}</Text>
                  <View style={tw`bg-purple-600 px-3 py-1.5 rounded-full`}>
                     <Text style={tw`text-white font-bold text-sm`}>×{selectedSpeed.multiplier} gains</Text>
                  </View>
               </View>
            </View>

            <View style={tw`gap-3`}>
               <Text style={tw`text-purple-300 text-sm font-bold mb-2`}>Choisir une vitesse :</Text>
               {SPEED_OPTIONS.map((option) => (
                  <TouchableOpacity
                     key={option.label}
                     onPress={() => handleSpeedChange(option)}
                     style={tw`w-full p-4 rounded-xl border-2 ${selectedSpeed.label === option.label ? 'border-yellow-400 bg-yellow-500/10 scale-[1.02]' : 'border-zinc-700 bg-zinc-800/50'}`}
                  >
                     <View style={tw`flex-row justify-between items-center`}>
                        <View style={tw`flex-row items-center`}>
                           <View style={[tw`p-2 rounded-full mr-4`, { backgroundColor: option.bgColor }]}>
                              <Zap color="white" size={20} />
                           </View>
                           <View>
                              <Text style={[tw`font-bold text-base`, { color: option.color }]}>{option.label}</Text>
                              <Text style={tw`text-zinc-400 text-xs mt-0.5`}>{option.speed}ms par mouv.</Text>
                           </View>
                        </View>
                        <View style={tw`items-end`}>
                           <Text style={tw`text-white font-black text-lg`}>×{option.multiplier}</Text>
                           <Text style={tw`text-zinc-400 text-xs`}>gains</Text>
                        </View>
                     </View>
                     {selectedSpeed.label === option.label && (
                        <View style={tw`mt-3 pt-3 border-t border-yellow-500/30 items-center justify-center`}>
                           <Text style={tw`text-yellow-400 text-xs font-bold uppercase`}>✓ Sélectionné avec succès</Text>
                        </View>
                     )}
                  </TouchableOpacity>
               ))}
            </View>

            <View style={tw`mt-6 bg-purple-900/30 border border-purple-500/30 rounded-xl p-4`}>
               <Text style={tw`text-purple-300 text-xs leading-5`}>
                  💡 <Text style={tw`font-bold text-white`}>Comment ça marche :</Text>{'\n'}
                  • <Text style={tw`text-white`}>Lent</Text> : Jeu plus facile, gains ×0.5{'\n'}
                  • <Text style={tw`text-white`}>Normal</Text> : Équilibre parfait, gains ×1.0{'\n'}
                  • <Text style={tw`text-white`}>Rapide</Text> : Plus de challenge, gains ×1.5{'\n'}
                  • <Text style={tw`text-white`}>Très Rapide</Text> : Défi extrême, gains ×2.0
               </Text>
            </View>
         </LinearGradient>

         {/* Logout button */}
         <TouchableOpacity
            onPress={handleLogout}
            style={tw`w-full bg-red-900/20 border border-red-700/50 py-4 rounded-xl flex-row items-center justify-center`}
         >
            <LogOut color="#ef4444" size={20} style={tw`mr-2`} />
            <Text style={tw`text-red-500 font-bold text-base`}>Se déconnecter</Text>
         </TouchableOpacity>

         <Text style={tw`text-zinc-600 text-center text-xs mt-8 mb-4`}>© 2026 Blacksnack. Tous droits réservés.</Text>

         {renderGuideModal()}

      </ScrollView>
   );
}
