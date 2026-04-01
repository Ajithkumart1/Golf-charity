// client/src/layouts/AdminLayout.jsx
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, CreditCard, Heart, Shuffle,
  Trophy, BarChart3, Menu, X, LogOut, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminNavItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/charities', label: 'Charities', icon: Heart },
  { to: '/admin/draws', label: 'Draw Engine', icon: Shuffle },
  { to: '/admin/winners', label: 'Winners', icon: Trophy },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

function AdminNavLink({ to, label, icon: Icon, exact }) {
  const location = useLocation();
  const active = exact ? location.pathname === to : location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
        ${active ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-brand-200/60 hover:text-brand-300 hover:bg-dark-700'}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-gold-400' : 'text-brand-300/40'}`} />
      {label}
    </Link>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-dark-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold-400" />
          <span className="font-display font-bold text-white">Admin Panel</span>
        </div>
        <p className="text-xs text-brand-300/40 mt-1">GreenGive Platform</p>
      </div>

      <div className="px-4 py-3 mx-2 mt-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
        <p className="text-xs text-gold-400 font-medium">{user?.full_name}</p>
        <p className="text-xs text-brand-300/40">{user?.email}</p>
      </div>

      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
        {adminNavItems.map((item) => <AdminNavLink key={item.to} {...item} />)}
      </nav>

      <div className="px-2 py-4 border-t border-dark-600 space-y-1">
        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-brand-300/50 hover:text-brand-300 transition-colors rounded-xl hover:bg-dark-700">
          ← Player View
        </Link>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-dark-800 border-r border-dark-600 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed inset-y-0 left-0 w-64 bg-dark-800 border-r border-dark-600 z-50">
              <div className="flex justify-end p-3 border-b border-dark-600">
                <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-brand-300" /></button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="sticky top-0 z-20 bg-dark-900/95 backdrop-blur border-b border-dark-600 px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-brand-300"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-medium text-gold-400">Administrator</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <motion.div
            key={useLocation().pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}