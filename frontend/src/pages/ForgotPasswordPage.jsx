import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/password-reset/request', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 font-body">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-display text-2xl font-bold text-brand-500">Nudge</span>
          <p className="text-ink/60 text-sm mt-1">Reset your password</p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6">
          {submitted ? (
            <div className="text-center space-y-3">
              <p className="text-3xl">📬</p>
              <p className="font-semibold text-ink">Check your email</p>
              <p className="text-sm text-ink/60">
                If that email is registered with Nudge, a reset link is on its way. Check your inbox and spam folder.
              </p>
              <Link to="/login" className="block mt-4 text-sm text-brand-500 hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-ink/60">
                Enter your business email and we'll send you a link to reset your password.
              </p>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-accent-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-ink/50">
                <Link to="/login" className="text-brand-500 hover:underline">Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}