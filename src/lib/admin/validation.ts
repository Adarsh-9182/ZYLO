export const STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof STATUSES)[number];
export const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
export function canTransition(from: string, to: string) {
  return (
    from === to ||
    Boolean(TRANSITIONS[from as OrderStatus]?.includes(to as OrderStatus))
  );
}
export class InputError extends Error {}
export function text(form: FormData, key: string, max: number, min = 0) {
  const value = String(form.get(key) ?? "").trim();
  if (value.length < min || value.length > max)
    throw new InputError(
      `Please check ${key.replace(/([A-Z])/g, " $1").toLowerCase()} (${min}–${max} characters).`,
    );
  return value;
}
export function number(
  form: FormData,
  key: string,
  min: number,
  max: number,
  integer = true,
) {
  const raw = String(form.get(key) ?? "").trim();
  const value = Number(raw);
  if (
    !raw ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  )
    throw new InputError(
      `Please enter a valid ${key.replace(/([A-Z])/g, " $1").toLowerCase()} between ${min} and ${max}.`,
    );
  return value;
}
export function imageUrl(value: string) {
  if (/^\/[^/]/.test(value) && !value.includes("\\")) return value;
  try {
    const u = new URL(value);
    if (u.protocol === "https:" && !u.username && !u.password) return u.href;
  } catch {}
  throw new InputError(
    "Use an HTTPS image URL or an image path starting with /.",
  );
}
export function externalUrl(value: string) {
  if (!value) return "";
  try {
    const u = new URL(value);
    if (u.protocol === "https:" && !u.username && !u.password) return u.href;
  } catch {}
  throw new InputError("Tracking URL must start with https://.");
}
export function emailAddress(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 200 || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email))
    throw new InputError("Enter a valid email address.");
  return email;
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
