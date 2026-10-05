"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "forgot";

export function friendly(message: string, mode: Mode): string {
  const m = message.toLowerCase();
  if (m.includes("database error saving new user") || m.includes("not been given access")) {
    return "This email hasn’t been given access yet. Ask an Admin to approve it, then try again.";
  }
  if (m.includes("invalid login")) return "Wrong email or password.";
  if (m.includes("not confirmed")) return "Please open the confirmation email we sent and tap its link first.";
  if (m.includes("rate limit")) return "Too many emails were sent just now. Wait a few minutes and try again.";
  if (m.includes("password")) return "Use a password of at least 8 characters.";
  const generic = friendlyError(message);
  if (generic !== message) return generic;
  return mode === "signup" ? message : "Couldn’t sign in. Please try again.";
}

const emphasis = "underline decoration-chartreuse decoration-[6px] underline-offset-4";

export function LoginForm({ confirmFailed }: { confirmFailed: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    confirmFailed ? "That link didn’t work, or it has expired. Sign in, or ask for a new one." : null,
  );
  const [sentTo, setSentTo] = useState<{ email: string; kind: "confirm" | "reset" } | null>(null);

  function switchTo(next: Mode) {
    setMode(next);
    setPassword("");
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const address = email.trim().toLowerCase();

    if (mode === "forgot") {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      setBusy(false);
      if (error) setError(friendly(error.message, "forgot"));
      else setSentTo({ email: address, kind: "reset" });
      return;
    }

    if (password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }
    setBusy(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: address, password });
      if (error) setError(friendly(error.message, mode));
      else {
        router.replace("/");
        router.refresh();
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: address,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(friendly(error.message, mode));
      else if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      } else setSentTo({ email: address, kind: "confirm" });
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="font-display text-[26px] leading-none font-light tracking-[-0.03em]">OnTime</div>

      {sentTo ? (
        <div className="mt-10">
          <h1 className="font-display text-[44px] leading-[0.95] font-light tracking-[-0.04em]">
            Check your <em className={emphasis}>email</em>
          </h1>
          <p className="mt-5 text-[17px] text-ink/80">
            {sentTo.kind === "reset" ? "If that email has an account, we sent a link to " : "We sent a confirmation link to "}
            <b className="font-medium">{sentTo.email}</b>. Tap it, then {sentTo.kind === "reset" ? "choose a new password." : "come back and sign in."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              switchTo("signin");
            }}
            className="mt-8 h-14 w-full rounded-[10px] border border-ink text-base font-medium"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10" noValidate>
          <h1 className="font-display text-[44px] leading-[0.95] font-light tracking-[-0.04em]">
            {mode === "forgot" ? (
              <>
                Reset your <em className={emphasis}>password</em>
              </>
            ) : mode === "signin" ? (
              <>
                Welcome <em className={emphasis}>back</em>
              </>
            ) : (
              <>
                Create your <em className={emphasis}>account</em>
              </>
            )}
          </h1>
          <p className="mt-3 text-[15px] text-ink/65">
            {mode === "forgot"
              ? "Enter your email and we’ll send you a link to choose a new password."
              : mode === "signin"
                ? "Sign in to record today’s attendance."
                : "Only emails an Admin has approved can create an account."}
          </p>

          <label htmlFor="email" className="mt-7 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[18px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
          />

          {mode !== "forgot" && (
            <>
              <label htmlFor="password" className="mt-4 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[18px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
              />
              {mode === "signin" && (
                <button type="button" onClick={() => switchTo("forgot")} className="mt-1 py-3 text-[14px] text-ink/70 underline underline-offset-4">
                  Forgot password?
                </button>
              )}
            </>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-[12px] bg-clay px-4 py-3 text-[15px] leading-snug text-ink">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !email || (mode !== "forgot" && !password)}
            className="mt-6 h-14 w-full rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "One moment…" : mode === "forgot" ? "Send reset link" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button type="button" onClick={() => switchTo(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full py-3 text-center text-[15px] text-ink/70 underline underline-offset-4">
            {mode === "signin" ? "First time? Create your account" : mode === "forgot" ? "Back to sign in" : "Already have an account? Sign in"}
          </button>
        </form>
      )}
    </main>
  );
}
