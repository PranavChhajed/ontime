// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emp, resetState, state } from "@/test/queryMocks";
import { parseClock } from "@/scoring";

vi.mock("@/data/queries", async () => (await import("@/test/queryMocks")).queryMocks);
const push = vi.fn();
const replace = vi.fn();
let pathname = "/gate";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace, refresh: vi.fn() }), usePathname: () => pathname }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { signOut: vi.fn(async () => ({})) } }) }));

import { BottomNav } from "@/components/BottomNav";
import { GateLock } from "@/components/GateLock";
import { GateScreen } from "./GateScreen";
import { endGate, startGate } from "./lock";

beforeEach(() => {
  resetState();
  endGate();
  push.mockClear();
  replace.mockClear();
  pathname = "/gate";
  state.employees = [emp("e1", "Raja"), emp("e2", "Meena"), emp("e3", "Suresh Kumar")];
});

const lock = async () => act(async () => startGate("1234"));

describe("Gate mode: starting", () => {
  it("needs a 4-digit PIN typed twice before it starts", async () => {
    render(<GateScreen />);
    const start = screen.getByRole("button", { name: "Start gate mode" }) as HTMLButtonElement;
    expect(start.disabled).toBe(true);
    await userEvent.type(screen.getByLabelText("Choose a 4-digit PIN"), "12a34"); // letters are ignored
    await userEvent.type(screen.getByLabelText("Type it again"), "4321");
    expect(screen.getByText(/don’t match/)).toBeTruthy();
    expect(start.disabled).toBe(true);
    await userEvent.clear(screen.getByLabelText("Type it again"));
    await userEvent.type(screen.getByLabelText("Type it again"), "1234");
    expect(start.disabled).toBe(false);
    await userEvent.click(start);
    expect(await screen.findByText("Tap your photo")).toBeTruthy();
  });
});

describe("Gate mode: the grid", () => {
  beforeEach(lock);

  it("shows everyone as a photo tile, people still to log first", async () => {
    state.records = { e1: { arrival: parseClock("9:10"), notice: null, leave: false } };
    render(<GateScreen />);
    const tiles = await screen.findAllByRole("button", { name: /log arrival|logged at/ });
    expect(tiles.map((t) => t.getAttribute("aria-label"))).toEqual(["Meena: log arrival", "Suresh Kumar: log arrival", "Raja: logged at 9:10"]);
    expect(screen.getByText(/1 of 3 logged/)).toBeTruthy();
  });

  it("two taps log the arrival at the time of the second tap, then offer an undo", async () => {
    state.clock.minute = parseClock("9:30");
    render(<GateScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Raja: log arrival" }));
    const dialog = await screen.findByRole("dialog", { name: /Log arrival for Raja/ });
    expect(state.saveRecord).not.toHaveBeenCalled(); // first tap saves nothing
    state.clock.minute = parseClock("9:31"); // time passes before the second tap
    await userEvent.click(within(dialog).getByRole("button", { name: "Log arrival" }));
    expect(state.saveRecord).toHaveBeenCalledWith({ employeeId: "e1", record: { arrival: parseClock("9:31"), notice: null, leave: false } });
    expect(await screen.findByText("Logged at 9:31")).toBeTruthy();

    state.saveRecord.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Not me, undo" }));
    expect(state.saveRecord).toHaveBeenCalledWith({ employeeId: "e1", record: null });
  });

  it("Not me closes the card and saves nothing", async () => {
    render(<GateScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Meena: log arrival" }));
    await userEvent.click(await screen.findByRole("button", { name: "Not me" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(state.saveRecord).not.toHaveBeenCalled();
  });

  it("an already-logged person only sees their time; nothing can be overwritten", async () => {
    state.records = { e1: { arrival: parseClock("9:10"), notice: null, leave: false } };
    render(<GateScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Raja: logged at 9:10" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("9:10")).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "Log arrival" })).toBeNull();
    expect(state.saveRecord).not.toHaveBeenCalled();
  });

  it("refuses to overwrite someone logged from another device a moment ago", async () => {
    state.freshRecords = { e1: { arrival: parseClock("9:05"), notice: null, leave: false } };
    render(<GateScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Raja: log arrival" }));
    await userEvent.click(await screen.findByRole("button", { name: "Log arrival" }));
    expect(await screen.findByText("Raja is already logged at 9:05.")).toBeTruthy();
    expect(state.saveRecord).not.toHaveBeenCalled();
  });

  it("people on leave or off today cannot be tapped", async () => {
    state.records = { e2: { arrival: null, notice: null, leave: true } };
    render(<GateScreen />);
    const meena = (await screen.findByRole("button", { name: "Meena: not working today" })) as HTMLButtonElement;
    expect(meena.disabled).toBe(true);
  });

  it("shows the save error and keeps the grid", async () => {
    state.saveRecord.mockRejectedValueOnce(new Error("That month is closed. Reopen it to make changes."));
    render(<GateScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Raja: log arrival" }));
    await userEvent.click(await screen.findByRole("button", { name: "Log arrival" }));
    expect(await screen.findByText("That month is closed. Reopen it to make changes.")).toBeTruthy();
    expect(screen.queryByText(/Logged at/)).toBeNull();
  });
});

describe("Gate mode: leaving and the lock", () => {
  beforeEach(lock);

  it("needs the right PIN to leave", async () => {
    render(<GateScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Admin" }));
    await userEvent.type(screen.getByLabelText(/Enter the 4-digit PIN/), "9999");
    await userEvent.click(screen.getByRole("button", { name: "Leave gate mode" }));
    expect(await screen.findByText("That PIN is not right.")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText(/Enter the 4-digit PIN/), "1234");
    await userEvent.click(screen.getByRole("button", { name: "Leave gate mode" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/more"));
  });

  it("every other page bounces back to the gate, and the bottom menu is hidden", async () => {
    pathname = "/results";
    render(
      <>
        <GateLock />
        <BottomNav />
      </>,
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/gate"));
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
  });

  it("without the lock, nothing is redirected and the menu shows", () => {
    endGate();
    pathname = "/results";
    render(
      <>
        <GateLock />
        <BottomNav />
      </>,
    );
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
  });
});
