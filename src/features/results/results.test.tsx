// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emp, resetState, state } from "@/test/queryMocks";
import { DEFAULT_POINT_VALUES as V, parseClock } from "@/scoring";
import type { DayRecord } from "@/features/today/types";

vi.mock("@/data/queries", async () => (await import("@/test/queryMocks")).queryMocks);
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { AttentionScreen } from "./AttentionScreen";
import { BreakdownScreen } from "./BreakdownScreen";
import type { EmployeeView } from "./compute";
import { ResultsScreen } from "./ResultsScreen";

const OCT = "2026-10-01";
const arrive = (t: string, notice?: string): DayRecord => ({ arrival: parseClock(t), notice: notice ? parseClock(notice) : null, leave: false });
const SUNDAYS = ["2026-10-04", "2026-10-11", "2026-10-18", "2026-10-25"];

/** Every working day of October on time for the given people. */
function fullMonth(...ids: string[]) {
  const out: Record<string, Record<string, DayRecord>> = {};
  for (const id of ids) {
    out[id] = {};
    for (let d = 1; d <= 31; d++) {
      const key = `2026-10-${String(d).padStart(2, "0")}`;
      if (!SUNDAYS.includes(key)) out[id][key] = arrive("9:10");
    }
  }
  return out;
}

beforeEach(() => {
  resetState();
  state.employees = [emp("e1", "Raja"), emp("e2", "Meena")];
  state.clock = { date: "2026-11-02", minute: parseClock("10:00") }; // October has ended
  state.monthRecords = fullMonth("e1", "e2");
});

describe("Results list", () => {
  it("shows each person's score and attended days, linking to their breakdown", () => {
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByText("October 2026")).toBeTruthy();
    expect(screen.getAllByText("120.0%")).toHaveLength(2);
    expect(screen.getAllByText("27 attended days")).toHaveLength(2);
    expect(screen.getByText("Scores so far · 2 people")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Raja/ }).getAttribute("href")).toBe("/results/2026-10/e1");
  });

  it("links to the previous and next month", () => {
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByRole("link", { name: "Previous month" }).getAttribute("href")).toBe("/results/2026-09");
    expect(screen.getByRole("link", { name: "Next month" }).getAttribute("href")).toBe("/results/2026-11");
  });

  it("shows the real arithmetic: a late day lowers the score", () => {
    state.monthRecords.e2["2026-10-01"] = arrive("10:00"); // After 9:40, not informed = 0 points
    render(<ResultsScreen monthFirst={OCT} />);
    // 26 on time (156) + 0 = 156 over 27 x 5 = 135 -> 115.6%
    expect(screen.getByText("115.6%")).toBeTruthy();
  });

  it("a person with only leave shows No score", () => {
    state.monthRecords.e2 = Object.fromEntries(Object.keys(state.monthRecords.e2).map((d) => [d, { arrival: null, notice: null, leave: true }]));
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByText("No score")).toBeTruthy();
  });

  it("says so when nobody is counted", () => {
    state.employees = [];
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByText("Nobody is counted in this month.")).toBeTruthy();
  });

  it("shows the database's error and a retry", () => {
    state.loadError = new Error("Failed to fetch");
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByText("Failed to fetch")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("A month that has not started", () => {
  it("says so instead of listing people with no score", () => {
    state.clock = { date: "2026-09-15", minute: parseClock("10:00") };
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByText("Not started yet")).toBeTruthy();
    expect(screen.queryByText("No score")).toBeNull();
    expect(screen.queryByRole("button", { name: "Close month" })).toBeNull();
  });

  it("the current month is not treated as not started", () => {
    state.clock = { date: "2026-10-15", minute: parseClock("10:00") };
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.queryByText("Not started yet")).toBeNull();
  });
});

