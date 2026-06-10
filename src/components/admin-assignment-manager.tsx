"use client";

import { useEffect, useMemo, useState } from "react";

import { Assignment, Person, Team } from "@/lib/types";

const storageKey = "world-cup-sweepstakes-assignments";

function getStatusPoints(status: Team["status"]) {
  switch (status) {
    case "Winner":
      return 20;
    case "Runner-up":
      return 14;
    case "Eliminated in semi-final":
      return 9;
    case "Eliminated in group stage":
      return 3;
    default:
      return 0;
  }
}

export function AdminAssignmentManager({
  initialAssignments,
  people,
  teams,
}: {
  initialAssignments: Assignment[];
  people: Person[];
  teams: Team[];
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedPersonId, setSelectedPersonId] = useState(initialAssignments[0]?.personId ?? people[0]?.id ?? "");
  const [selectedTeamId, setSelectedTeamId] = useState(initialAssignments[0]?.teamId ?? teams[0]?.id ?? "");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Assignment[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setAssignments(parsed);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(assignments));
  }, [assignments]);

  const leaderboard = useMemo(() => {
    return assignments
      .map((assignment) => {
        const person = people.find((entry) => entry.id === assignment.personId);
        const team = teams.find((entry) => entry.id === assignment.teamId);

        if (!person || !team) {
          return undefined;
        }

        return {
          personName: person.name,
          teamName: team.name,
          status: team.status,
          points: getStatusPoints(team.status),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((left, right) => {
        if (right.points !== left.points) {
          return right.points - left.points;
        }

        return left.personName.localeCompare(right.personName);
      });
  }, [assignments, people, teams]);

  const assignedTeamIds = new Set(assignments.map((assignment) => assignment.teamId));
  const availableTeams = teams.filter(
    (team) => !assignedTeamIds.has(team.id) || team.id === selectedTeamId,
  );

  function handleAssign() {
    if (!selectedPersonId || !selectedTeamId) {
      return;
    }

    setAssignments((current) => {
      const withoutPerson = current.filter((assignment) => assignment.personId !== selectedPersonId);
      const withoutTeam = withoutPerson.filter((assignment) => assignment.teamId !== selectedTeamId);

      return [...withoutTeam, { personId: selectedPersonId, teamId: selectedTeamId }];
    });
  }

  function handleReset() {
    setAssignments(initialAssignments);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <div className="grid two" style={{ marginTop: "1.25rem" }}>
      <section className="card card-strong">
        <div className="stack">
          <div>
            <p className="kicker">Single-admin workspace</p>
            <h2 className="card-title">Assign people to teams</h2>
          </div>

          <div className="notice">
            Changes are stored in your browser for now. Replace this with a database-backed admin route when the live sync pipeline is connected.
          </div>

          <div className="form-grid two">
            <label className="field">
              <span>Person</span>
              <select value={selectedPersonId} onChange={(event) => setSelectedPersonId(event.target.value)}>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Team</span>
              <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="pill-row">
            <button className="button" onClick={handleAssign} type="button">
              Save assignment
            </button>
            <button className="button secondary" onClick={handleReset} type="button">
              Reset demo data
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="stack">
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
                <tr key={entry.personName}>
                  <td>{entry.personName}</td>
                  <td>{entry.teamName}</td>
                  <td>{entry.status}</td>
                  <td>{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}