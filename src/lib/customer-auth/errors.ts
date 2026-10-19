export function customerAuthError(
  error: unknown,
  fallback = "We couldn’t connect. Check your connection and try again.",
) {
  if (!error || typeof error !== "object") return fallback;
  const info = error as { status?: number; code?: string; message?: string };
  const code = String(info.code ?? "").toUpperCase();
  const message = String(info.message ?? "");
  if (
    info.status === 401 ||
    code === "INVALID_EMAIL_OR_PASSWORD" ||
    /invalid email or password|invalid credentials|incorrect password/i.test(
      message,
    )
  )
    return "Email or password is incorrect.";
  if (info.status === 429 || /too.many|rate.limit/i.test(code + message))
    return "Too many attempts. Please wait a few minutes and try again.";
  if (code === "EMAIL_NOT_VERIFIED" || /email.*not verified/i.test(message))
    return "Please verify your email before logging in. Check your inbox for the verification link.";
  if (
    /USER_ALREADY_EXISTS|EMAIL_ALREADY_EXISTS/.test(code) ||
    /already exists|already registered/i.test(message)
  )
    return "An account with this email already exists. Please log in.";
  if (
    /INVALID_TOKEN|TOKEN_EXPIRED/.test(code) ||
    /invalid token|token.*expired/i.test(message)
  )
    return "This link is invalid or expired. Request a new one.";
  if (/PASSWORD_TOO_SHORT/.test(code))
    return "Choose a password with at least 12 characters.";
  if (/callback|origin|provider|configuration/i.test(code + message))
    return "Sign-in is temporarily unavailable. Please try again shortly.";
  return fallback;
}
