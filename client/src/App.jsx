// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import CharitiesPage from './pages/CharitiesPage';
import CharityDetailPage from './pages/CharityDetailPage';
import DrawsPage from './pages/DrawsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Subscriber pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ScoresPage from './pages/dashboard/ScoresPage';
import MyCharityPage from './pages/dashboard/MyCharityPage';
import MyDrawsPage from './pages/dashboard/MyDrawsPage';
import WinningsPage from './pages/dashboard/WinningsPage';
import SubscriptionPage from './pages/dashboard/SubscriptionPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminCharities from './pages/admin/AdminCharities';
import AdminDraws from './pages/admin/AdminDraws';
import AdminWinners from './pages/admin/AdminWinners';
import AdminReports from './pages/admin/AdminReports';

function ProtectedRoute({ children, requireAdmin = false, requireSub = false }) {
  const { user, loading, isAdmin, hasActiveSubscription } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (requireSub && !hasActiveSubscription && !isAdmin) return <Navigate to="/pricing" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/charities/:id" element={<CharityDetailPage />} />
        <Route path="/draws" element={<DrawsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Subscriber Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="scores" element={<ProtectedRoute requireSub><ScoresPage /></ProtectedRoute>} />
        <Route path="charity" element={<ProtectedRoute requireSub><MyCharityPage /></ProtectedRoute>} />
        <Route path="draws" element={<ProtectedRoute requireSub><MyDrawsPage /></ProtectedRoute>} />
        <Route path="winnings" element={<ProtectedRoute requireSub><WinningsPage /></ProtectedRoute>} />
        <Route path="subscription" element={<SubscriptionPage />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="charities" element={<AdminCharities />} />
        <Route path="draws" element={<AdminDraws />} />
        <Route path="winners" element={<AdminWinners />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}