import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Award, Loader2 } from 'lucide-react';
import { mockRevenueData, mockRegistrationData } from '../data/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useState, useEffect } from 'react';
import { getAdvancedStats } from '../../services/statsService';

interface AdvancedStats {
  arr: number;
  arrChange: number;
  ltv: number;
  ltvChange: number;
  conversionRate: number;
  conversionChange: number;
  retentionD7: number;
  retentionChange: number;
  revenueChart: any[];
  userChart: any[];
  topWinners: any[];
  topDepositors: any[];
}

export function StatisticsPage() {
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getAdvancedStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching advanced stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const renderChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'} text-sm mt-1`}>
        <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} />
        <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Statistiques avancées</h2>
          <p className="text-zinc-400 mt-1">Analyse des performances de l'application</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-800 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="3m">3 derniers mois</SelectItem>
            <SelectItem value="6m">6 derniers mois</SelectItem>
            <SelectItem value="1y">1 an</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">ARR (Projected Annual)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">${stats?.arr.toLocaleString()}</p>
            {renderChange(stats?.arrChange || 0)}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">LTV moyen par joueur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">${stats?.ltv.toFixed(2)}</p>
            {renderChange(stats?.ltvChange || 0)}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Taux de rétention D7</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats?.retentionD7}%</p>
            {renderChange(stats?.retentionChange || 0)}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats?.conversionRate.toFixed(1)}%</p>
            {renderChange(stats?.conversionChange || 0)}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Croissance du chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.revenueChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" style={{ fontSize: '10px' }} />
                <YAxis stroke="#a1a1aa" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Croissance des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.userChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" style={{ fontSize: '10px' }} />
                <YAxis stroke="#a1a1aa" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Winnings */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top 10 - Gains totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topWinners.map((player) => (
                <div key={player.rank} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${player.rank === 1 ? 'bg-yellow-500 text-black' :
                      player.rank === 2 ? 'bg-zinc-400 text-black' :
                        player.rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-zinc-700 text-white'
                      }`}>
                      {player.rank}
                    </div>
                    <span className="text-white font-medium">{player.name}</span>
                  </div>
                  <span className="text-green-500 font-bold">{player.amount.toLocaleString()} USD</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top by Deposits */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Top 10 - Dépôts totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topDepositors.map((player) => (
                <div key={player.rank} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${player.rank === 1 ? 'bg-yellow-500 text-black' :
                      player.rank === 2 ? 'bg-zinc-400 text-black' :
                        player.rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-zinc-700 text-white'
                      }`}>
                      {player.rank}
                    </div>
                    <span className="text-white font-medium">{player.name}</span>
                  </div>
                  <span className="text-blue-500 font-bold">{player.amount.toLocaleString()} USD</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}