// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth }) }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { LoginForm } from "./LoginForm";

async function fill(email: string, password?: string) {
  await userEvent.type(screen.getByLabelText("Email"), email);
  if (password !== undefined) await userEvent.type(screen.getByLabelText("Password"), password);
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.signInWithPassword.mockResolvedValue({ error: null });
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
});

describe("Sign in", () => {
  it("signs in with the email lower-cased and trimmed, then goes to the app", async () => {
    render(<LoginForm confirmFailed={false} />);
    await fill("  Admin@Example.COM ", "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "admin@example.com", password: "correct-horse" });
    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("will not send a short password", async () => {
    render(<LoginForm confirmFailed={false} />);
    await fill("a@b.co", "short");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("at least 8 characters");
  });

  it("explains a wrong password in plain words", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    render(<LoginForm confirmFailed={false} />);
    await fill("a@b.co", "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("alert").textContent).toBe("Wrong email or password.");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("tells you to confirm your email first", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Email not confirmed" } });
    render(<LoginForm confirmFailed={false} />);
    await fill("a@b.co", "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("alert").textContent).toContain("confirmation email");
  });

  it("says when there is no connection", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Failed to fetch" } });
    render(<LoginForm confirmFailed={false} />);
    await fill("a@b.co", "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("alert").textContent).toContain("No connection");
  });

  it("shows a message when a confirmation link failed", () => {
    render(<LoginForm confirmFailed />);
    expect(screen.getByRole("alert").textContent).toContain("didn’t work");
  });
});

describe("Create account", () => {
  it("explains that the email is not approved (what the database says is cryptic)", async () => {
    auth.signUp.mockResolvedValue({ data: {}, error: { message: "Database error saving new user" } });
    render(<LoginForm confirmFailed={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Create your account/ }));
    await fill("stranger@example.com", "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByRole("alert").textContent).toContain("hasn’t been given access");
  });

  it("asks you to check your email after a successful sign-up", async () => {
    render(<LoginForm confirmFailed={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Create your account/ }));
    await fill("new@example.com", "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("new@example.com")).toBeTruthy();
    expect(screen.getByText(/confirmation link/)).toBeTruthy();
  });

  it("goes straight in if the project does not need email confirmation", async () => {
    auth.signUp.mockResolvedValue({ data: { session: {} }, error: null });
    render(<LoginForm confirmFailed={false} />);
    await userEvent.click(screen.getByRole("button", { name: /Create your account/ }));
    await fill("new@example.com", "password123");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(router.replace).toHaveBeenCalledWith("/");
  });
});

describe("Forgot password", () => {
  it("sends a reset link that returns to the reset page, without asking for a password", async () => {
    render(<LoginForm confirmFailed={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.queryByLabelText("Password")).toBeNull();
    await userEvent.type(screen.getByLabelText("Email"), "Admin@Example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("admin@example.com", {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    expect(await screen.findByText(/choose a new password/)).toBeTruthy();
  });

  it("does not reveal whether the email has an account", async () => {
    render(<LoginForm confirmFailed={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    await userEvent.type(screen.getByLabelText("Email"), "nobody@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText(/If that email has an account/)).toBeTruthy();
  });

  it("can go back to sign in", async () => {
    render(<LoginForm confirmFailed={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    await userEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });
});
