"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HISTORY_PAGE, useChangeLog, useEmployees } from "@/data/queries";
import { describeEntry, isEntryNoise, type EntryGroup } from "@/features/results/history";

const FILTERS: { label: string; entity?: string; group?: EntryGroup }[] = [
  { label: "Everything" },
  { label: "Records", entity: "day_records" },
  { label: "Employees", entity: "employees" },
  { label: "Points", entity: "point_values" },
  { label: "Access", entity: "approved_emails" },
  { label: "Months", entity: "months" },
];

/** Every change anyone made: what, from what, to what, when, and who. Nothing here can be edited. */
export function HistoryScreen() {
  const [limit, setLimit] = useState(HISTORY_PAGE);
  const [filter, setFilter] = useState(0);
  const entity = FILTERS[filter].entity;
  const q = useChangeLog(limit, entity);
  const employees = useEmployees();

  const names = useMemo(() => new Map((employees.data ?? []).map((e) => [e.id, e.name])), [employees.data]);
  const entries = useMemo(
    () =>
      (q.data ?? [])
        .filter((c) => !isEntryNoise(c))
        // Deleting an employee also deletes their weekly offs; the "removed" line says it all.
        .filter((c) => !(employees.data && c.entity === "employee_weekly_offs" && c.employee_id && !names.has(c.employee_id)))
        .map((c) => describeEntry(c, (id) => (id ? (names.get(id) ?? "A removed employee") : "Someone"))),
    [q.data, names, employees.data],
  );
  const mayHaveMore = (q.data?.length ?? 0) >= limit;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <Link href="/more" className="inline-flex h-10 items-center gap-1 text-[15px] text-ink/70">
        <span aria-hidden>←</span> More
      </Link>
      <h1 className="mt-2 font-display text-[44px] leading-none font-light tracking-[-0.04em]">History</h1>
      <p className="mt-3 text-[15px] text-ink/70">Every change is kept with the old value, the new value, when it happened and who made it. It cannot be edited or deleted.</p>

      <div role="group" aria-label="Show" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f, i) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={i === filter}
            onClick={() => {
              setFilter(i);
              setLimit(HISTORY_PAGE);
            }}
            className={`h-11 shrink-0 rounded-full px-4 text-[15px] font-medium ${i === filter ? "bg-ink text-cream" : "bg-sand/70 text-ink"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {q.isPending && <div className="mt-5 h-48 animate-pulse rounded-[18px] bg-sand/60" aria-busy="true" />}
      {q.error && (
        <p role="alert" className="mt-5 rounded-[12px] bg-clay px-4 py-3 text-[15px]">
          Couldn’t load the history. {q.error.message}
        </p>
      )}
      {q.data && entries.length === 0 && <p className="mt-6 text-[15px] text-ink/60">Nothing has been changed here yet.</p>}

      {entries.length > 0 && (
        <ul className="mt-5 space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded-[14px] bg-linen px-4 py-3 ring-1 ring-ink/10">
              <span className="block break-words text-[15px] font-medium">{e.subject}</span>
              <span className="block break-words text-[15px]">{e.text}</span>
              <span className="mt-0.5 block break-words text-[13px] text-ink/60">{e.when} · {e.who}</span>
            </li>
          ))}
        </ul>
      )}

      {q.data && mayHaveMore && (
        <button type="button" onClick={() => setLimit((l) => l + HISTORY_PAGE)} className="mt-5 h-12 w-full rounded-[10px] border border-ink text-base font-medium active:bg-sand">
          Show older changes
        </button>
      )}
    </div>
  );
}
