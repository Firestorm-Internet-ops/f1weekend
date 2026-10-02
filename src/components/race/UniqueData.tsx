import type { Race, Session } from '@/types/race';
import type { FeedCard } from '@/lib/providers/nearby-feed';
import { FEED_CATEGORY_LABELS, displayTitle } from '@/lib/providers/nearby-feed';
import { gapPlanner, money, priceGuide, weatherSummary, winsByTeam, type RaceDayWeather } from '@/lib/unique-data';
import type { CircuitHistory, ForecastDay, Standings } from '@/services/race-stats.service';
import type { UniqueDataRace } from '@/data/unique-data-2026';
import BookTourButton from '@/components/race/BookTourButton';

/**
 * "Unique data" block (SEO experiment): facts at a glance, race-day weather
 * history and forecast, a form guide, travel times, a tour price guide and a
 * session-gap planner. Every section is left out when its data is missing.
 */
export default function UniqueData({ race, config, cards, sessions, standings, history, weather, forecast, className = '' }: {
  race: Race;
  config: UniqueDataRace;
  cards: FeedCard[];
  sessions: Session[];
  standings: Standings | null;
  history: CircuitHistory | null;
  weather: RaceDayWeather[] | null;
  forecast: ForecastDay[] | null;
  className?: string;
}) {
  const where = config.circuitShort;
  const wx = weather && weather.length > 0 ? weatherSummary(weather) : null;
  const teamWins = history ? winsByTeam(history.wins) : [];
  const prices = priceGuide(cards);
  const plans = gapPlanner(cards, sessions);
  const winnerOf = new Map((history?.wins ?? []).map((w) => [w.season, w]));
  const totalFit = plans.reduce((n, p) => n + p.count, 0);

  const facts: string[] = [
    ...(wx ? [`Rain on race day: ${wx.wet} of the last ${wx.years} Grands Prix at ${where}${wx.heavy ? ` (downpours in ${wx.heavyYears.join(' and ')})` : ''}.`] : []),
    ...(teamWins[0] && history ? [`Most wins at ${where} in the last ${history.wins.length} races: ${teamWins[0].team} (${teamWins[0].wins}).`] : []),
    ...(standings?.drivers[0] ? [`Championship leader: ${standings.drivers[0].name} (${standings.drivers[0].team}), ${standings.drivers[0].points} points after round ${standings.round}.`] : []),
    `Fastest way in on race day: ${config.fastestWay}.`,
    ...(totalFit > 0 ? [`${totalFit} bookable tours fit around the ${race.season} sessions.`] : []),
  ];

  const h2 = 'font-display font-bold text-2xl text-[var(--text-primary)] mb-3';
  const th = 'text-left font-medium text-[var(--text-secondary)] px-3 py-2';
  const td = 'px-3 py-2 border-t border-[var(--border-subtle)]';

  return (
    <div className={`space-y-12 ${className}`}>
      <section aria-labelledby="glance-heading" className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
        <h2 id="glance-heading" className="font-display font-bold text-lg text-[var(--text-primary)] mb-3">{race.name} at a glance</h2>
        <ul className="space-y-2">
          {facts.map((f) => (
            <li key={f} className="flex gap-2 text-[var(--text-secondary)] leading-relaxed"><span aria-hidden className="text-[var(--accent-red)]">•</span>{f}</li>
          ))}
        </ul>
      </section>

      {wx && weather && (
        <section id="weather" aria-labelledby="weather-heading" className="scroll-mt-24">
          <h2 id="weather-heading" className={h2}>Will it rain at {where} on race day?</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            It rained on {wx.wet} of the last {wx.years} race days at {where}{wx.heavy ? `, with real downpours (10 mm or more) in ${wx.heavyYears.join(' and ')}` : ''}. Race days averaged {wx.avgMaxC} °C in the afternoon and {wx.avgMinC} °C overnight. Pack a light rain jacket either way: showers here can arrive in minutes.
          </p>
          {forecast && forecast.length > 0 ? (
            <div className="mb-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
              <p className="font-medium text-[var(--text-primary)] mb-2">Forecast for race weekend</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                {forecast.map((f) => (
                  <li key={f.date} className="text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">{new Date(`${f.date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}</span>
                    {' · '}{f.minC != null && f.maxC != null ? `${Math.round(f.minC)}–${Math.round(f.maxC)} °C` : '—'}
                    {f.rainChance != null && ` · ${f.rainChance}% chance of rain`}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] mb-5">The race-weekend forecast appears here about two weeks before the race.</p>
          )}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
            <table className="w-full text-sm">
              <caption className="sr-only">Race-day weather at {where}</caption>
              <thead className="bg-[var(--bg-secondary)]"><tr><th className={th}>Year</th><th className={th}>Rain</th><th className={th}>Temperature</th><th className={th}>Winner</th></tr></thead>
              <tbody>
                {weather.map((d) => (
                  <tr key={d.date}>
                    <td className={td}>{d.season}</td>
                    <td className={`${td} ${(d.rainMm ?? 0) >= 10 ? 'font-semibold text-[var(--accent-red)]' : ''}`}>{d.rainMm == null ? '—' : d.rainMm >= 1 ? `${d.rainMm} mm` : 'Dry'}</td>
                    <td className={td}>{d.minC != null && d.maxC != null ? `${Math.round(d.minC)}–${Math.round(d.maxC)} °C` : '—'}</td>
                    <td className={td}>{winnerOf.get(d.season) ? `${winnerOf.get(d.season)!.driver} (${winnerOf.get(d.season)!.team})` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">Rain is the day&apos;s total at the circuit (Open-Meteo historical archive); a race can still run dry around a morning shower.</p>
        </section>
      )}

      {(standings || history) && (
        <section id="form-guide" aria-labelledby="form-heading" className="scroll-mt-24">
          <h2 id="form-heading" className={h2}>Who is in form for the {race.name}?</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            History, not a prediction: the 2026 rules brought all-new cars, so past results at {where} say less than usual. Current form matters most.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standings && (
              <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
                <table className="w-full text-sm">
                  <caption className="text-left font-medium text-[var(--text-primary)] px-3 pt-3">Drivers after round {standings.round}</caption>
                  <tbody>
                    {standings.drivers.map((d) => (
                      <tr key={d.name}><td className={td}>{d.position}</td><td className={td}>{d.name}<span className="block text-xs text-[var(--text-muted)]">{d.team}</span></td><td className={`${td} text-right mono-data`}>{d.points}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {standings && (
              <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
                <table className="w-full text-sm">
                  <caption className="text-left font-medium text-[var(--text-primary)] px-3 pt-3">Teams after round {standings.round}</caption>
                  <tbody>
                    {standings.teams.map((t) => (
                      <tr key={t.team}><td className={td}>{t.position}</td><td className={td}>{t.team}</td><td className={`${td} text-right mono-data`}>{t.points}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {standings && standings.recent.length > 0 && (
            <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
              Last {standings.recent.length} races: {standings.recent.map((r) => `${r.race.replace(/ Grand Prix$/, '')}, ${r.driver} (${r.team})`).join('; ')}.
            </p>
          )}
          {history && teamWins.length > 0 && (
            <p className="text-[var(--text-secondary)] leading-relaxed mt-2">
              Wins at {where} in the last {history.wins.length} races: {teamWins.map((t) => `${t.team} ${t.wins}`).join(', ')}. Last year: {history.wins[0].driver} ({history.wins[0].team}).
            </p>
          )}
        </section>
      )}

      <section id="getting-there" aria-labelledby="travel-heading" className="scroll-mt-24">
        <h2 id="travel-heading" className={h2}>How long does it take to get to {where}?</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
          <table className="w-full text-sm">
            <caption className="sr-only">Race-day travel times to {where}, in minutes</caption>
            <thead className="bg-[var(--bg-secondary)]"><tr><th className={th}>From</th><th className={th}>By train</th><th className={th}>Train (min)</th><th className={th}>Car / Uber (min)</th></tr></thead>
            <tbody>
              {config.travel.map((t) => (
                <tr key={t.from}>
                  <td className={`${td} font-medium text-[var(--text-primary)]`}>{t.from}{t.note && <span className="block text-xs font-normal text-[var(--text-muted)]">{t.note}</span>}</td>
                  <td className={td}>{t.byTrain}</td>
                  <td className={`${td} mono-data`}>{t.trainMins}</td>
                  <td className={`${td} mono-data`}>{t.carMins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">{config.travelNote}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Door-to-door estimates for race days from the timetables in the sources; allow extra time on Sunday.</p>
      </section>

      {prices.length > 0 && (
        <section id="prices" aria-labelledby="prices-heading" className="scroll-mt-24">
          <h2 id="prices-heading" className={h2}>How much do tours cost in {race.city} on race weekend?</h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
            <table className="w-full text-sm">
              <caption className="sr-only">Typical tour prices by kind of tour</caption>
              <thead className="bg-[var(--bg-secondary)]"><tr><th className={th}>Kind of tour</th><th className={th}>Tours</th><th className={th}>Typical price</th><th className={th}>Most cost</th></tr></thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.category}>
                    <td className={`${td} font-medium text-[var(--text-primary)]`}>{FEED_CATEGORY_LABELS[p.category]}</td>
                    <td className={`${td} mono-data`}>{p.count}</td>
                    <td className={`${td} mono-data`}>{money(p.median, p.currency)}</td>
                    <td className={`${td} mono-data`}>{money(p.low, p.currency)}–{money(p.high, p.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">&ldquo;From&rdquo; prices per person across {prices.reduce((n, p) => n + p.count, 0)} live listings on GetYourGuide, Viator and Tiqets, refreshed every 6 hours. &ldquo;Most cost&rdquo; is the middle half of prices.</p>
        </section>
      )}

      {plans.length > 0 && (
        <section id="session-gaps" aria-labelledby="gaps-heading" className="scroll-mt-24">
          <h2 id="gaps-heading" className={h2}>What can you do between sessions?</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">Each free slot of the weekend, how many bookable tours fit in it (travel to and from the circuit included) and the three best.</p>
          <div className="space-y-4">
            {plans.map((p) => (
              <div key={p.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                <p className="font-medium text-[var(--text-primary)]">{p.label.replace(/^Fits /, '')} <span className="text-sm font-normal text-[var(--text-secondary)]">· {p.count} tour{p.count === 1 ? '' : 's'} fit</span></p>
                <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
                  {p.top.map((c) => (
                    <li key={c.key} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="block text-sm text-[var(--text-primary)] truncate">{displayTitle(c.title, [race.city])}</span>
                        <span className="block text-xs text-[var(--text-muted)]">
                          {c.offers[0]?.priceAmount != null ? `From ${money(c.offers[0].priceAmount, c.offers[0].priceCurrency)}` : ''}
                          {c.rating ? ` · ★ ${c.rating.toFixed(1)} (${c.reviewCount.toLocaleString()})` : ''}
                        </span>
                      </span>
                      {c.offers[0] && <BookTourButton raceSlug={race.slug} provider={c.offers[0].provider} productId={c.offers[0].productId} />}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
