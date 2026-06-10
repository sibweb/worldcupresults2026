import type { Route } from "next";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { createTeamLookup, getTournamentSnapshot } from "@/lib/world-cup-data";

export default async function TeamsDirectoryPage() {
  const snapshot = await getTournamentSnapshot();

  return (
    <SiteShell
      title="Team directory."
      intro="Browse all teams in the World Cup 2026 tournament. Each team has its own page showing fixtures, status, coach, and sweepstakes assignment."
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Total teams</p>
            <span className="stat-value">{snapshot.teams.length}</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Regions</p>
            <span className="stat-value">{new Set(snapshot.teams.map((t) => t.region)).size}</span>
          </article>
        </div>
      }
    >
      <section className="page-header">
        <p className="eyebrow">Teams and assignments</p>
        <p className="muted">Click any team to see fixtures, status, coach info, and who is tracking them in the sweepstakes.</p>
      </section>

      <section className="stack section-block">
        {Array.from(new Set(snapshot.teams.map((t) => t.region)))
          .sort()
          .map((region) => {
            const regionTeams = snapshot.teams
              .filter((t) => t.region === region)
              .sort((a, b) => a.name.localeCompare(b.name));

            return (
              <article className="card stack" key={region}>
                <div>
                  <p className="kicker">Region</p>
                  <h2 className="card-title">{region}</h2>
                </div>
                <div className="grid two">
                  {regionTeams.map((team) => (
                    <Link
                      className="fixture"
                      href={`/teams/${team.slug}` as Route}
                      key={team.id}
                    >
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
            );
          })}
      </section>
    </SiteShell>
  );
}
