import { describe, expect, it } from "vitest";
import {
  DEFAULT_POINT_VALUES as V,
  classifyArrival,
  formatClock,
  formatPercent,
  noticeOutcome,
  parseClock,
  percentTenths,
  scoreDay,
  scoreMonth,
  type DayInput,
  type DayKind,
  type PointValues,
} from "./index";

const t = parseClock;
const work = (arrive: string | null, notice: string | null = null, leave = false): DayInput => ({
  nonWorking: null,
  leave,
  arrivalMinute: arrive === null ? null : t(arrive),
  noticeMinute: notice === null ? null : t(notice),
});
const off = (kind: "holiday" | "weekly_off" | "not_employed"): DayInput => ({
  nonWorking: kind,
  leave: false,
  arrivalMinute: null,
  noticeMinute: null,
});
const day = (d: DayInput, v: PointValues = V) => scoreDay(d, v);
const repeat = <T,>(n: number, x: T): T[] => Array.from({ length: n }, () => x);
const month = (inputs: DayInput[], v: PointValues = V) =>
  scoreMonth(inputs.map((i) => day(i, v)), v);
const pct = (inputs: DayInput[], v: PointValues = V) => formatPercent(month(inputs, v).scoreTenths);

describe("B1.15 arrival bands, to the minute", () => {
  const cases: [string, DayKind][] = [
    ["6:30:00", "on_time"],
    ["9:29:59", "on_time"],
    ["9:30:00", "on_time"],
    ["9:30:59", "on_time"],
    ["9:31:00", "band_931_934"],
    ["9:34:00", "band_931_934"],
    ["9:34:59", "band_931_934"],
    ["9:35:00", "band_935_940"],
    ["9:40:00", "band_935_940"],
    ["9:40:59", "band_935_940"],
    ["9:41:00", "after_940"],
    ["11:00", "after_940"],
    ["0:00", "on_time"],
    ["23:59", "after_940"],
  ];
  it.each(cases)("arrival %s -> %s", (time, kind) => {
    expect(classifyArrival(t(time))).toBe(kind);
    expect(day(work(time)).kind).toBe(kind);
  });

  it("drops seconds, never rounds up", () => {
    expect(t("9:30:59")).toBe(570);
    expect(t("9:34:30")).toBe(574);
    expect(t("9:40:30")).toBe(580);
  });

  it("rejects impossible times", () => {
    expect(() => t("24:00")).toThrow();
    expect(() => t("9:60")).toThrow();
    expect(() => classifyArrival(1440)).toThrow();
    expect(() => classifyArrival(9.5)).toThrow();
  });

  it("formats minutes back to clock text", () => {
    expect(formatClock(570)).toBe("9:30");
    expect(formatClock(785)).toBe("13:05");
  });
});

describe("B1.10 day order", () => {
  it("leave without arrival is Approved leave, not in base", () => {
    const r = day(work(null, null, true));
    expect(r.kind).toBe("leave");
    expect(r.inBase).toBe(false);
    expect(r.dayPoints).toBe(0);
  });
  it("holiday, weekly off and not-employed are not scored", () => {
    for (const k of ["holiday", "weekly_off", "not_employed"] as const) {
      const r = day(off(k));
      expect(r.kind).toBe(k);
      expect(r.inBase).toBe(false);
      expect(r.dayPoints).toBe(0);
    }
  });
  it("working day with nothing recorded is needs_attention, never scored as late", () => {
    const r = day(work(null));
    expect(r.kind).toBe("needs_attention");
    expect(r.inBase).toBe(false);
    expect(r.dayPoints).toBe(0);
  });
  it("leave and arrival together: leave is used, conflict is flagged (B1.17 #1)", () => {
    const r = day(work("9:20", null, true));
    expect(r.kind).toBe("leave");
    expect(r.conflict).toBe("leave_and_arrival");
  });
  it("arrival on a weekly off is not scored, conflict flagged (B1.17 #2)", () => {
    const r = day({ ...off("weekly_off"), arrivalMinute: t("9:20") });
    expect(r.kind).toBe("weekly_off");
    expect(r.dayPoints).toBe(0);
    expect(r.conflict).toBe("arrival_on_non_working");
  });
  it("OT day is classified by arrival (6:30 -> On time = 6)", () => {
    expect(day(work("6:30")).dayPoints).toBe(6);
  });
});

