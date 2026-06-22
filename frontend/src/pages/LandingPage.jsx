import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: '📅',
    title: 'Online booking page',
    desc: 'Your customers get a clean link they can use to book a slot 24/7 — no phone calls needed.',
  },
  {
    icon: '💬',
    title: 'Instant WhatsApp confirmation',
    desc: 'The moment someone books, they get a WhatsApp message confirming the details automatically.',
  },
  {
    icon: '🔔',
    title: 'Automatic day-before reminder',
    desc: 'Nudge sends a reminder to every customer the day before their appointment — no-shows drop.',
  },
  {
    icon: '📊',
    title: 'Simple admin dashboard',
    desc: 'See all your appointments in one place. Mark them done or cancel with one click.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg font-body">
      {/* Nav */}
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-brand-500">Nudge</span>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-ink/70 hover:text-brand-500"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-display text-sm uppercase tracking-wide text-accent-500 mb-3">
          For salons, clinics, gyms & tutors
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink mb-5 leading-tight">
          Stop losing customers<br />to forgotten appointments
        </h1>
        <p className="text-ink/70 text-lg mb-8 max-w-xl mx-auto">
          Nudge gives your business a booking page, sends instant WhatsApp confirmations, and reminds your customers the day before — automatically.
        </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-600"
            >
              Set up your business free →
            </button>
            <a
              href="/book/nudge-demo"
              className="rounded-lg border border-brand-100 bg-white px-6 py-3 text-sm font-semibold text-ink hover:border-brand-400"
            >
              See a live demo
            </a>
          </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-brand-100 bg-white p-5">
              <p className="text-2xl mb-3">{f.icon}</p>
              <p className="font-display font-semibold text-ink mb-1">{f.title}</p>
              <p className="text-sm text-ink/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-brand-500 py-14 text-center px-4">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
          Ready to stop the no-shows?
        </h2>
        <p className="text-brand-100 mb-6 text-sm">
          Takes 2 minutes to set up. No credit card required.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="rounded-lg bg-accent-500 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-600"
        >
          Register your business →
        </button>
      </section>

      <footer className="py-6 text-center text-xs text-ink/40">
        Built by Shaalik Tiwari · {new Date().getFullYear()}
      </footer>
    </div>
  );
}