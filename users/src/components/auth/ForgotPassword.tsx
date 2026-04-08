import React, { useState } from 'react';
// @ts-ignore
import apiService from '../../frontend/services/api';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [username, setUsername] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.forgotPassword(phone);
      setUsername(response.username);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.verifyResetCode(username, code);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Code de validation incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await apiService.resetPassword(username, newPassword, code);
      alert('Mot de passe modifié avec succès !');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
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
        disabled={loading}
        className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition mb-6 disabled:opacity-50"
      >
        <ArrowLeft size={20} />
        Retour
      </button>

      {/* Indicateur d'étapes */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-gradient-to-r from-purple-600 to-blue-500' : 'bg-zinc-700'
              }`}
          />
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-2">Récupération du compte</h2>
          <p className="text-zinc-400 mb-6">Entrez votre numéro de téléphone</p>

          <input
            type="tel"
            placeholder="+243 XXX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition"
            autoFocus
            required
            disabled={loading}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Envoyer le code'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleCodeSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-2">Code de validation</h2>
          <p className="text-zinc-400 mb-6">Entrez le code reçu sur WhatsApp</p>

          <input
            type="text"
            placeholder="1234567"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 7))}
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-center text-2xl tracking-widest"
            maxLength={7}
            autoFocus
            required
            disabled={loading}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Vérifier'}
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-2">Nouveau mot de passe</h2>
          <p className="text-zinc-400 mb-6">Choisissez un nouveau mot de passe</p>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition pr-12"
              autoFocus
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition pr-12"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
              disabled={loading}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Modifier le mot de passe'}
          </button>
        </form>
      )}
    </div>
  );
}
