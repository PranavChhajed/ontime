"use client";

import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FlashToast, useFlash } from "@/components/Flash";
import { useClock, useEmployees } from "@/data/queries";
import { formatDate } from "@/lib/dates";
import type { Employee } from "@/features/today/types";
import { EmployeeSheet } from "./EmployeeSheet";
import { describeOffs } from "./offs";

const fmt = formatDate;

export function EmployeesScreen() {
  const clock = useClock();
  const q = useEmployees();
  const { date: today } = clock.now();
  const flash = useFlash();
  const [editing, setEditing] = useState<Employee | "new" | null>(null);

  const { current, past } = useMemo(() => {
    const all = q.data ?? [];
    return {
      current: all.filter((e) => !e.lastWorkingDate || e.lastWorkingDate >= today),
      past: all.filter((e) => e.lastWorkingDate && e.lastWorkingDate < today),
    };
  }, [q.data, today]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <Link href="/more" className="inline-flex h-10 items-center gap-1 text-[15px] text-ink/70">
        <span aria-hidden>←</span> More
      </Link>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h1 className="font-display text-[44px] leading-none font-light tracking-[-0.04em]">Employees</h1>
        <button type="button" onClick={() => setEditing("new")} className="h-12 shrink-0 rounded-[10px] bg-terracotta px-5 text-base font-medium text-ink active:scale-[0.97]">
          Add
        </button>
      </div>

      {q.isPending && <div className="mt-6 h-40 animate-pulse rounded-[18px] bg-sand/60" aria-busy="true" />}
      {q.error && (
        <p role="alert" className="mt-6 rounded-[12px] bg-clay px-4 py-3 text-[15px]">
          Couldn’t load employees. {q.error.message}
        </p>
      )}

      {q.data && q.data.length === 0 && (
        <div className="mt-8 rounded-[24px] bg-linen p-6 ring-1 ring-ink/10">
          <p className="font-display text-[30px] leading-none font-light tracking-[-0.03em]">Add your first employee</p>
          <p className="mt-3 text-[15px] text-ink/70">Just a name to start. Sunday is already chosen as their weekly off; change it if they differ.</p>
        </div>
      )}

      {current.length > 0 && (
        <ul className="mt-6 space-y-2.5">
          {current.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => setEditing(e)} className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-linen px-4 py-3.5 text-left ring-1 ring-ink/10 active:bg-sand/60">
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-medium">{e.name}</span>
                  <span className="block truncate text-[13px] text-ink/60">
                    {e.enrollmentNo ? `No. ${e.enrollmentNo} · ` : ""}{describeOffs(e, today)} · counted from {fmt(e.countedFrom)}
                    {e.lastWorkingDate ? ` · last day ${fmt(e.lastWorkingDate)}` : ""}
                  </span>
                </span>
                <span aria-hidden className="text-ink/40">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium text-ink/60">No longer working</h2>
          <ul className="mt-2 space-y-2">
            {past.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setEditing(e)} className="flex w-full items-center justify-between rounded-[18px] bg-sand/45 px-4 py-3 text-left text-ink/70">
                  <span className="truncate">{e.name}</span>
                  <span className="shrink-0 text-[13px]">until {fmt(e.lastWorkingDate!)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <AnimatePresence>
        {editing && (
          <EmployeeSheet
            key={editing === "new" ? "new" : editing.id}
            employee={editing === "new" ? null : editing}
            today={today}
            otherNames={(q.data ?? []).filter((e) => editing === "new" || e.id !== editing.id).map((e) => e.name)}
            otherEnrollmentNos={(q.data ?? []).filter((e) => (editing === "new" || e.id !== editing.id) && e.enrollmentNo).map((e) => e.enrollmentNo as string)}
            onClose={() => setEditing(null)}
            onError={flash.flash}
          />
        )}
      </AnimatePresence>
      <FlashToast message={flash.message} onClose={flash.clear} />
    </div>
  );
}
