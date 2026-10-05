// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emp, resetState, state } from "@/test/queryMocks";
import { friendlyError } from "@/lib/errors";
import { describeEntry } from "@/features/results/history";
import type { ChangeRow } from "@/data/rows";

vi.mock("@/data/queries", async () => (await import("@/test/queryMocks")).queryMocks);
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { EmployeesScreen } from "./EmployeesScreen";

beforeEach(() => resetState());

describe("Employee enrollment number", () => {
  it("is optional: a new employee without one is saved exactly as before", async () => {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/Enrollment number/)).toBeTruthy();
    await userEvent.type(within(dialog).getByLabelText("Name"), "Asha");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(state.saveEmployee).toHaveBeenCalledTimes(1);
    expect(state.saveEmployee.mock.calls[0][0]).not.toHaveProperty("enrollmentNo");
  });

  it("is saved, trimmed, when typed", async () => {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Name"), "Asha");
    await userEvent.type(within(dialog).getByLabelText(/Enrollment number/), " E-1042 ");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(state.saveEmployee).toHaveBeenCalledWith(expect.objectContaining({ name: "Asha", enrollmentNo: "E-1042" }));
  });

  it("is shown in the list and in the edit sheet", async () => {
    state.employees = [emp("e1", "Raja", { enrollmentNo: "1042" }), emp("e2", "Meena")];
    render(<EmployeesScreen />);
    expect(screen.getByText("No. 1042 · Off Sun · counted from 1 Sep 2026")).toBeTruthy();
    expect(screen.getByText("Off Sun · counted from 1 Sep 2026")).toBeTruthy(); // no number, no change
    await userEvent.click(screen.getByText("Raja"));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByLabelText(/Enrollment number/) as HTMLInputElement).value).toBe("1042");
  });

  it("can be cleared when editing", async () => {
    state.employees = [emp("e1", "Raja", { enrollmentNo: "1042" })];
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByText("Raja"));
    const dialog = await screen.findByRole("dialog");
    await userEvent.clear(within(dialog).getByLabelText(/Enrollment number/));
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(state.saveEmployee.mock.calls[0][0]).not.toHaveProperty("enrollmentNo"); // missing = empty, the database clears it
  });

  it("refuses a number another employee already has, but not your own", async () => {
    state.employees = [emp("e1", "Raja", { enrollmentNo: "1042" }), emp("e2", "Meena")];
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByText("Meena"));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Enrollment number/), "1042");
    expect(within(dialog).getByText(/already has this enrollment number/)).toBeTruthy();
    expect((within(dialog).getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await userEvent.click(screen.getByText("Raja")); // Raja keeps their own number without complaint
    const own = await screen.findByRole("dialog");
    expect(within(own).queryByText(/already has this enrollment number/)).toBeNull();
    expect((within(own).getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("reads clearly in the history and in database errors", () => {
    const row: ChangeRow = { id: 1, at: "2026-10-06T04:00:00Z", by_email: "a@x.com", entity: "employees", employee_id: "e1", day: null, field: "enrollment_no", old_value: "1042", new_value: "1050" };
    expect(describeEntry(row, () => "Raja").text).toBe("enrollment number: 1042 → 1050");
    expect(friendlyError('duplicate key value violates unique constraint "employees_enrollment_no_key"')).toBe("Another employee already has that enrollment number.");
  });
});
