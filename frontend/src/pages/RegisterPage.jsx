import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, saveAuth } from '../api/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', slug: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from business name
      ...(name === 'name' ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '') } : {}),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/business/register', form);
      saveAuth(res.data.token, { name: res.data.name, slug: res.data.slug, email: res.data.email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 font-body">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="font-display text-2xl font-bold text-brand-500">Nudge</span>
          <p className="text-ink/60 text-sm mt-1">Register your business — it's free</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-100 bg-white p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Business name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Priya's Salon"
              className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Booking page URL
            </label>
            <div className="flex items-center rounded-lg border border-brand-100 overflow-hidden">
              <span className="bg-brand-50 px-3 py-2 text-xs text-ink/50 border-r border-brand-100">
                nudge.app/book/
              </span>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="priyas-salon"
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
            </div>
            <p className="text-xs text-ink/40 mt-1">This is the link you'll share with your customers.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-accent-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-500 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account →'}
          </button>

          <p className="text-center text-sm text-ink/50">
            Already registered?{' '}
            <Link to="/login" className="text-brand-500 hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}