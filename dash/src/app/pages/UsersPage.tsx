import { useState, useEffect } from 'react';
import { Eye, Wallet, Ban, Filter, Download, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { getUsers } from '../../services/userService';

// Types pour les utilisateurs
interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  balance_usd?: number;
  total_earnings?: number;
  total_games_played?: number;
  total_wins?: number;
  total_losses?: number;
  win_rate?: number;
  highest_score?: number;
  level?: string;
  avatar_url?: string;
  country?: string;
  status: 'active' | 'suspended' | 'banned';
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

function UserDetailsDialog({ user }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails du joueur</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Informations complètes et historique
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="bg-zinc-800">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">ID</p>
                <p className="font-medium">{user.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Username</p>
                <p className="font-medium">{user.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Téléphone</p>
                <p className="font-medium">{user.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Statut</p>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                  {user.status === 'active' ? 'Actif' : 'Banni'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Solde actuel</p>
                <p className="font-medium text-purple-400">{user.balance_usd ? parseFloat(user.balance_usd).toFixed(2) : '0.00'} USD</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Gains totaux</p>
                <p className="font-medium text-green-500">{user.total_earnings ? parseFloat(user.total_earnings).toFixed(2) : '0.00'} USD</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Inscrit le</p>
                <p className="font-medium">{user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400">Parties jouées</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{user.total_games_played || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400">Meilleur score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-400">{user.highest_score || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{user.win_rate ? parseFloat(user.win_rate).toFixed(1) : '0.0'}%</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-zinc-400">Total Victoires</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">{user.total_wins || 0}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <div className="space-y-2">
              <div className="p-3 bg-zinc-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Tournoi gagné</p>
                    <p className="text-xs text-zinc-400">21/02/2026</p>
                  </div>
                  <p className="text-green-500 font-medium">+150 USD</p>
                </div>
              </div>
              <div className="p-3 bg-zinc-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Dépôt</p>
                    <p className="text-xs text-zinc-400">20/02/2026</p>
                  </div>
                  <p className="text-blue-500 font-medium">+100 USD</p>
                </div>
              </div>
              <div className="p-3 bg-zinc-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Défi perdu</p>
                    <p className="text-xs text-zinc-400">19/02/2026</p>
                  </div>
                  <p className="text-red-500 font-medium">-50 USD</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getUsers();
        if (result.success) {
          setUsers(result.data || []);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Rechercher par nom ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-zinc-800 border-zinc-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="banned">Bannis</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Créer un utilisateur
            </Button>
            <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">
            Utilisateurs ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">ID</TableHead>
                <TableHead className="text-zinc-400">Username</TableHead>
                <TableHead className="text-zinc-400">Téléphone</TableHead>
                <TableHead className="text-zinc-400">Solde</TableHead>
                <TableHead className="text-zinc-400">Gains totaux</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="text-white font-medium">{user.id}</TableCell>
                  <TableCell className="text-white">{user.username}</TableCell>
                  <TableCell className="text-zinc-400">{user.phone}</TableCell>
                  <TableCell className="text-purple-400 font-medium">
                    {user.balance_usd ? parseFloat(user.balance_usd).toFixed(2) : '0.00'} USD
                  </TableCell>
                  <TableCell className="text-green-500 font-medium">
                    {user.total_earnings ? parseFloat(user.total_earnings).toFixed(2) : '0.00'} USD
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === 'active' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {user.status === 'active' ? 'Actif' : 'Banni'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <UserDetailsDialog user={user} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Wallet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={user.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
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