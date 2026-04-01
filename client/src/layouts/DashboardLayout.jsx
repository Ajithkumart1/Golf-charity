// client/src/layouts/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Trophy, Heart, Star, CreditCard,
  Target, Menu, X, LogOut, ChevronRight, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/scores', label: 'My Scores', icon: Target },
  { to: '/dashboard/draws', label: 'Draw History', icon: Trophy },
  { to: '/dashboard/winnings', label: 'Winnings', icon: Star },
  { to: '/dashboard/charity', label: 'My Charity', icon: Heart },
  { to: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
];

function SidebarLink({ to, label, icon: Icon, exact, onClick }) {
  const location = useLocation();
  const active = exact ? location.pathname === to : location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
        ${active
          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
          : 'text-brand-200/60 hover:text-brand-300 hover:bg-dark-700'
        }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-400' : 'text-brand-300/40 group-hover:text-brand-300'}`} />
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto text-brand-500" />}
    </Link>
  );
}

export default function DashboardLayout() {
  const { user, subscription, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const Sidebar = ({ onClose }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-dark-600">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-dark-900 font-bold text-xs">G</span>
          </div>
          <span className="font-display text-lg font-bold text-white">
            Green<span className="text-brand-400">Give</span>
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="px-4 py-4 mx-2 mt-4 rounded-xl bg-dark-700 border border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-semibold text-sm">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${subscription?.status === 'active' ? 'bg-brand-400' : 'bg-red-400'}`} />
              <p className="text-xs text-brand-300/50 capitalize">
                {subscription?.status || 'No subscription'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarLink key={item.to} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-dark-600">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-dark-800 border-r border-dark-600 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-72 bg-dark-800 border-r border-dark-600 z-50 lg:hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-dark-600">
                <span className="font-display font-bold text-white">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-brand-300"><X className="w-5 h-5" /></button>
              </div>
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-dark-900/95 backdrop-blur border-b border-dark-600 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-brand-300">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-white">Player Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 text-brand-300/50 hover:text-brand-300 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            {!subscription?.status || subscription.status !== 'active' ? (
              <Link to="/pricing" className="btn-primary text-xs py-2 px-3">Upgrade</Link>
            ) : null}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}