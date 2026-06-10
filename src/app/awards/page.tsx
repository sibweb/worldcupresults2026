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

  return (
    <SiteShell
      title="Golden Boot and Best Goalkeeper."
      intro="Fixtures and results are now live, while awards stay on the seeded fallback table until the provider exposes stable player-level endpoints for goals and goalkeeper metrics."
      heroAside={
        <div className="grid two">
          <article className="card card-strong">
            <p className="kicker">Golden Boot leader</p>
            <span className="stat-value">{scorers[0].name}</span>
          </article>
          <article className="card card-strong">
            <p className="kicker">Best goalkeeper leader</p>
            <span className="stat-value">{goalkeepers[0].name}</span>
          </article>
        </div>
      }
    >
      <section className="grid two" style={{ marginTop: "1.25rem" }}>
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
              {scorers.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{teamsById[player.teamId]?.name ?? player.teamId}</td>
                  <td>{player.goals}</td>
                  <td>{player.assists}</td>
                </tr>
              ))}
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
              {goalkeepers.map((keeper) => (
                <tr key={keeper.id}>
                  <td>{keeper.name}</td>
                  <td>{teamsById[keeper.teamId]?.name ?? keeper.teamId}</td>
                  <td>{keeper.cleanSheets}</td>
                  <td>{keeper.saves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </SiteShell>
  );
}