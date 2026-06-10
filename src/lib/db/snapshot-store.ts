import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";

import { TournamentSnapshot } from "@/lib/types";

let dbPromise: Promise<PGlite> | undefined;

async function getDbDirectory() {
  const dbPath = process.env.WORLDCUP_DB_PATH ?? ".worldcup-db";
  const absolute = path.isAbsolute(dbPath)
    ? dbPath
    : process.env.VERCEL
      ? path.join(os.tmpdir(), dbPath)
      : path.join(process.cwd(), dbPath);

  await mkdir(absolute, { recursive: true });

  return absolute;
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const dir = await getDbDirectory();
      const db = new PGlite(path.join(dir, "snapshot.pglite"));

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

  return dbPromise;
}

export async function saveSnapshot(snapshot: TournamentSnapshot) {
  const db = await getDb();

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
  const db = await getDb();

  await db.query(
    `
      INSERT INTO sync_runs (ok, mode, provider, message)
      VALUES ($1, $2, $3, $4)
    `,
    [input.ok, input.mode, input.provider, input.message],
  );
}

export async function getLatestSnapshot(maxAgeMinutes?: number) {
  const db = await getDb();

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