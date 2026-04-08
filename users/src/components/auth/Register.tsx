import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import apiService from '../../frontend/services/api';

interface RegisterProps {
  onBack: () => void;
  onLogin: (user: any) => void;
}

export default function Register({ onBack, onLogin }: RegisterProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setConfirmPassword = (val: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: val }));
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.name.trim() || !formData.phone.trim() || !formData.username.trim()) {
        setError('Tous les champs sont requis');
        return;
      }
      if (formData.phone.length < 9) {
        setError('Le numéro de téléphone doit contenir au moins 9 chiffres');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      setLoading(true);
      try {
        const response = await apiService.register(formData.name, formData.username, formData.phone, formData.password);
        onLogin(response.user);
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue lors de la création du compte');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    } else {
      onBack();
    }
  };

  return (
    <div>
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition mb-6"
      >
        <ArrowLeft size={20} />
        Retour
      </button>

      {/* Indicateur d'étapes */}
      <div className="flex gap-2 mb-8">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-gradient-to-r from-purple-600 to-blue-500' : 'bg-zinc-700'
              }`}
          />
        ))}
      </div>

      <form onSubmit={handleNext} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">Informations personnelles</h2>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Nom complet</label>
              <input
                type="text"
                placeholder="Ex: Jean Dupont"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Numéro de téléphone</label>
              <input
                type="tel"
                placeholder="+243 XXX XXX XXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Nom d'utilisateur</label>
              <input
                type="text"
                placeholder="pseudo_unique"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition"
                required
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">Sécurité</h2>
            <p className="text-zinc-400 mb-6">Choisissez un mot de passe solide pour votre compte.</p>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition pr-12"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe"
                value={formData.confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition pr-12 ${formData.confirmPassword
                  ? (formData.password === formData.confirmPassword
                    ? 'border-green-500 focus:border-green-600 focus:ring-green-600/50'
                    : 'border-red-500 focus:border-red-600 focus:ring-red-600/50')
                  : 'border-zinc-700 focus:border-purple-600 focus:ring-purple-600/50'
                  }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                ✓ Les mots de passe correspondent
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed transform-none' : ''
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Création du compte...</span>
            </>
          ) : (
            <span>{step === 2 ? 'Créer mon compte' : 'Continuer'}</span>
          )}
        </button>
      </form>
    </div>
  );
}
