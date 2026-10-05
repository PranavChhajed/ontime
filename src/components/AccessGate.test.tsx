// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetState, state } from "@/test/queryMocks";

vi.mock("@/data/queries", async () => (await import("@/test/queryMocks")).queryMocks);
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { signOut: vi.fn(async () => ({})) } }) }));

import { AccessGate } from "./AccessGate";

beforeEach(() => resetState());

describe("AccessGate", () => {
  it("shows nothing for an approved Admin", () => {
    state.isAdmin = true;
    render(<AccessGate />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("shows nothing while the check is still running (no flash of a block screen)", () => {
    state.isAdmin = undefined;
    render(<AccessGate />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("blocks the app with a clear message when the email is no longer approved", () => {
    state.isAdmin = false;
    render(<AccessGate />);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText(/no longer approved/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
