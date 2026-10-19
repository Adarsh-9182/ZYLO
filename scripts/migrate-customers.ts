import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const source = await readFile("scripts/migrate-customers.sql", "utf8");
  await sql.transaction(
    source
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => sql.query(s)),
  );
  console.log("Customer order ownership migration applied.");
}
main().catch((error) => {
  console.error("Customer migration failed", error.message);
  process.exit(1);
});
