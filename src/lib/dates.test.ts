import { describe, expect, it } from "vitest";
import { factoryNow } from "./clock";
import { addDays, formatDate, formatDayHeading, formatDayLong, monthEnd, monthStart, nextMonthStart, toDateKey, weekday } from "./dates";

describe("dates", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29"); // leap year
  });
  it("knows the weekday, whatever the computer's time zone", () => {
    expect(weekday("2026-10-04")).toBe(0); // Sunday
    expect(weekday("2026-10-05")).toBe(1); // Monday
  });
  it("round-trips a date", () => {
    expect(toDateKey(new Date(2026, 9, 5))).toBe("2026-10-05");
  });
  it("finds month edges", () => {
    expect(monthStart("2026-10-17")).toBe("2026-10-01");
    expect(monthEnd("2026-10-17")).toBe("2026-10-31");
    expect(monthEnd("2026-02-10")).toBe("2026-02-28");
    expect(monthEnd("2028-02-10")).toBe("2028-02-29");
    expect(nextMonthStart("2026-12-15")).toBe("2027-01-01");
  });
  it("formats a heading", () => {
    expect(formatDayHeading("2026-10-05")).toBe("Mon 5 Oct");
    expect(formatDate("2026-09-01")).toBe("1 Sep 2026");
    expect(formatDayLong("2026-10-05")).toBe("Monday 5 October 2026");
  });
});

describe("factory clock (India)", () => {
  it("converts a moment to India date and minute", () => {
    // 04:00 UTC = 09:30 in India
    expect(factoryNow(Date.UTC(2026, 9, 5, 4, 0))).toEqual({ date: "2026-10-05", minute: 570 });
  });
  it("rolls the date over at India's midnight, not UTC's", () => {
    // 18:30 UTC on the 4th = 00:00 on the 5th in India
    expect(factoryNow(Date.UTC(2026, 9, 4, 18, 30))).toEqual({ date: "2026-10-05", minute: 0 });
    expect(factoryNow(Date.UTC(2026, 9, 4, 18, 29))).toEqual({ date: "2026-10-04", minute: 23 * 60 + 59 });
  });
  it("drops seconds, never rounds up", () => {
    expect(factoryNow(Date.UTC(2026, 9, 5, 4, 0, 59)).minute).toBe(570);
  });
});
