import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, History, CreditCard, Smartphone, CheckCircle2, AlertCircle, X, ChevronRight, Copy, ArrowDownLeft, ArrowUpRight, Phone, Filter } from 'lucide-react';
import apiService from '../../frontend/services/api';

interface WalletProps {
  user: any;
  onUpdate: () => void;
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

  // États pour les modals de paiement

  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [showVisaModal, setShowVisaModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<'deposit' | 'withdraw'>('deposit');

  // États pour Mobile Money
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mobileNetwork, setMobileNetwork] = useState<'vodacom' | 'airtel' | 'orange'>('vodacom');

  // États pour Visa
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // État de chargement
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'withdrawal' | 'deposit'>('all');

  React.useEffect(() => {
    loadPaymentMethods();
    if (activeTab === 'history') {
      loadTransactions();
    }
  }, [activeTab]);

  // Auto-refresh every 5s in history tab
  React.useEffect(() => {
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
      console.error('Erreur lors du chargement des méthodes de paiement:', err);
    }
  };


  const loadTransactions = async () => {
    try {
      const data = await apiService.getTransactions();
      setTransactions(data.data || data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des transactions:', err);
    }
  };

  const handleInitiatePayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    // Vérifier le solde pour les retraits
    if (activeTab === 'withdraw') {
      const amountUSD = currency === 'CDF' ? parseFloat(amount) / 2500 : parseFloat(amount);
      if (amountUSD > user.balance) {
        alert('Solde insuffisant');
        return;
      }
    }

    setCurrentOperation(activeTab);

    // Ouvrir la modal appropriée
    if (paymentMethod === 'mobile_money') {
      setShowMobileMoneyModal(true);
    } else if (paymentMethod === 'cartes_bancaires') {
      setShowVisaModal(true);
    } else if (paymentMethod === 'maboko_banque') {
      alert('Veuillez contacter une agence Maboko pour cette opération.');
    } else {
      alert('Veuillez sélectionner une méthode de paiement');
    }
  };

  const processMobileMoneyPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setIsProcessing(true);

