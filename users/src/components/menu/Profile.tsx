import React, { useState, useRef } from 'react';
import { Camera, Save } from 'lucide-react';
import apiService from '../../frontend/services/api';

interface ProfileProps {
  user: any;
  onUpdate: () => void;
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  // Utiliser les bons champs du backend (username, avatar_url, phone)
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`);
  const [isUploading, setIsUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return <div className="text-white p-4">Chargement du profil...</div>;
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La taille de l\'image ne doit pas dépasser 5 MB.');
      return;
    }

    // Aperçu local immédiat
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
    setIsUploading(true);

    try {
      // Envoyer au backend via FormData pour upload Cloudinary
      const formData = new FormData();
      formData.append('avatar', file);

      const token = apiService.getToken();
      const response = await fetch(`${apiService.baseURL}/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur upload');
      }

      // Mettre à jour avec l'URL Cloudinary définitive
      setAvatarUrl(data.avatar_url);
      onUpdate();
      alert('Photo de profil mise à jour !');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'upload de l\'image');
      // Revenir à l'avatar précédent en cas d'erreur
      setAvatarUrl(user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiService.updateSettings({
        name,
        phone,
      });
      onUpdate();
      setEditing(false);
      alert('Profil mis à jour !');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-black via-purple-950 to-black p-2 sm:p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Mon Profil</h1>

        <div className="bg-zinc-900 rounded-lg border border-purple-700 p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Photo de profil */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={user.username}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-purple-500 object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                  <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={handlePhotoClick}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-1.5 sm:p-2 rounded-full transition disabled:opacity-50"
              >
                <Camera size={16} className="sm:w-5 sm:h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2">@{user.username}</p>
            {isUploading && <p className="text-purple-400 text-xs mt-1">Upload en cours...</p>}
          </div>

          {/* Formulaire */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setEditing(true);
                }}
                className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Nom d'utilisateur</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full bg-zinc-800 text-zinc-500 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 cursor-not-allowed text-sm sm:text-base"
              />
              <p className="text-zinc-500 text-xs mt-1">Le nom d'utilisateur ne peut pas être modifié</p>
            </div>

            <div>
              <label className="text-purple-400 text-xs sm:text-sm mb-2 block">Numéro de téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setEditing(true);
                }}
                className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-zinc-700 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition text-sm sm:text-base"
              />
            </div>

            {editing && (
              <button
                onClick={handleSave}
                disabled={loading}
                className={`w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save size={18} className="sm:w-5 sm:h-5" />
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-zinc-900 border border-purple-700 rounded-lg p-3 sm:p-4">
            <p className="text-purple-400 text-xs sm:text-sm mb-1">Membre depuis</p>
            <p className="text-white text-sm sm:text-lg font-semibold">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
            </p>
          </div>
          <div className="bg-zinc-900 border border-purple-700 rounded-lg p-3 sm:p-4">
            <p className="text-purple-400 text-xs sm:text-sm mb-1">Solde</p>
            <p className="text-white text-sm sm:text-lg font-semibold">{user.balance_usd || 0} $</p>
          </div>
        </div>
      </div>
    </div>
  );
}