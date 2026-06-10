export type TeamStatus =
  | "In tournament"
  | "Winner"
  | "Runner-up"
  | "Eliminated in knockout stage"
  | "Eliminated in semi-final"
  | "Eliminated in group stage";

export type MatchStage = string;

export type MatchStatus = "completed" | "upcoming" | "live";

export interface Team {
  id: string;
  sourceId?: string;
  name: string;
  slug: string;
  fifaCode: string;
  flagUrl?: string;
  group: string;
  region: string;
  coach: string;
  summary: string;
  status: TeamStatus;
  eliminatedAtUtc?: string;
}

export interface Person {
  id: string;
  name: string;
}

export interface Assignment {
  personId: string;
  teamId: string;
}

export interface Match {
  id: string;
  stage: MatchStage;
  venue: string;
  kickoffUtc: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  notes?: string;
}

export interface PlayerStat {
  id: string;
  name: string;
  teamId: string;
  goals: number;
  assists: number;
}

export interface GoalkeeperStat {
  id: string;
  name: string;
  teamId: string;
  cleanSheets: number;
  saves: number;
  goalsConceded: number;
}

export interface SyncMetadata {
  providerName: string;
  mode: "demo" | "live";
  lastSuccessfulSyncUtc: string;
  lastAttemptUtc: string;
  syncIntervalMinutes: number;
  message?: string;
}

export interface TeamRecord {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TournamentSnapshot {
  teams: Team[];
  matches: Match[];
  groupStandings: Record<string, TeamRecord[]>;
  people: Person[];
  assignments: Assignment[];
  goldenBootTable: PlayerStat[];
  goalkeeperTable: GoalkeeperStat[];
  syncMetadata: SyncMetadata;
}