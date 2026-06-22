import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, withAuth, clearAuth, getStoredBusiness } from '../api/api';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', durationMinutes: 30, price: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const business = getStoredBusiness();

  function loadData() {
    setLoading(true);
    Promise.all([
      api.get('/appointments', withAuth()),
      api.get(`/services/${business?.slug}`),
    ])
      .then(([apptRes, svcRes]) => {
        setAppointments(apptRes.data);
        setServices(svcRes.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          clearAuth();
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div className="min-h-screen bg-bg font-body">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <span className="font-display text-xl font-bold text-brand-500">Nudge</span>
            <span className="ml-2 text-sm text-ink/50">{business?.name}</span>
          </div>
          <button onClick={logout} className="text-sm text-ink/60 hover:text-accent-500">
            Log out
          </button>
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
          
          <a
            href={`/book/${business?.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-brand-500 hover:underline"
          >
            Open →
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
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

        <section>
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
      </main>
    </div>
  );
}