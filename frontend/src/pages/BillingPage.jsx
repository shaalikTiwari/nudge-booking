import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, withAuth, clearAuth } from '../api/api';

export default function BillingPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    loadStatus();
    return () => document.body.removeChild(script);
  }, []);

  async function loadStatus() {
    try {
      const res = await api.get('/billing/status', withAuth());
      setStatus(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        clearAuth();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    setPaying(true);
    setMessage('');
    try {
      const orderRes = await api.post('/billing/create-order', {}, withAuth());
      const { orderId, amount, currency, keyId, businessName, businessEmail } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Nudge',
        description: 'Monthly subscription — ₹1,499/month',
        order_id: orderId,
        prefill: {
          name: businessName,
          email: businessEmail,
        },
        theme: { color: '#0F4C42' },
        handler: async function (response) {
          try {
            await api.post('/billing/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, withAuth());
            setMessage('Payment successful! Your subscription is now active. ✓');
            loadStatus();
          } catch {
            setMessage('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong.');
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-body">
        <p className="text-ink/50 text-sm">Loading billing info…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-body">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-brand-500">Nudge — Billing</span>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-ink/60 hover:text-brand-500">
            ← Back to dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-12 space-y-6">
        {/* Current status card */}
        <div className="rounded-2xl border border-brand-100 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-4">Current plan</p>

          {status?.trialActive ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-display font-bold text-ink">Free trial active</p>
                  <p className="text-sm text-ink/60">
                    {status.daysLeft} day{status.daysLeft !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              </div>
              <div className="w-full bg-brand-50 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (status.daysLeft / 14) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink/40">
                Your trial ends in {status.daysLeft} days. Subscribe before it ends to keep full access.
              </p>
            </div>
          ) : status?.subscriptionStatus === 'active' ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-display font-bold text-ink">Subscription active</p>
                <p className="text-sm text-ink/60">
                  Renews on {new Date(status.currentPeriodEnd).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-display font-bold text-ink">Trial expired</p>
                <p className="text-sm text-ink/60">Subscribe to restore full access to your dashboard.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pricing card */}
        <div className="rounded-2xl border border-brand-100 bg-white p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Nudge Pro</p>
          <div className="flex items-end gap-1">
            <span className="font-display text-4xl font-bold text-ink">₹1,499</span>
            <span className="text-ink/50 mb-1">/month</span>
          </div>

          <ul className="space-y-2">
            {[
              'Unlimited appointments',
              'Instant WhatsApp confirmations',
              'Automated day-before reminders',
              'Custom booking page URL',
              'Business settings & date blocking',
              'Priority support',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-ink/70">
                <span className="text-brand-500 font-bold">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {message && (
            <p className={`text-sm font-medium ${message.includes('✓') ? 'text-brand-500' : 'text-accent-600'}`}>
              {message}
            </p>
          )}

          {status?.subscriptionStatus !== 'active' && (
            <button
              onClick={handlePayment}
              disabled={paying}
              className="w-full rounded-xl bg-accent-500 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-60"
            >
              {paying ? 'Opening payment…' : 'Subscribe now →'}
            </button>
          )}

          {status?.subscriptionStatus === 'active' && (
            <p className="text-center text-sm text-brand-500 font-medium">
              You're all set ✓
            </p>
          )}
        </div>

        <p className="text-center text-xs text-ink/40">
          Payments are processed securely by Razorpay. Cancel anytime by contacting support.
        </p>
      </main>
    </div>
  );
}