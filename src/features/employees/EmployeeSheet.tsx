"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useDeleteEmployee, useSaveEmployee, useSetEmployeePhoto } from "@/data/queries";
import { resizeToSquareJpeg } from "@/lib/photo";
import { WEEKDAY_SHORT } from "@/lib/dates";
import { WEEK_ORDER, editableOffDays } from "./offs";
import { Sheet } from "@/features/today/Sheet";
import type { Employee } from "@/features/today/types";

interface Props {
  /** null = a new employee. */
  employee: Employee | null;
  today: string;
  /** Names of the other employees, to hint at a duplicate. */
  otherNames?: string[];
  /** Enrollment numbers of the other employees, to catch a repeat before saving. */
  otherEnrollmentNos?: string[];
  onClose: () => void;
  onError: (message: string) => void;
}

export function EmployeeSheet({ employee, today, otherNames = [], otherEnrollmentNos = [], onClose, onError }: Props) {
  const save = useSaveEmployee();
  const del = useDeleteEmployee();
  const setPhoto = useSetEmployeePhoto();
  const isNew = employee === null;

  const initialDays = isNew ? [0] : editableOffDays(employee);
  const [name, setName] = useState(employee?.name ?? "");
  const [enrollment, setEnrollment] = useState(employee?.enrollmentNo ?? "");
  // Photo: nothing changes until Save, like every other field in this form.
  const [photo, setPhotoState] = useState<{ kind: "keep" } | { kind: "new"; blob: Blob; preview: string } | { kind: "remove" }>({ kind: "keep" });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => {
    if (photo.kind === "new") URL.revokeObjectURL(photo.preview);
  }, [photo]);
  const shownPhoto = photo.kind === "new" ? photo.preview : photo.kind === "remove" ? null : (employee?.photoUrl ?? null);
  const hasPhoto = shownPhoto !== null;

  async function pick(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    try {
      const blob = await resizeToSquareJpeg(file);
      setPhotoState({ kind: "new", blob, preview: URL.createObjectURL(blob) });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Couldn’t use that photo. Please try another.");
    }
  }

  const [days, setDays] = useState<number[]>(initialDays);
  const [countedFrom, setCountedFrom] = useState(employee?.countedFrom ?? today);
  const [lastDay, setLastDay] = useState(employee?.lastWorkingDate ?? "");
  const [offFrom, setOffFrom] = useState(today > (employee?.countedFrom ?? today) ? today : (employee?.countedFrom ?? today));

  const daysChanged = !isNew && [...days].sort().join() !== [...initialDays].sort().join();
  const enrollmentTaken = enrollment.trim() !== "" && otherEnrollmentNos.some((n) => n.trim().toLowerCase() === enrollment.trim().toLowerCase());
  const valid = name.trim().length > 0 && !enrollmentTaken && countedFrom !== "" && (lastDay === "" || lastDay >= countedFrom);
  const busy = save.isPending || del.isPending || setPhoto.isPending;
  const duplicate = name.trim() !== "" && otherNames.some((n) => n.trim().toLowerCase() === name.trim().toLowerCase());

  const toggle = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  async function submit(overrideLast?: string | null) {
    try {
      const id = await save.mutateAsync({
        id: employee?.id ?? null,
        name: name.trim(),
        ...(enrollment.trim() ? { enrollmentNo: enrollment.trim() } : {}),
        countedFrom,
        lastWorkingDate: overrideLast === undefined ? (lastDay === "" ? null : lastDay) : overrideLast,
        weekdays: days,
        weeklyOffFrom: isNew ? countedFrom : offFrom,
      });
      if (photo.kind !== "keep") {
        try {
          await setPhoto.mutateAsync({ employeeId: employee?.id ?? id, blob: photo.kind === "new" ? photo.blob : null, oldPath: employee?.photoPath ?? null });
        } catch (e) {
          onClose();
          onError(`Saved, but the photo could not be uploaded. Open ${name.trim()} again to retry. ${e instanceof Error ? e.message : ""}`.trim());
          return;
        }
      }
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Couldn’t save. Please try again.");
    }
  }

  async function remove() {
    if (!employee) return;
    try {
      await del.mutateAsync(employee.id);
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Couldn’t delete.");
    }
  }

  return (
    <Sheet label={isNew ? "Add employee" : `Edit ${employee.name}`} onClose={onClose}>
      <h2 className="min-w-0 font-display text-[32px] leading-none font-light tracking-[-0.03em]">{isNew ? "Add employee" : employee.name}</h2>

      <div className="mt-5 flex items-center gap-4">
        <Avatar name={name || "?"} src={shownPhoto} className="size-24 text-[32px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} className="h-12 rounded-[10px] border border-ink px-4 text-[16px] font-medium active:bg-sand">
            {hasPhoto ? "Take a new photo" : "Take photo"}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => galleryRef.current?.click()} className="h-11 flex-1 rounded-[10px] border border-ink/40 px-3 text-[14px] active:bg-sand">
              Choose from gallery
            </button>
            {hasPhoto && (
              <button type="button" onClick={() => setPhotoState({ kind: "remove" })} className="h-11 shrink-0 rounded-[10px] px-3 text-[14px] text-brick underline underline-offset-4">
                Remove
              </button>
            )}
          </div>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden aria-label="Take a photo" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={galleryRef} type="file" accept="image/*" hidden aria-label="Choose a photo from the gallery" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {photoError && <p role="alert" className="mt-2 text-[13px] text-brick">{photoError}</p>}
      {photo.kind !== "keep" && <p className="mt-2 text-[13px] text-ink/60">The photo is saved when you tap {isNew ? "Add" : "Save"}.</p>}

      <label htmlFor="emp-name" className="mt-5 block text-sm font-medium">
        Name
      </label>
      <input
        id="emp-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus={isNew}
        autoComplete="off"
        className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[20px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
      />

      {duplicate && (
        <p className="mt-1.5 text-[13px] text-brick">Another employee already has this name. You can still save, but you may want to tell them apart (for example Raju K.).</p>
      )}

      <label htmlFor="emp-enrollment" className="mt-5 block text-sm font-medium">
        Enrollment number <span className="font-normal text-ink/60">(optional)</span>
      </label>
      <input
        id="emp-enrollment"
        value={enrollment}
        onChange={(e) => setEnrollment(e.target.value)}
        maxLength={30}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-invalid={enrollmentTaken ? true : undefined}
        aria-describedby={enrollmentTaken ? "emp-enrollment-err" : undefined}
        className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[20px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
      />
      {enrollmentTaken && (
        <p id="emp-enrollment-err" role="alert" className="mt-1.5 text-[13px] text-brick">Another employee already has this enrollment number.</p>
      )}

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Weekly off</legend>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {WEEK_ORDER.map((d) => {
            const on = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(d)}
                className={`h-14 rounded-[10px] text-[14px] font-medium transition-colors ${on ? "bg-olive text-cream" : "border border-deep-olive bg-linen"}`}
              >
                {WEEKDAY_SHORT[d]}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[13px] text-ink/60">Tap the days this person is normally off. You can change a single date later on the Month screen.</p>
      </fieldset>

      {daysChanged && (
        <div className="mt-4 rounded-[14px] bg-linen p-3.5 ring-1 ring-ink/10">
          <label htmlFor="off-from" className="text-sm font-medium">
            New weekly off starts from
          </label>
          <input
            id="off-from"
            type="date"
            value={offFrom}
            onChange={(e) => setOffFrom(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-[10px] border border-deep-olive bg-cream px-3 text-[17px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
          />
          <p className="mt-1.5 text-[13px] text-ink/60">Earlier dates keep the old weekly off, so past months don’t change.</p>
        </div>
      )}

      <label htmlFor="counted-from" className="mt-5 block text-sm font-medium">
        Counted from
      </label>
      <input
        id="counted-from"
        type="date"
        value={countedFrom}
        onChange={(e) => setCountedFrom(e.target.value)}
        className="mt-1.5 h-14 w-full rounded-[10px] border border-deep-olive bg-linen px-4 text-[18px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
      />
      <p className="mt-1.5 text-[13px] text-ink/60">The first day the app scores this person. Earlier days are ignored, so starting mid-month leaves no gaps.</p>

      {!isNew && (
        <>
          <label htmlFor="last-day" className="mt-5 block text-sm font-medium">
            Last working day <span className="font-normal text-ink/60">(leave empty if still working)</span>
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="last-day"
              type="date"
              value={lastDay}
              onChange={(e) => setLastDay(e.target.value)}
              className="h-14 min-w-0 flex-1 rounded-[10px] border border-deep-olive bg-linen px-4 text-[18px] outline-none focus:border-ink focus:ring-2 focus:ring-chartreuse"
            />
            {lastDay && (
              <button type="button" onClick={() => setLastDay("")} className="h-14 shrink-0 rounded-[10px] border border-ink px-4 text-[15px]">
                Clear
              </button>
            )}
          </div>
          {lastDay !== "" && lastDay < countedFrom && <p className="mt-1.5 text-[13px] text-brick">The last day can’t be before the counted-from date.</p>}
        </>
      )}

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onClose} className="h-14 flex-1 rounded-[10px] border border-ink text-base font-medium active:scale-[0.98]">
          Cancel
        </button>
        <button type="button" disabled={!valid || busy} onClick={() => void submit()} className="h-14 flex-[1.6] rounded-[10px] bg-terracotta text-lg font-medium text-ink active:scale-[0.98] disabled:opacity-50">
          {busy ? "Saving…" : isNew ? "Add" : "Save"}
        </button>
      </div>

      {!isNew && (
        <div className="mt-4 space-y-1 text-center">
          {!employee.lastWorkingDate && (
            <button type="button" disabled={busy} onClick={() => void submit(today)} className="w-full py-2 text-[15px] text-ink/70 underline underline-offset-4">
              This person has left: set last working day to today
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => void remove()} className="w-full py-2 text-[14px] text-brick underline underline-offset-4">
            Delete (only possible if they have no records)
          </button>
        </div>
      )}
    </Sheet>
  );
}
