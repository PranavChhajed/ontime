"use client";

import { AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { FlashToast, useFlash } from "@/components/Flash";
import { useClock, useEmployees, useMonthCalendar, useSetOverride } from "@/data/queries";
import { nonWorkingFor, usualOffOn } from "@/features/today/calendar";
import { formatDayLong, monthEnd, monthStart, type DateKey } from "@/lib/dates";
import { MonthStatusCard } from "@/features/results/MonthStatusCard";
import { useResults } from "@/features/results/useResults";
import { HolidaySheet } from "./HolidaySheet";
import { MonthGrid, type CellInfo } from "./MonthGrid";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function shiftMonth(month: DateKey, by: number): DateKey {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function MonthScreen() {
  const clock = useClock();
  const { date: today } = clock.now();
  const [picked, setPicked] = useState<DateKey | null>(null);
  const month = picked ?? monthStart(today);
  const cal = useMonthCalendar(month);
  const employeesQ = useEmployees();
  const setOverride = useSetOverride();
  const results = useResults(month);
  const flash = useFlash();

  const [mode, setMode] = useState<"holidays" | "employee">("holidays");
  const [empId, setEmpId] = useState<string | null>(null);
  const [holidayDate, setHolidayDate] = useState<DateKey | null>(null);

  const first = month;
  const last = monthEnd(month);
  const inMonth = useMemo(
    () => (employeesQ.data ?? []).filter((e) => e.countedFrom <= last && (!e.lastWorkingDate || e.lastWorkingDate >= first)),
    [employeesQ.data, first, last],
  );
  const emp = inMonth.find((e) => e.id === empId) ?? inMonth[0] ?? null;

  const holidays = cal.data?.holidays ?? {};
  const overrides = cal.data?.overrides ?? {};
  const holidayList = Object.entries(holidays).sort(([a], [b]) => a.localeCompare(b));
  const [y, m] = month.split("-").map(Number);

  function holidayCell(date: DateKey): CellInfo {
    const name = holidays[date];
    const isHoliday = name !== undefined;
    return {
      className: isHoliday ? "bg-clay text-ink" : "bg-linen ring-1 ring-ink/10",
      label: isHoliday ? "Holiday" : undefined,
      aria: isHoliday ? `${formatDayLong(date)}: holiday${name ? ` (${name})` : ""}. Tap to edit.` : `${formatDayLong(date)}. Tap to mark as holiday.`,
      onClick: () => setHolidayDate(date),
    };
  }

  function employeeCell(date: DateKey): CellInfo {
    if (!emp) return { className: "", aria: formatDayLong(date), disabled: true };
    const why = nonWorkingFor(emp, date, holidays, overrides);
    const o = overrides[emp.id]?.[date];
    const usual = usualOffOn(emp, date);

    if (why === "not_employed") return { className: "bg-transparent text-ink/25", aria: `${formatDayLong(date)}: not counted for ${emp.name}`, disabled: true };
    if (why === "holiday") return { className: "bg-clay/60 text-ink/70", label: "Holiday", aria: `${formatDayLong(date)}: company holiday`, disabled: true };

    const isOff = why === "weekly_off";
    return {
      className: isOff
        ? `bg-sand text-ink ${o === "off" ? "border-2 border-dashed border-ink/50" : ""}`
        : `bg-linen ring-1 ring-ink/10 ${o === "working" ? "outline-2 -outline-offset-2 outline-olive" : ""}`,
      label: isOff ? "Off" : o === "working" ? "Works" : undefined,
      aria: `${formatDayLong(date)}: ${isOff ? "day off" : "working day"}${o ? " (changed for this date)" : ""}. Tap to change.`,
      onClick: () => {
        // usual off day: working <-> off; usual working day: off <-> working
        const next: "off" | "working" | null = o ? null : usual ? "working" : "off";
        setOverride.mutate(
          { employeeId: emp.id, day: date, kind: next },
          { onError: (e) => flash.flash(e instanceof Error ? e.message : "Couldn’t save.") },
        );
      },
    };
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <h1 className="font-display text-[44px] leading-none font-light tracking-[-0.04em]">Month</h1>

      <div className="mt-5 flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous month" onClick={() => setPicked(shiftMonth(month, -1))} className="grid size-12 place-items-center rounded-full border border-ink/15 active:bg-sand">
          ‹
        </button>
        <button type="button" onClick={() => setPicked(null)} aria-label="Jump to this month" className="text-center">
          <div className="font-display text-[30px] leading-none font-light tracking-[-0.03em]">
            {MONTHS[m - 1]} {y}
          </div>
        </button>
        <button type="button" aria-label="Next month" onClick={() => setPicked(shiftMonth(month, 1))} className="grid size-12 place-items-center rounded-full border border-ink/15 active:bg-sand">
          ›
        </button>
      </div>

      {!results.loading && !results.error && (
        <div className="mt-5">
          <MonthStatusCard monthFirst={month} results={results} />
        </div>
      )}

      <div role="tablist" aria-label="Calendar" className="mt-4 grid grid-cols-2 gap-1 rounded-[14px] bg-sand/70 p-1">
        {(
          [
            ["holidays", "Holidays"],
            ["employee", "By employee"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)} className={`h-12 rounded-[11px] text-[16px] font-medium ${mode === id ? "bg-linen text-ink ring-1 ring-ink/10" : "text-ink/65"}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === "employee" && (
        <div className="mt-4">
          {inMonth.length === 0 ? (
            <p className="text-[15px] text-ink/65">No employees are counted in this month.</p>
          ) : (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Employee">
              {inMonth.map((e) => (
                <button key={e.id} type="button" role="tab" aria-selected={emp?.id === e.id} onClick={() => setEmpId(e.id)} className={`h-11 shrink-0 rounded-full px-4 text-[15px] font-medium ${emp?.id === e.id ? "bg-olive text-cream" : "border border-ink/25"}`}>
                  {e.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5">
        {cal.isPending ? (
          <div className="h-72 animate-pulse rounded-[18px] bg-sand/60" aria-busy="true" />
        ) : cal.error ? (
          <p role="alert" className="rounded-[12px] bg-clay px-4 py-3 text-[15px]">
            Couldn’t load the calendar. {cal.error.message}
          </p>
        ) : (
          <MonthGrid month={month} today={today} cell={mode === "holidays" ? holidayCell : employeeCell} />
        )}
      </div>

      {mode === "holidays" ? (
        <div className="mt-5">
          <p className="text-[14px] text-ink/60">Tap a date to mark it as a company holiday, or to edit one.</p>
          {holidayList.length > 0 && (
            <ul className="mt-3 space-y-2">
              {holidayList.map(([d, name]) => (
                <li key={d}>
                  <button type="button" onClick={() => setHolidayDate(d)} className="flex w-full items-center justify-between rounded-[14px] bg-linen px-4 py-3 text-left ring-1 ring-ink/10">
                    <span className="font-medium">{name || "Holiday"}</span>
                    <span className="text-[14px] text-ink/60">{Number(d.slice(8))} {MONTHS[m - 1].slice(0, 3)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        emp && (
          <p className="mt-5 text-[14px] text-ink/60">
            Showing <b className="font-medium text-ink">{emp.name}</b>. Tap a date to make it a day off, or a working day, just for this person. Tap again to undo.
          </p>
        )
      )}

      <AnimatePresence>
        {holidayDate && (
          <HolidaySheet key={holidayDate} date={holidayDate} existingName={holidays[holidayDate]} onClose={() => setHolidayDate(null)} onError={flash.flash} />
        )}
      </AnimatePresence>
      <FlashToast message={flash.message} onClose={flash.clear} />
    </div>
  );
}

