import { getRaceBySlug, getSessionsByRace, getWindowsByRace } from '@/services/race.service';
import { getExperiencesByWindow } from '@/services/experience.service';
import RaceSchedule from '@/components/race/RaceSchedule';
import RaceCountdown from '@/components/race/RaceCountdown';
import CircuitMap from '@/components/race/CircuitMap';

export default async function HomePage() {
  const race = await getRaceBySlug('melbourne-2026');

  if (!race) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">
        Race data unavailable.
      </div>
    );
  }

  const [sessions, windows] = await Promise.all([
    getSessionsByRace(race.id),
    getWindowsByRace(race.id),
  ]);

  const windowCounts = await Promise.all(
    windows.map(async (w) => ({
      slug: w.slug,
      count: (await getExperiencesByWindow(w.slug, race.id)).length,
    }))
  );

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-12 px-4">
        {/* Background layers */}
        <div className="absolute inset-0 carbon-texture" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(225,6,0,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 hero-gradient" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[420px]">
            {/* Left: text + countdown */}
            <div className="flex flex-col justify-center py-8">
              <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-5 tracking-widest">
                🏎 Australian Grand Prix 2026 · Melbourne · Mar 5–8
              </p>

              <h1 className="font-display font-black text-5xl md:text-6xl text-white uppercase-heading leading-tight mb-4">
                When are
                <br />
                you free?
              </h1>

              <p className="text-[var(--text-secondary)] text-base md:text-lg mb-8 max-w-sm">
                Pick your session gap and discover the best of Melbourne — curated for race
                weekend.
              </p>

              {/* Countdown */}
              <div>
                <p className="text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3 tracking-widest">
                  LIGHTS OUT IN
                </p>
                <RaceCountdown />
              </div>
            </div>

            {/* Right: circuit map */}
            <div className="hidden md:flex items-center justify-center relative">
              {/* Glow behind circuit */}
              <div
                className="absolute w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(225,6,0,0.12) 0%, transparent 70%)',
                }}
              />
              <CircuitMap className="w-full max-w-sm opacity-90" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Race schedule + gap cards ── */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <div className="racing-stripe mb-8" />
        <RaceSchedule sessions={sessions} windows={windows} windowCounts={windowCounts} />
      </section>
    </div>
  );
}
