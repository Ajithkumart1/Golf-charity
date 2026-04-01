// client/src/layouts/PublicLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, Heart, Trophy, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: '/charities', label: 'Charities', icon: Heart },
    { to: '/draws', label: 'Draws', icon: Trophy },
    { to: '/pricing', label: 'Pricing', icon: Leaf },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-dark-900/95 backdrop-blur-md border-b border-dark-600' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center group-hover:bg-brand-400 transition-colors">
                <span className="text-dark-900 font-display font-bold text-sm">G</span>
              </div>
              <span className="font-display text-xl font-bold text-white">
                Green<span className="text-brand-400">Give</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium transition-colors hover:text-brand-400 ${location.pathname.startsWith(to) ? 'text-brand-400' : 'text-brand-200/70'}`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    {isAdmin ? 'Admin Panel' : 'Dashboard'}
                  </Link>
                  <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-brand-300/60 hover:text-brand-300 transition-colors">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
                  <Link to="/register" className="btn-primary text-sm py-2 px-4 flex items-center gap-1">
                    Get Started <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-brand-300">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-dark-800 border-t border-dark-600 overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-2">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-dark-700 text-brand-200 hover:text-brand-400 transition-colors">
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                ))}
                <div className="border-t border-dark-600 pt-3 mt-1 flex flex-col gap-2">
                  {user ? (
                    <>
                      <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn-secondary text-center">Dashboard</Link>
                      <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-brand-300/60 py-2">Sign Out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="btn-secondary text-center">Sign In</Link>
                      <Link to="/register" className="btn-primary text-center">Get Started</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page content */}
      <main className="flex-1 pt-16 lg:pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-600 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
                  <span className="text-dark-900 font-bold text-xs">G</span>
                </div>
                <span className="font-display text-lg font-bold">Green<span className="text-brand-400">Give</span></span>
              </div>
              <p className="text-brand-300/60 text-sm leading-relaxed max-w-sm">
                Play golf. Enter draws. Win prizes. Change lives. Every subscription directly supports the causes that matter to you.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
              <ul className="space-y-2">
                {[['/', 'Home'], ['/charities', 'Charities'], ['/draws', 'Draws'], ['/pricing', 'Pricing']].map(([to, label]) => (
                  <li key={to}><Link to={to} className="text-brand-300/60 hover:text-brand-400 text-sm transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
              <ul className="space-y-2">
                {[['/login', 'Sign In'], ['/register', 'Register'], ['/dashboard', 'Dashboard']].map(([to, label]) => (
                  <li key={to}><Link to={to} className="text-brand-300/60 hover:text-brand-400 text-sm transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-600 mt-10 pt-6 text-center text-brand-300/40 text-xs">
            © {new Date().getFullYear()} GreenGive. All rights reserved. Subscriptions include a charitable donation component.
          </div>
        </div>
      </footer>
    </div>
  );
}