import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, withAuth, clearAuth, getStoredBusiness, saveAuth } from '../api/api';

export default function AdminDashboard() {
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', durationMinutes: 30, price: '' });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const navigate = useNavigate();
  const business = getStoredBusiness();

  function loadData() {
    setLoading(true);
    Promise.all([
      api.get('/appointments', withAuth()),
      api.get(`/services/${business?.slug}`),
      api.get('/business/me', withAuth()),
    ])
      .then(([apptRes, svcRes, bizRes]) => {
        setAppointments(apptRes.data);
        setServices(svcRes.data);
        setSettings({
          name: bizRes.data.name,
          phone: bizRes.data.phone || '',
          openHour: bizRes.data.openHour,
          closeHour: bizRes.data.closeHour,
          slotLengthMinutes: bizRes.data.slotLengthMinutes,
        });
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          clearAuth();
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function updateStatus(id, status) {
    await api.patch(`/appointments/${id}`, { status }, withAuth());
    loadData();
  }

  async function addService(e) {
    e.preventDefault();
    if (!newService.name) return;
    await api.post('/services', { ...newService, price: Number(newService.price) || 0 }, withAuth());
    setNewService({ name: '', durationMinutes: 30, price: '' });
    loadData();
  }

  async function deleteService(id) {
    await api.delete(`/services/${id}`, withAuth());
    loadData();
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      const res = await api.patch('/business/me', settings, withAuth());
      // Update stored business name if it changed
      saveAuth(localStorage.getItem('nudge_token'), {
        ...business,
        name: res.data.name,
      });
      setSettingsMsg('Settings saved ✓');
    } catch (err) {
      setSettingsMsg(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSettingsSaving(false);
    }
  }

  function logout() {
    clearAuth();
    navigate('/login');
  }

  const statusStyles = {
    booked: 'bg-brand-50 text-brand-500',
    completed: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-50 text-red-500',
  };

  const bookingLink = `${window.location.origin}/book/${business?.slug}`;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-bg font-body">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <span className="font-display text-xl font-bold text-brand-500">Nudge</span>
            <span className="ml-2 text-sm text-ink/50">{business?.name}</span>
          </div>
          <button onClick={logout} className="text-sm text-ink/60 hover:text-accent-500">Log out</button>
        </div>
      </header>

      {/* Booking link banner */}
      <div className="bg-brand-50 border-b border-brand-100 px-4 py-3">
        <div className="mx-auto max-w-5xl flex items-center gap-3 flex-wrap">
          <p className="text-sm text-brand-500 font-medium">Your booking link:</p>
          <code className="text-sm bg-white px-3 py-1 rounded-lg border border-brand-100">{bookingLink}</code>
          <button
            onClick={() => navigator.clipboard.writeText(bookingLink)}
            className="text-xs font-medium text-accent-500 hover:underline"
          >
            Copy
          </button>
          <a href={`/book/${business?.slug}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-500 hover:underline">
            Open →
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 flex gap-1">
          {[
            { key: 'appointments', label: '📅 Appointments' },
            { key: 'services', label: '✂️ Services' },
            { key: 'settings', label: '⚙️ Settings' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.key
                  ? 'border-brand-500 text-brand-500 bg-brand-50/50'
                  : 'border-transparent text-ink/50 hover:text-ink hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Appointments tab */}
        {tab === 'appointments' && (
          <section>
            <h2 className="font-display text-xl font-bold text-ink mb-4">Appointments</h2>
            {loading ? (
              <p className="text-sm text-ink/60">Loading…</p>
            ) : appointments.length === 0 ? (
              <div className="rounded-xl border border-brand-100 bg-white p-6 text-center">
                <p className="text-sm text-ink/60 mb-2">No appointments yet.</p>
                <p className="text-xs text-ink/40">Share your booking link above to get your first one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt._id} className="rounded-xl border border-brand-100 bg-white p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{appt.customerName}</p>
                      <p className="text-sm text-ink/60">
                        {appt.service?.name || 'Service removed'} · {appt.date} at {appt.time}
                      </p>
                      <p className="text-xs text-ink/40">{appt.customerPhone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[appt.status]}`}>
                        {appt.status}
                      </span>
                      {appt.status === 'booked' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(appt._id, 'completed')} className="text-xs font-medium text-brand-500 hover:underline">
                            Mark done
                          </button>
                          <button onClick={() => updateStatus(appt._id, 'cancelled')} className="text-xs font-medium text-accent-500 hover:underline">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Services tab */}
        {tab === 'services' && (
          <section className="max-w-lg">
            <h2 className="font-display text-xl font-bold text-ink mb-4">Services</h2>
            <div className="space-y-2 mb-6">
              {services.map((s) => (
                <div key={s._id} className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm flex justify-between items-center">
                  <span>{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-ink/50">{s.durationMinutes} min{s.price ? ` · ₹${s.price}` : ''}</span>
                    <button onClick={() => deleteService(s._id)} className="text-xs text-accent-500 hover:underline">Remove</button>
                  </div>
                </div>
              ))}
              {services.length === 0 && <p className="text-sm text-ink/60">No services yet — add one below.</p>}
            </div>

            <form onSubmit={addService} className="rounded-xl border border-brand-100 bg-white p-4 space-y-3">
              <p className="text-sm font-medium text-ink">Add a service</p>
              <input
                type="text"
                placeholder="Service name (e.g. Haircut)"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Minutes"
                  value={newService.durationMinutes}
                  onChange={(e) => setNewService({ ...newService, durationMinutes: Number(e.target.value) })}
                  className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
                />
              </div>
              <button type="submit" className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                Add service
              </button>
            </form>
          </section>
        )}

        {/* Settings tab */}
        {tab === 'settings' && settings && (
          <section className="max-w-2xl">
          <h2 className="font-display text-xl font-bold text-ink mb-6">Business settings</h2>
          <form onSubmit={saveSettings} className="space-y-4">

              {/* Business info card */}
              <div className="rounded-2xl border border-brand-100 bg-white p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Business info</p>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Business name</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full rounded-lg border border-brand-100 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Business phone</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full rounded-lg border border-brand-100 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                  />
                  <p className="text-xs text-ink/40 mt-1">Used for WhatsApp Business API (optional for now)</p>
                </div>
              </div>

              {/* Hours card */}
              <div className="rounded-2xl border border-brand-100 bg-white p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Working hours</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Opening</label>
                    <select
                      value={settings.openHour}
                      onChange={(e) => setSettings({ ...settings, openHour: Number(e.target.value) })}
                      className="w-full rounded-lg border border-brand-100 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Closing</label>
                    <select
                      value={settings.closeHour}
                      onChange={(e) => setSettings({ ...settings, closeHour: Number(e.target.value) })}
                      className="w-full rounded-lg border border-brand-100 px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-500">
                  Customers will see slots from{' '}
                  <strong>{String(settings.openHour).padStart(2, '0')}:00</strong> to{' '}
                  <strong>{String(settings.closeHour).padStart(2, '0')}:00</strong> on your booking page.
                </div>
              </div>

              {/* Slot duration card */}
              <div className="rounded-2xl border border-brand-100 bg-white p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Appointment slots</p>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Slot duration</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[15, 20, 30, 45, 60, 90].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSettings({ ...settings, slotLengthMinutes: m })}
                        className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                          settings.slotLengthMinutes === m
                            ? 'border-accent-500 bg-accent-500 text-white'
                            : 'border-brand-100 bg-white text-ink hover:border-brand-400'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-ink/40 mt-2">
                    Each appointment slot will be {settings.slotLengthMinutes} minutes long.
                  </p>
                </div>
              </div>

              {settingsMsg && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                  settingsMsg.includes('✓')
                    ? 'bg-brand-50 text-brand-500'
                    : 'bg-red-50 text-red-500'
                }`}>
                  {settingsMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={settingsSaving}
                className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {settingsSaving ? 'Saving…' : 'Save settings'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}