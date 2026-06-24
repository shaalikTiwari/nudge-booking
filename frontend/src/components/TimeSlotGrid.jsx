export default function TimeSlotGrid({ slots, selected, onSelect, loading }) {
  function convert24to12(time) {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-lg border border-brand-100 bg-brand-50 px-2 py-2 h-9 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return <p className="text-sm text-ink/60">No open slots this day — try another date.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = slot === selected;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? 'border-accent-500 bg-accent-500 text-white'
                : 'border-brand-100 bg-white text-ink hover:border-brand-400'
            }`}
          >
            {convert24to12(slot)}
          </button>
        );
      })}
    </div>
  );
}