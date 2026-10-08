"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { formatClock, type DayResult, type Minute } from "@/scoring";
import { KIND_STYLE } from "./category";
import { Sheet } from "./Sheet";
import type { Employee } from "./types";

interface Props {
  employee: Employee;
  /** The minute right now. Called again at the moment of the tap, never trusted from a draw. */
  getNow: () => Minute;
  /** What an arrival at this minute would score, for the preview line. */
  preview: (minute: Minute) => DayResult;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

/**
 * Second tap of "Now": a big photo, the time, and one big button. The preview is
 * for reassurance only; the saved time is read when "Log arrival" is tapped.
 */
export function ConfirmArrival({ employee, getNow, preview, onConfirm, onCancel, busy }: Props) {
  const [minute, setMinute] = useState(getNow);
  useEffect(() => {
    const id = setInterval(() => setMinute(getNow()), 1000);
    return () => clearInterval(id);
  }, [getNow]);

  const result = preview(minute);
  const style = KIND_STYLE[result.kind];

  return (
    <Sheet label={`Log arrival for ${employee.name}`} onClose={onCancel}>
      <div className="flex flex-col items-center text-center">
        <Avatar name={employee.name} src={employee.photoUrl} className="size-40 text-[56px]" />
        <h2 className="mt-4 min-w-0 font-display text-[36px] leading-none font-light tracking-[-0.03em]">{employee.name}</h2>
        <p className="mt-5 font-display text-[72px] leading-none font-light tracking-[-0.04em] tabular-nums" aria-live="off">
          {formatClock(minute)}
        </p>
        <span className={`mt-3 rounded-full px-3 py-1 text-[14px] font-medium ${style.chip}`}>{style.label}</span>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={onConfirm}
        className="mt-6 h-[72px] w-full rounded-[14px] bg-terracotta text-[22px] font-medium text-ink active:scale-[0.98] disabled:opacity-50"
      >
        Log arrival
      </button>
      <button type="button" onClick={onCancel} className="mt-2 h-14 w-full rounded-[10px] border border-ink text-base font-medium active:bg-sand">
        Not me
      </button>
    </Sheet>
  );
}