describe("B3.12 notice test cases", () => {
  // [arrival, notice, expected notice points]
  const cases: [string, string, string | null, number][] = [
    ["on time", "9:25", "9:10", 0],
    ["9:31-9:34", "9:32", "9:20", 0],
    ["9:35-9:40 not informed", "9:36", null, 0],
    ["9:35-9:40 9:30:00", "9:36", "9:30:00", 1.5],
    ["9:35-9:40 9:30:59", "9:36", "9:30:59", 1.5],
    ["9:35-9:40 9:31:00", "9:36", "9:31:00", 1],
    ["9:35-9:40 notice 9:35", "9:36", "9:35", 1],
    ["9:35-9:40 same minute", "9:36", "9:36", 0],
    ["9:35-9:40 after arriving", "9:36", "9:38", 0],
    ["after 9:40 by 9:30", "11:00", "8:45", 1.5],
    ["after 9:40 late", "11:00", "10:59", 1],
    ["after 9:40 same minute", "11:00", "11:00", 0],
  ];
  it.each(cases)("%s", (_name, arrive, notice, expected) => {
    expect(day(work(arrive, notice)).noticePoints).toBe(expected);
  });

  it("notice time on a non-eligible day earns 0 and is kept for the record", () => {
    const r = day(work("9:33", "9:15"));
    expect(r.noticePoints).toBe(0);
    expect(r.noticeOutcome).toBe("not_eligible");
    expect(r.explanation).toContain("informed 9:15");
  });
  it("leave with a notice time earns nothing", () => {
    const r = day({ ...work(null, "9:00", true) });
    expect(r.noticePoints).toBe(0);
    expect(r.kind).toBe("leave");
  });
  it("noticeOutcome returns a single outcome", () => {
    expect(noticeOutcome("after_940", t("10:15"), t("9:05"))).toBe("by_930");
    expect(noticeOutcome("after_940", t("10:15"), t("10:00"))).toBe("late");
    expect(noticeOutcome("after_940", t("10:15"), null)).toBe("not_informed");
  });
});

describe("B3.11 / B2.7 per-day examples and the 9 valid outcomes", () => {
  const rows: [string, string | null, number][] = [
    ["9:20", null, 6],
    ["9:20", "9:10", 6],
    ["9:33", "9:15", 4.5],
    ["9:37", null, 2],
    ["9:37", "9:30:40", 3.5],
    ["9:37", "9:33", 3],
    ["9:37", "9:37", 2],
    ["9:37", "9:39", 2],
    ["10:15", "9:05", 1.5],
    ["10:15", "10:00", 1],
    ["10:15", null, 0],
    ["9:50", null, 0],
  ];
  it.each(rows)("arrived %s informed %s -> %s", (a, n, pts) => {
    expect(day(work(a, n)).dayPoints).toBe(pts);
  });
  it("only 6, 4.5, 3.5, 3, 2, 1.5, 1, 0 are possible", () => {
    const seen = new Set<number>();
    for (let arrive = 0; arrive < 1440; arrive += 1) {
      for (const n of [null, 0, 400, 570, 571, arrive - 1, arrive, arrive + 1]) {
        if (n !== null && (n < 0 || n > 1439)) continue;
        seen.add(
          scoreDay({ nonWorking: null, leave: false, arrivalMinute: arrive, noticeMinute: n }, V)
            .dayPoints,
        );
      }
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 1.5, 2, 3, 3.5, 4.5, 6]);
  });
});

describe("C1.4 #1: the docs' wrong example", () => {
  it("arrived 9:47, informed 9:22 is After 9:40 + by 9:30 = 1.5, not 3.5", () => {
    const r = day(work("9:47", "9:22"));
    expect(r.kind).toBe("after_940");
    expect(r.dayPoints).toBe(1.5);
    expect(r.explanation).toBe("Arrived 9:47, informed 9:22 → After 9:40 + informed by 9:30 = 1.5 points");
  });
});

