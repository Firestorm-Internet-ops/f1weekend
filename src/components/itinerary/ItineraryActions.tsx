'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ManualItineraryInput } from '@/types/itinerary';
import { raceKey } from '@/lib/race-url';

/** "Edit" (reopens the form with the same choices) and "Share" (native share sheet, else copy link). */
export default function ItineraryActions({ input, title }: { input?: ManualItineraryInput; title: string }) {
    const [copied, setCopied] = useState(false);
    const editHref = input
        ? `/itinerary?race=${raceKey(input.raceSlug)}&arrive=${input.arrivalDay}&depart=${input.departureDay}&sessions=${input.sessionIds.join(',')}`
        : '/itinerary';

    async function share() {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title, url });
                return;
            }
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Share sheet closed: nothing to do.
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Link
                href={editHref}
                className="inline-flex items-center min-h-11 px-5 rounded-full border border-[var(--border-medium)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
                ✎ Edit plan
            </Link>
            <button
                type="button"
                onClick={share}
                className="inline-flex items-center min-h-11 px-5 rounded-full bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-sm font-semibold text-white transition-colors"
            >
                {copied ? 'Link copied ✓' : 'Share plan ↗'}
            </button>
        </div>
    );
}
