import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/admin/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { RechargePage } from './pages/RechargePage';
import { TournamentsPage } from './pages/TournamentsPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { LogsPage } from './pages/LogsPage';
import { AdminsPage } from './pages/AdminsPage';
import { LoginPage } from './pages/LoginPage';
import { WithdrawalPage } from './pages/WithdrawalPage';
import { Toaster } from './components/ui/sonner';
import { getToken } from '../config';

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="recharge" element={<RechargePage />} />
            <Route path="tournaments" element={<TournamentsPage />} />
            <Route path="challenges" element={<ChallengesPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="retraits" element={<WithdrawalPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="admins" element={<AdminsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" />
    </div>
  );
}