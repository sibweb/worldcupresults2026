import { SiteShell } from "@/components/site-shell";
import { SweepstakesTable } from "@/components/sweepstakes-table";
import {
  getSweepstakeLeaderboard,
  getSyncHealth,
  getTournamentSnapshot,
} from "@/lib/world-cup-data";

export default async function SweepstakesPage() {
  const snapshot = await getTournamentSnapshot();
  const leaderboard = getSweepstakeLeaderboard(snapshot);
  const syncHealth = await getSyncHealth(snapshot);
  const rows = leaderboard.map((entry) => {
    const normalizedStatus = entry.team.status.toLowerCase();
    const inTournament = !normalizedStatus.includes("eliminated") && !normalizedStatus.includes("out");
    const risk = inTournament
      ? normalizedStatus.includes("winner") || normalizedStatus.includes("runner-up")
        ? "safe"
        : "at-risk"
      : "out";

    return {
      id: `${entry.personId}-${entry.team.id}`,
      personName: entry.name,
      teamName: entry.team.name,
      progress: entry.team.status,
      inTournament,
      risk,
    };
  });

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
            <span className="stat-value">{rows.length}</span>
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

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <span 
              style={{
                display: "inline-block",
                width: "1.2rem",
                height: "1.2rem",
                borderRadius: "50%",
                backgroundColor: syncHealth.ok ? "var(--success)" : "var(--danger)",
              }}
            />
            <span className="stat-value" style={{ margin: 0, fontSize: "1.1rem" }}>
              {syncHealth.ok ? "Healthy" : "Needs attention"}
            </span>
          </div>

          <div style={{ marginTop: "0.8rem" }}>
            <p className="kicker">Latest attempt</p>
            <p style={{ margin: "0.3rem 0 0", color: "var(--text)" }}>
              {new Date(syncHealth.lastAttemptUtc).toLocaleString()}
            </p>
          </div>
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

      <section className="section-block">
        <article className="card stack">
          <div>
            <p className="kicker">Sweepstakes</p>
            <h2 className="card-title">People, teams, and elimination status</h2>
          </div>

          <SweepstakesTable rows={rows} />
        </article>
      </section>
    </SiteShell>
  );
}