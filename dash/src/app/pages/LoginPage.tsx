import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { login } from '../../services/authService';
import { Lock, Mail, Loader2 } from 'lucide-react';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        setIsLoading(true);
        try {
            const response = await login(email, password);

            if (response.success) {
                toast.success('Connexion réussie');
                navigate('/');
            } else {
                toast.error(response.message || 'Identifiants incorrects');
            }
        } catch (error) {
            toast.error('Une erreur est survenue lors de la connexion');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-zinc-900 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_50%)]" />

            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl relative z-10">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center font-bold text-white">Connexion Admin</CardTitle>
                    <CardDescription className="text-center text-zinc-400">
                        Entrez vos identifiants pour accéder au dashboard
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="winnerngereza4@gmail.com"
                                    className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 transition-colors"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" title="password" className="text-zinc-300">Mot de passe</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 transition-colors"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-semibold h-11"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connexion en cours...
                                </>
                            ) : (
                                'Se connecter'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="fixed bottom-4 text-zinc-600 text-sm">
                Blacksnack Admin Platform &copy; 2026
            </div>
        </div>
    );
};
