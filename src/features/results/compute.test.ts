import { describe, expect, it } from "vitest";
import { DEFAULT_POINT_VALUES as V, formatPercent, parseClock } from "@/scoring";
import type { DayRecord, Employee } from "@/features/today/types";
import { canClose, computeEmployee, computeMonth, datesOfMonth, employedInMonth, findProblems } from "./compute";

// October 2026: 31 days, Sundays are the 4th, 11th, 18th, 25th -> 27 working days.
const OCT = "2026-10-01";
const raja: Employee = {
  id: "e1",
  name: "Raja",
  countedFrom: "2026-09-01",
  lastWorkingDate: null,
  weeklyOffs: [{ weekday: 0, from: "2026-09-01", to: null }],
};

const arrive = (t: string, notice?: string): DayRecord => ({ arrival: parseClock(t), notice: notice ? parseClock(notice) : null, leave: false });
const leave: DayRecord = { arrival: null, notice: null, leave: true };

/** Records for every working day of October, all on time, with overrides applied by the caller. */
function allOnTime(): Record<string, DayRecord> {
  const rec: Record<string, DayRecord> = {};
  for (const d of datesOfMonth(OCT)) if (!["2026-10-04", "2026-10-11", "2026-10-18", "2026-10-25"].includes(d)) rec[d] = arrive("9:10");
  return rec;
}

const run = (emp: Employee, records: Record<string, DayRecord>, over: Partial<Parameters<typeof computeEmployee>[1]> = {}) =>
  computeEmployee(emp, { monthFirst: OCT, asOf: "2026-12-31", records: { [emp.id]: records }, holidays: {}, overrides: {}, values: V, ...over });

describe("a full month", () => {
  it("every working day on time = 120.0% (27 days x 6 = 162 over a base of 135)", () => {
    const m = run(raja, allOnTime()).month;
    expect([m.workingDays, m.attendedDays, m.baseRequirement, m.totalPoints]).toEqual([27, 27, 135, 162]);
    expect(formatPercent(m.scoreTenths)).toBe("120.0%");
  });

  it("matches the documented illustration: 22 on time + 4 After 9:40 not informed = 101.5% (26 working days)", () => {
    const rec = allOnTime();
    const days = Object.keys(rec); // 27 days
    // make one day a holiday so there are 26 working days, as in the documents
    const holidays = { [days[0]]: "x" };
    delete rec[days[0]];
    days.slice(1, 5).forEach((d) => (rec[d] = arrive("10:00"))); // 4 very late, not informed
    const m = run(raja, rec, { holidays }).month;
    expect([m.workingDays, m.baseRequirement, m.totalPoints]).toEqual([26, 130, 132]);
    expect(formatPercent(m.scoreTenths)).toBe("101.5%");
  });

  it("leave is neutral (B5.8): same score with five days of leave", () => {
    const rec = allOnTime();
    Object.keys(rec).slice(0, 5).forEach((d) => (rec[d] = leave));
    const m = run(raja, rec).month;
    expect([m.leaveDays, m.attendedDays, m.baseRequirement, m.totalPoints]).toEqual([5, 22, 110, 132]);
    expect(formatPercent(m.scoreTenths)).toBe("120.0%");
  });

  it("pooled: leave around one very late day does not magnify it (C1.2.1)", () => {
    const rec = allOnTime();
    const keys = Object.keys(rec);
    keys.slice(0, 5).forEach((d) => (rec[d] = leave)); // 5 leave
    rec[keys[5]] = arrive("10:00"); // 1 very late, not informed
    // 27 working days - 5 leave - 1 late = 21 on time
    const m = run(raja, rec).month;
    expect([m.attendedDays, m.baseRequirement, m.totalPoints]).toEqual([22, 110, 126]);
    expect(formatPercent(m.scoreTenths)).toBe("114.5%");
  });

  it("every working day on leave -> No score, not an error", () => {
    const rec = allOnTime();
    Object.keys(rec).forEach((d) => (rec[d] = leave));
    expect(formatPercent(run(raja, rec).month.scoreTenths)).toBe("No score");
  });
});

