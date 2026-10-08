"use client";

import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useClock, useDayRecords, useEmployees, useMonthCalendar, usePointValues, useSaveRecord } from "@/data/queries";
import { formatDayHeading } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { formatClock } from "@/scoring";
import { buildRows } from "@/features/today/buildRows";
import { resultFor } from "@/features/today/calendar";
import { ConfirmArrival } from "@/features/today/ConfirmArrival";
import { Sheet } from "@/features/today/Sheet";
import type { Row } from "@/features/today/rows";
import type { DayRecord } from "@/features/today/types";
import { checkPin, endGate, isValidPin, startGate, useGateLocked } from "./lock";

export function GateScreen() {
  const locked = useGateLocked();
  return locked ? <GateGrid /> : <GateSetup />;
}

/* ───────────── before the lock: choose a PIN ───────────── */

function GateSetup() {
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = isValidPin(pin) && pin === again;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <Link href="/more" className="inline-flex h-10 items-center gap-1 text-[15px] text-ink/70">
        <span aria-hidden>←</span> More
      </Link>
      <h1 className="mt-2 font-display text-[44px] leading-none font-light tracking-[-0.04em]">Gate mode</h1>
      <p className="mt-3 text-[15px] text-ink/70">
        For a phone or tablet kept at the gate. Everyone sees only their photo: they tap it, check the time, and tap <b className="font-medium">Log arrival</b>. Nothing else in the app is reachable until you enter the PIN.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!ok || busy) return;
          setBusy(true);
          await startGate(pin);
        }}
      >
        <div>
          <label htmlFor="gate-pin" className="text-sm font-medium">Choose a 4-digit PIN</label>
          <input id="gate-pin" type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[26px] tracking-[0.5em] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse" />
        </div>
        <div>
          <label htmlFor="gate-pin2" className="text-sm font-medium">Type it again</label>
          <input id="gate-pin2" type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={again} onChange={(e) => setAgain(e.target.value.replace(/\D/g, ""))} className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[26px] tracking-[0.5em] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse" />
          {again.length === 4 && pin !== again && <p role="alert" className="mt-1.5 text-[13px] text-brick">The two PINs don’t match.</p>}
        </div>
        <p className="text-[13px] text-ink/60">Write the PIN down. If it is lost, tap “Forgot the PIN” on the gate screen: you will be signed out and sign in again with your own password.</p>
        <button type="submit" disabled={!ok || busy} className="h-14 w-full rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.98] disabled:opacity-40">
          Start gate mode
        </button>
      </form>
    </div>
  );
}

/* ───────────── the locked gate screen ───────────── */

interface Done {
  empId: string;
  name: string;
  minute: number;
  prev: DayRecord | null;
}

