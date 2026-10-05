"use client";

import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FlashToast, useFlash } from "@/components/Flash";
import { useAddApprovedEmail, useApprovedEmails, useRemoveApprovedEmail, type ApprovedPerson } from "@/data/queries";
import { formatDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { Sheet } from "@/features/today/Sheet";

const SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function AccessScreen() {
  const q = useApprovedEmails();
  const add = useAddApprovedEmail();
  const remove = useRemoveApprovedEmail();
  const flash = useFlash();
  const [me, setMe] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ApprovedPerson | null>(null);

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setMe(data.user?.email?.toLowerCase() ?? null));
  }, []);

  async function onAdd() {
    const value = email.trim().toLowerCase();
    if (!SHAPE.test(value)) return setProblem("That doesn’t look like an email address.");
    if ((q.data ?? []).some((p) => p.email === value)) return setProblem("That email already has access.");
    setProblem(null);
    try {
      await add.mutateAsync(value);
      setEmail("");
    } catch (e) {
      flash.flash(e instanceof Error ? e.message : "Couldn’t add that email. Please try again.");
    }
  }

  async function onRemove(p: ApprovedPerson) {
    try {
      await remove.mutateAsync(p.email);
    } catch (e) {
      flash.flash(e instanceof Error ? e.message : "Couldn’t remove that email. Please try again.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <Link href="/more" className="inline-flex h-10 items-center gap-1 text-[15px] text-ink/70">
        <span aria-hidden>←</span> More
      </Link>
      <h1 className="mt-2 font-display text-[44px] leading-none font-light tracking-[-0.04em]">Admin access</h1>
      <p className="mt-3 text-[15px] text-ink/70">
        Only these email addresses can create an account and use OnTime. All Admins have the same rights. Removing an email ends that person’s access straight away.
      </p>

      <form
        noValidate
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!add.isPending) void onAdd();
        }}
      >
        <label htmlFor="new-admin" className="text-sm font-medium">Give access to</label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="new-admin"
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@example.com"
            value={email}
            aria-invalid={problem ? true : undefined}
            aria-describedby={problem ? "new-admin-err" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setProblem(null);
            }}
            className="h-14 min-w-0 flex-1 rounded-[10px] border border-deep-olive bg-linen px-4 text-[17px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
          />
          <button type="submit" disabled={add.isPending || email.trim() === ""} className="h-14 shrink-0 rounded-[10px] bg-terracotta px-5 text-base font-medium text-ink active:scale-[0.97] disabled:opacity-40">
            {add.isPending ? "Adding…" : "Add"}
          </button>
        </div>
        {problem && <p id="new-admin-err" role="alert" className="mt-2 text-[14px] text-brick">{problem}</p>}
        <p className="mt-2 text-[13px] text-ink/60">After you add it, the person opens OnTime and chooses “Create account” with that email.</p>
      </form>

      <h2 className="mt-8 text-sm font-medium text-ink/60">Approved emails</h2>
      {q.isPending && <div className="mt-2 h-32 animate-pulse rounded-[18px] bg-sand/60" aria-busy="true" />}
      {q.error && (
        <p role="alert" className="mt-2 rounded-[12px] bg-clay px-4 py-3 text-[15px]">
          Couldn’t load the list. {q.error.message}
        </p>
      )}
      {q.data && (
        <ul className="mt-2 space-y-2.5">
          {q.data.map((p) => {
            const mine = p.email === me;
            return (
              <li key={p.email} className="flex items-center justify-between gap-3 rounded-[18px] bg-linen px-4 py-3 ring-1 ring-ink/10">
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-medium">
                    {p.email}
                    {mine && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 align-middle text-[12px] font-medium">You</span>}
                  </span>
                  <span className="block text-[13px] text-ink/60">
                    {p.signedUp ? "Has an account" : "Hasn’t created an account yet"} · added {formatDate(p.addedAt.slice(0, 10))}
                  </span>
                </span>
                {!mine && (
                  <button type="button" onClick={() => setRemoving(p)} aria-label={`Remove ${p.email}`} className="h-11 shrink-0 rounded-[10px] border border-ink/40 px-4 text-[15px] font-medium active:bg-sand">
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>
        {removing && (
          <Sheet label="Remove access" onClose={() => setRemoving(null)}>
            <h2 className="font-display text-[28px] leading-none font-light tracking-[-0.03em]">Remove access?</h2>
            <p className="mt-3 break-words text-[15px] text-ink/80">
              <b className="font-medium">{removing.email}</b> will be signed out of OnTime and will not be able to use it again until you add the email back. Records they entered stay.
            </p>
            <button type="button" disabled={remove.isPending} onClick={() => void onRemove(removing)} className="mt-5 h-14 w-full rounded-[10px] bg-brick text-base font-medium text-cream active:scale-[0.98] disabled:opacity-40">
              {remove.isPending ? "Removing…" : "Remove access"}
            </button>
            <button type="button" onClick={() => setRemoving(null)} className="mt-2 h-14 w-full rounded-[10px] border border-ink text-base font-medium active:bg-sand">
              Keep access
            </button>
          </Sheet>
        )}
      </AnimatePresence>
      <FlashToast message={flash.message} onClose={flash.clear} />
    </div>
  );
}
