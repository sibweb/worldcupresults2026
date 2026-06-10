import { AdminAssignmentManager } from "@/components/admin-assignment-manager";
import { SiteShell } from "@/components/site-shell";
import { assignments, getTournamentSnapshot, people } from "@/lib/world-cup-data";

export default async function AdminPage() {
  const snapshot = await getTournamentSnapshot();

  return (
    <SiteShell
      title="Manage the sweepstakes."
      intro="Single-admin controls for assigning people to teams, reviewing the leaderboard, and preparing the site for a database-backed production workflow."
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Sync mode</p>
            <span className="stat-value">{snapshot.syncMetadata.mode}</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Tracked people</p>
            <span className="stat-value">{people.length}</span>
          </article>
        </div>
      }
    >
      <section className="page-header">
        <p className="eyebrow">Admin</p>
        <p className="muted">Assignments still persist in the browser for now, but the selectable teams are now coming from the live World Cup feed.</p>
      </section>

      <AdminAssignmentManager initialAssignments={assignments} people={people} teams={snapshot.teams} />
    </SiteShell>
  );
}