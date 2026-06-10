import { mkdir } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";

import { runMigrations } from "@/lib/db/migrations";
import { query } from "@/lib/db/postgres";
import { TournamentSnapshot } from "@/lib/types";

let localDbPromise: Promise<PGlite> | undefined;
let postgresSchemaPromise: Promise<void> | undefined;

async function getLocalDbDirectory() {
  const dbPath = process.env.WORLDCUP_DB_PATH ?? ".worldcup-db";
  const absolute = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

  await mkdir(absolute, { recursive: true });

  return absolute;
}

async function getLocalDb() {
  if (!localDbPromise) {
    localDbPromise = (async () => {
      const dir = await getLocalDbDirectory();
      const db = new PGlite(dir);

      await db.exec(`
        CREATE TABLE IF NOT EXISTS tournament_snapshots (
          id BIGSERIAL PRIMARY KEY,
          provider TEXT NOT NULL,
          mode TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          payload JSONB NOT NULL
        );
      `);

      await db.exec(`
        CREATE TABLE IF NOT EXISTS sync_runs (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ok BOOLEAN NOT NULL,
          mode TEXT NOT NULL,
          provider TEXT NOT NULL,
          message TEXT NOT NULL
        );
      `);

      return db;
    })();
  }

  return localDbPromise;
}

function shouldUsePostgres() {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

async function ensurePostgresSchema() {
  if (!postgresSchemaPromise) {
    postgresSchemaPromise = runMigrations();
  }

  await postgresSchemaPromise;
}

export async function saveSnapshot(snapshot: TournamentSnapshot) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    await query(
      `
        INSERT INTO tournament_snapshots (provider, mode, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [snapshot.syncMetadata.providerName, snapshot.syncMetadata.mode, JSON.stringify(snapshot)],
    );
    return;
  }

  const db = await getLocalDb();

  await db.query(
    `
      INSERT INTO tournament_snapshots (provider, mode, payload)
      VALUES ($1, $2, $3::jsonb)
    `,
    [snapshot.syncMetadata.providerName, snapshot.syncMetadata.mode, JSON.stringify(snapshot)],
  );
}

export async function saveSyncRun(input: {
  ok: boolean;
  mode: "demo" | "live";
  provider: string;
  message: string;
}) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    await query(
      `
        INSERT INTO sync_runs (ok, mode, provider, message)
        VALUES ($1, $2, $3, $4)
      `,
      [input.ok, input.mode, input.provider, input.message],
    );
    return;
  }

  const db = await getLocalDb();

  await db.query(
    `
      INSERT INTO sync_runs (ok, mode, provider, message)
      VALUES ($1, $2, $3, $4)
    `,
    [input.ok, input.mode, input.provider, input.message],
  );
}

export async function getLatestSnapshot(maxAgeMinutes?: number) {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const rows = await query<{
      payload: TournamentSnapshot;
      created_at: string;
    }>(
      `
        SELECT payload, created_at
        FROM tournament_snapshots
        ORDER BY id DESC
        LIMIT 1
      `,
    );

    const latest = rows.rows[0];

    if (!latest) {
      return undefined;
    }

    if (maxAgeMinutes && maxAgeMinutes > 0) {
      const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;
      const createdAtMs = new Date(latest.created_at).getTime();

      if (createdAtMs < cutoff) {
        return undefined;
      }
    }

    return latest.payload;
  }

  const db = await getLocalDb();
  const rows = await db.query<{
    payload: TournamentSnapshot;
    created_at: string;
  }>(
    `
      SELECT payload, created_at
      FROM tournament_snapshots
      ORDER BY id DESC
      LIMIT 1
    `,
  );

  const latest = rows.rows[0];

  if (!latest) {
    return undefined;
  }

  if (maxAgeMinutes && maxAgeMinutes > 0) {
    const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;
    const createdAtMs = new Date(latest.created_at).getTime();

    if (createdAtMs < cutoff) {
      return undefined;
    }
  }

  return latest.payload;
}

export async function getLatestSyncRun() {
  if (shouldUsePostgres()) {
    await ensurePostgresSchema();
    const rows = await query<{
      ok: boolean;
      mode: "demo" | "live";
      provider: string;
      message: string;
      created_at: string;
    }>(
      `
        SELECT ok, mode, provider, message, created_at
        FROM sync_runs
        ORDER BY id DESC
        LIMIT 1
      `,
    );

    return rows.rows[0];
  }

  const db = await getLocalDb();
  const rows = await db.query<{
    ok: boolean;
    mode: "demo" | "live";
    provider: string;
    message: string;
    created_at: string;
  }>(
    `
      SELECT ok, mode, provider, message, created_at
      FROM sync_runs
      ORDER BY id DESC
      LIMIT 1
    `,
  );

  return rows.rows[0];
}
