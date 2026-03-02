import type { ReviewSnapshot } from '@/types/experience';

interface Props {
  reviews: ReviewSnapshot[];
}

export default function ReviewQuotes({ reviews }: Props) {
  // Show top 3 five-star reviews, sorted by length desc for substance
  const topReviews = reviews
    .filter((r) => r.rating === 5)
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 3);

  if (topReviews.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {topReviews.map((review, i) => (
        <blockquote
          key={i}
          className="p-4 rounded-xl border border-[var(--accent-teal)]/20 bg-[var(--accent-teal)]/5"
        >
          <p className="text-sm text-white leading-relaxed italic mb-2">
            &ldquo;{review.text}&rdquo;
          </p>
          <footer className="text-xs text-[var(--text-secondary)]">
            — {review.author}{review.country ? `, ${review.country}` : ''}{' '}
            <span className="text-yellow-400">{'★'.repeat(review.rating)}</span>
          </footer>
        </blockquote>
      ))}
    </div>
  );
}
