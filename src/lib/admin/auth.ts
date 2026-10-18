import "server-only";
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminSql } from "./db";
export const COOKIE = "zylo_owner_session";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function passwordMatches(password: string, hash: string) {
  const [salt, key] = hash.split(":");
  if (!salt || !key || key.length !== 128) return false;
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(key, "hex"),
  );
}
export async function owner() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const sql = adminSql();
  const rows =
    await sql`SELECT u.id,u.email FROM admin_sessions s JOIN admin_users u ON u.id=s.admin_id WHERE s.token_hash=${digest(token)} AND s.expires_at>now() AND u.password_hash IS NOT NULL`;
  return (rows[0] as { id: number; email: string } | undefined) ?? null;
}
export async function requireOwner() {
  const user = await owner();
  if (!user) redirect("/admin/login");
  return user;
}
export async function startSession() {
  const token = randomBytes(32).toString("hex");
  const sql = adminSql();
  await sql`INSERT INTO admin_sessions(token_hash,admin_id,expires_at) VALUES(${digest(token)},1,now()+interval '12 hours')`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}
export async function rateLimit(scope: string, limit = 10) {
  const h = await headers();
  const ip =
    h.get("x-vercel-forwarded-for")?.split(",")[0] ??
    h.get("x-forwarded-for")?.split(",")[0] ??
    "local";
  const sql = adminSql();
  const key = digest(`${scope}:${ip}`);
  const rows =
    await sql`INSERT INTO admin_login_attempts(key,attempts,reset_at) VALUES(${key},1,now()+interval '15 minutes')
    ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN admin_login_attempts.reset_at<now() THEN 1 ELSE admin_login_attempts.attempts+1 END,
    reset_at=CASE WHEN admin_login_attempts.reset_at<now() THEN now()+interval '15 minutes' ELSE admin_login_attempts.reset_at END RETURNING attempts`;
  return Number(rows[0].attempts) <= limit;
}
