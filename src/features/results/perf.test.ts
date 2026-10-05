import { describe, expect, it } from "vitest";
import { DEFAULT_POINT_VALUES as V, parseClock } from "@/scoring";
import type { DayRecord, Employee } from "@/features/today/types";
import { computeMonth, datesOfMonth, findProblems } from "./compute";

describe("a realistic factory size", () => {
  it("works out 30 people for a full month quickly and correctly", () => {
    const employees: Employee[] = Array.from({ length: 30 }, (_, i) => ({
      id: `e${i}`,
      name: `Person ${String(i).padStart(2, "0")}`,
      countedFrom: "2026-01-01",
      lastWorkingDate: null,
      weeklyOffs: [{ weekday: 0, from: "2026-01-01", to: null }],
    }));
    const records: Record<string, Record<string, DayRecord>> = {};
    for (const e of employees) {
      records[e.id] = {};
      for (const d of datesOfMonth("2026-10-01")) records[e.id][d] = { arrival: parseClock("9:10"), notice: null, leave: false };
    }

    const t0 = performance.now();
    const views = computeMonth(employees, { monthFirst: "2026-10-01", asOf: "2026-11-02", records, holidays: {}, overrides: {}, values: V });
    const problems = findProblems(views);
    const ms = performance.now() - t0;

    expect(views).toHaveLength(30);
    expect(views.every((v) => v.days.length === 31)).toBe(true);
    // Sundays carry a record but are off days: each is flagged, never scored
    expect(problems).toHaveLength(30 * 4);
    expect(views[0].month.attendedDays).toBe(27);
    expect(ms).toBeLessThan(250); // generous; it takes a few milliseconds
  });
});
