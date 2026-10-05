import { describe, expect, it } from "vitest";
import type { Employee } from "@/features/today/types";
import { describeOffs, editableOffDays, nextOffChange, offDaysOn } from "./offs";

const emp = (weeklyOffs: Employee["weeklyOffs"]): Employee => ({
  id: "e1",
  name: "Zed",
  countedFrom: "2026-10-05",
  lastWorkingDate: null,
  weeklyOffs,
});

// The exact situation seen in the app: Sun + Wed, then from 12 Oct Wed becomes Mon.
const scheduled = emp([
  { weekday: 0, from: "2026-10-05", to: null },
  { weekday: 3, from: "2026-10-05", to: "2026-10-11" },
  { weekday: 1, from: "2026-10-12", to: null },
]);

describe("weekly off summary", () => {
  it("lists only what is in force today, Monday first", () => {
    expect(offDaysOn(scheduled, "2026-10-05")).toEqual([3, 0]);
    expect(offDaysOn(scheduled, "2026-10-12")).toEqual([1, 0]);
  });
  it("mentions a scheduled change instead of mixing old and new", () => {
    expect(describeOffs(scheduled, "2026-10-05")).toBe("Off Wed, Sun · from 12 Oct 2026: Mon, Sun");
  });
  it("says nothing extra when nothing is scheduled", () => {
    const plain = emp([{ weekday: 0, from: "2026-10-05", to: null }]);
    expect(describeOffs(plain, "2026-10-05")).toBe("Off Sun");
    expect(nextOffChange(plain, "2026-10-05")).toBeNull();
  });
  it("after the change has happened it just shows the new off", () => {
    expect(describeOffs(scheduled, "2026-10-14")).toBe("Off Mon, Sun");
  });
  it("handles no weekly off, and one that ends with nothing replacing it", () => {
    expect(describeOffs(emp([]), "2026-10-05")).toBe("No weekly off");
    const ending = emp([{ weekday: 3, from: "2026-10-05", to: "2026-10-11" }]);
    expect(describeOffs(ending, "2026-10-05")).toBe("Off Wed · from 12 Oct 2026: none");
  });
});

describe("what the Admin edits", () => {
  it("is the weekly off that applies after every scheduled change", () => {
    expect(editableOffDays(scheduled)).toEqual([1, 0]);
  });
  it("ignores offs that have already ended", () => {
    const old = emp([
      { weekday: 3, from: "2026-09-01", to: "2026-09-30" },
      { weekday: 0, from: "2026-09-01", to: null },
    ]);
    expect(editableOffDays(old)).toEqual([0]);
  });
});
