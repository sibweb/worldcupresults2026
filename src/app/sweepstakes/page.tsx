import { SiteShell } from "@/components/site-shell";
import {
  getSweepstakeLeaderboard,
  getSweepstakeOwnership,
  getSyncHealth,
  getTournamentSnapshot,
} from "@/lib/world-cup-data";

export default async function SweepstakesPage() {
  const snapshot = await getTournamentSnapshot();
  const leaderboard = getSweepstakeLeaderboard(snapshot);
  const ownership = getSweepstakeOwnership(snapshot);
  const syncHealth = await getSyncHealth(snapshot);

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
      <section className="grid two section-block">
        <article className="card stack">
          <div>
            <p className="kicker">Sync health</p>
            <h2 className="card-title">Production sync status</h2>
          </div>

          <div className="grid two">
            <div>
              <p className="kicker">Status</p>
              <span className="stat-value">{syncHealth.ok ? "Healthy" : "Needs attention"}</span>
            </div>
            <div>
              <p className="kicker">Source</p>
              <span className="stat-value">{syncHealth.source}</span>
            </div>
            <div>
              <p className="kicker">Last attempt</p>
              <span className="stat-value">{new Date(syncHealth.lastAttemptUtc).toLocaleString()}</span>
            </div>
            <div>
              <p className="kicker">Last success</p>
              <span className="stat-value">{new Date(syncHealth.lastSuccessfulSyncUtc).toLocaleString()}</span>
            </div>
          </div>

          <p style={{ margin: 0, color: "var(--muted)" }}>{syncHealth.message}</p>
        </article>

        <article className="card stack">
          <div>
            <p className="kicker">Provider</p>
            <h2 className="card-title">Live data source</h2>
          </div>

          <p style={{ margin: 0 }}>Connected to {syncHealth.provider}.</p>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            The site reads from the latest synced snapshot, so the public pages stay fast even when the live API is polled on a schedule.
          </p>
        </article>
      </section>

      <section className="grid two section-block">
        <article className="card stack">
          <div>
            <p className="kicker">Live leaderboard</p>
            <h2 className="card-title">Current sweepstakes table</h2>
          </div>

          <div className="table-wrap">
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
          </div>
        </article>

        <article className="card stack">
          <div>
            <p className="kicker">Ownership view</p>
            <h2 className="card-title">Team name and person</h2>
          </div>

          <div className="table-wrap">
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
          </div>
        </article>
      </section>
    </SiteShell>
  );
}