import {
  Assignment,
  GoalkeeperStat,
  Match,
  Person,
  PlayerStat,
  SyncMetadata,
  Team,
  TeamRecord,
  TournamentSnapshot,
} from "@/lib/types";
import { fetchProviderTournamentData } from "@/lib/api/provider";
import { getLatestSnapshot, saveSnapshot, saveSyncRun } from "@/lib/db/snapshot-store";

type ProviderMode = "auto" | "live" | "demo";

function getProviderMode(): ProviderMode {
  const raw = (process.env.WORLDCUP_PROVIDER_MODE ?? "auto").toLowerCase();

  if (raw === "live" || raw === "demo" || raw === "auto") {
    return raw;
  }

  return "auto";
}

function readBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.toLowerCase();

  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  return defaultValue;
}

function getCacheMaxAgeMinutes() {
  const parsed = Number.parseInt(process.env.WORLDCUP_CACHE_MAX_AGE_MINUTES ?? "30", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30;
  }

  return parsed;
}

function getThirdPlaceAdvanceCount() {
  const parsed = Number.parseInt(process.env.WORLDCUP_THIRD_PLACE_ADVANCE_COUNT ?? "8", 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 8;
  }

  return parsed;
}

function shouldUseDbCache() {
  return readBoolean(process.env.WORLDCUP_USE_DB_CACHE, true);
}

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function makeId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const teams: Team[] = [
  {
    id: "england",
    name: "England",
    slug: "england",
    fifaCode: "ENG",
    group: "A",
    region: "UEFA",
    coach: "Sarina Holder",
    summary: "Disciplined out of possession and strong from wide delivery.",
    status: "Eliminated in semi-final",
  },
  {
    id: "usa",
    name: "United States",
    slug: "united-states",
    fifaCode: "USA",
    group: "A",
    region: "Concacaf",
    coach: "Mauricio Vance",
    summary: "Vertical transitions and high pressing built around athletic midfield play.",
    status: "Eliminated in group stage",
    eliminatedAtUtc: "2026-06-18T20:00:00.000Z",
  },
  {
    id: "japan",
    name: "Japan",
    slug: "japan",
    fifaCode: "JPN",
    group: "A",
    region: "AFC",
    coach: "Hajime Takeda",
    summary: "Compact shape, efficient counter-attacks, and clean set-piece execution.",
    status: "Eliminated in semi-final",
  },
  {
    id: "morocco",
    name: "Morocco",
    slug: "morocco",
    fifaCode: "MAR",
    group: "A",
    region: "CAF",
    coach: "Walid Renard",
    summary: "Direct wing play with aggressive full-back overlaps.",
    status: "Eliminated in group stage",
    eliminatedAtUtc: "2026-06-15T20:00:00.000Z",
  },
  {
    id: "brazil",
    name: "Brazil",
    slug: "brazil",
    fifaCode: "BRA",
    group: "B",
    region: "CONMEBOL",
    coach: "Dorival Silva",
    summary: "Fluid front line with strong ball progression through midfield.",
    status: "Winner",
  },
  {
    id: "spain",
    name: "Spain",
    slug: "spain",
    fifaCode: "ESP",
    group: "B",
    region: "UEFA",
    coach: "Luis Fuente",
    summary: "Territory-heavy possession with strong pressure after loss.",
    status: "Runner-up",
  },
  {
    id: "france",
    name: "France",
    slug: "france",
    fifaCode: "FRA",
    group: "B",
    region: "UEFA",
    coach: "Didier Laurent",
    summary: "Rapid wide forwards and strong defensive recovery pace.",
    status: "Eliminated in group stage",
    eliminatedAtUtc: "2026-06-19T17:00:00.000Z",
  },
  {
    id: "argentina",
    name: "Argentina",
    slug: "argentina",
    fifaCode: "ARG",
    group: "B",
    region: "CONMEBOL",
    coach: "Lionel Batista",
    summary: "Patient build-up with aggressive pressing from the front line.",
    status: "Eliminated in group stage",
    eliminatedAtUtc: "2026-06-22T17:00:00.000Z",
  },
];

