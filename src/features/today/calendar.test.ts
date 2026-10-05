import { describe, expect, it } from "vitest";
import { DEFAULT_POINT_VALUES as V } from "@/scoring";
import { nonWorkingFor, resultFor, usualOffOn } from "./calendar";
import type { Employee } from "./types";

const base: Employee = {
  id: "e1",
  name: "Raja",
  countedFrom: "2026-09-01",
  lastWorkingDate: null,
  weeklyOffs: [{ weekday: 0, from: "2026-09-01", to: null }], // Sundays
};
// 2026-10-04 is a Sunday, 2026-10-05 a Monday.

describe("usual weekly off", () => {
  it("applies on that weekday only", () => {
    expect(usualOffOn(base, "2026-10-04")).toBe(true);
    expect(usualOffOn(base, "2026-10-05")).toBe(false);
  });
  it("respects the from and to dates, so changing it never rewrites the past", () => {
    const moved: Employee = {
      ...base,
      weeklyOffs: [
        { weekday: 0, from: "2026-09-01", to: "2026-09-30" }, // Sundays until September
        { weekday: 3, from: "2026-10-01", to: null }, // Wednesdays from October
      ],
    };
    expect(usualOffOn(moved, "2026-09-27")).toBe(true); // a September Sunday
    expect(usualOffOn(moved, "2026-10-04")).toBe(false); // an October Sunday
    expect(usualOffOn(moved, "2026-10-07")).toBe(true); // an October Wednesday
    expect(usualOffOn(moved, "2026-09-30")).toBe(false); // a September Wednesday
  });
  it("supports more than one weekly off", () => {
    const two: Employee = { ...base, weeklyOffs: [...base.weeklyOffs, { weekday: 3, from: "2026-09-01", to: null }] };
    expect(usualOffOn(two, "2026-10-07")).toBe(true);
    expect(usualOffOn(two, "2026-10-04")).toBe(true);
  });
});

describe("why a date is not a working day", () => {
  it("working day -> null", () => {
    expect(nonWorkingFor(base, "2026-10-05", {}, {})).toBeNull();
  });
  it("usual weekly off", () => {
    expect(nonWorkingFor(base, "2026-10-04", {}, {})).toBe("weekly_off");
  });
  it("company holiday, including one with no name", () => {
    expect(nonWorkingFor(base, "2026-10-05", { "2026-10-05": "Diwali" }, {})).toBe("holiday");
    expect(nonWorkingFor(base, "2026-10-05", { "2026-10-05": "" }, {})).toBe("holiday");
  });
  it("before counted-from and after the last working day is not employed", () => {
    expect(nonWorkingFor(base, "2026-08-31", {}, {})).toBe("not_employed");
    const left: Employee = { ...base, lastWorkingDate: "2026-10-02" };
    expect(nonWorkingFor(left, "2026-10-02", {}, {})).toBeNull();
    expect(nonWorkingFor(left, "2026-10-03", {}, {})).toBe("not_employed");
  });
  it("not employed beats holiday and weekly off", () => {
    expect(nonWorkingFor(base, "2026-08-30", { "2026-08-30": "x" }, {})).toBe("not_employed");
  });
  it("one-date override: working day -> off", () => {
    expect(nonWorkingFor(base, "2026-10-05", {}, { e1: { "2026-10-05": "off" } })).toBe("weekly_off");
  });
  it("one-date override: usual off -> working", () => {
    expect(nonWorkingFor(base, "2026-10-04", {}, { e1: { "2026-10-04": "working" } })).toBeNull();
  });
  it("an override for another employee changes nothing", () => {
    expect(nonWorkingFor(base, "2026-10-05", {}, { other: { "2026-10-05": "off" } })).toBeNull();
  });
  it("a holiday always wins over a 'working' override (holiday work is out of scope)", () => {
    expect(nonWorkingFor(base, "2026-10-05", { "2026-10-05": "x" }, { e1: { "2026-10-05": "working" } })).toBe("holiday");
  });
});

describe("a day's result", () => {
  it("scores an arrival on a working day", () => {
    const r = resultFor(base, "2026-10-05", {}, {}, { arrival: 565, notice: null, leave: false }, V);
    expect(r.kind).toBe("on_time");
    expect(r.dayPoints).toBe(6);
  });
  it("nothing recorded on a working day needs attention, never late", () => {
    expect(resultFor(base, "2026-10-05", {}, {}, undefined, V).kind).toBe("needs_attention");
  });
  it("a weekly off is not scored, even with nothing recorded", () => {
    expect(resultFor(base, "2026-10-04", {}, {}, undefined, V).kind).toBe("weekly_off");
  });
  it("uses the point values it is given", () => {
    const r = resultFor(base, "2026-10-05", {}, {}, { arrival: 565, notice: null, leave: false }, { ...V, onTime: 8 });
    expect(r.dayPoints).toBe(8);
  });
});
