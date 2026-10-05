"use client";

import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { FlashToast, useFlash } from "@/components/Flash";
import { useCloseMonth, useReopenMonth } from "@/data/queries";
import { formatDate, formatMonth, monthToParam, type DateKey } from "@/lib/dates";
import { Sheet } from "@/features/today/Sheet";
import type { useResults } from "./useResults";

type Results = ReturnType<typeof useResults>;

/** Open or closed, what still needs fixing, and the buttons to close or reopen. */
export function MonthStatusCard({ monthFirst, results }: { monthFirst: DateKey; results: Results }) {
  const close = useCloseMonth();
  const reopen = useReopenMonth();
  const flash = useFlash();
  const [confirm, setConfirm] = useState<"close" | "reopen" | null>(null);
  const { isClosed, state, problems, closeCheck, live } = results;
  const label = formatMonth(monthFirst);

  async function run(kind: "close" | "reopen") {
    try {
      if (kind === "close") await close.mutateAsync({ monthFirst, employees: live });
      else await reopen.mutateAsync(monthFirst);
      setConfirm(null);
    } catch (e) {
      setConfirm(null);
      flash.flash(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <section aria-label={`${label} status`} className={`rounded-[24px] p-5 ${isClosed ? "bg-olive text-cream" : "bg-linen ring-1 ring-ink/10"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${isClosed ? "bg-chartreuse text-ink" : "bg-sand text-ink"}`}>
          {isClosed ? "Closed" : "Open"}
        </span>
        <span className={`text-[13px] ${isClosed ? "text-cream/75" : "text-ink/60"}`}>
          {isClosed && state?.closedAt ? `Closed ${formatDate(state.closedAt.slice(0, 10))}${state.closedByEmail ? ` by ${state.closedByEmail}` : ""}` : "Scores are provisional"}
        </span>
      </div>

      {isClosed ? (
        <>
          <p className="mt-3 text-[15px] leading-snug text-cream/90">
            These results are saved and the month is locked. Reopen it to correct a record; closing again saves new results.
          </p>
          <button type="button" onClick={() => setConfirm("reopen")} className="mt-4 h-12 w-full rounded-[10px] border border-cream/50 text-base font-medium text-cream active:bg-cream/10">
            Reopen month
          </button>
        </>
      ) : (
        <>
          {problems.length > 0 ? (
            <Link href={`/results/${monthToParam(monthFirst)}/attention`} className="mt-3 flex items-center justify-between gap-3 rounded-[14px] bg-clay px-4 py-3 active:opacity-80">
              <span className="text-[15px] leading-snug">
                <b className="font-medium">
                  {problems.length} {problems.length === 1 ? "day needs" : "days need"} fixing
                </b>
                <span className="block text-[13px] text-ink/70">Not recorded, or records that conflict</span>
              </span>
              <span aria-hidden>›</span>
            </Link>
          ) : (
            <p className="mt-3 text-[15px] text-ink/70">Nothing needs fixing.</p>
          )}
          <button
            type="button"
            disabled={!closeCheck.ok}
            onClick={() => setConfirm("close")}
            className="mt-4 h-14 w-full rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.99] disabled:opacity-45"
          >
            Close month
          </button>
          {!closeCheck.ok && <p className="mt-2 text-[13px] text-ink/60">{closeCheck.reason}</p>}
        </>
      )}

      <AnimatePresence>
        {confirm && (
          <Sheet label={confirm === "close" ? "Close month" : "Reopen month"} onClose={() => setConfirm(null)}>
            <h2 className="font-display text-[32px] leading-none font-light tracking-[-0.03em]">
              {confirm === "close" ? `Close ${label}?` : `Reopen ${label}?`}
            </h2>
            <p className="mt-3 text-[15px] leading-snug text-ink/75">
              {confirm === "close"
                ? `The scores for ${live.length} ${live.length === 1 ? "person" : "people"} are saved and the month is locked: no record, holiday or weekly-off change is possible until you reopen it.`
                : "The month unlocks so you can correct records. Its point values stay the same. Close it again to save the corrected results."}
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setConfirm(null)} className="h-14 flex-1 rounded-[10px] border border-ink text-base font-medium active:scale-[0.98]">
                Cancel
              </button>
              <button
                type="button"
                disabled={close.isPending || reopen.isPending}
                onClick={() => void run(confirm)}
                className="h-14 flex-[1.6] rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.98] disabled:opacity-50"
              >
                {confirm === "close" ? "Close month" : "Reopen month"}
              </button>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
      <FlashToast message={flash.message} onClose={flash.clear} />
    </section>
  );
}