const sweepstakeDraw = [
  { participant: "Sergio Shakira Lopez", team: "Croatia" },
  { participant: "Kirsten F", team: "Sweden" },
  { participant: "Matt B", team: "Iraq" },
  { participant: "Priya P", team: "South Korea" },
  { participant: "Shyam R", team: "Tunisia" },
  { participant: "Francesca M", team: "Haiti" },
  { participant: "Sara H", team: "Curacao" },
  { participant: "Gary M", team: "Uzbekistan" },
  { participant: "Dan E", team: "Panama" },
  { participant: "Will G", team: "South Africa" },
  { participant: "Prateek G", team: "Scotland" },
  { participant: "Ash H", team: "Morocco" },
  { participant: "Anthony W", team: "Belgium" },
  { participant: "Kirsten F", team: "Saudi Arabia" },
  { participant: "Eben-Ezer", team: "Algeria" },
  { participant: "Sarah W", team: "Iran" },
  { participant: "Jonas A", team: "United States" },
  { participant: "Anthony Harrold", team: "Qatar" },
  { participant: "Gemma", team: "Japan" },
  { participant: "Anthony Harrold", team: "Congo DR" },
  { participant: "Aman C", team: "Senegal" },
  { participant: "Simon G", team: "England" },
  { participant: "Wilfrid", team: "Argentina" },
  { participant: "Mark P", team: "Cape Verde" },
  { participant: "Sean C", team: "Netherlands" },
  { participant: "Mark H", team: "Ivory Coast" },
  { participant: "Lisa J", team: "Canada" },
  { participant: "Roberto G", team: "Egypt" },
  { participant: "Lakshmi N", team: "Mexico" },
  { participant: "Estela V", team: "Austria" },
  { participant: "Litia S", team: "Uruguay" },
  { participant: "Si Bonds", team: "Australia" },
  { participant: "Mark H", team: "Czech Republic" },
  { participant: "Holly C", team: "Colombia" },
  { participant: "Gary M", team: "New Zealand" },
  { participant: "Shubham", team: "Portugal" },
  { participant: "Andy E", team: "Norway" },
  { participant: "Wes", team: "Switzerland" },
  { participant: "Alex B", team: "Brazil" },
  { participant: "Ryan F", team: "France" },
  { participant: "David M", team: "Spain" },
  { participant: "Shubham", team: "Bosnia-Herzegovina" },
  { participant: "Wilfrid", team: "Ecuador" },
  { participant: "Adam G", team: "Ghana" },
  { participant: "Aijay O", team: "Turkey" },
  { participant: "Raj L", team: "Jordan" },
  { participant: "Si Bonds", team: "Germany" },
  { participant: "Ant H", team: "Paraguay" },
] as const;

export const people: Person[] = sweepstakeDraw.map((entry, index) => ({
  id: `${makeId(entry.participant)}-${index + 1}`,
  name: entry.participant,
}));

export const assignments: Assignment[] = sweepstakeDraw.map((entry, index) => ({
  personId: `${makeId(entry.participant)}-${index + 1}`,
  teamId: makeId(entry.team),
}));

