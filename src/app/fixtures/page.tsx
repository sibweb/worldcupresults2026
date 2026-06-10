import { FixtureCard } from "@/components/fixture-card";
import { SiteShell } from "@/components/site-shell";
import { formatUkDate } from "@/lib/format";
import { createTeamLookup, getTournamentSnapshot } from "@/lib/world-cup-data";

export default async function FixturesPage() {
  const snapshot = await getTournamentSnapshot();
  const teamsById = createTeamLookup(snapshot);
  const groupedMatches = Object.entries(
    snapshot.matches.reduce<Record<string, typeof snapshot.matches>>((accumulator, match) => {
      const key = match.kickoffUtc.slice(0, 10);
      accumulator[key] ??= [];
      accumulator[key].push(match);
      return accumulator;
    }, {}),
  ).sort(([left], [right]) => left.localeCompare(right));

  return (
    <SiteShell
      title="Fixture board in UK time."
      intro="Every World Cup fixture from the live schedule feed, grouped by UK calendar day, with direct links through to team pages where opponents are confirmed."
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Tracked teams</p>
            <span className="stat-value">{snapshot.teams.length}</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Total fixtures</p>
            <span className="stat-value">{snapshot.matches.length}</span>
          </article>
        </div>
      }
    >
      <section className="page-header">
        <p className="eyebrow">Fixtures and results</p>
        <p className="muted">Kickoff times are rendered in Europe/London so the display stays accurate around daylight saving changes.</p>
      </section>

      <section className="stack">
        {groupedMatches.map(([dateKey, dayMatches]) => (
          <article className="card stack" key={dateKey}>
            <div>
              <p className="kicker">Matchday</p>
              <h2 className="card-title">{formatUkDate(dayMatches[0].kickoffUtc)}</h2>
            </div>
            <div className="stack">
              {dayMatches.map((match) => (
                <FixtureCard key={match.id} match={match} teamsById={teamsById} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}