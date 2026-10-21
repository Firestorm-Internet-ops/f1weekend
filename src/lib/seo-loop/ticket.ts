import type { PageTicket } from './opportunities';
export const ticketKey = (path: string) => `seo-loop:${path}`;
export function renderIssue(ticket: PageTicket) {
  const n = ticket.opportunities.length;
  const lines = [`<!-- seo-loop:${ticket.path} -->`, `https://f1weekend.co${ticket.path}`, '', '| Search | Type | Impressions | Clicks | Position |', '|---|---|---:|---:|---:|', ...ticket.opportunities.map((o) => `| ${o.query} | ${o.type} | ${o.impressions} | ${o.clicks} | ${o.position.toFixed(1)} |`), '', ticket.blockedUntil ? `Blocked until ${ticket.blockedUntil} (SEO experiment)` : `npm run seo:draft -- --path ${ticket.path}`];
  return { title: `SEO loop: ${ticket.path} (${n} ${n === 1 ? 'search' : 'searches'})`, body: lines.join('\n'), labels: ['seo-loop'] as ['seo-loop'] };
}
export function planIssueActions(openIssues: { number: number; body: string }[], tickets: PageTicket[]) {
  return tickets.map((ticket) => {
    const issue = openIssues.find((i) => i.body.includes(`<!-- seo-loop:${ticket.path} -->`));
    return issue ? { action: 'update' as const, number: issue.number, ticket } : { action: 'create' as const, ticket };
  });
}
