import { Pool, type QueryResultRow } from "pg";

let pool: Pool | undefined;

function getConnectionString() {
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  }

  return connectionString;
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getConnectionString(),
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const client = getPool();
  const result = await client.query<T>(text, values);
  return result;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
