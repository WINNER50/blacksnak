import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Trophy, Users, DollarSign, Clock, Play, Edit, Square, Trash2 } from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { getTournaments, updateTournamentStatus, deleteTournament, getTournamentLeaderboard } from '../../services/tournamentService';
import { CreateTournamentModal } from '../components/CreateTournamentModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await getTournaments();
      if (res.success) {
        setTournaments(res.data || []);
      } else {
        toast.error(res.error || 'Erreur lors du chargement des tournois');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (tournament: any) => {
    setSelectedTournament(tournament);
    setLoadingLeaderboard(true);
    try {
      const res = await getTournamentLeaderboard(tournament.id);
      if (res.success) {
        setLeaderboard(res.data || []);
      } else {
        toast.error('Erreur lors du chargement du classement');
      }
    } catch (error) {
      toast.error('Erreur réseau');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await updateTournamentStatus(id, status);
      if (res.success) {
        toast.success('Statut mis à jour');
        fetchTournaments();
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteTournament = async (id: number, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le tournoi "${name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const res = await deleteTournament(id);
      if (res.success) {
        toast.success('Tournoi supprimé avec succès');
        fetchTournaments();
      } else {
        toast.error(res.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Tournament Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Tournois</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Créer un nouveau tournoi
        </Button>
      </div>

      <CreateTournamentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTournaments}
      />

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-zinc-500">
            Chargement des tournois...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500">
            Aucun tournoi trouvé. Commencez par en créer un !
          </div>
        ) : tournaments.map((tournament) => {
          const daysLeft = differenceInDays(new Date(tournament.end_date), new Date());
          const hoursLeft = differenceInHours(new Date(tournament.end_date), new Date()) % 24;
          const percentage = tournament.max_participants > 0 ? (tournament.current_participants / tournament.max_participants) * 100 : 0;

          return (
            <Card key={tournament.id} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-xl mb-2">
                      🏆 {tournament.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge
                        variant={tournament.status === 'active' ? 'default' : 'secondary'}
                        className={tournament.status === 'active' ? 'bg-green-500/20 text-green-500' : ''}
                      >
                        {tournament.status === 'active' ? 'Actif' :
                          tournament.status === 'upcoming' ? 'À venir' :
                            tournament.status === 'completed' ? 'Terminé' : 'Annulé'}
                      </Badge>
                      <Badge variant="outline" className="text-zinc-400 capitalize">
                        {tournament.game_mode}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {tournament.description && (
                  <p className="text-sm text-zinc-400 line-clamp-2">{tournament.description}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Prize Pool</p>
                      <p className="text-lg font-bold text-green-500">{tournament.prize_pool_usd} USD</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Entrée</p>
                      <p className="text-lg font-bold text-blue-500">{tournament.entry_fee_usd} USD</p>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-zinc-400">Participants</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {tournament.current_participants || 0}/{tournament.max_participants}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Time */}
                {tournament.status === 'active' && (
                  <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Se termine dans</p>
                      <p className="text-sm font-medium text-white">
                        {daysLeft > 0 ? `${daysLeft}j ${hoursLeft}h` : hoursLeft > 0 ? `${hoursLeft}h` : 'Bientôt fini'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                    onClick={() => fetchLeaderboard(tournament)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Voir classement
                  </Button>
                  <Button variant="outline" size="icon" className="border-zinc-700 text-white hover:bg-zinc-800">
                    <Edit className="w-4 h-4" />
                  </Button>
                  {tournament.status === 'active' && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-zinc-700 text-red-400 hover:bg-zinc-800"
                      onClick={() => handleUpdateStatus(tournament.id, 'cancelled')}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  )}
                  {tournament.status === 'upcoming' && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-zinc-700 text-green-400 hover:bg-zinc-800"
                      onClick={() => handleUpdateStatus(tournament.id, 'active')}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-zinc-700 text-red-500 hover:bg-zinc-800 hover:text-red-400"
                    onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Classement */}
      <Dialog open={!!selectedTournament} onOpenChange={() => setSelectedTournament(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Classement : {selectedTournament?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {loadingLeaderboard ? (
              <p className="text-center py-10 text-zinc-500">Chargement du classement...</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-center py-10 text-zinc-500">Aucun participant pour le moment.</p>
            ) : (
              leaderboard.map((user, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/50' :
                      index === 1 ? 'bg-zinc-400/10 border-zinc-400/50' :
                        index === 2 ? 'bg-orange-600/10 border-orange-600/50' :
                          'bg-zinc-800/50 border-zinc-700/50'
                    }`}
                >
                  <div className="w-8 text-lg font-bold text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full border border-zinc-700"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{user.name || user.username}</p>
                    <p className="text-xs text-zinc-400">@{user.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-purple-400">{user.score || 0}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Points</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={() => setSelectedTournament(null)}
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}