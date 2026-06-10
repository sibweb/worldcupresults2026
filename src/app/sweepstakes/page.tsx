import { SiteShell } from "@/components/site-shell";
import {
  getSweepstakeLeaderboard,
  getSweepstakeOwnership,
  getTournamentSnapshot,
} from "@/lib/world-cup-data";

export default async function SweepstakesPage() {
  const snapshot = await getTournamentSnapshot();
  const leaderboard = getSweepstakeLeaderboard(snapshot);
  const ownership = getSweepstakeOwnership(snapshot);

  return (
    <SiteShell
      title="Sweepstakes standings and ownership."
      intro="Live sweepstakes ranking and a simple team-to-person ownership table, sourced from the latest tournament snapshot."
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Sync mode</p>
            <span className="stat-value">{snapshot.syncMetadata.mode}</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Tracked entries</p>
            <span className="stat-value">{ownership.length}</span>
          </article>
        </div>
      }
    >
      <section className="grid two" style={{ marginTop: "1.25rem" }}>
        <article className="card stack">
          <div>
            <p className="kicker">Live leaderboard</p>
            <h2 className="card-title">Current sweepstakes table</h2>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Team</th>
                <th>Progress</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={`${entry.personId}-${entry.team.id}`}>
                  <td>{entry.name}</td>
                  <td>{entry.team.name}</td>
                  <td>{entry.team.status}</td>
                  <td>{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card stack">
          <div>
            <p className="kicker">Ownership view</p>
            <h2 className="card-title">Team name and person</h2>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Person</th>
              </tr>
            </thead>
            <tbody>
              {ownership.map((entry) => (
                <tr key={`${entry.teamName}-${entry.personName}`}>
                  <td>{entry.teamName}</td>
                  <td>{entry.personName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </SiteShell>
  );
}