export const matches: Match[] = [
  {
    id: "ga-1",
    stage: "Group A",
    venue: "Toronto Stadium",
    kickoffUtc: "2026-06-11T19:00:00.000Z",
    homeTeamId: "england",
    awayTeamId: "usa",
    status: "completed",
    homeScore: 2,
    awayScore: 0,
  },
  {
    id: "ga-2",
    stage: "Group A",
    venue: "Monterrey Arena",
    kickoffUtc: "2026-06-11T22:00:00.000Z",
    homeTeamId: "japan",
    awayTeamId: "morocco",
    status: "completed",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "ga-3",
    stage: "Group A",
    venue: "Philadelphia Park",
    kickoffUtc: "2026-06-15T17:00:00.000Z",
    homeTeamId: "england",
    awayTeamId: "japan",
    status: "completed",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "ga-4",
    stage: "Group A",
    venue: "Seattle Field",
    kickoffUtc: "2026-06-15T20:00:00.000Z",
    homeTeamId: "usa",
    awayTeamId: "morocco",
    status: "completed",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "ga-5",
    stage: "Group A",
    venue: "Los Angeles Stadium",
    kickoffUtc: "2026-06-18T17:00:00.000Z",
    homeTeamId: "england",
    awayTeamId: "morocco",
    status: "completed",
    homeScore: 3,
    awayScore: 0,
  },
  {
    id: "ga-6",
    stage: "Group A",
    venue: "Vancouver Dome",
    kickoffUtc: "2026-06-18T20:00:00.000Z",
    homeTeamId: "usa",
    awayTeamId: "japan",
    status: "completed",
    homeScore: 0,
    awayScore: 2,
  },
  {
    id: "gb-1",
    stage: "Group B",
    venue: "Mexico City Estadio",
    kickoffUtc: "2026-06-12T19:00:00.000Z",
    homeTeamId: "brazil",
    awayTeamId: "spain",
    status: "completed",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "gb-2",
    stage: "Group B",
    venue: "Dallas Park",
    kickoffUtc: "2026-06-12T22:00:00.000Z",
    homeTeamId: "france",
    awayTeamId: "argentina",
    status: "completed",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "gb-3",
    stage: "Group B",
    venue: "Atlanta Dome",
    kickoffUtc: "2026-06-16T17:00:00.000Z",
    homeTeamId: "brazil",
    awayTeamId: "argentina",
    status: "completed",
    homeScore: 1,
    awayScore: 0,
  },
  {
    id: "gb-4",
    stage: "Group B",
    venue: "Kansas City Field",
    kickoffUtc: "2026-06-16T20:00:00.000Z",
    homeTeamId: "spain",
    awayTeamId: "france",
    status: "completed",
    homeScore: 2,
    awayScore: 0,
  },
  {
    id: "gb-5",
    stage: "Group B",
    venue: "Miami Gardens",
    kickoffUtc: "2026-06-19T17:00:00.000Z",
    homeTeamId: "brazil",
    awayTeamId: "france",
    status: "completed",
    homeScore: 2,
    awayScore: 2,
  },
  {
    id: "gb-6",
    stage: "Group B",
    venue: "Houston Centre",
    kickoffUtc: "2026-06-19T20:00:00.000Z",
    homeTeamId: "spain",
    awayTeamId: "argentina",
    status: "completed",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "sf-1",
    stage: "Semi-final",
    venue: "New York New Jersey Stadium",
    kickoffUtc: "2026-07-08T19:00:00.000Z",
    homeTeamId: "england",
    awayTeamId: "spain",
    status: "completed",
    homeScore: 1,
    awayScore: 2,
    notes: "Spain advanced in 90 minutes.",
  },
  {
    id: "sf-2",
    stage: "Semi-final",
    venue: "Mexico City Estadio",
    kickoffUtc: "2026-07-09T19:00:00.000Z",
    homeTeamId: "brazil",
    awayTeamId: "japan",
    status: "completed",
    homeScore: 2,
    awayScore: 0,
  },
  {
    id: "tp-1",
    stage: "Third-place",
    venue: "Dallas Park",
    kickoffUtc: "2026-07-12T16:00:00.000Z",
    homeTeamId: "england",
    awayTeamId: "japan",
    status: "completed",
    homeScore: 3,
    awayScore: 1,
  },
  {
    id: "f-1",
    stage: "Final",
    venue: "New York New Jersey Stadium",
    kickoffUtc: "2026-07-19T19:00:00.000Z",
    homeTeamId: "brazil",
    awayTeamId: "spain",
    status: "completed",
    homeScore: 2,
    awayScore: 1,
  },
];

export const goldenBootTable: PlayerStat[] = [
  { id: "vinicius", name: "Vinicius Jr", teamId: "brazil", goals: 4, assists: 2 },
  { id: "kane", name: "Harry Kane", teamId: "england", goals: 3, assists: 1 },
  { id: "olmo", name: "Dani Olmo", teamId: "spain", goals: 3, assists: 2 },
  { id: "mitoma", name: "Kaoru Mitoma", teamId: "japan", goals: 2, assists: 2 },
  { id: "saka", name: "Bukayo Saka", teamId: "england", goals: 2, assists: 1 },
];

