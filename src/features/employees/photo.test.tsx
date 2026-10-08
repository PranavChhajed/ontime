// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emp, resetState, state } from "@/test/queryMocks";
import { Avatar, initialsOf } from "@/components/Avatar";
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
const resize = vi.fn<(file: Blob) => Promise<Blob>>(async () => new Blob(["jpeg"], { type: "image/jpeg" }));
vi.mock("@/lib/photo", () => ({ resizeToSquareJpeg: (f: Blob) => resize(f) }));
URL.createObjectURL = vi.fn(() => "blob:preview");
URL.revokeObjectURL = vi.fn();

import { EmployeesScreen } from "./EmployeesScreen";

beforeEach(() => {
  resetState();
  resize.mockClear();
});

const file = () => new File(["x"], "me.jpg", { type: "image/jpeg" });

describe("Avatar", () => {
  it("shows initials on a colour when there is no photo, and the photo when there is", () => {
    const { container, rerender } = render(<Avatar name="Sample Anil Kumar" />);
    expect(container.textContent).toBe("AK");
    expect(container.querySelector("img")).toBeNull();
    rerender(<Avatar name="Anil" src="https://x/y.jpg" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://x/y.jpg");
  });

  it("makes sensible initials", () => {
    expect(initialsOf("Raja")).toBe("R");
    expect(initialsOf("  raju  k ")).toBe("RK");
    expect(initialsOf("")).toBe("?");
  });

  it("is decorative: hidden from screen readers", () => {
    const { container } = render(<Avatar name="Raja" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("Employee photo", () => {
  it("is added with the new employee, only when Add is tapped", async () => {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Name"), "Asha");
    fireEvent.change(within(dialog).getByLabelText("Take a photo"), { target: { files: [file()] } });
    expect(await within(dialog).findByText(/photo is saved when you tap Add/)).toBeTruthy();
    expect(state.setPhoto).not.toHaveBeenCalled(); // nothing uploaded yet
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await waitFor(() => expect(state.setPhoto).toHaveBeenCalledTimes(1));
    expect(state.setPhoto).toHaveBeenCalledWith({ employeeId: "new-id", blob: expect.any(Blob), oldPath: null });
  });

  it("uses the gallery picker too, and shrinks the picture first", async () => {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Choose a photo from the gallery"), { target: { files: [file()] } });
    await waitFor(() => expect(resize).toHaveBeenCalledTimes(1));
  });

  it("an employee saved without touching the photo never calls the photo upload", async () => {
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Name"), "Asha");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    await waitFor(() => expect(state.saveEmployee).toHaveBeenCalled());
    expect(state.setPhoto).not.toHaveBeenCalled();
  });

  it("can be replaced and removed, remembering the old file to delete", async () => {
    state.employees = [emp("e1", "Raja", { photoPath: "e1/1.jpg", photoUrl: "https://x/1.jpg" })];
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByText("Raja"));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(state.setPhoto).toHaveBeenCalledWith({ employeeId: "e1", blob: null, oldPath: "e1/1.jpg" }));
  });

  it("a failed upload still keeps the saved employee and says what to do", async () => {
    state.setPhoto.mockRejectedValueOnce(new Error("No connection."));
    render(<EmployeesScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Name"), "Asha");
    fireEvent.change(within(dialog).getByLabelText("Take a photo"), { target: { files: [file()] } });
    await within(dialog).findByText(/photo is saved/);
    await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
    expect(await screen.findByText(/Saved, but the photo could not be uploaded/)).toBeTruthy();
    expect(state.saveEmployee).toHaveBeenCalledTimes(1);
  });

  it("is mentioned plainly in History", () => {
    const row = (o: Partial<ChangeRow>): ChangeRow => ({ id: 1, at: "2026-10-08T04:00:00Z", by_email: "a@x.com", entity: "employees", employee_id: "e1", day: null, field: "photo_path", old_value: null, new_value: "e1/1.jpg", ...o });
    expect(describeEntry(row({}), () => "Raja").text).toBe("photo added");
    expect(describeEntry(row({ old_value: "e1/1.jpg", new_value: "e1/2.jpg" }), () => "Raja").text).toBe("photo changed");
    expect(describeEntry(row({ old_value: "e1/2.jpg", new_value: null }), () => "Raja").text).toBe("photo removed");
  });
});
