import 'dotenv/config';
import Redis from 'ioredis';

async function main() {
  const r = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  await r.set('pitlane:test', 'ok');
  const val = await r.get('pitlane:test');
  console.log('Redis:', val === 'ok' ? 'PASS' : 'FAIL');
  await r.del('pitlane:test');
  r.disconnect();
}
main().catch(err => { console.error('Redis FAIL:', err.message); process.exit(1); });
