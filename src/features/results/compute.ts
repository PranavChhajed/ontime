import { formatClock, scoreDay, scoreMonth, type DayConflict, type DayKind, type MonthResult, type PointValues } from "@/scoring";
import { addDays, monthEnd, type DateKey } from "@/lib/dates";
import { nonWorkingFor } from "@/features/today/calendar";
import type { DayRecord, Employee, HolidayMap, OverrideMap } from "@/features/today/types";

/** One date in one employee's month, as shown in the breakdown and saved when a month is closed. */
export interface DayView {
  date: DateKey;
  kind: DayKind | "upcoming";
  inBase: boolean;
  dayPoints: number;
  noticePoints: number;
  explanation: string;
  conflict: DayConflict;
  arrival: number | null;
  notice: number | null;
}

/** One employee's month, in the shape that is both displayed and saved on close. */
export interface EmployeeView {
  id: string;
  name: string;
  month: MonthResult;
  days: DayView[];
}

export const datesOfMonth = (monthFirst: DateKey): DateKey[] => {
  const last = monthEnd(monthFirst);
  const out: DateKey[] = [];
  for (let d = monthFirst; d <= last; d = addDays(d, 1)) out.push(d);
  return out;
};

/** Is this person counted on at least one date of the month? */
export function employedInMonth(emp: Employee, monthFirst: DateKey): boolean {
  return emp.countedFrom <= monthEnd(monthFirst) && (emp.lastWorkingDate === null || emp.lastWorkingDate >= monthFirst);
}

interface Inputs {
  monthFirst: DateKey;
  /** Dates after this are not due yet: shown as upcoming and left out of the score. */
  asOf: DateKey;
  /** employee id -> date -> record */
  records: Record<string, Record<DateKey, DayRecord>>;
  holidays: HolidayMap;
  overrides: OverrideMap;
  values: PointValues;
}

export function computeEmployee(emp: Employee, i: Inputs): EmployeeView {
  const days: DayView[] = [];
  const counted = [];
  for (const date of datesOfMonth(i.monthFirst)) {
    const rec = i.records[emp.id]?.[date];
    if (date > i.asOf) {
      days.push({ date, kind: "upcoming", inBase: false, dayPoints: 0, noticePoints: 0, explanation: "Not due yet", conflict: null, arrival: null, notice: null });
      continue;
    }
    const result = scoreDay(
      {
        nonWorking: nonWorkingFor(emp, date, i.holidays, i.overrides),
        leave: rec?.leave ?? false,
        arrivalMinute: rec?.arrival ?? null,
        noticeMinute: rec?.notice ?? null,
      },
      i.values,
    );
    counted.push(result);
    days.push({
      date,
      kind: result.kind,
      inBase: result.inBase,
      dayPoints: result.dayPoints,
      noticePoints: result.noticePoints,
      explanation: result.explanation,
      conflict: result.conflict,
      arrival: rec?.arrival ?? null,
      notice: rec?.notice ?? null,
    });
  }
  return { id: emp.id, name: emp.name, month: scoreMonth(counted, i.values), days };
}

/** Everyone counted in the month, in name order. */
export function computeMonth(employees: Employee[], i: Inputs): EmployeeView[] {
  return employees
    .filter((e) => employedInMonth(e, i.monthFirst))
    .map((e) => computeEmployee(e, i))
    .filter((v) => v.days.some((d) => d.kind !== "not_employed"))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface Problem {
  employeeId: string;
  name: string;
  date: DateKey;
  type: "not_recorded" | "conflict";
  explanation: string;
}

/** Days that must be fixed before the month can be closed (B1.17). */
export function findProblems(views: EmployeeView[]): Problem[] {
  const out: Problem[] = [];
  for (const v of views) {
    for (const d of v.days) {
      if (d.kind === "needs_attention") {
        out.push({
          employeeId: v.id,
          name: v.name,
          date: d.date,
          type: "not_recorded",
          explanation: d.notice !== null ? `Informed ${formatClock(d.notice)}, but no arrival or leave was recorded` : "Nothing recorded",
        });
      } else if (d.conflict) {
        out.push({ employeeId: v.id, name: v.name, date: d.date, type: "conflict", explanation: d.explanation });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

export type CloseCheck = { ok: true } | { ok: false; reason: string };

/** Can the month be closed right now? */
export function canClose(monthFirst: DateKey, today: DateKey, problems: Problem[], employeeCount: number): CloseCheck {
  if (today <= monthEnd(monthFirst)) return { ok: false, reason: "A month can be closed once it has ended." };
  if (employeeCount === 0) return { ok: false, reason: "There are no scores to save yet." };
  if (problems.length > 0) {
    const n = problems.length;
    return { ok: false, reason: `Fix ${n} ${n === 1 ? "day" : "days"} first: ${problems.some((p) => p.type === "not_recorded") ? "nothing recorded" : "conflicting records"}.` };
  }
  return { ok: true };
}
