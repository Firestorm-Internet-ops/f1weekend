export async function fetchOpenF1(endpoint: string, params: Record<string, string | number>) {
    // Build query string with encodeURIComponent on keys so that comparison operators
    // in keys (e.g. 'speed>=') are percent-encoded to 'speed%3E%3D', which is the
    // format OpenF1 expects (matching the official Python SDK: params={'speed>=': 280}).
    const queryParts = Object.entries(params).map(
        ([key, value]) => `${encodeURIComponent(key)}=${String(value)}`
    );
    const url = `https://api.openf1.org/v1/${endpoint}?${queryParts.join('&')}`;

    try {
        // Use a long revalidation time for historical data as it won't change.
        const res = await fetch(url, { next: { revalidate: 604800 } }); // 1 week

        if (!res.ok) {
            // Don't throw, just log and return null so the page can render without this data.
            console.error(`OpenF1 API error for ${endpoint}: ${res.status} ${res.statusText}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error(`OpenF1 fetch error for ${endpoint}:`, error);
        return null;
    }
}