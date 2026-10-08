"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useClock, useDayRecords, useEmployees, useMonthCalendar, usePointValues, useSaveRecord } from "@/data/queries";
import { addDays, formatDayHeading, formatYear, type DateKey } from "@/lib/dates";
import { formatClock } from "@/scoring";
import { KIND_STYLE } from "./category";
import { resultFor } from "./calendar";
import { buildRows } from "./buildRows";
import { ConfirmArrival } from "./ConfirmArrival";
import { EntrySheet } from "./EntrySheet";
import { InformedList } from "./InformedList";
import { NoticeSheet } from "./NoticeSheet";
import type { Row } from "./rows";
import type { DayRecord, Employee } from "./types";

const ONBOARDED_KEY = "ontime.onboarded";

interface Undo {
  message: string;
  /** The date the change was made on; Undo only shows while that date is open. */
  date: DateKey;
  empId: string;
  prev: DayRecord | null;
}

export function TodayScreen() {
  const router = useRouter();
  const clock = useClock();
  const employeesQ = useEmployees();
  const valuesQ = usePointValues();
  const { date: today } = clock.now();
  /** The minute right now, read when a button is tapped so 9:30 vs 9:31 is never off by a stale draw. */
  const getNow = () => clock.now().minute;

  const [selected, setSelected] = useState<DateKey | null>(null);
  const date = selected ?? today;
  const recordsQ = useDayRecords(date);
  const calQ = useMonthCalendar(date);
  const save = useSaveRecord(date);

  const [view, setView] = useState<"arrivals" | "informed">("arrivals");
  const [openId, setOpenId] = useState<string | null>(null);
  const [noticeId, setNoticeId] = useState<string | null>(null);
  /** The person whose "Now" was tapped; the arrival is only saved on the second tap. */
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<{ undo?: ReturnType<typeof setTimeout>; error?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    const t = timers.current;
    return () => {
      clearTimeout(t.undo);
      clearTimeout(t.error);
    };
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) router.replace("/welcome");
    } catch {
      /* storage blocked: skip the first-run tour */
    }
  }, [router]);

  const employees = employeesQ.data;
  const values = valuesQ.data;
  const dayRecords = recordsQ.data;
  const calendar = calQ.data;
  const isToday = date === today;
  const isFuture = date > today;

  const rows: Row[] = useMemo(() => {
    if (!employees || !values || !dayRecords || !calendar) return [];
    return buildRows(employees, values, dayRecords, calendar, date);
  }, [employees, values, dayRecords, calendar, date]);

  const loading = !clock.ready || employeesQ.isPending || valuesQ.isPending || recordsQ.isPending || calQ.isPending;
  const loadError = employeesQ.error ?? valuesQ.error ?? recordsQ.error ?? calQ.error;

  const working = rows.filter((r) => r.working);
  const recorded = working.filter((r) => r.result.kind !== "needs_attention").length;
  const missing = working.length - recorded;
  const holidayName = calendar?.holidays[date];
  const informedCount = working.filter((r) => r.rec?.notice != null && !r.rec?.leave).length;

  function showError(message: string) {
    setError(message);
    clearTimeout(timers.current.error);
    timers.current.error = setTimeout(() => setError(null), 7000);
  }

  /** Save one employee's record; offer Undo when there is a message. */
  async function commit(emp: Employee, rec: DayRecord | null, message?: string) {
    const prev = dayRecords?.[emp.id] ?? null;
    clearTimeout(timers.current.undo);
    setUndo(null);
    try {
      await save.mutateAsync({ employeeId: emp.id, record: rec });
      if (message) {
        setUndo({ message, date, empId: emp.id, prev });
        timers.current.undo = setTimeout(() => setUndo(null), 6000);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Couldn’t save. Please try again.");
    }
  }

  function arriveNow(row: Row) {
    if (!values || !calendar) return;
    setConfirmId(null);
    const rec: DayRecord = { arrival: getNow(), notice: row.rec?.notice ?? null, leave: false };
    const r = resultFor(row.emp, date, calendar.holidays, calendar.overrides, rec, values);
    void commit(row.emp, rec, `${row.emp.name}: ${r.explanation}`);
  }

  function saveNotice(emp: Employee, notice: number | null, quick = false) {
    const prev = dayRecords?.[emp.id];
    const next: DayRecord = { arrival: prev?.arrival ?? null, notice, leave: prev?.leave ?? false };
    const empty = next.arrival === null && next.notice === null && !next.leave;
    const message = quick
      ? `${emp.name} informed at ${formatClock(notice!)}`
      : notice === null
        ? `${emp.name}: marked as not informed`
        : undefined;
    void commit(emp, empty ? null : next, message);
  }

  function doUndo() {
    if (!undo || undo.date !== date || !employees) return;
    const emp = employees.find((e) => e.id === undo.empId);
    setUndo(null);
    if (emp) void commit(emp, undo.prev);
  }

  const open = openId ? employees?.find((e) => e.id === openId) : null;
  const confirmRow = confirmId ? rows.find((r) => r.emp.id === confirmId) : null;
  const noticeEmp = noticeId ? employees?.find((e) => e.id === noticeId) : null;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-40">
      {/* Date bar */}
      <header className="flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous day" onClick={() => setSelected(addDays(date, -1))} className="grid size-12 place-items-center rounded-full border border-ink/15 active:bg-sand">
          <Chevron dir="left" />
        </button>
        <button type="button" onClick={() => setSelected(null)} aria-label="Jump to today" className="min-w-0 flex-1 text-center">
          <div className="font-display text-[34px] leading-none font-light tracking-[-0.035em]">{formatDayHeading(date)}</div>
          <div className="mt-1 text-sm text-ink/60">
            {isToday ? "Today" : date < today ? "Past day · tap for today" : "Upcoming · tap for today"} · {formatYear(date)}
          </div>
        </button>
        <button type="button" aria-label="Next day" onClick={() => setSelected(addDays(date, 1))} className="grid size-12 place-items-center rounded-full border border-ink/15 active:bg-sand">
          <Chevron dir="right" />
        </button>
      </header>

      {clock.ready && !clock.usingServerTime && (
        <p role="status" className="mt-4 rounded-[12px] bg-clay px-4 py-2.5 text-[13px] leading-snug">
          Can’t reach the server clock, so <b className="font-medium">Now</b> is using this phone’s clock. Check that its time is right.
        </p>
      )}

      {loading && !loadError && <Skeleton />}

      {loadError && (
        <div role="alert" className="mt-8 rounded-[24px] bg-linen p-6 ring-1 ring-ink/10">
          <p className="font-display text-3xl font-light">Couldn’t load</p>
          <p className="mt-2 text-[15px] text-ink/70">{loadError.message || "Check your connection and try again."}</p>
          <button
            type="button"
            onClick={() => {
              void employeesQ.refetch();
              void valuesQ.refetch();
              void recordsQ.refetch();
              void calQ.refetch();
            }}
            className="mt-4 h-12 rounded-[10px] bg-terracotta px-6 font-medium text-ink"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !loadError && employees && employees.length === 0 && (
        <div className="mt-10 rounded-[24px] bg-linen p-6 ring-1 ring-ink/10">
          <p className="font-display text-[34px] leading-none font-light tracking-[-0.03em]">No employees yet</p>
          <p className="mt-3 text-[15px] text-ink/70">Add the people you want to score. You can add more, or change anyone, at any time.</p>
          <Link href="/more/employees" className="mt-5 grid h-14 place-items-center rounded-[10px] bg-terracotta text-lg font-medium text-ink">
            Add your first employee
          </Link>
        </div>
      )}

      {!loading && !loadError && employees && employees.length > 0 && (
        <>
          {/* Progress */}
          <div className="mt-5">
            {working.length === 0 ? (
              <p className="text-sm font-medium">
                {holidayName !== undefined ? `Holiday${holidayName ? `: ${holidayName}` : ""}` : "Nobody to record on this day"}
                <span className="font-normal text-ink/60"> · nothing is scored</span>
              </p>
            ) : (
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">
                  {recorded} of {working.length} recorded
                </span>
                {missing > 0 && !isFuture && <span className="text-brick">{missing} to go</span>}
                {missing === 0 && <span className="text-olive">All done</span>}
              </div>
            )}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
              <motion.div
                className="h-full rounded-full bg-olive"
                initial={false}
                animate={{ width: working.length ? `${(recorded / working.length) * 100}%` : "0%" }}
                transition={{ type: "spring", damping: 30, stiffness: 260 }}
              />
            </div>
          </div>

          {/* Two sections: arrivals, and who has informed */}
          <div role="tablist" aria-label="Section" className="mt-4 grid grid-cols-2 gap-1 rounded-[14px] bg-sand/70 p-1">
            {(
              [
                ["arrivals", "Arrivals", null],
                ["informed", "Informed", informedCount],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={`flex h-12 items-center justify-center gap-2 rounded-[11px] text-[16px] font-medium transition-colors ${
                  view === id ? "bg-linen text-ink ring-1 ring-ink/10" : "text-ink/65"
                }`}
              >
                {label}
                {count !== null && count > 0 && (
                  <span className="grid min-w-6 place-items-center rounded-full bg-olive px-1.5 text-[13px] leading-6 text-cream">{count}</span>
                )}
              </button>
            ))}
          </div>

          {rows.length === 0 && <p className="mt-6 text-center text-[15px] text-ink/60">Nobody is counted on this date.</p>}

          {view === "informed" && (
            <InformedList
              rows={rows}
              isToday={isToday}
              isFuture={isFuture}
              onInformNow={(id) => {
                const emp = employees.find((e) => e.id === id);
                if (emp) saveNotice(emp, getNow(), true);
              }}
              onEdit={setNoticeId}
            />
          )}

          {view === "arrivals" && (
            <ul className="mt-4 space-y-2.5">
              {rows.map((row) => {
                const { emp, rec, result } = row;
                const style = KIND_STYLE[result.kind];

                if (!row.working) {
                  return (
                    <li key={emp.id} className="flex items-center justify-between rounded-[18px] bg-sand/45 px-4 py-3.5 text-ink/60">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={emp.name} src={emp.photoUrl} className="size-9 text-[13px] opacity-60" />
                        <span className="truncate text-base">{emp.name}</span>
                      </span>
                      <span className="text-sm">{style.label}</span>
                    </li>
                  );
                }

                const unrecorded = result.kind === "needs_attention";
                const informedOnly = unrecorded && rec?.notice != null;

                return (
                  <li key={emp.id} className="flex items-stretch gap-2 rounded-[18px] bg-linen ring-1 ring-ink/10">
                    <button type="button" onClick={() => setOpenId(emp.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3 py-3 text-left active:bg-sand/60">
                      <Avatar name={emp.name} src={emp.photoUrl} className="size-12 text-[17px]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[17px] font-medium">{emp.name}</div>
                        <div className="text-[13px] leading-snug text-ink/60">
                          {unrecorded
                            ? informedOnly
                              ? `Informed ${formatClock(rec!.notice!)} · not arrived yet`
                              : isFuture
                                ? "Upcoming"
                                : "Not recorded"
                            : result.kind === "leave"
                              ? "Approved leave · not in base"
                              : `Arrived ${formatClock(rec!.arrival!)}${rec?.notice != null ? ` · informed ${formatClock(rec.notice)}` : ""}`}
                        </div>
                      </div>
                      {!unrecorded && (
                        <>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-medium ${style.chip}`}>{style.label}</span>
                          {result.inBase && (
                            <span className="w-10 shrink-0 text-right font-display text-[28px] leading-none font-light tabular-nums">{result.dayPoints}</span>
                          )}
                        </>
                      )}
                    </button>

                    {unrecorded && isToday && (
                      <button
                        type="button"
                        onClick={() => setConfirmId(emp.id)}
                        aria-label={`Mark ${emp.name} arrived now`}
                        className="my-2 mr-2 w-24 shrink-0 rounded-[12px] bg-terracotta text-[17px] font-medium text-ink active:scale-[0.96]"
                      >
                        Now
                      </button>
                    )}
                    {unrecorded && !isToday && !isFuture && (
                      <button type="button" onClick={() => setOpenId(emp.id)} className="my-2 mr-2 w-24 shrink-0 rounded-[12px] border border-ink text-[15px] font-medium active:bg-sand">
                        Enter time
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl flex-col gap-2">
        <AnimatePresence>
          {error && (
            <motion.div key="err" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} role="alert" className="pointer-events-auto flex items-start gap-3 rounded-[16px] bg-brick px-4 py-3 text-cream">
              <p className="min-w-0 flex-1 text-[14px] leading-snug">{error}</p>
              <button type="button" onClick={() => setError(null)} className="shrink-0 px-2 text-[15px] font-medium underline underline-offset-4">
                OK
              </button>
            </motion.div>
          )}
          {undo && undo.date === date && (
            <motion.div key="toast" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} role="status" className="pointer-events-auto flex items-center gap-3 rounded-[16px] bg-ink px-4 py-3 text-cream">
              <p className="min-w-0 flex-1 text-[14px] leading-snug">{undo.message}</p>
              <button type="button" onClick={doUndo} className="shrink-0 rounded-md px-3 py-2 text-[15px] font-medium text-chartreuse underline underline-offset-4">
                Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmRow && values && calendar && (
          <ConfirmArrival
            key={"c" + confirmRow.emp.id + date}
            employee={confirmRow.emp}
            getNow={getNow}
            preview={(minute) =>
              resultFor(confirmRow.emp, date, calendar.holidays, calendar.overrides, { arrival: minute, notice: confirmRow.rec?.notice ?? null, leave: false }, values)
            }
            onConfirm={() => arriveNow(confirmRow)}
            onCancel={() => setConfirmId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {noticeEmp && values && (
          <NoticeSheet
            key={"n" + noticeEmp.id + date}
            employee={noticeEmp}
            date={date}
            record={dayRecords?.[noticeEmp.id]}
            values={values}
            getNow={getNow}
            locked={isFuture}
            onClose={() => setNoticeId(null)}
            onSave={(notice) => {
              saveNotice(noticeEmp, notice);
              setNoticeId(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && values && (
          <EntrySheet
            key={open.id + date}
            employee={open}
            date={date}
            record={dayRecords?.[open.id]}
            values={values}
            getNow={getNow}
            arrivalLocked={isFuture}
            onClose={() => setOpenId(null)}
            onSave={(rec) => {
              void commit(open, rec);
              setOpenId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-6 space-y-2.5" aria-busy="true" aria-label="Loading">
      <div className="h-2 rounded-full bg-sand" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-[18px] bg-sand/60" />
      ))}
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}
