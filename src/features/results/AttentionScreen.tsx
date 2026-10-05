"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { FlashToast, useFlash } from "@/components/Flash";
import { useSaveRecordOn } from "@/data/queries";
import { formatDayHeading, formatMonth, monthToParam, type DateKey } from "@/lib/dates";
import { EntrySheet } from "@/features/today/EntrySheet";
import type { DayRecord } from "@/features/today/types";
import type { Problem } from "./compute";
import { useResults } from "./useResults";

interface Undo {
  message: string;
  employeeId: string;
  day: DateKey;
  prev: DayRecord | null;
}

/** Every day that must be fixed before the month can close, each fixable in one or two taps. */
export function AttentionScreen({ monthFirst }: { monthFirst: DateKey }) {
  const results = useResults(monthFirst);
  const save = useSaveRecordOn();
  const flash = useFlash();
  const [editing, setEditing] = useState<Problem | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const month = monthToParam(monthFirst);
  const { problems, records, employees, values, getNow, loading, error, isClosed } = results;

  const byDate = problems.reduce<Record<string, Problem[]>>((acc, p) => {
    (acc[p.date] ??= []).push(p);
    return acc;
  }, {});

  async function write(p: Problem, record: DayRecord | null, message?: string) {
    const prev = records[p.employeeId]?.[p.date] ?? null;
    clearTimeout(undoTimer.current);
    setUndo(null);
    try {
      await save.mutateAsync({ employeeId: p.employeeId, day: p.date, record });
      if (message) {
        setUndo({ message, employeeId: p.employeeId, day: p.date, prev });
        undoTimer.current = setTimeout(() => setUndo(null), 6000);
      }
    } catch (e) {
      flash.flash(e instanceof Error ? e.message : "Couldn’t save. Please try again.");
    }
  }

  const editingEmployee = editing ? employees.find((e) => e.id === editing.employeeId) : null;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <Link href={`/results/${month}`} className="inline-flex h-10 items-center gap-1 text-[15px] text-ink/70">
        <span aria-hidden>←</span> {formatMonth(monthFirst)}
      </Link>
      <h1 className="mt-2 font-display text-[44px] leading-none font-light tracking-[-0.04em]">Needs fixing</h1>
      <p className="mt-2 text-[15px] text-ink/65">A month can close once every working day has a time or leave, and no record contradicts a day off.</p>

      {loading && !error && <div className="mt-6 h-40 animate-pulse rounded-[18px] bg-sand/60" aria-busy="true" />}
      {error && (
        <p role="alert" className="mt-6 rounded-[12px] bg-clay px-4 py-3 text-[15px]">
          Couldn’t load. {error.message}
        </p>
      )}

      {!loading && !error && problems.length === 0 && (
        <div className="mt-8 rounded-[24px] bg-linen p-6 ring-1 ring-ink/10">
          <p className="font-display text-[34px] leading-none font-light tracking-[-0.03em]">{isClosed ? "This month is closed" : "All clear"}</p>
          <p className="mt-3 text-[15px] text-ink/70">{isClosed ? "Nothing to fix. Reopen it from Results to correct a record." : "Every working day has a record. The month can be closed once it has ended."}</p>
          <Link href={`/results/${month}`} className="mt-5 grid h-14 place-items-center rounded-[10px] bg-terracotta text-lg font-medium text-ink">
            Back to results
          </Link>
        </div>
      )}

      {Object.entries(byDate).map(([date, items]) => (
        <section key={date} className="mt-6">
          <h2 className="text-sm font-medium text-ink/60">{formatDayHeading(date)}</h2>
          <ul className="mt-2 space-y-2">
            {items.map((p) => (
              <li key={p.employeeId + p.date} className="rounded-[18px] bg-linen p-3.5 ring-1 ring-ink/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[17px] font-medium">{p.name}</div>
                    <div className="text-[13px] leading-snug text-ink/65">
                      {p.type === "not_recorded" ? p.explanation : `${p.explanation}. Clear the record, or make it a working day on the Month screen.`}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {p.type === "not_recorded" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void write(p, { arrival: null, notice: records[p.employeeId]?.[p.date]?.notice ?? null, leave: true }, `${p.name}: marked as leave on ${formatDayHeading(p.date)}`)}
                        className="h-12 flex-1 rounded-[10px] border border-ink text-[15px] font-medium active:bg-sand"
                      >
                        On leave
                      </button>
                      <button type="button" onClick={() => setEditing(p)} className="h-12 flex-1 rounded-[10px] bg-terracotta text-[15px] font-medium text-ink active:scale-[0.98]">
                        Enter time
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void write(p, null, `${p.name}: record cleared for ${formatDayHeading(p.date)}`)}
                        className="h-12 flex-1 rounded-[10px] bg-terracotta text-[15px] font-medium text-ink active:scale-[0.98]"
                      >
                        Clear record
                      </button>
                      <button type="button" onClick={() => setEditing(p)} className="h-12 flex-1 rounded-[10px] border border-ink text-[15px] font-medium active:bg-sand">
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl">
        <AnimatePresence>
          {undo && (
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} role="status" className="pointer-events-auto flex items-center gap-3 rounded-[16px] bg-ink px-4 py-3 text-cream">
              <p className="min-w-0 flex-1 text-[14px] leading-snug">{undo.message}</p>
              <button
                type="button"
                onClick={() => {
                  const u = undo;
                  setUndo(null);
                  void save.mutateAsync({ employeeId: u.employeeId, day: u.day, record: u.prev }).catch((e) => flash.flash(e instanceof Error ? e.message : "Couldn’t undo."));
                }}
                className="shrink-0 rounded-md px-3 py-2 text-[15px] font-medium text-chartreuse underline underline-offset-4"
              >
                Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editing && editingEmployee && values && (
          <EntrySheet
            key={editing.employeeId + editing.date}
            employee={editingEmployee}
            date={editing.date}
            record={records[editing.employeeId]?.[editing.date]}
            values={values}
            getNow={getNow}
            arrivalLocked={false}
            onClose={() => setEditing(null)}
            onSave={(rec) => {
              void write(editing, rec);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
      <FlashToast message={flash.message} onClose={flash.clear} />
    </div>
  );
}
