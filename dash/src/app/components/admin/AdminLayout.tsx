import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation, Outlet } from 'react-router-dom';

const pageTitles: Record<string, { title: string; breadcrumbs?: { label: string; path?: string }[] }> = {
  '/': { title: 'Vue d\'ensemble', breadcrumbs: [{ label: 'Dashboard' }] },
  '/users': { title: 'Gestion des utilisateurs', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Utilisateurs' }] },
  '/tournaments': { title: 'Gestion des tournois', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Tournois' }] },
  '/challenges': { title: 'Gestion des défis', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Défis' }] },
  '/transactions': { title: 'Gestion des transactions', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Transactions' }] },
  '/recharge': { title: 'Recharge & Trésorerie', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Recharge' }] },
  '/retraits': { title: 'Gestion des retraits', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Retraits' }] },
  '/settings': { title: 'Paramètres système', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Paramètres' }] },
  '/statistics': { title: 'Statistiques avancées', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Statistiques' }] },
  '/logs': { title: 'Logs et activité', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Logs' }] },
  '/admins': { title: 'Gestion des administrateurs', breadcrumbs: [{ label: 'Dashboard', path: '/' }, { label: 'Administrateurs' }] },
};

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: 'Dashboard', breadcrumbs: [] };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <Header 
          title={pageInfo.title} 
          breadcrumbs={pageInfo.breadcrumbs} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        {/* Main Content Area: Scrollable independently */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="p-4 lg:p-10 max-w-7xl mx-auto w-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}