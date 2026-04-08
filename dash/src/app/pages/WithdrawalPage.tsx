import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    History,
    Search,
    Loader2,
    User as UserIcon,
    AlertCircle,
    Banknote,
    Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { withdrawPlayer, getWithdrawalHistory, withdrawSystem, Withdrawal } from '../../services/withdrawalService';
import { getUsers } from '../../services/userService';

export function WithdrawalPage() {
    const [activeTab, setActiveTab] = useState('players');
    const [users, setUsers] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states for player withdrawal
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [reason, setReason] = useState('');
    const [playerMethod, setPlayerMethod] = useState('mobile_money');
    const [playerPhone, setPlayerPhone] = useState('');
    const [playerNetwork, setPlayerNetwork] = useState('vodacom');

    // Form states for system withdrawal
    const [sysAmount, setSysAmount] = useState('');
    const [sysReason, setSysReason] = useState('');
    const [sysMethod, setSysMethod] = useState('');
    const [sysRef, setSysRef] = useState('');
    const [systemPhone, setSystemPhone] = useState('');
    const [systemNetwork, setSystemNetwork] = useState('vodacom');

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            if (response.success) {
                setUsers(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchHistory = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await getWithdrawalHistory();
            if (response.success) {
                setWithdrawals(response.data.withdrawals || []);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchHistory();
        const interval = setInterval(() => {
            fetchHistory(true);
            fetchUsers();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handlePlayerWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !amount || !reason) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        setSubmitting(true);
        try {
            const response = await withdrawPlayer({
                userId: parseInt(selectedUserId),
                amount: parseFloat(amount),
                currency,
                reason,
                method: playerMethod,
                phone: playerPhone,
                network: playerNetwork
            });

            if (response.success) {
                toast.success('Retrait effectué avec succès');
                setAmount('');
                setReason('');
                setSelectedUserId('');
                fetchHistory();
                fetchUsers(); // Refresh balances
            } else {
                toast.error(response.message || 'Erreur lors du retrait');
            }
        } catch (error) {
            toast.error('Une erreur est survenue');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSystemWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sysAmount || !sysReason) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        setSubmitting(true);
        try {
            const response = await withdrawSystem({
                amount: parseFloat(sysAmount),
                reason: sysReason,
                paymentMethod: sysMethod,
                paymentReference: sysRef,
                phone: systemPhone,
                network: systemNetwork
            });

            if (response.success) {
                toast.success('Retrait système (revenus) effectué');
                setSysAmount('');
                setSysReason('');
                setSysMethod('');
                setSysRef('');
            } else {
                toast.error(response.message || 'Erreur lors du retrait système');
            }
        } catch (error) {
            toast.error('Une erreur est survenue');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-white">Gestion des Retraits</h2>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="players" className="text-zinc-400 data-[state=active]:text-white flex gap-2">
                        <UserIcon className="w-4 h-4" /> Retraits Joueurs
                    </TabsTrigger>
                    <TabsTrigger value="system" className="text-zinc-400 data-[state=active]:text-white flex gap-2">
                        <Banknote className="w-4 h-4" /> Retraits Système (Revenus)
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-zinc-400 data-[state=active]:text-white flex gap-2">
                        <History className="w-4 h-4" /> Historique Joueurs
                    </TabsTrigger>
                </TabsList>

                {/* Retraits Joueurs */}
                <TabsContent value="players" className="mt-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Effectuer un retrait manuel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePlayerWithdraw} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Sélectionner un joueur</Label>
                                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                <SelectValue placeholder="Choisir un joueur..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                {users.map(user => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.username} (Solde: {parseFloat(user.balance_usd).toFixed(2)} USD)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Montant</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="bg-zinc-800 border-zinc-700 text-white"
                                            />
                                            <Select value={currency} onValueChange={setCurrency}>
                                                <SelectTrigger className="w-[100px] bg-zinc-800 border-zinc-700 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                    <SelectItem value="USD">USD</SelectItem>
                                                    <SelectItem value="CDF">CDF</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Méthode de versement</Label>
                                    <Select value={playerMethod} onValueChange={setPlayerMethod}>
                                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                            <SelectValue placeholder="Choisir une méthode..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                            <SelectItem value="cartes_bancaires">Virement Bancaire / Carte</SelectItem>
                                            <SelectItem value="manuel">Direct / Manuel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Numéro de téléphone (Bénéficiaire)</Label>
                                        <Input
                                            placeholder="Ex: 097970102"
                                            value={playerPhone}
                                            onChange={(e) => setPlayerPhone(e.target.value)}
                                            className="bg-zinc-800 border-zinc-700 text-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Réseau / Opérateur</Label>
                                        <Select value={playerNetwork} onValueChange={setPlayerNetwork}>
                                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <SelectItem value="vodacom">Vodacom (M-Pesa)</SelectItem>
                                                <SelectItem value="airtel">Airtel (Airtel Money)</SelectItem>
                                                <SelectItem value="orange">Orange (Orange Money)</SelectItem>
                                                <SelectItem value="other">Autre / Banque</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Raison du retrait</Label>
                                    <Input
                                        placeholder="Ex: Retrait Mobile Money effectué manuellement"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="bg-zinc-800 border-zinc-700 text-white"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-0"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownRight className="w-4 h-4 mr-2" />}
                                    Confirmer et Lancer le Versement
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Retraits Système */}
                <TabsContent value="system" className="mt-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Retrait des revenus de la plateforme</CardTitle>
                            <p className="text-sm text-zinc-400">Cette opération débitera directement le solde système (trésorerie).</p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSystemWithdraw} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">Montant (USD)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={sysAmount}
                                                onChange={(e) => setSysAmount(e.target.value)}
                                                className="bg-zinc-800 border-zinc-700 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400">Méthode de paiement</Label>
                                            <Select value={sysMethod} onValueChange={setSysMethod}>
                                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                    <SelectValue placeholder="Choisir une méthode..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                    <SelectItem value="mobile_money">Mobile Money (Recommandé)</SelectItem>
                                                    <SelectItem value="cartes_bancaires">Cartes bancaires (Visa/Mastercard)</SelectItem>
                                                    <SelectItem value="maboko_banque">Maboko Banque / Cash</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Numéro de téléphone (Transfert)</Label>
                                        <Input
                                            placeholder="Ex: 081970..."
                                            value={systemPhone}
                                            onChange={(e) => setSystemPhone(e.target.value)}
                                            className="bg-zinc-800 border-zinc-700 text-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Opérateur / Type</Label>
                                        <Select value={systemNetwork} onValueChange={(val: any) => setSystemNetwork(val)}>
                                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <SelectItem value="vodacom">Vodacom</SelectItem>
                                                <SelectItem value="airtel">Airtel</SelectItem>
                                                <SelectItem value="orange">Orange</SelectItem>
                                                <SelectItem value="bank">Virement / Cash</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Raison / Note</Label>
                                        <Input
                                            placeholder="Ex: Encaissement des bénéfices du mois de Mars"
                                            value={sysReason}
                                            onChange={(e) => setSysReason(e.target.value)}
                                            className="bg-zinc-800 border-zinc-700 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">Référence (Auto si Mobile Money)</Label>
                                        <Input
                                            placeholder="ID de transaction, n° de reçu..."
                                            value={sysRef}
                                            onChange={(e) => setSysRef(e.target.value)}
                                            className="bg-zinc-800 border-zinc-700 text-white"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white border-0"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
                                    Effectuer le retrait système
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Historique */}
                <TabsContent value="history" className="mt-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Historique des retraits manuels (Joueurs)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-800">
                                            <TableHead className="text-zinc-400">Joueur</TableHead>
                                            <TableHead className="text-zinc-400">Montant</TableHead>
                                            <TableHead className="text-zinc-400">Raison</TableHead>
                                            <TableHead className="text-zinc-400">Administrateur</TableHead>
                                            <TableHead className="text-zinc-400">Soldes (Av/Ap)</TableHead>
                                            <TableHead className="text-zinc-400">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {withdrawals.map((w) => (
                                            <TableRow key={w.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                                <TableCell className="text-white font-medium">{w.player_name}</TableCell>
                                                <TableCell>
                                                    {w.status === 'completed' ? (
                                                        <span className="text-red-500 font-bold">
                                                            -{w.currency === 'USD' ? w.amount_usd : w.amount_cdf} {w.currency}
                                                        </span>
                                                    ) : (
                                                        <Badge variant="outline" className="text-yellow-500">
                                                            En attente...
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-zinc-400 text-sm max-w-xs truncate">{w.reason}</TableCell>
                                                <TableCell className="text-zinc-300">{w.admin_name}</TableCell>
                                                <TableCell className="text-xs text-zinc-500">
                                                    {w.status === 'completed' ? (
                                                        `${parseFloat(w.balance_before_usd.toString()).toFixed(2)} → ${parseFloat(w.balance_after_usd.toString()).toFixed(2)}`
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-zinc-400 text-xs">
                                                    {w.created_at ? (
                                                        format(new Date(w.created_at), 'dd/MM/yyyy HH:mm')
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {withdrawals.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                                                    Aucun retrait trouvé
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
