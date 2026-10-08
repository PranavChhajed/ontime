import type { HolidayMap, OverrideMap } from "./types";
import type { PointValues } from "@/scoring";
import type { DateKey } from "@/lib/dates";
import { resultFor } from "./calendar";
import { isNonWorking, type Row } from "./rows";
import type { DayRecord, Employee } from "./types";

/** Everyone counted on one date, with their record and result. Shared by Today and Gate mode. */
export function buildRows(
  employees: Employee[],
  values: PointValues,
  dayRecords: Record<string, DayRecord>,
  calendar: { holidays: HolidayMap; overrides: OverrideMap },
  date: DateKey,
): Row[] {
  return employees
    .map((emp) => {
      const rec = dayRecords[emp.id];
      const result = resultFor(emp, date, calendar.holidays, calendar.overrides, rec, values);
      return { emp, rec, result, working: !isNonWorking(result.kind) };
    })
    .filter((r) => r.result.kind !== "not_employed");
}
