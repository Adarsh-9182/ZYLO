"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/customer-auth/client";
import { customerAuthError } from "@/lib/customer-auth/errors";

type Mode = "login" | "signup" | "forgot" | "reset";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.2H24v8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.8-3.6 6.1-8.8 6.1-15.1Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20.4 20.4 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.5a12.2 12.2 0 0 1 0-7V15H5.8a20.1 20.1 0 0 0 0 18l6.8-5.5Z"
      />
      <path
        fill="#EA4335"
        d="M24 12.1c3 0 5.7 1 7.8 3l5.8-5.8A19.6 19.6 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15l6.8 5.5A12 12 0 0 1 24 12.1Z"
      />
    </svg>
  );
}

export function CustomerAuthForm({
  mode,
  returnTo = "/account",
  initialError,
  resetToken,
  passwordReset = false,
}: {
  mode: Mode;
  returnTo?: string;
  initialError?: string;
  resetToken?: string;
  passwordReset?: boolean;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState(
    passwordReset ? "Your password has been reset. You can log in now." : "",
  );
  const signup = mode === "signup";
  const credentialForm = mode === "login" || signup;
  const title = {
    login: "Welcome back",
    signup: "Create an account",
    forgot: "Forgot your password?",
    reset: "Reset your password",
  }[mode];
  const description = {
    login: "Enter your credentials to access your account",
    signup: "Enter your details to create your Zylo account",
    forgot: "Enter your email and we’ll send you a reset link",
    reset: "Choose a new password for your account",
  }[mode];
  const query =
    returnTo === "/account" ? "" : `?next=${encodeURIComponent(returnTo)}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");
    if (
      (signup || mode === "reset") &&
      password !== data.get("confirmPassword")
    ) {
      setError("Your passwords don’t match.");
      return;
    }
    setBusy("email");
    setError(undefined);
    setNotice("");
    try {
      if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (result.error) {
          setError("We couldn’t send a reset link. Please try again shortly.");
          return;
        }
        setNotice(
          "If there’s an account with that email, a password reset link is on its way. Check your inbox and spam folder.",
        );
        return;
      }
      if (mode === "reset") {
        if (!resetToken) {
          setError("Request a new reset link to continue.");
          return;
        }
        const result = await authClient.resetPassword({
          newPassword: password,
          token: resetToken,
        });
        if (result.error) {
          setError(
            customerAuthError(
              result.error,
              "This reset link has expired. Request a new one.",
            ),
          );
          return;
        }
        router.replace("/login?reset=1");
        return;
      }
      const result = signup
        ? await authClient.signUp.email({
            name: String(data.get("name") ?? "").trim(),
            email,
            password,
            callbackURL: `${window.location.origin}${returnTo}`,
          })
        : await authClient.signIn.email({
            email,
            password,
            rememberMe: true,
            callbackURL: `${window.location.origin}${returnTo}`,
          });
      if (result.error) {
        setError(
          customerAuthError(
            result.error,
            signup
              ? "We couldn’t create your account. Please try again."
              : "Email or password is incorrect.",
          ),
        );
        return;
      }
      const session = await authClient.getSession();
      if (!session.data?.user) {
        setNotice(
          "Check your inbox to verify your email, then log in to your account.",
        );
        return;
      }
      router.replace(returnTo);
      router.refresh();
    } catch (cause) {
      setError(customerAuthError(cause));
    } finally {
      setBusy(null);
    }
  }

  async function google() {
    setBusy("google");
    setError(undefined);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}${returnTo}`,
        errorCallbackURL: `${window.location.origin}/login?error=google`,
      });
      if (result.error) {
        setError(
          customerAuthError(
            result.error,
            "Google sign-in is unavailable. Please try email login.",
          ),
        );
        setBusy(null);
      }
    } catch (cause) {
      setError(
        customerAuthError(
          cause,
          "Google sign-in could not start. Please try again.",
        ),
      );
      setBusy(null);
    }
  }

  return (
    <section
      className="customer-auth-panel"
      aria-labelledby="customer-auth-title"
    >
      <h1 id="customer-auth-title">{title}</h1>
      <p className="customer-auth-description">{description}</p>
      {notice && (
        <p role="status" className="customer-auth-notice">
          {notice}
        </p>
      )}
      <form onSubmit={submit} className="customer-auth-form">
        <fieldset disabled={Boolean(busy)}>
          {signup && (
            <label className="customer-auth-field">
              <span className="customer-sr-only">Full name</span>
              <input
                name="name"
                placeholder="Full name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
              />
            </label>
          )}
          {mode !== "reset" && (
            <label className="customer-auth-field">
              <span className="customer-sr-only">Email</span>
              <input
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                maxLength={200}
                autoCapitalize="none"
              />
            </label>
          )}
          {mode !== "forgot" && (
            <div className="customer-auth-password">
              <label className="customer-auth-field">
                <span className="customer-sr-only">
                  {mode === "reset" ? "New password" : "Password"}
                </span>
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  placeholder={mode === "reset" ? "New password" : "Password"}
                  autoComplete={
                    signup || mode === "reset"
                      ? "new-password"
                      : "current-password"
                  }
                  required
                  minLength={signup || mode === "reset" ? 12 : undefined}
                  maxLength={128}
                  aria-describedby={
                    signup || mode === "reset" ? "password-help" : undefined
                  }
                />
              </label>
              <button
                className="customer-auth-eye"
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          )}
          {(signup || mode === "reset") && (
            <>
              <label className="customer-auth-field">
                <span className="customer-sr-only">Confirm password</span>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                />
              </label>
              <p id="password-help" className="customer-auth-help">
                Use at least 12 characters.
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="customer-auth-error">
              {error}
            </p>
          )}
          <button
            className="customer-auth-primary"
            type="submit"
            disabled={mode === "reset" && !resetToken}
          >
            {busy === "email" && <Loader2 size={18} className="animate-spin" />}
            {busy === "email"
              ? "Please wait…"
              : {
                  login: "Login",
                  signup: "Sign up",
                  forgot: "Send reset link",
                  reset: "Reset password",
                }[mode]}
          </button>
        </fieldset>
      </form>
      {credentialForm && (
        <>
          <div className="customer-auth-divider">
            <span>OR</span>
          </div>
          <button
            className="customer-auth-secondary"
            type="button"
            disabled={Boolean(busy)}
            onClick={google}
          >
            {busy === "google" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <GoogleMark />
            )}
            Continue with Google
          </button>
          <Link
            className="customer-auth-secondary customer-auth-switch"
            href={`${signup ? "/login" : "/signup"}${query}`}
          >
            {signup
              ? "Already have an account? Login"
              : "Don't have an account? Sign up"}
          </Link>
        </>
      )}
      <div className="customer-auth-footer">
        {mode === "login" ? (
          <Link href="/forgot-password">Forgot password?</Link>
        ) : (
          <Link href={mode === "reset" ? "/forgot-password" : "/login"}>
            {mode === "reset" ? "Request a new reset link" : "Back to login"}
          </Link>
        )}
      </div>
    </section>
  );
}
