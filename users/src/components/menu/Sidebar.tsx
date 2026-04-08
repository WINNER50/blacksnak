import React from 'react';
import { Home, User, Wallet, Trophy, Target, MoreHorizontal, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  onSelect: (view: string) => void;
  onClose: () => void;
  hasPaymentMethods?: boolean;
}

export default function Sidebar({ isOpen, currentView, onSelect, onClose, hasPaymentMethods = true }: SidebarProps) {
  const menuItems = [
    { id: 'game', label: 'Jeu', icon: Home },
    { id: 'profile', label: 'Profil', icon: User },
    ...(hasPaymentMethods ? [{ id: 'wallet', label: 'Portefeuille', icon: Wallet }] : []),
    { id: 'tournaments', label: 'Tournois', icon: Trophy },
    { id: 'challenges', label: 'Défis Perso', icon: Target },
    { id: 'others', label: 'Autres', icon: MoreHorizontal }
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:fixed top-0 left-0 h-screen bg-gradient-to-b from-zinc-900 to-black border-r border-purple-700 
          transition-transform duration-300 z-50 w-64 flex flex-col overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Title - visible sur mobile seulement */}
        <div className="p-4 border-b border-purple-700 flex items-center justify-between lg:hidden shrink-0">
          <h2 className="text-white font-bold text-xl">Menu</h2>
          <button onClick={onClose} className="text-white hover:text-purple-400 transition">
            <X size={24} />
          </button>
        </div>

        {/* Logo desktop */}
        <div className="hidden lg:flex p-6 border-b border-purple-700 shrink-0">
          <h2 className="text-white font-bold text-2xl">Blacksnack</h2>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer - Fixed at bottom */}
        <div className="p-4 shrink-0">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-700 rounded-lg p-4">
            <p className="text-purple-300 text-sm mb-1">Blacksnack</p>
            <p className="text-white text-xs">Version 1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}