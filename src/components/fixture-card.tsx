import type { Route } from "next";
import Link from "next/link";

import { formatUkKickoff } from "@/lib/format";
import { Match, Team } from "@/lib/types";

export function FixtureCard({
  match,
  teamsById,
}: {
  match: Match;
  teamsById: Record<string, Team>;
}) {
  const home = match.homeTeamId ? teamsById[match.homeTeamId] : undefined;
  const away = match.awayTeamId ? teamsById[match.awayTeamId] : undefined;
  const statusClass = match.status === "completed" ? "done" : match.status === "live" ? "live" : "upcoming";
  const scoreline =
    match.homeScore !== undefined && match.awayScore !== undefined
      ? `${match.homeScore} - ${match.awayScore}`
      : "vs";
  const homeHref = home ? (`/teams/${home.slug}` as Route) : undefined;
  const awayHref = away ? (`/teams/${away.slug}` as Route) : undefined;

  return (
    <article className="fixture">
      <div className="fixture-head">
        <div>
          <p className="kicker">{match.stage}</p>
          <strong>{formatUkKickoff(match.kickoffUtc)}</strong>
        </div>
        <span className={`chip ${statusClass}`}>
          {match.status === "completed" ? "Final" : match.status === "live" ? "Live" : "Scheduled"}
        </span>
      </div>

      <div className="fixture-teams">
        <div className="stack" style={{ flex: 1 }}>
          {home && homeHref ? (
            <Link className="team-badge" href={homeHref}>
              <span className="team-code">{home.fifaCode}</span>
              <span>{home.name}</span>
            </Link>
          ) : (
            <div className="team-badge">
              <span className="team-code">TBD</span>
              <span>{match.homeTeamName ?? "TBD"}</span>
            </div>
          )}
          {away && awayHref ? (
            <Link className="team-badge" href={awayHref}>
              <span className="team-code">{away.fifaCode}</span>
              <span>{away.name}</span>
            </Link>
          ) : (
            <div className="team-badge">
              <span className="team-code">TBD</span>
              <span>{match.awayTeamName ?? "TBD"}</span>
            </div>
          )}
        </div>
        <div className="score">{scoreline}</div>
      </div>

      <div className="spread muted">
        <span>{match.venue}</span>
        <span>{match.notes ?? "Official tournament feed"}</span>
      </div>
    </article>
  );
}