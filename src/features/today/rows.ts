import type { DayResult } from "@/scoring";
import type { DayRecord, Employee } from "./types";

/** One employee's line on the Today screen. Shared by Arrivals and Informed. */
export interface Row {
  emp: Employee;
  rec: DayRecord | undefined;
  result: DayResult;
  /** A working day for this employee (not holiday / weekly off / not counted). */
  working: boolean;
}

export const isNonWorking = (kind: DayResult["kind"]) =>
  kind === "holiday" || kind === "weekly_off" || kind === "not_employed";
