import { SiteShell } from "@/components/site-shell";
import {
  createTeamLookup,
  getTopGoalkeepers,
  getTopScorers,
  getTournamentSnapshot,
} from "@/lib/world-cup-data";

export default async function AwardsPage() {
  const snapshot = await getTournamentSnapshot();
  const scorers = getTopScorers(snapshot);
  const goalkeepers = getTopGoalkeepers(snapshot);
  const teamsById = createTeamLookup(snapshot);
  const scorerLeader = scorers[0];
  const goalkeeperLeader = goalkeepers[0];

  return (
    <SiteShell
      title="Golden Boot and Best Goalkeeper."
      intro="Fixtures and results are live. Player-level goals and goalkeeper metrics will appear automatically once the provider exposes stable award endpoints."
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Golden Boot leader</p>
            <span className="stat-value">{scorerLeader?.name ?? "Awaiting feed"}</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Best goalkeeper leader</p>
            <span className="stat-value">{goalkeeperLeader?.name ?? "Awaiting feed"}</span>
          </article>
        </div>
      }
    >
      <section className="grid two section-block">
        <article className="card stack">
          <div>
            <p className="kicker">Top scorers</p>
            <h2 className="card-title">Golden Boot table</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Goals</th>
                <th>Assists</th>
              </tr>
            </thead>
            <tbody>
              {scorers.length > 0 ? (
                scorers.map((player) => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>{teamsById[player.teamId]?.name ?? player.teamId}</td>
                    <td>{player.goals}</td>
                    <td>{player.assists}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>No live top-scorer data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article className="card stack">
          <div>
            <p className="kicker">Goalkeepers</p>
            <h2 className="card-title">Best goalkeeper watch</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Keeper</th>
                <th>Team</th>
                <th>CS</th>
                <th>Saves</th>
              </tr>
            </thead>
            <tbody>
              {goalkeepers.length > 0 ? (
                goalkeepers.map((keeper) => (
                  <tr key={keeper.id}>
                    <td>{keeper.name}</td>
                    <td>{teamsById[keeper.teamId]?.name ?? keeper.teamId}</td>
                    <td>{keeper.cleanSheets}</td>
                    <td>{keeper.saves}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>No live goalkeeper metrics yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </section>
    </SiteShell>
  );
}