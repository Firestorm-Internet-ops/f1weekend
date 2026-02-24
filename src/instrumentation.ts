export async function register() {
  // Only run on the server (not edge runtime), and skip in production —
  // the DB and schema already exist there. This auto-init is for local dev only.
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV !== 'production') {
    const { initDatabase } = await import('@/lib/db/init');
    await initDatabase();
  }
}
