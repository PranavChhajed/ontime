"use client";

import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FlashToast, useFlash } from "@/components/Flash";
import { useEmployeeHistory, useSaveRecordOn } from "@/data/queries";
import { formatDayHeading, formatMonth, monthToParam, type DateKey } from "@/lib/dates";
import { formatPercent, formatPoints } from "@/scoring";
import { KIND_STYLE } from "@/features/today/category";
import { EntrySheet } from "@/features/today/EntrySheet";
import { MonthStatusCard } from "./MonthStatusCard";
import type { DayView } from "./compute";
import { describeChange, groupByDay, wasEdited } from "./history";
import { useResults } from "./useResults";

const UPCOMING = { label: "Not due", chip: "bg-sand/70 text-ink/60" };

export function BreakdownScreen({ monthFirst, employeeId }: { monthFirst: DateKey; employeeId: string }) {
  const results = useResults(monthFirst);
  const historyQ = useEmployeeHistory(employeeId, monthFirst);
  const save = useSaveRecordOn();
  const flash = useFlash();
  const [editing, setEditing] = useState<DayView | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const month = monthToParam(monthFirst);

  const { loading, error, views, isClosed, employees, records, values, getNow, today } = results;
  const view = views.find((v) => v.id === employeeId);
  const employee = employees.find((e) => e.id === employeeId);
  const history = useMemo(() => groupByDay(historyQ.data ?? []), [historyQ.data]);

  const back = (
    <Link href={`/results/${month}`} className="inline-flex h-10 items-center gap-1 text-[15px] text-ink/70">
      <span aria-hidden>←</span> {formatMonth(monthFirst)}
    </Link>
  );

  if (loading && !error) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
        {back}
        <div className="mt-4 h-64 animate-pulse rounded-[24px] bg-sand/60" aria-busy="true" />
      </div>
    );
  }
  if (error || !view) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
        {back}
        <p role="alert" className="mt-6 rounded-[12px] bg-clay px-4 py-3 text-[15px]">
          {error ? `Couldn’t load. ${error.message}` : "This person isn’t counted in this month."}
        </p>
      </div>
    );
  }

  const m = view.month;
  const c = m.counts;
  const summary: [string, string | number][] = [
    ["On time", c.on_time],
    ["9:31–9:34", c.band_931_934],
    ["9:35–9:40", c.band_935_940],
    ["After 9:40", c.after_940],
    ["Leave", c.leave],
    ["Notice points", formatPoints(m.noticePoints)],
  ];

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      {back}
      <h1 className="mt-2 font-display text-[40px] leading-none font-light tracking-[-0.04em]">{view.name}</h1>

      {/* The score and how it was reached */}
      <section className="mt-5 rounded-[24px] bg-linen p-5 ring-1 ring-ink/10" aria-label="Score">
        <div className="flex items-end justify-between gap-3">
          <span className={`font-display leading-none font-light tracking-[-0.04em] tabular-nums ${m.scoreTenths === null ? "text-[40px]" : "text-[56px]"}`}>{formatPercent(m.scoreTenths)}</span>
          <span className="shrink-0 rounded-full bg-sand px-3 py-1 text-[13px] font-medium whitespace-nowrap">{isClosed ? "Final" : "So far"}</span>
        </div>
        <p className="mt-3 text-[15px] leading-snug text-ink/80">
          {m.scoreTenths === null
            ? "No score: there are no attended days in this month yet."
            : `${formatPoints(m.totalPoints)} points ÷ ${formatPoints(m.baseRequirement)} base (${m.attendedDays} attended ${m.attendedDays === 1 ? "day" : "days"} × ${formatPoints(values ? values.base : 5)})`}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 min-[360px]:grid-cols-3">
          {summary.map(([label, n]) => (
            <div key={label} className="rounded-[12px] bg-cream px-3 py-2.5">
              <dt className="text-[12px] text-ink/60">{label}</dt>
              <dd className="font-display text-[26px] leading-none font-light tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[13px] text-ink/60">
          {m.workingDays} working {m.workingDays === 1 ? "day" : "days"}
          {m.leaveDays > 0 ? ` − ${m.leaveDays} leave` : ""}
          {m.needsAttentionDays > 0 ? ` − ${m.needsAttentionDays} not recorded` : ""} = {m.attendedDays} attended
        </p>
      </section>

      <div className="mt-4">
        <MonthStatusCard monthFirst={monthFirst} results={results} />
      </div>

      {/* Day by day */}
      <h2 className="mt-7 text-sm font-medium text-ink/60">Day by day</h2>
      <ul className="mt-2 space-y-2">
        {view.days.map((d) => {
          const style = d.kind === "upcoming" ? UPCOMING : KIND_STYLE[d.kind];
          const quiet = d.kind === "holiday" || d.kind === "weekly_off" || d.kind === "not_employed" || d.kind === "upcoming";
          const changes = history[d.date] ?? [];
          const edited = wasEdited(changes);
          const editable = !isClosed && d.kind !== "upcoming" && d.kind !== "not_employed" && !!employee && d.date <= today;
          const attention = (d.kind === "needs_attention" && d.date < today) || d.conflict !== null;

          return (
            <li key={d.date} className={`rounded-[16px] ${quiet ? "bg-sand/40" : "bg-linen ring-1 ring-ink/10"} ${attention ? "ring-2 ring-coral" : ""}`}>
              <div className="flex items-stretch">
                <button
                  type="button"
                  disabled={!editable}
                  onClick={() => setEditing(d)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-[16px] px-3.5 py-3 text-left enabled:active:bg-sand/60"
                >
                  <span className={`w-[72px] shrink-0 text-[14px] ${quiet ? "text-ink/60" : "font-medium"}`}>{formatDayHeading(d.date)}</span>
                  <span className={`min-w-0 flex-1 text-[13px] leading-snug ${quiet ? "text-ink/60" : "text-ink/80"}`}>{d.explanation}</span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${style.chip}`}>{style.label}</span>
                    {d.inBase && <span className="font-display text-[22px] leading-none font-light tabular-nums">{formatPoints(d.dayPoints)}</span>}
                  </span>
                </button>
              </div>
              {edited && (
                <div className="px-3.5 pb-2.5">
                  <button
                    type="button"
                    aria-expanded={open === d.date}
                    onClick={() => setOpen(open === d.date ? null : d.date)}
                    className="-ml-1 inline-flex min-h-[36px] items-center px-1 text-[12px] text-ink/60 underline underline-offset-4"
                  >
                    Edited · {changes.length} {changes.length === 1 ? "change" : "changes"}
                  </button>
                  {open === d.date && (
                    <ul className="mt-1.5 space-y-1 border-l-2 border-sand pl-3 text-[12px] leading-snug text-ink/70">
                      {changes.map((ch) => (
                        <li key={ch.id}>{describeChange(ch)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {editing && employee && values && (
          <EntrySheet
            key={editing.date}
            employee={employee}
            date={editing.date}
            record={records[employee.id]?.[editing.date]}
            values={values}
            getNow={getNow}
            arrivalLocked={editing.date > today}
            onClose={() => setEditing(null)}
            onSave={(rec) => {
              const day = editing.date;
              setEditing(null);
              save.mutate(
                { employeeId: employee.id, day, record: rec },
                { onError: (e) => flash.flash(e instanceof Error ? e.message : "Couldn’t save.") },
              );
            }}
          />
        )}
      </AnimatePresence>
      <FlashToast message={flash.message} onClose={flash.clear} />
    </div>
  );
}
