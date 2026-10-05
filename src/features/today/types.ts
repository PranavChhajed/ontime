import type { Minute } from "@/scoring";
import type { DateKey } from "@/lib/dates";

export interface WeeklyOff {
  /** 0 = Sunday ... 6 = Saturday. */
  weekday: number;
  from: DateKey;
  to: DateKey | null;
}

export interface Employee {
  id: string;
  name: string;
  /** First date the app scores this employee. */
  countedFrom: DateKey;
  lastWorkingDate: DateKey | null;
  /** Typed in by hand for now (a biometric device may fill it later). */
  enrollmentNo?: string | null;
  weeklyOffs: WeeklyOff[];
}

/** One employee's record for one date. Absent = nothing recorded. */
export interface DayRecord {
  arrival: Minute | null;
  notice: Minute | null;
  leave: boolean;
}

export type OverrideKind = "off" | "working";
/** employee id -> date -> kind */
export type OverrideMap = Record<string, Record<DateKey, OverrideKind>>;
export type HolidayMap = Record<DateKey, string>;
