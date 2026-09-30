import Link from 'next/link';
import type { ClusterLink } from '@/data/clusters-2026';

/**
 * Links between a race page and its focused pages (topic-cluster experiment):
 * on the race page it introduces them; on each page it links to the others
 * and back to the race page.
 */
export default function ClusterNav({ links, raceKey, city, current, className = '' }: {
  links: ClusterLink[];
  raceKey: string;
  city: string;
  /** The page being shown (left out of the list); none on the race page. */
  current?: string;
  className?: string;
}) {
  const others = links.filter((l) => l.path !== current);
  return (
    <nav aria-labelledby="cluster-heading" className={className}>
      <h2 id="cluster-heading" className="font-display font-bold text-xl text-[var(--text-primary)] uppercase-heading mb-4">
        {current ? `More for your ${city} weekend` : `Plan your ${city} weekend`}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {others.map((l) => (
          <li key={l.path}>
            <Link
              href={`/races/${raceKey}/${l.path}`}
              className="group block h-full p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-red)]/50 hover:bg-[var(--bg-surface)] transition-all"
            >
              <span className="block font-display font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-red)] transition-colors">
                {l.label} <span aria-hidden>→</span>
              </span>
              <span className="block text-sm text-[var(--text-secondary)] mt-0.5">{l.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
      {current && (
        <Link href={`/races/${raceKey}`} className="inline-block mt-4 text-sm font-medium text-[var(--accent-red)] hover:underline">
          ← Back to the {city} race weekend guide
        </Link>
      )}
    </nav>
  );
}
