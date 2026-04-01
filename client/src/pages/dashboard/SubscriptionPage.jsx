// client/src/pages/dashboard/SubscriptionPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, ExternalLink, AlertTriangle, Check, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SubscriptionPage() {
  const { subscription, fetchSubscription } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data } = await api.post('/api/stripe/portal');
      window.location.href = data.url;
    } catch { toast.error('Could not open billing portal'); }
    finally { setPortalLoading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will retain access until the end of the current period.')) return;
    setCancelLoading(true);
    try {
      await api.post('/api/subscriptions/cancel');
      toast.success('Subscription scheduled for cancellation at period end.');
      await fetchSubscription();
    } catch { toast.error('Cancellation failed'); }
    finally { setCancelLoading(false); }
  };

  const statusColors = {
    active:    'badge-active',
    cancelled: 'badge-error',
    lapsed:    'badge-error',
    past_due:  'badge-warning',
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-brand-400" />Subscription
        </h1>
        <p className="text-brand-300/50 mt-1 text-sm">Manage your GreenGive subscription and billing.</p>
      </div>

      {!subscription ? (
        <div className="card border-gold-500/20 bg-gold-500/5 text-center py-12">
          <AlertTriangle className="w-10 h-10 text-gold-400 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">No Active Subscription</p>
          <p className="text-brand-300/60 text-sm mb-6">Subscribe to access all features and join monthly draws.</p>
          <Link to="/pricing" className="btn-gold inline-flex items-center gap-2">
            View Plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-brand-300/50 text-xs mb-1">Current Plan</p>
                <h2 className="font-display text-2xl font-bold text-white capitalize">{subscription.plan} Plan</h2>
              </div>
              <span className={statusColors[subscription.status] || 'badge-warning'}>
                {subscription.status}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Monthly Cost', value: `£${Number(subscription.amount).toFixed(2)}` },
                { label: 'To Charity', value: `£${Number(subscription.charity_amount || 0).toFixed(2)}` },
                { label: 'Period Start', value: subscription.current_period_start ? format(new Date(subscription.current_period_start), 'dd MMM yyyy') : '—' },
                { label: 'Renewal Date', value: subscription.current_period_end ? format(new Date(subscription.current_period_end), 'dd MMM yyyy') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-dark-700 border border-dark-600">
                  <p className="text-xs text-brand-300/40">{label}</p>
                  <p className="text-base font-semibold text-white mt-1">{value}</p>
                </div>
              ))}
            </div>

            {subscription.cancelled_at && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">
                  Cancelled on {format(new Date(subscription.cancelled_at), 'dd MMM yyyy')}. Access continues until {format(new Date(subscription.current_period_end), 'dd MMM yyyy')}.
                </p>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-white text-sm">Billing Actions</h3>
            <p className="text-xs text-brand-300/50">Manage payment methods, view invoices, and update billing details through the Stripe portal.</p>

            <button onClick={openPortal} disabled={portalLoading} className="btn-secondary w-full sm:w-auto flex items-center gap-2">
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Manage Billing in Stripe
            </button>

            {subscription.status === 'active' && !subscription.cancelled_at && (
              <div className="border-t border-dark-600 pt-4">
                <p className="text-xs text-brand-300/40 mb-3">To cancel, your access will continue until the end of the current billing period.</p>
                <button onClick={handleCancel} disabled={cancelLoading} className="text-sm text-red-400/60 hover:text-red-400 flex items-center gap-2 transition-colors">
                  {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}