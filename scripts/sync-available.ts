import { syncAvailableRaces } from '../src/services/race.service';

async function run() {
  await syncAvailableRaces();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const secret = process.env.REVALIDATE_SECRET;

  if (secret) {
    console.log(`Calling revalidate endpoint at ${baseUrl}...`);
    try {
      const res = await fetch(`${baseUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'x-revalidate-token': secret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (res.ok) {
        console.log('Cache revalidated successfully');
      } else {
        const error = await res.text();
        console.error(`Cache revalidation failed: ${res.status} ${error}`);
      }
    } catch (err) {
      console.error('Failed to call revalidate endpoint:', err);
    }
  } else {
    console.warn('REVALIDATE_SECRET not found in environment, skipping cache bust');
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
