export default function TimeSlotGrid({ slots, selected, onSelect, loading }) {
    if (loading) {
      return <p className="text-sm text-ink/60">Checking available times…</p>;
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
              {slot}
            </button>
          );
        })}
      </div>
    );
  }