import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Eye, Swords, Plus, Trash2, Trophy, Clock, Target, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { format } from 'date-fns';
import { getChallengeTemplates, deleteChallengeTemplate, ChallengeTemplate, getPvpChallenges, getChallengeStats } from '../../services/challengeService';
import { CreateChallengeTemplateModal } from '../components/CreateChallengeTemplateModal';
import { toast } from 'sonner';

export function ChallengesPage() {
  const [activeTab, setActiveTab] = useState('pvp');
  const [templates, setTemplates] = useState<ChallengeTemplate[]>([]);
  const [pvpChallenges, setPvpChallenges] = useState<any[]>([]);
  const [stats, setStats] = useState({ waiting: 0, in_progress: 0, finished: 0 });
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingPvp, setLoadingPvp] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    if (activeTab === 'solo') {
      setLoadingTemplates(true);
      try {
        const response = await getChallengeTemplates();
        if (response.success) {
          setTemplates(response.data || []);
        }
      } finally {
        setLoadingTemplates(false);
      }
    } else {
      setLoadingPvp(true);
      try {
        const [pvpRes, statsRes] = await Promise.all([
          getPvpChallenges(),
          getChallengeStats()
        ]);
        if (pvpRes.success) setPvpChallenges(pvpRes.data || []);
        if (statsRes.success) setStats(statsRes.data);
      } finally {
        setLoadingPvp(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce template ?')) return;

    try {
      const response = await deleteChallengeTemplate(id);
      if (response.success) {
        toast.success('Template supprimé');
        fetchData();
      } else {
        toast.error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-500/20 text-green-500',
      medium: 'bg-blue-500/20 text-blue-500',
      hard: 'bg-orange-500/20 text-orange-500',
      expert: 'bg-red-500/20 text-red-500'
    };
    return (
      <Badge variant="outline" className={`capitalize ${colors[difficulty] || ''}`}>
        {difficulty}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">Défis</h2>
        {activeTab === 'solo' && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un template
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="pvp" className="text-zinc-400 data-[state=active]:text-white">Défis PvP</TabsTrigger>
          <TabsTrigger value="solo" className="text-zinc-400 data-[state=active]:text-white">Défis Solo (Templates)</TabsTrigger>
        </TabsList>

        <TabsContent value="pvp" className="space-y-6 mt-6">
          {/* PvP Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">En attente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-500">
                  {stats.waiting}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">En cours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-500">
                  {stats.in_progress}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-zinc-400">Terminés</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">
                  {stats.finished}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PvP Table */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Journal des défis PvP</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPvp ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableHead className="text-zinc-400">ID</TableHead>
                      <TableHead className="text-zinc-400">Créateur</TableHead>
                      <TableHead className="text-zinc-400">Adversaire</TableHead>
                      <TableHead className="text-zinc-400">Mise</TableHead>
                      <TableHead className="text-zinc-400">Scores</TableHead>
                      <TableHead className="text-zinc-400">Statut</TableHead>
                      <TableHead className="text-zinc-400">Date</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pvpChallenges.map((challenge) => (
                      <TableRow key={challenge.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-white font-medium">{challenge.id}</TableCell>
                        <TableCell className="text-white">{challenge.creator_name}</TableCell>
                        <TableCell className="text-zinc-400">
                          {challenge.opponent_name || <span className="italic">En attente</span>}
                        </TableCell>
                        <TableCell className="text-purple-400 font-bold">
                          {challenge.bet_amount_usd} USD
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {challenge.creator_score ?? '-'}
                            </Badge>
                            <Swords className="w-3 h-3 text-zinc-500" />
                            <Badge variant="outline" className="text-xs">
                              {challenge.opponent_score ?? '-'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              challenge.status === 'completed' ? 'default' :
                                ['accepted', 'in_progress'].includes(challenge.status) ? 'secondary' : 'outline'
                            }
                            className={
                              challenge.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                ['accepted', 'in_progress'].includes(challenge.status) ? 'bg-blue-500/20 text-blue-500' :
                                  'text-yellow-500'
                            }
                          >
                            {challenge.status === 'completed' ? 'Terminé' :
                              ['accepted', 'in_progress'].includes(challenge.status) ? 'En cours' :
                                challenge.status === 'declined' ? 'Refusé' :
                                  challenge.status === 'cancelled' ? 'Annulé' : 'En attente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm">
                          {format(new Date(challenge.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pvpChallenges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-zinc-500">
                          Aucun défi PvP trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solo" className="space-y-6 mt-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Templates de Défis Solo</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableHead className="text-zinc-400">ID</TableHead>
                      <TableHead className="text-zinc-400">Titre</TableHead>
                      <TableHead className="text-zinc-400">Entrée</TableHead>
                      <TableHead className="text-zinc-400">Gain</TableHead>
                      <TableHead className="text-zinc-400">Score/Temps</TableHead>
                      <TableHead className="text-zinc-400">Difficulté</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-white font-medium">#{template.id}</TableCell>
                        <TableCell className="text-white">
                          <div>
                            <p className="font-medium">{template.title}</p>
                            <p className="text-xs text-zinc-400 truncate max-w-[200px]">{template.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300 font-medium">
                          {parseFloat(template.entry_fee_usd.toString()).toFixed(2)} USD
                        </TableCell>
                        <TableCell className="text-green-400 font-bold">
                          {parseFloat(template.prize_usd.toString()).toFixed(2)} USD
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" /> {template.target_score}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {template.time_limit_seconds}s
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getDifficultyBadge(template.difficulty)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {templates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                          Aucun template de défi trouvé
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

      <CreateChallengeTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}