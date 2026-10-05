// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emp, resetState, state } from "@/test/queryMocks";

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

describe("Employees list", () => {
  it("invites you to add the first employee when there are none", () => {
    render(<EmployeesScreen />);
    expect(screen.getByText("Add your first employee")).toBeTruthy();
  });

  it("shows weekly off and counted-from for each person", () => {
    state.employees = [emp("e1", "Raja"), emp("e2", "Meena", { weeklyOffs: [{ weekday: 3, from: "2026-09-01", to: null }, { weekday: 0, from: "2026-09-01", to: null }] })];
    render(<EmployeesScreen />);
    expect(screen.getByText("Off Sun · counted from 1 Sep 2026")).toBeTruthy();
    expect(screen.getByText("Off Wed, Sun · counted from 1 Sep 2026")).toBeTruthy(); // Monday-first order
  });

  it("separates people who have left", () => {
    state.employees = [emp("e1", "Raja"), emp("e2", "Gone", { lastWorkingDate: "2026-09-30" }), emp("e3", "Leaving", { lastWorkingDate: "2026-10-31" })];
    render(<EmployeesScreen />);
    expect(screen.getByText("No longer working")).toBeTruthy();
    expect(screen.getByText("until 30 Sep 2026")).toBeTruthy();
    expect(screen.getByText(/last day 31 Oct 2026/)).toBeTruthy(); // still working until then
  });
});

describe("Add employee", () => {
  it("starts with Sunday off and today as counted-from, and needs a name", async () => {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Sun" }).getAttribute("aria-pressed")).toBe("true");
    expect(within(dialog).getByRole("button", { name: "Mon" }).getAttribute("aria-pressed")).toBe("false");
    expect((within(dialog).getByLabelText("Counted from") as HTMLInputElement).value).toBe("2026-10-05");
    expect((within(dialog).getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("saves a new employee with the chosen weekly off", async () => {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Name"), "  Asha ");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mon" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Sun" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(state.saveEmployee).toHaveBeenCalledWith({
      id: null,
      name: "Asha",
      countedFrom: "2026-10-05",
      lastWorkingDate: null,
      weekdays: [1],
      weeklyOffFrom: "2026-10-05",
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull()); // sheet closes after saving
  });

  it("shows the database's message if saving fails, and keeps the sheet open", async () => {
    state.saveEmployee.mockRejectedValueOnce(new Error("Something went wrong"));
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Name"), "Asha");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("Duplicate names", () => {
  it("hints but does not block when another employee has the same name", async () => {
    state.employees = [emp("e1", "Raju")];
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Name"), "raju ");
    expect(within(dialog).getByText(/Another employee already has this name/)).toBeTruthy();
    expect((within(dialog).getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("does not complain about your own name when editing", async () => {
    state.employees = [emp("e1", "Raju")];
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByText("Raju"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/Another employee already has this name/)).toBeNull();
  });
});

describe("Edit employee", () => {
  beforeEach(() => {
    state.employees = [emp("e1", "Raja")];
  });

  async function open() {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByText("Raja"));
    return await screen.findByRole("dialog");
  }

  it("shows the current weekly off", async () => {
    const dialog = await open();
    expect(within(dialog).getByRole("button", { name: "Sun" }).getAttribute("aria-pressed")).toBe("true");
    expect((within(dialog).getByLabelText("Counted from") as HTMLInputElement).value).toBe("2026-09-01");
  });

  it("renaming does not ask when a new weekly off starts", async () => {
    const dialog = await open();
    await userEvent.type(within(dialog).getByLabelText("Name"), "x");
    expect(within(dialog).queryByLabelText("New weekly off starts from")).toBeNull();
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(state.saveEmployee).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", name: "Rajax", weekdays: [0] }));
  });

  it("changing the weekly off asks from which date, defaulting to today", async () => {
    const dialog = await open();
    await userEvent.click(within(dialog).getByRole("button", { name: "Sun" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Wed" }));
    expect((within(dialog).getByLabelText("New weekly off starts from") as HTMLInputElement).value).toBe("2026-10-05");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(state.saveEmployee).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", weekdays: [3], weeklyOffFrom: "2026-10-05" }));
  });

  it("blocks a last day before the counted-from date", async () => {
    const dialog = await open();
    const last = within(dialog).getByLabelText(/Last working day/);
    await userEvent.type(last, "2026-08-15");
    expect(within(dialog).getByText(/can’t be before the counted-from date/)).toBeTruthy();
    expect((within(dialog).getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("'has left' sets the last working day to today without changing anything else", async () => {
    const dialog = await open();
    await userEvent.click(within(dialog).getByRole("button", { name: /This person has left/ }));
    expect(state.saveEmployee).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", lastWorkingDate: "2026-10-05", weekdays: [0] }));
  });

  it("explains why a person with records cannot be deleted", async () => {
    state.deleteEmployee.mockRejectedValueOnce(new Error("This employee has records, so they cannot be deleted. Set a last working date instead."));
    const dialog = await open();
    await userEvent.click(within(dialog).getByRole("button", { name: /^Delete/ }));
    expect(await screen.findByText(/has records, so they cannot be deleted/)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("deletes someone with no records and closes the sheet", async () => {
    const dialog = await open();
    await userEvent.click(within(dialog).getByRole("button", { name: /^Delete/ }));
    expect(state.deleteEmployee).toHaveBeenCalledWith("e1");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
