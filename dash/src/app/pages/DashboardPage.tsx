import { useState, useEffect } from 'react';
import { Users, DollarSign, Trophy, Gamepad2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockRevenueData, mockRegistrationData, mockTransactionDistribution, mockTournaments } from '../data/mockData';
import { format } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { getGlobalStats, getRecentTransactions, getRecentUsers, getRevenue7Days, getRevenue30Days } from '../../services/statsService';

const COLORS = ['#7c3aed', '#3b82f6'];

function StatCard({ title, value, change, icon: Icon, trend, loading }: any) {
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
        ) : (
          <>
            <div className="text-2xl font-bold text-white">{value}</div>
            {change !== undefined && change !== 0 && (
              <div className={`flex items-center gap-1 text-sm mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(change)} (24h)</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [registrationData, setRegistrationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, transRes, usersRes, revRes, regRes] = await Promise.all([
        getGlobalStats(),
        getRecentTransactions(),
        getRecentUsers(),
        getRevenue30Days(),
        getRevenue7Days()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (transRes.success) setTransactions(transRes.data);
      if (usersRes.success) setRecentUsers(usersRes.data);

      if (revRes.success) {
        setRevenueData(revRes.data.map((d: any) => ({
          date: format(new Date(d.date), 'dd/MM'),
          revenue: d.revenue || d.total || 0,
          loss: d.loss || 0
        })));
      }

      if (regRes.success) {
        setRegistrationData(regRes.data.map((d: any) => ({
          date: format(new Date(d.date), 'dd/MM'),
          amount: d.total || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Joueurs"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          change={stats?.usersChange}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Revenus Totaux"
          value={`${stats?.totalRevenue?.toLocaleString() || '0'} USD`}
          change={stats?.revenueChange}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Tournois Actifs"
          value={`${stats?.activeTournaments || '0'} / ${stats?.totalTournaments || '0'}`}
          icon={Trophy}
          loading={loading}
        />
        <StatCard
          title="Parties Aujourd'hui"
          value={stats?.todayGames?.toLocaleString() || '0'}
          change={stats?.gamesChange}
          icon={Gamepad2}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Revenus sur 30 jours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" style={{ fontSize: '12px' }} />
                <YAxis stroke="#a1a1aa" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }} />
                <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Chart (Revenue 7 days) */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Performance Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" style={{ fontSize: '12px' }} />
                <YAxis stroke="#a1a1aa" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Distribution */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Répartition des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mockTransactionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockTransactionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Transactions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Aucune transaction récente</p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${transaction.status === 'completed' ? 'bg-green-500' :
                        transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      <div>
                        <p className="text-sm font-medium text-white">{transaction.username}</p>
                        <p className="text-xs text-zinc-400">
                          {transaction.created_at && !isNaN(new Date(transaction.created_at).getTime()) ? (
                            format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')
                          ) : (
                            'Date inconnue'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${['deposit', 'tournament_prize', 'challenge_prize', 'admin_recharge'].includes(transaction.type) ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {['deposit', 'tournament_prize', 'challenge_prize', 'admin_recharge'].includes(transaction.type) ? '+' : '-'}{parseFloat(transaction.amount_usd || transaction.amount).toFixed(2)} USD
                      </p>
                      <Badge variant="outline" className="text-xs uppercase">
                        {transaction.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users & Tournaments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Derniers joueurs inscrits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : recentUsers.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Aucun joueur inscrit</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-zinc-400">{user.phone || user.email || 'Pas de contact'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-purple-400">{parseFloat(user.balance_usd).toFixed(2)} USD</p>
                      <p className="text-xs text-zinc-400">{user.total_games_played} parties</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Tournaments */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Tournois actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : !stats?.activeTournamentsData || stats.activeTournamentsData.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Aucun tournoi actif</p>
              ) : (
                stats.activeTournamentsData.map((tournament: any) => (
                  <div key={tournament.id} className="p-3 bg-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">{tournament.name}</p>
                      <Badge className="bg-green-500/20 text-green-500">Actif</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Prize: {tournament.prize_pool_usd} USD</span>
                      <span>{tournament.current_participants}/{tournament.max_participants} joueurs</span>
                    </div>
                    <div className="mt-2 w-full bg-zinc-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full"
                        style={{ width: `${(tournament.current_participants / tournament.max_participants) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}