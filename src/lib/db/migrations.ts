import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { query } from "@/lib/db/postgres";

async function readMigrationFiles() {
  const migrationDir = path.join(process.cwd(), "migrations");
  const entries = await readdir(migrationDir);

  return entries
    .filter((entry) => entry.endsWith(".sql"))
    .sort()
    .map((entry) => path.join(migrationDir, entry));
}

export async function runMigrations() {
  for await (const filePath of await readMigrationFiles()) {
    const sql = await readFile(filePath, "utf8");
    await query(sql);
  }
}
