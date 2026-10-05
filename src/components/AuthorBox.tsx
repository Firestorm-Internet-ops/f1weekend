import Image from 'next/image';
import Link from 'next/link';
import { authorPath, type Author } from '@/data/authors';

/** "Researched & written by" card: photo, name, bio, favourite cities. */
export default function AuthorBox({ author, className = '', linkName = true }: { author: Author; className?: string; linkName?: boolean }) {
  return (
    <aside className={`flex flex-col sm:flex-row gap-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 ${className}`} aria-label="About the author">
      <Image src={author.photo} alt={`Photo of ${author.name}`} width={96} height={96} className="w-24 h-24 rounded-full object-cover shrink-0" />
      <div>
        <p className="text-xs font-semibold uppercase-label tracking-widest text-[var(--accent-red)] mb-1">Researched &amp; written by</p>
        <p className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">
          {linkName ? <Link href={authorPath(author)} className="hover:underline">{author.name}</Link> : author.name}
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{author.bio}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          <span className="font-medium text-[var(--text-primary)]">Favourite cities:</span> {author.favouriteCities.join(', ')}
        </p>
        {author.sameAs.length > 0 && (
          <p className="text-sm mt-2">
            {author.sameAs.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener" className="text-[var(--accent-red)] hover:underline">
                {author.name} on {s.label} →
              </a>
            ))}
          </p>
        )}
      </div>
    </aside>
  );
}
