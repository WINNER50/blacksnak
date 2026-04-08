import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Trophy } from 'lucide-react';

/**
 * Exemple de composant pour afficher et rejoindre des tournois
 * Démontre l'utilisation de l'API pour récupérer et manipuler des données
 */
export default function ExampleTournamentsComponent() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger les tournois au montage du composant
  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      // Appel API pour récupérer les tournois
      const data = await apiService.getTournaments();
      setTournaments(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur de chargement des tournois');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId) => {
    try {
      // Appel API pour rejoindre un tournoi
      await apiService.joinTournament(tournamentId, 'USD');
      alert('Inscription au tournoi réussie !');
      
      // Recharger la liste des tournois
      await loadTournaments();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'inscription');
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white py-8">
        <p>Chargement des tournois...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-white text-2xl font-bold mb-6">Tournois disponibles</h2>

      {tournaments.length === 0 ? (
        <p className="text-zinc-400 text-center py-8">Aucun tournoi disponible</p>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-zinc-900 border border-purple-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-2 rounded-full">
                    <Trophy className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{tournament.name}</h3>
                    <p className="text-purple-400 text-sm">
                      Prize: {tournament.prize}$
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-zinc-400 text-xs mb-1">Entrée</p>
                  <p className="text-white font-semibold">
                    {tournament.entry_fee_usd}$ / {tournament.entry_fee_cdf} CDF
                  </p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-zinc-400 text-xs mb-1">Participants</p>
                  <p className="text-white font-semibold">
                    {tournament.current_players}/{tournament.max_players}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleJoinTournament(tournament.id)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-2 rounded-lg transition"
              >
                Rejoindre le tournoi
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
