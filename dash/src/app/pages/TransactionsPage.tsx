import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Filter, Download, Eye, Check, X, Search, CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';
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
import { getRecentTransactions } from '../../services/statsService';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'visa' | 'mastercard' | 'mobile_money' | 'bank_transfer';
  icon: any;
  enabled: boolean;
  fee: number;
}

export function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'Cartes Bancaires', type: 'visa', icon: CreditCard, enabled: true, fee: 2.5 },
    { id: '2', name: 'Mobile Money', type: 'mobile_money', icon: Smartphone, enabled: true, fee: 1.5 },
    { id: '3', name: 'Maboko (Banque)', type: 'bank_transfer', icon: Building2, enabled: true, fee: 0 },
  ]);

  const fetchTransactions = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getRecentTransactions();
      if (response.success) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(() => fetchTransactions(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method =>
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const username = t.username || 'Utilisateur inconnu';
    const matchesSearch = username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toString().includes(searchQuery);
    return matchesType && matchesStatus && matchesSearch;
  });

  // Calculate stats
  const totalDeposits = transactions
    .filter(t => ['deposit', 'admin_recharge'].includes(t.type) && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount_usd || t.amount || 0), 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount_usd || t.amount || 0), 0);

  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Total Dépôts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {totalDeposits.toLocaleString()} USD
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Total Retraits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {totalWithdrawals.toLocaleString()} USD
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Management */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-500" />
            Gestion des Méthodes de Paiement
          </CardTitle>
          <p className="text-sm text-zinc-400 mt-1">
            Activez ou désactivez les méthodes de paiement disponibles pour les joueurs
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  className={`p-4 rounded-lg border transition-all ${method.enabled
                    ? 'border-green-600 bg-green-600/10'
                    : 'border-zinc-700 bg-zinc-800/50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${method.enabled
                          ? 'bg-green-600/20 text-green-500'
                          : 'bg-zinc-700 text-zinc-400'
                          }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{method.name}</p>
                        <p className="text-sm text-zinc-400">
                          Frais: {method.fee > 0 ? `${method.fee}%` : 'Gratuit'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          method.enabled
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-zinc-700 text-zinc-400'
                        }
                      >
                        {method.enabled ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Switch
                        checked={method.enabled}
                        onCheckedChange={() => togglePaymentMethod(method.id)}
                      />
                    </div>
                  </div>
                  {method.enabled && (
                    <div className="mt-3 pt-3 border-t border-zinc-700">
                      <p className="text-xs text-zinc-400">
                        ✓ Les joueurs peuvent utiliser cette méthode pour déposer et retirer de l'argent
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-blue-600/10 border border-blue-600">
            <p className="text-sm text-blue-400">
              💡 <strong>Conseil:</strong> Désactivez temporairement une méthode de paiement si vous rencontrez des problèmes techniques ou de maintenance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Rechercher par joueur ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px] bg-zinc-800 border-zinc-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="deposit">Dépôts</SelectItem>
                <SelectItem value="withdrawal">Retraits</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="completed">Complétés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoués</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">ID</TableHead>
                <TableHead className="text-zinc-400">Joueur</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Montant</TableHead>
                <TableHead className="text-zinc-400">Méthode</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
                <TableHead className="text-zinc-400">Date</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="text-white font-medium">{transaction.id}</TableCell>
                  <TableCell className="text-white">{transaction.username}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'}
                    >
                      {transaction.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-bold ${transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {transaction.status === 'completed' ? (
                      <>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} {transaction.currency}
                      </>
                    ) : (
                      <span className="text-zinc-500 text-xs font-normal">À certifier</span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400 capitalize">{transaction.method}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
                      }
                      className={
                        transaction.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                      }
                    >
                      {transaction.status === 'completed' ? '✅ OK' :
                        transaction.status === 'pending' ? '⏳ En attente' : '❌ Échoué'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {transaction.created_at ? (
                      format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {transaction.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-400 hover:text-green-300"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}