function GateGrid() {
  const router = useRouter();
  const clock = useClock();
  const employeesQ = useEmployees();
  const valuesQ = usePointValues();
  const { date: today } = clock.now();
  const getNow = () => clock.now().minute;
  const recordsQ = useDayRecords(today);
  const calQ = useMonthCalendar(today);
  const save = useSaveRecord(today);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loggedId, setLoggedId] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const employees = employeesQ.data;
  const values = valuesQ.data;
  const dayRecords = recordsQ.data;
  const calendar = calQ.data;
  const loading = !clock.ready || employeesQ.isPending || valuesQ.isPending || recordsQ.isPending || calQ.isPending;
  const loadError = employeesQ.error ?? valuesQ.error ?? recordsQ.error ?? calQ.error;

  const rows: Row[] = useMemo(() => {
    if (!employees || !values || !dayRecords || !calendar) return [];
    const all = buildRows(employees, values, dayRecords, calendar, today);
    const rank = (r: Row) => (!r.working ? 2 : r.result.kind === "needs_attention" ? 0 : 1);
    return all.sort((a, b) => rank(a) - rank(b) || a.emp.name.localeCompare(b.emp.name));
  }, [employees, values, dayRecords, calendar, today]);

  const working = rows.filter((r) => r.working);
  const logged = working.filter((r) => r.result.kind !== "needs_attention").length;

  function flash(message: string) {
    setError(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setError(null), 6000);
  }

  async function logArrival(row: Row) {
    if (saving) return;
    setSaving(true);
    try {
      // Someone may have been logged from another device since this screen last refreshed:
      // Gate mode never overwrites an existing arrival.
      const fresh = await recordsQ.refetch();
      const current = fresh?.data?.[row.emp.id] ?? dayRecords?.[row.emp.id];
      if (current?.arrival != null) {
        setConfirmId(null);
        flash(`${row.emp.name} is already logged at ${formatClock(current.arrival)}.`);
        return;
      }
      const minute = getNow(); // read now, at the second tap
      await save.mutateAsync({ employeeId: row.emp.id, record: { arrival: minute, notice: current?.notice ?? null, leave: false } });
      setConfirmId(null);
      setDone({ empId: row.emp.id, name: row.emp.name, minute, prev: current ?? null });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(null), 4500);
    } catch (e) {
      setConfirmId(null);
      flash(e instanceof Error ? e.message : "Couldn’t save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function undo() {
    if (!done) return;
    const d = done;
    setDone(null);
    clearTimeout(timer.current);
    try {
      await save.mutateAsync({ employeeId: d.empId, record: d.prev });
    } catch (e) {
      flash(e instanceof Error ? e.message : "Couldn’t undo. Please tell an Admin.");
    }
  }

  const confirmRow = confirmId ? rows.find((r) => r.emp.id === confirmId) : null;
  const loggedRow = loggedId ? rows.find((r) => r.emp.id === loggedId) : null;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[40px] leading-none font-light tracking-[-0.04em]">Tap your photo</h1>
          <p className="mt-2 text-[15px] text-ink/70">
            {formatDayHeading(today)}
            {working.length > 0 && <> · {logged} of {working.length} logged</>}
          </p>
        </div>
        <button type="button" onClick={() => setExiting(true)} className="h-11 shrink-0 rounded-[10px] border border-ink/30 px-4 text-[14px] text-ink/70 active:bg-sand">
          Admin
        </button>
      </header>

      {error && (
        <p role="alert" className="mt-4 rounded-[12px] bg-brick px-4 py-3 text-[15px] text-cream">{error}</p>
      )}
      {loading && !loadError && <div className="mt-6 h-64 animate-pulse rounded-[24px] bg-sand/60" aria-busy="true" />}
      {loadError && (
        <div role="alert" className="mt-6 rounded-[24px] bg-linen p-6 ring-1 ring-ink/10">
          <p className="font-display text-3xl font-light">Couldn’t load</p>
          <p className="mt-2 text-[15px] text-ink/70">{loadError.message || "Check the connection."}</p>
        </div>
      )}
      {!loading && !loadError && rows.length === 0 && <p className="mt-10 text-center text-[17px] text-ink/60">Nobody to log today.</p>}

      {rows.length > 0 && (
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {rows.map((row) => {
            const { emp, result } = row;
            const done_ = row.working && result.kind !== "needs_attention";
            const off = !row.working || result.kind === "leave";
            return (
              <li key={emp.id}>
                <button
                  type="button"
                  disabled={off}
                  onClick={() => (done_ ? setLoggedId(emp.id) : setConfirmId(emp.id))}
                  aria-label={off ? `${emp.name}: not working today` : done_ ? `${emp.name}: logged at ${formatClock(row.rec?.arrival ?? 0)}` : `${emp.name}: log arrival`}
                  className={`flex w-full flex-col items-center gap-2 rounded-[20px] p-2.5 text-center transition-colors ${
                    off ? "bg-sand/45 opacity-60" : done_ ? "bg-sand/60" : "bg-linen ring-1 ring-ink/10 active:bg-chartreuse/40"
                  }`}
                >
                  <span className={`relative ${done_ || off ? "opacity-55" : ""}`}>
                    <Avatar name={emp.name} src={emp.photoUrl} className="size-[88px] text-[30px]" />
                  </span>
                  <span className="line-clamp-2 min-h-[2.4em] text-[15px] leading-tight font-medium">{emp.name}</span>
                  {done_ && result.kind !== "leave" && row.rec?.arrival != null && (
                    <span className="rounded-full bg-olive px-2.5 py-0.5 text-[13px] font-medium text-cream tabular-nums">✓ {formatClock(row.rec.arrival)}</span>
                  )}
                  {off && <span className="text-[13px] text-ink/70">{result.kind === "leave" ? "On leave" : "Off today"}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <AnimatePresence>
        {confirmRow && values && calendar && (
          <ConfirmArrival
            key={"c" + confirmRow.emp.id}
            employee={confirmRow.emp}
            getNow={getNow}
            busy={saving}
            preview={(minute) => resultFor(confirmRow.emp, today, calendar.holidays, calendar.overrides, { arrival: minute, notice: confirmRow.rec?.notice ?? null, leave: false }, values)}
            onConfirm={() => void logArrival(confirmRow)}
            onCancel={() => setConfirmId(null)}
          />
        )}
        {loggedRow && (
          <Sheet key="logged" label={`${loggedRow.emp.name} is logged`} onClose={() => setLoggedId(null)}>
            <div className="flex flex-col items-center text-center">
              <Avatar name={loggedRow.emp.name} src={loggedRow.emp.photoUrl} className="size-32 text-[44px]" />
              <h2 className="mt-4 font-display text-[32px] leading-none font-light tracking-[-0.03em]">{loggedRow.emp.name}</h2>
              <p className="mt-4 text-[22px]">Logged at <b className="font-medium tabular-nums">{formatClock(loggedRow.rec?.arrival ?? 0)}</b></p>
              <p className="mt-1 text-[14px] text-ink/60">Only an Admin can change it.</p>
            </div>
            <button type="button" onClick={() => setLoggedId(null)} className="mt-6 h-14 w-full rounded-[10px] border border-ink text-base font-medium active:bg-sand">OK</button>
          </Sheet>
        )}
      </AnimatePresence>

      {done && (
        <div role="status" className="fixed inset-0 z-[70] grid place-items-center bg-olive px-6 text-center text-cream">
          <div>
            <div className="mx-auto grid size-28 place-items-center rounded-full bg-chartreuse text-ink">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
            <p className="mt-6 font-display text-[40px] leading-none font-light tracking-[-0.03em]">{done.name}</p>
            <p className="mt-3 text-[28px] tabular-nums">Logged at {formatClock(done.minute)}</p>
            <button type="button" onClick={() => void undo()} className="mt-8 h-14 rounded-[10px] border border-cream/60 px-8 text-[17px] font-medium active:bg-cream/10">
              Not me, undo
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>{exiting && <ExitSheet onClose={() => setExiting(false)} onExit={() => router.push("/more")} onSignedOut={() => { router.replace("/login"); router.refresh(); }} />}</AnimatePresence>
    </div>
  );
}

function ExitSheet({ onClose, onExit, onSignedOut }: { onClose: () => void; onExit: () => void; onSignedOut: () => void }) {
  const [pin, setPin] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!isValidPin(pin) || busy) return;
    setBusy(true);
    if (await checkPin(pin)) {
      endGate();
      onExit();
    } else {
      setBad(true);
      setPin("");
      setBusy(false);
    }
  }

  async function forgot() {
    // Recovery needs the Admin's own password: sign out, clear the lock, sign in again.
    await createClient().auth.signOut();
    endGate();
    onSignedOut();
  }

  return (
    <Sheet label="Admin PIN" onClose={onClose}>
      <h2 className="font-display text-[30px] leading-none font-light tracking-[-0.03em]">Admin PIN</h2>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor="exit-pin" className="text-sm font-medium">Enter the 4-digit PIN to leave gate mode</label>
        <input id="exit-pin" type="password" inputMode="numeric" autoComplete="off" maxLength={4} autoFocus value={pin} onChange={(e) => { setBad(false); setPin(e.target.value.replace(/\D/g, "")); }} className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[26px] tracking-[0.5em] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse" />
        {bad && <p role="alert" className="mt-1.5 text-[13px] text-brick">That PIN is not right.</p>}
        <button type="submit" disabled={!isValidPin(pin) || busy} className="mt-4 h-14 w-full rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.98] disabled:opacity-40">Leave gate mode</button>
      </form>
      <button type="button" onClick={onClose} className="mt-2 h-12 w-full rounded-[10px] border border-ink text-base font-medium active:bg-sand">Back to the gate</button>
      <button type="button" onClick={() => void forgot()} className="mt-3 w-full py-2 text-[14px] text-ink/70 underline underline-offset-4">Forgot the PIN? Sign out and sign in again</button>
    </Sheet>
  );
}
