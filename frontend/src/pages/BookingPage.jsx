import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../api/api';
import TimeSlotGrid from '../components/TimeSlotGrid';
import PhonePreview from '../components/PhonePreview';

const todayStr = dayjs().format('YYYY-MM-DD');
const maxDateStr = dayjs().add(21, 'day').format('YYYY-MM-DD');

function convert24to12(time) {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export default function BookingPage() {
  const { slug } = useParams();
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedMessage, setConfirmedMessage] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/services/${slug}`)
      .then((res) => {
        setServices(res.data);
        if (res.data[0]) setServiceId(res.data[0]._id);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (!date) return;
    setSlotsLoading(true);
    setTime('');
    api
      .get('/appointments/available-slots', { params: { date, slug } })
      .then((res) => {
        setSlots(res.data.available);
        setBusinessName(res.data.businessName);
        if (res.data.blocked) {
          setError('This date is not available for booking. Please pick another date.');
        } else {
          setError('');
        }
      })
      .finally(() => setSlotsLoading(false));
  }, [date, slug]);

  const selectedService = services.find((s) => s._id === serviceId);

  const previewMessage =
    confirmedMessage ||
    (name && time && selectedService
      ? `Hi ${name}! Your ${selectedService.name} appointment at ${businessName} is confirmed for ${date} at ${convert24to12(time)}. See you then 🎉`
      : '');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!serviceId || !date || !time || !name || !phone) {
      setError('Fill in every field before booking.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/appointments', {
        customerName: name,
        customerPhone: phone.replace(/\s+/g, ''),
        service: serviceId,
        date,
        time,
        slug,
      });
      setConfirmedMessage(res.data.confirmationText);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center font-body">
        <div className="text-center">
          <p className="font-display text-xl font-bold text-ink mb-2">Business not found</p>
          <p className="text-ink/60 text-sm">Check the link and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-body">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-brand-500">Nudge</span>
          <a href="/login" className="text-sm text-ink/60 hover:text-brand-500">Business login</a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <section>
          <p className="font-display text-sm uppercase tracking-wide text-accent-500 mb-2">Book a slot</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-2">
            {businessName || 'Book your appointment'}
          </h1>
          <p className="text-ink/70 mb-8 max-w-md">
            Pick a service and time. You'll get a WhatsApp confirmation instantly, and a reminder the day before.
          </p>

          {confirmedMessage ? (
            <div className="rounded-2xl border border-brand-100 bg-white p-6">
              <p className="font-display text-xl font-semibold text-brand-500 mb-1">You're booked ✓</p>
              <p className="text-ink/70 text-sm">Check your WhatsApp — confirmation is on its way.</p>
              <button
                type="button"
                className="mt-4 text-sm font-medium text-accent-500 hover:underline"
                onClick={() => { setConfirmedMessage(''); setName(''); setPhone(''); setTime(''); }}
              >
                Book another appointment
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-brand-100 bg-white p-6">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Service</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
                >
                  {services.length === 0 && <option>No services available yet</option>}
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.durationMinutes} min){s.price ? ` — ₹${s.price}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Date</label>
                <input
                  type="date"
                  min={todayStr}
                  max={maxDateStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Time</label>
                <TimeSlotGrid slots={slots} selected={time} onSelect={setTime} loading={slotsLoading} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">WhatsApp number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-accent-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting || services.length === 0}
                className="w-full rounded-lg bg-accent-500 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-60"
              >
                {submitting ? 'Booking…' : 'Confirm booking'}
              </button>
            </form>
          )}
        </section>

        <section className="lg:sticky lg:top-10 hidden lg:block">
          <PhonePreview message={previewMessage} businessName={businessName} />
        </section>
      </main>
    </div>
  );
}