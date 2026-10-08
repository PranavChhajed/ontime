// @vitest-environment jsdom
// Automated accessibility audit of every screen and sheet (axe-core: names, labels, roles, structure).
// Colour contrast needs real layout, so it is checked separately in the browser.
import axe from "axe-core";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emp, resetState, state } from "@/test/queryMocks";
import { parseClock } from "@/scoring";

vi.mock("@/data/queries", async () => (await import("@/test/queryMocks")).queryMocks);
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: { email: "a@b.co" } } }), signOut: async () => ({}) } }) }));

import { AccessGate } from "@/components/AccessGate";
import { BottomNav } from "@/components/BottomNav";
import { LoginForm } from "@/app/login/LoginForm";
import { ResetPasswordForm } from "@/app/reset-password/ResetPasswordForm";
import { AccessScreen } from "@/features/access/AccessScreen";
import { GateScreen } from "@/features/gate/GateScreen";
import { endGate, startGate } from "@/features/gate/lock";
import { HistoryScreen } from "@/features/history/HistoryScreen";
import { PointsScreen } from "@/features/points/PointsScreen";
import { EmployeesScreen } from "@/features/employees/EmployeesScreen";
import { MonthScreen } from "@/features/month/MonthScreen";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { AttentionScreen } from "@/features/results/AttentionScreen";
import { BreakdownScreen } from "@/features/results/BreakdownScreen";
import { ResultsScreen } from "@/features/results/ResultsScreen";
import { TodayScreen } from "@/features/today/TodayScreen";
import type { DayRecord } from "@/features/today/types";

