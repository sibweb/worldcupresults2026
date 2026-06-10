import { DateTime } from "luxon";

import { Match, SyncMetadata, Team, TeamRecord } from "@/lib/types";

const REVALIDATE_SECONDS = 15 * 60;

function getApiBaseUrl() {
  return process.env.WORLDCUP_API_BASE_URL ?? "https://worldcup26.ir";
}

interface ProviderTeam {
  id: string;
  name_en: string;
  fifa_code: string;
  groups: string;
  flag?: string;
  iso2?: string;
}

interface ProviderGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
  home_scorers?: string;
  away_scorers?: string;
}

interface ProviderStadium {
  id: string;
  name_en: string;
  fifa_name?: string;
  city_en?: string;
  country_en?: string;
}

interface ProviderGroup {
  name: string;
  teams: Array<{
    team_id: string;
    mp: string;
    w: string;
    d: string;
    l: string;
    gf: string;
    ga: string;
    gd: string;
    pts: string;
  }>;
}

export interface ProviderTournamentData {
  teams: Team[];
  matches: Match[];
  groupStandings: Record<string, TeamRecord[]>;
  syncMetadata: SyncMetadata;
}

export interface SyncResult {
  ok: boolean;
  mode: "demo" | "live";
  provider: string;
  message: string;
  lastSuccessfulSyncUtc: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value: string | undefined) {
  return Number.parseInt(value ?? "0", 10);
}

function mapStage(type: string, group: string) {
  switch (type) {
    case "group":
      return `Group ${group}`;
    case "r32":
      return "Round of 32";
    case "r16":
      return "Round of 16";
    case "qf":
      return "Quarter-final";
    case "sf":
      return "Semi-final";
    case "third":
      return "Third-place";
    case "final":
      return "Final";
    default:
      return type;
  }
}

function resolveTimeZone(stadium?: ProviderStadium) {
  const text = `${stadium?.fifa_name ?? ""} ${stadium?.city_en ?? ""} ${stadium?.name_en ?? ""}`.toLowerCase();

  if (text.includes("vancouver")) {
    return "America/Vancouver";
  }

  if (text.includes("toronto")) {
    return "America/Toronto";
  }

  if (
    text.includes("seattle") ||
    text.includes("los angeles") ||
    text.includes("inglewood") ||
    text.includes("san francisco") ||
    text.includes("santa clara")
  ) {
    return "America/Los_Angeles";
  }

  if (
    text.includes("new york") ||
    text.includes("new jersey") ||
    text.includes("east rutherford") ||
    text.includes("miami") ||
    text.includes("atlanta") ||
    text.includes("philadelphia") ||
    text.includes("boston") ||
    text.includes("foxborough")
  ) {
    return "America/New_York";
  }

  if (text.includes("monterrey")) {
    return "America/Monterrey";
  }

  if (text.includes("mexico city") || text.includes("guadalajara")) {
    return "America/Mexico_City";
  }

  if (text.includes("dallas") || text.includes("arlington") || text.includes("houston") || text.includes("kansas city")) {
    return "America/Chicago";
  }

  return "UTC";
}

function parseKickoffUtc(localDate: string, stadium?: ProviderStadium) {
  const parsed = DateTime.fromFormat(localDate, "MM/dd/yyyy HH:mm", {
    zone: resolveTimeZone(stadium),
  });

  if (parsed.isValid) {
    return parsed.toUTC().toISO() ?? new Date().toISOString();
  }

  return new Date().toISOString();
}

