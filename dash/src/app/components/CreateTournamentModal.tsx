import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trophy, Calendar, Users, DollarSign, Info } from 'lucide-react';
import { createTournament } from '../../services/tournamentService';
import { toast } from 'sonner';

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateTournamentModal({ isOpen, onClose, onSuccess }: CreateTournamentModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        entry_fee_usd: '1',
        prize_pool_usd: '100',
        max_participants: '100',
        start_date: '',
        end_date: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const entryFee = parseFloat(formData.entry_fee_usd);
        const maxParts = parseInt(formData.max_participants);
        const prizePool = parseFloat(formData.prize_pool_usd);

        try {
            const res = await createTournament({
                ...formData,
                entry_fee_usd: entryFee,
                prize_pool_usd: prizePool,
                max_participants: maxParts,
                description: `Tournoi ${formData.name}`,
                game_mode: 'classic',
                rules: 'Règles standards Blacksnack'
            });

            if (res.success) {
                toast.success('Tournoi créé avec succès !');
                onSuccess();
                onClose();
                setFormData({
                    name: '',
                    entry_fee_usd: '1',
                    prize_pool_usd: '100',
                    max_participants: '100',
                    start_date: '',
                    end_date: ''
                });
            } else {
                toast.error(res.error || 'Une erreur est survenue');
            }
        } catch (error: any) {
            toast.error('Une erreur est survenue lors de la création');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-purple-500" />
                        Nouveau Tournoi
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Remplissez les informations essentielles.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Nom */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom du tournoi</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Tournoi Flash"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="bg-zinc-800 border-zinc-700"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Entry Fee */}
                        <div className="space-y-2">
                            <Label htmlFor="entry_fee_usd" className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-blue-400" />
                                Frais (USD)
                            </Label>
                            <Input
                                id="entry_fee_usd"
                                name="entry_fee_usd"
                                type="number"
                                step="0.01"
                                value={formData.entry_fee_usd}
                                onChange={handleChange}
                                required
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>

                        {/* Prize Pool */}
                        <div className="space-y-2">
                            <Label htmlFor="prize_pool_usd" className="flex items-center gap-2 text-green-400">
                                <Trophy className="w-4 h-4" />
                                Gain (USD)
                            </Label>
                            <Input
                                id="prize_pool_usd"
                                name="prize_pool_usd"
                                type="number"
                                step="0.01"
                                value={formData.prize_pool_usd}
                                onChange={handleChange}
                                required
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Max Participants */}
                        <div className="space-y-2">
                            <Label htmlFor="max_participants" className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-400" />
                                Joueurs Max
                            </Label>
                            <Input
                                id="max_participants"
                                name="max_participants"
                                type="number"
                                value={formData.max_participants}
                                onChange={handleChange}
                                required
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>

                        {/* Info Note */}
                        <div className="flex items-end pb-1">
                            <p className="text-[10px] text-zinc-500 italic">
                                Note: Le gain est manuel.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label htmlFor="start_date" className="flex items-center gap-2 text-xs">
                                <Calendar className="w-4 h-4 text-green-400" />
                                Début
                            </Label>
                            <Input
                                id="start_date"
                                name="start_date"
                                type="datetime-local"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                                className="bg-zinc-800 border-zinc-700 text-xs"
                            />
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <Label htmlFor="end_date" className="flex items-center gap-2 text-xs">
                                <Calendar className="w-4 h-4 text-red-400" />
                                Fin
                            </Label>
                            <Input
                                id="end_date"
                                name="end_date"
                                type="datetime-local"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                                className="bg-zinc-800 border-zinc-700 text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                        >
                            {loading ? 'Création...' : 'Créer'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
