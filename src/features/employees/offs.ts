import { addDays, formatDate, WEEKDAY_SHORT, type DateKey } from "@/lib/dates";
import type { Employee } from "@/features/today/types";

/** Monday first, as in India. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const byWeek = (a: number, b: number) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b);

/** Weekdays that are the usual weekly off on a given date. */
export function offDaysOn(emp: Employee, date: DateKey): number[] {
  const days = emp.weeklyOffs.filter((o) => o.from <= date && (o.to === null || date <= o.to)).map((o) => o.weekday);
  return [...new Set(days)].sort(byWeek);
}

/** The first date after today on which the usual weekly off changes, if one is scheduled. */
export function nextOffChange(emp: Employee, today: DateKey): DateKey | null {
  const dates: DateKey[] = [];
  for (const o of emp.weeklyOffs) {
    if (o.from > today) dates.push(o.from);
    if (o.to !== null && o.to >= today) dates.push(addDays(o.to, 1));
  }
  return dates.length ? dates.sort()[0] : null;
}

/** The weekly off the Admin is editing: what applies once every scheduled change has happened. */
export function editableOffDays(emp: Employee): number[] {
  return [...new Set(emp.weeklyOffs.filter((o) => o.to === null).map((o) => o.weekday))].sort(byWeek);
}

const names = (days: number[]) => (days.length ? days.map((d) => WEEKDAY_SHORT[d]).join(", ") : "none");

/** "Off Wed, Sun" or "Off Wed, Sun · from 12 Oct 2026: Mon, Sun". */
export function describeOffs(emp: Employee, today: DateKey): string {
  const now = offDaysOn(emp, today);
  let text = now.length ? `Off ${names(now)}` : "No weekly off";
  const change = nextOffChange(emp, today);
  if (change) text += ` · from ${formatDate(change)}: ${names(offDaysOn(emp, change))}`;
  return text;
}
