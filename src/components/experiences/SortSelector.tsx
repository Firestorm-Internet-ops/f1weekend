'use client';

export type SortOption = 'popular' | 'price-low' | 'price-high' | 'duration-short' | 'rating';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'price-low', label: 'Price ↑' },
  { value: 'price-high', label: 'Price ↓' },
  { value: 'duration-short', label: 'Shortest' },
  { value: 'rating', label: 'Top Rated' },
];

interface Props {
  active: SortOption;
  onChange: (sort: SortOption) => void;
}

export default function SortSelector({ active, onChange }: Props) {
  return (
    <select
      value={active}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="text-sm rounded-lg px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-teal)]"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