export const goalkeeperTable: GoalkeeperStat[] = [
  { id: "alisson", name: "Alisson", teamId: "brazil", cleanSheets: 3, saves: 18, goalsConceded: 4 },
  { id: "simon", name: "Unai Simon", teamId: "spain", cleanSheets: 2, saves: 14, goalsConceded: 5 },
  { id: "pickford", name: "Jordan Pickford", teamId: "england", cleanSheets: 2, saves: 16, goalsConceded: 4 },
  { id: "suzuki", name: "Zion Suzuki", teamId: "japan", cleanSheets: 2, saves: 13, goalsConceded: 5 },
];

export const syncMetadata: SyncMetadata = {
  providerName: "Seeded demo data",
  mode: "demo",
  lastSuccessfulSyncUtc: "2026-06-10T08:30:00.000Z",
  lastAttemptUtc: "2026-06-10T08:30:00.000Z",
  syncIntervalMinutes: 15,
  message: "Using local demo data because the live provider is unavailable or not selected.",
};

const knockoutOrder: Record<Team["status"], number> = {
  "In tournament": 0,
  Winner: 5,
  "Runner-up": 4,
  "Eliminated in semi-final": 3,
  "Eliminated in knockout stage": 2,
  "Eliminated in group stage": 1,
};

const sweepstakePoints: Record<Team["status"], number> = {
  "In tournament": 0,
  Winner: 20,
  "Runner-up": 14,
  "Eliminated in semi-final": 9,
  "Eliminated in knockout stage": 6,
  "Eliminated in group stage": 3,
};

function cloneTeams(data: Team[]) {
  return data.map((team) => ({ ...team }));
}

function cloneMatches(data: Match[]) {
  return data.map((match) => ({ ...match }));
}

function isGroupStage(stage: string) {
  return stage.startsWith("Group ");
}

function groupLabel(group: string) {
  return `Group ${group}`;
}

