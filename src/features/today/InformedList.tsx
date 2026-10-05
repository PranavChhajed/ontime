"use client";

import { formatClock } from "@/scoring";
import { KIND_STYLE } from "./category";
import type { Row } from "./rows";

interface Props {
  rows: Row[];
  isToday: boolean;
  isFuture: boolean;
  /** One tap: informed at the current time. */
  onInformNow: (id: string) => void;
  /** Open the time sheet (edit, or add a past time). */
  onEdit: (id: string) => void;
}

/**
 * The "Informed" section: one place to record who has told the Admin they
 * will be late. Same records as the Arrivals list, seen by notice.
 */
export function InformedList({ rows, isToday, isFuture, onInformNow, onEdit }: Props) {
  const people = rows.filter((r) => r.working);
  if (people.length === 0) return null;

  return (
    <ul className="mt-4 space-y-2.5">
      {people.map(({ emp, rec, result }) => {
        const onLeave = result.kind === "leave";
        const informed = rec?.notice != null;
        const arrived = rec?.arrival != null && !onLeave;

        if (onLeave) {
          return (
            <li key={emp.id} className="flex items-center justify-between rounded-[18px] bg-sand/45 px-4 py-3.5 text-ink/60">
              <span className="text-base">{emp.name}</span>
              <span className="text-sm">On leave</span>
            </li>
          );
        }

        let sub: string;
        if (!informed) sub = "Hasn’t informed";
        else if (!arrived) sub = "Informed · not arrived yet";
        else if (result.noticeOutcome === "by_930") sub = `Counted: informed by 9:30 · +${result.noticePoints}`;
        else if (result.noticeOutcome === "late") sub = `Counted: informed late · +${result.noticePoints}`;
        else if (result.noticeOutcome === "not_eligible") sub = "Arrived before 9:35: notice not needed";
        else sub = "Not counted: not before arrival";

        return (
          <li key={emp.id} className="flex items-stretch gap-2 rounded-[18px] bg-linen ring-1 ring-ink/10">
            <button
              type="button"
              onClick={() => onEdit(emp.id)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-4 py-3 text-left active:bg-sand/60"
            >
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-full ${informed ? "bg-olive text-cream" : "border border-ink/30"}`}
              >
                {informed && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[17px] font-medium">{emp.name}</div>
                <div className="text-[13px] leading-snug text-ink/60">{sub}</div>
              </div>
              {informed && (
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-medium tabular-nums ${KIND_STYLE.on_time.chip}`}>
                  {formatClock(rec!.notice!)}
                </span>
              )}
            </button>

            {!informed && !isFuture && (
              isToday && !arrived ? (
                <button
                  type="button"
                  onClick={() => onInformNow(emp.id)}
                  aria-label={`${emp.name} informed just now`}
                  className="my-2 mr-2 w-28 shrink-0 rounded-[12px] bg-terracotta text-[16px] font-medium text-ink active:scale-[0.96]"
                >
                  Informed
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit(emp.id)}
                  className="my-2 mr-2 w-28 shrink-0 rounded-[12px] border border-ink text-[15px] font-medium active:bg-sand"
                >
                  Add time
                </button>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}
