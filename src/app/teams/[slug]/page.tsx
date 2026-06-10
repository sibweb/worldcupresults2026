import Link from "next/link";
import { notFound } from "next/navigation";

import { FixtureCard } from "@/components/fixture-card";
import { SiteShell } from "@/components/site-shell";
import { formatUkKickoff } from "@/lib/format";
import {
  createTeamLookup,
  getAssignedPerson,
  getMatchesByTeam,
  getTeamBySlug,
  getTournamentSnapshot,
  getWinnerAndRunnerUp,
} from "@/lib/world-cup-data";

export async function generateStaticParams() {
  return [];
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const snapshot = await getTournamentSnapshot();
  const team = getTeamBySlug(snapshot, slug);

  if (!team) {
    notFound();
  }

  const teamsById = createTeamLookup(snapshot);
  const matches = getMatchesByTeam(snapshot, team.id).sort((left, right) => left.kickoffUtc.localeCompare(right.kickoffUtc));
  const assignedPerson = getAssignedPerson(snapshot, team.id);
  const { winner, runnerUp } = getWinnerAndRunnerUp(snapshot);
  const placement = winner?.id === team.id ? "Tournament winner" : runnerUp?.id === team.id ? "Runner-up" : team.status;

  return (
    <SiteShell
      title={`${team.name} at World Cup 2026.`}
      intro={team.summary}
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Assigned to</p>
            <span className="stat-value">{assignedPerson?.name ?? "Open"}</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Tournament status</p>
            <span className="stat-value">{placement}</span>
          </article>
        </div>
      }
    >
      <section className="grid three" style={{ marginTop: "1.25rem" }}>
        <article className="card">
          <p className="kicker">Group</p>
          <h2 className="card-title">{team.group}</h2>
          <p className="muted">{team.region}</p>
        </article>
        <article className="card">
          <p className="kicker">Coach</p>
          <h2 className="card-title">{team.coach}</h2>
          <p className="muted">{team.fifaCode}</p>
        </article>
        <article className="card">
          <p className="kicker">Elimination marker</p>
          <h2 className="card-title">{team.eliminatedAtUtc ? formatUkKickoff(team.eliminatedAtUtc) : "Still alive through final"}</h2>
          <p className="muted">Derived from synced tournament state.</p>
        </article>
      </section>

      <section className="grid two" style={{ marginTop: "1.25rem" }}>
        <article className="card stack">
          <div className="spread">
            <div>
              <p className="kicker">Team fixtures</p>
              <h2 className="card-title">All matches</h2>
            </div>
            <span className="chip done">{matches.length} games</span>
          </div>
          <div className="stack">
            {matches.map((match) => (
              <FixtureCard key={match.id} match={match} teamsById={teamsById} />
            ))}
          </div>
        </article>

        <article className="card stack">
          <div>
            <p className="kicker">Sweepstakes position</p>
            <h2 className="card-title">Tracking notes</h2>
          </div>
          <div className="notice">
            {assignedPerson
              ? `${assignedPerson.name} currently holds ${team.name} in the sweepstakes.`
              : `${team.name} is currently unassigned in the sweepstakes draw.`}
          </div>
          <div className="fixture">
            <strong>What this page covers</strong>
            <p className="muted">Fixtures, UK kickoff times, tournament status, and assignment ownership are kept together so each team can be tracked from group stage to final placement.</p>
          </div>
          <Link className="button" href="/admin">
            Update assignment
          </Link>
        </article>
      </section>
    </SiteShell>
  );
}