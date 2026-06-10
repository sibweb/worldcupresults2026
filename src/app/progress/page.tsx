import { SiteShell } from "@/components/site-shell";
import { formatUkKickoff } from "@/lib/format";
import {
  createTeamLookup,
  getFirstOut,
  getGroupKeys,
  getGroupStandings,
  getStageOrder,
  getTournamentSnapshot,
  getWinnerAndRunnerUp,
} from "@/lib/world-cup-data";

export default async function ProgressPage() {
  const snapshot = await getTournamentSnapshot();
  const teamsById = createTeamLookup(snapshot);
  const groups = getGroupKeys(snapshot);
  const stageOrder = getStageOrder(snapshot);
  const { winner, runnerUp } = getWinnerAndRunnerUp(snapshot);
  const firstOut = getFirstOut(snapshot);

  return (
    <SiteShell
      title="Who is through, out, and placed."
      intro="Shared progress logic drives group tables, knockout outcomes, and sweepstakes scoring, so every page reads from the same tournament state."
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Winner</p>
            <span className="stat-value">{winner?.name}</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Runner-up</p>
            <span className="stat-value">{runnerUp?.name}</span>
          </article>
        </div>
      }
    >
      <section className="grid three" style={{ marginTop: "1.25rem" }}>
        <article className="card">
          <p className="kicker">First team out</p>
          <h2 className="card-title">{firstOut?.name ?? "TBD"}</h2>
          <p className="muted">Derived from the earliest confirmed elimination in the live tournament state.</p>
        </article>
        <article className="card">
          <p className="kicker">Teams still alive</p>
          <h2 className="card-title">{snapshot.teams.filter((team) => team.status === "In tournament").length}</h2>
          <p className="muted">Live provider data has {groups.length} groups available for standings.</p>
        </article>
        <article className="card">
          <p className="kicker">Knockout completed</p>
          <h2 className="card-title">{snapshot.matches.filter((match) => !match.stage.startsWith("Group ") && match.status === "completed").length} matches</h2>
          <p className="muted">Bracket cards below show the result timeline in UK local time.</p>
        </article>
      </section>

      <section className="grid two" style={{ marginTop: "1.25rem" }}>
        {groups.map((group) => (
          <article className="card stack" key={group}>
            <div>
              <p className="kicker">Group {group}</p>
              <h2 className="card-title">Standings</h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>P</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {getGroupStandings(snapshot, group).map((record) => (
                  <tr key={record.teamId}>
                    <td>{teamsById[record.teamId]?.name ?? record.teamId}</td>
                    <td>{record.played}</td>
                    <td>{record.goalDifference}</td>
                    <td>{record.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </section>

      <section className="stack" style={{ marginTop: "1.25rem" }}>
        {stageOrder.map((stage) => {
          const stageMatches = snapshot.matches.filter((match) => match.stage === stage);

          if (stageMatches.length === 0) {
            return null;
          }

          return (
            <details className="card matchday" key={stage}>
              <summary className="matchday-summary">
                <div>
                  <h2 className="card-title">{stage}</h2>
                </div>
                <span className="chip">{stageMatches.length} matches</span>
              </summary>
              <div className="stack matchday-content">
                {stageMatches.map((match) => (
                  <div className="fixture" key={match.id}>
                    <div className="spread">
                      <strong>
                        {teamsById[match.homeTeamId ?? ""]?.name ?? match.homeTeamName ?? "TBD"} {match.homeScore ?? ""} {match.homeScore !== undefined || match.awayScore !== undefined ? "-" : "vs"} {match.awayScore ?? ""} {teamsById[match.awayTeamId ?? ""]?.name ?? match.awayTeamName ?? "TBD"}
                      </strong>
                      <span>{formatUkKickoff(match.kickoffUtc)}</span>
                    </div>
                    <p className="muted">{match.venue}{match.notes ? ` • ${match.notes}` : ""}</p>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </section>
    </SiteShell>
  );
}