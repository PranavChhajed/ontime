import { scoreDay, type DayInput, type DayResult, type NonWorking, type PointValues } from "@/scoring";
import { weekday, type DateKey } from "@/lib/dates";
import type { DayRecord, Employee, HolidayMap, OverrideMap } from "./types";

/** Is the usual weekly off in force for this employee on this date? */
export function usualOffOn(emp: Employee, date: DateKey): boolean {
  const wd = weekday(date);
  return emp.weeklyOffs.some((o) => o.weekday === wd && o.from <= date && (o.to === null || date <= o.to));
}

/**
 * Why a date is not a working day for this employee, if it isn't.
 * Order: not counted -> holiday -> one-date override -> usual weekly off.
 * (A holiday always wins: working on a holiday is out of scope, B5.6.)
 */
export function nonWorkingFor(
  emp: Employee,
  date: DateKey,
  holidays: HolidayMap,
  overrides: OverrideMap,
): NonWorking {
  if (date < emp.countedFrom) return "not_employed";
  if (emp.lastWorkingDate && date > emp.lastWorkingDate) return "not_employed";
  if (holidays[date] !== undefined) return "holiday";
  const o = overrides[emp.id]?.[date];
  if (o === "off") return "weekly_off";
  if (o === "working") return null;
  return usualOffOn(emp, date) ? "weekly_off" : null;
}

export function dayInputFor(
  emp: Employee,
  date: DateKey,
  holidays: HolidayMap,
  overrides: OverrideMap,
  rec: DayRecord | undefined,
): DayInput {
  return {
    nonWorking: nonWorkingFor(emp, date, holidays, overrides),
    leave: rec?.leave ?? false,
    arrivalMinute: rec?.arrival ?? null,
    noticeMinute: rec?.notice ?? null,
  };
}

export function resultFor(
  emp: Employee,
  date: DateKey,
  holidays: HolidayMap,
  overrides: OverrideMap,
  rec: DayRecord | undefined,
  values: PointValues,
): DayResult {
  return scoreDay(dayInputFor(emp, date, holidays, overrides, rec), values);
}
