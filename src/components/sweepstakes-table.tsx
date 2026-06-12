"use client";

import { useMemo, useState } from "react";

export type SweepstakesRow = {
  id: string;
  personName: string;
  teamName: string;
  progress: string;
  inTournament: boolean;
  risk: "safe" | "at-risk" | "out";
};

type StatusFilter = "all" | "safe" | "at-risk" | "out";

export function SweepstakesTable({ rows }: { rows: SweepstakesRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 || row.personName.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "safe" && row.risk === "safe") ||
        (statusFilter === "at-risk" && row.risk === "at-risk") ||
        (statusFilter === "out" && !row.inTournament);

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  return (
    <div className="stack">
      <div className="sweepstakes-controls">
        <label className="field" htmlFor="sweepstakes-search">
          <span className="kicker">Find a person</span>
          <input
            id="sweepstakes-search"
            name="sweepstakes-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by person name"
            type="search"
            value={query}
          />
        </label>

        <div className="chip-row" role="tablist" aria-label="Sweepstakes status filter">
          <button
            type="button"
            className={`filter-chip ${statusFilter === "all" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-chip ${statusFilter === "safe" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("safe")}
          >
            Safe
          </button>
          <button
            type="button"
            className={`filter-chip ${statusFilter === "at-risk" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("at-risk")}
          >
            At risk
          </button>
          <button
            type="button"
            className={`filter-chip ${statusFilter === "out" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("out")}
          >
            Out
          </button>
        </div>
      </div>

      <p className="kicker" style={{ margin: 0 }}>
        Showing {filteredRows.length} of {rows.length} entries
      </p>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Team</th>
              <th>Progress</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.personName}</td>
                  <td>{row.teamName}</td>
                  <td>{row.progress}</td>
                  <td>
                    <span className={`status-pill ${row.risk}`}>
                      {row.risk === "at-risk" ? "At risk" : row.risk === "safe" ? "Safe" : "Out"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No people match this search/filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}