function sortByTournamentTiebreak(
  records: TeamRecord[],
  groupMatches: Match[],
  teamNameById: Record<string, string>,
) {
  const sorted = [...records].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    if (right.goalDifference !== left.goalDifference) {
      return right.goalDifference - left.goalDifference;
    }

    if (right.goalsFor !== left.goalsFor) {
      return right.goalsFor - left.goalsFor;
    }

    const leftName = teamNameById[left.teamId] ?? left.teamId;
    const rightName = teamNameById[right.teamId] ?? right.teamId;
    return leftName.localeCompare(rightName);
  });

  const groups = new Map<string, TeamRecord[]>();

  for (const record of sorted) {
    const key = `${record.points}-${record.goalDifference}-${record.goalsFor}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(record);
    groups.set(key, bucket);
  }

  const reordered: TeamRecord[] = [];

  for (const record of sorted) {
    const key = `${record.points}-${record.goalDifference}-${record.goalsFor}`;
    const bucket = groups.get(key);

    if (!bucket || bucket.length === 0) {
      continue;
    }

    groups.set(key, []);

    if (bucket.length === 1) {
      reordered.push(bucket[0]);
      continue;
    }

    const tiedIds = new Set(bucket.map((entry) => entry.teamId));
    const miniTable = new Map<string, TeamRecord>(
      bucket.map((entry) => [
        entry.teamId,
        {
          teamId: entry.teamId,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      ]),
    );

    for (const match of groupMatches) {
      if (
        !match.homeTeamId ||
        !match.awayTeamId ||
        match.homeScore === undefined ||
        match.awayScore === undefined ||
        !tiedIds.has(match.homeTeamId) ||
        !tiedIds.has(match.awayTeamId)
      ) {
        continue;
      }

      const home = miniTable.get(match.homeTeamId);
      const away = miniTable.get(match.awayTeamId);

      if (!home || !away) {
        continue;
      }

      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (match.homeScore > match.awayScore) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (match.homeScore < match.awayScore) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    }

    const tiebroken = [...bucket].sort((left, right) => {
      const miniLeft = miniTable.get(left.teamId);
      const miniRight = miniTable.get(right.teamId);

      if (miniLeft && miniRight) {
        if (miniRight.points !== miniLeft.points) {
          return miniRight.points - miniLeft.points;
        }

        if (miniRight.goalDifference !== miniLeft.goalDifference) {
          return miniRight.goalDifference - miniLeft.goalDifference;
        }

        if (miniRight.goalsFor !== miniLeft.goalsFor) {
          return miniRight.goalsFor - miniLeft.goalsFor;
        }
      }

      const leftName = teamNameById[left.teamId] ?? left.teamId;
      const rightName = teamNameById[right.teamId] ?? right.teamId;
      return leftName.localeCompare(rightName);
    });

    reordered.push(...tiebroken);
  }

  return reordered;
}

function deriveStandingsFromMatches(snapshotTeams: Team[], snapshotMatches: Match[]) {
  const groups = [...new Set(snapshotTeams.map((team) => team.group))].sort();
  const teamNameById = Object.fromEntries(snapshotTeams.map((team) => [team.id, team.name]));

  return Object.fromEntries(
    groups.map((group) => {
      const records = new Map<string, TeamRecord>();

      for (const team of snapshotTeams.filter((entry) => entry.group === group)) {
        records.set(team.id, {
          teamId: team.id,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        });
      }

      const groupMatches = snapshotMatches.filter(
        (match) => match.stage === groupLabel(group) && match.status === "completed",
      );

      for (const match of groupMatches) {
        if (
          !match.homeTeamId ||
          !match.awayTeamId ||
          match.homeScore === undefined ||
          match.awayScore === undefined
        ) {
          continue;
        }

        const home = records.get(match.homeTeamId);
        const away = records.get(match.awayTeamId);

        if (!home || !away) {
          continue;
        }

        home.played += 1;
        away.played += 1;
        home.goalsFor += match.homeScore;
        home.goalsAgainst += match.awayScore;
        away.goalsFor += match.awayScore;
        away.goalsAgainst += match.homeScore;
        home.goalDifference = home.goalsFor - home.goalsAgainst;
        away.goalDifference = away.goalsFor - away.goalsAgainst;

        if (match.homeScore > match.awayScore) {
          home.won += 1;
          away.lost += 1;
          home.points += 3;
        } else if (match.homeScore < match.awayScore) {
          away.won += 1;
          home.lost += 1;
          away.points += 3;
        } else {
          home.drawn += 1;
          away.drawn += 1;
          home.points += 1;
          away.points += 1;
        }
      }

      return [
        group,
        sortByTournamentTiebreak([...records.values()], groupMatches, teamNameById),
      ];
    }),
  );
}

function normalizeStandings(
  provided: Record<string, TeamRecord[]>,
  snapshotTeams: Team[],
  snapshotMatches: Match[],
) {
  const derived = deriveStandingsFromMatches(snapshotTeams, snapshotMatches);
  const groups = [...new Set(snapshotTeams.map((team) => team.group))].sort();
  const teamNameById = Object.fromEntries(snapshotTeams.map((team) => [team.id, team.name]));

  return Object.fromEntries(
    groups.map((group) => {
      const fromProvider = provided[group] ?? derived[group] ?? [];
      const groupMatches = snapshotMatches.filter(
        (match) => match.stage === groupLabel(group) && match.status === "completed",
      );

      return [group, sortByTournamentTiebreak(fromProvider, groupMatches, teamNameById)];
    }),
  );
}

function getLastCompletedGroupMatchKickoff(groupMatches: Match[], teamId: string) {
  return [...groupMatches]
    .filter(
      (match) =>
        (match.homeTeamId === teamId || match.awayTeamId === teamId) &&
        match.status === "completed",
    )
    .sort((left, right) => right.kickoffUtc.localeCompare(left.kickoffUtc))[0]?.kickoffUtc;
}

function applyDerivedStatuses(
  snapshotTeams: Team[],
  snapshotMatches: Match[],
  groupStandings: Record<string, TeamRecord[]>,
) {
  const normalizedTeams = cloneTeams(snapshotTeams).map((team): Team => {
    const { eliminatedAtUtc: _omit, ...rest } = team;

    return {
      ...rest,
      status: "In tournament",
    };
  });

  const teamById = new Map(normalizedTeams.map((team) => [team.id, team]));
  const knockoutMatches = snapshotMatches.filter((match) => !isGroupStage(match.stage));
  const knockoutTeams = new Set(
    knockoutMatches
      .flatMap((match) => [match.homeTeamId, match.awayTeamId])
      .filter((teamId): teamId is string => Boolean(teamId)),
  );

  for (const match of knockoutMatches) {
    if (
      !match.homeTeamId ||
      !match.awayTeamId ||
      match.homeScore === undefined ||
      match.awayScore === undefined ||
      match.homeScore === match.awayScore
    ) {
      continue;
    }

    const loserId = match.homeScore > match.awayScore ? match.awayTeamId : match.homeTeamId;
    const loser = teamById.get(loserId);

    if (!loser) {
      continue;
    }

    if (match.stage === "Semi-final") {
      loser.status = "Eliminated in semi-final";
      loser.eliminatedAtUtc = match.kickoffUtc;
      continue;
    }

    if (match.stage === "Final") {
      loser.status = "Runner-up";
      loser.eliminatedAtUtc = match.kickoffUtc;
      continue;
    }

    loser.status = "Eliminated in knockout stage";
    loser.eliminatedAtUtc = match.kickoffUtc;
  }

  const final = snapshotMatches.find(
    (match) =>
      match.stage === "Final" &&
      match.status === "completed" &&
      match.homeScore !== undefined &&
      match.awayScore !== undefined &&
      match.homeScore !== match.awayScore,
  );

  if (final?.homeTeamId && final.awayTeamId) {
    const winnerId = final.homeScore! > final.awayScore! ? final.homeTeamId : final.awayTeamId;
    const winner = teamById.get(winnerId);

    if (winner) {
      winner.status = "Winner";
      winner.eliminatedAtUtc = undefined;
    }
  }

  const completeGroups = Object.entries(groupStandings).filter(([, records]) =>
    records.every((record) => record.played >= 3),
  );

  const thirdPlaceCandidates = completeGroups
    .map(([group, records]) => ({
      group,
      record: records[2],
    }))
    .filter((entry) => Boolean(entry.record));

  const bestThirdQualifiers = new Set(
    [...thirdPlaceCandidates]
      .sort((left, right) => {
        if (right.record.points !== left.record.points) {
          return right.record.points - left.record.points;
        }

        if (right.record.goalDifference !== left.record.goalDifference) {
          return right.record.goalDifference - left.record.goalDifference;
        }

        if (right.record.goalsFor !== left.record.goalsFor) {
          return right.record.goalsFor - left.record.goalsFor;
        }

        return left.group.localeCompare(right.group);
      })
      .slice(0, getThirdPlaceAdvanceCount())
      .map((entry) => entry.record.teamId),
  );

  const allGroupsComplete = completeGroups.length === Object.keys(groupStandings).length;

  for (const [group, records] of completeGroups) {
    const groupMatches = snapshotMatches.filter((match) => match.stage === groupLabel(group));

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const team = teamById.get(record.teamId);

      if (!team || knockoutTeams.has(record.teamId)) {
        continue;
      }

      const shouldEliminate =
        index >= 3 ||
        (index === 2 && allGroupsComplete && !bestThirdQualifiers.has(record.teamId));

      if (!shouldEliminate || team.status !== "In tournament") {
        continue;
      }

      team.status = "Eliminated in group stage";
      team.eliminatedAtUtc = getLastCompletedGroupMatchKickoff(groupMatches, record.teamId);
    }
  }

  return normalizedTeams;
}

function finalizeTournamentSnapshot(base: {
  teams: Team[];
  matches: Match[];
  groupStandings?: Record<string, TeamRecord[]>;
  people: Person[];
  assignments: Assignment[];
  goldenBootTable: PlayerStat[];
  goalkeeperTable: GoalkeeperStat[];
  syncMetadata: SyncMetadata;
}) {
  const snapshotMatches = cloneMatches(base.matches);
  const groupStandings = normalizeStandings(
    base.groupStandings ?? {},
    base.teams,
    snapshotMatches,
  );
  const normalizedTeams = applyDerivedStatuses(base.teams, snapshotMatches, groupStandings);

  return {
    ...base,
    teams: normalizedTeams,
    matches: snapshotMatches,
    groupStandings,
  } satisfies TournamentSnapshot;
}

function createDemoSnapshot() {
  return finalizeTournamentSnapshot({
    teams,
    matches,
    people,
    assignments,
    goldenBootTable,
    goalkeeperTable,
    syncMetadata,
  });
}

async function fetchAndFinalizeLiveSnapshot() {
  const live = await fetchProviderTournamentData();

  return finalizeTournamentSnapshot({
    ...live,
    people,
    assignments,
    goldenBootTable,
    goalkeeperTable,
  });
}

export async function syncAndPersistLiveSnapshot() {
  try {
    const snapshot = await fetchAndFinalizeLiveSnapshot();

    if (shouldUseDbCache()) {
      await saveSnapshot(snapshot);
    }

    const message = snapshot.syncMetadata.message ?? "Live snapshot synced and persisted.";
    await saveSyncRun({
      ok: true,
      mode: "live",
      provider: snapshot.syncMetadata.providerName,
      message,
    });

    return {
      ok: true as const,
      mode: "live" as const,
      provider: snapshot.syncMetadata.providerName,
      message,
      lastSuccessfulSyncUtc: snapshot.syncMetadata.lastSuccessfulSyncUtc,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";

    await saveSyncRun({
      ok: false,
      mode: "live",
      provider: process.env.WORLDCUP_API_BASE_URL ?? "worldcup26.ir",
      message,
    });

    return {
      ok: false as const,
      mode: "live" as const,
      provider: process.env.WORLDCUP_API_BASE_URL ?? "worldcup26.ir",
      message,
      lastSuccessfulSyncUtc: new Date().toISOString(),
    };
  }
}

export async function getTournamentSnapshot(): Promise<TournamentSnapshot> {
  const mode = getProviderMode();

  if (mode === "demo") {
    return createDemoSnapshot();
  }

  const canUseDb = shouldUseDbCache() && !isBuildPhase();
  const maxAge = getCacheMaxAgeMinutes();

  if (mode === "auto" && canUseDb) {
    const cached = await getLatestSnapshot(maxAge);

    if (cached) {
      return cached;
    }
  }

  try {
    const snapshot = await fetchAndFinalizeLiveSnapshot();

    if (canUseDb) {
      await saveSnapshot(snapshot);
    }

    return snapshot;
  } catch {
    if (canUseDb) {
      const cached = await getLatestSnapshot();

      if (cached) {
        return {
          ...cached,
          syncMetadata: {
            ...cached.syncMetadata,
            message: "Using persisted snapshot because live provider fetch failed.",
          },
        };
      }
    }

    return createDemoSnapshot();
  }
}

export function createTeamLookup(snapshot: TournamentSnapshot) {
  return Object.fromEntries(snapshot.teams.map((team) => [team.id, team]));
}

export function getTeamBySlug(snapshot: TournamentSnapshot, slug: string) {
  return snapshot.teams.find((team) => team.slug === slug);
}

export function getTeam(snapshot: TournamentSnapshot, teamId: string) {
  const team = snapshot.teams.find((item) => item.id === teamId);

  if (!team) {
    throw new Error(`Unknown team: ${teamId}`);
  }

  return team;
}

export function getAssignedPerson(snapshot: TournamentSnapshot, teamId: string) {
  const assignment = snapshot.assignments.find((item) => item.teamId === teamId);

  if (!assignment) {
    return undefined;
  }

  return snapshot.people.find((person) => person.id === assignment.personId);
}

export function getMatchesByTeam(snapshot: TournamentSnapshot, teamId: string) {
  return snapshot.matches.filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId);
}

export function getRecentResults(snapshot: TournamentSnapshot, limit = 4) {
  return [...snapshot.matches]
    .filter((match) => match.status === "completed")
    .sort((left, right) => right.kickoffUtc.localeCompare(left.kickoffUtc))
    .slice(0, limit);
}

export function getMatchesByStage(snapshot: TournamentSnapshot, stage: string) {
  return snapshot.matches.filter((match) => match.stage === stage);
}

export function getGroupKeys(snapshot: TournamentSnapshot) {
  return Object.keys(snapshot.groupStandings).sort();
}

export function getGroupStandings(snapshot: TournamentSnapshot, group: string) {
  return snapshot.groupStandings[group] ?? [];
}

export function getWinnerAndRunnerUp(snapshot: TournamentSnapshot) {
  const final = snapshot.matches.find((match) => match.stage === "Final");

  if (!final || final.homeScore === undefined || final.awayScore === undefined) {
    return { winner: undefined, runnerUp: undefined };
  }

  if (!final.homeTeamId || !final.awayTeamId || final.homeScore === final.awayScore) {
    return { winner: undefined, runnerUp: undefined };
  }

  const winner =
    final.homeScore > final.awayScore
      ? getTeam(snapshot, final.homeTeamId)
      : getTeam(snapshot, final.awayTeamId);
  const runnerUp =
    final.homeScore > final.awayScore
      ? getTeam(snapshot, final.awayTeamId)
      : getTeam(snapshot, final.homeTeamId);

  return { winner, runnerUp };
}

function statusEliminationOrder(status: Team["status"]) {
  switch (status) {
    case "Eliminated in group stage":
      return 1;
    case "Eliminated in knockout stage":
      return 2;
    case "Eliminated in semi-final":
      return 3;
    case "Runner-up":
      return 4;
    case "Winner":
      return 5;
    default:
      return 6;
  }
}

export function getFirstOut(snapshot: TournamentSnapshot) {
  return snapshot.teams
    .filter((team) => team.eliminatedAtUtc)
    .sort((left, right) => {
      if (left.eliminatedAtUtc !== right.eliminatedAtUtc) {
        return String(left.eliminatedAtUtc).localeCompare(String(right.eliminatedAtUtc));
      }

      const statusDiff = statusEliminationOrder(left.status) - statusEliminationOrder(right.status);

      if (statusDiff !== 0) {
        return statusDiff;
      }

      return left.name.localeCompare(right.name);
    })[0];
}

export function getSweepstakeLeaderboard(snapshot: TournamentSnapshot) {
  return snapshot.assignments
    .map((assignment) => {
      const person = snapshot.people.find((item) => item.id === assignment.personId);
      const team = snapshot.teams.find((entry) => entry.id === assignment.teamId);

      if (!team) {
        return undefined;
      }

      return {
        personId: assignment.personId,
        name: person?.name ?? "Unassigned",
        team,
        points: sweepstakePoints[team.status],
        progressRank: knockoutOrder[team.status],
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      if (right.progressRank !== left.progressRank) {
        return right.progressRank - left.progressRank;
      }

      return left.name.localeCompare(right.name);
    });
}

export function getTopScorers(snapshot: TournamentSnapshot) {
  return [...snapshot.goldenBootTable].sort((left, right) => {
    if (right.goals !== left.goals) {
      return right.goals - left.goals;
    }

    return right.assists - left.assists;
  });
}

export function getTopGoalkeepers(snapshot: TournamentSnapshot) {
  return [...snapshot.goalkeeperTable].sort((left, right) => {
    if (right.cleanSheets !== left.cleanSheets) {
      return right.cleanSheets - left.cleanSheets;
    }

    if (right.saves !== left.saves) {
      return right.saves - left.saves;
    }

    return left.goalsConceded - right.goalsConceded;
  });
}

export function getDashboardSummary(snapshot: TournamentSnapshot) {
  const { winner, runnerUp } = getWinnerAndRunnerUp(snapshot);
  const firstOut = getFirstOut(snapshot);
  const leader = getSweepstakeLeaderboard(snapshot)[0];

  return {
    winner,
    runnerUp,
    firstOut,
    leader,
    lastSync: snapshot.syncMetadata.lastSuccessfulSyncUtc,
  };
}

function stageRank(stage: string) {
  if (stage.startsWith("Group ")) {
    return 100 + stage.charCodeAt(stage.length - 1);
  }

  switch (stage) {
    case "Round of 32":
      return 200;
    case "Round of 16":
      return 300;
    case "Quarter-final":
      return 400;
    case "Semi-final":
      return 500;
    case "Third-place":
      return 600;
    case "Final":
      return 700;
    default:
      return 1000;
  }
}

export function getStageOrder(snapshot: TournamentSnapshot) {
  return [...new Set(snapshot.matches.map((match) => match.stage))].sort(
    (left, right) => stageRank(left) - stageRank(right),
  );
}