const rateLimitedUntil = new Map<string, number>();

export async function fetchOpenF1(endpoint: string, params: Record<string, string | number>) {
    // Build query string with encodeURIComponent on keys so that comparison operators
    // in keys (e.g. 'speed>=') are percent-encoded to 'speed%3E%3D', which is the
    // format OpenF1 expects (matching the official Python SDK: params={'speed>=': 280}).
    const queryParts = Object.entries(params).map(
        ([key, value]) => `${encodeURIComponent(key)}=${String(value)}`
    );
    const url = `https://api.openf1.org/v1/${endpoint}?${queryParts.join('&')}`;
    const cacheKey = `${endpoint}?${queryParts.join('&')}`;
    const now = Date.now();

    // If we were recently rate-limited for this exact query, skip until cooldown expires.
    const blockedUntil = rateLimitedUntil.get(cacheKey);
    if (blockedUntil && blockedUntil > now) {
        return null;
    }

    try {
        // Use a long revalidation time for historical data as it won't change.
        const res = await fetch(url, {
            cache: 'force-cache',
            next: { revalidate: 604800 }, // 1 week
        });

        if (!res.ok) {
            // 404 = OpenF1 has no data for this query (expected for future/missing sessions).
            // 429 = rate-limited by OpenF1. Treat this as expected and back off.
            if (res.status === 429) {
                const retryAfterHeader = res.headers.get('retry-after');
                const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;
                const cooldownMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                    ? retryAfterSeconds * 1000
                    : 5 * 60 * 1000;
                rateLimitedUntil.set(cacheKey, now + cooldownMs);
                return null;
            }

            // Only log unexpected server errors.
            if (res.status !== 404) {
                console.error(`OpenF1 API error for ${endpoint}: ${res.status} ${res.statusText}`);
            }
            return null;
        }

        // Clear any stale cooldown once a request succeeds.
        rateLimitedUntil.delete(cacheKey);
        return await res.json();
    } catch (error) {
        console.error(`OpenF1 fetch error for ${endpoint}:`, error);
        return null;
    }
}
