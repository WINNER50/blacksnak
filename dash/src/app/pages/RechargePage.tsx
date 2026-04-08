import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Search,
  ArrowRight,
  CheckCircle,
  User,
  CreditCard,
  Plus,
  Calculator
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { getUsers } from '../../services/userService';
import {
  getRechargeHistory,
  systemOperation,
  getSystemHistory,
  getSystemBalance,
  rechargePlayer,
} from '../../services/rechargeService';
import { getRevenue7Days } from '../../services/statsService';
import { toast } from 'sonner';




// Types
interface Player {
  id: number;
  username: string;
  email: string;
  balance: number;
}

interface RechargeHistory {
  id: number;
  playerId: number;
  playerName: string;
  amount: number;
  currency: 'USD' | 'CDF';
  reason: string;
  adminName: string;
  createdAt: string;
  status: string;
}

interface SystemTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  adminName: string;
  createdAt: string;
  balanceAfter: number;
  status: string;
  paymentMethod?: 'cartes_bancaires' | 'mobile_money' | 'maboko_banque';
  paymentReference?: string;
}

interface Revenue {
  date: string;
  tournamentFees: number;
  challengeFees: number;
  subscriptions: number;
  total: number;
}

// export function RechargePage() is down below


export function RechargePage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Data state
  const [players, setPlayers] = useState<Player[]>([]);
  const [rechargeHistories, setRechargeHistories] = useState<RechargeHistory[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [systemTransactions, setSystemTransactions] = useState<SystemTransaction[]>([]);
  const [systemStats, setSystemStats] = useState({
    currentBalance: 0,
    totalCredits: 0,
    totalDebits: 0
  });

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        playersRes,
        rechargesRes,
        revenuesRes,
        systemHistoryRes,
        systemBalanceRes
      ] = await Promise.all([
        getUsers(),
        getRechargeHistory(),
        getRevenue7Days(),
        getSystemHistory(),
        getSystemBalance()
      ]);

      if (playersRes.success) setPlayers(playersRes.data.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email || '',
        balance: parseFloat(u.balance_usd || 0)
      })));

      if (rechargesRes.success) setRechargeHistories(rechargesRes.data.recharges.map((r: any) => ({
        id: r.id,
        playerId: r.user_id,
        playerName: r.player_name,
        amount: r.currency === 'USD' ? parseFloat(r.amount_usd) : parseFloat(r.amount_cdf),
        currency: r.currency,
        reason: r.reason,
        adminName: r.admin_name,
        createdAt: r.created_at,
        status: r.status
      })));

      if (revenuesRes.success) setRevenues(revenuesRes.data);

      if (systemHistoryRes.success) setSystemTransactions(systemHistoryRes.data.transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount_usd),
        reason: t.reason,
        adminName: t.admin_name,
        createdAt: t.created_at,
        balanceAfter: parseFloat(t.balance_after_usd),
        status: t.status,
        paymentMethod: t.payment_method_type,
        paymentReference: t.payment_reference
      })));

      if (systemBalanceRes.success) setSystemStats({
        currentBalance: parseFloat(systemBalanceRes.data.current_balance),
        totalCredits: parseFloat(systemBalanceRes.data.total_credits),
        totalDebits: parseFloat(systemBalanceRes.data.total_debits)
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // System balance state
  const systemBalance = systemStats.currentBalance;
  const totalRevenue = revenues.reduce((sum, r) => sum + r.total, 0);

  // System operation states
  const [systemOperationType, setSystemOperationType] = useState<'credit' | 'debit'>('credit');
  const [systemOperationAmount, setSystemOperationAmount] = useState('');
  const [systemOperationReason, setSystemOperationReason] = useState('');
  const [systemPaymentMethod, setSystemPaymentMethod] = useState<'cartes_bancaires' | 'mobile_money' | 'maboko_banque'>('mobile_money');
  const [systemPaymentReference, setSystemPaymentReference] = useState('');
  const [systemPhone, setSystemPhone] = useState('');
  const [systemNetwork, setSystemNetwork] = useState<'vodacom' | 'airtel' | 'orange'>('vodacom');
  const [isSystemDialogOpen, setIsSystemDialogOpen] = useState(false);

  // Recharge process states (3 steps)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeCurrency, setRechargeCurrency] = useState<'USD' | 'CDF'>('USD');
  const [rechargeReason, setRechargeReason] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState<'manuel' | 'mobile_money' | 'cartes_bancaires'>('manuel');
  const [rechargePhone, setRechargePhone] = useState('');
  const [rechargeNetwork, setRechargeNetwork] = useState('vodacom');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter players
  const filteredPlayers = players.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset recharge process
  const resetRecharge = () => {
    setStep(1);
    setSelectedPlayer(null);
    setRechargeAmount('');
    setRechargeCurrency('USD');
    setRechargeReason('');
    setSearchQuery('');
    setIsDialogOpen(false);
    setProcessing(false);
  };

  // Handle recharge confirmation
  const handleRechargeConfirm = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await rechargePlayer({
        userId: selectedPlayer?.id,
        amount: parseFloat(rechargeAmount),
        currency: rechargeCurrency,
        reason: rechargeReason,
        method: rechargeMethod,
        phone: rechargePhone,
        network: rechargeNetwork
      });

      if (res.success) {
        toast.success(res.message);
        fetchData();
        resetRecharge();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  const handleSystemOperationConfirm = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await systemOperation({
        type: systemOperationType,
        amount: parseFloat(systemOperationAmount),
        reason: systemOperationReason,
        paymentMethod: systemPaymentMethod,
        paymentReference: systemPaymentReference,
        phone: systemPhone,
        network: systemNetwork
      });

      if (res.success) {
        toast.success(res.message);
        fetchData();
        setIsSystemDialogOpen(false);
        setSystemOperationAmount('');
        setSystemOperationReason('');
        setSystemPaymentReference('');
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white">Chargement des données...</div>;
  }


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Recharge & Trésorerie</h1>
        <p className="text-zinc-400 mt-2">
          Gérez la trésorerie du système et rechargez les comptes joueurs
        </p>
      </div>

      {/* System Balance & Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-purple-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/80 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Solde Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {(systemBalance || 0).toLocaleString()} USD
            </p>
            <p className="text-xs text-white/60 mt-1">
              Fonds disponibles pour récompenses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-800 border-green-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/80 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenus (7 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {(totalRevenue || 0).toLocaleString()} USD
            </p>
            <p className="text-xs text-white/60 mt-1">
              +12% vs semaine dernière
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-blue-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/80 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Recharges Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {rechargeHistories.length}
            </p>
            <p className="text-xs text-white/60 mt-1">
              Transactions ce mois
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Revenue Details */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Détail des Revenus (7 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">Date</TableHead>
                <TableHead className="text-zinc-400">Frais Tournois</TableHead>
                <TableHead className="text-zinc-400">Frais Défis</TableHead>
                <TableHead className="text-zinc-400">Abonnements</TableHead>
                <TableHead className="text-zinc-400 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenues.map((revenue, index) => (
                <TableRow key={index} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="text-white">
                    {format(new Date(revenue.date), 'dd/MM/yyyy')}
                  </TableCell>

                  <TableCell className="text-green-500">
                    {(revenue.tournamentFees || 0).toLocaleString()} USD
                  </TableCell>
                  <TableCell className="text-green-500">
                    {(revenue.challengeFees || 0).toLocaleString()} USD
                  </TableCell>
                  <TableCell className="text-green-500">
                    {(revenue.subscriptions || 0).toLocaleString()} USD
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-500">
                    {(revenue.total || 0).toLocaleString()} USD
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recharge Player Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-500" />
              Recharger un Compte Joueur
            </span>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetRecharge();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Nouvelle Recharge
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    Recharger un Compte Joueur
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Processus en 3 étapes: Recherche → Montant → Confirmation
                  </DialogDescription>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 my-6">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-500' : 'text-zinc-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-600' : 'bg-zinc-800'}`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Joueur</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-600" />
                  <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-500' : 'text-zinc-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-600' : 'bg-zinc-800'}`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Montant</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-600" />
                  <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-500' : 'text-zinc-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-600' : 'bg-zinc-800'}`}>
                      3
                    </div>
                    <span className="text-sm font-medium">Confirmation</span>
                  </div>
                </div>

                {/* Step 1: Search Player */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Rechercher un Joueur</Label>
                      <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                          placeholder="Nom d'utilisateur ou email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {filteredPlayers.map((player) => (
                        <div
                          key={player.id}
                          onClick={() => setSelectedPlayer(player)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedPlayer?.id === player.id
                            ? 'border-purple-500 bg-purple-600/20'
                            : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{player.username}</p>
                                <p className="text-sm text-zinc-400">{player.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-zinc-400">Solde actuel</p>
                              <p className="font-bold text-green-500">{player.balance} USD</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedPlayer}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Enter Amount & Method */}
                {step === 2 && selectedPlayer && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
                      <p className="text-sm text-zinc-400">Joueur sélectionné</p>
                      <p className="text-lg font-bold text-white">{selectedPlayer.username}</p>
                      <p className="text-sm text-zinc-400">
                        Solde actuel: <span className="text-green-500 font-medium">{selectedPlayer.balance} USD</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Devise</Label>
                        <Select value={rechargeCurrency} onValueChange={(val: 'USD' | 'CDF') => setRechargeCurrency(val)}>
                          <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="CDF">CDF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white">Méthode</Label>
                        <Select value={rechargeMethod} onValueChange={(val: any) => setRechargeMethod(val)}>
                          <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="manuel">Manuel / Bonus</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money (Push)</SelectItem>
                            <SelectItem value="cartes_bancaires">Carte Bancaire / Visa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {rechargeMethod === 'mobile_money' && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                        <div>
                          <Label className="text-white">Téléphone du joueur</Label>
                          <Input
                            placeholder="097..."
                            value={rechargePhone}
                            onChange={(e) => setRechargePhone(e.target.value)}
                            className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Réseau</Label>
                          <Select value={rechargeNetwork} onValueChange={(val: any) => setRechargeNetwork(val)}>
                            <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectItem value="vodacom">Vodacom</SelectItem>
                              <SelectItem value="airtel">Airtel</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-white">Montant à recharger</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Raison de la recharge</Label>
                      <Textarea
                        placeholder="Ex: Bonus de bienvenue, compensation, récompense..."
                        value={rechargeReason}
                        onChange={(e) => setRechargeReason(e.target.value)}
                        className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setStep(1)}
                        variant="outline"
                        className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                      >
                        Retour
                      </Button>
                      <Button
                        onClick={() => setStep(3)}
                        disabled={!rechargeAmount || !rechargeReason}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Suivant
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && selectedPlayer && (
                  <div className="space-y-4">
                    <div className="p-4 lg:p-6 rounded-lg bg-purple-600/20 border border-purple-600">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                        <p className="text-lg font-bold text-white">Confirmer la Recharge</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Joueur:</span>
                          <span className="text-white font-medium">{selectedPlayer.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Email:</span>
                          <span className="text-white">{selectedPlayer.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Solde actuel:</span>
                          <span className="text-green-500 font-medium">{selectedPlayer.balance} USD</span>
                        </div>
                        <div className="border-t border-zinc-700 pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Montant à ajouter:</span>
                            <span className="text-2xl font-bold text-green-500">
                              +{parseFloat(rechargeAmount).toLocaleString()} {rechargeCurrency}
                            </span>
                          </div>
                          {rechargeCurrency === 'CDF' && (
                            <p className="text-xs text-zinc-400 text-right mt-1">
                              ≈ {(parseFloat(rechargeAmount) / 2500).toFixed(2)} USD
                            </p>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Nouveau solde:</span>
                          <span className="text-white font-bold">
                            {rechargeCurrency === 'USD'
                              ? (selectedPlayer.balance + parseFloat(rechargeAmount)).toLocaleString()
                              : (selectedPlayer.balance + parseFloat(rechargeAmount) / 2500).toFixed(2)} USD
                          </span>
                        </div>
                        <div className="border-t border-zinc-700 pt-3 mt-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-zinc-400 block mb-1">Méthode:</span>
                              <p className="text-white font-medium">{rechargeMethod}</p>
                            </div>
                            {rechargeMethod === 'mobile_money' && (
                              <div>
                                <span className="text-zinc-400 block mb-1">Téléphone:</span>
                                <p className="text-white font-medium">{rechargePhone} ({rechargeNetwork})</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <span className="text-zinc-400 block mb-1">Raison:</span>
                            <p className="text-white bg-zinc-800 p-3 rounded text-sm">{rechargeReason}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-yellow-600/20 border border-yellow-600">
                      <p className="text-yellow-500 text-sm">
                        ⚠️ Cette action est irréversible. Assurez-vous que toutes les informations sont correctes.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setStep(2)}
                        variant="outline"
                        className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                      >
                        Retour
                      </Button>
                      <Button
                        onClick={handleRechargeConfirm}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmer la Recharge
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400 mb-4">
            Historique des recharges manuelles effectuées par les administrateurs
          </p>

          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">ID</TableHead>
                <TableHead className="text-zinc-400">Joueur</TableHead>
                <TableHead className="text-zinc-400">Montant</TableHead>
                <TableHead className="text-zinc-400">Raison</TableHead>
                <TableHead className="text-zinc-400">Admin</TableHead>
                <TableHead className="text-zinc-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rechargeHistories.map((recharge) => (
                <TableRow key={recharge.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="text-white font-medium">#{recharge.id}</TableCell>

                  <TableCell className="text-white">{recharge.playerName}</TableCell>
                  <TableCell>
                    {recharge.status === 'completed' ? (
                      <span className="text-green-500 font-bold">
                        +{recharge.amount.toLocaleString()} {recharge.currency}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-yellow-500">
                        À certifier
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400">{recharge.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-purple-500">
                      {recharge.adminName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {format(new Date(recharge.createdAt), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Operations Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-500" />
              Opérations Système
            </span>
            <Dialog open={isSystemDialogOpen} onOpenChange={(open) => {
              setIsSystemDialogOpen(open);
              if (!open) {
                setSystemOperationType('credit');
                setSystemOperationAmount('');
                setSystemOperationReason('');
                setSystemPaymentMethod('mobile_money');
                setSystemPaymentReference('');
                setSystemPhone('');
                setSystemNetwork('vodacom');
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Nouvelle Opération
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    Opération Système
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Processus en 3 étapes: Type → Montant → Confirmation
                  </DialogDescription>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 my-6">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-500' : 'text-zinc-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                      1
                    </div>
                    <span className="text-sm font-medium">Type</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-600" />
                  <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-500' : 'text-zinc-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                      2
                    </div>
                    <span className="text-sm font-medium">Montant</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-600" />
                  <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-500' : 'text-zinc-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                      3
                    </div>
                    <span className="text-sm font-medium">Confirmation</span>
                  </div>
                </div>

                {/* Step 1: Select Type */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Type d'opération</Label>
                      <Select value={systemOperationType} onValueChange={(val: 'credit' | 'debit') => setSystemOperationType(val)}>
                        <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="credit">Crédit (Ajout de fonds)</SelectItem>
                          <SelectItem value="debit">Débit (Retrait de fonds)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => setStep(2)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Enter Amount */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Montant</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={systemOperationAmount}
                        onChange={(e) => setSystemOperationAmount(e.target.value)}
                        className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                      />
                      <p className="text-xs text-zinc-400 mt-1">
                        Entrez le montant en dollars américains
                      </p>
                    </div>

                    <div>
                      <Label className="text-white">Raison de l'opération</Label>
                      <Textarea
                        placeholder="Ex: Dépôt initial, recharge trésorerie, retrait..."
                        value={systemOperationReason}
                        onChange={(e) => setSystemOperationReason(e.target.value)}
                        className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                        rows={2}
                      />
                    </div>

                    {systemPaymentMethod === 'mobile_money' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Numéro de téléphone</Label>
                          <Input
                            placeholder="097..."
                            value={systemPhone}
                            onChange={(e) => setSystemPhone(e.target.value)}
                            className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Réseau</Label>
                          <Select value={systemNetwork} onValueChange={(val: any) => setSystemNetwork(val)}>
                            <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectItem value="vodacom">Vodacom</SelectItem>
                              <SelectItem value="airtel">Airtel</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-white">Méthode de paiement</Label>
                      <Select value={systemPaymentMethod} onValueChange={(val: 'cartes_bancaires' | 'mobile_money' | 'maboko_banque') => setSystemPaymentMethod(val)}>
                        <SelectTrigger className="mt-2 bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="cartes_bancaires">Cartes bancaires</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="maboko_banque">Maboko Banque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">Référence de paiement</Label>
                      <Input
                        placeholder="Ex: 123456789"
                        value={systemPaymentReference}
                        onChange={(e) => setSystemPaymentReference(e.target.value)}
                        className="mt-2 bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setStep(1)}
                        variant="outline"
                        className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                      >
                        Retour
                      </Button>
                      <Button
                        onClick={() => setStep(3)}
                        disabled={!systemOperationAmount || !systemOperationReason}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Suivant
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 lg:p-6 rounded-lg bg-blue-600/20 border border-blue-600">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                        <p className="text-lg font-bold text-white">Confirmer l'Opération</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Type:</span>
                          <span className="text-white font-medium">{systemOperationType === 'credit' ? 'Crédit' : 'Débit'}</span>
                        </div>
                        <div className="border-t border-zinc-700 pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Montant:</span>
                            <span className="text-2xl font-bold text-green-500">
                              {systemOperationType === 'credit' ? '+' : '-'}{parseFloat(systemOperationAmount).toLocaleString()} USD
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Nouveau solde:</span>
                          <span className="text-white font-bold">
                            {systemOperationType === 'credit'
                              ? (systemBalance + parseFloat(systemOperationAmount)).toLocaleString()
                              : (systemBalance - parseFloat(systemOperationAmount)).toLocaleString()} USD
                          </span>
                        </div>
                        <div className="border-t border-zinc-700 pt-3 mt-3">
                          <div>
                            <span className="text-zinc-400 block mb-1">Raison:</span>
                            <p className="text-white bg-zinc-800 p-3 rounded">{systemOperationReason}</p>
                          </div>
                        </div>
                        <div className="border-t border-zinc-700 pt-3 mt-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-zinc-400 block mb-1">Méthode:</span>
                              <p className="text-white font-medium">{systemPaymentMethod}</p>
                            </div>
                            {systemPaymentMethod === 'mobile_money' && (
                              <div>
                                <span className="text-zinc-400 block mb-1">Téléphone:</span>
                                <p className="text-white font-medium">{systemPhone} ({systemNetwork})</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <span className="text-zinc-400 block mb-1">Référence:</span>
                            <p className="text-white bg-zinc-800 p-3 rounded text-sm">{systemPaymentReference || 'Automatique'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-yellow-600/20 border border-yellow-600">
                      <p className="text-yellow-500 text-sm">
                        ⚠️ Cette action est irréversible. Assurez-vous que toutes les informations sont correctes.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setStep(2)}
                        variant="outline"
                        className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                      >
                        Retour
                      </Button>
                      <Button
                        onClick={handleSystemOperationConfirm}
                        disabled={processing}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {processing ? 'Chargement...' : "Confirmer l'Opération"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400 mb-4">
            Historique des opérations systèmes effectuées par les administrateurs
          </p>

          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">ID</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Montant</TableHead>
                <TableHead className="text-zinc-400">Raison</TableHead>
                <TableHead className="text-zinc-400">Admin</TableHead>
                <TableHead className="text-zinc-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemTransactions.map((tx: SystemTransaction) => (
                <TableRow key={tx.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="text-white font-medium">#{tx.id}</TableCell>

                  <TableCell>
                    <Badge variant={tx.type === 'credit' ? 'default' : 'destructive'} className="capitalize">
                      {tx.type === 'credit' ? 'Crédit' : 'Débit'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tx.status === 'completed' ? (
                      <span className={tx.type === 'credit' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()} USD
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-yellow-500">
                        À certifier
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400">{tx.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-blue-500">
                      {tx.adminName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div >
  );
}