import { runMigrations } from "../src/lib/db/migrations";

async function main() {
  await runMigrations();
  console.log("Migrations completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
