import { planIssueActions } from '../src/lib/seo-loop/ticket';
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const token = process.env.GITHUB_TOKEN, repository = process.env.GITHUB_REPOSITORY;
  const response = await fetch('https://staging.f1weekend.co/api/seo-loop');
  if (!response.ok) throw new Error(`SEO loop endpoint returned ${response.status}: ${await response.text()}`);
  const data = await response.json() as { tickets: import('../src/lib/seo-loop/opportunities').PageTicket[]; issues: { title: string; body: string; labels: string[] }[] };
  if (dryRun) {
    for (const issue of data.issues) console.log(`${issue.title}\n${issue.body}\n`);
    return;
  }
  if (!token || !repository) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required');
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' };
  const base = `https://api.github.com/repos/${repository}/issues`;
  const listed = await fetch(`${base}?labels=seo-loop&state=open&per_page=100`, { headers });
  if (!listed.ok) throw new Error(`GitHub issue list failed: ${listed.status}`);
  const existing = await listed.json() as { number: number; body: string }[];
  for (const [index, action] of planIssueActions(existing, data.tickets).entries()) {
    const issue = data.issues[index];
    const url = action.action === 'update' ? `${base}/${action.number}` : base;
    const method = action.action === 'update' ? 'PATCH' : 'POST';
    const saved = await fetch(url, { method, headers, body: JSON.stringify(issue) });
    if (!saved.ok) throw new Error(`GitHub issue ${action.action} failed: ${saved.status}`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
