// client/src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/admin/users').then(({ data }) => setUsers(data.users)).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-brand-400" />Users</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2 text-sm" placeholder="Search users…" />
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div> : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600 text-xs text-brand-300/40">
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Role</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Subscription</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.full_name}</p>
                          <p className="text-xs text-brand-300/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className={u.role === 'admin' ? 'badge-warning' : 'text-xs text-brand-300/60 capitalize'}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {u.subscriptions?.[0] ? (
                        <span className={u.subscriptions[0].status === 'active' ? 'badge-active' : 'badge-error'}>{u.subscriptions[0].status}</span>
                      ) : <span className="text-xs text-brand-300/30">None</span>}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-brand-300/50 text-xs">
                      {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/admin/users/${u.id}`} className="text-brand-400 hover:text-brand-300 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}