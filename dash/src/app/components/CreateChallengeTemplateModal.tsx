import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trophy, Clock, Target, Shield, Info, Loader2 } from 'lucide-react';
import { createChallengeTemplate } from '../../services/challengeService';
import { toast } from 'sonner';

interface CreateChallengeTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateChallengeTemplateModal({ isOpen, onClose, onSuccess }: CreateChallengeTemplateModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        entry_fee_usd: '',
        prize_usd: '',
        target_score: '',
        time_limit_seconds: '',
        difficulty: 'medium'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await createChallengeTemplate({
                ...formData,
                entry_fee_usd: parseFloat(formData.entry_fee_usd),
                prize_usd: parseFloat(formData.prize_usd),
                target_score: parseInt(formData.target_score),
                time_limit_seconds: parseInt(formData.time_limit_seconds)
            });

            if (response.success) {
                toast.success('Template créé avec succès');
                onSuccess();
                onClose();
                setFormData({
                    title: '',
                    description: '',
                    entry_fee_usd: '',
                    prize_usd: '',
                    target_score: '',
                    time_limit_seconds: '',
                    difficulty: 'medium'
                });
            } else {
                toast.error(response.message || 'Erreur lors de la création');
            }
        } catch (error) {
            toast.error('Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Trophy className="w-6 h-6 text-purple-500" />
                        Nouveau Défi Perso
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre du défi</Label>
                        <Input
                            id="title"
                            placeholder="Ex: Défi Vitesse"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="bg-zinc-800 border-zinc-700"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Objectif)</Label>
                        <Textarea
                            id="description"
                            placeholder="Ex: Atteignez 100 points en 60s..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 resize-none"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="entry_fee">Frais d'entrée (USD)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                <Input
                                    id="entry_fee"
                                    type="number"
                                    step="0.01"
                                    placeholder="1.00"
                                    value={formData.entry_fee_usd}
                                    onChange={(e) => setFormData({ ...formData, entry_fee_usd: e.target.value })}
                                    className="bg-zinc-800 border-zinc-700 pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prize">Gain (USD)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                <Input
                                    id="prize"
                                    type="number"
                                    step="0.01"
                                    placeholder="1.80"
                                    value={formData.prize_usd}
                                    onChange={(e) => setFormData({ ...formData, prize_usd: e.target.value })}
                                    className="bg-zinc-800 border-zinc-700 pl-9"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="target_score">Score cible</Label>
                            <div className="relative">
                                <Target className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                <Input
                                    id="target_score"
                                    type="number"
                                    placeholder="100"
                                    value={formData.target_score}
                                    onChange={(e) => setFormData({ ...formData, target_score: e.target.value })}
                                    className="bg-zinc-800 border-zinc-700 pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time_limit">Temps limite (sec)</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                <Input
                                    id="time_limit"
                                    type="number"
                                    placeholder="60"
                                    value={formData.time_limit_seconds}
                                    onChange={(e) => setFormData({ ...formData, time_limit_seconds: e.target.value })}
                                    className="bg-zinc-800 border-zinc-700 pl-9"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulté</Label>
                        <Select
                            value={formData.difficulty}
                            onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                        >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                <SelectValue placeholder="Choisir la difficulté" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="easy">Facile</SelectItem>
                                <SelectItem value="medium">Moyen</SelectItem>
                                <SelectItem value="hard">Difficile</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white border-0 hover:opacity-90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                'Créer le template'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DollarSign(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}
