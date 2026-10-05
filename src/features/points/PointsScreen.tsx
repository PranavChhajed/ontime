"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FlashToast, useFlash } from "@/components/Flash";
import { useChangeLog, usePointValues, useSavePointValues } from "@/data/queries";
import { describeEntry, isEntryNoise } from "@/features/results/history";
import type { PointValues } from "@/scoring";

type Key = keyof PointValues;

const GROUPS: { title: string; note?: string; fields: { key: Key; label: string; hint?: string }[] }[] = [
  { title: "Base", note: "Points an attended day has to earn to count as 100%.", fields: [{ key: "base", label: "Base per attended day" }] },
  {
    title: "Arrival",
    fields: [
      { key: "onTime", label: "On time", hint: "9:30 or earlier" },
      { key: "band931934", label: "Late", hint: "9:31 to 9:34" },
      { key: "band935940", label: "Later", hint: "9:35 to 9:40" },
      { key: "after940", label: "Very late", hint: "after 9:40" },
    ],
  },
  { title: "Leave", fields: [{ key: "leave", label: "Approved leave" }] },
  {
    title: "Informed in advance",
    note: "Extra points, only for the two latest arrival bands, and only if the person informed before they arrived.",
    fields: [
      { key: "noticeBy930", label: "Informed by 9:30" },
      { key: "noticeLate", label: "Informed after 9:30" },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.fields);
const SHAPE = /^\d{1,4}(\.\d{1,2})?$/;

/** Soft warnings: the rules still allow these, but they usually mean a typing slip. */
export function oddities(v: PointValues): string[] {
  const out: string[] = [];
  if (!(v.onTime >= v.band931934 && v.band931934 >= v.band935940 && v.band935940 >= v.after940)) out.push("A later arrival now earns more than an earlier one.");
  if (v.noticeBy930 < v.noticeLate) out.push("Informing late now earns more than informing by 9:30.");
  return out;
}

export function PointsScreen() {
  const q = usePointValues();
  const save = useSavePointValues();
  const log = useChangeLog(60, "point_values");
  const flash = useFlash();
  const [draft, setDraft] = useState<Partial<Record<Key, string>>>({});
  const [justSaved, setJustSaved] = useState(false);

  const saved = q.data;
  const text = (k: Key) => draft[k] ?? (saved ? String(saved[k]) : "");

  const { parsed, errors } = useMemo(() => {
    const errors: Partial<Record<Key, string>> = {};
    const parsed = {} as PointValues;
    if (saved) {
      for (const f of ALL) {
        const raw = (draft[f.key] ?? String(saved[f.key])).trim();
        if (!SHAPE.test(raw)) errors[f.key] = "Use a number such as 4.5";
        else if (f.key === "base" && Number(raw) <= 0) errors[f.key] = "Must be more than 0";
        else parsed[f.key] = Number(raw);
      }
    }
    return { parsed, errors };
  }, [draft, saved]);

  const invalid = Object.keys(errors).length > 0;
  const dirty = !!saved && !invalid && ALL.some((f) => parsed[f.key] !== saved[f.key]);
  const warnings = saved && !invalid ? oddities(parsed) : [];

  const entries = (log.data ?? []).filter((c) => !isEntryNoise(c)).map((c) => describeEntry(c, () => ""));

  async function onSave() {
    try {
      await save.mutateAsync(parsed);
      setDraft({});
      setJustSaved(true);
    } catch (e) {
      flash.flash(e instanceof Error ? e.message : "Couldn’t save. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <Link href="/more" className="inline-flex h-10 items-center gap-1 text-[15px] text-ink/70">
        <span aria-hidden>←</span> More
      </Link>
      <h1 className="mt-2 font-display text-[44px] leading-none font-light tracking-[-0.04em]">Point values</h1>
      <p className="mt-3 text-[15px] text-ink/70">
        A change applies to every <b className="font-medium">open</b> month straight away. Closed months keep the values they were closed with.
      </p>

      {q.isPending && <div className="mt-6 h-64 animate-pulse rounded-[18px] bg-sand/60" aria-busy="true" />}
      {q.error && (
        <p role="alert" className="mt-6 rounded-[12px] bg-clay px-4 py-3 text-[15px]">
          Couldn’t load the point values. {q.error.message}
        </p>
      )}

      {saved && (
        <form
          className="mt-6 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty && !save.isPending) void onSave();
          }}
        >
          {GROUPS.map((g) => (
            <section key={g.title} aria-labelledby={`g-${g.title}`}>
              <h2 id={`g-${g.title}`} className="text-sm font-medium text-ink/60">{g.title}</h2>
              {g.note && <p className="mt-1 text-[13px] text-ink/60">{g.note}</p>}
              <ul className="mt-2 divide-y divide-ink/10 overflow-hidden rounded-[18px] bg-linen ring-1 ring-ink/10">
                {g.fields.map((f) => {
                  const id = `pv-${f.key}`;
                  const err = errors[f.key];
                  return (
                    <li key={f.key} className="flex items-center justify-between gap-3 px-4 py-3">
                      <label htmlFor={id} className="min-w-0">
                        <span className="block text-[16px] font-medium">{f.label}</span>
                        {f.hint && <span className="block text-[13px] text-ink/60">{f.hint}</span>}
                        {err && <span id={`${id}-err`} className="block text-[13px] text-brick">{err}</span>}
                      </label>
                      <input
                        id={id}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={text(f.key)}
                        aria-invalid={err ? true : undefined}
                        aria-describedby={err ? `${id}-err` : undefined}
                        onChange={(e) => {
                          setJustSaved(false);
                          setDraft((d) => ({ ...d, [f.key]: e.target.value }));
                        }}
                        className={`h-12 w-24 shrink-0 rounded-[10px] border bg-cream px-3 text-right text-[20px] tabular-nums outline-none focus:ring-2 focus:ring-chartreuse ${err ? "border-brick" : "border-deep-olive focus:border-ink"}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {warnings.length > 0 && (
            <ul className="space-y-1 rounded-[12px] bg-clay px-4 py-3 text-[14px]" aria-label="Please check">
              {warnings.map((w) => (
                <li key={w}>{w} You can still save it.</li>
              ))}
            </ul>
          )}

          {justSaved && (
            <p role="status" className="rounded-[12px] bg-chartreuse/60 px-4 py-3 text-[14px]">
              Saved. Open months use these values from now on; closed months keep theirs.
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={!dirty || save.isPending} className="h-14 flex-1 rounded-[10px] bg-terracotta text-base font-medium text-ink active:scale-[0.98] disabled:opacity-40">
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
            {Object.keys(draft).length > 0 && (
              <button type="button" onClick={() => setDraft({})} className="h-14 rounded-[10px] border border-ink px-5 text-base font-medium active:bg-sand">
                Undo
              </button>
            )}
          </div>
        </form>
      )}

      <h2 className="mt-10 text-sm font-medium text-ink/60">Past changes</h2>
      {log.error && <p role="alert" className="mt-2 text-[14px]">Couldn’t load the history. {log.error.message}</p>}
      {log.data && entries.length === 0 && <p className="mt-2 text-[14px] text-ink/60">No point value has been changed yet.</p>}
      {entries.length > 0 && (
        <ul className="mt-2 space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded-[14px] bg-linen px-4 py-3 text-[14px] ring-1 ring-ink/10">
              <span className="block font-medium">{e.subject}: {e.text}</span>
              <span className="block break-words text-ink/60">{e.when} · {e.who}</span>
            </li>
          ))}
        </ul>
      )}
      <FlashToast message={flash.message} onClose={flash.clear} />
    </div>
  );
}
