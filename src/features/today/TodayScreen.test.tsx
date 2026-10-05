// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emp, resetState, state } from "@/test/queryMocks";
import { parseClock } from "@/scoring";

vi.mock("@/data/queries", async () => (await import("@/test/queryMocks")).queryMocks);
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { TodayScreen } from "./TodayScreen";

const row = (name: string) => screen.getByText(name).closest("li") as HTMLElement;

beforeEach(() => {
  resetState();
  localStorage.setItem("ontime.onboarded", "1");
  state.employees = [emp("e1", "Raja"), emp("e2", "Meena"), emp("e3", "Suresh")];
});

describe("Today: arrivals", () => {
  it("shows every working employee, with a Now button on those not recorded", () => {
    render(<TodayScreen />);
    expect(screen.getByText("Mon 5 Oct")).toBeTruthy();
    expect(screen.getByText("0 of 3 recorded")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /arrived now/ })).toHaveLength(3);
  });

  it("one tap on Now records the arrival at the server's time", async () => {
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Mark Raja arrived now" }));
    expect(state.saveRecord).toHaveBeenCalledWith({
      employeeId: "e1",
      record: { arrival: parseClock("9:25"), notice: null, leave: false },
    });
    expect(await screen.findByText(/Raja: Arrived 9:25 → On time = 6 points/)).toBeTruthy();
  });

  it("uses the time at the moment of the tap, not when the screen last drew (9:30 vs 9:31 matters)", async () => {
    state.clock.minute = parseClock("9:30");
    render(<TodayScreen />);
    state.clock.minute = parseClock("9:31"); // time passes with no re-render
    await userEvent.click(screen.getByRole("button", { name: "Mark Raja arrived now" }));
    expect(state.saveRecord).toHaveBeenCalledWith({
      employeeId: "e1",
      record: { arrival: parseClock("9:31"), notice: null, leave: false },
    });
  });

  it("the Informed section also uses the time of the tap", async () => {
    state.clock.minute = parseClock("9:30");
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("tab", { name: /Informed/ }));
    state.clock.minute = parseClock("9:31");
    await userEvent.click(screen.getByRole("button", { name: "Raja informed just now" }));
    expect(state.saveRecord).toHaveBeenCalledWith({
      employeeId: "e1",
      record: { arrival: null, notice: parseClock("9:31"), leave: false },
    });
  });

  it("the Now buttons inside the day sheet also use the time of the tap", async () => {
    state.clock.minute = parseClock("9:30");
    render(<TodayScreen />);
    await userEvent.click(within(screen.getByText("Meena").closest("li") as HTMLElement).getAllByRole("button")[0]);
    const dialog = await screen.findByRole("dialog");
    state.clock.minute = parseClock("9:31");
    await userEvent.click(within(dialog).getAllByRole("button", { name: "Now" })[0]);
    expect((within(dialog).getByLabelText("Arrived at") as HTMLInputElement).value).toBe("09:31");
  });

  it("keeps an earlier notice when Now is tapped", async () => {
    state.records = { e1: { arrival: null, notice: parseClock("9:22"), leave: false } };
    state.clock.minute = parseClock("9:50");
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Mark Raja arrived now" }));
    expect(state.saveRecord).toHaveBeenCalledWith({
      employeeId: "e1",
      record: { arrival: parseClock("9:50"), notice: parseClock("9:22"), leave: false },
    });
    expect(await screen.findByText(/After 9:40 \+ informed by 9:30 = 1.5 points/)).toBeTruthy();
  });

  it("Undo puts back what was there before", async () => {
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Mark Raja arrived now" }));
    state.saveRecord.mockClear();
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(state.saveRecord).toHaveBeenCalledWith({ employeeId: "e1", record: null });
  });

  it("shows recorded, leave, weekly-off and not-counted rows correctly", () => {
    state.employees = [
      emp("e1", "Raja"),
      emp("e2", "Meena"),
      emp("e3", "Imran", { weeklyOffs: [{ weekday: 1, from: "2026-09-01", to: null }] }), // Mondays off
      emp("e4", "Joiner", { countedFrom: "2026-10-20" }),
    ];
    state.records = {
      e1: { arrival: parseClock("9:33"), notice: null, leave: false },
      e2: { arrival: null, notice: null, leave: true },
    };
    render(<TodayScreen />);
    expect(within(row("Raja")).getByText("9:31–9:34")).toBeTruthy();
    expect(within(row("Raja")).getByText("4.5")).toBeTruthy();
    expect(within(row("Meena")).getByText("Approved leave · not in base")).toBeTruthy();
    expect(within(screen.getByText("Imran").closest("li") as HTMLElement).getByText("Weekly off")).toBeTruthy();
    expect(screen.queryByText("Joiner")).toBeNull(); // not counted yet: hidden
    expect(screen.getByText("2 of 2 recorded")).toBeTruthy(); // Imran and Joiner are not in the count
  });

  it("a holiday greys everyone out and nobody can be marked", () => {
    state.holidays = { "2026-10-05": "Test holiday" };
    render(<TodayScreen />);
    expect(screen.getAllByText("Holiday")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /arrived now/ })).toBeNull();
  });

  it("shows the save error from the database and does not show Undo", async () => {
    state.saveRecord.mockRejectedValueOnce(new Error("That month is closed. Reopen it to make changes."));
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Mark Raja arrived now" }));
    expect(await screen.findByText("That month is closed. Reopen it to make changes.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("opens the day sheet with a live result line", async () => {
    render(<TodayScreen />);
    await userEvent.click(within(row("Meena")).getAllByRole("button")[0]);
    const dialog = await screen.findByRole("dialog");
    const arrival = within(dialog).getByLabelText("Arrived at");
    await userEvent.type(arrival, "0947AM");
    const informed = within(dialog).getByLabelText(/Informed at/);
    await userEvent.type(informed, "0922AM");
    expect(within(dialog).getByText(/Arrived 9:47, informed 9:22 → After 9:40 \+ informed by 9:30 = 1.5 points/)).toBeTruthy();
  });
});

