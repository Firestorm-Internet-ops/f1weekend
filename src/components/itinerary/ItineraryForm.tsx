'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const INTERESTS = [
  { value: 'food', label: '🍜 Food & Drink' },
  { value: 'culture', label: '🎭 Culture' },
  { value: 'adventure', label: '🧗 Adventure' },
  { value: 'daytrip', label: '🚌 Day Trips' },
  { value: 'nightlife', label: '🎶 Nightlife' },
];

const ARRIVAL_DAYS = [
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
];

const DEPARTURE_DAYS = [
  { value: 'Sunday', label: 'Sunday' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
];

export default function ItineraryForm() {
  const router = useRouter();
  const [arrivalDay, setArrivalDay] = useState('Thursday');
  const [departureDay, setDepartureDay] = useState('Sunday');
  const [interests, setInterests] = useState<string[]>(['food']);
  const [groupSize, setGroupSize] = useState(1);
  const [freeText, setFreeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (val: string) => {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (interests.length === 0) {
      setError('Please select at least one interest.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceSlug: 'melbourne-2026',
          arrivalDay,
          departureDay,
          interests,
          groupSize,
          freeText: freeText || undefined,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');

      const { id } = await res.json();
      router.push(`/itinerary/${id}`);
    } catch {
      setError('Failed to generate itinerary. Please try again.');
      setLoading(false);
    }
  };

  const dayButtonClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
      active
        ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-muted)] text-[var(--accent-teal)]'
        : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-white'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Arrival */}
      <div>
        <label className="block text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
          ARRIVAL DAY
        </label>
        <div className="flex gap-2 flex-wrap">
          {ARRIVAL_DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => setArrivalDay(day.value)}
              className={dayButtonClass(arrivalDay === day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Departure */}
      <div>
        <label className="block text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
          DEPARTURE DAY
        </label>
        <div className="flex gap-2 flex-wrap">
          {DEPARTURE_DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => setDepartureDay(day.value)}
              className={dayButtonClass(departureDay === day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
          INTERESTS{' '}
          <span className="text-[var(--text-muted)] normal-case font-normal">
            (select all that apply)
          </span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {INTERESTS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => toggleInterest(item.value)}
              className={dayButtonClass(interests.includes(item.value))}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Group size */}
      <div>
        <label className="block text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
          GROUP SIZE
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setGroupSize((g) => Math.max(1, g - 1))}
            className="w-9 h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-white hover:bg-[var(--bg-tertiary)] transition-colors text-lg flex items-center justify-center"
          >
            −
          </button>
          <span className="font-display font-bold text-xl text-white w-8 text-center mono-data">
            {groupSize}
          </span>
          <button
            type="button"
            onClick={() => setGroupSize((g) => Math.min(20, g + 1))}
            className="w-9 h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-white hover:bg-[var(--bg-tertiary)] transition-colors text-lg flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
          ANYTHING ELSE?{' '}
          <span className="text-[var(--text-muted)] normal-case font-normal">(optional)</span>
        </label>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="e.g. We love craft beer, have kids, prefer morning activities…"
          rows={3}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-white placeholder-[var(--text-muted)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-teal)] resize-none"
        />
      </div>

      {error && <p className="text-sm text-[var(--accent-red)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-full font-display font-bold text-lg bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Building your itinerary…
          </span>
        ) : (
          'Build My Itinerary ✦'
        )}
      </button>
    </form>
  );
}
