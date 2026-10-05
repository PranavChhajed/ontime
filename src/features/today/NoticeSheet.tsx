"use client";

import { useMemo, useState } from "react";
import { parseClock, scoreDay, type Minute, type PointValues } from "@/scoring";
import { formatDayHeading, type DateKey } from "@/lib/dates";
import { Sheet, TimeField, toInput } from "./Sheet";
import type { DayRecord, Employee } from "./types";

interface Props {
  employee: Employee;
  date: DateKey;
  record: DayRecord | undefined;
  /** Reads the clock at the moment Now is tapped (never a stale value). */
  getNow: () => Minute;
  values: PointValues;
  /** Notice must be given on the same day, so a future date is locked (B3.6 #5). */
  locked: boolean;
  /** null = remove the notice (not informed). */
  onSave: (notice: Minute | null) => void;
  onClose: () => void;
}

/** Small sheet for one thing only: when did this person inform the Admin? */
export function NoticeSheet({ employee, date, record, values, getNow, locked, onSave, onClose }: Props) {
  const [value, setValue] = useState(toInput(record?.notice ?? null));
  const notice = value === "" ? null : parseClock(value);
  const arrival = record?.arrival ?? null;

  const line = useMemo(() => {
    if (notice === null) return "Not informed: earns no extra points.";
    if (arrival === null) {
      return "Counts once they arrive, if they arrive after 9:34 and after this time.";
    }
    return scoreDay(
      { nonWorking: null, leave: false, arrivalMinute: arrival, noticeMinute: notice },
      values,
    ).explanation;
  }, [notice, arrival, values]);

  return (
    <Sheet label={`Informed time for ${employee.name}`} onClose={onClose}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="min-w-0 font-display text-[32px] leading-none font-light tracking-[-0.03em]">{employee.name}</h2>
        <span className="text-sm text-ink/60">{formatDayHeading(date)}</span>
      </div>
      <p className="mt-1 text-sm text-ink/60">When did they tell you they would be late?</p>

      <div className="mt-5">
        <TimeField
          id="informed"
          label="Informed at"
          value={value}
          onChange={setValue}
          onNow={() => setValue(toInput(getNow()))}
          disabled={locked}
          primaryNow
        />
        {locked && <p className="mt-1.5 text-sm text-ink/60">Notice has to be given on the same day.</p>}
      </div>

      <div className="mt-5 rounded-[18px] bg-linen p-4 ring-1 ring-ink/10" aria-live="polite">
        <p className="text-[15px] leading-snug text-ink/80">{line}</p>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onClose} className="h-14 flex-1 rounded-[10px] border border-ink text-base font-medium active:scale-[0.98]">
          Cancel
        </button>
        <button
          type="button"
          disabled={locked || notice === null}
          onClick={() => notice !== null && onSave(notice)}
          className="h-14 flex-[1.6] rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.98] disabled:opacity-40"
        >
          Save
        </button>
      </div>
      {record?.notice != null && (
        <button type="button" onClick={() => onSave(null)} className="mt-3 w-full py-2 text-center text-sm text-ink/60 underline underline-offset-4">
          Mark as not informed
        </button>
      )}
    </Sheet>
  );
}