async function audit(label: string) {
  const result = await axe.run(document.body, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  const report = result.violations.map((v) => `${v.id}: ${v.help}\n   ${v.nodes.map((n) => n.html.slice(0, 120)).join("\n   ")}`);
  expect(report, `${label}\n${report.join("\n")}`).toEqual([]);
}

const arrive = (t: string): DayRecord => ({ arrival: parseClock(t), notice: null, leave: false });

beforeEach(() => {
  resetState();
  localStorage.setItem("ontime.onboarded", "1");
  state.employees = [emp("e1", "Raja"), emp("e2", "Meena"), emp("e3", "Suresh")];
  state.records = { e1: arrive("9:12"), e2: { arrival: null, notice: parseClock("9:22"), leave: false } };
  state.clock = { date: "2026-11-02", minute: parseClock("9:25") };
  state.monthRecords = {};
  for (const id of ["e1", "e2", "e3"]) {
    state.monthRecords[id] = {};
    for (let d = 1; d <= 31; d++) {
      const key = `2026-10-${String(d).padStart(2, "0")}`;
      if (!["2026-10-04", "2026-10-11", "2026-10-18", "2026-10-25"].includes(key)) state.monthRecords[id][key] = arrive("9:10");
    }
  }
});

describe("accessibility", () => {
  it("Today: arrivals", async () => {
    render(<TodayScreen />);
    await audit("Today arrivals");
  });

  it("Today: informed", async () => {
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("tab", { name: /Informed/ }));
    await audit("Today informed");
  });

  it("Today: day sheet and informed sheet", async () => {
    render(<TodayScreen />);
    await userEvent.click(within(screen.getByText("Suresh").closest("li") as HTMLElement).getAllByRole("button")[0]);
    await screen.findByRole("dialog");
    await audit("Day sheet");
  });

  it("Today: empty and error states", async () => {
    state.employees = [];
    const { unmount } = render(<TodayScreen />);
    await audit("Today empty");
    unmount();
    state.loadError = new Error("Failed to fetch");
    render(<TodayScreen />);
    await audit("Today error");
  });

  it("Employees list and sheet", async () => {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await screen.findByRole("dialog");
    await audit("Employee sheet");
  });

  it("Point values, Admin access (and removal sheet), history", async () => {
    state.changeLog = [{ id: 1, at: "2026-10-05T04:00:00Z", by_email: "a@b.co", entity: "point_values", employee_id: null, day: null, field: "base", old_value: "5", new_value: "6" }];
    state.approved = [
      { email: "a@b.co", addedAt: "2026-10-01T00:00:00Z", signedUp: true },
      { email: "c@d.co", addedAt: "2026-10-02T00:00:00Z", signedUp: false },
    ];
    const points = render(<PointsScreen />);
    await audit("Point values");
    points.unmount();
    const access = render(<AccessScreen />);
    await screen.findByText("You");
    await audit("Admin access");
    await userEvent.click(screen.getByRole("button", { name: "Remove c@d.co" }));
    await audit("Remove access sheet");
    access.unmount();
    render(<HistoryScreen />);
    await audit("History");
  });

  it("Gate mode: setup, grid, confirm card, PIN sheet; Today confirm card; employee sheet with photo", async () => {
    endGate();
    const setup = render(<GateScreen />);
    await audit("Gate setup");
    setup.unmount();

    await act(async () => startGate("1234"));
    const grid = render(<GateScreen />);
    await screen.findByText("Tap your photo");
    await audit("Gate grid");
    await userEvent.click(screen.getByRole("button", { name: "Suresh: log arrival" }));
    await screen.findByRole("dialog");
    await audit("Gate confirm card");
    grid.unmount();
    render(<GateScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Admin" }));
    await audit("Gate PIN sheet");
    endGate();
  });

  it("Today: confirm card after Now; Employees: sheet with the photo control", async () => {
    const today = render(<TodayScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Mark Suresh arrived now" }));
    await screen.findByRole("dialog");
    await audit("Today confirm card");
    today.unmount();
    state.employees = [emp("e1", "Raja", { photoPath: "e1/1.jpg", photoUrl: "https://example.com/1.jpg" })];
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByText("Raja"));
    await screen.findByRole("dialog");
    await audit("Employee sheet with photo");
  });

  it("Month: holidays, by employee, holiday sheet", async () => {
    render(<MonthScreen />);
    await audit("Month holidays");
    await userEvent.click(screen.getByRole("tab", { name: "By employee" }));
    await audit("Month by employee");
    await userEvent.click(screen.getByRole("tab", { name: "Holidays" }));
    await userEvent.click(screen.getByRole("button", { name: /^Tuesday 3 November 2026/ }));
    await screen.findByRole("dialog");
    await audit("Holiday sheet");
  });

  it("Results, needs fixing, breakdown, close confirmation", async () => {
    state.clock = { date: "2026-11-02", minute: parseClock("9:25") };
    const a = render(<ResultsScreen monthFirst="2026-10-01" />);
    await audit("Results");
    await userEvent.click(screen.getByRole("button", { name: "Close month" }));
    await screen.findByRole("dialog");
    await audit("Close confirmation");
    a.unmount();

    delete state.monthRecords.e1["2026-10-07"];
    const b = render(<AttentionScreen monthFirst="2026-10-01" />);
    await audit("Needs fixing");
    b.unmount();

    render(<BreakdownScreen monthFirst="2026-10-01" employeeId="e1" />);
    await audit("Breakdown");
  });

  it("Sign in (all three modes), reset password, access gate, bottom navigation", async () => {
    const a = render(<LoginForm confirmFailed={false} />);
    await audit("Sign in");
    await userEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    await audit("Forgot password");
    await userEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    await userEvent.click(screen.getByRole("button", { name: /Create your account/ }));
    await audit("Create account");
    a.unmount();

    const b = render(<ResetPasswordForm />);
    await audit("Reset password");
    b.unmount();

    state.isAdmin = false;
    const c = render(<AccessGate />);
    await audit("Access gate");
    c.unmount();

    render(<BottomNav />);
    await audit("Bottom navigation");
  });

  it("Welcome tour", async () => {
    render(<Onboarding />);
    await audit("Welcome tour");
  });
});
