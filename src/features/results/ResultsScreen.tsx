"use client";

import Link from "next/link";
import { formatMonth, monthStart, monthToParam, shiftMonth, type DateKey } from "@/lib/dates";
import { formatPercent } from "@/scoring";
import { MonthStatusCard } from "./MonthStatusCard";
import { useResults } from "./useResults";

/** The score bar runs to the best possible day (on time, as a % of the base); the tick marks 100% (the base). */
const bestPercent = (v: { onTime: number; base: number } | undefined) => Math.max(100, Math.round(v ? (v.onTime / v.base) * 100 : 120));

export function ResultsScreen({ monthFirst }: { monthFirst: DateKey }) {
  const results = useResults(monthFirst);
  const { loading, error, views, isClosed } = results;
  const month = monthToParam(monthFirst);
  const SCALE = bestPercent(results.values);
  const notStarted = monthFirst > monthStart(results.today);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <h1 className="font-display text-[44px] leading-none font-light tracking-[-0.04em]">Results</h1>

      <div className="mt-5 flex items-center justify-between gap-2">
        <Link href={`/results/${monthToParam(shiftMonth(monthFirst, -1))}`} aria-label="Previous month" className="grid size-12 place-items-center rounded-full border border-ink/15 active:bg-sand">
          ‹
        </Link>
        <div className="font-display text-[30px] leading-none font-light tracking-[-0.03em]">{formatMonth(monthFirst)}</div>
        <Link href={`/results/${monthToParam(shiftMonth(monthFirst, 1))}`} aria-label="Next month" className="grid size-12 place-items-center rounded-full border border-ink/15 active:bg-sand">
          ›
        </Link>
      </div>

      {loading && !error && (
        <div className="mt-6 space-y-2.5" aria-busy="true" aria-label="Loading">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-[18px] bg-sand/60" />
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 rounded-[24px] bg-linen p-6 ring-1 ring-ink/10">
          <p className="font-display text-3xl font-light">Couldn’t load</p>
          <p className="mt-2 text-[15px] text-ink/70">{error.message}</p>
          <button type="button" onClick={results.refetch} className="mt-4 h-12 rounded-[10px] bg-terracotta px-6 font-medium text-ink">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && notStarted && (
        <div className="mt-6 rounded-[24px] bg-linen p-6 ring-1 ring-ink/10">
          <p className="font-display text-[30px] leading-none font-light tracking-[-0.03em]">Not started yet</p>
          <p className="mt-3 text-[15px] text-ink/70">There are no scores for {formatMonth(monthFirst)} until its days begin.</p>
        </div>
      )}

      {!loading && !error && !notStarted && (
        <>
          <div className="mt-5">
            <MonthStatusCard monthFirst={monthFirst} results={results} />
          </div>

          {views.length === 0 ? (
            <p className="mt-8 text-center text-[15px] text-ink/60">Nobody is counted in this month.</p>
          ) : (
            <>
              <h2 className="mt-7 text-sm font-medium text-ink/60">
                {isClosed ? "Final scores" : "Scores so far"} · {views.length} {views.length === 1 ? "person" : "people"}
              </h2>
              <ul className="mt-2.5 space-y-2.5">
                {views.map((v) => {
                  const tenths = v.month.scoreTenths;
                  const pct = tenths === null ? 0 : Math.min((tenths / 10 / SCALE) * 100, 100);
                  return (
                    <li key={v.id}>
                      <Link href={`/results/${month}/${v.id}`} className="block rounded-[18px] bg-linen px-4 py-3.5 ring-1 ring-ink/10 active:bg-sand/60">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-[17px] font-medium">{v.name}</span>
                          <span className="shrink-0 font-display text-[34px] leading-none font-light tracking-[-0.03em] tabular-nums">{formatPercent(tenths)}</span>
                        </div>
                        <div className="relative mt-3 h-2 rounded-full bg-sand" aria-hidden>
                          <div className="h-full rounded-full bg-olive" style={{ width: `${pct}%` }} />
                          <div className="absolute -top-1 h-4 w-px bg-ink/60" style={{ left: `${(100 / SCALE) * 100}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[13px] text-ink/60">
                          <span>
                            {v.month.attendedDays} attended {v.month.attendedDays === 1 ? "day" : "days"}
                            {v.month.leaveDays > 0 ? ` · ${v.month.leaveDays} leave` : ""}
                          </span>
                          <span aria-hidden>›</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[12px] text-ink/60">The line marks 100%, the base. Every attended day on time reaches {SCALE}%.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
