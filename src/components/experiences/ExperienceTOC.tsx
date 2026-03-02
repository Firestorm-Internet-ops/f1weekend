'use client';

import { useEffect, useState } from 'react';

export interface TOCSection {
  id: string;
  label: string;
}

interface Props {
  sections: TOCSection[];
}

export default function ExperienceTOC({ sections }: Props) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-10% 0px -70% 0px' }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="Page contents">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-3">
        On This Page
      </p>
      <ul className="space-y-0.5">
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <li key={s.id}>
              <button
                onClick={() => handleClick(s.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-all duration-200 border-l-2 ${
                  isActive
                    ? 'border-[var(--accent-teal)] text-[var(--accent-teal)] translate-x-1'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-white'
                }`}
                style={isActive ? { transform: 'translateX(4px)' } : {}}
              >
                {s.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
