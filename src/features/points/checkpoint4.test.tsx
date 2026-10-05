// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_POINT_VALUES } from "@/scoring";
import { resetState, state } from "@/test/queryMocks";
import type { ChangeRow } from "@/data/rows";

vi.mock("@/data/queries", async () => (await import("@/test/queryMocks")).queryMocks);
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const getUser = vi.fn(async () => ({ data: { user: { email: "me@x.com" } } }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { getUser } }) }));

import { AccessScreen } from "@/features/access/AccessScreen";
import { HistoryScreen } from "@/features/history/HistoryScreen";
import { describeEntry, isEntryNoise } from "@/features/results/history";
import { PointsScreen, oddities } from "./PointsScreen";

beforeEach(() => resetState());

const row = (o: Partial<ChangeRow>): ChangeRow => ({ id: 1, at: "2026-10-05T04:00:00Z", by_email: "me@x.com", entity: "day_records", employee_id: null, day: null, field: "x", old_value: null, new_value: null, ...o });

describe("Point values screen", () => {
  it("shows the current values and keeps Save off until something changes", () => {
    render(<PointsScreen />);
    expect((screen.getByLabelText(/On time/) as HTMLInputElement).value).toBe("6");
    expect((screen.getByLabelText(/Informed by 9:30/) as HTMLInputElement).value).toBe("1.5");
    expect((screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("saves every value as numbers after an edit", async () => {
    render(<PointsScreen />);
    const f = screen.getByLabelText(/Very late/);
    await userEvent.clear(f);
    await userEvent.type(f, "0.5");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(state.savePointValues).toHaveBeenCalledWith({ ...DEFAULT_POINT_VALUES, after940: 0.5 });
    expect(await screen.findByRole("status")).toBeTruthy();
  });

  it("refuses a value that is not a number, and a base of zero", async () => {
    render(<PointsScreen />);
    const base = screen.getByLabelText(/Base per attended day/);
    await userEvent.clear(base);
    await userEvent.type(base, "0");
    expect(screen.getByText("Must be more than 0")).toBeTruthy();
    await userEvent.clear(base);
    await userEvent.type(base, "abc");
    expect(screen.getByText("Use a number such as 4.5")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("warns, without blocking, when a later arrival earns more", async () => {
    render(<PointsScreen />);
    const f = screen.getByLabelText(/Very late/);
    await userEvent.clear(f);
    await userEvent.type(f, "3");
    expect(screen.getByText(/later arrival now earns more/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement).disabled).toBe(false);
    expect(oddities(DEFAULT_POINT_VALUES)).toEqual([]);
  });

  it("lists past changes in words", () => {
    state.changeLog = [row({ entity: "point_values", field: "on_time", old_value: "6.00", new_value: "5.00" })];
    render(<PointsScreen />);
    expect(screen.getByText(/On time \(9:30 or earlier\): 6 → 5 points/)).toBeTruthy();
  });
});

describe("Admin access screen", () => {
  beforeEach(() => {
    state.approved = [
      { email: "me@x.com", addedAt: "2026-10-01T00:00:00Z", signedUp: true },
      { email: "other@x.com", addedAt: "2026-10-02T00:00:00Z", signedUp: false },
    ];
  });

  it("lets you remove others but never yourself", async () => {
    render(<AccessScreen />);
    expect(await screen.findByText("You")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove me@x.com" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Remove other@x.com" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove access" }));
    expect(state.removeEmail).toHaveBeenCalledWith("other@x.com");
  });

  it("adds a lower-cased email and rejects bad or repeated ones", async () => {
    render(<AccessScreen />);
    const box = screen.getByLabelText("Give access to");
    await userEvent.type(box, "nope");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText(/doesn’t look like an email/)).toBeTruthy();
    await userEvent.clear(box);
    await userEvent.type(box, "OTHER@x.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText(/already has access/)).toBeTruthy();
    await userEvent.clear(box);
    await userEvent.type(box, "New.Person@X.com");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(state.addEmail).toHaveBeenCalledWith("new.person@x.com");
  });
});

describe("History screen", () => {
  it("reads each kind of change as a sentence and hides bookkeeping rows", () => {
    const name = (id: string | null) => (id === "e1" ? "Raja" : "Someone");
    expect(describeEntry(row({ field: "arrival_minute", employee_id: "e1", day: "2026-10-03", old_value: "574", new_value: "552" }), name)).toMatchObject({ subject: "Raja · 3 Oct 2026", text: "Arrival: 9:34 → 9:12" });
    expect(describeEntry(row({ entity: "months", field: "status", day: "2026-09-01", old_value: "closed", new_value: "open" }), name)).toMatchObject({ subject: "September 2026", text: "reopened for corrections" });
    expect(describeEntry(row({ entity: "approved_emails", entity_key: "a@x.com", field: "(record)", new_value: "added" }), name)).toMatchObject({ subject: "a@x.com", text: "given access" });
    expect(describeEntry(row({ entity: "employee_weekly_offs", employee_id: "e1", field: "weekday", old_value: "0", new_value: "3" }), name).text).toBe("weekly off: Sunday → Wednesday");
    expect(isEntryNoise(row({ entity: "months", field: "closed_by", new_value: "u1" }))).toBe(true);
    expect(isEntryNoise(row({ entity: "employees", field: "counted_from", new_value: "2026-09-01" }))).toBe(true);
    expect(isEntryNoise(row({ entity: "employees", field: "counted_from", old_value: "2026-09-01", new_value: "2026-09-05" }))).toBe(false);
  });

  it("lists changes newest first with who and when", () => {
    state.changeLog = [row({ id: 2, entity: "point_values", field: "base", old_value: "5", new_value: "6" })];
    render(<HistoryScreen />);
    expect(screen.getByText("Base per attended day")).toBeTruthy();
    expect(screen.getByText("5 → 6 points")).toBeTruthy();
    expect(screen.getByText(/me@x\.com/)).toBeTruthy();
  });

  it("says so when there is nothing yet", () => {
    render(<HistoryScreen />);
    expect(screen.getByText(/Nothing has been changed here yet/)).toBeTruthy();
  });
});