function parseMatchStatus(game: ProviderGame): Match["status"] {
  if (game.finished === "TRUE") {
    return "completed";
  }

  if (game.time_elapsed && game.time_elapsed !== "notstarted") {
    return "live";
  }

  return "upcoming";
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Provider request failed for ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchProviderTournamentData(): Promise<ProviderTournamentData> {
  const [teamPayload, gamePayload, stadiumPayload, groupPayload] = await Promise.all([
    fetchJson<{ teams: ProviderTeam[] }>("/get/teams"),
    fetchJson<{ games: ProviderGame[] }>("/get/games"),
    fetchJson<{ stadiums: ProviderStadium[] }>("/get/stadiums"),
    fetchJson<{ groups: ProviderGroup[] }>("/get/groups"),
  ]);

  const stadiumsById = new Map(stadiumPayload.stadiums.map((stadium) => [stadium.id, stadium]));
  const teams = teamPayload.teams.map<Team>((team) => {
    const slug = slugify(team.name_en);

    return {
      id: slug,
      sourceId: team.id,
      name: team.name_en,
      slug,
      fifaCode: team.fifa_code,
      flagUrl: team.flag,
      group: team.groups,
      region: `Group ${team.groups}`,
      coach: "TBC",
      summary: `${team.name_en} are part of Group ${team.groups} in the live World Cup 2026 schedule feed.`,
      status: "In tournament",
    };
  });

  const teamSourceIdToSlug = new Map(teams.map((team) => [team.sourceId ?? team.id, team.id]));

  const matches = gamePayload.games.map<Match>((game) => {
    const stadium = stadiumsById.get(game.stadium_id);
    const homeTeamId = teamSourceIdToSlug.get(game.home_team_id);
    const awayTeamId = teamSourceIdToSlug.get(game.away_team_id);
    const status = parseMatchStatus(game);
    const notes: string[] = [];

    if (status === "live") {
      notes.push(`Live: ${game.time_elapsed}`);
    }

    const scorers = [game.home_scorers, game.away_scorers].filter(
      (value) => value && value !== "null",
    );

    if (scorers.length > 0) {
      notes.push("Scorers available from provider feed");
    }

    return {
      id: game.id,
      stage: mapStage(game.type, game.group),
      venue: stadium?.fifa_name ?? stadium?.name_en ?? "Venue TBC",
      kickoffUtc: parseKickoffUtc(game.local_date, stadium),
      homeTeamId,
      awayTeamId,
      homeTeamName: game.home_team_name_en ?? game.home_team_label,
      awayTeamName: game.away_team_name_en ?? game.away_team_label,
      status,
      homeScore: toNumber(game.home_score),
      awayScore: toNumber(game.away_score),
      notes: notes.length > 0 ? notes.join(" • ") : undefined,
    };
  });

  const groupStandings = Object.fromEntries(
    groupPayload.groups.map((group) => [
      group.name,
      group.teams.map<TeamRecord>((team) => ({
        teamId: teamSourceIdToSlug.get(team.team_id) ?? `team-${team.team_id}`,
        played: toNumber(team.mp),
        won: toNumber(team.w),
        drawn: toNumber(team.d),
        lost: toNumber(team.l),
        goalsFor: toNumber(team.gf),
        goalsAgainst: toNumber(team.ga),
        goalDifference: toNumber(team.gd),
        points: toNumber(team.pts),
      })),
    ]),
  );

  return {
    teams,
    matches,
    groupStandings,
    syncMetadata: {
      providerName: "worldcup26.ir",
      mode: "live",
      lastSuccessfulSyncUtc: new Date().toISOString(),
      lastAttemptUtc: new Date().toISOString(),
      syncIntervalMinutes: 15,
      message: "Live teams, fixtures, standings, and venues are coming from the hosted World Cup 2026 community API.",
    },
  };
}

export async function syncTournamentData(): Promise<SyncResult> {
  const snapshot = await fetchProviderTournamentData();

  return {
    ok: true,
    mode: snapshot.syncMetadata.mode,
    provider: snapshot.syncMetadata.providerName,
    message: snapshot.syncMetadata.message ?? "Live provider sync completed.",
    lastSuccessfulSyncUtc: snapshot.syncMetadata.lastSuccessfulSyncUtc,
  };
}