describe("PRD explanation sentences", () => {
  it.each([
    [work("9:29"), "Arrived 9:29 → On time = 6 points"],
    [work("9:37", "9:37"), "Arrived 9:37, informed 9:37 → 9:35–9:40; notice not before arrival = 2 points"],
    [work("9:33", "9:15"), "Arrived 9:33, informed 9:15 → 9:31–9:34; notice not eligible = 4.5 points"],
    [work("9:37", "9:33"), "Arrived 9:37, informed 9:33 → 9:35–9:40 + informed late = 3 points"],
    [work("10:15", "10:00"), "Arrived 10:15, informed 10:00 → After 9:40 + informed late = 1 point"],
    [work(null, null, true), "Marked by Admin: Approved leave → not in base"],
  ])("%j", (input, text) => {
    expect(day(input).explanation).toBe(text);
  });
  it("shows a notice with no arrival yet", () => {
    expect(day(work(null, "9:22")).explanation).toContain("Informed 9:22, not arrived yet");
  });
});

describe("month illustrations (B2.14, B3.11, A1.6): 26 working days, base 130", () => {
  const ON = work("9:00");
  const rows: [string, ReturnType<typeof work>[], number, string][] = [
    ["1 all on time", repeat(26, ON), 156, "120.0%"],
    ["2 +1 at 9:31-9:34", [...repeat(25, ON), work("9:33")], 154.5, "118.8%"],
    ["3 +1 at 9:35-9:40 not informed", [...repeat(25, ON), work("9:37")], 152, "116.9%"],
    ["4 +1 at 9:35-9:40 by 9:30", [...repeat(25, ON), work("9:37", "9:20")], 153.5, "118.1%"],
    ["5 +1 After 9:40 not informed", [...repeat(25, ON), work("10:00")], 150, "115.4%"],
    ["6 +1 After 9:40 by 9:30", [...repeat(25, ON), work("10:00", "9:20")], 151.5, "116.5%"],
    ["B3 +1 After 9:40 informed late", [...repeat(25, ON), work("10:00", "9:50")], 151, "116.2%"],
    ["8 +1 leave (base 125)", [...repeat(25, ON), work(null, null, true)], 150, "120.0%"],
    ["9 22 on time + 4 After 9:40", [...repeat(22, ON), ...repeat(4, work("10:00"))], 132, "101.5%"],
    ["B3 22 + 4 After 9:40 all by 9:30", [...repeat(22, ON), ...repeat(4, work("10:00", "9:10"))], 138, "106.2%"],
    ["10 21 on time + 5 After 9:40", [...repeat(21, ON), ...repeat(5, work("10:00"))], 126, "96.9%"],
    ["12 all 26 at 9:31-9:34", repeat(26, work("9:32")), 117, "90.0%"],
  ];
  it.each(rows)("%s", (_n, days, total, score) => {
    const m = month(days);
    expect(m.totalPoints).toBe(total);
    expect(formatPercent(m.scoreTenths)).toBe(score);
  });
});

describe("B5.11 neutral days: 30-day month, 4 weekly offs", () => {
  const offs = repeat(4, off("weekly_off"));
  const ON = work("9:00");
  it("1 no leave, all on time", () => {
    const m = month([...offs, ...repeat(26, ON)]);
    expect([m.workingDays, m.attendedDays, m.baseRequirement, m.totalPoints]).toEqual([26, 26, 130, 156]);
    expect(formatPercent(m.scoreTenths)).toBe("120.0%");
  });
  it("3 five leave, rest on time", () => {
    const m = month([...offs, ...repeat(5, work(null, null, true)), ...repeat(21, ON)]);
    expect([m.workingDays, m.leaveDays, m.attendedDays, m.baseRequirement, m.totalPoints]).toEqual([26, 5, 21, 105, 126]);
    expect(formatPercent(m.scoreTenths)).toBe("120.0%");
  });
  it("4 weekly offs + 1 holiday", () => {
    const m = month([...offs, off("holiday"), ...repeat(25, ON)]);
    expect([m.workingDays, m.baseRequirement, m.totalPoints]).toEqual([25, 125, 150]);
    expect(formatPercent(m.scoreTenths)).toBe("120.0%");
  });
  it("5 one leave + one After 9:40 not informed = 115.2%", () => {
    const m = month([...offs, work(null, null, true), work("10:00"), ...repeat(24, ON)]);
    expect([m.attendedDays, m.baseRequirement, m.totalPoints]).toEqual([25, 125, 144]);
    expect(formatPercent(m.scoreTenths)).toBe("115.2%");
  });
  it("6 no leave + one After 9:40 not informed = 115.4%", () => {
    expect(pct([...offs, work("10:00"), ...repeat(25, ON)])).toBe("115.4%");
  });
  it("7 five weekly offs (different employee)", () => {
    expect(pct([...repeat(5, off("weekly_off")), ...repeat(25, ON)])).toBe("120.0%");
  });
});

