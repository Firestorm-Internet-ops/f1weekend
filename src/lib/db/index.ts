import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  const instanceConnectionName = process.env.CLOUD_SQL_INSTANCE;

  if (instanceConnectionName) {
    // Vercel / serverless: use Cloud SQL connector — no proxy binary needed
    const { Connector, IpAddressTypes } = await import('@google-cloud/cloud-sql-connector');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectorOpts: any = {};
    const credsJson = process.env.GOOGLE_CLOUD_CREDENTIALS;
    if (credsJson) {
      const { GoogleAuth } = await import('google-auth-library');
      connectorOpts.auth = new GoogleAuth({
        credentials: JSON.parse(credsJson),
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }

    const connector = new Connector(connectorOpts);
    const clientOpts = await connector.getOptions({
      instanceConnectionName,
      ipType: IpAddressTypes.PUBLIC,
    });

    const pool = mysql.createPool({
      ...clientOpts,
      user: process.env.DATABASE_USER ?? 'root',
      password: process.env.DATABASE_PASSWORD ?? '',
      database: process.env.DATABASE_NAME ?? 'pitlane',
      waitForConnections: true,
      connectionLimit: 5,
    });

    _db = drizzle(pool, { schema, mode: 'default' });
  } else {
    // Local dev: direct TCP connection
    const pool = mysql.createPool({
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USER ?? 'root',
      password: process.env.DATABASE_PASSWORD ?? '',
      database: process.env.DATABASE_NAME ?? 'pitlane',
      waitForConnections: true,
      connectionLimit: 5,
    });

    _db = drizzle(pool, { schema, mode: 'default' });
  }
}

export async function getDb() {
  if (_db) return _db as ReturnType<typeof drizzle<typeof schema>>;
  if (!_initPromise) _initPromise = init();
  await _initPromise;
  return _db as ReturnType<typeof drizzle<typeof schema>>;
}
