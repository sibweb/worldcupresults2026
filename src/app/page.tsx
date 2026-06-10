import type { Route } from "next";
import Link from "next/link";

import { FixtureCard } from "@/components/fixture-card";
import { SiteShell } from "@/components/site-shell";
import { formatUkKickoff } from "@/lib/format";
import {
  createTeamLookup,
  getAssignedPeople,
  getDashboardSummary,
  getRecentResults,
  getSweepstakeLeaderboard,
  getTournamentSnapshot,
  getTopGoalkeepers,
  getTopScorers,
} from "@/lib/world-cup-data";

export default async function HomePage() {
  const snapshot = await getTournamentSnapshot();
  const teamsById = createTeamLookup(snapshot);
  const summary = getDashboardSummary(snapshot);
  const upcomingFixtures = snapshot.matches
    .filter((match) => match.status === "upcoming")
    .sort((left, right) => left.kickoffUtc.localeCompare(right.kickoffUtc))
    .slice(0, 3);
  const recentResults = getRecentResults(snapshot, 4);
  const leaderboard = getSweepstakeLeaderboard(snapshot).slice(0, 4);
  const goldenBootLeader = getTopScorers(snapshot)[0];
  const goalkeeperLeader = getTopGoalkeepers(snapshot)[0];

  return (
    <SiteShell
      title="Fixtures, progress, sweepstakes."
      intro="Follow every World Cup 2026 team, read kickoff times in UK local time, track eliminations, and see who is leading the sweepstakes and player awards."
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Champion</p>
            <h2 className="card-title">{summary.winner?.name}</h2>
            <span className="stat-value">1st</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Runner-up</p>
            <h2 className="card-title">{summary.runnerUp?.name}</h2>
            <span className="stat-value">2nd</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">First team out</p>
            <h2 className="card-title">{summary.firstOut?.name}</h2>
            <span className="stat-value">Group</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Sweepstakes leader</p>
            <h2 className="card-title">{summary.leader?.name}</h2>
            <span className="stat-value">{summary.leader?.team.name}</span>
          </article>
        </div>
      }
    >
      <section className="page-header">
        <p className="eyebrow">Live tournament desk</p>
        <div className="pill-row">
          <span className="pill">Last sync {formatUkKickoff(summary.lastSync)}</span>
          <span className="pill">{snapshot.teams.length} teams in the current feed</span>
          <span className="pill">UK kickoff formatting enabled</span>
          <span className="pill">{snapshot.syncMetadata.providerName}</span>
        </div>
      </section>

      <section className="grid three">
        <article className="card">
          <p className="kicker">Golden Boot</p>
          <h2 className="card-title">{goldenBootLeader?.name ?? "Unavailable"}</h2>
          <span className="stat-value">{goldenBootLeader ? `${goldenBootLeader.goals} goals` : "Awaiting feed"}</span>
          <p className="muted">{goldenBootLeader?.teamId ? teamsById[goldenBootLeader.teamId]?.name : "Live player-level scoring stats are not available from the provider yet."}</p>
        </article>
        <article className="card">
          <p className="kicker">Best goalkeeper</p>
          <h2 className="card-title">{goalkeeperLeader?.name ?? "Unavailable"}</h2>
          <span className="stat-value">{goalkeeperLeader ? `${goalkeeperLeader.cleanSheets} clean sheets` : "Awaiting feed"}</span>
          <p className="muted">{goalkeeperLeader?.teamId ? teamsById[goalkeeperLeader.teamId]?.name : "Live goalkeeper metrics are not available from the provider yet."}</p>
        </article>
        <article className="card">
          <p className="kicker">Teams tracked</p>
          <h2 className="card-title">{snapshot.teams.length} teams</h2>
          <span className="stat-value">{snapshot.matches.length} fixtures</span>
          <p className="muted">Each team has a dedicated progress page and assignment record.</p>
        </article>
      </section>

      <section className="grid two section-block">
        <article className="card stack">
          <div className="spread">
            <div>
              <p className="kicker">Recent results</p>
              <h2 className="card-title">Latest completed matches</h2>
            </div>
            <Link href="/fixtures">View all</Link>
          </div>
          <div className="stack">
            {recentResults.map((match) => (
              <FixtureCard key={match.id} match={match} teamsById={teamsById} />
            ))}
          </div>
        </article>

        <article className="card stack">
          <div className="spread">
            <div>
              <p className="kicker">Sweepstakes watch</p>
              <h2 className="card-title">Top performers right now</h2>
            </div>
            <Link href="/sweepstakes">View sweepstakes</Link>
          </div>
          <ul className="list">
            {leaderboard.map((entry) => {
              const owners = getAssignedPeople(snapshot, entry.team.id);

              return (
                <li className="fixture" key={entry.personId}>
                  <div className="spread">
                    <strong>{entry.name}</strong>
                    <span className="chip done">{entry.points} pts</span>
                  </div>
                  <div>
                    <div className="team-badge">
                      <span className="team-code">{entry.team.fifaCode}</span>
                      <span>{entry.team.name}</span>
                    </div>
                    <p className="muted">
                      {entry.team.status}
                      {owners.length > 0 ? ` • managed by ${owners.map((person) => person.name).join(", ")}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="grid two section-block">
        <article className="card stack">
          <div className="spread">
            <div>
              <p className="kicker">Upcoming in UK time</p>
              <h2 className="card-title">Next kickoffs</h2>
            </div>
            <Link href="/fixtures">Fixture board</Link>
          </div>
          <div className="stack">
            {upcomingFixtures.length > 0 ? (
              upcomingFixtures.map((match) => <FixtureCard key={match.id} match={match} teamsById={teamsById} />)
            ) : (
              <div className="notice">No upcoming fixtures are currently in the active feed.</div>
            )}
          </div>
        </article>

        <article className="card stack">
          <div>
            <p className="kicker">Team directory</p>
            <h2 className="card-title">Jump to a team</h2>
          </div>
          <div className="grid two">
            {snapshot.teams.map((team) => (
              <Link className="fixture" href={`/teams/${team.slug}` as Route} key={team.id}>
                <div className="spread">
                  <span className="team-badge">
                    <span className="team-code">{team.fifaCode}</span>
                    <span>{team.name}</span>
                  </span>
                  <span className="chip done">{team.status}</span>
                </div>
                <p className="muted">{team.summary}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </SiteShell>
  );
}