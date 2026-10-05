// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDayLong } from "@/lib/dates";
import { emp, resetState, state } from "@/test/queryMocks";

vi.mock("@/data/queries", async () => (await import("@/test/queryMocks")).queryMocks);

import { MonthScreen } from "./MonthScreen";

const cell = (date: string) => screen.getByRole("button", { name: new RegExp(`^${formatDayLong(date)}`) });

beforeEach(() => {
  resetState();
  state.employees = [emp("e1", "Raja"), emp("e2", "Meena")];
});

describe("Month: holidays", () => {
  it("shows the month and all its days (2026-10 has 31, starting on a Thursday)", () => {
    render(<MonthScreen />);
    expect(screen.getByText("October 2026")).toBeTruthy();
    expect(cell("2026-10-01")).toBeTruthy();
    expect(cell("2026-10-31")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^\w+ 32 October/ })).toBeNull();
    // Monday-first grid: the 1st is a Thursday, so 3 blanks come first
    const grid = cell("2026-10-01").parentElement!;
    expect(grid.children[3]).toBe(cell("2026-10-01"));
  });

  it("marks a date as a holiday with a name", async () => {
    render(<MonthScreen />);
    await userEvent.click(cell("2026-10-20"));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Name/), "Test holiday");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark holiday" }));
    expect(state.toggleHoliday).toHaveBeenCalledWith({ day: "2026-10-20", name: "Test holiday", remove: false });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("a holiday with no name is saved with a null name", async () => {
    render(<MonthScreen />);
    await userEvent.click(cell("2026-10-21"));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Mark holiday" }));
    expect(state.toggleHoliday).toHaveBeenCalledWith({ day: "2026-10-21", name: null, remove: false });
  });

  it("lists existing holidays and can remove one", async () => {
    state.holidays = { "2026-10-20": "Test holiday" };
    render(<MonthScreen />);
    expect(screen.getAllByText("Test holiday").length).toBeGreaterThan(0);
    await userEvent.click(cell("2026-10-20"));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByLabelText(/Name/) as HTMLInputElement).value).toBe("Test holiday");
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove this holiday" }));
    expect(state.toggleHoliday).toHaveBeenCalledWith({ day: "2026-10-20", name: "Test holiday", remove: true });
  });

  it("shows the database's message (for example a closed month)", async () => {
    state.toggleHoliday.mockRejectedValueOnce(new Error("That month is closed. Reopen it to make changes."));
    render(<MonthScreen />);
    await userEvent.click(cell("2026-10-20"));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Mark holiday" }));
    expect(await screen.findByText("That month is closed. Reopen it to make changes.")).toBeTruthy();
  });

  it("moves between months, including across the year end", async () => {
    render(<MonthScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("January 2027")).toBeTruthy();
    expect(cell("2027-01-31")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Jump to this month" }));
    expect(screen.getByText("October 2026")).toBeTruthy();
  });
});

describe("Month: by employee", () => {
  async function openEmployeeView() {
    render(<MonthScreen />);
    await userEvent.click(screen.getByRole("tab", { name: "By employee" }));
  }

  it("turns a working day into a day off for just that person", async () => {
    await openEmployeeView();
    await userEvent.click(cell("2026-10-05")); // a Monday, normally a working day
    expect(state.setOverride).toHaveBeenCalledWith({ employeeId: "e1", day: "2026-10-05", kind: "off" }, expect.anything());
  });

  it("turns the usual weekly off into a working day", async () => {
    await openEmployeeView();
    await userEvent.click(cell("2026-10-04")); // a Sunday: Raja's usual off
    expect(state.setOverride).toHaveBeenCalledWith({ employeeId: "e1", day: "2026-10-04", kind: "working" }, expect.anything());
  });

  it("tapping a changed date again removes the change", async () => {
    state.overrides = { e1: { "2026-10-05": "off" } };
    await openEmployeeView();
    await userEvent.click(cell("2026-10-05"));
    expect(state.setOverride).toHaveBeenCalledWith({ employeeId: "e1", day: "2026-10-05", kind: null }, expect.anything());
  });

  it("applies to the person you pick", async () => {
    await openEmployeeView();
    await userEvent.click(screen.getByRole("tab", { name: "Meena" }));
    await userEvent.click(cell("2026-10-06"));
    expect(state.setOverride).toHaveBeenCalledWith({ employeeId: "e2", day: "2026-10-06", kind: "off" }, expect.anything());
  });

  it("holidays and days before they were counted cannot be changed", async () => {
    state.holidays = { "2026-10-12": "x" };
    state.employees = [emp("e1", "Raja", { countedFrom: "2026-10-10" })];
    await openEmployeeView();
    expect((cell("2026-10-12") as HTMLButtonElement).disabled).toBe(true);
    expect((cell("2026-10-09") as HTMLButtonElement).disabled).toBe(true);
    expect((cell("2026-10-13") as HTMLButtonElement).disabled).toBe(false);
  });

  it("only offers people counted in that month", async () => {
    state.employees = [emp("e1", "Raja"), emp("e2", "Gone", { lastWorkingDate: "2026-09-30" }), emp("e3", "Later", { countedFrom: "2026-11-02" })];
    await openEmployeeView();
    expect(screen.getByRole("tab", { name: "Raja" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Gone" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Later" })).toBeNull();
  });
});
