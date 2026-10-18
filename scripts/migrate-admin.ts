import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const source = await readFile("scripts/migrate-admin.sql", "utf8");
  const statements = source
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  await sql.transaction(statements.map((s) => sql.query(s)));
  console.log("Business dashboard migration applied.");
}
main().catch((e) => {
  console.error("Migration failed", e.message);
  process.exit(1);
});
