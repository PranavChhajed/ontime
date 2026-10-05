"use client";

import { weekday, type DateKey } from "@/lib/dates";

export interface CellInfo {
  className: string;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
  aria: string;
}

const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function daysIn(month: DateKey): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** A Monday-first month calendar. The caller decides how each date looks and what a tap does. */
export function MonthGrid({ month, today, cell }: { month: DateKey; today: DateKey; cell: (date: DateKey) => CellInfo }) {
  const lead = (weekday(month) + 6) % 7;
  const total = daysIn(month);
  const dates = Array.from({ length: total }, (_, i) => `${month.slice(0, 8)}${String(i + 1).padStart(2, "0")}`);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[12px] text-ink/60" aria-hidden>
        {HEAD.map((h) => (
          <div key={h}>{h}</div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }, (_, i) => (
          <div key={`b${i}`} />
        ))}
        {dates.map((d) => {
          const c = cell(d);
          return (
            <button
              key={d}
              type="button"
              disabled={c.disabled}
              onClick={c.onClick}
              aria-label={c.aria}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-[12px] text-[16px] tabular-nums transition-transform active:scale-95 disabled:active:scale-100 ${c.className} ${d === today ? "outline-2 outline-offset-1 outline-ink" : ""}`}
            >
              <span>{Number(d.slice(8))}</span>
              {c.label && <span className="absolute bottom-1 text-[9px] leading-none font-medium tracking-wide uppercase opacity-75">{c.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