describe("Closing and reopening", () => {
  it("can be closed once the month has ended and nothing needs fixing", async () => {
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByText("Nothing needs fixing.")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Close month" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Close October 2026?")).toBeTruthy();
    await userEvent.click(within(dialog).getByRole("button", { name: "Close month" }));
    expect(state.closeMonth).toHaveBeenCalledTimes(1);
    const sent = state.closeMonth.mock.calls[0][0] as { monthFirst: string; employees: EmployeeView[] };
    expect(sent.monthFirst).toBe(OCT);
    expect(sent.employees.map((e) => e.name)).toEqual(["Meena", "Raja"]);
    expect(sent.employees[0].month.scoreTenths).toBe(1200);
    expect(sent.employees[0].days).toHaveLength(31);
  });

  it("cannot be closed while the month is still running", () => {
    state.clock = { date: "2026-10-31", minute: parseClock("10:00") };
    render(<ResultsScreen monthFirst={OCT} />);
    expect((screen.getByRole("button", { name: "Close month" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("A month can be closed once it has ended.")).toBeTruthy();
  });

  it("cannot be closed with a day not recorded, and links to the list of what to fix", () => {
    delete state.monthRecords.e1["2026-10-07"];
    render(<ResultsScreen monthFirst={OCT} />);
    expect((screen.getByRole("button", { name: "Close month" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Fix 1 day first: nothing recorded.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /1 day needs fixing/ }).getAttribute("href")).toBe("/results/2026-10/attention");
  });

  it("today's unrecorded people are not 'needing a fix' because the day is not over", () => {
    state.clock = { date: "2026-10-07", minute: parseClock("9:00") };
    state.monthRecords = {};
    for (const id of ["e1", "e2"]) state.monthRecords[id] = { "2026-10-01": arrive("9:10"), "2026-10-02": arrive("9:10"), "2026-10-03": arrive("9:10"), "2026-10-05": arrive("9:10"), "2026-10-06": arrive("9:10") };
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByText("Nothing needs fixing.")).toBeTruthy(); // the 7th (today) is still open
  });

  it("shows saved results and a Reopen button for a closed month, from the snapshot", async () => {
    const saved: EmployeeView[] = [
      { id: "e1", name: "Raja", month: { counts: {} as never, noticePoints: 0, totalPoints: 100, workingDays: 20, leaveDays: 0, needsAttentionDays: 0, attendedDays: 20, baseRequirement: 100, scoreTenths: 1000 }, days: [] },
    ];
    state.monthState = { status: "closed", closedAt: "2026-11-02T05:00:00Z", closedByEmail: "admin@example.com", savedValues: V, savedResults: { employees: saved } };
    render(<ResultsScreen monthFirst={OCT} />);
    expect(screen.getByText("Closed 2 Nov 2026 by admin@example.com")).toBeTruthy();
    expect(screen.getByText("100.0%")).toBeTruthy(); // the frozen figure, not the live 120.0%
    expect(screen.queryByText("120.0%")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Reopen month" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Reopen month" }));
    expect(state.reopenMonth).toHaveBeenCalledWith(OCT);
  });

  it("shows the database's message if closing fails", async () => {
    state.closeMonth.mockRejectedValueOnce(new Error("This month has not ended yet, so it cannot be closed."));
    render(<ResultsScreen monthFirst={OCT} />);
    await userEvent.click(screen.getByRole("button", { name: "Close month" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Close month" }));
    expect(await screen.findByText("This month has not ended yet, so it cannot be closed.")).toBeTruthy();
  });
});

describe("Needs fixing", () => {
  beforeEach(() => {
    delete state.monthRecords.e1["2026-10-07"];
    state.monthRecords.e2["2026-10-04"] = arrive("9:10"); // an arrival on a Sunday (weekly off) = conflict
  });

  it("lists unrecorded days and conflicts by date", () => {
    render(<AttentionScreen monthFirst={OCT} />);
    expect(screen.getByText("Sun 4 Oct")).toBeTruthy();
    expect(screen.getByText("Wed 7 Oct")).toBeTruthy();
    expect(screen.getByText("Nothing recorded")).toBeTruthy();
    expect(screen.getByText(/an arrival is recorded but not scored/)).toBeTruthy();
  });

  it("one tap marks a missing day as leave, and Undo restores it", async () => {
    render(<AttentionScreen monthFirst={OCT} />);
    await userEvent.click(screen.getByRole("button", { name: "On leave" }));
    expect(state.saveRecordOn).toHaveBeenCalledWith({ employeeId: "e1", day: "2026-10-07", record: { arrival: null, notice: null, leave: true } });
    state.saveRecordOn.mockClear();
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(state.saveRecordOn).toHaveBeenCalledWith({ employeeId: "e1", day: "2026-10-07", record: null });
  });

  it("'Clear record' removes a conflicting record in one tap", async () => {
    render(<AttentionScreen monthFirst={OCT} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear record" }));
    expect(state.saveRecordOn).toHaveBeenCalledWith({ employeeId: "e2", day: "2026-10-04", record: null });
  });

  it("'Enter time' opens the day sheet for that person and date", async () => {
    render(<AttentionScreen monthFirst={OCT} />);
    await userEvent.click(screen.getByRole("button", { name: "Enter time" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Raja")).toBeTruthy();
    expect(within(dialog).getByText("Wed 7 Oct")).toBeTruthy();
    await userEvent.type(within(dialog).getByLabelText("Arrived at"), "0935AM");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(state.saveRecordOn).toHaveBeenCalledWith({ employeeId: "e1", day: "2026-10-07", record: { arrival: parseClock("9:35"), notice: null, leave: false } });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("says when someone informed but no arrival or leave was ever recorded", () => {
    state.monthRecords.e1["2026-10-08"] = { arrival: null, notice: parseClock("9:22"), leave: false };
    render(<AttentionScreen monthFirst={OCT} />);
    expect(screen.getByText("Informed 9:22, but no arrival or leave was recorded")).toBeTruthy();
  });

  it("shows All clear when there is nothing to fix", () => {
    state.monthRecords = fullMonth("e1", "e2");
    render(<AttentionScreen monthFirst={OCT} />);
    expect(screen.getByText("All clear")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to results" }).getAttribute("href")).toBe("/results/2026-10");
  });
});

describe("Breakdown", () => {
  it("explains the score: points over base, counts per category, working to attended days", () => {
    state.monthRecords.e1["2026-10-01"] = arrive("9:33");
    state.monthRecords.e1["2026-10-02"] = arrive("10:15", "9:05");
    render(<BreakdownScreen monthFirst={OCT} employeeId="e1" />);
    // 25 on time (150) + 4.5 + 1.5 = 156 over 27 x 5 = 135 -> 115.6%
    expect(screen.getByText("115.6%")).toBeTruthy();
    expect(screen.getByText(/156 points ÷ 135 base \(27 attended days × 5\)/)).toBeTruthy();
    expect(screen.getByText("27 working days = 27 attended")).toBeTruthy();
    expect(screen.getByText("Arrived 10:15, informed 9:05 → After 9:40 + informed by 9:30 = 1.5 points")).toBeTruthy();
    expect(screen.getByText("Notice points").nextSibling?.textContent).toBe("1.5");
  });

  it("lists every date of the month with days off and holidays muted", () => {
    state.holidays = { "2026-10-02": "Test" };
    delete state.monthRecords.e1["2026-10-02"];
    render(<BreakdownScreen monthFirst={OCT} employeeId="e1" />);
    const days = screen.getAllByRole("listitem");
    expect(days).toHaveLength(31);
    expect(within(days[1]).getByText("Holiday")).toBeTruthy();
    expect(within(days[3]).getByText("Weekly off")).toBeTruthy();
  });

  it("a day can be opened and corrected while the month is open", async () => {
    render(<BreakdownScreen monthFirst={OCT} employeeId="e1" />);
    await userEvent.click(screen.getByText("Thu 1 Oct"));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByLabelText("Arrived at") as HTMLInputElement).value).toBe("09:10");
  });

  it("in a closed month the days cannot be edited", () => {
    state.monthState = { status: "closed", closedAt: "2026-11-02T05:00:00Z", closedByEmail: null, savedValues: V, savedResults: null };
    render(<BreakdownScreen monthFirst={OCT} employeeId="e1" />);
    expect(screen.getByText("Final")).toBeTruthy();
    const firstDay = screen.getByText("Thu 1 Oct").closest("button") as HTMLButtonElement;
    expect(firstDay.disabled).toBe(true);
  });

  it("marks only edited days and shows who changed what", async () => {
    state.history = [
      { id: 1, at: "2026-10-01T04:00:00Z", by_email: "a@x.com", entity: "day_records", employee_id: "e1", day: "2026-10-01", field: "arrival_minute", old_value: null, new_value: "574" },
      { id: 2, at: "2026-10-01T05:00:00Z", by_email: "b@x.com", entity: "day_records", employee_id: "e1", day: "2026-10-01", field: "arrival_minute", old_value: "574", new_value: "552" },
      { id: 3, at: "2026-10-02T04:00:00Z", by_email: "a@x.com", entity: "day_records", employee_id: "e1", day: "2026-10-02", field: "arrival_minute", old_value: null, new_value: "550" },
      { id: 4, at: "2026-10-03T04:00:00Z", by_email: "a@x.com", entity: "day_records", employee_id: "e1", day: "2026-10-03", field: "day", old_value: null, new_value: "2026-10-03" },
    ];
    render(<BreakdownScreen monthFirst={OCT} employeeId="e1" />);
    const edited = screen.getAllByRole("button", { name: /Edited/ });
    expect(edited).toHaveLength(1); // only the 1st was changed after being recorded
    expect(edited[0].textContent).toBe("Edited · 2 changes");
    await userEvent.click(edited[0]);
    expect(screen.getByText(/b@x.com: Arrival 9:34 → 9:12/)).toBeTruthy();
    expect(screen.getByText(/a@x.com: Arrival set to 9:34/)).toBeTruthy();
  });

  it("says so when the person is not counted in that month", () => {
    render(<BreakdownScreen monthFirst={OCT} employeeId="nobody" />);
    expect(screen.getByText("This person isn’t counted in this month.")).toBeTruthy();
  });
});
