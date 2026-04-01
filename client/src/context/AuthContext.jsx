// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch subscription — silently fails if not subscribed or not logged in.
  // IMPORTANT: does NOT redirect on 401 (that is handled by the axios interceptor
  // only for non-auth routes — subscription check runs right after login so we
  // must swallow errors here).
  const fetchSubscription = useCallback(async () => {
    try {
      const { data } = await api.get('/api/subscriptions/my');
      setSubscription(data.subscription || null);
    } catch {
      // 403 = no subscription, 401 = not logged in — both are fine here
      setSubscription(null);
    }
  }, []);

  // On mount: rehydrate from localStorage and refresh subscription
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      fetchSubscription().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    // Will throw on network error or non-2xx — caught in LoginPage
    const { data } = await api.post('/api/auth/login', { email, password });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    // Fetch subscription after setting user — failure is non-fatal
    try {
      await fetchSubscription();
    } catch {
      // No subscription yet — that's fine
    }

    return data.user;
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSubscription(null);
  };

  // ── Refresh user profile ───────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/api/users/me');
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('[AuthContext] refreshUser failed:', err.message);
    }
  };

  const isAdmin            = user?.role === 'admin';
  const hasActiveSubscription = subscription?.status === 'active';

  return (
    <AuthContext.Provider value={{
      user, subscription, loading,
      login, register, logout, refreshUser, fetchSubscription,
      isAdmin, hasActiveSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
