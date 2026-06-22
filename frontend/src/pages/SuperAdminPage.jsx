import { useEffect, useState } from 'react';
import { api } from '../api/api';

const STORAGE_KEY = 'nudge_super_key';

export default function SuperAdminPage() {
  const [key, setKey] = useState(localStorage.getItem(STORAGE_KEY) || '');
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem(STORAGE_KEY)));
  const [keyInput, setKeyInput] = useState('');
  const [stats, setStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function superHeaders() {
    return { headers: { 'x-super-admin-key': key } };
  }

  async function loadDashboard() {
    setLoading(true);
    try {
      const [statsRes, bizRes] = await Promise.all([
        api.get('/superadmin/stats', superHeaders()),
        api.get('/superadmin/businesses', superHeaders()),
      ]);
      setStats(statsRes.data);
      setBusinesses(bizRes.data);
    } catch {
      setAuthed(false);
      localStorage.removeItem(STORAGE_KEY);
      setError('Invalid key or session expired.');
    } finally {
      setLoading(false);
    }
  }

  async function loadBusiness(id) {
    setSelected(id);
    const res = await api.get(`/superadmin/businesses/${id}`, superHeaders());
    setSelectedDetail(res.data);
  }

  async function suspend(id) {
    await api.patch(`/superadmin/businesses/${id}/suspend`, {}, superHeaders());
    loadDashboard();
    if (selected === id) loadBusiness(id);
  }

  async function reactivate(id) {
    await api.patch(`/superadmin/businesses/${id}/reactivate`, {}, superHeaders());
    loadDashboard();
    if (selected === id) loadBusiness(id);
  }

  async function deleteBusiness(id, name) {
    if (!window.confirm(`Permanently delete "${name}" and all its data? This cannot be undone.`)) return;
    await api.delete(`/superadmin/businesses/${id}`, superHeaders());
    setSelected(null);
    setSelectedDetail(null);
    loadDashboard();
  }

  function handleLogin(e) {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, keyInput);
    setKey(keyInput);
    setAuthed(true);
  }

  useEffect(() => {
    if (authed) loadDashboard();
  }, [authed]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4 font-body">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6 space-y-4">
          <p className="font-display text-lg font-bold text-brand-500">Nudge — Super Admin</p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Enter super admin key"
            className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            autoFocus
          />
          {error && <p className="text-sm text-accent-600">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Access dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-body">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <span className="font-display text-xl font-bold text-brand-500">Nudge</span>
            <span className="ml-2 text-xs font-medium text-accent-500 bg-accent-400/10 px-2 py-1 rounded-full">Super Admin</span>
          </div>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); setAuthed(false); setKey(''); }}
            className="text-sm text-ink/50 hover:text-accent-500"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total businesses', value: stats.totalBusinesses },
              { label: 'Active', value: stats.activeBusinesses },
              { label: 'Suspended', value: stats.suspendedBusinesses },
              { label: 'Total appointments', value: stats.totalAppointments },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-brand-100 bg-white p-4">
                <p className="text-2xl font-display font-bold text-ink">{s.value}</p>
                <p className="text-xs text-ink/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Business list */}
          <section>
            <h2 className="font-display font-bold text-ink mb-3">All businesses</h2>
            {loading ? (
              <p className="text-sm text-ink/50">Loading…</p>
            ) : (
              <div className="space-y-2">
                {businesses.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => loadBusiness(b._id)}
                    className={`rounded-xl border bg-white p-4 cursor-pointer transition-colors ${
                      selected === b._id ? 'border-brand-400' : 'border-brand-100 hover:border-brand-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-ink text-sm">{b.name}</p>
                        <p className="text-xs text-ink/50">{b.email}</p>
                        <p className="text-xs text-ink/40">/book/{b.slug}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.suspended ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-500'}`}>
                          {b.suspended ? 'suspended' : 'active'}
                        </span>
                        <span className="text-xs text-ink/40">{b.appointmentCount} appts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Business detail */}
          <section>
            {!selectedDetail ? (
              <div className="rounded-xl border border-brand-100 bg-white p-6 text-center">
                <p className="text-sm text-ink/50">Click a business to see details</p>
              </div>
            ) : (
              <div className="rounded-xl border border-brand-100 bg-white p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg font-bold text-ink">{selectedDetail.business.name}</p>
                    <p className="text-sm text-ink/50">{selectedDetail.business.email}</p>
                    <p className="text-xs text-ink/40 mt-1">
                      Registered {new Date(selectedDetail.business.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedDetail.business.suspended ? (
                      <button
                        onClick={() => reactivate(selectedDetail.business._id)}
                        className="text-xs font-medium bg-brand-50 text-brand-500 px-3 py-1.5 rounded-lg hover:bg-brand-100"
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => suspend(selectedDetail.business._id)}
                        className="text-xs font-medium bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100"
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      onClick={() => deleteBusiness(selectedDetail.business._id, selectedDetail.business.name)}
                      className="text-xs font-medium bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <p className="text-sm font-semibold text-ink mb-2">Services ({selectedDetail.services.length})</p>
                  {selectedDetail.services.length === 0 ? (
                    <p className="text-xs text-ink/40">No services added yet</p>
                  ) : (
                    <div className="space-y-1">
                      {selectedDetail.services.map((s) => (
                        <div key={s._id} className="flex justify-between text-xs bg-brand-50 rounded-lg px-3 py-2">
                          <span>{s.name}</span>
                          <span className="text-ink/50">{s.durationMinutes} min · ₹{s.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent appointments */}
                <div>
                  <p className="text-sm font-semibold text-ink mb-2">
                    Recent appointments ({selectedDetail.appointments.length})
                  </p>
                  {selectedDetail.appointments.length === 0 ? (
                    <p className="text-xs text-ink/40">No appointments yet</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {selectedDetail.appointments.map((a) => (
                        <div key={a._id} className="flex justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                          <span>{a.customerName} · {a.service?.name}</span>
                          <span className="text-ink/50">{a.date} {a.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}