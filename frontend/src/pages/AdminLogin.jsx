import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';

export default function AdminLogin() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { passcode });
      localStorage.setItem('nudge_admin_passcode', passcode);
      navigate('/admin/dashboard');
    } catch {
      setError('Incorrect passcode.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center font-body px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-8">
        <p className="font-display text-xl font-bold text-brand-500 mb-1">Nudge — Business login</p>
        <p className="text-sm text-ink/60 mb-6">Enter your passcode to manage appointments.</p>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm mb-3"
          autoFocus
        />
        {error && <p className="text-sm text-accent-600 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? 'Checking…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}