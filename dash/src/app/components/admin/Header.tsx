import { Bell, Search, User, Wallet, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';

interface HeaderProps {
  title: string;
  breadcrumbs?: { label: string; path?: string }[];
  onMenuClick?: () => void;
}

export function Header({ title, breadcrumbs = [], onMenuClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-4 lg:px-6 py-4 sticky top-0 z-40 w-full overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Menu + Title */}
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden flex-shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="min-w-0">
            {breadcrumbs.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {crumb.path ? (
                      <Link to={crumb.path} className="hover:text-purple-400 transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && <span className="opacity-30">/</span>}
                  </div>
                ))}
              </div>
            )}
            <h1 className="text-lg lg:text-2xl font-bold text-white truncate">{title}</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          {/* Search - Hidden on Small screens */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 w-32 lg:w-64 transition-all focus:w-48 lg:focus:w-80"
            />
          </div>

          {/* Quick Recharge Button - Icon only on small screens */}
          <Link to="/recharge">
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-3 lg:px-4">
              <Wallet className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Recharge rapide</span>
            </Button>
          </Link>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                <Bell className="w-5 h-5 text-zinc-400" />
                <Badge className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] font-bold border-2 border-zinc-900">
                  3
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800">
              <DropdownMenuLabel className="text-white">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800 cursor-pointer">
                <div className="flex flex-col gap-1 py-1">
                  <p className="text-sm font-medium">Nouveau retrait en attente</p>
                  <p className="text-xs text-zinc-500">Player2 - 50 USD</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800 cursor-pointer">
                <div className="flex flex-col gap-1 py-1">
                  <p className="text-sm font-medium">Tournoi terminé</p>
                  <p className="text-xs text-zinc-500">Snake Master Championship</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Time - Hidden on small screens */}
          <div className="text-right hidden xl:block mr-2 border-l border-zinc-800 pl-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">
              {format(currentTime, 'EEEE d MMMM')}
            </p>
            <p className="text-sm font-bold text-white tabular-nums">
              {format(currentTime, 'HH:mm:ss')}
            </p>
          </div>

          {/* Admin Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 rounded-full border border-zinc-800 hover:bg-zinc-800 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center border border-zinc-700">
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 shadow-2xl">
              <DropdownMenuLabel className="text-white p-4">
                <div>
                  <p className="font-bold text-sm">BLACKSNACK ADMIN</p>
                  <p className="text-xs text-zinc-500 font-normal">admin@blacksnack.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800 cursor-pointer py-3">
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-300 hover:bg-zinc-800 cursor-pointer py-3">
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 cursor-pointer py-3 font-semibold" onClick={() => { localStorage.removeItem('admin_token'); window.location.href = '/login'; }}>
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}