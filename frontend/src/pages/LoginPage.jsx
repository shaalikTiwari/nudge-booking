import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveAuth } from '../api/api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/business/login', form);
      saveAuth(res.data.token, { name: res.data.name, slug: res.data.slug, email: res.data.email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 font-body">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="font-display text-2xl font-bold text-brand-500">Nudge</span>
          <p className="text-ink/60 text-sm mt-1">Log in to your business dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-100 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Your password"
              className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-accent-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <p className="text-center text-sm text-ink/50">
          <Link to="/forgot-password" className="text-brand-500 hover:underline">Forgot password?</Link>
          </p>
          <p className="text-center text-sm text-ink/50 mt-1">
            New here?{' '}
            <Link to="/register" className="text-brand-500 hover:underline">Register your business</Link>
          </p>
        </form>
      </div>
    </div>
  );
}