"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

/** Reached from the reset email, with a temporary session that lets the Admin choose a new password. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use a password of at least 8 characters.");
    if (password !== again) return setError("The two passwords don’t match.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setError(friendlyError(error.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="font-display text-[26px] leading-none font-light tracking-[-0.03em]">OnTime</div>
      <form onSubmit={submit} className="mt-10" noValidate>
        <h1 className="font-display text-[44px] leading-[0.95] font-light tracking-[-0.04em]">
          Choose a new <em className="underline decoration-chartreuse decoration-[6px] underline-offset-4">password</em>
        </h1>
        <label htmlFor="new-password" className="mt-7 block text-sm font-medium">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[18px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
        />
        <label htmlFor="again" className="mt-4 block text-sm font-medium">
          Type it again
        </label>
        <input
          id="again"
          type="password"
          autoComplete="new-password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[18px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
        />
        {error && (
          <p role="alert" className="mt-4 rounded-[12px] bg-clay px-4 py-3 text-[15px] leading-snug text-ink">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !password || !again}
          className="mt-6 h-14 w-full rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "One moment…" : "Save new password"}
        </button>
      </form>
    </main>
  );
}
