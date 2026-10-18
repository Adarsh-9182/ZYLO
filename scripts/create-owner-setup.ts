import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { neon } from "@neondatabase/serverless";
import { randomBytes, createHash } from "node:crypto";
import { writeFile, chmod } from "node:fs/promises";
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const token = randomBytes(32).toString("hex"),
    hash = createHash("sha256").update(token).digest("hex");
  const rows =
    await sql`INSERT INTO admin_users(id,setup_token_hash,setup_expires_at) VALUES(1,${hash},now()+interval '7 days') ON CONFLICT(id) DO UPDATE SET setup_token_hash=${hash},setup_expires_at=now()+interval '7 days' WHERE admin_users.password_hash IS NULL RETURNING id`;
  if (!rows.length) {
    console.log(
      "Owner account already exists. Sign in at /admin/login. No account changed.",
    );
    return;
  }
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://zylo-delta.vercel.app";
  await writeFile(
    "OWNER-SETUP.md",
    `# Your Zylo owner account\n\n[Create your owner account](${base}/admin/setup?token=${token})\n\nOpen the link above and set your email and a password of at least 12 characters. The link expires in seven days and can only be used once. Keep it private.\n\nAfter setup, use [your dashboard](${base}/admin).\n`,
    { mode: 0o600 },
  );
  await chmod("OWNER-SETUP.md", 0o600);
  console.log(
    "One-time owner setup link saved in OWNER-SETUP.md. No password has been assigned.",
  );
}
main().catch((e) => {
  console.error("Setup link failed", e.message);
  process.exit(1);
});