describe("B5.8 neutral days never move the score", () => {
  const ON = work("9:00");
  it("adding leave, holidays or non-employed days leaves the score unchanged", () => {
    const base = pct(repeat(20, ON));
    expect(base).toBe("120.0%");
    expect(pct([...repeat(20, ON), ...repeat(3, work(null, null, true))])).toBe(base);
    expect(pct([...repeat(20, ON), ...repeat(2, off("holiday"))])).toBe(base);
    expect(pct([...repeat(20, ON), ...repeat(9, off("not_employed"))])).toBe(base);
  });
});

describe("C1 decisions", () => {
  const ON = work("9:00");
  it("C1.2.1 pooled: leave around one late day does not magnify it", () => {
    const days = [...repeat(5, work(null, null, true)), ...repeat(20, ON), work("10:00")];
    const m = month(days);
    expect([m.attendedDays, m.baseRequirement, m.totalPoints]).toEqual([21, 105, 120]);
    expect(formatPercent(m.scoreTenths)).toBe("114.3%");
  });
  it("C1.1 #11 every working day is leave -> No score, not an error", () => {
    const m = month(repeat(26, work(null, null, true)));
    expect(m.scoreTenths).toBeNull();
    expect(formatPercent(m.scoreTenths)).toBe("No score");
  });
  it("empty month -> No score", () => {
    expect(month([]).scoreTenths).toBeNull();
  });
  it("C1.3 #4 needs-attention days are out of points and base", () => {
    const m = month([...repeat(10, ON), ...repeat(3, work(null))]);
    expect(m.needsAttentionDays).toBe(3);
    expect(m.attendedDays).toBe(10);
    expect(m.baseRequirement).toBe(50);
    expect(formatPercent(m.scoreTenths)).toBe("120.0%");
  });
  it("C1.2.2 joiner: days before counted-from change nothing", () => {
    expect(pct([...repeat(10, off("not_employed")), ...repeat(3, ON)])).toBe("120.0%");
  });
  it("B5.5 absence beats very late (intended, C1.4 #5)", () => {
    const late = pct([...repeat(24, ON), work("9:45")]);
    const absent = pct([...repeat(24, ON), work(null, null, true)]);
    expect(Number.parseFloat(absent)).toBeGreaterThan(Number.parseFloat(late));
  });
  it("notice points are reported separately from total", () => {
    const m = month([work("10:00", "9:20"), work("9:37", "9:33")]);
    expect(m.noticePoints).toBe(2.5);
    expect(m.totalPoints).toBe(4.5);
  });
});

describe("B2.16 changing point values changes results", () => {
  it("uses the supplied values, never hard-coded numbers", () => {
    const v: PointValues = { ...V, onTime: 7, base: 4, noticeBy930: 2 };
    expect(day(work("9:00"), v).dayPoints).toBe(7);
    expect(day(work("10:00", "9:00"), v).dayPoints).toBe(2);
    const m = month(repeat(10, work("9:00")), v);
    expect(m.baseRequirement).toBe(40);
    expect(formatPercent(m.scoreTenths)).toBe("175.0%");
  });
  it("points like 4.25 add exactly", () => {
    const v: PointValues = { ...V, band931934: 4.25 };
    expect(month(repeat(4, work("9:33")), v).totalPoints).toBe(17);
  });
});

describe("rounding to one decimal, half-up", () => {
  it("rounds half up exactly", () => {
    expect(percentTenths(1, 16)).toBe(63); // 6.25% -> 6.3%
    expect(percentTenths(1, 8)).toBe(125); // 12.5% exact
    expect(percentTenths(15000, 13000)).toBe(1154); // 115.38 -> 115.4
  });
  it("no base -> null", () => {
    expect(percentTenths(100, 0)).toBeNull();
  });
});
