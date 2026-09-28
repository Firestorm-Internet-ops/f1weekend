import type { Experience } from '@/types/experience';
import type { Offer } from '@/lib/providers';
import { providerName } from '@/lib/providers/meta';
import BookButton from '@/components/experiences/BookButton';

interface Props {
  experience: Experience;
  offers: Offer[];
}

function price(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/** Side-by-side booking options when more than one provider sells this experience. */
export default function OfferComparison({ experience, offers }: Props) {
  if (offers.length < 2) return null;
  const cheapest = Math.min(...offers.map((o) => o.priceAmount ?? Infinity));

  return (
    <section id="compare" className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      <h2 className="font-medium text-white mb-1 text-sm">Compare {offers.length} booking sites</h2>
      <p className="text-xs text-[var(--text-secondary)] mb-3">Same experience, different sellers. Prices per person, checked recently.</p>
      <ul className="space-y-2">
        {offers.map((o) => {
          const perks = [
            o.flags.freeCancellation && 'Free cancellation',
            o.flags.instantConfirmation && 'Instant confirmation',
            o.flags.skipTheLine && 'Skip the line',
          ].filter(Boolean) as string[];
          return (
            <li
              key={`${o.provider}-${o.productId ?? o.id}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white leading-snug">
                  {providerName(o.provider)}
                  {o.priceAmount !== null && o.priceAmount === cheapest && (
                    <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 uppercase-label">
                      Lowest price
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {o.priceAmount !== null ? `From ${price(o.priceAmount, o.priceCurrency)}` : 'See price'}
                  {o.rating ? ` · ★ ${o.rating.toFixed(1)}` : ''}
                  {o.reviewCount ? ` (${o.reviewCount.toLocaleString()})` : ''}
                  {perks.length > 0 ? ` · ${perks.join(' · ')}` : ''}
                </p>
              </div>
              <BookButton
                experience={experience}
                offer={{ id: o.id, provider: o.provider }}
                source="feed"
                label="Check price →"
                className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
