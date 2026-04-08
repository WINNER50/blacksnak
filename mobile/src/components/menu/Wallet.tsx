import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet as WalletIcon, ArrowUpCircle, History, CreditCard, Smartphone, CheckCircle2, AlertCircle, X, ArrowDownLeft, ArrowUpRight, Phone, ArrowDownCircle } from 'lucide-react-native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../services/api';

interface WalletProps {
  user: any;
  onUpdate?: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  cartes_bancaires: 'Carte Bancaire',
  maboko_banque: 'Maboko (Banque)',
  deposit: 'Dépôt Manuel',
  admin_recharge: 'Rechargement Admin',
};

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Dépôt',
  withdrawal: 'Retrait',
  withdraw: 'Retrait',
  tournament_entry: 'Entrée Tournoi',
  tournament_prize: 'Prix Tournoi',
  challenge_bet: 'Mise Défi',
  challenge_prize: 'Prix Défi',
  admin_recharge: 'Recharge Admin',
};

export default function Wallet({ user, onUpdate }: WalletProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CDF'>('USD');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);

  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [showVisaModal, setShowVisaModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<'deposit' | 'withdraw'>('deposit');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [mobileNetwork, setMobileNetwork] = useState<'vodacom' | 'airtel' | 'orange'>('vodacom');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'withdrawal' | 'deposit'>('all');

  useEffect(() => {
    loadPaymentMethods();
    if (activeTab === 'history') {
      loadTransactions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'history') return;
    loadTransactions();
    const interval = setInterval(loadTransactions, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadPaymentMethods = async () => {
    try {
      const data = await apiService.getPaymentMethods();
      setAvailableMethods(data || []);
      if (data && data.length > 0 && !paymentMethod) {
        setPaymentMethod(data[0].type);
      }
    } catch (err) {
      console.log('Erreur chargement paiements', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await apiService.getTransactions();
      setTransactions(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.log('Erreur chargement transactions', err);
    }
  };

  const exchangeRate = 2500;

  const handleInitiatePayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (activeTab === 'withdraw') {
      const amountUSD = currency === 'CDF' ? parseFloat(amount) / 2500 : parseFloat(amount);
      if (amountUSD > (user?.balance || user?.balance_usd || 0)) {
        Alert.alert('Erreur', 'Solde insuffisant');
        return;
      }
    }

    setCurrentOperation(activeTab === 'history' ? 'deposit' : activeTab);

    if (paymentMethod === 'mobile_money') {
      setShowMobileMoneyModal(true);
    } else if (paymentMethod === 'cartes_bancaires') {
      setShowVisaModal(true);
    } else if (paymentMethod === 'maboko_banque') {
      Alert.alert('Information', 'Veuillez contacter une agence Maboko pour cette opération.');
    } else {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement');
    }
  };

  const processMobileMoneyPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.createTransaction({
        type: currentOperation,
        amount: parseFloat(amount),
        currency,
        method: 'mobile_money',
        details: { network: mobileNetwork, phone: phoneNumber }
      });

      onUpdate && onUpdate();
      setAmount('');
      setPhoneNumber('');
      setShowMobileMoneyModal(false);

      if (response.status === 'pending') {
        const instruction = currentOperation === 'deposit'
          ? "Veuillez valider l'opération sur votre téléphone en tapant votre code PIN. "
          : "L'argent sera transféré sur votre compte Mobile Money très prochainement. ";

        Alert.alert(
          'Requête Envoyée',
          `Votre demande de ${currentOperation === 'deposit' ? 'dépôt' : 'retrait'} est en cours de traitement par ${mobileNetwork.toUpperCase()}.\n\n` +
          instruction +
          "Votre solde sera mis à jour automatiquement dès que l'opérateur aura confirmé le succès."
        );
      } else {
        Alert.alert(
          'Succès',
          `${currentOperation === 'deposit' ? 'Dépôt' : 'Retrait'} de ${amount} ${currency} effectué avec succès via ${mobileNetwork.toUpperCase()}!`
        );
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur de paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const processVisaPayment = async () => {
    if (!cardNumber || cardNumber.length < 16) {
      Alert.alert('Erreur', 'Numéro de carte invalide');
      return;
    }
    if (!cardName) {
      Alert.alert('Erreur', 'Nom invalide');
      return;
    }
    if (!expiryDate || expiryDate.length !== 5) {
      Alert.alert('Erreur', 'Date invalide (MM/AA)');
      return;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert('Erreur', 'CVV invalide');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiService.createTransaction({
        type: currentOperation,
        amount: parseFloat(amount),
        currency,
        method: 'cartes_bancaires',
        details: { cardLast4: cardNumber.slice(-4) }
      });

      onUpdate && onUpdate();
      setAmount('');
      setCardNumber('');
      setCardName('');
      setExpiryDate('');
      setCvv('');
      setShowVisaModal(false);

      if (response.status === 'pending') {
        Alert.alert(
          'Paiement en attente',
          `Votre transaction par carte est en cours de vérification. Votre solde sera mis à jour dès confirmation.`
        );
      } else {
        Alert.alert(
          'Succès',
          `${currentOperation === 'deposit' ? 'Dépôt' : 'Retrait'} de ${amount} ${currency} effectué avec succès via Visa!`
        );
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Erreur de paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMobileMoneyModal = () => (
    <Modal visible={showMobileMoneyModal} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={Keyboard.dismiss}
          style={tw`flex-1 justify-center items-center bg-black/80 p-4`}
        >
          <View style={tw`bg-zinc-900 border border-purple-700 w-full max-w-[340px] rounded-xl overflow-hidden`}>
            <ScrollView bounces={false} contentContainerStyle={tw`p-6`}>
              <Text style={tw`text-white text-xl font-bold mb-6`}>Paiement Mobile Money</Text>

              <View style={tw`bg-purple-600/10 border border-purple-600 rounded-lg p-3 mb-6`}>
                <Text style={tw`text-purple-400 text-sm`}>
                  Montant à {currentOperation === 'deposit' ? 'déposer' : 'retirer'}: <Text style={tw`text-white font-bold`}>{amount} {currency}</Text>
                </Text>
              </View>

              <Text style={tw`text-purple-400 text-sm mb-2`}>Numéro de téléphone</Text>
              <TextInput
                style={tw`w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 mb-4`}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Ex: 0971234567"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <Text style={tw`text-purple-400 text-sm mb-2`}>Réseau mobile</Text>
              <View style={tw`flex-row justify-between gap-2 mb-8`}>
                {(['vodacom', 'airtel', 'orange'] as const).map(network => (
                  <TouchableOpacity
                    key={network}
                    onPress={() => setMobileNetwork(network)}
                    style={tw`flex-1 p-3 rounded-lg border-2 items-center justify-center ${mobileNetwork === network ? 'border-purple-600 bg-purple-600/20' : 'border-zinc-700 bg-zinc-800'}`}
                  >
                    <Text style={tw`text-white text-[10px] font-bold capitalize`}>{network}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={tw`flex-row gap-3 mt-2`}>
                <TouchableOpacity
                  onPress={() => setShowMobileMoneyModal(false)}
                  disabled={isProcessing}
                  style={tw`flex-1 bg-zinc-800 py-3 rounded-lg items-center justify-center`}
                >
                  <Text style={tw`text-white font-bold text-sm`}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={processMobileMoneyPayment}
                  disabled={isProcessing}
                  style={tw`flex-1 rounded-lg overflow-hidden`}
                >
                  <LinearGradient colors={['#9333ea', '#6b21a8']} style={tw`py-3 items-center justify-center w-full opacity-${isProcessing ? '50' : '100'}`}>
                    <Text style={tw`text-white font-bold text-sm`}>{isProcessing ? 'En cours...' : 'Procéder'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderVisaModal = () => (
    <Modal visible={showVisaModal} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={Keyboard.dismiss}
          style={tw`flex-1 justify-center items-center bg-black/80 p-4`}
        >
          <View style={tw`bg-zinc-900 border border-purple-700 w-full max-w-[340px] rounded-xl overflow-hidden`}>
            <ScrollView bounces={false} contentContainerStyle={tw`p-6`}>
              <Text style={tw`text-white text-xl font-bold mb-6`}>Paiement par Carte Visa</Text>

              <View style={tw`bg-purple-600/10 border border-purple-600 rounded-lg p-3 mb-6`}>
                <Text style={tw`text-purple-400 text-sm`}>
                  Montant à {currentOperation === 'deposit' ? 'déposer' : 'retirer'}: <Text style={tw`text-white font-bold`}>{amount} {currency}</Text>
                </Text>
              </View>

              <Text style={tw`text-purple-400 text-sm mb-2`}>Numéro de carte</Text>
              <TextInput
                style={tw`w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 mb-4`}
                value={cardNumber}
                onChangeText={(val) => setCardNumber(val.replace(/\D/g, '').slice(0, 16))}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={16}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <Text style={tw`text-purple-400 text-sm mb-2`}>Nom sur la carte</Text>
              <TextInput
                style={tw`w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 mb-4`}
                value={cardName}
                onChangeText={(val) => setCardName(val.toUpperCase())}
                placeholder="JOHN DOE"
                placeholderTextColor="#666"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <View style={tw`flex-row gap-3 mb-4`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-purple-400 text-sm mb-2`}>Expiration</Text>
                  <TextInput
                    style={tw`w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700`}
                    value={expiryDate}
                    onChangeText={(val) => {
                      let v = val.replace(/\D/g, '');
                      if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                      setExpiryDate(v);
                    }}
                    placeholder="MM/AA"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    maxLength={5}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-purple-400 text-sm mb-2`}>CVV</Text>
                  <TextInput
                    style={tw`w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700`}
                    value={cvv}
                    onChangeText={(val) => setCvv(val.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    placeholderTextColor="#666"
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={4}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
              </View>

              <View style={tw`flex-row gap-3 mt-4`}>
                <TouchableOpacity
                  onPress={() => setShowVisaModal(false)}
                  disabled={isProcessing}
                  style={tw`flex-1 bg-zinc-800 py-3 rounded-lg items-center justify-center`}
                >
                  <Text style={tw`text-white font-bold text-sm`}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={processVisaPayment}
                  disabled={isProcessing}
                  style={tw`flex-1 rounded-lg overflow-hidden`}
                >
                  <LinearGradient colors={['#9333ea', '#6b21a8']} style={tw`py-3 items-center justify-center w-full opacity-${isProcessing ? '50' : '100'}`}>
                    <Text style={tw`text-white font-bold text-sm`}>{isProcessing ? 'En cours...' : 'Procéder'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <ScrollView contentContainerStyle={tw`p-4 sm:p-6 pb-12 bg-black`}>
      <Text style={tw`text-white text-3xl font-bold mb-6`}>Portefeuille</Text>

      {/* Solde Block */}
      <View style={tw`border border-purple-700 rounded-2xl mb-6 overflow-hidden`}>
        <LinearGradient
          colors={['#581c87', '#1e3a8a']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={tw`p-6`}
        >
          <Text style={tw`text-purple-200 text-sm mb-2 font-medium`}>Solde disponible</Text>
          <View style={tw`flex-row items-baseline gap-4`}>
            <Text style={tw`text-white text-4xl font-bold`}>{parseFloat(user?.balance_usd ?? 0).toFixed(2)} $</Text>
            <Text style={tw`text-purple-300 text-lg`}>≈ {(parseFloat(user?.balance_usd ?? 0) * exchangeRate).toFixed(0)} CDF</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={tw`flex-row gap-2 mb-6`}>
        <TouchableOpacity
          onPress={() => setActiveTab('deposit')}
          style={tw`flex-1 rounded-lg overflow-hidden`}
        >
          <LinearGradient colors={activeTab === 'deposit' ? ['#9333ea', '#6b21a8'] : ['#18181b', '#18181b']} style={tw`py-3 flex-row items-center justify-center`}>
            <ArrowDownLeft color={activeTab === 'deposit' ? '#fff' : '#a1a1aa'} size={18} style={tw`mr-2`} />
            <Text style={tw`font-bold ${activeTab === 'deposit' ? 'text-white' : 'text-zinc-400'}`}>Dépôt</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('withdraw')}
          style={tw`flex-1 rounded-lg overflow-hidden`}
        >
          <LinearGradient colors={activeTab === 'withdraw' ? ['#9333ea', '#6b21a8'] : ['#18181b', '#18181b']} style={tw`py-3 flex-row items-center justify-center`}>
            <ArrowUpRight color={activeTab === 'withdraw' ? '#fff' : '#a1a1aa'} size={18} style={tw`mr-2`} />
            <Text style={tw`font-bold ${activeTab === 'withdraw' ? 'text-white' : 'text-zinc-400'}`}>Retrait</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          style={tw`flex-1 rounded-lg overflow-hidden`}
        >
          <LinearGradient colors={activeTab === 'history' ? ['#9333ea', '#6b21a8'] : ['#18181b', '#18181b']} style={tw`py-3 flex-row items-center justify-center`}>
            <History color={activeTab === 'history' ? '#fff' : '#a1a1aa'} size={18} style={tw`mr-2`} />
            <Text style={tw`font-bold ${activeTab === 'history' ? 'text-white' : 'text-zinc-400'}`}>Historique</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      {(activeTab === 'deposit' || activeTab === 'withdraw') && (
        <View style={tw`bg-zinc-900 rounded-xl border border-purple-800 p-5`}>
          {availableMethods.length === 0 ? (
            <View style={tw`items-center justify-center py-6`}>
              <AlertCircle color="#71717a" size={48} style={tw`mb-4`} />
              <Text style={tw`text-zinc-400 font-medium mb-1`}>Services indisponibles.</Text>
              <Text style={tw`text-zinc-500 text-xs`}>Veuillez réessayer plus tard.</Text>
            </View>
          ) : (
            <>
              {/* Amount */}
              <Text style={tw`text-purple-400 text-sm mb-2`}>Montant</Text>
              <View style={tw`flex-row gap-2 mb-2`}>
                <TextInput
                  style={tw`flex-1 bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700`}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  onPress={() => setCurrency(currency === 'USD' ? 'CDF' : 'USD')}
                  style={tw`bg-zinc-800 px-4 items-center justify-center rounded-lg border border-zinc-700 w-20`}
                >
                  <Text style={tw`text-white font-bold`}>{currency}</Text>
                </TouchableOpacity>
              </View>
              {amount ? (
                <Text style={tw`text-zinc-400 text-xs mt-1 mb-6`}>
                  ≈ {currency === 'USD'
                    ? `${(parseFloat(amount) * exchangeRate).toFixed(0)} CDF`
                    : `${(parseFloat(amount) / exchangeRate).toFixed(2)} USD`}
                </Text>
              ) : <View style={tw`mb-6`} />}

              {/* Methods */}
              <Text style={tw`text-purple-400 text-sm mb-2`}>Méthode de paiement</Text>
              <View style={tw`flex-row flex-wrap gap-2 mb-8`}>
                {availableMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => setPaymentMethod(method.type)}
                    style={tw`flex-1 min-w-[45%] p-4 rounded-xl border-2 items-center justify-center ${paymentMethod === method.type ? 'border-purple-600 bg-purple-600/20' : 'border-zinc-700 bg-zinc-800'}`}
                  >
                    {method.type === 'mobile_money' ? (
                      <Smartphone color="white" size={24} style={tw`mb-2`} />
                    ) : method.type === 'cartes_bancaires' ? (
                      <CreditCard color="white" size={24} style={tw`mb-2`} />
                    ) : (
                      <ArrowUpCircle color="white" size={24} style={tw`mb-2`} />
                    )}
                    <Text style={tw`text-white text-xs font-bold text-center`}>{method.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleInitiatePayment}
                style={tw`rounded-xl overflow-hidden`}
              >
                <LinearGradient colors={['#9333ea', '#6b21a8']} style={tw`py-4 items-center justify-center`}>
                  <Text style={tw`text-white font-bold text-base`}>
                    {activeTab === 'deposit' ? 'Déposer' : 'Retirer'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* History Content */}
      {activeTab === 'history' && (
        <View style={tw`bg-zinc-900 rounded-xl border border-purple-800 p-5`}>
          <View style={tw`flex-row items-center justify-between mb-6 flex-wrap gap-4`}>
            <Text style={tw`text-white text-lg font-bold`}>Historique</Text>
            <View style={tw`flex-row justify-end max-w-full flex-wrap gap-2`}>
              {(['all', 'withdrawal', 'deposit'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setHistoryFilter(f)}
                  style={tw`px-3 py-1.5 rounded-full ${historyFilter === f ? 'bg-purple-600' : 'bg-zinc-800'}`}
                >
                  <Text style={tw`text-xs font-bold ${historyFilter === f ? 'text-white' : 'text-zinc-400'}`}>
                    {f === 'all' ? 'Tout' : f === 'withdrawal' ? '↑ Retraits' : '↓ Dépôts'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {transactions.filter(tx => {
            if (historyFilter === 'all') return true;
            if (historyFilter === 'withdrawal') return tx.type === 'withdrawal' || tx.type === 'withdraw';
            if (historyFilter === 'deposit') return tx.type === 'deposit' || tx.type === 'admin_recharge';
            return true;
          }).length === 0 ? (
            <Text style={tw`text-zinc-500 text-center py-8`}>Aucune transaction</Text>
          ) : (
            <View style={tw`gap-3`}>
              {transactions.filter(tx => {
                if (historyFilter === 'all') return true;
                if (historyFilter === 'withdrawal') return tx.type === 'withdrawal' || tx.type === 'withdraw';
                if (historyFilter === 'deposit') return tx.type === 'deposit' || tx.type === 'admin_recharge';
                return true;
              }).map((tx: any) => {
                const isWithdrawal = tx.type === 'withdrawal' || tx.type === 'withdraw';
                const isDepositLike = ['deposit', 'admin_recharge', 'tournament_prize', 'challenge_prize'].includes(tx.type);
                const typeLabel = TYPE_LABELS[tx.type] || tx.type;
                const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

                return (
                  <View key={tx.id} style={tw`rounded-xl p-4 border ${isWithdrawal ? 'bg-red-500/10 border-red-500/20' : isDepositLike ? 'bg-green-500/10 border-green-500/20' : 'bg-zinc-800 border-zinc-700'}`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <View style={tw`flex-row items-center flex-1 pr-2`}>
                        <View style={tw`p-2 rounded-full mr-3 ${isWithdrawal ? 'bg-red-500/20' : isDepositLike ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                          {isWithdrawal ? <ArrowUpRight color="#ef4444" size={16} /> : isDepositLike ? <ArrowDownLeft color="#22c55e" size={16} /> : <CreditCard color="#3b82f6" size={16} />}
                        </View>
                        <View>
                          <Text style={tw`text-white font-bold text-sm`}>{typeLabel}</Text>
                          <Text style={tw`text-zinc-500 text-xs uppercase mt-0.5`}>{(METHOD_LABELS[tx.method] || tx.method || 'N/A')}</Text>
                          <Text style={tw`text-zinc-600 text-[10px]`}>{dateStr}</Text>
                        </View>
                      </View>

                      <View style={tw`items-end`}>
                        {tx.status === 'completed' ? (
                          <Text style={tw`font-black text-base ${isWithdrawal ? 'text-red-400' : isDepositLike ? 'text-green-400' : 'text-blue-400'}`}>
                            {isWithdrawal ? '-' : '+'}{parseFloat(tx.amount || tx.amount_usd || 0).toFixed(2)} {tx.currency || 'USD'}
                          </Text>
                        ) : (
                          <Text style={tw`text-zinc-500 font-bold text-xs mb-1`}>À certifier</Text>
                        )}
                        <View style={tw`mt-1 px-2 py-0.5 rounded-full ${tx.status === 'completed' ? 'bg-green-500/20' : tx.status === 'pending' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                          <Text style={tw`text-[10px] font-bold ${tx.status === 'completed' ? 'text-green-400' : tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {tx.status === 'completed' ? '✅ OK' : tx.status === 'pending' ? '⏳ Attente' : '❌ Échec'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {renderMobileMoneyModal()}
      {renderVisaModal()}
    </ScrollView>
  );
}