describe("what is and is not counted", () => {
  it("days after 'today' are upcoming and left out, so a provisional score is for the days so far", () => {
    const rec: Record<string, DayRecord> = { "2026-10-01": arrive("9:10"), "2026-10-02": arrive("9:40"), "2026-10-03": arrive("9:10") };
    const v = run(raja, rec, { asOf: "2026-10-03" });
    expect(v.days.filter((d) => d.kind === "upcoming")).toHaveLength(28); // 4th to 31st
    expect([v.month.attendedDays, v.month.totalPoints]).toEqual([3, 14]); // 6 + 2 + 6
    expect(formatPercent(v.month.scoreTenths)).toBe("93.3%"); // 14 / 15
  });

  it("a working day with nothing recorded is not scored and not in the base", () => {
    const rec: Record<string, DayRecord> = { "2026-10-01": arrive("9:10") };
    const v = run(raja, rec, { asOf: "2026-10-03" });
    expect(v.month.needsAttentionDays).toBe(2); // 2nd and 3rd
    expect(v.month.attendedDays).toBe(1);
    expect(formatPercent(v.month.scoreTenths)).toBe("120.0%");
  });

  it("counted-from in the middle of the month: earlier days change nothing", () => {
    const joiner: Employee = { ...raja, countedFrom: "2026-10-15" };
    const rec: Record<string, DayRecord> = {};
    for (const d of datesOfMonth(OCT)) if (d >= "2026-10-15" && d !== "2026-10-18" && d !== "2026-10-25") rec[d] = arrive("9:10");
    const v = run(joiner, rec);
    expect(v.days.filter((d) => d.kind === "not_employed")).toHaveLength(14);
    expect([v.month.attendedDays, v.month.baseRequirement]).toEqual([15, 75]);
    expect(formatPercent(v.month.scoreTenths)).toBe("120.0%");
  });

  it("a one-date override makes a usual day off a working day, and counts it", () => {
    const rec = allOnTime();
    rec["2026-10-04"] = arrive("9:10"); // worked on a Sunday
    const v = run(raja, rec, { overrides: { e1: { "2026-10-04": "working" } } });
    expect(v.month.attendedDays).toBe(28);
  });

  it("notice on a late day adds points, shown separately", () => {
    const rec = allOnTime();
    rec["2026-10-01"] = arrive("10:15", "9:05"); // After 9:40, informed by 9:30 = 1.5
    const m = run(raja, rec).month;
    expect(m.noticePoints).toBe(1.5);
    expect(m.totalPoints).toBe(26 * 6 + 1.5);
  });

  it("uses the point values it is given", () => {
    const m = run(raja, allOnTime(), { values: { ...V, onTime: 8 } }).month;
    expect(m.totalPoints).toBe(27 * 8);
  });
});

describe("whole month for several people", () => {
  const meena: Employee = { ...raja, id: "e2", name: "Meena" };
  const later: Employee = { ...raja, id: "e3", name: "Later", countedFrom: "2026-11-02" };
  const gone: Employee = { ...raja, id: "e4", name: "Gone", lastWorkingDate: "2026-09-30" };

  it("lists only people counted in the month, in name order", () => {
    const views = computeMonth([raja, meena, later, gone], { monthFirst: OCT, asOf: "2026-12-31", records: {}, holidays: {}, overrides: {}, values: V });
    expect(views.map((v) => v.name)).toEqual(["Meena", "Raja"]);
  });

  it("knows who is employed in a month", () => {
    expect(employedInMonth(raja, OCT)).toBe(true);
    expect(employedInMonth(later, OCT)).toBe(false);
    expect(employedInMonth(gone, OCT)).toBe(false);
    expect(employedInMonth(gone, "2026-09-01")).toBe(true);
    expect(employedInMonth({ ...raja, lastWorkingDate: "2026-10-01" }, OCT)).toBe(true);
  });
});

describe("problems that block closing", () => {
  it("lists unrecorded days and conflicting records, oldest first", () => {
    const rec: Record<string, DayRecord> = { "2026-10-01": arrive("9:10"), "2026-10-04": arrive("9:10") }; // a Sunday arrival = conflict
    const v = run(raja, rec, { asOf: "2026-10-05" });
    const problems = findProblems([v]);
    expect(problems.map((p) => [p.date, p.type])).toEqual([
      ["2026-10-02", "not_recorded"],
      ["2026-10-03", "not_recorded"],
      ["2026-10-04", "conflict"],
      ["2026-10-05", "not_recorded"],
    ]);
  });

  it("a record on a day off is flagged, never scored", () => {
    const v = run(raja, { "2026-10-04": arrive("9:10") }, { asOf: "2026-10-04" });
    const sunday = v.days.find((d) => d.date === "2026-10-04")!;
    expect(sunday.kind).toBe("weekly_off");
    expect(sunday.dayPoints).toBe(0);
    expect(sunday.conflict).toBe("arrival_on_non_working");
  });

  it("leave together with an arrival is flagged", () => {
    // can only arise from imported or old data; the database refuses it now
    const v = run(raja, { "2026-10-01": { arrival: parseClock("9:10"), notice: null, leave: true } }, { asOf: "2026-10-01" });
    expect(v.days[0].conflict).toBe("leave_and_arrival");
  });
});

describe("can the month be closed?", () => {
  const none = [] as ReturnType<typeof findProblems>;
  it("not before it has ended", () => {
    expect(canClose(OCT, "2026-10-31", none, 4)).toEqual({ ok: false, reason: "A month can be closed once it has ended." });
  });
  it("on the day after it ends, if nothing needs fixing", () => {
    expect(canClose(OCT, "2026-11-01", none, 4)).toEqual({ ok: true });
  });
  it("not while days need fixing, and says how many", () => {
    const p = [{ employeeId: "e1", name: "Raja", date: "2026-10-02", type: "not_recorded" as const, explanation: "" }];
    expect(canClose(OCT, "2026-11-01", p, 4)).toEqual({ ok: false, reason: "Fix 1 day first: nothing recorded." });
  });
  it("not when nobody is counted", () => {
    expect(canClose(OCT, "2026-11-01", none, 0).ok).toBe(false);
  });
});
