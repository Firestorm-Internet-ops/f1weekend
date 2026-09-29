import type { Offer } from './types';

/** Primary (the experience's own listing) first, then cheapest. */
export function sortOffers(offers: Offer[]): Offer[] {
  return [...offers].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.priceAmount ?? Infinity) - (b.priceAmount ?? Infinity);
  });
}
