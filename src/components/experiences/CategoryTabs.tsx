'use client';

const TABS = [
  { value: '', label: 'All' },
  { value: 'food', label: 'Food' },
  { value: 'culture', label: 'Culture' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'daytrip', label: 'Day Trip' },
  { value: 'nightlife', label: 'Nightlife' },
] as const;

interface Props {
  active: string;
  onChange: (cat: string) => void;
}

export default function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-5 py-2.5 rounded-full text-base font-medium transition-all uppercase-label shrink-0 ${
            active === tab.value
              ? 'bg-[var(--accent-teal)] text-[var(--bg-primary)]'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