describe("Today: afternoon times", () => {
  it("warns, without blocking, when an arrival is entered as pm", async () => {
    render(<TodayScreen />);
    await userEvent.click(within(row("Meena")).getAllByRole("button")[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/in the afternoon or evening/)).toBeNull();
    fireEvent.change(within(dialog).getByLabelText("Arrived at"), { target: { value: "21:37" } });
    expect(within(dialog).getByText(/That is 9:37 pm/)).toBeTruthy();
    expect((within(dialog).getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("Today: informed section", () => {
  it("lists everyone with a clear yes / no and a count on the tab", async () => {
    state.records = { e1: { arrival: null, notice: parseClock("9:10"), leave: false } };
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("tab", { name: /Informed/ }));
    expect(within(row("Raja")).getByText("Informed · not arrived yet")).toBeTruthy();
    expect(within(row("Raja")).getByText("9:10")).toBeTruthy();
    expect(within(row("Meena")).getByText("Hasn’t informed")).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Informed/ }).textContent).toContain("1");
  });

  it("one tap on Informed records the notice now, leaving arrival and leave alone", async () => {
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("tab", { name: /Informed/ }));
    await userEvent.click(screen.getByRole("button", { name: "Meena informed just now" }));
    expect(state.saveRecord).toHaveBeenCalledWith({
      employeeId: "e2",
      record: { arrival: null, notice: parseClock("9:25"), leave: false },
    });
    expect(await screen.findByText("Meena informed at 9:25")).toBeTruthy();
  });

  it("someone who has already arrived gets Add time, not a one-tap button", async () => {
    state.records = { e1: { arrival: parseClock("9:37"), notice: null, leave: false } };
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("tab", { name: /Informed/ }));
    expect(screen.queryByRole("button", { name: "Raja informed just now" })).toBeNull();
    expect(within(row("Raja")).getByRole("button", { name: "Add time" })).toBeTruthy();
  });

  it("explains whether the notice counted", async () => {
    state.records = {
      e1: { arrival: parseClock("9:47"), notice: parseClock("9:22"), leave: false },
      e2: { arrival: parseClock("9:20"), notice: parseClock("9:10"), leave: false },
      e3: { arrival: parseClock("9:37"), notice: parseClock("9:37"), leave: false },
    };
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("tab", { name: /Informed/ }));
    expect(within(row("Raja")).getByText("Counted: informed by 9:30 · +1.5")).toBeTruthy();
    expect(within(row("Meena")).getByText("Arrived before 9:35: notice not needed")).toBeTruthy();
    expect(within(row("Suresh")).getByText("Not counted: not before arrival")).toBeTruthy();
  });

  it("a person on leave cannot be marked as informed", async () => {
    state.records = { e1: { arrival: null, notice: null, leave: true } };
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("tab", { name: /Informed/ }));
    expect(within(row("Raja")).queryByRole("button")).toBeNull();
    expect(within(row("Raja")).getByText("On leave")).toBeTruthy();
  });
});

describe("Today: states", () => {
  it("warns when the server clock cannot be reached, because Now would use the phone's clock", () => {
    state.usingServerTime = false;
    render(<TodayScreen />);
    expect(screen.getByRole("status").textContent).toContain("phone’s clock");
  });

  it("shows no warning when the server clock is in use", () => {
    render(<TodayScreen />);
    expect(screen.queryByText(/phone’s clock/)).toBeNull();
  });

  it("with no employees, offers to add the first one", () => {
    state.employees = [];
    render(<TodayScreen />);
    const link = screen.getByRole("link", { name: "Add your first employee" });
    expect(link.getAttribute("href")).toBe("/more/employees");
  });

  it("shows a clear message if loading fails", () => {
    state.loadError = new Error("Failed to fetch");
    render(<TodayScreen />);
    expect(screen.getByText("Couldn’t load")).toBeTruthy();
    expect(screen.getByText("Failed to fetch")).toBeTruthy();
  });

  it("on a past day, offers Enter time instead of Now", async () => {
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(screen.getByText("Sun 4 Oct")).toBeTruthy(); // everyone's weekly off in the test data
    await userEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(screen.queryByRole("button", { name: /arrived now/ })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Enter time" })).toHaveLength(3);
  });

  it("on a future day, arrival cannot be entered", async () => {
    render(<TodayScreen />);
    await userEvent.click(screen.getByRole("button", { name: "Next day" }));
    expect(screen.queryByRole("button", { name: /arrived now/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Enter time" })).toBeNull();
  });
});
