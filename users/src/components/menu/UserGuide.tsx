import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Gamepad2, Wallet, Trophy, Target, X } from 'lucide-react';

interface UserGuideProps {
  onClose: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
}

export default function UserGuide({ onClose }: UserGuideProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['game']);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const guideSections: GuideSection[] = [
    {
      id: 'game',
      title: 'Comment jouer',
      icon: <Gamepad2 className="text-purple-400" size={20} />,
      content: [
        '🎮 Le jeu du serpent est le cœur de Blacksnack',
        '🐍 Utilisez les flèches du clavier ou les boutons pour diriger le serpent',
        '🍎 Mangez la nourriture bleue pour grandir et gagner 1 point',
        '⚠️ Évitez de toucher les murs ou votre propre corps',
        '⏸️ Appuyez sur Espace ou le bouton Pause pour faire une pause',
        '🏆 Votre meilleur score est sauvegardé automatiquement'
      ]
    },
    {
      id: 'wallet',
      title: 'Portefeuille',
      icon: <Wallet className="text-blue-400" size={20} />,
      content: [
        '💰 Votre solde est affiché dans le header en haut',
        '💳 Vous pouvez déposer de l\'argent via Mobile Money ou Visa',
        '💵 Les devises supportées sont USD et CDF',
        '📤 Les retraits sont disponibles sur les mêmes moyens de paiement',
        '⏱️ Les transactions sont généralement traitées instantanément',
        '📊 Consultez l\'historique de vos transactions dans "Autres"'
      ]
    },
    {
      id: 'tournaments',
      title: 'Tournois',
      icon: <Trophy className="text-yellow-400" size={20} />,
      content: [
        '🏆 Participez aux tournois quotidiens et hebdomadaires',
        '💸 Frais d\'entrée : 1000 CDF ou 1 USD',
        '🎯 Plus vous marquez de points, mieux vous êtes classé',
        '👥 Affrontez d\'autres joueurs pour les meilleures positions',
        '💎 Gagnez des récompenses selon votre classement',
        '⏰ Les tournois ont des dates de début et de fin fixes'
      ]
    },
    {
      id: 'challenges',
      title: 'Défis Personnels',
      icon: <Target className="text-green-400" size={20} />,
      content: [
        '🎯 Créez vos propres défis avec des gains de 20$ à 400$',
        '📈 Plus le gain est élevé, plus le défi est difficile',
        '⚡ Vous devez atteindre le score requis pour gagner',
        '❌ Si vous échouez, vous perdez les frais d\'entrée',
        '✅ Si vous réussissez, vous gagnez le montant du défi',
        '📋 Consultez l\'historique de vos défis pour suivre vos progrès'
      ]
    },
    {
      id: 'tips',
      title: 'Conseils et Astuces',
      icon: <ChevronDown className="text-purple-400" size={20} />,
      content: [
        '🎯 Commencez par des petits défis pour vous entraîner',
        '🧠 Planifiez vos mouvements à l\'avance',
        '🔄 Ne vous laissez pas piéger dans un coin',
        '⚡ La vitesse augmente avec votre score, restez concentré',
        '💪 Pratiquez régulièrement pour améliorer vos réflexes',
        '👥 Rejoignez le groupe WhatsApp pour des conseils de la communauté'
      ]
    },
    {
      id: 'rules',
      title: 'Règles Importantes',
      icon: <ChevronDown className="text-red-400" size={20} />,
      content: [
        '✅ Vous devez avoir 18 ans ou plus pour jouer',
        '🚫 La triche est strictement interdite',
        '💼 Les gains sont ajoutés directement à votre portefeuille',
        '⚠️ Jouez de manière responsable',
        '📧 Contactez le support via WhatsApp pour toute question',
        '🔒 Votre compte est personnel et ne doit pas être partagé'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-b from-zinc-900 to-black border border-purple-700 rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-black border-b border-purple-700 p-4 sm:p-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white text-xl sm:text-2xl font-bold">Guide du débutant</h2>
            <p className="text-purple-300 text-xs sm:text-sm mt-1">Tout ce que vous devez savoir sur Blacksnack</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-400 transition p-1 sm:p-2"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 sm:p-6 space-y-2 sm:space-y-3">
          {guideSections.map((section) => (
            <div
              key={section.id}
              className="bg-zinc-900 border border-purple-700/50 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {section.icon}
                  <span className="text-white font-semibold text-sm sm:text-base">{section.title}</span>
                </div>
                {expandedSections.includes(section.id) ? (
                  <ChevronUp className="text-purple-400" size={18} />
                ) : (
                  <ChevronDown className="text-purple-400" size={18} />
                )}
              </button>

              {expandedSections.includes(section.id) && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
                  {section.content.map((item, index) => (
                    <div
                      key={index}
                      className="bg-zinc-800/50 rounded-lg p-2 sm:p-3 text-zinc-300 text-xs sm:text-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-700 rounded-lg p-4 sm:p-6 mt-4 sm:mt-6">
            <h3 className="text-white font-semibold text-base sm:text-lg mb-2 sm:mb-3">🎉 Bienvenue sur Blacksnack !</h3>
            <p className="text-purple-200 text-xs sm:text-sm leading-relaxed">
              Nous sommes ravis de vous accueillir dans notre communauté. Blacksnack combine le plaisir 
              du jeu classique du serpent avec l'excitation de la compétition et des récompenses réelles. 
              Amusez-vous bien et bonne chance ! 🐍✨
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-900 border-t border-purple-700 p-3 sm:p-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition text-sm sm:text-base"
          >
            J'ai compris !
          </button>
        </div>
      </div>
    </div>
  );
}