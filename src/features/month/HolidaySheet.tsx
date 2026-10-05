"use client";

import { useState } from "react";
import { useToggleHoliday } from "@/data/queries";
import { formatDayHeading, type DateKey } from "@/lib/dates";
import { Sheet } from "@/features/today/Sheet";

interface Props {
  date: DateKey;
  /** undefined = not a holiday yet. */
  existingName: string | undefined;
  onClose: () => void;
  onError: (message: string) => void;
}

export function HolidaySheet({ date, existingName, onClose, onError }: Props) {
  const mut = useToggleHoliday();
  const exists = existingName !== undefined;
  const [name, setName] = useState(existingName ?? "");

  async function run(remove: boolean) {
    try {
      await mut.mutateAsync({ day: date, name: name.trim() || null, remove });
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Couldn’t save the holiday.");
    }
  }

  return (
    <Sheet label="Holiday" onClose={onClose}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[32px] leading-none font-light tracking-[-0.03em]">{exists ? "Holiday" : "Mark as holiday"}</h2>
        <span className="text-sm text-ink/60">{formatDayHeading(date)}</span>
      </div>
      <p className="mt-2 text-[14px] text-ink/65">A holiday is off for everyone. It isn’t scored and doesn’t count against anyone.</p>

      <label htmlFor="holiday-name" className="mt-5 block text-sm font-medium">
        Name <span className="font-normal text-ink/60">(optional)</span>
      </label>
      <input
        id="holiday-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Diwali"
        autoComplete="off"
        className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[18px] outline-none placeholder:text-ink/40 focus:border-ink focus:ring-2 focus:ring-chartreuse"
      />

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onClose} className="h-14 flex-1 rounded-[10px] border border-ink text-base font-medium active:scale-[0.98]">
          Cancel
        </button>
        <button type="button" disabled={mut.isPending} onClick={() => void run(false)} className="h-14 flex-[1.6] rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.98] disabled:opacity-50">
          {exists ? "Save" : "Mark holiday"}
        </button>
      </div>
      {exists && (
        <button type="button" disabled={mut.isPending} onClick={() => void run(true)} className="mt-3 w-full py-2 text-center text-[15px] text-brick underline underline-offset-4">
          Remove this holiday
        </button>
      )}
    </Sheet>
  );
}
