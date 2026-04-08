import { useState } from 'react';
import { Search, DollarSign, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { mockUsers, mockManualRecharges } from '../data/mockData';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

const QUICK_AMOUNTS = [10, 25, 50, 100, 500];
const USD_TO_CDF = 2500;

const RECHARGE_REASONS = [
  { value: 'promotion', label: 'Promotion' },
  { value: 'loyalty', label: 'Bonus fidélité' },
  { value: 'compensation', label: 'Compensation erreur' },
  { value: 'refund', label: 'Remboursement' },
  { value: 'gift', label: 'Cadeau admin' },
  { value: 'other', label: 'Autre' },
];

export function ManualRechargePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CDF'>('USD');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  const convertedAmount = currency === 'USD' 
    ? parseFloat(amount) || 0
    : (parseFloat(amount) || 0) / USD_TO_CDF;

  const newBalance = selectedUser 
    ? selectedUser.balance + convertedAmount
    : 0;

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setStep(2);
  };

  const handleAmountContinue = () => {
    if (parseFloat(amount) > 0) {
      setStep(3);
    }
  };

  const handleConfirmRecharge = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Recharge effectuée avec succès !', {
      description: `${selectedUser.username} a reçu ${convertedAmount.toFixed(2)} USD`,
    });

    // Reset form
    setStep(1);
    setSelectedUser(null);
    setAmount('');
    setReason('');
    setNote('');
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Sélection du joueur' },
              { num: 2, label: 'Montant' },
              { num: 3, label: 'Confirmation' },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-3 ${idx > 0 ? 'ml-4' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s.num
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={`text-sm font-medium ${
                    step >= s.num ? 'text-white' : 'text-zinc-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`h-0.5 w-24 mx-4 ${
                    step > s.num ? 'bg-purple-600' : 'bg-zinc-800'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: User Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">🔍 Rechercher un joueur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    placeholder="Nom d'utilisateur ou numéro de téléphone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {searchQuery && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">
                      {filteredUsers.length} résultat(s) trouvé(s)
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="w-full p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{user.username}</p>
                              <p className="text-sm text-zinc-400">{user.phone}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-purple-400">
                                Solde actuel: {user.balance.toFixed(2)} USD
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {user.gamesPlayed} parties
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Amount */}
        {step === 2 && selectedUser && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Recharge pour: {selectedUser.username}
                </CardTitle>
                <p className="text-sm text-zinc-400">
                  Solde actuel: <span className="text-purple-400 font-medium">{selectedUser.balance.toFixed(2)} USD</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-white">Montant à ajouter</Label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 bg-zinc-800 border-zinc-700 text-white text-xl font-bold"
                    />
                    <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                      <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CDF">CDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {currency === 'CDF' && amount && (
                    <p className="text-sm text-zinc-400">
                      ≈ {convertedAmount.toFixed(2)} USD
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-white mb-2 block">Montants rapides</Label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        variant="outline"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="border-zinc-700 text-white hover:bg-zinc-800"
                      >
                        +{quickAmount}$
                      </Button>
                    ))}
                  </div>
                </div>

                {convertedAmount > 0 && (
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Nouveau solde après recharge:</span>
                        <span className="text-2xl font-bold text-green-500">
                          💰 {newBalance.toFixed(2)} USD
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleAmountContinue}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700"
                  >
                    Continuer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && selectedUser && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">⚠️ Confirmation de recharge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-zinc-800 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Joueur:</span>
                    <span className="text-white font-medium">
                      {selectedUser.username} (ID: {selectedUser.id})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Montant:</span>
                    <span className="text-green-500 font-bold">
                      +{convertedAmount.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Nouveau solde:</span>
                    <span className="text-purple-400 font-bold">
                      {newBalance.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Raison de la recharge *</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Sélectionner une raison" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {RECHARGE_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Note additionnelle (optionnelle)</Label>
                  <Textarea
                    placeholder="Ajouter une note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    disabled={isProcessing}
                    className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleConfirmRecharge}
                    disabled={!reason || isProcessing}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirmer la recharge
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recharge History */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Historique des recharges manuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">Date</TableHead>
                <TableHead className="text-zinc-400">Joueur</TableHead>
                <TableHead className="text-zinc-400">Montant</TableHead>
                <TableHead className="text-zinc-400">Raison</TableHead>
                <TableHead className="text-zinc-400">Admin</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockManualRecharges.map((recharge) => (
                <TableRow key={recharge.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="text-white">{recharge.date}</TableCell>
                  <TableCell className="text-white font-medium">{recharge.username}</TableCell>
                  <TableCell className="text-green-500 font-medium">
                    +{recharge.amount} {recharge.currency}
                  </TableCell>
                  <TableCell className="text-zinc-400 capitalize">{recharge.reason}</TableCell>
                  <TableCell className="text-zinc-400">{recharge.admin}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/20 text-green-500">✅ Complété</Badge>
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