    try {
      await apiService.createTransaction({
        type: currentOperation,
        amount: parseFloat(amount),
        currency,
        method: 'mobile_money',
        details: { network: mobileNetwork, phone: phoneNumber }
      });

      onUpdate();
      setAmount('');
      setPhoneNumber('');
      setShowMobileMoneyModal(false);
      alert(`${currentOperation === 'deposit' ? 'Dépôt' : 'Retrait'} de ${amount} ${currency} effectué avec succès via ${mobileNetwork.toUpperCase()}!`);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du traitement du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const processVisaPayment = async () => {
    if (!cardNumber || cardNumber.length < 16) {
      alert('Numéro de carte invalide');
      return;
    }
    if (!cardName) {
      alert('Veuillez entrer le nom sur la carte');
      return;
    }
    if (!expiryDate || expiryDate.length !== 5) {
      alert('Date d\'expiration invalide (MM/AA)');
      return;
    }
    if (!cvv || cvv.length < 3) {
      alert('CVV invalide');
      return;
    }

    setIsProcessing(true);

    try {
      await apiService.createTransaction({
        type: currentOperation,
        amount: parseFloat(amount),
        currency,
        method: 'cartes_bancaires',
        details: { cardLast4: cardNumber.slice(-4) }
      });

      onUpdate();
      setAmount('');
      setCardNumber('');
      setCardName('');
      setExpiryDate('');
      setCvv('');
      setShowVisaModal(false);
      alert(`${currentOperation === 'deposit' ? 'Dépôt' : 'Retrait'} de ${amount} ${currency} effectué avec succès via Visa!`);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du traitement du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const exchangeRate = 2500;

  return (
    <div className="min-h-full bg-gradient-to-b from-black via-purple-950 to-black p-2 sm:p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Portefeuille</h1>

        {/* Solde */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-4 sm:p-6 mb-4 sm:mb-8 border border-purple-700">
          <p className="text-purple-200 text-xs sm:text-sm mb-2">Solde disponible</p>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <p className="text-white text-3xl sm:text-5xl font-bold">{parseFloat(user.balance_usd ?? 0).toFixed(2)} $</p>
            <p className="text-purple-300 text-lg sm:text-xl">≈ {(parseFloat(user.balance_usd ?? 0) * exchangeRate).toFixed(0)} CDF</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-2 sm:py-3 rounded-lg text-xs sm:text-base font-semibold transition ${activeTab === 'deposit'
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
          >
            <ArrowDownLeft className="inline mr-1 sm:mr-2" size={16} />
            <span className="hidden xs:inline">Dépôt</span>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-2 sm:py-3 rounded-lg text-xs sm:text-base font-semibold transition ${activeTab === 'withdraw'
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
          >
            <ArrowUpRight className="inline mr-1 sm:mr-2" size={16} />
            <span className="hidden xs:inline">Retrait</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 sm:py-3 rounded-lg text-xs sm:text-base font-semibold transition ${activeTab === 'history'
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
          >
            <History className="inline mr-1 sm:mr-2" size={16} />
            <span className="hidden xs:inline">Historique</span>
          </button>
        </div>

        {/* Contenu */}
        {(activeTab === 'deposit' || activeTab === 'withdraw') && (
          <div className="bg-zinc-900 rounded-lg border border-purple-700 p-3 sm:p-6 space-y-4 sm:space-y-6">
            {availableMethods.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-zinc-500 mb-3" size={48} />
                <p className="text-zinc-500 text-sm sm:text-base font-medium">Les services de paiement sont momentanément indisponibles.</p>
                <p className="text-zinc-600 text-xs mt-2">Veuillez contacter le support ou réessayer plus tard.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Montant</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'USD' | 'CDF')}
                      className="bg-zinc-800 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
                    >
                      <option value="USD">USD</option>
                      <option value="CDF">CDF</option>
                    </select>
                  </div>
                  {amount && (
                    <p className="text-zinc-400 text-xs sm:text-sm mt-2">
                      ≈ {currency === 'USD'
                        ? `${(parseFloat(amount) * exchangeRate).toFixed(0)} CDF`
                        : `${(parseFloat(amount) / exchangeRate).toFixed(2)} USD`
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Méthode de paiement</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {availableMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.type)}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition ${paymentMethod === method.type
                          ? 'border-purple-600 bg-purple-600/20'
                          : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                          }`}
                      >
                        {method.type === 'mobile_money' ? (
                          <Smartphone className="mx-auto mb-1 sm:mb-2 text-white" size={20} />
                        ) : method.type === 'cartes_bancaires' ? (
                          <CreditCard className="mx-auto mb-1 sm:mb-2 text-white" size={20} />
                        ) : (
                          <ArrowUpCircle className="mx-auto mb-1 sm:mb-2 text-white" size={20} />
                        )}
                        <p className="text-white text-xs sm:text-sm font-medium">{method.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleInitiatePayment}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base"
                >
                  {activeTab === 'deposit' ? 'Déposer' : 'Retirer'}
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-zinc-900 rounded-lg border border-purple-700 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg sm:text-xl font-bold">Historique des transactions</h2>
              <div className="flex gap-1">
                {(['all', 'withdrawal', 'deposit'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f)}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold transition ${historyFilter === f ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                  >
                    {f === 'all' ? 'Tout' : f === 'withdrawal' ? '↑ Retraits' : '↓ Dépôts'}
                  </button>
                ))}
              </div>
            </div>
            {transactions.length === 0 ? (
              <p className="text-zinc-500 text-center py-6 sm:py-8 text-sm sm:text-base">Aucune transaction</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {transactions
                  .filter(tx => {
                    if (historyFilter === 'all') return true;
                    if (historyFilter === 'withdrawal') return tx.type === 'withdrawal' || tx.type === 'withdraw';
                    if (historyFilter === 'deposit') return tx.type === 'deposit' || tx.type === 'admin_recharge';
                    return true;
                  })
                  .map((tx: any) => {
                    const isWithdrawal = tx.type === 'withdrawal' || tx.type === 'withdraw';
                    const isDepositLike = ['deposit', 'admin_recharge', 'tournament_prize', 'challenge_prize'].includes(tx.type);
                    const methodLabel = METHOD_LABELS[tx.method] || tx.method || 'N/A';
                    const typeLabel = TYPE_LABELS[tx.type] || tx.type;
                    const dateStr = tx.created_at
                      ? new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'N/A';

                    return (
                      <div key={tx.id} className={`rounded-lg p-3 sm:p-4 border ${isWithdrawal ? 'bg-red-500/5 border-red-500/20' : isDepositLike ? 'bg-green-500/5 border-green-500/20' : 'bg-zinc-800 border-zinc-700'}`}>
                        <div className="flex items-start justify-between gap-3">
                          {/* Left side: icon + labels */}
                          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`mt-0.5 flex-shrink-0 p-1.5 sm:p-2 rounded-full ${isWithdrawal ? 'bg-red-500/20' : isDepositLike ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                              {isWithdrawal ? (
                                <ArrowUpRight className="text-red-500" size={14} />
                              ) : isDepositLike ? (
                                <ArrowDownLeft className="text-green-500" size={14} />
                              ) : (
                                <CreditCard className="text-blue-500" size={14} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm sm:text-base">{typeLabel}</p>
                              {/* Method + Details */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                {tx.method && (
                                  <span className="flex items-center gap-1 text-zinc-400 text-xs">
                                    {tx.method === 'mobile_money' ? <Smartphone size={11} /> : <CreditCard size={11} />}
                                    {methodLabel}
                                  </span>
                                )}
                                {tx.network && (
                                  <span className="text-purple-400 text-xs font-medium uppercase">{tx.network}</span>
                                )}
                                {tx.phone && (
                                  <span className="flex items-center gap-1 text-zinc-400 text-xs">
                                    <Phone size={11} />
                                    {tx.phone}
                                  </span>
                                )}
                                {tx.card_last4 && (
                                  <span className="text-zinc-400 text-xs">•••• {tx.card_last4}</span>
                                )}
                              </div>
                              <p className="text-zinc-500 text-xs mt-1">{dateStr}</p>
                            </div>
                          </div>
                          {/* Right side: amount + status */}
                          <div className="text-right flex-shrink-0">
                            <p className={`font-bold text-sm sm:text-base ${isWithdrawal ? 'text-red-400' : isDepositLike ? 'text-green-400' : 'text-blue-400'}`}>
                              {isWithdrawal ? '-' : '+'}{parseFloat(tx.amount || tx.amount_usd || 0).toFixed(2)} {tx.currency || 'USD'}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                              {tx.status === 'completed' ? '✅ OK' : tx.status === 'pending' ? '⏳ En attente' : '❌ Échoué'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {transactions.filter(tx => {
                  if (historyFilter === 'all') return true;
                  if (historyFilter === 'withdrawal') return tx.type === 'withdrawal' || tx.type === 'withdraw';
                  if (historyFilter === 'deposit') return tx.type === 'deposit' || tx.type === 'admin_recharge';
                  return true;
                }).length === 0 && (
                    <p className="text-zinc-500 text-center py-6 text-sm">Aucune transaction dans cette catégorie</p>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals de paiement */}
      {showMobileMoneyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-purple-700 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-white text-lg sm:text-xl font-bold mb-4 sm:mb-6">Paiement Mobile Money</h2>

            <div className="bg-purple-600/10 border border-purple-600 rounded-lg p-3 mb-4">
              <p className="text-purple-400 text-xs sm:text-sm">
                Montant à {currentOperation === 'deposit' ? 'déposer' : 'retirer'}: <span className="text-white font-bold">{amount} {currency}</span>
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0971234567"
                  className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Réseau mobile</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMobileNetwork('vodacom')}
                    className={`p-3 rounded-lg border-2 transition ${mobileNetwork === 'vodacom'
                      ? 'border-purple-600 bg-purple-600/20'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                      }`}
                  >
                    <p className="text-white text-xs sm:text-sm font-bold">Vodacom</p>
                  </button>
                  <button
                    onClick={() => setMobileNetwork('airtel')}
                    className={`p-3 rounded-lg border-2 transition ${mobileNetwork === 'airtel'
                      ? 'border-purple-600 bg-purple-600/20'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                      }`}
                  >
                    <p className="text-white text-xs sm:text-sm font-bold">Airtel</p>
                  </button>
                  <button
                    onClick={() => setMobileNetwork('orange')}
                    className={`p-3 rounded-lg border-2 transition ${mobileNetwork === 'orange'
                      ? 'border-purple-600 bg-purple-600/20'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                      }`}
                  >
                    <p className="text-white text-xs sm:text-sm font-bold">Orange</p>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMobileMoneyModal(false);
                  setPhoneNumber('');
                }}
                disabled={isProcessing}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-3 rounded-lg transition text-sm sm:text-base"
              >
                Annuler
              </button>
              <button
                onClick={processMobileMoneyPayment}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold px-4 py-3 rounded-lg transition-all text-sm sm:text-base disabled:opacity-50"
              >
                {isProcessing ? '⏳ Traitement...' : 'Procéder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVisaModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-purple-700 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-white text-lg sm:text-xl font-bold mb-4 sm:mb-6">Paiement par Carte Visa</h2>

            <div className="bg-purple-600/10 border border-purple-600 rounded-lg p-3 mb-4">
              <p className="text-purple-400 text-xs sm:text-sm">
                Montant à {currentOperation === 'deposit' ? 'déposer' : 'retirer'}: <span className="text-white font-bold">{amount} {currency}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Numéro de carte</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setCardNumber(value);
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={16}
                  className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Nom sur la carte</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="JOHN DOE"
                  className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Expiration (MM/AA)</label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setExpiryDate(value);
                    }}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="text-purple-400 text-xs sm:text-sm mb-2 block">CVV</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCvv(value);
                    }}
                    placeholder="123"
                    maxLength={4}
                    className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowVisaModal(false);
                  setCardNumber('');
                  setCardName('');
                  setExpiryDate('');
                  setCvv('');
                }}
                disabled={isProcessing}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-3 rounded-lg transition text-sm sm:text-base"
              >
                Annuler
              </button>
              <button
                onClick={processVisaPayment}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold px-4 py-3 rounded-lg transition-all text-sm sm:text-base disabled:opacity-50"
              >
                {isProcessing ? '⏳ Traitement...' : 'Procéder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}