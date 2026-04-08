import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Swords,
  CreditCard,
  Wallet,
  Settings,
  BarChart3,
  ScrollText,
  UserCog,
  LogOut,
  X,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Vue d\'ensemble' },
  { path: '/users', icon: Users, label: 'Utilisateurs' },
  { path: '/tournaments', icon: Trophy, label: 'Tournois' },
  { path: '/challenges', icon: Swords, label: 'Défis' },
  { path: '/transactions', icon: CreditCard, label: 'Transactions' },
  { path: '/recharge', icon: Wallet, label: 'Recharge & Trésorerie' },
  { path: '/retraits', icon: CreditCard, label: 'Retraits' },
  { path: '/settings', icon: Settings, label: 'Paramètres système' },
  { path: '/statistics', icon: BarChart3, label: 'Statistiques' },
  { path: '/logs', icon: ScrollText, label: 'Logs' },
  { path: '/admins', icon: UserCog, label: 'Administrateurs' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-zinc-800 flex flex-col transition-transform duration-300 transform
      lg:relative lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo & Close Button */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">🐍</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight uppercase">Blacksnack</h1>
            <p className="text-zinc-400 text-[10px] uppercase tracking-wider">Admin Dashboard</p>
          </div>
        </Link>
        <button 
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-white lg:hidden"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                ${isActive
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 shadow-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800'
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={() => {
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}