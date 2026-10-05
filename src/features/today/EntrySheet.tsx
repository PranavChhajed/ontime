"use client";

import { useMemo, useRef, useState } from "react";
import { parseClock, scoreDay, type Minute, type PointValues } from "@/scoring";
import { formatDayHeading, type DateKey } from "@/lib/dates";
import { KIND_STYLE } from "./category";
import { Sheet, TimeField, toInput } from "./Sheet";
import type { DayRecord, Employee } from "./types";

interface Props {
  employee: Employee;
  date: DateKey;
  record: DayRecord | undefined;
  /** Current time in minutes, for the Now buttons. */
  /** Reads the clock at the moment a Now button is tapped (never a stale value). */
  getNow: () => Minute;
  values: PointValues;
  /** Arrival cannot be entered for a future date (PRD Screen 2). */
  arrivalLocked: boolean;
  onSave: (record: DayRecord | null) => void;
  onClose: () => void;
}

const fromInput = (s: string): Minute | null => (s === "" ? null : parseClock(s));

/** "9:37 pm" for an afternoon or evening minute; null for a morning one. A pm time is usually a wrong tap on an am/pm picker. */
export function pmText(m: number | null): string | null {
  if (m === null || m < 720) return null;
  const h = Math.floor(m / 60) % 12 || 12;
  return `${h}:${String(m % 60).padStart(2, "0")} pm`;
}

export function EntrySheet({ employee, date, record, values, getNow, arrivalLocked, onSave, onClose }: Props) {
  const [arrival, setArrival] = useState(toInput(record?.arrival ?? null));
  const [notice, setNotice] = useState(toInput(record?.notice ?? null));
  const [leave, setLeave] = useState(record?.leave ?? false);
  const stashedArrival = useRef(arrival);

  const draft: DayRecord = useMemo(
    () => ({ arrival: leave ? null : fromInput(arrival), notice: fromInput(notice), leave }),
    [arrival, notice, leave],
  );
  const result = useMemo(
    () =>
      scoreDay(
        { nonWorking: null, leave: draft.leave, arrivalMinute: draft.arrival, noticeMinute: draft.notice },
        values,
      ),
    [draft, values],
  );
  const style = KIND_STYLE[result.kind];
  const empty = !draft.leave && draft.arrival === null && draft.notice === null;

  const toggleLeave = () => {
    if (!leave) {
      stashedArrival.current = arrival;
      setArrival("");
      setLeave(true);
    } else {
      setArrival(stashedArrival.current);
      setLeave(false);
    }
  };

  return (
    <Sheet label={`Record for ${employee.name}`} onClose={onClose}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="min-w-0 font-display text-[32px] leading-none font-light tracking-[-0.03em]">{employee.name}</h2>
        <span className="text-sm text-ink/60">{formatDayHeading(date)}</span>
      </div>

      <div className="mt-5">
        <TimeField
          id="arrival"
          label="Arrived at"
          value={arrival}
          onChange={setArrival}
          onNow={() => setArrival(toInput(getNow()))}
          disabled={leave || arrivalLocked}
          primaryNow
        />
        {arrivalLocked && (
          <p className="mt-1.5 text-sm text-ink/60">Arrival can&rsquo;t be recorded for a future date.</p>
        )}
        {pmText(draft.arrival) && (
          <p role="status" className="mt-2 rounded-[10px] bg-clay px-3 py-2 text-[14px]">
            That is {pmText(draft.arrival)}, in the afternoon or evening. If you meant the morning, change it.
          </p>
        )}
      </div>

      <div className="mt-4">
        <TimeField
          id="notice"
          label="Informed at"
          hint="(if they called ahead)"
          value={notice}
          onChange={setNotice}
          onNow={() => setNotice(toInput(getNow()))}
          disabled={arrivalLocked}
        />
        {pmText(draft.notice) && (
          <p role="status" className="mt-2 rounded-[10px] bg-clay px-3 py-2 text-[14px]">
            That is {pmText(draft.notice)}, in the afternoon or evening. If you meant the morning, change it.
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={leave}
        onClick={toggleLeave}
        className="mt-4 flex h-14 w-full items-center justify-between rounded-[10px] border border-deep-olive bg-linen px-4 text-left"
      >
        <span className="text-base font-medium">On leave all day</span>
        <span className={`relative h-8 w-14 rounded-full transition-colors ${leave ? "bg-olive" : "bg-sand"}`} aria-hidden>
          <span className={`absolute top-1 left-1 size-6 rounded-full bg-linen transition-transform ${leave ? "translate-x-6" : ""}`} />
        </span>
      </button>

      <div className="mt-5 rounded-[18px] bg-linen p-4 ring-1 ring-ink/10" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${style.chip}`}>
            {empty ? "Nothing yet" : style.label}
          </span>
          <span className="font-display text-[34px] leading-none font-light tabular-nums">
            {result.inBase ? result.dayPoints : "–"}
            <span className="ml-1 font-sans text-sm text-ink/60">pts</span>
          </span>
        </div>
        <p className="mt-2.5 text-[15px] leading-snug text-ink/80">
          {empty ? "Enter an arrival time, or mark leave." : result.explanation}
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onClose} className="h-14 flex-1 rounded-[10px] border border-ink text-base font-medium active:scale-[0.98]">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(empty ? null : draft)} className="h-14 flex-[1.6] rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.98]">
          {empty && record ? "Clear day" : "Save"}
        </button>
      </div>
      {record && !empty && (
        <button type="button" onClick={() => onSave(null)} className="mt-3 w-full py-2 text-center text-sm text-ink/60 underline underline-offset-4">
          Clear this day
        </button>
      )}
    </Sheet>
  );
}
