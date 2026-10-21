import { JWT } from 'google-auth-library';
export async function searchConsoleToken(): Promise<string> {
  const raw = process.env.GOOGLE_SA_KEY;
  if (!raw) throw new Error('GOOGLE_SA_KEY is required for Search Console access');
  const credentials = JSON.parse(raw) as { client_email: string; private_key: string };
  const client = new JWT({ email: credentials.client_email, key: credentials.private_key, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Google did not return a Search Console access token');
  return token.token;
}
